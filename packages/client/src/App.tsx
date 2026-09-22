/**
 * Haupt-App: verbindet Board, Hand, Ablage, Verlauf und Steuerung.
 *
 * Bezug: REQ-BOARD (gesamt), ARCH-OVERVIEW §7 (Frontend).
 */

import type { BallPosition, Seat } from "@tac/shared";
import { useState } from "react";
import { Board } from "./board/Board.js";
import { COLOR_LABEL } from "./board/colors.js";
import { useTacSocket } from "./net/useTacSocket.js";
import { Hand } from "./ui/Hand.js";
import { HistoryPanel } from "./ui/HistoryPanel.js";
import { CardBack } from "./ui/CardBack.js";
import { CardArtwork } from "./ui/cardArtwork.js";
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
  const [showFieldNumbers, setShowFieldNumbers] = useState(false);

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
    <div style={{ minHeight: "100vh", background: "#f1dfc2", color: "#4c2a1a", fontFamily: "Georgia, serif", padding: "20px clamp(12px, 3vw, 36px)" }}>
      <header style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
        <h1 style={{ margin: 0, letterSpacing: 2 }}>TAC <span style={{ color: "#9b5c31" }}>ONLINE</span></h1>
        <span style={{ color: "#765234", fontFamily: "system-ui", fontSize: 13 }}>
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
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 300px", gap: 18, margin: "18px auto 0", maxWidth: 1320 }}>
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
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 10, color: "#765234", fontFamily: "system-ui", fontSize: 13 }}>
              <span><strong>Aktueller Geber:</strong> {COLOR_LABEL[( ["blau", "gelb", "gruen", "rot"] as const)[state.dealer]]}</span>
              <span><strong>Nächster Geber:</strong> {COLOR_LABEL[( ["blau", "gelb", "gruen", "rot"] as const)[(state.dealer + 1) % 4]]}</span>
              <span><strong>Reststapel:</strong> {state.deckCount} Karten</span>
            </div>

              <div
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const cardId = event.dataTransfer.getData("text/tac-card");
                  if (cardId) send({ type: "PlayCard", cardId });
                }}
              >
                <Board
                  balls={state.balls}
                  lastBallMove={state.lastBallMove}
                  showFieldNumbers={showFieldNumbers}
                  discardEntries={state.discardEntries}
                  onMoveBall={moveBall}
                  onReturnCard={(cardId) => send({ type: "ReturnCard", cardId })}
                  ownSeat={seat}
                />
              </div>
              <label style={{ display: "inline-flex", gap: 6, alignItems: "center", marginTop: 7, color: "#765234", fontFamily: "system-ui", fontSize: 13 }}><input type="checkbox" checked={showFieldNumbers} onChange={(event) => setShowFieldNumbers(event.target.checked)} /> Feldnummern anzeigen</label>
            <p style={{ fontSize: 13, color: "#64748b", margin: "6px 0 0" }}>
              Bedienung: Kugel greifen und auf ein Feld ziehen. Liegen mehrere
              Kugeln auf einem Feld, werden sie gefächert dargestellt – so bleibt
              jede greifbar.
            </p>

            <div style={{ marginTop: 12 }}>
              <h3 style={{ margin: "0 0 6px" }}>Deine Handkarten</h3>
              <Hand
                cards={state.ownHand}
              />
            </div>

            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const cardId = event.dataTransfer.getData("text/tac-card");
                if (cardId) send({ type: "OfferCardToPartner", cardId });
              }}
              style={{ marginTop: 14, padding: 14, border: "2px dashed #a56b3d", borderRadius: 12, background: "#ead0a8", color: "#6b3d22" }}
            >
              <strong>Zum Partner legen</strong>
              <div style={{ fontSize: 13, marginTop: 4 }}>Karte hierher ziehen oder über „anbieten“ ablegen. Die Karte bleibt für den Partner verdeckt, bis er sie nimmt.</div>
            </div>

            {state.tradeOffers.length > 0 && (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#f5e5c8", border: "1px solid #c8955c" }}>
                <strong>Partnertausch</strong>
                <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                  {state.tradeOffers.filter((offer) => !offer.claimed).map((offer) => {
                    const isMine = offer.from === seat;
                    const isForMe = offer.to === seat;
                    return (
                      <div key={offer.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: 13 }}>
                        <span>{isMine ? "Deine verdeckte Karte beim Partner" : isForMe ? "Verdeckte Karte vom Partner" : "Partnerkarte angeboten"}</span>
                        {isForMe && <button type="button" onClick={() => send({ type: "ClaimTradeOffer", offerId: offer.id })}>nehmen</button>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          <aside>
            <div style={{ padding: 12, borderRadius: 12, background: "#ead0a8", color: "#6b3d22", fontFamily: "system-ui", fontSize: 13 }}><strong>Spielerhände</strong>{state.players.map((player, index) => player && index !== seat ? <div key={player.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}><span>{player.name}</span><CardBack count={state.handCounts[index] ?? 0} /></div> : null)}</div>
            <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#f5e5c8", color: "#6b3d22", fontFamily: "system-ui", fontSize: 13 }}><strong>Meisteraktionen</strong><div style={{ marginTop: 8, display: "grid", gap: 6 }}>{state.players.map((player, index) => player && index !== seat ? <button key={player.id} type="button" onClick={() => send({ type: "RequestDevilView", target: index as Seat })}>Teufel bei {player.name}</button> : null)}<button type="button" onClick={() => send({ type: "PassHandsRight" })}>Narr: alle Hände weitergeben</button></div></div>
            {state.devilRequests.map((request) => request.target === seat && !request.approved ? <div key={request.id} style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#fff0c9", border: "2px solid #bb7a38", fontFamily: "system-ui", fontSize: 13 }}>Ein Spieler möchte deine Karten für den Teufel ansehen.<button type="button" onClick={() => send({ type: "ApproveDevilView", requestId: request.id })} style={{ display: "block", marginTop: 8 }}>Erlauben</button></div> : null)}
            {state.devilRequests.map((request) => request.controller === seat && request.approved && request.visibleCards ? <div key={request.id} style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#ead0a8", fontFamily: "system-ui", fontSize: 13 }}><strong>Teufel-Hand</strong><div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 }}>{request.visibleCards.map((card) => <button key={card.id} type="button" onClick={() => send({ type: "PlayForeignCard", requestId: request.id, cardId: card.id })} style={{ width: 52, padding: 2, background: "#fff8e7", border: "1px solid #a56b3d" }}><CardArtwork card={card} compact /></button>)}</div></div> : null)}
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
