import { describe, expect, it } from "vitest";
import { type SoundSnapshot, soundEvents } from "./sounds.js";

const snap = (over: Partial<SoundSnapshot> = {}): SoundSnapshot => ({ moveKey: null, discardLength: 0, turnSeat: null, ...over });

describe("soundEvents (REQ-FEEDBACK F3)", () => {
  it("Given der erste Zustand nach dem Laden, Then gibt es keinen Ton", () => {
    expect(soundEvents(null, snap({ moveKey: "a", discardLength: 3 }), 0, false)).toEqual({ move: false, turn: false });
  });

  it("Given ein neuer Kugelzug eines anderen, Then ertönt „Zug gemacht\"", () => {
    expect(soundEvents(snap(), snap({ moveKey: "a" }), 0, false)).toEqual({ move: true, turn: false });
  });

  it("Given eine neue Karte eines anderen, Then ertönt „Zug gemacht\"", () => {
    expect(soundEvents(snap(), snap({ discardLength: 1 }), 0, false)).toEqual({ move: true, turn: false });
  });

  it("Given meine eigene Aktion, Then ertönt nichts", () => {
    expect(soundEvents(snap(), snap({ moveKey: "a" }), 0, true)).toEqual({ move: false, turn: false });
  });

  it("Given der Hinweis wechselt auf mich, Then ertönt nur „Du bist dran\"", () => {
    expect(soundEvents(snap({ moveKey: "a" }), snap({ moveKey: "b", turnSeat: 2 }), 2, false)).toEqual({ move: false, turn: true });
  });

  it("Given der Hinweis ist schon bei mir und es kommt eine Aktion, Then kein neues „Du bist dran\"", () => {
    expect(soundEvents(snap({ turnSeat: 2 }), snap({ turnSeat: 2, discardLength: 1 }), 2, false).turn).toBe(false);
  });

  it("Given der Hinweis wechselt auf einen anderen, Then kein „Du bist dran\"", () => {
    expect(soundEvents(snap(), snap({ turnSeat: 1 }), 2, false).turn).toBe(false);
  });

  it("Given die Karten werden weniger (neue Runde), Then ertönt kein „Zug gemacht\"", () => {
    expect(soundEvents(snap({ discardLength: 5 }), snap({ discardLength: 0 }), 0, false).move).toBe(false);
  });
});
