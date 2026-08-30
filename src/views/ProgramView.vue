<template>
  <!-- ── Program Hero & Context ────────────────────────────────── -->
  <header class="program-header">
    <div class="program-header-inner">
      <h1 class="program-title">{{ activeProgramTitle }}</h1>
      <p class="program-subtitle">
        {{
          hasActiveCustomProgram
            ? activeCustomSubtitle
            : 'Home & Gym Tracks · 5 days/week · 20–30 min'
        }}
      </p>
      <div class="program-badges">
        <span v-if="hasActiveCustomProgram" class="badge highlight active-custom-badge"
          >Active Custom Plan</span
        >
        <span v-else class="badge">Home Track</span>
        <span v-if="!hasActiveCustomProgram" class="badge">Gym Track</span>
        <span class="badge highlight">Tap exercise for demo</span>
        <button
          class="badge highlight export-badge-btn"
          @click="showExportModal = true"
          aria-label="Export workout program"
        >
          Export Plan
        </button>
        <RouterLink v-if="hasActiveCustomProgram" to="/custom" class="badge edit-studio-badge">
          Edit in Studio →
        </RouterLink>
        <button
          v-if="hasActiveCustomProgram"
          type="button"
          class="badge built-in-restore-badge"
          :disabled="restoringBuiltIn"
          @click="restoreBuiltInProgram"
        >
          {{ restoringBuiltIn ? 'Switching…' : 'Restore Build From Zero' }}
        </button>
      </div>
    </div>
  </header>

  <!-- ── Phase Tabs Navigation (Tablist) ───────────────────────── -->
  <nav
    v-if="!hasActiveCustomProgram"
    class="phase-tabs-wrapper"
    role="tablist"
    aria-label="Workout program phases"
  >
    <div class="phase-tabs-container">
      <button
        v-for="(p, i) in program.phases"
        :key="p.id"
        :id="`phase-tab-${p.id}`"
        role="tab"
        :aria-selected="activePhase === i"
        :aria-controls="`phase-panel-${p.id}`"
        class="phase-tab-btn"
        :class="{ active: activePhase === i }"
        :style="{
          '--phase-color': p.color,
        }"
        @click="selectPhase(i)"
      >
        <span class="phase-tab-name">{{ p.name }}</span>
        <span class="phase-tab-weeks">{{ p.weeks }}</span>
      </button>
    </div>
  </nav>

  <!-- ── First-Run Tip Banner ──────────────────────────────────── -->
  <Transition name="reveal">
    <aside v-if="!firstRunSeen" class="first-run-banner" aria-label="Getting started tip">
      <div class="first-run-content">
        <span class="first-run-text">
          <strong class="first-run-highlight">Start at Week 1.</strong>
          Open any day to see your programmed exercises. Tap any exercise name to watch a video
          demonstration.
        </span>
        <button class="first-run-dismiss" aria-label="Dismiss tip" @click="dismissFirstRun">
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </aside>
  </Transition>

  <!-- ── Main Phase & Workout Content ──────────────────────────── -->
  <main class="program-main">
    <!-- LOADING STATE: auth + queries resolving, show skeleton instead of wrong mode -->
    <div v-if="isLoadingProgram" class="phase-container" style="padding: 24px 0">
      <div v-for="n in 7" :key="n" class="day-card" style="margin-bottom: 8px; opacity: 0.5">
        <div class="day-header-btn" style="pointer-events: none">
          <div class="day-header-left">
            <span
              class="day-name"
              style="
                background: oklch(20% 0.008 45);
                color: transparent;
                border-radius: 4px;
                min-width: 80px;
              "
              >Loading</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- MODE 1: ACTIVE CUSTOM PROGRAM -->
    <div v-else-if="hasActiveCustomProgram" class="phase-container">
      <div class="phase-info-bar custom-phase-info-bar">
        <div class="phase-info-bar-left">
          <span class="phase-dot" style="background: #a78bfa" aria-hidden="true" />
          <span class="phase-subtitle-text">7-Day Split · Tap any day to expand or collapse</span>
        </div>
      </div>

      <div class="days-list">
        <article
          v-for="(dayName, i) in WEEKDAYS"
          :key="dayName"
          class="day-card"
          :class="{
            expanded: isDayExpanded(i),
            isToday: dayName === today,
          }"
          style="--phase-color: #a78bfa"
        >
          <!-- Day Accordion Header Button -->
          <button
            class="day-header-btn"
            :aria-expanded="isDayExpanded(i)"
            :aria-label="`${dayName}: ${activeCustomSchedule[dayName.toLowerCase()]?.title || 'Rest Day'} — ${isDayExpanded(i) ? 'collapse' : 'expand'}`"
            @click="toggleDay(i)"
          >
            <div class="day-header-left">
              <span class="day-name">{{ dayName }}</span>
              <span
                v-if="activeCustomSchedule[dayName.toLowerCase()]"
                class="day-label-pill"
                style="background: #a78bfa22; color: #c4b5fd"
              >
                {{
                  activeCustomSchedule[dayName.toLowerCase()].title ||
                  `${activeCustomSchedule[dayName.toLowerCase()].exercises?.length ?? 0} exercises`
                }}
              </span>
              <span
                v-else
                class="day-label-pill"
                style="background: oklch(14% 0.008 45); color: #737373"
              >
                Rest Day
              </span>
              <span
                v-if="dayName === today"
                class="today-badge"
                style="background: #a78bfa; color: #000"
                >Today</span
              >
            </div>
            <span class="accordion-icon" aria-hidden="true">
              {{ isDayExpanded(i) ? '−' : '+' }}
            </span>
          </button>

          <!-- Day Content (no Transition — avoids opacity:0 blocking on initial render) -->
          <div v-if="isDayExpanded(i)" class="day-content">
            <div
              v-if="activeCustomSchedule[dayName.toLowerCase()]?.exercises?.length"
              class="table-container"
            >
              <table class="exercise-table">
                <thead>
                  <tr>
                    <th scope="col" class="th-exercise">Exercise</th>
                    <th scope="col" class="th-sets">Sets</th>
                    <th scope="col" class="th-reps">Reps</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(ex, j) in activeCustomSchedule[dayName.toLowerCase()].exercises"
                    :key="j"
                    class="exercise-row"
                  >
                    <td class="td-exercise">
                      <a
                        :href="`https://www.youtube.com/results?search_query=${encodeURIComponent((ex.name || '') + ' exercise demonstration')}`"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="exercise-link"
                        style="color: #c4b5fd; border-bottom-color: #a78bfa77"
                        :aria-label="`Watch exercise demonstration for ${ex.name} on YouTube (opens in new tab)`"
                      >
                        <span class="exercise-name">{{ ex.name }}</span>
                        <span class="demo-icon" aria-hidden="true">↗</span>
                      </a>
                    </td>
                    <td class="td-sets" style="color: #a78bfa">{{ ex.sets || '—' }}</td>
                    <td class="td-reps">{{ ex.reps || '—' }}</td>
                  </tr>
                </tbody>
              </table>

              <!-- Log Workout CTA -->
              <div class="day-action-bar">
                <button
                  class="btn-log-action"
                  :class="{
                    isLogged: loggedDay === i,
                    isQueued: queuedDay === i,
                  }"
                  :disabled="loggingDay === i"
                  @click="
                    openLogModal(
                      i,
                      {
                        day: dayName,
                        title: activeCustomSchedule[dayName.toLowerCase()].title,
                        exercises: activeCustomSchedule[dayName.toLowerCase()].exercises,
                      },
                      true,
                    )
                  "
                >
                  <span v-if="loggingDay === i" class="btn-text">Saving workout…</span>
                  <span v-else-if="loggedDay === i" class="btn-text">Logged ✓</span>
                  <span v-else-if="queuedDay === i" class="btn-text">Queued offline ✓</span>
                  <span v-else class="btn-text">Log workout</span>
                </button>
                <RouterLink v-if="loggedDay === i" to="/history" class="view-history-link">
                  View history →
                </RouterLink>
              </div>
            </div>

            <!-- Rest Day -->
            <div
              v-else
              style="
                padding: 20px 0;
                text-align: center;
                color: #737373;
                font-style: italic;
                font-size: 0.875rem;
              "
            >
              Rest &amp; recovery day — no exercises scheduled.
            </div>
          </div>
        </article>
      </div>
    </div>

    <!-- MODE 2: DEFAULT PROGRAM (BUILD FROM ZERO) -->
    <Transition v-else name="phase-switch" mode="out-in">
      <div :key="activePhase" class="phase-container">
        <!-- Phase Subtitle Info -->
        <div class="phase-info-bar">
          <span class="phase-dot" :style="{ background: phase.color }" aria-hidden="true" />
          <span class="phase-subtitle-text">{{ phase.subtitle }}</span>
        </div>

        <!-- Days Accordion List -->
        <div class="days-list">
          <article
            v-for="(d, i) in phase.days"
            :key="d.day"
            class="day-card"
            :class="{
              expanded: isDayExpanded(i),
              isToday: d.day === today,
            }"
            :style="{
              '--phase-color': phase.color,
            }"
          >
            <!-- Day Accordion Header Button -->
            <button
              class="day-header-btn"
              :aria-expanded="isDayExpanded(i)"
              :aria-label="`${d.day}: ${d.label} — ${isDayExpanded(i) ? 'collapse' : 'expand'}`"
              @click="toggleDay(i)"
            >
              <div class="day-header-left">
                <span class="day-name">{{ d.day }}</span>
                <span class="day-label-pill">{{ d.label }}</span>
                <span v-if="!d.gym" class="home-only-badge">Home only</span>
                <span v-if="d.day === today" class="today-badge">Today</span>
              </div>
              <span class="accordion-icon" aria-hidden="true">
                {{ isDayExpanded(i) ? '−' : '+' }}
              </span>
            </button>

            <!-- Track Toggle (Home vs Gym) -->
            <Transition name="reveal">
              <div
                v-if="isDayExpanded(i) && d.gym"
                class="track-switcher"
                role="group"
                :aria-label="`Track selection for ${d.day}`"
              >
                <button
                  v-for="t in ['home', 'gym']"
                  :key="t"
                  class="track-btn"
                  :class="{ active: getTrack(i, true) === t }"
                  :aria-pressed="getTrack(i, true) === t"
                  @click="setDayTrack(i, t)"
                >
                  <span class="track-label">{{ t === 'home' ? 'Home' : 'Gym' }}</span>
                </button>
              </div>
            </Transition>

            <!-- Exercise List / Table -->
            <Transition name="accordion">
              <div v-if="isDayExpanded(i)" class="day-content">
                <div class="table-container">
                  <table class="exercise-table">
                    <thead>
                      <tr>
                        <th scope="col" class="th-exercise">Exercise</th>
                        <th scope="col" class="th-sets">Sets</th>
                        <th scope="col" class="th-reps">Reps</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(ex, j) in getExercises(i, d)" :key="j" class="exercise-row">
                        <td class="td-exercise">
                          <a
                            v-if="ex.link"
                            :href="ex.link"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="exercise-link"
                            :aria-label="`Watch exercise demonstration for ${ex.name} on YouTube (opens in new tab)`"
                          >
                            <span class="exercise-name">{{ ex.name }}</span>
                            <span class="demo-icon" aria-hidden="true">↗</span>
                          </a>
                          <span v-else class="exercise-name-plain">{{ ex.name }}</span>
                          <p v-if="ex.note" class="exercise-note">
                            {{ ex.note }}
                          </p>
                        </td>
                        <td class="td-sets">
                          {{ ex.sets }}
                        </td>
                        <td class="td-reps">
                          {{ ex.reps }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Day Action Bar (Log Workout CTA) -->
                <div class="day-action-bar">
                  <button
                    class="btn-log-action"
                    :class="{
                      isLogged: loggedDay === i,
                      isQueued: queuedDay === i,
                    }"
                    :disabled="loggingDay === i"
                    @click="openLogModal(i, d)"
                  >
                    <span v-if="loggingDay === i" class="btn-text">Saving workout…</span>
                    <span v-else-if="loggedDay === i" class="btn-text">Logged ✓</span>
                    <span v-else-if="queuedDay === i" class="btn-text">Queued offline ✓</span>
                    <span v-else class="btn-text">Log workout</span>
                  </button>

                  <RouterLink v-if="loggedDay === i" to="/history" class="view-history-link">
                    View history →
                  </RouterLink>

                  <div v-if="queuedDay === i && !connectivity.isOnline" class="offline-notice">
                    Saved offline — will sync automatically when reconnected
                  </div>

                  <div v-if="logError === i" class="log-error-msg" role="alert">
                    {{ logErrorMsg }}
                  </div>
                </div>
              </div>
            </Transition>
          </article>
        </div>
      </div>
    </Transition>

    <!-- ── Reference: Keys to Success ───────────────────────────── -->
    <section class="reference-section" aria-label="Training tips">
      <div class="reference-card">
        <h2 class="reference-heading">Keys to Success</h2>
        <div class="tips-grid">
          <div
            v-for="(t, i) in tips"
            :key="i"
            class="tip-card"
            :style="{ '--phase-color': phase.color }"
          >
            <span
              class="tip-tag"
              style="
                font-size: 10px;
                font-weight: 700;
                letter-spacing: 1.5px;
                text-transform: uppercase;
                color: var(--phase-color, #a78bfa);
                margin-bottom: 4px;
                display: block;
              "
              >{{ t.tag }}</span
            >
            <p class="tip-text">{{ t.text }}</p>
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- ── Pre-log Modal / Bottom Sheet ────────────────────────── -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="showLogModal"
        class="modal-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        @click.self="closeLogModal"
      >
        <div class="modal-sheet">
          <!-- Modal Header -->
          <div class="modal-header">
            <div class="modal-header-titles">
              <span class="modal-eyebrow">Log workout session</span>
              <h2 id="modal-title" class="modal-title">
                {{ pendingLogDay?.day.day }} ·
                {{ pendingLogDay?.day.label || pendingLogDay?.day.title }}
              </h2>
            </div>
            <button class="modal-close-btn" aria-label="Close modal" @click="closeLogModal">
              <span aria-hidden="true">×</span>
            </button>
          </div>

          <!-- Modal Body / Exercise Sets Inputs -->
          <div class="modal-body">
            <div
              v-for="group in logModalInputs"
              :key="group.exerciseName"
              class="modal-exercise-group"
            >
              <div class="group-exercise-header">
                <h3 class="group-exercise-title">{{ group.exerciseName }}</h3>
                <span
                  v-if="lastLoggedWeightMap[group.exerciseName] != null"
                  class="last-weight-badge"
                >
                  Last: {{ lastLoggedWeightMap[group.exerciseName] }} lbs
                </span>
              </div>

              <!-- Column Header Labels -->
              <div class="set-grid-header">
                <span class="col-label col-set">Set</span>
                <span class="col-label col-reps">Reps</span>
                <span class="col-label col-weight">Weight (lbs)</span>
              </div>

              <!-- Set Input Rows with Steppers -->
              <div v-for="s in group.sets" :key="s.setNumber" class="set-card-row">
                <div class="set-input-row">
                  <span class="set-number-label">{{ s.setNumber }}</span>
                  <div class="input-wrapper reps-input-wrapper">
                    <div class="stepper-input-container">
                      <button
                        type="button"
                        class="stepper-btn-mini"
                        @click="adjustReps(s, -1)"
                        :aria-label="`Decrease reps by 1 for ${group.exerciseName} set ${s.setNumber}`"
                      >
                        −
                      </button>
                      <input
                        v-model.number="s.repsDone"
                        type="number"
                        inputmode="numeric"
                        min="0"
                        max="999"
                        :placeholder="s.repsProgrammed > 0 ? String(s.repsProgrammed) : 'Reps'"
                        class="modal-input"
                        :aria-label="`${group.exerciseName} set ${s.setNumber} reps`"
                      />
                      <button
                        type="button"
                        class="stepper-btn-mini"
                        @click="adjustReps(s, 1)"
                        :aria-label="`Increase reps by 1 for ${group.exerciseName} set ${s.setNumber}`"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div class="input-wrapper weight-input-wrapper">
                    <div class="stepper-input-container">
                      <button
                        type="button"
                        class="stepper-btn-mini stepper-btn-weight"
                        @click="adjustWeight(s, -5, group.exerciseName)"
                        :aria-label="`Decrease weight by 5 lbs for ${group.exerciseName} set ${s.setNumber}`"
                      >
                        −5
                      </button>
                      <input
                        v-model.number="s.weightLbs"
                        type="number"
                        inputmode="decimal"
                        min="0"
                        max="2000"
                        step="2.5"
                        :placeholder="
                          lastLoggedWeightMap[group.exerciseName] != null
                            ? `${lastLoggedWeightMap[group.exerciseName]} lbs`
                            : 'lbs'
                        "
                        class="modal-input"
                        :aria-label="`${group.exerciseName} set ${s.setNumber} weight in lbs`"
                      />
                      <button
                        type="button"
                        class="stepper-btn-mini stepper-btn-weight"
                        @click="adjustWeight(s, 5, group.exerciseName)"
                        :aria-label="`Increase weight by 5 lbs for ${group.exerciseName} set ${s.setNumber}`"
                      >
                        +5
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p class="modal-helper-text">
              All set inputs are optional. Leave fields empty to record default programmed reps
              without weight.
            </p>
          </div>

          <!-- Modal Footer CTA: Fast-path 1-tap + Standard Actions -->
          <div class="modal-footer">
            <button
              type="button"
              class="modal-btn-fast-log"
              :disabled="loggingDay === pendingLogDay?.dayIndex"
              @click="logAllAsProgrammed"
            >
              <span class="fast-log-icon" aria-hidden="true">⚡</span>
              <span class="fast-log-text">Log All as Programmed</span>
            </button>
            <div class="modal-footer-secondary-row">
              <button
                type="button"
                class="modal-btn-primary"
                :disabled="loggingDay === pendingLogDay?.dayIndex"
                @click="confirmLog"
              >
                {{ loggingDay === pendingLogDay?.dayIndex ? 'Saving workout…' : 'Save workout' }}
              </button>
              <button type="button" class="modal-btn-secondary" @click="closeLogModal">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ── Rest Timer Floating Bar ───────────────────────────────── -->
  <div class="rest-timer-bar">
    <div class="rest-timer-inner">
      <div class="rest-timer-display" :class="{ isZero: restTimerSeconds === 0 }">
        <span class="rest-timer-label">Rest Timer</span>
        <span class="rest-timer-digits">{{ restTimerFormatted }}</span>
      </div>

      <div class="rest-timer-controls">
        <button
          v-if="!restTimerRunning"
          type="button"
          class="timer-ctrl-btn timer-btn-start"
          @click="startRestTimer()"
          aria-label="Start rest timer"
        >
          Start
        </button>
        <button
          v-else
          type="button"
          class="timer-ctrl-btn timer-btn-pause"
          @click="pauseRestTimer()"
          aria-label="Pause rest timer"
        >
          Pause
        </button>

        <button
          type="button"
          class="timer-preset-btn"
          @click="startRestTimer(60)"
          aria-label="Start 60 second rest timer"
        >
          60s
        </button>
        <button
          type="button"
          class="timer-preset-btn"
          @click="startRestTimer(90)"
          aria-label="Start 90 second rest timer"
        >
          90s
        </button>
        <button
          type="button"
          class="timer-preset-btn"
          @click="startRestTimer(120)"
          aria-label="Start 2 minute rest timer"
        >
          2m
        </button>
        <button
          type="button"
          class="timer-preset-btn"
          @click="addRestTime(30)"
          aria-label="Add 30 seconds to rest timer"
        >
          +30s
        </button>
        <button
          type="button"
          class="timer-reset-btn"
          @click="resetRestTimer(90)"
          aria-label="Reset rest timer to 90 seconds"
        >
          Reset
        </button>
      </div>
    </div>
  </div>

  <!-- ── Export Program Modal ─────────────────────────────────── -->
  <ExportModal
    :show="showExportModal"
    :program="exportProgramData"
    :initial-phase-index="activePhase"
    @close="showExportModal = false"
  />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useConnectivityStore } from '@/stores/connectivity'
