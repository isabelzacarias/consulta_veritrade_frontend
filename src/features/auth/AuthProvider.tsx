import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  registerUnauthorizedHandler,
  setAccessToken,
} from '@/services/api/client'
import type {
  AuthContextResponse,
  AuthEmpresa,
  AuthPerfil,
  AuthState,
  AuthStatus,
} from '@/types/auth'
import { AuthContext } from './AuthContext'
import {
  AUTH_APP,
  AUTH_CONTEXT_URL,
  AUTH_ENABLED,
  AUTH_LOGIN_URL,
  AUTH_LOGOUT_URL,
  LOCAL_PERMISSIONS,
} from './authConfig'

interface AuthSnapshot {
  status: AuthStatus
  context: AuthContextResponse | null
  permissions: string[]
  loginUrl: string | null
  logoutUrl: string | null
  error: string | null
}

const LOCAL_CONTEXT: AuthContextResponse = {
  token: '',
  expires_in: 0,
  empresa: null,
  perfiles: [],
  permissions: [...LOCAL_PERMISSIONS],
}

const LOCAL_STATE: AuthSnapshot = {
  status: 'authenticated',
  context: LOCAL_CONTEXT,
  permissions: [...LOCAL_PERMISSIONS],
  loginUrl: null,
  logoutUrl: null,
  error: null,
}

const INITIAL_STATE: AuthSnapshot = AUTH_ENABLED
  ? {
      status: 'loading',
      context: null,
      permissions: [],
      loginUrl: null,
      logoutUrl: null,
      error: null,
    }
  : LOCAL_STATE

function normalizePermissions(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeEmpresa(value: unknown): AuthEmpresa | null {
  if (!value || typeof value !== 'object') return null
  const empresa = value as Record<string, unknown>
  return {
    id: typeof empresa.id === 'number' ? empresa.id : undefined,
    clave: typeof empresa.clave === 'string' ? empresa.clave : undefined,
    nombre: typeof empresa.nombre === 'string' ? empresa.nombre : undefined,
  }
}

function normalizePerfiles(value: unknown): AuthPerfil[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (item): item is AuthPerfil =>
      typeof item === 'string' || (Boolean(item) && typeof item === 'object'),
  )
}

function normalizeContext(value: unknown): AuthContextResponse | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (typeof raw.token !== 'string' || !raw.token.trim()) return null

  const expires = Number(raw.expires_in)
  return {
    token: raw.token.trim(),
    expires_in: Number.isFinite(expires) && expires > 0 ? expires : 300,
    login_url: typeof raw.login_url === 'string' ? raw.login_url : undefined,
    logout_url: typeof raw.logout_url === 'string' ? raw.logout_url : undefined,
    app_url: typeof raw.app_url === 'string' ? raw.app_url : undefined,
    empresa: normalizeEmpresa(raw.empresa),
    perfiles: normalizePerfiles(raw.perfiles),
    permissions: normalizePermissions(raw.permissions),
  }
}

function resolveSuiteUrl(value: unknown, fallback: string): string | null {
  const candidate =
    (typeof value === 'string' && value.trim()) || fallback.trim()
  if (!candidate) return null
  try {
    return new URL(candidate, AUTH_CONTEXT_URL || window.location.origin).toString()
  } catch {
    return null
  }
}

function readJson(value: unknown, fallback: string): string | null {
  if (!value || typeof value !== 'object') return fallback
  const body = value as Record<string, unknown>
  if (typeof body.detail === 'string' && body.detail.trim()) {
    return body.detail.trim()
  }
  if (typeof body.error === 'string' && body.error.trim()) {
    return body.error.trim()
  }
  return fallback
}

async function readResponseBody(response: Response): Promise<unknown> {
  try {
    return (await response.json()) as unknown
  } catch {
    return null
  }
}

