import type { TourStep } from "@/lib/guide/tour";
import { TOUR_STEPS } from "@/lib/guide/tour";

/**
 * Visitor paths: the same scripted tour, ordered and worded for who is
 * reading. Fixed lines, so a path says the same true things to every visitor.
 * Every step points at a section and highlight that already exist.
 */
export const VISITOR_IDS = ["default", "recruiter", "hiring-manager", "engineer"] as const;
export type VisitorId = (typeof VISITOR_IDS)[number];

export function isVisitorId(value: unknown): value is VisitorId {
  return typeof value === "string" && (VISITOR_IDS as readonly string[]).includes(value);
}

export type VisitorPath = {
  id: VisitorId;
  /** On the chooser button. */
  label: string;
  /** Under the label: what the path covers. */
  blurb: string;
  steps: TourStep[];
};

const step = (id: string) => {
  const found = TOUR_STEPS.find((each) => each.id === id);
  if (!found) throw new Error(`Unknown tour step: ${id}`);
  return found;
};

export const VISITOR_PATHS: Record<VisitorId, VisitorPath> = {
  default: {
    id: "default",
    label: "The 60-second tour",
    blurb: "Figures, career, case studies, toolkit and contact.",
    steps: TOUR_STEPS,
  },
  recruiter: {
    id: "recruiter",
    label: "Recruiter",
    blurb: "Role, experience and how to reach him.",
    steps: [
      step("proof"),
      step("experience"),
      { ...step("skills"), line: "The stack he has worked in, grouped the way a job description is." },
      step("contact"),
    ],
  },
  "hiring-manager": {
    id: "hiring-manager",
    label: "Hiring manager",
    blurb: "What he built, where, and what was his.",
    steps: [
      step("proof"),
      { ...step("experience"), line: "Each role, and the system he worked on there, oldest first." },
      step("featured"),
      step("contact"),
    ],
  },
  engineer: {
    id: "engineer",
    label: "Engineer",
    blurb: "The systems, the stack, and the case studies.",
    steps: [
      step("featured"),
      step("skills"),
      step("experience"),
      step("contact"),
    ],
  },
};

export function stepsFor(id: VisitorId | null | undefined) {
  return VISITOR_PATHS[id ?? "default"]?.steps ?? TOUR_STEPS;
}
