import { computed, unref } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from './keys'

export const EXERCISE_CATEGORIES = ['Push', 'Pull', 'Legs', 'Core', 'Cardio', 'Other']

const STORAGE_KEY = (userId) => `saved-exercises-v1-${userId}`

function readLocal(userId) {
  if (!userId) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY(userId))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeLocal(userId, rows) {
  if (!userId) return
  localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(rows))
}

function isMissingTableError(err) {
  const msg = String(err?.message ?? '')
  return msg.includes('saved_exercises') && msg.includes('does not exist')
}

function normalizeRow(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category || 'Other',
    default_sets: row.default_sets ?? '',
    default_reps: row.default_reps ?? '',
    notes: row.notes ?? '',
    created_at: row.created_at ?? new Date().toISOString(),
  }
}

export async function fetchSavedExercises(userId) {
  if (!userId) return []

  try {
    const { data, error } = await supabase
      .from('saved_exercises')
      .select('id, name, category, default_sets, default_reps, notes, created_at')
      .eq('user_id', userId)
      .order('name', { ascending: true })

    if (error) throw error
    const rows = (data ?? []).map(normalizeRow)
    writeLocal(userId, rows)
    return rows
  } catch (err) {
    if (isMissingTableError(err)) return readLocal(userId)
    const cached = readLocal(userId)
    if (cached.length) return cached
    throw err
  }
}

export function useSavedExercisesQuery(userIdRef) {
  const uid = computed(() => unref(userIdRef))
  return useQuery({
    queryKey: computed(() => queryKeys.savedExercises.list(uid.value)),
    queryFn: () => fetchSavedExercises(uid.value),
    enabled: computed(() => !!uid.value),
  })
}

export function invalidateSavedExercises(queryClient, userId) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.savedExercises.list(userId) })
}

export async function createSavedExercise(userId, payload) {
  const name = payload.name?.trim()
  if (!name) throw new Error('Exercise name is required')

  const row = {
    name,
    category: payload.category || 'Other',
    default_sets: payload.default_sets?.trim() || null,
    default_reps: payload.default_reps?.trim() || null,
    notes: payload.notes?.trim() || null,
  }

  try {
    const { data, error } = await supabase
      .from('saved_exercises')
      .insert({ user_id: userId, ...row })
      .select('id, name, category, default_sets, default_reps, notes, created_at')
      .single()

    if (error) throw error
    return normalizeRow(data)
  } catch (err) {
    if (!isMissingTableError(err)) throw err
    const local = readLocal(userId)
    if (local.some((e) => e.name.toLowerCase() === name.toLowerCase())) {
      throw new Error('You already saved an exercise with this name.')
    }
    const created = normalizeRow({
      id: crypto.randomUUID(),
      ...row,
      created_at: new Date().toISOString(),
    })
    writeLocal(userId, [...local, created].sort((a, b) => a.name.localeCompare(b.name)))
    return created
  }
}

export async function updateSavedExercise(userId, id, payload) {
  const name = payload.name?.trim()
  if (!name) throw new Error('Exercise name is required')

  const patch = {
    name,
    category: payload.category || 'Other',
    default_sets: payload.default_sets?.trim() || null,
    default_reps: payload.default_reps?.trim() || null,
    notes: payload.notes?.trim() || null,
  }

  try {
    const { data, error } = await supabase
      .from('saved_exercises')
      .update(patch)
      .eq('id', id)
      .eq('user_id', userId)
      .select('id, name, category, default_sets, default_reps, notes, created_at')
      .single()

    if (error) throw error
    return normalizeRow(data)
  } catch (err) {
    if (!isMissingTableError(err)) throw err
    const local = readLocal(userId)
    const idx = local.findIndex((e) => e.id === id)
    if (idx < 0) throw new Error('Exercise not found')
    const updated = normalizeRow({ ...local[idx], ...patch })
    local[idx] = updated
    writeLocal(userId, local.sort((a, b) => a.name.localeCompare(b.name)))
    return updated
  }
}

export async function deleteSavedExercise(userId, id) {
  try {
    const { error } = await supabase.from('saved_exercises').delete().eq('id', id).eq('user_id', userId)
    if (error) throw error
  } catch (err) {
    if (!isMissingTableError(err)) throw err
    writeLocal(
      userId,
      readLocal(userId).filter((e) => e.id !== id),
    )
  }
}

function buildExerciseRow(payload) {
  const name = payload.name?.trim()
  if (!name) throw new Error('Exercise name is required')

  return {
    name,
    category: payload.category || 'Other',
    default_sets: payload.default_sets?.trim() || null,
    default_reps: payload.default_reps?.trim() || null,
    notes: payload.notes?.trim() || null,
  }
}

/**
 * Import multiple exercises from parsed CSV rows.
 * Skips names that already exist (case-insensitive).
 */
export async function importSavedExercises(userId, rows) {
  if (!userId) throw new Error('Not signed in')
  if (!rows?.length) throw new Error('No exercises to import')

  const existing = await fetchSavedExercises(userId)
  const existingNames = new Set(existing.map((e) => e.name.toLowerCase()))

  const toInsert = []
  let skipped = 0

  for (const row of rows) {
    const built = buildExerciseRow(row)
    if (existingNames.has(built.name.toLowerCase())) {
      skipped++
      continue
    }
    existingNames.add(built.name.toLowerCase())
    toInsert.push(built)
  }

  if (!toInsert.length) {
    return { imported: 0, skipped }
  }

  try {
    const { data, error } = await supabase
      .from('saved_exercises')
      .insert(toInsert.map((row) => ({ user_id: userId, ...row })))
      .select('id, name, category, default_sets, default_reps, notes, created_at')

    if (error) throw error
    const merged = [...existing, ...(data ?? []).map(normalizeRow)].sort((a, b) =>
      a.name.localeCompare(b.name),
    )
    writeLocal(userId, merged)
    return { imported: data?.length ?? 0, skipped }
  } catch (err) {
    if (!isMissingTableError(err)) throw err

    const created = toInsert.map((row) =>
      normalizeRow({
        id: crypto.randomUUID(),
        ...row,
        created_at: new Date().toISOString(),
      }),
    )
    writeLocal(userId, [...existing, ...created].sort((a, b) => a.name.localeCompare(b.name)))
    return { imported: created.length, skipped }
  }
}
