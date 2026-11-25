import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY, loadSettings, parseSettings, saveSettings } from "./settings.js";

describe("Einstellungen (REQ-FEEDBACK F10)", () => {
  it("Given nichts gespeichert, Then gelten die Standardwerte", () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  it("Given kaputtes JSON, Then gelten die Standardwerte", () => {
    expect(parseSettings("{nope")).toEqual(DEFAULT_SETTINGS);
  });

  it("Given ein Wert mit falschem Typ, Then fällt er auf den Standard zurück", () => {
    expect(parseSettings('{"showFieldNumbers":"ja","animateMoves":"nein"}')).toEqual(DEFAULT_SETTINGS);
  });

  it("Given gespeicherte Einstellungen, When geladen, Then werden sie übernommen", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
    };
    saveSettings({ ...DEFAULT_SETTINGS, showFieldNumbers: true, animateMoves: false }, storage);
    expect(store.has(SETTINGS_STORAGE_KEY)).toBe(true);
    expect(loadSettings(storage)).toEqual({ ...DEFAULT_SETTINGS, showFieldNumbers: true, animateMoves: false });
  });

  it("Given Klick und Ziehen beide ausgeschaltet, Then bleibt Klick aktiv (mindestens eine Bedienart)", () => {
    const parsed = parseSettings('{"cardClick":false,"cardDrag":false}');
    expect(parsed.cardClick).toBe(true);
    expect(parsed.cardDrag).toBe(false);
  });
});
