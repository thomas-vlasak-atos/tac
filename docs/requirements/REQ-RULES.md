# Anforderungen: TAC – Spielregeln (Referenz, NICHT erzwungen)

**Kennung:** `REQ-RULES`
**Version:** 0.2 (Entwurf)
**Stand:** 2026-09-21
**Status:** REFERENZ – die Regeln werden von der Anwendung **nicht** technisch
erzwungen.

> **Wichtige Einordnung (seit v0.2):** Das Projekt setzt bewusst ein **freies
> Brett** um (siehe `REQ-BOARD` und `docs/decisions/ADR-0001`). Die Spieler
> ziehen ihre Kugeln selbst und halten die Regeln – wie am echten Tisch – selbst
> ein. Der Computer prüft oder erzwingt **keine** Regeln.
>
> Dieses Dokument bleibt als **fachliche Referenz** erhalten:
> - als Nachschlagewerk für die Spieler,
> - als Grundlage, falls später **optionale, nicht-verbietende** Hilfen
>   (z. B. Hervorheben möglicher Felder) ergänzt werden sollen.
>
> Es beschreibt die Spiellogik von TAC in eigenen Worten und ist **keine**
> Wiedergabe des original TACtik-Regelhefts (© TAC Verlag GmbH). Das Regelheft
> selbst wird nicht ins Repository aufgenommen.
>
> Bezug: **Standard- + Meisterversion** für **4 Spieler / 2 Teams**.
> Andere Varianten (1–3 Spieler, 6er-TAC) sind vorerst nicht im Scope.

---

## 1. Überblick

- 4 Spieler, 2 Teams à 2 Spieler. Teampartner sitzen sich gegenüber.
- Sitzordnung im Uhrzeigersinn: Spieler 0 (Team A), Spieler 1 (Team B),
  Spieler 2 (Team A), Spieler 3 (Team B). Partner: 0↔2, 1↔3.
- Jeder Spieler hat 4 Kugeln einer eigenen Farbe.
- **Ziel:** Das Team, das zuerst alle **8** Kugeln (beide Partner) im Haus hat, gewinnt.

## 2. Brett-Topologie

- **Spielkreis:** 64 Felder, im Kreis angeordnet, Bewegung im Uhrzeigersinn (UZS).
- Jeder Spieler hat ein festes **Startfeld** auf dem Kreis. Die 4 Startfelder
  liegen gleichmäßig verteilt (Abstand 16 Felder).
- **Vorfeld:** Ablage außerhalb des Kreises; hält Kugeln, die noch nicht im Spiel sind.
- **Haus:** 4 Zielfelder pro Spieler, hinter dem eigenen Startfeld. Reihenfolge
  fest; das hinterste (letzte) Feld ist die tiefste Endposition.
- Der Weg ins Haus führt über das eigene Startfeld.

### 2.1 Feld-Modell (Implementierungshinweis)
- Kreisfelder als Indizes `0..63` (global).
- Startfeld von Spieler p: `startIndex[p]` (z. B. 0, 16, 32, 48).
- Hausfelder pro Spieler: `home[p][0..3]`, wobei `home[p][3]` die Endposition ist
  (Reihenfolge = Zugrichtung ins Haus, von "Eingang" zu "hinten").
- Kugelzustand: `VORFELD | KREIS(index) | HAUS(slot)`.

## 3. Kartensatz

Basis-Kartensatz (2 identische Stapel = 100 Karten):
- **Normalkarten** (nur vorwärts, exakte Feldzahl): 2, 3, 5, 6, 9, 10, 12
- **Sonderkarten:** 1, 4, 7, 8, 13, Trickser, TAC
- **Meisterkarten** (je 1×, nur Meisterversion, +4 = 104 Karten):
  Engel, Teufel, Krieger, Narr

Kartenanzahl pro Wert im Detail wird in `REQ-DECK` (separat) festgelegt; für die
Engine ist zunächst nur die Wirkung je Kartentyp relevant.

## 4. Spielablauf (Phasen)

Wiederholt bis Spielende: **Geben → Melden → Tauschen → Spielen**.

