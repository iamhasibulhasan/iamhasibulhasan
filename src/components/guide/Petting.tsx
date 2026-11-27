import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { Heart } from "lucide-react";
import { emitGuide } from "@/lib/guide/bus";
import { petSound } from "@/lib/guide/voice";
import { changeGuideShape } from "@/lib/guide/shape";
import type { AvatarCue, GestureName } from "@/lib/guide/types";

/** How far the pointer travels over the guide for one stroke, in px. */
const STROKE_PX = 70;
/** At most one stroke this often, so steady petting is a gentle run of bloops, not a buzz. */
const STROKE_GAP_MS = 340;
/** A pause this long and the next stroke starts a new petting (back to plain happy). */
const SESSION_GAP_MS = 1600;
/** How long one stroke keeps its mood (each new stroke extends it). */
const MOOD_MS = 1800;
/** How long a heart floats before it is gone. */
const HEART_MS = 1100;
const MAX_HEARTS = 6;

/** A surprise now and then while petted: at most this often, and only on some strokes. */
const REACTION_GAP_MS = 1100;
const REACTION_CHANCE = 0.55;
/** A shape change at most this often, even when picked. */
const SHAPE_GAP_MS = 6000;
/** A colour change lasts this long, then fades back. */
const TINT_MS = 2400;
/** The colours it turns (hue turns from its own colour): yellow, teal, blue, purple, pink. */
const TINTS = [-70, 60, 120, 170, 230];
/** A reaction's own caption shows this long before the mood's comes back. */
const SPECIAL_CAPTION_MS = 1600;

/** Its petting moods: always a happy face, each with its own line. */
const MOODS: { cue: AvatarCue; caption: string }[] = [
  { cue: { state: "happy", face: "happy" }, caption: "Purrr…" },
  { cue: { state: "excited", face: "happy" }, caption: "Again! Again!" },
  { cue: { state: "playful", face: "happy" }, caption: "Wheee!" },
  { cue: { state: "laughing", face: "happy" }, caption: "Hehe, that tickles!" },
];
const GIGGLING = 3;

type Reaction = "mood" | "nod" | "bounce" | "spin" | "giggle" | "color" | "shape";
const REACTIONS: Reaction[] = ["mood", "nod", "bounce", "spin", "giggle", "color", "shape"];

type PetHeart = { id: number; dx: number; tilt: number };

const pick = <T,>(list: readonly T[], not?: T) => {
  const options = list.filter((item) => item !== not);
  return options[Math.floor(Math.random() * options.length)];
};

/**
 * Petting the guide with the pointer: stroking over it (moving back and forth
 * while hovering) gives a bubbly bloop and floats a heart up off its head with
 * every stroke, and now and then it surprises you: a new mood, a nod, a
 * bounce, a spin, a giggle, a change of colour for a moment, or a change of
 * shape. Never the same surprise twice in a row. The mouse or a pen only: on a
 * touch screen a drag scrolls the page, and a tap is a pet already (the click).
 *
 * `tint`: the hue turn of a colour change in progress (null: its own colour).
 */
