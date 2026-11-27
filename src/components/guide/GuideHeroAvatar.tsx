import { useCallback, useEffect, useRef } from "react";
import Link from "@/lib/compat/link";
import { motion, useReducedMotion } from "framer-motion";
import { StaticGuideMark } from "@/components/guide/GuideAvatarSlot";
import { GuideRing } from "@/components/guide/GuideRing";
import { emitGuide } from "@/lib/guide/bus";
import { ASLEEP_LINE, BORED_LINE, DIZZY_LINE, HOVER_LINE, WAKE_LINE, greetingFor } from "@/lib/guide/hero-lines";
import { getSpoken, say as sayLine, sayPetLine, useSpoken } from "@/lib/guide/spoken";
import { useGuideView } from "@/lib/guide/useGuideView";
import { setHeroVisible } from "@/lib/guide/companion-store";
import { GUIDE_NAME, OWNER_FIRST_NAME } from "@/lib/guide/identity";
import { introPending } from "@/lib/hero-intro";
import { HERO_FACE_SHARE } from "@/lib/guide/placement";

/**
 * The guide's place in the hero, and what it says.
 *
 * There is one guide on the site: the companion (`GuideCompanion`). On desktop
 * it sits in this socket while the hero is on screen, drawn at the socket's
 * size, follows the pointer and reacts to clicks, then shrinks into the page
 * as the visitor scrolls. This component only lays out the place for it:
 *  - `GuideHeroAvatar`: the socket (ring, disc, glow and the intro's z's and
 *    pulse) sized by the identity row's `--stage`, with a still drawing that
 *    shows until the live the guide has arrived (and on phones, where the companion
 *    waits in the corner). Its button is the keyboard stop for petting the guide.
 *  - `HeroAskHost`: below the identity row, what the guide says and the proof
 *    links, or, once the visitor asks, the conversation, in the page flow.
 *
 * `data-guide-hero-avatar` is the socket the companion sits in (its layout
 * box is the stage); `data-guide-target="hero-guide"` lets the tour and the
 * agent point here.
 */

/** The face's drawn size inside the stage (the companion matches it). */
const FACE_SHARE = HERO_FACE_SHARE;

