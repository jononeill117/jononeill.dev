/**
 * Site constants for jononeill.dev.
 *
 * One place the shell reads identity from so nav, footer, canonical URL,
 * and JSON-LD cannot disagree.
 */

export const SITE = {
  origin: "https://jononeill.dev",
  domain: "jononeill.dev",
  name: "Jon ONeill",
  legalName: "Jon ONeill",
  email: "jon.oneill.m@gmail.com",
  wordmark: "jononeill",
  wordmarkSuffix: ".dev",

  description:
    "Personal site for Jon ONeill. Product, operations, and analytics. Phoenix, AZ.",

  locality: ["Phoenix, Arizona", "United States"],

  practice:
    "Product, operations, and analytics. Currently Director of Operations at Zoom Drain Phoenix.",

  categories: ["Product", "Operations", "Analytics"],

  postal: {
    locality: "Phoenix",
    region: "AZ",
    country: "US",
  },

  linkedin: "https://www.linkedin.com/in/jon-oneill-020196",
} as const;

export function personSchema() {
  return {
    "@type": "Person",
    "@id": `${SITE.origin}/#person`,
    name: SITE.name,
    url: `${SITE.origin}/`,
    email: SITE.email,
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
