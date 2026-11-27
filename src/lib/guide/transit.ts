/**
 * The guide stepping off the page to play: it comes to the cursor when the
 * games menu opens, talks while the visitor picks, flies into the game they
 * click, and goes home again when the game closes (or the menu does, unused).
 *
 * `GuideTransit` draws and moves it (above every dialog) and registers the
 * controller below; the games menu and dialog call `guideVisit`.
 */

import { useSyncExternalStore } from "react";
import { holdGuideShape } from "@/lib/guide/shape";

export type Rect = { x: number; y: number; width: number; height: number };
export type Point = { x: number; y: number };

export interface GuideVisitController {
  /** Come to this point (the cursor) and say this; later calls just move it and change the line. */
  summon(point: Point, line: string): void;
  /** Follow the cursor while summoned. */
  follow(point: Point): void;
  /** Change what it is saying. */
  say(line: string): void;
  /** Say this with a random happy reaction: the visitor is pointing at a game. */
  cheer(line: string): void;
  /** A game was picked: stay put until `into` takes it there (the menu closing must not send it home). */
  commit(): void;
  /** Go home, unless it is on its way into a game (`force`: even then, the game was closed first). */
  dismiss(force?: boolean): void;
  /** Fly into a game, landing on `target`; resolves when it has landed. It stays away from the page. */
  into(target: Rect): Promise<void>;
  /** Fly from `from` (its spot in a game) back home, then show the page's guide again. */
  home(from: Rect | null): Promise<void>;
  /** Out with the visitor right now: at the cursor, or committed to a game. */
  isVisiting(): boolean;
}

let controller: GuideVisitController | null = null;

export function registerGuideVisit(next: GuideVisitController | null) {
  controller = next;
}

/** Safe to call before the transit layer has mounted: it just does nothing (or resolves at once). */
export const guideVisit: GuideVisitController = {
  summon: (point, line) => controller?.summon(point, line),
  follow: (point) => controller?.follow(point),
  say: (line) => controller?.say(line),
  cheer: (line) => controller?.cheer(line),
  commit: () => controller?.commit(),
  dismiss: (force) => controller?.dismiss(force),
  into: (target) => controller?.into(target) ?? Promise.resolve(),
  home: (from) => controller?.home(from) ?? Promise.resolve(),
  isVisiting: () => controller?.isVisiting() ?? false,
};

/**
 * The hand-over home: the flying guide and the page's guide are two drawings of
 * one character. For the moment they swap, both face straight ahead, so they
 * are in the same pose and the swap can't be seen.
 */
let handover = false;
const handoverListeners = new Set<() => void>();

export function setGuideHandover(on: boolean) {
  if (handover === on) return;
  handover = on;
  handoverListeners.forEach((listener) => listener());
}

export function useGuideHandover() {
  return useSyncExternalStore(
    (listener) => {
      handoverListeners.add(listener);
      return () => handoverListeners.delete(listener);
    },
    () => handover,
    () => false,
  );
}

/** While away, the page's guide is hidden (`html[data-guide-away]`, see globals.css). */
export function setGuideAway(away: boolean) {
  holdGuideShape(away);
  const root = document.documentElement;
  if (away) root.dataset.guideAway = "";
  else delete root.dataset.guideAway;
}

const visible = (rect: DOMRect) =>
  rect.width > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;

const toRect = (rect: DOMRect): Rect => ({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });

/**
 * Where the guide is on the page right now: the companion (in the hero, a
 * section's dock or the corner), else the hero's still drawing, else the
 * navbar's gamepad it was called from.
 */
export function guideHomeRect(): Rect | null {
  // The face itself, not the box around it: a flight that ends exactly where the
  // page draws the guide hands over without a jump in size.
  const layer = document.querySelector<HTMLElement>("[data-guide-companion-layer]");
  const face = layer?.querySelector<HTMLElement>("[data-guide-avatar]") ?? layer?.querySelector<HTMLElement>("[data-guide-companion-button]");
  if (layer && face && Number(layer.style.opacity || "1") > 0.5) {
    const rect = face.getBoundingClientRect();
    if (visible(rect)) return toRect(rect);
  }
  const still = document.querySelector<HTMLElement>("[data-guide-hero-avatar] .guide-socket-still") ?? document.querySelector<HTMLElement>("[data-guide-hero-avatar]");
  if (still) {
    const rect = still.getBoundingClientRect();
    if (visible(rect)) return toRect(rect);
  }
  const pad = [...document.querySelectorAll<HTMLElement>('button[aria-label="Play a game"]')].find((node) => visible(node.getBoundingClientRect()));
  return pad ? toRect(pad.getBoundingClientRect()) : null;
}
