<template>
  <div
    style="
      border-bottom: 1px solid oklch(15% 0.008 45);
      padding: 32px 24px 20px;
      text-align: center;
    "
  >
    <div
      style="
        font-size: 11px;
        letter-spacing: 4px;
        color: #888;
        text-transform: uppercase;
        margin-bottom: 8px;
      "
    >
      Your Log
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
      Workout History
    </h1>
    <p style="font-size: 0.875rem; color: #888; margin-top: 8px; font-style: italic">
      Completed sessions · tap to expand
    </p>
  </div>

  <div style="max-width: 640px; margin: 24px auto 0; padding: 0 16px">
    <div v-if="loading" style="padding: 48px 0; text-align: center; color: #666; font-size: 0.875rem">
      Loading history…
    </div>

    <div
      v-else-if="error"
      style="
        padding: 16px;
        border: 1px solid #f8717144;
        border-radius: 8px;
        color: #f87171;
        font-size: 0.875rem;
        line-height: 1.5;
      "
    >
      {{ error }}
    </div>

    <div
      v-else-if="!sessions.length"
      style="
        padding: 36px 20px;
        border: 1px dashed oklch(20% 0.008 45);
        border-radius: 8px;
        text-align: center;
      "
    >
      <div style="font-size: 28px; margin-bottom: 12px; opacity: 0.5">📋</div>
      <div style="font-size: 0.9375rem; color: #888; margin-bottom: 8px">No workouts logged yet</div>
      <div style="font-size: 12px; color: #555; line-height: 1.7; max-width: 300px; margin: 0 auto 20px">
        Open a day on the Program page and tap <strong style="color: #aaa; font-weight: 400">Log workout</strong>
        when you're done.
      </div>
      <RouterLink
        to="/"
        style="
          display: inline-block;
          padding: 10px 18px;
          border: 1px solid oklch(22% 0.008 45);
          border-radius: 6px;
          color: #4ade80;
          text-decoration: none;
          font-size: 12px;
          letter-spacing: 1px;
          text-transform: uppercase;
        "
      >
        Go to Program →
      </RouterLink>
    </div>

    <template v-else>
      <div
        style="
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          padding: 12px 14px;
          background: oklch(10% 0.01 45);
          border: 1px solid oklch(17% 0.008 45);
          border-radius: 8px;
        "
      >
        <div style="flex: 1; text-align: center">
          <div style="font-size: 1.25rem; color: #e8e8e8; font-variant-numeric: tabular-nums">
            {{ sessions.length }}
          </div>
          <div
            style="
              font-size: 10px;
              letter-spacing: 2px;
              text-transform: uppercase;
              color: #666;
              margin-top: 2px;
            "
          >
            Sessions
          </div>
        </div>
        <div style="width: 1px; background: oklch(17% 0.008 45)" />
        <div style="flex: 1; text-align: center">
          <div style="font-size: 1.25rem; color: #e8e8e8; font-variant-numeric: tabular-nums">
            {{ totalSets }}
          </div>
          <div
            style="
              font-size: 10px;
              letter-spacing: 2px;
              text-transform: uppercase;
              color: #666;
              margin-top: 2px;
            "
          >
            Sets logged
          </div>
        </div>
      </div>

      <div
        v-for="session in sessions"
        :key="session.id"
        style="
          margin-bottom: 10px;
          border: 1px solid oklch(17% 0.008 45);
          border-radius: 8px;
          overflow: hidden;
        "
      >
        <button
          @click="toggleSession(session.id)"
          :aria-expanded="expandedId === session.id"
          :style="{
            width: '100%',
            padding: '14px 16px',
            background: expandedId === session.id ? 'oklch(11.5% 0.008 45)' : 'oklch(10% 0.01 45)',
            border: 'none',
            borderLeft: `3px solid ${phaseMeta(session.phase).color}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '12px',
            cursor: 'pointer',
            textAlign: 'left',
            color: '#e8e8e8',
            transition: 'background 180ms ease-out',
          }"
        >
          <div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 4px">
              <span style="font-size: 0.9375rem">{{ session.day_name }}</span>
              <span
                :style="{
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '20px',
                  background: `${phaseMeta(session.phase).color}18`,
                  color: phaseMeta(session.phase).color,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }"
              >
                {{ phaseMeta(session.phase).name }}
              </span>
              <span style="font-size: 10px; color: #666">
                {{ session.track === 'gym' ? '🏋️ Gym' : '🏠 Home' }}
              </span>
            </div>
            <div style="font-size: 12px; color: #666">
              {{ formatSessionDate(session.completed_at) }}
              · Week {{ session.week }}
              · {{ session.set_logs?.length ?? 0 }} sets
            </div>
          </div>
          <span aria-hidden="true" style="color: #666; font-size: 18px; line-height: 1; flex-shrink: 0">
            {{ expandedId === session.id ? '−' : '+' }}
          </span>
        </button>

        <Transition name="accordion">
          <div
            v-if="expandedId === session.id"
            style="padding: 0 16px 14px; background: oklch(10% 0.01 45); border-top: 1px solid oklch(15% 0.008 45)"
          >
            <div
              style="
                font-size: 10px;
                letter-spacing: 2px;
                text-transform: uppercase;
                color: #555;
                padding: 10px 0 8px;
              "
            >
              {{ formatSessionTime(session.completed_at) }}
            </div>
            <div
              v-for="(group, name) in groupSets(session.set_logs)"
              :key="name"
              style="padding: 8px 0; border-top: 1px solid oklch(15% 0.008 45)"
            >
              <div style="font-size: 0.875rem; color: #e8e8e8; margin-bottom: 4px">{{ name }}</div>
              <div style="font-size: 12px; color: #777">
                <span v-for="(set, idx) in group" :key="idx">
                  <span v-if="idx > 0"> · </span>Set {{ set.set_number }}: {{ set.reps_programmed }} reps
                </span>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useWorkoutHistoryQuery } from '@/queries/history'
import { PHASES, formatSessionDate, formatSessionTime } from '@/lib/workout'

const { data, isPending, isError, error: queryError } = useWorkoutHistoryQuery()

const loading = computed(() => isPending.value)
const error = computed(() => (isError.value ? queryError.value?.message ?? 'Failed to load history' : ''))
const sessions = computed(() => data.value ?? [])
const expandedId = ref(null)

const totalSets = computed(() =>
  sessions.value.reduce((sum, s) => sum + (s.set_logs?.length ?? 0), 0),
)

function phaseMeta(phase) {
  return PHASES[phase] ?? { name: `Phase ${phase}`, color: '#888' }
}

function toggleSession(id) {
  expandedId.value = expandedId.value === id ? null : id
}

function groupSets(setLogs) {
  if (!setLogs?.length) return {}
  const groups = {}
  for (const set of setLogs) {
    if (!groups[set.exercise_name]) groups[set.exercise_name] = []
    groups[set.exercise_name].push(set)
  }
  for (const name of Object.keys(groups)) {
    groups[name].sort((a, b) => a.set_number - b.set_number)
  }
  return groups
}

</script>

<style scoped>
button:focus-visible,
a:focus-visible {
  outline: 2px solid #e8e8e8;
  outline-offset: 2px;
  border-radius: 2px;
}

a {
  transition: opacity 100ms ease-out;
}
a:hover {
  opacity: 0.75;
}

.accordion-enter-active {
  transition: opacity 220ms ease-out, transform 220ms cubic-bezier(0.25, 1, 0.5, 1);
}
.accordion-leave-active {
  transition: opacity 130ms ease-in;
}
.accordion-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
.accordion-leave-to {
  opacity: 0;
}
</style>
