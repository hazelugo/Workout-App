<template>
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
      8-Week Program
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
      Build From Zero
    </h1>
    <p style="font-size: 0.875rem; color: #888; margin-top: 8px; font-style: italic">
      Home &amp; Gym Tracks · 5 days/week · 20–30 min
    </p>
    <div style="display: flex; gap: 20px; justify-content: center; margin-top: 12px">
      <span style="font-size: 12px; color: #888">🏠 Home</span>
      <span style="font-size: 12px; color: #888">🏋️ Gym</span>
      <span style="font-size: 12px; color: #888">🔗 Tap exercise name for demo</span>
    </div>
  </div>
  <div v-if="!showOnboarding" class="phase-tabs" style="display: flex; border-bottom: 1px solid oklch(15% 0.008 45)">
    <button
      v-for="(p, i) in program.phases"
      :key="p.id"
      @click="selectPhase(i)"
      :style="{
        flex: 1,
        padding: '14px 8px',
        background: activePhase === i ? 'oklch(11.5% 0.008 45)' : 'transparent',
        border: 'none',
        borderBottom: activePhase === i ? `2px solid ${p.color}` : '2px solid transparent',
        color: activePhase === i ? p.color : '#777',
        cursor: 'pointer',
        fontSize: '11px',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        transition: 'color 0.15s, border-color 0.15s, background 0.15s',
      }"
    >
      <div style="font-weight: 700">{{ p.name }}</div>
      <div style="font-size: 10px; margin-top: 2px; opacity: 0.7">{{ p.weeks }}</div>
    </button>
  </div>
  <div
    v-if="showOnboarding"
    :style="{
      maxWidth: isDesktop ? '480px' : '100%',
      margin: '56px auto',
      padding: '0 24px',
      textAlign: 'center',
    }"
  >
    <div style="font-size: 40px; margin-bottom: 24px; line-height: 1">🏋️</div>
    <h2
      style="
        font-size: 1.5rem;
        font-weight: 400;
        color: oklch(96% 0.005 45);
        margin: 0 0 10px;
        letter-spacing: -0.5px;
      "
    >
      Welcome{{ authStore.profile?.display_name ? ', ' + authStore.profile.display_name.split(' ')[0] : '' }}
    </h2>
    <p style="color: #888; font-size: 0.9375rem; margin: 0 0 36px; line-height: 1.6">
      You don't have a program yet. Start with our recommended plan or build your own.
    </p>

    <button
      @click="handleAdoptProgram"
      :disabled="adopting"
      style="
        display: block;
        width: 100%;
        padding: 16px 20px;
        background: oklch(11.5% 0.008 45);
        border: 1px solid oklch(22% 0.008 45);
        border-left: 3px solid #4ade80;
        border-radius: 8px;
        cursor: pointer;
        text-align: left;
        margin-bottom: 10px;
        opacity: 1;
        transition: opacity 0.15s;
      "
    >
      <div style="color: #4ade80; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px">
        Recommended
      </div>
      <div style="color: oklch(96% 0.005 45); font-size: 1rem; margin-bottom: 4px">
        Build From Zero — 8 Week Program
      </div>
      <div style="color: #666; font-size: 0.8125rem">
        Home &amp; Gym Tracks · 5 days/week · 20–30 min
      </div>
    </button>

    <button
      @click="handleBuildOwn"
      :disabled="adopting"
      style="
        display: block;
        width: 100%;
        padding: 14px 20px;
        background: transparent;
        border: 1px solid oklch(17% 0.008 45);
        border-radius: 8px;
        cursor: pointer;
        color: #666;
        font-size: 0.875rem;
        text-align: center;
      "
    >
      Build my own program
    </button>
  </div>
  <Transition name="reveal">
    <div
      v-if="!firstRunSeen && !showOnboarding"
      :style="{
        maxWidth: isDesktop ? '860px' : '640px',
        margin: '14px auto 0',
        padding: '0 16px',
      }"
    >
      <div
        style="
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding: 11px 14px;
          background: oklch(10% 0.01 45);
          border: 1px solid oklch(17% 0.008 45);
          border-left: 3px solid #4ade80;
          border-radius: 6px;
          font-size: 12px;
          line-height: 1.6;
          color: #888;
        "
      >
        <span>
          <span style="color: #4ade80; font-weight: 700; letter-spacing: 0.5px">Start at Week 1.</span>
          Open any day to see your exercises. Tap an exercise name to watch a demo video.
        </span>
        <button
          @click="dismissFirstRun"
          aria-label="Dismiss"
          style="
            background: transparent;
            border: none;
            color: #555;
            cursor: pointer;
            font-size: 16px;
            line-height: 1;
            padding: 0;
            flex-shrink: 0;
            margin-top: 1px;
          "
        >×</button>
      </div>
    </div>
  </Transition>
  <Transition v-if="!showOnboarding" name="phase-switch" mode="out-in">
  <div :key="activePhase">
  <div :style="{ padding: '14px 20px 4px', maxWidth: isDesktop ? '860px' : '640px', margin: '0 auto' }">
    <div style="display: flex; align-items: center; gap: 10px">
      <div
        :style="{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: phase.color,
          flexShrink: 0,
        }"
      />
      <span style="color: #888; font-size: 12px; font-style: italic">{{ phase.subtitle }}</span>
    </div>
  </div>
  <div :style="{ maxWidth: isDesktop ? '860px' : '640px', margin: '8px auto 0', padding: '0 16px' }">
    <div
      v-for="(d, i) in phase.days"
      :key="d.day"
      :style="{
        marginBottom: '8px',
        border: expandedDay === i ? `1px solid ${phase.color}44` : '1px solid oklch(17% 0.008 45)',
        borderRadius: '8px',
        overflow: 'hidden',
        transition: 'border-color 220ms ease-out',
      }"
    >
      <button
        @click="toggleDay(i)"
        class="day-header-btn"
        :aria-expanded="isDesktop ? undefined : expandedDay === i"
        :aria-label="`${d.day}: ${d.label}${!isDesktop ? ` — ${expandedDay === i ? 'collapse' : 'expand'}` : ''}`"
        :style="{
          width: '100%',
          padding: '13px 16px',
          background: expandedDay === i ? 'oklch(11.5% 0.008 45)' : 'oklch(10% 0.01 45)',
          border: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          color: '#e8e8e8',
          transition: 'background 180ms ease-out',
        }"
      >
        <div style="display: flex; gap: 10px; align-items: center">
          <span
            style="
              font-size: 11px;
              color: #777;
              letter-spacing: 2px;
              text-transform: uppercase;
              min-width: 72px;
              text-align: left;
            "
          >
            {{ d.day }}
          </span>
          <span
            :style="{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '20px',
              background: `${phase.color}18`,
              color: phase.color,
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }"
            >{{ d.label }}</span
          >
          <span v-if="!d.gym" style="font-size: 10px; color: #666">🏠 only</span>
          <span
            v-if="d.day === today"
            :style="{
              fontSize: '9px',
              padding: '2px 6px',
              borderRadius: '20px',
              background: `${phase.color}22`,
              color: phase.color,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              fontWeight: 700,
            }"
          >Today</span>
        </div>
        <span
          v-if="!isDesktop"
          aria-hidden="true"
          style="color: #888; font-size: 18px; line-height: 1"
        >{{ expandedDay === i ? '−' : '+' }}</span>
      </button>
      <Transition name="reveal">
      <div
        v-if="(isDesktop || expandedDay === i) && d.gym"
        style="display: flex; background: oklch(8% 0.012 45); border-bottom: 1px solid oklch(15% 0.008 45)"
      >
        <button
          v-for="t in ['home', 'gym']"
          :key="t"
          @click="setDayTrack(i, t)"
          :style="{
            flex: 1,
            padding: '9px 8px',
            background: getTrack(i, true) === t ? 'oklch(13% 0.008 45)' : 'transparent',
            border: 'none',
            borderBottom:
              getTrack(i, true) === t ? `2px solid ${phase.color}` : '2px solid transparent',
            color: getTrack(i, true) === t ? '#e8e8e8' : '#777',
            cursor: 'pointer',
            fontSize: '11px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            transition: 'color 0.15s, border-color 0.15s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }"
        >
          {{ t === 'home' ? '🏠' : '🏋️' }} {{ t }}
        </button>
      </div>
      </Transition>
      <Transition name="accordion">
      <div v-if="isDesktop || expandedDay === i" style="padding: 0 16px 16px; background: oklch(10% 0.01 45)">
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
              v-for="(ex, j) in getExercises(i, d)"
              :key="j"
              style="border-top: 1px solid oklch(15% 0.008 45)"
            >
              <td style="padding: 10px 8px 10px 0">
                <a
                  v-if="ex.link"
                  :href="ex.link"
                  target="_blank"
                  rel="noopener noreferrer"
                  :style="{
                    color: phase.color,
                    textDecoration: 'none',
                    borderBottom: `1px dashed ${phase.color}66`,
                    paddingBottom: '1px',
                    fontSize: '0.875rem',
                  }"
                  >{{ ex.name }} ↗</a
                >
                <span v-else style="color: #e8e8e8">{{ ex.name }}</span>
                <div
                  v-if="ex.note"
                  style="color: #777; font-size: 0.6875rem; line-height: 1.5; margin-top: 3px; font-style: italic"
                >
                  {{ ex.note }}
                </div>
              </td>
              <td
                :style="{
                  textAlign: 'center',
                  color: phase.color,
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                  padding: '10px 4px',
                }"
              >
                {{ ex.sets }}
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
                {{ ex.reps }}
              </td>
            </tr>
          </tbody>
        </table>
        <div style="padding-top: 12px; display: flex; align-items: center; gap: 10px">
          <button
            @click="logWorkout(i, d)"
            :disabled="loggingDay === i"
            :style="{
              padding: '9px 16px',
              background:
                loggedDay === i || queuedDay === i ? `${phase.color}22` : 'transparent',
              border: `1px solid ${loggedDay === i || queuedDay === i ? phase.color : 'oklch(22% 0.008 45)'}`,
              borderRadius: '6px',
              color: loggedDay === i || queuedDay === i ? phase.color : '#888',
              cursor: loggingDay === i ? 'wait' : 'pointer',
              fontSize: '11px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              transition: 'color 150ms ease-out, border-color 150ms ease-out, background 150ms ease-out',
            }"
          >
            {{
              loggingDay === i
                ? 'Saving…'
                : loggedDay === i
                  ? 'Logged ✓'
                  : queuedDay === i
                    ? 'Queued ✓'
                    : 'Log workout'
            }}
          </button>
          <RouterLink
            v-if="loggedDay === i"
            to="/history"
            style="font-size: 11px; color: #666; text-decoration: none; letter-spacing: 0.5px"
          >
            View history →
          </RouterLink>
          <span
            v-if="queuedDay === i && !connectivity.isOnline"
            style="font-size: 11px; color: #facc15"
          >
            Saved offline — will sync when online
          </span>
          <span v-if="logError === i" style="font-size: 11px; color: #f87171">{{ logErrorMsg }}</span>
        </div>
      </div>
      </Transition>
    </div>
  </div>

  </div>
  </Transition>
  <div v-if="!showOnboarding" :style="{ maxWidth: isDesktop ? '860px' : '640px', margin: '20px auto 0', padding: '0 16px' }">
    <div
      style="
        font-size: 10px;
        letter-spacing: 3px;
        color: #666;
        text-transform: uppercase;
        margin-bottom: 10px;
      "
    >
      Gym Substitutions
    </div>
    <div
      style="
        padding: 14px 16px;
        border: 1px dashed oklch(22% 0.008 45);
        border-radius: 6px;
        font-size: 12px;
        line-height: 1.9;
        color: #888;
      "
    >
      <div v-for="(sub, i) in subs" :key="i">
        <span style="color: #aaa">{{ sub[0] }}</span>
        <span style="color: #555; margin: 0 8px">→</span>
        <span style="color: #888">{{ sub[1] }}</span>
      </div>
    </div>
  </div>
  <div v-if="!showOnboarding" :style="{ maxWidth: isDesktop ? '860px' : '640px', margin: '20px auto 0', padding: '0 16px' }">
    <div
      style="
        font-size: 10px;
        letter-spacing: 3px;
        color: #666;
        text-transform: uppercase;
        margin-bottom: 10px;
      "
    >
      Keys to Success
    </div>
    <div class="tips-grid">
      <div
        v-for="(t, i) in tips"
        :key="i"
        :style="{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
          padding: '12px 14px',
          background: 'oklch(10% 0.01 45)',
          borderRadius: '6px',
          border: '1px solid oklch(17% 0.008 45)',
          borderLeft: `3px solid ${phase.color}88`,
          fontSize: '0.875rem',
          lineHeight: 1.5,
          color: '#888',
          transition: 'border-left-color 300ms ease-out',
        }"
      >
        <span style="font-size: 16px; line-height: 1.4">{{ t.icon }}</span>
        <span>{{ t.text }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useConnectivityStore } from '@/stores/connectivity'
