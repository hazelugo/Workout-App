import { useQuery } from '@tanstack/vue-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from './keys'

export async function fetchCustomDays() {
  const { data, error } = await supabase.from('custom_days').select('day_name, title, exercises')
  if (error) throw error
  return Object.fromEntries((data ?? []).map((r) => [r.day_name, { title: r.title ?? '', exercises: r.exercises }]))
}

export function useCustomDaysQuery() {
  return useQuery({
    queryKey: queryKeys.customDays.list(),
    queryFn: fetchCustomDays,
  })
}

export function invalidateCustomDays(queryClient) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.customDays.all })
}
