# Dokumentation TAC Online

Einstiegspunkt in die Projektdokumentation.

## Struktur

- **[architecture/](./architecture/)** – Architekturentscheidungen und -überblick
  - `ARCH-OVERVIEW.md` – Gesamtarchitektur
- **[requirements/](./requirements/)** – fachliche Anforderungen / Spielregeln
  - `REQ-BOARD.md` – **primär, aktiv**: freies Online-Brett (Kugeln, Karten, Verlauf)
  - `REQ-RULES.md` – Spielregeln als **Referenz** (nicht technisch erzwungen)
- **[decisions/](./decisions/)** – Architecture Decision Records (ADRs)
  - `ADR-0001-freies-brett.md` – freies Brett statt Regel-Engine

## Traceability

Nicht-triviale Anforderungen erhalten eine Kennung (z. B. `REQ-RULES`, einzelne
Regeln `R1`–`R13`). Diese Kennungen tauchen in Commit-Bezügen und in Testnamen
wieder auf, um von Anforderung zu Code und Test navigieren zu können.
