/**
 * Erzeugung des Anfangszustands für eine Partie.
 *
 * Bezug: docs/architecture/ARCH-OVERVIEW.md §3, REQ-BOARD (B2 Startlage).
 */

import { buildDeck } from "./deck.js";
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
 * Der Stapel wird hier NICHT gemischt (das übernimmt das Geben bewusst separat),
 * bleibt aber deterministisch aufgebaut.
 *
 * @param options.masterMode Meisterversion
 * @param options.dealer Startgeber (Standard: Sitzplatz 0)
 */
export function createInitialState(options?: {
  masterMode?: boolean;
  dealer?: Seat;
}): GameState {
  const masterMode = options?.masterMode ?? false;
  return {
    players: [null, null, null, null],
    balls: createInitialBalls(),
    deck: buildDeck({ master: masterMode }),
    discardPile: [],
    hands: [[], [], [], []],
    dealer: options?.dealer ?? 0,
    masterMode,
    history: [],
    nextHistoryId: 1,
  };
}
