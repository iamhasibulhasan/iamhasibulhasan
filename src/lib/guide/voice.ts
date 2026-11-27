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

/**
 * A soft cartoon snore for the sleep screen: a rattly, low "zzz" breathing in,
 * then a quiet whistle breathing out. Same switch and volume as the voice.
 * Never plays before the visitor has clicked (the browser wouldn't allow it).
 */
export function snore() {
  if (!isEnabled() || typeof document === "undefined" || document.hidden || !ctx || !master || ctx.state !== "running") return;
  const context = ctx;
  const t = context.currentTime + 0.02;

  // Breathing in: filtered noise, with a fast wobble for the rattle.
  const breathIn = noiseSource(context, 1.3);
  const band = context.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 220;
  band.Q.value = 1.4;
  const breath = context.createGain();
  breath.gain.setValueAtTime(0.0001, t);
  breath.gain.exponentialRampToValueAtTime(2.4, t + 0.75);
  breath.gain.exponentialRampToValueAtTime(0.0001, t + 1.25);
  const rattle = context.createGain();
  rattle.gain.value = 0.6;
  const lfo = context.createOscillator();
  lfo.frequency.value = 26;
  const depth = context.createGain();
  depth.gain.value = 0.4;
  lfo.connect(depth);
  depth.connect(rattle.gain);
  breathIn.connect(band);
  band.connect(rattle);
  rattle.connect(breath);
  breath.connect(master);
  breathIn.start(t);
  breathIn.stop(t + 1.3);
  lfo.start(t);
  lfo.stop(t + 1.3);

  // Breathing out: a small falling whistle.
  const out = context.createOscillator();
  out.type = "sine";
  const sigh = context.createGain();
  const at = t + 1.45;
  out.frequency.setValueAtTime(680, at);
  out.frequency.exponentialRampToValueAtTime(430, at + 0.7);
  sigh.gain.setValueAtTime(0.0001, at);
  sigh.gain.exponentialRampToValueAtTime(0.3, at + 0.12);
  sigh.gain.exponentialRampToValueAtTime(0.0001, at + 0.75);
  out.connect(sigh);
  sigh.connect(master);
  out.start(at);
  out.stop(at + 0.8);
}

/**
 * The slap that wakes the guide: a sharp crack of noise with a low thump under
 * it. Called from the click itself, so it can start the audio if needed.
 */
export async function slapSound() {
  if (!isEnabled() || typeof document === "undefined") return;
  await unlock();
  if (!ctx || !master || ctx.state !== "running") return;
  const context = ctx;
  const t = context.currentTime + 0.005;
  const crack = noiseSource(context, 0.2);
  const high = context.createBiquadFilter();
  high.type = "highpass";
  high.frequency.value = 1400;
  const crackGain = context.createGain();
  crackGain.gain.setValueAtTime(2.2, t);
  crackGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  crack.connect(high);
  high.connect(crackGain);
  crackGain.connect(master);
  crack.start(t);
  crack.stop(t + 0.2);
  const thump = context.createOscillator();
  thump.type = "sine";
  thump.frequency.setValueAtTime(180, t);
  thump.frequency.exponentialRampToValueAtTime(60, t + 0.12);
  const thumpGain = context.createGain();
  thumpGain.gain.setValueAtTime(1.2, t);
  thumpGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
  thump.connect(thumpGain);
  thumpGain.connect(master);
  thump.start(t);
  thump.stop(t + 0.16);
}

