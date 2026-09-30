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
  type PublicDevilRequest,
  type PublicTradeOffer,
  type Seat,
  shuffle,
  TEAM_BY_SEAT,
} from "@tac/shared";

/** Menschlich lesbare Beschreibung einer Position (für den Verlauf). */
function describePosition(state: GameState, pos: BallPosition): string {
  switch (pos.kind) {
    case "VORFELD":
      return `Vorfeld ${seatLabel(state, pos.owner)}`;
    case "FELD":
      return `Feld ${pos.index}`;
    case "HAUS":
      return `Haus ${seatLabel(state, pos.owner)} #${pos.slot}`;
  }
}

/**
 * Anzeigename eines Sitzplatzes für den Verlauf: der Spielername, falls ein
 * Spieler auf dem Sitz sitzt, sonst die Farbe als Fallback (unbesetzter Platz).
 */
function seatLabel(state: GameState, seat: Seat): string {
  const player = state.players[seat];
  return player?.name ?? COLOR_BY_SEAT[seat];
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
 * Setzt eine Kugel auf eine neue Position (freies Bewegen, REQ-BOARD B3).
 * Es wird NICHT mehr automatisch geworfen: Zwei Kugeln können denselben Platz
 * belegen (der Client bietet zum Umsortieren/Tauschen das Klick-Modell B3a).
 * Wer eine Kugel ins Vorfeld schicken will, setzt sie dorthin.
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
  const next = state.balls.map((b) =>
    b.id === ballId ? { ...b, position: to } : b,
  );

  const text = `${seatLabel(state, moving.owner)}: ${describePosition(
    state,
    from,
  )} → ${describePosition(state, to)}`;
  return pushHistory(
    { ...state, balls: next, lastBallMove: { ballId, from, to } },
    actor,
    text,
  );
}

/**
 * Tauscht die Positionen zweier Kugeln (REQ-BOARD B3a, entspricht Trickser).
 * Ignoriert, wenn eine der Kugeln unbekannt ist oder beide identisch sind.
 */
export function swapBalls(
  state: GameState,
  ballAId: string,
  ballBId: string,
  actor: Seat | null,
): GameState {
  if (ballAId === ballBId) return state;
  const a = state.balls.find((b) => b.id === ballAId);
  const b = state.balls.find((x) => x.id === ballBId);
  if (!a || !b) return state;

  const next = state.balls.map((ball) => {
    if (ball.id === ballAId) return { ...ball, position: b.position };
    if (ball.id === ballBId) return { ...ball, position: a.position };
    return ball;
  });

  const actorLabel = actor != null ? `${seatLabel(state, actor)}: ` : "";
  const text = `${actorLabel}${a.color} ↔ ${b.color} getauscht`;
  return pushHistory({ ...state, balls: next }, actor, text);
}

/**
 * Teilt reihum Karten aus (Standard 5, Meister 6), OHNE zu mischen.
 * Der Reststapel liegt bereits gemischt bereit (initial in `createInitialState`
 * bzw. nach `shuffleDiscard`); `Geben` zieht nur von oben – wie am echten Tisch.
 * Übrige Karten bleiben Reststapel; alte Hände werden ersetzt.
 * REQ-BOARD K2.
 */
export function dealCards(
  state: GameState,
  _cardsPerPlayer = 5,
  actor?: Seat,
): GameState {
  // A deal is only possible after the previous hands have been played.
  if (state.hands.some((hand) => hand.length > 0)) return state;
  if (state.deck.length < 20) return state;

  // Wer darf geben? Der aktuelle Stapelhalter (`deckHolder`), oder – solange der
  // Stapel in der Mitte liegt (Rundenstart) – der aktuelle Geber (`dealer`).
  const currentDealer = state.deckHolder ?? state.dealer;
  // Nur der zuständige Geber darf den Stapel auslösen.
  if (actor != null && actor !== currentDealer) return state;

  // The master deck has four regular rounds and one final six-card round.
  const cardsPerPlayer = state.masterMode && state.deck.length === 24 ? 6 : 5;
  const { hands, rest } = deal(state.deck, cardsPerPlayer, 4);
  // Nach dem Geben wandert der Stapel zum nächsten Geber (gegen den
  // Uhrzeigersinn) und ruht dort, bis die Runde ausgespielt ist.
  const nextDealer = ((currentDealer + 3) % 4) as Seat;
  const withState: GameState = {
    ...state,
    hands,
    deck: rest,
    dealer: currentDealer,
    deckHolder: nextDealer,
    // The visible middle is the current round's discard area. The complete
    // discardPile remains the separate archive.
    discardEntries: [],
    tradeOffers: [],
    // Neue Runde: jeder darf wieder genau einmal mit dem Partner tauschen.
    tradeDone: [],
  };
  return pushHistory(
    withState,
    currentDealer,
    `Geber ${seatLabel(state, currentDealer)}: ${cardsPerPlayer} Karten ausgeteilt; nächste Runde gibt ${seatLabel(state, nextDealer)}`,
  );
}

