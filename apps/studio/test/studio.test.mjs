// Muse Icon Studio: failure-mode-first tests for a zero-test static site.
//
// FAILURE MODES (written before any test, per AGENTS.md test-quality rules):
//  1. Gallery drift: a manifest entry whose image file is missing -> broken
//     featured image on the live site.
//  2. Orphan/duplicate manifest entries: duplicate ids or gallery files with
//     no manifest entry -> thumbs and featured viewer disagree.
//  3. Version skew: VERSION file vs version.json vs footer SemVer disagree ->
//     the footer lies about what is deployed.
//  4. Banned dashes: em/en dashes slip into user-facing copy (Jon's rule).
//  5. Private-file leak: a proposal/draft/internal file lands in the deploy
//     source and ships publicly.
//  6. Copy button copies the raw placeholder: the per-character prompt keeps
//     "[THEME]" instead of the character name -> visitors paste a broken prompt.
//  7. Silent copy failure: clipboard denied and no fallback message -> the
//     visitor clicks "Copy" and nothing happens with no guidance.
//  8. Wrong MIME type: the asset worker serves app.js as
//     application/octet-stream -> browsers download it instead of running it
//     (the exact bug worker.js was written to fix).
//  9. Deep-link drift: a #/muse/<id> hash for an id not in the manifest
//     selects nothing -> the visitor lands on a broken viewer.
// 10. Submission intake accepts a non-X URL or an empty handle ->
//     phishing links or uncredited entries reach the curation inbox.
// 11. mailto built without encoding: a handle like "A & Co" breaks the
//     subject/body query string -> the draft arrives mangled.
// 12. Server stores a honeypot submission -> bot traffic pollutes the queue.
// 13. No per-IP rate limit -> one IP floods the queue.
// 14. Curator listing reachable without the token -> the queue is public.
// 15. Client and server validation words drift -> the visitor sees two
//     different reasons for the same bad link.
// 16. KV binding missing on the worker -> submissions fail with a raw 500
//     instead of an honest "paused" message.
//
// Strategy: static contract tests read the REAL files (app.js, index.html,
// version.json, gallery/), and behavioral tests drive the REAL app.js IIFE
// through a minimal DOM stub (platform seam, not our code). Nothing is
// retyped from the implementation.

import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const HERE = dirname(fileURLToPath(import.meta.url));
const STUDIO = join(HERE, "..");
const APP_JS = readFileSync(join(STUDIO, "app.js"), "utf8");
const INDEX_HTML = readFileSync(join(STUDIO, "index.html"), "utf8");

/** Evaluate a `var NAME = <expression>;` statement from the real app.js. */
function evalVar(source, name) {
  const marker = `var ${name} =`;
  const start = source.indexOf(marker);
  assert.ok(start !== -1, `${name} not found in app.js`);
  const after = source.slice(start + marker.length);
  // Expression ends at the first `";` or `];` followed by a blank line.
  const m = after.match(/("|\])\s*;\s*\n\s*\n/);
  assert.ok(m, `end of ${name} not found`);
  const expr = after.slice(0, m.index + 1);
  return vm.runInNewContext(`(${expr})`, {});
}

const CHARACTERS = evalVar(APP_JS, "CHARACTERS");
const SHORT_PROMPT = evalVar(APP_JS, "SHORT_PROMPT");
const FULL_PROMPT = evalVar(APP_JS, "FULL_PROMPT");

/** Evaluate a top-level `var NAME = "...";` one-liner from the real app.js. */
function evalConst(source, name) {
  const m = source.match(
    new RegExp(`var ${name} = ("(?:[^"\\\\]|\\\\.)*"|'[^']*');`)
  );
  assert.ok(m, `${name} not found in app.js`);
  return vm.runInNewContext(`(${m[1]})`, {});
}

/** Evaluate a top-level `function NAME(...) { ... }` from the real app.js. */
function evalFn(source, name, sandboxVars = {}) {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  assert.ok(start !== -1, `${name} not found in app.js`);
  const open = source.indexOf("{", start);
  assert.ok(open !== -1, `body of ${name} not found`);
  let depth = 0;
  for (let j = open; j < source.length; j++) {
    const ch = source[j];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return vm.runInNewContext(`(${source.slice(start, j + 1)})`, {
          ...sandboxVars,
        });
      }
    }
  }
  assert.fail(`end of ${name} not found`);
}

