/**
 * Site constants for jononeill.dev.
 */

export const SITE = {
  origin: "https://jononeill.dev",
  domain: "jononeill.dev",
  name: "Jon O'Neill",
  legalName: "Jon O'Neill",
  email: "jon.oneill.m@gmail.com",
  wordmark: "jononeill",
  wordmarkSuffix: ".dev",

  description:
    "Jon O'Neill. Product, operations, and analytics in Phoenix, AZ. Director of Operations at Zoom Drain Phoenix.",

  locality: ["Phoenix, Arizona", "United States"],

  practice:
    "Product, operations, and analytics. Director of Operations at Zoom Drain Phoenix.",

  categories: ["Product", "Operations", "Analytics"],

  postal: {
    locality: "Phoenix",
    region: "AZ",
    country: "US",
  },

  linkedin: "https://www.linkedin.com/in/jon-oneill-020196",
} as const;

export const WORK = [
  {
    org: "Zoom Drain Phoenix",
    role: "Director of Operations",
    when: "Present",
    summary:
      "Runs day-to-day operations for a high-volume residential and commercial drain service. Focus on throughput, crew coordination, and the systems that keep a field business moving.",
  },
  {
    org: "Livable",
    role: "Head of Product",
    when: "Previous",
    summary:
      "Owned product direction for a housing platform. Shipped roadmaps, instrumented funnels, and kept engineering pointed at outcomes that mattered to residents and operators.",
  },
  {
    org: "HomeLight",
    role: "Product and analytics",
    when: "Earlier",
    summary:
      "Product and analytics work across agent and consumer surfaces in residential real estate.",
  },
  {
    org: "Stoa",
    role: "Product and analytics",
    when: "Earlier",
    summary:
      "Product and analytics for a marketplace business. Measurement, prioritization, and shipping.",
  },
  {
    org: "Zillow",
    role: "Product and analytics",
    when: "Earlier",
    summary:
      "Product and analytics in consumer real estate. Large-scale funnels, experiments, and decision support.",
  },
] as const;

export const FOCUS = [
  {
    title: "Operations that hold under load",
    body: "Field businesses break when handoffs are fuzzy. I design the loops crews and managers actually run, then cut the ones that only look good in a slide.",
  },
  {
    title: "Product with a measurement spine",
    body: "Roadmaps without instrumentation are stories. I pair shipping with the numbers that tell you whether the story is true.",
  },
  {
    title: "Analytics that change the next decision",
    body: "Dashboards are cheap. Decision support is not. I build the views and definitions teams use when they have to choose.",
  },
] as const;

export function personSchema() {
  return {
    "@type": "Person",
    "@id": `${SITE.origin}/#person`,
    name: SITE.name,
    url: `${SITE.origin}/`,
    email: SITE.email,
    description: SITE.description,
    jobTitle: "Director of Operations",
    worksFor: {
      "@type": "Organization",
      name: "Zoom Drain Phoenix",
    },
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
