import { openDB } from 'idb'
import { buildSetLogs } from './workout'

const DB_NAME = 'workout-offline'
const STORE_NAME = 'pending-workouts'
const DB_VERSION = 1

async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('userId', 'userId')
      }
    },
  })
}

export async function enqueueWorkout(userId, session, exercises) {
  const db = await getDb()
  const item = {
    id: crypto.randomUUID(),
    userId,
    session,
    exercises,
    createdAt: new Date().toISOString(),
    retries: 0,
  }
  await db.put(STORE_NAME, item)
  return item
}

export async function getPendingWorkouts(userId) {
  const db = await getDb()
  return db.getAllFromIndex(STORE_NAME, 'userId', userId)
}

export async function getPendingCount(userId) {
  const items = await getPendingWorkouts(userId)
  return items.length
}

export async function removeWorkout(id) {
  const db = await getDb()
  await db.delete(STORE_NAME, id)
}

async function incrementRetry(id) {
  const db = await getDb()
  const item = await db.get(STORE_NAME, id)
  if (item) {
    item.retries += 1
    await db.put(STORE_NAME, item)
  }
}

export function isNetworkError(error) {
  if (!error) return false
  const msg = String(error.message || error).toLowerCase()
  return (
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('networkerror') ||
    error.name === 'TypeError'
  )
}

async function insertWorkout(supabase, item) {
  const { data: session, error } = await supabase
    .from('workout_sessions')
    .insert(item.session)
    .select('id')
    .single()

  if (error) return { error }

  const setLogs = buildSetLogs(session.id, item.exercises)
  if (!setLogs.length) return { session }

  const { error: setsError } = await supabase.from('set_logs').insert(setLogs)
  if (setsError) {
    await supabase.from('workout_sessions').delete().eq('id', session.id)
    return { error: setsError }
  }

  return { session }
}

export async function syncPendingWorkouts(supabase, userId) {
  const pending = await getPendingWorkouts(userId)
  let synced = 0

  for (const item of pending) {
    const { error } = await insertWorkout(supabase, item)

    if (error) {
      if (isNetworkError(error)) break
      await incrementRetry(item.id)
      continue
    }

    await removeWorkout(item.id)
    synced += 1
  }

  return { synced, remaining: (await getPendingCount(userId)) }
}