const communityShareUrl = evalFn(APP_JS, "communityShareUrl", {
  HASHTAG: evalConst(APP_JS, "HASHTAG"),
  PAGE_URL: evalConst(APP_JS, "PAGE_URL"),
});
const characterFromHash = evalFn(APP_JS, "characterFromHash", { CHARACTERS });
const validateSubmission = evalFn(APP_JS, "validateSubmission", { URL });
const submissionMailto = evalFn(APP_JS, "submissionMailto", {
  SUBMISSIONS_INBOX: evalConst(APP_JS, "SUBMISSIONS_INBOX"),
});

// --- 1+2. Gallery manifest consistency -----------------------------------------

test("every gallery manifest entry has its image file on disk", () => {
  const missing = CHARACTERS.filter((c) => !existsSync(join(STUDIO, c.file)));
  assert.deepEqual(Array.from(missing, (c) => String(c.id)), []);
});

test("no duplicate character ids and no orphan gallery files", () => {
  const ids = CHARACTERS.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate character ids");
  const onDisk = new Set(
    readdirSync(join(STUDIO, "gallery")).filter((f) => f.endsWith(".webp")),
  );
  const inManifest = new Set(CHARACTERS.map((c) => c.file.split("/").pop()));
  const orphans = [...onDisk].filter((f) => !inManifest.has(f));
  assert.deepEqual(orphans, [], "gallery files with no manifest entry");
});

// --- 3. Version agreement --------------------------------------------------------

test("VERSION file and version.json agree", () => {
  const fileVersion = readFileSync(join(STUDIO, "VERSION"), "utf8").trim();
  const json = JSON.parse(readFileSync(join(STUDIO, "version.json"), "utf8"));
  assert.equal(json.version, fileVersion);
  assert.match(json.version, /^\d+\.\d+\.\d+$/);
});

// --- 4. Banned dashes in user-facing copy ------------------------------------------

test("no em dashes or en dashes in user-facing copy", () => {
  for (const [label, text] of [["index.html", INDEX_HTML], ["SHORT_PROMPT", SHORT_PROMPT], ["FULL_PROMPT", FULL_PROMPT]]) {
    assert.equal(text.includes("—"), false, `em dash in ${label}`);
    assert.equal(text.includes("–"), false, `en dash in ${label}`);
  }
});

// --- 5. Deploy guard: private files never ship --------------------------------------

test("no private filenames in the studio deploy source", () => {
  const banned = ["proposal", "draft", "internal", "contract", "nda", "quote", "-plan", "client_"];
  const offenders = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "test" || entry.name.startsWith(".")) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (banned.some((b) => entry.name.toLowerCase().includes(b))) offenders.push(full);
    }
  };
  walk(STUDIO);
  assert.deepEqual(offenders, []);
});

// --- Behavioral harness: drive the real app.js -------------------------------------

function makeElement(tag) {
  const el = {
    tag,
    children: [],
    attributes: {},
    listeners: {},
    textContent: "",
    innerHTML: "",
    hidden: false,
    style: {},
    value: "",
    src: "",
    alt: "",
    href: "",
    title: "",
    disabled: false,
    className: "",
    type: "",
    loading: "",
    width: 0,
    height: 0,
    focused: false,
    setAttribute(k, v) { this.attributes[k] = v; },
    getAttribute(k) { return this.attributes[k] ?? null; },
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); },
    appendChild(child) { this.children.push(child); return child; },
    removeChild(child) { this.children = this.children.filter((c) => c !== child); },
    focus() { this.focused = true; },
    select() {},
    click() { (this.listeners.click || []).forEach((fn) => fn.call(this)); },
    keydown(key) {
      const e = { key, preventDefault() {} };
      (this.listeners.keydown || []).forEach((fn) => fn.call(this, e));
    },
  };
  return el;
}

