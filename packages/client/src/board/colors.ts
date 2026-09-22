/**
 * Farbzuordnung für die Darstellung.
 *
 * Bezug: REQ-BOARD (eigenständig gestaltete Grafik). Zunächst schlichte,
 * klar unterscheidbare Farben (Feinschliff später).
 */

import type { Color } from "@tac/shared";

/** Füllfarbe (Hex) je Spielfarbe. */
export const BALL_FILL: Record<Color, string> = {
  blau: "#2f6fba",
  gelb: "#e4ad2f",
  gruen: "#3e9a68",
  rot: "#bd4a45",
};

/** Etwas dunklere Randfarbe je Spielfarbe. */
export const BALL_STROKE: Record<Color, string> = {
  blau: "#173f70",
  gelb: "#875f12",
  gruen: "#1f6040",
  rot: "#762b2b",
};

/** Menschlich lesbarer Name der Farbe (für UI-Texte). */
export const COLOR_LABEL: Record<Color, string> = {
  blau: "Blau",
  gelb: "Gelb",
  gruen: "Grün",
  rot: "Rot",
};