/** White noise, for the breathing and the slap. */
function noiseSource(context: AudioContext, seconds: number) {
  const length = Math.floor(context.sampleRate * seconds);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  const source = context.createBufferSource();
  source.buffer = buffer;
  return source;
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

/**
 * Short sound effects for the games, in the same voice (and muted with
 * it from the customizer): a rising hop, a bright pick-up, a falling crash.
 */
export function gameSound(kind: "jump" | "collect" | "crash") {
  if (!isEnabled()) return;
  const context = audio();
  if (!context || !master) return;
  if (context.state !== "running") void unlock();
  const at = context.currentTime + 0.01;
  const osc = context.createOscillator();
  const env = context.createGain();
  const shape = {
    jump: { type: "triangle" as OscillatorType, from: 360, to: 720, length: 0.12, level: 0.5 },
    collect: { type: "sine" as OscillatorType, from: 880, to: 1320, length: 0.14, level: 0.45 },
    crash: { type: "sawtooth" as OscillatorType, from: 300, to: 70, length: 0.32, level: 0.35 },
  }[kind];
  osc.type = shape.type;
  osc.frequency.setValueAtTime(shape.from, at);
  osc.frequency.exponentialRampToValueAtTime(shape.to, at + shape.length);
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(shape.level, at + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0001, at + shape.length);
  osc.connect(env);
  env.connect(master);
  osc.start(at);
  osc.stop(at + shape.length + 0.02);
}

/**
 * Being petted: a soft bubbly "bloop", a touch different each time; a giggle
 * is three quick bloops going up. Same switch and volume as the voice.
 * Petting is a hover, which can't start audio by itself: it is heard once the
 * visitor has clicked or typed anywhere, and silent until then.
 */
export function petSound(kind: "pet" | "giggle") {
  if (!isEnabled() || typeof document === "undefined" || document.hidden || !activated()) return;
  const context = audio();
  if (!context || !master) return;
  if (context.state !== "running") {
    void unlock();
    return;
  }
  const t = context.currentTime + 0.01;
  const out = master;
  if (kind === "giggle") {
    [0, 1, 2].forEach((i) => bloop(context, out, t + i * 0.075, 430 + i * 120, 0.42));
    return;
  }
  bloop(context, out, t, 380 + Math.random() * 60, 0.5);
}

/** A bubble popping: a quick upward sweep of a pure tone, gone in a blink. */
function bloop(context: AudioContext, out: AudioNode, at: number, from: number, level: number) {
  const osc = context.createOscillator();
  const env = context.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(from, at);
  osc.frequency.exponentialRampToValueAtTime(from * 2.6, at + 0.07);
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(level, at + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, at + 0.14);
  osc.connect(env);
  env.connect(out);
  osc.start(at);
  osc.stop(at + 0.16);
}

/** The games menu's hover sounds, one per game (see GAMES in components/game/games.ts). */
export type MenuSound = "hop" | "whoosh" | "blip" | "tock";

/**
 * A little sound for a game in the games menu, when its icon is pointed at: a
 * springy hop-hop (Runner), a soft wing whoosh (Flight), a retro blip-blip
 * (Trail), a ball knocking on bricks (Breaker). Each is re-pitched a touch
 * every time, so pointing at it again is never an exact repeat. Quiet, on the
 * voice's switch, and (a hover can't start audio) heard once the visitor has
 * clicked or typed anywhere.
 */
export function menuSound(kind: MenuSound) {
  if (!isEnabled() || typeof document === "undefined" || document.hidden || !activated()) return;
  const context = audio();
  if (!context || !master) return;
  if (context.state !== "running") {
    void unlock();
    return;
  }
  const t = context.currentTime + 0.01;
  const k = 0.94 + Math.random() * 0.12;
  const out = master;
  switch (kind) {
    case "hop":
      tone(context, out, "triangle", 300 * k, 640 * k, t, 0.09, 0.38);
      tone(context, out, "triangle", 420 * k, 900 * k, t + 0.1, 0.08, 0.28);
      break;
    case "whoosh": {
      const air = noiseSource(context, 0.3);
      const band = context.createBiquadFilter();
      band.type = "bandpass";
      band.Q.value = 0.9;
      band.frequency.setValueAtTime(500 * k, t);
      band.frequency.exponentialRampToValueAtTime(2400 * k, t + 0.2);
      const env = context.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(0.55, t + 0.07);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
      air.connect(band);
      band.connect(env);
      env.connect(out);
      air.start(t);
      air.stop(t + 0.3);
      tone(context, out, "sine", 520 * k, 860 * k, t + 0.02, 0.16, 0.12);
      break;
    }
    case "blip":
      tone(context, out, "square", 660 * k, 660 * k, t, 0.05, 0.1);
      tone(context, out, "square", 990 * k, 990 * k, t + 0.065, 0.06, 0.1);
      break;
    case "tock":
      tone(context, out, "triangle", 900 * k, 320 * k, t, 0.045, 0.5);
      tone(context, out, "triangle", 760 * k, 260 * k, t + 0.09, 0.045, 0.36);
      break;
  }
}

/** One short note gliding `from` → `to` Hz, with a quick attack and a fade. */
function tone(context: AudioContext, out: AudioNode, type: OscillatorType, from: number, to: number, at: number, length: number, level: number) {
  const osc = context.createOscillator();
  const env = context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, at);
  osc.frequency.exponentialRampToValueAtTime(to, at + length);
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(level, at + 0.006);
  env.gain.exponentialRampToValueAtTime(0.0001, at + length);
  osc.connect(env);
  env.connect(out);
  osc.start(at);
  osc.stop(at + length + 0.02);
}