import { supabase } from '@/lib/supabase'
import { buildSetLogs } from '@/lib/workout'
import { enqueueWorkout, isNetworkError } from '@/lib/offlineQueue'
import { queryClient } from '@/lib/queryClient'
import { invalidateWorkoutHistory } from '@/queries/history'
import { program, tips, subs, WEEKDAYS } from '@/data/program'

const authStore = useAuthStore()
const connectivity = useConnectivityStore()
const router = useRouter()

const showOnboarding = computed(() =>
  authStore.isAuthenticated &&
  authStore.profile !== null &&
  authStore.profile.program_adopted === false,
)

const adopting = ref(false)

async function handleAdoptProgram() {
  adopting.value = true
  await authStore.adoptProgram()
  adopting.value = false
}

async function handleBuildOwn() {
  await authStore.adoptProgram()
  router.push('/custom')
}

const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
const todayIndex = WEEKDAYS.indexOf(today)

const activePhase = ref(0)
const expandedDay = ref(todayIndex >= 0 ? todayIndex : 0)
const track = ref({})

const _onboardKey = `onboard-v1-${authStore.user?.id ?? 'anon'}`
const firstRunSeen = ref(localStorage.getItem(_onboardKey) === '1')
function dismissFirstRun() {
  firstRunSeen.value = true
  localStorage.setItem(_onboardKey, '1')
}

