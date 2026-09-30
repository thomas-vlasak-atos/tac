# Projektstatus & Handover für die nächste Session

**Kennung:** `STATUS`
**Stand:** 2026-09-30
**Zweck:** Schneller Wiedereinstieg – was ist da, was ist offen, wie startet man.

---

## 0. Update 2026-09-30 (jüngste Session)

Seit dem letzten Stand umgesetzt (alle in `main`, gepusht):

- **Kartenbedienung mit einem Klick, phasenabhängig** (Tauschphase → Partner
  anbieten, Spielphase → ablegen); Partnerangebot nach eigenem Tausch bzw. nachdem
  der Partner genommen hat gesperrt. Partnertausch-Panel unter den eigenen Karten,
  nach dem Tausch ausgeblendet.
- **Spielernamen im Vorfeld** (weiß), **Handkartenzahl** als Kartenrücken **neben**
  dem Vorfeld, **Nachziehstapel** über/unter dem Vorfeld. Positionen sauber über
  Kalibrier-Werte (`vorfeldOuterRadius`, `boardBorderInset`) und Faktor-Konstanten
  in `Board.tsx` (`HANDCOUNT_*`, `DRAWPILE_*`, `CARD_ASPECT`).
- **Perspektive OHNE Brettdrehung (Index-Mapping, REQ-BOARD B8):** `off = ownSeat`
  bildet Daten-Sitz/-Feld auf feste Bild-Positionen ab; Feldnummern zeigen die
  echten Datennummern. Ersetzt die fehleranfällige SVG-Rotation. Siehe
  `packages/client/src/board/Board.tsx` (`visSeat/dataSeat/visIndex/dataIndex`,
  `dataPosToPoint/pointToDataPos`).
- **Wandernder, klickbarer Reststapel (REQ-BOARD K2/K2a):** Rundenstart in der
  Mitte – wer zuerst klickt wird Geber; danach wandert der Stapel **im
  Uhrzeigersinn** (`+1`) zum nächsten Sitz. Leerer Stapel zeigt „MISCHEN", dann
  „GEBEN" (zwei Klicks). Neue Felder `deckHolder`, `deckActive`, `deckShuffleable`.
- **Teufel per Klick + Overlay (REQ-BOARD K7):** Klick auf den Kartenrücken des
  linken Nachbarn → Overlay beim Ziel (erlauben/ablehnen), Anfrager kann abbrechen;
  alles im Verlauf protokolliert. Aktionen `DeclineDevilView`, `CancelDevilView`.
- **UI aufgeräumt:** eine Header-Zeile (links Info, rechts „Neu"/„Meisterkarten"),
  „Neu" mit Sicherheitsabfrage, Kalibrier-Overlay wieder entfernt, Verlauf füllt die
  Seitenleiste (`flex:1`).
- **Layout neu aufgezogen (Flexbox):** App = `100svh`, Brett quadratisch
  `min(100svh − chrome, 100vw − Seitenleiste)`, oben-links verankert, Seitenleiste
  fix 320px. Kollidierende Inline-Styles entfernt (u. a. Header `flex-wrap`).

### Offene Punkte / bewusst für die nächste Session vertagt

1. **Kartenvorderseiten-Rendering überarbeiten (Priorität lt. User).** Die aktuelle
   Darstellung gefällt noch nicht. Betroffen: `packages/client/src/ui/cardArtwork.tsx`.
   - Vorhandene Assets in `cards/`: `1-13.png` (Sprite: links=1, rechts=13),
     `4.png`, `tactac.png`, `engel.png`, `krieger.png`, `narr.png`, `background.png`
     (Rücken; wird aktuell auch als Teufel-Platzhalter genutzt).
   - Für alle **übrigen** Zahlenkarten (2,3,5,6,7,8,9,10,12) sowie Trickser gibt es
     KEIN Bild → Text-Fallback (`CardArtwork`, `artwork == null`). Ziel: einheitliche,
     schön gestaltete Vorderseiten (entweder echte Bilder liefern/erzeugen oder ein
     konsistentes gezeichnetes Design statt reinem Text-Fallback).
   - `CardArtwork` nutzt für 1/13 ein 200%-Sprite mit `translateX(-50%)`.
