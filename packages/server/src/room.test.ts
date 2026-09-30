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
  shuffleDiscard,
  joinRoom,
  moveBall,
  partnerSeat,
  leftNeighborSeat,
  playCard,
  offerCardToPartner,
  claimTradeOffer,
  revokeTradeOffer,
  requestDevilView,
  approveDevilView,
  declineDevilView,
  cancelDevilView,
  playForeignCard,
  passHandsRight,
  returnCard,
  swapBalls,
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
    expect(s1.lastBallMove).toEqual({
      ballId,
      from: { kind: "VORFELD", owner: 0 },
      to: { kind: "FELD", index: 12 },
    });
  });

  it("nutzt im Verlauf den Spielernamen statt der Farbe, wenn gesetzt", () => {
    let s = createInitialState();
    s = joinRoom(s, "id1", "Anna", 0).state; // Sitz 0 = blau
    s = moveBall(s, "blau-0", { kind: "FELD", index: 12 }, 0);
    const text = s.history.at(-1)!.text;
    expect(text).toContain("Anna");
    expect(text.startsWith("blau")).toBe(false);
  });

  it("fällt im Verlauf auf die Farbe zurück, wenn der Sitz unbesetzt ist", () => {
    const s = moveBall(createInitialState(), "blau-0", { kind: "FELD", index: 12 }, 0);
    expect(s.history.at(-1)!.text.startsWith("blau")).toBe(true);
  });

  it("wirft NICHT automatisch: zwei Kugeln dürfen dieselbe Position belegen (B4 überarbeitet)", () => {
    let s = createInitialState();
    // gelb-0 auf Feld 20 stellen ...
    s = moveBall(s, "gelb-0", { kind: "FELD", index: 20 }, 1);
    // ... dann blau-0 auf dasselbe Feld setzen -> gelb-0 bleibt (kein Werfen)
    s = moveBall(s, "blau-0", { kind: "FELD", index: 20 }, 0);

    const blau = s.balls.find((b) => b.id === "blau-0")!;
    const gelb = s.balls.find((b) => b.id === "gelb-0")!;
    expect(blau.position).toEqual({ kind: "FELD", index: 20 });
    expect(gelb.position).toEqual({ kind: "FELD", index: 20 });
    expect(s.history.at(-1)!.text).not.toContain("geworfen");
  });

  it("ignoriert unbekannte Kugel-IDs (Konsistenz)", () => {
    const s0 = createInitialState();
    const s1 = moveBall(s0, "gibtsnicht", { kind: "FELD", index: 1 }, 0);
    expect(s1).toBe(s0);
  });
});

describe("swapBalls", () => {
  it("tauscht die Positionen zweier Kugeln (B3a / Trickser)", () => {
    let s = createInitialState();
    s = moveBall(s, "blau-0", { kind: "FELD", index: 10 }, 0);
    s = moveBall(s, "rot-0", { kind: "FELD", index: 40 }, 3);
    s = swapBalls(s, "blau-0", "rot-0", 0);

    const blau = s.balls.find((b) => b.id === "blau-0")!;
    const rot = s.balls.find((b) => b.id === "rot-0")!;
    expect(blau.position).toEqual({ kind: "FELD", index: 40 });
    expect(rot.position).toEqual({ kind: "FELD", index: 10 });
    expect(s.history.at(-1)!.text).toContain("getauscht");
  });

  it("ignoriert Tausch mit sich selbst oder unbekannter Kugel", () => {
    const s0 = createInitialState();
    expect(swapBalls(s0, "blau-0", "blau-0", 0)).toBe(s0);
    expect(swapBalls(s0, "blau-0", "gibtsnicht", 0)).toBe(s0);
  });
});

