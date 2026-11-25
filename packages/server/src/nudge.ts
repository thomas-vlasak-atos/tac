/**
 * Abkühlzeit für das „Anstupsen" (REQ-FEEDBACK F12), damit niemand einen Mitspieler
 * mit Tönen zuspammt. Rein im Speicher, ohne Einfluss auf den Spielzustand.
 */

import type { Seat } from "@tac/shared";

export const NUDGE_COOLDOWN_MS = 10_000;

export interface NudgeLimiter {
  /** true, wenn das Anstupsen erlaubt ist (und ab jetzt als gesendet zählt). */
  tryNudge(from: Seat, target: Seat, now: number): boolean;
}

export function createNudgeLimiter(cooldownMs = NUDGE_COOLDOWN_MS): NudgeLimiter {
  const last = new Map<string, number>();
  return {
    tryNudge(from, target, now) {
      if (from === target) return false;
      const key = `${from}>${target}`;
      const previous = last.get(key);
      if (previous != null && now - previous < cooldownMs) return false;
      last.set(key, now);
      return true;
    },
  };
}
