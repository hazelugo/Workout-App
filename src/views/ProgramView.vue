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

  <!-- Phase Tabs -->
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

  <!-- Onboarding empty state -->
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

  <!-- First-run orientation strip -->
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

  <!-- Phase-dependent content: subtitle + days -->
  <Transition v-if="!showOnboarding" name="phase-switch" mode="out-in">
  <div :key="activePhase">

  <!-- Phase Subtitle -->
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

  <!-- Days -->
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
      <!-- Day Header Button -->
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

      <!-- Home / Gym Track Toggle -->
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

      <!-- Exercise Table -->
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
      </div>
      </Transition>
    </div>
  </div>

  </div>
  </Transition>

  <!-- Gym Substitutions -->
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

  <!-- Keys to Success -->
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


// ─── Auth / Onboarding ────────────────────────────────────────────────────────

const authStore = useAuthStore()
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const yt = (q) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(q + ' exercise demonstration')}`

// ─── Data ─────────────────────────────────────────────────────────────────────

const program = {
  phases: [
    {
      id: 1,
      name: 'Foundation',
      weeks: 'Weeks 1–2',
      subtitle: 'Advanced bodyweight — no equipment needed',
      color: '#4ade80',
      days: [
        {
          day: 'Monday',
          label: 'Push',
          home: [
            {
              name: 'Archer Push-Up',
              sets: '3',
              reps: '6/side',
              note: 'One arm nearly straight, load shifts to working side',
              link: yt('archer push-up'),
            },
            {
              name: 'Pike Push-Up with 3s Negative',
              sets: '3',
              reps: '8',
              note: '3 seconds down, explode up',
              link: yt('pike push-up'),
            },
            {
              name: 'Parallel Dips (2 chairs) with pause',
              sets: '3',
              reps: '8',
              note: '1 second pause at bottom, elbows at 90°',
              link: yt('parallel dips between chairs'),
            },
          ],
          gym: null,
        },
        {
          day: 'Tuesday',
          label: 'Walk + Core',
          home: [
            {
              name: 'Brisk Walk',
              sets: '1',
              reps: '2 miles',
              note: 'Faster than a stroll — you should be breathing',
              link: null,
            },
            {
              name: 'Hollow Body Hold',
              sets: '3',
              reps: '30s',
              note: 'Lower back pressed flat, arms overhead, legs low',
              link: yt('hollow body hold'),
            },
            {
              name: 'RKC Plank',
              sets: '3',
              reps: '20s',
              note: 'Squeeze everything — glutes, abs, fists. Harder than it sounds.',
              link: yt('RKC plank'),
            },
            {
              name: 'Dead Bug',
              sets: '3',
              reps: '10/side',
              note: 'Slow and controlled, back stays flat',
              link: yt('dead bug exercise'),
            },
          ],
          gym: null,
        },
        {
          day: 'Wednesday',
          label: 'Pull + Legs',
          home: [
            {
              name: 'Inverted Row (under table)',
              sets: '4',
              reps: '10',
              note: 'Chest to table edge, body straight as a board',
              link: yt('inverted row under table'),
            },
            {
              name: 'Bulgarian Split Squat',
              sets: '3',
              reps: '8/leg',
              note: 'Rear foot elevated on chair, front knee tracks over toes',
              link: yt('Bulgarian split squat bodyweight'),
            },
            {
              name: 'Jump Squat',
              sets: '3',
              reps: '10',
              note: 'Land soft — absorb with bent knees, not stiff legs',
              link: yt('jump squat'),
            },
            {
              name: 'Glute Bridge with 2s hold',
              sets: '3',
              reps: '12',
              note: 'Squeeze at top for 2 seconds each rep',
              link: yt('glute bridge'),
            },
          ],
          gym: null,
        },
        {
          day: 'Thursday',
          label: 'Walk + Mobility',
          home: [
            { name: 'Brisk Walk', sets: '1', reps: '2 miles', note: '', link: null },
            {
              name: "World's Greatest Stretch",
              sets: '3',
              reps: '5/side',
              note: 'Lunge, elbow to floor, rotate — full sequence',
              link: yt("world's greatest stretch"),
            },
            {
              name: 'Hip 90/90 Stretch',
              sets: '2',
              reps: '60s/side',
              note: 'Hips from all the sitting',
              link: yt('hip 90 90 stretch'),
            },
            {
              name: 'Thoracic Extension over Chair',
              sets: '2',
              reps: '10',
              note: 'Drape upper back over chair back, arms overhead',
              link: yt('thoracic extension chair'),
            },
          ],
          gym: null,
        },
        {
          day: 'Friday',
          label: 'Full Body',
          home: [
            {
              name: 'Archer Push-Up',
              sets: '3',
              reps: '6/side',
              note: '',
              link: yt('archer push-up'),
            },
            {
              name: 'Inverted Row',
              sets: '3',
              reps: '10',
              note: '',
              link: yt('inverted row under table'),
            },
            {
              name: 'Bulgarian Split Squat',
              sets: '3',
              reps: '8/leg',
              note: '',
              link: yt('Bulgarian split squat bodyweight'),
            },
            {
              name: 'Hollow Body Hold',
              sets: '3',
              reps: '30s',
              note: '',
              link: yt('hollow body hold'),
            },
          ],
          gym: null,
        },
      ],
    },
    {
      id: 2,
      name: 'Build',
      weeks: 'Weeks 3–4',
      subtitle: 'Harder bodyweight + intro to gym',
      color: '#facc15',
      days: [
        {
          day: 'Monday',
          label: 'Upper A',
          home: [
            {
              name: 'Pseudo Planche Push-Up',
              sets: '3',
              reps: '8',
              note: 'Hands at hips level, lean forward — serious shoulder load',
              link: yt('pseudo planche push-up'),
            },
            {
              name: 'Pike Push-Up with 4s Negative',
              sets: '3',
              reps: '8',
              note: '4 seconds down now',
              link: yt('pike push-up'),
            },
            {
              name: 'Parallel Dips — max reps',
              sets: '3',
              reps: 'to failure',
              note: 'Controlled failure, no bouncing at bottom',
              link: yt('parallel dips between chairs'),
            },
          ],
          gym: [
            {
              name: 'Barbell Back Squat',
              sets: '3',
              reps: '5–8',
              note: 'Start light — form first, load second',
              link: yt('barbell back squat form'),
            },
            {
              name: 'DB Row',
              sets: '2',
              reps: '5–8/arm',
              note: 'Brace knee on bench, full stretch at bottom',
              link: yt('dumbbell row'),
            },
            {
              name: 'DB Incline Bench Press',
              sets: '2',
              reps: '5–8',
              note: '',
              link: yt('dumbbell incline bench press'),
            },
            {
              name: 'Prone DB Row',
              sets: '2',
              reps: '5–8',
              note: 'Lie face-down on incline bench, row both DBs',
              link: yt('prone dumbbell row incline bench'),
            },
            {
              name: 'Cuban Press',
              sets: '3',
              reps: '8–10',
              note: 'Light DBs — external rotation then overhead press',
              link: yt('Cuban press exercise'),
            },
            {
              name: 'Incline DB Curl',
              sets: '2',
              reps: '5–8',
              note: 'Arms hang behind torso — full bicep stretch',
              link: yt('incline dumbbell curl'),
            },
          ],
        },
        {
          day: 'Tuesday',
          label: 'Walk + Core',
          home: [
            { name: 'Walk', sets: '1', reps: '2.5 miles', note: '', link: null },
            {
              name: 'Hollow Body Hold',
              sets: '3',
              reps: '40s',
              note: '',
              link: yt('hollow body hold'),
            },
            { name: 'RKC Plank', sets: '3', reps: '25s', note: '', link: yt('RKC plank') },
            {
              name: 'Hanging Leg Raise (or lying)',
              sets: '3',
              reps: '12',
              note: 'If no bar, do lying leg raises — slow, back flat',
              link: yt('hanging leg raise'),
            },
          ],
          gym: null,
        },
        {
          day: 'Wednesday',
          label: 'Lower + Shoulders',
          home: [
            {
              name: 'Shrimp Squat (assisted)',
              sets: '3',
              reps: '6/leg',
              note: 'Hold a doorframe for balance — one leg, rear foot held behind',
              link: yt('shrimp squat assisted'),
            },
            {
              name: 'Nordic Curl Negative (under couch)',
              sets: '3',
              reps: '5',
              note: 'Anchor feet, lower yourself as slowly as possible',
              link: yt('nordic curl negative'),
            },
            {
              name: 'Inverted Row — feet elevated',
              sets: '3',
              reps: '10',
              note: 'Feet on chair, body more horizontal = harder',
              link: yt('inverted row feet elevated'),
            },
          ],
          gym: [
            {
              name: 'DB Romanian Deadlift',
              sets: '2',
              reps: '5',
              note: 'Hinge at hips, feel the hamstring stretch',
              link: yt('dumbbell Romanian deadlift'),
            },
            {
              name: 'DB Overhead Press',
              sets: '2',
              reps: '5–8',
              note: '',
              link: yt('dumbbell overhead press'),
            },
            {
              name: 'Deficit Push-Up',
              sets: '2',
              reps: 'to failure',
              note: 'Hands on plates or books — chest drops below hand level',
              link: yt('deficit push-up'),
            },
            {
              name: 'Bulgarian Split Squat',
              sets: '2',
              reps: '5–8/leg',
              note: 'Rear foot on bench',
              link: yt('Bulgarian split squat'),
            },
            {
              name: 'Calf Raises',
              sets: '4',
              reps: '5–8',
              note: 'Stand on step edge for full range of motion',
              link: yt('calf raises step'),
            },
          ],
        },
        {
          day: 'Thursday',
          label: 'Walk + Mobility',
          home: [
            { name: 'Walk', sets: '1', reps: '2.5 miles', note: '', link: null },
            {
              name: 'Couch Stretch',
              sets: '2',
              reps: '60s/side',
              note: 'Hip flexors — essential after desk work',
              link: yt('couch stretch hip flexor'),
            },
            {
              name: 'Hip 90/90 with rotation',
              sets: '2',
              reps: '8/side',
              note: '',
              link: yt('90 90 hip stretch rotation'),
            },
            {
              name: 'Cat-Cow',
              sets: '2',
              reps: '12',
              note: 'Slow — spinal health',
              link: yt('cat cow stretch'),
            },
          ],
          gym: null,
        },
        {
          day: 'Friday',
          label: 'Upper B',
          home: [
            {
              name: 'Pseudo Planche Push-Up',
              sets: '3',
              reps: '8',
              note: '',
              link: yt('pseudo planche push-up'),
            },
            {
              name: 'Inverted Row — feet elevated',
              sets: '3',
              reps: '10',
              note: '',
              link: yt('inverted row feet elevated'),
            },
            {
              name: 'Hollow Body Hold',
              sets: '3',
              reps: '40s',
              note: '',
              link: yt('hollow body hold'),
            },
          ],
          gym: [
            { name: 'DB Row', sets: '2', reps: '5–8/arm', note: '', link: yt('dumbbell row') },
            {
              name: 'DB Incline Bench Press',
              sets: '2',
              reps: '5–8',
              note: '',
              link: yt('dumbbell incline bench press'),
            },
            {
              name: 'DB Lateral Raise',
              sets: '2',
              reps: 'to failure',
              note: 'Light — controlled arc, no swinging',
              link: yt('dumbbell lateral raise'),
            },
            {
              name: 'Tricep Overhead Extension',
              sets: '2',
              reps: '5–8',
              note: 'One DB, both hands, lower behind head',
              link: yt('tricep overhead extension dumbbell'),
            },
          ],
        },
      ],
    },
    {
      id: 3,
      name: 'Strength',
      weeks: 'Weeks 5–8',
      subtitle: 'Full gym program — progressive overload',
      color: '#f87171',
      days: [
        {
          day: 'Monday',
          label: 'Upper A',
          home: [
            {
              name: 'Archer Push-Up — slow negative',
              sets: '4',
              reps: '6/side',
              note: '4s down, explode up',
              link: yt('archer push-up'),
            },
            {
              name: 'Pseudo Planche Push-Up',
              sets: '3',
              reps: '10',
              note: '',
              link: yt('pseudo planche push-up'),
            },
            {
              name: 'Parallel Dips — weighted (backpack)',
              sets: '3',
              reps: '8',
              note: 'Add books to a backpack for load',
              link: yt('weighted dips'),
            },
          ],
          gym: [
            {
              name: 'Barbell Back Squat',
              sets: '3',
              reps: '5–8',
              note: 'Add weight each week — this is your primary lift',
              link: yt('barbell back squat form'),
            },
            { name: 'DB Row', sets: '2', reps: '5–8/arm', note: '', link: yt('dumbbell row') },
            {
              name: 'DB Incline Bench Press',
              sets: '2',
              reps: '5–8',
              note: '',
              link: yt('dumbbell incline bench press'),
            },
            {
              name: 'Prone DB Row',
              sets: '2',
              reps: '5–8',
              note: 'Face-down on incline bench',
              link: yt('prone dumbbell row incline bench'),
            },
            {
              name: 'Cuban Press',
              sets: '3',
              reps: '8–10',
              note: '',
              link: yt('Cuban press exercise'),
            },
            {
              name: 'Incline DB Curl',
              sets: '2',
              reps: '5–8',
              note: '',
              link: yt('incline dumbbell curl'),
            },
          ],
        },
        {
          day: 'Tuesday',
          label: 'Walk + Core',
          home: [
            {
              name: 'Walk',
              sets: '1',
              reps: '3 miles',
              note: 'Back to your original pace — should feel natural now',
              link: null,
            },
            {
              name: 'Hollow Body Hold',
              sets: '3',
              reps: '50s',
              note: '',
              link: yt('hollow body hold'),
            },
            { name: 'RKC Plank', sets: '3', reps: '30s', note: '', link: yt('RKC plank') },
            {
              name: 'Ab Wheel Rollout (or pike on floor)',
              sets: '3',
              reps: '10',
              note: 'If no wheel, do pike rollout on socks on hardwood',
              link: yt('ab wheel rollout'),
            },
          ],
          gym: null,
        },
        {
          day: 'Wednesday',
          label: 'Lower + Shoulders',
          home: [
            {
              name: 'Shrimp Squat (unassisted)',
              sets: '3',
              reps: '6/leg',
              note: 'No doorframe — balance on your own now',
              link: yt('shrimp squat'),
            },
            {
              name: 'Nordic Curl Negative',
              sets: '3',
              reps: '6',
              note: 'Anchor feet under couch, lower as slowly as possible',
              link: yt('nordic curl negative'),
            },
            {
              name: 'Pike Push-Up — feet elevated',
              sets: '3',
              reps: '10',
              note: 'Feet on chair — shifts more load to shoulders',
              link: yt('pike push-up feet elevated'),
            },
          ],
          gym: [
            {
              name: 'Barbell or DB Romanian Deadlift',
              sets: '2',
              reps: '5',
              note: 'Barbell preferred — load progressively',
              link: yt('Romanian deadlift barbell'),
            },
            {
              name: 'DB Overhead Press',
              sets: '2',
              reps: '5–8',
              note: '',
              link: yt('dumbbell overhead press'),
            },
            {
              name: 'Deficit Push-Up',
              sets: '2',
              reps: 'to failure',
              note: '',
              link: yt('deficit push-up'),
            },
            {
              name: 'Bulgarian Split Squat',
              sets: '2',
              reps: '5–8/leg',
              note: 'Hold DBs at sides as you progress',
              link: yt('Bulgarian split squat dumbbell'),
            },
            {
              name: 'Calf Raises',
              sets: '4',
              reps: '5–8',
              note: 'Hold a DB for added load',
              link: yt('weighted calf raises'),
            },
          ],
        },
        {
          day: 'Thursday',
          label: 'Walk + Mobility',
          home: [
            { name: 'Walk', sets: '1', reps: '3 miles', note: '', link: null },
            {
              name: 'Couch Stretch',
              sets: '2',
              reps: '90s/side',
              note: '',
              link: yt('couch stretch hip flexor'),
            },
            {
              name: "World's Greatest Stretch",
              sets: '3',
              reps: '5/side',
              note: '',
              link: yt("world's greatest stretch"),
            },
            {
              name: "Farmer's Carry (DBs)",
              sets: '3',
              reps: '40s',
              note: 'Walk holding both 25lb DBs, tall spine',
              link: yt("farmer's carry"),
            },
          ],
          gym: null,
        },
        {
          day: 'Friday',
          label: 'Upper B',
          home: [
            {
              name: 'Archer Push-Up — max reps',
              sets: '3',
              reps: 'to failure/side',
              note: '',
              link: yt('archer push-up'),
            },
            {
              name: 'Inverted Row — feet elevated, slow negative',
              sets: '3',
              reps: '10',
              note: '3s down',
              link: yt('inverted row feet elevated'),
            },
            { name: 'Shrimp Squat', sets: '3', reps: '8/leg', note: '', link: yt('shrimp squat') },
            {
              name: 'Hollow Body Hold',
              sets: '3',
              reps: '50s',
              note: '',
              link: yt('hollow body hold'),
            },
          ],
          gym: [
            { name: 'DB Row', sets: '2', reps: '5–8/arm', note: '', link: yt('dumbbell row') },
            {
              name: 'DB Incline Bench Press',
              sets: '2',
              reps: '5–8',
              note: '',
              link: yt('dumbbell incline bench press'),
            },
            {
              name: 'DB Lateral Raise',
              sets: '2',
              reps: 'to failure',
              note: '',
              link: yt('dumbbell lateral raise'),
            },
            {
              name: 'Tricep Overhead Extension',
              sets: '2',
              reps: '5–8',
              note: '',
              link: yt('tricep overhead extension dumbbell'),
            },
          ],
        },
      ],
    },
  ],
}

const tips = [
  { icon: '💤', text: "Sleep 7–8 hrs. That's when you grow." },
  { icon: '🥩', text: '0.7–1g protein per lb bodyweight daily.' },
  { icon: '📈', text: 'Add weight to barbell lifts weekly — even 5lbs counts.' },
  { icon: '🏠', text: 'Home day ≠ easy day. These are real progressions.' },
  { icon: '🎯', text: 'Miss a session? Pick up the next one. Never restart the week.' },
]

const subs = [
  ['Hack squat', 'Barbell back squat'],
  ['Lat pulldown', 'DB Row'],
  ['Chest-supported row', 'Prone DB Row (on incline bench)'],
  ['Leg extensions', 'Bulgarian split squat'],
  ['Preacher curl', 'Incline DB curl'],
]

// ─── State ────────────────────────────────────────────────────────────────────

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
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

// ─── Responsive ───────────────────────────────────────────────────────────────

const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 375)
const isDesktop = computed(() => windowWidth.value >= 900)
function onResize() { windowWidth.value = window.innerWidth }
onMounted(() => window.addEventListener('resize', onResize, { passive: true }))
onUnmounted(() => window.removeEventListener('resize', onResize))

// ─── Computed ─────────────────────────────────────────────────────────────────

const phase = computed(() => program.phases[activePhase.value])

// ─── Methods ──────────────────────────────────────────────────────────────────

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
