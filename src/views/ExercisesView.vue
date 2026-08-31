<template>
  <header class="exercises-header">
    <div class="exercises-eyebrow">Your Library</div>
    <h1 class="exercises-title">Exercises</h1>
    <p class="exercises-subtitle">
      Save exercises here, then pull them into daily programs when you build custom days.
    </p>
  </header>

  <section class="exercises-main">
    <div class="exercises-toolbar">
      <input
        v-model="search"
        type="search"
        class="workout-input exercises-search"
        placeholder="Search exercises…"
        aria-label="Search saved exercises"
      />
      <div class="exercises-toolbar-actions">
        <button type="button" class="btn-import-csv" @click="openCsvPicker">
          Import CSV
        </button>
        <button type="button" class="btn-add-exercise" @click="startCreate">
          + Add Exercise
        </button>
      </div>
      <input
        ref="csvInputRef"
        type="file"
        accept=".csv,text/csv"
        class="csv-file-input"
        aria-hidden="true"
        tabindex="-1"
        @change="onCsvSelected"
      />
    </div>

    <div
      v-if="!loading && !loadError && exercises.length"
      class="category-filter-row"
      role="group"
      aria-label="Filter by category"
    >
      <button
        v-for="cat in filterCategories"
        :key="cat"
        type="button"
        class="category-filter-btn"
        :class="{ active: activeCategory === cat }"
        :aria-pressed="activeCategory === cat"
        @click="activeCategory = cat"
      >
        {{ cat }}
        <span class="category-filter-count">{{ categoryCounts[cat] ?? 0 }}</span>
      </button>
    </div>

    <p v-if="importError && !importPreview" class="form-error import-inline-error">{{ importError }}</p>

    <Transition name="reveal">
      <div v-if="importPreview" class="import-card">
        <div class="create-card-title">Import preview</div>
        <p class="import-summary">
          {{ importPreview.rows.length }} exercise{{ importPreview.rows.length === 1 ? '' : 's' }} ready to import
          <span v-if="importPreview.errors.length"> · {{ importPreview.errors.length }} line warning{{ importPreview.errors.length === 1 ? '' : 's' }}</span>
        </p>
        <p class="import-hint">
          Columns: <code>name</code>, optional <code>category</code>, <code>default_sets</code>, <code>default_reps</code>, <code>notes</code>.
          Duplicates are skipped.
        </p>
        <button type="button" class="template-link" @click="downloadExerciseCsvTemplate">
          Download CSV template
        </button>

        <div v-if="importPreview.errors.length" class="import-errors">
          <div v-for="(msg, i) in importPreview.errors.slice(0, 5)" :key="i">{{ msg }}</div>
          <div v-if="importPreview.errors.length > 5">
            + {{ importPreview.errors.length - 5 }} more warnings
          </div>
        </div>

        <div v-if="importPreview.rows.length" class="import-preview-list">
          <div
            v-for="row in importPreview.rows.slice(0, 8)"
            :key="`${row.name}-${row.default_sets}-${row.default_reps}`"
            class="import-preview-row"
          >
            <span class="import-preview-name">{{ row.name }}</span>
            <span class="import-preview-meta">
              {{ row.category }}
              <template v-if="row.default_sets || row.default_reps">
                · {{ row.default_sets || '—' }} × {{ row.default_reps || '—' }}
              </template>
            </span>
          </div>
          <div v-if="importPreview.rows.length > 8" class="import-preview-more">
            + {{ importPreview.rows.length - 8 }} more
          </div>
        </div>

        <div class="form-actions">
          <button
            type="button"
            class="save-btn"
            :disabled="importing || !importPreview.rows.length"
            @click="confirmImport"
          >
            {{ importing ? 'Importing…' : `Import ${importPreview.rows.length}` }}
          </button>
          <button type="button" class="cancel-btn" @click="clearImportPreview">Cancel</button>
        </div>
        <p v-if="importError" class="form-error">{{ importError }}</p>
        <p v-if="importSuccess" class="import-success">{{ importSuccess }}</p>
      </div>
    </Transition>

    <Transition name="reveal">
      <div v-if="creating" class="create-card">
        <div class="create-card-title">New exercise</div>
        <ExerciseFormFields v-model="createForm" />
        <div class="form-actions">
          <button type="button" class="save-btn" :disabled="saving || !createForm.name.trim()" @click="saveCreate">
            {{ saving ? 'Saving…' : 'Save exercise' }}
          </button>
          <button type="button" class="cancel-btn" @click="creating = false">Cancel</button>
        </div>
        <p v-if="formError && creating" class="form-error">{{ formError }}</p>
      </div>
    </Transition>

    <div v-if="loading" class="exercises-empty">Loading your exercises…</div>
    <div v-else-if="loadError" class="exercises-error">{{ loadError }}</div>

    <div v-else-if="!filteredExercises.length" class="exercises-empty">
      <p v-if="!exercises.length">
        No exercises saved yet. Add moves you use often — they are not tied to a day until you add them in Custom Studio.
      </p>
      <p v-else-if="activeCategory !== 'All'">
        No {{ activeCategory }} exercises yet.
        <button type="button" class="clear-filter-link" @click="activeCategory = 'All'">Show all</button>
      </p>
      <p v-else>No exercises match your search.</p>
    </div>

    <div v-else class="exercises-list">
      <article v-for="ex in filteredExercises" :key="ex.id" class="exercise-card">
        <div v-if="editingId === ex.id">
          <ExerciseFormFields v-model="editForm" />
          <div class="form-actions">
            <button type="button" class="save-btn" :disabled="saving || !editForm.name.trim()" @click="saveEdit">
              {{ saving ? 'Saving…' : 'Save changes' }}
            </button>
            <button type="button" class="cancel-btn" @click="cancelEdit">Cancel</button>
          </div>
          <p v-if="formError && editingId === ex.id" class="form-error">{{ formError }}</p>
        </div>

        <template v-else>
          <div class="exercise-card-top">
            <div>
              <div class="exercise-card-name">{{ ex.name }}</div>
              <div class="exercise-card-meta">
                <span class="exercise-card-category">{{ ex.category }}</span>
                <span v-if="ex.default_sets || ex.default_reps">
                  · {{ ex.default_sets || '—' }} sets × {{ ex.default_reps || '—' }} reps
                </span>
              </div>
              <p v-if="ex.notes" class="exercise-card-notes">{{ ex.notes }}</p>
            </div>
            <div class="exercise-card-actions">
              <button type="button" class="edit-btn" @click="startEdit(ex)">Edit</button>
              <button type="button" class="delete-btn" @click="confirmDeleteId = ex.id">Delete</button>
            </div>
          </div>

          <div v-if="confirmDeleteId === ex.id" class="delete-confirm-row">
            <span>Remove this exercise from your library?</span>
            <div class="delete-confirm-actions">
              <button type="button" class="delete-confirm-btn" :disabled="deleting" @click="removeExercise(ex.id)">
                {{ deleting ? 'Deleting…' : 'Yes, delete' }}
              </button>
              <button type="button" class="cancel-btn" @click="confirmDeleteId = null">Cancel</button>
            </div>
          </div>
        </template>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { useAuthStore } from '@/stores/auth'
