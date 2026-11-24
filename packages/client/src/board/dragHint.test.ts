import { describe, expect, it } from "vitest";
import type { BallPosition } from "@tac/shared";
import { dragDistanceLabel } from "./dragHint.js";

const f = (index: number): BallPosition => ({ kind: "FELD", index });

describe("dragDistanceLabel (REQ-FEEDBACK F7)", () => {
  it("Given 5 Felder im Uhrzeigersinn, Then +5", () => {
    expect(dragDistanceLabel(f(10), f(15))).toBe("+5");
  });

  it("Given 4 Felder rückwärts, Then −4", () => {
    expect(dragDistanceLabel(f(10), f(6))).toBe("−4");
  });

  it("Given ein Weg über die Grenze 63 → 0, Then wird richtig gezählt", () => {
    expect(dragDistanceLabel(f(62), f(3))).toBe("+5");
    expect(dragDistanceLabel(f(2), f(62))).toBe("−4");
  });

  it("Given Quelle = Ziel, Then keine Beschriftung", () => {
    expect(dragDistanceLabel(f(7), f(7))).toBeNull();
  });

  it("Given Zug ins eigene Haus, Then werden die Schritte inkl. Hausfelder gezählt", () => {
    expect(dragDistanceLabel(f(14), { kind: "HAUS", owner: 1, slot: 1 })).toBe("+4");
  });

  it("Given Zug im Haus, Then Slot-Differenz mit Vorzeichen", () => {
    expect(dragDistanceLabel({ kind: "HAUS", owner: 2, slot: 0 }, { kind: "HAUS", owner: 2, slot: 2 })).toBe("+2");
    expect(dragDistanceLabel({ kind: "HAUS", owner: 2, slot: 3 }, { kind: "HAUS", owner: 2, slot: 2 })).toBe("−1");
  });

  it("Given Vorfeld oder Wurf, Then keine Beschriftung", () => {
    expect(dragDistanceLabel({ kind: "VORFELD", owner: 0 }, f(0))).toBeNull();
    expect(dragDistanceLabel(f(3), { kind: "VORFELD", owner: 1 })).toBeNull();
  });
});
