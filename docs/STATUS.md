# Projektstatus & Handover für die nächste Session

**Kennung:** `STATUS`
**Stand:** 2026-09-21
**Zweck:** Schneller Wiedereinstieg – was ist da, was ist offen, wie startet man.

---

## 1. Kurzüberblick

**TAC Online** – ein digitales, **freies Brett** für das Brettspiel TAC (4 Spieler,
2 Teams), damit ein fester Freundeskreis übers Internet spielen kann. Der Computer
**erzwingt keine Regeln** (bewusst, siehe ADR-0001): Spieler ziehen die Kugeln
selbst wie am echten Tisch. Karten werden digital verwaltet, ein Verlauf zeigt die
letzten Züge.

**Wichtige Grundentscheidungen:**
- `docs/decisions/ADR-0001-freies-brett.md` – freies Brett statt Regel-Engine.
- `docs/decisions/ADR-0002-hosting-und-sitzplatz-links.md` – Heim-Server +
  Sitzplatz-Links, Tunnel-Optionen (nur Planung).
- `docs/decisions/ADR-0003-windows-subst-pfad.md` – Windows-`subst`-Pfadproblem
  (relevant fürs lokale Entwickeln).

---

## 2. Aktueller Umsetzungsstand

Monorepo mit drei Paketen (npm workspaces, TypeScript strict, Vitest):

### `@tac/shared` (fertig, getestet)
Gemeinsame Typen & reine Funktionen. Keine Regellogik.
- `domain.ts` – Sitzplätze, Teams, Farben, Kugeln, Positionen
  (`VORFELD | FELD(0..63) | HAUS(slot)`).
- `cards.ts` – Kartentypen, Deck-Häufigkeiten, Meisterkarten, `cardLabel`.
- `deck.ts` – `buildDeck` (100 Basis / 104 Meister), `shuffle` (Fisher-Yates,
  rein/deterministisch), `deal` (reihum, 5 bzw. 6 Karten).
- `state.ts` – `GameState` + `PublicGameState` (mit Sichtbarkeitsfilter).
- `initialState.ts` – Startzustand (alle Kugeln im Vorfeld).
- `messages.ts` – `ClientAction` & `ServerMessage` (Netzwerk).

### `@tac/server` (fertig, getestet, End-to-End verifiziert)
WebSocket-Server = **State-Synchronisierer** (kein Schiedsrichter).
- `room.ts` – reine, testbare Logik: `moveBall` (freies Ziehen + Werfen am
  Zielfeld), `dealCards`, `playCard`, `swapWithPartner`, `joinRoom` (Sitzvergabe
  + Reconnect über Namen), `resetGame`, `setMasterMode`, `toPublicState`
  (Sichtbarkeitsfilter), Verlaufseinträge.
- `server.ts` – WebSocket-Transport: Räume, Aktionen anwenden, gefilterter
  Broadcast (jeder Client sieht nur die eigene Hand).
- `index.ts` – Start (Port 3001, per `PORT` konfigurierbar).
- Laufzeit über `tsx` (Node löst `.js`→`.ts` nicht nativ auf).

### `@tac/client` (funktional fertig, im Browser noch NICHT vom Nutzer bestätigt)
React + Vite, schematisches SVG-Brett.
- `board/geometry.ts` – reine, getestete Feldkoordinaten (Kreis, Startfelder
  0/16/32/48, Häuser radial nach innen, Vorfelder).
- `board/Board.tsx` – SVG-Brett; Kugeln per Drag & Drop frei bewegbar
  (REQ-BOARD B3) mit **Herkunfts-Marker** (B4a), Snapping auf nächstes Ziel.
- `net/useTacSocket.ts` – WebSocket-Hook.
- `ui/Hand.tsx`, `ui/HistoryPanel.tsx`, `ui/JoinScreen.tsx` – Handkarten,
  Verlauf, Beitritt (mit URL-Parametern `?room=&name=&seat=`).
- `App.tsx` / `main.tsx` – Zusammenbau, Steuerung (Geben/Meister/Reset).

**Tests:** 45 Vitest-Tests, alle grün. `npm run typecheck` sauber.
`npm run build` (Client) läuft.

---

## 3. Lokal starten

