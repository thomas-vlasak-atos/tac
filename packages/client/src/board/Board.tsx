/**
 * Brett-Komponente: rendert Felder, Häuser, Vorfelder und Kugeln als SVG.
 *
 * Bedienung per Drag & Drop (REQ-BOARD B3):
 * - Kugel greifen und auf ein beliebiges Feld ziehen.
 * - Beim Loslassen rastet die Kugel auf das nächstgelegene Feld ein.
 * - Liegen mehrere Kugeln auf demselben Feld, werden sie leicht gefächert
 *   gezeichnet, damit jede einzeln greifbar bleibt (kein Werfen ins Vorfeld).
 *
 * Leere Plätze (Vorfeld/Haus/Startfelder) werden sichtbar gezeichnet (B7).
 */

import type { Ball, BallPosition, Seat } from "@tac/shared";
import { BALLS_PER_PLAYER, CIRCLE_FIELD_COUNT, SEATS } from "@tac/shared";
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

const COLOR_BY_SEAT_LOCAL = ["blau", "gelb", "gruen", "rot"] as const;

/** Basis-Bildschirmposition eines Feldes (ohne Fächerung). */
function fieldBasePosition(pos: BallPosition, ball: Ball, geo: BoardGeometry): Point {
  switch (pos.kind) {
    case "FELD":
      return circleFieldPosition(pos.index, geo);
    case "HAUS":
      return housePositions(pos.owner, geo)[pos.slot] ?? geo.center;
    case "VORFELD": {
      const slot = Number(ball.id.split("-")[1] ?? 0);
      return vorfeldBallPosition(pos.owner, slot, geo);
    }
  }
}

/** Prüft, ob zwei Positionen dasselbe Feld meinen. */
function samePosition(a: BallPosition, b: BallPosition): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "FELD" && b.kind === "FELD") return a.index === b.index;
  if (a.kind === "HAUS" && b.kind === "HAUS")
    return a.owner === b.owner && a.slot === b.slot;
  if (a.kind === "VORFELD" && b.kind === "VORFELD") return a.owner === b.owner;
  return false;
}

/**
 * Berechnet Bildschirmpositionen aller Kugeln inkl. Fächerung, wenn mehrere
 * Kugeln auf demselben FELD liegen (Vorfeld ist bereits pro Slot verteilt).
 */
function computeBallPositions(
  balls: Ball[],
  geo: BoardGeometry,
): Map<string, Point> {
  const out = new Map<string, Point>();

  // Kugeln je Kreisfeld gruppieren (nur FELD-Positionen fächern wir).
  const byField = new Map<number, Ball[]>();
  for (const ball of balls) {
    if (ball.position.kind === "FELD") {
      const arr = byField.get(ball.position.index) ?? [];
      arr.push(ball);
      byField.set(ball.position.index, arr);
    }
  }

  for (const ball of balls) {
    const base = fieldBasePosition(ball.position, ball, geo);
    if (ball.position.kind === "FELD") {
      const group = byField.get(ball.position.index)!;
      if (group.length > 1) {
        const idx = group.findIndex((b) => b.id === ball.id);
        // Kleiner Kreis-Fächer um die Feldmitte.
        const angle = (idx / group.length) * 2 * Math.PI;
        const r = geo.fieldRadius * 0.7;
        out.set(ball.id, {
          x: base.x + r * Math.cos(angle),
          y: base.y + r * Math.sin(angle),
        });
        continue;
      }
    }
    out.set(ball.id, base);
  }
  return out;
}

/** Findet die nächstgelegene Ziel-Spielposition zu einem SVG-Punkt. */
function nearestTarget(point: Point, geo: BoardGeometry): BallPosition {
  let best: { pos: BallPosition; dist: number } | null = null;
  const consider = (pos: BallPosition, p: Point) => {
    const d = Math.hypot(point.x - p.x, point.y - p.y);
    if (!best || d < best.dist) best = { pos, dist: d };
  };

  for (let i = 0; i < CIRCLE_FIELD_COUNT; i++) {
    consider({ kind: "FELD", index: i }, circleFieldPosition(i, geo));
  }
  for (const seat of SEATS) {
    housePositions(seat, geo).forEach((p, slot) =>
      consider({ kind: "HAUS", owner: seat, slot }, p),
    );
    for (let s = 0; s < BALLS_PER_PLAYER; s++) {
      consider({ kind: "VORFELD", owner: seat }, vorfeldBallPosition(seat, s, geo));
    }
  }
  return best!.pos;
}

