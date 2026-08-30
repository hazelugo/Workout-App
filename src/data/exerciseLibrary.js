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

/** Filter exercises by query (case-insensitive substring match). */
export function filterExercises(query, limit = 12) {
  const q = query.trim().toLowerCase()
  if (!q) return allExerciseNames.slice(0, limit)
  return allExerciseNames.filter((name) => name.toLowerCase().includes(q)).slice(0, limit)
}
