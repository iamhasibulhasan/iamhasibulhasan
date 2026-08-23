import { motion } from "framer-motion"
import { Award, BookOpen, GraduationCap } from "lucide-react"
import { awards, certificates, education, publications } from "../data/resume"
import Reveal from "./Reveal"

export default function Education() {
  return (
    <section id="education" className="mx-auto max-w-6xl px-6 lg:mx-0 lg:max-w-350 py-20">
      <Reveal>
        <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
          Education & Research
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Academics & publications</h2>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <Reveal delay={0.05}>
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <GraduationCap size={16} style={{ color: "var(--accent)" }} />
            Education
          </div>
          <div className="flex flex-col gap-4">
            {education.map((edu, i) => (
              <motion.div
                key={edu.school}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="group relative overflow-hidden rounded-2xl border p-5"
                style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
              >
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: "var(--accent)" }}
                />
                <div className="relative flex items-start gap-4">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                    style={{ background: "color-mix(in srgb, var(--accent) 16%, transparent)", color: "var(--accent)" }}
                  >
                    <GraduationCap size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                      <h3 className="font-semibold">{edu.school}</h3>
                      <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
                        {edu.period}
                      </span>
                    </div>
                    <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                      {edu.degree}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <BookOpen size={16} style={{ color: "var(--accent)" }} />
            Publications
          </div>
          <div className="flex flex-col gap-4">
            {publications.map((pub) => {
              const Wrapper = pub.url ? "a" : "div"
              return (
                <Wrapper
                  key={pub.title}
                  {...(pub.url ? { href: pub.url, target: "_blank", rel: "noreferrer" } : {})}
                  className="block rounded-2xl border p-5 transition-colors hover:border-(--accent)"
                  style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-sm font-semibold leading-snug">{pub.title}</h3>
                    {pub.year && (
                      <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
                        {pub.year}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                    {pub.description}
                  </p>
                </Wrapper>
              )
            })}
          </div>

          <div className="mt-6 flex items-center gap-2 text-sm font-semibold">
            <Award size={16} style={{ color: "var(--accent)" }} />
            Awards & Certificates
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {[...awards.map((a) => a.title), ...certificates.map((c) => c.title)].map((label) => (
              <span
                key={label}
                className="rounded-full border px-3 py-1.5 text-xs font-medium"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
              >
                {label}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
