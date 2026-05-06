<template>
  <!-- Header -->
  <div style="border-bottom: 1px solid oklch(15% 0.008 45); padding: 32px 24px 20px; text-align: center">
    <div
      style="
        font-size: 11px;
        letter-spacing: 4px;
        color: #888;
        text-transform: uppercase;
        margin-bottom: 8px;
      "
    >
      Custom Plan
    </div>
    <h1
      style="
        font-size: clamp(1.625rem, 5vw, 2.75rem);
        font-weight: 400;
        margin: 0;
        color: oklch(96% 0.005 45);
        letter-spacing: -1px;
      "
    >
      Build Your Day
    </h1>
    <p style="font-size: 0.875rem; color: #888; margin-top: 8px; font-style: italic">
      Override any day with your own exercises · demo links auto-generated
    </p>
  </div>

  <!-- Builder -->
  <div style="max-width: 640px; margin: 24px auto 0; padding: 0 16px">
    <!-- Day Selector -->
    <div style="margin-bottom: 24px">
      <div
        style="
          font-size: 10px;
          letter-spacing: 3px;
          color: #666;
          text-transform: uppercase;
          margin-bottom: 10px;
        "
      >
        Day of Week
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 8px">
        <button
          v-for="d in days"
          :key="d"
          @click="selectedDay = d"
          :style="{
            padding: '7px 14px',
            background: selectedDay === d ? '#a78bfa22' : 'transparent',
            border: selectedDay === d ? '1px solid #a78bfa' : '1px solid oklch(20% 0.008 45)',
            borderRadius: '20px',
            color: selectedDay === d ? '#a78bfa' : '#777',
            cursor: 'pointer',
            fontSize: '11px',
            letterSpacing: '1px',
            transition: 'color 150ms ease-out, border-color 150ms ease-out, background 150ms ease-out',
          }"
        >
          {{ d }}
        </button>
      </div>
    </div>

    <!-- Exercise Builder -->
    <div
      style="
        font-size: 10px;
        letter-spacing: 3px;
        color: #666;
        text-transform: uppercase;
        margin-bottom: 10px;
      "
    >
      Exercises
    </div>

    <TransitionGroup name="exercise" tag="div" style="position: relative">
    <div
      v-for="(ex, i) in exercises"
      :key="ex._id"
      style="
        margin-bottom: 10px;
        padding: 14px;
        background: oklch(10% 0.01 45);
        border: 1px solid oklch(17% 0.008 45);
        border-radius: 8px;
      "
    >
      <!-- Name row -->
      <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 10px">
        <span style="font-size: 11px; color: #666; min-width: 18px; text-align: right">{{
          i + 1
        }}</span>
        <input
          v-model="ex.name"
          :aria-label="`Exercise ${i + 1} name`"
          placeholder="Exercise name"
          class="workout-input"
          :style="inputStyle"
        />
        <button
          @click="removeExercise(i)"
          :aria-label="`Remove exercise ${i + 1}`"
          style="
            background: transparent;
            border: none;
            color: #777;
            cursor: pointer;
            font-size: 20px;
            line-height: 1;
            padding: 4px 8px;
            flex-shrink: 0;
            min-width: 44px;
            min-height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
          "
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <!-- Sets / Reps row -->
      <div style="display: flex; gap: 8px; margin-bottom: 10px">
        <div style="flex: 1">
          <label
            :for="`ex-${i}-sets`"
            style="
              display: block;
              font-size: 0.625rem;
              letter-spacing: 2px;
              color: #666;
              text-transform: uppercase;
              margin-bottom: 4px;
              text-align: center;
            "
          >
            Sets
          </label>
          <input
            :id="`ex-${i}-sets`"
            v-model="ex.sets"
            placeholder="3"
            class="workout-input"
            :style="{ ...inputStyle, textAlign: 'center' }"
          />
        </div>
        <div style="flex: 1">
          <label
            :for="`ex-${i}-reps`"
            style="
              display: block;
              font-size: 0.625rem;
              letter-spacing: 2px;
              color: #666;
              text-transform: uppercase;
              margin-bottom: 4px;
              text-align: center;
            "
          >
            Reps
          </label>
          <input
            :id="`ex-${i}-reps`"
            v-model="ex.reps"
            placeholder="10"
            class="workout-input"
            :style="{ ...inputStyle, textAlign: 'center' }"
          />
        </div>
      </div>

      <!-- Auto YouTube link -->
      <div v-if="ex.name.trim()" style="display: flex; align-items: center; gap: 6px">
        <span aria-hidden="true" style="font-size: 10px; color: #666">▶</span>
        <a
          :href="yt(ex.name)"
          target="_blank"
          rel="noopener noreferrer"
          style="
            font-size: 11px;
            color: #a78bfa;
            text-decoration: none;
            border-bottom: 1px dashed #a78bfa55;
            padding-bottom: 1px;
          "
          >Watch demo ↗</a
        >
      </div>
      <div v-else style="font-size: 11px; color: #555; font-style: italic">
        Type a name to get a demo link
      </div>
    </div>
    </TransitionGroup>

    <!-- Add Exercise -->
    <button
      @click="addExercise"
      style="
        width: 100%;
        padding: 11px;
        background: transparent;
        border: 1px dashed oklch(22% 0.008 45);
        border-radius: 8px;
        color: #666;
        cursor: pointer;
        font-size: 11px;
        letter-spacing: 2px;
        text-transform: uppercase;
        margin-bottom: 12px;
      "
    >
      + Add Exercise
    </button>

    <!-- Save -->
    <button
      @click="saveWorkout"
      :disabled="!hasValidExercises"
      :style="{
        width: '100%',
        padding: '13px',
        background: hasValidExercises ? '#a78bfa' : 'oklch(11.5% 0.008 45)',
        border: 'none',
        borderRadius: '8px',
        color: hasValidExercises ? '#fff' : '#444',
        cursor: hasValidExercises ? 'pointer' : 'default',
        fontSize: '11px',
        letterSpacing: '3px',
        textTransform: 'uppercase',
        marginBottom: '40px',
        transition: 'background 200ms ease-out, color 200ms ease-out',
      }"
    >
      Save for {{ selectedDay }}
    </button>
  </div>

  <!-- Saved Workouts -->
  <div style="max-width: 640px; margin: 0 auto; padding: 0 16px">
    <div v-if="Object.keys(savedWorkouts).length > 0">
      <div
        style="
          font-size: 10px;
          letter-spacing: 3px;
          color: #666;
          text-transform: uppercase;
          margin-bottom: 10px;
        "
      >
        Saved Custom Days
      </div>

      <div
        v-for="(exList, day) in savedWorkouts"
        :key="day"
        style="margin-bottom: 8px; border: 1px solid oklch(17% 0.008 45); border-radius: 8px; overflow: hidden"
      >
        <!-- Day header -->
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: oklch(10% 0.01 45);
          "
        >
          <div style="display: flex; gap: 10px; align-items: center">
            <span
              style="
                font-size: 11px;
                color: #555;
                letter-spacing: 2px;
                text-transform: uppercase;
                min-width: 72px;
              "
              >{{ day }}</span
            >
            <span
              style="
                font-size: 11px;
                padding: 2px 8px;
                border-radius: 20px;
                background: #a78bfa18;
                color: #a78bfa;
                letter-spacing: 1px;
                text-transform: uppercase;
              "
              >Custom</span
            >
          </div>
          <Transition name="confirm" mode="out-in">
            <div
              v-if="confirmDeleteDay === day"
              key="confirm"
              style="display: flex; align-items: center"
            >
              <span style="font-size: 11px; color: #888; font-family: Georgia, serif; margin-right: 8px">Remove?</span>
              <button
                @click="deleteDay(day)"
                style="
                  background: transparent;
                  border: none;
                  color: #f87171;
                  cursor: pointer;
                  font-size: 11px;
                  letter-spacing: 1px;
                  margin-right: 8px;
                "
              >Yes</button>
              <button
                @click="confirmDeleteDay = null"
                style="
                  background: transparent;
                  border: none;
                  color: #777;
                  cursor: pointer;
                  font-size: 11px;
                  letter-spacing: 1px;
                "
              >No</button>
            </div>
            <button
              v-else
              key="delete"
              @click="confirmDeleteDay = day"
              style="
                background: transparent;
                border: none;
                color: #666;
                cursor: pointer;
                font-size: 11px;
                letter-spacing: 1px;
              "
            >
              Delete
            </button>
          </Transition>
        </div>

        <!-- Exercise table -->
        <div style="padding: 0 16px 14px; background: oklch(10% 0.01 45)">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem; line-height: 1.4">
            <thead>
              <tr style="color: #777">
                <th
                  scope="col"
                  style="
                    padding: 8px 0 4px;
                    font-size: 10px;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    font-weight: 400;
                    text-align: left;
                  "
                >
                  Exercise
                </th>
                <th
                  scope="col"
                  style="
                    padding: 8px 0 4px;
                    font-size: 10px;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    text-align: center;
                    font-weight: 400;
                  "
                >
                  Sets
                </th>
                <th
                  scope="col"
                  style="
                    padding: 8px 0 4px;
                    font-size: 10px;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    text-align: center;
                    font-weight: 400;
                  "
                >
                  Reps
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(ex, j) in exList"
                :key="j"
                style="border-top: 1px solid oklch(15% 0.008 45)"
              >
                <td style="padding: 10px 8px 10px 0">
                  <a
                    :href="yt(ex.name)"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="
                      color: #a78bfa;
                      text-decoration: none;
                      border-bottom: 1px dashed #a78bfa55;
                      padding-bottom: 1px;
                      font-size: 0.875rem;
                    "
                    >{{ ex.name }} ↗</a
                  >
                </td>
                <td
                  style="
                    text-align: center;
                    color: #a78bfa;
                    font-weight: 700;
                    font-variant-numeric: tabular-nums;
                    padding: 10px 4px;
                  "
                >
                  {{ ex.sets || '—' }}
                </td>
                <td
                  style="
                    text-align: center;
                    color: #aaa;
                    font-variant-numeric: tabular-nums;
                    padding: 10px 0 10px 4px;
                    white-space: nowrap;
                  "
                >
                  {{ ex.reps || '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div
      v-else
      style="
        padding: 28px 20px;
        border: 1px dashed oklch(20% 0.008 45);
        border-radius: 8px;
        text-align: center;
      "
    >
      <div style="font-size: 22px; margin-bottom: 10px; opacity: 0.4">✎</div>
      <div style="font-size: 0.875rem; color: #777; margin-bottom: 6px">
        No custom days saved yet.
      </div>
      <div style="font-size: 12px; color: #555; line-height: 1.7; max-width: 320px; margin: 0 auto">
        Use this when you're traveling, at a different gym, or want to swap in your own exercises for a day. Your custom day replaces the program day for as long as you keep it.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const yt = (q) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(q + ' exercise demonstration')}`

const inputStyle = {
  width: '100%',
  background: 'oklch(11.5% 0.008 45)',
  border: '1px solid oklch(20% 0.008 45)',
  borderRadius: '4px',
  padding: '8px 10px',
  color: '#e8e8e8',
  fontSize: '0.875rem',
  boxSizing: 'border-box',
  transition: 'border-color 150ms ease-out',
}

const confirmDeleteDay = ref(null)

const selectedDay = ref('Monday')

let _exId = 0
const newEx = () => ({ _id: _exId++, name: '', sets: '', reps: '' })
const exercises = ref([newEx()])
const savedWorkouts = ref({})

onMounted(async () => {
  const { data } = await supabase.from('custom_days').select('day_name, exercises')
  if (data) {
    savedWorkouts.value = Object.fromEntries(data.map((r) => [r.day_name, r.exercises]))
  }
})

const hasValidExercises = computed(() => exercises.value.some((e) => e.name.trim()))

function addExercise() {
  exercises.value.push(newEx())
}

function removeExercise(i) {
  if (exercises.value.length === 1) {
    const id = exercises.value[0]._id
    exercises.value[0] = { _id: id, name: '', sets: '', reps: '' }
  } else {
    exercises.value.splice(i, 1)
  }
}

async function saveWorkout() {
  const toSave = exercises.value.filter((e) => e.name.trim())
  if (!toSave.length) return

  const clean = toSave.map(({ name, sets, reps }) => ({ name, sets, reps }))
  await supabase
    .from('custom_days')
    .upsert(
      { user_id: auth.user.id, day_name: selectedDay.value, exercises: clean },
      { onConflict: 'user_id,day_name' },
    )

  savedWorkouts.value = { ...savedWorkouts.value, [selectedDay.value]: clean }
  exercises.value = [newEx()]
}

async function deleteDay(day) {
  await supabase.from('custom_days').delete().eq('day_name', day)

  const updated = { ...savedWorkouts.value }
  delete updated[day]
  savedWorkouts.value = updated
  confirmDeleteDay.value = null
}
</script>

<style scoped>
.workout-input:focus-visible {
  outline: 2px solid #a78bfa;
  outline-offset: 0;
  border-color: #a78bfa44;
}

button:focus-visible {
  outline: 2px solid #a78bfa;
  outline-offset: 2px;
  border-radius: 2px;
}

a:focus-visible {
  outline: 2px solid #a78bfa;
  outline-offset: 2px;
  border-radius: 2px;
}

a {
  transition: opacity 100ms ease-out;
}
a:hover {
  opacity: 0.75;
}

/* Exercise add/remove */
.exercise-enter-active {
  transition: opacity 200ms ease-out, transform 200ms cubic-bezier(0.25, 1, 0.5, 1);
}
.exercise-leave-active {
  transition: opacity 140ms ease-in;
}
.exercise-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.exercise-leave-to {
  opacity: 0;
}

/* Delete confirmation swap */
.confirm-enter-active {
  transition: opacity 150ms ease-out;
}
.confirm-leave-active {
  transition: opacity 80ms ease-in;
}
.confirm-enter-from,
.confirm-leave-to {
  opacity: 0;
}
</style>
