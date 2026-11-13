function originOf(value: string | undefined): string | null {
  if (!value) return null
  try {
    const origin = window.location.origin
    return new URL(value, origin).origin
  } catch {
    return null
  }
}

const configured = import.meta.env.VITE_SUITE_URL?.trim()
const candidate =
  configured ||
  originOf(import.meta.env.VITE_AUTH_CONTEXT_URL) ||
  'http://localhost:8000'

export const SUITE_URL =
  candidate === '/' ? '/' : candidate.replace(/\/+$/, '')