export function usePetting() {
  const [hearts, setHearts] = useState<PetHeart[]>([]);
  const [tint, setTint] = useState<number | null>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const travel = useRef(0);
  const lastStroke = useRef(0);
  const mood = useRef(0);
  const lastReaction = useRef({ at: 0, kind: null as Reaction | null });
  const lastShape = useRef(0);
  const special = useRef({ caption: "", until: 0 });
  const nextId = useRef(0);
  const timers = useRef(new Set<number>());

  const later = useCallback((ms: number, run: () => void) => {
    const timer = window.setTimeout(() => {
      timers.current.delete(timer);
      run();
    }, ms);
    timers.current.add(timer);
  }, []);
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  /** A surprise, if it is time for one: what it changes about this stroke. */
  const surprise = useCallback(
    (now: number): { poke?: GestureName; giggle?: boolean; quiet?: boolean } => {
      if (now - lastReaction.current.at < REACTION_GAP_MS || Math.random() > REACTION_CHANCE) return {};
      const allowed = REACTIONS.filter((kind) => kind !== "shape" || now - lastShape.current > SHAPE_GAP_MS);
      const kind = pick(allowed, lastReaction.current.kind ?? undefined);
      lastReaction.current = { at: now, kind };
      switch (kind) {
        case "mood":
          mood.current = MOODS.indexOf(pick(MOODS, MOODS[mood.current]));
          return {};
        case "nod":
        case "bounce":
        case "spin":
          return { poke: kind };
        case "giggle":
          mood.current = GIGGLING;
          return { poke: "bounce", giggle: true };
        case "color":
          setTint((current) => pick(TINTS, current ?? undefined));
          special.current = { caption: "Ooh, a new colour!", until: now + SPECIAL_CAPTION_MS };
          later(TINT_MS, () => setTint(null));
          return {};
        case "shape":
          if (changeGuideShape()) {
            lastShape.current = now;
            special.current = { caption: "Ta-da!", until: now + SPECIAL_CAPTION_MS };
            // Its "vroom" is this stroke's sound.
            return { quiet: true };
          }
          return {};
      }
    },
    [later],
  );

  const stroke = useCallback(() => {
    const now = Date.now();
    // A new petting starts plain happy.
    if (now - lastStroke.current > SESSION_GAP_MS) mood.current = 0;
    lastStroke.current = now;
    const { poke, giggle, quiet } = surprise(now);
    const current = MOODS[mood.current];
    emitGuide({
      type: "guide/mood",
      cue: current.cue,
      ms: MOOD_MS,
      poke,
      caption: now < special.current.until ? special.current.caption : current.caption,
      now,
    });
    if (!quiet) petSound(giggle ? "giggle" : "pet");
    const id = nextId.current++;
    setHearts((list) => [...list.slice(-(MAX_HEARTS - 1)), { id, dx: Math.round((Math.random() - 0.5) * 70), tilt: Math.round((Math.random() - 0.5) * 30) }]);
    later(HEART_MS, () => setHearts((list) => list.filter((heart) => heart.id !== id)));
  }, [later, surprise]);

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType === "touch") return;
      const point = { x: event.clientX, y: event.clientY };
      const previous = last.current;
      last.current = point;
      if (!previous) return;
      travel.current += Math.hypot(point.x - previous.x, point.y - previous.y);
      if (travel.current < STROKE_PX || Date.now() - lastStroke.current < STROKE_GAP_MS) return;
      travel.current = 0;
      stroke();
    },
    [stroke],
  );

  const onPointerLeave = useCallback(() => {
    last.current = null;
    travel.current = 0;
  }, []);

  return { hearts, tint, onPointerMove, onPointerLeave };
}

/** The guide's colour while petted: a hue turn, eased in and back out. */
export const tintStyle = (tint: number | null): CSSProperties => ({
  // From and back to none (no filter at rest); the browser eases between the two.
  filter: tint === null ? "none" : `hue-rotate(${tint}deg) saturate(1.15)`,
  transition: "filter 600ms ease-in-out",
});

/** The hearts from petting, floating up off the guide's head. */
export function PetHearts({ hearts }: { hearts: PetHeart[] }) {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[6%] flex justify-center">
      {hearts.map((heart) => (
        <span key={heart.id} className="pet-heart absolute" style={{ "--heart-dx": `${heart.dx}px`, "--heart-tilt": `${heart.tilt}deg` } as CSSProperties}>
          {/* Rose, whatever the accent: it reads as a heart, and stands out against the guide's own colour. */}
          <Heart className="h-4 w-4 fill-rose-400 text-rose-300 drop-shadow-[0_2px_6px_rgba(244,114,182,0.55)]" />
        </span>
      ))}
    </span>
  );
}
