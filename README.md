# jononeill.dev

Source for jononeill.dev, a hire-packet personal site. Dark editorial, not SaaS marketing.

**Status:** In progress. Design system locked. Pages next. Domain not live.

## If you are a recruiter

This repo is the public source for Jon ONeill's personal site. The site is not live on the domain yet. Use this file as the briefing, then run the site locally.

### What this is

A personal site for hiring managers and recruiters. It shows who Jon is, the locked design system, and the stack. It is not a product marketing site and it is not Clairvos.

### Status

- In progress
- Design locked (tokens, motion, shared UI)
- Pages next
- Domain not live (jononeill.dev is not serving this site yet)

### Who Jon is

Jon works in product, operations, and analytics.

- Zoom Drain Phoenix: Director of Operations
- Livable: Head of Product
- Earlier product and analytics work at HomeLight, Stoa, and Zillow
- Ecclesio is a side project

Phoenix, AZ. [LinkedIn](https://www.linkedin.com/in/jon-oneill-020196). [jon.oneill.m@gmail.com](mailto:jon.oneill.m@gmail.com).

### Files to open first

1. `README.md` (this file)
2. `packages/tokens/tokens.css` (locked palette)
3. `packages/ui` (shared components and fonts)
4. `packages/motion` (GSAP / Lenis wrappers)
5. `apps/site` (Astro 5 app)

### How to run locally

Requires Node 20.11+ and pnpm 11.

```bash
pnpm install
pnpm dev
```

Then open [http://localhost:4371/preview/tokens/](http://localhost:4371/preview/tokens/).

That preview route is throwaway and marked for deletion. Home is [http://localhost:4371/](http://localhost:4371/).

## Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Site | Astro 5 | Static personal site in `apps/site` |
| Design tokens | Token CSS | `@jononeill/tokens` |
| Motion | GSAP / Lenis | `@jononeill/motion` |
| UI | Shared Astro components | `@jononeill/ui` |
| Package manager | pnpm | Workspace root |

## Repo map

| Path | Role |
| --- | --- |
| `apps/site` | Astro 5 site (port 4371) |
| `packages/tokens` | Token CSS (canvas, ink, copper) |
| `packages/motion` | GSAP / Lenis |
| `packages/ui` | Shared UI + Instrument Sans fonts |
| `scripts/sync-fonts.mjs` | Copies fonts into `apps/site/public/fonts` |

## Palette

Locked. Do not invent a fourth hue.

- Canvas `#0B0A09`
- Ink `#F2EBE1`
- Copper `#B87333`

No indigo. No `#864AEC`. No purple brand accent.

## Rules

- No em dashes or en dashes
- Do not brand Jon as executive, owner, founder, entrepreneur, or co-owner
- No secrets, no `dist`, no `node_modules` in git
- `/preview/tokens/` is temporary and marked for deletion

## Contact

- Phoenix, AZ
- LinkedIn: [linkedin.com/in/jon-oneill-020196](https://www.linkedin.com/in/jon-oneill-020196)
- Email: [jon.oneill.m@gmail.com](mailto:jon.oneill.m@gmail.com)

## License

MIT. See `LICENSE`.
