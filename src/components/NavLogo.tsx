import { useEffect, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";
import LogoMark from "@/components/LogoMark";
import { NAV_PLAYS, NAV_PLAY_EVENT, type NavGame } from "@/lib/guide/nav-play";

/**
 * The navbar logo: the H, which draws itself when it appears. Now and then
 * Solvorn (the one guide, flying up from the page) comes to play with it; when
 * a game starts here the H plays its part: it tips when bumped, squashes when
 * hopped on, spins when poked, loses a bite (that heals) when chomped. Solvorn's side is in GuideCompanion.
 */
export default function NavLogo() {
  const controls = useAnimationControls();
  const [kind, setKind] = useState<NavGame | null>(null);

  useEffect(() => {
    const onPlay = (event: Event) => {
      const game = (event as CustomEvent<{ kind: NavGame }>).detail?.kind;
      if (!game || !NAV_PLAYS[game]) return;
      setKind(game);
      void controls.start(NAV_PLAYS[game].h).then(() => {
        controls.set({ rotate: 0, x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1, "--bite": "0px" } as Parameters<typeof controls.set>[0]);
        setKind(null);
      });
    };
    window.addEventListener(NAV_PLAY_EVENT, onPlay);
    return () => window.removeEventListener(NAV_PLAY_EVENT, onPlay);
  }, [controls]);

  return (
    <span
      data-nav-logo
      className="relative inline-flex h-7 w-7 sm:h-8 sm:w-8 transition-transform duration-300 group-hover:scale-110 pointer-events-none"
    >
      <motion.span
        className="absolute inset-0 flex items-center justify-center"
        // It squashes from its base when hopped on, and spins round its middle.
        style={{
          originY: kind === "spin" || kind === "bite" ? 0.5 : 1,
          // The bite: a round hole at the top-right corner, its radius animated by the "bite" game.
          ...({ "--bite": "0px" } as Record<string, string>),
          WebkitMaskImage: "radial-gradient(circle at 96% 6%, transparent var(--bite), black calc(var(--bite) + 0.6px))",
          maskImage: "radial-gradient(circle at 96% 6%, transparent var(--bite), black calc(var(--bite) + 0.6px))",
        }}
        animate={controls}
      >
        <LogoMark size={32} animated className="h-7 w-7 sm:h-8 sm:w-8" />
      </motion.span>
    </span>
  );
}
