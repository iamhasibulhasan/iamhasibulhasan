import { experience } from "../data/resume"
import Reveal from "./Reveal"

export default function Experience() {
  return (
    <section id="experience" className="mx-auto max-w-6xl px-6 lg:mx-0 lg:max-w-350 py-20">
      <Reveal>
        <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
          Experience
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Where I've worked</h2>
      </Reveal>

      <div className="relative mt-12 ml-2 sm:ml-4">
        <div className="absolute left-0 top-2 bottom-2 w-px" style={{ background: "var(--border)" }} />
        <div className="flex flex-col gap-10">
          {experience.map((job, i) => (
            <Reveal key={job.company} delay={i * 0.08} className="relative pl-8">
              <div
                className="absolute -left-[7px] top-1.5 h-3.5 w-3.5 rounded-full border-2"
                style={{
                  borderColor: job.current ? "var(--accent)" : "var(--border)",
                  background: job.current ? "var(--accent)" : "var(--bg)",
                }}
              />
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <h3 className="text-lg font-semibold">
                  {job.role} · {job.company}
                </h3>
                <span className="text-sm shrink-0" style={{ color: "var(--text-muted)" }}>
                  {job.period}
                </span>
              </div>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                {[job.note, job.location].filter(Boolean).join(" · ")}
              </p>
              {job.current && (
                <span
                  className="mt-3 inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{ background: "color-mix(in srgb, var(--accent) 18%, transparent)", color: "var(--accent)" }}
                >
                  Current role
                </span>
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
