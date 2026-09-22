/** Realistisch gestaltetes TAC-Brett mit freier Drag-&-Drop-Bedienung. */

import type { Ball, BallPosition, DiscardEntry, Seat } from "@tac/shared";
import { BALLS_PER_PLAYER, CIRCLE_FIELD_COUNT, SEATS, cardLabel } from "@tac/shared";
import { useState } from "react";
import { BALL_FILL, BALL_STROKE, COLOR_LABEL } from "./colors.js";
import { CardArtwork } from "../ui/cardArtwork.js";
import boardImage from "../../../../vorlage/Board.png";
import {
  type BoardGeometry,
  circleFieldPosition,
  defaultGeometry,
  housePositions,
  type Point,
  vorfeldBallPosition,
} from "./geometry.js";

const COLOR_BY_SEAT_LOCAL = ["blau", "gelb", "gruen", "rot"] as const;

function fieldBasePosition(pos: BallPosition, ball: Ball, geo: BoardGeometry): Point {
  if (pos.kind === "FELD") return circleFieldPosition(pos.index, geo);
  if (pos.kind === "HAUS") return housePositions(pos.owner, geo)[pos.slot] ?? geo.center;
  const slot = Number(ball.id.split("-")[1] ?? 0);
  return vorfeldBallPosition(pos.owner, slot, geo);
}

function computeBallPositions(balls: Ball[], geo: BoardGeometry): Map<string, Point> {
  const out = new Map<string, Point>();
  const byField = new Map<number, Ball[]>();
  for (const ball of balls) {
    if (ball.position.kind === "FELD") {
      const group = byField.get(ball.position.index) ?? [];
      group.push(ball);
      byField.set(ball.position.index, group);
    }
  }
  for (const ball of balls) {
    const base = fieldBasePosition(ball.position, ball, geo);
    const group = ball.position.kind === "FELD" ? byField.get(ball.position.index) : undefined;
    if (group && group.length > 1) {
      const index = group.findIndex((item) => item.id === ball.id);
      const angle = (index / group.length) * Math.PI * 2;
      const radius = geo.fieldRadius * 0.72;
      out.set(ball.id, { x: base.x + Math.cos(angle) * radius, y: base.y + Math.sin(angle) * radius });
    } else out.set(ball.id, base);
  }
  return out;
}

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

export interface BoardProps {
  balls: Ball[];
  lastBallMove?: { ballId: string; from: BallPosition; to: BallPosition } | null;
  showFieldNumbers?: boolean;
  discardEntries?: DiscardEntry[];
  onMoveBall: (ballId: string, to: BallPosition) => void;
  onReturnCard?: (cardId: string) => void;
  ownSeat: Seat | null;
  size?: number;
}

interface DragState { ballId: string; current: Point; moved: boolean; from: BallPosition }

