
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Avatar, type AvatarHandle } from "@bible-strong/avatar-react";
import { readCharacter, type AvatarCharacter } from "@bible-strong/avatar-core";
import round from "@/assets/guide/solvorn.avatar.json";
import square from "@/assets/guide/solvorn-square.avatar.json";
import { lookToward } from "@/lib/guide/gaze";
import type { ViewportPoint } from "@/lib/guide/types";
import { useGuideView } from "@/lib/guide/useGuideView";
import { useSettings } from "@/lib/settings";
import { guideColors } from "@/lib/appearance";
import { useGuideShape, type GuideShape } from "@/lib/guide/shape";

/*
 * The renderer reads `window` while rendering, so this module is only ever
 * loaded lazily, on the client. The guide has two shapes (round robot, and the
 * original square), switched now and then mid-spin (lib/guide/shape.ts). Each
 * is tinted per accent: the body and ears follow the visitor's accent; the
 * outline and eyes stay ink.
 */
const SHAPES = { round, square } as const;
type Character = AvatarCharacter;
const characters = new Map<string, Character>();
function characterFor(accent: string, shape: GuideShape): Character {
  const key = `${shape}:${accent}`;
  let character = characters.get(key);
  if (!character) {
    const source = SHAPES[shape];
    const { body, ears } = guideColors(accent);
    const tinted = {
      ...source,
      colors: { ...source.colors, body },
      body: { ...source.body, nodes: source.body.nodes.map((node) => ({ ...node, color: ears })) },
    };
    const read = readCharacter(tinted);
    if (!read.ok) throw new Error(`Invalid guide character (${shape})`);
    character = read.value;
    characters.set(key, character);
  }
  return character;
}

export type GuideAvatarProps = {
  size: number;
  /** Follow the pointer with the head. Measured by the library from this avatar's centre. */
  followPointer?: boolean;
  /** Default gaze, -1..1 right and up, when nothing else asks for attention. */
  lookAt?: readonly [number, number] | null;
  /** Stop computing frames after this long without a new request. */
  settleAfterMs?: number;
  /** Stop the frame loop entirely (the avatar is hidden). */
  paused?: boolean;
  className?: string;
};

/**
 * The live avatar. Decorative: callers own the accessible name and the text
 * caption, so meaning never depends on the animation alone.
 *
 * Gaze priority: a point the guide store asks every avatar to look at (tour
 * target, composer), then this instance's own `lookAt`, then the pointer.
 */
export default function GuideAvatar({ size, followPointer = false, lookAt = null, settleAfterMs, paused = false, className }: GuideAvatarProps) {
  const { accent } = useSettings();
  const { shape, spinAt } = useGuideShape();
  const character = useMemo(() => characterFor(accent, shape), [accent, shape]);
  const view = useGuideView();
  const ref = useRef<AvatarHandle>(null);

  // A change of shape: spin now; the shape switches mid-spin (see shape.ts).
  const lastSpin = useRef(spinAt);
  useEffect(() => {
    if (spinAt === lastSpin.current) return;
    lastSpin.current = spinAt;
    ref.current?.poke("spin");
  }, [spinAt]);
  const boxRef = useRef<HTMLSpanElement>(null);
  const lastPoke = useRef(view.poke?.nonce ?? 0);
  // Measured gaze, remembered with the point it was measured for.
  const [measured, setMeasured] = useState<{ point: ViewportPoint; gaze: readonly [number, number] } | null>(null);

  useEffect(() => {
    const poke = view.poke;
    if (!poke || poke.nonce === lastPoke.current) return;
    lastPoke.current = poke.nonce;
    ref.current?.poke(poke.kind);
  }, [view.poke]);

  // A store point is in viewport pixels; turn it into this avatar's gaze.
  useLayoutEffect(() => {
    const point = view.pointAt;
    const box = boxRef.current;
    if (!point || !box) return;
    const rect = box.getBoundingClientRect();
    const from = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    setMeasured({ point, gaze: lookToward(from, point, window.innerWidth, window.innerHeight) });
  }, [view.pointAt]);

  const pointGaze = view.pointAt && measured?.point === view.pointAt ? measured.gaze : null;
  const gaze = pointGaze ?? lookAt;

  return (
    <span
      ref={boxRef}
      aria-hidden="true"
      data-guide-avatar
      // Asleep: the eyes close (globals.css squashes them to lines).
      data-guide-asleep={view.state === "sleeping" ? "" : undefined}
      className={className}
      style={{ display: "inline-flex", width: size, height: size, pointerEvents: "none" }}
    >
      <Avatar
        character={character}
        ref={ref}
        size={size}
        state={view.state}
        face={view.face}
        lookAt={gaze}
        followPointer={followPointer && !gaze}
        settleAfterMs={settleAfterMs}
        paused={paused}
      />
    </span>
  );
}
