import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Projekt-Root direkt aus der Config-Position ableiten (ohne realpath!).
// Auf diesem System existiert ein subst-Laufwerk (D: => C:\_projects\fislw),
// weshalb realpathSync den Pfad fälschlich auf D: umschreiben würde. Der
// direkte Pfad hält Server-Root und Modulauflösung konsistent.
const rootDir = fileURLToPath(new URL(".", import.meta.url));
const workspaceRoot = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
  root: rootDir,
  plugins: [react()],
  build: {
    // Separater Ausgabeordner: dist enthält noch Artefakte des früheren,
    // workspace-weiten publicDir-Experiments und ist nicht sicher löschbar.
    outDir: "dist-web",
  },
  server: {
    port: 5173,
    host: true,
    fs: {
      // Zugriff auf das Monorepo erlauben (Workspace-Paket @tac/shared).
      allow: [workspaceRoot],
    },
  },
  optimizeDeps: {
    // @tac/shared ist ein lokales TS-Workspace-Paket und darf NICHT
    // vor-gebündelt werden; nur echte Runtime-Deps optimieren.
    include: ["react", "react-dom", "react-dom/client"],
    exclude: ["@tac/shared"],
  },
});
