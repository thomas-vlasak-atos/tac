# ADR-0001: Freies Brett statt Regel-Engine

**Status:** accepted
**Datum:** 2026-09-21

## Kontext

Ziel des Projekts ist es, dass vier Freunde TAC online gemeinsam spielen können.
Ursprünglich war eine vollständige Regel-Engine geplant, die alle Spielregeln
(inkl. komplexer Sonderfälle wie TAC-Ketten, Meisterkarten) kennt und erzwingt.

Bei der Abstimmung kam die Idee auf, stattdessen ein **freies Brett** zu bauen:
Die Spieler ziehen die Kugeln selbst (wie am echten Tisch), der Computer prüft
keine Regeln. Motivation:

- Eine bestehende Online-Version wirkte "künstlich" – ein freies Brett kommt dem
  echten Spielgefühl näher.
- Die Spieler kennen die Regeln und halten sie – wie offline – selbst ein.
- Deutlich geringerer Aufwand und keine Regel-Bugs.

## Entscheidung

Wir bauen ein **freies, synchronisiertes Brett** ohne Regeldurchsetzung:

- Kugeln frei per Drag & Drop bewegbar (keine Legalitätsprüfung).
- Karten werden digital verwaltet (Geben, eigene Hand privat, Ablegen, Tauschen).
- Ein **einblendbarer Verlauf** (Liste der letzten Züge) gibt Sicherheit bei
  Rückwärts-/TAC-Situationen. Kein Undo.
- Der Server synchronisiert den Zustand und filtert nur die Sichtbarkeit
  (eigene Hand privat).

Die zuvor erstellte Regel-Spezifikation `REQ-RULES` bleibt als **Referenz**
erhalten (Nachschlagewerk; Basis für spätere, optionale nicht-verbietende Hilfen),
wird aber nicht technisch erzwungen. Das geplante Paket `engine` entfällt.

## Konsequenzen

**Positiv**
- Spielgefühl sehr nah am echten TAC.
- Kein Streit über Computer-Regelauslegung; keine Regel-Bugs.
- Schnellere Umsetzung, wartungsärmer.

**Negativ / Risiken**
- Keine Absicherung gegen versehentliche oder falsche Züge (bewusst akzeptiert,
  wie offline). Der Verlauf mildert dies ab.
- Sonderfälle (z. B. verdeckte Karteneinsicht beim Teufel) müssen ggf. "auf
  Zuruf" gehandhabt werden.

**Reversibilität**
- Später erweiterbar um optionale, nicht-verbietende Hilfen auf Basis von
  `REQ-RULES`, ohne die Grundarchitektur zu ändern.
