import { useCallback, useEffect, useRef, useState } from "react";
import { gameSound } from "@/lib/guide/voice";
import { GUIDE_NAME } from "@/lib/guide/identity";
import { FIELD_H, INK, MONO, drawCommit, drawGlyphs, drawScore, drawSolvorn, fitField, makeGlyphs, rand, readBest, readPalette, saveBest, type GameProps, type Glyph, type Palette, type Phase } from "@/components/game/shared";
import { GameField } from "@/components/game/GameField";

/**
 * Solvorn Flight: one button keeps Solvorn in the air; each press gives it a
 * lift. Fly through the open port in each firewall: touching a wall or the
 * floor ends the run. Gates come a little faster and the ports narrow as the
 * score climbs; commits floating in a port are worth a bonus.
 *
 * Same set-up as the runner: the shared field (a shorter stretch of sky on
 * phones, so it stays readable), and colours from the site's theme and accent.
 */

const H = FIELD_H;
const FLOOR = H - 30;
const SIZE = 40;
const GRAVITY = 1500;
const FLAP_V = -470;
const MAX_FALL = 720;
const GATE_W = 66;
const GATE_SPACING = 240;
const START_SPEED = 170;
const MAX_SPEED = 265;
const START_GAP = 150;
const MIN_GAP = 112;
const BEST_KEY = "solvorn-flight-best";
const PORTS = [":443", ":80", ":8080", ":5432", ":1433", ":3000", ":22", ":5001"];

type Gate = { x: number; gapY: number; gap: number; port: string; passed: boolean; commit: { y: number; taken: boolean } | null };

