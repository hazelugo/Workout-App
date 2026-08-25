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
            borderLeft: `3px solid ${sessionAccentColor(session)}`,
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
              <!-- Custom session badge -->
              <span v-if="session.phase == null"
                style="font-size: 10px; padding: 2px 8px; border-radius: 20px; background: #a78bfa18; color: #a78bfa; letter-spacing: 1px; text-transform: uppercase"
              >Custom</span>
              <!-- Program session badge -->
              <span v-else
                :style="{
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '20px',
                  background: `${phaseMeta(session.phase).color}18`,
                  color: phaseMeta(session.phase).color,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }"
              >{{ phaseMeta(session.phase).name }}</span>
              <span v-if="session.track && session.track !== 'custom'" style="font-size: 10px; color: #666">
                {{ session.track === 'gym' ? '🏋️ Gym' : '🏠 Home' }}
              </span>
            </div>
            <div style="font-size: 12px; color: #666">
              {{ formatSessionDate(session.completed_at) }}
              <template v-if="session.week"> · Week {{ session.week }}</template>
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

            <!-- Exercise groups -->
            <div
              v-for="(group, name) in groupSets(session.set_logs)"
              :key="name"
              style="padding: 8px 0; border-top: 1px solid oklch(15% 0.008 45)"
            >
              <!-- Group header -->
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px">
                <div style="font-size: 0.875rem; color: #e8e8e8">{{ name }}</div>
                <button
                  v-if="!isEditing(session.id, name)"
                  @click="startEdit(session.id, name, group)"
                  class="edit-btn"
                  aria-label="Edit sets"
                >
                  Edit
                </button>
                <div v-else style="display: flex; gap: 8px">
                  <button
                    @click="saveEdit(session.id, name, group)"
                    :disabled="saving"
                    class="save-btn"
                  >
                    {{ saving ? 'Saving…' : 'Save' }}
                  </button>
                  <button @click="cancelEdit(session.id, name)" class="cancel-btn">Cancel</button>
                </div>
              </div>

              <!-- Save error -->
              <div
                v-if="saveError && isEditing(session.id, name)"
                style="font-size: 11px; color: #f87171; margin-bottom: 6px"
              >
                {{ saveError }}
              </div>

              <!-- Set rows — column headers when editing -->
              <div
                v-if="isEditing(session.id, name)"
                style="display: grid; grid-template-columns: 44px 1fr 1fr 1fr; gap: 6px; margin-bottom: 4px"
              >
                <span style="font-size: 10px; color: #555"></span>
                <span style="font-size: 10px; color: #555; text-align: center">Target</span>
                <span style="font-size: 10px; color: #555; text-align: center">Done</span>
                <span style="font-size: 10px; color: #555; text-align: center">Weight (lbs)</span>
              </div>

              <div
                v-for="set in group"
                :key="set.set_number"
                style="margin-bottom: 4px"
              >
                <!-- View mode -->
                <div v-if="!isEditing(session.id, name)" style="font-size: 12px; color: #777; line-height: 1.8">
                  <span style="color: #555">Set {{ set.set_number }}:</span>
                  <span style="margin-left: 6px">
                    {{ set.reps_programmed }} reps
                    <template v-if="set.reps_done != null">
                      <span style="color: #444"> → </span>
                      <span style="color: #aaa">{{ set.reps_done }} done</span>
                    </template>
                    <template v-if="set.weight_kg != null">
                      <span style="color: #444"> · </span>
                      <span style="color: #aaa">{{ set.weight_kg }} lbs</span>
                    </template>
                  </span>
                </div>

                <!-- Edit mode -->
                <div
                  v-else
                  style="display: grid; grid-template-columns: 44px 1fr 1fr 1fr; gap: 6px; align-items: center"
                >
                  <span style="font-size: 11px; color: #666">Set {{ set.set_number }}</span>
                  <span style="font-size: 12px; color: #555; text-align: center; font-variant-numeric: tabular-nums">
                    {{ set.reps_programmed }}
                  </span>
                  <input
                    v-model.number="editInputs[set.id].repsDone"
                    type="number"
                    min="0"
                    :placeholder="String(set.reps_programmed)"
                    class="history-input"
                    aria-label="Reps done"
                  />
                  <input
                    v-model.number="editInputs[set.id].weightLbs"
                    type="number"
                    min="0"
                    step="2.5"
                    placeholder="lbs"
                    class="history-input"
                    aria-label="Weight in lbs"
                  />
                </div>
              </div>
            </div>

            <!-- Delete session -->
            <div style="padding-top: 14px; border-top: 1px solid oklch(13% 0.008 45); margin-top: 6px">
              <div v-if="confirmDeleteId !== session.id" style="text-align: right">
                <button
                  @click="confirmDeleteId = session.id"
                  class="delete-btn"
                >
                  Delete session
                </button>
              </div>
              <div v-else style="display: flex; align-items: center; justify-content: space-between; gap: 10px">
                <span style="font-size: 12px; color: #777">Remove this session permanently?</span>
                <div style="display: flex; gap: 8px; flex-shrink: 0">
                  <button
                    @click="deleteSession(session.id)"
                    :disabled="deleting"
                    class="delete-confirm-btn"
                  >
                    {{ deleting ? 'Deleting…' : 'Yes, delete' }}
                  </button>
                  <button @click="confirmDeleteId = null" class="cancel-btn">Cancel</button>
                </div>
              </div>
              <div v-if="deleteError" style="font-size: 11px; color: #f87171; margin-top: 6px; text-align: right">
                {{ deleteError }}
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
import { supabase } from '@/lib/supabase'

