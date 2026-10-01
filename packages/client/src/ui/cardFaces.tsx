/**
 * Als SVG nachgebaute Kartenvorderseiten (verlustfrei skalierbar).
 *
 * Bezug: REQ-DESIGN D11/D12. Koordinatensystem 600 x 1000, identisch zu den
 * ursprünglichen Kartenvorlagen (Seitenverhältnis 3:5).
 * Priorität bei der Darstellung: SVG > PNG > Text-Fallback (siehe cardArtwork.tsx).
 */

import { useId, type ReactNode } from "react";
import type { Card } from "@tac/shared";

const RED = "#ec3d2a";
const BLACK = "#151515";
const NAVY = "#12204b";
const LINE = "#7d7d7d";
const BAR = "#b4b4b4";
const EDGE = "#9aa7ad";

// Raster der Kartenfläche (aus der Vorlage ausgemessen).
const X = [52, 178, 302, 427, 550] as const;
const Y = [65, 283, 499, 716, 932] as const;

/** Karte mit Rautenraster, Rahmen und mittleren Balken – gemeinsame Basis aller Karten. */
function CardBase({ children }: { children: ReactNode }) {
  const [x0, x1, x2, x3, x4] = X;
  const [y0, y1, y2, y3, y4] = Y;
  return (
    <>
      <rect x={18} y={32} width={564} height={936} rx={55} fill="#fff" stroke="#e1e1e1" strokeWidth={2} />
      <g fill="none" stroke={LINE} strokeWidth={1.6}>
        <rect x={x0} y={y0} width={x4 - x0} height={y4 - y0} />
        {/* senkrechte und waagerechte Rasterlinien */}
        <path d={`M${x1} ${y0}V${y4} M${x2} ${y0}V${y4} M${x3} ${y0}V${y4}`} />
        <path d={`M${x0} ${y1}H${x4} M${x0} ${y2}H${x4} M${x0} ${y3}H${x4}`} />
        {/* Eckdiagonalen und große Raute */}
        <path d={`M${x0} ${y0}L${x1} ${y1} M${x4} ${y0}L${x3} ${y1} M${x0} ${y4}L${x1} ${y3} M${x4} ${y4}L${x3} ${y3}`} />
        <path d={`M${x2} ${y0}L${x1} ${y1}L${x0} ${y2}L${x1} ${y3}L${x2} ${y4}L${x3} ${y3}L${x4} ${y2}L${x3} ${y1}Z`} />
        {/* Mittelfeld: Diagonalen und innere Raute */}
        <path d={`M${x1} ${y1}L${x3} ${y3} M${x3} ${y1}L${x1} ${y3}`} />
        <path d={`M${x2} ${y1}L${x1} ${y2}L${x2} ${y3}L${x3} ${y2}Z`} />
      </g>
      {/* kräftigere graue Balken oben/unten des Mittelfelds */}
      <path d={`M${x1} ${y1}H${x3} M${x1} ${y3}H${x3}`} stroke={BAR} strokeWidth={5} fill="none" />
      {children}
    </>
  );
}

/** Segmentierte, eckige Ziffern (Box 24 x 44, Mittelpunkt im Ursprung). */
const SEG = {
  a: "M-12 -22H12",
  b: "M12 -22V0",
  c: "M12 0V22",
  d: "M-12 22H12",
  e: "M-12 0V22",
  f: "M-12 -22V0",
  g: "M-12 0H12",
} as const;

const DIGITS: Record<string, string> = {
  "0": "abcdef",
  "2": "abged",
  "3": "abgcd",
  "4": "fgbc",
  "5": "afgcd",
  "6": "afgedc",
  "7": "abc",
  "8": "abcdefg",
  "9": "abcdfg",
};

function digitPath(ch: string): string {
  if (ch === "1") return "M-9 -14L3 -22V22M-9 22H15";
  return [...(DIGITS[ch] ?? "")].map((k) => SEG[k as keyof typeof SEG]).join("");
}

