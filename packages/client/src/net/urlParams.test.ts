import { describe, expect, it } from "vitest";
import { directJoinFromUrl, isTestMode, readUrlDefaults } from "./urlParams.js";

describe("URL-Parameter (ADR-0002 Sitzplatz-Links)", () => {
  it("Given Raum, Name und Platz, When die Seite geöffnet wird, Then tritt der Client direkt bei", () => {
    expect(directJoinFromUrl("?room=tac&name=Thomas&seat=0")).toEqual({ roomId: "tac", name: "Thomas", seat: 0 });
  });

  it("Given Raum und Name ohne Platz, Then Direktbeitritt mit Auto-Platz", () => {
    expect(directJoinFromUrl("?room=tac&name=Anna")).toEqual({ roomId: "tac", name: "Anna" });
  });

  it("Given nur Raum oder nur Name, Then kein Direktbeitritt (Formular wird vorbelegt)", () => {
    expect(directJoinFromUrl("?room=tac")).toBeNull();
    expect(directJoinFromUrl("?name=Anna")).toBeNull();
    expect(readUrlDefaults("?room=tac")).toEqual({ roomId: "tac", name: undefined, seat: undefined });
  });

  it("Given keine Parameter, Then kein Direktbeitritt", () => {
    expect(directJoinFromUrl("")).toBeNull();
  });

  it("Given ungültiger Platz, Then wird er ignoriert", () => {
    expect(readUrlDefaults("?room=a&name=b&seat=7").seat).toBeUndefined();
    expect(readUrlDefaults("?room=a&name=b&seat=x").seat).toBeUndefined();
    expect(readUrlDefaults("?room=a&name=b&seat=").seat).toBeUndefined();
  });

  it("Given Sonderzeichen im Namen (Umlaute, Leerzeichen), Then werden sie dekodiert", () => {
    expect(directJoinFromUrl("?room=T-T-M-S_Freunde&name=J%C3%BCrgen%20M")?.name).toBe("Jürgen M");
  });

  it("Given test=1 oder test=true, Then ist der Testmodus aktiv", () => {
    expect(isTestMode("?test=1")).toBe(true);
    expect(isTestMode("?test=true")).toBe(true);
    expect(isTestMode("?test=0")).toBe(false);
    expect(isTestMode("")).toBe(false);
  });
});
