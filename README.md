# jononeill.dev

Source for jononeill.dev, a hire-packet personal site. Dark editorial, not SaaS marketing.

**Status:** In progress. Design system locked. Pages next. Domain not live.

## If you are a recruiter

This repo is the public source for Jon O'Neill's personal site. The site is not live. Use this file as the briefing.

### Who Jon is

Jon works in product, operations, and analytics.

- Zoom Drain: Director of Operations
- Livable: Head of Product
- Earlier product and analytics work at HomeLight, Stoa, and Zillow
- Ecclesio is a side project

Phoenix, AZ. [LinkedIn](https://www.linkedin.com/in/jon-oneill-020196). [jon.oneill.m@gmail.com](mailto:jon.oneill.m@gmail.com).

### What is done

- Design system direction is locked (tokens, motion, UI)
- Stack and folder map are decided
- This recruiter briefing

### What is not done

- Pages and page content
- App workspace in this tree (`apps/` and `packages/` are not checked in yet)
- Cloudflare deploy
- Live domain (jononeill.dev is not serving this site)

### Files to open first

Only this briefing is in the tree today:

1. `README.md` (this file)
2. `LICENSE`

When the workspace lands, open these next:

1. `packages/tokens`
2. `packages/ui`
3. `packages/motion`
4. `apps/site`

### How to run locally

The site workspace is not in the tree yet, so there is nothing to run.

When `apps/site` exists, from the repo root:

```bash
pnpm install
pnpm --filter site dev
```

## Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Site | Astro 5 | Static personal site |
| Design tokens | Token CSS | Locked design system |
| Motion | GSAP / Lenis | Scroll and animation |
| Host | Cloudflare Workers static assets | Chosen, not deployed |
| Package manager | pnpm | Workspace root |

## Repo map

Planned layout. These paths are not in the tree yet.

| Path | Role |
| --- | --- |
| `apps/site` | Astro 5 site |
| `packages/tokens` | Token CSS |
| `packages/motion` | GSAP / Lenis |
| `packages/ui` | Shared UI |

## Rules

- No em dashes or en dashes
- No purple
- Do not brand Jon as executive, owner, founder, or entrepreneur

## Contact

- Phoenix, AZ
- LinkedIn: [linkedin.com/in/jon-oneill-020196](https://www.linkedin.com/in/jon-oneill-020196)
- Email: [jon.oneill.m@gmail.com](mailto:jon.oneill.m@gmail.com)

## License

MIT. See `LICENSE`.