export function GuideHeroAvatar() {
  const view = useGuideView();

  // Whether the guide in the hero is the guide right now (`heroVisible`) is set by
  // the companion's frame loop from the scroll. Reset on unmount.
  useEffect(() => () => setHeroVisible(false), []);

  const say = useCallback((text: string, ms = 3200) => sayLine(text, ms), []);

  // Greet once, when the page has settled: after the intro if it plays.
  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    const greet = () => {
      if (!cancelled) timer = window.setTimeout(() => say(greetingFor(new Date().getHours()), 5200), 400);
    };
    if (!introPending()) {
      timer = window.setTimeout(() => say(greetingFor(new Date().getHours()), 5200), 1400);
    } else {
      const observer = new MutationObserver(() => {
        if (!introPending()) {
          observer.disconnect();
          greet();
        }
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-hero-intro"] });
      return () => {
        cancelled = true;
        observer.disconnect();
        window.clearTimeout(timer);
      };
    }
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [say]);

  // React to what the guide is doing: dizzy, bored, asleep, waking.
  const lastState = useRef(view.state);
  useEffect(() => {
    const previous = lastState.current;
    lastState.current = view.state;
    if (view.state === previous) return;
    const timer = window.setTimeout(() => {
      if (view.state === "confused" && view.face === "surprised") say(DIZZY_LINE);
      else if (view.state === "bored") say(BORED_LINE, 4000);
      else if (view.state === "sleeping") say(ASLEEP_LINE, 6000);
      else if (view.state === "waking") say(WAKE_LINE, 2400);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [say, view.face, view.state]);

  // Keyboard (and pointer before the live the guide has arrived): the same reaction
  // as clicking the live the guide over this socket.
  const onClick = () => {
    emitGuide({ type: "pet/click", now: Date.now() });
    sayPetLine();
  };

  return (
    <span data-guide-hero-column data-guide-target="hero-guide" className="relative flex justify-center" style={{ width: "var(--stage)", height: "var(--stage)" }}>
      <span data-hero-part="avatar-glow" aria-hidden="true" className="pointer-events-none absolute inset-[-14%] rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.16)_0%,transparent_68%)]" />
      {/* The intro moves this wrapper (in from the screen centre), and the
          live the guide follows wherever it is drawn. */}
      <span data-hero-part="stage" className="relative block h-full w-full">
        <button
          type="button"
          data-guide-hero-avatar
          onClick={onClick}
          onPointerEnter={() => {
            emitGuide({ type: "page/hover", active: true });
            if (!getSpoken()) sayLine(HOVER_LINE, 2400, true);
          }}
          onPointerLeave={() => emitGuide({ type: "page/hover", active: false })}
          onFocus={() => emitGuide({ type: "page/hover", active: true })}
          onBlur={() => emitGuide({ type: "page/hover", active: false })}
          aria-label={`${GUIDE_NAME}, ${OWNER_FIRST_NAME}'s guide. Activate for a reaction.`}
          className="group relative flex h-full w-full cursor-pointer items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {/* Out past the live disc (it is drawn larger than the stage), so the ring shows round it. */}
          <GuideRing outset="8%" />
          <span aria-hidden="true" className="pointer-events-none absolute inset-[7%] rounded-full guide-disc" />
          {/* The intro's sleeping z's and its wake pulse (animated by HeroIntro). The letters
              are drawn by CSS (data-z), not text: this sits inside the h1, which should
              read "Hasibul Hasan" to search engines, not "Hasibul zzZ Hasan". */}
          <span aria-hidden="true" data-hero-part="zz" className="pointer-events-none absolute right-[14%] top-[10%] z-20 opacity-0">
            <span data-z="z" className="hero-z absolute font-mono text-base font-bold text-primary-text" />
            <span data-z="z" className="hero-z absolute left-4 -top-5 font-mono text-xl font-bold text-primary-text [animation-delay:600ms]" />
            <span data-z="Z" className="hero-z absolute left-9 -top-11 font-mono text-2xl font-bold text-primary-text [animation-delay:1200ms]" />
          </span>
          <span aria-hidden="true" data-hero-part="pulse" className="pointer-events-none absolute inset-[12%] rounded-full border-2 border-primary/80 opacity-0" />
          {/* Until the live the guide sits here (`html[data-guide-in-hero]`), and on phones. */}
          <span data-hero-still className="guide-socket-still relative inline-flex items-center justify-center [&>svg]:h-full [&>svg]:w-full" style={{ width: `calc(var(--stage) * ${FACE_SHARE})`, height: `calc(var(--stage) * ${FACE_SHARE})` }}>
            <StaticGuideMark size={200} />
          </span>
        </button>
      </span>
    </span>
  );
}

/** Proof points under the face. Each links to the work that backs it. */
const PROOF_LINKS = [
  { label: "Microservices", href: "/work/cartup-inventory" },
  { label: "HR & payroll", href: "/work/people-hub" },
  { label: "ERP", href: "/work/erp-system" },
  { label: "PatronusR", href: "https://www.nuget.org/packages/PatronusR" },
];

/**
 * What the guide says, under the identity row, in a reserved two-line band,
 * and the proof links. One element in the flow, so nothing below moves when
 * the line changes.
 */
export function HeroCaption() {
  const view = useGuideView();
  const line = useSpoken();
  const reduceMotion = Boolean(useReducedMotion());

  return (
    <div data-hero-part="ask-host" className="w-full">
      <motion.div
        data-hero-part="avatar-ui"
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="flex w-full flex-col items-center pb-1"
      >
        {/* A reserved two-line band: greetings, reactions and the status
            line all use it, so nothing below moves when the guide talks. */}
        <p aria-live="off" className="hero-caption flex min-h-10 max-w-[30rem] items-center justify-center rounded-full border border-foreground/10 glass-subtle px-4 py-1.5 text-sm leading-[1.375rem] text-muted-foreground shadow-accent-soft" style={{ textWrap: "balance" }}>
          {line ?? (
            <span className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-500 motion-safe:animate-pulse" />
              {view.caption}
            </span>
          )}
        </p>
        <ul className="hero-proof-links mt-1 flex flex-wrap justify-center gap-x-5 gap-y-1">
          {PROOF_LINKS.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                {...(link.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                className="relative before:absolute before:-inset-y-1.5 before:inset-x-0 before:content-[''] inline-flex min-h-8 items-center text-sm font-medium text-primary-text underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
