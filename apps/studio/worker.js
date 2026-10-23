/**
 * Serves static assets and corrects Content-Type.
 * Direct API asset uploads omit part MIME types; without this,
 * HTML/CSS/JS are served as application/octet-stream and browsers download.
 *
 * Also hosts the community submission intake:
 *   POST /api/submit      {postUrl, handle, website?} -> {ok:true} | {ok:false, error}
 *   GET  /api/submissions (Bearer SUBMISSIONS_TOKEN) -> {ok:true, submissions:[...]}
 * Submissions land in the SUBMISSIONS KV namespace as sub:<iso-ts>:<rand>.
 */

const MIME_BY_EXT = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".map": "application/json",
};

function contentTypeForPathname(pathname) {
  if (pathname === "/" || pathname.endsWith("/")) {
    return "text/html; charset=utf-8";
  }
  const slash = pathname.lastIndexOf("/");
  const base = pathname.slice(slash + 1);
  const dot = base.lastIndexOf(".");
  if (dot === -1) {
    // No extension — keep the asset's own label.
    return null;
  }
  return MIME_BY_EXT[base.slice(dot).toLowerCase()] ?? null;
}

/* ------------------------------------------------------------------ */
/* Community submission intake                                          */
/* ------------------------------------------------------------------ */

const HANDLE_MAX = 60;
// A canonical x.com/<handle>/status/<id> link runs about 50 characters.
// 280 leaves room for share-sheet query strings while bounding what one
// submission can store in KV and echo back in the curator listing.
const POST_URL_MAX = 280;
const MAX_SUBMISSIONS_PER_IP_PER_DAY = 5;

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

// Mirrors the client-side validateSubmission in app.js. Same words, so the
// visitor never sees two different reasons for the same bad link.
function validPostUrl(raw) {
  const url = (raw || "").trim();
  if (!url) return "Add the link to your X post.";
  if (url.length > POST_URL_MAX) {
    return "That link is too long. Copy the link straight from your post and try again.";
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    parsed = null;
  }
  if (!parsed || (parsed.protocol !== "http:" && parsed.protocol !== "https:")) {
    return "That does not look like a link to an X post.";
  }
  const host = parsed.hostname.replace(/^www\./, "").replace(/^mobile\./, "");
  if (host !== "x.com" && host !== "twitter.com") {
    return "Only links to X posts can be featured.";
  }
  if (parsed.pathname.indexOf("/status/") === -1) {
    return "That link is not a single X post. Open your post and copy its link.";
  }
  return null;
}

function randomSuffix() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/* Per-IP daily submission cap on KV claim keys.
 *
 * The old design kept one counter key per IP and did get, check, put: N
 * concurrent requests all read the same pre-limit count, all passed, and
 * all wrote count + 1, so a burst admitted N submissions for one counted
 * slot.
 *
 * KV offers no atomic increment or compare-and-swap, so the counter is
 * replaced with per-request claim keys (the intake-rank pattern): every
 * request first writes its own unique claim key for this IP + day window,
 * then lists the window's claims in key order. The request's rank (its
 * position in that sorted list) is the verdict: admitted iff rank <=
 * MAX_SUBMISSIONS_PER_IP_PER_DAY. Concurrent claims all land before the
 * lists run, so a burst converges to exactly the cap instead of racing
 * past it, and a denied request deletes its own claim so it consumes no
 * budget.
 *
 * Claim keys sort by arrival: millisecond timestamp, then a per-isolate
 * monotonic sequence, then random bytes. The sequence is what makes the
 * rank meaningful; within one isolate arrival order is exact, and across
 * isolates sharing a millisecond the random tail breaks the tie.
 *
 * RESIDUAL (honest): Cloudflare KV is eventually consistent and list()
 * results are cached at the edge, so two bursts served by different
 * points of presence inside the propagation window can each rank against
 * a partial claim set and over-admit. The overshoot is bounded by the
 * claims not yet visible to the listing reader, and the window resets
 * daily. Sequential traffic and same-PoP bursts are exact. An exact
 * global limit needs an atomic store (D1 or a Durable Object); this app
 * has neither binding, and adding one is deliberately out of scope here.
 */
let claimSeq = 0;

