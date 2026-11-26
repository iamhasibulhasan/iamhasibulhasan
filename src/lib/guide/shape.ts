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
const listeners = new Set<() => void>();

function emit() {
  snapshot = { shape, spinAt };
  listeners.forEach((listener) => listener());
}

function schedule() {
  const [min, max] = CHANGE_EVERY_MS;
  timer = window.setTimeout(() => {
    // Not while nobody is looking, or while it dozes (a sleeping guide doesn't spin).
    if (document.hidden || getIdleStage() >= 2 || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
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

const serverSnapshot = { shape: "round" as GuideShape, spinAt: 0 };

export function useGuideShape() {
  return useSyncExternalStore(subscribe, () => snapshot, () => serverSnapshot);
}
