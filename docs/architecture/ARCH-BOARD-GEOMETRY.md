# Brett-Geometrie: Herleitung aus dem hexagonalen Kreisgitter

**Kennung:** `ARCH-BOARD-GEOMETRY`
**Version:** 1.0
**Stand:** 2026-09-22
**Bezug:** `REQ-BOARD` B1 (Brettdarstellung), Code: `packages/client/src/board/geometry.ts`,
Referenzzeichnung: `vorlage/board.svg`

> Ziel: Die komplette Brett-Geometrie (Grundkreise, Ringe, Häuser, Hausmulden)
> lässt sich aus **einem einzigen Maß** – dem Gitter-Grundradius `r` – exakt
> berechnen. Diese Datei hält die Herleitung fest, damit sie für Feintuning und
> für einen späteren eigenständigen SVG-Generator des kompletten Spielfelds
> jederzeit reproduzierbar ist.

---

## 1. Das Grundgitter (hexagonale Kreispackung)

Das Brett basiert auf einem **hexagonalen Kreisgitter**. Alle Kreise haben
denselben Radius `r` und überschneiden sich je zur Hälfte (der Mittelpunkt des
nächsten Kreises liegt auf dem Rand des vorherigen).

- **Vertikaler** Mittelpunktabstand innerhalb einer Spalte: `r`
- **Horizontaler** Spaltenabstand: `r · √3/2`
- Nachbarspalten sind vertikal um `r/2` versetzt.

Die Schnittpunkte zweier vertikal benachbarter Kreise (nicht die Tangenten)
werden zu den Mittelpunkten der jeweils nächsten Spalte links/rechts.

### Kontur: Sechseck mit 4 Kreisen pro Kante

Ausgehend von einer **mittleren Spalte mit 7 Kreisen** dünnt jede weitere Spalte
nach außen um einen Kreis aus, bis 4 erreicht sind. Spalten-Sequenz von links
nach rechts:

```
4 - 5 - 6 - 7 - 6 - 5 - 4   (insgesamt 37 Kreise)
```

Das ergibt ein **vertikal orientiertes Sechseck** mit 4 Kreisen pro Kante.

> Hinweis: Die Referenzzeichnung `vorlage/board.svg` verwendet `r = 140` und das
> Brettzentrum bei `(400, 560)`. Die reale Brettmessung (Inkscape) ergab
> `r ≈ 142`; für die Konstruktion wird `r` als freier Parameter behandelt.

### Nummerierung (für Konstruktion)

- **Spalten** 1..7 von links nach rechts (Spalte 4 = Mitte, 7 Kreise).
- **Reihen/Kreise** je Spalte von oben nach unten gezählt. Da Spalten mit gerader
  Kreiszahl (4, 6) gegenüber ungeraden (5, 7) vertikal versetzt sind, wird
  bewusst „Spalte + n-ter Kreis von oben" statt einer globalen Reihennummer
  benutzt.

---

## 2. Die konzentrischen Ringe

Beide Ringe teilen das Brettzentrum `C`.

| Ring | Formel | Wert bei `r = 140` | Bedeutung |
|------|--------|--------------------|-----------|
| Innerer Ring | `3 · r` | `420` | Innere Abgrenzung der 64 Laufbahn-Mulden |
| Äußerer Ring | `2 · √3 · r` | `484,97` | Äußere Abgrenzung der Laufbahn |
| Laufbahn-Mitte | `(3 + 2√3)·r / 2` | `452,49` | Mittelpunktlinie der 64 Mulden (`circleRadius`) |

Der äußere Ring geht exakt durch den (hypothetischen) Mittelpunkt der nächsten,
nicht mehr gezeichneten Gitterspalte auf Zentrumshöhe – daher `2√3·r`.

**Verhältnis** äußerer/innerer Ring: `2/√3 ≈ 1,1547`.

Die **64 Laufbahn-Mulden** liegen **mittig zwischen** den beiden Ringen, also auf
`circleRadius = (3·r + 2√3·r)/2 ≈ 3,232·r`, gleichmäßig auf dem Kreis verteilt
(`Δθ = 360°/64 = 5,625°`).

---

## 3. Häuser: Zentren

Jeder der 4 Spieler hat ein Haus. Die Hauszentren liegen auf Gitterpunkten:

| Haus | Lage relativ zum Brettzentrum `C` | Position bei `r = 140`, `C = (400, 560)` |
|------|-----------------------------------|------------------------------------------|
| links | `−√3·r` horizontal | `(157,51, 560)` |
| rechts | `+√3·r` horizontal | `(642,49, 560)` |
| oben | `−2·r` vertikal | `(400, 280)` |
| unten | `+2·r` vertikal | `(400, 840)` |

(`√3·r = 2 · r·√3/2` = zwei Spaltenabstände; `2·r` = zwei Reihenabstände.)

---

## 4. Hausmulden: die zentrale Erkenntnis

