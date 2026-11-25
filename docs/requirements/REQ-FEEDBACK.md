# Anforderungen: Feedback aus dem Praxistest (Runde 2)

**Kennung:** `REQ-FEEDBACK`
**Version:** 0.2
**Stand:** 2026-11-25
**Status:** UMGESETZT (F1–F4, F7–F12). F5 und F6 hängen an der manuellen Bearbeitung
> von `vorlage/Board.png`. Die Abschnitte unten beschreiben Entwurf **und** Entscheidungen;
> bei Abweichungen gelten §4 und das `CHANGELOG`.

> Quelle: Rückmeldungen der Mitspieler aus dem Spiel zu viert plus eigene
> Beobachtungen des Projektinhabers. Die Punkte ergänzen `REQ-BOARD` und
> `REQ-DESIGN`; nach Umsetzung werden sie dort eingearbeitet.
> Leitidee bleibt: **freies Brett, keine Regelprüfung** (ADR-0001).

---

## 0. Ist-Stand: Wie wird das Brett gezeichnet?

- **Hintergrund = Bild.** `vorlage/Board.png` (1024 × 1024) wird in `Board.tsx` als
  `<image>` eingebunden. Dort sind Holz, Blume-des-Lebens-Linien, die 64 Mulden,
  die 16 Hausmulden, die vier Eckmulden (Vorfelder) und die Mittelmulde bereits
  „eingebrannt".
- **Alles Interaktive = SVG-Overlay** im gleichen Koordinatensystem (1024 × 1024),
  berechnet in `board/geometry.ts`: Feld-Markierungen, Kugeln (Radialverlauf, Schatten),
  Namen, Kartenrücken, Reststapel, Ablage.
- **Folge für die Wünsche:** Alles, was *im* Bild steckt (Haus-Mulden, Mulden-Kontrast),
  lässt sich nur durch Überzeichnen ändern oder durch ein neues Brettbild ersetzen.
  Alles andere (Punkte, Markierungen, Animationen) ist reine SVG-/CSS-Arbeit.
- **Option „Brett komplett als SVG":** würde Häuser und Mulden voll steuerbar machen
  (Kontrast, Zählpunkte, Hausform), kostet aber Aufwand, und das Foto-Holz wäre weg.
  Empfehlung: **Bild behalten**, gezielt überzeichnen (siehe F6, F9).

---

## 1. Übersicht und Priorität