/**
 * Changing shape: a cute robotic "vrooo-rooom", a little sports engine timed to
 * the spin. It revs up, dips through a quick gear change, revs again and
 * settles: a rumbly saw with a robotic fifth above it, through a resonant
 * filter that opens with the revs, pulsing like an engine's beat. Once per
 * change, on the voice's switch, and only once the visitor has clicked or typed.
 */
export function shapeSound() {
  if (!isEnabled() || typeof document === "undefined" || document.hidden || !activated()) return;
  const context = audio();
  if (!context || !master) return;
  if (context.state !== "running") {
    void unlock();
    return;
  }
  const t = context.currentTime + 0.01;
  const k = 0.95 + Math.random() * 0.1;
  // The revs: up, a dip for the gear change, up again, and down to idle.
  const revs: [number, number][] = [[0, 105], [0.32, 320], [0.4, 235], [0.56, 300], [1, 150]];
  const rev = (param: AudioParam, scale: number) => {
    param.setValueAtTime(revs[0][1] * scale * k, t);
    for (const [at, hz] of revs.slice(1)) param.exponentialRampToValueAtTime(hz * scale * k, t + at);
  };

  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 7;
  filter.frequency.setValueAtTime(500, t);
  filter.frequency.exponentialRampToValueAtTime(2600, t + 0.32);
  filter.frequency.exponentialRampToValueAtTime(1200, t + 0.4);
  filter.frequency.exponentialRampToValueAtTime(2200, t + 0.56);
  filter.frequency.exponentialRampToValueAtTime(700, t + 1);

  // The engine's beat: the level pulses, faster as it revs.
  const pulse = context.createGain();
  pulse.gain.value = 0.7;
  const beat = context.createOscillator();
  beat.frequency.setValueAtTime(24, t);
  beat.frequency.exponentialRampToValueAtTime(46, t + 0.32);
  beat.frequency.exponentialRampToValueAtTime(30, t + 1);
  const depth = context.createGain();
  depth.gain.value = 0.3;
  beat.connect(depth);
  depth.connect(pulse.gain);

  const env = context.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(0.5, t + 0.06);
  env.gain.setValueAtTime(0.5, t + 0.6);
  env.gain.exponentialRampToValueAtTime(0.0001, t + 1.02);

  const body = context.createOscillator();
  body.type = "sawtooth";
  rev(body.frequency, 1);
  const robot = context.createOscillator();
  robot.type = "square";
  rev(robot.frequency, 1.5);
  const robotLevel = context.createGain();
  robotLevel.gain.value = 0.35;

  body.connect(filter);
  robot.connect(robotLevel);
  robotLevel.connect(filter);
  filter.connect(pulse);
  pulse.connect(env);
  env.connect(master);
  for (const osc of [body, robot, beat]) {
    osc.start(t);
    osc.stop(t + 1.05);
  }
}