1. **Geben:** Mischen (nur nötig, wenn Stapel leer). Je 5 Karten pro Spieler
   im UZS. In der **letzten Runde eines Meister-Durchlaufs** 6 Karten (Meisterrunde).
   Geber-Marker wandert nach links.
2. **Melden:** Jeder Spieler meldet öffentlich nur, **ob** er mind. eine
   Eröffnungskarte (1 oder 13) hält ("kann" / "kann nicht") – nicht welche/wie viele.
3. **Tauschen:** Jeder Spieler gibt verdeckt genau **1 Karte** an seinen
   Teampartner. Ansehen erst nach eigener Abgabe. **Zwang**: es muss getauscht werden.
4. **Spielen:** Startspieler = im UZS nach dem Geber. Reihum je 1 Karte offen
   ablegen und Aktion ausführen ("erst legen, dann bewegen"). Nach 5 (bzw. 6) Runden
   sind alle Handkarten gespielt → nächstes Geben.

## 5. Allgemeine Zugregeln (invariant)

- **R1 – Werfen:** Endet ein Zug exakt auf einem Feld mit fremder/eigener Kugel,
  wird diese geworfen → zurück ins Vorfeld ihres Besitzers.
- **R2 – Kein Überspringen:** Über besetzte Felder (egal welche Farbe) darf nie
  gesprungen werden. Ausnahme: die 7 wirft im Vorbeiziehen (Schritt für Schritt).
- **R3 – Vollständigkeit:** Eine Karte darf nur genutzt werden, wenn ihr Wert
  vollständig gezogen werden kann.
- **R4 – Ungenutzt ablegen:** Nur wenn **keine** legale Aktion existiert, wird eine
  Karte offen ungenutzt abgeworfen.
- **R5 – Zugzwang ("Wer kann, der muss"):** Bestehen legale Züge, muss gezogen
  werden – auch bei Nachteil. Kein freiwilliges Ablegen bei vorhandener Zugmöglichkeit.
- **R6 – Freie Wahl:** Bei mehreren legalen Zügen entscheidet der Spieler frei
  (kein Zwang zu eröffnen/wegzuziehen/zu werfen).
- **R7:** Mehrere eigene Kugeln dürfen gleichzeitig im Kreis sein.
- **R8 – "Karten sind heiß":** 8 (Aussetz-Funktion) und Trickser erfordern
  mind. **eine eigene Kugel im Kreis**.
- **R9:** Eine gerade neu eröffnete Kugel (frisch vom Vorfeld aufs Startfeld)
  darf nicht direkt ins Haus. Sie muss das Startfeld mindestens einmal verlassen haben.
- **R10 – Einzug ins Haus:** Weg ins Haus führt übers Startfeld; Ziel muss ein
  freies Hausfeld sein; im Haus befindliche Kugeln dürfen nicht übersprungen werden.
  Passt keine Karte, dreht die Kugel eine weitere Runde.
- **R11:** Kugeln im Haus dürfen mit passender Karte bis zur Endposition
  weitergezogen werden (auch ohne Kugel im Kreis).
- **R12 – Einrasten:** Eine Kugel auf einer Position, vor der kein freies Hausfeld
  mehr liegt, gilt als **eingerastet** und darf ab dem nächsten Zug nicht mehr bewegt werden.
- **R13:** Kugeln im Haus dürfen nicht zurück in den Kreis (Ausnahme: TAC macht
  den Einzug rückgängig).

## 6. Kartenwirkungen (Standard)

- **1 / 13 (Eröffnungskarten, Doppelfunktion):** Entweder Kugel vom Vorfeld aufs
  Startfeld eröffnen **oder** eine eigene Kugel 1 bzw. 13 Felder vorwärts ziehen.
  Beim Eröffnen wird eine auf dem Startfeld liegende Kugel geworfen.
- **2, 3, 5, 6, 9, 10, 12:** eigene Kugel exakt N Felder vorwärts (UZS).
- **4:** eine eigene Kugel exakt 4 Felder **rückwärts** (gegen UZS). Kein
  Überspringen; wirft auf Zielfeld. Nicht aus dem Haus rückwärts. Frisch eröffnete
  Kugel (auf Startfeld) nicht direkt ins Haus.
  - *Sonderfall "richtungsneutral":* Liegt eine Kugel zum **zweiten Mal** auf dem
    eigenen Startfeld (nicht neu eröffnet, z. B. nach voller Runde oder via Trickser),
    darf sie mit der 4 rückwärts direkt ins Haus (nur wenn alle Hausfelder frei).