2. **Kleine Layout-Restpunkte (niedrige Prio, „später"):**
   - In einer **Zwischengröße** bleibt noch eine **vertikale Scrollbar** (soweit ok,
     aber nicht ideal) – Chrome-Abzug `100svh − 110px` in `styles.css` ggf. justieren.
   - Evtl. ein kleiner **Rand** ums Brett in einer bestimmten Zwischengröße.
   - Der **„Meisterkarten"-Button** wird in einem bestimmten Breitenbereich
     abgeschnitten (Header `overflow:hidden` + `nowrap`). Fix: Header umbrechen
     lassen ODER Buttons/Info bei Platzmangel kürzen/umbrechen, ohne die Brett-Höhen-
     rechnung springen zu lassen (ggf. Chrome-Höhe dynamisch statt fixem Abzug).

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

### Online & Bedienung (Stand 2026-09-29)
- [x] **Online spielbar (Render, kostenlos):** Client `https://tac-client.onrender.com`,
      Server `https://tac-server-v5p7.onrender.com`. Blueprint `render.yaml`; Client-URL
      über `VITE_SERVER_URL`. Free-Tier: Server schläft bei Inaktivität, State nur im RAM.
- [x] **Karten per Klick** statt Drag & Drop (auswählen → „Ablegen"/„An Partner geben").
      Kugeln bleiben Drag & Drop.
- [x] **Verlauf mit Spielernamen** statt Farbe (Fallback Farbe bei freiem Sitz).
- [x] **Sitzplatz-Verdrängung** per Link (`seat=`); Auto-Join nimmt nur freie Plätze.
- [x] **Partnertausch** überarbeitet: 1× pro Runde, Angebot ersetz-/zurücknehmbar,
      nehmen erst nach eigenem Angebot.
- [x] **Meisterkarten-Anleitung** als Overlay im Client.
- [ ] Bedienung im echten 4-Spieler-Spiel testen (jetzt online möglich); Feedback sammeln.

### Nächste Session: offene To-dos (Feedback aus dem Testen, noch NICHT umgesetzt)

1. **[x] Tausch-Zurücknehmen sperren, sobald man selbst genommen hat.**
   Umgesetzt: `revokeTradeOffer` (`packages/server/src/room.ts`) lehnt ab, wenn
   `state.tradeDone.includes(seat)`; der „zurücknehmen"-Button in `App.tsx` wird
   ausgeblendet (`!iAmTradeDone`). Test „does not let a sender revoke after they
   have claimed themselves" ergänzt.

2. **[x] Kartenbedienung: EIN Klick genügt (kein Zwischenschritt über Buttons).**
   Umgesetzt: `Hand.tsx` löst per Klick direkt `onPlayCard` aus; `App.tsx` leitet
   die Phase aus `tradeDone` ab (`isTradePhase` = `tradeDone.length` < belegte
   Sitze) und sendet in der Tauschphase `OfferCardToPartner`, sonst `PlayCard`.
   In der Tauschphase sind die Karten deaktiviert, sobald man selbst getauscht hat.
   Die separaten Aktions-Buttons entfielen. REQ-BOARD K3a/K5 angepasst.

### Sofort (offen aus dieser Session)
- [~] **Feinschliff der Bedienung** im echten Spiel testen (zu viert):
      Kartenklick, Kugel-Drag & Drop, gefächerte Kugeln auf gleichem Feld, Orientierung.
      Erster kleiner Test durchgeführt, Ergebnis positiv; weitere Bugfixes folgen.
- [x] Client lädt im Browser (Windows-`subst`-Problem gelöst, ADR-0003).
- [x] WebSocket-Verbindung stabil (StrictMode-Doppel-Mount behoben).

### Deck-Zusammensetzung (aufgefallen im ersten Test)
- [x] **Kartenhäufigkeiten je Wert verifiziert:** Anhand eines echten TAC-Kartensatzes
      ausgezählt und in `SINGLE_DECK_COUNTS` (`packages/shared/src/cards.ts`) eingetragen:
      1 und 13 je 9×, 7 achtmal, alle übrigen Zahlen (2,3,4,5,6,8,9,10,12) je 7×,
      Trickser 7×, TAC 4× → 100 Basiskarten; +4 Meisterkarten = 104. Das Deck wird
      nicht mehr aus zwei identischen Hälften gebaut, sondern direkt in Gesamt-Häufigkeit.
- [x] **Mischen nur bei „Mischen", nicht bei jedem Geben:** `dealCards` mischt nicht
      mehr, sondern zieht von oben des Reststapels (entspricht dem Regelheft: „der
      Stapel muss dazu nicht neu gemischt werden"). Der Stapel wird einmal beim
      Spielstart gemischt (`createInitialState` mit RNG); erneutes Mischen nur über
      `shuffleDiscard` (Ablage zurückmischen).

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
- [x] Exakte Deck-Zusammensetzung je Kartenwert verifiziert (Auszählung echter
      Kartensatz; eingetragen in `SINGLE_DECK_COUNTS`, siehe REQ-RULES §3).
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
- [x] Meisterversion als Standard festgelegt; **Geben** teilt automatisch 5 bzw. in
      der letzten Runde 6 Karten aus. Erneutes Geben bei offenen Händen wird
      verhindert; **Mischen** füllt bei leerem Reststapel den Stapel aus der Ablage.
- [x] Sichtbare Kartenmitte wird beim neuen Geben geleert und als Archivstapel
      getrennt weitergeführt.
- [x] Partnerangebote werden nur Absender und Empfänger angezeigt.
- [x] Vorfeld-Markierung verwendet die konkrete Kugelmulde statt eines großen
      gemeinsamen Kreises.
- [x] Responsives Layout hält das vollständige Brett sichtbar; auf kleinen
      Displays steht die Seitenleiste unter dem Brett und die Handkarten bleiben
      horizontal erreichbar.
- [x] Im Querformat stehen die eigenen Handkarten neben dem Brett; im Hochformat
      wird das Brett zusätzlich anhand der verfügbaren Höhe begrenzt.

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
