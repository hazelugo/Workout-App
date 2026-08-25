import { supabase } from '@/lib/supabase'
import { buildSetLogs } from '@/lib/workout'

/**
 * Get the current date from the server (prevents timezone drift on the client).
 * Returns a "YYYY-MM-DD" string.
 */
export async function getServerDate() {
  const { data, error } = await supabase.rpc('server_now')
  if (error) {
    // Fallback to local date if RPC unavailable
    return new Date().toISOString().slice(0, 10)
  }
  // data is a timestamptz string like "2026-08-25T19:14:00+00:00"
  return data.slice(0, 10)
}

/**
 * Log a custom day as a completed workout_session + set_logs.
 *
 * @param {string} userId
 * @param {string} dayName  - e.g. "Monday"
 * @param {string} title    - plan title e.g. "Upper Body"
 * @param {Array}  exercises - [{ name, sets, reps }, ...]
 * @param {Array}  setOverrides - [{ exerciseName, setNumber, repsDone, weightLbs }, ...]
 */
export async function logCustomDay(userId, dayName, title, exercises, setOverrides = []) {
  const date = await getServerDate()
  const now = new Date().toISOString()

  // Build exercise list in the format buildSetLogs expects
  const exList = exercises.map((e) => ({
    name: e.name,
    sets: String(e.sets || 1),
    reps: String(e.reps || ''),
  }))

  // Insert the session
  const { data: session, error: sessionErr } = await supabase
    .from('workout_sessions')
    .insert({
      user_id: userId,
      date,
      started_at: now,
      completed_at: now,
      day_name: title ? `${dayName} — ${title}` : dayName,
      // phase, week, track are null for custom sessions (requires migration to drop NOT NULL)
    })
    .select('id')
    .single()

  if (sessionErr) throw sessionErr

  // Build and insert set_logs
  const setRows = buildSetLogs(session.id, exList, setOverrides)
  if (setRows.length) {
    const { error: setsErr } = await supabase.from('set_logs').insert(setRows)
    if (setsErr) throw setsErr
  }

  return session.id
}
