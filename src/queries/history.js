import { useQuery } from '@tanstack/vue-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from './keys'

export async function fetchWorkoutHistory() {
  const { data, error } = await supabase
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

  if (error) throw error
  return data ?? []
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
