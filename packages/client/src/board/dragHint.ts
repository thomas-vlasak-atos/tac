/**
 * Zielhilfe beim Ziehen einer Kugel (REQ-FEEDBACK F7, Stufe 1).
 * Regelfrei: zeigt nur, wie viele Felder zwischen Quelle und Einrastfeld liegen.
 */

import type { BallPosition } from "@tac/shared";
import { CIRCLE_FIELD_COUNT } from "@tac/shared";
import { movePath } from "./movePath.js";

const FIELDS = CIRCLE_FIELD_COUNT;

/** Beschriftung wie „+5" (vorwärts im Uhrzeigersinn) oder „−3" (rückwärts); null = nichts anzeigen. */
export function dragDistanceLabel(from: BallPosition, to: BallPosition): string | null {
  if (from.kind === "FELD" && to.kind === "FELD") {
    const forward = (to.index - from.index + FIELDS) % FIELDS;
    if (forward === 0) return null;
    return forward <= FIELDS / 2 ? `+${forward}` : `−${FIELDS - forward}`;
  }
  if (from.kind === "HAUS" && to.kind === "HAUS" && from.owner === to.owner && from.slot !== to.slot) {
    const diff = to.slot - from.slot;
    return diff > 0 ? `+${diff}` : `−${-diff}`;
  }
  if (from.kind === "FELD" && to.kind === "HAUS") {
    const path = movePath(from, to);
    return path.mode === "steps" ? `+${path.waypoints.length - 1}` : null;
  }
  return null;
}
