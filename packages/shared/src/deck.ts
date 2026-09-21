/**
 * Reine Funktionen zum Erzeugen, Mischen und Austeilen des Kartenstapels.
 *
 * Bezug: docs/requirements/REQ-BOARD.md (K2 Geben),
 *        docs/architecture/ARCH-OVERVIEW.md §2 (reine Helfer in shared).
 *
 * Alle Funktionen sind seiteneffektfrei und deterministisch (bei gegebenem
 * Zufalls-Generator), damit sie testbar sind (AGENTS.md §5).
 */

import {
  type Card,
  type DeckCounts,
  MASTER_CARD_KINDS,
  SINGLE_DECK_COUNTS,
} from "./cards.js";

/** Ein Zufallsgenerator, der Werte in [0, 1) liefert (wie Math.random). */
export type Rng = () => number;

/** Erzeugt eindeutige, stabile Karten-IDs. */
function makeId(prefix: string, n: number): string {
  return `${prefix}-${n}`;
}

/**
 * Baut die Karten eines EINZELNEN Stapels anhand der Häufigkeitstabelle.
 * @param counts Häufigkeiten (Standard: SINGLE_DECK_COUNTS)
 * @param stackTag Kürzel zur ID-Unterscheidung mehrerer Stapel (z. B. "a"/"b")
 */
function buildSingleDeck(counts: DeckCounts, stackTag: string): Card[] {
  const cards: Card[] = [];
  let counter = 0;

  for (const [valueStr, amount] of Object.entries(counts.numbers)) {
    const value = Number(valueStr);
    for (let i = 0; i < amount; i++) {
      cards.push({
        id: makeId(`num${value}-${stackTag}`, counter++),
        kind: "number",
        value,
      });
    }
  }
  for (let i = 0; i < counts.tac; i++) {
    cards.push({ id: makeId(`tac-${stackTag}`, counter++), kind: "tac" });
  }
  for (let i = 0; i < counts.trickster; i++) {
    cards.push({
      id: makeId(`trickster-${stackTag}`, counter++),
      kind: "trickster",
    });
  }
  return cards;
}

/**
 * Baut den vollständigen Grundstapel für eine Partie: zwei identische Stapel.
 * In der Meisterversion werden die vier Meisterkarten hinzugefügt.
 *
 * @param options.master Meisterversion (fügt Engel/Teufel/Krieger/Narr hinzu)
 * @param options.counts Häufigkeiten je Stapel (Standard: SINGLE_DECK_COUNTS)
 * @returns unsortierter (aber deterministischer) Kartenstapel
 */
export function buildDeck(options?: {
  master?: boolean;
  counts?: DeckCounts;
}): Card[] {
  const counts = options?.counts ?? SINGLE_DECK_COUNTS;
  const deck: Card[] = [
    ...buildSingleDeck(counts, "a"),
    ...buildSingleDeck(counts, "b"),
  ];

  if (options?.master) {
    for (const kind of MASTER_CARD_KINDS) {
      deck.push({ id: `master-${kind}`, kind });
    }
  }
  return deck;
}

/**
 * Mischt eine Kartenliste (Fisher-Yates). Rein: gibt eine NEUE Liste zurück,
 * die Eingabe bleibt unverändert.
 *
 * @param cards zu mischende Karten
 * @param rng Zufallsgenerator (Standard: Math.random)
 */
export function shuffle<T>(cards: readonly T[], rng: Rng = Math.random): T[] {
  const result = cards.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

/** Ergebnis des Austeilens. */
export interface DealResult {
  /** Ausgeteilte Hände, je Sitzplatz (Index 0..3). */
  hands: Card[][];
  /** Verbleibender Reststapel (verdeckt). */
  rest: Card[];
}

/**
 * Teilt von OBEN des Stapels je `cardsPerPlayer` Karten an `playerCount`
 * Spieler aus (reihum, wie am Tisch). Der Stapel wird NICHT neu gemischt.
 *
 * @param deck aktueller (bereits gemischter) Stapel
 * @param cardsPerPlayer 5 (Standard) oder 6 (Meisterrunde)
 * @param playerCount Anzahl Spieler (Standard 4)
 * @throws wenn nicht genügend Karten im Stapel sind
 */
export function deal(
  deck: readonly Card[],
  cardsPerPlayer: number,
  playerCount = 4,
): DealResult {
  const needed = cardsPerPlayer * playerCount;
  if (needed > deck.length) {
    throw new Error(
      `Nicht genügend Karten: benötigt ${needed}, vorhanden ${deck.length}.`,
    );
  }

  const hands: Card[][] = Array.from({ length: playerCount }, () => []);
  // Reihum austeilen (wie am Tisch), nicht blockweise.
  for (let round = 0; round < cardsPerPlayer; round++) {
    for (let p = 0; p < playerCount; p++) {
      const card = deck[round * playerCount + p]!;
      hands[p]!.push(card);
    }
  }
  const rest = deck.slice(needed);
  return { hands, rest };
}
