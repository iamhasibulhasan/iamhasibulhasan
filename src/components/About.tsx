import { Languages } from "lucide-react"
import { profile, languages } from "../data/resume"
import Reveal from "./Reveal"

export default function About() {
  return (
    <section id="about" className="mx-auto max-w-6xl px-6 lg:mx-0 lg:max-w-350 py-20">
      <Reveal>
        <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
          About
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">A little about my work</h2>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <Reveal delay={0.1} className="lg:col-span-2">
          <p className="text-lg leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {profile.summary}
          </p>
          <p className="mt-4 leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Based in {profile.location}, currently building microservice-based platforms and backend systems at
            scale with .NET Core and Entity Framework Core — with side interests in applied machine learning and
            open-source tooling for the .NET ecosystem.
          </p>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="rounded-2xl border p-6" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}>
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Languages size={16} style={{ color: "var(--accent)" }} />
              Languages
            </div>
            <div className="flex flex-col gap-3">
              {languages.map((l) => (
                <div key={l.name} className="flex items-center justify-between text-sm">
                  <span>{l.name}</span>
                  <span style={{ color: "var(--text-muted)" }}>{l.level}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
