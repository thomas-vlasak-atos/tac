/**
 * React-Hook für die WebSocket-Verbindung zum TAC-Server.
 *
 * Bezug: docs/architecture/ARCH-OVERVIEW.md §4–§5.
 *
 * Kapselt Verbindung, Empfang von StateUpdates und das Senden von Aktionen.
 */

import type {
  ClientAction,
  PublicGameState,
  Seat,
  ServerMessage,
} from "@tac/shared";
import { useCallback, useEffect, useRef, useState } from "react";

/** Verbindungsstatus. */
export type ConnectionStatus = "connecting" | "open" | "closed";

/** Rückgabe des Hooks. */
export interface UseTacSocket {
  status: ConnectionStatus;
  state: PublicGameState | null;
  seat: Seat | null;
  error: string | null;
  send: (action: ClientAction) => void;
}

/**
 * Baut eine WebSocket-Verbindung auf und hält den zuletzt empfangenen
 * öffentlichen Spielzustand.
 *
 * @param url WebSocket-URL (z. B. ws://localhost:3001)
 */
export function useTacSocket(url: string): UseTacSocket {
  const socketRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [state, setState] = useState<PublicGameState | null>(null);
  const [seat, setSeat] = useState<Seat | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = new WebSocket(url);
    socketRef.current = socket;
    setStatus("connecting");

    socket.onopen = () => setStatus("open");
    socket.onclose = () => setStatus("closed");
    socket.onerror = () => setError("Verbindungsfehler");
    socket.onmessage = (event) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(String(event.data)) as ServerMessage;
      } catch {
        return;
      }
      switch (msg.type) {
        case "StateUpdate":
          setState(msg.state);
          setSeat(msg.yourSeat);
          break;
        case "Error":
          setError(msg.message);
          break;
        // PlayerJoined/Left werden über das nachfolgende StateUpdate reflektiert.
      }
    };

    return () => socket.close();
  }, [url]);

  const send = useCallback((action: ClientAction) => {
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(action));
    }
  }, []);

  return { status, state, seat, error, send };
}