const { data, isPending, isError, error: queryError, refetch } = useWorkoutHistoryQuery()

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

function sessionAccentColor(session) {
  if (session.phase == null) return '#a78bfa'
  return phaseMeta(session.phase).color
}

function toggleSession(id) {
  expandedId.value = expandedId.value === id ? null : id
  // clear any active edit when collapsing
  if (expandedId.value !== id) {
    editingGroup.value = null
    editInputs.value = {}
    saveError.value = null
  }
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

// ── Inline edit ──────────────────────────────────────────────
const editingGroup = ref(null)   // "sessionId|exerciseName"
const editInputs   = ref({})     // { [setId]: { repsDone, weightLbs } }
const saving       = ref(false)
const saveError    = ref(null)

function editKey(sessionId, exerciseName) {
  return `${sessionId}|${exerciseName}`
}

function isEditing(sessionId, exerciseName) {
  return editingGroup.value === editKey(sessionId, exerciseName)
}

function startEdit(sessionId, exerciseName, group) {
  editingGroup.value = editKey(sessionId, exerciseName)
  saveError.value = null
  const inputs = {}
  for (const set of group) {
    inputs[set.id] = {
      repsDone: set.reps_done ?? null,
      weightLbs: set.weight_kg ?? null,
    }
  }
  editInputs.value = inputs
}

function cancelEdit(sessionId, exerciseName) {
  if (editingGroup.value === editKey(sessionId, exerciseName)) {
    editingGroup.value = null
    editInputs.value = {}
    saveError.value = null
  }
}

async function saveEdit(sessionId, exerciseName, group) {
  saving.value = true
  saveError.value = null

  try {
    for (const set of group) {
      const { repsDone, weightLbs } = editInputs.value[set.id] ?? {}
      const { error } = await supabase
        .from('set_logs')
        .update({
          reps_done: repsDone ?? null,
          weight_kg: weightLbs ?? null,
        })
        .eq('id', set.id)

      if (error) throw error
    }

    // Optimistically patch local cache so the view updates without a full refetch
    await refetch()
    editingGroup.value = null
    editInputs.value = {}
  } catch (err) {
    saveError.value = err?.message ?? 'Failed to save. Please try again.'
  } finally {
    saving.value = false
  }
}

// ── Delete session ───────────────────────────────────────────
const confirmDeleteId = ref(null)
const deleting = ref(false)
const deleteError = ref(null)

async function deleteSession(sessionId) {
  deleting.value = true
  deleteError.value = null
  try {
    const { error } = await supabase
      .from('workout_sessions')
      .delete()
      .eq('id', sessionId)
    if (error) throw error
    confirmDeleteId.value = null
    expandedId.value = null
    await refetch()
  } catch (err) {
    deleteError.value = err?.message ?? 'Failed to delete. Please try again.'
  } finally {
    deleting.value = false
  }
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

/* ── Inline edit controls ──────────────────────────────────── */
.edit-btn {
  background: transparent;
  border: none;
  color: #555;
  cursor: pointer;
  font-size: 11px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 4px;
  transition: color 120ms;
}
.edit-btn:hover {
  color: #999;
}

.save-btn {
  background: transparent;
  border: 1px solid oklch(28% 0.008 45);
  color: #aaa;
  cursor: pointer;
  font-size: 11px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 3px 10px;
  border-radius: 4px;
  transition: color 120ms, border-color 120ms;
}
.save-btn:hover:not(:disabled) {
  color: #e8e8e8;
  border-color: oklch(40% 0.008 45);
}
.save-btn:disabled {
  opacity: 0.5;
  cursor: wait;
}

.cancel-btn {
  background: transparent;
  border: none;
  color: #555;
  cursor: pointer;
  font-size: 11px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 3px 6px;
  border-radius: 4px;
  transition: color 120ms;
}
.cancel-btn:hover {
  color: #888;
}

.history-input {
  width: 100%;
  padding: 5px 8px;
  background: oklch(8% 0.012 45);
  border: 1px solid oklch(22% 0.008 45);
  border-radius: 5px;
  color: #e8e8e8;
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  text-align: center;
  -moz-appearance: textfield;
}
.history-input::-webkit-outer-spin-button,
.history-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.history-input:focus {
  outline: none;
  border-color: oklch(40% 0.008 45);
}
.history-input::placeholder {
  color: #3a3a3a;
}

.delete-btn {
  background: transparent;
  border: none;
  color: #4a3030;
  cursor: pointer;
  font-size: 11px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 4px;
  transition: color 120ms;
}
.delete-btn:hover {
  color: #f87171;
}

.delete-confirm-btn {
  background: transparent;
  border: 1px solid #7f3535;
  color: #f87171;
  cursor: pointer;
  font-size: 11px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 3px 10px;
  border-radius: 4px;
  transition: background 120ms, border-color 120ms;
}
.delete-confirm-btn:hover:not(:disabled) {
  background: #7f353522;
}
.delete-confirm-btn:disabled {
  opacity: 0.5;
  cursor: wait;
}
</style>