async function claimSubmissionSlot(kv, ip) {
  const windowS = 86400;
  const window = Math.floor(Date.now() / (windowS * 1000));
  const prefix = `rl:${ip}:${window}:c:`;
  const stamp =
    `${String(Date.now()).padStart(13, "0")}:` +
    `${String(++claimSeq).padStart(12, "0")}:${randomSuffix()}`;
  const claim = prefix + stamp;
  await kv.put(claim, "1", { expirationTtl: windowS * 2 });

  // Rank of this claim in the window's sorted claim list. Pages arrive in
  // key order, so the rank is final the moment the claim itself appears.
  let rank = 0;
  let total = 0;
  let cursor;
  do {
    const page = await kv.list({ prefix, cursor, limit: 1000 });
    for (const k of page.keys) {
      total += 1;
      if (k.name === claim) {
        rank = total;
        break;
      }
    }
    if (rank > 0) break;
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  // rank 0 means our own put is not visible to list() yet (eventual
  // consistency); fall back to the visible count rather than failing open
  // or closed on a propagation artifact.
  const admitted =
    rank > 0
      ? rank <= MAX_SUBMISSIONS_PER_IP_PER_DAY
      : total < MAX_SUBMISSIONS_PER_IP_PER_DAY;
  if (!admitted) await kv.delete(claim);
  return admitted;
}

async function handleSubmit(request, env) {
  if (!env.SUBMISSIONS) {
    return jsonResponse(
      { ok: false, error: "Submissions are paused right now. Try the email link below." },
      503
    );
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      { ok: false, error: "Could not read that submission. Try again." },
      400
    );
  }
  // Honeypot: bots fill it, people never see it. Acknowledge without storing
  // so the bot cannot tell it was caught.
  if (body && typeof body.website === "string" && body.website.trim() !== "") {
    return jsonResponse({ ok: true });
  }
  const urlErr = validPostUrl(body && body.postUrl);
  if (urlErr) return jsonResponse({ ok: false, error: urlErr }, 400);
  const handle = ((body && body.handle) || "").trim();
  if (!handle) {
    return jsonResponse(
      { ok: false, error: "Tell us your name or handle so we can credit you." },
      400
    );
  }
  if (handle.length > HANDLE_MAX) {
    return jsonResponse(
      { ok: false, error: "Keep your name or handle under 60 characters." },
      400
    );
  }
  const ip = request.headers.get("cf-connecting-ip") || "";
  if (ip) {
    const admitted = await claimSubmissionSlot(env.SUBMISSIONS, ip);
    if (!admitted) {
      return jsonResponse(
        { ok: false, error: "That is enough for today. Come back tomorrow." },
        429
      );
    }
  }
  const now = new Date().toISOString();
  const key = "sub:" + now + ":" + randomSuffix();
  await env.SUBMISSIONS.put(
    key,
    JSON.stringify({
      postUrl: body.postUrl.trim(),
      handle,
      createdAt: now,
      status: "pending",
      ip: ip || null,
      ua: (request.headers.get("user-agent") || "").slice(0, 200),
    })
  );
  return jsonResponse({ ok: true });
}

// Curator view for the daily crew check. Bearer token only, never linked
// from the site.
async function handleList(request, env) {
  const token = env.SUBMISSIONS_TOKEN || "";
  const auth = request.headers.get("authorization") || "";
  if (!token || auth !== "Bearer " + token) {
    return jsonResponse({ ok: false, error: "Not authorized." }, 401);
  }
  if (!env.SUBMISSIONS) return jsonResponse({ ok: true, submissions: [] });
  const listed = await env.SUBMISSIONS.list({ prefix: "sub:", limit: 100 });
  const items = [];
  for (const k of listed.keys) {
    const raw = await env.SUBMISSIONS.get(k.name);
    if (!raw) continue;
    try {
      items.push({ id: k.name, ...JSON.parse(raw) });
    } catch {
      // Skip corrupt values rather than failing the whole listing.
    }
  }
  items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return jsonResponse({ ok: true, submissions: items });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/submit") {
      if (request.method !== "POST") {
        return jsonResponse({ ok: false, error: "Use POST." }, 405);
      }
      return handleSubmit(request, env);
    }
    if (url.pathname === "/api/submissions") {
      if (request.method !== "GET") {
        return jsonResponse({ ok: false, error: "Use GET." }, 405);
      }
      return handleList(request, env);
    }
    if (url.pathname.startsWith("/api/")) {
      return jsonResponse({ ok: false, error: "Not found." }, 404);
    }
    const response = await env.ASSETS.fetch(request);
    // Only a real 200 body gets the extension-derived label. Error pages
    // (the HTML 404 served for any missing path) keep the platform
    // Content-Type, so the request extension cannot relabel them.
    const type = response.ok
      ? contentTypeForPathname(new URL(request.url).pathname)
      : null;
    const headers = new Headers(response.headers);
    headers.set("X-Content-Type-Options", "nosniff");
    if (type) headers.set("Content-Type", type);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