const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 375)
const isDesktop = computed(() => windowWidth.value >= 900)
function onResize() { windowWidth.value = window.innerWidth }

const phase = computed(() => program.phases[activePhase.value])

function selectPhase(i) {
  activePhase.value = i
  expandedDay.value = 0
}

function toggleDay(i) {
  if (isDesktop.value) {
    expandedDay.value = i // select/highlight only — no collapsing on desktop
  } else {
    expandedDay.value = expandedDay.value === i ? -1 : i
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

async function queueWorkoutOffline(dayIndex, sessionPayload, exercises) {
  await enqueueWorkout(authStore.user.id, sessionPayload, exercises)
  await connectivity.onWorkoutQueued()
  loggingDay.value = null
  queuedDay.value = dayIndex
  clearTimeout(_queuedTimer)
  _queuedTimer = setTimeout(() => {
    if (queuedDay.value === dayIndex) queuedDay.value = null
  }, 4000)
}

async function logWorkout(dayIndex, day) {
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
    await queueWorkoutOffline(dayIndex, sessionPayload, exercises)
    return
  }

  const { data: session, error } = await supabase
    .from('workout_sessions')
    .insert(sessionPayload)
    .select('id')
    .single()

  if (error) {
    if (isNetworkError(error)) {
      await queueWorkoutOffline(dayIndex, sessionPayload, exercises)
      return
    }
    logError.value = dayIndex
    logErrorMsg.value = error.message
    loggingDay.value = null
    return
  }

  const setLogs = buildSetLogs(session.id, exercises)
  if (setLogs.length) {
    const { error: setsError } = await supabase.from('set_logs').insert(setLogs)
    if (setsError) {
      if (isNetworkError(setsError)) {
        await supabase.from('workout_sessions').delete().eq('id', session.id)
        await queueWorkoutOffline(dayIndex, sessionPayload, exercises)
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

const _weekKey = computed(() => `program-week-${authStore.user?.id ?? 'anon'}`)
const currentWeek = ref(1)
onMounted(() => {
  window.addEventListener('resize', onResize, { passive: true })
  const saved = localStorage.getItem(_weekKey.value)
  if (saved) {
    const n = parseInt(saved, 10)
    if (n >= 1 && n <= 8) currentWeek.value = n
  }
})
onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  clearTimeout(_loggedTimer)
  clearTimeout(_queuedTimer)
})
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

/* Phase switch — content fades + rises when switching phases */
.phase-switch-enter-active {
  transition: opacity 180ms ease-out, transform 180ms cubic-bezier(0.25, 1, 0.5, 1);
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

/* Accordion — exercise content fades in from above */
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

/* Reveal — track toggle fades in */
.reveal-enter-active {
  transition: opacity 160ms ease-out;
}
.reveal-leave-active {
  transition: opacity 100ms ease-in;
}
.reveal-enter-from,
.reveal-leave-to {
  opacity: 0;
}

/* ── Desktop adaptations ─────────────────────────────────── */

/* Phase tabs: sticky so you can switch phases while scrolling the week */
.phase-tabs {
  position: sticky;
  top: 0;
  z-index: 10;
  background: oklch(8% 0.012 45);
}

/* Day header hover feedback (desktop) */
@media (min-width: 900px) {
  .day-header-btn:hover {
    filter: brightness(1.1);
  }
}

/* Tips: 2-column grid on desktop */
.tips-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (min-width: 900px) {
  .tips-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}
</style>
