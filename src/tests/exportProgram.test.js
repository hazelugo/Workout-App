import { describe, it, expect, vi } from 'vitest'
import { formatProgramAsText, copyTextToClipboard, downloadTextFile } from '@/lib/exportProgram'

describe('formatProgramAsText', () => {
  it('formats built-in program with all phases and tracks', () => {
    const mockProgram = {
      phases: [
        {
          id: 1,
          name: 'Foundation',
          weeks: 'Weeks 1–2',
          subtitle: 'Advanced bodyweight',
          days: [
            {
              day: 'Monday',
              label: 'Push',
              home: [
                { name: 'Archer Push-Up', sets: '3', reps: '6/side', note: 'Form note' }
              ],
              gym: [
                { name: 'Barbell Bench Press', sets: '3', reps: '8', note: 'Heavy' }
              ]
            }
          ]
        }
      ]
    }

    const text = formatProgramAsText(mockProgram)
    expect(text).toContain('PROGRAM: Build From Zero (8-Week Program)')
    expect(text).toContain('PHASE 1: FOUNDATION (Weeks 1–2)')
    expect(text).toContain('Focus: Advanced bodyweight')
    expect(text).toContain('* MONDAY - Push')
    expect(text).toContain('[Home Track]')
    expect(text).toContain('1. Archer Push-Up - 3 sets x 6/side')
    expect(text).toContain('Note: Form note')
    expect(text).toContain('[Gym Track]')
    expect(text).toContain('1. Barbell Bench Press - 3 sets x 8')
  })

  it('formats built-in program for a specific phase and single track', () => {
    const mockProgram = {
      phases: [
        { id: 1, name: 'Foundation', weeks: 'Weeks 1-2', days: [] },
        {
          id: 2,
          name: 'Hypertrophy',
          weeks: 'Weeks 3-4',
          days: [
            {
              day: 'Wednesday',
              label: 'Pull',
              home: [{ name: 'Inverted Row', sets: '4', reps: '10' }],
              gym: [{ name: 'Barbell Row', sets: '4', reps: '8' }]
            }
          ]
        }
      ]
    }

    const text = formatProgramAsText(mockProgram, { phaseIndex: 1, track: 'gym' })
    expect(text).toContain('PHASE 2: HYPERTROPHY (Weeks 3-4)')
    expect(text).not.toContain('PHASE 1: FOUNDATION')
    expect(text).toContain('Barbell Row - 4 sets x 8')
    expect(text).not.toContain('Inverted Row')
  })

  it('formats custom program correctly', () => {
    const mockCustomProgram = {
      name: 'PPL Routine',
      custom_program_days: [
        {
          day_name: 'Monday',
          title: 'Push Heavy',
          exercises: [
            { name: 'Overhead Press', sets: '4', reps: '5', note: 'Strict form' },
            { name: 'Dips', sets: '3', reps: '10' }
          ]
        },
        {
          day_name: 'Tuesday',
          title: 'Pull Power',
          exercises: [
            { name: 'Deadlift', sets: '3', reps: '5' }
          ]
        }
      ]
    }

    const text = formatProgramAsText(mockCustomProgram)
    expect(text).toContain('PROGRAM: PPL ROUTINE')
    expect(text).toContain('* MONDAY - Push Heavy')
    expect(text).toContain('1. Overhead Press - 4 sets x 5')
    expect(text).toContain('Note: Strict form')
    expect(text).toContain('2. Dips - 3 sets x 10')
    expect(text).toContain('* TUESDAY - Pull Power')
    expect(text).toContain('1. Deadlift - 3 sets x 5')
  })

  it('handles empty program gracefully', () => {
    expect(formatProgramAsText(null)).toBe('')
    expect(formatProgramAsText({})).toContain('PROGRAM: CUSTOM WORKOUT PROGRAM')
  })
})