import { supabase } from '@/lib/supabase'
import { buildSetLogs, parseSetCount, parseRepsProgrammed } from '@/lib/workout'
import { enqueueWorkout, enqueueCustomWorkout, isNetworkError } from '@/lib/offlineQueue'
import { queryClient } from '@/lib/queryClient'
import { useWorkoutHistoryQuery, invalidateWorkoutHistory } from '@/queries/history'
import { useCustomDaysQuery } from '@/queries/customDays'
import { useCustomProgramsQuery, activateBuiltInProgram, invalidateCustomPrograms } from '@/queries/programs'
import { invalidateCustomDays } from '@/queries/customDays'
import { invalidateProfile } from '@/queries/profile'
import { logCustomDay } from '@/queries/customLog'
import { program, tips, WEEKDAYS } from '@/data/program'
import ExportModal from '@/components/ExportModal.vue'

const authStore = useAuthStore()
const connectivity = useConnectivityStore()
const _router = useRouter()
const restoringBuiltIn = ref(false)

async function restoreBuiltInProgram() {
  const uid = authStore.user?.id
  if (!uid || restoringBuiltIn.value) return
  restoringBuiltIn.value = true
  try {
    await activateBuiltInProgram(uid)
    if (authStore.profile) {
      authStore.profile.program_adopted = false
    }
    await Promise.all([
      invalidateCustomDays(queryClient),
      invalidateCustomPrograms(queryClient),
      invalidateProfile(queryClient, uid),
    ])
  } catch (err) {
    console.error('Failed to restore built-in program:', err)
  } finally {
    restoringBuiltIn.value = false
  }
}

