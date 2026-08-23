import type { ReactNode } from "react"
import { Code, Database, GitBranch, Globe } from "lucide-react"
import Reveal from "./Reveal"

function ReactMark() {
  return (
    <svg viewBox="-11 -11 22 22" width="13" height="13">
      <circle r="2" fill="#61dafb" />
      <g stroke="#61dafb" strokeWidth="1" fill="none">
        <ellipse rx="10" ry="4.4" />
        <ellipse rx="10" ry="4.4" transform="rotate(60)" />
        <ellipse rx="10" ry="4.4" transform="rotate(120)" />
      </g>
    </svg>
  )
}

function TailwindMark() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="#fff">
      <path d="M12 6c-2.67 0-4.33 1.33-5 4 1-1.33 2.17-1.83 3.5-1.5.76.19 1.31.74 1.91 1.35.98 1 2.11 2.15 4.59 2.15 2.67 0 4.33-1.33 5-4-1 1.33-2.17 1.83-3.5 1.5-.76-.19-1.31-.74-1.91-1.35C15.61 7.15 14.48 6 12 6ZM7 12c-2.67 0-4.33 1.33-5 4 1-1.33 2.17-1.83 3.5-1.5.76.19 1.31.74 1.91 1.35.98 1 2.11 2.15 4.59 2.15 2.67 0 4.33-1.33 5-4-1 1.33-2.17 1.83-3.5 1.5-.76-.19-1.31-.74-1.91-1.35C10.61 13.15 9.48 12 7 12Z" />
    </svg>
  )
}

const TECHS: { label: string; bg: string; fg: string; mark: ReactNode }[] = [
  { label: ".NET Core", bg: "#512bd4", fg: "#ffffff", mark: <span className="text-[7px] font-extrabold">.NET</span> },
  { label: "C#", bg: "#9b4f96", fg: "#ffffff", mark: <span className="text-[9px] font-extrabold">C#</span> },
  { label: "Entity Framework", bg: "#2f2f2f", fg: "#ffffff", mark: <span className="text-[8px] font-extrabold">EF</span> },
  { label: "JavaScript", bg: "#f7df1e", fg: "#111111", mark: <span className="text-[8px] font-extrabold">JS</span> },
  { label: "React", bg: "#0f172a", fg: "#61dafb", mark: <ReactMark /> },
  { label: "Tailwind CSS", bg: "#0891b2", fg: "#ffffff", mark: <TailwindMark /> },
  { label: "Bootstrap", bg: "#7952b3", fg: "#ffffff", mark: <span className="text-[9px] font-extrabold">B</span> },
  { label: "jQuery", bg: "#0769ad", fg: "#ffffff", mark: <span className="text-[8px] font-extrabold">jQ</span> },
  { label: "SQL Server", bg: "#cc2927", fg: "#ffffff", mark: <Database size={11} /> },
  { label: "PostgreSQL", bg: "#336791", fg: "#ffffff", mark: <Database size={11} /> },
  { label: "MUI", bg: "#007fff", fg: "#ffffff", mark: <span className="text-[7px] font-extrabold">MUI</span> },
  { label: "Git", bg: "#f05033", fg: "#ffffff", mark: <GitBranch size={11} /> },
  { label: "VS Code", bg: "#007acc", fg: "#ffffff", mark: <Code size={11} /> },
]

function TechMark({ label, bg, fg, mark }: (typeof TECHS)[number]) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md" style={{ background: bg, color: fg }}>
        {mark}
      </span>
      <span className="whitespace-nowrap text-sm font-semibold tracking-tight" style={{ color: "var(--text)" }}>
        {label}
      </span>
    </div>
  )
}

export default function TechMarquee() {
  const loop = [...TECHS, ...TECHS]

  return (
    <section className="py-6">
      <div className="mx-auto max-w-6xl px-6 lg:mx-0 lg:max-w-350">
        <Reveal>
          <p className="mb-4 flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
            <Globe size={14} />
            Tools & technologies I build with
          </p>
        </Reveal>
        <div
          className="overflow-hidden"
          style={{
            maskImage: "linear-gradient(to right, transparent, black 4%, black 96%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 4%, black 96%, transparent)",
          }}
        >
          <div className="marquee-track flex w-max gap-8">
            {loop.map((tech, i) => (
              <TechMark key={`${tech.label}-${i}`} {...tech} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
