import { useSyncExternalStore } from "react";
import { readGuidePrefs, writeGuidePrefs } from "@/lib/guide/prefs";

/**
 * The guide's voice: a run of short, pitched chirps for each line it says,
 * one per syllable, synthesised with the Web Audio API (no audio files).
 *
 * On by default; the visitor can turn it off in the customizer. Browsers only
 * let a page make sound after a click or key press, so a line said before that
 * (the greeting on load) is held and said on the first click, if it is recent.
 */

/** Loudness of the whole voice, 0 to 1. */
const VOLUME = 0.22;
/** The guide's speaking pitch, in Hz. */
const BASE_PITCH = 560;
/** Semitone steps the chirps are picked from (a pentatonic scale, so it always sounds friendly). */
const SCALE = [0, 2, 4, 7, 9, 12];
const BLIP_S = 0.055;
const SYLLABLE_GAP_S = 0.022;
const WORD_GAP_S = 0.035;
const PUNCT_GAP_S = 0.13;
/** Long lines are summarised: the voice stops after this many chirps. */
const MAX_BLIPS = 18;
/** A line held for the first click is still said if it is at most this old. */
const PENDING_MS = 6000;

let enabled: boolean | null = null;
const listeners = new Set<() => void>();

function isEnabled() {
  if (enabled === null) enabled = typeof window !== "undefined" && readGuidePrefs().voice;
  return enabled;
}

export function setGuideVoice(on: boolean) {
  enabled = on;
  writeGuidePrefs({ voice: on });
  listeners.forEach((listener) => listener());
  // Called from a click: the moment the browser allows audio to start.
  if (on) {
    void unlock().then(() => speak("Hi! This is how I sound."));
  } else {
    pending = null;
    hushVoice();
  }
}

export function useGuideVoice() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    isEnabled,
    () => false
  );
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let current: GainNode | null = null;
/** A line said before the browser allowed sound, waiting for the first click. */
let pending: { text: string; at: number } | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = VOLUME;
    master.connect(ctx.destination);
  }
  return ctx;
}

function unlock(): Promise<void> {
  const context = audio();
  if (context && context.state !== "running") return context.resume().catch(() => {});
  return Promise.resolve();
}

/** Whether the visitor has clicked or typed yet (the browser's condition for sound). */
function activated() {
  const activation = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
  return activation ? activation.hasBeenActive : ctx !== null;
}

// Start the audio on the visitor's first clicks and keys, then say any line held for it.
if (typeof window !== "undefined") {
  const onGesture = () => {
    if (!isEnabled()) return;
    void unlock().then(() => {
      if (ctx?.state !== "running") return;
      window.removeEventListener("pointerdown", onGesture, true);
      window.removeEventListener("keydown", onGesture, true);
      const held = pending;
      pending = null;
      if (held && performance.now() - held.at < PENDING_MS) speak(held.text);
    });
  };
  window.addEventListener("pointerdown", onGesture, true);
  window.addEventListener("keydown", onGesture, true);
}

/** Stops the line being said, with a short fade so it doesn't click. */
export function hushVoice() {
  if (!ctx || !current) return;
  const gain = current;
  current = null;
  const now = ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(0, now + 0.03);
  window.setTimeout(() => gain.disconnect(), 80);
}

/** Says a line: replaces whatever the guide was saying. */
export function speak(text: string) {
  if (!isEnabled() || typeof document === "undefined" || document.hidden) return;
  // No click yet: creating the audio now would only be refused. Hold the line.
  if (!activated()) {
    pending = { text, at: performance.now() };
    return;
  }
  const context = audio();
  if (!context || !master) return;
  if (context.state !== "running") {
    pending = { text, at: performance.now() };
    void unlock();
    return;
  }
  pending = null;
  hushVoice();

  const voice = context.createGain();
  voice.connect(master);
  current = voice;

  const blips = syllables(text);
  const question = /\?\s*$/.test(text);
  const excited = /!\s*$/.test(text);
  let t = context.currentTime + 0.02;
  blips.forEach((blip, i) => {
    let step = SCALE[blip.seed % SCALE.length];
    if (excited) step += 2;
    // A question ends on a rise.
    if (question && i >= blips.length - 2) step += 5 + (i - blips.length + 2) * 3;
    chirp(context, voice, BASE_PITCH * Math.pow(2, step / 12), t);
    t += BLIP_S + (blip.pause === "punct" ? PUNCT_GAP_S : blip.pause === "word" ? WORD_GAP_S : SYLLABLE_GAP_S);
  });
  const end = (t - context.currentTime) * 1000 + 100;
  window.setTimeout(() => {
    if (current === voice) current = null;
    voice.disconnect();
  }, end);
}

function chirp(context: AudioContext, out: AudioNode, pitch: number, at: number) {
  const osc = context.createOscillator();
  const env = context.createGain();
  osc.type = "triangle";
  // A quick downward glide makes it sound like a little voice, not a beep.
  osc.frequency.setValueAtTime(pitch * 1.18, at);
  osc.frequency.exponentialRampToValueAtTime(pitch, at + BLIP_S * 0.6);
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(1, at + 0.006);
  env.gain.exponentialRampToValueAtTime(0.0001, at + BLIP_S);
  osc.connect(env);
  env.connect(out);
  osc.start(at);
  osc.stop(at + BLIP_S + 0.02);
}

type Blip = { seed: number; pause: "syllable" | "word" | "punct" };

/** One blip per rough syllable (a run of vowels), with the pause that follows it. */
function syllables(text: string): Blip[] {
  const blips: Blip[] = [];
  const words = text.match(/[\p{L}\p{N}']+[.,!?;:]*/gu) ?? [];
  for (const word of words) {
    const letters = word.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
    const groups = letters.match(/[aeiouy]+/g)?.length ?? 1;
    const count = Math.max(1, Math.min(groups, 3));
    const punct = /[.,!?;:]$/.test(word);
    for (let i = 0; i < count; i++) {
      const code = letters.charCodeAt(Math.floor((i * letters.length) / count)) || 0;
      const last = i === count - 1;
      blips.push({ seed: code + i, pause: last ? (punct ? "punct" : "word") : "syllable" });
      if (blips.length >= MAX_BLIPS) return blips;
    }
  }
  return blips;
}
