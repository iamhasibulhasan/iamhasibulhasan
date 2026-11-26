import dynamic from "@/lib/compat/dynamic";
import { useEffect, useRef, useState } from "react";
import { whenIdle } from "@/components/guide/GuideAvatarSlot";
import { START_TOUR_EVENT, type StartTourDetail } from "@/lib/guide/tour-control";
import { introPending } from "@/lib/hero-intro";

const GuideCompanion = dynamic(() => import("@/components/guide/GuideCompanion"), { ssr: false, loading: () => null });

/**
 * Mounts the scroll companion once the browser is idle, so it costs nothing on
 * first load. It also owns the tour-start listener, which has to work from the
 * first click, even before the companion itself has loaded.
 */
export function GuideCompanionMount() {
  const [ready, setReady] = useState(false);
  // The start waiting for the narrator, with its visitor path (replayed as asked).
  const [pendingTour, setPendingTour] = useState<false | StartTourDetail>(false);
  const replayingRef = useRef(false);

  // On idle, so it costs nothing on first load, except when the hero's intro
  // is about to play: the intro moves the guide itself, so it loads at once.
  useEffect(() => {
    if (introPending()) {
      queueMicrotask(() => setReady(true));
      return;
    }
    return whenIdle(() => setReady(true));
  }, []);

  // A tour start before the companion has loaded would reach nobody. Load it
  // now, then replay the event once the narrator is listening (it marks <html>).
  useEffect(() => {
    const onStart = (event: Event) => {
      if (replayingRef.current || document.documentElement.dataset.guideTour === "ready") return;
      setReady(true);
      setPendingTour((event as CustomEvent<StartTourDetail>).detail ?? {});
    };
    window.addEventListener(START_TOUR_EVENT, onStart);
    return () => window.removeEventListener(START_TOUR_EVENT, onStart);
  }, []);

  useEffect(() => {
    if (!ready || !pendingTour) return;
    const startedAt = performance.now();
    let frame = 0;
    const poll = () => {
      if (document.documentElement.dataset.guideTour === "ready") {
        replayingRef.current = true;
        window.dispatchEvent(new CustomEvent<StartTourDetail>(START_TOUR_EVENT, { detail: pendingTour || {} }));
        replayingRef.current = false;
        setPendingTour(false);
      } else if (performance.now() - startedAt < 5000) {
        frame = requestAnimationFrame(poll);
      } else {
        setPendingTour(false);
      }
    };
    frame = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(frame);
  }, [ready, pendingTour]);


  return ready ? <GuideCompanion /> : null;
}
