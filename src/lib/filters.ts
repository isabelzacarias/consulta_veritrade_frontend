function normalize(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }
  if (typeof value === 'string' && value) return [value]
  return []
}

export function hasFilterChanges(draft: object, applied: object): boolean {
  const draftRecord = draft as Record<string, unknown>
  const appliedRecord = applied as Record<string, unknown>
  const keys = new Set([
    ...Object.keys(draftRecord),
    ...Object.keys(appliedRecord),
  ])

  for (const key of keys) {
    const draftValues = normalize(draftRecord[key])
    const appliedValues = normalize(appliedRecord[key])
    if (draftValues.length !== appliedValues.length) return true
    if (draftValues.some((value, index) => value !== appliedValues[index])) {
      return true
    }
  }

  return false
}

export function countFilterValues(filters: object): number {
  return Object.values(filters as Record<string, unknown>).reduce<number>(
    (total, value) => total + normalize(value).length,
    0,
  )
}

export function removeFilterValue<T extends object>(
  filters: T,
  key: string,
  value?: string,
): T {
  const next = { ...filters } as Record<string, unknown>
  const current = next[key]

  if (Array.isArray(current)) {
    const remaining = current.filter((item) => item !== value)
    if (remaining.length > 0) {
      next[key] = remaining
    } else {
      delete next[key]
    }
  } else {
    delete next[key]
  }

  return next as T
}
