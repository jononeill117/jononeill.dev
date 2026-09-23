/* Regression fixtures for the publish-pipeline confinement fixes.
 *
 *   1. A .woff2 symlink inside packages/ui/fonts pointing outside the repo
 *      must abort scripts/sync-fonts.mjs.
 *   2. A symlink inside apps/site/dist pointing outside the tree must abort
 *      scripts/upload-assets-with-mime.mjs before any upload happens.
 *   3. The upload script must refuse to run without CF_ASSETS_UPLOAD_JWT or
 *      piped stdin — the JWT is never accepted on argv.
 *   4. A clean run of sync-fonts.mjs still succeeds.
 *
 * Run: node scripts/security-fixes.test.mjs   (chained into `pnpm build`)
 */

import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fontsDir = join(root, "packages/ui/fonts");
const distDir = join(root, "apps/site/dist");

let failures = 0;

function check(name, ok, detail = "") {
  if (ok) {
    console.log(`PASS ${name}`);
  } else {
    failures += 1;
    console.error(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function run(script, args, env = {}) {
  return spawnSync("node", [join(root, "scripts", script), ...args], {
    cwd: root,
    env: { ...process.env, ...env },
    encoding: "utf8",
  });
}

const outside = join(
  mkdtempSync(join(tmpdir(), "secfix-outside-")),
  "secret.woff2",
);
writeFileSync(outside, "outside-bytes");

// 1. fonts/ symlink escaping the source root aborts the sync.
const fontLink = join(fontsDir, "zz-evil-test.woff2");
symlinkSync(outside, fontLink);
try {
  const r = run("sync-fonts.mjs", []);
  check(
    "sync-fonts aborts on escaping symlink",
    r.status !== 0 && `${r.stderr}${r.stdout}`.includes("refusing"),
    `status=${r.status} out=${r.stderr.slice(0, 200)}`,
  );
} finally {
  rmSync(fontLink, { force: true });
}

// 2. dist/ symlink escaping the tree aborts the upload walk.
const distExisted = existsSync(distDir);
mkdirSync(distDir, { recursive: true });
const distLink = join(distDir, "zz-evil-test.html");
symlinkSync(outside, distLink);
try {
  const r = run("upload-assets-with-mime.mjs", ["[]"], {
    CF_ASSETS_UPLOAD_JWT: "fixture-jwt",
  });
  check(
    "upload walk aborts on escaping symlink",
    r.status !== 0 && `${r.stderr}${r.stdout}`.includes("refusing symlink"),
    `status=${r.status} out=${r.stderr.slice(0, 200)}`,
  );
} finally {
  rmSync(distLink, { force: true });
  if (!distExisted) rmSync(distDir, { recursive: true, force: true });
}

// 3. No env JWT and no piped stdin -> usage failure (argv never read).
{
  const r = run("upload-assets-with-mime.mjs", ["[]"], {
    CF_ASSETS_UPLOAD_JWT: "",
  });
  check(
    "upload requires JWT via env or stdin",
    r.status !== 0 && r.stderr.includes("CF_ASSETS_UPLOAD_JWT"),
    `status=${r.status} out=${r.stderr.slice(0, 200)}`,
  );
}

// 4. Clean tree syncs fine.
{
  const r = run("sync-fonts.mjs", []);
  check(
    "sync-fonts succeeds on a clean tree",
    r.status === 0,
    `status=${r.status} out=${r.stderr.slice(0, 200)}`,
  );
}

rmSync(dirname(outside), { recursive: true, force: true });

if (failures > 0) {
  console.error(`security fixtures: ${failures} failed`);
  process.exit(1);
}
console.log("security fixtures: all passed");
