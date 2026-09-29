/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** WebSocket-URL des TAC-Servers im Deployment (z. B. wss://host). */
  readonly VITE_SERVER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.png" {
  const source: string;
  export default source;
}
