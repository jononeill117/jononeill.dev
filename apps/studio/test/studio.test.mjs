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
function runStudio({ clipboard = "ok", execCommandResult = true, version = null } = {}) {
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
    window: { setTimeout, clearTimeout },
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
    get copiedText() { return copiedText; },
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
