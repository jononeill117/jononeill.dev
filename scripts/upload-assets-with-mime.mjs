#!/usr/bin/env node
/**
 * Upload apps/site/dist to Workers Assets with correct Content-Type on each part.
 *
 * Usage (after assets-upload-session returns jwt + buckets):
 *   CF_ASSETS_UPLOAD_JWT=<uploadJwt> node scripts/upload-assets-with-mime.mjs '<buckets-json>'
 *   echo '<uploadJwt>' | node scripts/upload-assets-with-mime.mjs '<buckets-json>'
 *
 * The upload JWT is read from the CF_ASSETS_UPLOAD_JWT environment variable or
 * from stdin — never from argv, which is world-readable via /proc/<pid>/cmdline
 * and persists in shell history. Rotate the credential and clear shell history
 * if it was previously passed on the command line.
 *
 * On success the completion JWT is written to a file inside a private
 * mkdtemp directory (mode 0700) under the OS temp root; the file itself is
 * mode 0600 and created with O_EXCL so it cannot be pre-planted. The path is
 * printed to stdout for the deploy step that consumes it — delete it when done.
 *
 * Requires: Node 18+, account id via CLOUDFLARE_ACCOUNT_ID or wrangler.jsonc default.
 */
import { createHash } from "node:crypto";
import {
  lstatSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { join, relative, extname, sep } from "node:path";
import { tmpdir } from "node:os";

const MIME = {
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

const accountId =
  process.env.CLOUDFLARE_ACCOUNT_ID || "0504b58e93fd6ed01430450afe1b9984";

function underRoot(resolved, base) {
  return resolved === base || resolved.startsWith(base + sep);
}

// Every entry must lstat as a plain single-link regular file or a real
// directory that stays inside the dist root. A planted symlink would
// otherwise smuggle arbitrary operator-readable bytes into the account's
// asset store.
function walk(dir, base, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const lst = lstatSync(p);
    if (lst.isSymbolicLink()) {
      throw new Error(`assets: refusing symlink ${p}`);
    }
    if (lst.isDirectory()) {
      const resolved = realpathSync(p);
      if (!underRoot(resolved, base)) {
        throw new Error(`assets: ${p} resolves outside ${base}`);
      }
      walk(resolved, base, files);
    } else if (lst.isFile() && lst.nlink === 1) {
      const resolved = realpathSync(p);
      if (!underRoot(resolved, base)) {
        throw new Error(`assets: ${p} resolves outside ${base}`);
      }
      files.push(resolved);
    } else {
      throw new Error(
        `assets: refusing non-regular file ${p} (hard link, fifo, or device)`,
      );
    }
  }
  return files;
}

function buildIndex() {
  const cwd = realpathSync(process.cwd());
  const dist = realpathSync(join(cwd, "apps/site/dist"));
  if (!underRoot(dist, cwd)) {
    throw new Error(`assets: dist resolves outside ${cwd}`);
  }
  const byHash = new Map();
  for (const file of walk(dist, dist)) {
    const buf = readFileSync(file);
    const hash = createHash("sha256").update(buf).digest("hex").slice(0, 32);
    const rel = "/" + relative(dist, file).split(sep).join("/");
    const ct = MIME[extname(file).toLowerCase()] || "application/octet-stream";
    byHash.set(hash, { path: rel, contentType: ct, b64: buf.toString("base64") });
  }
  return byHash;
}

async function uploadBucket(hashes, byHash, jwt) {
  const boundary = "----cfasset" + Date.now() + Math.random().toString(16).slice(2);
  let body = "";
  for (const hash of hashes) {
    const file = byHash.get(hash);
    if (!file) throw new Error(`Missing hash ${hash}`);
    body +=
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="${hash}"; filename="${file.path}"\r\n` +
      `Content-Type: ${file.contentType}\r\n` +
      `\r\n` +
      `${file.b64}\r\n`;
  }
  body += `--${boundary}--\r\n`;

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/assets/upload?base64=true`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    body,
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(`Upload failed: ${JSON.stringify(json.errors || json)}`);
  }
  return json.result?.jwt || null;
}

const buckets = JSON.parse(process.argv[2] || "[]");
const uploadJwt =
  process.env.CF_ASSETS_UPLOAD_JWT?.trim() ||
  (process.stdin.isTTY ? "" : readFileSync(0, "utf8").trim());
if (!uploadJwt) {
  console.error(
    "Usage: CF_ASSETS_UPLOAD_JWT=<uploadJwt> node scripts/upload-assets-with-mime.mjs '<buckets-json>'",
  );
  console.error(
    "   or: echo '<uploadJwt>' | node scripts/upload-assets-with-mime.mjs '<buckets-json>'",
  );
  process.exit(1);
}

const byHash = buildIndex();
let completion = null;
for (let i = 0; i < buckets.length; i++) {
  console.log(`Uploading bucket ${i + 1}/${buckets.length} (${buckets[i].length} files)`);
  const jwt = await uploadBucket(buckets[i], byHash, uploadJwt);
  if (jwt) completion = jwt;
}
if (!completion) {
  console.error("No completion JWT returned");
  process.exit(1);
}
const jwtDir = mkdtempSync(join(tmpdir(), "cf-assets-"));
const jwtPath = join(jwtDir, "completion.jwt");
writeFileSync(jwtPath, completion, { mode: 0o600, flag: "wx" });
console.log(`Wrote ${jwtPath}`);
