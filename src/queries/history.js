import { useQuery } from '@tanstack/vue-query'
import { supabase } from '@/lib/supabase'
import { buildSetLogs } from '@/lib/workout'
import {
  cacheWorkoutHistory,
  fetchWithCache,
  getCachedWorkoutHistory,
} from '@/lib/offlineCache'
import { queryKeys } from './keys'

async function loadWorkoutHistoryFromServer() {
  let { data, error } = await supabase
    .from('workout_sessions')
    .select(
      `
      id,
      date,
      completed_at,
      phase,
      week,
      day_name,
      track,
      cardio_minutes,
      calories,
      protein_g,
      carbs_g,
      fat_g,
      set_logs (
        id,
        exercise_name,
        set_number,
        reps_programmed,
        reps_done,
        weight_kg,
        completed
      )
    `,
    )
    .not('completed_at', 'is', null)
    .order('date', { ascending: false })
    .order('completed_at', { ascending: false })

  if (error) {
    const fallback = await supabase
      .from('workout_sessions')
      .select(
        `
        id,
        date,
        completed_at,
        phase,
        week,
        day_name,
        track,
        cardio_minutes,
        set_logs (
          id,
          exercise_name,
          set_number,
          reps_programmed,
          reps_done,
          weight_kg,
          completed
        )
      `,
      )
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })

    if (fallback.error) throw fallback.error
    data = fallback.data
  }

  return data ?? []
}

function hydrateNutrition(sessions) {
  return sessions.map((session) => {
    try {
      const cached = localStorage.getItem(`session-nutrition-v1-${session.id}`)
      if (cached) {
        const parsed = JSON.parse(cached)
        return {
          ...session,
          calories: session.calories ?? parsed.calories ?? null,
          protein_g: session.protein_g ?? parsed.protein_g ?? null,
          carbs_g: session.carbs_g ?? parsed.carbs_g ?? null,
          fat_g: session.fat_g ?? parsed.fat_g ?? null,
          cardio_minutes: session.cardio_minutes ?? parsed.cardio_minutes ?? null,
        }
      }
    } catch {}
    return session
  })
}

export async function fetchWorkoutHistory() {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return fetchWithCache({
    userId: user?.id,
    fetcher: async () => hydrateNutrition(await loadWorkoutHistoryFromServer()),
    readCache: getCachedWorkoutHistory,
    writeCache: cacheWorkoutHistory,
  })
}

export function useWorkoutHistoryQuery() {
  return useQuery({
    queryKey: queryKeys.history.sessions(),
    queryFn: fetchWorkoutHistory,
  })
}

/** Call after logging a workout or when offline queue sync completes. */
export function invalidateWorkoutHistory(queryClient) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.history.all })
}

function applyDateToTimestamp(_isoTimestamp, dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  // Noon local keeps the saved calendar day stable across US timezones.
  return new Date(y, m - 1, d, 12, 0, 0, 0).toISOString()
}

/**
 * Move a session to a specific calendar date (fixes out-of-order logging).
 * Updates both `date` and `completed_at` so list sort stays correct.
 */
export async function updateSessionDate(sessionId, dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error('Invalid date')
  }

  const { data: session, error: fetchErr } = await supabase
    .from('workout_sessions')
    .select('completed_at, started_at')
    .eq('id', sessionId)
    .single()

  if (fetchErr) throw fetchErr

  const completedAt = applyDateToTimestamp(session.completed_at, dateStr)
  const startedAt = session.started_at
    ? applyDateToTimestamp(session.started_at, dateStr)
    : completedAt

  const { error } = await supabase
    .from('workout_sessions')
    .update({
      date: dateStr,
      completed_at: completedAt,
      started_at: startedAt,
    })
    .eq('id', sessionId)

  if (error) throw error
}

/**
 * Append a new exercise (and its sets) to an existing logged session.
 * Does not modify program templates — only inserts set_logs rows.
 *
 * @param {string} sessionId
 * @param {{ name: string, sets: string|number, reps: string|number }} exercise
 * @param {Array<{ exerciseName: string, setNumber: number, repsDone?: number|null, weightLbs?: number|null }>} [setOverrides]
 */
export async function addExerciseToSession(sessionId, exercise, setOverrides = []) {
  const name = exercise?.name?.trim()
  if (!name) throw new Error('Exercise name is required')

  const logs = buildSetLogs(sessionId, [{ name, sets: exercise.sets, reps: exercise.reps }], setOverrides)
  const { data, error } = await supabase.from('set_logs').insert(logs).select()

  if (error) throw error
  return data
}
