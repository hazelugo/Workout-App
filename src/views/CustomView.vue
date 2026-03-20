<template>
  <!-- Header -->
  <div style="border-bottom: 1px solid #1a1a1a; padding: 32px 24px 20px; text-align: center">
    <div
      style="
        font-size: 11px;
        letter-spacing: 4px;
        color: #555;
        text-transform: uppercase;
        margin-bottom: 8px;
      "
    >
      Custom Plan
    </div>
    <h1
      style="
        font-size: clamp(26px, 5vw, 44px);
        font-weight: 400;
        margin: 0;
        color: #fff;
        letter-spacing: -1px;
      "
    >
      Build Your Day
    </h1>
    <p style="font-size: 13px; color: #555; margin-top: 8px; font-style: italic">
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
            border: selectedDay === d ? '1px solid #a78bfa' : '1px solid #222',
            borderRadius: '20px',
            color: selectedDay === d ? '#a78bfa' : '#444',
            cursor: 'pointer',
            fontSize: '11px',
            letterSpacing: '1px',
            fontFamily: 'Georgia, serif',
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

    <div
      v-for="(ex, i) in exercises"
      :key="i"
      style="
        margin-bottom: 10px;
        padding: 14px;
        background: #0d0d0d;
        border: 1px solid #1c1c1c;
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
              font-size: 9px;
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
              font-size: 9px;
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
      <div v-else style="font-size: 11px; color: #2a2a2a; font-style: italic">
        Type a name to get a demo link
      </div>
    </div>

    <!-- Add Exercise -->
    <button
      @click="addExercise"
      style="
        width: 100%;
        padding: 11px;
        background: transparent;
        border: 1px dashed #2a2a2a;
        border-radius: 8px;
        color: #444;
        cursor: pointer;
        font-size: 11px;
        letter-spacing: 2px;
        text-transform: uppercase;
        font-family: Georgia, serif;
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
        background: hasValidExercises ? '#a78bfa' : '#111',
        border: 'none',
        borderRadius: '8px',
        color: hasValidExercises ? '#fff' : '#333',
        cursor: hasValidExercises ? 'pointer' : 'default',
        fontSize: '11px',
        letterSpacing: '3px',
        textTransform: 'uppercase',
        fontFamily: 'Georgia, serif',
        marginBottom: '40px',
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
        style="margin-bottom: 8px; border: 1px solid #1c1c1c; border-radius: 8px; overflow: hidden"
      >
        <!-- Day header -->
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: #0d0d0d;
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
          <template v-if="confirmDeleteDay === day">
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
                font-family: Georgia, serif;
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
                font-family: Georgia, serif;
              "
            >No</button>
          </template>
          <button
            v-else
            @click="confirmDeleteDay = day"
            style="
              background: transparent;
              border: none;
              color: #666;
              cursor: pointer;
              font-size: 11px;
              letter-spacing: 1px;
              font-family: Georgia, serif;
            "
          >
            Delete
          </button>
        </div>

        <!-- Exercise table -->
        <div style="padding: 0 16px 14px; background: #0d0d0d">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px">
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
                style="border-top: 1px solid #1a1a1a"
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
                      font-size: 13px;
                    "
                    >{{ ex.name }} ↗</a
                  >
                </td>
                <td
                  style="
                    text-align: center;
                    color: #a78bfa;
                    font-weight: 700;
                    padding: 10px 4px;
                  "
                >
                  {{ ex.sets || '—' }}
                </td>
                <td
                  style="
                    text-align: center;
                    color: #aaa;
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
        text-align: center;
        padding: 40px 16px;
        color: #888;
        font-size: 13px;
        font-style: italic;
      "
    >
      No custom days saved yet. Build one above.
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const yt = (q) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(q + ' exercise demonstration')}`

const inputStyle = {
  width: '100%',
  background: '#111',
  border: '1px solid #222',
  borderRadius: '4px',
  padding: '8px 10px',
  color: '#e8e8e8',
  fontSize: '13px',
  fontFamily: 'Georgia, serif',
  boxSizing: 'border-box',
}

const confirmDeleteDay = ref(null)

const selectedDay = ref('Monday')
const exercises = ref([{ name: '', sets: '', reps: '' }])
const savedWorkouts = ref(JSON.parse(localStorage.getItem('customWorkouts') || '{}'))

const hasValidExercises = computed(() => exercises.value.some((e) => e.name.trim()))

function addExercise() {
  exercises.value.push({ name: '', sets: '', reps: '' })
}

function removeExercise(i) {
  if (exercises.value.length === 1) {
    exercises.value[0] = { name: '', sets: '', reps: '' }
  } else {
    exercises.value.splice(i, 1)
  }
}

function saveWorkout() {
  const toSave = exercises.value.filter((e) => e.name.trim())
  if (!toSave.length) return

  savedWorkouts.value = {
    ...savedWorkouts.value,
    [selectedDay.value]: toSave,
  }
  localStorage.setItem('customWorkouts', JSON.stringify(savedWorkouts.value))
  exercises.value = [{ name: '', sets: '', reps: '' }]
}

function deleteDay(day) {
  const updated = { ...savedWorkouts.value }
  delete updated[day]
  savedWorkouts.value = updated
  localStorage.setItem('customWorkouts', JSON.stringify(updated))
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
</style>
