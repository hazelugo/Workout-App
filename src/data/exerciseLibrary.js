/**
 * Curated exercise names grouped by movement pattern.
 * Drawn from gym/home patterns in src/data/program.js.
 */
export const exerciseLibrary = {
  Push: [
    'DB Incline Bench Press',
    'DB Overhead Press',
    'Deficit Push-Up',
    'Cuban Press',
    'DB Lateral Raise',
    'Tricep Overhead Extension',
    'Push-Up',
    'Pike Push-Up',
    'Parallel Dips',
    'Barbell Bench Press',
  ],
  Pull: [
    'DB Row',
    'Prone DB Row',
    'Inverted Row',
    'Lat Pulldown',
    'Barbell Row',
    'Pull-Up',
    'Incline DB Curl',
    'Bicep Curl',
    'Face Pull',
    'Chest-Supported Row',
  ],
  Legs: [
    'Barbell Back Squat',
    'DB Romanian Deadlift',
    'Bulgarian Split Squat',
    'Calf Raises',
    'Hack Squat',
    'Leg Press',
    'Glute Bridge',
    'Lunges',
    'Jump Squat',
    'Shrimp Squat',
  ],
  Core: [
    'Hollow Body Hold',
    'RKC Plank',
    'Hanging Leg Raise',
    'Dead Bug',
    'Ab Wheel Rollout',
    'Plank',
    'Russian Twist',
  ],
  Cardio: [
    'Walk',
    'Brisk Walk',
    "Farmer's Carry",
    'Rowing Machine',
    'Bike',
  ],
}

/** Flat sorted list of all library exercise names. */
export const allExerciseNames = Object.values(exerciseLibrary).flat()

/** Merge built-in and user-saved names (deduped, sorted). */
export function mergeExerciseNames(savedNames = []) {
  return [...new Set([...savedNames, ...allExerciseNames])].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  )
}

/** Filter exercises by query (case-insensitive substring match). */
export function filterExercises(query, extraNames = [], limit = 12) {
  const q = query.trim().toLowerCase()
  const pool = mergeExerciseNames(extraNames)
  if (!q) return pool.slice(0, limit)
  return pool.filter((name) => name.toLowerCase().includes(q)).slice(0, limit)
}

/** Group saved exercises by category for picker panels. */
export function groupSavedExercises(savedExercises = []) {
  const groups = {}
  for (const ex of savedExercises) {
    const category = ex.category || 'Other'
    if (!groups[category]) groups[category] = []
    groups[category].push(ex)
  }
  for (const list of Object.values(groups)) {
    list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
  }
  return groups
}
