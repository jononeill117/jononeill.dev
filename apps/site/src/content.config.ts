import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const work = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/work" }),
  schema: z.object({
    title: z.string(),
    /** One-line role framing; kept for metadata, not shown as a block on home. */
    lede: z.string(),
    role: z.string(),
    /** Employment window as a reader sees it. Must match /experience/. */
    dates: z.string(),
    /** Headline outcome line; optional on home when bullets carry the numbers. */
    outcome: z.string(),
    kind: z.enum(["product", "operations", "project"]),
    order: z.number(),
    visualCaption: z.string(),
    /** Resume-style bullets shown under each demo. */
    bullets: z.array(z.string()).min(2).max(6),
    /** Optional live marketing site Jon shipped for this role. */
    marketingUrl: z.string().url().optional(),
  }),
});

const writing = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/writing" }),
  schema: z.object({
    title: z.string(),
    /** One line summary, used on the index and as the meta description. */
    description: z.string(),
    date: z.date(),
    /**
     * Draft posts are real files in the repo and nothing more. The index
     * never lists them and production never routes them. Jon approves a
     * post by clearing this flag himself.
     */
    draft: z.boolean().default(false),
  }),
});

export const collections = { work, writing };
