import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { gameSound } from "@/lib/guide/voice";
import { GUIDE_NAME } from "@/lib/guide/identity";
import { FIELD_H, INK, MONO, drawScore, drawSolvorn, fitField, rand, readBest, readPalette, saveBest, type GameProps, type Palette, type Phase } from "@/components/game/shared";
import { GameField } from "@/components/game/GameField";

/**
 * Solvorn Breaker: Solvorn is the ball. The merge bar at the bottom bounces it
 * into a wall of code smells; every block it breaks scores, legacy blocks take
 * two hits. Miss it and a life is gone; clear the wall and the next sprint
 * brings a new one, a little faster.
 *
 * Drawn on a canvas in the shared field (see FIELD_H in shared.ts): the wall
 * has as many columns as fit across, so phones get a narrower wall with the
 * same physics. Colours come from the site's CSS variables, so the game
 * follows the theme and the accent colour.
 */

/** The top strip is the HUD; the ball bounces off the line under it. */
const HUD_H = 40;
const PADDLE = { y: 326, w: 92, h: 12, speed: 560 };
const BALL_SIZE = 26;
/** Solvorn's head, the part that collides: a little inside the drawing. */
const BALL_R = 12;
const REST_Y = PADDLE.y - BALL_R - 1;
const START_SPEED = 300;
const MAX_SPEED = 600;
const SPRINT_SPEEDUP = 1.08;
/** The steepest a paddle bounce leaves at (60° off vertical): the ball always climbs at half its speed or more. */
const MAX_BOUNCE = Math.PI / 3;
const LIVES = 3;
/** Far enough below the HUD that the ball fits above the wall once it breaks through. */
const WALL_TOP = 72;
const WALL_SIDE = 14;
const BRICK_W = 60;
const BRICK_H = 20;
const BRICK_GAP = 6;
const CHIP_LIFE = 0.6;
const BEST_KEY = "solvorn-breaker-best";

/** A row's colour: the key is the palette entry it is filled with. */
type Tone = "danger" | "warn" | "accent" | "border" | "faint";
type Brick = { x: number; y: number; w: number; h: number; label: string; tone: Tone; legacy: boolean; hits: number };
type Ball = { x: number; y: number; vx: number; vy: number; resting: boolean };
/** A bit of a broken block, falling away. */
type Chip = { x: number; y: number; vx: number; vy: number; size: number; tone: Tone; life: number };

/** The wall, top row first: the worst smells highest up. */
const ROWS: { tone: Tone; labels: readonly [string, string] }[] = [
  { tone: "danger", labels: ["eval", "bug"] },
  { tone: "warn", labels: ["FIXME", "!important"] },
  { tone: "accent", labels: ["any", "var"] },
  { tone: "border", labels: ["TODO", "HACK"] },
  { tone: "faint", labels: ["null", "NaN"] },
];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const clampPaddle = (x: number, viewW: number) => clamp(x, PADDLE.w / 2, viewW - PADDLE.w / 2);
const restingBall = (x: number): Ball => ({ x, y: REST_Y, vx: 0, vy: 0, resting: true });

/** Whether the ball, centred on `cx, cy`, overlaps a box. */
const touches = (cx: number, cy: number, x: number, y: number, w: number, h: number) =>
  (cx - clamp(cx, x, x + w)) ** 2 + (cy - clamp(cy, y, y + h)) ** 2 < BALL_R * BALL_R;

/** A fresh wall: as many columns as fit across, legacy code along the top and, from the second sprint, more of it scattered through. */
function buildWall(viewW: number, sprint: number): Brick[] {
  const span = viewW - 2 * WALL_SIDE;
  const cols = Math.round((span + BRICK_GAP) / (BRICK_W + BRICK_GAP));
  const w = (span - (cols - 1) * BRICK_GAP) / cols;
  const scattered = Math.min(0.3, (sprint - 1) * 0.06);
  return ROWS.flatMap(({ tone, labels }, row) =>
    Array.from({ length: cols }, (_, col) => {
      const legacy = row === 0 || Math.random() < scattered;
      return {
        x: WALL_SIDE + col * (w + BRICK_GAP),
        y: WALL_TOP + row * (BRICK_H + BRICK_GAP),
        w,
        h: BRICK_H,
        // Staggered, so neighbours never share a label.
        label: labels[(col + row) % 2],
        tone,
        legacy,
        hits: legacy ? 2 : 1,
      };
    }),
  );
}

