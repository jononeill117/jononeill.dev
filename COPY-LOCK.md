# COPY-LOCK

Every visitor-facing string on jononeill.dev, page by page, exactly as written.
Wire the structure around these strings. Do not rewrite them.

Rules that hold everywhere:

- Jon is a **product manager** and the site never upgrades him. No title
  implying he ran or part-owned a company, no chief-officer abbreviation, no
  seniority label of any kind. The one exception is the literal HomeLight job
  title, `Product Owner, Acquisitions`, which is real and stays.
- Zoom Drain Phoenix never opens a page. His title there is **Director of
  Operations**.
- Ecclesio is a side project. It is never a role and it never carries a title.
- No em dashes and no en dashes. The interpunct separator is `·`.
- No invented numbers. Every figure below traces to the resume.
- The gmail address is never printed as visible copy. Pages use a **Show email**
  control.

## Open items for the structure pass

1. **Resume PDF.** Four links point at `SITE.resume`, which is
   `/jon-oneill-resume.pdf`. The asset does not exist yet. The links are on the
   homepage hero, `/about/`, `/contact/`, and nowhere else. Change the path in
   one place: `apps/site/src/components/site.ts`.
2. **Show email control.** `/contact/` and `/privacy/` carry
   `<a href="#show-email" data-email-reveal>Show email</a>`. No mailto href and
   no mailbox in the link text until click. `reveal-email.ts` assembles
   `EMAIL_USER` + `EMAIL_HOST` on click. The label string is **Show email**.
   If a revealed state needs a second label, use **Copy email**.
3. **Shared chrome must not print the mailbox.** `SiteNav` already accepts
   `showEmail={false}`; keep it off. `SiteFooter` / `PrivacyBody` mailto props
   are unused by this site and must stay unused. `personSchema()` must not emit
   an `email` field. Phone lives only on the resume PDF. Do not add a `tel:`
   link.
4. **Hero mono rows.** The homepage hero stacks three `.page-meta` rows: the
   proof strip, the stat strip, and the action row. They are three separate
   registers reading as one block. Differentiate them if you want, but keep the
   order: companies, numbers, actions.
5. **Experience bullets** render as three `<p class="role__body">` per role
   because no list style exists yet. They are authored as three bullets in
   `apps/site/src/data/roles.ts` and can become a `<ul>` without touching copy.
6. **Figure placeholders.** Every case study ends with a line starting "Figure
   placeholder." That line is the caption. Replace the line with a real figure
   plus that caption. Do not ship an invented screenshot.

## Chronology, must match everywhere

| Org | Title | Dates |
| --- | --- | --- |
| Livable | Head of Product | Sep 2023 to Jul 2024 |
| Zoom Drain Phoenix | Director of Operations | 2023 to Present |
| Stoa | Senior Product Manager, SaaS and Data Integrations | May 2022 to Jul 2023 |
| HomeLight | Product Owner, Acquisitions | Mar 2021 to May 2022 |
| Zillow | Associate | Sep 2019 to Mar 2021 |
| Ecclesio | Side project | Dec 2025 to Present |

## Site constants

`apps/site/src/components/site.ts`

| Key | String |
| --- | --- |
| `name`, `legalName` | `Jon O'Neill` |
| `jobTitle` | `Product Manager` |
| `resume` | `/jon-oneill-resume.pdf` |
| `description` | `Product manager. Zero to one SaaS at Livable, the underwriting platform at Stoa, acquisitions models at HomeLight and Zillow. Phoenix, AZ.` |
| `practice` | `Product management. Zero to one SaaS, pricing and underwriting platforms, data and machine learning, and the go to market that has to follow.` |
| `categories` | `Product` / `Pricing and underwriting` / `Data and ML` / `Go to market` |
| `locality` | `Phoenix, Arizona` / `United States` |
| `phone` | Phone lives only on the resume PDF. Do not print it in HTML, JS, JSON-LD, or this file. |
| `linkedin` | `https://www.linkedin.com/in/jon-oneill-020196` |

