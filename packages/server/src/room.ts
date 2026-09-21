/**
 * Reine Raum-/Zustandslogik (ohne Netzwerk).
 *
 * Bezug: docs/architecture/ARCH-OVERVIEW.md §3–§6.
 *
 * Diese Funktionen wenden Client-Aktionen auf einen GameState an und liefern
 * einen NEUEN Zustand (immutable-Stil). Es gibt bewusst KEINE Spielregelprüfung
 * (freies Brett, ADR-0001) – nur Konsistenz (z. B. Karte muss in der Hand sein)
 * und Sichtbarkeit werden gewahrt.
 */

import {
  type Ball,
  type BallPosition,
  type Card,
  cardLabel,
  COLOR_BY_SEAT,
  createInitialState,
  deal,
  type GameState,
  type HistoryEntry,
  type Player,
  type PublicGameState,
  type Seat,
  shuffle,
  TEAM_BY_SEAT,
} from "@tac/shared";

/** Menschlich lesbare Beschreibung einer Position (für den Verlauf). */
function describePosition(pos: BallPosition): string {
  switch (pos.kind) {
    case "VORFELD":
      return `Vorfeld ${COLOR_BY_SEAT[pos.owner]}`;
    case "FELD":
      return `Feld ${pos.index}`;
    case "HAUS":
      return `Haus ${COLOR_BY_SEAT[pos.owner]} #${pos.slot}`;
  }
}

/** Hängt einen Verlaufseintrag an und liefert einen neuen Zustand. */
function pushHistory(
  state: GameState,
  actor: Seat | null,
  text: string,
): GameState {
  const entry: HistoryEntry = {
    id: state.nextHistoryId,
    actor,
    text,
    timestamp: Date.now(),
  };
  return {
    ...state,
    history: [...state.history, entry],
    nextHistoryId: state.nextHistoryId + 1,
  };
}

/** Findet den Sitzplatz zu einer Kugel-ID (oder null). */
function seatOfBall(state: GameState, ballId: string): Seat | null {
  const ball = state.balls.find((b) => b.id === ballId);
  return ball ? ball.owner : null;
}

/**
 * Setzt eine Kugel auf eine neue Position. Liegt am Ziel bereits eine andere
 * Kugel (nur bei FELD relevant), wird diese in ihr Vorfeld zurückgelegt
 * ("geworfen"). REQ-BOARD B4.
 */
export function moveBall(
  state: GameState,
  ballId: string,
  to: BallPosition,
  actor: Seat | null,
): GameState {
  const moving = state.balls.find((b) => b.id === ballId);
  if (!moving) return state; // unbekannte Kugel: ignorieren (Konsistenz)

  const from = moving.position;
  let thrownText = "";

  const balls: Ball[] = state.balls.map((b) => {
    // Kugel am Zielfeld werfen (nur exakt gleiches Kreisfeld).
    if (
      b.id !== ballId &&
      to.kind === "FELD" &&
      b.position.kind === "FELD" &&
      b.position.index === to.index
    ) {
      thrownText = ` (${b.color} geworfen)`;
      return { ...b, position: { kind: "VORFELD", owner: b.owner } };
    }
    return b;
  });

  const next = balls.map((b) => (b.id === ballId ? { ...b, position: to } : b));

  const text = `${moving.color}: ${describePosition(from)} → ${describePosition(
    to,
  )}${thrownText}`;
  return pushHistory({ ...state, balls: next }, actor, text);
}

/**
 * Mischt den Reststapel und teilt reihum Karten aus (Standard 5, Meister 6).
 * Übrige Karten werden zum neuen Reststapel; alte Hände werden ersetzt.
 * REQ-BOARD K2.
 */
export function dealCards(
  state: GameState,
  cardsPerPlayer: number,
  rng: () => number = Math.random,
): GameState {
  const shuffled = shuffle(state.deck, rng);
  const { hands, rest } = deal(shuffled, cardsPerPlayer, 4);
  const withState: GameState = { ...state, hands, deck: rest };
  return pushHistory(
    withState,
    state.dealer,
    `Geber ${COLOR_BY_SEAT[state.dealer]}: ${cardsPerPlayer} Karten ausgeteilt`,
  );
}

/**
 * Spielt (legt offen ab) eine Karte aus der Hand eines Spielers.
 * Nur möglich, wenn die Karte tatsächlich in dessen Hand liegt (Konsistenz).
 * REQ-BOARD K4.
 */
export function playCard(
  state: GameState,
  seat: Seat,
  cardId: string,
): GameState {
  const hand = state.hands[seat] ?? [];
  const card = hand.find((c) => c.id === cardId);
  if (!card) return state;

  const hands = state.hands.map((h, i) =>
    i === seat ? h.filter((c) => c.id !== cardId) : h,
  );
  const withState: GameState = {
    ...state,
    hands,
    discardPile: [...state.discardPile, card],
  };
  return pushHistory(
    withState,
    seat,
    `${COLOR_BY_SEAT[seat]}: Karte ${cardLabel(card)} abgelegt`,
  );
}

