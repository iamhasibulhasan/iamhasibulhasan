import { useSyncExternalStore } from "react";
import { getIdleStage } from "@/lib/guide/store";

/**
 * The guide's shape. Now and then, at random, it changes: it spins, and
 * halfway round it turns from its round robot self into its original square
 * self, or back. One shape for every avatar on the page (one guide).
 *
 * Read with `useGuideShape()`: `shape` is what to draw; `spinAt` changes when a
 * change begins, so each avatar can start its spin then (the shape follows
 * `SPIN_LEAD_MS` later, mid-spin, so the switch happens while it is turning).
 */
export type GuideShape = "round" | "square";

/** How long between changes: a random wait in this range. */
const CHANGE_EVERY_MS = [25_000, 60_000] as const;
/** From the start of the spin to the moment the shape switches. */
export const SPIN_LEAD_MS = 260;

let shape: GuideShape = "round";
let spinAt = 0;
let snapshot: { shape: GuideShape; spinAt: number } = { shape, spinAt };
let timer = 0;
let swap = 0;
let held = false;
const listeners = new Set<() => void>();

function emit() {
  snapshot = { shape, spinAt };
  listeners.forEach((listener) => listener());
}

function schedule() {
  const [min, max] = CHANGE_EVERY_MS;
  window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    // Not while it is away (see holdGuideShape), while nobody is looking, or while it
    // dozes (a sleeping guide doesn't spin).
    if (held || document.hidden || getIdleStage() >= 2 || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      schedule();
      return;
    }
    spinAt = Date.now();
    emit();
    swap = window.setTimeout(() => {
      shape = shape === "round" ? "square" : "round";
      emit();
      schedule();
    }, SPIN_LEAD_MS);
  }, min + Math.random() * (max - min));
}

function subscribe(listener: () => void) {
  if (listeners.size === 0 && typeof window !== "undefined") schedule();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.clearTimeout(timer);
      window.clearTimeout(swap);
    }
  };
}

/**
 * While the guide is away from its place (at the games menu, flying, inside a
 * game) it keeps the shape it left in: a game draws it in that shape, and it
 * comes home in it. Once home, the next change is a fresh random wait away, so
 * it never changes the moment it lands.
 */
export function holdGuideShape(on: boolean) {
  if (held === on) return;
  held = on;
  if (!on && listeners.size > 0) schedule();
}

/** The shape now, for drawing outside React (the games' canvas). */
export function getGuideShape(): GuideShape {
  return shape;
}

const serverSnapshot = { shape: "round" as GuideShape, spinAt: 0 };

export function useGuideShape() {
  return useSyncExternalStore(subscribe, () => snapshot, () => serverSnapshot);
}
