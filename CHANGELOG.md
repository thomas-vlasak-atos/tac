# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier dokumentiert.

Format angelehnt an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
Versionierung nach [Semantic Versioning](https://semver.org/lang/de/).

## [Unreleased]

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