/**
 * Legt eine Karte in den "Tauschbereich" mit dem Partner. Vereinfachte Variante:
 * Die Karte wird direkt aus der eigenen Hand in die Hand des Partners übergeben.
 * Die geführte 2-Phasen-Simultanität kann später ergänzt werden.
 * REQ-BOARD K5.
 */
export function swapWithPartner(
  state: GameState,
  seat: Seat,
  cardId: string,
): GameState {
  const partner = partnerSeat(seat);
  const hand = state.hands[seat] ?? [];
  const card = hand.find((c) => c.id === cardId);
  if (!card) return state;

  const hands = state.hands.map((h, i) => {
    if (i === seat) return h.filter((c) => c.id !== cardId);
    if (i === partner) return [...h, card];
    return h;
  });
  const withState: GameState = { ...state, hands };
  return pushHistory(
    withState,
    seat,
    `${COLOR_BY_SEAT[seat]}: Karte an Partner ${COLOR_BY_SEAT[partner]} getauscht`,
  );
}

/** Der gegenübersitzende Partner-Sitzplatz. */
export function partnerSeat(seat: Seat): Seat {
  return ((seat + 2) % 4) as Seat;
}

/** Setzt das Spiel zurück (behält belegte Sitzplätze/Spieler). */
export function resetGame(state: GameState): GameState {
  const fresh = createInitialState({
    masterMode: state.masterMode,
    dealer: state.dealer,
  });
  const withPlayers: GameState = { ...fresh, players: state.players };
  return pushHistory(withPlayers, null, "Spiel zurückgesetzt");
}

/** Aktiviert/deaktiviert die Meisterversion (baut den Stapel neu). */
export function setMasterMode(state: GameState, enabled: boolean): GameState {
  const fresh = createInitialState({ masterMode: enabled, dealer: state.dealer });
  const withPlayers: GameState = {
    ...fresh,
    players: state.players,
    history: state.history,
    nextHistoryId: state.nextHistoryId,
  };
  return pushHistory(
    withPlayers,
    null,
    enabled ? "Meisterversion aktiviert" : "Basisversion aktiviert",
  );
}

/**
 * Weist einem beitretenden Client einen Sitzplatz zu.
 * - Bevorzugt den gewünschten Platz, falls frei.
 * - Sonst den ersten freien Platz.
 * @returns neuer Zustand + zugewiesener Sitz (oder null, wenn voll)
 */
export function joinRoom(
  state: GameState,
  playerId: string,
  name: string,
  desiredSeat?: Seat,
): { state: GameState; seat: Seat | null } {
  // Reconnect: gleicher Name auf bereits belegtem Platz.
  const existing = state.players.findIndex((p) => p?.name === name);
  if (existing >= 0) {
    const seat = existing as Seat;
    const players = state.players.map((p, i) =>
      i === seat && p ? { ...p, id: playerId, connected: true } : p,
    );
    return { state: { ...state, players }, seat };
  }

  const isFree = (s: number) => state.players[s] == null;
  let seat: Seat | null = null;
  if (desiredSeat != null && isFree(desiredSeat)) {
    seat = desiredSeat;
  } else {
    const free = [0, 1, 2, 3].find(isFree);
    seat = free != null ? (free as Seat) : null;
  }
  if (seat == null) return { state, seat: null };

  const player: Player = {
    id: playerId,
    name,
    seat,
    team: TEAM_BY_SEAT[seat]!,
    color: COLOR_BY_SEAT[seat]!,
    connected: true,
  };
  const players = state.players.map((p, i) => (i === seat ? player : p));
  const withState = pushHistory(
    { ...state, players },
    seat,
    `${name} (${COLOR_BY_SEAT[seat]}) ist beigetreten`,
  );
  return { state: withState, seat };
}

/** Markiert den Spieler auf einem Sitz als getrennt. */
export function markDisconnected(state: GameState, seat: Seat): GameState {
  const players = state.players.map((p, i) =>
    i === seat && p ? { ...p, connected: false } : p,
  );
  return { ...state, players };
}

/**
 * Erzeugt die gefilterte, öffentliche Sicht für EINEN Spieler.
 * Fremde Hände werden auf Anzahl reduziert, der Reststapel auf Anzahl.
 * ARCH-OVERVIEW §6 (Sichtbarkeit/Fairness).
 */
export function toPublicState(
  state: GameState,
  viewer: Seat | null,
): PublicGameState {
  return {
    players: state.players,
    balls: state.balls,
    discardPile: state.discardPile,
    handCounts: state.hands.map((h) => h.length),
    ownHand: viewer != null ? (state.hands[viewer] ?? []) : [],
    deckCount: state.deck.length,
    dealer: state.dealer,
    masterMode: state.masterMode,
    history: state.history,
  };
}

/** Hilfs-Export für Tests/Server: Karte in einer Hand suchen. */
export function findCardInHand(
  state: GameState,
  seat: Seat,
  cardId: string,
): Card | undefined {
  return (state.hands[seat] ?? []).find((c) => c.id === cardId);
}

export { seatOfBall };
