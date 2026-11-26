import type { FontFamilyKey } from "@/lib/appearance";

/**
 * The customizer's optional fonts, loaded only when they are needed: when a
 * visitor picks one, or opens the customizer (to preview them). Loading all of
 * them in <head> on every visit blocked the first paint for ~0.7s on mobile.
 * General Sans (the default) is loaded from index.html; Sora is self-hosted.
 */
export const FONT_URLS: Partial<Record<FontFamilyKey, string>> = {
  inter: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
  spaceGrotesk: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap",
  poppins: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap",
  jetbrains: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap",
};

/** Adds the stylesheet for a customizer font, once. */
export function ensureFont(key: FontFamilyKey) {
  const href = FONT_URLS[key];
  if (!href || typeof document === "undefined") return;
  if (document.querySelector(`link[data-font="${key}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.dataset.font = key;
  document.head.appendChild(link);
}

/** Loads every customizer font, for the previews in the customizer. */
export function ensureAllFonts() {
  (Object.keys(FONT_URLS) as FontFamilyKey[]).forEach(ensureFont);
}
