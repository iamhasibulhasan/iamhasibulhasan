/**
 * The visitor's appearance settings (the customizer): theme, accent colour,
 * font size, font family and cursor style, the same options and storage key
 * as the previous site, so returning visitors keep what they chose.
 *
 * `applyAppearance` turns them into CSS variables on <html>. It runs twice:
 * inline in <head> before the first paint (`APPEARANCE_SCRIPT`, so the page
 * never flashes the default colour), and from React whenever a setting
 * changes. It is serialised into that script with `toString()`, so it must
 * stay self-contained: no imports, no outside helpers.
 */

export type ThemeMode = "light" | "dark";
export type FontSizeKey = "sm" | "md" | "lg" | "xl";
export type FontFamilyKey = "generalSans" | "inter" | "spaceGrotesk" | "poppins" | "sora" | "jetbrains";
export type CursorStyleKey = "default" | "dot" | "crosshair" | "trail";

export interface Appearance {
  theme: ThemeMode;
  accent: string;
  fontSize: FontSizeKey;
  fontFamily: FontFamilyKey;
  cursorStyle: CursorStyleKey;
}

export const STORAGE_KEY = "portfolio-settings";

export const DEFAULT_ACCENT = "#22c55e";

export const FONT_SCALE: Record<FontSizeKey, number> = { sm: 0.9, md: 1, lg: 1.1, xl: 1.22 };

export const FONT_STACKS: Record<FontFamilyKey, { label: string; stack: string }> = {
  generalSans: { label: "General Sans", stack: `"General Sans", "Inter", ui-sans-serif, system-ui, sans-serif` },
  inter: { label: "Inter", stack: `"Inter", ui-sans-serif, system-ui, sans-serif` },
  spaceGrotesk: { label: "Space Grotesk", stack: `"Space Grotesk", ui-sans-serif, system-ui, sans-serif` },
  poppins: { label: "Poppins", stack: `"Poppins", ui-sans-serif, system-ui, sans-serif` },
  sora: { label: "Sora", stack: `"Sora Variable", "Sora", ui-sans-serif, system-ui, sans-serif` },
  jetbrains: { label: "JetBrains Mono", stack: `"JetBrains Mono", ui-monospace, SFMono-Regular, monospace` },
};

