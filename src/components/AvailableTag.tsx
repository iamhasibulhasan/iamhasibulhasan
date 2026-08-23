export default function AvailableTag() {
  return (
    <div
      className="absolute left-0 z-10 flex flex-col items-center gap-4 rounded-r-3xl border py-6 px-3.5"
      style={{ top: "38%", background: "rgba(26,26,26,0.85)", borderColor: "rgba(255,255,255,0.12)", borderLeft: "none", backdropFilter: "blur(6px)" }}
    >
      <span
        className="whitespace-nowrap text-xs font-medium tracking-wide text-white"
        style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
      >
        Available for Work
      </span>
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: "var(--accent)" }} />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: "var(--accent)" }} />
      </span>
    </div>
  )
}
