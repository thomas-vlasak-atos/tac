/**
 * Farbzuordnung für die Darstellung.
 *
 * Bezug: REQ-BOARD (eigenständig gestaltete Grafik). Zunächst schlichte,
 * klar unterscheidbare Farben (Feinschliff später).
 */

import type { Color } from "@tac/shared";

/** Füllfarbe (Hex) je Spielfarbe. */
export const BALL_FILL: Record<Color, string> = {
  blau: "#2563eb",
  gelb: "#eab308",
  gruen: "#16a34a",
  rot: "#dc2626",
};

/** Etwas dunklere Randfarbe je Spielfarbe. */
export const BALL_STROKE: Record<Color, string> = {
  blau: "#1e3a8a",
  gelb: "#a16207",
  gruen: "#166534",
  rot: "#991b1b",
};

/** Menschlich lesbarer Name der Farbe (für UI-Texte). */
export const COLOR_LABEL: Record<Color, string> = {
  blau: "Blau",
  gelb: "Gelb",
  gruen: "Grün",
  rot: "Rot",
};