const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
const todayIndex = WEEKDAYS.indexOf(today) >= 0 ? WEEKDAYS.indexOf(today) : 0

const activePhase = ref(0)
const track = ref({})

const _onboardKey = `onboard-v1-${authStore.user?.id ?? 'anon'}`
const firstRunSeen = ref(localStorage.getItem(_onboardKey) === '1')
function dismissFirstRun() {
  firstRunSeen.value = true
  localStorage.setItem(_onboardKey, '1')
}

const userId = computed(() => authStore.user?.id)
const authIsReady = computed(() => authStore.isReady)
const { data: customDaysData } = useCustomDaysQuery(userId)
const { data: customProgramsData, isLoading: programsLoading } = useCustomProgramsQuery(userId)
const { data: workoutHistory } = useWorkoutHistoryQuery()

const lastLoggedWeightMap = computed(() => {
  const map = {}
  if (!workoutHistory.value) return map
  for (const session of workoutHistory.value) {
    if (!session.set_logs) continue
    for (const log of session.set_logs) {
      if (log.exercise_name && log.weight_kg != null && map[log.exercise_name] === undefined) {
        map[log.exercise_name] = log.weight_kg
      }
    }
  }
  return map
})

// Synchronous local cache backup to prevent split-second layout flashes on refresh
const cachedDays = ref([])
try {
  const localKey = authStore.user?.id
    ? `active-custom-days-v1-${authStore.user.id}`
    : 'active-custom-days-v1-anon'
  const raw = localStorage.getItem(localKey) || localStorage.getItem('active-custom-days-v1-last')
  if (raw) cachedDays.value = JSON.parse(raw)
} catch {}

