import type { Card } from "@tac/shared";
import card13 from "../../../../cards/1-13.png";
import card4 from "../../../../cards/4.png";
import cardBack from "../../../../cards/background.png";
import cardAngel from "../../../../cards/engel.png";
import cardWarrior from "../../../../cards/krieger.png";
import cardFool from "../../../../cards/narr.png";
import cardTac from "../../../../cards/tactac.png";

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
  if (card.kind === "teufel") return { src: cardBack };
  return null;
}

interface CardArtworkProps {
  card: Card;
  compact?: boolean;
}

/** Bildkarte mit robustem Text-Fallback für noch nicht gelieferte Designs. */
export function CardArtwork({ card, compact = false }: CardArtworkProps) {
  const artwork = cardArtwork(card);
  const label = card.kind === "number" ? String(card.value) : card.kind.toUpperCase();
  const height = compact ? 72 : 100;

  if (!artwork) {
    return (
      <div style={{ height, display: "grid", placeItems: "center", color: "#4c2a1a", fontFamily: "Georgia, serif", fontSize: compact ? 20 : 32, fontWeight: 700 }}>
        {label}
      </div>
    );
  }

  const isSprite = artwork.sprite != null;
  return (
    <div style={{ height, overflow: "hidden", position: "relative", borderRadius: 6 }}>
      <img
        src={artwork.src}
        alt={label}
        style={{
          display: "block",
          height: "100%",
          width: isSprite ? "200%" : "100%",
          maxWidth: "none",
          objectFit: "cover",
          objectPosition: "center",
          transform: artwork.sprite === "right" ? "translateX(-50%)" : undefined,
        }}
      />
    </div>
  );
}