describe("dealCards", () => {
  it("teilt reihum 5 Karten pro Spieler aus und reduziert den Reststapel", () => {
    const s0 = createInitialState({ rng: seededRng(1) });
    const s1 = dealCards(s0, 5);
    for (const hand of s1.hands) expect(hand.length).toBe(5);
    expect(s1.deck.length).toBe(104 - 20);
    expect(s1.history.at(-1)!.text).toContain("ausgeteilt");
  });

  it("mischt NICHT beim Geben, sondern zieht von oben des Reststapels", () => {
    const s0 = createInitialState({ rng: seededRng(9) });
    const deckBefore = s0.deck.map((c) => c.id);
    const s1 = dealCards(s0, 5);
    // Die 20 ausgeteilten Karten sind exakt die obersten 20 (reihum verteilt),
    // der Reststapel ist unverändert der ursprüngliche Rest.
    expect(s1.deck.map((c) => c.id)).toEqual(deckBefore.slice(20));
  });

  it("ist deterministisch bei gleichem Start-Seed", () => {
    const a = dealCards(createInitialState({ rng: seededRng(9) }), 5).hands.map(
      (h) => h.map((c) => c.id),
    );
    const b = dealCards(createInitialState({ rng: seededRng(9) }), 5).hands.map(
      (h) => h.map((c) => c.id),
    );
    expect(a).toEqual(b);
  });

  it("teilt in der letzten Meisterrunde automatisch 6 Karten aus", () => {
    let s = createInitialState({ rng: seededRng(20) });
    for (let round = 0; round < 4; round++) {
      s = dealCards(s, 5);
      s = { ...s, hands: [[], [], [], []] };
    }
    s = dealCards(s, 5);
    expect(s.hands.every((hand) => hand.length === 6)).toBe(true);
    expect(s.deck).toHaveLength(0);
  });

  it("gibt nicht erneut aus, solange Karten in einer Hand liegen", () => {
    const s0 = dealCards(createInitialState({ rng: seededRng(1) }), 5);
    expect(dealCards(s0, 5)).toBe(s0);
  });

  it("macht den zuerst klickenden Spieler zum Geber, wenn der Stapel in der Mitte liegt", () => {
    // Rundenstart: Stapel in der Mitte (deckHolder null). Wer zuerst klickt,
    // wird Geber – hier Sitz 2.
    const s0 = createInitialState({ rng: seededRng(1), dealer: 0 });
    expect(s0.deckHolder).toBeNull();
    const s1 = dealCards(s0, 5, 2);
    expect(s1.dealer).toBe(2);
    // Danach wandert der Stapel zum nächsten Geber (gegen Uhrzeigersinn).
    expect(s1.deckHolder).toBe(1);
  });

  it("lässt nach dem Wandern nur den zuständigen Halter den Stapel auslösen", () => {
    // Erst gibt Sitz 0 (aus der Mitte), Stapel wandert zu Sitz 3.
    let s = dealCards(createInitialState({ rng: seededRng(1), dealer: 0 }), 5, 0);
    expect(s.deckHolder).toBe(3);
    // Runde leerspielen, Reststapel behalten (>= 20) für den nächsten Deal.
    s = { ...s, hands: [[], [], [], []] };
    // Ein anderer Sitz als der Halter (3) darf jetzt NICHT geben.
    expect(dealCards(s, 5, 1)).toBe(s);
    // Der Halter (3) darf.
    expect(dealCards(s, 5, 3).hands[0]!.length).toBe(5);
  });

  it("mischt den Ablagestapel erst bei leerem Reststapel zurück", () => {
    let s = dealCards(createInitialState({ rng: seededRng(2) }), 5);
    const card = s.hands[0]![0]!;
    s = playCard(s, 0, card.id);
    expect(shuffleDiscard(s, seededRng(3))).toBe(s);
    s = { ...s, hands: [[], [], [], []], deck: [] };
    const shuffled = shuffleDiscard(s, seededRng(3));
    expect(shuffled.deck).toHaveLength(1);
    expect(shuffled.discardPile).toEqual([]);
  });

  it("lässt nur den zuständigen Geber mischen", () => {
    // Nach dem Geben liegt der Stapel beim nächsten Geber (deckHolder = 3).
    let s = dealCards(createInitialState({ rng: seededRng(2), dealer: 0 }), 5, 0);
    expect(s.deckHolder).toBe(3);
    // Runde leerspielen: Reststapel leeren, Ablage aus den Handkarten füllen.
    const discard = s.hands.flat();
    s = { ...s, hands: [[], [], [], []], deck: [], discardPile: discard };
    // Ein anderer Sitz als der Halter (3) darf nicht mischen.
    expect(shuffleDiscard(s, seededRng(3), 0)).toBe(s);
    // Der Halter darf.
    expect(shuffleDiscard(s, seededRng(3), 3).deck.length).toBeGreaterThan(0);
  });

  it("markiert den leeren Stapel als mischbar (deckShuffleable) beim nächsten Geber", () => {
    let s = createInitialState({ rng: seededRng(2), dealer: 0 });
    // Alle Karten ausspielen simulieren: Deck leer, Ablage voll, keine Hände.
    const discard = s.deck;
    s = { ...s, deck: [], hands: [[], [], [], []], discardPile: discard, deckHolder: 3 };
    const pub = toPublicState(s, 3);
    expect(pub.deckShuffleable).toBe(true);
    expect(pub.deckActive).toBe(false);
    // Nach dem Mischen ist er aktiv (geben möglich).
    const shuffled = shuffleDiscard(s, seededRng(3), 3);
    expect(toPublicState(shuffled, 3).deckActive).toBe(true);
    expect(toPublicState(shuffled, 3).deckShuffleable).toBe(false);
  });
});

