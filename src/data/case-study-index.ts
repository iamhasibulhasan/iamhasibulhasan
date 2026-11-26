import { caseStudies } from "@/data/case-studies";

/** What the command palette searches: each case study's slug, title, tags, stack and aliases. */
export type CaseStudySearchEntry = { slug: string; title: string; tags: string[]; stack: string[]; aliases: string[] };

export const caseStudyIndex: CaseStudySearchEntry[] = caseStudies.map(({ slug, title, tags, stack, aliases }) => ({
  slug,
  title,
  tags,
  stack,
  aliases,
}));
