import { describe, expect, it } from 'vitest'
import { parseCsvLine, parseExercisesCsv } from '@/lib/importExercisesCsv'

describe('importExercisesCsv', () => {
  it('parses headered CSV rows', () => {
    const csv = `name,category,default_sets,default_reps,notes
DB Bench,Push,3,10,Slow eccentric
Barbell Row,Pull,4,8,`

    const { rows, errors } = parseExercisesCsv(csv)
    expect(errors).toEqual([])
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      name: 'DB Bench',
      category: 'Push',
      default_sets: '3',
      default_reps: '10',
      notes: 'Slow eccentric',
    })
  })

  it('parses quoted fields with commas', () => {
    const csv = `name,notes
"Bench Press, Close Grip",Chest focus`

    const { rows } = parseExercisesCsv(csv)
    expect(rows[0].name).toBe('Bench Press, Close Grip')
    expect(rows[0].notes).toBe('Chest focus')
  })

  it('parses name-only rows without headers', () => {
    const csv = `Lat Pulldown
Face Pull`

    const { rows } = parseExercisesCsv(csv)
    expect(rows).toEqual([
      expect.objectContaining({ name: 'Lat Pulldown', category: 'Other' }),
      expect.objectContaining({ name: 'Face Pull', category: 'Other' }),
    ])
  })

  it('reports missing name lines', () => {
    const csv = `name,category
,Push`

    const { rows, errors } = parseExercisesCsv(csv)
    expect(rows).toHaveLength(0)
    expect(errors[0]).toContain('missing exercise name')
  })

  it('splits csv lines with quoted commas', () => {
    expect(parseCsvLine('"A, B",3,10')).toEqual(['A, B', '3', '10'])
  })
})
