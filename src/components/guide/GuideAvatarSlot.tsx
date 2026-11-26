
import dynamic from "@/lib/compat/dynamic";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { GuideAvatarProps } from "@/components/guide/GuideAvatar";
import { introPending } from "@/lib/hero-intro";

const GuideAvatar = dynamic(() => import("@/components/guide/GuideAvatar"), {
  ssr: false,
  loading: () => null,
});

type NavigatorWithHints = Navigator & {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
};

/** Low-power devices keep the static mark: the avatar is a nicety, not content. */
export function prefersStatic() {
  const nav = navigator as NavigatorWithHints;
  return Boolean(nav.connection?.saveData) || (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2);
}

let idleReady = false;
const idleWaiters = new Set<() => void>();

/** Resolves once the browser is idle after load, shared by every slot. */
export function whenIdle(callback: () => void) {
  if (idleReady) {
    callback();
    return () => {};
  }
  idleWaiters.add(callback);
  if (idleWaiters.size === 1) {
    const release = () => {
      idleReady = true;
      idleWaiters.forEach((waiter) => waiter());
      idleWaiters.clear();
    };
    const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(release, { timeout: 2500 });
    else window.setTimeout(release, 1200);
  }
  return () => idleWaiters.delete(callback);
}

/**
 * Reserves the avatar's box and shows a static mark until the live avatar is
 * mounted on idle, so the avatar never costs initial-load JS or layout shift.
 */
export function GuideAvatarSlot({
  size,
  className,
  onDrawn,
  ...props
}: GuideAvatarProps & {
  /** Called once the live avatar has drawn (the hero's intro waits for it). */
  onDrawn?: () => void;
}) {
  const [live, setLive] = useState(false);
  // The still drawing stays on screen until the live avatar has actually
  // drawn (its chunk loads asynchronously), then the two cross-fade. Swapping
  // straight away left the slot empty for a moment on every load.
  const [drawn, setDrawn] = useState(false);
  const liveRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (prefersStatic()) return;
    // The hero's intro is waiting for this avatar: load it now, not on idle.
    if (onDrawn && introPending()) {
      queueMicrotask(() => setLive(true));
      return;
    }
    return whenIdle(() => setLive(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const node = liveRef.current;
    if (!live || !node) return;
    const check = () => {
      if (node.querySelector("svg")) {
        setDrawn(true);
        onDrawn?.();
        return true;
      }
      return false;
    };
    if (check()) return;
    const observer = new MutationObserver(() => {
      if (check()) observer.disconnect();
    });
    observer.observe(node, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [live, onDrawn]);

  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center", className)} style={{ width: size, height: size }}>
      <span
        aria-hidden="true"
        data-hero-still
        className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 motion-reduce:transition-none"
        style={{ opacity: drawn ? 0 : 1 }}
      >
        <StaticGuideMark size={size} />
      </span>
      {live && (
        <span ref={liveRef} className="relative inline-flex transition-opacity duration-300 motion-reduce:transition-none" style={{ opacity: drawn ? 1 : 0 }}>
          <GuideAvatar size={size} {...props} />
        </span>
      )}
    </span>
  );
}

/** A still drawing of the guide's face: shown before load and on low-power devices. */
export function StaticGuideMark({ size }: { size: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="-150 -170 300 320" className="overflow-visible">
      <rect x="-113" y="-107" width="226" height="214" rx="34" style={{ fill: "var(--guide-body)" }} stroke="#0a0b09" strokeWidth="6" />
      <rect x="91" y="-137" width="42" height="42" rx="9" transform="rotate(18 112 -116)" style={{ fill: "var(--guide-ears)" }} stroke="#0a0b09" strokeWidth="5" />
      <rect x="129" y="-161" width="22" height="22" rx="5" transform="rotate(32 140 -150)" style={{ fill: "var(--guide-ears)" }} stroke="#0a0b09" strokeWidth="4" />
      <ellipse cx="-40" cy="-12" rx="19" ry="28" fill="#0a0b09" />
      <ellipse cx="40" cy="-12" rx="19" ry="28" fill="#0a0b09" />
      <rect x="-9" y="32" width="18" height="5" rx="2.5" fill="#0a0b09" />
    </svg>
  );
}
