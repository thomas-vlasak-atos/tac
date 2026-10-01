# ADR-0002: Hosting & Beitritt über Sitzplatz-Links (Entwurf)

**Status:** umgesetzt (Render; Sitzplatz-Links in der README)
**Datum:** 2026-09-21 (aktualisiert 2026-10-01)

## Kontext

Das Spiel ist nur für einen festen Freundeskreis (4 Personen) gedacht. Es braucht
keine öffentliche Plattform, keine Accounts, kein Matchmaking. Es kam die Idee auf,
den Server lokal im Heimnetz eines Spielers laufen zu lassen und pro Sitzplatz
vorab einen Beitritts-Link zu generieren und zu versenden.

## Überlegung (vom Nutzer eingebracht)

- Gastgeber definiert vorab, **wer wo sitzt** (Name ↔ Sitzplatz ↔ Farbe/Team).
- Pro Sitzplatz wird ein **eindeutiger Link** erzeugt, z. B.
  `https://<host>/room/<roomId>?seat=2&name=Anna`.
- Jeder Spieler klickt seinen Link und landet automatisch auf dem richtigen Platz.

Das passt zur bestehenden `JoinRoom`-Aktion (`roomId`, `name`, `seat`), die bereits
im `@tac/shared`- und Server-Code vorhanden ist.

## Optionen für die Internet-Erreichbarkeit

Ein Heim-Server ist wegen NAT/Router von außen normalerweise nicht direkt
erreichbar. Kandidaten:

1. **Tunnel-Dienst (empfohlen):** z. B. Cloudflare Tunnel oder Tailscale.
   - Vorteil: keine Portfreigabe, TLS inklusive, sicher, für privaten Gebrauch
     kostenlos; öffnet das Heimnetz nicht breitflächig.
   - Nachteil: kleine Ersteinrichtung, Abhängigkeit von einem Dienst.
2. **Portforwarding + DynDNS:** klassischer Weg.
   - Vorteil: kein Drittdienst nötig.
   - Nachteil: öffnet einen Port ins Heimnetz, DynDNS nötig, mehr Sicherheitsrisiko.
3. **Nur LAN:** wenn alle im selben Netz sind – am einfachsten, aber kein „übers
   Internet".
4. **Kleiner Cloud-Host** (Fly.io/Railway/Render): unabhängig vom Heim-PC, immer
   erreichbar; minimale Kosten/Aufwand, aber kein „im Heimnetz".

## Tendenz

- Für „nur wir 4, gelegentlich" ist **Heim-Server + Cloudflare Tunnel** ein guter
  Kompromiss (nichts läuft dauerhaft in der Cloud, trotzdem übers Internet spielbar).
- Der **Sitzplatz-Link-Ansatz** wird übernommen; er ist schlank und
  benutzerfreundlich.

## Offene Punkte / später zu entscheiden

- [x] Link-Schema: `?room=<name>&name=<name>&seat=<0-3>` (siehe README); der Platz aus
      dem Link wird immer zugewiesen (Verdrängung), ohne `seat` gilt Auto-Join.
- [x] Ein Link mit `room` und `name` führt ohne Startformular direkt ins Spiel
      (`net/urlParams.ts`).
- [x] Hosting-Weg: Cloud-Host Render (Option 4), kein Heim-Server/Tunnel nötig.
- [x] Persistenz: Partie nur im Speicher (Neustart/Deploy/Einschlafen = neu) – für den
      Freundeskreis ausreichend.
- [ ] ~~Zugangscode pro Raum~~ – bewusst nicht umgesetzt (der Raumname im Link genügt).

## Konsequenzen

- Der Client liest `roomId`/`seat`/`name` aus der URL. Eine „Raum anlegen"-Ansicht
  zum Erzeugen der Links ist nicht nötig: die Links stehen in der README und werden
  per Mail verteilt.
- Serverseitig ist die Grundlage (`JoinRoom` mit Sitzplatz) bereits vorhanden.
- Keine Änderung am aktuellen Umsetzungsstand nötig; dies ist ein Planungs-ADR.

## Umsetzung: kostenloser Cloud-Test via Render (2026-09-29)

Für einen ersten Online-Test (zunächst nur zum Ausprobieren, möglichst kostenlos)
wurde **Option 4 (kleiner Cloud-Host)** mit **Render** gewählt statt des Heim-
Servers. Gründe: kein laufender Heim-PC nötig, ein weitergebbarer Link, TLS/`wss`
inklusive. Der Free-Tier reicht für den Test.

**Aufteilung (siehe `render.yaml` im Repo-Root):**

- `tac-server` – Web Service (Node, Free-Tier). WebSockets brauchen einen
  dauerhaft laufenden Prozess (kein Serverless). Der Server öffnet jetzt einen
  **HTTP-Server** auf `$PORT` (von Render gesetzt), der Health-Checks (`GET /`,
  `/health` → 200) beantwortet **und** das WebSocket-Upgrade auf demselben Port
  bedient (Render gibt pro Dienst nur einen Port frei).
- `tac-client` – Static Site (kostenlos, CDN). Vite-Build nach
  `packages/client/dist-web`. Die Server-Adresse kommt über die Build-Variable
  `VITE_SERVER_URL` (Render füllt sie per `fromService` mit dem Server-Host; der
  Client ergänzt das `wss://`-Schema selbst, siehe `serverUrl()` in `App.tsx`).

**Bewusste Einschränkungen des Free-Tiers (für einen Test akzeptabel):**

- Der Server **schläft** nach ~15 Min Inaktivität und braucht beim nächsten
  Zugriff einige Sekunden zum Aufwachen.
- Der Spielzustand liegt **nur im Speicher**: Neustart/Deploy setzt laufende
  Partien zurück (Persistenz bleibt ein späterer, optionaler Punkt).

Die ursprüngliche Tendenz (Heim-Server + Cloudflare Tunnel) bleibt als Alternative
gültig, falls dauerhaft ohne Cloud-Abhängigkeit und ohne Schlaf-Verhalten
gespielt werden soll.
