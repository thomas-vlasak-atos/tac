/** Einstellungs-Overlay (REQ-FEEDBACK F10). Werte gelten nur auf diesem Gerät. */

import { BACKGROUND_OPTIONS } from "../board/boardAssets.js";
import { CLASSIC_BACKGROUND_ID, resolveBackgroundId } from "../board/backgrounds.js";
import type { Settings } from "./settings.js";

interface SettingsDialogProps {
  settings: Settings;
  onChange: (settings: Settings) => void;
  onClose: () => void;
}

export function SettingsDialog({ settings, onChange, onClose }: SettingsDialogProps) {
  const selectedBackground = resolveBackgroundId(settings.boardBackground, BACKGROUND_OPTIONS);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Einstellungen"
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "#1c0f08cc", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "10vh 16px", zIndex: 50 }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{ background: "#f5e5c8", color: "#4c2a1a", borderRadius: 16, border: "2px solid #9b5c31", maxWidth: 460, width: "100%", maxHeight: "80vh", overflowY: "auto", padding: 20, boxShadow: "0 18px 40px #00000055", fontFamily: "system-ui", fontSize: 14 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
          <h2 style={{ margin: 0 }}>Einstellungen</h2>
          <button type="button" onClick={onClose}>schließen</button>
        </div>
        <p style={{ fontSize: 12, color: "#6b3d22" }}>Gelten nur auf diesem Gerät.</p>
        <fieldset style={{ border: "1px solid #c8955c", borderRadius: 10, margin: "0 0 12px", padding: "8px 10px" }}>
          <legend style={{ padding: "0 6px" }}>Brett-Hintergrund</legend>
          {(["bright", "dark"] as const).map((tone) => (
            <div key={tone} style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 12, color: "#6b3d22", marginBottom: 4 }}>{tone === "bright" ? "Hell (graues Brett)" : "Dunkel (goldenes Brett)"}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {BACKGROUND_OPTIONS.filter((option) => option.tone === tone).map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    title={option.label}
                    aria-pressed={selectedBackground === option.id}
                    onClick={() => onChange({ ...settings, boardBackground: option.id })}
                    style={{ padding: 0, width: 62, height: 62, borderRadius: 8, overflow: "hidden", cursor: "pointer", border: selectedBackground === option.id ? "3px solid #d6199b" : "2px solid #c8955c", background: "none" }}
                  >
                    <img src={option.url} alt={option.label} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button
            type="button"
            aria-pressed={selectedBackground === CLASSIC_BACKGROUND_ID}
            onClick={() => onChange({ ...settings, boardBackground: CLASSIC_BACKGROUND_ID })}
            style={{ marginTop: 2, fontWeight: selectedBackground === CLASSIC_BACKGROUND_ID ? 700 : 400 }}
          >
            Klassisches Brett (Board.png)
          </button>
        </fieldset>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={settings.showFieldNumbers}
            onChange={(event) => onChange({ ...settings, showFieldNumbers: event.target.checked })}
          />
          Feldnummern anzeigen
        </label>
        <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
          <input
            type="checkbox"
            checked={settings.showTurnMarker}
            onChange={(event) => onChange({ ...settings, showTurnMarker: event.target.checked })}
          />
          „Wer ist dran" markieren (Ring ums Startfeld)
        </label>
        <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
          <input
            type="checkbox"
            checked={settings.animateMoves}
            onChange={(event) => onChange({ ...settings, animateMoves: event.target.checked })}
          />
          Züge und Karten animieren
        </label>
        <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
          <input
            type="checkbox"
            checked={settings.showDragHint}
            onChange={(event) => onChange({ ...settings, showDragHint: event.target.checked })}
          />
          Zielhilfe beim Ziehen (Einrastfeld und Distanz)
        </label>
        <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
          <input
            type="checkbox"
            checked={settings.cardClick}
            disabled={settings.cardClick && !settings.cardDrag}
            onChange={(event) => onChange({ ...settings, cardClick: event.target.checked })}
          />
          Karten per Klick spielen
        </label>
        <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
          <input
            type="checkbox"
            checked={settings.cardDrag}
            disabled={settings.cardDrag && !settings.cardClick}
            onChange={(event) => onChange({ ...settings, cardDrag: event.target.checked })}
          />
          Karten per Drag &amp; Drop spielen
        </label>
        <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
          <input
            type="checkbox"
            checked={settings.nudgeSound}
            onChange={(event) => onChange({ ...settings, nudgeSound: event.target.checked })}
          />
          Ton, wenn mich jemand anstupst
        </label>
        <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
          <input
            type="checkbox"
            checked={settings.soundMove}
            onChange={(event) => onChange({ ...settings, soundMove: event.target.checked })}
          />
          Ton, wenn ein anderer gezogen oder gespielt hat
        </label>
        <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
          <input
            type="checkbox"
            checked={settings.soundTurn}
            onChange={(event) => onChange({ ...settings, soundTurn: event.target.checked })}
          />
          Ton, wenn ich dran bin
        </label>
      </div>
    </div>
  );
}
