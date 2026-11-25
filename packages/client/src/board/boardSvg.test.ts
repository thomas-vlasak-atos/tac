import { describe, expect, it } from "vitest";
import { circleFieldPosition, defaultGeometry, houseCenter, housePositions } from "./geometry.js";
import { countingDotPositions, generateBoardSvg, latticeCenters, housePath, latticeLines, outerLatticeCenters, TRACK_HOLE_FACTOR } from "./boardSvg.js";

const count = (svg: string, tag: string) => (svg.match(new RegExp(`<${tag}[ >]`, "g")) ?? []).length;

describe("generateBoardSvg (berechnetes Brettbild)", () => {
  const geo = defaultGeometry(1024);

  it("Given das Blume-des-Lebens-Gitter, Then gibt es 37 Mittelpunkte (7 + 2·6 + 2·5 + 2·4)", () => {
    expect(latticeCenters(geo)).toHaveLength(37);
  });

  it("Given die Randkreise, Then gibt es 18 weitere Kreise knapp außerhalb des Musterrings", () => {
    expect(outerLatticeCenters(geo)).toHaveLength(18);
    expect(generateBoardSvg()).toContain('id="outer-circles"');
  });

  it("Given die großen Mulden, Then haben sie einen 3D-Rand (Licht von rechts oben)", () => {
    const svg = generateBoardSvg();
    expect(svg).toContain('id="hole-rim" x1="1" y1="0" x2="0" y2="1"');
    expect(svg).toContain('stroke="url(#hole-rim)"');
  });

  it("Given die kleinen Mulden, Then haben sie nur einen runden Verlauf ohne Rand", () => {
    const svg = generateBoardSvg();
    const track = svg.slice(svg.indexOf('id="track-holes"'), svg.indexOf('id="house-holes"'));
    expect(track).toContain('fill="url(#hole-fill)"');
    expect(track).not.toContain("stroke");
    expect(track).toContain(`r="${(geo.fieldRadius * TRACK_HOLE_FACTOR).toFixed(2)}"`);
    expect(svg).toContain('<radialGradient id="hole-fill" cx="0.5" cy="0.5"');
  });

  it("Given die Linien, Then enden sie am grauen Mittelkreis (Ring-Zuschnitt)", () => {
    const svg = generateBoardSvg();
    expect(svg).toContain('id="ring-clip"');
    expect(svg).toContain('inkscape:label="black lines" clip-path="url(#ring-clip)"');
  });

  it("Given die grauen Kreise, Then liegen sie auf der obersten Ebene, ragen nicht in den Mittelkreis und teilen die Farbe der Zählpunkte", () => {
    const svg = generateBoardSvg();
    expect(svg.indexOf('id="flower-circles"')).toBeGreaterThan(svg.indexOf('id="counting-dots"'));
    expect(svg.indexOf('id="flower-circles"')).toBeGreaterThan(svg.indexOf('id="house-holes"'));
    expect(svg).toContain('inkscape:label="grey circles" clip-path="url(#ring-clip)"');
    expect(svg).toContain('id="center-boundary"');
    expect(svg).toContain('stroke="#8a8a8a"');
    expect(svg).toContain('fill="#8a8a8a"');
  });

  it("Given die mittlere Mulde, Then hat sie den Radius 132", () => {
    const svg = generateBoardSvg();
    expect(svg).toContain('r="132" fill="url(#well-fill)"');
  });

  it("Given die Häuser, Then gibt es je einen grauen Ring, einen Weg (silber über schwarz) und einen Punkt am Ende", () => {
    const svg = generateBoardSvg();
    const rings = svg.slice(svg.indexOf('id="house-rings"'), svg.indexOf('id="house-paths"'));
    const paths = svg.slice(svg.indexOf('id="house-paths"'), svg.indexOf('id="center-boundary"'));
    expect(count(rings, "circle")).toBe(4);
    expect(count(paths, "line")).toBe(8);
    expect(count(paths, "circle")).toBe(4);
  });

  it("Given der Weg ins Haus, Then läuft er von der Startmulde zum Hausring (unten: senkrecht nach oben)", () => {
    const { from, to } = housePath(0, geo, 17, 65, 19);
    expect(from.x).toBeCloseTo(to.x, 5);
    expect(from.y).toBeGreaterThan(to.y);
    expect(Math.abs(to.y - houseCenter(0, geo).y)).toBeCloseTo(65, 5);
  });

  it("Given eine Hausmulde auf der Achse (links/rechts), Then endet der Weg kurz vor dieser Mulde", () => {
    const left = housePath(1, geo, 17, 65, 19);
    const entrance = housePositions(1, geo)[0]!;
    expect(left.to.y).toBeCloseTo(entrance.y, 5);
    expect(entrance.x - left.to.x).toBeCloseTo(19 + 4, 5);
  });

  it("Given die drei Gitterrichtungen, Then gibt es 3 × 7 Linien", () => {
    expect(latticeLines(geo)).toHaveLength(21);
  });

  it("Given die Zählpunkte, Then gibt es 32 (jedes 2. Feld)", () => {
    expect(countingDotPositions(geo)).toHaveLength(32);
  });

  it("Given das SVG, Then enthält es 64 Laufmulden und 16 Hausmulden an den Client-Koordinaten", () => {
    const svg = generateBoardSvg();
    const first = circleFieldPosition(0, geo);
    expect(svg).toContain(`cx="${first.x.toFixed(2).replace(/\.?0+$/, "")}"`);
    const track = svg.slice(svg.indexOf('id="track-holes"'), svg.indexOf('id="house-holes"'));
    const house = svg.slice(svg.indexOf('id="house-holes"'), svg.indexOf('id="counting-dots"'));
    expect(count(track, "circle")).toBe(64);
    expect(count(house, "circle")).toBe(16);
  });

  it("Given transparent, Then gibt es kein Hintergrundrechteck", () => {
    expect(generateBoardSvg({ background: null })).not.toContain('id="background"');
    expect(generateBoardSvg()).toContain('id="background"');
  });

  it("Given Zählpunkte aus, Then fehlt die Zählpunkt-Ebene", () => {
    expect(generateBoardSvg({ countingDots: false })).not.toContain("counting-dots");
  });
});
