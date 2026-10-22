#!/usr/bin/env node
/**
 * Fail CI / the local build gate when the running Node is below the patched floor for the
 * Oct 21, 2026 Node.js security release (CVE-2026-111497, Brotli decoder RCE).
 * Workers run on workerd and are not affected; this guards the real Node that
 * installs, builds, tests, and deploys them. Raise the floors on the next
 * Node.js security release.
 */
const FLOORS = { 22: [23, 4], 24: [22, 1], 26: [12, 1] };
const [major, minor, patch] = process.versions.node.split('.').map(Number);

function isPatched() {
  if (major > 26) return true;
  const floor = FLOORS[major];
  if (!floor) return false;
  const [floorMinor, floorPatch] = floor;
  return minor > floorMinor || (minor === floorMinor && patch >= floorPatch);
}

if (!isPatched()) {
  console.error(`check-node-version failed: Node ${process.version} is unpatched (CVE-2026-111497).`);
  console.error('  - Use 24.22.1 (pinned in .nvmrc). Accepted: 22.23.4+, 24.22.1+, 26.12.1+.');
  process.exit(1);
}

console.log(`check-node-version: ok (${process.version})`);
