import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check, Moon, RotateCcw, Sun, Volume2, VolumeX, X } from "lucide-react";
import { useSettings } from "@/lib/settings";
import { setGuideVoice, useGuideVoice } from "@/lib/guide/voice";
import { useLenisLock } from "@/hooks/useLenisLock";
import { ACCENT_PRESETS, CURSOR_STYLES, FONT_STACKS, type FontFamilyKey, type FontSizeKey } from "@/lib/appearance";
import { cn } from "@/lib/utils";

const FONT_SIZE_OPTIONS: { key: FontSizeKey; label: string }[] = [
  { key: "sm", label: "Small" },
  { key: "md", label: "Medium" },
  { key: "lg", label: "Large" },
  { key: "xl", label: "XL" },
];

const SECTION_LABEL = "mb-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground";
const CHOICE =
  "rounded-xl border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
const choiceState = (on: boolean) =>
  on ? "border-primary/60 bg-primary/10 text-primary-text" : "border-foreground/10 text-foreground/80 hover:border-primary/30 hover:text-foreground";

/**
 * The appearance customizer: theme, accent colour, font size, font family and
 * cursor style. A glass drawer from the right; every change applies at once
 * and is remembered for the next visit.
 */
export default function SettingsPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { theme, setTheme, accent, setAccent, fontSize, setFontSize, fontFamily, setFontFamily, cursorStyle, setCursorStyle, reset } = useSettings();
  const guideVoice = useGuideVoice();
  // Hand wheel control back to the browser so the panel scrolls and the page does not.
  useLenisLock(open);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[110] bg-black/50 glass-scrim data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          data-lenis-prevent
          className={cn(
            "fixed right-0 top-0 z-[120] flex h-full w-full max-w-sm flex-col overflow-y-auto border-l border-foreground/10 p-6 glass-strong glass-overlay shadow-accent-card",
            "data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right data-[state=closed]:duration-200 data-[state=open]:duration-300",
          )}
        >
          <div className="mb-8 flex items-center justify-between">
            <div>
              <DialogPrimitive.Title className="text-lg font-semibold text-foreground">Customize</DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-0.5 text-xs text-muted-foreground">
                Make the site yours. Changes are saved for your next visit.
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close
              aria-label="Close"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/10 text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          {/* Theme */}
          <section className="mb-8">
            <h3 className={SECTION_LABEL}>Theme</h3>
            <div className="grid grid-cols-2 gap-2">
              {(["light", "dark"] as const).map((mode) => (
                <button key={mode} type="button" aria-pressed={theme === mode} onClick={() => setTheme(mode)} className={cn(CHOICE, "flex items-center justify-center gap-2", choiceState(theme === mode))}>
                  {mode === "light" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                  {mode === "light" ? "Light" : "Dark"}
                </button>
              ))}
            </div>
          </section>

          {/* Accent colour */}
          <section className="mb-8">
            <h3 className={SECTION_LABEL}>Accent color</h3>
            <div className="flex flex-wrap gap-2.5">
              {ACCENT_PRESETS.map((preset) => {
                const on = accent.toLowerCase() === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setAccent(preset.value)}
                    title={preset.label}
                    aria-label={preset.label}
                    aria-pressed={on}
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    style={{ background: preset.value, boxShadow: on ? `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${preset.value}` : undefined }}
                  >
                    {on && <Check className="h-3.5 w-3.5 text-white mix-blend-difference" />}
                  </button>
                );
              })}
              <label
                className="relative flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-foreground/15"
                title="Custom color"
                style={{ background: "conic-gradient(#f43f5e, #f59e0b, #22c55e, #06b6d4, #3b82f6, #8b5cf6, #f43f5e)" }}
              >
                <span className="sr-only">Custom color</span>
                <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
              </label>
            </div>
            <input
              type="text"
              value={accent}
              onChange={(e) => setAccent(e.target.value.trim())}
              spellCheck={false}
              aria-label="Accent color hex"
              className="mt-3 w-full rounded-xl border border-foreground/10 bg-foreground/5 px-3 py-2 font-mono text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </section>

          {/* Font size */}
          <section className="mb-8">
            <h3 className={SECTION_LABEL}>Font size</h3>
            <div className="grid grid-cols-4 gap-2">
              {FONT_SIZE_OPTIONS.map((option) => (
                <button key={option.key} type="button" aria-pressed={fontSize === option.key} onClick={() => setFontSize(option.key)} className={cn(CHOICE, choiceState(fontSize === option.key))}>
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          {/* Font family */}
          <section className="mb-8">
            <h3 className={SECTION_LABEL}>Font family</h3>
            <div className="flex flex-col gap-2">
              {(Object.entries(FONT_STACKS) as [FontFamilyKey, (typeof FONT_STACKS)[FontFamilyKey]][]).map(([key, { label, stack }]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={fontFamily === key}
                  onClick={() => setFontFamily(key)}
                  className={cn(CHOICE, "flex items-center justify-between py-2.5 text-left text-sm", choiceState(fontFamily === key))}
                  style={{ fontFamily: stack }}
                >
                  {label}
                  {fontFamily === key && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          </section>

          {/* Cursor style */}
          <section className="mb-8">
            <h3 className={SECTION_LABEL}>Cursor style</h3>
            <div className="grid grid-cols-2 gap-2">
              {CURSOR_STYLES.map((option) => (
                <button key={option.value} type="button" aria-pressed={cursorStyle === option.value} onClick={() => setCursorStyle(option.value)} className={cn(CHOICE, choiceState(cursorStyle === option.value))}>
                  {option.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Custom cursors are turned off automatically on touch devices.</p>
          </section>

          {/* Guide voice */}
          <section className="mb-8">
            <h3 className={SECTION_LABEL}>Guide voice</h3>
            <div className="grid grid-cols-2 gap-2">
              {([true, false] as const).map((on) => (
                <button key={String(on)} type="button" aria-pressed={guideVoice === on} onClick={() => setGuideVoice(on)} className={cn(CHOICE, "flex items-center justify-center gap-2", choiceState(guideVoice === on))}>
                  {on ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                  {on ? "On" : "Off"}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">The guide chirps as it talks.</p>
          </section>

          <button
            type="button"
            onClick={reset}
            className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl border border-foreground/10 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:border-primary/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to defaults
          </button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
