/**
 * Elements the guide is allowed to point at and highlight, so a tour step can
 * never ring something that was not designed to be highlighted.
 */
export const GUIDE_HIGHLIGHTS = {
  "hero-proof": "Proof stats in the hero",
  "hero-guide": "The guide in the hero",
  "work-featured": "Featured case studies",
  "experience-intro": "Experience overview",
  "contact-form": "Contact form",
  "about-panel": "About's intro panel",
  "skills-panel": "Skills overview",
  "pillar-services": "Pillar: microservice backends",
  "pillar-enterprise": "Pillar: enterprise systems",
  "pillar-workflows": "Pillar: business workflows",
  "pillar-open-source": "Pillar: open-source .NET",
} as const;

export type GuideHighlight = keyof typeof GUIDE_HIGHLIGHTS;

export const GUIDE_HIGHLIGHT_IDS = Object.keys(GUIDE_HIGHLIGHTS) as GuideHighlight[];

export function isGuideHighlight(value: unknown): value is GuideHighlight {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(GUIDE_HIGHLIGHTS, value);
}

/** CSS selector for a highlight, or for a project card by slug. */
export function guideTargetSelector(target: string) {
  if (target.startsWith("project:")) return `[data-project-slug="${cssEscape(target.slice("project:".length))}"]`;
  return `[data-guide-target="${cssEscape(target)}"]`;
}

function cssEscape(value: string) {
  return value.replace(/[^a-z0-9_-]/gi, "");
}
