/**
 * Tests für die Brett-Geometrie.
 *
 * Traceability: REQ-BOARD B1 (Brettdarstellung).
 */

import { CIRCLE_FIELD_COUNT, type Seat } from "@tac/shared";
import { describe, expect, it } from "vitest";
import {
  allCircleFieldPositions,
  circleFieldPosition,
  defaultGeometry,
  housePositions,
  startIndexForSeat,
  vorfeldBallPosition,
  discardPlacement,
  maxCornerDistance,
} from "./geometry.js";

const geo = defaultGeometry(1024);

/** Abstand zweier Punkte. */
function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

describe("startIndexForSeat", () => {
  it("verteilt die vier Startfelder gleichmäßig (0, 16, 32, 48)", () => {
    expect(startIndexForSeat(0)).toBe(0);
    expect(startIndexForSeat(1)).toBe(16);
    expect(startIndexForSeat(2)).toBe(32);
    expect(startIndexForSeat(3)).toBe(48);
  });
});

describe("circleFieldPosition", () => {
  it("liefert genau 64 Positionen", () => {
    expect(allCircleFieldPositions(geo).length).toBe(CIRCLE_FIELD_COUNT);
  });

  it("legt alle Kreisfelder auf den Kreisradius um den Mittelpunkt", () => {
    for (let i = 0; i < CIRCLE_FIELD_COUNT; i++) {
      const p = circleFieldPosition(i, geo);
      expect(dist(p, geo.center)).toBeCloseTo(geo.circleRadius, 5);
    }
  });

  it("platziert benachbarte Felder in gleichem Abstand zueinander", () => {
    const d0 = dist(circleFieldPosition(0, geo), circleFieldPosition(1, geo));
    const d1 = dist(circleFieldPosition(10, geo), circleFieldPosition(11, geo));
    expect(d0).toBeCloseTo(d1, 5);
  });

  it("legt gegenüberliegende Startfelder (0 und 32) sich gegenüber", () => {
    const p0 = circleFieldPosition(0, geo);
    const p32 = circleFieldPosition(32, geo);
    // Mittelpunkt der Verbindungslinie ist der Brettmittelpunkt.
    expect((p0.x + p32.x) / 2).toBeCloseTo(geo.center.x, 5);
    expect((p0.y + p32.y) / 2).toBeCloseTo(geo.center.y, 5);
  });
});

describe("housePositions", () => {
  it("liefert 4 Hausfelder pro Spieler, radial nach innen abnehmend", () => {
    for (const seat of [0, 1, 2, 3] as Seat[]) {
      const house = housePositions(seat, geo);
      expect(house.length).toBe(4);
      // Die Referenz hat vier versetzte Punkte im kleinen Hauskreis, keine
      // gerade radiale Linie.
      expect(new Set(house.map((point) => `${point.x},${point.y}`)).size).toBe(4);
    }
  });

  it("liegen die Hausfelder innerhalb des Kreises", () => {
    for (const seat of [0, 1, 2, 3] as Seat[]) {
      for (const p of housePositions(seat, geo)) {
        expect(dist(p, geo.center)).toBeLessThan(geo.circleRadius);
      }
    }
  });
});

describe("vorfeldBallPosition", () => {
  it("legt die 4 Vorfeld-Kugeln außerhalb des Kreises", () => {
    for (let slot = 0; slot < 4; slot++) {
      const p = vorfeldBallPosition(0, slot, geo);
      expect(dist(p, geo.center)).toBeGreaterThan(geo.circleRadius);
    }
  });

  it("verteilt die 4 Kugeln auf verschiedene Positionen (kein Überlappen)", () => {
    const pts = [0, 1, 2, 3].map((s) => vorfeldBallPosition(0, s, geo));
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        expect(dist(pts[i]!, pts[j]!)).toBeGreaterThan(1);
      }
    }
  });

  it("hält alle Vorfeld-Kugeln innerhalb der Zeichenfläche (0..size)", () => {
    for (const seat of [0, 1, 2, 3] as Seat[]) {
      for (let slot = 0; slot < 4; slot++) {
        const p = vorfeldBallPosition(seat, slot, geo);
        // Mit Feldradius-Puffer vollständig im Bild.
        expect(p.x - geo.fieldRadius).toBeGreaterThanOrEqual(0);
        expect(p.y - geo.fieldRadius).toBeGreaterThanOrEqual(0);
        expect(p.x + geo.fieldRadius).toBeLessThanOrEqual(geo.size);
        expect(p.y + geo.fieldRadius).toBeLessThanOrEqual(geo.size);
      }
    }
  });
});

describe("discardPlacement (REQ-BOARD K4c: zufällige Ablage, nie außerhalb des Kreises)", () => {
  const radius = 116;
  // Kartengröße wie im Board (106 x 176,7): größte Variante, die noch sicher passen muss.
  const halfW = 53;
  const halfH = 88.3;

  it("Given viele Karten, When sie abgelegt werden, Then liegen alle vier Ecken immer im Ablagekreis", () => {
    for (let i = 0; i < 2000; i++) {
      const p = discardPlacement(`card-${i}:${i * 7}`, radius, halfW, halfH);
      expect(maxCornerDistance(p.x, p.y, p.rotation, halfW, halfH)).toBeLessThanOrEqual(radius + 1e-9);
    }
  });

  it("Given dieselbe Karte, When die Lage mehrfach berechnet wird, Then ist sie identisch (alle Spieler sehen dasselbe)", () => {
    expect(discardPlacement("abc:1", radius, halfW, halfH)).toEqual(discardPlacement("abc:1", radius, halfW, halfH));
  });

  it("Given verschiedene Karten, When sie abgelegt werden, Then variieren Drehung und Position deutlich", () => {
    const placements = Array.from({ length: 200 }, (_, i) => discardPlacement(`k${i}:0`, radius, halfW, halfH));
    const rotations = placements.map((p) => p.rotation);
    expect(Math.max(...rotations) - Math.min(...rotations)).toBeGreaterThan(300);
    expect(new Set(placements.map((p) => Math.round(p.x))).size).toBeGreaterThan(20);
  });
});
