/**
 * Brett-Geometrie: berechnet die Bildschirmkoordinaten aller Felder.
 *
 * Bezug: docs/requirements/REQ-BOARD.md B1 (Brettdarstellung), B5 (Snapping).
 *
 * Reine, testbare Funktionen (keine React-/DOM-Abhängigkeit). Der Kreis mit
 * 64 Feldern wird geometrisch platziert; jedem Spieler sind ein Startfeld und
 * vier Hausfelder zugeordnet.
 *
 * Wichtig: Diese Geometrie ist reine Darstellung. Sie trägt KEINE Regelbedeutung
 * (ADR-0001). Die Startindizes sind eine sinnvolle, gleichmäßige Verteilung.
 */

import {
  CIRCLE_FIELD_COUNT,
  HOUSE_SLOT_COUNT,
  type Seat,
  SEATS,
} from "@tac/shared";

/** Ein Punkt in SVG-Koordinaten. */
export interface Point {
  x: number;
  y: number;
}

/** Konfiguration der Brettgeometrie. */
export interface BoardGeometry {
  /** Kantenlänge der quadratischen Zeichenfläche. */
  size: number;
  /** Mittelpunkt. */
  center: Point;
  /** Radius des großen Spielkreises. */
  circleRadius: number;
  /** Radius eines einzelnen Feldes (zum Zeichnen). */
  fieldRadius: number;
}

/** Standard-Geometrie für eine 1000x1000-Zeichenfläche. */
export function defaultGeometry(size = 1000): BoardGeometry {
  return {
    size,
    center: { x: size / 2, y: size / 2 },
    circleRadius: size * 0.4,
    fieldRadius: size * 0.018,
  };
}

/**
 * Startfeld-Index je Sitzplatz auf dem 64er-Kreis.
 * Gleichmäßig verteilt: Sitz 0 → 0, Sitz 1 → 16, Sitz 2 → 32, Sitz 3 → 48.
 */
export function startIndexForSeat(seat: Seat): number {
  return seat * (CIRCLE_FIELD_COUNT / 4);
}

/**
 * Winkel (Radiant) eines Kreisfeld-Index. Index 0 liegt unten (bei Spieler 0,
 * der unten sitzt) und läuft im Uhrzeigersinn. In SVG zeigt +y nach unten,
 * daher starten wir bei +90° und addieren im Uhrzeigersinn.
 */
export function angleForFieldIndex(index: number): number {
  const step = (2 * Math.PI) / CIRCLE_FIELD_COUNT;
  // Start unten (Math.PI/2 in Standard-Mathe entspricht +y in SVG),
  // im Uhrzeigersinn zunehmend.
  return Math.PI / 2 + index * step;
}

/** Position eines Kreisfeldes (0..63). */
export function circleFieldPosition(
  index: number,
  geo: BoardGeometry,
): Point {
  const angle = angleForFieldIndex(index);
  return {
    x: geo.center.x + geo.circleRadius * Math.cos(angle),
    y: geo.center.y + geo.circleRadius * Math.sin(angle),
  };
}

/** Alle 64 Kreisfeld-Positionen. */
export function allCircleFieldPositions(geo: BoardGeometry): Point[] {
  return Array.from({ length: CIRCLE_FIELD_COUNT }, (_, i) =>
    circleFieldPosition(i, geo),
  );
}

/**
 * Positionen der vier Hausfelder eines Spielers. Die Häuser liegen radial nach
 * innen, ausgehend vom Startfeld des Spielers (Richtung Mittelpunkt).
 * slot 0 liegt am weitesten außen (Hauseingang), slot 3 am tiefsten innen.
 */
export function housePositions(seat: Seat, geo: BoardGeometry): Point[] {
  const startIdx = startIndexForSeat(seat);
  const angle = angleForFieldIndex(startIdx);
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  // Häuser beginnen etwas innerhalb des Kreises und gehen weiter nach innen.
  const firstRadius = geo.circleRadius - geo.fieldRadius * 4;
  const gap = geo.fieldRadius * 2.6;

  return Array.from({ length: HOUSE_SLOT_COUNT }, (_, slot) => {
    const r = firstRadius - slot * gap;
    return {
      x: geo.center.x + r * dirX,
      y: geo.center.y + r * dirY,
    };
  });
}

/**
 * Position eines Vorfelds (Ablage der noch nicht im Spiel befindlichen Kugeln).
 * Vorfelder liegen außerhalb des Kreises, in Richtung des Startfeldes.
 */
export function vorfeldCenter(seat: Seat, geo: BoardGeometry): Point {
  const startIdx = startIndexForSeat(seat);
  const angle = angleForFieldIndex(startIdx);
  const r = geo.circleRadius + geo.fieldRadius * 5;
  return {
    x: geo.center.x + r * Math.cos(angle),
    y: geo.center.y + r * Math.sin(angle),
  };
}

/**
 * Position einer einzelnen Vorfeld-Kugel (0..3), leicht gefächert um das
 * Vorfeld-Zentrum, damit sich die vier Kugeln nicht überlappen.
 */
export function vorfeldBallPosition(
  seat: Seat,
  ballSlot: number,
  geo: BoardGeometry,
): Point {
  const center = vorfeldCenter(seat, geo);
  const spread = geo.fieldRadius * 2.4;
  // 2x2-Anordnung.
  const col = ballSlot % 2;
  const row = Math.floor(ballSlot / 2);
  return {
    x: center.x + (col - 0.5) * spread,
    y: center.y + (row - 0.5) * spread,
  };
}

/** Liefert die Startindizes aller Sitzplätze (für Marker/Highlights). */
export function allStartIndices(): Record<Seat, number> {
  const out = {} as Record<Seat, number>;
  for (const seat of SEATS) out[seat] = startIndexForSeat(seat);
  return out;
}
