# Anforderungen: TAC – Freies Online-Brett

**Kennung:** `REQ-BOARD`
**Version:** 0.1 (Entwurf)
**Stand:** 2026-09-21
**Status:** AKTIV – dies ist die primäre Produktanforderung.

> Ziel: Ein digitales TAC-Brett, das sich wie das echte Spiel anfühlt. Vier
> Freunde spielen gemeinsam über das Internet. Die Anwendung stellt Brett,
> Kugeln und Karten bereit, **erzwingt aber keine Spielregeln** – die Spieler
> ziehen selbst und halten die Regeln wie am echten Tisch selbst ein.
>
> Regel-Referenz (nicht erzwungen): `REQ-RULES`.

---

## 1. Leitidee

- **Wie das echte Brett, nur online.** Kein "App-Gefühl", keine Bevormundung.
- Der Computer ist **Moderator**, nicht Schiedsrichter: Er teilt Karten aus,
  zeigt das Brett, synchronisiert alle Aktionen zwischen den Spielern – prüft
  aber nicht, ob ein Zug erlaubt ist.
- Vertrauen unter Freunden ersetzt die Regeldurchsetzung (wie offline).

## 2. Spieler & Sitzung

- Genau **4 Sitzplätze** (Spieler 0–3), 2 Teams (A: 0/2, B: 1/3), Partner sitzen
  gegenüber.
- Eine Partie = ein **Raum** mit einfacher Raum-ID (z. B. Wort/Code).
- Beitreten über Raum-ID + Wunschname/Sitzplatz. Keine Accounts, keine Passwörter.
- **Reconnect:** Bei Verbindungsabbruch Wiedereinstieg über Raum-ID + Name auf
  den bisherigen Sitzplatz.

## 3. Brett & Kugeln

- **B1 – Brettdarstellung:** Ein TAC-Brett mit Spielkreis (64 Felder), 4 Startfeldern,
  4 Häusern (je 4 Felder) und 4 Vorfeldern. Grafik eigenständig gestaltet.
- **B2 – Kugeln:** 16 Kugeln, 4 Farben à 4. Startlage: alle im jeweiligen Vorfeld.
- **B3 – Freie Bewegung:** Jeder Spieler kann Kugeln per **Drag & Drop** auf jedes
  beliebige Feld ziehen (auch fremde Kugeln – Vertrauen wie offline). Keine
  Regelprüfung, kein "verbotener Zug".
- **B4 – Kugel werfen:** Zieht man eine Kugel auf ein Feld mit anderer Kugel,
  landet die dort liegende Kugel zurück in ihrem Vorfeld (bequeme Standardaktion;
  alternativ per Kontextaktion "ins Vorfeld"). *Optional/konfigurierbar; Details
  im UI-Feinschliff.*
  - **B4a – Herkunfts-Marker:** Während/nach dem Ziehen wird das Ausgangsfeld
    der Kugel markiert (Sicherheit beim Rückwärtsziehen / TAC). Rein visuell.
  - **B4b – Wurf-Interaktion:** Lässt man die gezogene Kugel auf einem besetzten
    Feld los, wird die dort liegende Kugel "aufgenommen" (→ ihr Vorfeld); das Feld
    wird dadurch frei und die gezogene Kugel nimmt den Platz ein. Ein Feld trägt
    immer genau eine Kugel (kein Stapeln). Serverseitig bereits so umgesetzt.
- **B5 – Snapping:** Kugeln rasten auf Felder ein (sauberes, klares Bild statt
  Pixelgeschiebe).
- **B6 – Synchronisation:** Jede Kugelbewegung ist für alle Spieler sofort sichtbar.

## 4. Karten (digital verwaltet)

- **K1 – Kartensatz:** Standard-Kartensatz; optional Meisterkarten (Engel, Teufel,
  Krieger, Narr) zuschaltbar (Meisterversion).
- **K2 – Geben:** Auf Auslösung (z. B. Button "Geben") mischt die App und teilt
  je 5 Karten aus (Meisterrunde: 6). Wer gibt, wandert reihum.
- **K3 – Eigene Hand:** Jeder sieht **nur seine eigene** Hand (verdeckt für andere).
- **K4 – Karte ablegen/spielen:** Karte offen in die Mitte (Ablagestapel) legen.
  Für alle sichtbar (welche Karte gespielt wurde).
- **K5 – Tauschen mit Partner:** In der Tauschphase gibt jeder verdeckt 1 Karte an
  den Partner; Ansicht der erhaltenen Karte erst nach eigener Abgabe.
- **K6 – Melden (optional):** Einfaches "kann / kann nicht"-Signal (Handzeichen-
  Ersatz). Rein informativ, keine Prüfung.
- **K7 – Kartensichtbarkeit-Sonderfälle (Teufel):** Werden Meisterkarten genutzt,
  bei denen ein Spieler die Hand eines anderen einsieht, geschieht das über eine
  bewusste Aktion; keine automatische Regeldurchsetzung. *Kann in Stufe 1 auch
  einfach "auf Zuruf/echt" gehandhabt werden.*

## 5. Verlauf (Historie)

- **H1 – Zugliste:** Eine einblendbare Liste der letzten Aktionen, z. B.:
  - "Blau: Kugel von Feld 12 → Feld 17"
  - "Rot: Kugel von Feld 30 → Vorfeld (geworfen)"
  - "Grün: Karte 7 abgelegt"
- **H2 – Nur Anzeige:** Kein Undo/kein Zurücksetzen (bewusste Entscheidung – wie
  offline). Der Verlauf gibt lediglich Sicherheit bei Rückwärts-/TAC-Situationen,
  um den vorherigen Zustand nachzuvollziehen.
- **H3 – Umfang:** Mindestens die letzten ~20 Aktionen; ältere können ausgeblendet
  werden.

## 6. Nicht im Scope (Stufe 1)

- Keine Regelprüfung/-erzwingung.
- Kein Undo/Redo.
- Keine KI/Computer-Gegner.
- Keine Accounts, kein Matchmaking, keine Fremdnutzer.
- Nur 4-Spieler-Modus (keine 1–3 / 6er-Varianten).

## 7. Mögliche Erweiterungen (später, optional)

- Zuschaltbare, **nicht-verbietende** Hilfen (mögliche Felder hervorheben) auf
  Basis von `REQ-RULES`.
- Optionales Undo (letzten Zug zurücknehmen) für Verklicker.
- Würfel/Chat/Emotes, Sound.
- Zwei Design-Varianten zum Vergleich (modern-flach vs. hochwertig-realistisch).

## 8. Offene Punkte

- [ ] Genaues Wurf-Verhalten bei B4 (automatisch vs. Bestätigung).
- [ ] Umfang der Kartenautomatik (nur Geben, oder auch Tauschphase geführt?).
- [ ] Design-Richtung des Bretts (eigener Track, nach lauffähigem Prototyp).
