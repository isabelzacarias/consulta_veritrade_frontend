import { useEffect, type ReactNode } from 'react'
import {
  Building2,
  Loader2,
  LogIn,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react'
import { useAuth } from './AuthContext'

interface AuthGateProps {
  children: ReactNode
  permission?: string
}

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="horbis-canvas grid min-h-screen place-items-center px-4 py-10 text-slate-900">
      <div className="w-full max-w-md rounded-3xl border border-brand-100 bg-white/95 p-8 text-center shadow-xl shadow-brand-950/10">
        {children}
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <AuthShell>
      <Loader2 className="mx-auto size-9 animate-spin text-brand-600" />
      <h1 className="mt-4 text-lg font-semibold tracking-tight">
        Validando sesión
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Consultando tus permisos con la suite de HORBIS.
      </p>
    </AuthShell>
  )
}

function AccessDenied({
  permission,
  company,
  logoutUrl,
  onRetry,
}: {
  permission: string
  company?: string | null
  logoutUrl: string | null
  onRetry: () => void
}) {
  return (
    <AuthShell>
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
        <ShieldAlert className="size-6" />
      </span>
      <h1 className="mt-4 text-lg font-semibold tracking-tight">
        Acceso denegado
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Tu perfil no tiene el permiso{' '}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600">
          {permission}
        </code>{' '}
        para este módulo.
      </p>
      {company && (
        <p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
          <Building2 className="size-3.5" />
          {company}
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <RefreshCw className="size-3.5" />
          Reintentar
        </button>
        {logoutUrl && (
          <a
            href={logoutUrl}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-brand-800"
          >
            <LogIn className="size-3.5" />
            Cerrar sesión
          </a>
        )}
      </div>
    </AuthShell>
  )
}

function ErrorScreen({
  message,
  onRetry,
  logoutUrl,
}: {
  message: string
  onRetry: () => void
  logoutUrl: string | null
}) {
  return (
    <AuthShell>
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-200">
        <ShieldAlert className="size-6" />
      </span>
      <h1 className="mt-4 text-lg font-semibold tracking-tight">
        No se pudo validar la sesión
      </h1>
      <p className="mt-2 text-sm text-slate-500">{message}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-brand-800"
        >
          <RefreshCw className="size-3.5" />
          Reintentar
        </button>
        {logoutUrl && (
          <a
            href={logoutUrl}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <LogIn className="size-3.5" />
            Ir a la suite
          </a>
        )}
      </div>
    </AuthShell>
  )
}

export function AuthGate({
  children,
  permission = 'compras.ver',
}: AuthGateProps) {
  const auth = useAuth()
  const allowed = auth.hasPermission(permission)

  useEffect(() => {
    if (auth.status === 'unauthenticated' && auth.loginUrl) {
      window.location.replace(auth.loginUrl)
    }
  }, [auth.loginUrl, auth.status])

  if (auth.status === 'loading') return <LoadingScreen />

  if (auth.status === 'unauthenticated') {
    if (auth.loginUrl) {
      return (
        <AuthShell>
          <Loader2 className="mx-auto size-9 animate-spin text-brand-600" />
          <h1 className="mt-4 text-lg font-semibold tracking-tight">
            Redirigiendo a la suite
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Inicia sesión para continuar al módulo de compras.
          </p>
          <a
            href={auth.loginUrl}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-700 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-brand-800"
          >
            <LogIn className="size-3.5" />
            Ir al inicio de sesión
          </a>
        </AuthShell>
      )
    }

    return (
      <ErrorScreen
        message="La suite no devolvió una URL de inicio de sesión. Configura VITE_AUTH_LOGIN_URL o revisa el contexto SSO."
        onRetry={auth.refresh}
        logoutUrl={auth.logoutUrl}
      />
    )
  }

  if (auth.status === 'forbidden') {
    return (
      <AccessDenied
        permission={permission}
        company={auth.context?.empresa?.nombre ?? auth.context?.empresa?.clave}
        logoutUrl={auth.logoutUrl}
        onRetry={auth.refresh}
      />
    )
  }

  if (auth.status === 'error') {
    return (
      <ErrorScreen
        message={auth.error ?? 'Error desconocido al validar la sesión.'}
        onRetry={auth.refresh}
        logoutUrl={auth.logoutUrl}
      />
    )
  }

  if (!allowed) {
    return (
      <AccessDenied
        permission={permission}
        company={auth.context?.empresa?.nombre ?? auth.context?.empresa?.clave}
        logoutUrl={auth.logoutUrl}
        onRetry={auth.refresh}
      />
    )
  }

  return <>{children}</>
}
