import { useQuery } from '@tanstack/vue-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from './keys'

export async function fetchWorkoutHistory() {
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

  return (data ?? []).map((session) => {
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
    } catch (e) {}
    return session
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
