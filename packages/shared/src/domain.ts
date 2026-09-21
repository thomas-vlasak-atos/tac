/**
 * Domänentypen für das freie TAC-Brett.
 *
 * Bezug: docs/requirements/REQ-BOARD.md
 *
 * Wichtig: Diese Typen modellieren nur den *Zustand* des Bretts. Sie enthalten
 * bewusst KEINE Spielregeln (siehe ADR-0001). Felder sind reine Koordinaten
 * ohne Regelbedeutung.
 */

/** Anzahl der Felder im Spielkreis (großer Ring). */
export const CIRCLE_FIELD_COUNT = 64;

/** Anzahl der Hausfelder pro Spieler. */
export const HOUSE_SLOT_COUNT = 4;

/** Kugeln pro Spieler / Farbe. */
export const BALLS_PER_PLAYER = 4;

/** Sitzplätze (fix vier Spieler). */
export type Seat = 0 | 1 | 2 | 3;

/** Die vier Sitzplätze als Konstante. */
export const SEATS: readonly Seat[] = [0, 1, 2, 3];

/** Teams. Team A: Sitzplätze 0 & 2, Team B: Sitzplätze 1 & 3. */
export type Team = "A" | "B";

/** Spielfarben – fest an die Sitzplätze gekoppelt. */
export type Color = "blau" | "gelb" | "gruen" | "rot";

/** Farbe je Sitzplatz (Index = Seat). */
export const COLOR_BY_SEAT: readonly Color[] = ["blau", "gelb", "gruen", "rot"];

/** Team je Sitzplatz (Index = Seat). Partner sitzen gegenüber. */
export const TEAM_BY_SEAT: readonly Team[] = ["A", "B", "A", "B"];

/**
 * Position einer Kugel. Diskriminierte Union.
 * - VORFELD: Kugel ist noch nicht (oder nicht mehr) im Spiel.
 * - FELD: Kugel steht auf einem der Kreisfelder (0..63).
 * - HAUS: Kugel steht in einem Hausfeld eines Spielers (slot 0..3).
 */
export type BallPosition =
  | { kind: "VORFELD"; owner: Seat }
  | { kind: "FELD"; index: number }
  | { kind: "HAUS"; owner: Seat; slot: number };

/** Eine Kugel auf dem Brett. */
export interface Ball {
  /** Stabile ID, z. B. "blau-0". */
  id: string;
  color: Color;
  /** Sitzplatz des Besitzers (bestimmt Vorfeld/Haus/Farbe). */
  owner: Seat;
  position: BallPosition;
}

/** Ein Spieler in einer Sitzung. */
export interface Player {
  /** Verbindungs-/Sitzungs-ID (serverseitig vergeben). */
  id: string;
  name: string;
  seat: Seat;
  team: Team;
  color: Color;
  connected: boolean;
}
