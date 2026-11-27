import { BrickWall, Footprints, Plane, Worm } from "lucide-react";
import { GUIDE_NAME } from "@/lib/guide/identity";

/** The navbar's games: what the hover menu lists and the dialog plays. */
export type GameId = "runner" | "flight" | "trail" | "breaker";

export const GAME_IDS: GameId[] = ["runner", "flight", "trail", "breaker"];

/** One line of a game's controls: the keys (shown as keycaps, "or" between them) and what they do. */
export type Control = { keys: string[]; does: string };

export const GAMES: Record<GameId, { label: string; icon: typeof Plane; title: string; blurb: string; controls: Control[]; goal: string; bestKey: string }> = {
  runner: {
    label: "Runner",
    icon: Footprints,
    title: `${GUIDE_NAME} Runner`,
    blurb: `Dodge the bugs, nulls and failing builds. How far can ${GUIDE_NAME} ship?`,
    controls: [
      { keys: ["Space", "↑"], does: "jump, hold for higher (or tap)" },
      { keys: ["P"], does: "pause" },
    ],
    goal: "Jump the bugs, nulls and red builds, stay low under throw, and grab commits for +25.",
    bestKey: "solvorn-runner-best",
  },
  flight: {
    label: "Flight",
    icon: Plane,
    title: `${GUIDE_NAME} Flight`,
    blurb: `Tap to keep ${GUIDE_NAME} in the air and slip through the open port in every firewall.`,
    controls: [
      { keys: ["Space", "↑"], does: "fly up (or tap)" },
      { keys: ["P"], does: "pause" },
    ],
    goal: "Fly through the open port in each firewall. Commits in a port are worth +3.",
    bestKey: "solvorn-flight-best",
  },
  trail: {
    label: "Trail",
    icon: Worm,
    title: `${GUIDE_NAME} Trail`,
    blurb: `Steer ${GUIDE_NAME} round the grid, eat commits and grow the longest trail of code.`,
    controls: [
      { keys: ["←", "↑", "→", "↓"], does: "steer (or swipe)" },
      { keys: ["Space"], does: "start (or tap)" },
      { keys: ["P"], does: "pause" },
    ],
    goal: "Eat commits to grow your trail; a bug that turns up is worth +50. Don't hit the walls or yourself.",
    bestKey: "solvorn-trail-best",
  },
  breaker: {
    label: "Breaker",
    icon: BrickWall,
    title: `${GUIDE_NAME} Breaker`,
    blurb: `Bounce ${GUIDE_NAME} off the merge bar and break the wall of code smells.`,
    controls: [
      { keys: ["←", "→"], does: "move (or the pointer)" },
      { keys: ["Space"], does: "launch (or tap)" },
      { keys: ["P"], does: "pause" },
    ],
    goal: `Bounce ${GUIDE_NAME} into the code smells and clear the wall. Legacy blocks take two hits; three lives.`,
    bestKey: "solvorn-breaker-best",
  },
};

const LAST_GAME_KEY = "solvorn-last-game";

export function lastGame(): GameId {
  try {
    const saved = localStorage.getItem(LAST_GAME_KEY);
    return GAME_IDS.find((id) => id === saved) ?? "runner";
  } catch {
    return "runner";
  }
}

export function rememberGame(id: GameId) {
  try {
    localStorage.setItem(LAST_GAME_KEY, id);
  } catch {
    /* storage unavailable */
  }
}

/** The saved best score for a game, 0 when it has never been played. */
export function bestScore(id: GameId) {
  try {
    return Number(localStorage.getItem(GAMES[id].bestKey)) || 0;
  } catch {
    return 0;
  }
}
