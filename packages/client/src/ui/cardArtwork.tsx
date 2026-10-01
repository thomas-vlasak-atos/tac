import type { Card } from "@tac/shared";
import { cardSvgContent } from "./cardFaces.js";

/** Seitenverhältnis (Breite : Höhe) aller Karten. */
const CARD_ASPECT = "3 / 5";

interface CardArtworkProps {
  card: Card;
}

/**
 * Zeigt die komplette Karte (nichts abgeschnitten) und füllt die Breite des
 * Eltern-Elements; die Höhe ergibt sich aus dem Seitenverhältnis.
 * Alle Karten sind als SVG nachgebaut (`cardFaces.tsx`); der schlichte
 * Text-Fallback greift nur für unbekannte Kartenarten.
 */
export function CardArtwork({ card }: CardArtworkProps) {
  const label = card.kind === "number" ? String(card.value) : card.kind.toUpperCase();
  const svg = cardSvgContent(card);

  if (svg) {
    return (
      <svg
        role="img"
        aria-label={label}
        viewBox="0 0 600 1000"
        style={{ display: "block", width: "100%", aspectRatio: CARD_ASPECT }}
      >
        {svg}
      </svg>
    );
  }

  return (
    <div
      role="img"
      aria-label={label}
      style={{
        width: "100%",
        aspectRatio: CARD_ASPECT,
        display: "grid",
        placeItems: "center",
        boxSizing: "border-box",
        background: "#fff",
        border: "2px solid #c9c9c9",
        borderRadius: "9%/5.4%",
        color: card.kind === "number" ? "#e5382b" : "#1b2a4a",
        fontFamily: "Georgia, serif",
        fontSize: "clamp(14px, 4cqw, 32px)",
        fontWeight: 700,
      }}
    >
      {label}
    </div>
  );
}