export interface BoardProps {
  balls: Ball[];
  onMoveBall: (ballId: string, to: BallPosition) => void;
  ownSeat: Seat | null;
  size?: number;
}

interface DragState {
  ballId: string;
  current: Point;
  moved: boolean;
}

export function Board({ balls, onMoveBall, size = 700 }: BoardProps) {
  const geo = defaultGeometry(1000);
  const [drag, setDrag] = useState<DragState | null>(null);

  const positions = computeBallPositions(balls, geo);

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
    setDrag({ ballId: ball.id, current: toSvg(e, svg), moved: false });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const svg = e.currentTarget as SVGSVGElement;
    setDrag({ ...drag, current: toSvg(e, svg), moved: true });
  };

  const handlePointerUp = () => {
    if (!drag) return;
    if (drag.moved) {
      onMoveBall(drag.ballId, nearestTarget(drag.current, geo));
    }
    setDrag(null);
  };

  return (
    <svg
      viewBox={`0 0 ${geo.size} ${geo.size}`}
      width={size}
      height={size}
      style={{ userSelect: "none", maxWidth: "100%", touchAction: "none" }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Kartenablage-Mulde in der Mitte */}
      <circle
        cx={geo.center.x}
        cy={geo.center.y}
        r={geo.circleRadius * 0.42}
        fill="#f1f5f9"
        stroke="#cbd5e1"
        strokeWidth={2}
      />

      {/* Kreisfelder */}
      {Array.from({ length: CIRCLE_FIELD_COUNT }, (_, i) => {
        const p = circleFieldPosition(i, geo);
        const startSeat = SEATS.find((s) => startIndexForSeat(s) === i);
        const isStart = startSeat !== undefined;
        return (
          <circle
            key={`f-${i}`}
            cx={p.x}
            cy={p.y}
            r={geo.fieldRadius}
            fill={isStart ? "#e2e8f0" : "#ffffff"}
            stroke={isStart ? BALL_STROKE[COLOR_BY_SEAT_LOCAL[startSeat!]] : "#cbd5e1"}
            strokeWidth={isStart ? 4 : 1.5}
          />
        );
      })}

      {/* Häuser: 4 leere Plätze je Spieler */}
      {SEATS.map((seat) => (
        <g key={`house-${seat}`}>
          {housePositions(seat, geo).map((p, slot) => (
            <circle
              key={`h-${seat}-${slot}`}
              cx={p.x}
              cy={p.y}
              r={geo.fieldRadius}
              fill="#fef9c3"
              stroke={BALL_STROKE[COLOR_BY_SEAT_LOCAL[seat]]}
              strokeWidth={2}
            />
          ))}
        </g>
      ))}

      {/* Vorfelder: 4 leere Plätze je Spieler */}
      {SEATS.map((seat) => (
        <g key={`vorfeld-${seat}`}>
          {Array.from({ length: BALLS_PER_PLAYER }, (_, slot) => {
            const p = vorfeldBallPosition(seat, slot, geo);
            return (
              <circle
                key={`v-${seat}-${slot}`}
                cx={p.x}
                cy={p.y}
                r={geo.fieldRadius}
                fill="#f8fafc"
                stroke={BALL_STROKE[COLOR_BY_SEAT_LOCAL[seat]]}
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
            );
          })}
        </g>
      ))}

      {/* Kugeln (Drag & Drop) */}
      {balls.map((ball) => {
        const isDragged = drag?.ballId === ball.id;
        const p =
          isDragged && drag!.moved
            ? drag!.current
            : (positions.get(ball.id) ?? geo.center);
        return (
          <circle
            key={ball.id}
            cx={p.x}
            cy={p.y}
            r={geo.fieldRadius * 0.95}
            fill={BALL_FILL[ball.color]}
            stroke={isDragged ? "#0f172a" : BALL_STROKE[ball.color]}
            strokeWidth={isDragged ? 4 : 2.5}
            style={{ cursor: "grab" }}
            onPointerDown={(e) => handlePointerDown(e, ball)}
          />
        );
      })}
    </svg>
  );
}

// Wird aktuell nicht extern benötigt, bleibt aber als Helfer erhalten.
export { samePosition };
