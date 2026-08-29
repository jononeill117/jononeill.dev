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
    // Pretty URL without trailing slash (before redirect) — treat as HTML.
    return "text/html; charset=utf-8";
  }
  return MIME_BY_EXT[base.slice(dot).toLowerCase()] ?? null;
}

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const type = contentTypeForPathname(new URL(request.url).pathname);
    if (!type || response.status >= 300 && response.status < 400) {
      return response;
    }
    const headers = new Headers(response.headers);
    headers.set("Content-Type", type);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
