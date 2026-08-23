import { motion } from "framer-motion"
import { Database, LayoutGrid, Server, Wrench } from "lucide-react"
import { skillGroups } from "../data/resume"
import Reveal from "./Reveal"

const GROUP_ICONS: Record<string, typeof Server> = {
  Backend: Server,
  Data: Database,
  Frontend: LayoutGrid,
  Tools: Wrench,
}

export default function Skills() {
  return (
    <section id="skills" className="mx-auto max-w-6xl px-6 lg:mx-0 lg:max-w-350 py-20">
      <Reveal>
        <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
          Skills
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Tools of the trade</h2>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {skillGroups.map((group, i) => {
          const Icon = GROUP_ICONS[group.group] ?? Wrench
          return (
            <Reveal key={group.group} delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="group relative h-full overflow-hidden rounded-2xl border p-5"
                style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
              >
                <div
                  className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: "var(--accent)" }}
                />

                <div className="relative mb-5 flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
                    style={{ background: "color-mix(in srgb, var(--accent) 16%, transparent)", color: "var(--accent)" }}
                  >
                    <Icon size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold">{group.group}</h3>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {group.items.length} tools
                    </p>
                  </div>
                </div>

                <div className="relative flex flex-wrap gap-2">
                  {group.items.map((item, j) => (
                    <motion.span
                      key={item}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 + j * 0.04, duration: 0.3 }}
                      whileHover={{ scale: 1.06 }}
                      className="cursor-default rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-medium transition-colors hover:border-(--accent)"
                      style={{ background: "var(--bg-inset)", color: "var(--text)" }}
                    >
                      {item}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
