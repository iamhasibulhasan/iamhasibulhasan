import type { AvatarCue } from "@/lib/guide/types";
import type { GuideHighlight } from "@/lib/guide/targets";

export type TourStep = {
  id: string;
  /** Section to scroll to. */
  href: string;
  /** Element to ring once there. */
  highlight?: GuideHighlight;
  title: string;
  /** One line, 140 characters or fewer. */
  line: string;
  cue: AvatarCue;
};

/**
 * The scripted 60-second tour. Fixed lines, so it says exactly the same true
 * things to every visitor.
 */
export const TOUR_STEPS: TourStep[] = [
  {
    id: "proof",
    href: "#hero",
    highlight: "hero-proof",
    title: "The numbers first",
    line: "Each figure links to the part of the site that backs it. All of it comes from his résumé.",
    cue: { state: "proud", face: "happy" },
  },
  {
    id: "experience",
    href: "#experience",
    highlight: "experience-intro",
    title: "How he got here",
    line: "From an ERP at his first job to the inventory service of an e-commerce platform, all on .NET Core.",
    cue: { state: "reading", face: "calm" },
  },
  {
    id: "featured",
    href: "#work",
    highlight: "work-featured",
    title: "Three case studies",
    line: "Microservice e-commerce, a land property platform, and HR and payroll: the systems he has built.",
    cue: { state: "reading", face: "inspecting" },
  },
  {
    id: "skills",
    href: "#skills",
    highlight: "skills-panel",
    title: "The toolkit",
    line: ".NET Core and Entity Framework Core first, with the databases and frontend tools around them.",
    cue: { state: "curious", face: "calm" },
  },
  {
    id: "contact",
    href: "#contact",
    highlight: "contact-form",
    title: "Say hello",
    line: "If any of this fits what you're building, this form goes straight to Hasibul.",
    cue: { state: "happy", face: "happy" },
  },
];
