/** Einstellungs-Overlay (REQ-FEEDBACK F10). Werte gelten nur auf diesem Gerät. */

import type { Settings } from "./settings.js";

interface SettingsDialogProps {
  settings: Settings;
  onChange: (settings: Settings) => void;
  onClose: () => void;
}

export function SettingsDialog({ settings, onChange, onClose }: SettingsDialogProps) {
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
        style={{ background: "#f5e5c8", color: "#4c2a1a", borderRadius: 16, border: "2px solid #9b5c31", maxWidth: 420, width: "100%", padding: 20, boxShadow: "0 18px 40px #00000055", fontFamily: "system-ui", fontSize: 14 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
          <h2 style={{ margin: 0 }}>Einstellungen</h2>
          <button type="button" onClick={onClose}>schließen</button>
        </div>
        <p style={{ fontSize: 12, color: "#6b3d22" }}>Gelten nur auf diesem Gerät.</p>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={settings.showFieldNumbers}
            onChange={(event) => onChange({ ...settings, showFieldNumbers: event.target.checked })}
          />
          Feldnummern anzeigen
        </label>
      </div>
    </div>
  );
}
