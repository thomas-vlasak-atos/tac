# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier dokumentiert.

Format angelehnt an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
Versionierung nach [Semantic Versioning](https://semver.org/lang/de/).

## [Unreleased]

### Added
- Monorepo-Grundgerüst: npm workspaces, TypeScript (`tsconfig.base.json`),
  Vitest (`vitest.config.ts`).
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
