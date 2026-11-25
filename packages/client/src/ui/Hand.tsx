/** Hochwertige Spielkarten mit Klick- und/oder Drag-&-Drop-Bedienung (REQ-FEEDBACK F9). */

import { type Card, cardLabel } from "@tac/shared";
import { useRef, useState } from "react";
import { CardArtwork } from "./cardArtwork.js";
import { masterCardSummary } from "./MasterCardsHelp.js";

/** Name der Drop-Zone, auf der eine Karte losgelassen wurde (Attribut `data-card-drop`). */
export type CardDropZone = string;

/** Mindestweg in Pixeln, ab dem aus einem Klick ein Ziehen wird. */
export const DRAG_THRESHOLD_PX = 6;

export interface HandProps {
  cards: Card[];
  compact?: boolean;
  /**
   * Ein Klick auf eine Karte löst direkt die phasenabhängige Aktion aus
   * (Tauschphase: Karte dem Partner anbieten; Spielphase: Karte ablegen).
   * Die aufrufende Komponente entscheidet anhand der Phase, was passiert.
   */
  onPlayCard?: (cardId: string) => void;
  /** Karte wurde auf eine Drop-Zone (`data-card-drop`) gezogen. */
  onDropCard?: (cardId: string, zone: CardDropZone) => void;
  /** Meldet Beginn/Ende eines Zieh-Vorgangs (zum Einblenden der Drop-Zonen). */
  onDragChange?: (dragging: boolean) => void;
  /** Klick löst die Aktion aus (Standard: an). */
  allowClick?: boolean;
  /** Ziehen auf eine Drop-Zone möglich (Standard: aus). */
  allowDrag?: boolean;
  /**
   * Kurzer Hinweistext, welche Aktion ein Klick auslöst (z. B. „ablegen" oder
   * „an Partner geben"). Wird als Fußzeile je Karte angezeigt.
   */
  actionHint?: string;
  /** Deaktiviert das Anklicken/Ziehen (z. B. wenn in dieser Phase keine Aktion möglich ist). */
  disabled?: boolean;
}

interface DragState {
  cardId: string;
  card: Card;
  startX: number;
  startY: number;
  x: number;
  y: number;
  active: boolean;
}

export function Hand({ cards, compact = false, onPlayCard, onDropCard, onDragChange, allowClick = true, allowDrag = false, actionHint, disabled = false }: HandProps) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const suppressClick = useRef(false);

  if (cards.length === 0) return <p style={{ color: "var(--muted)" }}>Keine Handkarten. „Geben“ drücken.</p>;

  const finish = (event: React.PointerEvent, cancelled: boolean) => {
    if (!drag) return;
    if (drag.active) {
      suppressClick.current = true;
      setTimeout(() => { suppressClick.current = false; }, 0);
      if (!cancelled) {
        const zone = document.elementsFromPoint(event.clientX, event.clientY).map((el) => el.closest("[data-card-drop]")).find((el) => el != null);
        const name = zone?.getAttribute("data-card-drop");
        if (name) onDropCard?.(drag.cardId, name);
      }
      onDragChange?.(false);
    }
    setDrag(null);
  };

  return (
    <div className={`hand-cards${compact ? " hand-cards-compact" : ""}`} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
      {cards.map((card) => {
        const label = cardLabel(card);
        const activate = () => {
          if (suppressClick.current) {
            suppressClick.current = false;
            return;
          }
          if (!disabled && allowClick) onPlayCard?.(card.id);
        };
        const dragging = drag?.active && drag.cardId === card.id;
        return (
          <article
            className={compact ? "hand-card-compact" : undefined}
            key={card.id}
            onClick={activate}
            onPointerDown={(event) => {
              if (!allowDrag || disabled || event.button !== 0) return;
              suppressClick.current = false;
              (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
              setDrag({ cardId: card.id, card, startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY, active: false });
            }}
            onPointerMove={(event) => {
              if (!drag || drag.cardId !== card.id) return;
              const moved = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >= DRAG_THRESHOLD_PX;
              if (moved && !drag.active) onDragChange?.(true);
              setDrag({ ...drag, x: event.clientX, y: event.clientY, active: drag.active || moved });
            }}
            onPointerUp={(event) => finish(event, false)}
            onPointerCancel={(event) => finish(event, true)}
            role="button"
            tabIndex={0}
            aria-disabled={disabled}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                if (!disabled && allowClick) onPlayCard?.(card.id);
              }
            }}
            title={`${label}${masterCardSummary(card.kind) ? `: ${masterCardSummary(card.kind)}` : ""} – ${disabled ? "nicht möglich" : (actionHint ?? "spielen")}`}
            style={{
              width: compact ? undefined : 94,
              flex: "0 0 auto",
              filter: "drop-shadow(0 4px 6px #4c2a1a55)",
              transition: "transform .12s",
              cursor: disabled ? "not-allowed" : allowDrag && !allowClick ? "grab" : "pointer",
              opacity: disabled ? 0.55 : dragging ? 0.35 : 1,
              touchAction: allowDrag && !disabled ? "none" : undefined,
            }}
          >
            <CardArtwork card={card} />
          </article>
        );
      })}
      {drag?.active && (
        <div style={{ position: "fixed", left: drag.x - 40, top: drag.y - 66, width: 80, pointerEvents: "none", zIndex: 60, filter: "drop-shadow(0 8px 10px #000a)", transform: "rotate(-4deg)" }}>
          <CardArtwork card={drag.card} />
        </div>
      )}
    </div>
  );
}
