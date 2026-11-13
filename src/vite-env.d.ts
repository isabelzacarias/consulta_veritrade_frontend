/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_PROXY_TARGET?: string
  readonly VITE_AUTH_ENABLED?: string
  readonly VITE_AUTH_CONTEXT_URL?: string
  readonly VITE_SUITE_URL?: string
  readonly VITE_AUTH_APP?: string
  readonly VITE_AUTH_LOGIN_URL?: string
  readonly VITE_AUTH_LOGOUT_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