import ExerciseFormFields from '@/components/ExerciseFormFields.vue'
import {
  useSavedExercisesQuery,
  createSavedExercise,
  updateSavedExercise,
  deleteSavedExercise,
  invalidateSavedExercises,
  importSavedExercises,
  EXERCISE_CATEGORIES,
} from '@/queries/savedExercises'
import { parseExercisesCsv, downloadExerciseCsvTemplate } from '@/lib/importExercisesCsv'

const auth = useAuthStore()
const queryClient = useQueryClient()
const userId = computed(() => auth.user?.id)

const { data, isPending, isError, error } = useSavedExercisesQuery(userId)

const exercises = computed(() => data.value ?? [])
const loading = computed(() => isPending.value)
const loadError = computed(() => (isError.value ? error.value?.message ?? 'Failed to load exercises' : ''))

const search = ref('')
const activeCategory = ref('All')
const creating = ref(false)
const editingId = ref(null)
const confirmDeleteId = ref(null)
const saving = ref(false)
const deleting = ref(false)
const importing = ref(false)
const formError = ref(null)
const importPreview = ref(null)
const importError = ref(null)
const importSuccess = ref(null)
const csvInputRef = ref(null)

const emptyForm = () => ({
  name: '',
  category: 'Other',
  default_sets: '',
  default_reps: '',
  notes: '',
})