/**
 * Mischt den separaten Ablagestapel zurück in den Reststapel.
 * Das ist erst möglich, wenn alle Handkarten gespielt und der Reststapel leer ist.
 */
export function shuffleDiscard(
  state: GameState,
  rng: () => number = Math.random,
  actor?: Seat,
): GameState {
  if (state.deck.length > 0 || state.hands.some((hand) => hand.length > 0)) {
    return state;
  }
  if (state.discardPile.length === 0) return state;

  const dealer = actor ?? state.dealer;
  return pushHistory(
    {
      ...state,
      deck: shuffle(state.discardPile, rng),
      discardPile: [],
      discardEntries: [],
    },
    dealer,
    `Ablagestapel gemischt; ${state.discardPile.length} Karten stehen wieder zum Geben bereit`,
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
    discardEntries: [
      ...state.discardEntries,
      {
        card,
        actor: seat,
        timestamp: Date.now(),
        offset: state.discardEntries.length % 7,
        rotation: ((state.discardEntries.length * 13) % 15) - 7,
      },
    ],
  };
  return pushHistory(
    withState,
    seat,
    `${seatLabel(state, seat)}: Karte ${cardLabel(card)} abgelegt`,
  );
}

/** Nimmt die eigene zuletzt abgelegte Karte wieder auf (REQ-BOARD K4b). */
export function returnCard(
  state: GameState,
  seat: Seat,
  cardId: string,
): GameState {
  let entryIndex = -1;
  for (let index = state.discardEntries.length - 1; index >= 0; index--) {
    const entry = state.discardEntries[index];
    if (entry?.actor === seat && entry.card.id === cardId) {
      entryIndex = index;
      break;
    }
  }
  if (entryIndex < 0) return state;

  const entry = state.discardEntries[entryIndex]!;
  let pileIndex = -1;
  for (let index = state.discardPile.length - 1; index >= 0; index--) {
    if (state.discardPile[index]?.id === cardId) {
      pileIndex = index;
      break;
    }
  }
  if (pileIndex < 0) return state;
  const discardPile = state.discardPile.filter((_, index) => index !== pileIndex);
  const discardEntries = state.discardEntries.filter((_, index) => index !== entryIndex);
  const hands = state.hands.map((hand, index) =>
    index === seat ? [...hand, entry.card] : hand,
  );
  return pushHistory(
    { ...state, hands, discardPile, discardEntries },
    seat,
    `${seatLabel(state, seat)}: Karte ${cardLabel(entry.card)} zurückgenommen`,
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
    `${seatLabel(state, seat)}: Karte an Partner ${seatLabel(state, partner)} getauscht`,
  );
}

/**
 * Legt eine Karte verdeckt für den gegenüberliegenden Partner bereit.
 *
 * Regeln (freiwilliger Partnertausch, genau 1× pro Runde):
 * - Wer in dieser Runde bereits fertig getauscht hat (`tradeDone`), darf kein
 *   neues Angebot mehr machen.
 * - Hat der Partner die eigene Karte bereits genommen (eigenes Angebot mit
 *   `claimed`), ist der Tausch von dieser Seite abgeschlossen: kein neues Angebot.
 * - Solange der Partner das eigene Angebot NOCH NICHT genommen hat, ersetzt ein
 *   neues Angebot das alte: die zuvor angebotene Karte kommt zurück auf die
 *   Hand, die neue Karte liegt bereit. So kann man vor dem Zugriff des Partners
 *   die angebotene Karte wechseln.
 */
