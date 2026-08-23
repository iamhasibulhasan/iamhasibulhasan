import { motion } from "framer-motion"
import { profile } from "../data/resume"
import { useCountUp } from "../hooks/useCountUp"

function StatCounter({ value, label, delay }: { value: string; label: string; delay: number }) {
  const match = value.match(/[\d.]+/)
  const numeric = match ? parseFloat(match[0]) : 0
  const suffix = value.replace(match?.[0] ?? "", "")
  const decimals = match?.[0]?.includes(".") ? 1 : 0
  const { ref, value: animated } = useCountUp(numeric, { decimals })

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
    >
      <div className="text-3xl font-bold sm:text-4xl">
        {animated}
        {suffix}
      </div>
      <div className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
    </motion.div>
  )
}

export default function Hero() {
  return (
    <section id="home" className="relative overflow-hidden pt-16 pb-16 sm:pt-24 lg:pt-16">
      <div className="mx-auto max-w-6xl px-6 lg:mx-0 lg:max-w-350">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="mb-4 flex items-center gap-3 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          <span>{profile.name}</span>
          <span className="h-1 w-1 rounded-full" style={{ background: "var(--text-muted)" }} />
          <span>{profile.title}</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.6 }}
          className="max-w-2xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl"
        >
          Start building{" "}
          <span
            className="inline-block rounded-xl px-2"
            style={{ background: "color-mix(in srgb, var(--accent) 22%, transparent)", color: "var(--accent)" }}
          >
            software
          </span>{" "}
          people rely on
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34, duration: 0.6 }}
          className="mt-10 grid max-w-md grid-cols-3 gap-6"
        >
          {profile.stats.map((s, i) => (
            <StatCounter key={s.label} value={s.value} label={s.label} delay={0.4 + i * 0.1} />
          ))}
        </motion.div>
      </div>

      {/* Decorative floating blob */}
      <div
        aria-hidden
        className="animate-float pointer-events-none absolute -right-24 top-1/3 h-72 w-72 rounded-full blur-3xl"
        style={{ background: "color-mix(in srgb, var(--accent) 25%, transparent)" }}
      />
    </section>
  )
}
