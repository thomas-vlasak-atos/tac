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
 * Definition, wie oft eine Kartenart im GESAMTEN Basisstapel vorkommt.
 *
 * TAC wird physisch mit zwei Kartenpäckchen gespielt, die zusammen die unten
 * genannte Verteilung ergeben (insgesamt 100 Basiskarten). Da die tatsächlichen
 * Häufigkeiten NICHT symmetrisch verdoppelbar sind (z. B. 9× die 1, 4× TAC),
 * beschreibt diese Tabelle direkt das komplette Deck – nicht ein halbes Päckchen.
 *
 * Quelle: Auszählung eines echten TAC-Kartensatzes (bestätigt vom Projektinhaber).
 * Das offizielle Regelheft nennt nur die Gesamtzahl (100) und die Kartenwerte,
 * keine Häufigkeit je Wert.
 *
 * Gesamtes Basisdeck (100 Karten):
 * - 1:  9   (Eröffnungskarte)
 * - 2:  7
 * - 3:  7
 * - 4:  7   (rückwärts)
 * - 5:  7
 * - 6:  7
 * - 7:  8   (aufteilbar, im Haus keine Schritte verschenkt)
 * - 8:  7   (Aussetzen)
 * - 9:  7
 * - 10: 7
 * - 12: 7
 * - 13: 9   (Eröffnungskarte)
 *   Zahlen zusammen                    = 89
 * - Trickser: 7
 * - TAC:      4
 * Summe                                = 100
 *
 * Zwei Stapel => 100 Basiskarten (entspricht dem TACtik-Umfang).
 */
export interface DeckCounts {
  /** Häufigkeit je Zahlenwert (Schlüssel = Wert), gesamtes Deck. */
  numbers: Record<number, number>;
  /** Häufigkeit der TAC-Karte im gesamten Deck. */
  tac: number;
  /** Häufigkeit des Tricksers im gesamten Deck. */
  trickster: number;
}

/** Zahlenwerte im Spiel (die 11 existiert bei TAC nicht). */
export const NUMBER_VALUES: readonly number[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13,
];

/**
 * Standard-Zusammensetzung des gesamten Basisdecks (100 Karten).
 * Zentral anpassbar, ohne Auswirkung auf die übrige Logik.
 */
export const SINGLE_DECK_COUNTS: DeckCounts = {
  numbers: {
    1: 9,
    2: 7,
    3: 7,
    4: 7,
    5: 7,
    6: 7,
    7: 8,
    8: 7,
    9: 7,
    10: 7,
    12: 7,
    13: 9,
  },
  tac: 4,
  trickster: 7,
};

/** Die vier Meisterkarten (je einmal, nur in der Meisterversion). */
export const MASTER_CARD_KINDS: readonly SpecialCardKind[] = [
  "engel",
  "teufel",
  "krieger",
  "narr",
];
