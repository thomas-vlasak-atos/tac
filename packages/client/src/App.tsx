/**
 * Haupt-App: verbindet Board, Hand, Ablage, Verlauf und Steuerung.
 *
 * Bezug: REQ-BOARD (gesamt), ARCH-OVERVIEW §7 (Frontend).
 */

import type { BallPosition } from "@tac/shared";
import { PASS_HANDS_HISTORY_TEXT, nextToPlay } from "@tac/shared";
import { useEffect, useRef, useState } from "react";
import { Board } from "./board/Board.js";
import { COLOR_LABEL } from "./board/colors.js";
import { directJoinFromUrl, isTestMode, readUrlDefaults } from "./net/urlParams.js";
import { useTacSocket } from "./net/useTacSocket.js";
import { Hand } from "./ui/Hand.js";
import { HistoryPanel } from "./ui/HistoryPanel.js";
import { type JoinInfo, JoinScreen } from "./ui/JoinScreen.js";
import { MasterCardsHelp } from "./ui/MasterCardsHelp.js";
import { moveKey } from "./board/recentMoves.js";
import { playNudge } from "./ui/nudge.js";
import { type SoundSnapshot, playMoveSound, playTurnSound, soundEvents } from "./ui/sounds.js";
import { SettingsDialog } from "./ui/SettingsDialog.js";
import { type Settings, loadSettings, saveSettings } from "./ui/settings.js";
import "./styles.css";

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
  // Enthält die URL Raum + Name (Sitzplatz-Link), geht es ohne Startformular direkt ins Spiel.
  const [join, setJoin] = useState<JoinInfo | null>(() => directJoinFromUrl(window.location.search));
  const { status, state, seat, error, nudge, send: sendRaw } = useTacSocket(serverUrl());
  // Eigene Aktionen merken, damit sie keinen „Zug gemacht"-Ton auslösen (F3).
  const ownActionAt = useRef(0);
  // Zeitpunkt der letzten eigenen Karte per Drag & Drop: dafür braucht es keinen Flug in die Mitte.
  const ownCardDropAt = useRef(0);
  const send: typeof sendRaw = (action) => {
    ownActionAt.current = Date.now();
    sendRaw(action);
  };
  const [joined, setJoined] = useState(false);
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [showSettings, setShowSettings] = useState(false);
  const [cardDragging, setCardDragging] = useState(false);
  const [nudgeNotice, setNudgeNotice] = useState<string | null>(null);
  // Karte spielen merkt vor, erst das Bewegen einer Kugel löst die Anzeige aus.
  const turnSeat = state && state.ballMovedSinceCard && state.discardEntries.length > 0 ? nextToPlay(state) : null;
  // Letzter Narr im Verlauf (steigende ID löst die Animation der wandernden Hände aus).
  const passHandsKey = state ? state.history.reduce((id, entry) => (entry.text.endsWith(PASS_HANDS_HISTORY_TEXT) ? entry.id : id), 0) : 0;
  const myName = seat != null ? state?.players[seat]?.name : undefined;

  // Töne (F3): „Zug gemacht" bei Aktionen anderer, „Du bist dran" wenn der Hinweis auf mich wechselt.
  const prevSnapshot = useRef<SoundSnapshot | null>(null);
  useEffect(() => {
    if (!state) return;
    const next: SoundSnapshot = {
      moveKey: state.lastBallMove ? moveKey(state.lastBallMove) : null,
      discardLength: state.discardEntries.length,
      turnSeat,
    };
    const events = soundEvents(prevSnapshot.current, next, seat, Date.now() - ownActionAt.current < 1500);
    prevSnapshot.current = next;
    if (events.turn && settings.soundTurn) playTurnSound();
    else if (events.move && settings.soundMove) playMoveSound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Verstecktes Gimmick (F12): Mitspieler hat mich angestupst.
  useEffect(() => {
    if (!nudge) return;
    setNudgeNotice(`${nudge.fromName} stupst dich an`);
    if (settings.nudgeSound) playNudge(myName ?? join?.name ?? "Du");
    const timer = setTimeout(() => setNudgeNotice(null), 4000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nudge?.id]);
  const showFieldNumbers = settings.showFieldNumbers;
  const updateSettings = (next: Settings) => {
    setSettings(next);
    saveSettings(next);
  };
  const [showMasterHelp, setShowMasterHelp] = useState(false);
  // Testmodus (?test=1): kein Partnertausch (erste Klick auf eine Karte legt sie ab),
  // und jeder darf geben/mischen. Nur zum Testen einer kompletten Runde gedacht.
  const testMode = isTestMode(window.location.search);

  // Nach Verbindungsaufbau automatisch beitreten (einmalig).
  if (join && status === "open" && !joined) {
    send({ type: "JoinRoom", roomId: join.roomId, name: join.name, seat: join.seat });
    setJoined(true);
  }

  if (!join) {
    return <JoinScreen initial={readUrlDefaults(window.location.search)} onJoin={setJoin} />;
  }

  const moveBall = (ballId: string, to: BallPosition) =>
    send({ type: "MoveBall", ballId, to });

  // „Neu" setzt das ganze Spiel zurück – mit Sicherheitsabfrage, damit niemand
  // versehentlich die laufende Partie löscht.
  const handleReset = () => {
    if (window.confirm("Neues Spiel starten? Der aktuelle Spielstand geht verloren.")) {
      send({ type: "ResetGame" });
    }
  };

  // „Narr: Hände weitergeben" betrifft alle Spieler – mit Sicherheitsabfrage gegen Fehlklicks.
  const handlePassHands = () => {
    if (window.confirm("Narr ausspielen? Alle Handkarten werden gegen den Uhrzeigersinn weitergegeben.")) {
      send({ type: "PassHandsRight" });
    }
  };

  // Phasenbegriff (STATUS §4, To-do 2): In der Tauschphase legt ein Klick auf
  // eine Handkarte sie dem Partner vor; in der Spielphase legt er sie ab.
  // Tauschphase = es sind noch nicht alle belegten Sitze in `tradeDone`.
  const occupiedSeats = state
    ? state.players.reduce((count, player) => (player ? count + 1 : count), 0)
    : 0;
  const tradeDoneCount = state?.tradeDone.length ?? 0;
  const isTradePhase = !testMode && occupiedSeats > 0 && tradeDoneCount < occupiedSeats;
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

  // „Wer ist dran" (rein informativ, REQ-FEEDBACK F1).
  const itsMyTurn = settings.showTurnMarker && seat != null && turnSeat === seat;

  // Karte auf eine Drop-Zone gezogen: gleiche Aktion wie der Klick, aber nur auf der zur Phase passenden Zone.
  const dropHandCard = (cardId: string, zone: string) => {
    if (isTradePhase ? zone === "partner" && !tradeOfferBlocked : zone === "play") {
      ownCardDropAt.current = Date.now();
      playHandCard(cardId);
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-title">TAC <span style={{ color: "#9b5c31" }}>ONLINE</span></h1>
        <span style={{ color: "#765234", fontFamily: "system-ui", fontSize: 13 }}>
          Raum <strong>{join.roomId}</strong>
          {seat != null ? (
            <> · du bist <strong>{COLOR_LABEL[(["blau", "gelb", "gruen", "rot"] as const)[seat]]}</strong> (Platz {seat + 1})</>
          ) : (
            <> · Sitzplatz wird zugewiesen…</>
          )}
        </span>
        {testMode && <span title="URL-Parameter test=1: kein Partnertausch, jeder darf geben" style={{ background: "#b91c1c", color: "#fff", borderRadius: 6, padding: "2px 8px", fontFamily: "system-ui", fontSize: 12, fontWeight: 700 }}>TESTMODUS</span>}
        <span style={{ color: "#765234", fontFamily: "system-ui", fontSize: 13 }}><strong>Verbindung:</strong> {status}</span>
        {itsMyTurn && <span style={{ background: "#d6199b", color: "#fff", borderRadius: 6, padding: "2px 10px", fontFamily: "system-ui", fontSize: 13, fontWeight: 700 }}>Du bist dran</span>}
        {state && (
          <span style={{ color: "#765234", fontFamily: "system-ui", fontSize: 13 }}>
            <strong>Startspieler:</strong>{" "}
            {state.deckHolder == null ? "wer zuerst klickt" : (state.players[state.deckHolder]?.name ?? "—")}
          </span>
        )}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, fontFamily: "system-ui", fontSize: 13 }}>
          {state?.undoLabel && (
            <button type="button" onClick={() => send({ type: "Undo" })} title={`Rückgängig: ${state.undoLabel}`}>↩ Rückgängig</button>
          )}
          <button type="button" onClick={handleReset}>Neu</button>
          <button type="button" onClick={() => setShowMasterHelp(true)}>Meisterkarten erklären</button>
          <button type="button" onClick={() => setShowSettings(true)} title="Einstellungen">⚙ Einstellungen</button>
        </div>
      </header>

      {nudgeNotice && <div role="status" style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", background: "#d6199b", color: "#fff", borderRadius: 10, padding: "10px 18px", fontFamily: "system-ui", fontWeight: 700, zIndex: 70, boxShadow: "0 8px 20px #0006" }}>👉 {nudgeNotice}</div>}

      {showMasterHelp && <MasterCardsHelp onClose={() => setShowMasterHelp(false)} />}
      {showSettings && <SettingsDialog settings={settings} onChange={updateSettings} onClose={() => setShowSettings(false)} />}

      {error && (
        <p style={{ color: "#b91c1c" }}>Fehler: {error}</p>
      )}

      {!state ? (
        <p>Lade Spielzustand…</p>
      ) : (
        <div className="game-layout">
          <div className="board-column" style={{ position: "relative" }}>
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
                  anyDealer={testMode}
                  onDeal={() => send({ type: "DealCards", force: testMode || undefined })}
                  onShuffle={() => send({ type: "ShuffleCards", force: testMode || undefined })}
                  onRequestDevil={(target) => send({ type: "RequestDevilView", target })}
                  lastBallMove={state.lastBallMove}
                  turnSeat={settings.showTurnMarker ? turnSeat : null}
                  animateMoves={settings.animateMoves}
                  showDragHint={settings.showDragHint}
                  onNudge={(target) => send({ type: "Nudge", target })}
                  passHandsKey={passHandsKey}
                  background={settings.boardBackground}
                  skipCardFly={(actor) => actor === seat && Date.now() - ownCardDropAt.current < 3000}
                  cardDropMode={cardDragging ? (isTradePhase ? "partner" : "play") : null}
                  showFieldNumbers={showFieldNumbers}
                  discardEntries={state.discardEntries}
                  onMoveBall={moveBall}
                  onReturnCard={(cardId) => send({ type: "ReturnCard", cardId })}
                  ownSeat={seat}
                />
              </div>

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

          <aside className="side-panel">
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
                allowClick={settings.cardClick}
                allowDrag={settings.cardDrag}
                onDragChange={setCardDragging}
                onDropCard={dropHandCard}
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
            {!testMode && !iAmTradeDone && state.tradeOffers.length > 0 && (
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
            <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#f5e5c8", color: "#6b3d22", fontFamily: "system-ui", fontSize: 13 }}><strong>Meisteraktionen</strong><div style={{ marginTop: 8, display: "grid", gap: 6 }}><button type="button" onClick={handlePassHands}>Narr: alle Hände weitergeben</button></div><p style={{ margin: "8px 0 0", fontSize: 12, color: "#8a5a33" }}>Teufel: auf den Kartenstapel deines linken Nachbarn am Brett klicken.</p></div>
            {state.devilRequests.map((request) => request.controller === seat && request.approved && request.visibleCards ? (
              <div key={request.id} className="own-hand-panel" style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#ead0a8", fontFamily: "system-ui", fontSize: 13 }}>
                <strong>Teufel-Hand von {state.players[request.target]?.name}</strong>
                <div style={{ marginTop: 8 }}>
                  <Hand
                    cards={request.visibleCards}
                    compact
                    actionHint="für den Nachbarn spielen"
                    onPlayCard={(cardId) => send({ type: "PlayForeignCard", requestId: request.id, cardId })}
                  />
                </div>
                <button type="button" onClick={() => send({ type: "CancelDevilView", requestId: request.id })} style={{ marginTop: 8 }}>Einsicht beenden</button>
              </div>
            ) : null)}
            <HistoryPanel entries={state.history} />
          </aside>
        </div>
      )}
    </div>
  );
}
