/**
 * Verlaufs-Panel: zeigt die letzten Züge (nur Anzeige, kein Undo).
 *
 * Bezug: REQ-BOARD H1–H3.
 */

import type { HistoryEntry } from "@tac/shared";

export interface HistoryPanelProps {
  entries: HistoryEntry[];
  /** Wie viele der jüngsten Einträge angezeigt werden. */
  limit?: number;
}

export function HistoryPanel({ entries, limit = 20 }: HistoryPanelProps) {
  const recent = entries.slice(-limit).reverse();
  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        padding: 8,
        maxHeight: 320,
        overflowY: "auto",
        background: "#f8fafc",
        fontSize: 13,
      }}
    >
      <strong>Verlauf</strong>
      {recent.length === 0 ? (
        <p style={{ color: "#94a3b8" }}>Noch keine Züge.</p>
      ) : (
        <ul style={{ margin: "6px 0 0", paddingLeft: 16 }}>
          {recent.map((e) => (
            <li key={e.id}>{e.text}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