- **7:** Summe 7, aufteilbar in beliebige Einzelschritte (1..7) über eine oder
  mehrere eigene Kugeln. **Alle 7 Schritte müssen** gezogen werden.
  - Einzige Karte, die im Vorbeiziehen wirft (jeder Einzelschritt kann werfen).
  - Kann mehrere Kugeln werfen, notfalls auch eigene/Partner-Kugeln.
  - Im Haus dürfen mit der 7 Kugeln hin-/hergezogen werden, sofern sie zu
    Zugbeginn nicht eingerastet waren.
  - *Endphase-Sonderfall:* Reichen Restschritte nach Einzug der letzten eigenen
    Kugel, dürfen sie für Partner-Kugeln verwendet werden.
- **8 (Doppelfunktion):** eigene Kugel 8 Felder vorwärts **oder** nächsten Spieler
  aussetzen lassen (dieser legt 1 Karte ungenutzt offen ab). Aussetz-Funktion nur
  mit eigener Kugel im Kreis (R8). Als letzte Karte der letzten Runde nur die
  Zieh-Funktion.
- **Trickser:** Tausche 2 beliebige Kugeln **im Kreis** (beliebige Farben, auch
  2 eigene). Nur mit eigener Kugel im Kreis; verfällt, wenn nur 1 Kugel im Kreis.
  Kugeln im Haus nicht tauschbar. Muss getauscht werden (auch bei Nachteil).
  - *Sonderfall:* Wird eine Kugel per Trickser direkt aufs eigene Startfeld
    getauscht, darf sie später direkt ins Haus (mit passender Karte).

## 7. Die TAC-Karte

Zwei Funktionen kombiniert: (a) den letzten Zug (des rechten Nachbarn = vorheriger
Spieler) **rückgängig** machen und (b) dessen ausgespielte Karte für den **eigenen**
Zug verwenden.

- **Zugzwang** gilt auch für TAC (wenn einzig spielbar, muss sie gespielt werden).
- Bei Doppelfunktions-Karten (1, 8, 13) wählt der TAC-Spieler frei, welche Funktion
  er anwendet.
- TAC ist nur spielbar, wenn die zurückgenommene Karte für einen **eigenen** Zug
  anwendbar ist; sonst nicht einsetzbar bzw. ungenutzt ablegen.
- Folgt TAC auf eine **ungenutzt abgelegte** Karte, wird nur deren Funktion übernommen.
- **TAC nach Kugel geworfen:** Wurf rückgängig (Kugel zurück auf Ursprung), dann
  Karte selbst anwenden.
- **TAC nach Einzug ins Haus:** einzige Ausnahme zu R13 – Einzug rückgängig,
  Kugel zurück in den Kreis, dann Karte selbst anwenden.
- **TAC direkt nach dem Austeilen:** nicht möglich (kein Zug davor rücknehmbar).
- **TAC nach 8:** 8 rückgängig; TAC-Spieler wählt selbst ziehen (8) oder aussetzen lassen.
  Ein zum Aussetzen aufgeforderter Spieler mit TAC kann die 8 kontern (ziehen/aussetzen)
  oder TAC/andere Karte ungenutzt ablegen.
- **TAC nach Trickser:** Tausch rückgängig; TAC-Spieler tauscht selbst 2 Kugeln.
  Zurückgetauschte Kugel auf Startfeld darf nicht direkt ins Haus (muss Runde gehen).
- **TAC nach TAC (Ketten):** zweite TAC hebt erste auf → Zustand vor erster TAC
  wiederhergestellt; zweiter TAC-Spieler muss die Karte **vor** der ersten TAC für
  sich anwenden. Bis zu 3–4 TAC-Karten in Folge möglich.
- **TAC verhindert Siegeszug:** muss/darf eingesetzt werden, um den 8.-Kugel-Einzug
  des Gegners rückgängig zu machen (wenn Karte selbst anwendbar). Danach keine
  weitere TAC mehr.

## 8. Meisterkarten

