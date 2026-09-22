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

### `@tac/client` (funktional fertig, im Browser bestätigt lauffähig)
React + Vite, schematisches SVG-Brett.
- `board/geometry.ts` – reine, getestete Feldkoordinaten (Kreis, Startfelder
  0/16/32/48, Häuser radial nach innen, Vorfelder – alles im Bild).
- `board/Board.tsx` – SVG-Brett; **Klick-Bedienung** (REQ-BOARD B3a): Kugel
  anklicken = aufnehmen, freies Feld = setzen, andere Kugel = tauschen
  (Trickser). Leere Plätze sichtbar (B7).
- `net/useTacSocket.ts` – WebSocket-Hook (robust gegen StrictMode-Doppel-Mount).
- `ui/Hand.tsx`, `ui/HistoryPanel.tsx`, `ui/JoinScreen.tsx` – Handkarten,
  Verlauf, Beitritt (mit URL-Parametern `?room=&name=&seat=`).
- `App.tsx` / `main.tsx` – Zusammenbau, Steuerung (Geben/Meister/Reset).

**Tests:** 48 Vitest-Tests, alle grün. `npm run typecheck` sauber.
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
- [ ] **Feinschliff der Bedienung** im echten Spiel testen (zu viert):
      Drag & Drop, gefächerte Kugeln auf gleichem Feld, Orientierung.
- [x] Client lädt im Browser (Windows-`subst`-Problem gelöst, ADR-0003).
- [x] WebSocket-Verbindung stabil (StrictMode-Doppel-Mount behoben).

### Layout/UX – dokumentiert, noch nicht umgesetzt (fürs finale Layout)
- [x] **B4b – Quellfeld markieren:** beim Ziehen das Ausgangsfeld der Kugel
      hervorheben (Sicherheit bei Rückwärts/TAC/Verklicken).
- [x] **B8 – Eigene Perspektive unten:** Brett je Spieler so drehen, dass der
      eigene Sitzplatz unten liegt; eigenen Platz/Farbe deutlich markieren.
      (Aktuell ist immer Blau/Sitz 0 unten, unabhängig vom eigenen Platz.)
- [x] **K4 – Ablage in der Mitte** (wie echtes TAC) statt separater Liste.
- [x] **K4a – Urheber sichtbar:** an jeder abgelegten Karte erkennen, wer sie
      gelegt hat (Server kennt den Handelnden bereits).
- [x] **K4b – Karte zurücknehmen:** versehentlich/zu früh gelegte Karte zurück
      auf die Hand holen (ohne Regelprüfung, Vertrauen wie offline).
- [x] **K4c – Natürlicher Kartenstapel (Gimmick):** Karten in der Mitte leicht
      zufällig versetzt/gedreht darstellen (wie echt); optional, verzichtbar.
- [~] **K4d – Runden-Ablagestapel + Einsicht:** Die letzten Karten werden als
      sichtbarer Stapel überlagert und per Hover/Titel inspizierbar. Ein expliziter
      Rundenabschluss zum Archivieren ist noch nicht vorhanden, weil das
      ursprüngliche Modell keine Rundenaktion hatte.

### Als Nächstes geplant
- [ ] Manuelles 4-Spieler-Spiel lokal testen (Drag & Drop, Sync, Wurf-Gefühl).
- [ ] UI-Feinschliff nach echtem Spiel mit vier Browser-Tabs.
- [x] Tauschphase: freiwillige verdeckte Angebote und Annahme beim gegenüber-
      sitzenden Partner; harte Wartepflicht bleibt bewusst ausgeschaltet.
- [x] Geberrotation und sichtbare Anzeige von aktuellem/nächstem Geber sowie
      Reststapelgröße.

### Später / optional
- [ ] Hosting umsetzen (ADR-0002): Sitzplatz-Link-Erzeugung im Client,
      Cloudflare Tunnel o. Ä.
- [ ] Optionale, **nicht-verbietende** Regel-Hilfen (auf Basis von REQ-RULES).
- [ ] Optionales Undo (letzten Zug zurücknehmen) für Verklicker.
- [ ] Exakte Deck-Zusammensetzung je Kartenwert verifizieren (aktuell
      dokumentierte Annahme in `REQ-DESIGN`, siehe REQ-RULES §3).
- [x] Brettdesign anhand der Vorlagen in `vorlage/` abgeglichen. Referenz sind ein
      quadratisches Holzbrett, 64 eingelassene Kreisfelder, florale Linienstruktur,
      zentrale Mulde und vier Eckmulden; die Bilder werden nicht als Hintergrund
      verwendet.
- [x] Erste interaktive SVG-Umsetzung der Brettreferenz umgesetzt.
- [x] `vorlage/Board.png` als sichtbare Brettgrundlage eingebunden; interaktive
      SVG-Overlays bleiben für Felder, Kugeln, Markierungen und Karten erhalten.
- [x] Overlay-Geometrie auf das Originalmaß 1024×1024 umgestellt; Hauspositionen
      anhand eigener Uhrpositions-Layouts je Seite kalibriert. Links und rechts
      werden wegen ihrer freien Sektoren nicht als 90°-Drehung behandelt.
- [x] Quelle und Ziel des letzten Kugelzugs bleiben für alle Spieler markiert,
      bis eine andere Kugel bewegt wird; bewusst kein Undo/TAC-Automatismus.
- [x] Feldnummern können lokal ein- und ausgeblendet werden.
- [x] Fremde Hände werden als Kartenrücken mit Anzahl angezeigt.
- [x] Teufel-Einsicht benötigt eine Bestätigung des Zielspielers; danach kann
      der anfragende Spieler genau eine fremde Karte offen ausspielen.
- [x] Narr-Aktion zur Weitergabe aller Hände an den rechten Nachbarn.

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
