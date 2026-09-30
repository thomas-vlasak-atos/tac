/** Realistisch gestaltetes TAC-Brett mit freier Drag-&-Drop-Bedienung. */

import type { Ball, BallPosition, DiscardEntry, Player, Seat } from "@tac/shared";
import { BALLS_PER_PLAYER, CIRCLE_FIELD_COUNT, SEATS, cardLabel } from "@tac/shared";
import { useState } from "react";
import { BALL_FILL, BALL_STROKE, COLOR_LABEL } from "./colors.js";
import { CardArtwork } from "../ui/cardArtwork.js";
import boardImage from "../../../../vorlage/Board.png";
import cardBackImage from "../../../../cards/background.png";
import {
  type BoardGeometry,
  circleFieldPosition,
  defaultGeometry,
  housePositions,
  type Point,
  vorfeldBallPosition,
  vorfeldCenter,
} from "./geometry.js";

const COLOR_BY_SEAT_LOCAL = ["blau", "gelb", "gruen", "rot"] as const;

// ===========================================================================
// KALIBRIER-KONSTANTEN für die Platzierung von Kartenanzeige und Nachziehstapel.
// Alle Werte sind FAKTOREN, die mit `geo.size` (Bild-Kantenlänge, i. d. R. 1024)
// multipliziert werden. Dadurch skaliert alles automatisch mit der Brettgröße.
//
// Grundidee (perfekte Geometrie): Die Elemente liegen im FREIEN FELD zwischen
//   (a) dem äußeren Vorfeld-Rahmenkreis (geo.vorfeldOuterRadius) und
//   (b) der inneren Brett-Rahmenlinie (geo.boardBorderInset vom Bildrand).
// `GAP` ist der GLEICHE Abstand zu BEIDEN Linien (Kartenrand ↔ Linie).
// ===========================================================================

/** Gleicher Abstand zwischen Kartenrand und Vorfeld-Außenkreis bzw. Rahmenlinie. */
const HANDCOUNT_GAP_FACTOR = 0.010;
/** Breite des Kartenanzahl-Rückens (Höhe = Breite × Kartenseitenverhältnis 1.4). */
const HANDCOUNT_WIDTH_FACTOR = 0.062;

/** Gleicher Abstand für den Nachziehstapel (Kartenrand ↔ Vorfeld-Kreis/Rahmen). */
const DRAWPILE_GAP_FACTOR = 0.002;
/** Breite des Nachziehstapels (Höhe = Breite × 1.4). */
const DRAWPILE_WIDTH_FACTOR = 0.070;

/** Kartenseitenverhältnis (Höhe / Breite) für Kartenanzahl und Stapel. */
const CARD_ASPECT = 1.4;

function nearestTarget(point: Point, geo: BoardGeometry): BallPosition {
  let best: { pos: BallPosition; distance: number } | undefined;
  const consider = (pos: BallPosition, target: Point) => {
    const distance = Math.hypot(point.x - target.x, point.y - target.y);
    if (!best || distance < best.distance) best = { pos, distance };
  };
  for (let index = 0; index < CIRCLE_FIELD_COUNT; index++) {
    consider({ kind: "FELD", index }, circleFieldPosition(index, geo));
  }
  for (const seat of SEATS) {
    housePositions(seat, geo).forEach((point, slot) => consider({ kind: "HAUS", owner: seat, slot }, point));
    for (let slot = 0; slot < BALLS_PER_PLAYER; slot++) {
      consider({ kind: "VORFELD", owner: seat }, vorfeldBallPosition(seat, slot, geo));
    }
  }
  return best!.pos;
}

/**
 * Rechteck-Zentrum für ein Element (Kartenanzahl/Stapel), das SEITLICH neben
 * einem Vorfeld liegt und mit GLEICHEM Abstand `gap` an den Vorfeld-Außenkreis
 * (horizontal) und die Brett-Rahmenlinie (vertikal) grenzt.
 *
 * - horizontal: das Element liegt zur Bildmitte hin neben dem Vorfeld; sein dem
 *   Vorfeld zugewandter Rand hat den Abstand `gap` zum Vorfeld-Außenkreis.
 * - vertikal:   sein der nahen Brettkante zugewandter Rand hat den Abstand `gap`
 *   zur inneren Brett-Rahmenlinie (`geo.boardBorderInset`).
 */
