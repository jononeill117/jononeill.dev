/**
 * Serves Astro static assets and corrects Content-Type.
 * Direct API asset uploads omit part MIME types; without this,
 * HTML/CSS/JS are served as application/octet-stream and browsers download.
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

export default {
  async fetch(request, env) {
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