const activeCustomDaysList = computed(() => {
  if (customDaysData.value && customDaysData.value.length > 0) {
    try {
      const k = authStore.user?.id
        ? `active-custom-days-v1-${authStore.user.id}`
        : 'active-custom-days-v1-anon'
      localStorage.setItem(k, JSON.stringify(customDaysData.value))
      localStorage.setItem('active-custom-days-v1-last', JSON.stringify(customDaysData.value))
    } catch {}
    return customDaysData.value
  }
  return cachedDays.value
})

function getCustomExercises(dayItem) {
  if (!dayItem || !dayItem.exercises) return []
  if (typeof dayItem.exercises === 'string') {
    try {
      return JSON.parse(dayItem.exercises)
    } catch {
      return []
    }
  }
  return Array.isArray(dayItem.exercises) ? dayItem.exercises : []
}

const activeCustomSchedule = computed(() => {
  const map = {}
  const uid = authStore.user?.id
  const activeProgId =
    (uid ? localStorage.getItem(`active-program-id-${uid}`) : null) ||
    localStorage.getItem('active-program-id-last')
  if (activeProgId === 'builtin') {
    return map
  }

  // 1. Primary: custom_days
  const daysList = activeCustomDaysList.value ?? []
  for (const item of daysList) {
    if (!item.day_name) continue
    const key = item.day_name.trim().toLowerCase()
    const exList = getCustomExercises(item)
    if (exList.length && !map[key]) {
      map[key] = { ...item, exercises: exList }
    }
  }

  // 2. Secondary: if custom_days is empty, use the user's latest custom program only if actively set
  if (
    Object.keys(map).length === 0 &&
    customProgramsData.value?.length > 0 &&
    activeProgId &&
    activeProgId !== 'builtin'
  ) {
    const matchedProg = customProgramsData.value.find((p) => p.id === activeProgId)
    if (matchedProg) {
      const progDays = matchedProg.custom_program_days ?? []
      for (const item of progDays) {
        if (!item.day_name) continue
        const key = item.day_name.trim().toLowerCase()
        const exList = getCustomExercises(item)
        if (exList.length && !map[key]) {
          map[key] = {
            ...item,
            programTitle: matchedProg.name,
            exercises: exList,
          }
        }
      }
    }
  }

  return map
})

const hasActiveCustomProgram = computed(() => {
  return Object.keys(activeCustomSchedule.value).length > 0
})

// True while we're still waiting for auth OR for program data to load
// — prevents flashing the wrong mode during the auth restore window
const isLoadingProgram = computed(() => {
  if (!authIsReady.value) return true
  // If logged in and programs query is still in-flight, hold
  if (userId.value && programsLoading.value) return true
  return false
})

const activeProgramTitle = computed(() => {
  if (!hasActiveCustomProgram.value) return 'Build From Zero'

  // 1. Saved active program name in localStorage
  const uid = authStore.user?.id
  const savedName = uid ? localStorage.getItem(`active-program-name-${uid}`) : null
  const fallbackName = localStorage.getItem('active-program-name-last')
  if (savedName) return savedName
  if (fallbackName) return fallbackName

  // 2. Lookup program name by saved active program ID
  const activeProgId = uid ? localStorage.getItem(`active-program-id-${uid}`) : null
  if (activeProgId && customProgramsData.value?.length) {
    const matched = customProgramsData.value.find((p) => p.id === activeProgId)
    if (matched?.name) return matched.name
  }

  // 3. Check if any day item has an attached programTitle
  const withProgTitle = Object.values(activeCustomSchedule.value).find((d) => d.programTitle)
  if (withProgTitle?.programTitle) return withProgTitle.programTitle

  // 4. Default to first custom program name in list if available
  if (customProgramsData.value?.length && customProgramsData.value[0]?.name) {
    return customProgramsData.value[0].name
  }

  // 5. Fallback to today's workout title
  const todayKey = today.toLowerCase()
  const todayItem = activeCustomSchedule.value[todayKey]
  if (todayItem?.title) {
    return `${today}: ${todayItem.title}`
  }

  return 'My Custom Program'
})

const activeCustomSubtitle = computed(() => {
  if (!hasActiveCustomProgram.value) return ''
  const todayKey = today.toLowerCase()
  const todayItem = activeCustomSchedule.value[todayKey]
  if (todayItem) {
    const workoutName = todayItem.title || `${todayItem.exercises?.length || 0} exercises`
    return `Today (${today}): ${workoutName} · 7-Day Plan`
  }
  return `Today (${today}): Rest & Recovery · 7-Day Plan`
})

const exportProgramData = computed(() => {
  if (hasActiveCustomProgram.value) {
    return {
      name: activeProgramTitle.value || 'Active Custom Plan',
      custom_program_days: activeCustomDaysList.value || [],
    }
  }
  return program
})

const phase = computed(() => program.phases[activePhase.value])

// Reactive object tracking day expansion state (only current day expanded by default)
const expandedDaysMap = ref({ [todayIndex]: true })

function isDayExpanded(i) {
  return !!expandedDaysMap.value[i]
}

function selectPhase(i) {
  activePhase.value = i
}

function toggleDay(i) {
  expandedDaysMap.value = {
    ...expandedDaysMap.value,
    [i]: !expandedDaysMap.value[i],
  }
}

function getTrack(dayIndex, hasGym) {
  if (!hasGym) return 'home'
  return track.value[`${activePhase.value}-${dayIndex}`] || 'gym'
}

function setDayTrack(dayIndex, val) {
  track.value = { ...track.value, [`${activePhase.value}-${dayIndex}`]: val }
}

function getExercises(dayIndex, day) {
  const currentTrack = getTrack(dayIndex, !!day.gym)
  return currentTrack === 'gym' ? day.gym : day.home
}

const loggingDay = ref(null)
const loggedDay = ref(null)
const queuedDay = ref(null)
const logError = ref(null)
const logErrorMsg = ref('')
let _loggedTimer = null
let _queuedTimer = null

async function queueWorkoutOffline(dayIndex, sessionPayload, exercises, setOverrides = []) {
  await enqueueWorkout(authStore.user.id, sessionPayload, exercises, setOverrides)
  await connectivity.onWorkoutQueued()
  loggingDay.value = null
  queuedDay.value = dayIndex
  clearTimeout(_queuedTimer)
  _queuedTimer = setTimeout(() => {
    if (queuedDay.value === dayIndex) queuedDay.value = null
  }, 4000)
}

