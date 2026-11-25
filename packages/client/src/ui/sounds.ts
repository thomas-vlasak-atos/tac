/** Töne „Zug gemacht" und „Du bist dran" (REQ-FEEDBACK F3). Per Web Audio erzeugt, keine Dateien. */

import type { Seat } from "@tac/shared";

export interface SoundSnapshot {
  /** Schlüssel des letzten Kugelzugs (null = keiner). */
  moveKey: string | null;
  /** Anzahl offen abgelegter Karten. */
  discardLength: number;
  /** Sitz, der laut Ableitung dran ist. */
  turnSeat: Seat | null;
}

export interface SoundEvents {
  move: boolean;
  turn: boolean;
}

/**
 * Welche Töne gehören zum Übergang `prev` → `next`?
 * - „Du bist dran": der Hinweis wechselt auf mich.
 * - „Zug gemacht": neuer Kugelzug oder neue Karte eines anderen (`ownActionRecent` = eigene Aktion).
 * Kommt beides zusammen, gibt es nur „Du bist dran".
 */
export function soundEvents(prev: SoundSnapshot | null, next: SoundSnapshot, ownSeat: Seat | null, ownActionRecent: boolean): SoundEvents {
  if (!prev) return { move: false, turn: false };
  const turn = ownSeat != null && next.turnSeat === ownSeat && prev.turnSeat !== ownSeat;
  const changed = (next.moveKey != null && next.moveKey !== prev.moveKey) || next.discardLength > prev.discardLength;
  return { turn, move: changed && !ownActionRecent && !turn };
}

let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  ctx ??= new Ctx();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function note(audio: AudioContext, freq: number, start: number, length: number, peak: number, type: OscillatorType): void {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, audio.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(peak, audio.currentTime + start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + start + length);
  osc.connect(gain).connect(audio.destination);
  osc.start(audio.currentTime + start);
  osc.stop(audio.currentTime + start + length + 0.02);
}

/** Kurzes, dezentes „Klack". */
export function playMoveSound(): void {
  const audio = context();
  if (audio) note(audio, 420, 0, 0.09, 0.18, "triangle");
}

/** Freundlicher, aufsteigender Zweiklang. */
export function playTurnSound(): void {
  const audio = context();
  if (!audio) return;
  note(audio, 587, 0, 0.22, 0.22, "sine");
  note(audio, 880, 0.18, 0.34, 0.22, "sine");
}
