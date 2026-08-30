import { describe, expect, it } from 'vitest'
import { formatSessionDate, parseCalendarDate, toDateInputValue } from '@/lib/workout'

describe('calendar date helpers', () => {
  it('parses YYYY-MM-DD as a local calendar date', () => {
    const date = parseCalendarDate('2026-08-29')
    expect(date?.getFullYear()).toBe(2026)
    expect(date?.getMonth()).toBe(7)
    expect(date?.getDate()).toBe(29)
  })

  it('formats date-only values without shifting to the previous day', () => {
    expect(formatSessionDate('2026-08-29')).toContain('Aug')
    expect(formatSessionDate('2026-08-29')).toContain('29')
  })

  it('round-trips date input values from timestamps', () => {
    const noonLocal = new Date(2026, 7, 29, 12, 0, 0, 0).toISOString()
    expect(toDateInputValue(noonLocal)).toBe('2026-08-29')
    expect(toDateInputValue('2026-08-29')).toBe('2026-08-29')
  })
})
