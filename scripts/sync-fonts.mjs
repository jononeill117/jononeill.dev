/* Copies the canonical font binaries into each app's public/fonts.
 *
 * There is ONE source of truth: packages/ui/fonts. Astro can only serve
 * static binaries out of an app's own public/ directory, so the file has to
 * physically exist in the app tree. Committing two copies invites drift, so the
 * copies are gitignored and regenerated here. Chained into dev and build, so a
 * fresh clone never renders in the fallback face.
 *
 * Write through a process-unique temp file renamed into place, since rename is
 * atomic on the same filesystem.
 *
 * CONFINEMENT. The source and target roots are realpath'd once, then every
 * dirent is lstat'd: anything that is not a plain single-link regular file
 * (a symlink, a hard link, a device) aborts the sync. A planted symlink
 * otherwise turns this script into an arbitrary-read primitive that ships
 * operator-local bytes into the public site.
 */

import {
  copyFile,
  lstat,
  mkdir,
  readdir,
  realpath,
  rename,
  rm,
  stat,
} from "node:fs/promises";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = await realpath(
  join(dirname(fileURLToPath(import.meta.url)), ".."),
);
const source = join(root, "packages/ui/fonts");
const targets = [join(root, "apps/site/public/fonts")];

function underRoot(resolved, base) {
  return resolved === base || resolved.startsWith(base + sep);
}

const sourceRoot = await realpath(source);
if (!underRoot(sourceRoot, root)) {
  throw new Error(`fonts: source ${source} resolves outside ${root}`);
}

const files = (await readdir(source)).filter((f) => f.endsWith(".woff2"));
if (files.length === 0) throw new Error(`No .woff2 files in ${source}`);

for (const file of files) {
  const from = join(sourceRoot, file);
  const lst = await lstat(from);
  if (!lst.isFile() || lst.nlink > 1) {
    throw new Error(
      `fonts: refusing non-regular file ${from} (symlink, hard link, or device)`,
    );
  }
  const resolved = await realpath(from);
  if (!underRoot(resolved, sourceRoot)) {
    throw new Error(`fonts: ${from} resolves outside ${sourceRoot}`);
  }
}

let copied = 0;
let skipped = 0;

for (const target of targets) {
  await mkdir(target, { recursive: true });
  const targetRoot = await realpath(target);
  if (!underRoot(targetRoot, root)) {
    throw new Error(`fonts: target ${target} resolves outside ${root}`);
  }

  for (const file of files) {
    const from = join(sourceRoot, file);
    const to = join(targetRoot, file);

    const src = await stat(from);
    const dest = await lstat(to).catch(() => null);
    if (dest && !dest.isFile()) {
      throw new Error(
        `fonts: refusing to replace non-regular file ${to} (symlink or device)`,
      );
    }
    if (dest && dest.size === src.size) {
      skipped += 1;
      continue;
    }

    const tmp = `${to}.${process.pid}.tmp`;
    try {
      await copyFile(from, tmp);
      await rename(tmp, to);
      copied += 1;
    } catch (error) {
      await rm(tmp, { force: true });
      throw error;
    }
  }
}

console.log(`fonts: ${copied} copied, ${skipped} already current`);
