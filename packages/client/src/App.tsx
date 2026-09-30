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
import { CardArtwork } from "./ui/cardArtwork.js";
import { type JoinInfo, JoinScreen } from "./ui/JoinScreen.js";
import { MasterCardsHelp } from "./ui/MasterCardsHelp.js";
import "./styles.css";

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

/**
 * WebSocket-URL des Servers.
 *
 * - Im Deployment (Cloud, z. B. Render) wird die Server-Adresse über die
 *   Build-Variable `VITE_SERVER_URL` gesetzt. Erlaubt sind:
 *   - eine vollständige URL (`wss://tac-server.onrender.com`) oder
 *   - nur ein Hostname (`tac-server.onrender.com`) – dann wird `wss://`
 *     ergänzt (Render liefert per Blueprint nur den Host).
 * - Ohne diese Variable (lokale Entwicklung) wird der gleiche Host mit Port 3001
 *   angenommen. Das Protokoll folgt dem der Seite (https → wss, http → ws).
 */
function serverUrl(): string {
  const configured = (import.meta.env.VITE_SERVER_URL as string | undefined)?.trim();
  if (configured) {
    if (configured.startsWith("ws://") || configured.startsWith("wss://")) {
      return configured;
    }
    // Reiner Host (oder http[s]-URL) → in wss/ws übersetzen.
    if (configured.startsWith("http://")) return `ws://${configured.slice(7)}`;
    if (configured.startsWith("https://")) return `wss://${configured.slice(8)}`;
    return `wss://${configured}`;
  }
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  const host = window.location.hostname || "localhost";
  return `${proto}://${host}:3001`;
}

