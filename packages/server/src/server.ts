/**
 * WebSocket-Server für TAC (State-Synchronisierer).
 *
 * Bezug: docs/architecture/ARCH-OVERVIEW.md §4–§6.
 *
 * Aufgaben:
 * - Räume verwalten (eine Partie = ein Raum).
 * - Client-Aktionen entgegennehmen und über die reine Raum-Logik anwenden.
 * - Nach jeder Änderung den gefilterten Zustand an alle Clients broadcasten
 *   (jeder Client sieht nur seine eigene Hand).
 *
 * Es findet KEINE Spielregelprüfung statt (freies Brett, ADR-0001).
 */

import { randomUUID } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { ClientAction, GameState, Seat, ServerMessage } from "@tac/shared";
import { createInitialState } from "@tac/shared";
import { WebSocket, WebSocketServer } from "ws";
import {
  dealCards,
  shuffleDiscard,
  joinRoom,
  markDisconnected,
  moveBall,
  playCard,
  offerCardToPartner,
  claimTradeOffer,
  revokeTradeOffer,
  requestDevilView,
  approveDevilView,
  declineDevilView,
  cancelDevilView,
  playForeignCard,
  passHandsRight,
  resetGame,
  returnCard,
  setMasterMode,
  swapBalls,
  swapWithPartner,
  toPublicState,
  createUndoTracker,
  trackAction,
  undoLabelFor,
  undoLast,
  type UndoTracker,
} from "./room.js";

/** Eine aktive Verbindung mit Zuordnung zu Raum und Sitzplatz. */
interface Connection {
  id: string;
  socket: WebSocket;
  roomId: string | null;
  seat: Seat | null;
}

/** Ein Raum hält den Zustand einer Partie und die verbundenen Clients. */
interface Room {
  id: string;
  state: GameState;
  /** Einstufiges Undo (REQ-BOARD U1). */
  undo: UndoTracker;
  connections: Set<Connection>;
}

const rooms = new Map<string, Room>();

/** Holt oder erstellt einen Raum. */
function getOrCreateRoom(roomId: string): Room {
  let room = rooms.get(roomId);
  if (!room) {
    room = { id: roomId, state: createInitialState(), undo: createUndoTracker(), connections: new Set() };
    rooms.set(roomId, room);
  }
  return room;
}

/** Sendet eine Nachricht an eine einzelne Verbindung. */
function send(conn: Connection, message: ServerMessage): void {
  if (conn.socket.readyState === WebSocket.OPEN) {
    conn.socket.send(JSON.stringify(message));
  }
}

/** Broadcastet den gefilterten Zustand an alle Clients eines Raums. */
function broadcastState(room: Room): void {
  for (const conn of room.connections) {
    send(conn, {
      type: "StateUpdate",
      state: toPublicState(room.state, conn.seat, undoLabelFor(room.undo, conn.seat)),
      yourSeat: conn.seat,
    });
  }
}

