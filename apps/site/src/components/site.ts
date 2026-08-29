/**
 * Site constants for jononeill.dev.
 *
 * Identity for nav, footer, canonical URL, and JSON-LD lives here so those
 * surfaces cannot disagree. The mailbox is stored in parts and assembled in
 * the browser on demand. Do not join the parts in this file.
 */

export const SITE = {
  origin: "https://jononeill.dev",
  domain: "jononeill.dev",
  name: "Jon ONeill",
  legalName: "Jon ONeill",
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

  phone: "928.499.8446",
  phoneHref: "tel:+19284998446",

  resumeHref: "/Jon-ONeill-Director-of-Product.pdf",
  resumeName: "Jon-ONeill-Director-of-Product.pdf",
} as const;

/** Split mailbox parts. Never concatenate in server-rendered HTML. */
export const EMAIL_USER = "jon.oneill.m";
export const EMAIL_HOST = "gmail.com";

export const NAV_LINKS = [
  { label: "Work", href: "/work/" },
  { label: "Experience", href: "/experience/" },
  { label: "About", href: "/about/" },
  { label: "Resume", href: SITE.resumeHref },
  { label: "Contact", href: "/contact/" },
] as const;

export function personSchema() {
  return {
    "@type": "Person",
    "@id": `${SITE.origin}/#person`,
    name: SITE.name,
    url: `${SITE.origin}/`,
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
