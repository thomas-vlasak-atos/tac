/**
 * Tests für den Anfangszustand.
 *
 * Traceability: REQ-BOARD B2 (Startlage), ARCH-OVERVIEW §3.
 */

import { describe, expect, it } from "vitest";
import {
  BALLS_PER_PLAYER,
  COLOR_BY_SEAT,
  createInitialBalls,
  createInitialState,
  SEATS,
  TEAM_BY_SEAT,
} from "./index.js";

describe("createInitialBalls", () => {
  it("erzeugt 16 Kugeln, alle im Vorfeld des Besitzers", () => {
    const balls = createInitialBalls();
    expect(balls.length).toBe(16);
    for (const ball of balls) {
      expect(ball.position.kind).toBe("VORFELD");
      if (ball.position.kind === "VORFELD") {
        expect(ball.position.owner).toBe(ball.owner);
      }
    }
  });

  it("erzeugt je Sitzplatz 4 Kugeln der richtigen Farbe", () => {
    const balls = createInitialBalls();
    for (const seat of SEATS) {
      const own = balls.filter((b) => b.owner === seat);
      expect(own.length).toBe(BALLS_PER_PLAYER);
      for (const b of own) expect(b.color).toBe(COLOR_BY_SEAT[seat]);
    }
  });

  it("vergibt eindeutige Kugel-IDs", () => {
    const balls = createInitialBalls();
    expect(new Set(balls.map((b) => b.id)).size).toBe(balls.length);
  });
});

describe("createInitialState", () => {
  it("startet mit leeren Sitzplätzen, leeren Händen und leerer Ablage", () => {
    const state = createInitialState();
    expect(state.players).toEqual([null, null, null, null]);
    expect(state.hands).toEqual([[], [], [], []]);
    expect(state.discardPile).toEqual([]);
    expect(state.history).toEqual([]);
  });

  it("nutzt in der Basisversion 100 Karten, in der Meisterversion 104", () => {
    expect(createInitialState().deck.length).toBe(100);
    expect(createInitialState({ masterMode: true }).deck.length).toBe(104);
  });

  it("koppelt Teams fest an Sitzplätze (Partner sitzen gegenüber)", () => {
    // Team A: 0 & 2, Team B: 1 & 3
    expect(TEAM_BY_SEAT[0]).toBe("A");
    expect(TEAM_BY_SEAT[2]).toBe("A");
    expect(TEAM_BY_SEAT[1]).toBe("B");
    expect(TEAM_BY_SEAT[3]).toBe("B");
  });

  it("setzt den Startgeber (Standard Sitzplatz 0, konfigurierbar)", () => {
    expect(createInitialState().dealer).toBe(0);
    expect(createInitialState({ dealer: 2 }).dealer).toBe(2);
  });
});
