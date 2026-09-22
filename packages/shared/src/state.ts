/**
 * Zentraler Spielzustand (GameState) für das freie TAC-Brett.
 *
 * Bezug: docs/architecture/ARCH-OVERVIEW.md §3.
 *
 * Der Zustand ist serialisierbar (JSON) und enthält keine Regellogik.
 */

import type { Card } from "./cards.js";
import type { Ball, BallPosition, Player, Seat } from "./domain.js";

/** Sichtbare Metadaten einer abgelegten Karte (REQ-BOARD K4a-d). */
export interface DiscardEntry {
  card: Card;
  actor: Seat;
  timestamp: number;
  offset: number;
  rotation: number;
}

/** Eine verdeckte Karte im freiwilligen Partnertausch. */
export interface TradeOffer {
  id: string;
  from: Seat;
  to: Seat;
  card: Card;
  claimed: boolean;
}

/** Öffentliche Sicht eines Tauschangebots. Die Karte bleibt zunächst verborgen. */
export interface PublicTradeOffer {
  id: string;
  from: Seat;
  to: Seat;
  card?: Card;
  claimed: boolean;
}

/** Rein visuelle Markierung des zuletzt bewegten Spielsteins. */
export interface LastBallMove {
  ballId: string;
  from: BallPosition;
  to: BallPosition;
}

/** Bestätigungsanfrage für die bewusste Teufel-Handeinsicht. */
export interface DevilRequest {
  id: string;
  controller: Seat;
  target: Seat;
  approved: boolean;
}

export interface PublicDevilRequest extends DevilRequest {
  visibleCards?: Card[];
}

/** Ein Eintrag im Zugverlauf (nur Anzeige, kein Undo). REQ-BOARD H1–H3. */
export interface HistoryEntry {
  /** Fortlaufende ID (aufsteigend). */
  id: number;
  /** Sitzplatz des Handelnden (falls zuordenbar). */
  actor: Seat | null;
  /** Menschlich lesbarer Text, z. B. "blau: Feld 12 → Feld 17". */
  text: string;
  /** Zeitpunkt (ms seit Epoch). */
  timestamp: number;
}

/** Vollständiger, serverseitiger Spielzustand. */
export interface GameState {
  /** Spieler je Sitzplatz (Index 0..3); null = Platz frei. */
  players: (Player | null)[];
  /** Alle 16 Kugeln. */
  balls: Ball[];
  /** Verdeckter Reststapel (nur serverseitig vollständig). */
  deck: Card[];
  /** Offen abgelegte Karten (für alle sichtbar). */
  discardPile: Card[];
  discardEntries: DiscardEntry[];
  tradeOffers: TradeOffer[];
  nextTradeOfferId: number;
  lastBallMove: LastBallMove | null;
  devilRequests: DevilRequest[];
  nextDevilRequestId: number;
  /** Handkarten je Sitzplatz (nur an den jeweiligen Spieler ausgeliefert). */
  hands: Card[][];
  /** Sitzplatz des aktuellen Gebers. */
  dealer: Seat;
  /** Meisterversion aktiv? */
  masterMode: boolean;
  /** Zugverlauf (jüngste Einträge am Ende). */
  history: HistoryEntry[];
  /** Nächste Verlaufs-ID. */
  nextHistoryId: number;
}

/**
 * Öffentliche Sicht auf den Zustand, wie sie EIN Client erhält.
 * Fremde Hände werden auf ihre Anzahl reduziert; der Reststapel nur als Anzahl.
 *
 * Bezug: ARCH-OVERVIEW §6 (Sichtbarkeit/Fairness).
 */
export interface PublicGameState {
  players: (Player | null)[];
  balls: Ball[];
  discardPile: Card[];
  discardEntries: DiscardEntry[];
  tradeOffers: PublicTradeOffer[];
  lastBallMove: LastBallMove | null;
  devilRequests: PublicDevilRequest[];
  /** Anzahl Handkarten je Sitzplatz (nicht die Karten selbst). */
  handCounts: number[];
  /** Die eigene Hand des empfangenden Spielers. */
  ownHand: Card[];
  /** Verbleibende Anzahl Karten im Reststapel. */
  deckCount: number;
  dealer: Seat;
  masterMode: boolean;
  history: HistoryEntry[];
}