async function queueCustomWorkoutOffline(dayIndex, day, setOverrides = []) {
  await enqueueCustomWorkout(authStore.user.id, {
    dayName: day.day,
    title: day.title ?? '',
    exercises: day.exercises ?? [],
    setOverrides,
  })
  await connectivity.onWorkoutQueued()
  loggingDay.value = null
  queuedDay.value = dayIndex
  clearTimeout(_queuedTimer)
  _queuedTimer = setTimeout(() => {
    if (queuedDay.value === dayIndex) queuedDay.value = null
  }, 4000)
}

async function logWorkout(dayIndex, day, setOverrides = []) {
  if (!authStore.user || loggingDay.value !== null) return

  const exercises = getExercises(dayIndex, day)
  if (!exercises?.length) return

  loggingDay.value = dayIndex
  logError.value = null
  const currentTrack = getTrack(dayIndex, !!day.gym)
  const now = new Date().toISOString()

  const sessionPayload = {
    user_id: authStore.user.id,
    date: now.slice(0, 10),
    phase: program.phases[activePhase.value].id,
    week: currentWeek.value,
    day_name: day.day,
    track: currentTrack,
    completed_at: now,
  }

  if (!connectivity.isOnline) {
    await queueWorkoutOffline(dayIndex, sessionPayload, exercises, setOverrides)
    return
  }

  const { data: session, error } = await supabase
    .from('workout_sessions')
    .insert(sessionPayload)
    .select('id')
    .single()

  if (error) {
    if (isNetworkError(error)) {
      await queueWorkoutOffline(dayIndex, sessionPayload, exercises, setOverrides)
      return
    }
    logError.value = dayIndex
    logErrorMsg.value = error.message
    loggingDay.value = null
    return
  }

  const setLogs = buildSetLogs(session.id, exercises, setOverrides)
  if (setLogs.length) {
    const { error: setsError } = await supabase.from('set_logs').insert(setLogs)
    if (setsError) {
      if (isNetworkError(setsError)) {
        await supabase.from('workout_sessions').delete().eq('id', session.id)
        await queueWorkoutOffline(dayIndex, sessionPayload, exercises, setOverrides)
        return
      }
      logError.value = dayIndex
      logErrorMsg.value = setsError.message
      loggingDay.value = null
      return
    }
  }

  loggingDay.value = null
  loggedDay.value = dayIndex
  await invalidateWorkoutHistory(queryClient)
  clearTimeout(_loggedTimer)
  _loggedTimer = setTimeout(() => {
    if (loggedDay.value === dayIndex) loggedDay.value = null
  }, 4000)
}

// ── Pre-log modal state & handlers ───────────────────────────
const showLogModal = ref(false)
const pendingLogDay = ref(null)
const logModalInputs = ref([])

function openLogModal(dayIndex, day, isCustom = false) {
  if (!authStore.user) return
  const exercises = isCustom ? (day.exercises ?? []) : getExercises(dayIndex, day)
  if (!exercises?.length) return

  logModalInputs.value = exercises.map((ex) => ({
    exerciseName: ex.name,
    sets: Array.from({ length: parseSetCount(ex.sets) }, (_, idx) => ({
      setNumber: idx + 1,
      repsProgrammed: parseRepsProgrammed(ex.reps),
      repsDone: null,
      weightLbs: null,
    })),
  }))
  pendingLogDay.value = { dayIndex, day, isCustom }
  showLogModal.value = true
}

function closeLogModal() {
  showLogModal.value = false
  pendingLogDay.value = null
  logModalInputs.value = []
}

function adjustWeight(s, delta, exerciseName) {
  let base = s.weightLbs
  if (base == null || isNaN(base) || base === '') {
    base = lastLoggedWeightMap.value[exerciseName] ?? 0
  }
  const next = Math.max(0, Math.round((Number(base) + delta) * 10) / 10)
  s.weightLbs = next === 0 && delta < 0 ? null : next
}

function adjustReps(s, delta) {
  let base = s.repsDone
  if (base == null || isNaN(base) || base === '') {
    base = s.repsProgrammed > 0 ? s.repsProgrammed : 0
  }
  const next = Math.max(0, Number(base) + delta)
  s.repsDone = next
}

function logAllAsProgrammed() {
  if (!pendingLogDay.value) return
  for (const group of logModalInputs.value) {
    const fallbackWeight = lastLoggedWeightMap.value[group.exerciseName] ?? null
    for (const s of group.sets) {
      if (s.repsDone == null || s.repsDone === '') {
        s.repsDone = s.repsProgrammed > 0 ? s.repsProgrammed : null
      }
      if (s.weightLbs == null || s.weightLbs === '') {
        s.weightLbs = fallbackWeight
      }
    }
  }
  confirmLog()
}

async function confirmLog() {
  if (!pendingLogDay.value) return

  const setOverrides = []
  for (const group of logModalInputs.value) {
    for (const s of group.sets) {
      if (s.repsDone != null || s.weightLbs != null) {
        setOverrides.push({
          exerciseName: group.exerciseName,
          setNumber: s.setNumber,
          repsDone: s.repsDone ?? null,
          weightLbs: s.weightLbs ?? null,
        })
      }
    }
  }

  const { dayIndex, day, isCustom } = pendingLogDay.value
  closeLogModal()

  if (isCustom) {
    loggingDay.value = dayIndex
    try {
      if (!connectivity.isOnline) {
        await queueCustomWorkoutOffline(dayIndex, day, setOverrides)
        return
      }

      await logCustomDay(
        authStore.user.id,
        day.day,
        day.title ?? '',
        day.exercises ?? [],
        setOverrides,
      )
      await invalidateWorkoutHistory(queryClient)
      loggedDay.value = dayIndex
      clearTimeout(_loggedTimer)
      _loggedTimer = setTimeout(() => {
        if (loggedDay.value === dayIndex) loggedDay.value = null
      }, 4000)
    } catch (err) {
      if (isNetworkError(err)) {
        await queueCustomWorkoutOffline(dayIndex, day, setOverrides)
        return
      }
      logError.value = dayIndex
      logErrorMsg.value = err?.message ?? 'Failed to log workout.'
    } finally {
      loggingDay.value = null
    }
  } else {
    await logWorkout(dayIndex, day, setOverrides)
  }
}

const _weekKey = computed(() => `program-week-${authStore.user?.id ?? 'anon'}`)
const currentWeek = ref(1)

// ── Rest Timer Widget with Clock Accuracy & Background Sync ───────
const restTimerSeconds = ref(90)
const restTimerRunning = ref(false)
let restTimerTargetEnd = null
let _timerInterval = null

const restTimerFormatted = computed(() => {
  const mins = Math.floor(restTimerSeconds.value / 60)
  const secs = restTimerSeconds.value % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
})

function updateRestTimerFromClock() {
  if (!restTimerRunning.value || !restTimerTargetEnd) return
  const now = Date.now()
  const remainingMs = restTimerTargetEnd - now
  if (remainingMs <= 0) {
    restTimerSeconds.value = 0
    pauseRestTimer()
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([200, 100, 200])
      } catch {}
    }
  } else {
    restTimerSeconds.value = Math.ceil(remainingMs / 1000)
  }
}

function startRestTimer(seconds) {
  if (seconds != null) {
    restTimerSeconds.value = seconds
  } else if (restTimerSeconds.value <= 0) {
    restTimerSeconds.value = 90
  }
  restTimerTargetEnd = Date.now() + restTimerSeconds.value * 1000
  restTimerRunning.value = true
  clearInterval(_timerInterval)
  _timerInterval = setInterval(() => {
    updateRestTimerFromClock()
  }, 250)
}

