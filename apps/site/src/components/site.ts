/**
 * Site constants for jononeill.dev.
 *
 * One place the shell reads identity from so nav, footer, canonical URL,
 * and JSON-LD cannot disagree.
 */

export const SITE = {
  origin: "https://jononeill.dev",
  domain: "jononeill.dev",
  name: "Jon O'Neill",
  legalName: "Jon O'Neill",
  wordmark: "jononeill",
  wordmarkSuffix: ".dev",

  resume: "/Jon-ONeill-Director-of-Product.pdf",

  jobTitle: "Product leader",

  description:
    "Seven years across product, operations, and analytics. Zillow, HomeLight, Stoa, Livable, Zoom Drain. Phoenix, AZ.",

  locality: ["Phoenix, Arizona", "United States"],

  practice:
    "Product management. Zero to one SaaS, pricing and underwriting platforms, data and machine learning, and the go to market that has to follow.",

  categories: ["Product", "Pricing and underwriting", "Data and ML", "Go to market"],

  postal: {
    locality: "Phoenix",
    region: "AZ",
    country: "US",
  },

  linkedin: "https://www.linkedin.com/in/jon-oneill-020196",
} as const;

/** Split mailbox parts. Assembled on click. Never emit the joined address in HTML. */
export const EMAIL_USER = "jon.oneill.m";
export const EMAIL_HOST = "gmail.com";

export const NAV_LINKS = [
  { label: "Experience", href: "#experience" },
  { label: "Portfolio", href: "#ecclesio" },
  { label: "About", href: "#about" },
  { label: "Resume", href: "#resume", resume: true },
  { label: "Contact", href: "#contact" },
] as const;

export function personSchema() {
  return {
    "@type": "Person",
    "@id": `${SITE.origin}/#person`,
    name: SITE.name,
    url: `${SITE.origin}/`,
    jobTitle: SITE.jobTitle,
    description: SITE.description,
    address: {
      "@type": "PostalAddress",
      addressLocality: SITE.postal.locality,
      addressRegion: SITE.postal.region,
      addressCountry: SITE.postal.country,
    },
    sameAs: [SITE.linkedin],
  };
}

export function webSiteSchema() {
  return {
    "@type": "WebSite",
    "@id": `${SITE.origin}/#website`,
    url: `${SITE.origin}/`,
    name: SITE.name,
    inLanguage: "en",
    publisher: { "@id": `${SITE.origin}/#person` },
  };
}
