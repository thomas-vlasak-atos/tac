/** Sammelt die Brett-Bilder (Vite): Holztexturen, die beiden Brett-Ebenen und das klassische Board.png. */

import classicPng from "../../../../vorlage/Board.png";
import brightOverlay from "../../../../vorlage/board_generated_transparent.svg";
import darkOverlay from "../../../../vorlage/board_generated_dark_transparent.svg";
import { CLASSIC_BACKGROUND_ID, buildBackgroundOptions, resolveBackgroundId } from "./backgrounds.js";

const files = import.meta.glob("../../../../vorlage/background/*.{png,jpg,jpeg}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

export const BACKGROUND_OPTIONS = buildBackgroundOptions(files);

/** Ebenen des Bretts: unten die Holztextur (null = keine), darüber das Brettbild. */
export interface BoardLayers {
  textureUrl: string | null;
  overlayUrl: string;
}

export function boardLayers(id: string): BoardLayers {
  const resolved = resolveBackgroundId(id, BACKGROUND_OPTIONS);
  if (resolved === CLASSIC_BACKGROUND_ID) return { textureUrl: null, overlayUrl: classicPng };
  const option = BACKGROUND_OPTIONS.find((o) => o.id === resolved)!;
  return { textureUrl: option.url, overlayUrl: option.tone === "dark" ? darkOverlay : brightOverlay };
}