function pauseRestTimer() {
  if (restTimerRunning.value && restTimerTargetEnd) {
    const remainingMs = restTimerTargetEnd - Date.now()
    restTimerSeconds.value = Math.max(0, Math.ceil(remainingMs / 1000))
  }
  restTimerRunning.value = false
  restTimerTargetEnd = null
  clearInterval(_timerInterval)
}

function addRestTime(secs = 30) {
  if (restTimerRunning.value && restTimerTargetEnd) {
    restTimerTargetEnd += secs * 1000
    updateRestTimerFromClock()
  } else {
    restTimerSeconds.value += secs
  }
}

function resetRestTimer(secs = 90) {
  pauseRestTimer()
  restTimerSeconds.value = secs
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible' && restTimerRunning.value) {
    updateRestTimerFromClock()
  }
}

onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('focus', handleVisibilityChange)
  const saved = localStorage.getItem(_weekKey.value)
  if (saved) {
    const n = parseInt(saved, 10)
    if (n >= 1 && n <= 8) currentWeek.value = n
  }
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('focus', handleVisibilityChange)
  clearInterval(_timerInterval)
  clearTimeout(_loggedTimer)
  clearTimeout(_queuedTimer)
})
</script>

<style scoped>
/* ── Layout & Typography Base ─────────────────────────────── */
.program-header {
  border-bottom: 1px solid oklch(16% 0.008 45);
  padding: clamp(20px, 4vw, 32px) 20px clamp(16px, 3vw, 24px);
  text-align: center;
  background: oklch(9% 0.01 45);
}

.program-header-inner {
  max-width: 640px;
  margin: 0 auto;
}

.program-title {
  font-family: Georgia, serif;
  font-size: clamp(1.75rem, 5vw, 2.5rem);
  font-weight: 400;
  margin: 0;
  color: #f5f5f5;
  letter-spacing: -0.5px;
  line-height: 1.2;
}

.program-subtitle {
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  font-size: 0.9375rem;
  color: #a3a3a3;
  margin: 8px 0 0;
  line-height: 1.4;
}

.program-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  justify-content: center;
  align-items: center;
  margin-top: 14px;
}

.badge {
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  font-size: 0.75rem;
  color: #a3a3a3;
  padding: 8px 14px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: oklch(12% 0.008 45);
  border: 1px solid oklch(18% 0.008 45);
  border-radius: 9999px;
  box-sizing: border-box;
}

.badge.highlight {
  color: #e5e5e5;
  border-color: oklch(24% 0.008 45);
}

.active-custom-badge {
  background: #a78bfa22;
  color: #c4b5fd;
  border-color: #a78bfa;
  font-weight: 600;
}


.edit-studio-badge {
  color: #c4b5fd;
  text-decoration: none;
  border-color: #a78bfa66;
  transition: all 150ms;
}

.edit-studio-badge:hover {
  background: oklch(14% 0.008 45);
  border-color: #a78bfa;
  color: #ffffff;
}

.built-in-restore-badge {
  cursor: pointer;
  color: #4ade80;
  border-color: #4ade8066;
  background: #4ade8011;
  font-family: inherit;
  transition: all 150ms;
}

.built-in-restore-badge:hover:not(:disabled) {
  background: #4ade8022;
  border-color: #4ade80;
  color: #ffffff;
}

.built-in-restore-badge:disabled {
  opacity: 0.6;
  cursor: wait;
}

.built-in-restore-badge:focus-visible {
  outline: 2px solid #4ade80;
  outline-offset: 2px;
}

/* ── Phase Tabs Navigation ───────────────────────────────── */
.phase-tabs-wrapper {
  position: sticky;
  top: 0;
  z-index: 20;
  background: oklch(8% 0.012 45);
  border-bottom: 1px solid oklch(16% 0.008 45);
  backdrop-filter: blur(12px);
}

.phase-tabs-container {
  display: flex;
  max-width: 860px;
  margin: 0 auto;
}

.phase-tab-btn {
  flex: 1;
  min-height: 52px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  color: #888;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  transition: all 180ms ease-out;
}

.phase-tab-btn:hover {
  color: #d4d4d4;
  background: oklch(11% 0.008 45);
}

.phase-tab-btn.active {
  background: oklch(11% 0.008 45);
  border-bottom-color: var(--phase-color, #4ade80);
  color: #ffffff;
}

.phase-tab-name {
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.phase-tab-weeks {
  font-size: 0.6875rem;
  color: #a3a3a3;
  opacity: 0.9;
}

/* ── Onboarding ─────────────────────────────────────────── */
.onboarding-section {
  max-width: 520px;
  margin: 48px auto;
  padding: 0 20px;
}

.onboarding-card {
  text-align: center;
  background: oklch(10% 0.01 45);
  border: 1px solid oklch(18% 0.008 45);
  border-radius: 12px;
  padding: 32px 24px;
}

.onboarding-icon {
  font-size: 44px;
  margin-bottom: 16px;
  line-height: 1;
}

.onboarding-title {
  font-family: Georgia, serif;
  font-size: 1.5rem;
  font-weight: 400;
  color: #f5f5f5;
  margin: 0 0 8px;
}

.onboarding-desc {
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  color: #a3a3a3;
  font-size: 0.9375rem;
  line-height: 1.5;
  margin: 0 0 28px;
}

.btn-adopt-primary {
  display: block;
  width: 100%;
  padding: 16px 20px;
  background: oklch(12% 0.008 45);
  border: 1px solid #4ade8066;
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  margin-bottom: 12px;
  transition: all 150ms ease-out;
  min-height: 52px;
}

.btn-adopt-primary:hover {
  background: oklch(14% 0.008 45);
  border-color: #4ade80;
}

.adopt-badge {
  display: block;
  color: #4ade80;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.adopt-title {
  display: block;
  color: #f5f5f5;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.adopt-meta {
  display: block;
  color: #a3a3a3;
  font-size: 0.8125rem;
}

.btn-adopt-secondary {
  display: block;
  width: 100%;
  min-height: 48px;
  padding: 14px 20px;
  background: transparent;
  border: 1px solid oklch(18% 0.008 45);
  border-radius: 8px;
  cursor: pointer;
  color: #a3a3a3;
  font-size: 0.875rem;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  transition: all 150ms;
}

.btn-adopt-secondary:hover {
  color: #ffffff;
  border-color: oklch(26% 0.008 45);
}

/* ── First Run Banner ────────────────────────────────────── */
.first-run-banner {
  max-width: 860px;
  margin: 16px auto 0;
  padding: 0 16px;
}

.first-run-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  background: oklch(11% 0.01 45);
  border: 1px solid #4ade8055;
  border-radius: 8px;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #d4d4d4;
}

.first-run-highlight {
  color: #4ade80;
  margin-right: 4px;
}

.first-run-dismiss {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #a3a3a3;
  cursor: pointer;
  font-size: 24px;
  line-height: 1;
  padding: 0;
  flex-shrink: 0;
  border-radius: 4px;
  transition: color 150ms;
}

.first-run-dismiss:hover {
  color: #ffffff;
}

/* ── Program Main Container ──────────────────────────────── */
.program-main {
  max-width: 860px;
  margin: 0 auto;
  padding: 16px;
}

.phase-info-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 4px 16px;
}

.custom-phase-info-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.phase-info-bar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}


.phase-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.phase-subtitle-text {
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  font-size: 0.875rem;
  color: #a3a3a3;
  font-style: italic;
}

/* ── Day Cards Accordion ─────────────────────────────────── */
.days-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.day-card {
  background: oklch(10% 0.01 45);
  border: 1px solid oklch(18% 0.008 45);
  border-radius: 10px;
  overflow: hidden;
  transition:
    border-color 200ms ease-out,
    box-shadow 200ms ease-out;
}

