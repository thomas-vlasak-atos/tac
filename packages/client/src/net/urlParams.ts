/**
 * Auswertung der URL-Parameter (ADR-0002 Sitzplatz-Links).
 *
 * `?room=<raum>&name=<name>&seat=<0-3>` – bei Raum UND Name tritt der Client direkt
 * bei (ohne Startformular); fehlt einer von beiden, wird das Formular vorbelegt.
 * `test=1` aktiviert den Testmodus.
 */

import type { Seat } from "@tac/shared";

export interface UrlJoinDefaults {
  roomId?: string;
  name?: string;
  seat?: Seat;
}

/** Liest die Beitritts-Vorbelegung aus einem Query-String (`location.search`). */
export function readUrlDefaults(search: string): UrlJoinDefaults {
  const params = new URLSearchParams(search);
  const seatRaw = params.get("seat");
  const seatNumber = seatRaw != null && seatRaw.trim() !== "" ? Number(seatRaw) : NaN;
  const seat = Number.isInteger(seatNumber) && seatNumber >= 0 && seatNumber <= 3 ? (seatNumber as Seat) : undefined;
  return {
    roomId: params.get("room")?.trim() || undefined,
    name: params.get("name")?.trim() || undefined,
    seat,
  };
}

/** Liefert die Beitrittsdaten, wenn die URL alles Nötige enthält (Raum + Name), sonst `null`. */
export function directJoinFromUrl(search: string): { roomId: string; name: string; seat?: Seat } | null {
  const { roomId, name, seat } = readUrlDefaults(search);
  if (!roomId || !name) return null;
  return seat != null ? { roomId, name, seat } : { roomId, name };
}

/** Testmodus per `?test=1` (oder `true`). */
export function isTestMode(search: string): boolean {
  const value = new URLSearchParams(search).get("test");
  return value === "1" || value === "true";
}
