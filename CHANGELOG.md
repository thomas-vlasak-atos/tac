# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier dokumentiert.

Format angelehnt an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
Versionierung nach [Semantic Versioning](https://semver.org/lang/de/).

## [Unreleased]

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
