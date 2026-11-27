/**
 * What the navbar's games share: the site's colours read for a canvas, the
 * saved best scores, the drifting code in the background, and Solvorn drawn
 * the same way in every game.
 */

import { getGuideShape, type GuideShape } from "@/lib/guide/shape";

/**
 * Every game plays in the same box: FIELD_CLASS gives its shape (4:3 on
 * phones, 16:9 from `sm` up), so the dialog is the same size whatever the
 * game. Inside it a game draws in logical units: FIELD_H tall, and as wide as
 * the box's shape makes it (480 on phones, 640 above).
 */
export const FIELD_H = 360;
export const FIELD_CLASS = "aspect-[4/3] sm:aspect-video";

/**
 * Sizes a game's canvas to its box (sharp on high-density screens) and returns
 * the logical width now on screen and the scale from logical units to canvas
 * pixels: draw with `ctx.setTransform(scale, 0, 0, scale, 0, 0)`.
 */
export function fitField(box: HTMLElement, canvas: HTMLCanvasElement) {
  const width = box.clientWidth;
  const height = box.clientHeight || (width * 9) / 16;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  return { viewW: Math.round((FIELD_H * width) / height), scale: (height / FIELD_H) * dpr };
}

/** "entering": the guide is flying in from the page; the game starts when it lands. */
export type Phase = "ready" | "entering" | "running" | "paused" | "over";
export type Glyph = { x: number; y: number; ch: string; size: number };
export type Palette = {
  ink: string;
  muted: string;
  faint: string;
  border: string;
  accent: string;
  body: string;
  ears: string;
  danger: string;
  warn: string;
};

export const GLYPHS = ["{ }", "</>", "=>", ";", "async", "await", "var", "[ ]", "()", "&&", "LINQ", "DbSet", "?.", "null!"];
export const MONO = "ui-monospace, SFMono-Regular, Consolas, monospace";
export const INK = "#0a0b09";

/** What the games dialog hands each game, so the page's guide can fly into it. */
export type GameProps = {
  onAnnounce: (text: string) => void;
  /** The guide is already in the game (it arrived for an earlier round or game). */
  present: boolean;
  /** The guide came with the visitor from the menu: fly it in as soon as the game is on screen. */
  autoEnter: boolean;
  /** Fly the guide in to this box on screen; resolves when it lands. */
  onEnter: (target: { x: number; y: number; width: number; height: number }) => Promise<void>;
  /** The game puts a function here that says where its guide is on screen, for the flight back. */
  spriteRectRef: { current: (() => { x: number; y: number; width: number; height: number } | null) | null };
};

export const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** The theme and accent as canvas colours, from the CSS variables the customizer sets. */
export function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const v = (name: string) => cs.getPropertyValue(name).trim();
  const hsl = (triplet: string, alpha = 1) => `hsl(${triplet.replace(/\s+/g, " ")} / ${alpha})`;
  return {
    ink: hsl(v("--foreground")),
    muted: hsl(v("--muted-foreground")),
    faint: hsl(v("--foreground"), 0.07),
    border: hsl(v("--foreground"), 0.22),
    accent: v("--accent-hex") || "#22c55e",
    body: v("--guide-body") || "#6ee7a0",
    ears: v("--guide-ears") || "#15803d",
    danger: hsl(v("--destructive") || "0 84% 60%"),
    warn: "#f59e0b",
  };
}

export function readBest(key: string) {
  try {
    return Number(localStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
}

export function saveBest(key: string, value: number) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* storage unavailable */
  }
}

/** A row of faint code glyphs spread across a road `width` wide, above `bottom`. */
export function makeGlyphs(width: number, bottom: number): Glyph[] {
  const count = Math.round(width / 55);
  return Array.from({ length: count }, (_, i) => ({
    x: (i / count) * width + rand(0, 40),
    y: rand(24, bottom),
    ch: GLYPHS[i % GLYPHS.length],
    size: rand(11, 16),
  }));
}

export function drawGlyphs(ctx: CanvasRenderingContext2D, glyphs: Glyph[], color: string) {
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  for (const glyph of glyphs) {
    ctx.font = `500 ${glyph.size}px ${MONO}`;
    ctx.fillText(glyph.ch, glyph.x, glyph.y);
  }
}

