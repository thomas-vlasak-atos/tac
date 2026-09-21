/**
 * Kartendefinitionen für TAC.
 *
 * Bezug: docs/requirements/REQ-BOARD.md (K1 Kartensatz),
 *        docs/requirements/REQ-RULES.md §3 (Referenz).
 *
 * Hinweis: Die Karten tragen hier nur ihre Identität (Typ/Wert). Es gibt keine
 * hinterlegte Regelwirkung (ADR-0001 – freies Brett). Die Wirkung führen die
 * Spieler selbst am Brett aus.
 */

/** Nicht-numerische Sonder-/Meisterkarten. */
export type SpecialCardKind =
  | "trickster"
  | "tac"
  | "engel"
  | "teufel"
  | "krieger"
  | "narr";

/** Eine Karte: entweder eine Zahlenkarte oder eine Spezialkarte. */
export type Card =
  | { id: string; kind: "number"; value: number }
  | { id: string; kind: SpecialCardKind };

/** Anzeigename einer Karte (für UI und Verlauf). */
export function cardLabel(card: Card): string {
  if (card.kind === "number") return String(card.value);
  switch (card.kind) {
    case "trickster":
      return "Trickser";
    case "tac":
      return "TAC";
    case "engel":
      return "Engel";
    case "teufel":
      return "Teufel";
    case "krieger":
      return "Krieger";
    case "narr":
      return "Narr";
  }
}

/**
 * Definition, wie oft eine Kartenart pro Basisstapel vorkommt.
 *
 * TAC wird mit ZWEI identischen Stapeln gespielt (zusammen 100 Basiskarten).
 * Diese Tabelle beschreibt EINEN Stapel; `buildDeck` verdoppelt entsprechend.
 *
 * Ein Stapel (50 Karten):
 * - Zahlen 1..13 (ohne 11): je 3 Stück  = 12 Werte * 3 = 36
 * - TAC: 7 Stück                        = 7
 * - Trickser: 7 Stück                   = 7
 * Summe                                 = 50
 *
 * Zwei Stapel => 100 Basiskarten (entspricht dem TACtik-Umfang).
 *
 * Anmerkung: Die genaue Stückzahl je Wert ist eine sinnvolle Annäherung an den
 * Originalumfang und in REQ-RULES §3 / REQ-DECK als offener Punkt vermerkt. Sie
 * lässt sich zentral hier anpassen, ohne Auswirkung auf die übrige Logik.
 */
export interface DeckCounts {
  /** Häufigkeit je Zahlenwert (Schlüssel = Wert). */
  numbers: Record<number, number>;
  /** Häufigkeit der TAC-Karte. */
  tac: number;
  /** Häufigkeit des Tricksers. */
  trickster: number;
}

/** Zahlenwerte im Spiel (die 11 existiert bei TAC nicht). */
export const NUMBER_VALUES: readonly number[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13,
];

/** Standard-Zusammensetzung eines einzelnen Stapels. */
export const SINGLE_DECK_COUNTS: DeckCounts = {
  numbers: Object.fromEntries(NUMBER_VALUES.map((v) => [v, 3])),
  tac: 7,
  trickster: 7,
};

/** Die vier Meisterkarten (je einmal, nur in der Meisterversion). */
export const MASTER_CARD_KINDS: readonly SpecialCardKind[] = [
  "engel",
  "teufel",
  "krieger",
  "narr",
];
