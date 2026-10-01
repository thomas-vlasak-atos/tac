import type { Card } from "@tac/shared";
import card13 from "../../../../cards/1-13.png";
import card4 from "../../../../cards/4.png";
import cardAngel from "../../../../cards/engel.png";
import cardWarrior from "../../../../cards/krieger.png";
import cardFool from "../../../../cards/narr.png";
import cardTac from "../../../../cards/tactac.png";
import { cardSvgContent } from "./cardFaces.js";

/** Seitenverhältnis (Breite : Höhe) aller Kartenbilder. */
export const CARD_ASPECT = "3 / 5";

/** Liefert das vorhandene Nutzerdesign für einen Kartentyp, falls vorhanden. */
export function cardArtwork(card: Card): { src: string; sprite?: "left" | "right" } | null {
  if (card.kind === "number" && (card.value === 1 || card.value === 13)) {
    return { src: card13, sprite: card.value === 1 ? "left" : "right" };
  }
  if (card.kind === "number" && card.value === 4) return { src: card4 };
  if (card.kind === "tac") return { src: cardTac };
  if (card.kind === "engel") return { src: cardAngel };
  if (card.kind === "krieger") return { src: cardWarrior };
  if (card.kind === "narr") return { src: cardFool };
  return null;
}

interface CardArtworkProps {
  card: Card;
}

/**
 * Zeigt die komplette Karte (volles Bild, nichts abgeschnitten) und füllt die
 * Breite des Eltern-Elements; die Höhe ergibt sich aus dem Seitenverhältnis.
 * Priorität: SVG-Nachbau > PNG-Vorlage > schlichter Text-Fallback (gleiches Format).
 */
export function CardArtwork({ card }: CardArtworkProps) {
  const artwork = cardArtwork(card);
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

  if (!artwork) {
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

  const sprite = artwork.sprite;
  return (
    <div
      role="img"
      aria-label={label}
      style={{
        width: "100%",
        aspectRatio: CARD_ASPECT,
        backgroundImage: `url(${artwork.src})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: sprite ? "200% 100%" : "100% 100%",
        backgroundPosition: sprite === "right" ? "100% 0" : "0 0",
      }}
    />
  );
}
