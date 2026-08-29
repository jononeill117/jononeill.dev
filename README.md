# jononeill.dev

Source for jononeill.dev, the personal site of Jon O'Neill, product leader. Dark editorial, not SaaS marketing.

**Status:** Live at [jononeill.dev](https://jononeill.dev/). This repo is the source.

## If you are a recruiter

Open the site first. This file is the briefing if you are reading the repo.

### Who Jon is

A product leader in Phoenix. Underwriting and AI models at Zillow, the acquisitions model behind Cash Close at HomeLight, the Portico underwriting platform at Stoa, and a zero to one SaaS at Livable that reached 2,000 units in four months. Currently Director of Operations at Zoom Drain Phoenix, applying product discipline to a live operating system and P&L.

| Org | Title | Dates |
| --- | --- | --- |
| Zoom Drain Phoenix | Director of Operations | 2023 to Present |
| Livable | Head of Product | Sep 2023 to Jul 2024 |
| Stoa | Senior Product Manager, SaaS and Data Integrations | May 2022 to Jul 2023 |
| HomeLight | Product Owner, Acquisitions | Mar 2021 to May 2022 |
| Zillow | Associate | Sep 2019 to Mar 2021 |

Ecclesio (Dec 2025 to Present) is a side project, not a role.

Phoenix, AZ. [LinkedIn](https://www.linkedin.com/in/jon-oneill-020196). Email is on the contact section of the homepage.

### Status

- One-page hire packet on `/`
- Design locked (tokens, motion, shared UI)
- Domain live
- Resume PDF at `/Jon-ONeill-Director-of-Product.pdf` (Zillow should be on the PDF; if missing, treat the homepage Zillow section as source of truth)

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

Then open [http://localhost:4371/](http://localhost:4371/).

### Routes

| Path | Page |
| --- | --- |
| `/` | Home (hero, experience, demos, Ecclesio, about, contact) |
| `/work/zoom-drain/` | Redirects to `/#zoom-drain` |
| `/work/ecclesio/` | Redirects to `/#ecclesio` |
| `/experience/` | Redirects to `/#experience` |
| `/about/` | Redirects to `/#about` |
| `/contact/` | Redirects to `/#contact` |
| `/privacy/` | Privacy |

Inline demos on the homepage cover Zoom Drain, Livable, Stoa, HomeLight, Zillow, and Ecclesio.

## Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Site | Astro 5 | Static personal site in `apps/site` |
| Design tokens | Token CSS | `@jononeill/tokens` |
| Motion | GSAP / Lenis | `@jononeill/motion` |
| UI | Shared Astro components | `@jononeill/ui` |
| Hosting | Cloudflare Workers static assets | Worker name `jononeill-site` |
| Package manager | pnpm | Workspace root |

## Repo map

| Path | Role |
| --- | --- |
| `apps/site` | Astro 5 site (port 4371) |
| `packages/tokens` | Token CSS (canvas, ink, copper) |
| `packages/motion` | GSAP / Lenis |
| `packages/ui` | Shared Astro components and fonts |
| `wrangler.jsonc` | Cloudflare Worker deploy config |

## Rules that stay locked

- Palette: canvas `#0B0A09`, ink `#F2EBE1`, copper `#B87333`. No fourth brand hue.
- No em dashes or en dashes. Use `·` or commas.
- Do not brand Jon as executive, owner, founder, entrepreneur, or co-owner.
- Ecclesio is a side project and stays one.
- Demos are inline boards. No modal. No Figma embed.