function placeBesideVorfeld(
  vorfeld: Point,
  geo: BoardGeometry,
  w: number,
  h: number,
  gap: number,
): Point {
  const sx = vorfeld.x > geo.center.x ? 1 : -1; // Vorfeld rechts(+)/links(-) im Bild
  const sy = vorfeld.y > geo.center.y ? 1 : -1; // Vorfeld unten(+)/oben(-) im Bild
  // Horizontal: Kartenrand grenzt (mit gap) an den Vorfeld-Außenkreis; die Karte
  // liegt auf der der Bildmitte zugewandten Seite (also entgegen sx).
  const x = vorfeld.x - sx * (geo.vorfeldOuterRadius + gap + w / 2);
  // Vertikal: der der nahen Brettkante zugewandte Rand grenzt (mit gap) an die
  // innere Rahmenlinie.
  const lineY = sy > 0 ? geo.size - geo.boardBorderInset : geo.boardBorderInset;
  const y = lineY - sy * (gap + h / 2);
  return { x, y };
}

/**
 * Wie `placeBesideVorfeld`, aber das Element liegt VERTIKAL (über/unter) neben
 * dem Vorfeld – zur Bildmitte hin. Der dem Vorfeld zugewandte Rand grenzt mit
 * `gap` an den Vorfeld-Außenkreis; der der nahen seitlichen Brettkante zugewandte
 * Rand grenzt mit `gap` an die innere Rahmenlinie.
 */
function placeAboveBelowVorfeld(
  vorfeld: Point,
  geo: BoardGeometry,
  w: number,
  h: number,
  gap: number,
): Point {
  const sx = vorfeld.x > geo.center.x ? 1 : -1;
  const sy = vorfeld.y > geo.center.y ? 1 : -1;
  // Vertikal: zur Bildmitte hin (entgegen sy), Rand mit gap zum Vorfeld-Kreis.
  const y = vorfeld.y - sy * (geo.vorfeldOuterRadius + gap + h / 2);
  // Horizontal: der nahen seitlichen Rahmenlinie zugewandter Rand mit gap.
  const lineX = sx > 0 ? geo.size - geo.boardBorderInset : geo.boardBorderInset;
  const x = lineX - sx * (gap + w / 2);
  return { x, y };
}


export interface BoardProps {
  balls: Ball[];
  players?: (Player | null)[];
  handCounts?: number[];
  dealer?: Seat;
  /** Sitz, bei dem der Reststapel liegt, oder null = Brettmitte. */
  deckHolder?: Seat | null;
  /** Anzahl Karten im Reststapel (für die Stapelhöhe). */
  deckCount?: number;
  /** Ob der Stapel „geben" auslösen kann (klickbar). */
  deckActive?: boolean;
  /** Ob der (leere) Stapel gemischt werden muss/kann, bevor gegeben wird. */
  deckShuffleable?: boolean;
  /** Klick auf den aktiven Reststapel (geben). */
  onDeal?: () => void;
  /** Klick auf den leeren Stapel (mischen). */
  onShuffle?: () => void;
  /** Klick auf den Kartenrücken des linken Nachbarn (Teufel-Anfrage). */
  onRequestDevil?: (target: Seat) => void;
  lastBallMove?: { ballId: string; from: BallPosition; to: BallPosition } | null;
  showFieldNumbers?: boolean;
  discardEntries?: DiscardEntry[];
  onMoveBall: (ballId: string, to: BallPosition) => void;
  onReturnCard?: (cardId: string) => void;
  ownSeat: Seat | null;
}

interface DragState { ballId: string; current: Point; moved: boolean; from: BallPosition }

