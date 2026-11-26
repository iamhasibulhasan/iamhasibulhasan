import { AnimatePresence, motion } from "framer-motion";
import { useCompanionSelector } from "@/lib/guide/companion-store";
import { useSpoken } from "@/lib/guide/spoken";
import { GuideRing } from "@/components/guide/GuideRing";

/** What the guide says once it has landed in the footer, before anything else. */
const LANDED_LINE = "That's the whole tour. Thanks for scrolling!";

/**
 * What the guide says, above its slot in the footer: the line it is saying
 * right now (a reaction to a click or hover), or a short sign-off once it has
 * landed. Nothing before it arrives, so the slot never claims the guide is
 * here when it isn't. A reserved band, so nothing moves when it talks.
 */
export function FooterGuideLine() {
  const landed = useCompanionSelector((s) => s.footerDocked);
  const line = useSpoken();
  const text = landed ? line ?? LANDED_LINE : "";
  return (
    // A reserved band: the pill grows upward from its bottom edge, so the
    // slot below never moves when the guide says something longer.
    <div aria-live="off" className="relative h-14 w-full">
      <AnimatePresence initial={false}>
        {text && (
          <motion.p
            key={text}
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-0 left-1/2 w-max max-w-[18rem] -translate-x-1/2 rounded-[1.25rem] border border-foreground/10 glass-subtle px-4 py-2 text-center text-[0.8125rem] leading-snug text-muted-foreground shadow-accent-soft"
            style={{ textWrap: "balance", transformOrigin: "50% 100%" }}
          >
            {text}
            {/* The tail, pointing down at the guide. */}
            <span aria-hidden="true" className="absolute -bottom-[5px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r border-foreground/10 glass-subtle" />
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/** The footer slot's ring, a little outside the landed 150px disc; dim while the slot is empty. */
export function FooterRing() {
  const footerDocked = useCompanionSelector((s) => s.footerDocked);
  return <GuideRing dim={!footerDocked} outset={12} className="transition-opacity duration-500" />;
}