const createForm = ref(emptyForm())
const editForm = ref(emptyForm())

const filterCategories = ['All', ...EXERCISE_CATEGORIES]

const categoryCounts = computed(() => {
  const counts = { All: exercises.value.length }
  for (const cat of EXERCISE_CATEGORIES) counts[cat] = 0
  for (const ex of exercises.value) {
    const cat = ex.category || 'Other'
    counts[cat] = (counts[cat] ?? 0) + 1
  }
  return counts
})

const filteredExercises = computed(() => {
  let list = exercises.value
  if (activeCategory.value !== 'All') {
    list = list.filter((ex) => (ex.category || 'Other') === activeCategory.value)
  }
  const q = search.value.trim().toLowerCase()
  if (!q) return list
  return list.filter(
    (ex) =>
      ex.name.toLowerCase().includes(q) ||
      ex.category.toLowerCase().includes(q) ||
      String(ex.notes ?? '').toLowerCase().includes(q),
  )
})

function startCreate() {
  editingId.value = null
  confirmDeleteId.value = null
  formError.value = null
  clearImportPreview()
  createForm.value = emptyForm()
  creating.value = true
}

function openCsvPicker() {
  importError.value = null
  importSuccess.value = null
  csvInputRef.value?.click()
}

function clearImportPreview() {
  importPreview.value = null
  importError.value = null
  importSuccess.value = null
  if (csvInputRef.value) csvInputRef.value.value = ''
}

async function onCsvSelected(event) {
  const file = event.target.files?.[0]
  if (!file) return

  importError.value = null
  importSuccess.value = null
  creating.value = false

  try {
    const text = await file.text()
    const parsed = parseExercisesCsv(text)
    if (!parsed.rows.length && parsed.errors.length) {
      importError.value = parsed.errors[0]
      importPreview.value = null
      return
    }
    importPreview.value = parsed
  } catch (err) {
    importError.value = err?.message ?? 'Could not read CSV file.'
    importPreview.value = null
  }
}

async function confirmImport() {
  if (!userId.value || !importPreview.value?.rows.length) return
  importing.value = true
  importError.value = null
  importSuccess.value = null
  try {
    const result = await importSavedExercises(userId.value, importPreview.value.rows)
    await invalidateSavedExercises(queryClient, userId.value)
    const skippedMsg = result.skipped ? ` (${result.skipped} duplicate${result.skipped === 1 ? '' : 's'} skipped)` : ''
    importSuccess.value = `Imported ${result.imported} exercise${result.imported === 1 ? '' : 's'}${skippedMsg}.`
    importPreview.value = null
    if (csvInputRef.value) csvInputRef.value.value = ''
  } catch (err) {
    importError.value = err?.message ?? 'Import failed.'
  } finally {
    importing.value = false
  }
}

function startEdit(ex) {
  creating.value = false
  confirmDeleteId.value = null
  formError.value = null
  editingId.value = ex.id
  editForm.value = {
    name: ex.name,
    category: ex.category,
    default_sets: ex.default_sets ?? '',
    default_reps: ex.default_reps ?? '',
    notes: ex.notes ?? '',
  }
}

function cancelEdit() {
  editingId.value = null
  formError.value = null
}

