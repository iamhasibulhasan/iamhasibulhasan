
import { useSyncExternalStore } from "react";
import { PET_LINES } from "@/lib/guide/hero-lines";
import { speak } from "@/lib/guide/voice";

/**
 * The line the guide is saying right now, shared by every place that shows it (the
 * hero's caption band, the footer's line above the landed the guide). One guide, one
 * voice: whichever surface is on screen shows the same line.
 */
let spoken: string | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let petStreak = 0;
const listeners = new Set<() => void>();

function set(next: string | null, quiet = false) {
  if (spoken === next) return;
  spoken = next;
  if (next && !quiet) speak(next);
  listeners.forEach((listener) => listener());
}

/**
 * Say a line for `ms`, replacing whatever was being said. `quiet` shows it
 * without the voice (the hover line: hovering is petting, and the pet sound is
 * the only sound then).
 */
export function say(text: string, ms = 3200, quiet = false) {
  set(text, quiet);
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => set(null), ms);
}

/** Stop saying anything (a new page: the old line was about the old one). */
export function hush() {
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = null;
  set(null);
}

export function getSpoken() {
  return spoken;
}

/** The next line of the click streak (cycles through `PET_LINES`). */
export function sayPetLine() {
  petStreak = (petStreak % PET_LINES.length) + 1;
  say(PET_LINES[petStreak - 1], 2200);
}

export function useSpoken() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => spoken,
    () => null
  );
}
