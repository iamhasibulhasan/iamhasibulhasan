import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import dynamic from "@/lib/compat/dynamic";
import { getIdleStage, subscribeGuide } from "@/lib/guide/store";
import { slapSound, snore } from "@/lib/guide/voice";
import { say } from "@/lib/guide/spoken";
import { GUIDE_NAME } from "@/lib/guide/identity";

const GuideAvatar = dynamic(() => import("@/components/guide/GuideAvatar"));

/** How often the guide might snore while asleep, and how likely each chance is. */
const SNORE_EVERY_MS = [6000, 12000] as const;
const SNORE_CHANCE = 0.7;
/** The first snore comes soon after falling asleep, so it is heard. */
const FIRST_SNORE_MS = [2500, 5000] as const;
/** How long the snore bubble stays up (about the length of the sound). */
const SNORE_BUBBLE_MS = 2600;
/** After a slap the screen stays up this long, for the "SLAP!" and the shake, then fades. */
const SLAP_MS = 750;
const SLAP_LINE = "Ow! I'm up, I'm up!";

const asleepNow = () => getIdleStage() === 3;

/**
 * The sleep screen. After a minute with no input (the guide store's idle
 * ladder reaching "asleep"), the whole site blurs and the guide naps in the
 * middle of the screen, with Zs floating up, and now and then a snore (heard
 * when its voice is on). A moving mouse doesn't wake it: it takes a slap (a
 * click or tap anywhere on the screen), which shakes it awake with a "SLAP!"
 * and a slap sound. A key or a scroll also wakes it, so it is never stuck.
 * The screen catches the slap, so the click never lands on the page beneath.
 */
export default function GuideSleepScreen() {
  const asleep = useSyncExternalStore(subscribeGuide, asleepNow, () => false);
  const reduceMotion = Boolean(useReducedMotion());
  const [snoringAt, setSnoringAt] = useState(0);
  const [slapAt, setSlapAt] = useState(0);
  useEffect(() => {
    if (!slapAt) return;
    const done = window.setTimeout(() => setSlapAt(0), SLAP_MS);
    return () => window.clearTimeout(done);
  }, [slapAt]);
  // Up while asleep, and for a moment after the slap that woke it.
  const shown = asleep || slapAt > 0;
  const slap = () => {
    if (!asleep) return;
    setSlapAt(Date.now());
    void slapSound();
    say(SLAP_LINE, 2600);
    // The store hears this pointerdown on the window and wakes the guide.
  };

  useEffect(() => {
    if (!asleep) return;
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
  }, [asleep]);

  // One guide: while it naps here, the one in the page (hero, companion) steps aside.
  useEffect(() => {
    const root = document.documentElement;
    if (shown) root.dataset.guideNapping = "";
    else delete root.dataset.guideNapping;
    return () => {
      delete root.dataset.guideNapping;
    };
  }, [shown]);

  const snoring = asleep && snoringAt > 0;

  return (
    <AnimatePresence>
      {shown && (
        <motion.div
          key="guide-sleep"
          onPointerDown={slap}
          data-guide-sleep-screen
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.15 : 0.7 }}
          className="fixed inset-0 z-[300] cursor-pointer flex flex-col items-center justify-center bg-black/80 backdrop-blur-md"
        >
          <div className="relative flex flex-col items-center">
            {/* Zs drifting up and away from its head. */}
            {!reduceMotion && !slapAt && (
              <div className="absolute -right-6 -top-10 h-24 w-20">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="guide-zzz font-display font-bold text-primary-text" style={{ animationDelay: `${i * 0.9}s`, fontSize: `${14 + i * 6}px` }}>
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

            {/* The slap: a burst of text and a quick shake. */}
            <AnimatePresence>
              {slapAt > 0 && (
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
            <motion.div
              key={slapAt || "still"}
              animate={slapAt && !reduceMotion ? { x: [0, -16, 13, -9, 6, 0], rotate: [0, -10, 8, -5, 3, 0] } : { x: 0, rotate: 0 }}
              transition={{ duration: 0.45 }}
              className="flex h-36 w-36 items-center justify-center rounded-full border border-primary/20 bg-primary/10 shadow-accent-card"
            >
              <GuideAvatar size={112} />
            </motion.div>
          </div>

          <p className="mt-7 text-center text-base font-medium text-white/90">
            {slapAt ? "He's awake!" : `${GUIDE_NAME} is napping. Slap him to wake him up.`}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
