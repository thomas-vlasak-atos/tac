/**
 * Lokale Einstellungen pro Gerät (REQ-FEEDBACK F10). Nur im Browser gespeichert,
 * nicht auf dem Server.
 */

export interface Settings {
  /** Feldnummern auf dem Brett anzeigen. */
  showFieldNumbers: boolean;
  /** Ring um das Startfeld des Spielers, der laut Ableitung dran ist (F1). */
  showTurnMarker: boolean;
  /** Fremdzüge Feld für Feld animieren (F2). */
  animateMoves: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  showFieldNumbers: false,
  showTurnMarker: true,
  animateMoves: true,
};

export const SETTINGS_STORAGE_KEY = "tac.settings";

/** Liest Einstellungen aus JSON-Text; fehlende oder ungültige Werte fallen auf den Standard zurück. */
export function parseSettings(raw: string | null | undefined): Settings {
  if (!raw) return { ...DEFAULT_SETTINGS };
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
  if (typeof data !== "object" || data === null) return { ...DEFAULT_SETTINGS };
  const record = data as Record<string, unknown>;
  const result: Settings = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    if (typeof record[key] === typeof DEFAULT_SETTINGS[key]) {
      (result[key] as Settings[keyof Settings]) = record[key] as Settings[keyof Settings];
    }
  }
  return result;
}

export function loadSettings(storage: Pick<Storage, "getItem"> = window.localStorage): Settings {
  try {
    return parseSettings(storage.getItem(SETTINGS_STORAGE_KEY));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings, storage: Pick<Storage, "setItem"> = window.localStorage): void {
  try {
    storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Speicher nicht verfügbar (z. B. privater Modus): Einstellungen gelten nur für diese Sitzung.
  }
}
