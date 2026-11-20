import { QueryClient } from '@tanstack/react-query'
import { isApiError } from '@/shared/api/apiError'

const MAX_RETRIES = 2

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Client errors (4xx) are final answers (e.g. not found); only retry network/server failures.
        retry: (failureCount, error) => {
          if (isApiError(error) && error.status >= 400 && error.status < 500) return false
          return failureCount < MAX_RETRIES
        },
      },
    },
  })
}
