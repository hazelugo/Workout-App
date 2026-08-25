import { supabase } from '@/lib/supabase'
import { queryKeys } from './keys'

export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, program_adopted')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

export function profileQueryOptions(userId) {
  return {
    queryKey: queryKeys.profile.detail(userId),
    queryFn: () => fetchProfile(userId),
  }
}

export function invalidateProfile(queryClient, userId) {
  const key = userId ? queryKeys.profile.detail(userId) : queryKeys.profile.all
  return queryClient.invalidateQueries({ queryKey: key })
}
