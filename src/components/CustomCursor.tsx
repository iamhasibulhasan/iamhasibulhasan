import { useEffect, useRef } from "react";
import { useSettings } from "@/lib/settings";

/**
 * The customizer's cursor styles: a dot with a trailing ring, a crosshair, or a
 * trail of dots, all in the accent colour. Off on touch screens, where there
 * is no cursor to replace.
 */
export default function CustomCursor() {
  const { cursorStyle } = useSettings();
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<HTMLDivElement[]>([]);
  const pos = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100 });
  const trailPositions = useRef(Array.from({ length: 6 }, () => ({ x: -100, y: -100 })));

  useEffect(() => {
    if (cursorStyle === "default") return;
    if (window.matchMedia?.("(pointer: coarse)").matches) return;

    const handleMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMove, { passive: true });

    let raf = 0;
    const tick = () => {
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${pos.current.x - 4}px, ${pos.current.y - 4}px, 0)`;
      }
      if (ringRef.current) {
        ring.current.x += (pos.current.x - ring.current.x) * 0.18;
        ring.current.y += (pos.current.y - ring.current.y) * 0.18;
        ringRef.current.style.transform = `translate3d(${ring.current.x - 16}px, ${ring.current.y - 16}px, 0)`;
      }
      if (cursorStyle === "trail") {
        let prev = pos.current;
        trailPositions.current = trailPositions.current.map((p, i) => {
          const next = { x: p.x + (prev.x - p.x) * 0.35, y: p.y + (prev.y - p.y) * 0.35 };
          const el = trailRefs.current[i];
          if (el) {
            el.style.transform = `translate3d(${next.x - 4}px, ${next.y - 4}px, 0) scale(${1 - i * 0.13})`;
            el.style.opacity = String(0.5 - i * 0.07);
          }
          prev = next;
          return next;
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(raf);
    };
  }, [cursorStyle]);

  if (cursorStyle === "default") return null;
  if (typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches) return null;

  const accent = { background: "var(--accent-hex)" };

  if (cursorStyle === "crosshair") {
    return (
      <div ref={ringRef} aria-hidden="true" className="custom-cursor h-8 w-8">
        <div className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2" style={accent} />
        <div className="absolute bottom-0 left-1/2 h-3 w-px -translate-x-1/2" style={accent} />
        <div className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2" style={accent} />
        <div className="absolute right-0 top-1/2 h-px w-3 -translate-y-1/2" style={accent} />
        <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full" style={accent} />
      </div>
    );
  }

  if (cursorStyle === "trail") {
    return (
      <>
        {trailPositions.current.map((_, i) => (
          <div
            key={i}
            aria-hidden="true"
            ref={(el) => {
              if (el) trailRefs.current[i] = el;
            }}
            className="custom-cursor h-2 w-2 rounded-full"
            style={accent}
          />
        ))}
      </>
    );
  }

  return (
    <>
      <div ref={dotRef} aria-hidden="true" className="custom-cursor h-2 w-2 rounded-full" style={accent} />
      <div ref={ringRef} aria-hidden="true" className="custom-cursor h-8 w-8 rounded-full border" style={{ borderColor: "var(--accent-hex)" }} />
    </>
  );
}