/**
 * Where each shape's parts sit, in the avatar's own units (its character files):
 * the round one has a ball head with an ear each side; the square one a rounded
 * block, no ears, and its floating bits a little further out.
 */
const SHAPE_PARTS = {
  round: { bits: [[84, -90, 42, 0.31], [112, -124, 22, 0.56]], eyeY: -12, mouthY: 34 },
  square: { bits: [[112, -116, 42, 0.31], [140, -150, 22, 0.56]], eyeY: -16, mouthY: 32 },
} as const;

/**
 * Solvorn, face on, in whichever shape it is on the page (it keeps that shape
 * the whole time it is away, see holdGuideShape), so the one that flies into a
 * game is the one the game draws. `x, y` is the top-left of a `size` box;
 * `tilt` is in radians.
 *
 * Solvorn © 2026 Md. Hasibul Hasan, all rights reserved: this drawing is not
 * covered by this repository's MIT License (see NOTICE.md).
 */
export function drawSolvorn(
  ctx: CanvasRenderingContext2D,
  p: Palette,
  x: number,
  y: number,
  size: number,
  {
    crashed = false,
    blink = false,
    tilt = 0,
    shape = getGuideShape(),
  }: { crashed?: boolean; blink?: boolean; tilt?: number; shape?: GuideShape } = {},
) {
  const s = size / 240;
  const parts = SHAPE_PARTS[shape];
  ctx.save();
  ctx.translate(x + size / 2, y + size / 2);
  ctx.rotate(tilt);
  ctx.scale(s, s);
  ctx.lineJoin = "round";
  ctx.strokeStyle = INK;
  // Ears on each side (the round one).
  if (shape === "round") {
    ctx.fillStyle = p.ears;
    ctx.lineWidth = 10;
    for (const ex of [-138, 104]) {
      ctx.beginPath();
      ctx.roundRect(ex, -25, 34, 66, 10);
      ctx.fill();
      ctx.stroke();
    }
  }
  // Head.
  ctx.fillStyle = p.body;
  ctx.lineWidth = 12;
  ctx.beginPath();
  if (shape === "square") ctx.roundRect(-113, -107, 226, 214, 46);
  else ctx.ellipse(0, 0, 118, 112, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // The floating bits.
  ctx.fillStyle = p.ears;
  ctx.lineWidth = 9;
  for (const [bx, by, bs, rot] of parts.bits) {
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.roundRect(-bs / 2, -bs / 2, bs, bs, bs * 0.22);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  // Face.
  ctx.fillStyle = INK;
  ctx.strokeStyle = INK;
  if (crashed) {
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    for (const ex of [-40, 40]) {
      ctx.beginPath();
      ctx.moveTo(ex - 16, parts.eyeY - 16);
      ctx.lineTo(ex + 16, parts.eyeY + 16);
      ctx.moveTo(ex + 16, parts.eyeY - 16);
      ctx.lineTo(ex - 16, parts.eyeY + 16);
      ctx.stroke();
    }
  } else {
    for (const ex of [-40, 40]) {
      ctx.beginPath();
      ctx.ellipse(ex, parts.eyeY, 19, blink ? 3 : 28, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.beginPath();
  ctx.roundRect(-9, parts.mouthY + (crashed ? 4 : 0), 18, 5, 2.5);
  ctx.fill();
  ctx.restore();
}

/** A glowing commit diamond centred on `cx, cy`. */
export function drawCommit(ctx: CanvasRenderingContext2D, p: Palette, cx: number, cy: number) {
  ctx.save();
  ctx.shadowColor = p.accent;
  ctx.shadowBlur = 14;
  ctx.fillStyle = p.accent;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 10);
  ctx.lineTo(cx + 9, cy);
  ctx.lineTo(cx, cy + 10);
  ctx.lineTo(cx - 9, cy);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.stroke();
  ctx.restore();
}

/** The score and best, top right, as every game shows them. */
export function drawScore(ctx: CanvasRenderingContext2D, p: Palette, right: number, score: number, best: number) {
  ctx.font = `600 14px ${MONO}`;
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillStyle = p.muted;
  ctx.fillText(`HI ${String(best).padStart(5, "0")}`, right - 84, 16);
  ctx.fillStyle = p.ink;
  ctx.fillText(String(score).padStart(5, "0"), right, 16);
}
