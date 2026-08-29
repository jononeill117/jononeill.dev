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
  /**
   * Used for mailto hrefs and JSON-LD only. The address is never printed as
   * visible copy on a page; pages carry a "Show email" control instead.
   */
  email: "jon.oneill.m@gmail.com",
  wordmark: "jononeill",
  wordmarkSuffix: ".dev",

  /** Asset path. The PDF itself is wired separately. */
  resume: "/jon-oneill-resume.pdf",

  jobTitle: "Product Manager",

  description:
    "Product manager. Zero to one SaaS at Livable, the underwriting platform at Stoa, acquisitions models at HomeLight and Zillow. Phoenix, AZ.",

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

  phone: "928.499.8446",
  phoneHref: "tel:+19284998446",
} as const;

export const NAV_LINKS = [
  { label: "Work", href: "/#work" },
  { label: "Experience", href: "/experience/" },
  { label: "About", href: "/about/" },
  { label: "Contact", href: "/contact/" },
] as const;

export function personSchema() {
  return {
    "@type": "Person",
    "@id": `${SITE.origin}/#person`,
    name: SITE.name,
    url: `${SITE.origin}/`,
    jobTitle: SITE.jobTitle,
    email: SITE.email,
    telephone: SITE.phoneHref.replace("tel:", ""),
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
