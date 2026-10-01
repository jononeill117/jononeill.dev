#!/usr/bin/env python3
"""Nightly live-vs-source drift check for the Muse Icon Studio.

Compares what https://musecharacters.jononeill.dev serves against this
source tree, so deploy skew is caught by a crew instead of a visitor:

  1. Exact-match assets: app.js, styles.css, version.json, sitemap.xml,
     robots.txt must be byte-identical live (cache-busted fetch).
  2. index.html must match except the Cloudflare Web Analytics beacon,
     which the platform injects at the edge (not source drift).
  3. Every gallery id in app.js must serve its webp 200 live.
  4. Pieces behind Jon's product-review gate must 404 live (never ship
     without his taste approval).
  5. Live version.json must equal the source VERSION file.

Exit 0 when clean, 1 with a report when anything drifts.

Note: the host 403s urllib's default User-Agent (bot-fight rule), so we
send a browser UA. worker.js is deliberately not fetched: it is the
worker module, not a deployed static asset, and 404s by design.
"""
import hashlib
import re
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

BASE = "https://musecharacters.jononeill.dev"
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"}
HERE = Path(__file__).resolve().parent
STUDIO = HERE.parent

EXACT_ASSETS = ["app.js", "styles.css", "version.json", "sitemap.xml", "robots.txt"]

# Pieces queued behind Jon's product-review gate: one deploy re-ships them
# all once he approves. They must 404 on the live host until then.
GATED_PIECES = ["batman", "pirate", "muscular-muse"]

BEACON_RE = re.compile(
    r'<script[^>]*src="https://static\.cloudflareinsights\.com/beacon\.min\.js[^"]*"'
    r"[^>]*></script>\n?")


def fetch(path):
    req = urllib.request.Request(f"{BASE}/{path}?t={int(time.time())}", headers=UA)
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read()


def sha(b):
    return hashlib.sha256(b).hexdigest()


def main():
    failures = []

    def check(name, cond, detail=""):
        print(f"[{'ok' if cond else 'FAIL'}] {name}" + (f" ({detail})" if detail and not cond else ""))
        if not cond:
            failures.append(name)

    # 1. Exact-match assets
    for asset in EXACT_ASSETS:
        try:
            live = fetch(asset)
            src = (STUDIO / asset).read_bytes()
            check(f"asset {asset} matches source", sha(live) == sha(src))
        except Exception as e:
            check(f"asset {asset} matches source", False, str(e))

    # 2. index.html: only allowed delta is the CF analytics beacon injection
    try:
        live_html = fetch("index.html").decode("utf-8")
        src_html = (STUDIO / "index.html").read_text()
        normalized = BEACON_RE.sub("", live_html)
        check("index.html matches source (beacon ignored)",
              normalized == src_html,
              "non-beacon delta" if normalized != src_html else "")
    except Exception as e:
        check("index.html matches source (beacon ignored)", False, str(e))

    # 3. Every gallery id serves its webp 200
    app_js = (STUDIO / "app.js").read_text()
    ids = re.findall(r'id:\s*"([a-z0-9-]+)"', app_js)
    missing = []
    for i in ids:
        try:
            fetch(f"gallery/{i}.webp")
        except Exception:
            missing.append(i)
    check(f"gallery {len(ids)} pieces all 200", not missing, f"missing: {missing}")

    # 4. Gated pieces stay off the live host
    leaked = []
    for i in GATED_PIECES:
        try:
            fetch(f"gallery/{i}.webp")
            leaked.append(i)
        except urllib.error.HTTPError as e:
            if e.code != 404:
                leaked.append(f"{i} (HTTP {e.code})")
        except Exception as e:
            leaked.append(f"{i} ({e})")
    check("gated pieces 404 live", not leaked, f"leaked: {leaked}")

    # 5. Live version equals source VERSION
    try:
        live_ver = fetch("version.json").decode("utf-8")
        src_ver = (STUDIO / "VERSION").read_text().strip()
        import json
        check("live version.json matches source VERSION",
              json.loads(live_ver)["version"] == src_ver,
              f"live={live_ver.strip()} src={src_ver}")
    except Exception as e:
        check("live version.json matches source VERSION", False, str(e))

    print("DRIFT CHECK:", "CLEAN" if not failures else f"{len(failures)} ISSUE(S)")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