describe("playCard", () => {
  it("legt eine Handkarte offen ab", () => {
    let s = dealCards(createInitialState({ rng: seededRng(3) }), 5);
    const seat: Seat = 0;
    const card = s.hands[seat]![0]!;
    s = playCard(s, seat, card.id);

    expect(s.hands[seat]!.some((c) => c.id === card.id)).toBe(false);
    expect(s.discardPile.some((c) => c.id === card.id)).toBe(true);
    expect(s.discardEntries.at(-1)?.actor).toBe(seat);
  });

  it("ignoriert Karten, die nicht in der Hand liegen", () => {
    const s0 = dealCards(createInitialState({ rng: seededRng(3) }), 5);
    const s1 = playCard(s0, 0, "keine-echte-id");
    expect(s1).toBe(s0);
  });
});

describe("returnCard", () => {
  it("nimmt die eigene abgelegte Karte wieder auf (K4b)", () => {
    let s = dealCards(createInitialState({ rng: seededRng(7) }), 5);
    const card = s.hands[0]![0]!;
    s = playCard(s, 0, card.id);
    s = returnCard(s, 0, card.id);
    expect(s.hands[0]!.some((item) => item.id === card.id)).toBe(true);
    expect(s.discardEntries.some((entry) => entry.card.id === card.id)).toBe(false);
  });
});

