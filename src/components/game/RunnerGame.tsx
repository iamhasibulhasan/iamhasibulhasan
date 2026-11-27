import { useCallback, useEffect, useRef, useState } from "react";
import { gameSound } from "@/lib/guide/voice";
import { GUIDE_NAME } from "@/lib/guide/identity";
import { drawCommit, drawGlyphs, drawScore, drawSolvorn, fitField, makeGlyphs, rand, readBest, readPalette, saveBest, type GameProps, type Glyph, type Palette, type Phase } from "@/components/game/shared";
import { GameField } from "@/components/game/GameField";

/**
 * Solvorn Runner: the guide runs along a line of code and jumps over bugs,
 * nulls and failing builds, ducks under flying exceptions by staying down,
 * and collects commits. Speed climbs as it goes; the best score is kept.
 *
 * Drawn on a canvas in the shared field (see FIELD_H in shared.ts): the road
 * on screen is shorter on phones, so the characters stay a readable size; the
 * physics are the same everywhere. Colours come from the site's CSS
 * variables, so the game follows the theme and the accent colour.
 */

const GROUND = 300;
const PLAYER = { x: 78, w: 46, h: 46 };
const GRAVITY = 2600;
const JUMP_V = -900;
/** Letting go early cuts the climb to this speed: tap for a hop, hold for a full jump. */
const RELEASE_V = -380;
const START_SPEED = 400;
const MAX_SPEED = 950;
const ACCEL = 9;
const BEST_KEY = "solvorn-runner-best";

type Kind = "bug" | "null" | "build" | "exception" | "commit";
type Thing = { kind: Kind; x: number; y: number; w: number; h: number; taken?: boolean; flap: number };

