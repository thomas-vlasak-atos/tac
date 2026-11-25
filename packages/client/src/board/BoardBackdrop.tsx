/** Hintergrund des Bretts: Holztextur (falls gewählt) und darüber das Brettbild. */

import { useEffect, useState } from "react";
import type { BoardLayers } from "./boardAssets.js";

/** Natürliche Größe eines Bildes (null, bis es geladen ist). */
function useImageSize(url: string | null): { width: number; height: number } | null {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  useEffect(() => {
    setSize(null);
    if (!url) return;
    const image = new Image();
    image.onload = () => setSize({ width: image.naturalWidth, height: image.naturalHeight });
    image.src = url;
  }, [url]);
  return size;
}

export function BoardBackdrop({ layers, size }: { layers: BoardLayers; size: number }) {
  const natural = useImageSize(layers.textureUrl);
  const { textureUrl, overlayUrl } = layers;
  // Nicht quadratische Texturen (z. B. 1024×512) werden gekachelt statt gestreckt.
  const tiled = natural != null && natural.width !== natural.height;
  const tileHeight = natural ? (size * natural.height) / natural.width : size;
  return (
    <>
      {textureUrl && tiled && (
        <>
          <defs>
            <pattern id="board-wood" patternUnits="userSpaceOnUse" width={size} height={tileHeight}>
              <image href={textureUrl} x="0" y="0" width={size} height={tileHeight} preserveAspectRatio="none" />
            </pattern>
          </defs>
          <rect x="0" y="0" width={size} height={size} fill="url(#board-wood)" />
        </>
      )}
      {textureUrl && !tiled && <image href={textureUrl} x="0" y="0" width={size} height={size} preserveAspectRatio="xMidYMid slice" />}
      <image href={overlayUrl} x="0" y="0" width={size} height={size} preserveAspectRatio="none" />
    </>
  );
}
