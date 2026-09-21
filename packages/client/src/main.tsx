import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root-Element #root nicht gefunden.");

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
