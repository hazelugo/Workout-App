# Workout Tracking — Plan 3: History View & Export

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the History view so users can see all past workout sessions, view personal records, and export their full history as CSV or PDF.

**Architecture:** A `history` store loads all sessions + set logs from Supabase on mount. `HistoryView.vue` renders sessions in reverse chronological order with expandable detail. CSV is generated client-side as a Blob download. PDF is generated with `jspdf`. Personal records are computed from the full set log dataset.

**Tech Stack:** Vue 3, Pinia, `@supabase/supabase-js`, `jspdf`, Vitest

---

**Spec:** `docs/superpowers/specs/2026-03-20-workout-tracking-design.md`

**Depends on:** Plan 1 (Foundation & Auth) — Supabase client and auth store must exist.

**This plan produces:** `/history` shows all past sessions, personal records, and working CSV + PDF export.

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/stores/history.js` | Load sessions from Supabase, compute records, export |
| Create | `src/utils/export.js` | CSV and PDF generation (pure, testable) |
| Modify | `src/views/HistoryView.vue` | Full history UI (replace placeholder) |
| Create | `src/tests/export.utils.test.js` | Unit tests for export formatting |

---

## Task 1: Install jspdf

**Files:** none (dependency)

- [ ] **Step 1: Install**

  ```bash
  npm install jspdf
  ```

- [ ] **Step 2: Verify install**

  ```bash
  node -e "import('jspdf').then(m => console.log('jspdf ok:', typeof m.default?.jsPDF))"
  ```

  Expected: `jspdf ok: function`

---

## Task 2: Export Utilities

Pure functions — no Vue, no Supabase. Easiest to test.

**Files:**
- Create: `src/utils/export.js`
- Create: `src/tests/export.utils.test.js`

- [ ] **Step 1: Write failing tests**

  ```js
  // src/tests/export.utils.test.js
  import { describe, it, expect } from 'vitest'
  import { buildCsvRows, formatDuration } from '@/utils/export'

  describe('buildCsvRows', () => {
    it('returns header row plus one row per set log', () => {
      const sessions = [
        {
          date: '2026-03-18',
          day_name: 'Wednesday',
          phase: 2,
          week: 3,
          track: 'gym',
          started_at: '2026-03-18T10:00:00Z',
          completed_at: '2026-03-18T10:45:00Z',
          set_logs: [
            { exercise_name: 'Squat', set_number: 1, reps_done: 8, weight_kg: 60 },
            { exercise_name: 'Squat', set_number: 2, reps_done: 8, weight_kg: 60 },
          ],
        },
      ]
      const rows = buildCsvRows(sessions)
      expect(rows[0]).toContain('Date')
      expect(rows[0]).toContain('Exercise')
      expect(rows[0]).toContain('Weight (kg)')
      expect(rows.length).toBe(3) // header + 2 set rows
      expect(rows[1]).toContain('2026-03-18')
      expect(rows[1]).toContain('Squat')
      expect(rows[1]).toContain('60')
    })

    it('handles null weight (bodyweight exercises)', () => {
      const sessions = [
        {
          date: '2026-03-18',
          day_name: 'Wednesday',
          phase: 1,
          week: 1,
          track: 'home',
          started_at: '2026-03-18T08:00:00Z',
          completed_at: null,
          set_logs: [
            { exercise_name: 'Push-up', set_number: 1, reps_done: 12, weight_kg: null },
          ],
        },
      ]
      const rows = buildCsvRows(sessions)
      expect(rows[1]).toContain('Push-up')
      expect(rows[1]).toContain('bodyweight')
    })
  })

  describe('formatDuration', () => {
    it('formats minutes correctly', () => {
      expect(formatDuration('2026-03-18T10:00:00Z', '2026-03-18T10:45:00Z')).toBe('45 min')
    })

    it('formats hours and minutes', () => {
      expect(formatDuration('2026-03-18T10:00:00Z', '2026-03-18T11:30:00Z')).toBe('1h 30 min')
    })

    it('returns null when completed_at is missing', () => {
      expect(formatDuration('2026-03-18T10:00:00Z', null)).toBeNull()
    })
  })
  ```

- [ ] **Step 2: Run tests — verify they fail**

  ```bash
  npm run test:unit -- src/tests/export.utils.test.js
  ```

  Expected: FAIL

- [ ] **Step 3: Write export utilities**

  ```js
  // src/utils/export.js

  /**
   * Build CSV rows from sessions array.
   * Returns an array of strings (each is a CSV row including the header).
   */
  export function buildCsvRows(sessions) {
    const header = 'Date,Day,Phase,Week,Track,Exercise,Set,Reps Done,Weight (kg)'
    const rows = [header]

    for (const session of sessions) {
      for (const log of session.set_logs ?? []) {
        const weight = log.weight_kg !== null && log.weight_kg !== undefined
          ? log.weight_kg
          : 'bodyweight'
        rows.push([
          session.date,
          session.day_name,
          session.phase,
          session.week,
          session.track,
          `"${log.exercise_name}"`,
          log.set_number,
          log.reps_done ?? '',
          weight,
        ].join(','))
      }
    }

    return rows
  }

  /**
   * Format duration between two ISO timestamps as a human-readable string.
   * Returns null if completed_at is absent.
   */
  export function formatDuration(startedAt, completedAt) {
    if (!completedAt) return null
    const diffMs = new Date(completedAt) - new Date(startedAt)
    const totalMinutes = Math.round(diffMs / 60000)
    if (totalMinutes < 60) return `${totalMinutes} min`
    const hours = Math.floor(totalMinutes / 60)
    const mins = totalMinutes % 60
    return mins > 0 ? `${hours}h ${mins} min` : `${hours}h`
  }

  /**
   * Trigger a client-side file download.
   */
  export function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  /**
   * Generate and download a CSV file from sessions.
   */
  export function exportCsv(sessions) {
    const rows = buildCsvRows(sessions)
    downloadFile(rows.join('\n'), 'workout-history.csv', 'text/csv')
  }

  /**
   * Generate and download a PDF training journal from sessions.
   * Requires jspdf.
   */
  export async function exportPdf(sessions, displayName) {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })

    const margin = 20
    const pageWidth = 210
    let y = margin

    // Title
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Training Journal', margin, y)
    y += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(120)
    doc.text(displayName ?? '', margin, y)
    doc.text(`Exported ${new Date().toLocaleDateString()}`, pageWidth - margin, y, { align: 'right' })
    y += 12

    doc.setDrawColor(200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8

    for (const session of sessions) {
      // Check for page overflow
      if (y > 260) {
        doc.addPage()
        y = margin
      }

      // Session header
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(40)
      const duration = formatDuration(session.started_at, session.completed_at)
      const headerRight = [
        `Phase ${session.phase} · Week ${session.week}`,
        session.track,
        duration ?? 'incomplete',
      ].join(' · ')
      doc.text(`${session.date} — ${session.day_name}`, margin, y)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(120)
      doc.text(headerRight, pageWidth - margin, y, { align: 'right' })
      y += 7

      // Group set_logs by exercise
      const byExercise = {}
      for (const log of session.set_logs ?? []) {
        if (!byExercise[log.exercise_name]) byExercise[log.exercise_name] = []
        byExercise[log.exercise_name].push(log)
      }

      for (const [exercise, logs] of Object.entries(byExercise)) {
        if (y > 270) { doc.addPage(); y = margin }
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(60)
        doc.text(exercise, margin + 4, y)

        const setStr = logs
          .map((l) => {
            const w = l.weight_kg !== null ? `${l.weight_kg}kg` : 'bw'
            return `${l.reps_done ?? '?'}×${w}`
          })
          .join('  ')
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100)
        doc.text(setStr, margin + 60, y)
        y += 6
      }

      y += 4
      doc.setDrawColor(220)
      doc.line(margin, y, pageWidth - margin, y)
      y += 6
    }

    doc.save('workout-history.pdf')
  }
  ```

- [ ] **Step 4: Run tests — verify they pass**

  ```bash
  npm run test:unit -- src/tests/export.utils.test.js
  ```

  Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

  ```bash
  git add src/utils/export.js src/tests/export.utils.test.js
  git commit -m "feat: add CSV and PDF export utilities with tests"
  ```

---

## Task 3: History Store

**Files:**
- Create: `src/stores/history.js`

- [ ] **Step 1: Write the history store**

  ```js
  // src/stores/history.js
  import { defineStore } from 'pinia'
  import { ref, computed } from 'vue'
  import { supabase } from '@/lib/supabase'
  import { exportCsv, exportPdf } from '@/utils/export'

  export const useHistoryStore = defineStore('history', () => {
    const sessions = ref([]) // array of workout_sessions with nested set_logs
    const loading = ref(false)
    const loaded = ref(false)

    /**
     * Personal records: heaviest weight logged per exercise name.
     */
    const personalRecords = computed(() => {
      const records = {}
      for (const session of sessions.value) {
        for (const log of session.set_logs ?? []) {
          if (log.weight_kg === null || log.weight_kg === undefined) continue
          const w = Number(log.weight_kg)
          if (!records[log.exercise_name] || w > records[log.exercise_name]) {
            records[log.exercise_name] = w
          }
        }
      }
      // Sort by exercise name
      return Object.entries(records)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([exercise, weight]) => ({ exercise, weight }))
    })

    async function load(userId) {
      loading.value = true
      try {
        // Load all sessions for this user, reverse chronological
        const { data: sessionRows, error } = await supabase
          .from('workout_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('started_at', { ascending: false })

        if (error) throw error

        // Load all set_logs for these sessions in one query
        const sessionIds = sessionRows.map((s) => s.id)
        const { data: logRows } = await supabase
          .from('set_logs')
          .select('*')
          .in('session_id', sessionIds)
          .order('set_number')

        // Nest logs into sessions
        const logsBySession = {}
        for (const log of logRows ?? []) {
          if (!logsBySession[log.session_id]) logsBySession[log.session_id] = []
          logsBySession[log.session_id].push(log)
        }

        sessions.value = sessionRows.map((s) => ({
          ...s,
          set_logs: logsBySession[s.id] ?? [],
        }))

        loaded.value = true
      } finally {
        loading.value = false
      }
    }

    function downloadCsv() {
      exportCsv(sessions.value)
    }

    async function downloadPdf(displayName) {
      await exportPdf(sessions.value, displayName)
    }

    function reset() {
      sessions.value = []
      loaded.value = false
    }

    return {
      sessions, loading, loaded, personalRecords,
      load, downloadCsv, downloadPdf, reset,
    }
  })
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/stores/history.js
  git commit -m "feat: add history store with session loading and export actions"
  ```

---

## Task 4: HistoryView

**Files:**
- Modify: `src/views/HistoryView.vue` (replace placeholder)

- [ ] **Step 1: Write full HistoryView**

  ```html
  <template>
    <div :style="{ maxWidth: '640px', margin: '0 auto', padding: '32px 16px' }">

      <!-- Header -->
      <div style="border-bottom: 1px solid oklch(15% 0.008 45); padding-bottom: 20px; margin-bottom: 24px">
        <div style="font-size: 11px; letter-spacing: 4px; color: #888; text-transform: uppercase; margin-bottom: 8px">
          Your History
        </div>
        <h1 style="font-size: clamp(1.4rem, 5vw, 2rem); font-weight: 400; margin: 0; color: oklch(96% 0.005 45); letter-spacing: -0.5px">
          Training Log
        </h1>

        <!-- Export buttons -->
        <div v-if="history.sessions.length > 0" style="display: flex; gap: 10px; margin-top: 16px">
          <button @click="history.downloadCsv()" :style="exportBtnStyle">Export CSV</button>
          <button @click="history.downloadPdf(auth.profile?.display_name)" :style="exportBtnStyle">Export PDF</button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="history.loading" style="text-align: center; color: #888; font-size: 13px; padding: 40px">
        Loading...
      </div>

      <!-- Empty state -->
      <div
        v-else-if="history.loaded && history.sessions.length === 0"
        style="text-align: center; padding: 60px 20px; color: #888"
      >
        <div style="font-size: 24px; margin-bottom: 12px">✏</div>
        <p style="font-size: 13px; line-height: 1.6; margin: 0">
          No sessions yet.<br>
          <RouterLink to="/" style="color: #a78bfa">Start your first workout</RouterLink> from the Program view.
        </p>
      </div>

      <template v-else-if="history.loaded">

        <!-- Personal Records -->
        <section v-if="history.personalRecords.length > 0" style="margin-bottom: 28px">
          <div style="font-size: 10px; letter-spacing: 3px; color: #888; text-transform: uppercase; margin-bottom: 12px">
            Personal Records
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px">
            <div
              v-for="pr in history.personalRecords"
              :key="pr.exercise"
              style="
                padding: 10px 12px;
                background: oklch(10% 0.01 45);
                border: 1px solid oklch(17% 0.008 45);
                border-radius: 4px;
              "
            >
              <div style="font-size: 11px; color: #888; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">
                {{ pr.exercise }}
              </div>
              <div style="font-size: 15px; font-weight: 700; color: #e8e8e8">{{ pr.weight }}kg</div>
            </div>
          </div>
        </section>

        <!-- Session List -->
        <section>
          <div style="font-size: 10px; letter-spacing: 3px; color: #888; text-transform: uppercase; margin-bottom: 12px">
            Sessions
          </div>

          <div
            v-for="session in history.sessions"
            :key="session.id"
            style="margin-bottom: 8px; border: 1px solid oklch(17% 0.008 45); border-radius: 6px; overflow: hidden"
          >
            <!-- Session header -->
            <button
              @click="toggleSession(session.id)"
              :aria-expanded="expandedSession === session.id"
              :style="{
                width: '100%',
                padding: '12px 14px',
                background: expandedSession === session.id ? 'oklch(11.5% 0.008 45)' : 'oklch(10% 0.01 45)',
                border: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                color: '#e8e8e8',
                transition: 'background 0.15s',
                fontFamily: 'Georgia, serif',
              }"
            >
              <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap">
                <span style="font-size: 12px; color: #e8e8e8">{{ session.date }} — {{ session.day_name }}</span>
                <span
                  :style="{
                    fontSize: '9px',
                    padding: '2px 6px',
                    borderRadius: '20px',
                    background: phaseColor(session.phase) + '22',
                    color: phaseColor(session.phase),
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                  }"
                >Phase {{ session.phase }} · Wk {{ session.week }}</span>
                <span style="font-size: 11px; color: #666">{{ session.track }}</span>
                <span v-if="!session.completed_at" style="font-size: 10px; color: #888; font-style: italic">incomplete</span>
              </div>

              <div style="display: flex; align-items: center; gap: 10px; flex-shrink: 0">
                <span v-if="sessionDuration(session)" style="font-size: 11px; color: #666">{{ sessionDuration(session) }}</span>
                <span :style="{ color: '#555', fontSize: '12px', transition: 'transform 0.15s', transform: expandedSession === session.id ? 'rotate(180deg)' : 'none' }">▾</span>
              </div>
            </button>

            <!-- Expanded: exercise detail -->
            <Transition name="accordion">
              <div v-if="expandedSession === session.id" style="padding: 0 14px 12px; background: oklch(10% 0.01 45)">
                <table style="width: 100%; border-collapse: collapse; margin-top: 8px">
                  <thead>
                    <tr>
                      <th style="font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #555; text-align: left; padding: 4px 0; font-weight: 400">Exercise</th>
                      <th style="font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #555; text-align: right; padding: 4px 0; font-weight: 400">Sets logged</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="[exercise, logs] in groupedLogs(session)"
                      :key="exercise"
                      style="border-top: 1px solid oklch(14% 0.008 45)"
                    >
                      <td style="padding: 7px 0; font-size: 12px; color: #e8e8e8">{{ exercise }}</td>
                      <td style="padding: 7px 0; font-size: 11px; color: #888; text-align: right; font-variant-numeric: tabular-nums">
                        {{ formatSetSummary(logs) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Transition>
          </div>
        </section>

      </template>
    </div>
  </template>

  <script setup>
  import { ref, onMounted } from 'vue'
  import { useAuthStore } from '../stores/auth'
  import { useHistoryStore } from '../stores/history'
  import { formatDuration } from '../utils/export'

  const auth = useAuthStore()
  const history = useHistoryStore()
  const expandedSession = ref(null)

  const exportBtnStyle = {
    padding: '7px 14px',
    background: 'transparent',
    border: '1px solid oklch(22% 0.008 45)',
    borderRadius: '4px',
    color: '#888',
    fontSize: '10px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    cursor: 'pointer',
    fontFamily: 'Georgia, serif',
    transition: 'border-color 0.15s, color 0.15s',
  }

  const phaseColors = { 1: '#4ade80', 2: '#facc15', 3: '#f87171' }
  function phaseColor(phase) {
    return phaseColors[phase] ?? '#888'
  }

  function toggleSession(id) {
    expandedSession.value = expandedSession.value === id ? null : id
  }

  function sessionDuration(session) {
    return formatDuration(session.started_at, session.completed_at)
  }

  function groupedLogs(session) {
    const map = new Map()
    for (const log of session.set_logs ?? []) {
      if (!map.has(log.exercise_name)) map.set(log.exercise_name, [])
      map.get(log.exercise_name).push(log)
    }
    return [...map.entries()]
  }

  function formatSetSummary(logs) {
    return logs
      .map((l) => {
        const w = l.weight_kg !== null ? `${l.weight_kg}kg` : 'bw'
        return `${l.reps_done ?? '?'}×${w}`
      })
      .join('  ')
  }

  onMounted(async () => {
    if (auth.user && !history.loaded) {
      await history.load(auth.user.id)
    }
  })
  </script>

  <style scoped>
  .accordion-enter-active {
    transition: opacity 200ms ease-out, transform 200ms cubic-bezier(0.25, 1, 0.5, 1);
  }
  .accordion-leave-active {
    transition: opacity 120ms ease-in;
  }
  .accordion-enter-from {
    opacity: 0;
    transform: translateY(-4px);
  }
  .accordion-leave-to {
    opacity: 0;
  }
  </style>
  ```

- [ ] **Step 2: Verify in browser end-to-end**

  - Sign in and navigate to `/history`
  - After completing at least one workout session (Plan 2), sessions should appear
  - Click a session to expand — set detail should show
  - Personal Records section should appear with heaviest weights
  - "Export CSV" — CSV file downloads with correct data
  - "Export PDF" — PDF file downloads, formatted as training journal
  - Empty state shows when no sessions exist

- [ ] **Step 3: Commit**

  ```bash
  git add src/views/HistoryView.vue
  git commit -m "feat: add history view with sessions, personal records, and export"
  ```

---

## Task 5: Wire Export All from Nav Dropdown

The nav dropdown in App.vue has an "Export All" option. Wire it to the history store.

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: Import history store in App.vue and wire "Export All"**

  In `App.vue` `<script setup>`, add:

  ```js
  import { useHistoryStore } from './stores/history'
  const historyStore = useHistoryStore()

  async function handleExportAll() {
    dropdownOpen.value = false
    if (!historyStore.loaded) {
      await historyStore.load(auth.user.id)
    }
    historyStore.downloadCsv()
  }
  ```

  In the template dropdown, find the `<!-- Export CSV button added by Plan 3 Task 5 -->` comment (placed there in Plan 1) and replace it with:

  ```html
  <button
    @click="handleExportAll"
    style="
      width: 100%;
      padding: 10px 14px;
      background: transparent;
      border: none;
      color: #e8e8e8;
      font-size: 11px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      text-align: left;
      cursor: pointer;
      font-family: Georgia, serif;
    "
  >Export CSV</button>
  ```

- [ ] **Step 2: Verify**

  Sign in, open user dropdown, click "Export CSV" — CSV downloads with full history.

- [ ] **Step 3: Commit**

  ```bash
  git add src/App.vue
  git commit -m "feat: wire export all CSV from nav dropdown"
  ```

---

## Verification

- [ ] `npm run test:unit` — all tests pass
- [ ] `/history` shows sessions in reverse chronological order
- [ ] Incomplete sessions show "incomplete" indicator
- [ ] Session expand/collapse works
- [ ] Personal records section shows heaviest weight per exercise
- [ ] Export CSV downloads a valid CSV file openable in Excel/Google Sheets
- [ ] Export PDF downloads a formatted PDF with session detail
- [ ] Empty state shown for new users with no sessions
- [ ] Hard refresh to `/history` — loads correctly without auth redirect
- [ ] "Export CSV" from nav dropdown triggers download without navigating to `/history`
