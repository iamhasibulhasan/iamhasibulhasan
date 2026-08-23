import { motion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"
import { projects } from "../data/resume"
import Reveal from "./Reveal"

export default function Projects() {
  return (
    <section id="projects" className="mx-auto max-w-6xl px-6 lg:mx-0 lg:max-w-350 py-20">
      <Reveal>
        <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
          Projects
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Selected work</h2>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        {projects.map((p, i) => (
          <Reveal key={p.name} delay={i * 0.08}>
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="group relative h-full overflow-hidden rounded-2xl border p-6"
              style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
            >
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: "var(--accent)" }}
              />
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-xl font-semibold">{p.name}</h3>
                <ArrowUpRight
                  size={18}
                  className="shrink-0 -translate-y-1 translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:translate-x-0 group-hover:opacity-100"
                  style={{ color: "var(--accent)" }}
                />
              </div>
              <p className="mt-1 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                {p.period}
              </p>
              <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {p.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {p.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border px-2.5 py-1 text-xs"
                    style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
