/**
 * Berechnet das Brettbild als SVG (statt es zu zeichnen oder als PNG zu pflegen).
 *
 * Alles folgt aus EINEM Grundmaß (`geo.gridRadius`, siehe geometry.ts): das
 * Blume-des-Lebens-Gitter, die Linien durch die Gitterpunkte, die Mulden und die
 * Zählpunkte. Dadurch liegen Mulden exakt dort, wo Kugeln und Markierungen im Client
 * gezeichnet werden. Reine Funktion ohne DOM, getestet.
 *
 * Bezug: docs/requirements/REQ-DESIGN.md D6, docs/architecture/ARCH-BOARD-GEOMETRY.md.
 */

import { CIRCLE_FIELD_COUNT, SEATS, type Seat } from "@tac/shared";
import {
  type BoardGeometry,
  circleFieldPosition,
  defaultGeometry,
  houseCenter,
  housePositions,
  type Point,
  vorfeldCenter,
} from "./geometry.js";

export interface BoardSvgOptions {
  /** Kantenlänge (Standard 1024, passend zur Client-Geometrie). */
  size?: number;
  /** Hintergrundfarbe; `null` = transparent (z. B. wenn ein Holz-PNG darunterliegt). */
  background?: string | null;
  /** Farben (Zweifarbigkeit wie im Original: graue Kreise/Mulden, schwarze Linien). */
  colors?: Partial<BoardColors>;
  /** Zählpunkte bei jedem 2. Feld zeichnen. */
  countingDots?: boolean;
}

export interface BoardColors {
  background: string;
  circles: string;
  lines: string;
  /** Kleine Mulden (Löcher im Holz): runder Verlauf von der Mitte (hell) zum Rand (Schatten). */
  holeLight: string;
  holeDark: string;
  /** Rand der großen Mulden: oben rechts dunkel, unten links hell (Licht kommt von rechts oben). */
  rimDark: string;
  rimLight: string;
  wellLight: string;
  wellDark: string;
  dot: string;
  frame: string;
}

/** Graue Kreise und Zählpunkte teilen sich dieselbe Farbe. */
const SILVER = "#8a8a8a";

export const DEFAULT_BOARD_COLORS: BoardColors = {
  background: "#ecdcb4",
  circles: SILVER,
  lines: "#111111",
  holeLight: "#707070",
  holeDark: "#2e2e2e",
  rimDark: "#2c2c2c",
  rimLight: "#9a9a9a",
  wellLight: "#34466e",
  wellDark: "#141c30",
  dot: SILVER,
  frame: SILVER,
};

/** Gold für das Brett auf dunklem Holz (statt Silbergrau). */
const GOLD = "#cda349";

/** Farben für dunkles Holz: Kreise, Punkte und Rahmen in Gold, dunklere Mulden, goldener Muldenrand. */
export const DARK_BOARD_COLORS: BoardColors = {
  ...DEFAULT_BOARD_COLORS,
  background: "#3a2414",
  circles: GOLD,
  lines: "#8c6d2c",
  holeLight: "#4a3d31",
  holeDark: "#110d09",
  rimDark: "#15100a",
  rimLight: "#dcbc62",
  dot: GOLD,
  frame: GOLD,
};

const SQRT3 = Math.sqrt(3);

/** Muldenradien relativ zum Feldradius (nach Foto: Hausmulden etwas größer als Laufmulden). */
export const TRACK_HOLE_FACTOR = 1.3;
export const HOUSE_HOLE_FACTOR = 1.45;

/** Radius des grauen Hausrings relativ zum Abstand der Hausmulden vom Hauszentrum (von Hand auf Radius 60 gesetzt). */
export const HOUSE_RING_FACTOR = 0.733;

/** Abstand der Punktmitte vom Weg- bzw. Ringende (Punkt liegt knapp innerhalb: am Weg nach vorn, am Ring zur Mitte hin). */
const DOT_INSET = 2.6;

const angleOf = (from: Point, to: Point): number => Math.atan2(to.y - from.y, to.x - from.x);
const TWO_PI = 2 * Math.PI;
const mod2pi = (a: number): number => ((a % TWO_PI) + TWO_PI) % TWO_PI;

