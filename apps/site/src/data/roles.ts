/**
 * Paid roles. Dates and bullets should stay aligned with / content/work.
 * Ecclesio is a side project and lives in `projects`.
 */

export interface Role {
  org: string;
  title: string;
  dates: string;
  bullets: readonly string[];
}

export interface Project {
  name: string;
  kind: string;
  dates: string;
  href: string;
  body: string;
}

export const roles: readonly Role[] = [
  {
    org: "Zoom Drain Phoenix",
    title: "Director of Operations",
    dates: "2023 to Present",
    bullets: [
      "Rebuilt job intake as an automated pipeline across a vendor portal, CSM, and VOIP — average booking time down three hours.",
      "Automation lifted speed to lead 300%, grew weekly revenue 10 to 15%, and cut office labor about 30% (~$40k a year).",
      "Wrote the dispatch operating system, then hired and trained the office team that runs it.",
      "Built SOPs and estimate tooling; used booking data for GTM; won commercial contracts including sewer laterals and multi-crew renovations.",
    ],
  },
  {
    org: "Livable",
    title: "Head of Product",
    dates: "Sep 2023 to Jul 2024",
    bullets: [
      "Took a new SaaS offering from concept through public launch — 2,000 units in the first four months.",
      "Landed an enterprise integration with evergreen exposure to an 8M-unit base.",
      "Drove a 35% lift in CSAT and retention; presented to the board monthly; hired PMs, designers, and analysts.",
    ],
  },
  {
    org: "Stoa",
    title: "Senior Product Manager, SaaS and Data Integrations",
    dates: "May 2022 to Jul 2023",
    bullets: [
      "Owned Portico for 40 analysts — cycle time down 85%, over $1B underwritten and $300M purchased.",
      "Consolidated 22 data vendors to 6; ML and automation up to $4M in labor savings.",
      "Rebuilt data integration — time down 40%, accuracy up 25%.",
    ],
  },
  {
    org: "HomeLight",
    title: "Product Owner, Acquisitions",
    dates: "Mar 2021 to May 2022",
    bullets: [
      "Underwriting model behind Cash Close, an $800M annual book.",
      "Product that generated 300 automated offers a month.",
    ],
  },
  {
    org: "Zillow",
    title: "Business Analyst",
    dates: "Sep 2019 to Mar 2021",
    bullets: [
      "First enterprise product seat — underwriting and AI models on live inventory.",
      "About ten a day; about 3,000 in the period.",
    ],
  },
];

export const projects: readonly Project[] = [
  {
    name: "Ecclesio",
    kind: "Side project",
    dates: "Dec 2025 to Present",
    href: "#ecclesio",
    body: "Church operations software. Zero to beta in four months, isolated databases, tokenized payments, dashboard ~50ms.",
  },
];
