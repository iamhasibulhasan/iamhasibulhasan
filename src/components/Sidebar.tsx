import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowUpRight, Download, Mail } from "lucide-react"
import { profile } from "../data/resume"
import { GithubIcon, LinkedinIcon } from "./BrandIcons"
import { useTypewriter } from "../hooks/useTypewriter"
import AvailableTag from "./AvailableTag"
import GeneratedPortrait from "./GeneratedPortrait"

const ROLES = ["Fullstack Developer", "Hasibul Hasan", "Freelancer", "Open-Source Enthusiast", "Problem Solver"]

export default function Sidebar() {
  const typed = useTypewriter(ROLES)
  const [photoFailed, setPhotoFailed] = useState(false)
  const hasPhoto = Boolean(profile.photoUrl) && !photoFailed

  return (
    <aside className="relative z-30 px-6 pt-24 pb-8 lg:fixed lg:inset-y-6 lg:left-6 lg:aspect-[616/844] lg:px-0 lg:pb-0 lg:pt-0">
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto h-150 w-full max-w-[340px] lg:h-full lg:w-full lg:max-w-none"
      >
        {/* Card: one continuous full-bleed photo, everything else floats on top of it. Follows the site theme. */}
        <div
          className="relative isolate h-full w-full overflow-hidden rounded-[34px] border"
          style={{ borderColor: "color-mix(in srgb, var(--text) 14%, transparent)", background: "var(--bg-inset)" }}
        >
          {/* Photo — absolute, fills the entire card */}
          {hasPhoto ? (
            <img
              src={profile.photoUrl}
              alt={profile.name}
              onError={() => setPhotoFailed(true)}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ filter: "grayscale(1) contrast(1.06)" }}
            />
          ) : (
            <GeneratedPortrait />
          )}

          {/* Scrim — dark or light (matching theme) at top and bottom so overlaid content stays legible */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[1]"
            style={{
              background:
                "linear-gradient(to top, color-mix(in srgb, var(--bg) 96%, transparent) 4%, color-mix(in srgb, var(--bg) 82%, transparent) 22%, transparent 46%), linear-gradient(to bottom, color-mix(in srgb, var(--bg) 72%, transparent) 0%, transparent 26%)",
            }}
          />

          {/* Logo mark */}
          <div
            className="absolute left-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full text-xs font-bold backdrop-blur-md"
            style={{ background: "color-mix(in srgb, var(--bg-elevated) 82%, transparent)", color: "var(--accent)" }}
          >
            HH
          </div>

          {/* Vertical social rail */}
          <div className="absolute right-4 top-4 z-10 flex flex-col items-center gap-2.5">
            <a
              href={profile.socials.find((s) => s.label === "GitHub")?.href}
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-(--bg-elevated)/82 text-(--text) backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-(--accent) hover:text-(--accent-contrast)"
            >
              <GithubIcon size={15} />
            </a>
            <a
              href={profile.socials.find((s) => s.label === "LinkedIn")?.href}
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-(--bg-elevated)/82 text-(--text) backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-(--accent) hover:text-(--accent-contrast)"
            >
              <LinkedinIcon size={15} />
            </a>
            <a
              href={`mailto:${profile.email}`}
              aria-label="Email"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-(--bg-elevated)/82 text-(--text) backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-(--accent) hover:text-(--accent-contrast)"
            >
              <Mail size={15} />
            </a>
          </div>

          {/* Available for work — flush inside the card, rounded only on the outer edge */}
          <AvailableTag />

          {/* Bottom text overlay */}
          <div className="absolute inset-x-0 bottom-0 z-10 p-6 pb-9" style={{ color: "var(--text)" }}>
            <p className="min-h-10 text-3xl font-medium tracking-tight">
              Hey, I'm {typed}
              <span className="typing-cursor" style={{ color: "var(--accent)" }}>
                |
              </span>
            </p>
            <p className="mt-2.5 max-w-[34ch] text-sm font-light leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {profile.tagline}
            </p>

            <div className="mt-6 border-t" style={{ borderColor: "color-mix(in srgb, var(--text) 20%, transparent)" }} />

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <a
                href={profile.socials.find((s) => s.label === "GitHub")?.href}
                target="_blank"
                rel="noreferrer"
                aria-label="View GitHub profile"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all hover:rotate-45 hover:brightness-110"
                style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
              >
                <ArrowUpRight size={16} />
              </a>
              <a
                href="#contact"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })
                }}
                className="flex items-center gap-1.5 rounded-full px-5 py-3 text-sm font-medium transition-all hover:-translate-y-0.5 hover:brightness-110"
                style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
              >
                Let's talk
              </a>
              <a
                href={profile.cvUrl}
                download
                className="flex items-center gap-2 px-1 text-sm text-(--text) transition-colors hover:text-(--accent)"
              >
                <Download size={14} />
                Download CV
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </aside>
  )
}
