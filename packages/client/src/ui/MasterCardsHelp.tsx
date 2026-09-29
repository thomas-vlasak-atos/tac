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

interface MasterCard {
  name: string;
  summary: string;
  details: string[];
}

const MASTER_CARDS: MasterCard[] = [
  {
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
          <button type="button" onClick={onClose}>
            schließen
          </button>
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
