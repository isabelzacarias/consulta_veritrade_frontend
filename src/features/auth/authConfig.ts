const enabledValue = import.meta.env.VITE_AUTH_ENABLED?.trim().toLowerCase()

export const AUTH_ENABLED = ['1', 'true', 'yes'].includes(enabledValue ?? '')

export const AUTH_CONTEXT_URL =
  import.meta.env.VITE_AUTH_CONTEXT_URL?.trim() ?? ''

export const AUTH_APP = import.meta.env.VITE_AUTH_APP?.trim() || 'compras'

export const AUTH_LOGIN_URL = import.meta.env.VITE_AUTH_LOGIN_URL?.trim() ?? ''

export const AUTH_LOGOUT_URL = import.meta.env.VITE_AUTH_LOGOUT_URL?.trim() ?? ''

export const LOCAL_PERMISSIONS = [
  'compras.ver',
  'compras.importar',
  'compras.exportar',
] as const
