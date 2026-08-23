import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

export type ThemeMode = "light" | "dark"
export type FontSizeKey = "sm" | "md" | "lg" | "xl"
export type FontFamilyKey = "generalSans" | "inter" | "spaceGrotesk" | "poppins" | "sora" | "jetbrains"
export type CursorStyleKey = "default" | "dot" | "crosshair" | "trail"

export const FONT_SCALE: Record<FontSizeKey, number> = {
  sm: 0.9,
  md: 1,
  lg: 1.1,
  xl: 1.22,
}

export const FONT_STACKS: Record<FontFamilyKey, { label: string; stack: string }> = {
  generalSans: { label: "General Sans", stack: `"General Sans", "Inter", ui-sans-serif, system-ui, sans-serif` },
  inter: { label: "Inter", stack: `"Inter", ui-sans-serif, system-ui, sans-serif` },
  spaceGrotesk: { label: "Space Grotesk", stack: `"Space Grotesk", ui-sans-serif, system-ui, sans-serif` },
  poppins: { label: "Poppins", stack: `"Poppins", ui-sans-serif, system-ui, sans-serif` },
  sora: { label: "Sora", stack: `"Sora", ui-sans-serif, system-ui, sans-serif` },
  jetbrains: { label: "JetBrains Mono", stack: `"JetBrains Mono", ui-monospace, SFMono-Regular, monospace` },
}

export const ACCENT_PRESETS = [
  { label: "Signal Green", value: "#22c55e" },
  { label: "Electric Blue", value: "#3b82f6" },
  { label: "Violet", value: "#8b5cf6" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Rose", value: "#f43f5e" },
  { label: "Cyan", value: "#06b6d4" },
]

export const CURSOR_STYLES: { label: string; value: CursorStyleKey }[] = [
  { label: "Default", value: "default" },
  { label: "Dot Follower", value: "dot" },
  { label: "Crosshair", value: "crosshair" },
  { label: "Trail", value: "trail" },
]

interface Settings {
  theme: ThemeMode
  accent: string
  fontSize: FontSizeKey
  fontFamily: FontFamilyKey
  cursorStyle: CursorStyleKey
}

interface SettingsContextValue extends Settings {
  setTheme: (t: ThemeMode) => void
  toggleTheme: () => void
  setAccent: (hex: string) => void
  setFontSize: (k: FontSizeKey) => void
  setFontFamily: (k: FontFamilyKey) => void
  setCursorStyle: (k: CursorStyleKey) => void
  reset: () => void
}

const STORAGE_KEY = "portfolio-settings"

const defaultSettings: Settings = {
  theme: "dark",
  accent: "#22c55e",
  fontSize: "md",
  fontFamily: "generalSans",
  cursorStyle: "default",
}

function loadSettings(): Settings {
  if (typeof window === "undefined") return defaultSettings
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) }
  } catch {
    /* ignore corrupt storage */
  }
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true
  return { ...defaultSettings, theme: prefersDark ? "dark" : "light" }
}

function getContrastColor(hex: string): string {
  const clean = hex.replace("#", "")
  if (clean.length !== 6) return "#05170c"
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? "#0a0b09" : "#ffffff"
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", settings.theme === "dark")
    root.style.setProperty("--accent", settings.accent)
    root.style.setProperty("--accent-contrast", getContrastColor(settings.accent))
    root.style.setProperty("--font-scale", String(FONT_SCALE[settings.fontSize]))
    root.style.setProperty("--font-sans", FONT_STACKS[settings.fontFamily].stack)

    document.body.classList.remove("cursor-dot", "cursor-crosshair", "cursor-trail")
    if (settings.cursorStyle !== "default") {
      document.body.classList.add(`cursor-${settings.cursorStyle}`)
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      /* storage unavailable */
    }
  }, [settings])

  const value = useMemo<SettingsContextValue>(
    () => ({
      ...settings,
      setTheme: (theme) => setSettings((s) => ({ ...s, theme })),
      toggleTheme: () => setSettings((s) => ({ ...s, theme: s.theme === "dark" ? "light" : "dark" })),
      setAccent: (accent) => setSettings((s) => ({ ...s, accent })),
      setFontSize: (fontSize) => setSettings((s) => ({ ...s, fontSize })),
      setFontFamily: (fontFamily) => setSettings((s) => ({ ...s, fontFamily })),
      setCursorStyle: (cursorStyle) => setSettings((s) => ({ ...s, cursorStyle })),
      reset: () => setSettings(defaultSettings),
    }),
    [settings],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider")
  return ctx
}
