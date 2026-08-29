// @ts-check
import { defineConfig } from "astro/config";

// jononeill.dev personal site.
//
// NO TAILWIND HERE. This app authors CSS directly against tokens.css.
export default defineConfig({
  site: "https://jononeill.dev",

  // Static. Every route serves real content in the initial HTML.
  output: "static",

  build: { format: "directory" },

  // Recruiter run path: http://localhost:4371/
  server: { port: 4371 },

  // Gate: Astro smartypants rewrites -- into an em dash. Off by rule.
  markdown: { smartypants: false },

  prefetch: false,
});
