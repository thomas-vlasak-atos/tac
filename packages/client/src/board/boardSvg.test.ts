import { describe, expect, it } from "vitest";
import { circleFieldPosition, defaultGeometry, houseCenter, housePositions } from "./geometry.js";
import { countingDotPositions, generateBoardSvg, latticeCenters, axisTick, houseWay, latticeLines, outerLatticeCenters, TRACK_HOLE_FACTOR } from "./boardSvg.js";

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

  it("Given die Häuser, Then gibt es je einen offenen grauen Ring, einen Weg und zwei Punkte", () => {
    const svg = generateBoardSvg();
    const rings = svg.slice(svg.indexOf('id="house-rings"'), svg.indexOf('id="house-paths"'));
    const paths = svg.slice(svg.indexOf('id="house-paths"'), svg.indexOf('id="house-dots"'));
    const dots = svg.slice(svg.indexOf('id="house-dots"'), svg.indexOf('id="center-boundary"'));
    expect(count(rings, "path")).toBe(4);
    expect(count(paths, "line")).toBe(4 + 4 + 2); // Achsenstrich + Weg je Haus, plus 2 Stummel (links/rechts)
    expect(count(dots, "circle")).toBe(8);
    expect(paths).not.toContain('stroke="#111111"'); // Weg nur silbern, ohne schwarze Unterlage
  });

  it("Given der Weg ins untere Haus, Then läuft er senkrecht von der Startmulde zum Ring", () => {
    const way = houseWay(0, geo, 17, 60, 19);
    expect(way.path.from.x).toBeCloseTo(way.path.to.x, 5);
    expect(way.path.from.y).toBeGreaterThan(way.path.to.y);
    expect(Math.abs(way.path.to.y - houseCenter(0, geo).y)).toBeCloseTo(60, 5);
    expect(way.stub).toBeNull();
  });

  it("Given eine Hausmulde auf der Achse (links), Then endet der Strich am Muldenrand und ein Stummel führt zum Ring", () => {
    const way = houseWay(1, geo, 17, 60, 19);
    const entrance = housePositions(1, geo)[0]!;
    expect(entrance.x - way.path.to.x).toBeCloseTo(19, 5);
    expect(way.stub!.from.x - entrance.x).toBeCloseTo(19, 5);
    expect(Math.abs(way.stub!.to.x - houseCenter(1, geo).x)).toBeCloseTo(60, 5);
  });

  it("Given der Hausring, Then ist er offen: 270° bei unten/oben, 240° bei links/rechts", () => {
    const deg = (seat: 0 | 1 | 2 | 3) => (houseWay(seat, geo, 17, 60, 19).ring.sweep * 180) / Math.PI;
    expect(deg(0)).toBeCloseTo(270, 3);
    expect(deg(2)).toBeCloseTo(270, 3);
    expect(deg(1)).toBeCloseTo(240, 3);
    expect(deg(3)).toBeCloseTo(240, 3);
  });

  it("Given der Achsenstrich, Then geht er vom Brettrand bis zum Zählpunkt der Startmulde", () => {
    const left = axisTick(1, geo);
    expect(left.from.x).toBeCloseTo(1.3, 5);
    expect(left.to.x).toBeCloseTo(countingDotPositions(geo)[8]!.x, 5);
    expect(left.from.y).toBeCloseTo(left.to.y, 5);
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
