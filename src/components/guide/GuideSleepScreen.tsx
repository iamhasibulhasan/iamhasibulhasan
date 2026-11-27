import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import GuideAvatar from "@/components/guide/GuideAvatar";
import { getIdleStage, subscribeGuide } from "@/lib/guide/store";
import { slapSound, snore } from "@/lib/guide/voice";
import { say } from "@/lib/guide/spoken";
import { GUIDE_NAME } from "@/lib/guide/identity";
import { DROWSY } from "@/lib/guide/expressions";
import { guideHomeRect, setGuideHandover, type Rect } from "@/lib/guide/transit";

/** How often the guide might snore while asleep, and how likely each chance is. */
const SNORE_EVERY_MS = [6000, 12000] as const;
const SNORE_CHANCE = 0.7;
/** The first snore comes soon after falling asleep, so it is heard. */
const FIRST_SNORE_MS = [2500, 5000] as const;
/** How long the snore bubble stays up (about the length of the sound). */
const SNORE_BUBBLE_MS = 2600;
/** After a slap it stays a moment, for the "SLAP!" and the shake, before it flies home. */
const SLAP_MS = 750;
const SLAP_LINE = "Ow! I'm up, I'm up!";
/** Drifting off: the slow float from its place to the middle of the screen. */
const DOZE_MS = 1800;
/** Awake: the flight back to its place. */
const RETURN_MS = 1100;
/** The screen darkens and clears a little faster than the guide moves. */
const DIM_IN_MS = 1400;
const DIM_OUT_MS = 850;
/** After it lands home, the page's guide keeps facing front this long, then looks around again. */
const HANDOVER_HOLD_MS = 500;
/** The guide's size on the sleep screen. */
const SIZE = 112;
const FACE_FRONT: readonly [number, number] = [0, 0];

/**
 * "off": no screen. "dozing": drifting from its place to the middle, still
 * drowsy. "asleep": eyes shut, Zs, snores. "awake": slapped awake, a moment of
 * shaking. "returning": flying back to its place as the screen clears.
 */
type Phase = "off" | "dozing" | "asleep" | "awake" | "returning";
/** Where the guide is, relative to its spot on the sleep screen: an offset and a scale. */
type Pose = { x: number; y: number; s: number };

const asleepNow = () => getIdleStage() === 3;
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

/** The pose that puts the guide over `rect`, from its spot centred at `rest`. */
const poseOver = (rect: Rect, rest: { x: number; y: number }): Pose => ({
  x: rect.x + rect.width / 2 - rest.x,
  y: rect.y + rect.height / 2 - rest.y,
  s: rect.width / SIZE,
});

/** Where an element is now, read from its transform (mid-flight or at rest). */
function currentPose(el: HTMLElement): Pose {
  const matrix = new DOMMatrixReadOnly(getComputedStyle(el).transform === "none" ? undefined : getComputedStyle(el).transform);
  return { x: matrix.e, y: matrix.f, s: Math.hypot(matrix.a, matrix.b) || 1 };
}

/**
 * A float from one pose to another along a gentle arc (lifted `lift` px at
 * the middle), leaning `lean` degrees as it goes; eased over the whole trip.
 */
function float(el: HTMLElement, from: Pose, to: Pose, ms: number, lift: number, lean: number) {
  const frames: Keyframe[] = [];
  const steps = 24;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const e = easeInOutSine(t);
    const arc = Math.sin(Math.PI * e);
    const x = from.x + (to.x - from.x) * e;
    const y = from.y + (to.y - from.y) * e - arc * lift;
    const s = from.s + (to.s - from.s) * e;
    frames.push({ transform: `translate(${x}px, ${y}px) rotate(${arc * lean}deg) scale(${s})`, offset: t });
  }
  return el.animate(frames, { duration: ms, easing: "linear", fill: "forwards" });
}

/**
 * The sleep screen. After a minute with no input (the guide store's idle
 * ladder reaching "asleep") the site darkens and blurs, and the guide, still
 * drowsy, floats from its place to the middle of the screen, where its eyes
 * slowly close: Zs float up, and now and then it snores (heard when its voice
 * is on). A moving mouse doesn't wake it: it takes a slap (a click or tap
 * anywhere on the screen), which shakes it awake with a "SLAP!"; a key or a
 * scroll also wakes it, so it is never stuck. Awake, it floats back to its
 * place as the screen clears, and lands exactly on the page's guide.
 * The screen catches the slap, so the click never lands on the page beneath.
 */
