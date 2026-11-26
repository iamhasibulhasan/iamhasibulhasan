import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_APPEARANCE,
  FONT_SCALE,
  FONT_STACKS,
  STORAGE_KEY,
  applyAppearance,
  type Appearance,
  type CursorStyleKey,
  type FontFamilyKey,
  type FontSizeKey,
  type ThemeMode,
} from "@/lib/appearance";

interface SettingsContextValue extends Appearance {
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setAccent: (hex: string) => void;
  setFontSize: (key: FontSizeKey) => void;
  setFontFamily: (key: FontFamilyKey) => void;
  setCursorStyle: (key: CursorStyleKey) => void;
  reset: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function systemTheme(): ThemeMode {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function loadSettings(): Appearance {
  const fallback: Appearance = { ...DEFAULT_APPEARANCE, theme: systemTheme() };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...fallback, ...JSON.parse(raw) };
  } catch {
    /* ignore corrupt storage */
  }
  return fallback;
}

/**
 * The visitor's appearance settings, persisted in localStorage. The inline
 * head script applies the same settings before the first paint; this keeps
 * <html> in sync as they change.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Appearance>(loadSettings);

  useEffect(() => {
    const root = document.documentElement;
    // Switching themes or accents must not animate every colour on the page at once.
    root.classList.add("theme-switching");
    applyAppearance(root, settings, FONT_STACKS, FONT_SCALE);
    void window.getComputedStyle(document.body).opacity;
    const id = window.setTimeout(() => root.classList.remove("theme-switching"), 1);

    document.body.classList.remove("cursor-dot", "cursor-crosshair", "cursor-trail");
    if (settings.cursorStyle !== "default") document.body.classList.add(`cursor-${settings.cursorStyle}`);

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* storage unavailable */
    }
    return () => window.clearTimeout(id);
  }, [settings]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      ...settings,
      setTheme: (theme) => setSettings((s) => ({ ...s, theme })),
      toggleTheme: () => setSettings((s) => ({ ...s, theme: s.theme === "dark" ? "light" : "dark" })),
      setAccent: (accent) => setSettings((s) => ({ ...s, accent })),
      setFontSize: (fontSize) => setSettings((s) => ({ ...s, fontSize })),
      setFontFamily: (fontFamily) => setSettings((s) => ({ ...s, fontFamily })),
      setCursorStyle: (cursorStyle) => setSettings((s) => ({ ...s, cursorStyle })),
      reset: () => setSettings((s) => ({ ...DEFAULT_APPEARANCE, theme: s.theme })),
    }),
    [settings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
