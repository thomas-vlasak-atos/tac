/**
 * Tests für die reine Raum-/Zustandslogik.
 *
 * Traceability: REQ-BOARD (B3/B4 Kugeln, K2/K4/K5 Karten, H1 Verlauf),
 *               ARCH-OVERVIEW §3–§6.
 */

import { createInitialState, type Seat } from "@tac/shared";
import { describe, expect, it } from "vitest";
import {
  dealCards,
  joinRoom,
  moveBall,
  partnerSeat,
  playCard,
  swapWithPartner,
  toPublicState,
} from "./room.js";

/** Deterministischer RNG für reproduzierbare Tests. */
function seededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

describe("moveBall", () => {
  it("bewegt eine Kugel frei auf ein Kreisfeld und schreibt Verlauf", () => {
    const s0 = createInitialState();
    const ballId = "blau-0";
    const s1 = moveBall(s0, ballId, { kind: "FELD", index: 12 }, 0);

    const ball = s1.balls.find((b) => b.id === ballId)!;
    expect(ball.position).toEqual({ kind: "FELD", index: 12 });
    expect(s1.history.at(-1)!.text).toContain("Feld 12");
  });

  it("wirft eine am Zielfeld liegende Kugel zurück ins Vorfeld (B4)", () => {
    let s = createInitialState();
    // gelb-0 auf Feld 20 stellen ...
    s = moveBall(s, "gelb-0", { kind: "FELD", index: 20 }, 1);
    // ... dann blau-0 auf dasselbe Feld ziehen -> gelb-0 wird geworfen
    s = moveBall(s, "blau-0", { kind: "FELD", index: 20 }, 0);

    const blau = s.balls.find((b) => b.id === "blau-0")!;
    const gelb = s.balls.find((b) => b.id === "gelb-0")!;
    expect(blau.position).toEqual({ kind: "FELD", index: 20 });
    expect(gelb.position).toEqual({ kind: "VORFELD", owner: 1 });
    expect(s.history.at(-1)!.text).toContain("geworfen");
  });

  it("ignoriert unbekannte Kugel-IDs (Konsistenz)", () => {
    const s0 = createInitialState();
    const s1 = moveBall(s0, "gibtsnicht", { kind: "FELD", index: 1 }, 0);
    expect(s1).toBe(s0);
  });
});

describe("dealCards", () => {
  it("teilt reihum 5 Karten pro Spieler aus und reduziert den Reststapel", () => {
    const s0 = createInitialState();
    const s1 = dealCards(s0, 5, seededRng(1));
    for (const hand of s1.hands) expect(hand.length).toBe(5);
    expect(s1.deck.length).toBe(100 - 20);
    expect(s1.history.at(-1)!.text).toContain("ausgeteilt");
  });

  it("ist deterministisch bei gleichem Seed", () => {
    const s0 = createInitialState();
    const a = dealCards(s0, 5, seededRng(9)).hands.map((h) =>
      h.map((c) => c.id),
    );
    const b = dealCards(s0, 5, seededRng(9)).hands.map((h) =>
      h.map((c) => c.id),
    );
    expect(a).toEqual(b);
  });
});

describe("playCard", () => {
  it("legt eine Handkarte offen ab", () => {
    let s = dealCards(createInitialState(), 5, seededRng(3));
    const seat: Seat = 0;
    const card = s.hands[seat]![0]!;
    s = playCard(s, seat, card.id);

    expect(s.hands[seat]!.some((c) => c.id === card.id)).toBe(false);
    expect(s.discardPile.some((c) => c.id === card.id)).toBe(true);
  });

  it("ignoriert Karten, die nicht in der Hand liegen", () => {
    const s0 = dealCards(createInitialState(), 5, seededRng(3));
    const s1 = playCard(s0, 0, "keine-echte-id");
    expect(s1).toBe(s0);
  });
});

describe("swapWithPartner", () => {
  it("gibt eine Karte an den gegenübersitzenden Partner", () => {
    let s = dealCards(createInitialState(), 5, seededRng(4));
    const seat: Seat = 0;
    const partner = partnerSeat(seat);
    const card = s.hands[seat]![0]!;

    s = swapWithPartner(s, seat, card.id);
    expect(s.hands[seat]!.some((c) => c.id === card.id)).toBe(false);
    expect(s.hands[partner]!.some((c) => c.id === card.id)).toBe(true);
  });

  it("partnerSeat: 0<->2 und 1<->3", () => {
    expect(partnerSeat(0)).toBe(2);
    expect(partnerSeat(2)).toBe(0);
    expect(partnerSeat(1)).toBe(3);
    expect(partnerSeat(3)).toBe(1);
  });
});

describe("joinRoom", () => {
  it("weist den gewünschten freien Sitzplatz zu", () => {
    const { state, seat } = joinRoom(createInitialState(), "id1", "Anna", 2);
    expect(seat).toBe(2);
    expect(state.players[2]!.name).toBe("Anna");
    expect(state.players[2]!.team).toBe("A");
  });

  it("weicht auf den ersten freien Platz aus, wenn Wunsch belegt", () => {
    let s = createInitialState();
    s = joinRoom(s, "id1", "Anna", 0).state;
    const { seat } = joinRoom(s, "id2", "Ben", 0);
    expect(seat).toBe(1);
  });

  it("erlaubt Reconnect über gleichen Namen auf denselben Sitz", () => {
    let s = createInitialState();
    s = joinRoom(s, "id1", "Anna", 1).state;
    const res = joinRoom(s, "id-neu", "Anna");
    expect(res.seat).toBe(1);
    expect(res.state.players[1]!.id).toBe("id-neu");
    expect(res.state.players[1]!.connected).toBe(true);
  });

  it("liefert null, wenn der Raum voll ist", () => {
    let s = createInitialState();
    s = joinRoom(s, "a", "A").state;
    s = joinRoom(s, "b", "B").state;
    s = joinRoom(s, "c", "C").state;
    s = joinRoom(s, "d", "D").state;
    const { seat } = joinRoom(s, "e", "E");
    expect(seat).toBeNull();
  });
});

describe("toPublicState", () => {
  it("zeigt nur die eigene Hand, andere nur als Anzahl", () => {
    const s = dealCards(createInitialState(), 5, seededRng(5));
    const pub = toPublicState(s, 0);

    expect(pub.ownHand.length).toBe(5);
    expect(pub.handCounts).toEqual([5, 5, 5, 5]);
    expect(pub.deckCount).toBe(80);
    // Es werden keine fremden Handkarten mitgeliefert.
    expect((pub as unknown as { hands?: unknown }).hands).toBeUndefined();
  });

  it("liefert leere eigene Hand für Zuschauer (viewer null)", () => {
    const s = dealCards(createInitialState(), 5, seededRng(5));
    const pub = toPublicState(s, null);
    expect(pub.ownHand).toEqual([]);
  });
});
