import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { gameSound } from "@/lib/guide/voice";
import { GUIDE_NAME } from "@/lib/guide/identity";
import { FIELD_H, INK, MONO, drawCommit, drawGlyphs, drawScore, drawSolvorn, fitField, makeGlyphs, rand, readBest, readPalette, saveBest, type GameProps, type Glyph, type Palette, type Phase } from "@/components/game/shared";
import { GameField } from "@/components/game/GameField";

/**
 * Solvorn Trail: the guide heads a growing trail of code blocks round a grid.
 * Every commit it eats scores and adds a block; every fifth brings a bug out
 * for a few seconds, worth more. Running into a wall or its own trail ends the
 * round. It speeds up a little as the trail grows; the best score is kept.
 *
 * Moves happen on the grid, one cell a step; the drawing slides between cells
 * so it reads smoothly. Cells are the same size everywhere, so the grid has
 * fewer columns on phones (the shared field is narrower there). Colours come
 * from the site's CSS variables, so the game follows the theme and accent.
 */

const CELL = 20;
/** The band along the top for the score; the grid starts below it. */
const HUD = 40;
const ROWS = (FIELD_H - HUD) / CELL;
/** Solvorn's head is drawn bigger than a cell, centred on its cell. */
const HEAD = 28;
const BLOCK = CELL - 3;
const TAIL_BLOCK = 12;
const START_LENGTH = 4;
/** Steps a second: a gentle climb with every commit, up to a cap. */
const START_RATE = 7;
const MAX_RATE = 13;
const RATE_PER_COMMIT = 0.2;
const COMMIT_SCORE = 10;
const BUG_SCORE = 50;
const BUG_EVERY = 5;
const BUG_TIME = 5;
/** How far a drag goes, in CSS pixels, before it counts as a swipe. */
const SWIPE = 24;
/** The lean into a left or right run (radians), and the nudge into whatever it hit. */
const LEAN = 0.12;
const BUMP = 3;
const DRIFT = 12;
const BEST_KEY = "solvorn-trail-best";
const TRAIL_GLYPHS = ["{}", ";", "=>", "()", "[]", "&&"];

type Cell = { x: number; y: number };
/** One step on the grid: UP, DOWN, LEFT or RIGHT. */
type Dir = Cell;
type Bug = Cell & { left: number };

const UP: Dir = { x: 0, y: -1 };
const DOWN: Dir = { x: 0, y: 1 };
const LEFT: Dir = { x: -1, y: 0 };
const RIGHT: Dir = { x: 1, y: 0 };
const KEYS: Partial<Record<string, Dir>> = {
  ArrowUp: UP,
  KeyW: UP,
  ArrowDown: DOWN,
  KeyS: DOWN,
  ArrowLeft: LEFT,
  KeyA: LEFT,
  ArrowRight: RIGHT,
  KeyD: RIGHT,
};

const same = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;
const stepRate = (eaten: number) => Math.min(MAX_RATE, START_RATE + eaten * RATE_PER_COMMIT);
/** Just above the middle, a little left of it: the ready card sits below, and the default heading is right. */
const startCell = (cols: number): Cell => ({ x: Math.floor((cols - 1) / 2), y: ROWS / 2 - 1 });
const centre = (c: Cell, ox: number) => ({ x: ox + c.x * CELL + CELL / 2, y: HUD + c.y * CELL + CELL / 2 });

