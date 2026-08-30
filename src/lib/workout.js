export const PHASES = {
  1: { name: 'Foundation', color: '#4ade80' },
  2: { name: 'Build', color: '#facc15' },
  3: { name: 'Strength', color: '#f87171' },
}

export function parseSetCount(sets) {
  const n = parseInt(String(sets), 10)
  return Number.isFinite(n) && n > 0 ? n : 1
}

export function parseRepsProgrammed(reps) {
  const match = String(reps).match(/\d+/)
  return match ? parseInt(match[0], 10) : 0
}

/**
 * Build set_logs rows for a session.
 *
 * @param {string} sessionId
 * @param {Array}  exercises        - program exercise objects { name, sets, reps, … }
 * @param {Array}  [setOverrides]   - optional per-set actuals:
 *                                    [{ exerciseName, setNumber, repsDone, weightLbs }]
 *                                    Unmatched sets keep reps_done/weight_kg as null.
 */
export function buildSetLogs(sessionId, exercises, setOverrides = []) {
  // Build a quick-lookup map: "exerciseName|setNumber" → override
  const overrideMap = {}
  for (const o of setOverrides) {
    overrideMap[`${o.exerciseName}|${o.setNumber}`] = o
  }

  const logs = []
  for (const ex of exercises) {
    const count = parseSetCount(ex.sets)
    const reps = parseRepsProgrammed(ex.reps)
    for (let setNum = 1; setNum <= count; setNum++) {
      const override = overrideMap[`${ex.name}|${setNum}`]
      logs.push({
        session_id: sessionId,
        exercise_name: ex.name,
        set_number: setNum,
        reps_programmed: reps,
        reps_done: override?.repsDone ?? null,
        weight_kg: override?.weightLbs ?? null,
        completed: true,
      })
    }
  }
  return logs
}

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/

/** Parse YYYY-MM-DD as a local calendar date (avoids UTC day-shift). */
export function parseCalendarDate(value) {
  if (!value) return null
  const raw = String(value).trim()
  const match = raw.match(DATE_ONLY_RE)
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  }
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/** Format a value for `<input type="date">` in the user's local timezone. */
export function toDateInputValue(value) {
  const date = parseCalendarDate(value)
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatSessionDate(iso) {
  const date = parseCalendarDate(iso)
  if (!date) return ''
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatSessionTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}
