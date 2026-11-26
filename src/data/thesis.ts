import type { CaseStudySlug } from "@/data/case-studies";

/**
 * The one line the site stands on, and the four pillars that back it.
 * The hero, About, the case studies and the Work section all read this, so the
 * story can't drift between them. Each pillar points at its evidence: a case
 * study, or an external page when no study covers it.
 */
export type PillarId = "services" | "enterprise" | "workflows" | "open-source";

export interface Pillar {
  id: PillarId;
  label: string;
  /** One line: what this pillar claims. */
  claim: string;
  /** The study that proves it, or null when the evidence lives elsewhere. */
  studySlug: CaseStudySlug | null;
  /** External evidence, used when there is no study. */
  href?: string;
  /** The link's label when it goes to `href`. */
  hrefLabel?: string;
}

export const THESIS = "Hasibul builds the .NET Core systems businesses run on.";

export const PILLARS: readonly Pillar[] = [
  {
    id: "services",
    label: "Microservices",
    claim: "Built and maintains the inventory service of a microservice e-commerce platform.",
    studySlug: "cartup-inventory",
  },
  {
    id: "enterprise",
    label: "Enterprise ERP",
    claim: "An ERP for garments, steel and accessories businesses, with analytical reports.",
    studySlug: "erp-system",
  },
  {
    id: "workflows",
    label: "HR workflows",
    claim: "HR and payroll modules: employees, leave, performance and training.",
    studySlug: "people-hub",
  },
  {
    id: "open-source",
    label: "Open source",
    claim: "PatronusR on NuGet: request/response, commands and queries via generic variance.",
    studySlug: null,
    href: "https://www.nuget.org/packages/PatronusR",
    hrefLabel: "See it on NuGet",
  },
];

export const PILLAR_IDS = PILLARS.map((pillar) => pillar.id);

export function pillarById(id: PillarId) {
  return PILLARS.find((pillar) => pillar.id === id)!;
}