export function offerCardToPartner(
  state: GameState,
  seat: Seat,
  cardId: string,
): GameState {
  if (state.tradeDone.includes(seat)) return state;
  // Hat der Partner die eigene, zuvor angebotene Karte bereits genommen, ist der
  // Tausch von dieser Seite abgeschlossen: kein weiteres Angebot in dieser Runde.
  if (state.tradeOffers.some((item) => item.from === seat && item.claimed)) {
    return state;
  }
  const partner = partnerSeat(seat);
  const card = state.hands[seat]?.find((item) => item.id === cardId);
  if (!card) return state;

  // Bestehendes eigenes, noch nicht genommenes Angebot zurück auf die Hand.
  const priorOffer = state.tradeOffers.find(
    (item) => item.from === seat && !item.claimed,
  );
  const remainingOffers = state.tradeOffers.filter(
    (item) => !(item.from === seat && !item.claimed),
  );
  const handAfterReturn = priorOffer
    ? state.hands.map((hand, index) =>
        index === seat ? [...hand, priorOffer.card] : hand,
      )
    : state.hands;

  const hands = handAfterReturn.map((hand, index) =>
    index === seat ? hand.filter((item) => item.id !== cardId) : hand,
  );
  const offer = {
    id: `trade-${state.nextTradeOfferId}`,
    from: seat,
    to: partner,
    card,
    claimed: false,
  };
  return pushHistory(
    { ...state, hands, tradeOffers: [...remainingOffers, offer], nextTradeOfferId: state.nextTradeOfferId + 1 },
    seat,
    `${seatLabel(state, seat)}: Karte verdeckt für Partner bereitgelegt`,
  );
}

/**
 * Nimmt ein eigenes, verdecktes Partnerangebot an ("jeder nimmt selbst").
 *
 * Regeln:
 * - Nehmen ist erst möglich, wenn man SELBST schon eine Karte angeboten hat
 *   (fairer Gleichzeitig-Tausch: keiner sieht die Partnerkarte, ohne selbst
 *   abgegeben zu haben).
 * - Nach dem Nehmen ist der Sitz für diese Runde fertig (`tradeDone`) und darf
 *   nichts mehr anbieten.
 */
export function claimTradeOffer(
  state: GameState,
  seat: Seat,
  offerId: string,
): GameState {
  const offer = state.tradeOffers.find(
    (item) => item.id === offerId && item.to === seat && !item.claimed,
  );
  if (!offer) return state;
  // Man muss selbst schon angeboten haben (offenes oder genommenes Angebot).
  const hasOwnOffer = state.tradeOffers.some((item) => item.from === seat);
  if (!hasOwnOffer) return state;

  const tradeOffers = state.tradeOffers.map((item) =>
    item.id === offerId ? { ...item, claimed: true } : item,
  );
  const hands = state.hands.map((hand, index) =>
    index === seat ? [...hand, offer.card] : hand,
  );
  const tradeDone = state.tradeDone.includes(seat)
    ? state.tradeDone
    : [...state.tradeDone, seat];
  return pushHistory(
    { ...state, hands, tradeOffers, tradeDone },
    seat,
    `${seatLabel(state, seat)}: Partnerkarte genommen`,
  );
}

/**
 * Zieht ein eigenes, verdecktes Partnerangebot zurück, solange der Partner es
 * noch NICHT beansprucht hat. Die Karte wandert zurück auf die Hand des
 * Absenders. Nur der Absender (`from`) darf zurückziehen.
 *
 * Zusätzliche Sperre: Wer in dieser Runde selbst bereits die Partnerkarte
 * genommen hat (`tradeDone`), hat den Tausch für sich abgeschlossen und darf
 * sein eigenes Angebot nicht mehr zurückziehen.
 */
