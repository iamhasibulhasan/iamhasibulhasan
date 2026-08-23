import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Home, User, Briefcase, FolderKanban, Sparkles, GraduationCap, Mail, Sun, Moon, SlidersHorizontal, ArrowUp } from "lucide-react"
import { useActiveSection } from "../hooks/useActiveSection"
import { useSettings } from "../context/SettingsContext"

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: Home },
  { id: "about", label: "About", icon: User },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "skills", label: "Skills", icon: Sparkles },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "contact", label: "Contact", icon: Mail },
]

export default function NavDock({ onOpenSettings }: { onOpenSettings: () => void }) {
  const ids = NAV_ITEMS.map((i) => i.id)
  const active = useActiveSection(ids)
  const { theme, toggleTheme } = useSettings()
  const [showTop, setShowTop] = useState(false)

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 480)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" })

  return (
    <>
      {/* Desktop vertical dock */}
      <div className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 md:flex">
        <button
          onClick={toggleTheme}
          title="Toggle theme"
          aria-label="Toggle theme"
          className="flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-xl transition-colors hover:opacity-80"
          style={{ background: "color-mix(in srgb, var(--bg-elevated) 80%, transparent)", borderColor: "var(--border)", color: "var(--text-muted)" }}
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <nav
          className="flex flex-col items-center gap-2 rounded-full border p-2 backdrop-blur-xl"
          style={{ background: "color-mix(in srgb, var(--bg-elevated) 80%, transparent)", borderColor: "var(--border)" }}
          aria-label="Section navigation"
        >
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              onClick={() => scrollTo(id)}
              title={label}
              aria-label={label}
              aria-current={active === id}
              animate={{ scale: active === id ? 1.2 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="group relative flex h-10 w-10 items-center justify-center rounded-full transition-colors"
              style={{
                background: active === id ? "var(--accent)" : "transparent",
                color: active === id ? "var(--accent-contrast)" : "var(--text-muted)",
              }}
            >
              <Icon size={17} strokeWidth={2} />
              <span
                className="pointer-events-none absolute right-12 whitespace-nowrap rounded-md border px-2 py-1 text-xs opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text)" }}
              >
                {label}
              </span>
            </motion.button>
          ))}
        </nav>

        <button
          onClick={onOpenSettings}
          title="Customize"
          aria-label="Open customization panel"
          className="flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-xl transition-colors hover:opacity-80"
          style={{ background: "color-mix(in srgb, var(--bg-elevated) 80%, transparent)", borderColor: "var(--border)", color: "var(--text-muted)" }}
        >
          <SlidersHorizontal size={17} />
        </button>
      </div>

      {/* Back to top */}
      <AnimatePresence>
        {showTop && (
          <motion.button
            initial={{ opacity: 0, y: 12, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.8 }}
            transition={{ duration: 0.25 }}
            onClick={scrollToTop}
            title="Back to top"
            aria-label="Back to top"
            className="fixed right-4 bottom-4 z-40 hidden h-11 w-11 items-center justify-center rounded-full border shadow-sm backdrop-blur-xl transition-transform hover:-translate-y-0.5 md:flex"
            style={{ background: "color-mix(in srgb, var(--bg-elevated) 88%, transparent)", borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            <ArrowUp size={17} />
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showTop && (
          <motion.button
            initial={{ opacity: 0, y: 12, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.8 }}
            transition={{ duration: 0.25 }}
            onClick={scrollToTop}
            aria-label="Back to top"
            className="fixed right-3 bottom-20 z-40 flex h-10 w-10 items-center justify-center rounded-full border shadow-sm backdrop-blur-xl md:hidden"
            style={{ background: "color-mix(in srgb, var(--bg-elevated) 88%, transparent)", borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            <ArrowUp size={16} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mobile bottom bar */}
      <nav
        className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-between rounded-2xl border px-2 py-2 backdrop-blur-xl md:hidden"
        style={{ background: "color-mix(in srgb, var(--bg-elevated) 88%, transparent)", borderColor: "var(--border)" }}
        aria-label="Section navigation"
      >
        {NAV_ITEMS.slice(0, 5).map(({ id, label, icon: Icon }) => (
          <motion.button
            key={id}
            onClick={() => scrollTo(id)}
            aria-label={label}
            animate={{ scale: active === id ? 1.15 : 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{
              background: active === id ? "var(--accent)" : "transparent",
              color: active === id ? "var(--accent-contrast)" : "var(--text-muted)",
            }}
          >
            <Icon size={17} />
          </motion.button>
        ))}
        <button
          onClick={onOpenSettings}
          aria-label="Open customization panel"
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ color: "var(--text-muted)" }}
        >
          <SlidersHorizontal size={17} />
        </button>
      </nav>
    </>
  )
}
