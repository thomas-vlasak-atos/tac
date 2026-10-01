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

export function Hand({ cards, compact = false, onPlayCard, actionHint, disabled = false }: HandProps) {
  if (cards.length === 0) return <p style={{ color: "#765234" }}>Keine Handkarten. „Geben“ drücken.</p>;
  return (
    <div className={`hand-cards${compact ? " hand-cards-compact" : ""}`} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
      {cards.map((card) => {
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
            title={`${label} – ${disabled ? "nicht möglich" : (actionHint ?? "spielen")}`}
            style={{
              width: compact ? undefined : 94,
              flex: "0 0 auto",
              filter: "drop-shadow(0 4px 6px #4c2a1a55)",
              transition: "transform .12s",
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.55 : 1,
            }}
          >
            <CardArtwork card={card} />
          </article>
        );
      })}
    </div>
  );
}