Footer contact route, passed from `BaseLayout.astro`:

- lead `Email`
- name `Jon`
- mailto subject `Product role`
- sub `Product roles. Phoenix or remote.`

## `/` Home

`apps/site/src/pages/index.astro`

**Meta title**

> Jon O'Neill. Product manager, zero to one SaaS and pricing platforms.

**Meta description** falls through to `SITE.description`.

**Hero**

- Eyebrow: `Product manager. Phoenix, AZ.`
- H1: `Jon O'Neill`
- Lede:

> I build the product that makes the expensive decision. Underwriting models at
> Zillow and HomeLight, the pricing platform forty analysts worked in at Stoa,
> and a zero to one SaaS at Livable that reached 2,000 units in its first four
> months.

- Proof strip, in this order: `Zillow` `HomeLight` `Stoa` `Livable` `Zoom Drain`
- Stat strip, in this order: `$1B underwritten` `$800M annual book`
  `2,000 units in four months` `Cycle time down 85%`
- Action row: `Resume` `LinkedIn` `Contact`

**Work section**

- Eyebrow: `Work`
- H2: `Five seats, same job.`
- Body:

> Product on enterprise models, on a marketplace acquisitions book, on a pricing
> platform, and on a zero to one SaaS. Then the operating side of a live P&L, to
> find out what my roadmaps had been costing the people who ran them.

- Cards, in this order, driven by the `order` field in the content collection:
  Livable, Stoa, HomeLight, Zillow, Zoom Drain Phoenix. Each card is
  `{role} · {dates}` as the eyebrow, `{title}` as the heading, `{lede}`, then
  `{outcome}`. All four strings come from the markdown frontmatter recorded
  below.
- Link: `Full experience`

**Side project block**, one entry, kept small on purpose

- Eyebrow: `On the side · Dec 2025 to Present`
- Heading: `Ecclesio`
- Lede and outcome come from `ecclesio.md`

**Contact band**

- Eyebrow: `Contact`
- H2: `I want the next zero to one.`
- Body:

> A product role at a startup, where the roadmap, the number, and the go to
> market sit inside one job. Phoenix, AZ, and glad to work remote.

- Link: `Phone, email, LinkedIn, resume`

## `/about/`

`apps/site/src/pages/about.astro`

**Meta title**

> About. Jon O'Neill, product manager.

**Meta description**

> How five product and operating seats connect, and the product role I want next.

- Eyebrow: `About`
- H1: `Models, then platforms, then a P&L.`
- Lede:

> I am a product manager. I like the problems where the answer is a number.

Body, 219 words with the lede, first person, five paragraphs:

> I started at Zillow in 2019, my first enterprise product seat, on underwriting
> and AI models that ran every day on inventory the company was buying. That is
> where I learned a model is a product: it has users, it has a latency budget,
> and when it is wrong somebody answers for it.

> HomeLight was the same lesson at higher stakes: the underwriting model behind
> Cash Close and the automation that sent 300 offers a month against an $800M
> book. Stoa was the platform version. Portico, forty analysts, cycle time down
> 85%, twenty-two vendor feeds down to six.

> Livable was the one I had been building toward. Head of Product on a zero to
> one SaaS: hire the team, ship the product, take it to the board monthly, 2,000
> units in four months.

> Then I went and ran an operating business, Zoom Drain Phoenix. Dispatch,
> intake, an office I hired, a P&L with my name on it. It taught me what my old
> roadmaps cost the people downstream.

> What I want next is a product role at a startup, where the roadmap, the number,
> and the go to market sit inside one job. It is the only combination I have ever
> been good at.

Action row: `Experience` `Resume` `Contact`

## `/experience/`

`apps/site/src/pages/experience.astro`, data in `apps/site/src/data/roles.ts`

**Meta title**

> Experience. Jon O'Neill, product manager.

**Meta description**

> Head of Product at Livable. Senior Product Manager at Stoa. Product Owner,
> Acquisitions at HomeLight. Associate at Zillow. Director of Operations at Zoom
> Drain Phoenix.

