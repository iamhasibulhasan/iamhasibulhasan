/**
 * The page draws edge to edge (index.html: viewport-fit=cover), so on phones
 * with a gesture bar or home indicator the bottom of the screen is partly
 * covered by it. CSS reads that inset with env(safe-area-inset-bottom); this is
 * the same inset in pixels, for layout done in script (the guide's corner
 * spot). 0 on screens without one. Measured once, again after a resize or a
 * turn of the phone.
 */
let bottom: number | null = null;

export function safeAreaBottom(): number {
  if (typeof document === "undefined") return 0;
  if (bottom === null) {
    const probe = document.createElement("div");
    probe.style.cssText = "position:fixed;left:0;bottom:0;width:0;height:env(safe-area-inset-bottom,0px);visibility:hidden;pointer-events:none";
    document.body.appendChild(probe);
    bottom = probe.offsetHeight;
    probe.remove();
    window.addEventListener("resize", () => (bottom = null), { once: true });
  }
  return bottom;
}
