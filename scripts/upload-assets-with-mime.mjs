#!/usr/bin/env node
/**
 * Upload apps/site/dist to Workers Assets with correct Content-Type on each part.
 *
 * Usage (after assets-upload-session returns jwt + buckets):
 *   node scripts/upload-assets-with-mime.mjs <uploadJwt> '<buckets-json>'
 *
 * Writes completion JWT to /tmp/cf-assets-completion.jwt
 *
 * Requires: Node 18+, account id via CLOUDFLARE_ACCOUNT_ID or wrangler.jsonc default.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, extname, sep } from "node:path";

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
const dist = join(process.cwd(), "apps/site/dist");

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, files);
    else files.push(p);
  }
  return files;
}

function buildIndex() {
  const byHash = new Map();
  for (const file of walk(dist)) {
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

const uploadJwt = process.argv[2];
const buckets = JSON.parse(process.argv[3] || "[]");
if (!uploadJwt) {
  console.error("Usage: node scripts/upload-assets-with-mime.mjs <uploadJwt> '<buckets-json>'");
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
writeFileSync("/tmp/cf-assets-completion.jwt", completion);
console.log("Wrote /tmp/cf-assets-completion.jwt");
