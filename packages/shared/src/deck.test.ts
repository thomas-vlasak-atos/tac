/**
 * Tests für Deck-Erstellung, Mischen und Austeilen.
 *
 * Traceability: REQ-BOARD K2 (Geben), ARCH-OVERVIEW §2 (reine Helfer).
 */

import { describe, expect, it } from "vitest";
import {
  buildDeck,
  deal,
  MASTER_CARD_KINDS,
  NUMBER_VALUES,
  type Rng,
  shuffle,
  SINGLE_DECK_COUNTS,
} from "./index.js";

/** Deterministischer RNG für reproduzierbare Tests (linearer Kongruenzgenerator). */
function seededRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

describe("buildDeck", () => {
  it("erzeugt 100 Karten in der Basisversion (zwei Stapel)", () => {
    // Given/When
    const deck = buildDeck();
    // Then: 12 Werte * 3 + 7 TAC + 7 Trickser = 50 pro Stapel, *2 = 100
    expect(deck.length).toBe(100);
  });

  it("erzeugt 104 Karten in der Meisterversion (inkl. 4 Meisterkarten)", () => {
    const deck = buildDeck({ master: true });
    expect(deck.length).toBe(104);

    for (const kind of MASTER_CARD_KINDS) {
      expect(deck.some((c) => c.kind === kind)).toBe(true);
    }
  });

  it("enthält jeden Zahlenwert genau doppelt so oft wie in einem Stapel", () => {
    const deck = buildDeck();
    for (const value of NUMBER_VALUES) {
      const expected = SINGLE_DECK_COUNTS.numbers[value]! * 2;
      const actual = deck.filter(
        (c) => c.kind === "number" && c.value === value,
      ).length;
      expect(actual, `Wert ${value}`).toBe(expected);
    }
  });

  it("enthält keine 11 (existiert bei TAC nicht)", () => {
    const deck = buildDeck();
    expect(deck.some((c) => c.kind === "number" && c.value === 11)).toBe(false);
  });

  it("vergibt eindeutige Karten-IDs", () => {
    const deck = buildDeck({ master: true });
    const ids = new Set(deck.map((c) => c.id));
    expect(ids.size).toBe(deck.length);
  });
});

describe("shuffle", () => {
  it("verändert die Eingabeliste nicht (rein)", () => {
    const deck = buildDeck();
    const before = deck.map((c) => c.id);
    shuffle(deck, seededRng(42));
    expect(deck.map((c) => c.id)).toEqual(before);
  });

  it("erhält alle Karten (Permutation, nichts verloren)", () => {
    const deck = buildDeck();
    const shuffled = shuffle(deck, seededRng(7));
    expect(shuffled.length).toBe(deck.length);
    expect(new Set(shuffled.map((c) => c.id))).toEqual(
      new Set(deck.map((c) => c.id)),
    );
  });

  it("ist deterministisch bei gleichem Seed", () => {
    const deck = buildDeck();
    const a = shuffle(deck, seededRng(123)).map((c) => c.id);
    const b = shuffle(deck, seededRng(123)).map((c) => c.id);
    expect(a).toEqual(b);
  });

  it("liefert bei unterschiedlichem Seed eine andere Reihenfolge", () => {
    const deck = buildDeck();
    const a = shuffle(deck, seededRng(1)).map((c) => c.id);
    const b = shuffle(deck, seededRng(2)).map((c) => c.id);
    expect(a).not.toEqual(b);
  });
});

describe("deal", () => {
  it("teilt reihum je 5 Karten an 4 Spieler aus (Standardrunde)", () => {
    const deck = buildDeck();
    const { hands, rest } = deal(deck, 5);
    expect(hands.length).toBe(4);
    for (const hand of hands) expect(hand.length).toBe(5);
    expect(rest.length).toBe(100 - 20);
  });

  it("teilt reihum je 6 Karten aus (Meisterrunde)", () => {
    const deck = buildDeck({ master: true });
    const { hands, rest } = deal(deck, 6);
    for (const hand of hands) expect(hand.length).toBe(6);
    expect(rest.length).toBe(104 - 24);
  });

  it("teilt reihum aus, nicht blockweise", () => {
    // Given: 8 klar unterscheidbare Karten (ids 0..7) simuliert über echtes Deck
    const deck = buildDeck().slice(0, 8);
    // When: 2 Karten pro Spieler bei 4 Spielern
    const { hands } = deal(deck, 2, 4);
    // Then: Spieler p bekommt Karten an Position p und p+4 (reihum)
    for (let p = 0; p < 4; p++) {
      expect(hands[p]![0]!.id).toBe(deck[p]!.id);
      expect(hands[p]![1]!.id).toBe(deck[p + 4]!.id);
    }
  });

  it("verändert die Eingabeliste nicht (rein)", () => {
    const deck = buildDeck();
    const before = deck.map((c) => c.id);
    deal(deck, 5);
    expect(deck.map((c) => c.id)).toEqual(before);
  });

  it("wirft, wenn nicht genügend Karten vorhanden sind", () => {
    const deck = buildDeck().slice(0, 10);
    expect(() => deal(deck, 5, 4)).toThrow();
  });
});
