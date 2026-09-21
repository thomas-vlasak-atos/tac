/**
 * Netzwerk-Nachrichten und Aktionen zwischen Client und Server.
 *
 * Bezug: docs/architecture/ARCH-OVERVIEW.md §4 (Aktionen) und §5 (Nachrichten).
 *
 * Aktionen sind atomar und OHNE Regelprüfung (freies Brett, ADR-0001).
 */

import type { BallPosition, Seat } from "./domain.js";
import type { PublicGameState } from "./state.js";

/** Ziel einer Kugelbewegung. */
export type MoveTarget = BallPosition;

/** Aktionen, die ein Client an den Server sendet. */
export type ClientAction =
  | { type: "JoinRoom"; roomId: string; name: string; seat?: Seat }
  | { type: "MoveBall"; ballId: string; to: MoveTarget }
  | { type: "SwapBalls"; ballA: string; ballB: string }
  | { type: "DealCards"; cardsPerPlayer?: number }
  | { type: "PlayCard"; cardId: string }
  | { type: "SwapWithPartner"; cardId: string }
  | { type: "Announce"; canOpen: boolean }
  | { type: "SetMasterMode"; enabled: boolean }
  | { type: "ResetGame" };

/** Nachrichten, die der Server an einen Client sendet. */
export type ServerMessage =
  | { type: "StateUpdate"; state: PublicGameState; yourSeat: Seat | null }
  | { type: "PlayerJoined"; seat: Seat; name: string }
  | { type: "PlayerLeft"; seat: Seat }
  | { type: "Error"; message: string };
