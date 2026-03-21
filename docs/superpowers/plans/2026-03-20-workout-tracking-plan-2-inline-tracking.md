# Workout Tracking — Plan 2: Inline Workout Tracking

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add inline set tracking to the Program view so users can log weight and reps for each set during a workout, with progressive overload suggestions from their previous session.

**Architecture:** A `tracking` store manages active session state (session ID, set log entries). ProgramView reads from the store to show/hide the "Start Workout" button and expand exercise rows into set loggers. A `SetLogger` component handles the per-exercise expansion. Utility functions for progressive overload logic are pure and independently testable.

**Tech Stack:** Vue 3, Pinia, `@supabase/supabase-js`, Vitest

---

**Spec:** `docs/superpowers/specs/2026-03-20-workout-tracking-design.md`

**Depends on:** Plan 1 (Foundation & Auth) — Supabase client and auth store must exist.

**This plan produces:** Users can tap "Start Workout" on today's day, expand each exercise, log sets with weight and reps, see progressive overload suggestions, and finish the session.

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/stores/tracking.js` | Active session state + Supabase persistence |
| Create | `src/utils/workout.js` | Pure utility functions (today's day, progressive overload) |
| Create | `src/components/SetLogger.vue` | Inline per-exercise set tracking UI |
| Modify | `src/views/ProgramView.vue` | Start/Finish button + SetLogger integration |
| Create | `src/tests/workout.utils.test.js` | Unit tests for pure utility functions |
| Create | `src/tests/tracking.store.test.js` | Unit tests for tracking store logic |

---

## Task 1: Utility Functions

Pure functions with no dependencies — start here to lock in the logic before wiring it to the UI.

**Files:**
- Create: `src/utils/workout.js`
- Create: `src/tests/workout.utils.test.js`

- [ ] **Step 1: Write failing tests**

  ```js
  // src/tests/workout.utils.test.js
  import { describe, it, expect, vi } from 'vitest'
  import { getTodayDayName, computeProgressiveOverload, allSetsComplete } from '@/utils/workout'

  describe('getTodayDayName', () => {
    it('returns the full weekday name', () => {
      // Freeze date to a known Wednesday
      vi.setSystemTime(new Date('2026-03-18')) // Wednesday
      expect(getTodayDayName()).toBe('Wednesday')
      vi.useRealTimers()
    })
  })

  describe('computeProgressiveOverload', () => {
    it('returns null when no prior sets', () => {
      expect(computeProgressiveOverload([])).toBeNull()
    })

    it('returns null when all sets have null weight (bodyweight)', () => {
      const sets = [
        { weight_kg: null, reps_done: 10, completed: true },
        { weight_kg: null, reps_done: 10, completed: true },
      ]
      expect(computeProgressiveOverload(sets)).toBeNull()
    })

    it('returns suggestion when all sets same weight and all complete', () => {
      const sets = [
        { weight_kg: 60, reps_done: 8, completed: true },
        { weight_kg: 60, reps_done: 8, completed: true },
        { weight_kg: 60, reps_done: 8, completed: true },
      ]
      const result = computeProgressiveOverload(sets)
      expect(result.lastWeight).toBe(60)
      expect(result.suggestedWeight).toBe(62.5)
      expect(result.allComplete).toBe(true)
      expect(result.uniformWeight).toBe(true)
    })

    it('returns no suggestion when sets have mixed weights', () => {
      const sets = [
        { weight_kg: 60, reps_done: 8, completed: true },
        { weight_kg: 65, reps_done: 6, completed: true },
      ]
      const result = computeProgressiveOverload(sets)
      expect(result.lastWeight).toBe(65) // highest
      expect(result.suggestedWeight).toBeNull()
      expect(result.uniformWeight).toBe(false)
    })

    it('returns no suggestion when session was incomplete', () => {
      const sets = [
        { weight_kg: 60, reps_done: 8, completed: true },
        { weight_kg: 60, reps_done: null, completed: false },
      ]
      const result = computeProgressiveOverload(sets)
      expect(result.suggestedWeight).toBeNull()
      expect(result.allComplete).toBe(false)
    })
  })

  describe('allSetsComplete', () => {
    it('returns true when all sets are complete', () => {
      const setMap = {
        'Squat-1': { completed: true },
        'Squat-2': { completed: true },
        'Press-1': { completed: true },
      }
      expect(allSetsComplete(setMap)).toBe(true)
    })

    it('returns false when any set is incomplete', () => {
      const setMap = {
        'Squat-1': { completed: true },
        'Squat-2': { completed: false },
      }
      expect(allSetsComplete(setMap)).toBe(false)
    })

    it('returns false for empty set map', () => {
      expect(allSetsComplete({})).toBe(false)
    })
  })
  ```

- [ ] **Step 2: Run tests — verify they fail**

  ```bash
  npm run test:unit -- src/tests/workout.utils.test.js
  ```

  Expected: FAIL (utils don't exist yet)

- [ ] **Step 3: Write the utilities**

  ```js
  // src/utils/workout.js

  /**
   * Returns the current weekday name, e.g. "Monday".
   * Used to determine which program day is "today".
   */
  export function getTodayDayName() {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' })
  }

  /**
   * Given an array of set_log rows from the previous session for one exercise,
   * compute the progressive overload suggestion.
   *
   * Returns null if no suggestion is possible.
   * Returns an object: { lastWeight, suggestedWeight, allComplete, uniformWeight }
   */
  export function computeProgressiveOverload(priorSets) {
    if (!priorSets || priorSets.length === 0) return null

    const weightedSets = priorSets.filter((s) => s.weight_kg !== null && s.weight_kg !== undefined)
    if (weightedSets.length === 0) return null // all bodyweight

    const allComplete = priorSets.every((s) => s.completed)
    const weights = weightedSets.map((s) => Number(s.weight_kg))
    const maxWeight = Math.max(...weights)
    const uniformWeight = weights.every((w) => w === weights[0])

    const suggestedWeight = allComplete && uniformWeight ? weights[0] + 2.5 : null

    return { lastWeight: maxWeight, suggestedWeight, allComplete, uniformWeight }
  }

  /**
   * Returns true only when every entry in the setMap is marked complete
   * and the map is non-empty.
   * setMap keys are "exerciseName-setNumber" strings.
   */
  export function allSetsComplete(setMap) {
    const entries = Object.values(setMap)
    if (entries.length === 0) return false
    return entries.every((s) => s.completed)
  }
  ```

- [ ] **Step 4: Run tests — verify they pass**

  ```bash
  npm run test:unit -- src/tests/workout.utils.test.js
  ```

  Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

  ```bash
  git add src/utils/workout.js src/tests/workout.utils.test.js
  git commit -m "feat: add workout utility functions with tests"
  ```

---

## Task 2: Tracking Store

**Files:**
- Create: `src/stores/tracking.js`
- Create: `src/tests/tracking.store.test.js`

- [ ] **Step 1: Write failing tests**

  ```js
  // src/tests/tracking.store.test.js
  import { describe, it, expect, vi, beforeEach } from 'vitest'
  import { setActivePinia, createPinia } from 'pinia'

  vi.mock('@/lib/supabase', () => ({
    supabase: {
      from: vi.fn((table) => ({
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'session-123', started_at: new Date().toISOString() },
          error: null,
        }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        order: vi.fn().mockReturnThis(),
      })),
    },
  }))

  import { useTrackingStore } from '@/stores/tracking'

  describe('useTrackingStore', () => {
    beforeEach(() => {
      setActivePinia(createPinia())
    })

    it('starts with no active session', () => {
      const store = useTrackingStore()
      expect(store.sessionId).toBeNull()
      expect(store.isActive).toBe(false)
    })

    it('setKey builds correct key from exercise name and set number', () => {
      const store = useTrackingStore()
      expect(store.setKey('Squat', 1)).toBe('Squat-1')
    })

    it('isExerciseComplete returns false when sets are not all done', () => {
      const store = useTrackingStore()
      store.setLogs['Squat-1'] = { completed: true }
      store.setLogs['Squat-2'] = { completed: false }
      expect(store.isExerciseComplete('Squat', 2)).toBe(false)
    })

    it('isExerciseComplete returns true when all sets done', () => {
      const store = useTrackingStore()
      store.setLogs['Squat-1'] = { completed: true }
      store.setLogs['Squat-2'] = { completed: true }
      expect(store.isExerciseComplete('Squat', 2)).toBe(true)
    })
  })
  ```

- [ ] **Step 2: Run tests — verify they fail**

  ```bash
  npm run test:unit -- src/tests/tracking.store.test.js
  ```

  Expected: FAIL

- [ ] **Step 3: Write the tracking store**

  ```js
  // src/stores/tracking.js
  import { defineStore } from 'pinia'
  import { ref, computed } from 'vue'
  import { supabase } from '@/lib/supabase'
  import { allSetsComplete } from '@/utils/workout'

  export const useTrackingStore = defineStore('tracking', () => {
    const sessionId = ref(null)
    const setLogs = ref({}) // key: "exerciseName-setNumber"
    const priorSets = ref({}) // key: exerciseName → array of set_log rows from last session

    const isActive = computed(() => !!sessionId.value)

    const allDone = computed(() => isActive.value && allSetsComplete(setLogs.value))

    function setKey(exerciseName, setNumber) {
      return `${exerciseName}-${setNumber}`
    }

    function isExerciseComplete(exerciseName, totalSets) {
      return Array.from({ length: totalSets }, (_, i) =>
        setLogs.value[setKey(exerciseName, i + 1)],
      ).every((s) => s?.completed)
    }

    /**
     * Check for an existing open session for this user.
     * If found, rehydrate setLogs from Supabase and resume.
     */
    async function resumeIfOpen(userId) {
      const { data: session } = await supabase
        .from('workout_sessions')
        .select('id')
        .eq('user_id', userId)
        .is('completed_at', null)
        .maybeSingle()

      if (!session) return false

      sessionId.value = session.id

      // Rehydrate existing set logs
      const { data: logs } = await supabase
        .from('set_logs')
        .select('*')
        .eq('session_id', session.id)
        .order('set_number')

      if (logs) {
        setLogs.value = {}
        for (const log of logs) {
          setLogs.value[setKey(log.exercise_name, log.set_number)] = log
        }
      }
      return true
    }

    async function startSession({ userId, phase, week, dayName, track }) {
      const { data, error } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: userId,
          date: new Date().toISOString().slice(0, 10),
          started_at: new Date().toISOString(),
          phase,
          week,
          day_name: dayName,
          track,
        })
        .select()
        .single()

      if (error) throw error
      sessionId.value = data.id
      setLogs.value = {}
    }

    async function completeSet({ exerciseName, setNumber, repsProgrammed, repsDone, weightKg }) {
      const key = setKey(exerciseName, setNumber)

      const existing = setLogs.value[key]

      if (existing?.id) {
        // Update existing row
        const { data, error } = await supabase
          .from('set_logs')
          .update({ reps_done: repsDone, weight_kg: weightKg, completed: true })
          .eq('id', existing.id)
          .select()
          .single()
        if (error) throw error
        setLogs.value[key] = data
      } else {
        // Insert new row
        const { data, error } = await supabase
          .from('set_logs')
          .insert({
            session_id: sessionId.value,
            exercise_name: exerciseName,
            set_number: setNumber,
            reps_programmed: repsProgrammed,
            reps_done: repsDone,
            weight_kg: weightKg,
            completed: true,
          })
          .select()
          .single()
        if (error) throw error
        setLogs.value[key] = data
      }
    }

    async function uncompleteSet(exerciseName, setNumber) {
      const key = setKey(exerciseName, setNumber)
      const existing = setLogs.value[key]
      if (!existing?.id) return

      await supabase.from('set_logs').update({ completed: false }).eq('id', existing.id)
      setLogs.value[key] = { ...existing, completed: false }
    }

    async function finishSession() {
      await supabase
        .from('workout_sessions')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', sessionId.value)

      sessionId.value = null
      setLogs.value = {}
      priorSets.value = {}
    }

    async function loadPriorSets(userId, exerciseNames) {
      // Find the most recent completed session
      const { data: lastSession } = await supabase
        .from('workout_sessions')
        .select('id')
        .eq('user_id', userId)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!lastSession) return

      const { data: logs } = await supabase
        .from('set_logs')
        .select('*')
        .eq('session_id', lastSession.id)
        .in('exercise_name', exerciseNames)

      if (!logs) return

      priorSets.value = {}
      for (const log of logs) {
        if (!priorSets.value[log.exercise_name]) priorSets.value[log.exercise_name] = []
        priorSets.value[log.exercise_name].push(log)
      }
    }

    function reset() {
      sessionId.value = null
      setLogs.value = {}
      priorSets.value = {}
    }

    return {
      sessionId, setLogs, priorSets,
      isActive, allDone,
      setKey, isExerciseComplete,
      resumeIfOpen, startSession, completeSet, uncompleteSet, finishSession,
      loadPriorSets, reset,
    }
  })
  ```

- [ ] **Step 4: Run tests — verify they pass**

  ```bash
  npm run test:unit -- src/tests/tracking.store.test.js
  ```

  Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

  ```bash
  git add src/stores/tracking.js src/tests/tracking.store.test.js
  git commit -m "feat: add tracking store with session and set log management"
  ```

---

## Task 3: SetLogger Component

This component renders the per-exercise set tracker expansion. It receives exercise data as props and emits set completions upward.

**Files:**
- Create: `src/components/SetLogger.vue`

- [ ] **Step 1: Write SetLogger component**

  ```html
  <template>
    <div :style="{ padding: '12px 16px 14px', borderTop: `1px solid ${phaseColor}22`, background: 'oklch(10% 0.01 45)' }">

      <!-- Progressive overload suggestion -->
      <div v-if="suggestion" style="font-size: 11px; color: #888; font-style: italic; margin-bottom: 12px">
        <span v-if="suggestion.suggestedWeight">
          Last: {{ suggestion.lastWeight }}kg — <span :style="{ color: phaseColor }">try {{ suggestion.suggestedWeight }}kg</span>
        </span>
        <span v-else-if="suggestion.lastWeight">
          Last session: {{ suggestion.lastWeight }}kg
        </span>
      </div>

      <!-- Set rows -->
      <div
        v-for="n in totalSets"
        :key="n"
        style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px"
      >
        <!-- Set label -->
        <span style="font-size: 10px; letter-spacing: 1px; color: #555; text-transform: uppercase; min-width: 36px">
          Set {{ n }}
        </span>

        <!-- Weight input -->
        <div style="display: flex; flex-direction: column; align-items: center; gap: 2px">
          <input
            :value="getLocal(n).weightKg"
            @input="updateLocal(n, 'weightKg', $event.target.value)"
            type="number"
            min="0"
            step="0.5"
            placeholder="—"
            :style="inputStyle"
            style="width: 58px; text-align: center"
          />
          <span style="font-size: 9px; letter-spacing: 1px; color: #555; text-transform: uppercase">kg</span>
        </div>

        <!-- Reps input -->
        <div style="display: flex; flex-direction: column; align-items: center; gap: 2px">
          <input
            :value="getLocal(n).repsDone"
            @input="updateLocal(n, 'repsDone', $event.target.value)"
            type="number"
            min="0"
            step="1"
            :placeholder="repsProgrammed"
            :style="inputStyle"
            style="width: 46px; text-align: center"
          />
          <span style="font-size: 9px; letter-spacing: 1px; color: #555; text-transform: uppercase">reps</span>
        </div>

        <!-- Complete toggle -->
        <button
          @click="toggleComplete(n)"
          :aria-label="`Mark set ${n} ${isCompleted(n) ? 'incomplete' : 'complete'}`"
          :style="{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            border: `2px solid ${isCompleted(n) ? phaseColor : 'oklch(22% 0.008 45)'}`,
            background: isCompleted(n) ? phaseColor + '22' : 'transparent',
            color: isCompleted(n) ? phaseColor : '#555',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'border-color 0.15s, background 0.15s',
            flexShrink: 0,
          }"
        >{{ isCompleted(n) ? '✓' : '' }}</button>
      </div>
    </div>
  </template>

  <script setup>
  import { computed, reactive } from 'vue'
  import { computeProgressiveOverload } from '@/utils/workout'

  const props = defineProps({
    exerciseName: { type: String, required: true },
    totalSets: { type: Number, required: true },
    repsProgrammed: { type: [Number, String], required: true },
    phaseColor: { type: String, default: '#4ade80' },
    setLogs: { type: Object, required: true }, // from tracking store: { "ExerciseName-N": { completed, weightKg, repsDone } }
    priorSetsForExercise: { type: Array, default: () => [] }, // set_log rows from last session
    defaultWeight: { type: Number, default: null },
  })

  const emit = defineEmits(['complete-set', 'uncomplete-set'])

  const inputStyle = {
    padding: '6px 4px',
    background: 'oklch(13% 0.008 45)',
    border: '1px solid oklch(20% 0.008 45)',
    borderRadius: '4px',
    color: '#e8e8e8',
    fontSize: '13px',
    fontFamily: 'Georgia, serif',
    outline: 'none',
  }

  const suggestion = computed(() =>
    computeProgressiveOverload(props.priorSetsForExercise),
  )

  // Local input state — holds weight/rep edits before a set is marked complete.
  // Keyed by set number. Initializes from prior session data or defaults.
  const localInputs = reactive({})

  function setKey(n) {
    return `${props.exerciseName}-${n}`
  }

  function isCompleted(n) {
    return !!props.setLogs[setKey(n)]?.completed
  }

  function getLocal(n) {
    if (!localInputs[n]) {
      localInputs[n] = {
        weightKg: suggestion.value?.lastWeight ?? props.defaultWeight ?? null,
        repsDone: null,
      }
    }
    return localInputs[n]
  }

  function updateLocal(n, field, value) {
    getLocal(n)[field] = value === '' ? null : Number(value)
  }

  function toggleComplete(n) {
    if (isCompleted(n)) {
      emit('uncomplete-set', { setNumber: n })
    } else {
      const local = getLocal(n)
      emit('complete-set', {
        setNumber: n,
        repsDone: local.repsDone ?? Number(props.repsProgrammed),
        weightKg: local.weightKg,
      })
    }
  }
  </script>
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/components/SetLogger.vue
  git commit -m "feat: add SetLogger component for inline set tracking"
  ```

---

## Task 4: Update ProgramView — Start Workout + SetLogger Integration

This is the largest task. Read `src/views/ProgramView.vue` fully before making changes.

**Files:**
- Modify: `src/views/ProgramView.vue`

- [ ] **Step 1: Read the full ProgramView**

  Read `src/views/ProgramView.vue` completely before touching it. Understand: the `phase` computed, `phase.days` iteration, the day header structure, the exercise table structure, and the `today` computed property.

- [ ] **Step 2: Add imports and store wiring to the `<script setup>` section**

  In `ProgramView.vue`, find the `<script setup>` block and add:

  ```js
  import { useAuthStore } from '../stores/auth'
  import { useTrackingStore } from '../stores/tracking'
  import { getTodayDayName } from '../utils/workout'
  import SetLogger from '../components/SetLogger.vue'

  const auth = useAuthStore()
  const tracking = useTrackingStore()
  ```

  Replace the existing `today` computed (which likely uses `new Date().toLocaleDateString(...)`) with:

  ```js
  const today = computed(() => getTodayDayName())
  ```

  Add an `onMounted` call so "Resume Workout" appears correctly on page load when a session is already open:

  ```js
  onMounted(async () => {
    if (auth.isAuthenticated && todayDayIndex.value >= 0) {
      const resumed = await tracking.resumeIfOpen(auth.user.id)
      if (resumed) {
        const exercises = getExercises(todayDayIndex.value, phase.value.days[todayDayIndex.value])
        await tracking.loadPriorSets(auth.user.id, exercises.map((e) => e.name))
      }
    }
  })
  ```

  Note: `onMounted` is already imported in ProgramView — add to the existing import line, don't duplicate it.

- [ ] **Step 3: Add tracking action functions to script**

  ```js
  const trackingLoading = ref(false)
  const expandedTracking = ref(null) // exerciseName of expanded set logger

  // Derive the starting week number from the phase's "Weeks X–Y" display string.
  // e.g. "Weeks 1–2" → 1, "Weeks 3–4" → 3, "Weeks 5–8" → 5
  function phaseWeekStart(phaseObj) {
    const match = (phaseObj.weeks || '').match(/(\d+)/)
    return match ? parseInt(match[1]) : 1
  }

  async function handleStartWorkout() {
    if (!auth.isAuthenticated) return // prompt shown via template
    trackingLoading.value = true
    try {
      const resumed = await tracking.resumeIfOpen(auth.user.id)
      if (!resumed) {
        await tracking.startSession({
          userId: auth.user.id,
          phase: activePhase.value + 1,
          week: phaseWeekStart(phase.value),
          dayName: today.value,
          track: getTrack(todayDayIndex.value, !!phase.value.days[todayDayIndex.value]?.gym),
        })
      }
      // Load prior sets for today's exercises
      const exercises = getExercises(todayDayIndex.value, phase.value.days[todayDayIndex.value])
      await tracking.loadPriorSets(auth.user.id, exercises.map((e) => e.name))
    } finally {
      trackingLoading.value = false
    }
  }

  async function handleFinishWorkout() {
    trackingLoading.value = true
    try {
      await tracking.finishSession()
    } finally {
      trackingLoading.value = false
    }
  }

  async function handleCompleteSet(exerciseName, repsProgrammed, { setNumber, repsDone, weightKg }) {
    await tracking.completeSet({
      exerciseName,
      setNumber,
      repsProgrammed,
      repsDone,
      weightKg,
    })
  }

  async function handleUncompleteSet(exerciseName, { setNumber }) {
    await tracking.uncompleteSet(exerciseName, setNumber)
  }

  const todayDayIndex = computed(() =>
    phase.value.days.findIndex((d) => d.day === today.value),
  )
  ```

- [ ] **Step 4: Add "Start Workout" button to the day header**

  Find the day header section in the template — the area that shows the "Today" badge (`v-if="d.day === today"`). Immediately after the "Today" badge, add:

  ```html
  <!-- Tracking button — only on today's day -->
  <template v-if="d.day === today">
    <!-- Unauthenticated prompt -->
    <span
      v-if="!auth.isAuthenticated"
      style="font-size: 10px; color: #666; font-style: italic"
    >
      <RouterLink to="/login" :style="{ color: '#a78bfa', textDecoration: 'none' }">Sign in</RouterLink> to track
    </span>

    <!-- Authenticated: start / resume / finish -->
    <template v-else>
      <button
        v-if="!tracking.isActive"
        @click.stop="handleStartWorkout"
        :disabled="trackingLoading"
        :style="{
          fontSize: '9px',
          padding: '3px 8px',
          borderRadius: '20px',
          background: `${phase.color}22`,
          border: `1px solid ${phase.color}66`,
          color: phase.color,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          cursor: 'pointer',
          fontFamily: 'Georgia, serif',
          fontWeight: 700,
        }"
      >{{ trackingLoading ? '...' : 'Start Workout' }}</button>

      <button
        v-else
        @click.stop="handleFinishWorkout"
        :disabled="trackingLoading"
        :style="{
          fontSize: '9px',
          padding: '3px 8px',
          borderRadius: '20px',
          background: tracking.allDone ? `${phase.color}22` : 'oklch(13% 0.008 45)',
          border: `1px solid ${tracking.allDone ? phase.color : 'oklch(22% 0.008 45)'}66`,
          color: tracking.allDone ? phase.color : '#888',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          cursor: 'pointer',
          fontFamily: 'Georgia, serif',
          fontWeight: 700,
        }"
      >{{ tracking.allDone ? 'Finish Workout' : 'Save & Finish' }}</button>
    </template>
  </template>
  ```

- [ ] **Step 5: Add SetLogger below each exercise row**

  Find the exercise table rows in the template (inside `v-for="(ex, ei) in getExercises(...)"` or similar). After each exercise `<tr>`, add a `<tr>` for the SetLogger that appears only when tracking is active and this day is today:

  ```html
  <!-- Set logger row — appears in tracking mode for today's day -->
  <tr v-if="tracking.isActive && d.day === today">
    <td colspan="3" style="padding: 0">
      <Transition name="accordion">
        <SetLogger
          v-if="expandedTracking === ex.name || tracking.isExerciseComplete(ex.name, ex.sets)"
          :exerciseName="ex.name"
          :totalSets="ex.sets"
          :repsProgrammed="ex.reps"
          :phaseColor="phase.color"
          :setLogs="tracking.setLogs"
          :priorSetsForExercise="tracking.priorSets[ex.name] || []"
          @complete-set="handleCompleteSet(ex.name, ex.reps, $event)"
          @uncomplete-set="handleUncompleteSet(ex.name, $event)"
        />
      </Transition>
    </td>
  </tr>
  ```

  Also make the exercise name row clickable (to toggle the SetLogger) when tracking is active:

  Find the exercise name `<td>` and add `@click="tracking.isActive && d.day === today && (expandedTracking = expandedTracking === ex.name ? null : ex.name)"` to it. Wrap in a conditional cursor style.

- [ ] **Step 6: Add phase-colored checkmark on exercise row when complete**

  In the exercise name cell, add a completed indicator:

  ```html
  <span
    v-if="tracking.isActive && tracking.isExerciseComplete(ex.name, ex.sets)"
    :style="{ color: phase.color, marginLeft: '6px', fontSize: '12px' }"
  >✓</span>
  ```

- [ ] **Step 7: Verify in browser end-to-end**

  - Sign in, navigate to Program
  - Find today's day — "Start Workout" button should appear
  - Tap "Start Workout" — session is created in Supabase
  - Tap an exercise name — SetLogger expands
  - Enter weight/reps, tap the circle button — set completes, circle fills with phase color
  - Complete all sets — "Finish Workout" button activates
  - Tap "Finish Workout" — session marked complete in Supabase
  - Hard refresh — "Resume Workout" should NOT appear (session is complete)

- [ ] **Step 8: Commit**

  ```bash
  git add src/views/ProgramView.vue
  git commit -m "feat: add inline workout tracking to program view"
  ```

---

## Verification

- [ ] `npm run test:unit` — all tests pass
- [ ] Start Workout creates a `workout_sessions` row in Supabase with correct phase/week/day/track
- [ ] Completing a set creates a `set_logs` row in Supabase with correct data
- [ ] Progressive overload suggestion appears correctly on second session for same exercise
- [ ] Bodyweight exercises (no weight) show no suggestion
- [ ] Hard refresh mid-workout — "Resume Workout" appears and set log state is restored
- [ ] Saturday/Sunday — no "Start Workout" button appears (no today match)
- [ ] Unauthenticated user sees "Sign in to track" instead of Start Workout button