.day-card.expanded {
  border-color: oklch(24% 0.008 45);
}

.day-card.isToday {
  border-color: var(--phase-color, #4ade80);
  box-shadow: 0 0 0 1px var(--phase-color, #4ade80);
}

.day-header-btn {
  width: 100%;
  min-height: 52px;
  padding: 14px 18px;
  background: transparent;
  border: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  color: #f5f5f5;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  text-align: left;
  transition: background 160ms ease-out;
}

.day-card.expanded .day-header-btn {
  background: oklch(11.5% 0.008 45);
}

.day-header-btn:hover {
  background: oklch(12.5% 0.008 45);
}

.day-header-left {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.day-name {
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  font-size: 0.875rem;
  font-weight: 700;
  color: #f5f5f5;
  letter-spacing: 1px;
  text-transform: uppercase;
  min-width: 84px;
}

.day-label-pill {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 9999px;
  background: oklch(14% 0.008 45);
  color: var(--phase-color, #4ade80);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.home-only-badge {
  font-size: 0.75rem;
  color: #a3a3a3;
}

.today-badge {
  font-size: 0.6875rem;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 9999px;
  background: var(--phase-color, #4ade80);
  color: #000000;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.accordion-icon {
  color: #a3a3a3;
  font-size: 22px;
  line-height: 1;
  font-weight: 300;
  margin-left: 8px;
}

/* ── Track Switcher Segmented Control ────────────────────── */
.track-switcher {
  display: flex;
  background: oklch(8% 0.012 45);
  border-top: 1px solid oklch(15% 0.008 45);
  border-bottom: 1px solid oklch(15% 0.008 45);
  padding: 4px;
  gap: 4px;
}

.track-btn {
  flex: 1;
  min-height: 44px;
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #a3a3a3;
  cursor: pointer;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 160ms ease-out;
}

.track-btn:hover {
  color: #ffffff;
  background: oklch(12% 0.008 45);
}

.track-btn.active {
  background: oklch(16% 0.008 45);
  color: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}

/* ── Exercise Table Layout ───────────────────────────────── */
.day-content {
  padding: 16px 18px 20px;
  background: oklch(10% 0.01 45);
}

.table-container {
  overflow-x: auto;
}

.exercise-table {
  width: 100%;
  border-collapse: collapse;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
}

.th-exercise,
.th-sets,
.th-reps {
  padding: 10px 8px 10px 0;
  font-size: 0.6875rem;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  font-weight: 600;
  color: #a3a3a3;
  border-bottom: 1px solid oklch(16% 0.008 45);
}

.th-exercise {
  text-align: left;
}

.th-sets,
.th-reps {
  text-align: center;
}

.exercise-row {
  border-bottom: 1px solid oklch(14% 0.008 45);
}

.exercise-row:last-child {
  border-bottom: none;
}

.td-exercise {
  padding: 14px 12px 14px 0;
}

.exercise-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--phase-color, #4ade80);
  text-decoration: none;
  font-size: 0.9375rem;
  font-weight: 500;
  line-height: 1.4;
  padding: 8px 0;
  min-height: 44px;
  border-bottom: 1px dashed var(--phase-color, #4ade80);
  transition: opacity 150ms;
}

.exercise-link:hover {
  opacity: 0.8;
}

.demo-icon {
  font-size: 0.8125rem;
  opacity: 0.8;
}

.exercise-name-plain {
  color: #f5f5f5;
  font-size: 0.9375rem;
  font-weight: 500;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

.exercise-note {
  font-size: 0.75rem;
  color: #a3a3a3;
  line-height: 1.5;
  margin: 4px 0 0;
  font-style: italic;
}

.td-sets {
  padding: 14px 12px;
  text-align: center;
  font-weight: 700;
  font-size: 1rem;
  color: var(--phase-color, #4ade80);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.td-reps {
  padding: 14px 0 14px 12px;
  text-align: center;
  font-size: 0.9375rem;
  color: #e5e5e5;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* ── Day Action Bar (Primary CTA) ────────────────────────── */
.day-action-bar {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid oklch(16% 0.008 45);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.btn-log-action {
  min-height: 48px;
  padding: 12px 24px;
  background: oklch(14% 0.008 45);
  border: 1px solid oklch(24% 0.008 45);
  border-radius: 8px;
  color: #ffffff;
  cursor: pointer;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms ease-out;
}

.btn-log-action:hover:not(:disabled) {
  background: oklch(18% 0.008 45);
  border-color: oklch(30% 0.008 45);
}

.btn-log-action:disabled {
  opacity: 0.6;
  cursor: wait;
}

.btn-log-action.isLogged {
  background: oklch(16% 0.01 140);
  border-color: #4ade80;
  color: #4ade80;
}

.btn-log-action.isQueued {
  background: oklch(16% 0.01 90);
  border-color: #facc15;
  color: #facc15;
}

.view-history-link {
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  font-size: 0.8125rem;
  color: #a3a3a3;
  text-decoration: none;
  padding: 12px 8px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  transition: color 150ms;
}

.view-history-link:hover {
  color: #ffffff;
}

.offline-notice {
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  font-size: 0.8125rem;
  color: #facc15;
}

.log-error-msg {
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  font-size: 0.8125rem;
  color: #f87171;
}

/* ── Reference Section (Substitutions & Tips) ────────────── */
.reference-section {
  margin-top: 36px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.reference-card {
  background: oklch(10% 0.01 45);
  border: 1px solid oklch(18% 0.008 45);
  border-radius: 10px;
  padding: 20px 22px;
}

.reference-heading {
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 2px;
  color: #d4d4d4;
  text-transform: uppercase;
  margin: 0 0 16px;
}

.tips-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@media (min-width: 768px) {
  .tips-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
}

.tip-card {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 14px 16px;
  background: oklch(8% 0.012 45);
  border-radius: 8px;
  border: 1px solid oklch(18% 0.008 45);
}

.tip-icon {
  font-size: 18px;
  line-height: 1.2;
  flex-shrink: 0;
}

.tip-text {
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #a3a3a3;
  margin: 0;
}

/* ── Pre-log Modal / Bottom Sheet ────────────────────────── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
}

@media (min-width: 600px) {
  .modal-backdrop {
    align-items: center;
    padding: 24px;
  }
}

.modal-sheet {
  width: 100%;
  max-width: 560px;
  background: oklch(11% 0.01 45);
  border: 1px solid oklch(20% 0.008 45);
  border-radius: 16px 16px 0 0;
  padding: 24px 20px clamp(24px, 5vw, 36px);
  max-height: 88dvh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.6);
}

@media (min-width: 600px) {
  .modal-sheet {
    border-radius: 14px;
    padding: 28px 24px;
    max-height: 82dvh;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7);
  }
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid oklch(16% 0.008 45);
}

.modal-eyebrow {
  display: block;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  font-size: 0.6875rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #a3a3a3;
  margin-bottom: 4px;
}

.modal-title {
  font-family: Georgia, serif;
  font-size: 1.25rem;
  font-weight: 400;
  color: #f5f5f5;
  margin: 0;
}

.modal-close-btn {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #a3a3a3;
  cursor: pointer;
  font-size: 26px;
  line-height: 1;
  padding: 0;
  border-radius: 6px;
  transition: color 150ms;
}

.modal-close-btn:hover {
  color: #ffffff;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

.modal-exercise-group {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid oklch(15% 0.008 45);
}

.modal-exercise-group:last-of-type {
  border-bottom: none;
  margin-bottom: 8px;
}

.group-exercise-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.group-exercise-title {
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  font-size: 0.9375rem;
  color: #f5f5f5;
  margin: 0;
  font-weight: 600;
}

.last-weight-badge {
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  font-size: 0.6875rem;
  color: #4ade80;
  background: oklch(14% 0.008 45);
  border: 1px solid #4ade8044;
  padding: 3px 8px;
  border-radius: 4px;
}

.set-grid-header {
  display: grid;
  grid-template-columns: 36px 1fr 1fr;
  gap: 10px;
  margin-bottom: 8px;
  padding: 0 4px;
}

.col-label {
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  font-size: 0.6875rem;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #a3a3a3;
  font-weight: 600;
}

.col-set {
  text-align: center;
}

.set-card-row {
  background: oklch(9% 0.012 45);
  border: 1px solid oklch(16% 0.008 45);
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
}

.set-input-row {
  display: grid;
  grid-template-columns: 36px 1fr 1fr;
  gap: 10px;
  align-items: center;
}

.set-number-label {
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  font-size: 0.8125rem;
  color: #a3a3a3;
  text-align: center;
  font-weight: 700;
}

.input-wrapper {
  position: relative;
}

.stepper-input-container {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stepper-btn-mini {
  min-width: 36px;
  min-height: 44px;
  padding: 0 4px;
  background: oklch(14% 0.008 45);
  border: 1px solid oklch(22% 0.008 45);
  border-radius: 6px;
  color: #d4d4d4;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 120ms ease-out;
}

.stepper-btn-mini.stepper-btn-weight {
  font-size: 0.8125rem;
  font-weight: 700;
}

.stepper-btn-mini:hover {
  background: oklch(18% 0.008 45);
  border-color: oklch(30% 0.008 45);
  color: #ffffff;
}

.stepper-btn-mini:active {
  transform: scale(0.96);
}

.modal-input {
  width: 100%;
  min-height: 46px;
  padding: 10px 8px;
  background: oklch(8% 0.012 45);
  border: 1px solid oklch(22% 0.008 45);
  border-radius: 8px;
  color: #ffffff;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  font-size: 16px; /* Essential: prevents iOS viewport zoom on focus */
  font-variant-numeric: tabular-nums;
  -moz-appearance: textfield;
  box-sizing: border-box;
  text-align: center;
  transition: border-color 150ms;
}

.modal-input::-webkit-outer-spin-button,
.modal-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.modal-input:focus {
  outline: none;
  border-color: #4ade80;
  box-shadow: 0 0 0 2px rgba(74, 222, 128, 0.2);
}

.modal-input::placeholder {
  color: #737373;
}

.modal-helper-text {
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  font-size: 0.75rem;
  color: #a3a3a3;
  margin-top: 8px;
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid oklch(16% 0.008 45);
}

.modal-btn-fast-log {
  width: 100%;
  min-height: 48px;
  padding: 12px 18px;
  background: #22c55e;
  border: 1px solid #4ade80;
  border-radius: 8px;
  color: #000000;
  cursor: pointer;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  font-size: 0.875rem;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 2px 12px rgba(34, 197, 94, 0.35);
  transition: all 150ms ease-out;
}

.modal-btn-fast-log:hover:not(:disabled) {
  background: #16a34a;
  box-shadow: 0 4px 18px rgba(34, 197, 94, 0.5);
  transform: translateY(-1px);
}

.modal-btn-fast-log:disabled {
  opacity: 0.5;
  cursor: wait;
}

.fast-log-icon {
  font-size: 1rem;
}

.modal-footer-secondary-row {
  display: flex;
  gap: 10px;
}

.modal-btn-primary {
  flex: 1;
  min-height: 48px;
  padding: 12px 20px;
  background: #ffffff;
  border: 1px solid #ffffff;
  border-radius: 8px;
  color: #000000;
  cursor: pointer;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  transition: background 150ms;
}

.modal-btn-primary:hover:not(:disabled) {
  background: #e5e5e5;
}

.modal-btn-primary:disabled {
  opacity: 0.5;
  cursor: wait;
}

.modal-btn-secondary {
  min-height: 48px;
  min-width: 90px;
  padding: 12px 18px;
  background: transparent;
  border: 1px solid oklch(22% 0.008 45);
  border-radius: 8px;
  color: #a3a3a3;
  cursor: pointer;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  transition: all 150ms;
}

.modal-btn-secondary:hover {
  color: #ffffff;
  border-color: oklch(30% 0.008 45);
}

/* ── Transitions ─────────────────────────────────────────── */
.phase-switch-enter-active {
  transition:
    opacity 180ms ease-out,
    transform 180ms cubic-bezier(0.25, 1, 0.5, 1);
}
.phase-switch-leave-active {
  transition: opacity 100ms ease-in;
}
.phase-switch-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.phase-switch-leave-to {
  opacity: 0;
}

.accordion-enter-active {
  transition:
    opacity 200ms ease-out,
    transform 200ms cubic-bezier(0.25, 1, 0.5, 1);
}
.accordion-leave-active {
  transition: opacity 120ms ease-in;
}
.accordion-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
.accordion-leave-to {
  opacity: 0;
}

.reveal-enter-active {
  transition: opacity 150ms ease-out;
}
.reveal-leave-active {
  transition: opacity 100ms ease-in;
}
.reveal-enter-from,
.reveal-leave-to {
  opacity: 0;
}

.modal-fade-enter-active {
  transition: opacity 180ms ease-out;
}
.modal-fade-leave-active {
  transition: opacity 140ms ease-in;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.export-badge-btn {
  cursor: pointer;
  background: oklch(14% 0.008 45);
  color: #f5f5f5;
  border-color: oklch(24% 0.008 45);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  min-height: 44px;
  padding: 8px 14px;
  transition: all 150ms ease-out;
}
.export-badge-btn:hover {
  background: oklch(18% 0.008 45);
  border-color: oklch(30% 0.008 45);
  color: #ffffff;
}

/* ── Rest Timer Bar ────────────────────────────────────────── */
.rest-timer-bar {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 40;
  background: oklch(9% 0.012 45);
  border-top: 1px solid oklch(20% 0.008 45);
  padding: 10px 16px;
  backdrop-filter: blur(12px);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4);
}
.rest-timer-inner {
  max-width: 640px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.rest-timer-display {
  display: flex;
  flex-direction: column;
}
.rest-timer-label {
  font-size: 10px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #a3a3a3;
  font-weight: 600;
}
.rest-timer-digits {
  font-size: 1.25rem;
  font-weight: 700;
  color: #4ade80;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}
.rest-timer-display.isZero .rest-timer-digits {
  color: #f87171;
}
.rest-timer-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.timer-ctrl-btn {
  min-height: 44px;
  min-width: 60px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
}
.timer-btn-start {
  background: #166534;
  border: 1px solid #22c55e;
  color: #ffffff;
}
.timer-btn-pause {
  background: oklch(18% 0.008 45);
  border: 1px solid oklch(28% 0.008 45);
  color: #f5f5f5;
}
.timer-preset-btn {
  min-height: 44px;
  min-width: 44px;
  padding: 8px 12px;
  background: oklch(14% 0.008 45);
  border: 1px solid oklch(24% 0.008 45);
  border-radius: 20px;
  color: #d4d4d4;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.timer-preset-btn:hover {
  background: oklch(18% 0.008 45);
  color: #ffffff;
}
.timer-reset-btn {
  min-height: 44px;
  min-width: 50px;
  padding: 8px 12px;
  background: transparent;
  border: 1px solid oklch(20% 0.008 45);
  border-radius: 20px;
  color: #a3a3a3;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