/** Kurzer Strich vom Brettrand bis zum Zählpunkt der Startmulde (Achsenmarkierung). */
export function axisTick(seat: Seat, geo: BoardGeometry): { from: Point; to: Point } {
  // Der Zählpunkt der Startmulde ist der (seat·8)-te Zählpunkt (Startfeld seat·16, jedes 2. Feld).
  const dot = countingDotPositions(geo)[seat * 8]!;
  const dx = dot.x - geo.center.x;
  const dy = dot.y - geo.center.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const edge = 1.3;
  // Strecke bis zum Brettrand entlang der (achsenparallelen) Richtung.
  const toEdge = Math.abs(ux) > Math.abs(uy) ? ((ux > 0 ? geo.size - edge : edge) - dot.x) / ux : ((uy > 0 ? geo.size - edge : edge) - dot.y) / uy;
  return { from: { x: dot.x + ux * toEdge, y: dot.y + uy * toEdge }, to: dot };
}

export interface HouseWay {
  /** Strich von der Startmulde (Muldenrand + 4) bis zum Eingang bzw. zum Hausring. */
  path: { from: Point; to: Point };
  /** Liegt der Eingang (Hausmulde) auf der Achse: kurzer Strich vom anderen Muldenrand bis zum Ring. */
  stub: { from: Point; to: Point } | null;
  /** Offener Hausring: Bogen von der Wegmündung im Uhrzeigersinn bis zur Richtung der letzten Hausmulde. */
  ring: { start: Point; end: Point; sweep: number };
  /** Punkte: am Wegbeginn und am Ende des Rings. */
  startDot: Point;
  endDot: Point;
}

/**
 * Weg ins Haus: Strich von der Startmulde zum Haus, grauer Ring (offen, nach Hausgeometrie) und zwei Punkte.
 * Der Ring beginnt dort, wo der Weg mündet, läuft im Uhrzeigersinn und endet in Richtung der letzten
 * Hausmulde (Slot 3). Dadurch ist die Öffnung bei unten/oben 90°, bei links/rechts 120°.
 */
export function houseWay(seat: Seat, geo: BoardGeometry, trackHoleR: number, ringR: number, houseHoleR: number): HouseWay {
  const start = circleFieldPosition(seat * (CIRCLE_FIELD_COUNT / 4), geo);
  const h = houseCenter(seat, geo);
  const len = Math.hypot(h.x - start.x, h.y - start.y);
  const ux = (h.x - start.x) / len;
  const uy = (h.y - start.y) / len;
  const at = (distance: number): Point => ({ x: start.x + ux * distance, y: start.y + uy * distance });
  const from = at(trackHoleR + 4);
  const ringPoint = at(len - ringR);

  // Liegt eine Hausmulde auf der Achse (Eingang), läuft der Strich bis zu ihrem Rand und dahinter weiter zum Ring.
  let pathEnd = len - ringR;
  let stub: HouseWay["stub"] = null;
  let nearest = Infinity; // nur die der Startmulde nächste Hausmulde auf der Achse zählt
  for (const hole of housePositions(seat, geo)) {
    const along = (hole.x - start.x) * ux + (hole.y - start.y) * uy;
    const across = Math.abs((hole.x - start.x) * uy - (hole.y - start.y) * ux);
    if (across < 2 && along > 0 && along < nearest) {
      nearest = along;
      pathEnd = along - houseHoleR;
      stub = { from: at(along + houseHoleR), to: ringPoint };
    }
  }

  const junction = angleOf(h, start);
  const last = housePositions(seat, geo)[3]!;
  const sweep = mod2pi(angleOf(h, last) - junction);
  const onRing = (angle: number, radius = ringR): Point => ({ x: h.x + Math.cos(angle) * radius, y: h.y + Math.sin(angle) * radius });
  const endAngle = junction + sweep;
  return {
    path: { from, to: at(pathEnd) },
    stub,
    ring: { start: onRing(junction), end: onRing(endAngle), sweep },
    startDot: at(trackHoleR + 4 + DOT_INSET),
    endDot: onRing(endAngle, ringR - DOT_INSET), // knapp innerhalb des Ringendes
  };
}

/** Radius der mittleren Ablagemulde (Rand kommt dazu). */
const CENTER_WELL_RADIUS = 132;