async function saveCreate() {
  if (!userId.value) return
  saving.value = true
  formError.value = null
  try {
    await createSavedExercise(userId.value, createForm.value)
    await invalidateSavedExercises(queryClient, userId.value)
    creating.value = false
    createForm.value = emptyForm()
  } catch (err) {
    formError.value = err?.message ?? 'Failed to save exercise.'
  } finally {
    saving.value = false
  }
}

async function saveEdit() {
  if (!userId.value || !editingId.value) return
  saving.value = true
  formError.value = null
  try {
    await updateSavedExercise(userId.value, editingId.value, editForm.value)
    await invalidateSavedExercises(queryClient, userId.value)
    editingId.value = null
  } catch (err) {
    formError.value = err?.message ?? 'Failed to update exercise.'
  } finally {
    saving.value = false
  }
}

async function removeExercise(id) {
  if (!userId.value) return
  deleting.value = true
  formError.value = null
  try {
    await deleteSavedExercise(userId.value, id)
    await invalidateSavedExercises(queryClient, userId.value)
    confirmDeleteId.value = null
  } catch (err) {
    formError.value = err?.message ?? 'Failed to delete exercise.'
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.exercises-header {
  border-bottom: 1px solid oklch(15% 0.008 45);
  padding: 32px 24px 20px;
  text-align: center;
}

.exercises-eyebrow {
  font-size: 11px;
  letter-spacing: 4px;
  color: var(--color-text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.exercises-title {
  font-size: clamp(1.625rem, 5vw, 2.75rem);
  font-weight: 400;
  margin: 0;
  color: oklch(96% 0.005 45);
  letter-spacing: -1px;
}

.exercises-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 8px auto 0;
  max-width: 520px;
  line-height: 1.6;
  font-style: italic;
}

.exercises-main {
  max-width: 640px;
  margin: 24px auto 0;
  padding: 0 16px 40px;
}

.exercises-toolbar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}

.category-filter-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 6px;
  margin-bottom: 14px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.category-filter-row::-webkit-scrollbar {
  display: none;
}

.category-filter-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 8px 14px;
  border-radius: 9999px;
  border: 1px solid oklch(20% 0.008 45);
  background: oklch(10% 0.01 45);
  color: var(--color-text-secondary);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  cursor: pointer;
  transition: border-color 150ms, background 150ms, color 150ms;
}

.category-filter-btn:hover {
  border-color: #a78bfa66;
  color: #e5e5e5;
}

.category-filter-btn.active {
  border-color: #a78bfa;
  background: #a78bfa22;
  color: #c4b5fd;
}

.category-filter-count {
  min-width: 18px;
  padding: 2px 6px;
  border-radius: 9999px;
  background: oklch(14% 0.008 45);
  color: var(--color-text-muted);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
  text-transform: none;
}

.category-filter-btn.active .category-filter-count {
  background: #a78bfa33;
  color: #e9d5ff;
}

.clear-filter-link {
  display: inline;
  margin-left: 6px;
  padding: 0;
  border: none;
  background: transparent;
  color: #c4b5fd;
  font-size: inherit;
  font-style: normal;
  text-decoration: underline;
  cursor: pointer;
}

.exercises-toolbar-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.csv-file-input {
  display: none;
}

.import-card {
  border: 1px solid oklch(17% 0.008 45);
  border-radius: 10px;
  background: oklch(10% 0.01 45);
  padding: 16px;
  margin-bottom: 14px;
}

.import-summary {
  margin: 0 0 8px;
  color: #e5e5e5;
  font-size: 0.875rem;
}

.import-hint {
  margin: 0 0 10px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--color-text-muted);
}

.import-hint code {
  color: #c4b5fd;
  font-size: 11px;
}

.template-link {
  display: inline-block;
  margin-bottom: 12px;
  padding: 0;
  border: none;
  background: transparent;
  color: #c4b5fd;
  font-size: 12px;
  cursor: pointer;
  text-decoration: underline;
}

.import-errors {
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f8717111;
  border: 1px solid #f8717144;
  color: #fca5a5;
  font-size: 12px;
  line-height: 1.5;
}

