# AGENTS.md – Arbeitsrichtlinien für diesen Workspace

Diese Datei beschreibt, wie in diesem Projekt gearbeitet werden soll.
Sie gilt als Standardvorlage und kann pro Projekt erweitert/angepasst werden
(neue Abschnitte einfach unten anhängen, bestehende nicht umbenennen).

---

## 1. Scope / Verzeichnisgrenzen

- Arbeite ausschließlich innerhalb des aktuellen Projektverzeichnisses.
- Zugriffe **außerhalb** dieses Verzeichnisses sind nur erlaubt, wenn:
  - es technisch zwingend notwendig ist (z. B. globale Tool-Installation,
    Systempfad), **und**
  - dann **nur lesend**, nie schreibend/verändernd.
- Falls ein Zugriff außerhalb des Verzeichnisses nötig erscheint:
  1. Erst versuchen, es zu vermeiden bzw. eine Alternative innerhalb des
     Projekts zu finden.
  2. Wenn es nicht anders geht: **nachfragen** oder transparent mitteilen,
     was und warum außerhalb gemacht werden soll, bevor es passiert.

## 2. Sprache

- **Konversation** (Chat mit dem User): Deutsch.
- **Dokumentation** (Markdown-Dateien, Kommentare in Doku, README etc.): Deutsch.
- **Code** (Bezeichner, Kommentare im Code, Commit-Messages): Englisch.

Diese Regel gilt immer, ohne dass sie im Prompt wiederholt werden muss.

## 3. Arbeitsweise: Document First

- Bevor Code geschrieben wird, soll das *Was* und *Warum* dokumentiert sein
  (z. B. kurze Spezifikation, Anforderung, Entscheidung).
- Dokumentation wird **vor oder parallel zur Implementierung** aktualisiert,
  nicht nachträglich "irgendwann".
- Ziel: Jede Doku muss so verständlich sein, dass ein Dritter (oder der User
  selbst später) nachvollziehen kann, *was* gebaut wurde und *warum*.

## 4. Dokumentationsstruktur

Vorschlag für eine saubere, erweiterbare Struktur (anpassen, falls Projekt
eigene Konventionen hat):

```
/docs
  /architecture   -> Architekturentscheidungen, Diagramme
  /requirements   -> fachliche Anforderungen, User Stories
  /decisions      -> ADRs (Architecture Decision Records)
  README.md       -> Einstiegspunkt, Verweise auf Unterordner
```

- Jede Doku-Datei hat einen klaren Titel und ein Datum/Version, falls relevant.
- Keine "toten" Dokus: veraltete Inhalte werden aktualisiert oder entfernt,
  nicht einfach liegen gelassen.

## 5. Tests

- Zu jeder relevanten Funktionalität gehören **ausreichende automatisierte
  Tests** (Unit-Tests mindestens, wo sinnvoll auch Integrationstests).
- Tests dienen zwei Zwecken:
  1. **Verifikation**: Der Agent kann selbst prüfen, ob die Implementierung
     funktioniert (Tests müssen lokal ausführbar sein und laufen).
  2. **Verständnis-Check**: Testfälle sollen so geschrieben sein, dass der
     User anhand der Testfälle erkennen kann, ob die Anforderung richtig
     verstanden wurde (aussagekräftige Testnamen, klare Given/When/Then-
     Struktur oder Äquivalent).
- Nach jeder Implementierung: Tests laufen lassen, Ergebnis im Chat kurz
  zusammenfassen (nicht nur "done" behaupten).

## 6. Allgemeine Konventionen

- Commits/PRs nur auf ausdrücklichen Wunsch des Users.
- Keine unnötigen neuen Dateien (insb. keine zusätzlichen Markdown-Dateien),
  außer sie sind Teil der vereinbarten Doku-Struktur.
- Bestehende Konventionen im Projekt (Formatierung, Linting, Ordnerstruktur)
  respektieren und fortführen statt neu erfinden.

## 7. Definition of Done

Eine Aufgabe gilt erst dann als abgeschlossen, wenn:

- die relevante Dokumentation (Requirement/Architektur/ADR) aktuell ist,
- die Implementierung den dokumentierten Anforderungen entspricht,
- ausreichende Tests existieren **und** erfolgreich durchlaufen wurden,
- das Ergebnis dem User in einer kurzen, konkreten Zusammenfassung
  mitgeteilt wurde (kein reines "fertig", sondern was/wie getestet wurde).

Ein Task wird nicht als erledigt markiert, nur weil Code geschrieben wurde.

## 8. Traceability (Requirement ↔ Code ↔ Test)

- Jede nicht-triviale Anforderung bekommt eine kurze Kennung/Referenz
  (z. B. Dateiname oder Kurztitel in `/docs/requirements`).
- Diese Referenz taucht wieder auf:
  - im Commit-Message-Bezug (z. B. "implements: <requirement>"),
  - idealerweise im Testnamen oder Test-Kommentar.
- Ziel: Von der Anforderung zum Code und zu den Tests navigieren können –
  und umgekehrt nachvollziehen, warum ein Stück Code existiert.

## 9. Umgang mit Unsicherheit

- Bei fachlichen oder technischen Unklarheiten: **aktiv nachfragen**,
  nicht raten oder stillschweigend Annahmen treffen.
- Getroffene Annahmen (falls eine Rückfrage nicht möglich/sinnvoll ist)
  werden explizit im Chat und/oder in der Doku benannt.
- Lieber eine kurze Rückfrage zu viel als eine falsche Implementierung.

## 10. Security-Grundregeln

- Keine Secrets, Passwörter, Tokens oder Zugangsdaten im Code, in Configs
  oder in der Dokumentation.
- `.env`-Dateien bzw. äquivalente lokale Konfigurationsdateien mit
  sensiblen Daten werden nie committet (Eintrag in `.gitignore` sicherstellen).
- Bei Einbindung neuer Abhängigkeiten: kurzer Check auf Aktualität/Wartungsstatus,
  keine offensichtlich unseriösen oder verwaisten Packages.

## 11. Setup & Reproduzierbarkeit

- Jedes Projekt hat eine aktuelle Anleitung (README.md im Projekt-Root),
  wie man es lokal aufsetzt, startet und die Tests ausführt.
- Wird das Setup/der Start-Prozess geändert (neue Dependency, neuer Befehl,
  neue Umgebungsvariable), wird die README **im selben Zug** aktualisiert.
- Ziel: Ein Dritter (oder der User nach längerer Pause) kann das Projekt
  ohne Rückfragen zum Laufen bringen.

## 12. Versionierung & Changelog

- Jedes Projekt führt eine `CHANGELOG.md` im Projekt-Root, Format angelehnt
  an [Keep a Changelog](https://keepachangelog.com/) (Abschnitte "Added",
  "Changed", "Fixed", "Removed" je Version/Datum).
- Bei jeder funktional relevanten Änderung wird **im selben Zug** ein
  Eintrag in der `CHANGELOG.md` ergänzt (nicht nachträglich "irgendwann").
- Versionsnummern folgen, wo sinnvoll, [Semantic Versioning](https://semver.org/)
  (MAJOR.MINOR.PATCH).
- Ziel: Änderungen über die Zeit nachvollziehbar machen, ohne dafür die
  Git-History durchsuchen zu müssen.

---

<!--
Erweiterungsbereich:
Neue Abschnitte (z. B. projektspezifische Regeln, Tech-Stack-Vorgaben,
CI/CD-Hinweise) hier unten anfügen, mit eigener Nummerierung/Überschrift.
-->
