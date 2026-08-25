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

export function buildSetLogs(sessionId, exercises) {
  const logs = []
  for (const ex of exercises) {
    const count = parseSetCount(ex.sets)
    const reps = parseRepsProgrammed(ex.reps)
    for (let setNum = 1; setNum <= count; setNum++) {
      logs.push({
        session_id: sessionId,
        exercise_name: ex.name,
        set_number: setNum,
        reps_programmed: reps,
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
