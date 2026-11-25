/** Heller/dunkler Modus der Oberfläche (CSS-Variablen in styles.css, Attribut `data-theme`). */

export type ThemePreference = "light" | "dark" | "system";
export type Theme = "light" | "dark";

export const THEME_PREFERENCES: readonly ThemePreference[] = ["light", "dark", "system"];

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === "string" && (THEME_PREFERENCES as readonly string[]).includes(value);
}

/** „system" folgt der Einstellung des Betriebssystems/Browsers. */
export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): Theme {
  if (preference === "system") return systemPrefersDark ? "dark" : "light";
  return preference;
}

const query = (): MediaQueryList | null => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null);

/** Setzt den Modus am Dokument und reagiert bei „system" auf Wechsel; gibt eine Aufräumfunktion zurück. */
export function applyTheme(preference: ThemePreference): () => void {
  const media = query();
  const set = () => {
    document.documentElement.dataset.theme = resolveTheme(preference, media?.matches ?? false);
  };
  set();
  if (preference !== "system" || !media) return () => undefined;
  media.addEventListener("change", set);
  return () => media.removeEventListener("change", set);
}
