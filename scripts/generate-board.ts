/**
 * Schreibt das berechnete Brettbild nach vorlage/:
 *   board_generated.svg              mit Hintergrundfarbe (Vorschau)
 *   board_generated_transparent.svg  ohne Hintergrund (z. B. über einem Holz-PNG)
 *
 * Aufruf:  npm run generate:board
 */

import { writeFileSync } from "node:fs";
import { generateBoardSvg } from "../packages/client/src/board/boardSvg.ts";

const files: Array<[string, string]> = [
  ["board_generated.svg", generateBoardSvg()],
  ["board_generated_transparent.svg", generateBoardSvg({ background: null })],
];
for (const [name, svg] of files) {
  writeFileSync(new URL(`../vorlage/${name}`, import.meta.url), svg);
  console.log(`geschrieben: vorlage/${name}`);
}
