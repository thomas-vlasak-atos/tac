/**
 * Schreibt das berechnete Brettbild nach vorlage/:
 *   board_generated.svg                   mit Hintergrundfarbe (Vorschau)
 *   board_generated_transparent.svg       ohne Hintergrund, Silbergrau (für helles Holz)
 *   board_generated_dark_transparent.svg  ohne Hintergrund, Gold (für dunkles Holz)
 *
 * Aufruf:  npm run generate:board
 */

import { writeFileSync } from "node:fs";
import { DARK_BOARD_COLORS, generateBoardSvg } from "../packages/client/src/board/boardSvg.ts";

const files: Array<[string, string]> = [
  ["board_generated.svg", generateBoardSvg()],
  ["board_generated_transparent.svg", generateBoardSvg({ background: null })],
  ["board_generated_dark_transparent.svg", generateBoardSvg({ background: null, colors: DARK_BOARD_COLORS })],
];
for (const [name, svg] of files) {
  writeFileSync(new URL(`../vorlage/${name}`, import.meta.url), svg);
  console.log(`geschrieben: vorlage/${name}`);
}
