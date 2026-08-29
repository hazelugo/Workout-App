import { openDB } from 'idb'
import { isNetworkError } from './offlineQueue'

const DB_NAME = 'workout-cache'
const DB_VERSION = 1

async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('custom-days')) {
        db.createObjectStore('custom-days')
      }
      if (!db.objectStoreNames.contains('history')) {
        db.createObjectStore('history')
      }
    },
  })
}

function cacheKey(userId) {
  return String(userId)
}

export async function cacheCustomDays(userId, data) {
  if (!userId) return
  const db = await getDb()
  await db.put('custom-days', { data, cachedAt: new Date().toISOString() }, cacheKey(userId))
}

export async function getCachedCustomDays(userId) {
  if (!userId) return null
  const db = await getDb()
  const entry = await db.get('custom-days', cacheKey(userId))
  return entry?.data ?? null
}

export async function cacheWorkoutHistory(userId, data) {
  if (!userId) return
  const db = await getDb()
  await db.put('history', { data, cachedAt: new Date().toISOString() }, cacheKey(userId))
}

export async function getCachedWorkoutHistory(userId) {
  if (!userId) return null
  const db = await getDb()
  const entry = await db.get('history', cacheKey(userId))
  return entry?.data ?? null
}

/** Fetch with IndexedDB fallback when offline or network fails. */
export async function fetchWithCache({ userId, fetcher, readCache, writeCache }) {
  const shouldUseCache = () =>
    typeof navigator !== 'undefined' && (!navigator.onLine || !userId)

  if (shouldUseCache()) {
    const cached = await readCache(userId)
    if (cached) return cached
  }

  try {
    const data = await fetcher()
    if (userId) await writeCache(userId, data)
    return data
  } catch (err) {
    if (userId && (isNetworkError(err) || !navigator.onLine)) {
      const cached = await readCache(userId)
      if (cached) return cached
    }
    throw err
  }
}
