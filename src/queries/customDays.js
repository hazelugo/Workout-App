import { unref, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from './keys'

export async function fetchCustomDays(userId) {
  if (!userId) return []
  const { data, error } = await supabase
    .from('custom_days')
    .select('id, day_name, title, exercises, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export function useCustomDaysQuery(userIdRef) {
  const uid = computed(() => unref(userIdRef))
  return useQuery({
    queryKey: computed(() => queryKeys.customDays.list(uid.value)),
    queryFn: () => fetchCustomDays(uid.value),
    enabled: computed(() => !!uid.value),
  })
}

export function invalidateCustomDays(queryClient) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.customDays.all })
}
