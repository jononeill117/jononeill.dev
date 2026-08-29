import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const work = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/work" }),
  schema: z.object({
    title: z.string(),
    lede: z.string(),
    role: z.string(),
    kind: z.enum(["operations", "project"]),
    order: z.number(),
    visualCaption: z.string().optional(),
  }),
});

export const collections = { work };