export default function RunnerGame({ onAnnounce, present, autoEnter, onEnter, spriteRectRef }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [finalScore, setFinalScore] = useState(0);
  const [best, setBest] = useState(() => readBest(BEST_KEY));
  const [newBest, setNewBest] = useState(false);

  // Everything the loop touches lives in one mutable object, so a frame never waits on React.
  const game = useRef({
    phase: "ready" as Phase,
    y: GROUND - PLAYER.h,
    vy: 0,
    holding: false,
    speed: START_SPEED,
    distance: 0,
    bonus: 0,
    nextSpawn: 520,
    things: [] as Thing[],
    glyphs: [] as Glyph[],
    dash: 0,
    time: 0,
    blinkAt: 2,
    crashed: false,
    palette: null as Palette | null,
    scale: 1,
    viewW: 640,
    best: readBest(BEST_KEY),
    // Whether the guide is here yet: it flies in from the page on the first start.
    present,
  });

  const score = () => Math.floor(game.current.distance / 12) + game.current.bonus;

  const reset = useCallback(() => {
    const g = game.current;
    g.y = GROUND - PLAYER.h;
    g.vy = 0;
    g.holding = false;
    g.speed = START_SPEED;
    g.distance = 0;
    g.bonus = 0;
    g.nextSpawn = 520;
    g.things = [];
    g.crashed = false;
    g.time = 0;
  }, []);

  const setGamePhase = useCallback((next: Phase) => {
    game.current.phase = next;
    setPhase(next);
  }, []);

  /** Where the guide stands at the start, in screen pixels: where the flight from the page lands. */
  const spriteRect = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return null;
    const box = wrap.getBoundingClientRect();
    const k = box.width / game.current.viewW;
    const size = (PLAYER.w + 12) * k;
    return { x: box.left + (PLAYER.x - 6) * k, y: box.top + (game.current.y - 6) * k, width: size, height: size };
  }, []);
  useEffect(() => {
    spriteRectRef.current = spriteRect;
    return () => {
      spriteRectRef.current = null;
    };
  }, [spriteRect, spriteRectRef]);

  /** One button for everything: start, jump, or play again. */
  const press = useCallback(() => {
    const g = game.current;
    if (g.phase === "entering") return;
    if (g.phase === "ready" || g.phase === "over") {
      const begin = () => {
        reset();
        setNewBest(false);
        setGamePhase("running");
        onAnnounce("Game started.");
      };
      if (g.present) {
        begin();
        return;
      }
      // The first start: the guide flies in from the page, then the run begins.
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
    const onGround = g.y >= GROUND - PLAYER.h - 0.5;
    if (onGround) {
      g.vy = JUMP_V;
      g.holding = true;
      gameSound("jump");
    }
  }, [onAnnounce, onEnter, reset, setGamePhase, spriteRect]);

  const release = useCallback(() => {
    const g = game.current;
    g.holding = false;
    if (g.vy < RELEASE_V) g.vy = RELEASE_V;
  }, []);

  const togglePause = useCallback(() => {
    const g = game.current;
    if (g.phase === "running") setGamePhase("paused");
    else if (g.phase === "paused") setGamePhase("running");
  }, [setGamePhase]);

  // Keyboard: Space / Up / W to jump (hold for higher), P to pause. Esc is the dialog's.
  useEffect(() => {
    const jumpKey = (e: KeyboardEvent) => e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW";
    const down = (e: KeyboardEvent) => {
      if (jumpKey(e)) {
        e.preventDefault();
        if (!e.repeat) press();
      } else if (e.code === "KeyP") {
        e.preventDefault();
        togglePause();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (jumpKey(e)) release();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [press, release, togglePause]);

  // Pause when the tab is hidden or the window loses focus: no unfair deaths.
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
      if (viewW !== g.viewW || g.glyphs.length === 0) {
        g.viewW = viewW;
        g.glyphs = makeGlyphs(viewW, GROUND - 70);
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
  }, []);

  // The loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = performance.now();

    const spawn = () => {
      const g = game.current;
      const s = score();
      const pool: Kind[] = s < 120 ? ["bug", "null"] : s < 300 ? ["bug", "null", "build"] : ["bug", "null", "build", "exception", "bug"];
      const kind = pool[Math.floor(Math.random() * pool.length)];
      const size: Record<Exclude<Kind, "commit">, { w: number; h: number; y: number }> = {
        bug: { w: 34, h: 24, y: GROUND - 24 },
        null: { w: 54, h: 28, y: GROUND - 28 },
        build: { w: 30, h: 54, y: GROUND - 54 },
        // Above a standing Solvorn's head: stay down to pass under it.
        exception: { w: 58, h: 22, y: GROUND - PLAYER.h - 44 },
      };
      const box = size[kind as Exclude<Kind, "commit">];
      g.things.push({ kind, x: g.viewW + 20, y: box.y, w: box.w, h: box.h, flap: Math.random() * 6 });
      // A commit now and then, up where a jump reaches it.
      if (kind !== "exception" && Math.random() < 0.45) {
        g.things.push({ kind: "commit", x: g.viewW + 20 + rand(150, 260), y: rand(GROUND - 150, GROUND - 90), w: 18, h: 18, flap: 0 });
      }
      // Gaps scale with speed so there is always time to react; exceptions get extra room.
      const reaction = Math.sqrt(g.speed / START_SPEED);
      g.nextSpawn = rand(360, 680) * reaction + (kind === "exception" ? 220 : 0);
    };

    const hit = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }, inset: number) =>
      a.x + inset < b.x + b.w && a.x + a.w - inset > b.x && a.y + inset < b.y + b.h && a.y + a.h - inset > b.y;

    const update = (dt: number) => {
      const g = game.current;
      g.time += dt;
      if (g.phase !== "running") return;
      g.speed = Math.min(MAX_SPEED, g.speed + ACCEL * dt);
      const dx = g.speed * dt;
      g.distance += dx;
      g.dash = (g.dash + dx) % 24;
      // Physics.
      g.vy += GRAVITY * dt;
      g.y += g.vy * dt;
      if (g.y >= GROUND - PLAYER.h) {
        g.y = GROUND - PLAYER.h;
        g.vy = 0;
      }
      // World.
      g.nextSpawn -= dx;
      if (g.nextSpawn <= 0) spawn();
      for (const t of g.things) t.x -= dx;
      g.things = g.things.filter((t) => t.x + t.w > -40);
      if (!reduceMotion) for (const glyph of g.glyphs) {
        glyph.x -= dx * 0.18;
        if (glyph.x < -60) {
          glyph.x = g.viewW + rand(0, 80);
          glyph.y = rand(24, GROUND - 70);
        }
      }
      // Collisions.
      const me = { x: PLAYER.x, y: g.y, w: PLAYER.w, h: PLAYER.h };
      for (const t of g.things) {
        if (t.kind === "commit") {
          if (!t.taken && hit(me, t, 0)) {
            t.taken = true;
            g.bonus += 25;
            gameSound("collect");
          }
        } else if (hit(me, t, 7)) {
          g.crashed = true;
          const final = score();
          gameSound("crash");
          setFinalScore(final);
          if (final > g.best) {
            g.best = final;
            setBest(final);
            setNewBest(true);
            saveBest(BEST_KEY, final);
          }
          setGamePhase("over");
          onAnnounce(`Game over. Score ${final}. Best ${g.best}.`);
          return;
        }
      }
    };

    const drawThing = (t: Thing) => {
      const p = game.current.palette!;
      const time = game.current.time;
      ctx.save();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#0a0b09";
      if (t.kind === "bug") {
        const cx = t.x + t.w / 2;
        const cy = t.y + t.h / 2 + 2;
        const wiggle = Math.sin(time * 18 + t.flap) * 2;
        ctx.strokeStyle = p.ink;
        ctx.lineWidth = 2;
        for (const side of [-1, 1]) for (const k of [-8, 0, 8]) {
          ctx.beginPath();
          ctx.moveTo(cx + k, cy);
          ctx.lineTo(cx + k + side * 2 + (side * wiggle) / 2, cy + side * 13);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(cx - 14, cy - 6);
        ctx.lineTo(cx - 22, cy - 13 + wiggle);
        ctx.moveTo(cx - 14, cy - 2);
        ctx.lineTo(cx - 23, cy - 2 - wiggle);
        ctx.stroke();
        ctx.fillStyle = p.danger;
        ctx.strokeStyle = "#0a0b09";
        ctx.beginPath();
        ctx.ellipse(cx, cy, 16, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx, cy - 11);
        ctx.lineTo(cx, cy + 11);
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(cx - 11, cy - 3, 2.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (t.kind === "null") {
        ctx.fillStyle = p.faint;
        ctx.strokeStyle = p.border;
        ctx.beginPath();
        ctx.roundRect(t.x, t.y, t.w, t.h, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = p.muted;
        ctx.font = "600 14px ui-monospace, SFMono-Regular, Consolas, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("null", t.x + t.w / 2, t.y + t.h / 2 + 1);
      } else if (t.kind === "build") {
        ctx.fillStyle = p.danger;
        ctx.beginPath();
        ctx.roundRect(t.x, t.y, t.w, t.h, 7);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        const cx = t.x + t.w / 2;
        const cy = t.y + 18;
        ctx.beginPath();
        ctx.moveTo(cx - 6, cy - 6);
        ctx.lineTo(cx + 6, cy + 6);
        ctx.moveTo(cx + 6, cy - 6);
        ctx.lineTo(cx - 6, cy + 6);
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.font = "700 10px ui-monospace, SFMono-Regular, Consolas, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("CI", cx, t.y + t.h - 13);
      } else if (t.kind === "exception") {
        const flap = Math.sin(time * 16 + t.flap) * 6;
        ctx.fillStyle = p.warn;
        for (const side of [-1, 1]) {
          const wx = side < 0 ? t.x + 6 : t.x + t.w - 6;
          ctx.beginPath();
          ctx.moveTo(wx, t.y + 6);
          ctx.lineTo(wx + side * 16, t.y - 8 + flap);
          ctx.lineTo(wx + side * 4, t.y + 12);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.roundRect(t.x, t.y, t.w, t.h, 11);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#0a0b09";
        ctx.font = "700 11px ui-monospace, SFMono-Regular, Consolas, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("throw", t.x + t.w / 2, t.y + t.h / 2 + 1);
      } else if (t.kind === "commit" && !t.taken) {
        const cx = t.x + t.w / 2;
        const cy = t.y + t.h / 2 + Math.sin(time * 4 + t.x * 0.02) * 3;
        drawCommit(ctx, p, cx, cy);
      }
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

      // The ground: a solid line with dashes scrolling under it.
      ctx.strokeStyle = p.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, GROUND + 1);
      ctx.lineTo(g.viewW, GROUND + 1);
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.strokeStyle = p.faint;
      for (let x = -g.dash; x < g.viewW; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, GROUND + 12);
        ctx.lineTo(x + 10, GROUND + 12);
        ctx.stroke();
      }

      for (const t of g.things) drawThing(t);

      // Solvorn: a little bob while running, a lean while in the air, a blink now and then.
      if (g.time > g.blinkAt + 0.14) g.blinkAt = g.time + rand(2, 5);
      const blink = g.time > g.blinkAt;
      const airborne = g.y < GROUND - PLAYER.h - 0.5;
      const bob = g.phase === "running" && !airborne ? Math.abs(Math.sin(g.time * 14)) * -3 : 0;
      const tilt = airborne ? Math.max(-0.25, Math.min(0.25, g.vy / 3600)) : 0;
      // Only once it has flown in from the page.
      if (g.present) {
        ctx.fillStyle = p.faint;
        const shadow = 1 - (GROUND - PLAYER.h - g.y) / 220;
        ctx.beginPath();
        ctx.ellipse(PLAYER.x + PLAYER.w / 2, GROUND + 3, 18 * Math.max(0.4, shadow), 4, 0, 0, Math.PI * 2);
        ctx.fill();
        drawSolvorn(ctx, p, PLAYER.x - 6, g.y - 6 + bob, PLAYER.w + 12, { crashed: g.crashed, blink: blink && !g.crashed, tilt });
      }

      drawScore(ctx, p, g.viewW - 16, score(), g.best);
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
      label={`${GUIDE_NAME} Runner. Press Space, the Up arrow or W to jump, or tap.`}
      phase={phase}
      text={{ ready: [`Ready, ${GUIDE_NAME}?`, "Press Space or tap to start"], over: ["Build failed", "Press Space or tap to play again"] }}
      score={finalScore}
      best={best}
      newBest={newBest}
      onPointerDown={press}
      onPointerUp={release}
    />
  );
}