/**
 * Minimal DOM stub: a platform seam so the REAL app.js IIFE runs end to end.
 * Returns the sandbox globals plus handles to inspect and drive the page.
 */
function runStudio({ clipboard = "ok", execCommandResult = true, version = null, hash = "", captureNav = false } = {}) {
  const byId = new Map();
  const thumbs = [];
  const copyButtons = [];
  let copiedText = null;
  let fetchHandler = async () =>
    version
      ? { ok: true, json: async () => version }
      : { ok: false, json: async () => null };

  const doc = {
    readyState: "complete",
    _domContentLoaded: [],
    getElementById(id) {
      if (!byId.has(id)) byId.set(id, makeElement("div"));
      return byId.get(id);
    },
    querySelectorAll(sel) {
      if (sel === ".thumb") return thumbs;
      if (sel === "[data-copy]") return copyButtons;
      return [];
    },
    querySelector(sel) {
      const m = sel.match(/\[data-note="([^"]+)"\]/);
      if (m) return this.getElementById(`note-${m[1]}`);
      return null;
    },
    createElement(tag) {
      const el = makeElement(tag);
      return el;
    },
    addEventListener(type, fn) {
      if (type === "DOMContentLoaded") this._domContentLoaded.push(fn);
    },
    execCommand() { return execCommandResult; },
    body: makeElement("body"),
  };

  for (const which of ["short", "full"]) {
    const btn = makeElement("button");
    btn.setAttribute("data-copy", which);
    copyButtons.push(btn);
  }

  const nav = {
    clipboard: {
      writeText(text) {
        copiedText = text;
        return clipboard === "ok"
          ? Promise.resolve()
          : Promise.reject(new Error("denied"));
      },
    },
  };

  const sandbox = {
    document: doc,
    URL,
    window: captureNav
      ? {
          setTimeout,
          clearTimeout,
          location: { href: "", hash },
          history: {
            replaceState(s, t, u) { sandbox.window._replaced = u; },
            _replaced: null,
          },
        }
      : { setTimeout, clearTimeout },
    navigator: nav,
    fetch: (...args) => fetchHandler(...args),
    console,
    setTimeout,
    clearTimeout,
  };
  vm.createContext(sandbox);
  vm.runInContext(APP_JS, sandbox, { filename: "app.js" });
  // Collect thumbs: buttons appended to #thumbs with className "thumb".
  const wrap = doc.getElementById("thumbs");
  for (const child of wrap.children) {
    if (child.className === "thumb") thumbs.push(child);
  }

  return {
    doc,
    window: sandbox.window,
    get copiedText() { return copiedText; },
    get replacedUrl() { return sandbox.window._replaced ?? null; },
    setFetchHandler(fn) { fetchHandler = fn; },
    tick: (ms = 30) => new Promise((r) => setTimeout(r, ms)),
  };
}

// --- 6. Featured viewer follows thumbnail clicks -------------------------------------

test("clicking a thumbnail updates the featured viewer", () => {
  const { doc } = runStudio();
  const goku = doc.querySelectorAll(".thumb").find((t) => t.getAttribute("data-id") === "goku");
  assert.ok(goku, "goku thumb exists");
  goku.click();
  assert.equal(doc.getElementById("featured-name").textContent, "Goku");
  assert.equal(doc.getElementById("featured-theme").textContent, "Dragon Ball");
  assert.match(doc.getElementById("featured-img").src, /gallery\/goku\.webp$/);
});

// --- 7. Copy button copies the theme-personalized prompt ------------------------------