export default function BreakerGame({ onAnnounce, present, autoEnter, onEnter, spriteRectRef }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [finalScore, setFinalScore] = useState(0);
  const [best, setBest] = useState(() => readBest(BEST_KEY));
  const [newBest, setNewBest] = useState(false);

  // Everything the loop touches lives in one mutable object, so a frame never waits on React.
  const game = useRef({
    phase: "ready" as Phase,
    paddleX: 320,
    ball: restingBall(320),
    left: false,
    right: false,
    bricks: [] as Brick[],
    chips: [] as Chip[],
    speed: START_SPEED,
    score: 0,
    lives: LIVES,
    sprint: 1,
    time: 0,
    blinkAt: 2,
    // Solvorn looks dazed for a moment after a miss, crashed for good when the last life goes.
    dazedUntil: 0,
    crashed: false,
    palette: null as Palette | null,
    scale: 1,
    viewW: 640,
    best: readBest(BEST_KEY),
    // Whether the guide is here yet: it flies in from the page on the first start.
    present,
  });

  const reset = useCallback(() => {
    const g = game.current;
    g.paddleX = g.viewW / 2;
    g.ball = restingBall(g.paddleX);
    g.bricks = buildWall(g.viewW, 1);
    g.chips = [];
    g.speed = START_SPEED;
    g.score = 0;
    g.lives = LIVES;
    g.sprint = 1;
    g.dazedUntil = 0;
    g.crashed = false;
  }, []);

  const setGamePhase = useCallback((next: Phase) => {
    game.current.phase = next;
    setPhase(next);
  }, []);

  /** Where the ball is, in screen pixels: on the paddle at the start, where the flight from the page lands. */
  const spriteRect = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return null;
    const box = wrap.getBoundingClientRect();
    const { ball, viewW } = game.current;
    const k = box.width / viewW;
    const size = BALL_SIZE * k;
    return { x: box.left + (ball.x - BALL_SIZE / 2) * k, y: box.top + (ball.y - BALL_SIZE / 2) * k, width: size, height: size };
  }, []);
  useEffect(() => {
    spriteRectRef.current = spriteRect;
    return () => {
      spriteRectRef.current = null;
    };
  }, [spriteRect, spriteRectRef]);

  /** Off the paddle at a slight random angle, so no two serves are the same. */
  const launch = useCallback(() => {
    const g = game.current;
    const angle = rand(0.2, 0.45) * (Math.random() < 0.5 ? -1 : 1);
    g.ball = { x: g.ball.x, y: g.ball.y, vx: g.speed * Math.sin(angle), vy: -g.speed * Math.cos(angle), resting: false };
    gameSound("jump");
  }, []);

  /** One button for everything: start, launch, or play again. */
  const press = useCallback(() => {
    const g = game.current;
    if (g.phase === "entering") return;
    if (g.phase === "ready" || g.phase === "over") {
      const begin = () => {
        reset();
        setNewBest(false);
        setGamePhase("running");
        onAnnounce("Game started.");
        launch();
      };
      if (g.present) {
        begin();
        return;
      }
      // The first start: the guide flies in from the page onto the paddle, then the game begins.
      reset();
      setGamePhase("entering");
      const target = spriteRect();
      void (target ? onEnter(target) : Promise.resolve()).then(() => {
        g.present = true;
        begin();
      });
      return;
    }
    if (g.phase === "paused") {
      setGamePhase("running");
      return;
    }
    if (g.ball.resting) launch();
  }, [launch, onAnnounce, onEnter, reset, setGamePhase, spriteRect]);

  const togglePause = useCallback(() => {
    const g = game.current;
    if (g.phase === "running") setGamePhase("paused");
    else if (g.phase === "paused") setGamePhase("running");
  }, [setGamePhase]);

  /** The paddle follows the pointer across the field. */
  const aim = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const g = game.current;
    if (g.phase !== "running") return;
    const box = event.currentTarget.getBoundingClientRect();
    g.paddleX = clampPaddle((event.clientX - box.left) * (g.viewW / box.width), g.viewW);
  }, []);

  const tap = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      // The paddle sits by the bottom edge: keep following a finger that slides off the field.
      event.currentTarget.setPointerCapture(event.pointerId);
      aim(event);
      press();
    },
    [aim, press],
  );

  // Keyboard: Left / Right or A / D to move (held), Space to start or launch, P to pause. Esc is the dialog's.
  useEffect(() => {
    const side = (e: KeyboardEvent): "left" | "right" | null =>
      e.code === "ArrowLeft" || e.code === "KeyA" ? "left" : e.code === "ArrowRight" || e.code === "KeyD" ? "right" : null;
    const down = (e: KeyboardEvent) => {
      const held = side(e);
      if (held) {
        e.preventDefault();
        game.current[held] = true;
      } else if (e.code === "Space") {
        e.preventDefault();
        if (!e.repeat) press();
      } else if (e.code === "KeyP") {
        e.preventDefault();
        togglePause();
      }
    };
    const up = (e: KeyboardEvent) => {
      const held = side(e);
      if (held) game.current[held] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [press, togglePause]);

  // Pause when the tab is hidden or the window loses focus: no unfair misses.
  useEffect(() => {
    const pause = () => {
      const g = game.current;
      // A key held as the window lost focus never sends its keyup.
      g.left = false;
      g.right = false;
      if (g.phase === "running") setGamePhase("paused");
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

  // Keyboard focus on the play area as soon as it appears, so Space plays (the dialog opens before this chunk loads).
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
      if (viewW !== g.viewW || g.bricks.length === 0) {
        g.viewW = viewW;
        // The wall is built for the width: a new width means a new wall, and a game under way starts over.
        reset();
        if (g.phase === "running" || g.phase === "paused") setGamePhase("ready");
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

    const shatter = (b: Brick) => {
      for (let i = 0; i < 6; i++) {
        game.current.chips.push({
          x: b.x + rand(4, b.w - 8),
          y: b.y + rand(4, b.h - 8),
          vx: rand(-90, 90),
          vy: rand(-140, 10),
          size: rand(3, 6),
          tone: b.tone,
          life: CHIP_LIFE,
        });
      }
    };

    const breakBrick = (index: number) => {
      const g = game.current;
      const b = g.bricks[index];
      b.hits -= 1;
      // Legacy code cracks on the first hit and goes on the second.
      if (b.hits > 0) return;
      g.bricks.splice(index, 1);
      g.score += b.legacy ? 25 : 10;
      gameSound("collect");
      if (!reduceMotion) shatter(b);
      if (g.bricks.length === 0) {
        g.sprint += 1;
        g.speed = Math.min(MAX_SPEED, g.speed * SPRINT_SPEEDUP);
        g.bricks = buildWall(g.viewW, g.sprint);
        g.ball = restingBall(g.paddleX);
        onAnnounce(`Wall cleared. Sprint ${g.sprint}.`);
      }
    };

    const miss = () => {
      const g = game.current;
      g.lives -= 1;
      gameSound("crash");
      g.ball = restingBall(g.paddleX);
      if (g.lives > 0) {
        g.dazedUntil = g.time + 0.8;
        return;
      }
      g.crashed = true;
      const final = g.score;
      setFinalScore(final);
      if (final > g.best) {
        g.best = final;
        setBest(final);
        setNewBest(true);
        saveBest(BEST_KEY, final);
      }
      setGamePhase("over");
      onAnnounce(`Game over. Score ${final}. Best ${g.best}.`);
    };

    /** Moves the ball through `h` seconds and settles one bounce. */
    const step = (h: number) => {
      const g = game.current;
      const ball = g.ball;
      ball.x += ball.vx * h;
      ball.y += ball.vy * h;
      // The sides and the line under the HUD.
      if (ball.x < BALL_R) {
        ball.x = BALL_R;
        ball.vx = Math.abs(ball.vx);
      } else if (ball.x > g.viewW - BALL_R) {
        ball.x = g.viewW - BALL_R;
        ball.vx = -Math.abs(ball.vx);
      }
      if (ball.y < HUD_H + BALL_R) {
        ball.y = HUD_H + BALL_R;
        ball.vy = Math.abs(ball.vy);
      }
      // The paddle: where the ball lands sets the angle, straight up from the middle, out towards the ends.
      if (ball.vy > 0 && touches(ball.x, ball.y, g.paddleX - PADDLE.w / 2, PADDLE.y, PADDLE.w, PADDLE.h)) {
        const angle = clamp((ball.x - g.paddleX) / (PADDLE.w / 2 + BALL_R), -1, 1) * MAX_BOUNCE;
        ball.vx = g.speed * Math.sin(angle);
        ball.vy = -g.speed * Math.cos(angle);
        // Back on top of the bar: a ball caught on the bar's end leaves from its top, not from inside it.
        ball.y = Math.min(ball.y, PADDLE.y - BALL_R);
        gameSound("jump");
      }
      // One brick per step: bounce off the face it hit (a side when the ball is more beside it than above or below) and step out of it.
      const index = g.bricks.findIndex((b) => touches(ball.x, ball.y, b.x, b.y, b.w, b.h));
      if (index >= 0) {
        const b = g.bricks[index];
        const dx = ball.x - clamp(ball.x, b.x, b.x + b.w);
        const dy = ball.y - clamp(ball.y, b.y, b.y + b.h);
        if (Math.abs(dx) > Math.abs(dy)) {
          ball.vx = dx > 0 ? Math.abs(ball.vx) : -Math.abs(ball.vx);
          ball.x = dx > 0 ? b.x + b.w + BALL_R : b.x - BALL_R;
        } else {
          // dy is 0 only when the centre got inside: send it back the way it came.
          ball.vy = dy > 0 || (dy === 0 && ball.vy < 0) ? Math.abs(ball.vy) : -Math.abs(ball.vy);
          ball.y = ball.vy > 0 ? b.y + b.h + BALL_R : b.y - BALL_R;
        }
        breakBrick(index);
      }
      if (ball.y - BALL_R > FIELD_H) miss();
    };

    const update = (dt: number) => {
      const g = game.current;
      g.time += dt;
      if (g.phase === "paused") return;
      for (const chip of g.chips) {
        chip.vy += 700 * dt;
        chip.x += chip.vx * dt;
        chip.y += chip.vy * dt;
        chip.life -= dt;
      }
      g.chips = g.chips.filter((chip) => chip.life > 0);
      if (g.phase !== "running") return;
      const dir = (g.right ? 1 : 0) - (g.left ? 1 : 0);
      if (dir) g.paddleX = clampPaddle(g.paddleX + dir * PADDLE.speed * dt, g.viewW);
      if (g.ball.resting) {
        g.ball.x = g.paddleX;
        return;
      }
      // In steps of at most half the ball's radius, so a fast ball can never pass through a brick or the paddle.
      const steps = Math.max(1, Math.ceil((g.speed * dt) / (BALL_R / 2)));
      for (let i = 0; i < steps && !g.ball.resting; i++) step(dt / steps);
    };

    /** A chunky block: lit along the top, shaded along the bottom, its smell in mono. */
    const drawBrick = (b: Brick, p: Palette) => {
      const bright = b.tone === "danger" || b.tone === "warn" || b.tone === "accent";
      ctx.fillStyle = p[b.tone];
      ctx.strokeStyle = bright ? INK : p.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, b.h, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
      ctx.fillRect(b.x + 3, b.y + 3, b.w - 6, 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
      ctx.fillRect(b.x + 3, b.y + b.h - 5, b.w - 6, 2);
      // Legacy blocks are bolted on at the corners until the first hit cracks them.
      if (b.legacy && b.hits > 1) {
        ctx.fillStyle = bright ? INK : p.muted;
        for (const [rx, ry] of [[5, 6], [b.w - 5, 6], [5, b.h - 6], [b.w - 5, b.h - 6]]) {
          ctx.beginPath();
          ctx.arc(b.x + rx, b.y + ry, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.fillStyle = b.tone === "danger" ? "#fff" : b.tone === "border" ? p.ink : b.tone === "faint" ? p.muted : INK;
      // Long smells (!important) get a smaller size so they fit; mono letters are about 0.6 of the size wide.
      ctx.font = `700 ${Math.min(11, (b.w - 10) / (b.label.length * 0.6))}px ${MONO}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 1);
      if (b.legacy && b.hits === 1) {
        ctx.strokeStyle = bright ? INK : p.ink;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(b.x + b.w * 0.42, b.y + 1);
        ctx.lineTo(b.x + b.w * 0.52, b.y + b.h * 0.42);
        ctx.lineTo(b.x + b.w * 0.4, b.y + b.h * 0.62);
        ctx.lineTo(b.x + b.w * 0.5, b.y + b.h - 1);
        ctx.stroke();
      }
    };

    const draw = () => {
      const g = game.current;
      const p = g.palette;
      if (!p) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(g.scale, 0, 0, g.scale, 0, 0);

      // The line under the HUD: the top of the play area.
      ctx.strokeStyle = p.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, HUD_H - 1);
      ctx.lineTo(g.viewW, HUD_H - 1);
      ctx.stroke();

      for (const b of g.bricks) drawBrick(b, p);
      for (const chip of g.chips) {
        ctx.globalAlpha = chip.life / CHIP_LIFE;
        ctx.fillStyle = p[chip.tone];
        ctx.fillRect(chip.x, chip.y, chip.size, chip.size);
      }
      ctx.globalAlpha = 1;

      // The paddle: a merge bar into main.
      const left = g.paddleX - PADDLE.w / 2;
      ctx.fillStyle = p.accent;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(left, PADDLE.y, PADDLE.w, PADDLE.h, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.font = `700 9px ${MONO}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("main", g.paddleX, PADDLE.y + PADDLE.h / 2 + 0.5);

      // Solvorn: leans the way it is flying, blinks now and then. Only once it has flown in from the page.
      if (g.time > g.blinkAt + 0.14) g.blinkAt = g.time + rand(2, 5);
      const crashed = g.crashed || g.time < g.dazedUntil;
      const blink = g.time > g.blinkAt && !crashed;
      const tilt = g.ball.resting ? 0 : (g.ball.vx / g.speed) * 0.3;
      if (g.present) drawSolvorn(ctx, p, g.ball.x - BALL_SIZE / 2, g.ball.y - BALL_SIZE / 2, BALL_SIZE, { crashed, blink, tilt });

      // HUD: lives as little Solvorn-green pips and the sprint, top left; the score top right.
      ctx.lineWidth = 1.5;
      for (let i = 0; i < LIVES; i++) {
        const alive = i < g.lives;
        ctx.fillStyle = alive ? p.body : p.faint;
        ctx.strokeStyle = alive ? INK : p.border;
        ctx.beginPath();
        ctx.roundRect(16 + i * 18, 17, 12, 12, 4);
        ctx.fill();
        ctx.stroke();
      }
      ctx.font = `600 14px ${MONO}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = p.muted;
      ctx.fillText(`SPRINT ${String(g.sprint).padStart(2, "0")}`, 16 + LIVES * 18 + 8, 16);
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

  return (
    <GameField
      surfaceRef={wrapRef}
      canvasRef={canvasRef}
      label={`${GUIDE_NAME} Breaker. Move the paddle with the Left and Right arrows, A and D, or the pointer. Press Space or tap to launch, P to pause.`}
      phase={phase}
      text={{ ready: ["Ready to refactor?", "Press Space or tap to start"], over: ["Sprint failed", "Press Space or tap to play again"] }}
      score={finalScore}
      best={best}
      newBest={newBest}
      onPointerDown={tap}
      onPointerMove={aim}
    />
  );
}
