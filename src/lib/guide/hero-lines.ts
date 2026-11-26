import { GUIDE_NAME, OWNER_FIRST_NAME } from "@/lib/guide/identity";

/**
 * What the guide says in the hero avatar's speech bubble. Short, first person
 * for the guide (Hasibul is "he"), dry rather than cute, and only true
 * things. Picked by what just happened, so it reads as a reaction rather than
 * a rotating banner.
 */
export function greetingFor(hour: number) {
  // Kept short enough to sit on one line under the hero.
  if (hour < 5) return `Up late? I'm ${GUIDE_NAME}, ${OWNER_FIRST_NAME}'s guide.`;
  if (hour < 12) return `Morning! I'm ${GUIDE_NAME}, ${OWNER_FIRST_NAME}'s guide.`;
  if (hour < 17) return `Hi, I'm ${GUIDE_NAME}, ${OWNER_FIRST_NAME}'s guide.`;
  return `Evening! I'm ${GUIDE_NAME}, ${OWNER_FIRST_NAME}'s guide.`;
}

/** Lines for the click streak, in the same order as `PET_STREAK`. */
export const PET_LINES = [
  "That's not a documented endpoint.",
  "Noted. Logging it.",
  "You found the undocumented feature.",
  "Compiled, tested, still clickable.",
  "Still within rate limits. Barely.",
  "Achievement unlocked: persistent clicker.",
];

export const DIZZY_LINE = "Too many requests. Rate-limiting myself.";
export const HOVER_LINE = "Hi! Click me, or take the tour.";
export const BORED_LINE = "Still there? The case studies are right below.";
export const ASLEEP_LINE = "Idle. Move the mouse to resume.";
export const WAKE_LINE = "Back online. Where were we?";
