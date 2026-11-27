import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { guideHomeRect, registerGuideVisit, setGuideAway, setGuideHandover, type Point, type Rect } from "@/lib/guide/transit";
import { hushVoice, speak } from "@/lib/guide/voice";
import { emitGuide } from "@/lib/guide/bus";
import { DELIGHT_CUES, DELIGHT_GESTURES, HOMEWARD, SAD } from "@/lib/guide/expressions";
import type { AvatarCue, GestureName } from "@/lib/guide/types";
import { StaticGuideMark } from "@/components/guide/GuideAvatarSlot";

// Already loaded by the companion by then; the still drawing covers the first frame.
const GuideAvatar = lazy(() => import("@/components/guide/GuideAvatar"));

/** Its size beside the cursor, and where it sits relative to the pointer (down and to the right, out of the way). */
const CURSOR_SIZE = 52;
const CURSOR_OFFSET = { x: 44, y: 40 };
/** A picked game that never asks for its guide (an error loading it) lets it go home after this. */
const COMMIT_TIMEOUT_MS = 5000;
/** Excited lasts as long as the visitor is choosing; it is ended (not timed out) when they stop. */
const EXCITED_MS = 60_000;
/** Sad for the trip home from a game and a little while after, then it is itself again. */
const SAD_MS = 3600;
/** The hand-overs: the flyer fades in over the game's drawing, and out over the page's guide. */
const FADE_IN_MS = 160;
/**
 * Landing home it swaps with the page's guide almost at once: the two are in the
 * same pose by then (both facing front), so a quick swap can't be seen, while a
 * long cross-fade of two separately animated faces shows a double image.
 */
const HANDOVER_MS = 120;
/** How long the page's guide keeps facing front after the swap, before it looks around again. */
const HANDOVER_HOLD_MS = 500;

type Pose = { x: number; y: number; s: number };
type Ease = (t: number) => number;
type Arc = { from: Pose; to: () => Pose; t0: number; dur: number; lift: number; lean: number; swell: number; ease: Ease; onProgress?: (u: number) => void; onDone: () => void };
type Mode = "hidden" | "arc" | "follow";

/** Brisk: leaving for the cursor or diving into a game. */
const easeBrisk: Ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** Gentle at both ends: the trip home, which should feel like settling back in. */
const easeGentle: Ease = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
const centre = (rect: Rect): Pose => ({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, s: rect.width });

/**
 * The guide off the page: drawn above every dialog, it comes to the cursor
 * when the games menu opens and follows it with a speech bubble, flies into
 * the game the visitor picks (a small burst where it lands), and flies home
 * when the game closes. One animation loop moves it; React only mounts it.
 *
 * Every hand-over is a cross-fade, never a swap: leaving a game it fades in
 * over the game's drawing; arriving home it lands exactly on the page's face,
 * which shows again underneath while the flyer fades away on top of it.
 */
