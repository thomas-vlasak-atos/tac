import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";
import { isMasterCardsView } from "./net/urlParams.js";
import { MasterCardsPage } from "./ui/MasterCardsHelp.js";
import { loadSettings } from "./ui/settings.js";
import { applyTheme } from "./ui/theme.js";
import "./styles.css";

// Modus vor dem ersten Zeichnen setzen (kein Aufblitzen), auch für die Meisterkarten-Seite.
applyTheme(loadSettings().theme);

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root-Element #root nicht gefunden.");

createRoot(rootEl).render(
  <StrictMode>
    {isMasterCardsView(window.location.search) ? <MasterCardsPage /> : <App />}
  </StrictMode>,
);
