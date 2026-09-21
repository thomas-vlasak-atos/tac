/**
 * Brett-Komponente: rendert Felder, Häuser, Vorfelder und Kugeln als SVG.
 * Kugeln sind per Drag & Drop frei bewegbar (REQ-BOARD B3), mit Herkunfts-Marker
 * (B4a). Das Werfen erledigt der Server (B4/B4b).
 */

import type { Ball, BallPosition, Seat } from "@tac/shared";
import { CIRCLE_FIELD_COUNT, SEATS } from "@tac/shared";
import { useState } from "react";
import { BALL_FILL, BALL_STROKE } from "./colors.js";
import {
  type BoardGeometry,
  circleFieldPosition,
  defaultGeometry,
  housePositions,
  type Point,
  startIndexForSeat,
  vorfeldBallPosition,
} from "./geometry.js";

/** Ermittelt die Bildschirmposition einer Kugel anhand ihrer Spielposition. */
function ballScreenPosition(ball: Ball, geo: BoardGeometry): Point {
  const pos = ball.position;
  switch (pos.kind) {
    case "FELD":
      return circleFieldPosition(pos.index, geo);
    case "HAUS":
      return housePositions(pos.owner, geo)[pos.slot] ?? geo.center;
    case "VORFELD": {
      // Kugel-Slot aus der ID ableiten (z. B. "blau-2" -> 2).
      const slot = Number(ball.id.split("-")[1] ?? 0);
      return vorfeldBallPosition(pos.owner, slot, geo);
    }
  }
}

/** Findet die nächstgelegene Ziel-Spielposition zu einem SVG-Punkt. */
function nearestTarget(
  point: Point,
  geo: BoardGeometry,
): { pos: BallPosition; dist: number } {
  let best: { pos: BallPosition; dist: number } | null = null;
  const consider = (pos: BallPosition, p: Point) => {
    const d = Math.hypot(point.x - p.x, point.y - p.y);
    if (!best || d < best.dist) best = { pos, dist: d };
  };

  for (let i = 0; i < CIRCLE_FIELD_COUNT; i++) {
    consider({ kind: "FELD", index: i }, circleFieldPosition(i, geo));
  }
  for (const seat of SEATS) {
    const house = housePositions(seat, geo);
    house.forEach((p, slot) => consider({ kind: "HAUS", owner: seat, slot }, p));
    for (let s = 0; s < 4; s++) {
      consider({ kind: "VORFELD", owner: seat }, vorfeldBallPosition(seat, s, geo));
    }
  }
  return best!;
}

export interface BoardProps {
  balls: Ball[];
  /** Callback, wenn eine Kugel auf ein Ziel gezogen wurde. */
  onMoveBall: (ballId: string, to: BallPosition) => void;
  /** Eigener Sitzplatz (für spätere Hervorhebung; aktuell nur Info). */
  ownSeat: Seat | null;
  size?: number;
}

/** Zustand während eines Drag-Vorgangs. */
interface DragState {
  ballId: string;
  origin: Point;
  current: Point;
}

export function Board({ balls, onMoveBall, size = 700 }: BoardProps) {
  const geo = defaultGeometry(1000);
  const [drag, setDrag] = useState<DragState | null>(null);

  /** Rechnet Client-Koordinaten in SVG-Koordinaten um. */
  const toSvg = (e: React.PointerEvent, svg: SVGSVGElement): Point => {
    const rect = svg.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * geo.size,
      y: ((e.clientY - rect.top) / rect.height) * geo.size,
    };
  };

  const handlePointerDown = (e: React.PointerEvent, ball: Ball) => {
    const svg = (e.currentTarget as SVGElement).ownerSVGElement;
    if (!svg) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const p = toSvg(e, svg);
    setDrag({ ballId: ball.id, origin: ballScreenPosition(ball, geo), current: p });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const svg = e.currentTarget as SVGSVGElement;
    setDrag({ ...drag, current: toSvg(e, svg) });
  };

  const handlePointerUp = () => {
    if (!drag) return;
    const { pos } = nearestTarget(drag.current, geo);
    onMoveBall(drag.ballId, pos);
    setDrag(null);
  };

  return (
    <svg
      viewBox={`0 0 ${geo.size} ${geo.size}`}
      width={size}
      height={size}
      style={{ touchAction: "none", userSelect: "none", maxWidth: "100%" }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Kartenablage-Mulde in der Mitte */}
      <circle
        cx={geo.center.x}
        cy={geo.center.y}
        r={geo.circleRadius * 0.4}
        fill="#f1f5f9"
        stroke="#cbd5e1"
        strokeWidth={2}
      />

      {/* Kreisfelder */}
      {Array.from({ length: CIRCLE_FIELD_COUNT }, (_, i) => {
        const p = circleFieldPosition(i, geo);
        const isStart = SEATS.some((s) => startIndexForSeat(s) === i);
        return (
          <circle
            key={`f-${i}`}
            cx={p.x}
            cy={p.y}
            r={geo.fieldRadius}
            fill={isStart ? "#e2e8f0" : "#ffffff"}
            stroke={isStart ? "#475569" : "#cbd5e1"}
            strokeWidth={isStart ? 3 : 1.5}
          />
        );
      })}

      {/* Häuser + Vorfeld-Umrisse je Spieler */}
      {SEATS.map((seat) => (
        <g key={`house-${seat}`}>
          {housePositions(seat, geo).map((p, slot) => (
            <circle
              key={`h-${seat}-${slot}`}
              cx={p.x}
              cy={p.y}
              r={geo.fieldRadius}
              fill="#fef9c3"
              stroke={BALL_STROKE[["blau", "gelb", "gruen", "rot"][seat] as never]}
              strokeWidth={2}
              opacity={0.9}
            />
          ))}
        </g>
      ))}

      {/* Herkunfts-Marker (B4a) während des Ziehens */}
      {drag && (
        <circle
          cx={drag.origin.x}
          cy={drag.origin.y}
          r={geo.fieldRadius * 1.4}
          fill="none"
          stroke="#0f172a"
          strokeDasharray="6 4"
          strokeWidth={2}
        />
      )}

      {/* Kugeln */}
      {balls.map((ball) => {
        const isDragged = drag?.ballId === ball.id;
        const p = isDragged ? drag!.current : ballScreenPosition(ball, geo);
        return (
          <circle
            key={ball.id}
            cx={p.x}
            cy={p.y}
            r={geo.fieldRadius * 1.15}
            fill={BALL_FILL[ball.color]}
            stroke={BALL_STROKE[ball.color]}
            strokeWidth={2.5}
            style={{ cursor: "grab" }}
            onPointerDown={(e) => handlePointerDown(e, ball)}
          />
        );
      })}
    </svg>
  );
}