export default function GuideSleepScreen() {
  const asleep = useSyncExternalStore(subscribeGuide, asleepNow, () => false);
  const reduceMotion = Boolean(useReducedMotion());
  const [phase, setPhase] = useState<Phase>("off");
  const [snoringAt, setSnoringAt] = useState(0);
  const [slapAt, setSlapAt] = useState(0);
  const slapped = useRef(false);
  /** Where the guide was on the page when it dozed off. */
  const from = useRef<Rect | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  const flyerRef = useRef<HTMLDivElement>(null);
  const flight = useRef<Animation | null>(null);

  // Asleep: drift off. Woken (a slap, a key, a scroll): a shake if slapped, then home.
  useEffect(() => {
    if (asleep) {
      if (phase === "off") {
        from.current = guideHomeRect();
        slapped.current = false;
        setPhase("dozing");
      }
      return;
    }
    if (phase === "dozing" || phase === "asleep") setPhase(slapped.current ? "awake" : "returning");
  }, [asleep, phase]);

  useEffect(() => {
    if (phase !== "awake") return;
    const next = window.setTimeout(() => setPhase("returning"), SLAP_MS);
    return () => window.clearTimeout(next);
  }, [phase]);

  const slap = () => {
    if (!asleep) return;
    slapped.current = true;
    setSlapAt(Date.now());
    void slapSound();
    say(SLAP_LINE, 2600);
    // The store hears this pointerdown on the window and wakes the guide.
  };

  // One guide: while it is on the sleep screen, the one in the page hides. Before the
  // first paint, so the two are never seen together.
  const shown = phase !== "off";
  useLayoutEffect(() => {
    if (!shown) return;
    const root = document.documentElement;
    root.dataset.guideNapping = "";
    return () => {
      delete root.dataset.guideNapping;
    };
  }, [shown]);

  // Drifting off: from exactly where the page's guide is to its spot here, as the screen darkens.
  useLayoutEffect(() => {
    if (phase !== "dozing") return;
    const flyer = flyerRef.current;
    const spot = spotRef.current?.getBoundingClientRect();
    if (!flyer || !spot) return;
    backdropRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reduceMotion ? 200 : DIM_IN_MS, easing: "ease-in-out", fill: "forwards" });
    const rest = { x: spot.left + spot.width / 2, y: spot.top + spot.height / 2 };
    const start = from.current ? poseOver(from.current, rest) : { x: 0, y: 24, s: 0.6 };
    const anim = float(flyer, start, { x: 0, y: 0, s: 1 }, reduceMotion ? 1 : DOZE_MS, 50, -7);
    flight.current = anim;
    anim.onfinish = () => setPhase((now) => (now === "dozing" ? "asleep" : now));
  }, [phase, reduceMotion]);

  // Awake: back to its place from wherever it is now, as the screen clears; it lands on
  // the page's guide (both facing front), and the screen goes.
  useLayoutEffect(() => {
    if (phase !== "returning") return;
    const flyer = flyerRef.current;
    const spot = spotRef.current?.getBoundingClientRect();
    const backdrop = backdropRef.current;
    if (!flyer || !spot) return;
    const start = currentPose(flyer);
    flight.current?.cancel();
    if (backdrop) {
      const dim = Number(getComputedStyle(backdrop).opacity);
      backdrop.getAnimations().forEach((animation) => animation.cancel());
      backdrop.animate([{ opacity: dim }, { opacity: 0 }], { duration: reduceMotion ? 150 : DIM_OUT_MS, easing: "ease-in-out", fill: "forwards" });
    }
    setGuideHandover(true);
    let release = 0;
    const done = () => {
      setPhase("off");
      release = window.setTimeout(() => setGuideHandover(false), HANDOVER_HOLD_MS);
    };
    const home = guideHomeRect();
    const rest = { x: spot.left + spot.width / 2, y: spot.top + spot.height / 2 };
    // Nowhere on screen to go back to: it just fades with the screen.
    const anim = home
      ? float(flyer, start, poseOver(home, rest), reduceMotion ? 1 : RETURN_MS, 70, 6)
      : flyer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: DIM_OUT_MS, fill: "forwards" });
    flight.current = anim;
    anim.onfinish = done;
    return () => window.clearTimeout(release);
  }, [phase, reduceMotion]);

  // Snores, only once it is properly asleep.
  const sleeping = phase === "asleep";
  useEffect(() => {
    if (!sleeping) return;
    let timer = 0;
    let hide = 0;
    let first = true;
    const next = () => {
      const [min, max] = first ? FIRST_SNORE_MS : SNORE_EVERY_MS;
      const wait = min + Math.random() * (max - min);
      timer = window.setTimeout(() => {
        if (first || Math.random() < SNORE_CHANCE) {
          first = false;
          setSnoringAt(Date.now());
          snore();
          hide = window.setTimeout(() => setSnoringAt(0), SNORE_BUBBLE_MS);
        }
        next();
      }, wait);
    };
    next();
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(hide);
      setSnoringAt(0);
    };
  }, [sleeping]);

  if (!shown) return null;
  const settled = phase === "asleep" || phase === "awake";
  const snoring = sleeping && snoringAt > 0;

  return (
    <div
      onPointerDown={slap}
      data-guide-sleep-screen
      aria-hidden="true"
      // On its way home the page is usable again at once.
      className={`fixed inset-0 z-[300] ${phase === "returning" ? "pointer-events-none" : "cursor-pointer"}`}
    >
      <div ref={backdropRef} className="absolute inset-0 bg-black/80 opacity-0 backdrop-blur-md" />
      <div className="relative flex h-full flex-col items-center justify-center">
        <div className="relative flex flex-col items-center">
          {/* Zs drifting up and away from its head. */}
          {!reduceMotion && sleeping && (
            <div className="absolute -right-6 -top-10 h-24 w-20">
              {[0, 1, 2].map((i) => (
                <span key={i} className="guide-zzz font-display font-bold text-primary-text" style={{ animationDelay: `${0.6 + i * 0.9}s`, fontSize: `${14 + i * 6}px` }}>
                  z
                </span>
              ))}
            </div>
          )}

          <AnimatePresence>
            {snoring && (
              <motion.div
                key="snore"
                initial={{ opacity: 0, y: 6, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-semibold text-white shadow-accent-card"
              >
                Zzz… <span className="text-white/60">*snore*</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* The slap: a burst of text. */}
          <AnimatePresence>
            {phase === "awake" && slapAt > 0 && (
              <motion.div
                key={slapAt}
                initial={{ opacity: 0, scale: 0.4, rotate: -14 }}
                animate={{ opacity: 1, scale: 1.15, rotate: -8 }}
                exit={{ opacity: 0, scale: 1.4 }}
                transition={{ type: "spring", stiffness: 520, damping: 14 }}
                className="absolute -left-24 top-2 font-display text-3xl font-black tracking-tight text-primary-text"
              >
                SLAP!
              </motion.div>
            )}
          </AnimatePresence>

          {/* Its spot: a soft round bed that shows once it has settled, and the guide over it. */}
          <div ref={spotRef} className="relative flex h-36 w-36 items-center justify-center">
            <div
              className={`absolute inset-0 rounded-full border border-primary/20 bg-primary/10 shadow-accent-card transition-opacity duration-700 ease-out ${settled ? "opacity-100" : "opacity-0"}`}
            />
            <div ref={flyerRef} className="relative will-change-transform">
              <motion.div
                key={slapAt || "still"}
                animate={phase === "awake" && !reduceMotion ? { x: [0, -16, 13, -9, 6, 0], rotate: [0, -10, 8, -5, 3, 0] } : { x: 0, rotate: 0 }}
                transition={{ duration: 0.45 }}
              >
                <GuideAvatar size={SIZE} lookAt={FACE_FRONT} cue={phase === "dozing" ? DROWSY : null} />
              </motion.div>
            </div>
          </div>
        </div>

        <p className={`mt-7 text-center text-base font-medium text-white/90 transition-opacity duration-500 ${settled ? "opacity-100" : "opacity-0"}`}>
          {phase === "awake" || phase === "returning" ? "He's awake!" : `${GUIDE_NAME} is napping. Slap him to wake him up.`}
        </p>
      </div>
    </div>
  );
}
