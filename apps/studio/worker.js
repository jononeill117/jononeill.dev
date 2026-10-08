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
    const rlKey = "rl:" + ip;
    const seen = parseInt((await env.SUBMISSIONS.get(rlKey)) || "0", 10) || 0;
    if (seen >= MAX_SUBMISSIONS_PER_IP_PER_DAY) {
      return jsonResponse(
        { ok: false, error: "That is enough for today. Come back tomorrow." },
        429
      );
    }
    await env.SUBMISSIONS.put(rlKey, String(seen + 1), { expirationTtl: 86400 });
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