- Eyebrow: `Experience`
- H1: `Five roles`
- Lede:

> Four of them product. One of them the operating seat, where I had to live with
> a roadmap instead of write one. Reverse chronological.

Each role renders dates as the eyebrow, title as the heading, org as the label,
then three bullets.

### Livable, Head of Product, Sep 2023 to Jul 2024

1. Built and shipped a zero to one SaaS product. 2,000 units on it in the first
   four months.
2. Landed an enterprise integration that put the product in front of an 8M-unit
   base on an evergreen basis.
3. Hired the product managers, designers, and business analysts. Ran a
   user-feedback roadmap that lifted CSAT and retention 35%, and reported to the
   board monthly.

### Zoom Drain Phoenix, Director of Operations, 2023 to Present

1. Rebuilt intake as an automated pipeline across the vendor work-order portal,
   the CSM, and VOIP. Average booking time down three hours, speed to lead up
   300%, weekly revenue up 10 to 15%.
2. Built the dispatch operating system, hired and trained the office, and wrote
   the SOPs and estimate tooling. Office labor down about 30%, close to $40k a
   year.
3. Built go to market out of our own booking and revenue data, and took on
   commercial contract work including sewer laterals and multi-crew renovation
   jobs. The business runs at a $711k annual run rate, January through July 2026
   annualized.

### Stoa, Senior Product Manager, SaaS and Data Integrations, May 2022 to Jul 2023

1. Owned Portico, the underwriting platform forty analysts worked in. $1B
   underwritten and $300M purchased through it.
2. Cut cycle time 85% and consolidated twenty-two vendor feeds down to six.
   Integration time down 40%, data accuracy up 25%.
3. Put machine learning and automation on the steps that only ever repeated,
   absorbing up to $4M in labor.

### HomeLight, Product Owner, Acquisitions, Mar 2021 to May 2022

1. Owned the underwriting model behind Cash Close, against an $800M annual book.
2. Shipped the offer automation that sent 300 offers a month without an analyst
   in the loop.
3. Worked acquisitions on the inputs, and engineering and data science on the
   model and its production path.

### Zillow, Associate, Sep 2019 to Mar 2021

1. First enterprise product seat. Underwriting and AI models running in
   production on live inventory.
2. About ten a day. About 3,000 in the period.
3. Sat between the analysts running the models and the engineers shipping them.

### Projects section

- Eyebrow: `Projects`
- H2: `On the side`
- Card eyebrow: `Side project · Dec 2025 to Present`
- Card heading: `Ecclesio`
- Card body:

> Church software. I directed a contract engineering team through the first build,
> then took it over as the only person maintaining it. Zero to beta in four
> months, per-church isolated databases, tokenized payments, and a dashboard that
> loads in about 50ms. Churches join by invitation.

## `/contact/`

`apps/site/src/pages/contact.astro`

**Meta title**

> Contact Jon O'Neill. Product manager, Phoenix.

**Meta description**

> Open to product roles at startups. Email, phone, LinkedIn, resume.

- Eyebrow: `Contact`
- H1: `Open to product roles`
- Intent sentence:

> I am looking for a product role at a startup, the kind where the roadmap, the
> number, and the go to market sit inside one job. Phoenix, AZ, and glad to work
> remote. Email is the fastest way to reach me.

Three lines, in this order. Phone lives only on the resume PDF. Do not add a `tel:` link.

| Label | Target |
| --- | --- |
| `Show email` | Assemble the mailbox on click from `EMAIL_USER` + `EMAIL_HOST`. No mailto href and no address in the link text until click. |
| `linkedin.com/in/jon-oneill-020196` | the LinkedIn URL |
| `Resume, PDF` | `SITE.resume` |

## `/work/[slug]/` case studies

`apps/site/src/pages/work/[slug].astro`, content in
`apps/site/src/content/work/*.md`

