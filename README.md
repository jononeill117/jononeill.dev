# jononeill.dev

Source for jononeill.dev, the personal site of Jon O'Neill, product manager. Dark editorial, not SaaS marketing.

**Status:** Pages are in the repo. Domain is not live. Atlas points jononeill.dev after the Worker exists.

## If you are a recruiter

This repo is the public source. The site is not live on the domain yet, so use this file as the briefing, then run the site locally.

### Who Jon is

A product manager in Phoenix. Underwriting and AI models at Zillow, the acquisitions model behind Cash Close at HomeLight, the Portico underwriting platform at Stoa, and a zero to one SaaS at Livable that reached 2,000 units in four months. Currently Director of Operations at Zoom Drain Phoenix, running product discipline against a live P&L.

| Org | Title | Dates |
| --- | --- | --- |
| Livable | Head of Product | Sep 2023 to Jul 2024 |
| Zoom Drain Phoenix | Director of Operations | 2023 to Present |
| Stoa | Senior Product Manager, SaaS and Data Integrations | May 2022 to Jul 2023 |
| HomeLight | Product Owner, Acquisitions | Mar 2021 to May 2022 |
| Zillow | Associate | Sep 2019 to Mar 2021 |

Ecclesio (Dec 2025 to Present) is a side project, not a role.

Phoenix, AZ. [LinkedIn](https://www.linkedin.com/in/jon-oneill-020196). Contact details are on `/contact/`.

### Status

- Pages live in this repo
- Design locked (tokens, motion, shared UI)
- Copy locked in `COPY-LOCK.md`
- Domain not live (jononeill.dev is not serving this site yet)

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
| `/` | Home |
| `/work/livable/` | Livable case study |
| `/work/stoa/` | Stoa case study |
| `/work/homelight/` | HomeLight case study |
| `/work/zillow/` | Zillow case study |
| `/work/zoom-drain/` | Zoom Drain Phoenix case study |
| `/work/ecclesio/` | Ecclesio, side project |
| `/experience/` | Roles, then projects |
| `/about/` | About |
| `/contact/` | Email, phone, LinkedIn, resume |
| `/privacy/` | Privacy |

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
| `packages/ui` | Shared UI + Instrument Sans fonts |
| `scripts/sync-fonts.mjs` | Copies fonts into `apps/site/public/fonts` |
| `wrangler.jsonc` | Workers static assets config |

## Palette

Locked. Do not invent a fourth hue.

- Canvas `#0B0A09`
- Ink `#F2EBE1`
- Copper `#B87333`

No indigo. No `#864AEC`. No purple brand accent.

## Rules

- No em dashes or en dashes
- Jon is a product manager. Titles on the site are the real ones and nothing is inflated
- The gmail address is never printed as visible page copy. Pages carry a "Show email" control
- Dates must match `COPY-LOCK.md` on every page they appear
- No secrets, no `dist`, no `node_modules` in git
- Ecclesio is a side project, not a role

## Contact

- Phoenix, AZ
- LinkedIn: [linkedin.com/in/jon-oneill-020196](https://www.linkedin.com/in/jon-oneill-020196)
- Email: see `/contact/`

## License

MIT. See `LICENSE`.
