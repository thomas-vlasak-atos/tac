# Architektur: TAC Online (Freies Brett)

**Kennung:** `ARCH-OVERVIEW`
**Version:** 0.2 (Entwurf)
**Stand:** 2026-09-21

> Bezug: `REQ-BOARD` (primär, aktiv), `REQ-RULES` (Referenz, nicht erzwungen),
> `docs/decisions/ADR-0001` (Entscheidung freies Brett statt Regel-Engine).
>
> Ziel: Ein synchronisiertes, freies TAC-Brett für 4 Freunde. Der Server ist
> **State-Synchronisierer**, kein Regel-Schiedsrichter.

---

## 1. Leitprinzipien

- **Synchronisierter geteilter Zustand:** Der Server hält den aktuellen
  Brett-/Kartenzustand und verteilt Änderungen an alle Clients. Er prüft
  **keine** Spielregeln, aber grundlegende Konsistenz/Sichtbarkeit (z. B. dass
  ein Spieler nur seine eigene Hand sieht).
- **Dünne Domäne:** Es gibt keine komplexe Spiel-Engine. Aktionen sind einfache,
  atomare Zustandsänderungen (Kugel bewegen, Karte legen, geben, tauschen).
- **Geteilte Typen:** State- und Nachrichtentypen liegen in einem gemeinsamen
  Paket und werden von Client und Server importiert.

## 2. Monorepo-Struktur

```
/packages
  /shared     -> gemeinsame Typen: GameState, Aktionen, Netzwerk-Nachrichten
                 (+ Karten-Deck-Definition, Mischen/Austeilen als reine Funktionen)
  /server     -> Node-Backend (WebSocket): Räume, State halten, Broadcast,
                 Sichtbarkeitsfilter (eigene Hand privat)
  /client     -> React + Vite Frontend: Brett-UI (Drag&Drop), Handkarten,
                 Ablage, Tauschen, Verlauf
/docs         -> Requirements, Architektur, Decisions
```

Tooling: npm workspaces, TypeScript überall, Vitest für Tests.

> Hinweis: Das frühere Paket `engine` (Regeldurchsetzung) entfällt. Regellogik
> wird nicht implementiert (siehe ADR-0001). Reine, testbare Helfer (Mischen,
> Austeilen, Verlauf-Einträge bilden) liegen in `shared`.

## 3. Zustandsmodell (GameState)

Serialisierbar (JSON), bewusst einfach:

- `players[4]`: id, name, team (A/B), seat (0..3), connected
- `balls[16]`: id, color, position
  - `position = { kind: "VORFELD", owner } | { kind: "FELD", index }
                 | { kind: "HAUS", owner, slot }`
  - (Felder rein als Koordinaten/Slots – **ohne** Regelbedeutung.)
- `deck`: verbleibende Karten (serverseitig, verdeckt)
- `discardPile`: offen abgelegte Karten (für alle sichtbar)
- `hands[playerId]`: Karten – **nur** an den jeweiligen Spieler ausgeliefert
- `dealer`, `masterMode`
- `history[]`: Liste von Verlaufseinträgen (`{ actor, text, timestamp }`)

Es gibt **keine** `phase`/`currentPlayer`-Erzwingung. Optionaler, rein
informativer "Am Zug"-Marker kann später ergänzt werden (ohne Sperre).

## 4. Aktionen (Client → Server)

Atomar, ohne Regelprüfung:

- `MoveBall { ballId, to }` – Kugel auf beliebiges Feld/Vorfeld/Haus setzen.
  Server ergänzt automatisch Verlaufseintrag; bei Ziel = besetztes Feld optional
  "geworfene" Kugel ins Vorfeld (REQ-BOARD B4).
- `DealCards` – mischen & austeilen (5 bzw. 6 Karten).
- `PlayCard { cardId }` – Karte aus eigener Hand offen in `discardPile`.
- `SwapWithPartner { cardId }` – Tauschphase.
- `Announce { canOpen: boolean }` – Melden (informativ).
- `ToggleMasterMode`, `ResetGame` – Sitzungssteuerung.

## 5. Nachrichten (Server → Client)

- `StateUpdate` – **gefiltert**: öffentlicher Zustand + nur die eigene Hand.
- `PlayerJoined/Left`, `Error`.
- Reconnect: Client meldet Raum-ID + Name → Server ordnet Sitzplatz zu und sendet
  aktuellen (gefilterten) Zustand.

## 6. Sichtbarkeit / Fairness

- Der Server ist die einzige Stelle, die alle Hände kennt. Jeder Client bekommt
  ausschließlich seine eigene Hand. So bleibt verdeckt, was verdeckt sein soll –
  auch ohne Regelerzwingung.
- Alles andere (wer welche Kugel wohin zieht) ist offen und wird synchronisiert.

## 7. Frontend (Client)

- **Brett:** SVG/Canvas mit definierten Feld-Koordinaten; Kugeln als Drag&Drop-
  Elemente mit Snapping.
- **Hand:** eigene Karten unten, spielbar per Klick/Drag in die Ablage.
- **Ablage & Tausch:** sichtbare Mitte; Tausch-UI zum Partner.
- **Verlauf:** ein-/ausblendbares Panel mit der Zugliste (REQ-BOARD H1–H3).

## 8. Deployment (später)

Lokal zuerst (`server` + `client` dev). Internet später über einen kleinen
Node-Host mit WebSocket über TLS. Entscheidung als eigener ADR, sobald relevant.

## 9. Nächste Schritte

1. Monorepo-Grundgerüst (npm workspaces, TS, Vitest).
2. `shared`: GameState-Typen, Deck-Definition, Mischen/Austeilen (mit Tests).
3. `server`: WebSocket-Raum, State halten, Broadcast, Sichtbarkeitsfilter.
4. `client`: Brett + Drag&Drop + Hand + Ablage + Verlauf.
5. Ende-zu-Ende: 4 Browser lokal, eine Partie frei spielbar.
