# TAC Online

Eine Online-Version des Brettspiels **TAC** (4 Spieler, 2 Teams) für einen
festen Freundeskreis. Ziel: übers Internet gemeinsam spielen – zunächst lokal
lauffähig, Deployment später.

> **Konzept: freies Brett.** Die Anwendung stellt Brett, Kugeln und Karten
> bereit, **erzwingt aber keine Spielregeln** – die Spieler ziehen selbst und
> halten die Regeln wie am echten Tisch selbst ein. Das kommt dem echten TAC am
> nächsten. Ein einblendbarer Verlauf zeigt die letzten Züge.
>
> Keine Benutzerkonten, keine Fremdnutzer. Karten werden digital verwaltet.

## Rechtlicher Hinweis

TAC ist eine eingetragene Marke der TAC Verlag GmbH; Regelheft und Materialien
sind urheberrechtlich geschützt. Dieses Projekt ist eine **private, nicht
kommerzielle** Eigenimplementierung für den persönlichen Gebrauch. Das originale
Regelheft wird **nicht** ins Repository aufgenommen. Grafiken/Design werden
eigenständig gestaltet und bilden keine geschützten Originalmaterialien nach.

## Projektstatus

Frühe Phase: Dokumentation und Projektstruktur. Die Spiel-Engine wird als
Nächstes implementiert (siehe `docs/architecture/ARCH-OVERVIEW.md`).

## Dokumentation

- `docs/requirements/REQ-BOARD.md` – **primäre Anforderung**: freies Brett, Kugeln, Karten, Verlauf
- `docs/requirements/REQ-RULES.md` – Spielregeln als **Referenz** (nicht erzwungen)
- `docs/architecture/ARCH-OVERVIEW.md` – technische Architektur
- `docs/decisions/ADR-0001-freies-brett.md` – Entscheidung freies Brett statt Regel-Engine
- `docs/decisions/` – weitere Architecture Decision Records (ADRs)
- `CHANGELOG.md` – Änderungsverlauf

## Tech-Stack (geplant)

- **Frontend:** TypeScript, React, Vite (Brett mit Drag & Drop)
- **Backend:** Node.js, WebSocket (State-Synchronisierer, kein Regel-Schiedsrichter)
- **Geteilte Typen:** `shared`-Paket (GameState, Aktionen, Deck)
- **Tests:** Vitest
- **Monorepo:** npm workspaces

## Setup (wird ergänzt, sobald Code vorhanden ist)

> Voraussetzung: Node.js >= 20 (entwickelt mit Node 26), npm >= 10.

```bash
# Abhängigkeiten installieren (sobald package.json existiert)
npm install

# Tests ausführen
npm test

# Entwicklung starten (Server + Client) – folgt
npm run dev
```

Diese Anleitung wird bei jeder Änderung am Setup/Start-Prozess aktuell gehalten.

## Mitwirken

Konventionen und Arbeitsweise siehe `AGENTS.md` (Document First, Tests,
Traceability Requirement ↔ Code ↔ Test).