- **Engel:** Für den im UZS **folgenden** Spieler eine Kugel vom Vorfeld aufs
  Startfeld setzen (wirft dort liegende Kugel, egal welche Farbe). Hat dieser keine
  Vorfeld-Kugel: eine seiner Kugeln im Spiel 1 **oder** 13 vorwärts. Muss gespielt
  werden (auch ohne eigene Kugel). Der betroffene Spieler ist danach normal am Zug.
  Hat der Betroffene bereits alle Kugeln im Haus → Wirkung geht an dessen Partner,
  Zugreihenfolge bleibt unverändert.
- **Teufel:** Für den im UZS folgenden Spieler eine **seiner** Karten ausspielen
  und die Aktion mit dessen Kugel ausführen (Teufel-Spieler sieht dessen Hand
  verdeckt ein). Der Betroffene ist danach **nicht** noch einmal dran (Zug verbraucht).
  Freie Wahl der Karte/Funktion (auch Trickser, sofern Betroffener Kugel im Kreis hat).
  Als letzte Karte der letzten Runde: Wirkung verfällt. Wählt der Teufel den Narren
  aus dessen Hand → Narr-Funktion (Handtausch) ausführen, dann aus neuen Karten für
  den Folgespieler eine anwenden.
- **Krieger:** Die im UZS auf eine **eigene** Kugel folgende Kugel (egal welche
  Farbe) wird geworfen; die eigene Kugel rückt auf deren Feld. Ohne eigene Kugel im
  Kreis verfällt der Krieger. Sind außer eigenen keine Kugeln im Kreis, wirft man
  sich selbst (bei nur 1 eigenen Kugel → diese wirft sich selbst zurück ins Vorfeld).
- **Narr:** Alle Spieler geben ihre **gesamte Hand** verdeckt an den rechten Nachbarn
  weiter. Der Narr-Spieler muss danach sofort eine seiner **neuen** Karten spielen.
  Als letzte Karte der letzten Runde: verfällt. Muss gespielt werden (auch ohne Kugel).

### 8.1 TAC + Meisterkarten
- **TAC nach Narr:** Es wird nicht der Handtausch, sondern die **zuletzt vom
  Narr-Spieler gespielte** Karte rückgängig gemacht; TAC-Spieler nutzt deren Wert.
  (Wurde Narr ungenutzt abgelegt, kann Folgespieler ihn per TAC nutzen.)
- **TAC nach Krieger:** geworfene Kugel zurück; TAC-Spieler wirft die Kugel, die
  vor einer seiner Kugeln liegt.
- **TAC nach Engel:** Engel rückgängig; TAC-Spieler führt Engel für seinen
  Folgespieler aus.
- **TAC nach Teufel:** (selten) Teufel rückgängig; der Spieler, dessen TAC genutzt
  wurde, führt Teufel für seinen Folgespieler aus.

## 9. Endphase & Spielende

- **Endphase (pro Spieler):** Hat ein Spieler alle 4 eigenen Kugeln im Haus, bewegt
  er ab sofort mit seinen Karten die Kugeln seines **Partners**.
- **Spielende:** Erstes Team mit allen 8 Kugeln im Haus gewinnt.
- **Letzte (8.) Kugel:** muss **exakt** passend ins Haus gezogen werden, sonst noch
  eine Runde. Wird der Siegeszug per TAC gekontert, kommt die letzte Kugel erneut ins
  Spiel und muss ggf. erneut eine Runde drehen.

## 10. Offene Punkte / zu klärende Hausregeln

Diese Punkte sind im Regelheft eindeutig; falls euer Team abweichende Hausregeln
spielt, hier festhalten:

- [ ] Genaue Kartenverteilung/-anzahl je Wert (→ `REQ-DECK`).
- [ ] Exakte Feldpositionen der 4 Startfelder auf dem 64er-Kreis (Standard: 0/16/32/48).
- [ ] Verhalten bei „ungenutzt ablegen“ in der Netzwerk-UI (automatisch erkennen,
      wann kein Zug möglich ist, vs. Spieler bestätigt manuell).
- [ ] Umfang der TAC-Ketten in der ersten Implementierungsstufe (evtl. zunächst
      nur einfache TAC, Ketten später).