test("featured copy button copies the personalized prompt, not the placeholder", async () => {
  const studio = runStudio();
  const { doc } = studio;
  const goku = doc.querySelectorAll(".thumb").find((t) => t.getAttribute("data-id") === "goku");
  goku.click();
  doc.getElementById("featured-copy").click();
  await studio.tick();
  const text = studio.copiedText;
  assert.ok(text, "clipboard received text");
  assert.equal(text.includes("[THEME]"), false, "placeholder must be replaced");
  assert.match(text, /Goku/);
  assert.match(text, /Dragon Ball/);
  assert.match(text, /FULL BODY/);
});

// --- 8. Copy failure guidance ------------------------------------------------------------

test("copy failure tells the visitor to copy by hand", async () => {
  const studio = runStudio({ clipboard: "denied", execCommandResult: false });
  const { doc } = studio;
  doc.getElementById("featured-copy").click();
  await studio.tick();
  const note = doc.getElementById("featured-copy-note").textContent;
  assert.match(note, /copy it by hand/);
});

// --- 9. Keyboard navigation ------------------------------------------------------------------

test("arrow keys move through the gallery", () => {
  const { doc } = runStudio();
  assert.equal(doc.getElementById("featured-name").textContent, "Master Chief");
  doc.getElementById("thumbs").keydown("ArrowRight");
  assert.equal(doc.getElementById("featured-name").textContent, "Iron Man");
  doc.getElementById("thumbs").keydown("ArrowLeft");
  assert.equal(doc.getElementById("featured-name").textContent, "Master Chief");
});

// --- Version footer wiring --------------------------------------------------------------------

test("footer version renders from version.json", async () => {
  const studio = runStudio({ version: { version: "9.9.9", commit: "abc123", builtAt: "now" } });
  await studio.tick();
  assert.equal(studio.doc.getElementById("app-version").textContent, "v9.9.9");
});

// --- 8 (worker). MIME-type regression ------------------------------------------------------------

test("worker serves JS with the correct content type even when the asset API omits it", async () => {
  const worker = (await import("../worker.js")).default;
  const env = {
    ASSETS: {
      fetch: async (req) =>
        new Response("console.log(1)", {
          status: 200,
          headers: { "content-type": "application/octet-stream" },
        }),
    },
  };
  const res = await worker.fetch(new Request("https://musecharacters.jononeill.dev/app.js"), env);
  assert.equal(res.headers.get("content-type"), "text/javascript; charset=utf-8");
  assert.equal(await res.text(), "console.log(1)");
});

test("worker passes 404s and redirects through untouched", async () => {
  const worker = (await import("../worker.js")).default;
  const notFound = await worker.fetch(new Request("https://musecharacters.jononeill.dev/nope.png"), {
    ASSETS: { fetch: async () => new Response("missing", { status: 404 }) },
  });
  assert.equal(notFound.status, 404);
  assert.equal(await notFound.text(), "missing");

  const redirect = await worker.fetch(new Request("https://musecharacters.jononeill.dev/old"), {
    ASSETS: { fetch: async () => new Response(null, { status: 301, headers: { location: "/new" } }) },
  });
  assert.equal(redirect.status, 301);
  assert.equal(redirect.headers.get("location"), "/new");
});

// --- 10. Community share URL -----------------------------------------------------------

test("community share URL carries the hashtag and page URL", () => {
  const url = communityShareUrl();
  assert.ok(url.startsWith("https://x.com/intent/post?"), "x intent endpoint");
  assert.ok(url.includes("hashtags=MuseCharacterStudio"), "hashtag param");
  assert.ok(
    url.includes(encodeURIComponent("https://musecharacters.jononeill.dev")),
    "page url"
  );
});

// --- 11. Deep links ----------------------------------------------------------------------

