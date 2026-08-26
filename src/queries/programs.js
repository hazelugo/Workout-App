import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from './keys'

// ── Fetch ──────────────────────────────────────────────────────

export async function fetchCustomPrograms() {
  const { data, error } = await supabase
    .from('custom_programs')
    .select('id, name, created_at, updated_at, custom_program_days(id, day_name, title, exercises)')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export function useCustomProgramsQuery() {
  return useQuery({
    queryKey: queryKeys.programs.list(),
    queryFn: fetchCustomPrograms,
  })
}

export function invalidateCustomPrograms(queryClient) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.programs.all })
}

// ── Create program ─────────────────────────────────────────────

export async function createProgram(userId, name) {
  const { data, error } = await supabase
    .from('custom_programs')
    .insert({ user_id: userId, name })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

// ── Rename program ─────────────────────────────────────────────

export async function renameProgram(programId, name) {
  const { error } = await supabase
    .from('custom_programs')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', programId)
  if (error) throw error
}

// ── Save / upsert a single day within a program ────────────────

export async function saveProgramDay(programId, dayName, title, exercises) {
  const { error } = await supabase
    .from('custom_program_days')
    .upsert(
      { program_id: programId, day_name: dayName, title, exercises },
      { onConflict: 'program_id,day_name' },
    )
  if (error) throw error
  // Bump updated_at on the parent program so ordering stays fresh
  await supabase
    .from('custom_programs')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', programId)
}

// ── Delete a single day from a program ────────────────────────

export async function deleteProgramDay(programId, dayName) {
  const { error } = await supabase
    .from('custom_program_days')
    .delete()
    .eq('program_id', programId)
    .eq('day_name', dayName)
  if (error) throw error
}

// ── Delete a whole program (cascade removes days) ─────────────

export async function deleteProgram(programId) {
  const { error } = await supabase
    .from('custom_programs')
    .delete()
    .eq('id', programId)
  if (error) throw error
}

// ── Activate: copy program days → active custom_days ──────────

export async function activateProgram(userId, programDays) {
  if (!userId || !programDays?.length) return
  // Clear existing active custom days for this user
  await supabase.from('custom_days').delete().eq('user_id', userId)

  const rows = programDays.map((d) => ({
    user_id: userId,
    day_name: d.day_name,
    title: d.title ?? '',
    exercises: d.exercises,
  }))
  const { error } = await supabase.from('custom_days').insert(rows)
  if (error) throw error
}