export function Board({ balls, lastBallMove = null, showFieldNumbers = false, discardEntries = [], onMoveBall, onReturnCard, ownSeat, size = 760 }: BoardProps) {
  const geo = defaultGeometry(1024);
  const [drag, setDrag] = useState<DragState | null>(null);
  const positions = computeBallPositions(balls, geo);
  // Positive SVG rotation moves the player's side to the left. The table view
  // needs the opposite direction so the own side remains at the bottom.
  const rotation = ownSeat == null ? 0 : -ownSeat * 90;
  const rotatePoint = (point: Point, degrees: number): Point => {
    const angle = (degrees * Math.PI) / 180;
    const dx = point.x - geo.center.x;
    const dy = point.y - geo.center.y;
    return {
      x: geo.center.x + dx * Math.cos(angle) - dy * Math.sin(angle),
      y: geo.center.y + dx * Math.sin(angle) + dy * Math.cos(angle),
    };
  };
  const toBoardPoint = (event: React.PointerEvent, svg: SVGSVGElement): Point =>
    rotatePoint(toSvg(event, svg), -rotation);
  const toSvg = (event: React.PointerEvent, svg: SVGSVGElement): Point => {
    const rect = svg.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * geo.size, y: ((event.clientY - rect.top) / rect.height) * geo.size };
  };
  const handleDown = (event: React.PointerEvent, ball: Ball) => {
    const svg = (event.currentTarget as SVGElement).ownerSVGElement;
    if (!svg) return;
    (event.target as Element).setPointerCapture?.(event.pointerId);
    setDrag({ ballId: ball.id, current: toBoardPoint(event, svg), moved: false, from: ball.position });
  };
  const handleMove = (event: React.PointerEvent) => {
    if (!drag) return;
    setDrag({ ...drag, current: toBoardPoint(event, event.currentTarget as SVGSVGElement), moved: true });
  };
  const handleUp = () => {
    if (drag?.moved) onMoveBall(drag.ballId, nearestTarget(drag.current, geo));
    setDrag(null);
  };
  const topCards = discardEntries.slice(-7);

  return (
    <div style={{ background: "#5b321e", borderRadius: 24, padding: 12, boxShadow: "0 16px 35px #2d170d55", border: "8px solid #8c5831" }}>
      <svg viewBox={`0 0 ${geo.size} ${geo.size}`} width={size} height={size} style={{ display: "block", width: "100%", height: "auto", userSelect: "none", touchAction: "none", borderRadius: 16 }} onPointerMove={handleMove} onPointerUp={handleUp}>
        <defs>
          <radialGradient id="well" cx="35%" cy="30%"><stop offset="0" stopColor="#382b24" /><stop offset=".65" stopColor="#0d0d0d" /><stop offset="1" stopColor="#020202" /></radialGradient>
          <radialGradient id="hole" cx="30%" cy="25%"><stop offset="0" stopColor="#ead19a" /><stop offset=".45" stopColor="#9a642d" /><stop offset="1" stopColor="#3f2414" /></radialGradient>
          {SEATS.map((seat) => <radialGradient id={`marble-${seat}`} key={`gradient-${seat}`} cx="30%" cy="25%"><stop offset="0" stopColor="#fff" stopOpacity=".8" /><stop offset=".2" stopColor={BALL_FILL[COLOR_BY_SEAT_LOCAL[seat]]} /><stop offset="1" stopColor={BALL_STROKE[COLOR_BY_SEAT_LOCAL[seat]]} /></radialGradient>)}
          <filter id="shadow"><feDropShadow dx="2" dy="3" stdDeviation="3" floodOpacity=".35" /></filter>
        </defs>
        <g transform={`rotate(${rotation} ${geo.center.x} ${geo.center.y})`}>
          <image href={boardImage} x="0" y="0" width={geo.size} height={geo.size} preserveAspectRatio="none" />
          {Array.from({ length: CIRCLE_FIELD_COUNT }, (_, index) => { const point = circleFieldPosition(index, geo); const source = drag?.from.kind === "FELD" && drag.from.index === index; const lastFrom = lastBallMove?.from.kind === "FELD" && lastBallMove.from.index === index; const lastTo = lastBallMove?.to.kind === "FELD" && lastBallMove.to.index === index; return <g key={`field-${index}`}><circle cx={point.x} cy={point.y} r={geo.fieldRadius * (lastFrom || lastTo ? 1.9 : 1.45)} fill={lastFrom ? "#e7a928" : lastTo ? "#f7e28b" : "transparent"} opacity=".72" /><circle cx={point.x} cy={point.y} r={geo.fieldRadius + (source ? 5 : 0)} fill={source ? "#fff1a8" : "transparent"} stroke={lastFrom || lastTo ? "#fff2b0" : "transparent"} strokeWidth={source ? 5 : lastFrom || lastTo ? 4 : 2} />{showFieldNumbers && <text x={point.x} y={point.y + 4} textAnchor="middle" fill="#4b3a2b" fontSize="9" fontFamily="system-ui" fontWeight="700">{index}</text>}</g>; })}
          {SEATS.map((seat) => <g key={`house-${seat}`}>{housePositions(seat, geo).map((point, slot) => { const source = drag?.from.kind === "HAUS" && drag.from.owner === seat && drag.from.slot === slot; const lastFrom = lastBallMove?.from.kind === "HAUS" && lastBallMove.from.owner === seat && lastBallMove.from.slot === slot; const lastTo = lastBallMove?.to.kind === "HAUS" && lastBallMove.to.owner === seat && lastBallMove.to.slot === slot; return <circle key={`house-${seat}-${slot}`} cx={point.x} cy={point.y} r={geo.fieldRadius + (source ? 5 : lastFrom || lastTo ? 3 : 0)} fill={source ? "#fff1a8" : lastFrom ? "#e7a928" : lastTo ? "#f7e28b" : "transparent"} stroke={lastFrom || lastTo ? "#fff2b0" : "transparent"} strokeWidth={source ? 5 : lastFrom || lastTo ? 4 : 2.5} />; })}</g>)}
          {SEATS.map((seat) => { const well = vorfeldBallPosition(seat, 0, geo); const center = { x: well.x, y: well.y }; const lastFrom = lastBallMove?.from.kind === "VORFELD" && lastBallMove.from.owner === seat; const lastTo = lastBallMove?.to.kind === "VORFELD" && lastBallMove.to.owner === seat; return <g key={`vorfeld-${seat}`}><circle cx={center.x} cy={center.y} r={geo.fieldRadius * 4.8} fill={lastFrom ? "#e7a928" : lastTo ? "#f7e28b" : "transparent"} opacity=".8" />{Array.from({ length: BALLS_PER_PLAYER }, (_, slot) => { const point = vorfeldBallPosition(seat, slot, geo); const source = drag?.from.kind === "VORFELD" && drag.from.owner === seat; return <circle key={`vorfeld-${seat}-${slot}`} cx={point.x} cy={point.y} r={geo.fieldRadius + (source ? 5 : 0)} fill={source ? "#fff1a8" : "transparent"} stroke={BALL_STROKE[COLOR_BY_SEAT_LOCAL[seat]]} strokeDasharray="5 4" strokeWidth={source ? 5 : 2.5} />; })}</g>; })}
          {topCards.map((entry) => <g key={entry.card.id} transform={`translate(${geo.center.x + entry.offset * 5} ${geo.center.y + entry.offset * 4}) rotate(${entry.rotation} 0 0)`}><rect x={-35} y={-48} width={70} height={96} rx={8} fill="#fffaf0" stroke={BALL_STROKE[COLOR_BY_SEAT_LOCAL[entry.actor]]} strokeWidth="4" filter="url(#shadow)" /><foreignObject x={-31} y={-43} width={62} height={72}><CardArtwork card={entry.card} compact /></foreignObject><text x="0" y="38" textAnchor="middle" fill={BALL_STROKE[COLOR_BY_SEAT_LOCAL[entry.actor]]} fontSize="9">{COLOR_LABEL[COLOR_BY_SEAT_LOCAL[entry.actor]]}</text><title>{cardLabel(entry.card)} von {COLOR_LABEL[COLOR_BY_SEAT_LOCAL[entry.actor]]}. Zum Zurücknehmen unten nutzen.</title></g>)}
          {balls.map((ball) => { const isDragged = drag?.ballId === ball.id; const point = isDragged && drag.moved ? drag.current : positions.get(ball.id) ?? geo.center; return <g key={ball.id} onPointerDown={(event) => handleDown(event, ball)} style={{ cursor: "grab" }}><circle cx={point.x} cy={point.y} r={geo.fieldRadius * 1.03} fill={`url(#marble-${ball.owner})`} stroke={isDragged ? "#fff7cf" : BALL_STROKE[ball.color]} strokeWidth={isDragged ? 5 : 2.5} filter="url(#shadow)" /><circle cx={point.x - 5} cy={point.y - 6} r={geo.fieldRadius * .2} fill="#fff" opacity=".7" /></g>; })}
        </g>
      </svg>
      {topCards.length > 0 && onReturnCard && <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap", marginTop: 8 }}><span style={{ color: "#f5d3a0", fontSize: 12 }}>Ablage:</span>{topCards.map((entry) => <button key={`return-${entry.card.id}`} type="button" onClick={() => onReturnCard(entry.card.id)} style={{ background: "#f8e5c4", border: 0, borderRadius: 5, color: "#5b321e", padding: "3px 7px", cursor: "pointer" }}>↩ {cardLabel(entry.card)}</button>)}</div>}
    </div>
  );
}