test("characterFromHash resolves deep links and rejects everything else", () => {
  assert.equal(characterFromHash("#/muse/goku").id, "goku");
  assert.equal(characterFromHash("#/muse/master-chief").id, "master-chief");
  assert.equal(characterFromHash("#gallery"), null, "nav anchor falls back");
  assert.equal(characterFromHash("#/muse/nope"), null, "unknown id falls back");
  assert.equal(characterFromHash(""), null, "empty hash falls back");
});

// --- 12. Submission validation -------------------------------------------------------------

test("validateSubmission rejects bad links and missing credit", () => {
  assert.match(validateSubmission("", "@a"), /Add the link/, "empty url");
  assert.match(validateSubmission("not a url", "@a"), /does not look like/, "garbage url");
  assert.match(
    validateSubmission("https://phish.example/x/status/1", "@a"),
    /Only links to X/,
    "non-X domain"
  );
  assert.match(
    validateSubmission("https://x.com/someone", "@a"),
    /not a single X post/,
    "profile page is not a post"
  );
  assert.match(validateSubmission("https://x.com/a/status/1", "  "), /name or handle/, "blank handle");
  assert.equal(validateSubmission("https://x.com/a/status/123", "@maker"), null, "x.com ok");
  assert.equal(
    validateSubmission("https://twitter.com/a/status/123", "A Maker"),
    null,
    "twitter.com ok"
  );
});

// --- 13. mailto construction ----------------------------------------------------------------

test("submissionMailto builds an encoded mailto to the studio inbox", () => {
  const href = submissionMailto("https://x.com/a/status/123", "A Maker & Co");
  assert.ok(href.startsWith("mailto:meetnightshiftai@agentmail.to?"), "studio inbox");
  assert.ok(
    href.includes("subject=" + encodeURIComponent("Community submission: A Maker & Co")),
    "encoded subject survives &"
  );
  assert.ok(
    href.includes("body=" + encodeURIComponent("X post: https://x.com/a/status/123")),
    "encoded body carries the post link"
  );
});

// --- 14. Deep links in the live app ------------------------------------------------------------

test("deep link #/muse/goku selects goku on load", () => {
  const { doc } = runStudio({ captureNav: true, hash: "#/muse/goku" });
  assert.equal(doc.getElementById("featured-name").textContent, "Goku");
});

test("selecting a character writes the deep link via replaceState", () => {
  const studio = runStudio({ captureNav: true });
  const { doc } = studio;
  const goku = doc.querySelectorAll(".thumb").find((t) => t.getAttribute("data-id") === "goku");
  goku.click();
  assert.equal(studio.replacedUrl, "#/muse/goku");
});

test("featured share link points at the deep link", () => {
  const studio = runStudio({ captureNav: true });
  const { doc } = studio;
  const goku = doc.querySelectorAll(".thumb").find((t) => t.getAttribute("data-id") === "goku");
  goku.click();
  const href = doc.getElementById("featured-share").href;
  assert.ok(href.startsWith("https://x.com/intent/post?"), "intent endpoint");
  assert.ok(href.includes(encodeURIComponent("#/muse/goku")), "deep link in shared url");
});

// --- 15. Submission form -------------------------------------------------------------------------

function submitForm(doc, postUrl, handle) {
  doc.getElementById("submit-post-url").value = postUrl;
  doc.getElementById("submit-handle").value = handle;
  const form = doc.getElementById("submit-form");
  const e = { prevented: false, preventDefault() { this.prevented = true; } };
  (form.listeners.submit || []).forEach((fn) => fn.call(form, e));
  return e;
}

