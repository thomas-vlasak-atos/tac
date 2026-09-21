/**
 * Beitritts-Bildschirm: Raum-ID, Name und optional Sitzplatz wählen.
 *
 * Bezug: REQ-BOARD §2 (Spieler & Sitzung), ADR-0002 (Sitzplatz-Links).
 * URL-Parameter (roomId, name, seat) werden als Vorbelegung gelesen.
 */

import type { Seat } from "@tac/shared";
import { useState } from "react";
import { COLOR_LABEL } from "../board/colors.js";

export interface JoinInfo {
  roomId: string;
  name: string;
  seat?: Seat;
}

export interface JoinScreenProps {
  initial: Partial<JoinInfo>;
  onJoin: (info: JoinInfo) => void;
}

const SEAT_OPTIONS: { seat: Seat; label: string }[] = [
  { seat: 0, label: `Platz 1 – ${COLOR_LABEL.blau} (Team A)` },
  { seat: 1, label: `Platz 2 – ${COLOR_LABEL.gelb} (Team B)` },
  { seat: 2, label: `Platz 3 – ${COLOR_LABEL.gruen} (Team A)` },
  { seat: 3, label: `Platz 4 – ${COLOR_LABEL.rot} (Team B)` },
];

export function JoinScreen({ initial, onJoin }: JoinScreenProps) {
  const [roomId, setRoomId] = useState(initial.roomId ?? "tac");
  const [name, setName] = useState(initial.name ?? "");
  const [seat, setSeat] = useState<Seat | "auto">(
    initial.seat != null ? initial.seat : "auto",
  );

  const canJoin = roomId.trim() !== "" && name.trim() !== "";

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", fontFamily: "system-ui" }}>
      <h1>TAC Online</h1>
      <p style={{ color: "#64748b" }}>
        Freies Brett – ihr zieht selbst, keine Regelprüfung.
      </p>
      <label style={{ display: "block", marginTop: 16 }}>
        Raum
        <input
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
        />
      </label>
      <label style={{ display: "block", marginTop: 12 }}>
        Dein Name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
        />
      </label>
      <label style={{ display: "block", marginTop: 12 }}>
        Sitzplatz
        <select
          value={String(seat)}
          onChange={(e) =>
            setSeat(e.target.value === "auto" ? "auto" : (Number(e.target.value) as Seat))
          }
          style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
        >
          <option value="auto">Automatisch</option>
          {SEAT_OPTIONS.map((o) => (
            <option key={o.seat} value={o.seat}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        disabled={!canJoin}
        onClick={() =>
          onJoin({
            roomId: roomId.trim(),
            name: name.trim(),
            seat: seat === "auto" ? undefined : seat,
          })
        }
        style={{ marginTop: 20, padding: "10px 16px", fontSize: 16 }}
      >
        Beitreten
      </button>
    </div>
  );
}
