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
import type { ClientAction, GameState, Seat, ServerMessage } from "@tac/shared";
import { createInitialState } from "@tac/shared";
import { WebSocket, WebSocketServer } from "ws";
import {
  dealCards,
  joinRoom,
  markDisconnected,
  moveBall,
  playCard,
  resetGame,
  setMasterMode,
  swapBalls,
  swapWithPartner,
  toPublicState,
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
  connections: Set<Connection>;
}

const rooms = new Map<string, Room>();

/** Holt oder erstellt einen Raum. */
function getOrCreateRoom(roomId: string): Room {
  let room = rooms.get(roomId);
  if (!room) {
    room = { id: roomId, state: createInitialState(), connections: new Set() };
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
      state: toPublicState(room.state, conn.seat),
      yourSeat: conn.seat,
    });
  }
}

/** Verarbeitet eine eingehende Client-Aktion. */
function handleAction(conn: Connection, action: ClientAction): void {
  // JoinRoom ist der einzige Fall, der ohne bestehenden Raum funktioniert.
  if (action.type === "JoinRoom") {
    const room = getOrCreateRoom(action.roomId);
    const { state, seat } = joinRoom(
      room.state,
      conn.id,
      action.name,
      action.seat,
    );
    if (seat == null) {
      send(conn, { type: "Error", message: "Der Raum ist bereits voll." });
      return;
    }
    // Alte Verbindung desselben Sitzes (Reconnect) aufräumen.
    for (const other of room.connections) {
      if (other.seat === seat && other !== conn) {
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

  switch (action.type) {
    case "MoveBall":
      room.state = moveBall(room.state, action.ballId, action.to, seat);
      break;
    case "SwapBalls":
      room.state = swapBalls(room.state, action.ballA, action.ballB, seat);
      break;
    case "DealCards":
      room.state = dealCards(room.state, action.cardsPerPlayer ?? 5);
      break;
    case "PlayCard":
      room.state = playCard(room.state, seat, action.cardId);
      break;
    case "SwapWithPartner":
      room.state = swapWithPartner(room.state, seat, action.cardId);
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

/** Startet den WebSocket-Server auf dem angegebenen Port. */
export function startServer(port = 3001): WebSocketServer {
  const wss = new WebSocketServer({ port });

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

  // eslint-disable-next-line no-console
  console.log(`TAC-Server läuft auf ws://localhost:${port}`);
  return wss;
}

// Für Tests exportiert; hier bewusst kein Auto-Start, siehe index.ts.
export { rooms };
