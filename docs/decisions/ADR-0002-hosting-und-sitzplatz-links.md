# ADR-0002: Hosting & Beitritt über Sitzplatz-Links (Entwurf)

**Status:** proposed (Diskussionsstand, noch nicht umgesetzt)
**Datum:** 2026-09-21

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

- [ ] Genaues Link-Schema und ob Sitzplätze „gesperrt" (nur per Link) oder frei
      wählbar sind.
- [ ] Optionaler Zugangscode pro Raum (leichter Schutz gegen Zufallszugriffe).
- [ ] Konkrete Wahl des Tunnel-/Hosting-Wegs – erst relevant, wenn Client/Server
      lokal spielbar sind.
- [ ] Persistenz: Läuft eine Partie nur im Speicher (Server-Neustart = neu)? Für
      den Anfang vermutlich ausreichend.

## Konsequenzen

- Der Client braucht später: eine „Raum anlegen"-Ansicht (Namen/Sitze → Links
  generieren) und das Auslesen von `roomId`/`seat`/`name` aus der URL.
- Serverseitig ist die Grundlage (`JoinRoom` mit Sitzplatz) bereits vorhanden.
- Keine Änderung am aktuellen Umsetzungsstand nötig; dies ist ein Planungs-ADR.
