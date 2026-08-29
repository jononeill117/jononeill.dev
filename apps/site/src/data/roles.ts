/**
 * Paid roles. Dates here are the source of truth and must match /work/ cards.
 * Ecclesio is a side project and lives in `projects`.
 */

export interface Role {
  org: string;
  title: string;
  dates: string;
  /** Exactly three. A role that needs four is two roles.  */
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
      "Rebuilt intake as an automated pipeline across the vendor work-order portal, the CSM, and VOIP. Average booking time down three hours, speed to lead up 300%, weekly revenue up 10 to 15%.",
      "Built the dispatch operating system, hired and trained the office, and wrote the SOPs and estimate tooling. Office labor down about 30%, close to $40k a year.",
      "Built go to market out of our own booking and revenue data, and took on commercial contract work including sewer laterals and multi-crew renovation jobs. The business runs at a $711k annual run rate, January through July 2026 annualized.",
    ],
  },
  {
    org: "Livable",
    title: "Head of Product",
    dates: "Sep 2023 to Jul 2024",
    bullets: [
      "Built and shipped a zero to one SaaS product. 2,000 units on it in the first four months.",
      "Landed an enterprise integration that put the product in front of an 8M-unit base on an evergreen basis.",
      "Hired the product managers, designers, and business analysts. Ran a user-feedback roadmap that lifted CSAT and retention 35%, and reported to the board monthly.",
    ],
  },
  {
    org: "Stoa",
    title: "Senior Product Manager, SaaS and Data Integrations",
    dates: "May 2022 to Jul 2023",
    bullets: [
      "Owned Portico, the underwriting platform forty analysts worked in. $1B underwritten and $300M purchased through it.",
      "Cut cycle time 85% and consolidated twenty-two vendor feeds down to six. Integration time down 40%, data accuracy up 25%.",
      "Put machine learning and automation on the steps that only ever repeated, absorbing up to $4M in labor.",
    ],
  },
  {
    org: "HomeLight",
    title: "Product Owner, Acquisitions",
    dates: "Mar 2021 to May 2022",
    bullets: [
      "Owned the underwriting model behind Cash Close, against an $800M annual book.",
      "Shipped the offer automation that sent 300 offers a month without an analyst in the loop.",
      "Worked acquisitions on the inputs, and engineering and data science on the model and its production path.",
    ],
  },
  {
    org: "Zillow",
    title: "Business Analyst",
    dates: "Sep 2019 to Mar 2021",
    bullets: [
      "First enterprise product seat. Underwriting and AI models running in production on live inventory.",
      "About ten a day. About 3,000 in the period.",
      "Sat between the analysts running the models and the engineers shipping them.",
    ],
  },
];

export const projects: readonly Project[] = [
  {
    name: "Ecclesio",
    kind: "Side project",
    dates: "Dec 2025 to Present",
    href: "#ecclesio",
    body: "Church software. I directed a contract engineering team through the first build, then took it over as the only person maintaining it. Zero to beta in four months, per-church isolated databases, tokenized payments, and a dashboard that loads in about 50ms. Churches join by invitation.",
  },
];
