import type { MetricId } from "@/data/metric-ids";
import type { PillarId } from "@/data/thesis";

export interface CaseStudyDecision {
  choice: string;
  why: string;
  rejected?: string[];
}

export interface CaseStudyResult {
  metric: string;
  label: string;
  /** The `METRICS` entry that records how this was measured, when one exists. */
  metricId?: MetricId;
}

export interface CaseStudySection {
  heading: string;
  body: string;
  points?: string[];
}

/**
 * Index grouping, by the kind of system rather than by employer, so a reader
 * sees the shape of the work first.
 */
export type CaseStudyTheme = "platforms" | "enterprise";

export const CASE_STUDY_THEMES: { id: CaseStudyTheme; label: string; blurb: string }[] = [
  {
    id: "platforms",
    label: "Commerce & platforms",
    blurb: "Backend services behind platforms people buy and sell on.",
  },
  {
    id: "enterprise",
    label: "Enterprise systems",
    blurb: "The systems a business runs its people and operations on.",
  },
];

/**
 * One project, written up. Every field is drafted from the résumé only: a
 * field the résumé doesn't support stays empty, and the page hides it rather
 * than showing a heading with nothing under it.
 */
export interface CaseStudy {
  slug: string;
  kind: "system" | "product";
  theme: CaseStudyTheme;
  /**
   * Shown in the homepage's featured row, a fixed three-column grid.
   * Keep exactly three studies featured; the rest are reached via `/work`.
   */
  featured?: boolean;
  title: string;
  employer?: string;
  /** The live product, when there is a public one. */
  live?: string;
  period: string;
  oneLiner: string;
  summary: string;
  problem: string;
  constraints: string[];
  diagram: null;
  diagramCaption: string;
  decisions: CaseStudyDecision[];
  sections: CaseStudySection[];
  results: CaseStudyResult[];
  stack: string[];
  ownership: string;
  /** One sentence (≤160 chars) of `ownership`, shown near the top of the study. */
  ownershipSummary: string;
  /** Which of the thesis pillars this study is evidence for, if any. */
  pillars?: PillarId[];
  tags: string[];
  /** Extra phrases the command palette matches on, beyond title/slug/tags. */
  aliases: string[];
}

/**
 * Every case-study slug as a literal union, so other data (an experience
 * bullet naming its study) is checked at compile time.
 */
export type CaseStudySlug = "cartup-inventory" | "us-bangla-land-platform" | "people-hub" | "erp-system";

export const CASE_STUDY_SLUGS: CaseStudySlug[] = ["cartup-inventory", "us-bangla-land-platform", "people-hub", "erp-system"];

