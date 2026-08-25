import { QueryClient } from '@tanstack/vue-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: (failureCount, error) => {
        if (failureCount >= 2) return false
        const status = error?.status ?? error?.statusCode
        if (status >= 400 && status < 500) return false
        return true
      },
      refetchOnWindowFocus: true,
    },
  },
})
