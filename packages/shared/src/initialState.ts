/**
 * Erzeugung des Anfangszustands für eine Partie.
 *
 * Bezug: docs/architecture/ARCH-OVERVIEW.md §3, REQ-BOARD (B2 Startlage).
 */

import { buildDeck, type Rng, shuffle } from "./deck.js";
import {
  BALLS_PER_PLAYER,
  type Ball,
  COLOR_BY_SEAT,
  SEATS,
  type Seat,
} from "./domain.js";
import type { GameState } from "./state.js";

/** Erzeugt die 16 Kugeln, alle im jeweiligen Vorfeld. */
export function createInitialBalls(): Ball[] {
  const balls: Ball[] = [];
  for (const seat of SEATS) {
    const color = COLOR_BY_SEAT[seat]!;
    for (let i = 0; i < BALLS_PER_PLAYER; i++) {
      balls.push({
        id: `${color}-${i}`,
        color,
        owner: seat,
        position: { kind: "VORFELD", owner: seat },
      });
    }
  }
  return balls;
}

/**
 * Erzeugt einen frischen Spielzustand.
 * Der Stapel wird EINMAL gemischt (wie ein gemischter Stapel am echten Tisch,
 * der zum Geben bereitliegt). Das spätere `Geben` mischt bewusst NICHT erneut,
 * sondern zieht von oben; erneutes Mischen erfolgt nur über den `Mischen`-Schritt
 * (Ablagestapel zurückmischen).
 *
 * @param options.masterMode Meisterversion
 * @param options.dealer Startgeber (Standard: Sitzplatz 0)
 * @param options.rng Zufallsgenerator zum initialen Mischen (Standard: Math.random)
 */
export function createInitialState(options?: {
  masterMode?: boolean;
  dealer?: Seat;
  rng?: Rng;
}): GameState {
  const masterMode = options?.masterMode ?? true;
  const rng = options?.rng ?? Math.random;
  return {
    players: [null, null, null, null],
    balls: createInitialBalls(),
    deck: shuffle(buildDeck({ master: masterMode }), rng),
    discardPile: [],
    discardEntries: [],
    tradeOffers: [],
    nextTradeOfferId: 1,
    tradeDone: [],
    lastBallMove: null,
    devilRequests: [],
    nextDevilRequestId: 1,
    hands: [[], [], [], []],
    dealer: options?.dealer ?? 0,
    // Rundenstart: Stapel liegt in der Mitte (kein Halter), der Geber gibt.
    deckHolder: null,
    masterMode,
    history: [],
    nextHistoryId: 1,
  };
}
