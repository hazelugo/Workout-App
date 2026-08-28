import { PHASES, parseSetCount, parseRepsProgrammed } from '@/lib/workout'

const GOOGLE_CALENDAR_BASE = 'https://calendar.google.com/calendar/render'
const DEFAULT_DURATION_MINUTES = 45

/**
 * Build a display title for a logged workout session.
 * @param {Object} session
 * @returns {string}
 */
export function getSessionTitle(session) {
  if (!session) return 'Workout'

  const parts = [session.day_name || 'Workout']
  if (session.phase != null) {
    parts.push(PHASES[session.phase]?.name ?? `Phase ${session.phase}`)
  }
  if (session.week) parts.push(`Week ${session.week}`)
  if (session.track && session.track !== 'custom') {
    parts.push(session.track === 'gym' ? 'Gym' : 'Home')
  }
  return `Workout: ${parts.join(' · ')}`
}

/**
 * Group set_logs by exercise name, sorted by set_number.
 * @param {Array} setLogs
 * @returns {Record<string, Array>}
 */
export function groupSessionSets(setLogs) {
  if (!setLogs?.length) return {}

  const groups = {}
  for (const set of setLogs) {
    if (!groups[set.exercise_name]) groups[set.exercise_name] = []
    groups[set.exercise_name].push(set)
  }
  for (const name of Object.keys(groups)) {
    groups[name].sort((a, b) => a.set_number - b.set_number)
  }
  return groups
}

/**
 * Format a logged session as plaintext (calendar description, notes, etc.).
 * @param {Object} session
 * @returns {string}
 */
export function formatSessionAsText(session) {
  if (!session) return ''

  const lines = [getSessionTitle(session), '']

  const groups = groupSessionSets(session.set_logs)
  const exerciseNames = Object.keys(groups)

  if (!exerciseNames.length) {
    lines.push('No exercises logged.')
  } else {
    lines.push('Exercises:')
    for (const name of exerciseNames) {
      lines.push(`• ${name}`)
      for (const set of groups[name]) {
        let line = `  Set ${set.set_number}: ${set.reps_programmed} reps`
        if (set.reps_done != null) line += ` → ${set.reps_done} done`
        if (set.weight_kg != null) line += ` · ${set.weight_kg} lbs`
        lines.push(line)
      }
    }
  }

  const metrics = []
  if (session.cardio_minutes) metrics.push(`Cardio: ${session.cardio_minutes} min`)
  if (session.calories) metrics.push(`Calories: ${Number(session.calories).toLocaleString()} kcal`)
  if (session.protein_g) metrics.push(`Protein: ${session.protein_g}g`)
  if (session.carbs_g) metrics.push(`Carbs: ${session.carbs_g}g`)
  if (session.fat_g) metrics.push(`Fat: ${session.fat_g}g`)

  if (metrics.length) {
    lines.push('')
    lines.push(metrics.join(' · '))
  }

  lines.push('')
  lines.push('Logged via Workout App')

  return lines.join('\n').trim()
}

/**
 * Estimate workout duration from set count.
 * @param {Object} session
 * @param {number} [fallbackMinutes]
 * @returns {number}
 */
export function estimateSessionDurationMinutes(session, fallbackMinutes = DEFAULT_DURATION_MINUTES) {
  const setCount = session?.set_logs?.length ?? 0
  if (setCount === 0) return fallbackMinutes
  return Math.min(120, Math.max(30, setCount * 3 + 15))
}

/**
 * Resolve start/end Date objects for a session export.
 * @param {Object} session
 * @param {Object} [options]
 * @param {number} [options.durationMinutes]
 * @returns {{ start: Date, end: Date }}
 */
export function getSessionEventTimes(session, options = {}) {
  const durationMinutes = options.durationMinutes ?? estimateSessionDurationMinutes(session)
  const raw = session?.completed_at || session?.date
  const start = raw ? new Date(raw) : new Date()

  if (!session?.completed_at && session?.date) {
    start.setHours(9, 0, 0, 0)
  }

  const end = new Date(start.getTime() + durationMinutes * 60 * 1000)
  return { start, end }
}

/**
 * Format a Date for Google Calendar `dates` param (UTC, no separators).
 * @param {Date} date
 * @returns {string}
 */
export function toGoogleCalendarDate(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

/**
 * Build a Google Calendar "create event" URL for a logged session.
 * Opens Google Calendar with a pre-filled event (no OAuth required).
 * @param {Object} session
 * @param {Object} [options]
 * @returns {string}
 */
export function buildGoogleCalendarUrl(session, options = {}) {
  const { start, end } = getSessionEventTimes(session, options)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: getSessionTitle(session),
    dates: `${toGoogleCalendarDate(start)}/${toGoogleCalendarDate(end)}`,
    details: formatSessionAsText(session),
  })

  return `${GOOGLE_CALENDAR_BASE}?${params.toString()}`
}

function escapeIcsText(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

function foldIcsLine(line) {
  const chunks = []
  let remaining = line
  while (remaining.length > 75) {
    chunks.push(remaining.slice(0, 75))
    remaining = ` ${remaining.slice(75)}`
  }
  chunks.push(remaining)
  return chunks.join('\r\n')
}

/**
 * Build an ICS calendar file body for a logged session.
 * @param {Object} session
 * @param {Object} [options]
 * @returns {string}
 */
export function buildSessionIcs(session, options = {}) {
  const { start, end } = getSessionEventTimes(session, options)
  const uid = `${session.id}@workout-app`
  const now = new Date()

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Workout App//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toGoogleCalendarDate(now)}`,
    `DTSTART:${toGoogleCalendarDate(start)}`,
    `DTEND:${toGoogleCalendarDate(end)}`,
    foldIcsLine(`SUMMARY:${escapeIcsText(getSessionTitle(session))}`),
    foldIcsLine(`DESCRIPTION:${escapeIcsText(formatSessionAsText(session))}`),
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return `${lines.join('\r\n')}\r\n`
}

/**
 * Trigger download of an ICS file for a logged session.
 * @param {Object} session
 * @param {Object} [options]
 */
export function downloadSessionIcs(session, options = {}) {
  const safeDay = (session.day_name || 'workout').replace(/[^a-zA-Z0-9_-]/g, '_')
  const datePart = (session.completed_at || session.date || new Date().toISOString()).slice(0, 10)
  const filename = `${safeDay}-${datePart}.ics`
  const content = buildSessionIcs(session, options)
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Open Google Calendar in a new tab with a pre-filled event for the session.
 * @param {Object} session
 * @param {Object} [options]
 */
export function openSessionInGoogleCalendar(session, options = {}) {
  const url = buildGoogleCalendarUrl(session, options)
  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * Build set override inputs for a new exercise being added to history.
 * @param {{ name: string, sets: string|number, reps: string|number }} exercise
 * @returns {Array<{ exerciseName: string, setNumber: number, repsProgrammed: number, repsDone: number|null, weightLbs: number|null }>}
 */
export function buildNewExerciseSetInputs(exercise) {
  const count = parseSetCount(exercise.sets)
  const repsProgrammed = parseRepsProgrammed(exercise.reps)
  const inputs = []

  for (let setNum = 1; setNum <= count; setNum++) {
    inputs.push({
      exerciseName: exercise.name.trim(),
      setNumber: setNum,
      repsProgrammed,
      repsDone: null,
      weightLbs: null,
    })
  }

  return inputs
}