export function App() {
  const [join, setJoin] = useState<JoinInfo | null>(null);
  const { status, state, seat, error, send } = useTacSocket(serverUrl());
  const [joined, setJoined] = useState(false);
  const [showFieldNumbers, setShowFieldNumbers] = useState(false);
  const [showMasterHelp, setShowMasterHelp] = useState(false);

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

  // Phasenbegriff (STATUS §4, To-do 2): In der Tauschphase legt ein Klick auf
  // eine Handkarte sie dem Partner vor; in der Spielphase legt er sie ab.
  // Tauschphase = es sind noch nicht alle belegten Sitze in `tradeDone`.
  const occupiedSeats = state
    ? state.players.reduce((count, player) => (player ? count + 1 : count), 0)
    : 0;
  const tradeDoneCount = state?.tradeDone.length ?? 0;
  const isTradePhase = occupiedSeats > 0 && tradeDoneCount < occupiedSeats;
  const iAmTradeDone = seat != null && (state?.tradeDone.includes(seat) ?? false);
  // Der Partner hat meine angebotene Karte bereits genommen: dann darf ich in
  // dieser Runde keine neue Karte mehr anbieten (Tausch ist von meiner Seite
  // abgeschlossen). Der Server lehnt ein weiteres Angebot ohnehin ab.
  const myOfferClaimed =
    seat != null &&
    (state?.tradeOffers.some((offer) => offer.from === seat && offer.claimed) ??
      false);
  // In der Tauschphase ist das Anbieten gesperrt, sobald man selbst getauscht
  // hat ODER der Partner die eigene Karte bereits genommen hat.
  const tradeOfferBlocked = iAmTradeDone || myOfferClaimed;

  // Was macht ein Klick auf eine Handkarte in der aktuellen Phase?
  const playHandCard = (cardId: string) => {
    if (isTradePhase) {
      send({ type: "OfferCardToPartner", cardId });
    } else {
      send({ type: "PlayCard", cardId });
    }
  };

  return (
    <div className="app-shell" style={{ minHeight: "100vh", background: "#f1dfc2", color: "#4c2a1a", fontFamily: "Georgia, serif", padding: "20px clamp(12px, 3vw, 36px)" }}>
      <header className="app-header" style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
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
        <button
          type="button"
          onClick={() => setShowMasterHelp(true)}
          style={{ marginLeft: "auto", fontFamily: "system-ui", fontSize: 13 }}
        >
          Meisterkarten erklären
        </button>
      </header>

      {showMasterHelp && <MasterCardsHelp onClose={() => setShowMasterHelp(false)} />}

      {error && (
        <p style={{ color: "#b91c1c" }}>Fehler: {error}</p>
      )}

      {!state ? (
        <p>Lade Spielzustand…</p>
      ) : (
        <div className="game-layout" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 300px", gap: 18, margin: "18px auto 0", maxWidth: 1320 }}>
          <div className="board-column" style={{ position: "relative" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <button type="button" onClick={() => send({ type: "ResetGame" })}>
                Neu
              </button>
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 10, color: "#765234", fontFamily: "system-ui", fontSize: 13 }}>
              <span><strong>Geber:</strong> {state.deckHolder == null ? "wer zuerst auf den Stapel klickt" : (state.players[state.deckHolder]?.name ?? "—")}</span>
              <span><strong>Reststapel:</strong> {state.deckCount} Karten{state.deckShuffleable ? " (leer – erst mischen)" : state.deckActive ? " (bereit zum Geben)" : ""}</span>
            </div>

              <div className="board-drop-zone">
                <Board
                  balls={state.balls}
                  players={state.players}
                  handCounts={state.handCounts}
                  dealer={state.dealer}
                  deckHolder={state.deckHolder}
                  deckCount={state.deckCount}
                  deckActive={state.deckActive}
                  deckShuffleable={state.deckShuffleable}
                  onDeal={() => send({ type: "DealCards" })}
                  onShuffle={() => send({ type: "ShuffleCards" })}
                  onRequestDevil={(target) => send({ type: "RequestDevilView", target })}
                  lastBallMove={state.lastBallMove}
                  showFieldNumbers={showFieldNumbers}
                  discardEntries={state.discardEntries}
                  onMoveBall={moveBall}
                  onReturnCard={(cardId) => send({ type: "ReturnCard", cardId })}
                  ownSeat={seat}
                />
              </div>
              <label style={{ display: "inline-flex", gap: 6, alignItems: "center", marginTop: 7, color: "#765234", fontFamily: "system-ui", fontSize: 13 }}><input type="checkbox" checked={showFieldNumbers} onChange={(event) => setShowFieldNumbers(event.target.checked)} /> Feldnummern anzeigen</label>

            {/* Teufel-Anfrage: Overlay über dem Spielfeld. Das Ziel entscheidet
                (erlauben/ablehnen); der Anfrager sieht den Wartestatus und kann
                abbrechen. Alle Entscheidungen werden im Verlauf protokolliert. */}
            {state.devilRequests.map((request) => {
              const asTarget = request.target === seat && !request.approved;
              const asController = request.controller === seat && !request.approved;
              if (!asTarget && !asController) return null;
              const controllerName = state.players[request.controller]?.name ?? `Platz ${request.controller + 1}`;
              const targetName = state.players[request.target]?.name ?? `Platz ${request.target + 1}`;
              return (
                <div key={`overlay-${request.id}`} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#2b1a0e88", borderRadius: 16, zIndex: 10 }}>
                  <div style={{ background: "#fff6e6", border: "3px solid #bb7a38", borderRadius: 14, padding: 20, maxWidth: 360, textAlign: "center", fontFamily: "system-ui", color: "#4c2a1a", boxShadow: "0 12px 30px #00000055" }}>
                    {asTarget ? (
                      <>
                        <p style={{ margin: "0 0 14px", fontSize: 15 }}>
                          <strong>{controllerName}</strong> möchte als <strong>Teufel</strong> deine Handkarten ansehen. Erlauben?
                        </p>
                        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                          <button type="button" onClick={() => send({ type: "ApproveDevilView", requestId: request.id })} style={{ padding: "8px 16px", fontWeight: 700 }}>Erlauben</button>
                          <button type="button" onClick={() => send({ type: "DeclineDevilView", requestId: request.id })} style={{ padding: "8px 16px" }}>Ablehnen</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p style={{ margin: "0 0 14px", fontSize: 15 }}>
                          Warte auf <strong>{targetName}</strong> … (Teufel-Handeinsicht angefragt)
                        </p>
                        <button type="button" onClick={() => send({ type: "CancelDevilView", requestId: request.id })} style={{ padding: "8px 16px" }}>Abbrechen</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

          </div>

          <aside>
            <div className="own-hand-panel" style={{ padding: 12, borderRadius: 12, background: "#f5e5c8", color: "#6b3d22" }}>
              <h3 style={{ margin: "0 0 8px" }}>Deine Handkarten</h3>
              <p style={{ margin: "0 0 8px", fontFamily: "system-ui", fontSize: 12, color: "#8a5a33" }}>
                {isTradePhase
                  ? (tradeOfferBlocked
                      ? (iAmTradeDone
                          ? "Tauschphase – du hast bereits getauscht."
                          : "Tauschphase – dein Partner hat deine Karte genommen.")
                      : "Tauschphase: Karte anklicken = verdeckt an Partner geben.")
                  : "Spielphase: Karte anklicken = in die Mitte ablegen."}
              </p>
              <Hand
                cards={state.ownHand}
                compact
                onPlayCard={playHandCard}
                actionHint={isTradePhase ? "an Partner" : "ablegen"}
                disabled={isTradePhase && tradeOfferBlocked}
              />
              {iAmTradeDone && (
                <p style={{ marginTop: 8, fontFamily: "system-ui", fontSize: 12, color: "#8a5a33" }}>
                  Du hast in dieser Runde bereits mit dem Partner getauscht.
                </p>
              )}
            </div>
            {/* Partnertausch: unterhalb der eigenen Karten. Nach dem eigenen Tausch
                ausgeblendet – erst nach dem nächsten Geben wieder sichtbar (dann ist
                `tradeDone`/`tradeOffers` zurückgesetzt). */}
            {!iAmTradeDone && state.tradeOffers.length > 0 && (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#f5e5c8", border: "1px solid #c8955c" }}>
                <strong>Partnertausch</strong>
                <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                  {state.tradeOffers.filter((offer) => !offer.claimed).map((offer) => {
                    const isMine = offer.from === seat;
                    const isForMe = offer.to === seat;
                    // Nehmen erst möglich, wenn man selbst schon angeboten hat.
                    const iHaveOffered = state.tradeOffers.some((o) => o.from === seat);
                    return (
                      <div key={offer.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: 13 }}>
                        <span>{isMine ? "Deine Karte liegt beim Partner bereit" : "Verdeckte Karte vom Partner"}</span>
                        {isForMe && (
                          <button
                            type="button"
                            disabled={!iHaveOffered}
                            title={iHaveOffered ? undefined : "Erst selbst eine Karte anbieten"}
                            onClick={() => send({ type: "ClaimTradeOffer", offerId: offer.id })}
                          >
                            nehmen
                          </button>
                        )}
                        {isMine && !iAmTradeDone && <button type="button" onClick={() => send({ type: "RevokeTradeOffer", offerId: offer.id })}>zurücknehmen</button>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#f5e5c8", color: "#6b3d22", fontFamily: "system-ui", fontSize: 13 }}><strong>Meisteraktionen</strong><div style={{ marginTop: 8, display: "grid", gap: 6 }}><button type="button" onClick={() => send({ type: "PassHandsRight" })}>Narr: alle Hände weitergeben</button></div><p style={{ margin: "8px 0 0", fontSize: 12, color: "#8a5a33" }}>Teufel: auf den Kartenstapel deines linken Nachbarn am Brett klicken.</p></div>
            {state.devilRequests.map((request) => request.controller === seat && request.approved && request.visibleCards ? <div key={request.id} style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#ead0a8", fontFamily: "system-ui", fontSize: 13 }}><strong>Teufel-Hand von {state.players[request.target]?.name}</strong><div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 }}>{request.visibleCards.map((card) => <button key={card.id} type="button" onClick={() => send({ type: "PlayForeignCard", requestId: request.id, cardId: card.id })} style={{ width: 52, padding: 2, background: "#fff8e7", border: "1px solid #a56b3d" }}><CardArtwork card={card} compact /></button>)}</div><button type="button" onClick={() => send({ type: "CancelDevilView", requestId: request.id })} style={{ marginTop: 8 }}>Einsicht beenden</button></div> : null)}
            <HistoryPanel entries={state.history} />
          </aside>
        </div>
      )}
    </div>
  );
}
