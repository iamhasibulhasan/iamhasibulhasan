/** One-line, section-aware remarks from the guide, shown in its bubble. Rationed by `bubble-policy`. */
export const SECTION_TIPS: Record<string, string> = {
  about: "The figures here link to where they come from. The timeline is next.",
  work: "Each card opens a case study: the problem, the stack, and what was his.",
  experience: "Oldest first: school, then three companies, ending at his current role.",
  skills: "Highlighted skills link to the project that used them.",
  contact: "The form goes straight to Hasibul's inbox. WhatsApp works too.",
};

export const TIP_RULES = {
  /** How long a section must hold the screen before its tip shows. */
  dwellMs: 2500,
  /** Minimum gap between two tips. */
  gapMs: 20_000,
  /** Tips per session, at most. */
  maxPerSession: 3,
  /** How long a tip stays up when not hovered or focused. */
  showMs: 6000,
};

/** What the guide says in a section's dock while it rests there and has nothing else to say. Short: one line beside the socket. */
export const DOCK_PROMPTS: Record<string, string> = {
  about: "The short version of who he is.",
  experience: "Three companies, one stack.",
  skills: "Highlighted ones link to real work.",
  work: "Pick a card to read the case study.",
  contact: "The form lands in his inbox.",
};