/** Verarbeitet eine eingehende Client-Aktion. */
function handleAction(conn: Connection, action: ClientAction): void {
  // JoinRoom ist der einzige Fall, der ohne bestehenden Raum funktioniert.
  if (action.type === "JoinRoom") {
    const room = getOrCreateRoom(action.roomId);
    const { state, seat, displaced } = joinRoom(
      room.state,
      conn.id,
      action.name,
      action.seat,
    );
    if (seat == null) {
      send(conn, { type: "Error", message: "Der Raum ist bereits voll." });
      return;
    }
    // Alte Verbindung(en) auf demselben Sitz aufräumen. Das deckt sowohl den
    // Reconnect (gleicher Name) als auch die Verdrängung per Wunschsitz ab:
    // Wer den Platz verliert, wird informiert und verliert seinen Sitzbezug.
    for (const other of room.connections) {
      if (other.seat === seat && other !== conn) {
        if (displaced === seat) {
          send(other, {
            type: "Error",
            message: `Dein Platz wurde von ${action.name} übernommen.`,
          });
        }
        other.seat = null;
      }
    }
    conn.roomId = room.id;
    conn.seat = seat;
    room.state = state;
    room.connections.add(conn);

    for (const other of room.connections) {
      send(other, { type: "PlayerJoined", seat, name: action.name });
    }
    broadcastState(room);
    return;
  }

  // Alle übrigen Aktionen erfordern einen zugewiesenen Raum + Sitz.
  if (conn.roomId == null || conn.seat == null) {
    send(conn, { type: "Error", message: "Bitte zuerst einem Raum beitreten." });
    return;
  }
  const room = rooms.get(conn.roomId);
  if (!room) return;
  const seat = conn.seat;

  if (action.type === "Undo") {
    const result = undoLast(room.state, room.undo, seat);
    if (!result) {
      send(conn, { type: "Error", message: "Es gibt nichts, was du rückgängig machen kannst." });
      return;
    }
    room.state = result.state;
    room.undo = result.tracker;
    broadcastState(room);
    return;
  }

  const stateBefore = room.state;
  switch (action.type) {
    case "MoveBall":
      room.state = moveBall(room.state, action.ballId, action.to, seat);
      break;
    case "SwapBalls":
      room.state = swapBalls(room.state, action.ballA, action.ballB, seat);
      break;
    case "DealCards":
      room.state = dealCards(room.state, 5, action.force ? undefined : seat);
      break;
    case "ShuffleCards":
      room.state = shuffleDiscard(room.state, Math.random, action.force ? undefined : seat);
      break;
    case "PlayCard":
      room.state = playCard(room.state, seat, action.cardId);
      break;
    case "ReturnCard":
      room.state = returnCard(room.state, seat, action.cardId);
      break;
    case "SwapWithPartner":
      room.state = swapWithPartner(room.state, seat, action.cardId);
      break;
    case "OfferCardToPartner":
      room.state = offerCardToPartner(room.state, seat, action.cardId);
      break;
    case "ClaimTradeOffer":
      room.state = claimTradeOffer(room.state, seat, action.offerId);
      break;
    case "RevokeTradeOffer":
      room.state = revokeTradeOffer(room.state, seat, action.offerId);
      break;
    case "RequestDevilView":
      room.state = requestDevilView(room.state, seat, action.target);
      break;
    case "ApproveDevilView":
      room.state = approveDevilView(room.state, seat, action.requestId);
      break;
    case "DeclineDevilView":
      room.state = declineDevilView(room.state, seat, action.requestId);
      break;
    case "CancelDevilView":
      room.state = cancelDevilView(room.state, seat, action.requestId);
      break;
    case "PlayForeignCard":
      room.state = playForeignCard(room.state, seat, action.requestId, action.cardId);
      break;
    case "PassHandsRight":
      room.state = passHandsRight(room.state, seat);
      break;
    case "Announce":
      // Rein informativ; als Verlaufseintrag über moveBall-artiges Muster
      // könnte man das ergänzen. Vorerst kein Zustandsänderung nötig.
      break;
    case "SetMasterMode":
      room.state = setMasterMode(room.state, action.enabled);
      break;
    case "ResetGame":
      room.state = resetGame(room.state);
      break;
  }
  room.undo = trackAction(room.undo, action.type, seat, stateBefore, room.state);
  broadcastState(room);
}

/** Behandelt eine getrennte Verbindung. */
function handleClose(conn: Connection): void {
  if (conn.roomId == null) return;
  const room = rooms.get(conn.roomId);
  if (!room) return;

  room.connections.delete(conn);
  if (conn.seat != null) {
    room.state = markDisconnected(room.state, conn.seat);
    for (const other of room.connections) {
      send(other, { type: "PlayerLeft", seat: conn.seat });
    }
    broadcastState(room);
  }
  // Leere Räume aufräumen.
  if (room.connections.size === 0) {
    rooms.delete(room.id);
  }
}

/**
 * Startet den Server auf dem angegebenen Port.
 *
 * Es wird ein HTTP-Server erstellt, der zwei Zwecke erfüllt:
 * 1. Einen Health-Check (GET /health, GET /) mit HTTP 200 – nötig für Hosting-
 *    Plattformen wie Render, die einen offenen HTTP-Port und Health-Checks
 *    erwarten und pro Dienst nur EINEN Port freigeben.
 * 2. Das WebSocket-Upgrade auf demselben Port (der eigentliche Spielverkehr).
 *
 * So laufen HTTP-Health-Check und WebSocket über einen einzigen Port – das ist
 * Voraussetzung für kostenloses Cloud-Hosting (siehe ADR-0002).
 */
export function startServer(port = 3001): WebSocketServer {
  const httpServer = createServer(
    (req: IncomingMessage, res: ServerResponse) => {
      // Einfacher Health-Check; alle GET-Anfragen mit 200 beantworten.
      if (req.method === "GET") {
        res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
        res.end("TAC server ok");
        return;
      }
      res.writeHead(404);
      res.end();
    },
  );

  const wss = new WebSocketServer({ server: httpServer });

  wss.on("connection", (socket: WebSocket) => {
    const conn: Connection = {
      id: randomUUID(),
      socket,
      roomId: null,
      seat: null,
    };

    socket.on("message", (data) => {
      let action: ClientAction;
      try {
        action = JSON.parse(String(data)) as ClientAction;
      } catch {
        send(conn, { type: "Error", message: "Ungültige Nachricht (kein JSON)." });
        return;
      }
      handleAction(conn, action);
    });

    socket.on("close", () => handleClose(conn));
    socket.on("error", () => handleClose(conn));
  });

  // Auf allen Interfaces lauschen (0.0.0.0), damit Cloud-/LAN-Zugriff klappt.
  httpServer.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`TAC-Server läuft auf Port ${port} (HTTP-Health + WebSocket)`);
  });
  return wss;
}

// Für Tests exportiert; hier bewusst kein Auto-Start, siehe index.ts.
export { rooms };