/** Gitterpunkte mit Abstand `minR < d <= maxR` (in Vielfachen von r) zur Brettmitte. Spalten im Abstand r·√3/2, Zeilen im Abstand r. */
function latticePointsBetween(geo: BoardGeometry, minR: number, maxR: number): Point[] {
  const r = geo.gridRadius;
  const points: Point[] = [];
  for (let i = -6; i <= 6; i++) {
    const offset = Math.abs(i) % 2 === 1 ? 0.5 : 0;
    for (let j = -6; j <= 6; j++) {
      const x = (i * SQRT3 * r) / 2;
      const y = (j + offset) * r;
      const d = Math.hypot(x, y) / r;
      if (d > minR + 1e-6 && d <= maxR + 1e-6) points.push({ x: geo.center.x + x, y: geo.center.y + y });
    }
  }
  return points;
}

/** Mittelpunkte des Blume-des-Lebens-Gitters innerhalb des Musterrings (37 Kreise). */
export function latticeCenters(geo: BoardGeometry): Point[] {
  return [...latticePointsBetween(geo, -1, 3)];
}

/** Die 18 Kreise knapp außerhalb des Musterrings; man sieht nur Bögen davon, sie machen das Muster am Rand komplett. */
export function outerLatticeCenters(geo: BoardGeometry): Point[] {
  return latticePointsBetween(geo, 3, Math.sqrt(13));
}

/** Linien durch die Gitterpunkte in den drei Gitterrichtungen (senkrecht, ±30°), lang genug für den Zuschnitt. */
export function latticeLines(geo: BoardGeometry): Array<[Point, Point]> {
  const r = geo.gridRadius;
  const reach = 4 * r;
  const lines: Array<[Point, Point]> = [];
  const dirs = [Math.PI / 2, Math.PI / 6, -Math.PI / 6];
  for (const angle of dirs) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    // Normale der Linienschar; Linienabstand r·√3/2.
    const nx = -dy;
    const ny = dx;
    for (let m = -3; m <= 3; m++) {
      const offset = m * ((SQRT3 * r) / 2);
      const cx = geo.center.x + nx * offset;
      const cy = geo.center.y + ny * offset;
      lines.push([
        { x: cx - dx * reach, y: cy - dy * reach },
        { x: cx + dx * reach, y: cy + dy * reach },
      ]);
    }
  }
  return lines;
}

/** Zählpunkt-Positionen: bei jedem zweiten Feld (gerade Indizes), radial außerhalb der Mulde. */
export function countingDotPositions(geo: BoardGeometry): Point[] {
  const out: Point[] = [];
  for (let index = 0; index < CIRCLE_FIELD_COUNT; index += 2) {
    const p = circleFieldPosition(index, geo);
    const dx = p.x - geo.center.x;
    const dy = p.y - geo.center.y;
    const len = Math.hypot(dx, dy);
    // Mitte zwischen dem Muldenrand und dem äußeren Ring.
    const outerRing = 2 * SQRT3 * geo.gridRadius;
    const push = (geo.circleRadius + geo.fieldRadius * TRACK_HOLE_FACTOR + outerRing) / 2 - geo.circleRadius;
    out.push({ x: p.x + (dx / len) * push, y: p.y + (dy / len) * push });
  }
  return out;
}

const n = (value: number): string => value.toFixed(2).replace(/\.?0+$/, "");

