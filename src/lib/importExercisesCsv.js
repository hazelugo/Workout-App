import { normalizeExerciseCategory } from '@/queries/savedExercises'

const HEADER_ALIASES = {
  name: ['name', 'exercise', 'exercise name', 'exercise_name', 'title'],
  category: ['category', 'type', 'group', 'muscle', 'muscle group'],
  default_sets: ['default_sets', 'sets', 'default sets', 'set'],
  default_reps: ['default_reps', 'reps', 'default reps', 'rep'],
  notes: ['notes', 'note', 'comments', 'comment'],
}

function normalizeHeader(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
}

function mapHeader(header) {
  const normalized = normalizeHeader(header)
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.includes(normalized)) return field
  }
  return null
}

/** Parse a single CSV line respecting quoted fields. */
export function parseCsvLine(line) {
  const cells = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (ch === ',' && !inQuotes) {
      cells.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }
  cells.push(current.trim())
  return cells
}

export function parseExercisesCsv(text) {
  const lines = String(text ?? '')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (!lines.length) {
    return { rows: [], errors: ['CSV file is empty.'] }
  }

  const firstCells = parseCsvLine(lines[0])
  const headerMap = firstCells.map(mapHeader)
  const hasHeader = headerMap.some(Boolean)

  const dataLines = hasHeader ? lines.slice(1) : lines
  const fieldIndexes = hasHeader
    ? headerMap
    : firstCells.length >= 3
      ? ['name', 'default_sets', 'default_reps']
      : ['name']

  if (hasHeader && !headerMap.includes('name')) {
    return { rows: [], errors: ['CSV must include a Name column (e.g. name, exercise).'] }
  }

  const rows = []
  const errors = []

  for (let lineIndex = 0; lineIndex < dataLines.length; lineIndex++) {
    const lineNo = hasHeader ? lineIndex + 2 : lineIndex + 1
    const cells = parseCsvLine(dataLines[lineIndex])
    if (!cells.some((cell) => cell.trim())) continue

    const record = {
      name: '',
      category: 'Other',
      default_sets: '',
      default_reps: '',
      notes: '',
    }

    if (hasHeader) {
      headerMap.forEach((field, idx) => {
        if (!field) return
        record[field] = cells[idx] ?? ''
      })
    } else if (fieldIndexes.length === 1) {
      record.name = cells[0] ?? ''
    } else {
      record.name = cells[0] ?? ''
      record.default_sets = cells[1] ?? ''
      record.default_reps = cells[2] ?? ''
      if (cells[3]) record.notes = cells[3]
    }

    const name = record.name.trim()
    if (!name) {
      errors.push(`Line ${lineNo}: missing exercise name.`)
      continue
    }

    const category = normalizeExerciseCategory(record.category)
    rows.push({
      name,
      category,
      default_sets: String(record.default_sets ?? '').trim(),
      default_reps: String(record.default_reps ?? '').trim(),
      notes: String(record.notes ?? '').trim(),
    })
  }

  return { rows, errors }
}

export const EXERCISE_CSV_TEMPLATE = `name,category,default_sets,default_reps,notes
DB Incline Bench Press,Push,3,10,Controlled tempo
Barbell Row,Pull,4,8,
Bulgarian Split Squat,Legs,3,12,Each leg`

export function downloadExerciseCsvTemplate() {
  const blob = new Blob([EXERCISE_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'exercise-import-template.csv'
  link.click()
  URL.revokeObjectURL(url)
}
