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
 */

import { copyFile, mkdir, readdir, rename, rm, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "packages/ui/fonts");
const targets = [join(root, "apps/site/public/fonts")];

const files = (await readdir(source)).filter((f) => f.endsWith(".woff2"));
if (files.length === 0) throw new Error(`No .woff2 files in ${source}`);

let copied = 0;
let skipped = 0;

for (const target of targets) {
  await mkdir(target, { recursive: true });

  for (const file of files) {
    const from = join(source, file);
    const to = join(target, file);

    const [src, dest] = await Promise.all([stat(from), stat(to).catch(() => null)]);
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
