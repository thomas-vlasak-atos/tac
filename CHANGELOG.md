# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier dokumentiert.

Format angelehnt an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
Versionierung nach [Semantic Versioning](https://semver.org/lang/de/).

## [Unreleased]

> **Offen für die nächste Session** (Details in `docs/STATUS.md` §0):
> - **Kartenvorderseiten-Rendering** überarbeiten (`ui/cardArtwork.tsx`) – gefällt
>   noch nicht; für 2,3,5,6,7,8,9,10,12 und Trickser fehlen Bilder (Text-Fallback).
> - Kleine Layout-Reste: vertikale Scrollbar in einer Zwischengröße, evtl. Rand ums
>   Brett, „Meisterkarten"-Button wird in einem Breitenbereich abgeschnitten
>   (Header `nowrap`/`overflow:hidden`).

### Changed
- **Seitenleiste bleibt konstant hoch:** Der Verlauf füllt im Querformat den
  restlichen Platz der Seitenleiste (`flex: 1`) und scrollt intern. Dadurch bleibt
  die Seitenleiste immer gleich hoch (= Bretthöhe), unabhängig davon, wie voll der
  Verlauf ist. Im Hochformat bleibt der Verlauf auf eine feste Maximalhöhe begrenzt.
- **Eine einzige Header-Zeile:** „TAC ONLINE · Raum · Verbindung · Startspieler"
  linksbündig, „Neu" und „Meisterkarten erklären" rechtsbündig. Die separate
  Steuerzeile über dem Brett und die frühere Reststapel-Textzeile entfallen (die
  Kartenanzahl steht am Nachziehstapel).
- **„Neu" mit Sicherheitsabfrage:** Ein Reset des Spiels fragt nun vorher nach.

### Fixed
- **Layout sauber neu aufgezogen (keine Sprünge, keine Scrollbar, Seitenleiste
  immer sichtbar):** Kollidierende Inline-Styles (u. a. `flex-wrap` am Header)
  entfernt und das gesamte Layout ins CSS verlagert. Desktop/Querformat nutzt ein
  einziges Flex-Modell: App = 100svh ohne Scroll, Header (einzeilig, feste Höhe),
  darunter Brett (oben-links verankert) + Seitenleiste (feste 320px). Die Brettgröße
  ist `min(100svh − Chrome, 100vw − Seitenleiste)`, quadratisch. Dadurch entfallen
  die Sprünge bei ~1022/1038/1122px, die Feldnummern-Checkbox bleibt linksbündig,
  und die zweite Spalte wird nie mehr verdeckt.

### Removed
- **Kalibrier-Overlay entfernt:** Das temporäre Debug-Overlay (Vorfeld-Kreis /
  Brett-Rahmen) und seine Checkbox wurden nach abgeschlossener Kalibrierung
  entfernt.

### Changed
- **Kalibrierbare Kartengeometrie am Brett:** Kartenanzahl-Anzeige und Nachziehstapel
  werden nun exakt ins freie Feld zwischen dem **Vorfeld-Außenkreis** und der
  **Brett-Rahmenlinie** gelegt – mit **gleichem Abstand** (`GAP`) zu beiden Linien.
  Neue Geometrie-Werte `vorfeldOuterRadius` und `boardBorderInset` (kalibriert gegen
  `vorlage/Board.png`) sowie zentrale Konstanten in `Board.tsx`
  (`HANDCOUNT_GAP_FACTOR`, `HANDCOUNT_WIDTH_FACTOR`, `DRAWPILE_GAP_FACTOR`,
  `DRAWPILE_WIDTH_FACTOR`, `CARD_ASPECT`) – alle als Faktor von `geo.size`, daher
  skalierungssicher. Die Kartenanzahl liegt wieder **seitlich** neben dem Vorfeld;
  der Nachziehstapel überlappt das Vorfeld nicht mehr.
- **Abstände am Brett vergrößert:** Der Nachziehstapel liegt jetzt weiter vom
  Vorfeld weg und zum Bildrand hin; die Handkarten-Rücken der Spieler haben
  ebenfalls mehr Abstand zum Vorfeld.
- **Perspektive ohne Brettdrehung (REQ-BOARD B8, Index-Mapping):** Statt das Brett
  per SVG zu rotieren (was zu Positionsfehlern führte, u. a. bei Namen/Karten), wird
  das Brettbild jetzt fix gezeichnet. Jede Daten-Position (Sitz/Feld) wird per
  `off = ownSeat` auf eine feste Bild-Position abgebildet, sodass der eigene Sitz
  immer an der festen unteren Ecke liegt und **alle Positionen für jeden Betrachter
  gleich** sind. Feldnummern zeigen die echten Datennummern (perspektivisch um
  `off·16` verschoben). Handkarten-Rücken liegen einheitlich neben dem Vorfeld
  (rechte Bildhälfte links, linke rechts), der Nachziehstapel oben darunter / unten
  darüber – jeweils mit Abstand, ohne ins Vorfeld zu ragen.

### Fixed
- **Geberrichtung korrigiert:** Der Reststapel wandert nach dem Geben nun im
  **Uhrzeigersinn** zum nächsten Sitz (z. B. nach Platz 3 → Platz 4/Sitz 3), statt
  fälschlich gegen den Uhrzeigersinn.

### Changed
- **Kopfzeilen-Label „Geber" → „Startspieler"** über dem Brett.
- **Einheitliche Kartenpositionen am Brett (REQ-BOARD B9):** Bezogen auf das
  gedrehte Bild jedes Betrachters liegt der Handkarten-Rücken jedes Spielers immer
  mit Abstand **neben** dem Vorfeld – rechte Bildhälfte links, linke Bildhälfte
  rechts. Der Nachziehstapel liegt beim Geber bei oberen Spielern darunter, bei
  unteren darüber. Karten ragen nicht mehr ins Vorfeld.

### Fixed
- **Geber-Anzeige über dem Brett:** Solange der Reststapel in der Mitte liegt (noch
  niemand hat gegeben), zeigt die Kopfzeile „wer zuerst auf den Stapel klickt" statt
  fälschlich Platz 1/Blau. Sobald der Stapel einem Sitz zugewiesen ist, wird dessen
  Name angezeigt.
- **Erstes Geben nach Neustart:** Liegt der Reststapel in der Mitte (Rundenstart/nach
  „Neu"), darf jetzt **jeder** Spieler klicken – **wer zuerst klickt, wird Geber**.
  Zuvor konnte nur der feste Startsitz (Blau/Platz 1) geben, wodurch ein Klick anderer
  Spieler wirkungslos war. Erst nachdem der Stapel einem Sitz zugewiesen ist, bleibt
  das Geben/Mischen auf den zuständigen Geber beschränkt. Zusätzlich eine robuste,
  unsichtbare Klickfläche über dem Stapel ergänzt.

### Added
- **Leerer Reststapel: mischen am Brett (REQ-BOARD K2a):** Ist der Reststapel nach der
  letzten Runde leer, liegt er beim nächsten Geber und zeigt **„MISCHEN"**. Ein Klick
  mischt den Ablagestapel zurück; danach zeigt der Stapel **„GEBEN"** und ein zweiter
  Klick teilt aus (zwei Klicks). Nur der zuständige Geber darf mischen. Neues
  State-Feld `deckShuffleable`; der separate „Mischen"-Button entfällt.

### Changed
- **Größen angepasst:** Die je Spieler angezeigten Resthandkarten (Kartenrücken mit
  Anzahl) und der Nachziehstapel am Brett sind größer. Die eigenen Handkarten wurden
  wieder auf die vorherige Größe zurückgesetzt (versehentlich vergrößert).

### Added
- **Klickbarer, wandernder Reststapel am Brett (REQ-BOARD K2):** Der Reststapel wird
  als Kartenstapel am Brett gezeichnet – zu Rundenbeginn in der Mitte. Der aktuelle
  Geber klickt darauf, um zu geben; danach wandert der Stapel zum nächsten Geber und
  ruht dort deaktiviert, bis alle Handkarten gespielt sind. Neue State-Felder
  `deckHolder`/`deckActive`; nur der zuständige Geber kann den Stapel auslösen. Der
  separate „Geben"-Button entfällt.
- **Teufel-Handeinsicht per Klick + Overlay (REQ-BOARD K7):** Statt eines Buttons
  klickt der Teufel auf den Kartenrücken-Stapel seines linken Nachbarn am Brett. Das
  Ziel erhält ein Overlay über dem Spielfeld (Erlauben/Ablehnen); der Anfrager kann
  abbrechen. Anfrage, Erlauben, Ablehnen und Abbruch werden im Verlauf protokolliert
  (Anti-Schummel). Neue Aktionen `DeclineDevilView`/`CancelDevilView`.

### Changed
- **Handkarten-Kartenrücken (Anzahl) und eigene Handkarten vergrößert.** Der Geber-
  Text im Vorfeld entfällt (steht über dem Brett). Der Narr bleibt als separater
  Button in den Meisteraktionen.

### Added
- **Spielernamen im Vorfeld (REQ-BOARD B9):** Der Name jedes Spielers steht mittig
  in Weiß (mit dunklem Kontursaum) in seinem Vorfeld hinter den Kugeln; darüber –
  falls zutreffend – „Geber". Die Handkartenzahl wird als kleine **Kartenrückseite**
  mit der Zahl in der Mitte **neben** dem Vorfeld Richtung Brettmitte gezeichnet.
  Alle Texte/Marker sind gegen die Brettdrehung ausgerichtet und daher immer
  waagerecht lesbar; der eigene Name ist größer. Das separate „Sitzplätze"-Panel in
  der Seitenleiste entfällt dadurch.

### Changed
- **Partnertausch-Bereich verschoben und nach eigenem Tausch ausgeblendet:** Der
  Partnertausch-Block steht jetzt **unterhalb der eigenen Handkarten** (in der
  Seitenleiste) statt unter dem Brett. Nach erfolgtem eigenem Tausch
  (`tradeDone`) wird er ausgeblendet und erscheint erst nach dem **nächsten Geben**
  wieder (dann sind `tradeDone`/`tradeOffers` zurückgesetzt).
- **Kein neues Partnerangebot mehr, sobald der Partner die Karte genommen hat
  (REQ-BOARD K3a/K5):** Hat der Partner die eigene angebotene Karte bereits
  genommen (`offer.claimed`), ist der Tausch von dieser Seite abgeschlossen.
  `offerCardToPartner` lehnt weitere Angebote in dieser Runde ab; im Client sind
  die Handkarten in der Tauschphase dann deaktiviert (kein Klick mehr möglich),
  mit erklärendem Hinweistext. Test ergänzt.
- **Kartenbedienung: ein Klick statt Zwischenschritt (REQ-BOARD K3a):** Ein Klick auf
  eine Handkarte löst direkt die phasenabhängige Aktion aus – in der **Tauschphase**
  wird die Karte dem Partner verdeckt angeboten (`OfferCardToPartner`), in der
  **Spielphase** in die Mitte gelegt (`PlayCard`). Die Phase wird aus `tradeDone`
  abgeleitet (Tauschphase, solange nicht alle belegten Sitze getauscht haben). Die
  bisherigen Aktions-Buttons „Ablegen"/„An Partner geben" entfallen; Karten sind in
  der Tauschphase deaktiviert, sobald man selbst getauscht hat.
- **Partnerangebot nach eigenem Tausch nicht mehr zurücknehmbar (REQ-BOARD K5):**
  `revokeTradeOffer` lehnt jetzt ab, wenn der Absender die Partnerkarte bereits
  selbst genommen hat (`tradeDone`). Der „zurücknehmen"-Button wird im Client
  entsprechend ausgeblendet. Test ergänzt.

### Added
- **Meisterkarten-Anleitung im Client:** Button „Meisterkarten erklären" öffnet ein
  Overlay mit Kurzbeschreibung zu Engel, Teufel, Krieger und Narr (angelehnt an die
  Original-Infokarte). Reine Nachschlagehilfe, keine Regeldurchsetzung.
- **Partnerangebot zurücknehmen:** Ein verdecktes Angebot kann zurückgezogen werden,
  solange der Partner es noch nicht genommen hat (`RevokeTradeOffer`).
- **Kostenloses Online-Test-Deployment (Render):** `render.yaml`-Blueprint mit
  `tac-server` (Web Service, Node/WebSocket) und `tac-client` (Static Site), beide
  in der Region `frankfurt`. Der Client erhält die Server-Adresse über
  `VITE_SERVER_URL`. README-Abschnitt und ADR-0002 dokumentieren Setup und
  Free-Tier-Einschränkungen (Server schläft bei Inaktivität, State nur im Speicher).
- README: Beitritts-Links je Spieler/Sitzplatz für den Raum `tac`.

### Changed
- **Karten werden per Klick bedient statt per Drag & Drop:** Eine Handkarte anklicken
  wählt sie aus; darunter erscheinen die Aktionen „Ablegen (in die Mitte)" und „An
  Partner geben (verdeckt)". Die Kugeln bleiben unverändert per Drag & Drop bedienbar.
- **Verlauf zeigt Spielernamen statt Farbe**, wenn der Sitz belegt ist (Fallback auf
  die Farbe bei unbesetztem Platz).
- **Sitzplatzvergabe mit Verdrängung:** Ein Beitritt mit explizitem Sitzplatz (Link)
  übernimmt den Platz immer und verdrängt den bisherigen Spieler (der eine Hinweis-
  meldung erhält). Auto-Beitritt ohne Sitzplatz nimmt weiterhin nur freie Plätze.
- **Partnertausch überarbeitet:** genau ein abgeschlossener Tausch pro Runde (wird
  beim Geben zurückgesetzt); ein noch nicht genommenes eigenes Angebot wird durch ein
  neues ersetzt (alte Karte zurück auf die Hand); „nehmen" ist erst möglich, nachdem
  man selbst eine Karte angeboten hat.
- **Server öffnet einen HTTP-Port mit Health-Check** (`GET /`, `/health` → 200)
  und bedient das WebSocket-Upgrade über denselben Port. Voraussetzung für
  Cloud-Hosting (Render gibt pro Dienst nur einen Port frei). Der Port kommt
  weiterhin aus `PORT`.
- **Client-Server-URL konfigurierbar:** `serverUrl()` nutzt `VITE_SERVER_URL`
  (vollständige URL oder reiner Host, `wss://` wird ergänzt); ohne Variable
  weiterhin `ws://<host>:3001` für lokale Entwicklung.
- **Geben mischt nicht mehr** (entspricht dem offiziellen Regelheft: „der Stapel
  muss dazu nicht neu gemischt werden"): `dealCards` zieht nur noch von oben des
  Reststapels. Der Stapel wird stattdessen einmal beim Spielstart gemischt
  (`createInitialState` mit optionalem RNG); erneutes Mischen erfolgt nur über
  `shuffleDiscard` (Ablage zurückmischen). Tests entsprechend angepasst.
- **Echte Kartenhäufigkeiten** statt gleichverteilter Annäherung: Das Basisdeck
  wird nicht mehr aus zwei identischen Hälften gebaut, sondern direkt über die
  ausgezählte Gesamtverteilung (`SINGLE_DECK_COUNTS`): 1 und 13 je 9×, 7 achtmal,
  übrige Zahlen je 7×, Trickser 7×, TAC 4× (= 100 Basiskarten, +4 Meister = 104).
  Dokumentiert in REQ-RULES §3.
- `docs/STATUS.md` aktualisiert (Stand 2026-09-29): erster 4-Spieler-Test positiv;
  Misch-/Geben-Verhalten und verifizierte Kartenverteilung als erledigt vermerkt.

### Fixed
- Responsives Spiellayout verhindert abgeschnittene Bretter: Das Brett skaliert in
  die verfügbare Breite, und auf kleinen Displays wandert die Seitenleiste darunter.
- Eigene Handkarten stehen im Querformat neben dem Brett und im Hochformat direkt
  darunter; das Brett wird im Hochformat zusätzlich an die verfügbare Höhe angepasst.
- Kartenhand im Querformat auf ein zweispaltiges Raster ohne horizontales Scrollen
  umgestellt.
- Karten im Querformat-Raster wieder im lesbaren Hochformat dargestellt.
- Sitzübersicht zeigt alle Plätze mit Name und Farbe; die Teufel-Einsicht ist auf
  den linken Nachbarn begrenzt.
- Partnerangebote werden nicht mehr dem gegnerischen Team angezeigt.
- `Geben` verhindert das Ersetzen noch vorhandener Handkarten und verteilt in der
  letzten Meisterrunde automatisch sechs Karten. `Mischen` füllt den Reststapel
  bei leerem Reststapel aus der separaten Ablage.
- Die sichtbare Kartenmitte wird beim Austeilen geleert; die bisherige Ablage bleibt
  als separates Archiv erhalten.
- Die Markierung einer Kugel im Vorfeld ist auf die konkrete Ausgangsmulde begrenzt.

### Changed
- Die Meisterversion ist standardmäßig aktiv und wird im aktuellen Client nicht
  mehr per Checkbox umgeschaltet.

### Added
- `docs/architecture/ARCH-BOARD-GEOMETRY.md`: vollständige Herleitung der
  Brett-Geometrie (hexagonales Kreisgitter, Ringe, Hauszentren, Hausmulden)
  aus dem einen Grundmaß `r`, inkl. Bauplan für einen späteren eigenständigen
  SVG-Generator des kompletten Spielfelds.
- Overlay-Kalibrierung auf 1024×1024 sowie versetzte Hausfelder nach der
  tatsächlichen Brettvorlage.
- `vorlage/Board.png` als Brettgrundlage mit transparenten interaktiven SVG-
  Overlays für Kugeln, Feldnummern und letzte-Zug-Markierung.
- Umschaltbare Feldnummern, Kartenrücken mit Handkartenanzahl sowie bestätigte
  Teufel-Einsicht und Narr-Handweitergabe.
- Anforderungen für Feldnummern, Kartenrücken sowie bestätigte Teufel- und
  Narr-Sonderaktionen dokumentiert.
- Persistente visuelle Markierung von Quelle und Ziel des letzten Kugelzugs.
- SVG-Brett im Stil der Vorlagen: Holzmaserung, eingelassener Lochkranz,
  florale Gravuren, zentrale Mulde und vier Eckmulden.
- Sichtbare Anzeige von aktuellem/nächstem Geber und verbleibendem Reststapel.
- Freiwillige Tauschphase mit verdeckten Kartenangeboten an den gegenüberliegenden
  Partner. Karten können per Drag & Drop zum Partner oder zum Brett gezogen werden.
- Vorhandene Kartenentwürfe aus `cards/` werden direkt als PNG-Kartenbilder im
  Client verwendet; fehlende Entwürfe erhalten einen Text-Fallback.
- Hochwertige Holz-/Murmelfassung des Bretts mit eigener Spielerperspektive,
  Quellfeld-Hervorhebung und zentraler Kartenablage.
- Grafische Handkarten sowie Ablagemetadaten (Urheber, Versatz, Drehung) und
  Rücknahme der eigenen zuletzt abgelegten Karte.
- `REQ-DESIGN` als verbindliche Dokumentation für die realistische Brett- und
  Kartendarstellung sowie die vorläufige Deck-Annahme.

### Changed
- **Bedienmodell auf Klick + Tausch umgestellt** (REQ-BOARD B3a): Kugel anklicken
  (aufnehmen) → freies Feld anklicken (setzen) oder andere Kugel anklicken
  (tauschen, entspricht Trickser). Ersetzt Drag & Drop.
- **Kein automatisches Werfen mehr** (REQ-BOARD B4 überarbeitet): `moveBall`
  wirft nicht mehr ins Vorfeld; zwei Kugeln dürfen dieselbe Position belegen.
  Wer werfen will, setzt die Kugel per Klick ins Vorfeld.
- Brett-Geometrie angepasst, damit Häuser und Vorfelder vollständig sichtbar
  sind (kleinerer Kreisradius, größere Felder).
- **Hausmulden geometrisch aus dem Kreisgitter berechnet** (`geometry.ts`):
  `housePositions` leitet Hauszentren (`±√3·r` / `±2·r`) und Mulden
  (Ring `r/√3`, korrigierte Winkel je Haus) statt hardcodierter Zentren und
  fehlerhafter Uhrzeiten ab. Neues Feld `BoardGeometry.gridRadius` als einziges
  Grundmaß. Rechtes Haus war zunächst um 180° verdreht (identische Winkel wie
  links); korrigiert, sodass die seitlichen Mulden aller Häuser nach innen
  zeigen. `circleRadius` (64 Laufbahn-Mulden) liegt jetzt mittig zwischen
  innerem Ring (`3r`) und äußerem Ring (`2√3·r`). Zentrum und Maßstab gegen
  `vorlage/Board.png` kalibriert. Siehe `ARCH-BOARD-GEOMETRY.md`.
- Client-WebSocket-Hook: robust gegen React-StrictMode-Doppel-Mount
  (kein "closed before connection established" mehr).

### Added
- Server: `swapBalls`-Aktion (zwei Kugeln tauschen) + Client-Aktion `SwapBalls`.
- Board: leere Plätze (Vorfeld, Haus, Startfelder) sichtbar gezeichnet
  (REQ-BOARD B7); Bedienhinweis im UI.
- Tests: `swapBalls`, angepasster `moveBall`-Test, Vorfeld-in-Bild-Test
  (48 Tests, alle grün).
- `docs/STATUS.md`: Projektstand & Handover für die nächste Session (Stand,
  offene Punkte, Startanleitung, Fallstricke).
- `docs/decisions/ADR-0003-windows-subst-pfad.md`: Windows-`subst`-Laufwerk
  (`D:\ => C:\_projects\fislw`) und Vite-Pfadauflösung; Fix in `vite.config.ts`
  (direkter Pfad statt `realpath`), Arbeitsrichtlinie „nur auf C: arbeiten".
- Monorepo-Grundgerüst: npm workspaces, TypeScript (`tsconfig.base.json`),
  Vitest (`vitest.config.ts`).
- Paket `@tac/client`: React + Vite Brett-UI (ARCH-OVERVIEW §7):
  - Reine, testbare Brett-Geometrie (`board/geometry.ts`): Kreisfelder,
    Startfelder (0/16/32/48), Häuser (radial nach innen), Vorfelder – mit Tests.
  - SVG-Brett (`board/Board.tsx`): Felder, Häuser, Kugeln; Kugeln per
    Drag & Drop frei bewegbar (REQ-BOARD B3) mit Herkunfts-Marker (B4a),
    Snapping auf nächstes Ziel-Feld.
  - WebSocket-Hook (`net/useTacSocket.ts`): Verbindung, StateUpdate empfangen,
    Aktionen senden.
  - UI: Handkarten (legen/tauschen), Verlaufs-Panel, Ablage, Geben-/Meister-/
    Reset-Steuerung, Beitritts-Bildschirm mit URL-Vorbelegung
    (`?room=&name=&seat=`, ADR-0002).
  - Root-Skripte `dev:server` / `dev:client`.
- Paket `@tac/server`: WebSocket-Server als State-Synchronisierer (kein
  Regel-Schiedsrichter, ADR-0001):
  - Reine, testbare Raum-Logik (`room.ts`): `moveBall` (freies Ziehen inkl.
    Werfen am Zielfeld), `dealCards` (mischen & reihum austeilen), `playCard`,
    `swapWithPartner`, `joinRoom` (Sitzplatzvergabe + Reconnect über Namen),
    `resetGame`, `setMasterMode`, `toPublicState` (Sichtbarkeitsfilter), Verlauf.
  - WebSocket-Transport (`server.ts`): Räume, Aktionen anwenden, gefilterter
    Broadcast (jeder Client sieht nur die eigene Hand).
  - Tests (Vitest): 15 Tests für die Raum-Logik, alle grün.
  - Manueller Smoke-Test bestätigt End-to-End: Join → Deal → MoveBall →
    Verlaufseintrag, mit korrekter Sichtbarkeitsfilterung.
  - Dev-Laufzeit über `tsx` (Node löst `.js`→`.ts`-Importe nativ nicht auf).
- Planungs-ADR `docs/decisions/ADR-0002-hosting-und-sitzplatz-links.md`:
  Heim-Server + Sitzplatz-basierte Beitritts-Links, Tunnel-Optionen.
- Paket `@tac/shared`:
  - Domänentypen (`Seat`, `Team`, `Color`, `Ball`, `BallPosition`, `Player`).
  - Kartendefinitionen (`Card`, Deck-Häufigkeiten, Meisterkarten) und
    Anzeigenamen.
  - Reine Funktionen `buildDeck`, `shuffle` (Fisher-Yates), `deal`
    (reihum, Standard 5 / Meisterrunde 6 Karten).
  - `GameState` / `PublicGameState` (mit Sichtbarkeitsfilterung), Zugverlauf.
  - `createInitialState` / `createInitialBalls` (Startlage: alle Kugeln im
    Vorfeld).
  - Netzwerk-Nachrichten & Aktionstypen (`ClientAction`, `ServerMessage`).
  - Tests (Vitest): 21 Tests für Deck/Mischen/Austeilen und Anfangszustand,
    alle grün.
- README: Setup-Anleitung (install, test, typecheck) und Monorepo-Struktur.

### Changed
- **Konzeptwechsel:** Statt einer regel-erzwingenden Engine wird ein **freies
  Brett** umgesetzt (Spieler ziehen selbst, keine Regelprüfung). Siehe
  `docs/decisions/ADR-0001-freies-brett.md`.
- `REQ-RULES` von "funktionaler Spezifikation" zu **Referenz (nicht erzwungen)**
  umgewidmet.
- `ARCH-OVERVIEW` auf State-synchronisierenden Server ohne Regel-Engine
  umgestellt; Paket `engine` entfällt zugunsten von `shared`.
- README und Doku-Indizes an das freie-Brett-Konzept angepasst.

### Added
- `docs/requirements/REQ-BOARD.md`: primäre Anforderung (freies Brett, Kugeln,
  digitale Karten, Verlauf als Zugliste).
- `docs/decisions/ADR-0001-freies-brett.md`: Entscheidung freies Brett statt
  Regel-Engine.

### Added (initial)
- Git-Repository initialisiert, Remote auf `github.com/thomas-vlasak-atos/tac`.
- `.gitignore` (inkl. Ausschluss des urheberrechtlich geschützten Regelhefts).
- Doku-Struktur unter `docs/` (requirements, architecture, decisions).
- `docs/requirements/REQ-RULES.md`: Spielregeln (Standard + Meisterversion,
  4 Spieler) als Referenz.
- `docs/architecture/ARCH-OVERVIEW.md`: technische Architektur.
- `README.md`: Projektüberblick, rechtlicher Hinweis, geplantes Setup.
- `CHANGELOG.md`.