export default function FlightGame({ onAnnounce, present, autoEnter, onEnter, spriteRectRef }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [finalScore, setFinalScore] = useState(0);
  const [best, setBest] = useState(() => readBest(BEST_KEY));
  const [newBest, setNewBest] = useState(false);

  const game = useRef({
    phase: "ready" as Phase,
    y: H / 2 - SIZE,
    vy: 0,
    score: 0,
    gates: [] as Gate[],
    nextGate: 0,
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

  const playerX = () => Math.round(game.current.viewW * 0.26);
  const speed = () => Math.min(MAX_SPEED, START_SPEED + game.current.score * 3);
  const gapFor = (score: number) => Math.max(MIN_GAP, START_GAP - score * 2);

  const reset = useCallback(() => {
    const g = game.current;
    g.y = H / 2 - SIZE;
    g.vy = 0;
    g.score = 0;
    g.gates = [];
    g.nextGate = 120;
    g.crashed = false;
    g.time = 0;
  }, []);

  const setGamePhase = useCallback((next: Phase) => {
    game.current.phase = next;
    setPhase(next);
  }, []);

  /** Where the guide hovers at the start, in screen pixels: where the flight from the page lands. */
  const spriteRect = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return null;
    const box = wrap.getBoundingClientRect();
    const k = box.width / game.current.viewW;
    const size = (SIZE + 8) * k;
    return { x: box.left + (playerX() - 4) * k, y: box.top + (game.current.y - 4) * k, width: size, height: size };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    spriteRectRef.current = spriteRect;
    return () => {
      spriteRectRef.current = null;
    };
  }, [spriteRect, spriteRectRef]);

  /** One button for everything: start, flap, or fly again. */
  const press = useCallback(() => {
    const g = game.current;
    if (g.phase === "entering") return;
    if (g.phase === "paused") {
      setGamePhase("running");
      return;
    }
    const flap = () => {
      g.vy = FLAP_V;
      gameSound("jump");
    };
    if (g.phase === "ready" || g.phase === "over") {
      const begin = () => {
        reset();
        setNewBest(false);
        setGamePhase("running");
        onAnnounce("Game started.");
        flap();
      };
      if (g.present) {
        begin();
        return;
      }
      // The first start: the guide flies in from the page to its spot, then takes off.
      reset();
      setGamePhase("entering");
      const target = spriteRect();
      void (target ? onEnter(target) : Promise.resolve()).then(() => {
        g.present = true;
        begin();
      });
      return;
    }
    flap();
  }, [onAnnounce, onEnter, reset, setGamePhase, spriteRect]);

  const togglePause = useCallback(() => {
    const g = game.current;
    if (g.phase === "running") setGamePhase("paused");
    else if (g.phase === "paused") setGamePhase("running");
  }, [setGamePhase]);

  // Keyboard: Space / Up / W to flap, P to pause. Esc is the dialog's.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        if (!e.repeat) press();
      } else if (e.code === "KeyP") {
        e.preventDefault();
        togglePause();
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [press, togglePause]);

  // Pause when the tab is hidden or the window loses focus.
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

  // Canvas size and colours.
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
        g.glyphs = makeGlyphs(viewW, FLOOR - 40);
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

    const addGate = () => {
      const g = game.current;
      const gap = gapFor(g.score + g.gates.filter((gate) => !gate.passed).length);
      const lowest = 46 + gap / 2;
      const highest = FLOOR - 40 - gap / 2;
      // The next port is within reach of the last one: hard, never impossible.
      const previous = g.gates[g.gates.length - 1]?.gapY ?? H / 2;
      const gapY = Math.max(lowest, Math.min(highest, previous + rand(-130, 130)));
      const commit = Math.random() < 0.3 ? { y: gapY + rand(-gap / 4, gap / 4), taken: false } : null;
      g.gates.push({ x: g.viewW + 10, gapY, gap, port: PORTS[Math.floor(Math.random() * PORTS.length)], passed: false, commit });
    };

    const crash = () => {
      const g = game.current;
      g.crashed = true;
      gameSound("crash");
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

    const update = (dt: number) => {
      const g = game.current;
      g.time += dt;
      const x = playerX();

      // After a crash Solvorn drops to the floor; before the start it hovers.
      if (g.phase === "over") {
        if (g.y < FLOOR - SIZE) {
          g.vy = Math.min(MAX_FALL, g.vy + GRAVITY * dt);
          g.y = Math.min(FLOOR - SIZE, g.y + g.vy * dt);
        }
        return;
      }
      if (g.phase === "ready") {
        g.y = H / 2 - SIZE + Math.sin(g.time * 3) * 8;
        return;
      }
      if (g.phase !== "running") return;

      const dx = speed() * dt;
      g.dash = (g.dash + dx) % 24;
      g.vy = Math.min(MAX_FALL, g.vy + GRAVITY * dt);
      g.y += g.vy * dt;
      if (g.y < 0) {
        g.y = 0;
        g.vy = 0;
      }
      if (!reduceMotion) for (const glyph of g.glyphs) {
        glyph.x -= dx * 0.25;
        if (glyph.x < -60) {
          glyph.x = g.viewW + rand(0, 80);
          glyph.y = rand(24, FLOOR - 40);
        }
      }

      g.nextGate -= dx;
      if (g.nextGate <= 0) {
        addGate();
        g.nextGate = GATE_SPACING;
      }
      for (const gate of g.gates) gate.x -= dx;
      g.gates = g.gates.filter((gate) => gate.x + GATE_W > -20);

      // The body is round: test a circle, a little inside the drawing, against each wall.
      const cx = x + SIZE / 2;
      const cy = g.y + SIZE / 2;
      const r = SIZE / 2 - 5;
      const touches = (left: number, top: number, w: number, h: number) => {
        const nx = Math.max(left, Math.min(cx, left + w));
        const ny = Math.max(top, Math.min(cy, top + h));
        return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
      };
      for (const gate of g.gates) {
        const top = gate.gapY - gate.gap / 2;
        const bottom = gate.gapY + gate.gap / 2;
        if (touches(gate.x, -40, GATE_W, top + 40) || touches(gate.x, bottom, GATE_W, FLOOR - bottom)) {
          crash();
          return;
        }
        if (gate.commit && !gate.commit.taken && Math.abs(cx - (gate.x + GATE_W / 2)) < 18 && Math.abs(cy - gate.commit.y) < 22) {
          gate.commit.taken = true;
          g.score += 3;
          gameSound("collect");
        }
        if (!gate.passed && gate.x + GATE_W < x) {
          gate.passed = true;
          g.score += 1;
          gameSound("collect");
        }
      }
      if (g.y >= FLOOR - SIZE) {
        g.y = FLOOR - SIZE;
        crash();
      }
    };

    /** A firewall: two brick columns with a red lip at the open port, and the port's number. */
    const drawGate = (gate: Gate, p: Palette) => {
      const top = gate.gapY - gate.gap / 2;
      const bottom = gate.gapY + gate.gap / 2;
      ctx.save();
      for (const [y0, y1] of [[-10, top], [bottom, FLOOR]] as const) {
        const h = y1 - y0;
        ctx.fillStyle = p.faint;
        ctx.strokeStyle = p.border;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(gate.x, y0, GATE_W, h, 6);
        ctx.fill();
        ctx.stroke();
        // Bricks.
        ctx.save();
        ctx.beginPath();
        ctx.rect(gate.x, y0, GATE_W, h);
        ctx.clip();
        ctx.strokeStyle = p.faint;
        ctx.lineWidth = 2;
        for (let y = y0 + 14, row = 0; y < y1; y += 14, row++) {
          ctx.beginPath();
          ctx.moveTo(gate.x, y);
          ctx.lineTo(gate.x + GATE_W, y);
          for (let bx = gate.x + (row % 2 ? 11 : 22); bx < gate.x + GATE_W; bx += 22) {
            ctx.moveTo(bx, y - 14);
            ctx.lineTo(bx, y);
          }
          ctx.stroke();
        }
        ctx.restore();
      }
      // The lips around the port.
      ctx.fillStyle = p.danger;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      for (const y of [top - 14, bottom]) {
        ctx.beginPath();
        ctx.roundRect(gate.x - 5, y, GATE_W + 10, 14, 5);
        ctx.fill();
        ctx.stroke();
      }
      // The port number, faint, in the opening.
      ctx.fillStyle = p.faint;
      ctx.font = `600 13px ${MONO}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (!gate.commit || gate.commit.taken) ctx.fillText(gate.port, gate.x + GATE_W / 2, gate.gapY);
      ctx.restore();
      if (gate.commit && !gate.commit.taken) drawCommit(ctx, p, gate.x + GATE_W / 2, gate.commit.y + Math.sin(game.current.time * 4) * 3);
    };

    const draw = () => {
      const g = game.current;
      const p = g.palette;
      if (!p) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(g.scale, 0, 0, g.scale, 0, 0);

      drawGlyphs(ctx, g.glyphs, p.faint);
      for (const gate of g.gates) drawGate(gate, p);

      // The floor.
      ctx.strokeStyle = p.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, FLOOR + 1);
      ctx.lineTo(g.viewW, FLOOR + 1);
      ctx.stroke();
      ctx.strokeStyle = p.faint;
      for (let x = -g.dash; x < g.viewW; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, FLOOR + 12);
        ctx.lineTo(x + 10, FLOOR + 12);
        ctx.stroke();
      }

      // Solvorn: tips up on a flap, down as it falls, blinks now and then.
      if (g.time > g.blinkAt + 0.14) g.blinkAt = g.time + rand(2, 5);
      const blink = g.time > g.blinkAt;
      const tilt = g.phase === "ready" ? 0 : Math.max(-0.45, Math.min(0.9, g.vy / 900));
      // Only once it has flown in from the page.
      if (g.present) drawSolvorn(ctx, p, playerX() - 4, g.y - 4, SIZE + 8, { crashed: g.crashed, blink: blink && !g.crashed, tilt });

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
      label={`${GUIDE_NAME} Flight. Press Space, the Up arrow or W to fly up, or tap.`}
      phase={phase}
      text={{ ready: ["Ready for take-off?", "Press Space or tap to fly"], over: ["Blocked by the firewall", "Press Space or tap to fly again"] }}
      score={finalScore}
      best={best}
      newBest={newBest}
      // Solvorn waits mid-air in the middle: the card keeps out of its way.
      low
      onPointerDown={press}
    />
  );
}