test("valid submission POSTs to /api/submit and confirms", async () => {
  const studio = runStudio();
  const { doc } = studio;
  let seen = null;
  studio.setFetchHandler(async (url, opts) => {
    seen = { url, opts, body: JSON.parse(opts.body) };
    return { ok: true, json: async () => ({ ok: true }) };
  });
  const e = submitForm(doc, "https://x.com/maker/status/123", "@maker");
  assert.ok(e.prevented, "default form navigation prevented");
  await studio.tick();
  assert.ok(seen, "fetch called");
  assert.equal(seen.url, "/api/submit");
  assert.equal(seen.opts.method, "POST");
  assert.equal(seen.body.postUrl, "https://x.com/maker/status/123");
  assert.equal(seen.body.handle, "@maker");
  assert.equal(seen.body.website, "", "honeypot sent empty");
  assert.match(doc.getElementById("submit-note").textContent, /review queue/);
  assert.equal(doc.getElementById("submit-post-url").value, "", "form cleared");
  assert.equal(doc.getElementById("submit-btn").disabled, false, "button re-enabled");
});

test("bad submission shows the error and sends nothing", async () => {
  const studio = runStudio();
  const { doc } = studio;
  let called = false;
  studio.setFetchHandler(async () => {
    called = true;
    return { ok: true, json: async () => ({ ok: true }) };
  });
  submitForm(doc, "https://phish.example/x", "@maker");
  await studio.tick();
  assert.equal(called, false, "no fetch on client validation error");
  assert.match(doc.getElementById("submit-note").textContent, /Only links to X/);
});

test("empty handle shows the credit error and sends nothing", async () => {
  const studio = runStudio();
  const { doc } = studio;
  let called = false;
  studio.setFetchHandler(async () => {
    called = true;
    return { ok: true, json: async () => ({ ok: true }) };
  });
  submitForm(doc, "https://x.com/maker/status/123", "");
  await studio.tick();
  assert.equal(called, false, "no fetch on client validation error");
  assert.match(doc.getElementById("submit-note").textContent, /name or handle/);
});

test("network failure shows the error and the email fallback", async () => {
  const studio = runStudio();
  const { doc } = studio;
  studio.setFetchHandler(async () => { throw new Error("offline"); });
  submitForm(doc, "https://x.com/maker/status/123", "@maker");
  await studio.tick();
  assert.match(doc.getElementById("submit-note").textContent, /Could not reach/);
  assert.equal(doc.getElementById("submit-fallback").hidden, false, "fallback shown");
  const href = doc.getElementById("submit-fallback-link").href;
  assert.ok(
    href.startsWith("mailto:meetnightshiftai@agentmail.to?"),
    "mailto fallback"
  );
  assert.ok(
    href.includes(encodeURIComponent("https://x.com/maker/status/123")),
    "post url in mailto"
  );
  assert.equal(doc.getElementById("submit-btn").disabled, false, "button re-enabled");
});

test("server rejection shows the server message and the email fallback", async () => {
  const studio = runStudio();
  const { doc } = studio;
  studio.setFetchHandler(async () => ({
    ok: false,
    json: async () => ({ ok: false, error: "Only links to X posts can be featured." }),
  }));
  submitForm(doc, "https://x.com/maker/status/123", "@maker");
  await studio.tick();
  assert.match(doc.getElementById("submit-note").textContent, /Only links to X posts/);
  assert.equal(doc.getElementById("submit-fallback").hidden, false, "fallback shown");
});

// --- 16. Community markup --------------------------------------------------------------------------

test("index.html carries the community form and post-on-x link", () => {
  for (const id of ["submit-form", "submit-post-url", "submit-handle", "submit-website", "submit-btn", "submit-note", "submit-fallback", "submit-fallback-link", "hashtag-post"]) {
    assert.ok(INDEX_HTML.includes(`id="${id}"`), `missing #${id}`);
  }
});

// --- 17. Submission intake API (worker.js) -----------------------------------------------
// Drives the REAL worker fetch handler with a stubbed KV namespace.

const WORKER = (await import("../worker.js")).default;

