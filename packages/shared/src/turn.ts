/**
 * „Wer ist dran?" – rein informative Ableitung (REQ-FEEDBACK F1).
 *
 * Die App kennt kein Zugrecht (ADR-0001). Als Hinweis gilt: Nach einer gespielten
 * Karte ist der nächste Spieler im Uhrzeigersinn (Sitz + 1) mit Handkarten dran.
 * Beim Teufel wird die Karte im Namen des Opfers abgelegt, der Hinweis springt
 * daher automatisch hinter das Opfer.
 */

import type { Seat } from "./domain.js";
import type { PublicGameState } from "./state.js";

export type TurnInput = Pick<
  PublicGameState,
  "players" | "handCounts" | "discardEntries" | "deckHolder" | "tradeDone"
>;

/** Nächster Sitz im Uhrzeigersinn ab `from` (exklusiv), der belegt ist und Handkarten hat. */
function nextWithCards(input: TurnInput, from: number): Seat | null {
  for (let step = 1; step <= 4; step++) {
    const seat = ((from + step) % 4) as Seat;
    if (input.players[seat] && (input.handCounts[seat] ?? 0) > 0) return seat;
  }
  return null;
}

/**
 * Sitz, der laut Ableitung als Nächstes eine Karte spielt, oder `null`
 * (keine Karten im Spiel, Tauschphase läuft noch, Reststapel in der Mitte).
 */
export function nextToPlay(input: TurnInput): Seat | null {
  const occupied = input.players.filter((player) => player != null).length;
  if (occupied === 0) return null;
  if (input.tradeDone.length < occupied) return null;
  const last = input.discardEntries[input.discardEntries.length - 1];
  if (last) return nextWithCards(input, last.actor);
  // Rundenstart: Der Reststapel liegt beim nächsten Geber, links vom Geber beginnt.
  if (input.deckHolder == null) return null;
  const holder = input.deckHolder;
  if (input.players[holder] && (input.handCounts[holder] ?? 0) > 0) return holder;
  return nextWithCards(input, holder);
}
