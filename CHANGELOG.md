# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier dokumentiert.

Format angelehnt an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
Versionierung nach [Semantic Versioning](https://semver.org/lang/de/).

## [Unreleased]

### Added
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
