/**
 * Merkt sich die zuletzt gesehenen Kugelzüge auf dem Client (REQ-FEEDBACK F2).
 * Nötig, weil der Server nur den letzten Zug liefert, ein Trickser aber zwei
 * Kugeln bewegt. Rein visuell, kein Servereingriff.
 */

import type { LastBallMove } from "@tac/shared";

export interface SeenMove {
  move: LastBallMove;
  key: string;
  seenAt: number;
}

/** Zwei Züge gelten als zusammengehörig (z. B. Trickser), wenn sie so dicht aufeinander folgen. */
export const PAIR_WINDOW_MS = 8000;
const KEEP = 4;

export function moveKey(move: LastBallMove): string {
  return `${move.ballId}:${JSON.stringify(move.from)}>${JSON.stringify(move.to)}`;
}

/**
 * Verarbeitet den vom Server gemeldeten letzten Zug.
 * - gleicher Zug wie zuletzt: nichts Neues
 * - ein früher gesehener Zug (z. B. nach Undo): zurückspulen, nicht als neu behandeln
 * - sonst: neuer Zug (`isNew`)
 */
export function updateSeenMoves(
  seen: SeenMove[],
  move: LastBallMove | null,
  now: number,
): { seen: SeenMove[]; isNew: boolean } {
  if (!move) return { seen: [], isNew: false };
  const key = moveKey(move);
  const index = seen.findIndex((item) => item.key === key);
  if (index >= 0) return { seen: seen.slice(0, index + 1), isNew: false };
  return { seen: [...seen, { move, key, seenAt: now }].slice(-KEEP), isNew: true };
}

/** Züge, die gerade markiert werden: der jüngste und ggf. der davor, wenn er dicht davor kam. */
export function visibleMoves(seen: SeenMove[]): SeenMove[] {
  const latest = seen[seen.length - 1];
  if (!latest) return [];
  return seen.slice(-2).filter((item) => latest.seenAt - item.seenAt <= PAIR_WINDOW_MS);
}
