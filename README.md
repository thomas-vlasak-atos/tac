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

Im Praxiseinsatz (zu viert getestet, online auf Render). Vorhanden:
- Vollständige Dokumentation (Anforderungen, Architektur, Entscheidungen).
- Monorepo-Grundgerüst (npm workspaces, TypeScript, Vitest).
- Paket `@tac/shared`: gemeinsame Typen (GameState, Kugeln, Karten, Aktionen),
  Deck-Erstellung, Mischen & Austeilen – mit Tests.
- Paket `@tac/server`: WebSocket-Server (State-Synchronisierer) mit reiner,
  testbarer Raum-Logik (Beitreten, Kugeln bewegen, Geben, Ablegen, Tauschen,
  Verlauf, Sichtbarkeitsfilter) – mit Tests.
- Paket `@tac/client`: React + Vite Brett-UI. Schematisches SVG-Brett (berechnete
  Geometrie), Kugeln per Drag & Drop mit Herkunfts-Marker, Handkarten, Ablage,
  Geben-Steuerung, Verlauf, Beitritts-Bildschirm (inkl. URL-Parameter).
- Bedienhilfen im Client: Markierung und Pfeil des letzten Zugs (bei Trickser beide Züge),
  Zug-Animation (Feld für Feld bzw. Gleitflug), Hinweis „Wer ist dran", Zielhilfe mit
  Distanz beim Ziehen, Karten per Klick **und** Drag & Drop, Kartenflug in die Mitte,
  Narr-Animation, optionale Töne, verstecktes „Anstupsen" (Klick auf den Namen eines
  Mitspielers) und eine eigene Meisterkarten-Seite.
- **Einstellungen** (Zahnrad in der Kopfzeile, lokal pro Gerät): Darstellung (hell/dunkel/wie System),
  Brett-Hintergrund, Feldnummern, „Wer ist
  dran"-Marker, Animationen, Zielhilfe, Kartenbedienung (Klick/Ziehen), Anstupsen-Ton,
  Töne „Zug gemacht" und „Du bist dran" (Standard: aus).

Offen: Zählpunkte und Hausdarstellung werden von Hand in `vorlage/Board.png` ergänzt;
danach Kalibrierung prüfen (siehe `docs/requirements/REQ-FEEDBACK.md`).

## Dokumentation

- `docs/requirements/REQ-BOARD.md` – **primäre Anforderung**: freies Brett, Kugeln, Karten, Verlauf
- `docs/requirements/REQ-FEEDBACK.md` – Feedback aus dem Praxistest (Bedienhilfen, Animationen, Töne)
- `docs/requirements/REQ-DESIGN.md` – visueller Ausbau
- `docs/requirements/REQ-RULES.md` – Spielregeln als **Referenz** (nicht erzwungen)
- `docs/STATUS.md` – Projektstatus und Handover
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

## Setup

> Voraussetzung: Node.js >= 20 (entwickelt mit Node 26), npm >= 10.

```bash
# Abhängigkeiten installieren
npm install

# Tests ausführen
npm test

# Tests im Watch-Modus
npm run test:watch

# TypeScript typprüfen (alle Pakete)
npm run typecheck

# Brettbild (SVG) neu berechnen -> vorlage/board_generated(.svg|_transparent.svg)
npm run generate:board

# Server starten (WebSocket, Standardport 3001)
npm run dev:server

# Client starten (Vite, http://localhost:5173) – in zweitem Terminal
npm run dev:client
```

Zum lokalen Spielen: Server starten, dann Client starten und pro Spieler einen
Browser-Tab auf `http://localhost:5173` öffnen. Über URL-Parameter lässt sich der
Beitritt vorbelegen; sind `room` und `name` gesetzt, geht es **ohne Startformular direkt
auf das Spielbrett** (fehlt einer von beiden, wird das Formular vorbelegt), z. B. `http://localhost:5173/?room=abc&name=Anna&seat=0`
(siehe `docs/decisions/ADR-0002-hosting-und-sitzplatz-links.md`).

**Brett-Hintergrund:** Holztexturen liegen in `vorlage/background/` (Präfix `bright_` = helles Holz mit
grauem Brett, `dark_` = dunkles Holz mit goldenem Brett) und sind in den Einstellungen wählbar.
Neue Bilder einfach mit passendem Präfix dort ablegen. Lizenzen der Texturen (ambientCG: CC0;
Texturelabs: eigene Lizenz) bitte vor einer Veröffentlichung prüfen.

