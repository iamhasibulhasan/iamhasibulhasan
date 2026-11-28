import type { TargetAndTransition } from "framer-motion";

/**
 * Solvorn playing with the navbar's H. The one guide (the scroll companion)
 * flies up to the logo, shrinks to its size, plays one of these games around
 * it, and flies back to its spot. The companion moves itself
 * (GuideCompanion); the H reacts on its own (NavLogo), told by
 * `NAV_PLAY_EVENT` the moment the game starts, so the two line up.
 */
export type NavGame = "bump" | "hop" | "spin" | "bite";
export const NAV_GAMES: NavGame[] = ["bump", "hop", "spin", "bite"];

/** Fired on window when a game begins at the logo. Detail: { kind }. */
export const NAV_PLAY_EVENT = "guide:nav-play";

/** Solvorn's size while he plays (px), and the flights there and back (ms). */
export const NAV_PLAY_SIZE = 26;
export const NAV_FLIGHT_MS = 800;

type Track = { x: number[]; y: number[]; times: number[] };

/**
 * Each game: where Solvorn's top-left is, relative to the logo's top-left (px),
 * along the game (times 0..1); how the H reacts; and how long it lasts (s).
 */
export const NAV_PLAYS: Record<NavGame, { seconds: number; solvorn: Track; h: TargetAndTransition }> = {
  // He comes in on the right, bumps the H (it tips and wobbles back), and bounces off.
  bump: {
    seconds: 2.4,
    solvorn: { x: [40, 26, 14, 28, 22, 40], y: [3, 3, 3, -8, 3, 3], times: [0, 0.2, 0.34, 0.5, 0.68, 1] },
    h: {
      rotate: [0, 0, -16, 9, -4, 0], x: [0, 0, -3, 1, 0, 0],
      transition: { duration: 2.4, times: [0, 0.33, 0.42, 0.56, 0.7, 0.84], ease: "easeOut" },
    },
  },
  // He lands on top of the H (it squashes and springs back), then hops off to the side.
  hop: {
    seconds: 2.4,
    solvorn: { x: [3, 3, 3, 3, 16, 36], y: [-30, -22, -19, -30, -16, 3], times: [0, 0.25, 0.38, 0.55, 0.75, 1] },
    h: {
      scaleY: [1, 1, 0.78, 1.08, 0.97, 1], scaleX: [1, 1, 1.12, 0.96, 1.01, 1], y: [0, 0, 3, -1, 0, 0],
      transition: { duration: 2.4, times: [0, 0.27, 0.36, 0.5, 0.62, 0.74], ease: "easeOut" },
    },
  },
  // He leans in from the side and pokes it, the H spins round once, and he backs away.
  spin: {
    seconds: 2.6,
    solvorn: { x: [38, 22, 18, 22, 30, 40], y: [2, 2, 2, 2, 0, 2], times: [0, 0.2, 0.32, 0.42, 0.78, 1] },
    h: {
      rotate: [0, 0, 360, 360], scale: [1, 1, 1.08, 1],
      transition: { duration: 2.6, times: [0, 0.34, 0.68, 0.78], ease: [0.45, 0, 0.25, 1] },
    },
  },
  // He lunges at the top-right corner and takes two chomps (a bite goes missing, the H shakes),
  // backs off with a happy hop, and the bite heals before he leaves. The bite is the `--bite`
  // radius of a hole cut in the H (NavLogo).
  bite: {
    seconds: 2.9,
    solvorn: { x: [40, 21, 31, 19, 34, 34, 44], y: [-8, -5, -7, -4, -6, -16, 0], times: [0, 0.26, 0.36, 0.46, 0.58, 0.7, 1] },
    h: {
      "--bite": ["0px", "0px", "6px", "6px", "10px", "10px", "10px", "0px"],
      rotate: [0, 0, 6, -3, 7, -2, 0, 0],
      transition: { duration: 2.9, times: [0, 0.25, 0.28, 0.44, 0.47, 0.6, 0.82, 1], ease: "easeOut" },
    } as TargetAndTransition,
  },
};

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** Solvorn's offset from the logo at progress `t` (0..1) of a game: eased between its keyframes. */
export function navPlayOffset(kind: NavGame, t: number) {
  const { x, y, times } = NAV_PLAYS[kind].solvorn;
  const k = Math.min(1, Math.max(0, t));
  let i = 0;
  while (i < times.length - 2 && k > times[i + 1]) i++;
  const span = times[i + 1] - times[i] || 1;
  const u = easeInOut((k - times[i]) / span);
  return { x: x[i] + (x[i + 1] - x[i]) * u, y: y[i] + (y[i + 1] - y[i]) * u };
}