/** Eckziffer(n), um (x, y) zentriert; unten kopfstehend (flip). */
function CornerNumber({ text, x, y, flip = false, color }: { text: string; x: number; y: number; flip?: boolean; color: string }) {
  const step = 40;
  const width = (text.length - 1) * step;
  return (
    <g transform={`translate(${x} ${y})${flip ? " rotate(180)" : ""}`} fill="none" stroke={color} strokeWidth={8} strokeLinecap="square" strokeLinejoin="miter">
      {[...text].map((ch, i) => (
        <path key={i} transform={`translate(${i * step - width / 2} 0)`} d={digitPath(ch)} />
      ))}
    </g>
  );
}

/** Alle vier Ecken: oben links/rechts, unten kopfstehend. Mehrstellige Zahlen werden nach innen verschoben. */
function Corners({ text, color }: { text: string; color: string }) {
  const shift = text.length > 1 ? 18 : 0;
  return (
    <>
      <CornerNumber text={text} x={87 + shift} y={137} color={color} />
      <CornerNumber text={text} x={523 - shift} y={137} color={color} />
      <CornerNumber text={text} x={87 + shift} y={863} flip color={color} />
      <CornerNumber text={text} x={523 - shift} y={863} flip color={color} />
    </>
  );
}

/** Roter Punkt mit grau-blauem Ring. */
function Dot({ x, y }: { x: number; y: number }) {
  return <circle cx={x} cy={y} r={11} fill={RED} stroke={EDGE} strokeWidth={4} />;
}

/** Rotes Dreieck mit grau-blauem Rand. */
function Tri({ points, color = RED }: { points: string; color?: string }) {
  return <polygon points={points} fill={color} stroke={EDGE} strokeWidth={5} strokeLinejoin="miter" />;
}