Meta title is `{title}. {role}. Jon O'Neill.`. Meta description is `{lede}`.
Hero is `{role} · {dates}` as the eyebrow, `{title}` as the H1, `{lede}`, then
`{outcome}`. The footer action row is `All work` `·` `Experience` `·` `Contact`.

Body sections in every file, in this order, each a bold label followed by prose:
**Problem.** **What I owned.** **What shipped.** **Who I worked with.**
**Result.** Then the figure placeholder line.

### Frontmatter, all six files

| Slug | title | role | dates | outcome |
| --- | --- | --- | --- | --- |
| `livable` | Livable | Head of Product | Sep 2023 to Jul 2024 | 2,000 units in the first four months. CSAT and retention up 35%. |
| `stoa` | Stoa | Senior Product Manager, SaaS and Data Integrations | May 2022 to Jul 2023 | $1B underwritten, $300M purchased. Cycle time down 85%. |
| `homelight` | HomeLight | Product Owner, Acquisitions | Mar 2021 to May 2022 | An $800M annual book. 300 automated offers a month. |
| `zillow` | Zillow | Associate | Sep 2019 to Mar 2021 | About ten a day. About 3,000 in the period. |
| `zoom-drain` | Zoom Drain Phoenix | Director of Operations | 2023 to Present | Booking time down three hours. Speed to lead up 300%. Weekly revenue up 10 to 15%. |
| `ecclesio` | Ecclesio | Side project | Dec 2025 to Present | Zero to beta in four months. Dashboard at about 50ms, down from two seconds. |

### Ledes

- **Livable.** A zero to one SaaS. I hired the team, shipped the product, and
  took it to the board every month.
- **Stoa.** Owned Portico, the underwriting platform forty analysts worked in,
  and rebuilt what it cost the company to say yes to a house.
- **HomeLight.** The underwriting model behind Cash Close, and the automation
  that let it make offers without a person in the loop.
- **Zillow.** First enterprise product seat. Underwriting and AI models in
  production, running every day on inventory the company was buying.
- **Zoom Drain Phoenix.** Product discipline pointed at a live P&L. I rebuilt
  intake as an automated pipeline, then had to live with the numbers it produced.
- **Ecclesio.** Church software I build on the side. Invite-only, and it stays a
  side project.

### Figure placeholder captions

| Slug | Caption |
| --- | --- |
| `livable` | units on the platform, launch through month four |
| `stoa` | the underwriting queue after consolidation, twenty-two vendor feeds down to six |
| `homelight` | the automated offer path, from listing intake to offer sent |
| `zillow` | daily model volume, September 2019 through March 2021 |
| `zoom-drain` | average booking time before and after the intake pipeline |
| `ecclesio` | dashboard load time, first build against the current one |

The full body prose lives in the markdown files and is the copy of record. Read
it there rather than duplicating it here, so the two cannot drift.

## `/privacy/`

`apps/site/src/pages/privacy.astro`. Unchanged except for the address. The two
places that printed the gmail now read:

> If you email me, that message is handled as ordinary correspondence. Hosting
> and CDN logs may retain standard request metadata for a limited time.

> Questions: `Show email`

## `/404`

`apps/site/src/pages/404.astro`

- Meta title: `Not found. Jon O'Neill.`
- H1: `Not found`
- Links: `Home` `·` `Experience` `·` `Contact`

## Numbers this copy is allowed to use

Zoom Drain Phoenix: booking time down three hours, speed to lead up 300%, weekly
revenue up 10 to 15%, office labor down about 30% and close to $40k a year, $711k
annual run rate from January through July 2026 annualized.

Livable: 2,000 units in the first four months, 8M-unit base, CSAT and retention
up 35%.

Stoa: forty analysts, $1B underwritten, $300M purchased, cycle time down 85%,
twenty-two vendors down to six, up to $4M in labor, integration time down 40%,
accuracy up 25%.

HomeLight: $800M annual book, 300 automated offers a month.

Zillow: about ten a day, about 3,000 in the period.

Ecclesio: zero to beta in four months, about 50ms against two seconds.

Nothing else. The $711k figure is operating proof and is never the scale claim.
