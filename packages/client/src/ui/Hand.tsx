/**
 * Handkarten-Leiste: zeigt die eigenen Karten und erlaubt Ablegen/Tauschen.
 *
 * Bezug: REQ-BOARD K3 (eigene Hand), K4 (ablegen), K5 (tauschen).
 */

import { type Card, cardLabel } from "@tac/shared";

export interface HandProps {
  cards: Card[];
  onPlay: (cardId: string) => void;
  onSwap: (cardId: string) => void;
}

export function Hand({ cards, onPlay, onSwap }: HandProps) {
  if (cards.length === 0) {
    return <p style={{ color: "#64748b" }}>Keine Handkarten. „Geben" drücken.</p>;
  }
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {cards.map((card) => (
        <div
          key={card.id}
          style={{
            border: "1px solid #cbd5e1",
            borderRadius: 8,
            padding: "8px 10px",
            minWidth: 56,
            textAlign: "center",
            background: "#ffffff",
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 18 }}>{cardLabel(card)}</div>
          <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
            <button type="button" onClick={() => onPlay(card.id)}>
              legen
            </button>
            <button type="button" onClick={() => onSwap(card.id)}>
              tauschen
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
