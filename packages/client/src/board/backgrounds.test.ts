import { describe, expect, it } from "vitest";
import {
  CLASSIC_BACKGROUND_ID,
  backgroundIdFromPath,
  backgroundLabel,
  buildBackgroundOptions,
  resolveBackgroundId,
  toneFromId,
} from "./backgrounds.js";

const files = {
  "../../../../vorlage/background/dark_Wood066_1K-PNG_Color.png": "/d66.png",
  "../../../../vorlage/background/bright_Wood097_1K-PNG_Color.png": "/b97.png",
  "../../../../vorlage/background/bright_Texturelabs_Wood_267M.jpg": "/b267.jpg",
  "../../../../vorlage/background/notes.txt": "/n.txt",
};

describe("Brett-Hintergründe", () => {
  it("Given ein Pfad, Then ist die Id der Dateiname ohne Endung", () => {
    expect(backgroundIdFromPath("../x/bright_Wood097_1K-PNG_Color.png")).toBe("bright_Wood097_1K-PNG_Color");
  });

  it("Given das Präfix, Then wird der Ton hell oder dunkel erkannt", () => {
    expect(toneFromId("bright_x")).toBe("bright");
    expect(toneFromId("dark_x")).toBe("dark");
    expect(toneFromId("other_x")).toBeNull();
  });

  it("Given Dateinamen, Then entsteht ein lesbarer Name", () => {
    expect(backgroundLabel("bright_Wood097_1K-PNG_Color")).toBe("Wood097");
    expect(backgroundLabel("dark_Texturelabs_Wood_130M")).toBe("Texturelabs Wood 130M");
  });

  it("Given die Dateien, Then sind hell vor dunkel sortiert und fremde Dateien ignoriert", () => {
    const options = buildBackgroundOptions(files);
    expect(options.map((o) => o.id)).toEqual([
      "bright_Texturelabs_Wood_267M",
      "bright_Wood097_1K-PNG_Color",
      "dark_Wood066_1K-PNG_Color",
    ]);
    expect(options[0]!.tone).toBe("bright");
    expect(options[2]!.tone).toBe("dark");
  });

  it("Given eine gespeicherte Auswahl, Then wird sie übernommen, wenn sie existiert", () => {
    const options = buildBackgroundOptions(files);
    expect(resolveBackgroundId("dark_Wood066_1K-PNG_Color", options)).toBe("dark_Wood066_1K-PNG_Color");
    expect(resolveBackgroundId(CLASSIC_BACKGROUND_ID, options)).toBe(CLASSIC_BACKGROUND_ID);
  });

  it("Given leere oder unbekannte Auswahl, Then wird der erste helle Hintergrund genommen", () => {
    const options = buildBackgroundOptions(files);
    expect(resolveBackgroundId("", options)).toBe("bright_Texturelabs_Wood_267M");
    expect(resolveBackgroundId("gibt-es-nicht", options)).toBe("bright_Texturelabs_Wood_267M");
  });

  it("Given gar keine Hintergründe, Then fällt es auf das klassische Brett zurück", () => {
    expect(resolveBackgroundId("", [])).toBe(CLASSIC_BACKGROUND_ID);
  });
});
