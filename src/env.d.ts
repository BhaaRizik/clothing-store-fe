interface ImportMetaEnv {
  /** Public backend origin, e.g. http://localhost:8080 (no trailing /api/v1). */
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
