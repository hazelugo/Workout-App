import { describe, it, expect } from 'vitest'
import { buildNewExerciseSetInputs } from '@/lib/exportSession'

describe('offline queue item shape', () => {
  it('builds set inputs for queued custom workouts', () => {
    const inputs = buildNewExerciseSetInputs({ name: 'Rows', sets: '4', reps: '8' })
    expect(inputs).toHaveLength(4)
    expect(inputs[0].exerciseName).toBe('Rows')
  })
})

describe('fetchWithCache contract', () => {
  it('returns fresh data and writes cache on success', async () => {
    const { fetchWithCache } = await import('@/lib/offlineCache')
    const cache = new Map()

    const data = await fetchWithCache({
      userId: 'user-1',
      fetcher: async () => [{ id: 1 }],
      readCache: async (userId) => cache.get(userId) ?? null,
      writeCache: async (userId, value) => {
        cache.set(userId, value)
      },
    })

    expect(data).toEqual([{ id: 1 }])
    expect(cache.get('user-1')).toEqual([{ id: 1 }])
  })

  it('falls back to cache when fetcher fails offline', async () => {
    const { fetchWithCache } = await import('@/lib/offlineCache')
    const originalOnline = navigator.onLine
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false })

    try {
      const data = await fetchWithCache({
        userId: 'user-1',
        fetcher: async () => {
          throw new TypeError('Failed to fetch')
        },
        readCache: async () => [{ id: 'cached' }],
        writeCache: async () => {},
      })

      expect(data).toEqual([{ id: 'cached' }])
    } finally {
      Object.defineProperty(navigator, 'onLine', { configurable: true, value: originalOnline })
    }
  })
})
