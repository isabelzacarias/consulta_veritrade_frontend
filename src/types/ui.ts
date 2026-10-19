export interface QuerySlice<T> {
  data: T | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}
