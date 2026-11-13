export interface AuthEmpresa {
  id?: number
  clave?: string
  nombre?: string
}

export type AuthPerfil =
  | string
  | {
      id?: number
      clave?: string
      nombre?: string
    }

export interface AuthContextResponse {
  token: string
  expires_in: number
  login_url?: string
  logout_url?: string
  app_url?: string
  roles?: string[]
  legacy_role?: string
  empresa?: AuthEmpresa | null
  perfiles?: AuthPerfil[]
  permissions?: string[]
}

export type AuthStatus =
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'forbidden'
  | 'error'

export interface AuthState {
  status: AuthStatus
  context: AuthContextResponse | null
  permissions: string[]
  loginUrl: string | null
  logoutUrl: string | null
  error: string | null
  isAdmin: boolean
  hasPermission: (permission: string) => boolean
  refresh: () => Promise<void>
}
