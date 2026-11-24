/**
 * Darstellung eines Kugelzugs als Weg (REQ-FEEDBACK F2). Rein visuell, keine Regelprüfung.
 *
 * Der Server kennt nur Quelle und Ziel. Der Weg wird daraus abgeleitet:
 * - Kreis → Kreis: vorwärts (Uhrzeigersinn) bis 16 Felder, rückwärts bis 4 Felder,
 *   sonst Gleitflug quer über das Brett (z. B. Trickser).
 * - Kreis → eigenes Haus: über das eigene Startfeld in die Hausfelder.
 * - Haus → Haus (gleicher Besitzer): Slot für Slot.
 * - alles andere (Vorfeld, Wurf, Sonderfälle): Gleitflug.
 *
 * Wie von Hand gezählt: bis 5 Schritte einzeln, darüber in 2er-Schritten; kurz vor
 * dem eigenen Startfeld und im Haus immer einzeln.
 */

import type { BallPosition, Seat } from "@tac/shared";
import { CIRCLE_FIELD_COUNT } from "@tac/shared";

export const MAX_FORWARD = 16;
export const MAX_BACKWARD = 4;
/** Ab so vielen Schritten wird in 2er-Schritten gezählt. */
export const SINGLE_STEP_LIMIT = 5;
/** So viele Felder vor dem eigenen Startfeld (inkl. Startfeld) werden immer einzeln gegangen. */
export const HOUSE_APPROACH_STEPS = 4;

export interface MovePath {
  /** `steps`: Feld für Feld; `glide`: ein Flug von Quelle zu Ziel. */
  mode: "steps" | "glide";
  /** Wegpunkte inkl. Start (Index 0) und Ziel (letzter Index). */
  waypoints: BallPosition[];
}

const FIELDS = CIRCLE_FIELD_COUNT;
const field = (index: number): BallPosition => ({ kind: "FELD", index: ((index % FIELDS) + FIELDS) % FIELDS });
const startIndex = (seat: Seat): number => seat * (FIELDS / 4);

function glide(from: BallPosition, to: BallPosition): MovePath {
  return { mode: "glide", waypoints: [from, to] };
}

/** Wegpunkte ohne Start: n Schritte ab `from` in Richtung `dir`. */
function circleWalk(from: number, dir: 1 | -1, count: number): BallPosition[] {
  return Array.from({ length: count }, (_, i) => field(from + dir * (i + 1)));
}

/**
 * Wendet die 2er-Regel auf die Wegpunkte (ohne Start) an. `keepSingle` = Anzahl
 * der letzten Wegpunkte, die immer einzeln bleiben.
 */
function compress(points: BallPosition[], keepSingle: number): BallPosition[] {
  if (points.length <= SINGLE_STEP_LIMIT) return points;
  const headLength = Math.max(0, points.length - keepSingle);
  const head: BallPosition[] = [];
  for (let i = 1; i < headLength; i += 2) head.push(points[i]!);
  // Endet der Kopf auf einem ungeraden Rest, wird sein letzter Schritt einzeln ergänzt.
  if (headLength % 2 === 1) head.push(points[headLength - 1]!);
  return [...head, ...points.slice(headLength)];
}

export function movePath(from: BallPosition, to: BallPosition): MovePath {
  if (from.kind === "FELD" && to.kind === "FELD") {
    const forward = (to.index - from.index + FIELDS) % FIELDS;
    if (forward === 0) return glide(from, to);
    if (forward <= MAX_FORWARD) {
      return { mode: "steps", waypoints: [from, ...compress(circleWalk(from.index, 1, forward), 0)] };
    }
    const backward = FIELDS - forward;
    if (backward <= MAX_BACKWARD) {
      return { mode: "steps", waypoints: [from, ...circleWalk(from.index, -1, backward)] };
    }
    return glide(from, to);
  }

  if (from.kind === "FELD" && to.kind === "HAUS") {
    const start = startIndex(to.owner);
    const toStart = (start - from.index + FIELDS) % FIELDS;
    if (toStart > MAX_FORWARD) return glide(from, to);
    const houseSteps: BallPosition[] = Array.from({ length: to.slot + 1 }, (_, slot) => ({ kind: "HAUS", owner: to.owner, slot }));
    const points = [...circleWalk(from.index, 1, toStart), ...houseSteps];
    const keepSingle = houseSteps.length + Math.min(toStart, HOUSE_APPROACH_STEPS);
    return { mode: "steps", waypoints: [from, ...compress(points, keepSingle)] };
  }

  if (from.kind === "HAUS" && to.kind === "HAUS" && from.owner === to.owner && from.slot !== to.slot) {
    const dir = to.slot > from.slot ? 1 : -1;
    const slots: BallPosition[] = [];
    for (let slot = from.slot + dir; slot !== to.slot + dir; slot += dir) slots.push({ kind: "HAUS", owner: to.owner, slot });
    return { mode: "steps", waypoints: [from, ...slots] };
  }

  return glide(from, to);
}
