/**
 * Anleitung zu den vier Meisterkarten (Engel, Teufel, Krieger, Narr).
 *
 * Inhaltlich eine kurze, eigene Zusammenfassung der offiziellen Infokarte
 * "Meisterversion". Wird als Overlay über einen Button im Spiel eingeblendet,
 * damit man die Wirkung während der Partie nachschlagen kann (wie die
 * Papier-Infokarte am Tisch).
 *
 * Die Anwendung erzwingt keine Kartenregeln (freies Brett, ADR-0001); dies ist
 * reine Nachschlage-Hilfe.
 */

import type { SpecialCardKind } from "@tac/shared";
import { CardArtwork } from "./cardArtwork.js";

interface MasterCard {
  kind: SpecialCardKind;
  name: string;
  summary: string;
  details: string[];
}

const MASTER_CARDS: MasterCard[] = [
  {
    kind: "engel",
    name: "Engel",
    summary:
      "Für den im Uhrzeigersinn folgenden Spieler eine Kugel vom Vorfeld auf sein Startfeld setzen.",
    details: [
      "Hat der Nachbar keine Kugel mehr im Vorfeld, wird stattdessen eine seiner Kugeln im Spiel um 1 oder 13 Felder bewegt.",
      "Steht auf dem Startfeld schon eine Kugel, wird sie geworfen (auch eine eigene).",
      "Muss gespielt werden, auch ohne eigene Kugel im Spiel.",
      "Der betroffene Nachbar ist danach ganz normal am Zug.",
    ],
  },
  {
    kind: "teufel",
    name: "Teufel",
    summary:
      "Du spielst für den folgenden Spieler eine Karte aus dessen Hand und führst die Aktion mit dessen Kugeln aus.",
    details: [
      "Du erhältst Einsicht in dessen Hand (verdeckt), führst genau einen Zug für ihn aus.",
      "Der betroffene Spieler ist danach nicht noch einmal selbst dran – sein Zug ist erledigt.",
      "Du bist frei in Kartenwahl und Kugeln (im Rahmen der Regeln).",
      "Als letzte Karte einer Runde verfällt die Wirkung.",
    ],
  },
  {
    kind: "krieger",
    name: "Krieger",
    summary:
      "Die im Uhrzeigersinn auf eine eigene Kugel folgende Kugel wird geworfen; deine Kugel rückt auf das frei gewordene Feld.",
    details: [
      "Getroffen wird die nächste Kugel egal welcher Farbe – im Zweifel auch die eigene oder die des Partners.",
      "Ohne eigene Kugel im Spielkreis verfällt der Krieger.",
      "Sind nur eigene Kugeln im Kreis, wirfst du dich selbst.",
      "Ideal, um eine weit entfernte Kugel zu werfen und selbst einen großen Sprung zu machen.",
    ],
  },
  {
    kind: "narr",
    name: "Narr",
    summary:
      "Alle geben ihre Handkarten verdeckt an den rechten Nachbarn weiter; du spielst danach sofort eine deiner neuen Karten.",
    details: [
      "Muss gespielt werden, auch ohne eigene Kugel im Spiel.",
      "Als letzte Karte einer Runde verfällt die Funktion.",
      "Bringt die gesamte Planung durcheinander – gut, wenn dein Team feststeckt oder der Gegner kurz vor dem Sieg steht.",
    ],
  },
];

/** Kurzwirkung einer Meisterkarte (z. B. für den Tooltip an der Handkarte); sonst undefined. */
export function masterCardSummary(kind: string): string | undefined {
  return MASTER_CARDS.find((card) => card.kind === kind)?.summary;
}

/** Adresse der eigenständigen Meisterkarten-Seite (zweites Fenster, ohne Spielverbindung). */
export function masterCardsWindowUrl(): string {
  return `${window.location.pathname}?view=meisterkarten`;
}

export function MasterCardsHelp({ onClose }: { onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Anleitung Meisterkarten"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "#1c0f08cc",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "5vh 16px",
        zIndex: 50,
        overflowY: "auto",
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          background: "#f5e5c8",
          color: "#4c2a1a",
          borderRadius: 16,
          border: "2px solid #9b5c31",
          maxWidth: 620,
          width: "100%",
          padding: 20,
          boxShadow: "0 18px 40px #00000055",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
          <h2 style={{ margin: 0, letterSpacing: 1 }}>Meisterkarten</h2>
          <span style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => window.open(masterCardsWindowUrl(), "tac-meisterkarten", "popup,width=760,height=900")} title="Als eigenes Fenster öffnen, z. B. auf einem zweiten Bildschirm">
              neues Fenster
            </button>
            <button type="button" onClick={onClose}>
              schließen
            </button>
          </span>
        </div>
        <p style={{ fontFamily: "system-ui", fontSize: 13, color: "#6b3d22", marginTop: 6 }}>
          Kurzanleitung zu den vier Sonderkarten der Meisterversion. Die Regeln
          werden nicht erzwungen – dies ist nur zum Nachschlagen.
        </p>
        <div style={{ display: "grid", gap: 14, marginTop: 12 }}>
          {MASTER_CARDS.map((card) => (
            <section
              key={card.name}
              style={{
                background: "#fffaf0",
                borderRadius: 12,
                border: "1px solid #c8955c",
                padding: 12,
              }}
            >
              <h3 style={{ margin: "0 0 4px" }}>{card.name}</h3>
              <p style={{ margin: "0 0 8px", fontWeight: 600 }}>{card.summary}</p>
              <ul style={{ margin: 0, paddingLeft: 18, fontFamily: "system-ui", fontSize: 13, lineHeight: 1.4 }}>
                {card.details.map((line, index) => (
                  <li key={index}>{line}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Eigenständige, große Seite mit allen Meisterkarten (`?view=meisterkarten`), auch zum Screenshot. */
export function MasterCardsPage() {
  return (
    <main style={{ background: "#f5e5c8", color: "#4c2a1a", minHeight: "100vh", padding: 24, boxSizing: "border-box" }}>
      <h1 style={{ margin: "0 0 4px", letterSpacing: 1 }}>Meisterkarten</h1>
      <p style={{ fontFamily: "system-ui", fontSize: 14, color: "#6b3d22", marginTop: 0 }}>
        Kurzanleitung zu den vier Sonderkarten. Die Regeln werden im Spiel nicht erzwungen.
      </p>
      <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", maxWidth: 1100 }}>
        {MASTER_CARDS.map((card) => (
          <section key={card.name} style={{ display: "flex", gap: 14, background: "#fffaf0", borderRadius: 12, border: "1px solid #c8955c", padding: 14 }}>
            <div style={{ width: 110, flex: "0 0 auto" }}>
              <CardArtwork card={{ id: `help-${card.kind}`, kind: card.kind }} />
            </div>
            <div>
              <h2 style={{ margin: "0 0 4px" }}>{card.name}</h2>
              <p style={{ margin: "0 0 8px", fontWeight: 600, fontSize: 16 }}>{card.summary}</p>
              <ul style={{ margin: 0, paddingLeft: 18, fontFamily: "system-ui", fontSize: 15, lineHeight: 1.45 }}>
                {card.details.map((line, index) => (
                  <li key={index}>{line}</li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