function networkError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'No se pudo conectar con la suite.'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<AuthSnapshot>(INITIAL_STATE)
  const mountedRef = useRef(true)
  const refreshRef = useRef<Promise<void> | null>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const commit = useCallback((next: AuthSnapshot) => {
    if (mountedRef.current) setSnapshot(next)
  }, [])

  const refresh = useCallback((): Promise<void> => {
    if (!AUTH_ENABLED) {
      setAccessToken(null)
      commit(LOCAL_STATE)
      return Promise.resolve()
    }

    if (refreshRef.current) return refreshRef.current

    const task = (async () => {
      if (!AUTH_CONTEXT_URL) {
        setAccessToken(null)
        commit({
          status: 'error',
          context: null,
          permissions: [],
          loginUrl: null,
          logoutUrl: null,
          error:
            'Configura VITE_AUTH_CONTEXT_URL para validar la sesión con la suite.',
        })
        return
      }

      let response: Response
      let url: URL
      try {
        url = new URL(AUTH_CONTEXT_URL, window.location.origin)
        url.searchParams.set('app', AUTH_APP)
      } catch {
        setAccessToken(null)
        commit({
          status: 'error',
          context: null,
          permissions: [],
          loginUrl: null,
          logoutUrl: null,
          error: 'VITE_AUTH_CONTEXT_URL no es una URL válida.',
        })
        return
      }

      try {
        response = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        })
      } catch (error) {
        setAccessToken(null)
        commit({
          status: 'error',
          context: null,
          permissions: [],
          loginUrl: resolveSuiteUrl(null, AUTH_LOGIN_URL),
          logoutUrl: resolveSuiteUrl(null, AUTH_LOGOUT_URL),
          error: networkError(error),
        })
        return
      }

      const body = await readResponseBody(response)
      const loginUrl =
        body && typeof body === 'object'
          ? resolveSuiteUrl(
              (body as Record<string, unknown>).login_url,
              AUTH_LOGIN_URL,
            )
          : resolveSuiteUrl(null, AUTH_LOGIN_URL)
      const logoutUrl =
        body && typeof body === 'object'
          ? resolveSuiteUrl(
              (body as Record<string, unknown>).logout_url,
              AUTH_LOGOUT_URL,
            )
          : resolveSuiteUrl(null, AUTH_LOGOUT_URL)

      if (response.status === 401) {
        setAccessToken(null)
        commit({
          status: 'unauthenticated',
          context: null,
          permissions: [],
          loginUrl,
          logoutUrl,
          error: null,
        })
        return
      }

      if (response.status === 403) {
        setAccessToken(null)
        commit({
          status: 'forbidden',
          context: null,
          permissions: [],
          loginUrl,
          logoutUrl,
          error: null,
        })
        return
      }

      if (!response.ok) {
        setAccessToken(null)
        commit({
          status: 'error',
          context: null,
          permissions: [],
          loginUrl,
          logoutUrl,
          error: readJson(
            body,
            `La suite respondió HTTP ${response.status} al validar la sesión.`,
          ),
        })
        return
      }

      const context = normalizeContext(body)
      if (!context) {
        setAccessToken(null)
        commit({
          status: 'error',
          context: null,
          permissions: [],
          loginUrl,
          logoutUrl,
          error: 'La respuesta de la suite no contiene un token válido.',
        })
        return
      }

      setAccessToken(context.token)
      commit({
        status: 'authenticated',
        context,
        permissions: context.permissions ?? [],
        loginUrl:
          resolveSuiteUrl(context.login_url, AUTH_LOGIN_URL) ?? loginUrl,
        logoutUrl:
          resolveSuiteUrl(context.logout_url, AUTH_LOGOUT_URL) ?? logoutUrl,
        error: null,
      })
    })()

    refreshRef.current = task
    void task
      .finally(() => {
        if (refreshRef.current === task) refreshRef.current = null
      })
      .catch(() => {
        if (refreshRef.current === task) refreshRef.current = null
      })
    return task
  }, [commit])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      void refresh()
    })
    return () => registerUnauthorizedHandler(null)
  }, [refresh])

  useEffect(() => {
    if (!AUTH_ENABLED || snapshot.status !== 'authenticated') return
    if (!snapshot.context) return

    const expiresMs = Math.max(30_000, snapshot.context.expires_in * 1000)
    const refreshMargin = Math.min(60_000, expiresMs * 0.2)
    const delay = Math.max(15_000, expiresMs - refreshMargin)
    const timer = window.setTimeout(() => {
      void refresh()
    }, delay)

    return () => window.clearTimeout(timer)
  }, [refresh, snapshot.context, snapshot.status])

  const hasPermission = useCallback(
    (permission: string) => snapshot.permissions.includes(permission),
    [snapshot.permissions],
  )

  const value = useMemo<AuthState>(
    () => ({
      status: snapshot.status,
      context: snapshot.context,
      permissions: snapshot.permissions,
      loginUrl: snapshot.loginUrl,
      logoutUrl: snapshot.logoutUrl,
      error: snapshot.error,
      hasPermission,
      refresh,
    }),
    [hasPermission, refresh, snapshot],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
