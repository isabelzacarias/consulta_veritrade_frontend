/**
 * Cliente HTTP base de la API.
 *
 * En desarrollo el proxy de Vite reenvía `/api` a http://localhost:8000.
 * En despliegue puedes definir VITE_API_URL con la URL absoluta del backend.
 */
export const API_BASE = (import.meta.env.VITE_API_URL?.trim() || '/api').replace(
  /\/+$/,
  '',
)

type QueryValue = string | number | boolean | null | undefined
export type QueryParams = Record<string, QueryValue>

export function buildQuery(params?: object): string {
  if (!params) return ''

  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
      continue
    }
    if (value === '') continue
    search.set(key, String(value))
  }

  const query = search.toString()
  return query ? `?${query}` : ''
}

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function request<T>(
  path: string,
  params?: object,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}${buildQuery(params)}`, {
    headers: { Accept: 'application/json', ...init?.headers },
    ...init,
  })

  if (!response.ok) {
    const body = await response.text()
    let detail = body
    try {
      const parsed = JSON.parse(body) as { detail?: unknown }
      if (typeof parsed.detail === 'string') {
        detail = parsed.detail
      } else if (parsed.detail) {
        detail = JSON.stringify(parsed.detail)
      }
    } catch {
      // La respuesta no era JSON: conservamos el texto plano.
    }
    throw new ApiError(
      (detail || `Error ${response.status} al consultar la API`).slice(0, 300),
      response.status,
    )
  }

  return (await response.json()) as T
}
