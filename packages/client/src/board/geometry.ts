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
  /**
   * Grundradius r des hexagonalen Kreisgitters (siehe vorlage/board.svg).
   * Alle weiteren Maße leiten sich hieraus ab.
   */
  gridRadius: number;
  /** Radius des großen Spielkreises (64er-Lochkranz = 2*sqrt(3)*r). */
  circleRadius: number;
  /** Radius eines einzelnen Feldes (zum Zeichnen). */
  fieldRadius: number;
}

/** Standard-Geometrie für das originale 1024x1024-Brettbild. */
export function defaultGeometry(size = 1024): BoardGeometry {
  // Grundradius r des Kreisgitters. Aus ihm folgen alle weiteren Maße.
  // Faktor gegen vorlage/Board.png kalibriert (magenta äußerer Ring deckt sich
  // mit dem Lochkranz).
  const gridRadius = size * 0.1385;
  // Die 64 Laufbahn-Mulden liegen MITTIG zwischen innerem Ring (3*r) und
  // äußerem Ring (2*sqrt(3)*r). Daher liegt ihr Radius auf deren Mittelwert.
  const innerRing = 3 * gridRadius;
  const outerRing = 2 * Math.sqrt(3) * gridRadius;
  const circleRadius = (innerRing + outerRing) / 2;
  return {
    size,
    // Brettmitte des Hintergrundbilds ist minimal aus der geometrischen Mitte
    // verschoben (Kalibrierung gegen vorlage/Board.png).
    center: { x: size / 2 - 4, y: size / 2 - 3 },
    gridRadius,
    circleRadius,
    // Feldradius so, dass sich benachbarte Kreisfelder NICHT überlappen.
    fieldRadius: size * 0.013,
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
  // Geometrische Herleitung aus dem hexagonalen Kreisgitter (siehe
  // vorlage/board.svg). Alles wird aus dem Gitter-Grundradius r abgeleitet,
  // damit nur EIN Maß nötig ist und keine Zentren hardcodiert sind.
  //
  // Bezüge im Gitter:
  //   - horizontaler Spaltenabstand: r*sqrt(3)/2
  //   - vertikaler Reihenabstand:    r
  //   - äußerer Ring (64er-Lochkranz): R_ring = 2*sqrt(3)*r
  //   - Hauszentren links/rechts: ±sqrt(3)*r horizontal vom Brettzentrum
  //   - Hauszentren oben/unten:   ±2*r vertikal vom Brettzentrum
  //   - Hausmulden liegen auf einem Kreis mit R_mulde = r/sqrt(3)
  //     um das jeweilige Hauszentrum.
  //
  // Mulden-Winkel (0° = rechts, gegen den Uhrzeigersinn in Standard-Mathe;
  // in SVG zeigt +y nach unten, daher wird sin(angle) subtrahiert):
  //   - links/rechts: achsen-orientiert  {0, 60, 180, 300}°
  //   - oben/unten:   um 30° gedreht (Dreieckslücken) {0, 60, 120, 180}°
  const SQRT3 = Math.sqrt(3);

  // Gitter-Grundradius (siehe defaultGeometry). Der große Kreis entspricht
  // dem äußeren Ring 2*sqrt(3)*r, daher r = circleRadius / (2*sqrt(3)).
  const r = geo.gridRadius;
  const rMulde = r / SQRT3;

  const c = geo.center;
  const centers: Record<Seat, Point> = {
    0: { x: c.x, y: c.y + 2 * r }, // unten
    1: { x: c.x - SQRT3 * r, y: c.y }, // links
    2: { x: c.x, y: c.y - 2 * r }, // oben
    3: { x: c.x + SQRT3 * r, y: c.y }, // rechts
  };

  // Winkel in Grad je Sitzplatz (an unserer verifizierten Vorlage geprüft,
  // vorlage/board.svg). Die seitlichen Mulden zeigen bei ALLEN Häusern zur
  // Brettmitte hin (nach innen), daher sind links/rechts bzw. oben/unten
  // jeweils zueinander gespiegelt und NICHT identisch.
  const anglesBySeat: Record<Seat, number[]> = {
    0: [0, 60, 120, 180], // unten: 3, 1, 11, 9 Uhr (seitliche nach oben/innen)
    1: [0, 60, 180, 300], // links: 3, 1, 9, 5 Uhr (seitliche nach rechts/innen)
    2: [0, 300, 240, 180], // oben:  3, 5, 7, 9 Uhr (seitliche nach unten/innen)
    3: [180, 120, 0, 240], // rechts: 9, 11, 3, 7 Uhr (seitliche nach links/innen)
  };

  const center = centers[seat];
  return anglesBySeat[seat].map((deg) => {
    const a = (deg * Math.PI) / 180;
    return {
      x: center.x + rMulde * Math.cos(a),
      y: center.y - rMulde * Math.sin(a),
    };
  });
}

/**
 * Position eines Vorfelds (Ablage der noch nicht im Spiel befindlichen Kugeln).
 * Vorfelder liegen außerhalb des Kreises, in Richtung des Startfeldes.
 */
export function vorfeldCenter(seat: Seat, geo: BoardGeometry): Point {
  const margin = geo.size * 0.085;
  const corners: Record<Seat, Point> = {
    0: { x: margin, y: geo.size - margin },
    1: { x: geo.size - margin, y: geo.size - margin },
    2: { x: geo.size - margin, y: margin },
    3: { x: margin, y: margin },
  };
  return corners[seat];
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
  const spread = geo.fieldRadius * 2.9;
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
