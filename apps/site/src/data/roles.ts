/**
 * Paid roles, reverse chronological. Ecclesio is not a job.
 * It lives in `projects` and on /work/ecclesio/.
 */

export interface Role {
  org: string;
  title: string;
  dates?: string;
  body: string;
}

export interface Project {
  name: string;
  kind: string;
  href: string;
  body: string;
}

export const roles: readonly Role[] = [
  {
    org: "Zoom Drain Phoenix",
    title: "Director of Operations",
    dates: "Present",
    body: "Operations and dispatch. Product-shaped ops work. Annual run rate $711k.",
  },
  {
    org: "Livable",
    title: "Head of Product",
    body: "Product. Acquisition, partnerships, marketing channels, satisfaction, and churn sat inside that job.",
  },
  {
    org: "HomeLight",
    title: "Product and analytics",
    body: "About 6 homes a day, about 9,000 homes, on a 4-person team.",
  },
  {
    org: "Stoa",
    title: "Product Manager, Data Analytics and Underwriting",
    body: "Product on data analytics and underwriting.",
  },
  {
    org: "Zillow",
    title: "Associate",
    dates: "Sep 2019 to Mar 2021",
    body: "Underwriting models and AI models. About 10 a day, about 3,000.",
  },
];

export const projects: readonly Project[] = [
  {
    name: "Ecclesio",
    kind: "Side project",
    href: "/work/ecclesio/",
    body: "Church software. Invite-only. Not a job.",
  },
];
