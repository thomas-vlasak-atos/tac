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
- `D9`: Das vollständige Brett bleibt auf Desktop- und kleinen Displays innerhalb
  der verfügbaren Breite und Höhe sichtbar. Im Hochformat wird es zugunsten der
  Bedienknöpfe und eigenen Handkarten höhenbegrenzt. Im Querformat stehen die
  eigenen Handkarten neben dem Brett; die übrige Seitenleiste bleibt sekundär.
- `D10`: Im Querformat werden die eigenen Handkarten neben dem Brett in einem
  kompakten zweispaltigen Raster ohne horizontale Scrollleiste angezeigt.

## Deck-Annahme

## Kartenbilder

Die unter `cards/` abgelegten Entwürfe werden direkt als PNG-Assets verwendet,
ohne sie in SVG nachzuzeichnen. Aktuell sind Designs für 1/13, 4, TAC, Engel,
Krieger und Narr vorhanden. Für noch fehlende Kartentypen bleibt zunächst ein
lesbarer Text-Fallback im gleichen Kartenformat (3:5) aktiv; neue PNGs können später ohne Änderung am
Datenmodell ergänzt werden.

`D11`: Karten mit vorhandenem Bild werden vollständig (Seitenverhältnis 3:5, nichts
abgeschnitten) und ohne zusätzlichen Rahmen dargestellt – das Bild ist die Karte.
Handkarten heben sich beim Überfahren leicht an.

`D12`: Darstellungspriorität je Karte: **SVG-Nachbau** (`ui/cardFaces.tsx`) vor
**PNG-Vorlage** (`cards/`) vor **Text-Fallback**. Als SVG vorhanden: alle
Zahlenkarten (1–10, 12, 13), der Trickser, TAC und alle vier Meisterkarten
(Engel, Teufel, Krieger, Narr) sowie der Kartenrücken (`CardBackFace`/`CardBackSvg`,
verwendet bei Gegnerhänden, Ziehstapel und verdeckten Karten auf dem Brett). Die
PNGs in `cards/` dienen nur noch als Vorlage bzw. Fallback. Alle SVGs nutzen das Koordinatensystem 600 x 1000 der PNGs.

Vorlage für die SVG-Nachbauten: `cards/tac-sonst01-1.jpg` (Foto des Kartensatzes).
Daraus abgeleitet: Zahlen 1, 4, 7, 13 rot (mit Dreiecken bzw. Punkten), die übrigen
Zahlen schwarz mit sechszähliger Farbblume im Zentrum; Trickser mit zwei roten
Rauten und Schriftzug.

**Bestätigt:** Für 3, 5, 8, 9, 10 und 12 liegt keine Vorlage vor. Sie sind wie 2 und 6
als schwarze Zahl mit Blume umgesetzt (vom Projektinhaber bestätigt).

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

Die Primärdokumente (offizielles Regelheft) legen 100 Basiskarten fest, nennen
aber keine Einzelhäufigkeit je Wert. Die Verteilung wurde daher anhand eines
echten TAC-Kartensatzes ausgezählt und in `SINGLE_DECK_COUNTS`
(`packages/shared/src/cards.ts`) hinterlegt: 1 und 13 je 9×, 7 achtmal, alle
übrigen Zahlen je 7×, Trickser 7×, TAC 4× (= 100). Das Deck wird als komplette
Häufigkeit gebaut (nicht mehr aus zwei identischen Hälften), da die Verteilung
nicht symmetrisch verdoppelbar ist. Details siehe REQ-RULES §3. Diese Verteilung
betrifft nur das Austeilen; die Anwendung erzwingt weiterhin keine Kartenregeln.