export const caseStudies: CaseStudy[] = [
  {
    slug: "cartup-inventory",
    kind: "system",
    theme: "platforms",
    featured: true,
    title: "Cartup Inventory Service",
    employer: "Cartup Ltd.",
    live: "https://cartup.com",
    period: "Jul 2023 – Present",
    oneLiner: "The full inventory system of a microservice-based e-commerce platform, run as its own service.",
    summary:
      "Cartup is an online marketplace in Bangladesh, live at cartup.com, selling everything from groceries to phones and appliances, with outside sellers listing through \"Sell with Cartup\". It is built as microservices; Hasibul built its Inventory service, the full inventory system of the platform, and maintains it.",
    problem:
      "Cartup's e-commerce platform is built as microservices, so inventory lives in a service of its own: one service that is the platform's whole inventory system.",
    constraints: [],
    diagram: null,
    diagramCaption: "",
    decisions: [],
    sections: [],
    results: [],
    stack: [".NET Core", "Microservices", "Entity Framework Core", "SQL Server"],
    ownership: "Hasibul built the Inventory service and maintains it.",
    ownershipSummary: "Built the Inventory service and maintains it.",
    pillars: ["services"],
    tags: ["E-commerce", "Marketplace", "Inventory"],
    aliases: ["cartup", "inventory", "stock", "ecommerce", "e-commerce"],
  },
  {
    slug: "us-bangla-land-platform",
    kind: "product",
    theme: "platforms",
    featured: true,
    title: "US Bangla Land Asset Platform",
    period: "Jul 2023 – Present",
    oneLiner: "A platform for buying and selling land property.",
    summary:
      "US Bangla Land Asset Purchase & Sale is a platform for buying and selling land property, built on a .NET Core API with PostgreSQL and Tailwind CSS.",
    problem: "",
    constraints: [],
    diagram: null,
    diagramCaption: "",
    decisions: [],
    sections: [],
    results: [],
    stack: [".NET Core API", "PostgreSQL", "Tailwind CSS"],
    ownership: "",
    ownershipSummary: "",
    pillars: [],
    tags: ["Property", "Marketplace", "API"],
    aliases: ["land", "property", "real estate", "us bangla"],
  },
  {
    slug: "people-hub",
    kind: "system",
    theme: "enterprise",
    featured: true,
    title: "People Hub: HR & Payroll",
    employer: "ERA Infotech Ltd.",
    period: "Nov 2022 – Jul 2023",
    oneLiner: "Key modules of an HR and payroll system: employees, leave, performance and training.",
    summary:
      "People Hub is an HR and payroll system. Hasibul developed four of its key modules, streamlining how the business manages its workforce.",
    problem: "Workforce management (employees, leave, performance and training) needed streamlining in one HR and payroll system.",
    constraints: [],
    diagram: null,
    diagramCaption: "",
    decisions: [],
    sections: [
      {
        heading: "The modules",
        body: "Four key modules of the system, each covering one part of managing a workforce.",
        points: ["Employee Management", "Leave Management", "Performance Management", "Training"],
      },
    ],
    results: [],
    stack: [".NET Core MVC", "Entity Framework Core", "SQL Server"],
    ownership: "Hasibul developed the Employee, Leave, Performance and Training management modules.",
    ownershipSummary: "Developed the Employee, Leave, Performance and Training modules.",
    pillars: ["workflows"],
    tags: ["HR", "Payroll", "Enterprise"],
    aliases: ["hr", "payroll", "people", "leave", "employee"],
  },
  {
    slug: "erp-system",
    kind: "system",
    theme: "enterprise",
    title: "Enterprise Resource Planning (ERP)",
    employer: "Mass Data Ltd.",
    period: "Nov 2021 – Nov 2022",
    oneLiner: "A complete ERP for garments, steel and accessories businesses, with a range of analytical reports.",
    summary:
      "A complete ERP solution for diverse industries (garments, steel and accessories), with a range of analytical reports.",
    problem: "",
    constraints: [],
    diagram: null,
    diagramCaption: "",
    decisions: [],
    sections: [
      {
        heading: "Industries served",
        body: "One ERP solution, built to serve businesses in different industries.",
        points: ["Garments", "Steel", "Accessories"],
      },
      {
        heading: "Reporting",
        body: "A range of analytical reports, built with RDLC.",
      },
    ],
    results: [],
    stack: [".NET Core", "RDLC Reports", "SQL"],
    ownership: "",
    ownershipSummary: "",
    pillars: ["enterprise"],
    tags: ["ERP", "Reporting", "Enterprise"],
    aliases: ["erp", "garments", "steel", "accessories", "reports"],
  },
];

export const caseStudyBySlug = new Map(caseStudies.map((study) => [study.slug, study]));

export const systemCaseStudies = caseStudies.filter((study) => study.kind === "system");

export const productCaseStudies = caseStudies.filter((study) => study.kind === "product");

/** Studies grouped for the `/work` index, in the order themes are declared. */
export const caseStudiesByTheme = CASE_STUDY_THEMES.map((theme) => ({
  ...theme,
  studies: caseStudies.filter((study) => study.theme === theme.id),
})).filter((group) => group.studies.length > 0);

/** The homepage's featured row is a fixed three-column grid, so it shows a curated subset. */
export const featuredCaseStudies = caseStudies.filter((study) => study.featured);

export { getCaseStudyPath } from "@/data/case-study-path";

/**
 * Previous and next in the order `/work` shows them (by theme), so reading on
 * from a study stays inside its group before moving to the next one.
 */
export function getThemeAdjacent(slug: string) {
  const ordered = caseStudiesByTheme.flatMap((group) => group.studies);
  const index = ordered.findIndex((study) => study.slug === slug);
  if (index === -1) return { previous: null, next: null };
  return {
    previous: index > 0 ? ordered[index - 1] : null,
    next: index < ordered.length - 1 ? ordered[index + 1] : null,
  };
}

/** Up to `limit` other studies sharing a pillar or the theme, pillar matches first. */
export function getRelatedCaseStudies(slug: string, limit = 3) {
  const study = caseStudyBySlug.get(slug);
  if (!study) return [];
  const pillars = new Set(study.pillars ?? []);
  return caseStudies
    .filter((other) => other.slug !== slug)
    .map((other) => ({
      other,
      score: (other.pillars ?? []).filter((id) => pillars.has(id)).length * 2 + (other.theme === study.theme ? 1 : 0),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.other);
}