Jedes Haus hat **4 Mulden**, angeordnet auf einem Kreis um das Hauszentrum:

```
R_mulde = r / √3   ( = 80,83 bei r = 140 )
```

Dieser Radius ist **nicht willkürlich**: Die Mulden liegen exakt auf den
**Schnittpunkten der Gitter-Verbindungslinien** (Diagonalen zwischen benachbarten
Gitterpunkten). `r/√3` ist der Schwerpunkt-Eckpunkt-Abstand im gleichseitigen
Dreieck der Gitterpunkte.

> Verifikationsanker: Die 9-Uhr-Mulde des linken Hauses ist der Schnittpunkt der
> Linien `(Spalte1, 2. Kreis)→(Spalte2, 4. Kreis)` und
> `(Spalte1, 3. Kreis)→(Spalte2, 2. Kreis)` und liegt bei `(76,68, 560)` –
> exakt `r/√3` links vom Hauszentrum `(157,51, 560)`.

### Winkel-Anordnung (0° = rechts / 3 Uhr, gegen den Uhrzeigersinn)

Wichtig: **links/rechts** und **oben/unten** sind unterschiedlich orientiert
(um 30° gedreht):

| Haus | Winkel (Grad) | Uhrzeiten |
|------|---------------|-----------|
| links | `0, 60, 180, 300` | 3, 1, 9, 5 |
| rechts | `180, 120, 0, 240` | 9, 11, 3, 7 |
| unten | `0, 60, 120, 180` | 3, 1, 11, 9 |
| oben | `0, 300, 240, 180` | 3, 5, 7, 9 |

- **links/rechts:** achsen-orientiert; die seitlichen Mulden zeigen **zur
  Brettmitte hin** (nach innen). Links und rechts sind daher **gespiegelt**,
  nicht identisch – sonst wäre ein Haus um 180° verdreht.
- **unten:** in den oberen Dreieckslücken (zum Zentrum hin geöffnet).
- **oben:** gespiegelt dazu (untere Dreieckslücken, zum Zentrum hin geöffnet).

### Umrechnung in SVG-Koordinaten

In SVG zeigt `+y` nach unten, daher `sin` **subtrahieren**:

```
x = hausZentrum.x + R_mulde · cos(θ)
y = hausZentrum.y − R_mulde · sin(θ)
```

---

## 5. Weitere Brett-Kreise (Dekoration)

- **Deko-Kreis pro Haus:** gemessen `≈ 63` bei realem `r ≈ 142`
  (`≈ 0,444·r`). Rein visuelle Andeutung des Hauses, innerhalb von `R_mulde`.
  Für ein sauberes geometrisches Verhältnis liegt bislang **keine** eindeutige
  Formel vor; bei einem eigenen SVG kann dieser Kreis frei gewählt werden.
- **Mulden-Radius (kleine Löcher):** gemessen `≈ 15` bei `r ≈ 142`
  (`≈ 0,106·r`). Rein für die Darstellung; nicht geometrisch zwingend.

---

## 6. Umsetzung im Code

`packages/client/src/board/geometry.ts`:

- `BoardGeometry.gridRadius` = `r` (Basis-Maß).
- `defaultGeometry(size)`:
  `gridRadius = size · 0,1385`,
  `circleRadius = (3·r + 2√3·r)/2` (Laufbahn-Mitte, nicht der äußere Ring),
  `center = (size/2 − 4, size/2 − 3)`.
  (Faktor `0,1385` und der Zentrums-Offset sind gegen das Hintergrundbild
  `vorlage/Board.png` kalibriert. Dies sind die einzigen Feintuning-Hebel.)
- `housePositions(seat, geo)` berechnet Hauszentren und die 4 Mulden je Haus
  ausschließlich aus `geo.gridRadius` und `geo.center` nach den Formeln oben.

Tests: `packages/client/src/board/geometry.test.ts`.

---

## 7. Für einen späteren eigenständigen SVG-Generator

Alles Nötige für ein komplettes Brett aus einem Parameter `r`:

1. **Grundgitter** (optional, als Hintergrund): 37 Kreise, Spalten `4-5-6-7-6-5-4`,
   Spaltenabstand `r·√3/2`, Reihenabstand `r`, Versatz `r/2`.
2. **Ringe:** innen `3·r`, außen `2√3·r` um `C`.
3. **64 Laufbahn-Mulden:** auf dem äußeren Ring, `Δθ = 5,625°`.
4. **4 Hauszentren:** `±√3·r` / `±2·r` um `C`.
5. **16 Hausmulden:** je Haus `R_mulde = r/√3`, Winkel gemäß Tabelle in §4.
6. **Vorfelder:** außerhalb des äußeren Rings (Detail-Layout offen).

`viewBox` aus der Bounding-Box aller Elemente berechnen, damit nichts
abgeschnitten wird (in der Vorlage war das linke Abschneiden ein reines
viewBox-Problem, keine Geometrie-Frage).
