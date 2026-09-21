# ADR-0003: Windows subst-Laufwerk und Vite-Pfadauflösung

**Status:** accepted
**Datum:** 2026-09-21

## Kontext

Beim ersten Start des Clients (`npm run dev:client`) trat im Browser reproduzierbar
folgender Fehler auf:

```
[vite] Pre-transform error: Failed to load url /src/main.tsx
(resolved id: C:/_projects/fislw/ai-development/tac/packages/client/src/main.tsx).
Does the file exist?
```

Die Datei existierte, `curl` auf frische Vite-Instanzen lieferte teils HTTP 200,
im Browser schlug es aber fehl. Die Analyse ergab:

- Auf dem Entwicklungssystem existiert ein **`subst`-Laufwerk**:
  `D:\ => C:\_projects\fislw\`.
- Der **reale** Pfad ist `C:\_projects\fislw\ai-development\tac\...`.
- `realpathSync()` löst auf Windows das `subst`-Laufwerk „rückwärts" auf und
  liefert paradoxerweise den `D:`-Pfad zurück.
- Dadurch zeigten Vite-Server-Root und die aufgelöste Modul-ID auf
  **unterschiedliche Laufwerksbuchstaben** (C: vs. D:), was zu „Failed to load
  url" führte.

Ein erster Fix-Versuch mit `realpathSync` im `vite.config.ts` verschlimmerte das
Problem, weil er Vite gerade auf den falschen (`D:`)-Pfad zwang.

## Entscheidung

1. In `packages/client/vite.config.ts` wird der Projekt-Root **direkt** aus der
   Config-Position abgeleitet (`fileURLToPath(new URL(".", import.meta.url))`),
   **ohne** `realpathSync`. So bleiben Server-Root und Modulauflösung konsistent.
2. Zusätzlich in der Vite-Config gesetzt:
   - expliziter `root`,
   - `server.fs.allow` auf den Workspace-Root (für `@tac/shared`),
   - `optimizeDeps.exclude: ["@tac/shared"]` (lokales TS-Workspace-Paket nicht
     vor-bündeln).
3. **Arbeitsrichtlinie:** Im Projekt wird konsequent über den **C:-Pfad**
   gearbeitet (`C:\_projects\fislw\ai-development\tac`), nicht über das
   `subst`-Laufwerk `D:`.

## Konsequenzen

- Der Pre-Transform-Fehler ist behoben (verifiziert über den C:-Pfad: `main.tsx`
  und `App.tsx` liefern HTTP 200, keine Fehler im Vite-Log).
- Entwickler müssen wissen: **nur auf C: arbeiten**. Terminal-Pfad mit `pwd`
  prüfen; er muss `C:\_projects\fislw\...` zeigen.
- Hängende Vite-Prozesse unter Git-Bash/Windows ggf. manuell beenden
  (`netstat -ano | findstr :5173`, dann `taskkill /PID <PID> /F`).

## Alternativen (verworfen)

- `subst`-Laufwerk entfernen: nicht im Projekt-Scope, betrifft die Umgebung des
  Nutzers.
- `realpathSync` verwenden: führt hier zum falschen Laufwerk (Ursache des
  Problems).
