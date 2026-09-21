/**
 * Haupt-App: verbindet Board, Hand, Ablage, Verlauf und Steuerung.
 *
 * Bezug: REQ-BOARD (gesamt), ARCH-OVERVIEW §7 (Frontend).
 */

import type { BallPosition, Seat } from "@tac/shared";
import { cardLabel } from "@tac/shared";
import { useState } from "react";
import { Board } from "./board/Board.js";
import { COLOR_LABEL } from "./board/colors.js";
import { useTacSocket } from "./net/useTacSocket.js";
import { Hand } from "./ui/Hand.js";
import { HistoryPanel } from "./ui/HistoryPanel.js";
import { type JoinInfo, JoinScreen } from "./ui/JoinScreen.js";

/** Liest Vorbelegungen aus der URL (ADR-0002 Sitzplatz-Links). */
function readUrlDefaults(): Partial<JoinInfo> {
  const params = new URLSearchParams(window.location.search);
  const seatRaw = params.get("seat");
  const seat = seatRaw != null ? (Number(seatRaw) as Seat) : undefined;
  return {
    roomId: params.get("room") ?? undefined,
    name: params.get("name") ?? undefined,
    seat: seat != null && seat >= 0 && seat <= 3 ? seat : undefined,
  };
}

/** WebSocket-URL des Servers (Standard: gleicher Host, Port 3001). */
function serverUrl(): string {
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  const host = window.location.hostname || "localhost";
  return `${proto}://${host}:3001`;
}

export function App() {
  const [join, setJoin] = useState<JoinInfo | null>(null);
  const { status, state, seat, error, send } = useTacSocket(serverUrl());
  const [joined, setJoined] = useState(false);

  // Nach Verbindungsaufbau automatisch beitreten (einmalig).
  if (join && status === "open" && !joined) {
    send({ type: "JoinRoom", roomId: join.roomId, name: join.name, seat: join.seat });
    setJoined(true);
  }

  if (!join) {
    return <JoinScreen initial={readUrlDefaults()} onJoin={setJoin} />;
  }

  const moveBall = (ballId: string, to: BallPosition) =>
    send({ type: "MoveBall", ballId, to });

  return (
    <div style={{ fontFamily: "system-ui", padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <header style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
        <h1 style={{ margin: 0 }}>TAC Online</h1>
        <span style={{ color: "#64748b" }}>
          Raum <strong>{join.roomId}</strong> ·{" "}
          {seat != null ? (
            <>
              du bist{" "}
              <strong>
                {COLOR_LABEL[(["blau", "gelb", "gruen", "rot"] as const)[seat]]}
              </strong>{" "}
              (Platz {seat + 1})
            </>
          ) : (
            "Sitzplatz wird zugewiesen…"
          )}{" "}
          · Verbindung: {status}
        </span>
      </header>

      {error && (
        <p style={{ color: "#b91c1c" }}>Fehler: {error}</p>
      )}

      {!state ? (
        <p>Lade Spielzustand…</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, marginTop: 12 }}>
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <button type="button" onClick={() => send({ type: "DealCards" })}>
                Geben (5 Karten)
              </button>
              <button
                type="button"
                onClick={() => send({ type: "DealCards", cardsPerPlayer: 6 })}
              >
                Meisterrunde (6)
              </button>
              <button type="button" onClick={() => send({ type: "ResetGame" })}>
                Neu
              </button>
              <label style={{ marginLeft: 8 }}>
                <input
                  type="checkbox"
                  checked={state.masterMode}
                  onChange={(e) =>
                    send({ type: "SetMasterMode", enabled: e.target.checked })
                  }
                />{" "}
                Meisterversion
              </label>
            </div>

            <Board
              balls={state.balls}
              onMoveBall={moveBall}
              ownSeat={seat}
            />
            <p style={{ fontSize: 13, color: "#64748b", margin: "6px 0 0" }}>
              Bedienung: Kugel greifen und auf ein Feld ziehen. Liegen mehrere
              Kugeln auf einem Feld, werden sie gefächert dargestellt – so bleibt
              jede greifbar.
            </p>

            <div style={{ marginTop: 12 }}>
              <h3 style={{ margin: "0 0 6px" }}>Deine Handkarten</h3>
              <Hand
                cards={state.ownHand}
                onPlay={(cardId) => send({ type: "PlayCard", cardId })}
                onSwap={(cardId) => send({ type: "SwapWithPartner", cardId })}
              />
            </div>

            <div style={{ marginTop: 12 }}>
              <h3 style={{ margin: "0 0 6px" }}>Ablage</h3>
              {state.discardPile.length === 0 ? (
                <span style={{ color: "#94a3b8" }}>leer</span>
              ) : (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {state.discardPile.slice(-8).map((c) => (
                    <span
                      key={c.id}
                      style={{
                        border: "1px solid #cbd5e1",
                        borderRadius: 6,
                        padding: "4px 8px",
                        background: "#fff",
                      }}
                    >
                      {cardLabel(c)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside>
            <HistoryPanel entries={state.history} />
            <div style={{ marginTop: 12, fontSize: 13, color: "#64748b" }}>
              <strong>Spieler</strong>
              <ul style={{ paddingLeft: 16 }}>
                {state.players.map((p, i) => (
                  <li key={i}>
                    Platz {i + 1}:{" "}
                    {p ? `${p.name} (${COLOR_LABEL[p.color]})` : "frei"}
                    {p && !p.connected ? " – getrennt" : ""}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
