import { useSettings } from "@/lib/settings";

/**
 * The theme half of the visitor's settings, in the shape the reference's
 * components expect (`theme`, `resolvedTheme`, `setTheme`).
 */
export function useTheme() {
  const { theme, setTheme } = useSettings();
  return { theme, resolvedTheme: theme, setTheme };
}
