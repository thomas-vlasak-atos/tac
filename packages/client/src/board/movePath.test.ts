import { describe, expect, it } from "vitest";
import type { BallPosition } from "@tac/shared";
import { GLIDE_MS, STEP_MS, movePath, segmentTimings } from "./movePath.js";

const f = (index: number): BallPosition => ({ kind: "FELD", index });
const h = (owner: 0 | 1 | 2 | 3, slot: number): BallPosition => ({ kind: "HAUS", owner, slot });
const indices = (points: BallPosition[]) => points.map((p) => (p.kind === "FELD" ? p.index : `${p.kind}${p.kind === "HAUS" ? p.slot : ""}`));

describe("movePath (REQ-FEEDBACK F2)", () => {
  it("Given 3 Felder vorwärts, Then wird jedes Feld einzeln gezählt", () => {
    const path = movePath(f(10), f(13));
    expect(path.mode).toBe("steps");
    expect(indices(path.waypoints)).toEqual([10, 11, 12, 13]);
  });

  it("Given 5 Felder vorwärts, Then wird noch einzeln gezählt", () => {
    expect(indices(movePath(f(0), f(5)).waypoints)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("Given 7 Felder vorwärts, Then wird in 2er-Schritten gezählt und der Rest einzeln", () => {
    expect(indices(movePath(f(0), f(7)).waypoints)).toEqual([0, 2, 4, 6, 7]);
  });

  it("Given 8 Felder vorwärts, Then endet der Weg exakt auf dem Ziel", () => {
    expect(indices(movePath(f(0), f(8)).waypoints)).toEqual([0, 2, 4, 6, 8]);
  });

  it("Given ein Weg über die Grenze 63 → 0, Then wird korrekt weitergezählt", () => {
    expect(indices(movePath(f(62), f(1)).waypoints)).toEqual([62, 63, 0, 1]);
  });

  it("Given 4 Felder rückwärts (TAC), Then wird rückwärts einzeln gezählt", () => {
    expect(indices(movePath(f(10), f(6)).waypoints)).toEqual([10, 9, 8, 7, 6]);
  });

  it("Given ein weiter Sprung (Trickser), Then gleitet die Kugel quer über das Brett", () => {
    const path = movePath(f(5), f(40));
    expect(path.mode).toBe("glide");
    expect(path.waypoints).toEqual([f(5), f(40)]);
  });

  it("Given Zug ins eigene Haus, Then geht der Weg über das Startfeld in die Hausfelder einzeln", () => {
    // Sitz 1: Startfeld 16. Von Feld 14: 14 → 15 → 16 → Slot 0 → Slot 1.
    expect(indices(movePath(f(14), h(1, 1)).waypoints)).toEqual([14, 15, 16, "HAUS0", "HAUS1"]);
  });

  it("Given langer Weg ins Haus, Then bleiben die letzten Felder vor dem Haus und das Haus einzeln", () => {
    const path = movePath(f(5), h(1, 2));
    const walked = indices(path.waypoints);
    expect(walked.slice(-7)).toEqual([13, 14, 15, 16, "HAUS0", "HAUS1", "HAUS2"]);
    expect(walked[0]).toBe(5);
  });

  it("Given Zug im Haus, Then wird Slot für Slot gegangen", () => {
    expect(indices(movePath(h(2, 0), h(2, 3)).waypoints)).toEqual(["HAUS0", "HAUS1", "HAUS2", "HAUS3"]);
  });

  it("Given Vorfeld → Startfeld oder Wurf ins Vorfeld, Then gleitet die Kugel", () => {
    expect(movePath({ kind: "VORFELD", owner: 0 }, f(0)).mode).toBe("glide");
    expect(movePath(f(20), { kind: "VORFELD", owner: 2 }).mode).toBe("glide");
  });
});

describe("segmentTimings", () => {
  it("Given Einzelschritte, Then gibt es keine Pause", () => {
    const t = segmentTimings(movePath(f(0), f(4)));
    expect(t).toHaveLength(4);
    expect(t.every((s) => s.rest === 0 && s.hop === STEP_MS)).toBe(true);
  });

  it("Given 2er-Schritte, Then haben sie eine Pause, der Einzelschritt am Ende nicht", () => {
    const t = segmentTimings(movePath(f(0), f(7)));
    expect(t.map((s) => s.rest > 0)).toEqual([true, true, true, false]);
  });

  it("Given ein Gleitflug, Then ist es ein einziger Abschnitt", () => {
    expect(segmentTimings(movePath(f(0), f(40)))).toEqual([{ hop: GLIDE_MS, rest: 0 }]);
  });
});
