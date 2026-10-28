/**
 * PROJECTS. The showcase list, shared by the home page featured cards and
 * /projects. Zoom Drain Phoenix and Ecclesio copy traces to COPY-LOCK and
 * the work collection. The other blurbs are new copy, kept short, factual
 * and number free, and are flagged in the pass report for Jon's approval.
 */

export interface Project {
  slug: string;
  name: string;
  /** Mono register line above the name. */
  tag: string;
  blurb: string;
  link?: { href: string; label: string };
  featured?: boolean;
}

export const PROJECTS: Project[] = [
  {
    slug: "zoom-drain",
    name: "Zoom Drain Phoenix",
    tag: "Director of Operations · 2023 to Present",
    blurb:
      "Operating system behind a live service business: dispatch, intake, and the P&L. Booking time down three hours, speed to lead up 300%, weekly revenue up 10 to 15%.",
    link: { href: "https://zoomdrainphoenix.com", label: "zoomdrainphoenix.com" },
  },
  {
    slug: "dispatch-desk",
    name: "Dispatch Desk",
    tag: "Project",
    blurb:
      "Dispatch software for trades shops. Boards, booking, and customer messaging in one place, built AI-first so a small office can run more trucks without adding headcount.",
    link: { href: "https://dispatch.mytoolshed.dev", label: "Live demo" },
    featured: true,
  },
  {
    slug: "nightshift-ai",
    name: "NightShift AI",
    tag: "Project",
    blurb:
      "An answering service for trades shops that runs on AI. It picks up the calls and texts a shop misses, books the job, and hands off to a person when the conversation needs one.",
    featured: true,
  },
  {
    slug: "ecclesio",
    name: "Ecclesio",
    tag: "Side project · Dec 2025 to Present",
    blurb:
      "Church operations software, built on the side. Invite-only, zero to beta in four months, and maintained by one person.",
    link: { href: "https://ecclesiosoftware.com", label: "ecclesiosoftware.com" },
    featured: true,
  },
  {
    slug: "pastorly",
    name: "Pastorly",
    tag: "Project",
    blurb:
      "Scheduling for pastors and church staff. Meeting types, booking pages, and reminders, so setting up time with people takes minutes instead of a week of messages.",
  },
  {
    slug: "trades-ai",
    name: "trades-ai",
    tag: "Open source",
    blurb:
      "AI automation for home-service trades, in the open: plumbing, HVAC, and electrical. The patterns behind the dispatch work, published for anyone to run.",
    link: { href: "https://github.com/jononeill117/trades-ai", label: "github.com/jononeill117/trades-ai" },
    featured: true,
  },
  {
    slug: "muse-studio",
    name: "Muse icon studio",
    tag: "Project",
    blurb: "A small studio for generating and browsing app icon sets.",
    link: { href: "https://muse.jononeill.dev", label: "muse.jononeill.dev" },
  },
];

export const FEATURED_PROJECTS = PROJECTS.filter((p) => p.featured);
