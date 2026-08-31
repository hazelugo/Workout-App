import { exerciseLibrary } from '@/data/exerciseLibrary'

const PATTERN_MUSCLES = {
  Push: ['Chest', 'Front delts', 'Triceps'],
  Pull: ['Lats', 'Upper back', 'Biceps', 'Rear delts'],
  Legs: ['Quads', 'Glutes', 'Hamstrings', 'Calves'],
  Core: ['Abs', 'Obliques', 'Deep core stabilizers'],
  Cardio: ['Cardiovascular system', 'Lower body endurance'],
  Other: ['Full body', 'General conditioning'],
}

const EXERCISE_DETAILS = {
  'archer push up': {
    muscles: ['Chest', 'Triceps', 'Front delts', 'Core'],
    equipment: 'Bodyweight',
    description: 'Single-arm dominant push-up that shifts load side to side for extra pressing strength.',
  },
  'pike push up': {
    muscles: ['Shoulders', 'Triceps', 'Upper chest'],
    equipment: 'Bodyweight',
    description: 'Inverted pressing angle that targets delts and mimics overhead press mechanics.',
  },
  'parallel dips': {
    muscles: ['Chest', 'Triceps', 'Front delts'],
    equipment: 'Parallel bars or sturdy chairs',
    description: 'Deep elbow flexion press that builds chest and triceps strength.',
  },
  'inverted row': {
    muscles: ['Lats', 'Rhomboids', 'Rear delts', 'Biceps'],
    equipment: 'Bar, rings, or sturdy table',
    description: 'Horizontal pull that trains scapular retraction and upper-back thickness.',
  },
  'bulgarian split squat': {
    muscles: ['Quads', 'Glutes', 'Hamstrings'],
    equipment: 'Bench or box',
    description: 'Single-leg squat pattern that challenges balance and unilateral leg strength.',
  },
  'barbell back squat': {
    muscles: ['Quads', 'Glutes', 'Hamstrings', 'Core'],
    equipment: 'Barbell, squat rack',
    description: 'Primary lower-body strength lift for total leg and trunk development.',
  },
  'db incline bench press': {
    muscles: ['Upper chest', 'Front delts', 'Triceps'],
    equipment: 'Dumbbells, incline bench',
    description: 'Angled press emphasizing clavicular chest fibers and shoulder stability.',
  },
  'db row': {
    muscles: ['Lats', 'Rhomboids', 'Rear delts', 'Biceps'],
    equipment: 'Dumbbell, bench',
    description: 'Unilateral pull that builds back width and improves shoulder balance.',
  },
  'db romanian deadlift': {
    muscles: ['Hamstrings', 'Glutes', 'Lower back'],
    equipment: 'Dumbbells or barbell',
    description: 'Hip-hinge pattern focused on posterior chain lengthening and strength.',
  },
  'db overhead press': {
    muscles: ['Shoulders', 'Triceps', 'Upper traps', 'Core'],
    equipment: 'Dumbbells',
    description: 'Vertical press that develops shoulder strength and overhead stability.',
  },
  'hollow body hold': {
    muscles: ['Abs', 'Hip flexors', 'Deep core'],
    equipment: 'Bodyweight',
    description: 'Anti-extension core drill that teaches full-body tension and spinal control.',
  },
  'rkc plank': {
    muscles: ['Abs', 'Glutes', 'Shoulders'],
    equipment: 'Bodyweight',
    description: 'High-tension plank variation that maximizes full-body bracing.',
  },
  'dead bug': {
    muscles: ['Abs', 'Deep core', 'Hip flexors'],
    equipment: 'Bodyweight',
    description: 'Supine core drill that trains anti-extension while moving opposite limbs.',
  },
  'hanging leg raise': {
    muscles: ['Lower abs', 'Hip flexors', 'Grip'],
    equipment: 'Pull-up bar',
    description: 'Core flexion movement that challenges lower abdominal strength.',
  },
  'lat pulldown': {
    muscles: ['Lats', 'Biceps', 'Rear delts'],
    equipment: 'Cable machine',
    description: 'Vertical pull that develops back width with scalable resistance.',
  },
  'barbell row': {
    muscles: ['Lats', 'Rhomboids', 'Rear delts', 'Biceps'],
    equipment: 'Barbell',
    description: 'Bent-over row pattern for thick upper back and pulling strength.',
  },
  'pull up': {
    muscles: ['Lats', 'Biceps', 'Rear delts', 'Core'],
    equipment: 'Pull-up bar',
    description: 'Bodyweight vertical pull and benchmark for relative upper-body strength.',
  },
  'glute bridge': {
    muscles: ['Glutes', 'Hamstrings', 'Core'],
    equipment: 'Bodyweight or barbell',
    description: 'Hip extension drill that activates glutes and supports lower-back health.',
  },
  'calf raises': {
    muscles: ['Calves', 'Ankles'],
    equipment: 'Bodyweight or machine',
    description: 'Isolated ankle plantar-flexion for calf size and Achilles resilience.',
  },
  'brisk walk': {
    muscles: ['Cardiovascular system', 'Glutes', 'Calves'],
    equipment: 'None',
    description: 'Low-impact aerobic work that supports recovery and daily conditioning.',
  },
  'walk': {
    muscles: ['Cardiovascular system', 'Lower body endurance'],
    equipment: 'None',
    description: 'Steady-state cardio for active recovery and general fitness.',
  },
}

function normalizeName(name) {
  return String(name ?? '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function findLibraryCategory(name) {
  const normalized = normalizeName(name)
  for (const [category, exercises] of Object.entries(exerciseLibrary)) {
    for (const exercise of exercises) {
      const lib = normalizeName(exercise)
      if (normalized === lib || normalized.includes(lib) || lib.includes(normalized)) {
        return category
      }
    }
  }
  return null
}

function findDetail(name) {
  const normalized = normalizeName(name)
  if (EXERCISE_DETAILS[normalized]) return EXERCISE_DETAILS[normalized]

  for (const [key, detail] of Object.entries(EXERCISE_DETAILS)) {
    if (normalized.includes(key) || key.includes(normalized)) return detail
  }
  return null
}

function guessEquipment(name, pattern) {
  const normalized = normalizeName(name)
  if (normalized.includes('barbell')) return 'Barbell'
  if (normalized.includes('db') || normalized.includes('dumbbell')) return 'Dumbbells'
  if (normalized.includes('cable')) return 'Cable machine'
  if (pattern === 'Cardio') return 'None'
  if (pattern === 'Core' || normalized.includes('plank') || normalized.includes('push up')) {
    return 'Bodyweight'
  }
  return 'Gym or home equipment'
}

export function exerciseYoutubeUrl(name) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} exercise demonstration`)}`
}

export function lookupExerciseInfo(name, options = {}) {
  const trimmedName = String(name ?? '').trim()
  const detail = findDetail(trimmedName)
  const pattern = detail?.pattern || findLibraryCategory(trimmedName) || 'Other'
  const muscles = detail?.muscles || PATTERN_MUSCLES[pattern] || PATTERN_MUSCLES.Other
  const equipment = detail?.equipment || guessEquipment(trimmedName, pattern)
  const description =
    options.note?.trim() ||
    detail?.description ||
    `A ${pattern.toLowerCase()} pattern movement. Use controlled reps and full range of motion.`

  return {
    name: trimmedName,
    pattern,
    muscles,
    equipment,
    description,
    sets: options.sets ?? null,
    reps: options.reps ?? null,
    youtubeUrl: exerciseYoutubeUrl(trimmedName),
  }
}