export function revokeTradeOffer(
  state: GameState,
  seat: Seat,
  offerId: string,
): GameState {
  if (state.tradeDone.includes(seat)) return state;
  const offer = state.tradeOffers.find(
    (item) => item.id === offerId && item.from === seat && !item.claimed,
  );
  if (!offer) return state;
  const tradeOffers = state.tradeOffers.filter((item) => item.id !== offerId);
  const hands = state.hands.map((hand, index) =>
    index === seat ? [...hand, offer.card] : hand,
  );
  return pushHistory(
    { ...state, hands, tradeOffers },
    seat,
    `${seatLabel(state, seat)}: Partnerangebot zurückgezogen`,
  );
}

/** Fragt den Zielspieler um Erlaubnis, seine Hand für den Teufel zu sehen. */
export function requestDevilView(state: GameState, controller: Seat, target: Seat): GameState {
  if (target !== leftNeighborSeat(controller)) return state;
  // Keine doppelte offene Anfrage desselben Controllers an dasselbe Ziel.
  if (state.devilRequests.some((item) => item.controller === controller && item.target === target)) {
    return state;
  }
  const request = {
    id: `devil-${state.nextDevilRequestId}`,
    controller,
    target,
    approved: false,
  };
  return pushHistory(
    { ...state, devilRequests: [...state.devilRequests, request], nextDevilRequestId: state.nextDevilRequestId + 1 },
    controller,
    `${seatLabel(state, controller)} fragt ${seatLabel(state, target)} um Teufel-Handeinsicht`,
  );
}

/** The seat immediately to the left in the clockwise table order. */
export function leftNeighborSeat(seat: Seat): Seat {
  return ((seat + 1) % 4) as Seat;
}

/** Bestätigt die Einsicht, ohne die Zielhand an andere Spieler zu senden. */
export function approveDevilView(state: GameState, target: Seat, requestId: string): GameState {
  const request = state.devilRequests.find((item) => item.id === requestId && item.target === target && !item.approved);
  if (!request) return state;
  const devilRequests = state.devilRequests.map((item) => item.id === requestId ? { ...item, approved: true } : item);
  return pushHistory({ ...state, devilRequests }, target, `${seatLabel(state, target)} erlaubt die Teufel-Handeinsicht`);
}

/**
 * Der Zielspieler LEHNT die Teufel-Handeinsicht ab. Die Anfrage wird entfernt
 * und im Verlauf protokolliert (Transparenz gegen Schummeln).
 */
export function declineDevilView(state: GameState, target: Seat, requestId: string): GameState {
  const request = state.devilRequests.find((item) => item.id === requestId && item.target === target && !item.approved);
  if (!request) return state;
  const devilRequests = state.devilRequests.filter((item) => item.id !== requestId);
  return pushHistory(
    { ...state, devilRequests },
    target,
    `${seatLabel(state, target)} lehnt die Teufel-Handeinsicht ab`,
  );
}

/**
 * Der anfragende Spieler (Controller) BRICHT seine eigene Teufel-Anfrage ab –
 * egal ob noch offen oder bereits bestätigt. Wird im Verlauf protokolliert.
 */
export function cancelDevilView(state: GameState, controller: Seat, requestId: string): GameState {
  const request = state.devilRequests.find((item) => item.id === requestId && item.controller === controller);
  if (!request) return state;
  const devilRequests = state.devilRequests.filter((item) => item.id !== requestId);
  return pushHistory(
    { ...state, devilRequests },
    controller,
    `${seatLabel(state, controller)} bricht die Teufel-Anfrage an ${seatLabel(state, request.target)} ab`,
  );
}

/** Spielt genau eine Karte aus der bestätigten fremden Hand offen aus. */
export function playForeignCard(state: GameState, controller: Seat, requestId: string, cardId: string): GameState {
  const request = state.devilRequests.find((item) => item.id === requestId && item.controller === controller && item.approved);
  if (!request) return state;
  const card = state.hands[request.target]?.find((item) => item.id === cardId);
  if (!card) return state;
  const devilRequests = state.devilRequests.filter((item) => item.id !== requestId);
  return playCard(
    { ...state, devilRequests },
    request.target,
    cardId,
  );
}

