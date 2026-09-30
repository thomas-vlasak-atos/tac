/** Hochwertige Spielkarten mit Klick-Auswahl. */

import { type Card, cardLabel } from "@tac/shared";
import { CardArtwork } from "./cardArtwork.js";

export interface HandProps {
  cards: Card[];
  compact?: boolean;
  /**
   * Ein Klick auf eine Karte löst direkt die phasenabhängige Aktion aus
   * (Tauschphase: Karte dem Partner anbieten; Spielphase: Karte ablegen).
   * Die aufrufende Komponente entscheidet anhand der Phase, was passiert.
   */
  onPlayCard?: (cardId: string) => void;
  /**
   * Kurzer Hinweistext, welche Aktion ein Klick auslöst (z. B. „ablegen" oder
   * „an Partner geben"). Wird als Fußzeile je Karte angezeigt.
   */
  actionHint?: string;
  /** Deaktiviert das Anklicken (z. B. wenn in dieser Phase keine Aktion möglich ist). */
  disabled?: boolean;
}

function cardTone(card: Card): { ink: string; accent: string } {
  if (card.kind === "number") return { ink: "#4c2a1a", accent: "#c88b4a" };
  if (card.kind === "tac") return { ink: "#233d5b", accent: "#5d91b8" };
  if (card.kind === "trickster") return { ink: "#5c284b", accent: "#b56d9b" };
  return { ink: "#4c2a1a", accent: "#d6a44b" };
}

export function Hand({ cards, compact = false, onPlayCard, actionHint, disabled = false }: HandProps) {
  if (cards.length === 0) return <p style={{ color: "#765234" }}>Keine Handkarten. „Geben“ drücken.</p>;
  return (
    <div className={`hand-cards${compact ? " hand-cards-compact" : ""}`} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
      {cards.map((card) => {
        const tone = cardTone(card);
        const label = cardLabel(card);
        const activate = () => {
          if (!disabled) onPlayCard?.(card.id);
        };
        return (
          <article
            className={compact ? "hand-card-compact" : undefined}
            key={card.id}
            onClick={activate}
            role="button"
            tabIndex={0}
            aria-disabled={disabled}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                activate();
              }
            }}
            style={{
              width: 94,
              minHeight: 138,
              padding: 8,
              borderRadius: 10,
              border: `3px solid ${tone.accent}`,
              background: "linear-gradient(145deg, #fffdf7, #f2dfbd)",
              boxShadow: "0 5px 10px #4c2a1a30",
              transition: "transform .12s, box-shadow .12s",
              color: tone.ink,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.6 : 1,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700 }}><span>{label}</span><span>♠</span></div>
            <CardArtwork card={card} />
            <div style={{ textAlign: "center", fontSize: 10, color: tone.ink, opacity: 0.75 }}>{disabled ? "—" : (actionHint ?? "spielen")}</div>
          </article>
        );
      })}
    </div>
  );
}