/** Sechszählige Blume (zwei graue, blau, rot, grün, schwarz); Normalgröße: Blattlänge 124. */
function Flower({ x = 302, y = 499, scale = 1, mirror = false }: { x?: number; y?: number; scale?: number; mirror?: boolean }) {
  // SVG-Winkel zählen im Uhrzeigersinn (0 = rechts, 60 = unten rechts). Farben so, dass
  // blau oben links, rot oben rechts, grün unten links, schwarz unten rechts liegt.
  const petals: Array<[number, string]> = [
    [180, "#8b929c"],
    [0, "#8b929c"],
    [240, "#1d4fa6"],
    [300, "#d9261c"],
    [120, "#4a8f2f"],
    [60, "#111111"],
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${mirror ? -scale : scale} ${scale})`}>
      {petals.map(([angle, color]) => (
        <path key={angle} transform={`rotate(${angle})`} d="M0 0Q62 -34 124 0Q62 34 0 0Z" fill={color} />
      ))}
    </g>
  );
}

const BLACK_NUMBERS_WITH_FLOWER = new Set([2, 3, 5, 6, 8, 9, 10, 12]);

const DOTS_7: Array<[number, number]> = [
  [240, 390], [362, 390], [178, 499], [302, 499], [427, 499], [240, 608], [362, 608],
];

const DOTS_13: Array<[number, number]> = [
  [205, 337], [267, 337], [173, 392], [235, 392], [205, 445], [267, 445], [175, 499],
  [205, 552], [267, 552], [175, 607], [237, 607], [205, 660], [267, 660],
];

function RedNumber({ value }: { value: number }) {
  const [x1, , x3] = [X[1], X[2], X[3]];
  const [, y1, , y3] = Y;
  return (
    <CardBase>
      <Corners text={String(value)} color={RED} />
      {value === 1 && (
        <>
          <Tri points={`${x1},${y1} ${x1},${y3} 297,499`} />
          <Dot x={363} y={499} />
        </>
      )}
      {value === 4 && (
        <>
          <Tri points="240,395 240,603 298,497" />
          <Tri points="300,395 300,603 358,497" />
        </>
      )}
      {value === 7 && DOTS_7.map(([x, y]) => <Dot key={`${x}-${y}`} x={x} y={y} />)}
      {value === 13 && (
        <>
          <Tri points={`${x3},${y1} ${x3},${y3} 297,499`} />
          <path d="M205 337L235 392L267 445M267 337L235 392L205 445M205 552L237 607L267 660M267 552L237 607L205 660" fill="none" stroke={LINE} strokeWidth={1.6} />
          {DOTS_13.map(([x, y]) => <Dot key={`${x}-${y}`} x={x} y={y} />)}
        </>
      )}
    </CardBase>
  );
}

function BlackNumber({ value }: { value: number }) {
  return (
    <CardBase>
      <Corners text={String(value)} color={BLACK} />
      <Flower />
    </CardBase>
  );
}

function Diamond({ cx, cy, w, h }: { cx: number; cy: number; w: number; h: number }) {
  return <polygon points={`${cx},${cy - h} ${cx + w},${cy} ${cx},${cy + h} ${cx - w},${cy}`} fill={RED} stroke={EDGE} strokeWidth={5} strokeLinejoin="miter" />;
}

function Trickster() {
  const label = (
    <text x={302} y={258} textAnchor="middle" fontSize={54} fontWeight={700} fontFamily="Arial, Helvetica, sans-serif" textLength={236} lengthAdjust="spacingAndGlyphs" fill={BLACK}>
      TRICKSER
    </text>
  );
  const corner = (cx: number, cy: number) => (
    <>
      <Diamond cx={cx - 12} cy={cy} w={12} h={22} />
      <Diamond cx={cx + 12} cy={cy} w={12} h={22} />
    </>
  );
  return (
    <CardBase>
      {corner(88, 132)}
      {corner(512, 132)}
      {corner(88, 868)}
      {corner(512, 868)}
      {label}
      <g transform="rotate(180 302 500)">{label}</g>
      <Diamond cx={240} cy={499} w={63} h={109} />
      <Diamond cx={364} cy={499} w={63} h={109} />
    </CardBase>
  );
}


/** Zeichnet ein um den Ursprung zentriertes Eckzeichen in alle vier Ecken (unten kopfstehend). */
function CornerMark({ children }: { children: ReactNode }) {
  return (
    <>
      <g transform="translate(87 136)">{children}</g>
      <g transform="translate(513 136)">{children}</g>
      <g transform="translate(87 864) rotate(180)">{children}</g>
      <g transform="translate(513 864) rotate(180)">{children}</g>
    </>
  );
}

/** Beschriftung oben und (um 180 Grad gedreht) unten im Mittelfeldrand. */
function Caption({ text, width, color = NAVY }: { text: string; width: number; color?: string }) {
  const label = (
    <text x={302} y={254} textAnchor="middle" fontSize={40} fontWeight={700} fontFamily="Arial, Helvetica, sans-serif" textLength={width} lengthAdjust="spacingAndGlyphs" fill={color}>
      {text}
    </text>
  );
  return (
    <>
      {label}
      <g transform="rotate(180 302 500)">{label}</g>
    </>
  );
}

function Angel() {
  return (
    <CardBase>
      <CornerMark>
        <polygon points="-15,-24 15,-24 0,0" fill={NAVY} />
        <polygon points="-15,24 15,24 0,0" fill={NAVY} />
      </CornerMark>
      <Caption text="ENGEL" width={124} />
      <Tri color={NAVY} points="178,283 178,716 300,499" />
      <Tri color={NAVY} points="427,283 427,716 304,499" />
    </CardBase>
  );
}

function Warrior() {
  return (
    <CardBase>
      <CornerMark>
        <path d="M-16 -24L16 24M16 -24L-16 24" stroke={NAVY} strokeWidth={7} fill="none" />
      </CornerMark>
      <Caption text="KRIEGER" width={164} />
      <path d="M178 283L427 716M427 283L178 716" stroke={NAVY} strokeWidth={5} fill="none" />
    </CardBase>
  );
}

function Fool() {
  return (
    <CardBase>
      <CornerMark>
        <rect x={-15} y={-24} width={30} height={48} fill={NAVY} />
        <polygon points="0,-14 8,0 0,14 -8,0" fill="#fff" />
      </CornerMark>
      <Caption text="NARR" width={92} />
      <Tri color={NAVY} points="178,283 298,283 178,495" />
      <Tri color={NAVY} points="306,283 427,283 427,495" />
      <Tri color={NAVY} points="178,503 298,716 178,716" />
      <Tri color={NAVY} points="427,503 427,716 306,716" />
    </CardBase>
  );
}

/** Eckiges „TAC"-Wortzeichen aus Strichen (Höhe 100, Strichstärke 15). */
function TacWord() {
  return (
    <g fill="none" stroke="#000" strokeWidth={15} strokeLinejoin="miter" strokeMiterlimit={3}>
      <path d="M-120 -42H-50M-85 -42V50" />
      <path d="M-32 50L0 -50L32 50M-17 15H17" />
      <path d="M118 -42H50V42H118" />
    </g>
  );
}

function TacCard() {
  return (
    <CardBase>
      <Flower x={87} y={140} scale={0.23} />
      <Flower x={513} y={140} scale={0.23} mirror />
      <g transform="translate(87 860) rotate(180)"><Flower x={0} y={0} scale={0.23} mirror /></g>
      <g transform="translate(513 860) rotate(180)"><Flower x={0} y={0} scale={0.23} /></g>
      <g transform="translate(302 499)">
        <g transform="rotate(-23) scale(1.15) translate(0 -66)"><TacWord /></g>
        <g transform="rotate(157) scale(1.15) translate(0 -66)"><TacWord /></g>
      </g>
    </CardBase>
  );
}

function Devil() {
  return (
    <CardBase>
      <CornerMark>
        <polygon points="0,-26 14,0 0,26 -14,0" fill={NAVY} />
      </CornerMark>
      <Caption text="TEUFEL" width={137} />
      <Tri color={NAVY} points="302,283 427,499 302,716 178,499" />
    </CardBase>
  );
}

/**
 * Kartenrücken: dunkle Fläche mit „Blume des Lebens"-Linienmuster (Kreise im
 * Sechsecksraster) und weißer sechsblättriger Blume im Zentrum.
 */
export function CardBackFace() {
  const uid = useId().replace(/:/g, "");
  const r = 99.3;
  const rowHeight = (r * Math.sqrt(3)) / 2;
  const circles: Array<[number, number]> = [];
  for (let row = -8; row <= 8; row++) {
    for (let col = -8; col <= 8; col++) {
      const cx = 300 + col * r + (row % 2 === 0 ? 0 : r / 2);
      const cy = 500 + row * rowHeight;
      if (cx > -r && cx < 600 + r && cy > -r && cy < 1000 + r) circles.push([cx, cy]);
    }
  }
  const tip = r * Math.sqrt(3);
  const lens = `M0 0Q${tip / 2} -62 ${tip} 0Q${tip / 2} 62 0 0Z`;
  return (
    <>
      <rect x={18} y={32} width={564} height={936} rx={55} fill="#fff" stroke="#e1e1e1" strokeWidth={2} />
      <clipPath id={`back-${uid}`}>
        <rect x={40} y={54} width={520} height={892} rx={35} />
      </clipPath>
      <rect x={40} y={54} width={520} height={892} rx={35} fill="#141414" />
      <g clipPath={`url(#back-${uid})`} fill="none" stroke="#a9a9a9" strokeWidth={1.2}>
        {circles.map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
        ))}
      </g>
      <g transform="translate(300 500)" fill="#fff">
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <path key={angle} transform={`rotate(${angle})`} d={lens} />
        ))}
      </g>
    </>
  );
}

/** Liefert den SVG-Inhalt der Karte oder `null`, wenn (noch) keine SVG-Variante existiert. */
export function cardSvgContent(card: Card): ReactNode | null {
  if (card.kind === "trickster") return <Trickster />;
  if (card.kind === "tac") return <TacCard />;
  if (card.kind === "engel") return <Angel />;
  if (card.kind === "krieger") return <Warrior />;
  if (card.kind === "narr") return <Fool />;
  if (card.kind === "teufel") return <Devil />;
  if (card.kind === "number") {
    if ([1, 4, 7, 13].includes(card.value)) return <RedNumber value={card.value} />;
    if (BLACK_NUMBERS_WITH_FLOWER.has(card.value)) return <BlackNumber value={card.value} />;
  }
  return null;
}
