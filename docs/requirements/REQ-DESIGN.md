# Anforderung: TAC Online – visueller Ausbau

**Kennung:** `REQ-DESIGN`
**Version:** 0.2
**Stand:** 2026-09-22

## Ziel

Die digitale Partie soll sich stärker wie ein hochwertiger TAC-Spieltisch anfühlen,
ohne die Entscheidungshoheit der Spieler oder das freie Brett aus `REQ-BOARD` zu
verändern.

## Anforderungen

- `D1`: Das Brett verwendet eine warme Holzoptik, farbige Glas-/Murmelflächen und
  klare Start-, Haus- und Vorfeldbereiche.
- `D2`: Das Brett wird pro Spieler so gedreht, dass der eigene Sitzplatz unten
  liegt. Die gespeicherten Spielpositionen bleiben unverändert.
- `D3`: Beim Ziehen werden Quellposition und Ziel visuell hervorgehoben.
- `D4`: Karten werden als eigenständige, lesbare Spielkarten mit Farbe, Symbolik
  und Wert dargestellt.
- `D5`: Die Kartenablage zeigt Urheber und eine natürliche Überlagerung. Die
  zuletzt abgelegten Karten können wieder in die Hand genommen werden.
- `D6`: Das Brett wird als eigene interaktive SVG-Illustration im Stil der
  Vorlagen umgesetzt, nicht als statisches Foto.
- `D6a`: `vorlage/Board.png` darf als saubere Brettgrundlage verwendet werden;
  interaktive Inhalte werden als transparente Overlays darübergelegt.
- `D6b`: Die Overlay-Geometrie arbeitet im Originalmaß `1024 × 1024`; Hausfelder
  werden anhand der kleinen Hauskreise kalibriert. Die Uhrpositionen sind je
  Seite explizit hinterlegt, da links und rechts einen freien Sektor haben.
- `D7`: Die Handkarten fremder Spieler werden als Rücken dargestellt; ihre Anzahl
  bleibt sichtbar.
- `D8`: Sonderaktionen mit fremder Hand erfordern eine sichtbare Bestätigung des
  betroffenen Spielers.

## Deck-Annahme

## Kartenbilder

Die unter `cards/` abgelegten Entwürfe werden direkt als PNG-Assets verwendet,
ohne sie in SVG nachzuzeichnen. Aktuell sind Designs für 1/13, 4, TAC, Engel,
Krieger und Narr vorhanden. Für noch fehlende Kartentypen bleibt zunächst ein
lesbarer Text-Fallback aktiv; neue PNGs können später ohne Änderung am
Datenmodell ergänzt werden.

## Bedienmodell

Handkarten sind per Drag & Drop bedienbar. Ziehen auf das Brett legt offen ab;
Ziehen in den Partnerbereich legt verdeckt für den gegenüberliegenden Spieler.
Der Empfänger nimmt das Angebot bewusst an. Es gibt keine technische Sperre,
die auf die anderen Spieler oder auf eine vollständige Tauschphase wartet.

## Brettreferenz

Die Vorlagen unter `vorlage/` definieren die visuelle Richtung für den späteren
Brettausbau: quadratische Holzplatte, großer Kreis aus eingelassenen Kugellöchern,
feine florale Verbindungslinien, zentrale Mulde und vier Eckmulden. Die Fotos
dienen als Referenz; sie werden wegen enthaltener Kugeln, Karten und Perspektive
nicht direkt als UI-Hintergrund eingeblendet. Die interaktiven Felder werden als
eigene SVG-/CSS-Geometrie nachgebildet.

Die Primärdokumente legen 100 Basiskarten fest, nennen aber keine Einzelhäufigkeit
je Wert. Bis eine verbindliche `REQ-DECK` vorliegt, bleibt die bestehende und
reproduzierbare Verteilung aktiv: zwei identische 50-Karten-Stapel, je 3 Karten
pro Zahlenwert (ohne 11), 7 TAC-Karten und 7 Trickser. Diese Annahme betrifft
nur das Austeilen; die Anwendung erzwingt weiterhin keine Kartenregeln.