export const ACCENT_PRESETS = [
  { label: "Signal Green", value: "#22c55e" },
  { label: "Teal", value: "#2dd4bf" },
  { label: "Electric Blue", value: "#3b82f6" },
  { label: "Violet", value: "#8b5cf6" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Rose", value: "#f43f5e" },
  { label: "Cyan", value: "#06b6d4" },
];

export const CURSOR_STYLES: { label: string; value: CursorStyleKey }[] = [
  { label: "Default", value: "default" },
  { label: "Dot Follower", value: "dot" },
  { label: "Crosshair", value: "crosshair" },
  { label: "Trail", value: "trail" },
];

export const DEFAULT_APPEARANCE: Omit<Appearance, "theme"> = {
  accent: DEFAULT_ACCENT,
  fontSize: "md",
  fontFamily: "generalSans",
  cursorStyle: "default",
};

/**
 * Writes the appearance onto <html>: the theme class, the font variables, and
 * every accent-derived colour token for the current theme. Inline styles on
 * <html> win over the theme blocks in globals.css, which hold the neutrals.
 */
export function applyAppearance(
  root: HTMLElement,
  settings: { theme: string; accent: string; fontSize: string; fontFamily: string },
  stacks: Record<string, { stack: string }>,
  scales: Record<string, number>,
) {
  var dark = settings.theme === "dark";
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";

  var stack = (stacks[settings.fontFamily] || stacks.generalSans).stack;
  root.style.setProperty("--font-sans", stack);
  root.style.setProperty("--font-display", stack);
  root.style.setProperty("--font-scale", String(scales[settings.fontSize] || 1));

  // Accent: hex -> HSL, then the tokens the design reads as "H S% L%" triplets.
  var hex = /^#[0-9a-f]{6}$/i.test(settings.accent) ? settings.accent : "#22c55e";
  var r = parseInt(hex.slice(1, 3), 16) / 255;
  var g = parseInt(hex.slice(3, 5), 16) / 255;
  var b = parseInt(hex.slice(5, 7), 16) / 255;
  var max = Math.max(r, g, b);
  var min = Math.min(r, g, b);
  var l = (max + min) / 2;
  var d = max - min;
  var h = 0;
  var s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  var S = Math.round(s * 100);
  var L = Math.round(l * 100);
  var t = function (hue: number, sat: number, light: number) {
    return hue + " " + Math.max(0, Math.min(100, Math.round(sat))) + "% " + Math.max(0, Math.min(100, Math.round(light))) + "%";
  };
  // Text on an accent fill: whichever of near-black or white reads better (WCAG luminance).
  var lin = function (c: number) {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  var lum = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  var onAccent = (lum + 0.05) / 0.05 > 1.05 / (lum + 0.05) ? "75 12% 7%" : "0 0% 100%";

  var vars: Record<string, string> = {
    "--accent-hex": hex,
    "--primary": t(h, S, L),
    "--primary-foreground": onAccent,
    "--accent": t(h, S, L),
    "--accent-foreground": onAccent,
    "--accent-light": t(h, S, Math.min(L + 12, 82)),
    "--accent-dark": t(h, S, Math.max(L * 0.45, 14)),
    "--ring": t(h, S, L),
    // Small text in the accent: darker on paper, lighter on the dark page, so it stays readable.
    "--primary-text": dark ? t(h, S, Math.max(L, 58)) : t(h, S, Math.min(L, 30)),
    "--secondary-foreground": dark ? t(h, 40, 80) : t(h, S, 22),
    // The hero name runs from ink on the outside to the accent toward the guide.
    "--name-inner": "hsl(" + (dark ? t(h, S, 70) : t(h, S, 26)) + ")",
    "--gradient-mid": "hsl(" + (dark ? t(h, S, L) : t(h, S, 36)) + ")",
    "--guide-disc": dark ? "hsl(90 10% 6% / 0.9)" : "hsl(" + t(h, 30, 94) + " / 0.95)",
    // The guide's own colours: a light body and darker ears in the accent's hue.
    "--guide-body": "hsl(" + t(h, Math.min(S, 80), 66) + ")",
    "--guide-ears": "hsl(" + t(h, Math.min(S, 80), 30) + ")",
  };

  // The default cursors: an arrow, a pointing hand (links, buttons) and a text
  // bar (fields), filled with the accent and outlined to stand out on the page:
  // light on the dark theme, ink on the light one. Drawn here as SVG so they
  // follow the customizer's accent. Used by the rules in globals.css.
  var edge = dark ? "#f4f5f0" : "#0a0b09";
  var cursor = function (d: string, hotX: number, hotY: number) {
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">' +
      '<path d="' + d + '" fill="' + hex + '" stroke="' + edge + '" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>';
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '") ' + hotX + " " + hotY;
  };
  vars["--cursor-arrow"] = cursor("M3.5 2.5L18.5 10.2L11.6 12L8.6 18.6Z", 3, 2);
  vars["--cursor-hand"] = cursor(
    "M8 3.4a1.6 1.6 0 0 1 3.2 0V9l4.1.7a2.2 2.2 0 0 1 1.8 2.5l-.6 4.1a3.2 3.2 0 0 1-3.2 2.7H10a3.2 3.2 0 0 1-2.6-1.3l-3.2-4.3a1.5 1.5 0 0 1 2.2-2l1.6 1.5Z",
    9, 2
  );
  vars["--cursor-text"] = cursor("M6.5 2.5h9v2.4h-3.3v12.2h3.3v2.4h-9v-2.4h3.3V4.9H6.5Z", 11, 11);
  for (var key in vars) root.style.setProperty(key, vars[key]);
}

/** The guide character's body and ear colours for an accent, as hex (the avatar library takes hex). */
export function guideColors(accent: string) {
  const hex = /^#[0-9a-f]{6}$/i.test(accent) ? accent : DEFAULT_ACCENT;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  let h = d ? (max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60 : 0;
  if (h < 0) h += 360;
  const toHex = (hue: number, sat: number, light: number) => {
    const a = sat * Math.min(light, 1 - light);
    const f = (n: number) => {
      const k = (n + hue / 30) % 12;
      const c = light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
      return Math.round(c * 255).toString(16).padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };
  const sat = Math.min(s, 0.8);
  return { body: toHex(h, sat, 0.66), ears: toHex(h, sat, 0.3) };
}

/**
 * Runs in <head> before the first paint: reads the saved settings (or the
 * system theme on a first visit) and applies them.
 */
export const APPEARANCE_SCRIPT = `
(function () {
  var apply = ${applyAppearance.toString()};
  var stacks = ${JSON.stringify(FONT_STACKS)};
  var scales = ${JSON.stringify(FONT_SCALE)};
  var defaults = ${JSON.stringify(DEFAULT_APPEARANCE)};
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)}) || "{}") || {}; } catch (e) {}
  var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  var s = Object.assign({}, defaults, { theme: prefersDark ? "dark" : "light" }, saved);
  try { apply(document.documentElement, s, stacks, scales); } catch (e) {}
})();
`;
