import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const work = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/work" }),
  schema: z.object({
    title: z.string(),
    lede: z.string(),
    role: z.string(),
    /** Employment window as a reader sees it. Must match /experience/. */
    dates: z.string(),
    /** One line, one number. The card is not allowed to end without it. */
    outcome: z.string(),
    kind: z.enum(["product", "operations", "project"]),
    order: z.number(),
    visualCaption: z.string(),
  }),
});

export const collections = { work };
