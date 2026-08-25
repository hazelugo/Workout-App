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

export function formatSessionDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
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
