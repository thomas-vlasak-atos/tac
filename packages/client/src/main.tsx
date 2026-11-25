import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";
import { isMasterCardsView } from "./net/urlParams.js";
import { MasterCardsPage } from "./ui/MasterCardsHelp.js";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root-Element #root nicht gefunden.");

createRoot(rootEl).render(
  <StrictMode>
    {isMasterCardsView(window.location.search) ? <MasterCardsPage /> : <App />}
  </StrictMode>,
);
