/**
 * Auswählbare Brett-Hintergründe (Holztexturen aus vorlage/background).
 *
 * Dateinamen beginnen mit `bright_` (helles Holz, graues Brett) oder `dark_` (dunkles Holz,
 * goldenes Brett). Reine Logik ohne Vite-Abhängigkeit, getestet; die Dateien selbst werden in
 * `boardAssets.ts` eingesammelt.
 */

export type BackgroundTone = "bright" | "dark";

export interface BackgroundOption {
  /** Dateiname ohne Endung, z. B. `bright_Wood097_1K-PNG_Color`. */
  id: string;
  /** Lesbarer Name, z. B. `Wood097`. */
  label: string;
  tone: BackgroundTone;
  url: string;
}

/** Das bisherige, fest eingebrannte Brettbild (vorlage/Board.png). */
export const CLASSIC_BACKGROUND_ID = "classic";

/** Dateiname (oder Pfad) → Id ohne Endung. */
export function backgroundIdFromPath(path: string): string {
  const file = path.split(/[\/]/).pop() ?? path;
  return file.replace(/\.[^.]+$/, "");
}

export function toneFromId(id: string): BackgroundTone | null {
  if (id.startsWith("bright_")) return "bright";
  if (id.startsWith("dark_")) return "dark";
  return null;
}

/** `bright_Wood097_1K-PNG_Color` → `Wood097`, `dark_Texturelabs_Wood_130M` → `Texturelabs Wood 130M`. */
export function backgroundLabel(id: string): string {
  return id
    .replace(/^(bright|dark)_/, "")
    .replace(/_1K-PNG_Color$/, "")
    .replace(/_/g, " ");
}

/** Baut die Auswahl aus den gefundenen Dateien (Pfad → URL); Dateien ohne bright_/dark_-Präfix werden ignoriert. */
export function buildBackgroundOptions(files: Record<string, string>): BackgroundOption[] {
  const options: BackgroundOption[] = [];
  for (const [path, url] of Object.entries(files)) {
    const id = backgroundIdFromPath(path);
    const tone = toneFromId(id);
    if (tone) options.push({ id, label: backgroundLabel(id), tone, url });
  }
  return options.sort((a, b) => (a.tone === b.tone ? a.id.localeCompare(b.id) : a.tone === "bright" ? -1 : 1));
}

/** Gespeicherte Auswahl auflösen; unbekannt oder leer → erster heller Hintergrund, sonst klassisch. */
export function resolveBackgroundId(id: string, options: BackgroundOption[]): string {
  if (id === CLASSIC_BACKGROUND_ID) return CLASSIC_BACKGROUND_ID;
  if (options.some((option) => option.id === id)) return id;
  return options.find((option) => option.tone === "bright")?.id ?? CLASSIC_BACKGROUND_ID;
}