Priorität: **A** = hoher Nutzen/kleiner Aufwand, **B** = wichtig, **C** = später,
**Spaß** = Gimmick (vom Projektinhaber „Prio 10000", also bewusst zuletzt).

| ID  | Thema                                        | Prio | Aufwand | Server nötig |
|-----|----------------------------------------------|------|---------|--------------|
| F1  | „Wer war dran / wer ist jetzt dran" erkennen | A    | M       | teils        |
| F2  | Letzten Zug besser sichtbar machen           | A    | M       | nein         |
| F3  | Ton bei Zug / „Du bist dran"                 | B    | S       | nein         |
| F4  | Kontrast/Sichtbarkeit der Kugeln             | B    | S       | nein         |
| F5  | Zählpunkte (jedes 2. Feld) – Bild von Hand   | A    | S       | nein         |
| F6  | Hausdarstellung – Bild von Hand, dann Kalib. | C    | S       | nein         |
| F7  | Zielhilfe beim Ziehen (nur Stufe 1)          | B    | S       | nein         |
| F8  | Teufel: Nachbarkarten größer                 | A    | S       | nein         |
| F9  | Karten per Drag & Drop **und** Klick         | B    | M       | nein         |
| F10 | Einstellungen (lokal) mit Schaltern          | A    | S       | nein         |
| F11 | Meisterkarten besser einsehbar               | B    | S       | nein         |
| F12 | Gimmick: „Steffen-Button" (Anstupsen)        | Spaß | M       | ja           |

Aufwand: S ≈ unter 2 h, M ≈ halber Tag. Grobe Schätzung.

Empfohlene Reihenfolge: **F10 → F8 → F5 → F2/F1 → F3 → F4 → F7 → F9 → F11 → F6 → F12**.
F10 zuerst, weil F3, F5, F7, F9 daran hängen (jeweils ein Schalter).

---

## 2. Einzelanforderungen

### F1 – Erkennen, wer gespielt hat und wer jetzt dran ist

**Problem:** Man sieht nicht, dass der Vorgänger fertig ist und man selbst dran wäre.

**Wichtige Randbedingung:** Die App kennt **kein Zugrecht** (freies Brett). Ein „Am Zug"
kann deshalb nur **abgeleitet und rein informativ** angezeigt werden, nicht erzwungen.

**Ableitung (Vorschlag):**
- Letzter Spieler = `actor` des jüngsten `discardEntries`-Eintrags (spielt eine Karte aus).
- „Dran" = nächster **belegter** Sitz im Uhrzeigersinn (`actor + 1`, freie Sitze überspringen).
- Nach dem Geben/Tausch: erster Spieler = links vom Geber (= `deckHolder`, Annahme, bitte prüfen).
- Sonderfälle, die die Ableitung stören: **Teufel** (A spielt für B – danach ist
  trotzdem der Nachfolger von B dran), **Narr**, **Engel**. Der Teufel-Eintrag
  trägt `actor` = Teufel-Spieler, gemeint ist aber der Nachbar. Hier müsste der
  Server das „gespielt für" mitliefern (kleine Erweiterung von `DiscardEntry`).

**Entscheidung (O7, 2026-11-24):** Ein „Zug abgeschlossen" ist nicht sauber erkennbar
(ein Spieler bewegt ggf. mehrere Kugeln). Es genügt daher: **Nachdem der Vorgänger eine
Karte gespielt hat, wird der nächste Spieler im Uhrzeigersinn markiert.** Die
Annahme „links vom Geber beginnt" ist bestätigt.

**Umsetzung:**
- Ableitung als **reine, getestete Funktion** in `@tac/shared` (`nextToPlay(state)`),
  kein Serverzustand nötig außer der Teufel-Erweiterung.
- **Änderung 2026-11-24:** Der Marker erscheint erst, wenn nach der gespielten Karte
  eine Kugel bewegt wurde (Karte spielen merkt vor, Kugelzug löst aus; Flag
  `ballMovedSinceCard`), und liegt als Ring ums **Vorfeld** (Name in der Mitte) statt
  ums Startfeld.
- Anzeige (ursprünglich): **Ring um das Startfeld** des Spielers, der dran ist (Feld `seat * 16`,
  leicht pulsierend, in **Spielerfarbe**, nicht gelb – siehe F2). Zusätzlich Banner
  „Du bist dran" in der Kopfzeile, wenn man selbst gemeint ist.
- Per Einstellung abschaltbar (F10), da nicht verlässlich (Teufel/Sonderfälle).

**Akzeptanz:**
- Nach einer abgelegten Karte wechselt der Marker auf den nächsten belegten Sitz.
- Bei freiem Sitz wird dieser übersprungen.
- Teufel-Zug: Marker springt nach dem **Opfer**, nicht nach dem Teufel-Spieler.
- Bei neuer Runde zeigt der Marker den Startspieler.

### F2 – Letzten Zug besser sichtbar machen

**Problem:** (a) Markierungsfarbe ist **gelb** und wirkt wie die gelben Kugeln;
(b) man sieht nicht, *was genau* passiert ist.

**Ist-Stand:** `Board.tsx` malt Quelle `#e7a928` (dunkelgelb) und Ziel `#f7e28b` (hellgelb)
als Kreis um das Feld, bleibend bis zur nächsten Bewegung.

**Vorschlag (kombinierbar, von klein nach groß):**
1. **Neutrale, kontrastreiche Farbe** statt Gelb: z. B. **Magenta/Pink** oder **Weiß
   mit dunklem Rand** (kommt weder als Kugelfarbe noch als Holz vor). Quelle = **Ring
   gestrichelt**, Ziel = **Ring durchgezogen**, damit auch ohne Farbe unterscheidbar
   (barrierefrei).
2. **Pfeil** von Quelle nach Ziel (gebogen entlang des Kreises, bei langem Weg
   die Richtung im Uhrzeigersinn). Zeigt „was" sofort. Dünn, halbtransparent, unter
   den Kugeln.
3. **Kurze Animation beim Eintreffen** eines fremden Zugs: Kugel gleitet in
   ~400 ms von der Quelle zum Ziel (statt zu springen), Ziel-Ring pulsiert 2×.
   Nur bei **Fremdzügen** (eigene Zugbewegung ist ja schon sichtbar durch Ziehen).
   `prefers-reduced-motion` respektieren, per Einstellung abschaltbar (F10).
4. **Schrittzähler am Ziel** („+7") als kleine Beschriftung beim Zielfeld, wenn
   beide Felder auf dem Kreis liegen. Hilft Nachvollziehbarkeit (Rückwärts/TAC).
5. **Gespielte Karte hervorheben:** zuletzt abgelegte Karte in der Mitte mit Rand
   in Spielerfarbe (ist teils da) und kurzem „Einflug"-Effekt aus Richtung des Spielers.

**Empfehlung für Runde 1:** Punkt 1 + 2 + 3 (Farbe, Pfeil, Gleit-Animation). 4 und 5
optional nachziehen.

**Erweiterung (Wunsch Projektinhaber): Zug Feld für Feld „nachzählen".**
Statt zu gleiten springt die Kugel so von Feld zu Feld, wie man von Hand zählt:
- **Kurze Strecke (≤ 5 Felder):** jedes Feld einzeln (~120 ms pro Schritt).
- **Längere Strecke (> 5):** in **2er-Schritten** (übersprungenes Zwischenfeld blitzt
  kurz auf); ein ungerader Rest wird als Einzelschritt gezählt.
- **Vor und im Haus:** immer **Einzelschritte** (die letzten Felder vor dem eigenen
  Startfeld und alle Hausfelder).
- Optional laufender Zähler am Ziel („3 … 5 … 7"), am Ende bleibt das Ziel markiert.
- **Wegermittlung (reine, getestete Funktion `movePath(from, to)`):** Weil der Server
  nur Quelle und Ziel kennt, wird der Weg abgeleitet:
  - Kreis → Kreis: im Uhrzeigersinn, wenn die Distanz plausibel ist (≤ 16); ist
    rückwärts (≤ 4) kürzer, rückwärts (TAC); sonst direkter Gleitflug.
  - Kreis → eigenes Haus: auf dem Kreis bis zum eigenen Startfeld, dann Slot 0, 1, 2, 3
    (nur bis zum Zielslot).
  - Haus → Haus: Slot für Slot.
  - Vorfeld → Startfeld und Wurf ins Vorfeld: direkter Gleitflug (kein Zählen).
  - Unbekannte Konstellation: Gleitflug als sicherer Fallback.
  - **Trickser (Tausch zweier Kugeln):** Hier gibt es keinen Zählweg, die Kugel soll
    **quer über das Brett** gleiten. Das braucht **kein Regelwissen**: Ist die Distanz
    weder vorwärts (≤ 16) noch rückwärts (≤ 4) plausibel, greift automatisch der
    Gleitflug (Gerade, leicht gebogen, damit sich die beiden Kugeln nicht verdecken).
    Ein Tausch besteht aus zwei Kugelbewegungen; damit beide sichtbar sind, merkt sich
    der Client die **letzten 2 Bewegungen** (statt nur einer) und spielt sie
    gleichzeitig bzw. kurz nacheinander ab. Kleine Erweiterung von `lastBallMove`
    (Liste statt Einzelwert), weiterhin rein visuell.
    Randfall: Liegt der Tausch zufällig innerhalb von 16 Feldern, würde gezählt statt
    geglitten; akzeptiert (nur Darstellung).
- Es ist reine Darstellung (keine Regelprüfung); der Weg kann bei seltenen Sonderfällen
  (Engel, Krieger, Teufel) vom echten Spielweg abweichen. Überspringbar durch Klick,
  abschaltbar (F10), `prefers-reduced-motion` wird respektiert.

**Akzeptanz:** Quelle und Ziel sind ohne Kenntnis der Kugelfarbe eindeutig erkennbar;
keine Markierungsfarbe ist mit einer Kugelfarbe verwechselbar.

### F3 – Töne

**Wunsch:** Ton, wenn jemand gespielt hat; anderer Ton, wenn man selbst dran ist.

**Vorschlag:**
- Zwei kurze, dezente Signale: **„Zug gemacht"** (kurzes Klack/Tick, bei jeder fremden
  Kugel-/Kartenaktion) und **„Du bist dran"** (zweiteiliger, freundlicher Ton).
- Erzeugt per **Web Audio API** (Oszillator, kein Asset nötig) – oder kleine
  eingebettete Audiodateien. Empfehlung: **Web Audio**, kein Lizenzthema, winzig.
- Browser erlauben Ton erst nach Interaktion; der Klick auf „Beitreten" genügt als
  Freischaltung (`AudioContext.resume()`).
- „Du bist dran" hängt an F1 (abgeleitet). Daher nur auslösen, wenn der Marker zu
  **mir** wechselt, nicht bei jeder Aktualisierung.
- Einstellungen (F10): Ton aus/an, getrennt für „Zug" und „Du bist dran", Lautstärke.
  Standard: **an**, dezente Lautstärke. Eigene Aktionen lösen **keinen** Ton aus.
- Tab im Hintergrund: Ton ist hier gerade besonders nützlich; ggf. zusätzlich
  Titelzeile blinken („● Du bist dran").

**Akzeptanz:** Fremdzug → „Zug"-Ton; Wechsel auf mich → „Dran"-Ton; kein Ton bei
eigener Aktion und beim Wiederverbinden/Erstladen.

### F4 – Kontrast der Kugeln

**Beobachtung:** Kugeln seien teils schlecht zu erkennen (Meinung des Projektinhabers
dazu: geteilt). Wird aufgenommen und diskutiert.

**Ursache (vermutet):** Das Hintergrundbild ist hell/beige; hellere Kugeln (Gelb, evtl. Grün)
heben sich schwach ab; die Mulden sind dunkelbraun, aber die Kugel deckt sie fast ganz ab.

**Optionen:**
1. **Dunklerer, dickerer Rand** um jede Kugel (außen dunkel, innen heller Rim).
2. **Stärkerer Schatten**/leichter Glanz.
3. **Kugelfarben nachschärfen** (Sättigung; Gelb etwas Richtung Orange/Gold, falls F2
   Gelb als Markierung ablöst, entspannt sich das Problem ohnehin).
4. **Kontrastmodus** in den Einstellungen (F10): kräftigere Ränder und größere Kugeln
   (z. B. +8 %).
5. **Eigene Kugeln leicht hervorheben** (feiner heller Ring), damit man „meine"
   schnell findet.

**Entscheidung (O6, 2026-11-24):** Das Feedback war allgemein („man sieht nicht gut,
wo die Kugeln sind"). Lösung: **Kugeln etwas größer** zeichnen, damit sie die Mulden im
Hintergrundbild überdecken und sich davon abheben (Radius von `fieldRadius × 1,03` auf
ca. `× 1,25`). Zu prüfen: Kugeln benachbarter Felder (Abstand ≈ 45 px bei Radius ≈ 17 px)
und Vorfeld-Raster (2×2, Abstand ≈ 38 px) überlappen nicht; Fächerung und Markierungsringe
(F2) werden mitskaliert. Der Faktor wird als eine Konstante geführt, damit er schnell
nachjustiert werden kann. Dunklerer Rand (1) bleibt Option, Kontrastmodus (4) entfällt
vorerst.

### F5 – Zählpunkte (jedes 2. Feld)

**Wunsch:** Wie im Original ein kleiner Punkt bei jedem 2. Feld zum leichteren Zählen.

**Entscheidung (O1, 2026-11-24):** Die Punkte werden **vom Projektinhaber von Hand in
`vorlage/Board.png` ergänzt** (Bild ist das Brett). Keine SVG-Punkte, kein Schalter.
Entwickler-Aufgaben: (a) darauf achten, dass die größeren Kugeln (F4) die Punkte
nicht verdecken, wenn diese außerhalb der Mulde liegen; (b) nach Austausch des
Bildes die Kalibrierung (`geometry.ts`, Mulden-Mittelpunkte) gegenprüfen.

**Akzeptanz:** Neues Bild eingebunden, Kugeln liegen weiterhin mittig in den Mulden.

### F6 – Häuser wie im Original

**Beobachtung:** Häuser sind im Original anders gemalt.

**Ist-Stand:** Die Hausmulden stecken im Hintergrundbild (jeweils 4 Mulden im Kreis);
unser Overlay setzt nur Kugeln/Markierungen darauf (`housePositions`, kalibriert pro Seite).

**Entscheidung (O2, 2026-11-24):** Wie F5 wird das Haus **vom Projektinhaber von Hand
in `vorlage/Board.png` angepasst**. Entwickler-Aufgabe nur: nach dem Bildtausch
`housePositions` (Mulden-Mittelpunkte und Slot-Reihenfolge) gegen das neue Bild
prüfen und ggf. nachkalibrieren (Test `geometry.test.ts` ergänzen). Falls das Original
neue Slot-Positionen hat, werden sie anhand des neuen Bildes übernommen.

### F7 – Zielhilfe beim Ziehen einer Kugel

**Wunsch:** Beim Draggen erkennen, wohin die Kugel gezogen werden *könnte*.

**Wichtige Klärung:** Ohne Regel-Engine kennt die App die **erlaubten** Ziele nicht
(und `REQ-BOARD §7` hat Regel-Hilfen verworfen). Deshalb zwei Stufen:

- **Stufe 1 (regelfrei, empfohlen):** Beim Ziehen wird das **Feld, auf dem die Kugel
  einrasten würde** (nächstes Ziel, `nearestTarget`) deutlich hervorgehoben (Ring +
  leicht vergrößerte Mulde) und daneben die **Distanz** angezeigt („+5 Felder" im
  Uhrzeigersinn, „−3" rückwärts). Das löst das reale Problem „wohin lande ich
  genau?" ohne Regelwissen. Zusätzlich das Quellfeld (B4b, ist umgesetzt).
- **Stufe 2 (kartenabhängige mögliche Ziele):** **verworfen** (Entscheidung O3,
  2026-11-24: Stufe 1 reicht). Bleibt regelfrei.

**Akzeptanz Stufe 1:** Während des Ziehens ist das Einrastfeld jederzeit eindeutig
markiert; die Distanz stimmt auch über die Grenze 63 → 0 und aus der Perspektive
mit `off ≠ 0`. Reine Funktion getestet.

### F8 – Teufel: Nachbarkarten zu klein

**Ist-Stand:** Die aufgedeckten Fremdkarten im Teufel-Panel sind **52 px** breit
(`App.tsx`, Teufel-Hand).

**Vorschlag:**
- Karten **so groß wie die eigenen Handkarten** (Raster wie `Hand.tsx`), nicht als
  Miniaturen; eigenes, gut sichtbares Panel oder Overlay über dem Spielfeld.
- Optional: Hover/Tippen **vergrößert** eine Karte stark (Lupe).
- Eine Karte wird **direkt per Klick** gespielt (wie bisher; Entscheidung O4,
  2026-11-24), kein Bestätigungsschritt. Das bestehende Einstufen-Undo (U1) fängt
  Fehlklicks ab.

**Akzeptanz:** Wert, Farbe/Symbol jeder Fremdkarte ohne Zusammenkneifen lesbar,
auch auf kleineren Displays.

### F9 – Karten per Drag & Drop **und** Klick

**Wunsch:** Spieler wollen auch Karten ziehen. Beides erlauben; sonst Schalter.

**Vorschlag:** Beides gleichzeitig, per Schalter (F10) einzeln abschaltbar.
- Die Handkarte lässt sich ziehen; Drop-Ziele:
  - **Spielphase:** Brettmitte (Ablagekreis) → `PlayCard`.
  - **Tauschphase:** Bereich/Symbol „Partner" → `OfferCardToPartner`.
  - Drop außerhalb eines Ziels: Karte schnappt zurück, nichts passiert.
- Klick bleibt wie in K3a (phasenabhängig). Unterscheidung Klick/Drag über
  **Bewegungsschwelle** (z. B. 6 px), damit Klicks nicht als Drag zählen.
- Touch: Pointer Events (wie bei den Kugeln), kein natives HTML5-DnD (unzuverlässig
  auf Mobilgeräten).
- Die Ziel-Zone während des Ziehens sichtbar machen (Ablagekreis leuchtet).
- Schalter: „Karten: Klick" / „Karten: Ziehen" (je an/aus; mindestens einer bleibt an).

**Akzeptanz:** Beide Wege lösen identische Serveraktionen aus; Klick löst nie
versehentlich einen Drag aus und umgekehrt.

### F10 – Einstellungen (lokal)

Zentrale Schalter, **nur pro Gerät** in `localStorage` (kein Servertzustand):

| Schalter                              | Standard | Bezug |
|---------------------------------------|----------|-------|
| Ton „Zug gemacht"                     | aus      | F3    |
| Ton „Du bist dran"                    | aus      | F3    |
| Lautstärke                            | 50 %     | F3    |
| Animationen (Gleiten, Pulsieren)      | an       | F2    |
| „Wer ist dran"-Marker                 | an       | F1    |
| Zählpunkte                            | an       | F5    |
| Feldnummern (existiert bereits)       | aus      | –     |
| Kontrastmodus für Kugeln              | aus      | F4    |
| Kartenbedienung: Klick / Ziehen       | beide an | F9    |
| Steffen-Button sichtbar               | an       | F12   |

Zugang: Zahnrad-Button in der Kopfzeile → kleines Overlay (Stil wie
`MasterCardsHelp`). Reine Funktion `loadSettings/saveSettings` mit Tests;
unbekannte/fehlende Werte fallen auf Standard zurück.

### F11 – Meisterkarten besser einsehbar

**Problem:** Das Overlay verdeckt das Spiel; man muss es immer wieder öffnen/schließen.

**Optionen (kombinierbar):**
1. **Eigenes Fenster/Tab:** Link „In neuem Fenster" öffnet `?view=meisterkarten`
   (statische Seite ohne Spielverbindung). Passt zum Wunsch „zweites Fenster /
   Screenshot". Geringster Aufwand, größter Nutzen.
2. **Angeheftetes Kompaktpanel** in der Seitenleiste (je Karte eine Zeile
   mit Kurztext, Details einklappbar).
3. **Kurzinfo per Hover/Tippen** auf die Meisterkarte in der eigenen Hand (Tooltip
   mit der Wirkung).
4. **Druck-/Screenshot-freundliche Ansicht:** Alle vier Karten nebeneinander auf einer
   Seite, große Schrift.

**Empfehlung:** 1 + 3 (kleiner Aufwand), 2 nur falls das nicht reicht.

### F12 – Gimmick: „Steffen-Button" (Prio 10000)

**Idee:** Für alle außer Steffen ein Button; Druck → bei Steffen kommt ein Ton bzw.
eine Stimme „Steffen, du bist dran!".

**Vorschlag (verallgemeinert, damit es keine Sonderlogik für einen Namen braucht):**
- Neue Client-Aktion `Nudge { target: Seat }`, Server leitet als `ServerMessage`
  `Nudged { from }` **nur an das Ziel** weiter (kein Zustand, nicht im Verlauf oder
  optional ein dezenter Eintrag).
- UI: Pro Mitspieler ein kleiner Button „👉 anstupsen" am Vorfeld/Namen; nur bei
  Mitspielern, nicht bei sich selbst. Beim Namen „Steffen" (Groß-/Kleinschreibung
  egal) zusätzlich der spezielle Text „Steffen, du bist dran!".
- Wiedergabe beim Empfänger:
  - **Variante A (empfohlen):** Web Speech API `speechSynthesis` (de-DE), sagt den
    Text – kein Asset, Qualität je nach Gerät unterschiedlich, kein Server-Aufwand.
  - **Variante B:** Vorab erzeugte **Sprachdatei** (mp3) mit besserer, lustiger
    Stimme im Repo (kleine Datei; Urheberrechts-/Lizenzhinweis der TTS-Quelle prüfen).
  - **Variante C:** Fanfare/Jingle per Web Audio, Text als Einblendung.
- **Missbrauchsschutz:** Abkühlzeit (z. B. 10 s pro Absender/Ziel), max. N pro
  Minute; Empfänger kann das Gimmick abschalten (F10).
- Ton nur, wenn der Empfänger Ton erlaubt hat (Browser-Autoplay!).

**Entscheidung (O5, 2026-11-24):** Für **alle** Spieler, mit dem **eingegebenen
Spielernamen** („{Name}, du bist dran!"). Vorlesen per `speechSynthesis` (de-DE) ist
technisch möglich, auch für beliebige Namen; Aussprache und Stimme hängen vom
Gerät/Browser ab (ungewöhnliche Namen klingen ggf. schief). Fallback: Jingle +
Einblendung, wenn keine deutsche Stimme verfügbar ist. Steffen bekommt weiterhin
optional einen Extra-Gag-Text.

**Akzeptanz:** Button-Klick → nur der Zielspieler hört/sieht es; Abkühlzeit
greift; wenn der Zielspieler getrennt ist, passiert nichts (keine Fehler).

---

## 3. Auswirkungen auf bestehende Dokumente/Code (Überblick)

| Bereich | Änderung |
|---------|----------|
| `packages/shared` | `nextToPlay`-Ableitung (F1), ggf. `DiscardEntry.forSeat` für Teufel (F1), Nachrichtentyp `Nudge`/`Nudged` (F12) |
| `packages/server` | `Nudge` weiterleiten mit Abkühlzeit (F12); Teufel-Zielsitz im Ablageeintrag (F1) |
| `packages/client/src/board` | Markierung/Pfeil/Animation (F2), Zählpunkte (F5), Zielhilfe (F7), Marker „dran" (F1), Kontrast (F4), Haus-Overlay (F6) |
| `packages/client/src/ui` | Einstellungen (F10), Teufel-Panel (F8), Karten-Drag (F9), Meisterkarten (F11), Töne (F3) |
| Tests | reine Funktionen: `nextToPlay`, Distanz/Einrastfeld, Settings-Load/Save, Zählpunkt-Indizes; Server: `Nudge`-Abkühlzeit |
| Doku | `REQ-BOARD` (B-Punkte, §7 „Sound", „Regel-Hilfen"), `REQ-DESIGN`, `STATUS`, `CHANGELOG` |

## 4. Entschiedene Fragen (2026-11-24)

- **O1** Zählpunkte: vom Projektinhaber von Hand ins `Board.png` (F5).
- **O2** Häuser: ebenfalls von Hand ins `Board.png`; Kalibrierung danach prüfen (F6).
- **O3** Zielhilfe: nur Stufe 1 (Einrastfeld + Distanz) (F7).
- **O4** Teufel: Fremdkarte direkt per Klick (F8).
- **O5** Anstupsen für alle, Namensansage per Sprachausgabe (F12).
- **O6** Kugeln etwas größer statt Kontrastmodus (F4).
- **O7** Marker: Ring um das Startfeld des nächsten Spielers im Uhrzeigersinn, nachdem
  der Vorgänger eine Karte gespielt hat (F1).

Noch offen: keine fachlichen Fragen. Technische Feinheiten (genaue Radien,
Tempo der Zähl-Animation) werden beim Umsetzen am laufenden Brett eingestellt.

## 5. Nicht im Scope

- Erzwungene Zugreihenfolge oder Regelprüfung (bleibt ausgeschlossen, ADR-0001).
- Serverseitig gespeicherte Einstellungen/Accounts.
- Austausch des gesamten Brettbilds (nur falls F6 es zwingend erfordert).
