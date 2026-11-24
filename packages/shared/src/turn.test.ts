import { describe, expect, it } from "vitest";
import type { Card } from "./cards.js";
import type { Player, Seat } from "./domain.js";
import { type TurnInput, nextToPlay } from "./turn.js";

const player = (seat: Seat): Player => ({
  id: `p${seat}`,
  name: `S${seat}`,
  seat,
  team: seat % 2 === 0 ? "A" : "B",
  color: (["blau", "gelb", "gruen", "rot"] as const)[seat],
  connected: true,
});
const card = { id: "c1" } as unknown as Card;

function input(overrides: Partial<TurnInput> = {}): TurnInput {
  return {
    players: [player(0), player(1), player(2), player(3)],
    handCounts: [5, 5, 5, 5],
    discardEntries: [],
    deckHolder: 1,
    tradeDone: [0, 1, 2, 3],
    ...overrides,
  };
}

describe("nextToPlay (REQ-FEEDBACK F1)", () => {
  it("Given Rundenstart nach dem Tausch, Then beginnt der Spieler links vom Geber (Reststapel-Halter)", () => {
    expect(nextToPlay(input())).toBe(1);
  });

  it("Given noch laufender Tauschphase, Then ist niemand markiert", () => {
    expect(nextToPlay(input({ tradeDone: [0, 1] }))).toBeNull();
  });

  it("Given Sitz 0 hat eine Karte gespielt, Then ist Sitz 1 (Uhrzeigersinn) dran", () => {
    expect(nextToPlay(input({ discardEntries: [{ card, actor: 0, timestamp: 1 }] }))).toBe(1);
  });

  it("Given Sitz 3 hat gespielt, Then geht es mit Sitz 0 weiter", () => {
    expect(nextToPlay(input({ discardEntries: [{ card, actor: 3, timestamp: 1 }] }))).toBe(0);
  });

  it("Given ein freier Sitz, Then wird er übersprungen", () => {
    const players = [player(0), null, player(2), player(3)];
    expect(nextToPlay(input({ players, discardEntries: [{ card, actor: 0, timestamp: 1 }] }))).toBe(2);
  });

  it("Given ein Spieler ohne Handkarten, Then wird er übersprungen", () => {
    expect(
      nextToPlay(input({ handCounts: [4, 0, 4, 4], discardEntries: [{ card, actor: 0, timestamp: 1 }] })),
    ).toBe(2);
  });

  it("Given der Teufel spielt für das Opfer (Eintrag = Opfer), Then ist der Nachfolger des Opfers dran", () => {
    expect(nextToPlay(input({ discardEntries: [{ card, actor: 2, timestamp: 1 }] }))).toBe(3);
  });

  it("Given keine Handkarten mehr im Spiel, Then ist niemand markiert", () => {
    expect(nextToPlay(input({ handCounts: [0, 0, 0, 0], discardEntries: [{ card, actor: 0, timestamp: 1 }] }))).toBeNull();
  });

  it("Given der Reststapel liegt in der Mitte, Then ist niemand markiert", () => {
    expect(nextToPlay(input({ deckHolder: null }))).toBeNull();
  });
});
