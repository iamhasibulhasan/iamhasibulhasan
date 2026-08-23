import { useEffect, useRef } from "react"
import { useSettings } from "../context/SettingsContext"

export default function CustomCursor() {
  const { cursorStyle } = useSettings()
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const trailRefs = useRef<HTMLDivElement[]>([])
  const pos = useRef({ x: 0, y: 0 })
  const ring = useRef({ x: 0, y: 0 })
  const trailPositions = useRef(Array.from({ length: 6 }, () => ({ x: 0, y: 0 })))

  useEffect(() => {
    if (cursorStyle === "default") return
    if (window.matchMedia?.("(pointer: coarse)").matches) return

    const handleMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener("mousemove", handleMove)

    let raf = 0
    const tick = () => {
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${pos.current.x - 4}px, ${pos.current.y - 4}px, 0)`
      }
      if (ringRef.current) {
        ring.current.x += (pos.current.x - ring.current.x) * 0.18
        ring.current.y += (pos.current.y - ring.current.y) * 0.18
        ringRef.current.style.transform = `translate3d(${ring.current.x - 16}px, ${ring.current.y - 16}px, 0)`
      }
      if (cursorStyle === "trail") {
        let prev = pos.current
        trailPositions.current = trailPositions.current.map((p, i) => {
          const next = { x: p.x + (prev.x - p.x) * 0.35, y: p.y + (prev.y - p.y) * 0.35 }
          const el = trailRefs.current[i]
          if (el) {
            const scale = 1 - i * 0.13
            el.style.transform = `translate3d(${next.x - 4}px, ${next.y - 4}px, 0) scale(${scale})`
            el.style.opacity = String(0.5 - i * 0.07)
          }
          prev = next
          return next
        })
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener("mousemove", handleMove)
      cancelAnimationFrame(raf)
    }
  }, [cursorStyle])

  if (cursorStyle === "default") return null
  if (typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches) return null

  if (cursorStyle === "crosshair") {
    return (
      <div ref={ringRef} className="custom-cursor h-8 w-8">
        <div className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2" style={{ background: "var(--accent)" }} />
        <div className="absolute left-1/2 bottom-0 h-3 w-px -translate-x-1/2" style={{ background: "var(--accent)" }} />
        <div className="absolute top-1/2 left-0 w-3 h-px -translate-y-1/2" style={{ background: "var(--accent)" }} />
        <div className="absolute top-1/2 right-0 w-3 h-px -translate-y-1/2" style={{ background: "var(--accent)" }} />
        <div
          className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "var(--accent)" }}
        />
      </div>
    )
  }

  if (cursorStyle === "trail") {
    return (
      <>
        {trailPositions.current.map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              if (el) trailRefs.current[i] = el
            }}
            className="custom-cursor h-2 w-2 rounded-full"
            style={{ background: "var(--accent)" }}
          />
        ))}
      </>
    )
  }

  return (
    <>
      <div ref={dotRef} className="custom-cursor h-2 w-2 rounded-full" style={{ background: "var(--accent)" }} />
      <div
        ref={ringRef}
        className="custom-cursor h-8 w-8 rounded-full border"
        style={{ borderColor: "var(--accent)" }}
      />
    </>
  )
}
