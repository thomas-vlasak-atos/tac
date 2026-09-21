/**
 * Einstiegspunkt des TAC-Servers.
 *
 * Startet den WebSocket-Server. Port über Umgebungsvariable PORT konfigurierbar.
 */

import { startServer } from "./server.js";

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
startServer(port);
