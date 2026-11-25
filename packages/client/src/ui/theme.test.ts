import { describe, expect, it } from "vitest";
import { isThemePreference, resolveTheme } from "./theme.js";

describe("Dunkler Modus", () => {
  it("Given eine feste Wahl, Then gilt sie unabhängig vom System", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("Given „system\", Then folgt der Modus dem System", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });

  it("Given beliebige Werte, Then werden nur gültige Wahlen erkannt", () => {
    expect(isThemePreference("dark")).toBe(true);
    expect(isThemePreference("blau")).toBe(false);
    expect(isThemePreference(1)).toBe(false);
  });
});
