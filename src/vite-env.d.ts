/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional override for the RSVP endpoint. Defaults to the same-origin /api/rsvp proxy. */
  readonly VITE_RSVP_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