.import-preview-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.import-preview-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border: 1px solid oklch(16% 0.008 45);
  border-radius: 8px;
  background: oklch(8% 0.012 45);
}

.import-preview-name {
  font-size: 0.875rem;
  color: #f5f5f5;
  font-weight: 500;
}

.import-preview-meta {
  font-size: 11px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.import-preview-more {
  font-size: 12px;
  color: var(--color-text-muted);
  text-align: center;
}

.import-success {
  margin: 10px 0 0;
  font-size: 12px;
  color: #4ade80;
}

.import-inline-error {
  margin: -8px 0 14px;
}

@media (min-width: 560px) {
  .exercises-toolbar {
    flex-direction: row;
    align-items: center;
  }

  .exercises-search {
    flex: 1;
  }

  .exercises-toolbar-actions {
    flex-shrink: 0;
  }
}

.exercises-list,
.create-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.exercise-card,
.create-card {
  border: 1px solid oklch(17% 0.008 45);
  border-radius: 10px;
  background: oklch(10% 0.01 45);
  padding: 16px;
}

.create-card {
  margin-bottom: 14px;
}

.create-card-title {
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #c4b5fd;
  font-weight: 700;
  margin-bottom: 12px;
}

.exercise-card-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.exercise-card-name {
  font-size: 1rem;
  font-weight: 500;
  color: #f5f5f5;
  margin-bottom: 4px;
}

.exercise-card-meta {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.exercise-card-category {
  color: #c4b5fd;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 10px;
  font-weight: 600;
}

.exercise-card-notes {
  margin: 8px 0 0;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--color-text-muted);
}

.exercise-card-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.exercises-empty,
.exercises-error {
  padding: 28px 16px;
  text-align: center;
  border: 1px dashed oklch(20% 0.008 45);
  border-radius: 10px;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.exercises-error {
  border-color: #f8717144;
  color: #f87171;
}

.delete-confirm-row {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid oklch(15% 0.008 45);
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.delete-confirm-actions,
.form-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: wrap;
  margin-top: 12px;
}

.form-error {
  margin: 10px 0 0;
  font-size: 12px;
  color: #f87171;
}

.workout-input {
  width: 100%;
  padding: 10px 12px;
  background: oklch(8% 0.012 45);
  border: 1px solid oklch(24% 0.008 45);
  border-radius: 8px;
  color: #ffffff;
  font-size: 0.875rem;
  min-height: 44px;
}

.btn-add-exercise {
  min-height: 44px;
  padding: 10px 16px;
  border-radius: 9999px;
  border: 1px dashed #a78bfa66;
  background: #a78bfa11;
  color: #c4b5fd;
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.btn-import-csv {
  min-height: 44px;
  padding: 10px 16px;
  border-radius: 9999px;
  border: 1px solid oklch(22% 0.008 45);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.btn-import-csv:hover {
  border-color: #a78bfa66;
  color: #c4b5fd;
}

.edit-btn {
  background: transparent;
  border: 1px solid oklch(22% 0.008 45);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 8px 14px;
  min-height: 44px;
  border-radius: 20px;
}

.save-btn {
  background: #a78bfa22;
  border: 1px solid #a78bfa;
  color: #c4b5fd;
  cursor: pointer;
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 8px 18px;
  min-height: 44px;
  border-radius: 20px;
}

.cancel-btn {
  background: transparent;
  border: 1px solid oklch(20% 0.008 45);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 8px 16px;
  min-height: 44px;
  border-radius: 20px;
}

.delete-btn {
  background: transparent;
  border: 1px solid #7f353555;
  color: #fca5a5;
  cursor: pointer;
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 8px 14px;
  min-height: 44px;
  border-radius: 20px;
}

.delete-confirm-btn {
  background: #7f3535;
  border: 1px solid #f87171;
  color: #ffffff;
  cursor: pointer;
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 8px 18px;
  min-height: 44px;
  border-radius: 20px;
}

.reveal-enter-active,
.reveal-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
}

.reveal-enter-from,
.reveal-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