**Meisterkarten-Seite:** `?view=meisterkarten` zeigt die Erklärung der Meisterkarten in einer
eigenen Seite ohne Spielverbindung (z. B. für ein zweites Fenster oder einen Screenshot).

**Testmodus:** Mit zusätzlichem Parameter `test=1` (z. B. `?room=abc&name=Anna&seat=0&test=1`)
entfällt der Partnertausch – ein Klick auf eine Handkarte legt sie sofort ab – und jeder
Sitz darf geben/mischen (nicht nur der zuständige Geber). Im Header erscheint „TESTMODUS".
Nur zum Testen einer kompletten Runde gedacht, z. B. alles in einem Tab.

Diese Anleitung wird bei jeder Änderung am Setup/Start-Prozess aktuell gehalten.

## Online-Test-Deployment (kostenlos, via Render)

Für einen ersten Online-Test gibt es ein Render-Blueprint (`render.yaml`), das zwei
Dienste im kostenlosen Tarif erzeugt:

- **`tac-server`** – WebSocket-Server als Web Service (Node). Öffnet einen
  HTTP-Port (`$PORT`) mit Health-Check (`/health`) und bedient das WebSocket-Upgrade
  über denselben Port.
- **`tac-client`** – statischer Vite-Build als Static Site (CDN). Bekommt die
  Server-Adresse über die Build-Variable `VITE_SERVER_URL` (Render füllt den Host
  automatisch aus dem Server-Dienst).

Schritte:

1. Repository auf GitHub pushen.
2. In Render „New → Blueprint" wählen und das Repo verbinden; Render liest
   `render.yaml` und legt beide Dienste an.
3. Nach dem ersten Deploy die Client-URL öffnen (z. B.
   `https://tac-client.onrender.com`), ggf. mit `?room=…&name=…&seat=…`.

### Hosting
https://dashboard.render.com/

Hinweise zum Free-Tier: Der Server **schläft** nach einigen Minuten Inaktivität und
braucht beim nächsten Zugriff ein paar Sekunden zum Aufwachen. Der Spielzustand
liegt nur im Speicher (Neustart/Deploy = Partie zurückgesetzt). Details:
`docs/decisions/ADR-0002-hosting-und-sitzplatz-links.md`.

### Beitritts-Links (Raum `tac`)

Jeder Spieler klickt seinen Link und landet automatisch auf dem richtigen Platz.
Sitzplatz-Nummer im Link ist 0-basiert (`seat=0` = angezeigter „Platz 1").

| Spieler  | Platz (Farbe)        | Link |
|----------|----------------------|------|
| Thomas   | Platz 1 – Blau (Team A)  | https://tac-client.onrender.com/?room=T-T-M-S_Freunde&name=Thomas&seat=0 |
| Torsten  | Platz 2 – Gelb (Team B)  | https://tac-client.onrender.com/?room=T-T-M-S_Freunde&name=Torsten&seat=1 |
| Matthias | Platz 3 – Grün (Team A)  | https://tac-client.onrender.com/?room=T-T-M-S_Freunde&name=Matthias&seat=2 |
| Steffen  | Platz 4 – Rot (Team B)   | https://tac-client.onrender.com/?room=T-T-M-S_Freunde&name=Steffen&seat=3 |

Teams sitzen gegenüber: Thomas + Matthias (Team A), Torsten + Steffen (Team B).

Lokal lässt sich die Server-Adresse ebenfalls über `VITE_SERVER_URL` setzen
(z. B. in einer `.env` im Client-Paket); ohne die Variable wird
`ws://<host>:3001` angenommen.

## Monorepo-Struktur

```
packages/
  shared/   @tac/shared – gemeinsame Typen & reine Funktionen (Deck, State)
  server/   @tac/server – WebSocket-Server, hält & synchronisiert den Zustand
  client/   @tac/client – React + Vite Brett-UI (SVG, Drag & Drop)
docs/       Anforderungen, Architektur, Entscheidungen
```

## Mitwirken

Konventionen und Arbeitsweise siehe `AGENTS.md` (Document First, Tests,
Traceability Requirement ↔ Code ↔ Test).