export function GuideTransit() {
  const [shown, setShown] = useState(false);
  const [following, setFollowing] = useState(false);
  const [line, setLine] = useState<string | null>(null);
  // The last thing said, kept on screen while the bubble fades away.
  const lastLine = useRef<string | null>(null);
  if (line) lastLine.current = line;
  // Drawn at the largest size the trip needs and scaled down, so it is sharp at both ends.
  const [box, setBox] = useState(64);
  const [look, setLook] = useState<readonly [number, number]>([0.6, 0.1]);
  const bodyRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const burstRef = useRef<HTMLDivElement>(null);

  // Everything the loop reads lives here, so moving the guide never re-renders.
  const state = useRef({
    mode: "hidden" as Mode,
    pose: { x: 0, y: 0, s: CURSOR_SIZE } as Pose,
    box: 64,
    tilt: 0,
    arc: null as Arc | null,
    target: { x: 0, y: 0, s: CURSOR_SIZE } as Pose,
    committed: false,
    goingHome: false,
    commitTimer: 0,
    raf: 0,
    last: 0,
    spoken: "",
    fade: null as Animation | null,
    matchedGaze: false,
  });

  useEffect(() => {
    const st = state.current;
    const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const atCursor = (point: Point): Pose => ({
      x: Math.min(window.innerWidth - CURSOR_SIZE / 2 - 8, point.x + CURSOR_OFFSET.x),
      y: Math.min(window.innerHeight - CURSOR_SIZE / 2 - 8, point.y + CURSOR_OFFSET.y),
      s: CURSOR_SIZE,
    });

    const draw = () => {
      const body = bodyRef.current;
      const { x, y, s } = st.pose;
      const b = st.box;
      if (body) body.style.transform = `translate(${(x - b / 2).toFixed(2)}px, ${(y - b / 2).toFixed(2)}px) rotate(${st.tilt.toFixed(2)}deg) scale(${(s / b).toFixed(4)})`;
      const bubble = bubbleRef.current;
      if (bubble) {
        // Beside it, on whichever side has room.
        const w = bubble.offsetWidth;
        const right = x + s / 2 + 10;
        const left = right + w > window.innerWidth - 8 ? x - s / 2 - 10 - w : right;
        bubble.style.transform = `translate(${left.toFixed(1)}px, ${(y - s / 2 - 4).toFixed(1)}px)`;
      }
    };

    const loop = (now: number) => {
      const dt = Math.min((now - (st.last || now)) / 1000, 1 / 20);
      st.last = now;
      if (st.mode === "arc" && st.arc) {
        const a = st.arc;
        const u = Math.min(1, (now - a.t0) / a.dur);
        const e = a.ease(u);
        const to = a.to();
        // The size follows a little behind the position, so it doesn't balloon at the start.
        const grow = Math.pow(e, 1.35);
        st.pose = {
          x: a.from.x + (to.x - a.from.x) * e,
          y: a.from.y + (to.y - a.from.y) * e - Math.sin(Math.PI * e) * a.lift,
          s: (a.from.s + (to.s - a.from.s) * grow) * (1 + a.swell * Math.sin(Math.PI * e)),
        };
        a.onProgress?.(u);
        // A lean into the trip that eases back to upright as it arrives.
        st.tilt = Math.sin(Math.PI * e) * a.lean;
        if (u >= 1) {
          st.arc = null;
          st.tilt = 0;
          a.onDone();
        }
      } else if (st.mode === "follow") {
        // Eases after the cursor with a little lag, leaning into the move.
        const k = reduceMotion() ? 1 : 1 - Math.exp(-dt * 9);
        const dx = (st.target.x - st.pose.x) * k;
        st.pose = { x: st.pose.x + dx, y: st.pose.y + (st.target.y - st.pose.y) * k, s: st.pose.s + (st.target.s - st.pose.s) * k };
        st.tilt += (Math.max(-12, Math.min(12, dx * 1.2)) - st.tilt) * Math.min(1, dt * 8);
      }
      draw();
      if (st.mode !== "hidden") st.raf = requestAnimationFrame(loop);
    };

    const start = () => {
      cancelAnimationFrame(st.raf);
      st.last = 0;
      st.raf = requestAnimationFrame(loop);
    };

    const flyTo = (to: () => Pose, opts: { dur: number; lift: number; swell: number; ease: Ease; lean?: number; onProgress?: (u: number) => void; onDone: () => void }) => {
      const from = { ...st.pose };
      const end = to();
      const towardRight = end.x >= from.x;
      setLook([towardRight ? 0.7 : -0.7, 0.1]);
      // Big enough for both ends of the trip.
      const size = Math.ceil(Math.max(from.s, end.s, CURSOR_SIZE, st.box));
      if (size !== st.box) {
        st.box = size;
        setBox(size);
      }
      st.arc = {
        from,
        to,
        t0: performance.now(),
        dur: reduceMotion() ? 1 : opts.dur,
        lift: opts.lift,
        lean: (towardRight ? 1 : -1) * (opts.lean ?? 10),
        swell: opts.swell,
        ease: opts.ease,
        onProgress: opts.onProgress,
        onDone: opts.onDone,
      };
      st.mode = "arc";
      start();
    };

    const setOpacity = (from: number, to: number, ms: number) => {
      st.fade?.cancel();
      const body = bodyRef.current;
      if (!body || reduceMotion()) {
        if (body) body.style.opacity = String(to);
        return null;
      }
      body.style.opacity = String(to);
      st.fade = body.animate([{ opacity: from }, { opacity: to }], { duration: ms, easing: "cubic-bezier(0.4, 0, 0.2, 1)" });
      return st.fade;
    };

    const show = (at: Pose, fadeIn = false, size?: number) => {
      st.fade?.cancel();
      if (bodyRef.current) bodyRef.current.style.filter = "";
      st.pose = { ...at };
      st.tilt = 0;
      st.box = Math.ceil(size ?? Math.max(at.s, CURSOR_SIZE));
      setBox(st.box);
      setShown(true);
      // The layer mounts on the next render: place it (and start its fade) before the first paint.
      requestAnimationFrame(() => {
        draw();
        if (fadeIn) setOpacity(0, 1, FADE_IN_MS);
        else if (bodyRef.current) bodyRef.current.style.opacity = "1";
      });
    };

    const hide = () => {
      lastLine.current = null;
      st.mode = "hidden";
      st.arc = null;
      st.fade?.cancel();
      st.fade = null;
      cancelAnimationFrame(st.raf);
      setShown(false);
      setFollowing(false);
      setLine(null);
    };

    /** Late in a trip home: face front (as the page's guide does now) and let the glow go, ready for the swap. */
    const matchGazeNear = (u: number) => {
      if (u > 0.55 && !st.matchedGaze) {
        st.matchedGaze = true;
        setFollowing(false);
        setLook([0, 0]);
        const body = bodyRef.current;
        if (body) body.style.filter = "drop-shadow(0 10px 24px hsl(var(--accent) / 0))";
      }
    };

    /** Lands on the page's guide: it shows again underneath, and the flyer fades away on top. */
    const handHome = (then?: () => void) => {
      st.goingHome = false;
      setGuideAway(false);
      setLine(null);
      const fade = setOpacity(1, 0, HANDOVER_MS);
      const finish = () => {
        hide();
        then?.();
        // The page's guide holds the pose a moment, then looks around again (it eases there itself).
        window.setTimeout(() => setGuideHandover(false), HANDOVER_HOLD_MS);
      };
      if (fade) fade.onfinish = finish;
      else finish();
    };

    /** The guide's mood, for the flyer and the page's guide alike (they read the same view). */
    const mood = (cue: AvatarCue | null, ms?: number, poke?: GestureName, caption?: string) => emitGuide({ type: "guide/mood", cue, ms, poke, caption, now: Date.now() });

    /** A random happy reaction: a mood from the excited, happy set and a move, never the same pair twice running. */
    let lastDelight = "";
    const delight = () => {
      let cue = DELIGHT_CUES[0];
      let gesture: GestureName = DELIGHT_GESTURES[0];
      for (let tries = 0; tries < 6; tries++) {
        cue = DELIGHT_CUES[Math.floor(Math.random() * DELIGHT_CUES.length)];
        gesture = DELIGHT_GESTURES[Math.floor(Math.random() * DELIGHT_GESTURES.length)];
        if (`${cue.state}/${gesture}` !== lastDelight) break;
      }
      lastDelight = `${cue.state}/${gesture}`;
      mood(cue, EXCITED_MS, gesture, "Let's play!");
    };

    const sayLine = (text: string | null) => {
      setLine(text);
      if (text && text !== st.spoken) speak(text);
      st.spoken = text ?? "";
    };

    const leavePage = () => {
      const home = guideHomeRect();
      setGuideAway(true);
      return home ? centre(home) : { ...st.target, y: -CURSOR_SIZE };
    };

    registerGuideVisit({
      summon(point, text) {
        if (st.committed) return;
        st.target = atCursor(point);
        if (st.mode === "hidden") {
          show(leavePage());
        } else if (!st.goingHome) {
          // Already out with the visitor, who came back to the gamepad: happy all over again.
          sayLine(text);
          delight();
          return;
        }
        // From the page, or turned around on its way home: thrilled to be asked.
        st.goingHome = false;
        setGuideHandover(false);
        setFollowing(false);
        sayLine(text);
        delight();
        flyTo(() => st.target, {
          dur: 640,
          lift: 70,
          swell: 0.1,
          ease: easeBrisk,
          onDone: () => {
            st.mode = "follow";
            setFollowing(true);
            start();
          },
        });
      },
      follow(point) {
        if (st.mode !== "hidden" && !st.goingHome && !st.committed) st.target = atCursor(point);
      },
      say(text) {
        if (st.mode !== "hidden" && !st.goingHome && !st.committed) sayLine(text);
      },
      cheer(text) {
        if (st.mode === "hidden" || st.goingHome || st.committed) return;
        const fresh = text !== st.spoken;
        sayLine(text);
        // A fresh happy reaction for each new game pointed at, not on every twitch of the pointer.
        if (fresh) delight();
      },
      commit() {
        if (st.mode === "hidden") return;
        st.committed = true;
        window.clearTimeout(st.commitTimer);
        st.commitTimer = window.setTimeout(() => {
          st.committed = false;
          this.dismiss();
        }, COMMIT_TIMEOUT_MS);
      },
      dismiss(force = false) {
        if (force) {
          window.clearTimeout(st.commitTimer);
          st.committed = false;
        }
        if (st.mode === "hidden" || st.committed || st.goingHome) return;
        st.goingHome = true;
        st.matchedGaze = false;
        setGuideHandover(true);
        setFollowing(false);
        sayLine(null);
        hushVoice();
        // Closed a game before it got there: sad. Just a menu left unused: it settles
        // into a calm smile on the way (facing front for the landing) and relaxes fully
        // with the page's guide after the hand-over.
        if (force) mood(SAD, SAD_MS, undefined, "That was fun");
        else mood(HOMEWARD, EXCITED_MS, undefined, "Let's play!");
        // Home is measured as it flies, so it lands where the page's guide is now.
        const fallback = { ...st.pose, y: -CURSOR_SIZE };
        flyTo(() => {
          const home = guideHomeRect();
          return home ? centre(home) : fallback;
        }, {
          dur: 820,
          lift: 24,
          lean: 6,
          swell: 0,
          ease: easeGentle,
          onProgress: matchGazeNear,
          onDone: () => handHome(() => {
            if (!force) mood(null);
          }),
        });
      },
      into(target) {
        window.clearTimeout(st.commitTimer);
        st.committed = false;
        st.goingHome = false;
        setFollowing(false);
        sayLine(null);
        if (st.mode === "hidden") show(leavePage());
        return new Promise<void>((resolve) => {
          flyTo(() => centre(target), {
            dur: 820,
            lift: 110,
            swell: 0.12,
            ease: easeBrisk,
            onDone: () => {
              // Into the game: the game draws it from now on; a burst marks the landing
              // and the flyer fades out over the game's own drawing.
              const ring = burstRef.current;
              if (ring && !reduceMotion()) {
                ring.style.left = `${target.x + target.width / 2}px`;
                ring.style.top = `${target.y + target.height / 2}px`;
                ring.animate(
                  [
                    { transform: "translate(-50%, -50%) scale(0.4)", opacity: 0.9 },
                    { transform: "translate(-50%, -50%) scale(1.8)", opacity: 0 },
                  ],
                  { duration: 380, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
                );
              }
              mood(null);
              resolve();
              const fade = setOpacity(1, 0, 180);
              if (fade) fade.onfinish = hide;
              else hide();
            },
          });
        });
      },
      home(from) {
        const start = guideHomeRect();
        if (!from || !start) {
          setGuideAway(false);
          return Promise.resolve();
        }
        st.goingHome = true;
        st.matchedGaze = false;
        setGuideHandover(true);
        // The game is over: sad all the way home and for a moment after, then itself again.
        mood(SAD, SAD_MS, undefined, "That was fun");
        // Fades in over the game's drawing as the game closes, then glides home.
        show(centre(from), true, Math.max(from.width, start.width));
        return new Promise<void>((resolve) => {
          const fallback = centre(from);
          flyTo(() => {
            const home = guideHomeRect();
            return home ? centre(home) : fallback;
          }, { dur: 900, lift: 90, lean: 8, swell: 0.04, ease: easeGentle, onProgress: matchGazeNear, onDone: () => handHome(resolve) });
        });
      },
      isVisiting() {
        return st.committed || (st.mode !== "hidden" && !st.goingHome);
      },
    });

    return () => {
      registerGuideVisit(null);
      cancelAnimationFrame(st.raf);
      window.clearTimeout(st.commitTimer);
    };
  }, []);

  const pose = state.current.pose;
  return createPortal(
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[130]">
      {shown && (
        <div
          ref={bodyRef}
          className="absolute left-0 top-0 drop-shadow-[0_10px_24px_hsl(var(--accent)/0.4)] transition-[filter] duration-300 will-change-transform"
          style={{
            width: box,
            height: box,
            transformOrigin: "50% 50%",
            transform: `translate(${pose.x - box / 2}px, ${pose.y - box / 2}px) scale(${pose.s / box})`,
          }}
        >
          <Suspense fallback={<StaticGuideMark size={box} />}>
            <GuideAvatar size={box} followPointer={following} lookAt={following ? null : look} />
          </Suspense>
        </div>
      )}
      {shown && lastLine.current && (
        <div
          ref={bubbleRef}
          className="absolute left-0 top-0 max-w-[15rem] rounded-2xl rounded-tl-md border border-foreground/10 px-3 py-1.5 text-xs font-medium leading-snug text-foreground glass-strong shadow-accent-card transition-opacity duration-200 ease-out motion-reduce:transition-none"
          style={{ opacity: line ? 1 : 0 }}
        >
          {line ?? lastLine.current}
        </div>
      )}
      <div ref={burstRef} className="absolute h-16 w-16 rounded-full border-2 border-primary opacity-0 shadow-[0_0_24px_hsl(var(--accent)/0.6)]" />
    </div>,
    document.body,
  );
}