function makeKV() {
  const store = new Map();
  return {
    async get(k) { return store.has(k) ? store.get(k) : null; },
    async put(k, v) { store.set(k, v); },
    async list({ prefix, limit }) {
      const keys = [...store.keys()]
        .filter((k) => k.startsWith(prefix))
        .map((name) => ({ name }));
      return { keys: keys.slice(0, limit ?? 100), list_complete: true };
    },
    _keys: () => [...store.keys()],
    _get: (k) => store.get(k),
  };
}

function apiRequest(path, { method = "GET", body = null, ip = "1.2.3.4", token = null } = {}) {
  const headers = {};
  if (ip) headers["cf-connecting-ip"] = ip;
  if (token) headers["authorization"] = "Bearer " + token;
  const init = { method, headers };
  if (body !== null) {
    headers["content-type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  return new Request("https://studio.test" + path, init);
}

async function postSubmit(env, body, opts = {}) {
  const res = await WORKER.fetch(
    apiRequest("/api/submit", { method: "POST", body, ...opts }),
    env
  );
  return { status: res.status, json: await res.json() };
}

const GOOD_SUBMISSION = {
  postUrl: "https://x.com/maker/status/123456789",
  handle: "@maker",
  website: "",
};

const subKeys = (kv) => kv._keys().filter((k) => k.startsWith("sub:"));

test("API stores a valid submission and returns ok", async () => {
  const kv = makeKV();
  const { status, json } = await postSubmit({ SUBMISSIONS: kv }, GOOD_SUBMISSION);
  assert.equal(status, 200);
  assert.equal(json.ok, true);
  const keys = subKeys(kv);
  assert.equal(keys.length, 1);
  const rec = JSON.parse(kv._get(keys[0]));
  assert.equal(rec.postUrl, GOOD_SUBMISSION.postUrl);
  assert.equal(rec.handle, GOOD_SUBMISSION.handle);
  assert.equal(rec.status, "pending");
  assert.ok(rec.createdAt, "timestamp recorded");
});

test("API rejects a non-X URL with 400 and stores nothing", async () => {
  const kv = makeKV();
  const { status, json } = await postSubmit(
    { SUBMISSIONS: kv },
    { ...GOOD_SUBMISSION, postUrl: "https://phish.example/x" }
  );
  assert.equal(status, 400);
  assert.equal(json.ok, false);
  assert.match(json.error, /Only links to X/);
  assert.equal(subKeys(kv).length, 0);
});

test("API rejects a non-status X link, an empty handle, and an oversize handle", async () => {
  const kv = makeKV();
  const env = { SUBMISSIONS: kv };
  const r1 = await postSubmit(env, { ...GOOD_SUBMISSION, postUrl: "https://x.com/maker" });
  assert.equal(r1.status, 400);
  assert.match(r1.json.error, /single X post/);
  const r2 = await postSubmit(env, { ...GOOD_SUBMISSION, handle: "   " });
  assert.equal(r2.status, 400);
  assert.match(r2.json.error, /name or handle/);
  const r3 = await postSubmit(env, { ...GOOD_SUBMISSION, handle: "x".repeat(61) });
  assert.equal(r3.status, 400);
  assert.match(r3.json.error, /60 characters/);
  assert.equal(subKeys(kv).length, 0);
});

test("API rejects a malformed JSON body with 400", async () => {
  const kv = makeKV();
  const req = new Request("https://studio.test/api/submit", {
    method: "POST",
    headers: { "cf-connecting-ip": "9.9.9.9", "content-type": "application/json" },
    body: "{nope",
  });
  const res = await WORKER.fetch(req, { SUBMISSIONS: kv });
  assert.equal(res.status, 400);
  assert.equal((await res.json()).ok, false);
});

test("API acknowledges honeypot submissions without storing them", async () => {
  const kv = makeKV();
  const { status, json } = await postSubmit(
    { SUBMISSIONS: kv },
    { ...GOOD_SUBMISSION, website: "http://spam.example" }
  );
  assert.equal(status, 200);
  assert.equal(json.ok, true);
  assert.equal(subKeys(kv).length, 0);
});

test("API rate-limits an IP to five submissions a day", async () => {
  const kv = makeKV();
  const env = { SUBMISSIONS: kv };
  for (let i = 0; i < 5; i++) {
    const r = await postSubmit(env, {
      ...GOOD_SUBMISSION,
      postUrl: `https://x.com/maker/status/${1000 + i}`,
    });
    assert.equal(r.status, 200, `submission ${i + 1} accepted`);
  }
  const r6 = await postSubmit(env, {
    ...GOOD_SUBMISSION,
    postUrl: "https://x.com/maker/status/1005",
  });
  assert.equal(r6.status, 429);
  assert.equal(r6.json.ok, false);
  assert.equal(subKeys(kv).length, 5);
});

test("API answers GET /api/submit with 405, not the asset fallback", async () => {
  const res = await WORKER.fetch(
    apiRequest("/api/submit"),
    { SUBMISSIONS: makeKV(), ASSETS: { fetch: () => { throw new Error("must not reach assets"); } } }
  );
  assert.equal(res.status, 405);
});

test("curator listing requires the bearer token", async () => {
  const kv = makeKV();
  await postSubmit({ SUBMISSIONS: kv }, GOOD_SUBMISSION);
  const env = { SUBMISSIONS: kv, SUBMISSIONS_TOKEN: "tok123" };
  const anon = await WORKER.fetch(apiRequest("/api/submissions"), env);
  assert.equal(anon.status, 401);
  const wrong = await WORKER.fetch(apiRequest("/api/submissions", { token: "nope" }), env);
  assert.equal(wrong.status, 401);
  const good = await WORKER.fetch(apiRequest("/api/submissions", { token: "tok123" }), env);
  assert.equal(good.status, 200);
  const body = await good.json();
  assert.equal(body.ok, true);
  assert.equal(body.submissions.length, 1);
  assert.equal(body.submissions[0].handle, "@maker");
  assert.ok(
    body.submissions.every((s) => s.id.startsWith("sub:")),
    "rate-limit keys are not listed as submissions"
  );
});

test("curator listing returns newest first", async () => {
  const kv = makeKV();
  const env = { SUBMISSIONS: kv, SUBMISSIONS_TOKEN: "tok" };
  await postSubmit(env, { ...GOOD_SUBMISSION, handle: "@first" }, { ip: "1.1.1.1" });
  await new Promise((r) => setTimeout(r, 5));
  await postSubmit(env, { ...GOOD_SUBMISSION, handle: "@second" }, { ip: "2.2.2.2" });
  const res = await WORKER.fetch(apiRequest("/api/submissions", { token: "tok" }), env);
  const body = await res.json();
  assert.equal(body.submissions.length, 2);
  assert.equal(body.submissions[0].handle, "@second");
  assert.equal(body.submissions[1].handle, "@first");
});

test("intake is honest when the KV binding is missing", async () => {
  const { status, json } = await postSubmit({}, GOOD_SUBMISSION);
  assert.equal(status, 503);
  assert.equal(json.ok, false);
  assert.match(json.error, /paused/);
});

test("client and server validation reject the same bad links with the same words", async () => {
  const kv = makeKV();
  const bad = [
    "",
    "not-a-url",
    "https://phish.example/x",
    "https://x.com/maker",
    "ftp://x.com/maker/status/1",
  ];
  for (const url of bad) {
    const clientErr = validateSubmission(url, "@maker");
    assert.ok(clientErr, `client rejects ${url || "(empty)"}`);
    const { status, json } = await postSubmit(
      { SUBMISSIONS: kv },
      { postUrl: url, handle: "@maker", website: "" },
      { ip: null }
    );
    assert.equal(status, 400, `server rejects ${url || "(empty)"}`);
    assert.equal(json.error, clientErr, `same words for ${url || "(empty)"}`);
  }
  assert.equal(subKeys(kv).length, 0);
});
