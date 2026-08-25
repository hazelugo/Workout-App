import { useQuery } from '@tanstack/vue-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from './keys'

export async function fetchCustomDays() {
  const { data, error } = await supabase
    .from('custom_days')
    .select('id, day_name, title, exercises, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
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
