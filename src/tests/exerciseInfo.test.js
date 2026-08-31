import { describe, expect, it } from 'vitest'
import { lookupExerciseInfo } from '@/data/exerciseInfo'

describe('lookupExerciseInfo', () => {
  it('returns muscle targets for known exercises', () => {
    const info = lookupExerciseInfo('DB Incline Bench Press')
    expect(info.pattern).toBe('Push')
    expect(info.muscles).toContain('Upper chest')
  })

  it('uses program notes when provided', () => {
    const info = lookupExerciseInfo('Archer Push-Up', { note: 'Load shifts to working side' })
    expect(info.description).toBe('Load shifts to working side')
  })

  it('falls back to library category for unknown names', () => {
    const info = lookupExerciseInfo('Face Pull')
    expect(info.pattern).toBe('Pull')
    expect(info.muscles.length).toBeGreaterThan(0)
  })
})