/** Where a block is drawn: `t` of the way (0 to 1) from the cell it left to the one it is moving to. */
function slide(from: Cell, to: Cell, t: number, ox: number) {
  const a = centre(from, ox);
  const b = centre(to, ox);
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** A random empty cell, or null once the trail fills the grid. */
function freeCell(cols: number, taken: (Cell | null)[]): Cell | null {
  const used = new Set(taken.map((c) => c && c.y * cols + c.x));
  const free: number[] = [];
  for (let i = 0; i < cols * ROWS; i++) if (!used.has(i)) free.push(i);
  if (free.length === 0) return null;
  const i = free[Math.floor(Math.random() * free.length)];
  return { x: i % cols, y: Math.floor(i / cols) };
}

/**
 * A fresh round: Solvorn alone on its start cell, its first blocks still to
 * come out behind it, so it can set off in any direction. `prev` is where each
 * block of `trail` was a step ago, for the slide between cells.
 */
function newRound(cols: number, heading: Dir) {
  const start = startCell(cols);
  return {
    trail: [start],
    prev: [start],
    grow: START_LENGTH - 1,
    dir: heading,
    turns: [] as Dir[],
    acc: 0,
    t: 0,
    score: 0,
    eaten: 0,
    commit: null as Cell | null,
    bug: null as Bug | null,
    crashed: false,
  };
}
type Round = ReturnType<typeof newRound>;

/** The top-left of the box Solvorn's head is drawn in (logical units): sliding to its cell, or bumped into what it hit. */
function headBox(r: Round, ox: number) {
  const { x, y } = slide(r.prev[0], r.trail[0], r.t, ox);
  const bump = r.crashed ? BUMP : 0;
  return { x: x - HEAD / 2 + r.dir.x * bump, y: y - HEAD / 2 + r.dir.y * bump };
}

export default function TrailGame({ onAnnounce, present, autoEnter, onEnter, spriteRectRef }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [finalScore, setFinalScore] = useState(0);
  const [best, setBest] = useState(() => readBest(BEST_KEY));
  const [newBest, setNewBest] = useState(false);
  const [crashedInto, setCrashedInto] = useState<"wall" | "trail">("wall");

  // Everything the loop touches lives in one mutable object, so a frame never waits on React.
  const game = useRef({
    phase: "ready" as Phase,
    ...newRound(640 / CELL, RIGHT),
    tilt: 0,
    time: 0,
    blinkAt: 2,
    glyphs: [] as Glyph[],
    palette: null as Palette | null,
    scale: 1,
    viewW: 640,
    cols: 640 / CELL,
    // The grid's left edge: half of whatever is left over when the width is not a whole number of cells.
    ox: 0,
    best: readBest(BEST_KEY),
    // Whether the guide is here yet: it flies in from the page on the first start.
    present,
  });
  // The finger or mouse being dragged across the field, and where the next swipe is measured from.
  const swipe = useRef<{ id: number; x: number; y: number; turned: boolean } | null>(null);

  const reset = useCallback((heading: Dir = RIGHT) => {
    const g = game.current;
    Object.assign(g, newRound(g.cols, heading));
  }, []);

  const setGamePhase = useCallback((next: Phase) => {
    game.current.phase = next;
    setPhase(next);
  }, []);

  /** Where the guide's head is, in screen pixels: where the flight from the page lands, and where the flight home leaves from. */
  const spriteRect = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return null;
    const g = game.current;
    const box = wrap.getBoundingClientRect();
    const k = box.width / g.viewW;
    const head = headBox(g, g.ox);
    return { x: box.left + head.x * k, y: box.top + head.y * k, width: HEAD * k, height: HEAD * k };
  }, []);
  useEffect(() => {
    spriteRectRef.current = spriteRect;
    return () => {
      spriteRectRef.current = null;
    };
  }, [spriteRect, spriteRectRef]);

  /** Space or a tap: start (heading right, unless an arrow or a swipe started it), carry on after a pause, or play again. */
  const press = useCallback(
    (heading: Dir = RIGHT) => {
      const g = game.current;
      if (g.phase === "entering") return;
      if (g.phase === "ready" || g.phase === "over") {
        const begin = () => {
          reset(heading);
          g.commit = freeCell(g.cols, g.trail);
          setNewBest(false);
          setGamePhase("running");
          onAnnounce("Game started.");
        };
        if (g.present) {
          begin();
          return;
        }
        // The first start: the guide flies in from the page to its start cell, then sets off.
        reset();
        setGamePhase("entering");
        const target = spriteRect();
        void (target ? onEnter(target) : Promise.resolve()).then(() => {
          g.present = true;
          begin();
        });
        return;
      }
      if (g.phase === "paused") setGamePhase("running");
    },
    [onAnnounce, onEnter, reset, setGamePhase, spriteRect],
  );

  /** An arrow, WASD or a swipe: queue a turn for the coming steps, or start the round heading that way. */
  const steer = useCallback(
    (to: Dir) => {
      const g = game.current;
      if (g.phase === "ready") {
        press(to);
        return;
      }
      // Two turns can wait, so a quick left-then-up between steps is not lost.
      if (g.phase !== "running" || g.turns.length >= 2) return;
      const last = g.turns[g.turns.length - 1] ?? g.dir;
      // Only quarter turns: straight on changes nothing, and straight back runs into the trail.
      if (to.x * last.x + to.y * last.y !== 0) return;
      g.turns.push(to);
    },
    [press],
  );

  const togglePause = useCallback(() => {
    const g = game.current;
    if (g.phase === "running") setGamePhase("paused");
    else if (g.phase === "paused") setGamePhase("running");
  }, [setGamePhase]);

  // Keyboard: arrows or WASD steer, Space starts or carries on, P pauses. Esc is the dialog's.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Leave the browser's own shortcuts (Ctrl+S, Cmd+D and the like) alone.
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const to = KEYS[e.code];
      if (to) {
        e.preventDefault();
        if (!e.repeat) steer(to);
      } else if (e.code === "Space") {
        e.preventDefault();
        if (!e.repeat) press();
      } else if (e.code === "KeyP") {
        e.preventDefault();
        togglePause();
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [press, steer, togglePause]);

  // Pause when the tab is hidden or the window loses focus: no unfair crashes.
  useEffect(() => {
    const pause = () => {
      if (game.current.phase === "running") setGamePhase("paused");
    };
    const onVisibility = () => document.hidden && pause();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", pause);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", pause);
    };
  }, [setGamePhase]);

  // Came along from the menu: fly in as soon as the game is on screen (after the dialog's zoom-in), then wait for the start.
  useEffect(() => {
    const g = game.current;
    if (!autoEnter || g.present) return;
    setGamePhase("entering");
    const id = window.setTimeout(() => {
      const target = spriteRect();
      void (target ? onEnter(target) : Promise.resolve()).then(() => {
        g.present = true;
        setGamePhase("ready");
      });
    }, 260);
    return () => window.clearTimeout(id);
    // Once, when the game first appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard focus on the play area as soon as it appears, so the keys play (the dialog opens before this chunk loads).
  useEffect(() => {
    wrapRef.current?.focus({ preventScroll: true });
  }, []);

  // Canvas size and colours: fit the width, keep the aspect, re-read colours on theme or accent changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const g = game.current;
    g.palette = readPalette();
    const fit = () => {
      const { viewW, scale } = fitField(wrap, canvas);
      const cols = Math.floor(viewW / CELL);
      if (viewW !== g.viewW || g.glyphs.length === 0) {
        g.viewW = viewW;
        g.ox = (viewW - cols * CELL) / 2;
        g.glyphs = makeGlyphs(viewW, FIELD_H - 16);
      }
      // A grid of a different width (across the phone / desktop shapes): the round so far no longer fits, so start over.
      if (cols !== g.cols) {
        g.cols = cols;
        reset();
        if (g.phase === "running" || g.phase === "paused" || g.phase === "over") setGamePhase("ready");
      }
      g.scale = scale;
    };
    fit();
    const resize = new ResizeObserver(fit);
    resize.observe(wrap);
    const recolor = new MutationObserver(() => {
      g.palette = readPalette();
    });
    recolor.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
    return () => {
      resize.disconnect();
      recolor.disconnect();
    };
  }, [reset, setGamePhase]);

  // The loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = performance.now();

    const crash = (into: "wall" | "trail") => {
      const g = game.current;
      g.crashed = true;
      // Stop on the cell it reached rather than finish the slide.
      g.prev = g.trail;
      gameSound("crash");
      setCrashedInto(into);
      setFinalScore(g.score);
      if (g.score > g.best) {
        g.best = g.score;
        setBest(g.score);
        setNewBest(true);
        saveBest(BEST_KEY, g.score);
      }
      setGamePhase("over");
      onAnnounce(`Game over. Score ${g.score}. Best ${g.best}.`);
    };

    /** One move on the grid: take the next queued turn, check what is ahead, eat what is there. */
    const step = () => {
      const g = game.current;
      g.dir = g.turns.shift() ?? g.dir;
      const old = g.trail;
      const next = { x: old[0].x + g.dir.x, y: old[0].y + g.dir.y };
      const growing = g.grow > 0;
      // Unless the trail is growing, its tail leaves its cell this step, so the head may take that cell.
      const body = growing ? old : old.slice(0, -1);
      if (next.x < 0 || next.y < 0 || next.x >= g.cols || next.y >= ROWS) {
        crash("wall");
        return;
      }
      if (body.some((c) => same(c, next))) {
        crash("trail");
        return;
      }
      g.trail = [next, ...body];
      // Each block slides on to the cell ahead of it; a new block starts on the old tail's cell.
      g.prev = growing ? [...old, old[old.length - 1]] : old;
      if (growing) g.grow -= 1;

      if (g.commit && same(g.commit, next)) {
        g.score += COMMIT_SCORE;
        g.eaten += 1;
        g.grow += 1;
        gameSound("collect");
        g.commit = freeCell(g.cols, [...g.trail, g.bug]);
        // Every few commits a bug comes out for a while: worth a detour.
        if (g.eaten % BUG_EVERY === 0) {
          const cell = freeCell(g.cols, [...g.trail, g.commit, g.bug]);
          g.bug = cell && { ...cell, left: BUG_TIME };
        }
      } else if (g.bug && same(g.bug, next)) {
        g.score += BUG_SCORE;
        g.bug = null;
        gameSound("collect");
      }
    };

    const update = (dt: number) => {
      const g = game.current;
      g.time += dt;
      // Ease into a lean when running left or right; upright before a round.
      const lean = g.phase === "ready" || g.phase === "entering" ? 0 : g.dir.x * LEAN;
      g.tilt += (lean - g.tilt) * Math.min(1, dt * 12);
      if (g.phase !== "running") return;
      if (!reduceMotion) for (const glyph of g.glyphs) {
        glyph.x -= DRIFT * dt;
        if (glyph.x < -60) {
          glyph.x = g.viewW + rand(0, 80);
          glyph.y = rand(HUD + 12, FIELD_H - 16);
        }
      }
      if (g.bug) {
        g.bug.left -= dt;
        if (g.bug.left <= 0) g.bug = null;
      }
      const interval = 1 / stepRate(g.eaten);
      g.acc += dt;
      if (g.acc >= interval) {
        g.acc -= interval;
        step();
      }
      g.t = Math.min(1, g.acc / interval);
    };

    /** A trail block: a chunky key with a darker lip along the bottom, now and then with a bit of code on it. */
    const drawBlock = (p: Palette, x: number, y: number, size: number, glyph: string | null) => {
      const left = x - size / 2;
      const top = y - size / 2;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(left, top, size, size, size * 0.28);
      ctx.fillStyle = p.body;
      ctx.fill();
      ctx.clip();
      ctx.fillStyle = p.ears;
      ctx.fillRect(left, top + size - 4, size, 4);
      ctx.restore();
      // The path outlives save/restore: outline the same rounded square.
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      if (glyph) {
        ctx.fillStyle = INK;
        ctx.font = `700 ${Math.round(size * 0.5)}px ${MONO}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(glyph, x, y - 1);
      }
    };

    /** The bonus bug, legs going, inside a ring that runs down with the time it has left. */
    const drawBug = (p: Palette, bug: Bug) => {
      const g = game.current;
      const { x: cx, y: cy } = centre(bug, g.ox);
      const wiggle = reduceMotion ? 0 : Math.sin(g.time * 18) * 1.5;
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = p.muted;
      ctx.beginPath();
      ctx.arc(cx, cy, 12.5, -Math.PI / 2, -Math.PI / 2 + (bug.left / BUG_TIME) * Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = p.ink;
      ctx.beginPath();
      for (const side of [-1, 1]) for (const k of [-3.5, 0, 3.5]) {
        ctx.moveTo(cx + k, cy);
        ctx.lineTo(cx + k + side * wiggle, cy + side * 8);
      }
      ctx.moveTo(cx - 7, cy - 3);
      ctx.lineTo(cx - 11, cy - 6.5 + wiggle);
      ctx.moveTo(cx - 7, cy - 1);
      ctx.lineTo(cx - 11.5, cy - 1 - wiggle);
      ctx.stroke();
      ctx.fillStyle = p.danger;
      ctx.strokeStyle = INK;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 7.5, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy - 5.5);
      ctx.lineTo(cx, cy + 5.5);
      ctx.stroke();
      ctx.restore();
    };

    const draw = () => {
      const g = game.current;
      const p = g.palette;
      if (!p) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(g.scale, 0, 0, g.scale, 0, 0);

      // Faint code drifting in the back.
      drawGlyphs(ctx, g.glyphs, p.faint);

      // The grid as squared paper: a faint dot where four cells meet.
      ctx.fillStyle = p.border;
      ctx.globalAlpha = 0.55;
      for (let x = 1; x < g.cols; x++) for (let y = 1; y < ROWS; y++) ctx.fillRect(g.ox + x * CELL - 1, HUD + y * CELL - 1, 2, 2);
      ctx.globalAlpha = 1;

      // The top wall, under the score; the field's own edges are the others.
      ctx.strokeStyle = p.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, HUD);
      ctx.lineTo(g.viewW, HUD);
      ctx.stroke();

      if (g.commit) {
        const c = centre(g.commit, g.ox);
        drawCommit(ctx, p, c.x, c.y + (reduceMotion ? 0 : Math.sin(g.time * 4) * 1.5));
      }
      if (g.bug) drawBug(p, g.bug);

      // Only once it has flown in from the page.
      if (g.present) {
        // Tail first, so each block sits under the one ahead; smaller and fainter towards the end.
        const n = g.trail.length - 1;
        for (let i = n; i >= 1; i--) {
          const { x, y } = slide(g.prev[i], g.trail[i], g.t, g.ox);
          const fade = i / n;
          ctx.globalAlpha = 1 - 0.5 * fade;
          drawBlock(p, x, y, BLOCK - (BLOCK - TAIL_BLOCK) * fade, i % 3 === 0 ? TRAIL_GLYPHS[(i / 3 - 1) % TRAIL_GLYPHS.length] : null);
        }
        ctx.globalAlpha = 1;

        // Solvorn heads it, blinking now and then.
        if (g.time > g.blinkAt + 0.14) g.blinkAt = g.time + rand(2, 5);
        const blink = g.time > g.blinkAt;
        const head = headBox(g, g.ox);
        drawSolvorn(ctx, p, head.x, head.y, HEAD, { crashed: g.crashed, blink: blink && !g.crashed, tilt: g.tilt });
      }

      drawScore(ctx, p, g.viewW - 16, g.score, g.best);
    };

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      update(dt);
      draw();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [onAnnounce, setGamePhase]);

  // Touch and mouse: a drag past SWIPE picks a direction; a press that never became a swipe is a tap.
  const pointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.isPrimary) swipe.current = { id: e.pointerId, x: e.clientX, y: e.clientY, turned: false };
  };
  const pointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const s = swipe.current;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE) return;
    steer(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? RIGHT : LEFT) : dy > 0 ? DOWN : UP);
    // Measure the next turn from here, so one long drag can make several.
    s.x = e.clientX;
    s.y = e.clientY;
    s.turned = true;
  };
  const pointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const s = swipe.current;
    if (!s || s.id !== e.pointerId) return;
    swipe.current = null;
    if (!s.turned && e.type === "pointerup") press();
  };

  return (
    <GameField
      surfaceRef={wrapRef}
      canvasRef={canvasRef}
      label={`${GUIDE_NAME} Trail. Steer with the arrow keys or W, A, S and D, or swipe. Press Space or tap to start, P to pause.`}
      phase={phase}
      text={{
        ready: [`Ready to commit, ${GUIDE_NAME}?`, "Press Space or tap to start"],
        over: [crashedInto === "wall" ? "Index out of range" : "Merge conflict", "Press Space or tap to play again"],
      }}
      score={finalScore}
      best={best}
      newBest={newBest}
      low
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
    />
  );
}
