import { describe, it, expect } from 'vitest'
import {
  getSessionTitle,
  formatSessionAsText,
  buildGoogleCalendarUrl,
  buildSessionIcs,
  buildNewExerciseSetInputs,
  estimateSessionDurationMinutes,
} from '@/lib/exportSession'

const mockSession = {
  id: 'abc-123',
  day_name: 'Monday',
  phase: 1,
  week: 2,
  track: 'gym',
  completed_at: '2026-08-27T18:30:00.000Z',
  cardio_minutes: 20,
  calories: 2400,
  protein_g: 180,
  carbs_g: 220,
  fat_g: 65,
  set_logs: [
    {
      exercise_name: 'Bench Press',
      set_number: 1,
      reps_programmed: 8,
      reps_done: 8,
      weight_kg: 135,
    },
    {
      exercise_name: 'Bench Press',
      set_number: 2,
      reps_programmed: 8,
      reps_done: 7,
      weight_kg: 135,
    },
  ],
}

describe('getSessionTitle', () => {
  it('includes day, phase, week, and track', () => {
    expect(getSessionTitle(mockSession)).toBe('Workout: Monday · Foundation · Week 2 · Gym')
  })

  it('handles custom sessions', () => {
    expect(getSessionTitle({ day_name: 'Friday', phase: null })).toBe('Workout: Friday')
  })
})

describe('formatSessionAsText', () => {
  it('lists exercises, sets, and nutrition metrics', () => {
    const text = formatSessionAsText(mockSession)
    expect(text).toContain('Workout: Monday · Foundation · Week 2 · Gym')
    expect(text).toContain('• Bench Press')
    expect(text).toContain('Set 1: 8 reps → 8 done · 135 lbs')
    expect(text).toContain('Cardio: 20 min')
    expect(text).toContain('Protein: 180g')
  })
})

describe('buildGoogleCalendarUrl', () => {
  it('builds a Google Calendar template URL with title and details', () => {
    const url = buildGoogleCalendarUrl(mockSession, { durationMinutes: 45 })
    expect(url).toContain('https://calendar.google.com/calendar/render?')
    expect(url).toContain('action=TEMPLATE')
    expect(url).toContain('text=Workout')
    expect(url).toContain('Foundation')
    expect(url).toContain('dates=')
    expect(url).toContain('Bench+Press')
  })
})

describe('buildSessionIcs', () => {
  it('returns a valid ICS document', () => {
    const ics = buildSessionIcs(mockSession, { durationMinutes: 45 })
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('BEGIN:VEVENT')
    expect(ics).toContain('UID:abc-123@workout-app')
    expect(ics).toContain('SUMMARY:Workout: Monday')
    expect(ics).toContain('END:VEVENT')
    expect(ics).toContain('END:VCALENDAR')
  })
})

describe('buildNewExerciseSetInputs', () => {
  it('creates one input row per programmed set', () => {
    const inputs = buildNewExerciseSetInputs({ name: 'Curls', sets: '3', reps: '12' })
    expect(inputs).toHaveLength(3)
    expect(inputs[0]).toMatchObject({
      exerciseName: 'Curls',
      setNumber: 1,
      repsProgrammed: 12,
    })
  })
})

describe('estimateSessionDurationMinutes', () => {
  it('scales with set count and respects bounds', () => {
    expect(estimateSessionDurationMinutes({ set_logs: [] })).toBe(45)
    expect(estimateSessionDurationMinutes(mockSession)).toBe(30)
  })
})
