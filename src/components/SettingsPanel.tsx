import { AnimatePresence, motion } from "framer-motion"
import { X, RotateCcw, Check } from "lucide-react"
import {
  ACCENT_PRESETS,
  CURSOR_STYLES,
  FONT_STACKS,
  useSettings,
  type FontFamilyKey,
  type FontSizeKey,
} from "../context/SettingsContext"

const FONT_SIZE_OPTIONS: { key: FontSizeKey; label: string }[] = [
  { key: "sm", label: "Small" },
  { key: "md", label: "Medium" },
  { key: "lg", label: "Large" },
  { key: "xl", label: "XL" },
]

export default function SettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { accent, setAccent, fontSize, setFontSize, fontFamily, setFontFamily, cursorStyle, setCursorStyle, reset } =
    useSettings()

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />
          <motion.aside
            key="panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-sm overflow-y-auto border-l p-6 sm:max-w-sm"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
            role="dialog"
            aria-label="Customize appearance"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Customize</h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full hover:opacity-70"
                style={{ background: "var(--bg-inset)" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Accent color */}
            <section className="mb-8">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Accent color
              </h3>
              <div className="flex flex-wrap gap-2">
                {ACCENT_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setAccent(preset.value)}
                    title={preset.label}
                    aria-label={preset.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full ring-offset-2"
                    style={{ background: preset.value, boxShadow: accent === preset.value ? `0 0 0 2px var(--bg-elevated), 0 0 0 4px ${preset.value}` : undefined }}
                  >
                    {accent === preset.value && <Check size={14} color="#fff" />}
                  </button>
                ))}
                <label
                  className="flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-full border"
                  style={{ borderColor: "var(--border)" }}
                  title="Custom color"
                >
                  <input
                    type="color"
                    value={accent}
                    onChange={(e) => setAccent(e.target.value)}
                    className="h-12 w-12 -translate-x-1 -translate-y-1 cursor-pointer border-0 bg-transparent p-0"
                  />
                </label>
              </div>
              <input
                type="text"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                spellCheck={false}
                className="mt-3 w-full rounded-lg border px-3 py-1.5 text-sm"
                style={{ borderColor: "var(--border)", background: "var(--bg-inset)", color: "var(--text)" }}
              />
            </section>

            {/* Font size */}
            <section className="mb-8">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Font size
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {FONT_SIZE_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setFontSize(opt.key)}
                    className="rounded-lg border py-2 text-xs font-medium transition-colors"
                    style={{
                      borderColor: fontSize === opt.key ? "var(--accent)" : "var(--border)",
                      background: fontSize === opt.key ? "color-mix(in srgb, var(--accent) 15%, transparent)" : "transparent",
                      color: fontSize === opt.key ? "var(--accent)" : "var(--text)",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Font family */}
            <section className="mb-8">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Font family
              </h3>
              <div className="flex flex-col gap-2">
                {(Object.entries(FONT_STACKS) as [FontFamilyKey, (typeof FONT_STACKS)[FontFamilyKey]][]).map(
                  ([key, { label, stack }]) => (
                    <button
                      key={key}
                      onClick={() => setFontFamily(key)}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors"
                      style={{
                        borderColor: fontFamily === key ? "var(--accent)" : "var(--border)",
                        background: fontFamily === key ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "transparent",
                        fontFamily: stack,
                      }}
                    >
                      <span className="text-sm">{label}</span>
                      {fontFamily === key && <Check size={14} color="var(--accent)" />}
                    </button>
                  ),
                )}
              </div>
            </section>

            {/* Cursor style */}
            <section className="mb-8">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Cursor style
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {CURSOR_STYLES.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setCursorStyle(opt.value)}
                    className="rounded-lg border py-2 text-xs font-medium transition-colors"
                    style={{
                      borderColor: cursorStyle === opt.value ? "var(--accent)" : "var(--border)",
                      background: cursorStyle === opt.value ? "color-mix(in srgb, var(--accent) 15%, transparent)" : "transparent",
                      color: cursorStyle === opt.value ? "var(--accent)" : "var(--text)",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                Custom cursors are disabled automatically on touch devices.
              </p>
            </section>

            <button
              onClick={reset}
              className="flex w-full items-center justify-center gap-2 rounded-lg border py-2 text-sm font-medium transition-colors hover:opacity-80"
              style={{ borderColor: "var(--border)" }}
            >
              <RotateCcw size={14} />
              Reset to defaults
            </button>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