export function Board({ balls, players = [], handCounts = [], deckHolder = null, deckCount = 0, deckActive = false, deckShuffleable = false, onDeal, onShuffle, onRequestDevil, lastBallMove = null, showFieldNumbers = false, discardEntries = [], onMoveBall, onReturnCard, ownSeat }: BoardProps) {
  const geo = defaultGeometry(1024);
  const [drag, setDrag] = useState<DragState | null>(null);

  // ---------------------------------------------------------------------------
  // Perspektive OHNE Brettdrehung (Index-Mapping):
  // Das Brettbild bleibt fix. Statt zu rotieren, wird jede DATEN-Position auf
  // die passende BILD-Position abgebildet, sodass der eigene Sitz immer an der
  // festen „unteren" Ecke (Sitz 0) erscheint. `off` ist der Sitz-Offset.
  //   visueller Sitz  = (dataSeat - off + 4) % 4
  //   visuelles Feld  = (dataIndex - off*16 + 64) % 64
  // Umkehrung (für Drops, Bild → Daten):
  //   dataSeat  = (visualSeat + off) % 4
  //   dataIndex = (visualIndex + off*16) % 64
  const off = ownSeat ?? 0;
  const visSeat = (dataSeat: Seat): Seat => (((dataSeat - off + 4) % 4) as Seat);
  const dataSeat = (visualSeat: Seat): Seat => (((visualSeat + off) % 4) as Seat);
  const visIndex = (dataIndex: number): number =>
    (dataIndex - off * (CIRCLE_FIELD_COUNT / 4) + CIRCLE_FIELD_COUNT) % CIRCLE_FIELD_COUNT;
  const dataIndex = (visualIndex: number): number =>
    (visualIndex + off * (CIRCLE_FIELD_COUNT / 4)) % CIRCLE_FIELD_COUNT;

  /** DATEN-Position → BILD-Punkt (zum Zeichnen). */
  const dataPosToPoint = (pos: BallPosition, ball?: Ball): Point => {
    if (pos.kind === "FELD") return circleFieldPosition(visIndex(pos.index), geo);
    if (pos.kind === "HAUS") return housePositions(visSeat(pos.owner), geo)[pos.slot] ?? geo.center;
    const slot = ball ? Number(ball.id.split("-")[1] ?? 0) : 0;
    return vorfeldBallPosition(visSeat(pos.owner), slot, geo);
  };

  /** BILD-Punkt → DATEN-Position (für Drops), nächstes Ziel. */
  const pointToDataPos = (point: Point): BallPosition => {
    const visual = nearestTarget(point, geo);
    if (visual.kind === "FELD") return { kind: "FELD", index: dataIndex(visual.index) };
    if (visual.kind === "HAUS") return { kind: "HAUS", owner: dataSeat(visual.owner), slot: visual.slot };
    return { kind: "VORFELD", owner: dataSeat(visual.owner) };
  };

  // Bild-Positionen aller Kugeln (inkl. Fächerung mehrerer Kugeln auf einem Feld).
  const ballPoints = new Map<string, Point>();
  {
    const byField = new Map<number, Ball[]>();
    for (const ball of balls) {
      if (ball.position.kind === "FELD") {
        const g = byField.get(ball.position.index) ?? [];
        g.push(ball);
        byField.set(ball.position.index, g);
      }
    }
    for (const ball of balls) {
      const base = dataPosToPoint(ball.position, ball);
      const group = ball.position.kind === "FELD" ? byField.get(ball.position.index) : undefined;
      if (group && group.length > 1) {
        const idx = group.findIndex((item) => item.id === ball.id);
        const angle = (idx / group.length) * Math.PI * 2;
        const radius = geo.fieldRadius * 0.72;
        ballPoints.set(ball.id, { x: base.x + Math.cos(angle) * radius, y: base.y + Math.sin(angle) * radius });
      } else ballPoints.set(ball.id, base);
    }
  }

  const toSvg = (event: React.PointerEvent, svg: SVGSVGElement): Point => {
    const rect = svg.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * geo.size, y: ((event.clientY - rect.top) / rect.height) * geo.size };
  };
  const handleDown = (event: React.PointerEvent, ball: Ball) => {
    const svg = (event.currentTarget as SVGElement).ownerSVGElement;
    if (!svg) return;
    (event.target as Element).setPointerCapture?.(event.pointerId);
    setDrag({ ballId: ball.id, current: toSvg(event, svg), moved: false, from: ball.position });
  };
  const handleMove = (event: React.PointerEvent) => {
    if (!drag) return;
    setDrag({ ...drag, current: toSvg(event, event.currentTarget as SVGSVGElement), moved: true });
  };
  const handleUp = () => {
    if (drag?.moved) onMoveBall(drag.ballId, pointToDataPos(drag.current));
    setDrag(null);
  };
  const topCards = discardEntries.slice(-7);

  return (
    <div className="board-frame" style={{ background: "#5b321e", borderRadius: 24, padding: 12, boxShadow: "0 16px 35px #2d170d55", border: "8px solid #8c5831", boxSizing: "border-box", maxHeight: "100%", maxWidth: "100%" }}>
      <svg viewBox={`0 0 ${geo.size} ${geo.size}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block", width: "100%", height: "100%", userSelect: "none", touchAction: "none", borderRadius: 16 }} onPointerMove={handleMove} onPointerUp={handleUp}>
        <defs>
          <radialGradient id="well" cx="35%" cy="30%"><stop offset="0" stopColor="#382b24" /><stop offset=".65" stopColor="#0d0d0d" /><stop offset="1" stopColor="#020202" /></radialGradient>
          <radialGradient id="hole" cx="30%" cy="25%"><stop offset="0" stopColor="#ead19a" /><stop offset=".45" stopColor="#9a642d" /><stop offset="1" stopColor="#3f2414" /></radialGradient>
          {SEATS.map((seat) => <radialGradient id={`marble-${seat}`} key={`gradient-${seat}`} cx="30%" cy="25%"><stop offset="0" stopColor="#fff" stopOpacity=".8" /><stop offset=".2" stopColor={BALL_FILL[COLOR_BY_SEAT_LOCAL[seat]]} /><stop offset="1" stopColor={BALL_STROKE[COLOR_BY_SEAT_LOCAL[seat]]} /></radialGradient>)}
          <filter id="shadow"><feDropShadow dx="2" dy="3" stdDeviation="3" floodOpacity=".35" /></filter>
        </defs>
        <g>
          <image href={boardImage} x="0" y="0" width={geo.size} height={geo.size} preserveAspectRatio="none" />
          {/* Laufbahn-Felder: an BILD-Feld `vi` liegt DATEN-Feld `di`. */}
          {Array.from({ length: CIRCLE_FIELD_COUNT }, (_, vi) => { const di = dataIndex(vi); const point = circleFieldPosition(vi, geo); const source = drag?.from.kind === "FELD" && drag.from.index === di; const lastFrom = lastBallMove?.from.kind === "FELD" && lastBallMove.from.index === di; const lastTo = lastBallMove?.to.kind === "FELD" && lastBallMove.to.index === di; return <g key={`field-${vi}`}><circle cx={point.x} cy={point.y} r={geo.fieldRadius * (lastFrom || lastTo ? 1.9 : 1.45)} fill={lastFrom ? "#e7a928" : lastTo ? "#f7e28b" : "transparent"} opacity=".72" /><circle cx={point.x} cy={point.y} r={geo.fieldRadius + (source ? 5 : 0)} fill={source ? "#fff1a8" : "transparent"} stroke={lastFrom || lastTo ? "#fff2b0" : "transparent"} strokeWidth={source ? 5 : lastFrom || lastTo ? 4 : 2} />{showFieldNumbers && <text x={point.x} y={point.y + 4} textAnchor="middle" fill="#4b3a2b" fontSize="9" fontFamily="system-ui" fontWeight="700">{di}</text>}</g>; })}
          {/* Häuser: an BILD-Sitz `vs` liegt DATEN-Sitz `ds`. */}
          {SEATS.map((vs) => { const ds = dataSeat(vs); return <g key={`house-${vs}`}>{housePositions(vs, geo).map((point, slot) => { const source = drag?.from.kind === "HAUS" && drag.from.owner === ds && drag.from.slot === slot; const lastFrom = lastBallMove?.from.kind === "HAUS" && lastBallMove.from.owner === ds && lastBallMove.from.slot === slot; const lastTo = lastBallMove?.to.kind === "HAUS" && lastBallMove.to.owner === ds && lastBallMove.to.slot === slot; return <circle key={`house-${vs}-${slot}`} cx={point.x} cy={point.y} r={geo.fieldRadius + (source ? 5 : lastFrom || lastTo ? 3 : 0)} fill={source ? "#fff1a8" : lastFrom ? "#e7a928" : lastTo ? "#f7e28b" : "transparent"} stroke={lastFrom || lastTo ? "#fff2b0" : "transparent"} strokeWidth={source ? 5 : lastFrom || lastTo ? 4 : 2.5} />; })}</g>; })}
          {/* Vorfelder: an BILD-Sitz `vs` liegt DATEN-Sitz `ds`. */}
          {SEATS.map((vs) => { const ds = dataSeat(vs); return <g key={`vorfeld-${vs}`}>{Array.from({ length: BALLS_PER_PLAYER }, (_, slot) => { const point = vorfeldBallPosition(vs, slot, geo); const ballId = `${COLOR_BY_SEAT_LOCAL[ds]}-${slot}`; const source = drag?.ballId === ballId && drag.from.kind === "VORFELD"; const lastFrom = lastBallMove?.ballId === ballId && lastBallMove.from.kind === "VORFELD"; const lastTo = lastBallMove?.ballId === ballId && lastBallMove.to.kind === "VORFELD"; return <circle key={`vorfeld-${vs}-${slot}`} cx={point.x} cy={point.y} r={geo.fieldRadius + (source ? 5 : lastFrom || lastTo ? 3 : 0)} fill={source ? "#fff1a8" : lastFrom ? "#e7a928" : lastTo ? "#f7e28b" : "transparent"} stroke={lastFrom || lastTo ? "#fff2b0" : BALL_STROKE[COLOR_BY_SEAT_LOCAL[ds]]} strokeDasharray={lastFrom || lastTo ? undefined : "5 4"} strokeWidth={source ? 5 : lastFrom || lastTo ? 4 : 2.5} />; })}</g>; })}
          {/* Spielernamen mittig ins Vorfeld; Handkarten-Rücken einheitlich NEBEN
              dem Vorfeld. Da nicht mehr gedreht wird, sind die Positionen für alle
              Betrachter gleich (per Index-Mapping wandern nur die DATEN). */}
          {SEATS.map((vs) => {
            const ds = dataSeat(vs);
            const player = players[ds];
            if (!player) return null;
            const c = vorfeldCenter(vs, geo);
            const isOwn = ds === ownSeat;
            const rawName = player.name.length > 12 ? `${player.name.slice(0, 11)}…` : player.name;
            const count = handCounts[ds];
            // Der linke Nachbar des eigenen Sitzes ist das Teufel-Ziel.
            const isDevilTarget = ownSeat != null && ds === ((ownSeat + 1) % 4) && (count ?? 0) > 0;
            const cw = geo.size * HANDCOUNT_WIDTH_FACTOR;
            const ch = cw * CARD_ASPECT;
            // Kartenanzahl seitlich neben dem Vorfeld, mit gleichem Abstand
            // (HANDCOUNT_GAP) zum Vorfeld-Außenkreis und zur Brett-Rahmenlinie.
            const cardAt = placeBesideVorfeld(c, geo, cw, ch, geo.size * HANDCOUNT_GAP_FACTOR);
            return (
              <g key={`vfname-${vs}`}>
                <text x={c.x} y={c.y + geo.fieldRadius * 0.4} textAnchor="middle" fill="#fff" stroke="#2b1a0e" strokeWidth={3.2} paintOrder="stroke" fontSize={isOwn ? 26 : 22} fontFamily="Georgia, serif" fontWeight={700} opacity={0.96} style={{ pointerEvents: "none" }}>{rawName}</text>
                {count != null && count > 0 && (
                  <g
                    transform={`translate(${cardAt.x} ${cardAt.y})`}
                    style={{ pointerEvents: isDevilTarget ? "auto" : "none", cursor: isDevilTarget ? "pointer" : "default" }}
                    onClick={isDevilTarget ? () => onRequestDevil?.(ds) : undefined}
                  >
                    <rect x={-cw / 2} y={-ch / 2} width={cw} height={ch} rx={6} fill="#3a2416" stroke={isDevilTarget ? "#c96" : "#fff8e7"} strokeWidth={isDevilTarget ? 3 : 2} filter="url(#shadow)" />
                    <clipPath id={`cardclip-${vs}`}><rect x={-cw / 2 + 2} y={-ch / 2 + 2} width={cw - 4} height={ch - 4} rx={5} /></clipPath>
                    <image href={cardBackImage} x={-cw / 2 + 2} y={-ch / 2 + 2} width={cw - 4} height={ch - 4} preserveAspectRatio="xMidYMid slice" clipPath={`url(#cardclip-${vs})`} opacity={0.9} />
                    <text x={0} y={ch * 0.15} textAnchor="middle" fill="#fff" stroke="#2b1a0e" strokeWidth={3} paintOrder="stroke" fontSize={ch * 0.5} fontFamily="Georgia, serif" fontWeight={700}>{count}</text>
                    {isDevilTarget && <title>Teufel: {player.name} um Handeinsicht bitten</title>}
                  </g>
                )}
              </g>
            );
          })}
          {/* Reststapel: in der Mitte (Rundenstart) oder beim Halter, einheitlich
              NEBEN dessen Vorfeld: obere Bildhälfte → darunter, untere → darüber.
              In der Mitte darf JEDER klicken (wer zuerst klickt, wird Geber),
              sonst nur der Halter. Leerer Stapel zeigt „MISCHEN", sonst „GEBEN". */}
          {(() => {
            const isDealerViewer = deckHolder == null || (ownSeat != null && ownSeat === deckHolder);
            const canDeal = deckActive && isDealerViewer && ownSeat != null && !!onDeal;
            const canShuffle = deckShuffleable && isDealerViewer && ownSeat != null && !!onShuffle;
            const clickable = canDeal || canShuffle;
            const onClick = canShuffle ? () => onShuffle?.() : canDeal ? () => onDeal?.() : undefined;
            const actionLabel = canShuffle ? "MISCHEN" : canDeal ? "GEBEN" : null;
            const dw = geo.size * DRAWPILE_WIDTH_FACTOR;
            const dh = dw * CARD_ASPECT;
            let anchor: Point;
            if (deckHolder == null) {
              anchor = { x: geo.center.x, y: geo.center.y };
            } else {
              const c = vorfeldCenter(visSeat(deckHolder), geo);
              // Stapel über/unter dem Vorfeld im freien Feld, gleicher Abstand
              // (DRAWPILE_GAP) zum Vorfeld-Außenkreis und zur Brett-Rahmenlinie.
              anchor = placeAboveBelowVorfeld(c, geo, dw, dh, geo.size * DRAWPILE_GAP_FACTOR);
            }
            const isEmpty = (deckCount || 0) <= 0;
            const layers = isEmpty ? 1 : Math.min(5, Math.max(2, Math.ceil((deckCount || 0) / 24)));
            const topX = anchor.x - dw / 2 + (layers - 1) * 2 + 3;
            const topY = anchor.y - dh / 2 - (layers - 1) * 2 + 3;
            return (
              <g style={{ pointerEvents: clickable ? "all" : "none", cursor: clickable ? "pointer" : "default" }} onClick={onClick}>
                {clickable && <rect x={anchor.x - dw / 2 - 4} y={anchor.y - dh / 2 - 4} width={dw + 8} height={dh + 8} rx={10} fill="#000" opacity={0} style={{ pointerEvents: "all" }} />}
                {Array.from({ length: layers }, (_, i) => (
                  <rect key={`deck-layer-${i}`} x={anchor.x - dw / 2 + i * 2} y={anchor.y - dh / 2 - i * 2} width={dw} height={dh} rx={8}
                    fill={isEmpty ? "none" : "#3a2416"}
                    stroke={clickable ? "#ffe08a" : "#e9d3ad"} strokeWidth={clickable ? 3 : 1.5}
                    strokeDasharray={isEmpty ? "8 6" : undefined}
                    filter={!isEmpty && i === layers - 1 ? "url(#shadow)" : undefined} opacity={isEmpty ? 0.85 : 0.96} />
                ))}
                {!isEmpty && (
                  <>
                    <clipPath id="deckclip"><rect x={topX} y={topY} width={dw - 6} height={dh - 6} rx={6} /></clipPath>
                    <image href={cardBackImage} x={topX} y={topY} width={dw - 6} height={dh - 6} preserveAspectRatio="xMidYMid slice" clipPath="url(#deckclip)" opacity={0.92} />
                    <text x={anchor.x + (layers - 1)} y={anchor.y - (layers - 1) - dh * 0.16} textAnchor="middle" fill="#fff" stroke="#2b1a0e" strokeWidth={3} paintOrder="stroke" fontSize={dh * 0.3} fontFamily="Georgia, serif" fontWeight={700}>{deckCount}</text>
                  </>
                )}
                {actionLabel && <text x={anchor.x} y={anchor.y + (isEmpty ? dh * 0.06 : dh * 0.3)} textAnchor="middle" fill="#ffe08a" stroke="#2b1a0e" strokeWidth={2.6} paintOrder="stroke" fontSize={dh * 0.16} fontFamily="system-ui" fontWeight={700}>{actionLabel}</text>}
                <title>Reststapel: {deckCount} Karten{canShuffle ? " – leer, klicken zum Mischen" : canDeal ? " – klicken zum Geben" : ""}</title>
              </g>
            );
          })()}
          {topCards.map((entry) => <g key={entry.card.id} transform={`translate(${geo.center.x + entry.offset * 5} ${geo.center.y + entry.offset * 4}) rotate(${entry.rotation} 0 0)`}><rect x={-35} y={-48} width={70} height={96} rx={8} fill="#fffaf0" stroke={BALL_STROKE[COLOR_BY_SEAT_LOCAL[entry.actor]]} strokeWidth="4" filter="url(#shadow)" /><foreignObject x={-31} y={-43} width={62} height={72}><CardArtwork card={entry.card} compact /></foreignObject><text x="0" y="38" textAnchor="middle" fill={BALL_STROKE[COLOR_BY_SEAT_LOCAL[entry.actor]]} fontSize="9">{COLOR_LABEL[COLOR_BY_SEAT_LOCAL[entry.actor]]}</text><title>{cardLabel(entry.card)} von {COLOR_LABEL[COLOR_BY_SEAT_LOCAL[entry.actor]]}. Zum Zurücknehmen unten nutzen.</title></g>)}
          {balls.map((ball) => { const isDragged = drag?.ballId === ball.id; const point = isDragged && drag.moved ? drag.current : ballPoints.get(ball.id) ?? geo.center; return <g key={ball.id} onPointerDown={(event) => handleDown(event, ball)} style={{ cursor: "grab" }}><circle cx={point.x} cy={point.y} r={geo.fieldRadius * 1.03} fill={`url(#marble-${ball.owner})`} stroke={isDragged ? "#fff7cf" : BALL_STROKE[ball.color]} strokeWidth={isDragged ? 5 : 2.5} filter="url(#shadow)" /><circle cx={point.x - 5} cy={point.y - 6} r={geo.fieldRadius * .2} fill="#fff" opacity=".7" /></g>; })}
        </g>
      </svg>
      {topCards.length > 0 && onReturnCard && <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap", marginTop: 8 }}><span style={{ color: "#f5d3a0", fontSize: 12 }}>Ablage:</span>{topCards.map((entry) => <button key={`return-${entry.card.id}`} type="button" onClick={() => onReturnCard(entry.card.id)} style={{ background: "#f8e5c4", border: 0, borderRadius: 5, color: "#5b321e", padding: "3px 7px", cursor: "pointer" }}>↩ {cardLabel(entry.card)}</button>)}</div>}
    </div>
  );
}