/** Gibt alle Hände verdeckt an den rechten Nachbarn weiter (Narr). */
export function passHandsRight(state: GameState, actor: Seat): GameState {
  const hands = state.hands.map((_, index) => state.hands[(index + 3) % 4] ?? []);
  return pushHistory({ ...state, hands }, actor, `${seatLabel(state, actor)}: Alle Hände an den rechten Nachbarn weitergegeben`);
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
 *
 * Regeln:
 * - **Expliziter Wunschsitz (`desiredSeat` gesetzt):** Der Beitretende bekommt
 *   diesen Platz IMMER – auch wenn dort bereits jemand sitzt (der bisherige
 *   Spieler wird verdrängt, egal ob online oder getrennt). So macht ein
 *   Sitzplatz-Link den Platz gezielt frei. Der verdrängte Sitz wird zusätzlich
 *   zurückgegeben, damit der Transport dessen alte Verbindung aufräumen kann.
 * - **Kein Wunschsitz (Auto-Join):** Reconnect über den Namen (gleicher Name →
 *   alter Platz); sonst der erste freie Platz. Es wird niemand verdrängt.
 *
 * @returns neuer Zustand, zugewiesener Sitz (oder null, wenn voll) und der
 *          Sitz, dessen bisheriger Spieler verdrängt wurde (oder null).
 */
export function joinRoom(
  state: GameState,
  playerId: string,
  name: string,
  desiredSeat?: Seat,
): { state: GameState; seat: Seat | null; displaced: Seat | null } {
  // Fall A: Expliziter Wunschsitz – immer übernehmen, ggf. verdrängen.
  if (desiredSeat != null) {
    const previous = state.players[desiredSeat];
    const displaced =
      previous != null && previous.name !== name ? desiredSeat : null;
    const player: Player = {
      id: playerId,
      name,
      seat: desiredSeat,
      team: TEAM_BY_SEAT[desiredSeat]!,
      color: COLOR_BY_SEAT[desiredSeat]!,
      connected: true,
    };
    const players = state.players.map((p, i) =>
      i === desiredSeat ? player : p,
    );
    const note = displaced != null
      ? `${name} (${COLOR_BY_SEAT[desiredSeat]}) übernimmt den Platz von ${previous!.name}`
      : `${name} (${COLOR_BY_SEAT[desiredSeat]}) ist beigetreten`;
    const withState = pushHistory({ ...state, players }, desiredSeat, note);
    return { state: withState, seat: desiredSeat, displaced };
  }

  // Fall B: Auto-Join – Reconnect über Namen, sonst erster freier Platz.
  const existing = state.players.findIndex((p) => p?.name === name);
  if (existing >= 0) {
    const seat = existing as Seat;
    const players = state.players.map((p, i) =>
      i === seat && p ? { ...p, id: playerId, connected: true } : p,
    );
    return { state: { ...state, players }, seat, displaced: null };
  }

  const isFree = (s: number) => state.players[s] == null;
  const free = [0, 1, 2, 3].find(isFree);
  const seat: Seat | null = free != null ? (free as Seat) : null;
  if (seat == null) return { state, seat: null, displaced: null };

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
  return { state: withState, seat, displaced: null };
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
    discardEntries: state.discardEntries,
    tradeOffers: state.tradeOffers.filter((offer) => offer.from === viewer || offer.to === viewer).map((offer): PublicTradeOffer => ({
      id: offer.id,
      from: offer.from,
      to: offer.to,
      claimed: offer.claimed,
      ...(offer.from === viewer || offer.claimed ? { card: offer.card } : {}),
    })),
    tradeDone: state.tradeDone,
    lastBallMove: state.lastBallMove,
    devilRequests: state.devilRequests.map((request): PublicDevilRequest => ({
      ...request,
      ...(request.approved && request.controller === viewer ? { visibleCards: state.hands[request.target] ?? [] } : {}),
    })),
    handCounts: state.hands.map((h) => h.length),
    ownHand: viewer != null ? (state.hands[viewer] ?? []) : [],
    deckCount: state.deck.length,
    dealer: state.dealer,
    deckHolder: state.deckHolder,
    // Klickbar/„geben" ist der Stapel nur, wenn keine Handkarten mehr im Spiel
    // sind und genügend Karten im Reststapel liegen.
    deckActive:
      state.hands.every((hand) => hand.length === 0) && state.deck.length >= 20,
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