describe("swapWithPartner", () => {
  it("gibt eine Karte an den gegenübersitzenden Partner", () => {
    let s = dealCards(createInitialState({ rng: seededRng(4) }), 5);
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

describe("partner trade phase", () => {
  it("keeps an offered card hidden until the partner claims it", () => {
    let s = dealCards(createInitialState({ rng: seededRng(8) }), 5);
    const card = s.hands[0]![0]!;
    s = offerCardToPartner(s, 0, card.id);
    const offer = s.tradeOffers[0]!;
    expect(s.hands[0]!.some((item) => item.id === card.id)).toBe(false);
    expect(toPublicState(s, 2).tradeOffers[0]!.card).toBeUndefined();
    expect(toPublicState(s, 1).tradeOffers).toEqual([]);
    // Sitz 2 muss selbst zuerst anbieten, bevor er nehmen darf.
    s = offerCardToPartner(s, 2, s.hands[2]![0]!.id);
    s = claimTradeOffer(s, 2, offer.id);
    expect(s.hands[2]!.some((item) => item.id === card.id)).toBe(true);
    expect(s.tradeOffers.find((o) => o.id === offer.id)!.claimed).toBe(true);
  });

  it("does not allow claiming before having offered a card oneself", () => {
    let s = dealCards(createInitialState({ rng: seededRng(8) }), 5);
    s = offerCardToPartner(s, 0, s.hands[0]![0]!.id);
    const offer = s.tradeOffers[0]!;
    // Sitz 2 hat noch nichts angeboten → nehmen wird ignoriert.
    const after = claimTradeOffer(s, 2, offer.id);
    expect(after).toBe(s);
  });

  it("marks the taker as done after claiming (only one trade per round)", () => {
    let s = dealCards(createInitialState({ rng: seededRng(8) }), 5);
    s = offerCardToPartner(s, 0, s.hands[0]![0]!.id);
    const offer = s.tradeOffers[0]!;
    s = offerCardToPartner(s, 2, s.hands[2]![0]!.id);
    s = claimTradeOffer(s, 2, offer.id);
    expect(s.tradeDone).toContain(2);
    // Ein weiteres Angebot von Sitz 2 wird abgelehnt.
    const before = s;
    s = offerCardToPartner(s, 2, s.hands[2]![0]!.id);
    expect(s).toBe(before);
  });

  it("replaces an unclaimed own offer when offering another card", () => {
    let s = dealCards(createInitialState({ rng: seededRng(8) }), 5);
    const first = s.hands[0]![0]!;
    const second = s.hands[0]![1]!;
    s = offerCardToPartner(s, 0, first.id);
    s = offerCardToPartner(s, 0, second.id);
    // Nur ein offenes Angebot, die erste Karte ist zurück auf der Hand.
    const ownOffers = s.tradeOffers.filter((o) => o.from === 0 && !o.claimed);
    expect(ownOffers).toHaveLength(1);
    expect(ownOffers[0]!.card.id).toBe(second.id);
    expect(s.hands[0]!.some((c) => c.id === first.id)).toBe(true);
    expect(s.hands[0]!.some((c) => c.id === second.id)).toBe(false);
  });

  it("does not let a player offer a new card after the partner claimed theirs", () => {
    // Sitz 0 bietet an, der Partner (Sitz 2) nimmt die Karte. Danach darf Sitz 0
    // in dieser Runde kein neues Angebot mehr machen.
    let s = dealCards(createInitialState({ rng: seededRng(8) }), 5);
    s = offerCardToPartner(s, 0, s.hands[0]![0]!.id);
    // Der Partner muss selbst angeboten haben, um nehmen zu dürfen.
    s = offerCardToPartner(s, 2, s.hands[2]![0]!.id);
    const offerFromZero = s.tradeOffers.find((o) => o.from === 0)!;
    s = claimTradeOffer(s, 2, offerFromZero.id);
    expect(s.tradeOffers.find((o) => o.from === 0)!.claimed).toBe(true);
    // Neues Angebot von Sitz 0 wird ignoriert (Zustand unverändert).
    const before = s;
    s = offerCardToPartner(s, 0, s.hands[0]![0]!.id);
    expect(s).toBe(before);
  });

  it("resets trade state on the next deal", () => {
    let s = dealCards(createInitialState({ rng: seededRng(8) }), 5);
    s = offerCardToPartner(s, 0, s.hands[0]![0]!.id);
    s = offerCardToPartner(s, 2, s.hands[2]![0]!.id);
    s = claimTradeOffer(s, 2, s.tradeOffers.find((o) => o.to === 2)!.id);
    // Runde leerspielen, damit erneut gegeben werden kann.
    s = { ...s, hands: [[], [], [], []] };
    s = dealCards(s, 5);
    expect(s.tradeDone).toEqual([]);
    expect(s.tradeOffers).toEqual([]);
  });

  it("lets the sender revoke an unclaimed offer back to their hand", () => {
    let s = dealCards(createInitialState({ rng: seededRng(8) }), 5);
    const card = s.hands[0]![0]!;
    s = offerCardToPartner(s, 0, card.id);
    const offer = s.tradeOffers[0]!;
    s = revokeTradeOffer(s, 0, offer.id);
    // Karte ist zurück auf der Hand, Angebot entfernt.
    expect(s.hands[0]!.some((item) => item.id === card.id)).toBe(true);
    expect(s.tradeOffers).toEqual([]);
  });

  it("only the sender can revoke their own offer", () => {
    let s = dealCards(createInitialState({ rng: seededRng(8) }), 5);
    const card = s.hands[0]![0]!;
    s = offerCardToPartner(s, 0, card.id);
    const offer = s.tradeOffers[0]!;
    // Der Empfänger (Sitz 2) darf nicht zurückziehen.
    const after = revokeTradeOffer(s, 2, offer.id);
    expect(after).toBe(s);
  });

  it("does not let a revoke happen once the partner has claimed", () => {
    let s = dealCards(createInitialState({ rng: seededRng(8) }), 5);
    const card = s.hands[0]![0]!;
    s = offerCardToPartner(s, 0, card.id);
    const offer = s.tradeOffers[0]!;
    s = offerCardToPartner(s, 2, s.hands[2]![0]!.id);
    s = claimTradeOffer(s, 2, offer.id);
    const before = s;
    s = revokeTradeOffer(s, 0, offer.id);
    // Nichts ändert sich – die Karte liegt schon beim Partner.
    expect(s).toBe(before);
  });

  it("does not let a sender revoke after they have claimed themselves", () => {
    // To-do 1 (STATUS §4): Wer selbst schon getauscht hat (tradeDone), darf
    // sein eigenes, noch offenes Angebot nicht mehr zurückziehen.
    let s = dealCards(createInitialState({ rng: seededRng(8) }), 5);
    // Sitz 0 bietet an, Sitz 2 bietet an; Sitz 0 nimmt die Karte von Sitz 2.
    s = offerCardToPartner(s, 0, s.hands[0]![0]!.id);
    s = offerCardToPartner(s, 2, s.hands[2]![0]!.id);
    const offerForZero = s.tradeOffers.find((o) => o.to === 0)!;
    s = claimTradeOffer(s, 0, offerForZero.id);
    expect(s.tradeDone).toContain(0);
    // Das eigene Angebot von Sitz 0 an Sitz 2 ist noch offen …
    const ownOffer = s.tradeOffers.find((o) => o.from === 0 && !o.claimed)!;
    expect(ownOffer).toBeDefined();
    // … darf aber nach eigenem Claim nicht mehr zurückgezogen werden.
    const before = s;
    s = revokeTradeOffer(s, 0, ownOffer.id);
    expect(s).toBe(before);
  });
});

describe("confirmed master actions", () => {
  it("requires target approval before a devil can play a foreign card", () => {
    let s = dealCards(createInitialState({ rng: seededRng(11) }), 5);
    const foreignCard = s.hands[1]![0]!;
    s = requestDevilView(s, 0, 1);
    const request = s.devilRequests[0]!;
    expect(toPublicState(s, 0).devilRequests[0]?.visibleCards).toBeUndefined();
    s = approveDevilView(s, 1, request.id);
    expect(toPublicState(s, 0).devilRequests[0]?.visibleCards?.[0]?.id).toBe(foreignCard.id);
    s = playForeignCard(s, 0, request.id, foreignCard.id);
    expect(s.discardPile.at(-1)?.id).toBe(foreignCard.id);
    expect(s.hands[1]!.some((card) => card.id === foreignCard.id)).toBe(false);
  });

  it("limits devil view to the left neighbor", () => {
    const s = dealCards(createInitialState({ rng: seededRng(13) }), 5);
    expect(leftNeighborSeat(0)).toBe(1);
    expect(requestDevilView(s, 0, 2)).toBe(s);
    expect(requestDevilView(s, 0, 1).devilRequests).toHaveLength(1);
  });

  it("lets the target decline the devil view and records it in the history", () => {
    let s = dealCards(createInitialState({ rng: seededRng(13) }), 5);
    s = requestDevilView(s, 0, 1);
    const request = s.devilRequests[0]!;
    s = declineDevilView(s, 1, request.id);
    expect(s.devilRequests).toHaveLength(0);
    expect(s.history.at(-1)!.text).toContain("lehnt die Teufel-Handeinsicht ab");
  });

  it("lets the controller cancel their own devil request", () => {
    let s = dealCards(createInitialState({ rng: seededRng(13) }), 5);
    s = requestDevilView(s, 0, 1);
    const request = s.devilRequests[0]!;
    s = cancelDevilView(s, 0, request.id);
    expect(s.devilRequests).toHaveLength(0);
    expect(s.history.at(-1)!.text).toContain("bricht die Teufel-Anfrage");
  });

  it("ignores a duplicate open devil request from the same controller", () => {
    let s = dealCards(createInitialState({ rng: seededRng(13) }), 5);
    s = requestDevilView(s, 0, 1);
    s = requestDevilView(s, 0, 1);
    expect(s.devilRequests).toHaveLength(1);
  });

  it("passes all hands to the right neighbor for the narrator action", () => {
    let s = dealCards(createInitialState({ rng: seededRng(12) }), 5);
    const original = s.hands.map((hand) => hand[0]?.id);
    s = passHandsRight(s, 0);
    expect(s.hands.map((hand) => hand[0]?.id)).toEqual([original[3], original[0], original[1], original[2]]);
  });
});

describe("joinRoom", () => {
  it("weist den gewünschten freien Sitzplatz zu", () => {
    const { state, seat } = joinRoom(createInitialState(), "id1", "Anna", 2);
    expect(seat).toBe(2);
    expect(state.players[2]!.name).toBe("Anna");
    expect(state.players[2]!.team).toBe("A");
  });

  it("verdrängt den bisherigen Spieler, wenn der Wunschsitz belegt ist", () => {
    let s = createInitialState();
    s = joinRoom(s, "id1", "Anna", 0).state;
    const res = joinRoom(s, "id2", "Ben", 0);
    // Ben bekommt seinen Wunschplatz 0, Anna wird verdrängt.
    expect(res.seat).toBe(0);
    expect(res.displaced).toBe(0);
    expect(res.state.players[0]!.name).toBe("Ben");
    // Anna ist nirgends mehr eingetragen.
    expect(res.state.players.some((p) => p?.name === "Anna")).toBe(false);
  });

  it("meldet keine Verdrängung, wenn der Wunschsitz frei ist", () => {
    const res = joinRoom(createInitialState(), "id1", "Anna", 2);
    expect(res.seat).toBe(2);
    expect(res.displaced).toBeNull();
  });

  it("auto-Join (ohne Wunschsitz) nimmt nur freie Plätze, verdrängt niemanden", () => {
    let s = createInitialState();
    s = joinRoom(s, "id1", "Anna").state; // → 0
    const res = joinRoom(s, "id2", "Ben"); // → 1
    expect(res.seat).toBe(1);
    expect(res.displaced).toBeNull();
    expect(res.state.players[0]!.name).toBe("Anna");
  });

  it("erlaubt Reconnect über gleichen Namen auf denselben Sitz", () => {
    let s = createInitialState();
    s = joinRoom(s, "id1", "Anna", 1).state;
    const res = joinRoom(s, "id-neu", "Anna");
    expect(res.seat).toBe(1);
    expect(res.state.players[1]!.id).toBe("id-neu");
    expect(res.state.players[1]!.connected).toBe(true);
  });

  it("gleicher Name auf gewünschtem eigenen Sitz gilt nicht als Verdrängung", () => {
    let s = createInitialState();
    s = joinRoom(s, "id1", "Anna", 1).state;
    const res = joinRoom(s, "id-neu", "Anna", 1);
    expect(res.seat).toBe(1);
    expect(res.displaced).toBeNull();
    expect(res.state.players[1]!.id).toBe("id-neu");
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
    const s = dealCards(createInitialState({ rng: seededRng(5) }), 5);
    const pub = toPublicState(s, 0);

    expect(pub.ownHand.length).toBe(5);
    expect(pub.handCounts).toEqual([5, 5, 5, 5]);
    expect(pub.deckCount).toBe(84);
    // Es werden keine fremden Handkarten mitgeliefert.
    expect((pub as unknown as { hands?: unknown }).hands).toBeUndefined();
  });

  it("liefert leere eigene Hand für Zuschauer (viewer null)", () => {
    const s = dealCards(createInitialState({ rng: seededRng(5) }), 5);
    const pub = toPublicState(s, null);
    expect(pub.ownHand).toEqual([]);
  });
});
