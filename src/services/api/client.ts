/**
 * Cliente HTTP base de la API.
 *
 * En desarrollo el proxy de Vite reenvía `/api` a http://localhost:8001.
 * En despliegue puedes definir VITE_API_URL con la URL absoluta del backend.
 */
export const API_BASE = (import.meta.env.VITE_API_URL?.trim() || '/api').replace(
  /\/+$/,
  '',
)

let accessToken: string | null = null
let unauthorizedHandler: (() => void) | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function registerUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler
}

function authHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init)
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }
  return headers
}

type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number>
export type QueryParams = Record<string, QueryValue>

export function buildQuery(params?: object): string {
  if (!params) return ''

  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === '' || item == null) continue
        search.append(key, String(item))
      }
      continue
    }
    if (
      typeof value !== 'string' &&
      typeof value !== 'number' &&
      typeof value !== 'boolean'
    ) {
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

async function errorMessage(response: Response): Promise<string> {
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
  return (detail || `Error ${response.status} al consultar la API`).slice(0, 300)
}

function notifyUnauthorized(status: number) {
  if (status === 401) unauthorizedHandler?.()
}

export async function request<T>(
  path: string,
  params?: object,
  init?: RequestInit,
): Promise<T> {
  const headers = authHeaders(init?.headers)
  headers.set('Accept', 'application/json')

  const response = await fetch(`${API_BASE}${path}${buildQuery(params)}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    notifyUnauthorized(response.status)
    throw new ApiError(await errorMessage(response), response.status)
  }

  return (await response.json()) as T
}

function filenameFromDisposition(value: string | null): string | null {
  if (!value) return null
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(value)
  if (!match) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return match[1]
  }
}

export async function downloadFile(
  path: string,
  params?: object,
  fallbackName = 'exportacion',
): Promise<void> {
  const response = await fetch(
    `${API_BASE}${path}${buildQuery(params)}`,
    { headers: authHeaders() },
  )

  if (!response.ok) {
    notifyUnauthorized(response.status)
    throw new ApiError(await errorMessage(response), response.status)
  }

  const blob = await response.blob()
  const filename =
    filenameFromDisposition(response.headers.get('Content-Disposition')) ??
    fallbackName
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
