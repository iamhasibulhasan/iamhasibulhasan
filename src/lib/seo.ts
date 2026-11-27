import { caseStudies, type CaseStudy } from "@/data/case-studies";

/**
 * What search engines and link previews read for each page: one source for
 * both the HTML the build writes for every route (vite/seo-pages.ts: each page
 * served with its own title, description, canonical link and structured data
 * before any script runs) and the in-app updates as the visitor moves between
 * pages (usePageMeta).
 *
 * SITE_URL: also in index.html and public/robots.txt; change all three for a
 * custom domain.
 */
export const SITE_URL = "https://iamhasibulhasan.vercel.app";
export const SITE_TITLE = "Hasibul Hasan — Software Engineer | .NET Core Developer";
export const SITE_DESCRIPTION =
  "Hasibul Hasan, Software Engineer in Dhaka, Bangladesh: 4.5+ years building scalable backend systems with .NET Core, Entity Framework Core and microservices.";

/** The ids the homepage's structured data (index.html) gives the site and its owner, for other pages to point at. */
const WEBSITE_ID = `${SITE_URL}/#website`;
const PERSON_ID = `${SITE_URL}/#person`;

export type PageMeta = {
  /** "/", "/work", "/work/<slug>"; empty for the not-found page, which has no address of its own. */
  path: string;
  /** The whole <title>. */
  title: string;
  /** At most ~160 characters: search results cut longer ones. */
  description: string;
  /** Kept out of search results (the not-found page). */
  noindex?: boolean;
  /** This page's own structured data, beside the site-wide entries in index.html. */
  jsonLd?: object;
};

export const pageUrl = (path: string) => `${SITE_URL}${path === "/" ? "/" : path}`;
export const pageTitle = (title: string | null) => (title ? `${title} | Hasibul Hasan` : SITE_TITLE);

/** The most a description should be: search results cut longer ones. */
const DESCRIPTION_MAX = 158;

/** Shortened at a word to fit a search result, with an ellipsis. */
function clip(text: string, max = DESCRIPTION_MAX) {
  if (text.length <= max) return text;
  const cut = text.slice(0, text.lastIndexOf(" ", max - 1)).replace(/[\s,;:.–-]+$/, "");
  return `${cut}…`;
}

/** Sentences, in order, as many whole ones as fit a search result (the first always, shortened if it must be). */
function describe(sentences: string[]) {
  const parts = sentences.map((sentence) => sentence.trim()).filter(Boolean);
  let text = clip(parts[0] ?? "");
  for (const part of parts.slice(1)) {
    if (text.length + 1 + part.length > DESCRIPTION_MAX) break;
    text = `${text} ${part}`;
  }
  return text;
}

const breadcrumbs = (trail: { name: string; path: string }[]) => ({
  "@type": "BreadcrumbList",
  itemListElement: trail.map((step, index) => ({ "@type": "ListItem", position: index + 1, name: step.name, item: pageUrl(step.path) })),
});

export const HOME_META: PageMeta = { path: "/", title: SITE_TITLE, description: SITE_DESCRIPTION };

export const WORK_META: PageMeta = {
  path: "/work",
  title: pageTitle("Case Studies"),
  description:
    "Case studies by Hasibul Hasan: an e-commerce inventory microservice, a land sales platform, HR & payroll and an ERP, built with .NET Core and EF Core.",
  jsonLd: {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl("/work")}#page`,
        url: pageUrl("/work"),
        name: "Case Studies",
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": PERSON_ID },
        hasPart: caseStudies.map((study) => ({ "@type": "CreativeWork", name: study.title, url: pageUrl(`/work/${study.slug}`) })),
      },
      breadcrumbs([
        { name: "Home", path: "/" },
        { name: "Case Studies", path: "/work" },
      ]),
    ],
  },
};

export function caseStudyMeta(study: CaseStudy): PageMeta {
  const path = `/work/${study.slug}`;
  return {
    path,
    title: pageTitle(study.title),
    description: describe([study.oneLiner, study.ownershipSummary, study.employer ? `At ${study.employer.replace(/\.$/, "")}.` : "", `Built with ${study.stack.join(", ")}.`]),
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CreativeWork",
          "@id": `${pageUrl(path)}#study`,
          url: pageUrl(path),
          name: study.title,
          headline: study.title,
          description: study.summary,
          author: { "@id": PERSON_ID },
          isPartOf: { "@id": WEBSITE_ID },
          keywords: [...study.stack, ...study.tags].join(", "),
          ...(study.employer ? { sourceOrganization: { "@type": "Organization", name: study.employer } } : {}),
          ...(study.live ? { sameAs: study.live } : {}),
        },
        breadcrumbs([
          { name: "Home", path: "/" },
          { name: "Case Studies", path: "/work" },
          { name: study.title, path },
        ]),
      ],
    },
  };
}

export const NOT_FOUND_META: PageMeta = {
  path: "",
  title: pageTitle("Page not found"),
  description: "This page doesn't exist. Hasibul Hasan's portfolio: Software Engineer building backend systems with .NET Core.",
  noindex: true,
};

/** Each case study's page details, by slug. */
export const CASE_STUDY_META = new Map(caseStudies.map((study) => [study.slug, caseStudyMeta(study)]));

/** Every page there is: what the build writes an HTML file for, and what the sitemap lists. */
export const PAGES: PageMeta[] = [HOME_META, WORK_META, ...CASE_STUDY_META.values()];