> Voraussetzung: Node >= 20 (entwickelt mit Node 26), npm >= 10.
> **Wichtig (Windows):** In diesem Setup existiert ein `subst`-Laufwerk
> `D:\ => C:\_projects\fislw\`. **Immer auf dem C:-Pfad arbeiten**
> (`C:\_projects\fislw\ai-development\tac`), nicht über `D:`. Siehe ADR-0003.

```bash
npm install

# Terminal 1 – Server (WebSocket, Port 3001)
npm run dev:server

# Terminal 2 – Client (Vite, http://localhost:5173)
npm run dev:client
```

Pro Spieler ein Browser-Tab auf `http://localhost:5173`. Beitritt per Link
vorbelegbar: `http://localhost:5173/?room=abc&name=Anna&seat=0`.

**Tests / Checks:**
```bash
npm test           # alle Vitest-Tests
npm run typecheck  # tsc --build über alle Pakete
```

---

## 4. Offene Punkte / Nächste Schritte

### Sofort (offen aus dieser Session)
- [ ] **Client im Browser verifizieren.** Der Nutzer hatte einen
      `Failed to load url /src/main.tsx`-Fehler (Ursache: Windows-`subst`,
      siehe ADR-0003). Fix in `vite.config.ts` gesetzt (direkter Pfad, kein
      `realpath`). **Muss vom Nutzer auf dem C:-Pfad final bestätigt werden.**
      Falls weiter Fehler: vollständige Vite-Startausgabe + Browser-Konsole (F12)
      einholen; prüfen, ob Terminal wirklich auf C: läuft (`pwd`).

### Als Nächstes geplant
- [ ] Manuelles 4-Spieler-Spiel lokal testen (Drag & Drop, Sync, Wurf-Gefühl).
- [ ] **Design-Beispiele** für zwei Optik-Richtungen erstellen (Wunsch des
      Nutzers): (a) modern-flach/digital-nativ, (b) hochwertig-realistisch
      (Holz/Murmeln, ohne "künstlichen" 3D-Look). Siehe REQ-BOARD §7.
- [ ] UI-Feinschliff Wurf-Interaktion (REQ-BOARD B4b) und Snapping.
- [ ] Tauschphase ggf. "geführt" (simultanes 1-Karten-Tauschen) statt direkter
      Übergabe – aktuell vereinfacht (`swapWithPartner`).

### Später / optional
- [ ] Hosting umsetzen (ADR-0002): Sitzplatz-Link-Erzeugung im Client,
      Cloudflare Tunnel o. Ä.
- [ ] Optionale, **nicht-verbietende** Regel-Hilfen (auf Basis von REQ-RULES).
- [ ] Optionales Undo (letzten Zug zurücknehmen) für Verklicker.
- [ ] Exakte Deck-Zusammensetzung je Kartenwert verifizieren (aktuell sinnvolle
      Annäherung in `cards.ts`, siehe REQ-RULES §3 / offener Punkt).

---

## 5. Wichtige Hinweise / Fallstricke

- **Regelheft-PDF** ist urheberrechtlich geschützt (© TAC Verlag) und via
  `.gitignore` vom Repo ausgeschlossen. Regeln sind in eigenen Worten in
  `REQ-RULES` dokumentiert (nur Referenz, nicht erzwungen).
- **Node + TS-Imports:** `.js`-Endungen in Imports sind korrekt (NodeNext/Bundler).
  Server läuft über `tsx`, Client über Vite. Native `node`-Ausführung der
  `.ts`-Dateien klappt nicht direkt.
- **Windows `subst`:** siehe ADR-0003. Nur auf C: arbeiten.
- **Hängende Dev-Prozesse:** Unter Git-Bash/Windows beenden `Strg+C` bzw. `pkill`
  Vite-Prozesse teils nicht sauber. Prüfen mit
  `netstat -ano | findstr :5173` und ggf. `taskkill /PID <PID> /F`.
- **Commits/Push:** nur auf ausdrücklichen Wunsch (AGENTS.md). Commit-Messages
  englisch, mit `refs:`-Traceability.

---

## 6. Dokumenten-Landkarte

- `docs/requirements/REQ-BOARD.md` – **primäre** Anforderung (freies Brett).
- `docs/requirements/REQ-RULES.md` – Spielregeln als Referenz (nicht erzwungen).
- `docs/architecture/ARCH-OVERVIEW.md` – Architektur (Server, State, Netzwerk).
- `docs/decisions/ADR-0001..0003` – Entscheidungen.
- `CHANGELOG.md` – Änderungsverlauf.
- `README.md` – Setup & Struktur.