export function generateBoardSvg(options: BoardSvgOptions = {}): string {
  const size = options.size ?? 1024;
  const geo = defaultGeometry(size);
  const c: BoardColors = { ...DEFAULT_BOARD_COLORS, ...options.colors };
  const background = options.background === undefined ? c.background : options.background;
  const r = geo.gridRadius;
  const clipRadius = 3 * r;
  const outerRing = 2 * SQRT3 * r;
  const trackHoleR = geo.fieldRadius * TRACK_HOLE_FACTOR;
  const houseHoleR = geo.fieldRadius * HOUSE_HOLE_FACTOR;
  /** Die Linien enden am grauen Kreis um die Mitte (mittlerer Gitterkreis, Radius r). */
  const linesInnerRadius = r;

  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`);
  // Große Mulden: Licht von rechts oben (Rand oben rechts dunkel, unten links hell).
  // Kleine Mulden sind schlichte Löcher im Holz: nur ein runder Verlauf, kein Rand.
  parts.push(`<defs>`);
  parts.push(`<clipPath id="pattern-clip"><circle cx="${n(geo.center.x)}" cy="${n(geo.center.y)}" r="${n(clipRadius)}" /></clipPath>`);
  // Linien und graue Kreise nur im Ring zwischen dem grauen Mittelkreis (Grenze) und dem Musterring.
  const ring = (radius: number) => `M ${n(geo.center.x - radius)} ${n(geo.center.y)} a ${n(radius)} ${n(radius)} 0 1 0 ${n(2 * radius)} 0 a ${n(radius)} ${n(radius)} 0 1 0 ${n(-2 * radius)} 0 Z`;
  parts.push(`<clipPath id="ring-clip"><path clip-rule="evenodd" d="${ring(clipRadius)} ${ring(linesInnerRadius)}" /></clipPath>`);
  parts.push(`<radialGradient id="hole-fill" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${c.holeLight}" /><stop offset="1" stop-color="${c.holeDark}" /></radialGradient>`);
  parts.push(`<linearGradient id="hole-rim" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.rimDark}" /><stop offset="1" stop-color="${c.rimLight}" /></linearGradient>`);
  parts.push(`<radialGradient id="well-fill" cx="0.62" cy="0.66" r="0.85"><stop offset="0" stop-color="${c.wellLight}" /><stop offset="1" stop-color="${c.wellDark}" /></radialGradient>`);
  parts.push(`</defs>`);
  if (background) parts.push(`<rect id="background" width="${size}" height="${size}" fill="${background}" />`);

  parts.push(`<g id="lattice-lines" inkscape:groupmode="layer" inkscape:label="black lines" clip-path="url(#ring-clip)" stroke="${c.lines}" stroke-width="1.2" stroke-linecap="butt">`);
  for (const [a, b] of latticeLines(geo)) parts.push(`<line x1="${n(a.x)}" y1="${n(a.y)}" x2="${n(b.x)}" y2="${n(b.y)}" />`);
  parts.push(`</g>`);

  parts.push(`<g id="rings" inkscape:groupmode="layer" inkscape:label="rings and frame" fill="none" stroke="${c.frame}" stroke-width="1.6">`);
  parts.push(`<circle cx="${n(geo.center.x)}" cy="${n(geo.center.y)}" r="${n(clipRadius)}" />`);
  parts.push(`<circle cx="${n(geo.center.x)}" cy="${n(geo.center.y)}" r="${n(outerRing)}" />`);
  const inset = geo.boardBorderInset;
  parts.push(`<rect x="${n(inset)}" y="${n(inset)}" width="${n(size - 2 * inset)}" height="${n(size - 2 * inset)}" />`);
  parts.push(`</g>`);

  parts.push(`<g id="wells" inkscape:groupmode="layer" inkscape:label="wells">`);
  const well = (p: Point, radius: number, outerRing = true) => {
    if (outerRing) parts.push(`<circle cx="${n(p.x)}" cy="${n(p.y)}" r="${n(radius + 8)}" fill="none" stroke="${c.frame}" stroke-width="1.6" />`);
    parts.push(`<circle cx="${n(p.x)}" cy="${n(p.y)}" r="${n(radius)}" fill="url(#well-fill)" stroke="url(#hole-rim)" stroke-width="7" />`);
  };
  // Ablagefeld in der Mitte: ohne schwarzen Zusatzring; zwischen Mulde und grauem Mittelkreis bleibt Platz.
  well({ x: geo.center.x, y: geo.center.y }, CENTER_WELL_RADIUS, false);
  for (const seat of SEATS) well(vorfeldCenter(seat, geo), geo.vorfeldOuterRadius * 0.86);
  parts.push(`</g>`);

  const hole = (p: Point, radius: number) => `<circle cx="${n(p.x)}" cy="${n(p.y)}" r="${n(radius)}" fill="url(#hole-fill)" />`;
  const houseHole = (p: Point) => hole(p, houseHoleR);
  parts.push(`<g id="track-holes" inkscape:groupmode="layer" inkscape:label="track holes">`);
  for (let index = 0; index < CIRCLE_FIELD_COUNT; index++) parts.push(hole(circleFieldPosition(index, geo), trackHoleR));
  parts.push(`</g>`);

  parts.push(`<g id="house-holes" inkscape:groupmode="layer" inkscape:label="houses">`);
  for (const seat of SEATS) for (const p of housePositions(seat, geo)) parts.push(houseHole(p));
  parts.push(`</g>`);

  if (options.countingDots ?? true) {
    parts.push(`<g id="counting-dots" inkscape:groupmode="layer" inkscape:label="counting dots" fill="${c.dot}">`);
    for (const p of countingDotPositions(geo)) parts.push(`<circle cx="${n(p.x)}" cy="${n(p.y)}" r="3.4" />`);
    parts.push(`</g>`);
  }

  // Graue Kreise liegen ganz oben (oberste Ebene), dürfen nicht in den grauen Mittelkreis ragen
  // und haben dieselbe Farbe wie die Zählpunkte.
  parts.push(`<g id="outer-circles" inkscape:groupmode="layer" inkscape:label="outer circles" clip-path="url(#ring-clip)" fill="none" stroke="${c.circles}" stroke-width="1.6">`);
  for (const p of outerLatticeCenters(geo)) parts.push(`<circle cx="${n(p.x)}" cy="${n(p.y)}" r="${n(r)}" />`);
  parts.push(`</g>`);

  parts.push(`<g id="flower-circles" inkscape:groupmode="layer" inkscape:label="grey circles" clip-path="url(#ring-clip)" fill="none" stroke="${c.circles}" stroke-width="1.6">`);
  for (const p of latticeCenters(geo)) {
    if (Math.hypot(p.x - geo.center.x, p.y - geo.center.y) < 1) continue; // Mittelkreis: siehe unten (Grenzkreis)
    parts.push(`<circle cx="${n(p.x)}" cy="${n(p.y)}" r="${n(r)}" />`);
  }
  parts.push(`</g>`);

  // Häuser: offener grauer Ring innerhalb der vier Mulden und der Weg ins Haus (silberner Strich von der
  // Startmulde zum Haus) mit Punkten am Wegbeginn und am Ringende; dazu die Achsenstriche vom Brettrand.
  const houseRingR = (geo.gridRadius / SQRT3) * HOUSE_RING_FACTOR;
  const ways = SEATS.map((seat) => houseWay(seat, geo, trackHoleR, houseRingR, houseHoleR));
  const line = (a: Point, b: Point) => `<line x1="${n(a.x)}" y1="${n(a.y)}" x2="${n(b.x)}" y2="${n(b.y)}" />`;
  parts.push(`<g id="house-rings" inkscape:groupmode="layer" inkscape:label="house rings" fill="none" stroke="${c.circles}" stroke-width="1.6">`);
  for (const way of ways) {
    const { start, end, sweep } = way.ring;
    parts.push(`<path d="M ${n(start.x)} ${n(start.y)} A ${n(houseRingR)} ${n(houseRingR)} 0 ${sweep > Math.PI ? 1 : 0} 1 ${n(end.x)} ${n(end.y)}" />`);
  }
  parts.push(`</g>`);

  parts.push(`<g id="house-paths" inkscape:groupmode="layer" inkscape:label="house paths" stroke="${c.circles}" stroke-width="1.6" stroke-linecap="butt">`);
  for (const seat of SEATS) {
    const way = ways[seat]!;
    const tick = axisTick(seat, geo);
    parts.push(line(tick.from, tick.to));
    parts.push(line(way.path.from, way.path.to));
    if (way.stub) parts.push(line(way.stub.from, way.stub.to));
  }
  parts.push(`</g>`);

  parts.push(`<g id="house-dots" inkscape:groupmode="layer" inkscape:label="house dots" fill="${c.circles}">`);
  for (const way of ways) {
    parts.push(`<circle cx="${n(way.startDot.x)}" cy="${n(way.startDot.y)}" r="3.4" />`);
    parts.push(`<circle cx="${n(way.endDot.x)}" cy="${n(way.endDot.y)}" r="3.4" />`);
  }
  parts.push(`</g>`);

  parts.push(`<g id="center-boundary" inkscape:groupmode="layer" inkscape:label="center boundary" fill="none" stroke="${c.circles}" stroke-width="1.6">`);
  parts.push(`<circle cx="${n(geo.center.x)}" cy="${n(geo.center.y)}" r="${n(linesInnerRadius)}" />`);
  parts.push(`</g>`);

  parts.push(`</svg>`);
  return parts.join("\n");
}
