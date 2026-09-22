/** Hochwertige Spielkarten mit klarer Bedienung. */

import { type Card, cardLabel } from "@tac/shared";
import { CardArtwork } from "./cardArtwork.js";

export interface HandProps {
  cards: Card[];
}

function cardTone(card: Card): { ink: string; accent: string } {
  if (card.kind === "number") return { ink: "#4c2a1a", accent: "#c88b4a" };
  if (card.kind === "tac") return { ink: "#233d5b", accent: "#5d91b8" };
  if (card.kind === "trickster") return { ink: "#5c284b", accent: "#b56d9b" };
  return { ink: "#4c2a1a", accent: "#d6a44b" };
}

export function Hand({ cards }: HandProps) {
  if (cards.length === 0) return <p style={{ color: "#765234" }}>Keine Handkarten. „Geben“ drücken.</p>;
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
      {cards.map((card) => {
        const tone = cardTone(card);
        const label = cardLabel(card);
        return (
          <article key={card.id} draggable onDragStart={(event) => event.dataTransfer.setData("text/tac-card", card.id)} style={{ width: 94, minHeight: 138, padding: 8, borderRadius: 10, border: `3px solid ${tone.accent}`, background: "linear-gradient(145deg, #fffdf7, #f2dfbd)", boxShadow: "0 5px 10px #4c2a1a30", color: tone.ink, display: "flex", flexDirection: "column", justifyContent: "space-between", cursor: "grab" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700 }}><span>{label}</span><span>♠</span></div>
            <CardArtwork card={card} />
            <div style={{ textAlign: "center", fontSize: 10, color: tone.ink, opacity: 0.75 }}>ziehen</div>
          </article>
        );
      })}
    </div>
  );
}
