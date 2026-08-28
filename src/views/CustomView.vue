<template>
  <!-- ═══════════════════════════ Page header ═══════════════════════════ -->
  <header class="custom-header">
    <div class="custom-eyebrow">Custom Workouts</div>
    <h1 class="custom-title">Custom Studio</h1>
    <p class="custom-subtitle">
      Build full week programs or mix &amp; match saved custom days
    </p>

    <!-- Top Segmented Navigation Tabs -->
    <div class="segmented-nav" role="tablist" aria-label="Custom Studio sections">
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'programs'"
        class="tab-btn"
        :class="{ active: activeTab === 'programs' }"
        @click="activeTab = 'programs'"
      >
        My Programs ({{ programs.length }})
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'overrides'"
        class="tab-btn"
        :class="{ active: activeTab === 'overrides' }"
        @click="activeTab = 'overrides'"
      >
        Day Builder ({{ savedWorkouts.length }})
      </button>
    </div>
  </header>

  <!-- Activation / Copy Toast Feedback -->
  <Transition name="confirm">
    <div
      v-if="toastMessage"
      class="toast-pill"
      role="status"
      aria-live="polite"
    >
      <span class="toast-icon" aria-hidden="true">✓</span>
      <span>{{ toastMessage }}</span>
    </div>
  </Transition>

  <!-- ═══════════════════════ TAB 1: MY PROGRAMS ═══════════════════════ -->
  <section v-if="activeTab === 'programs'" class="program-section" aria-label="Saved Program Templates">
    <!-- Section Header & + New Program CTA -->
    <div class="section-header">
      <div class="section-title">Saved Program Templates</div>
      <button
        type="button"
        class="btn-new-program"
        @click="startNewProgram"
      >
        + New Program
      </button>
    </div>

    <!-- New program name input card -->
    <Transition name="rename-slide">
      <div v-if="creatingProgram" class="new-program-card">
        <input
          ref="newProgramInput"
          v-model="newProgramName"
          placeholder="Program name (e.g. Summer Cut, Hypertrophy Phase)"
          class="workout-input new-program-input"
          aria-label="New program template name"
          @keydown.enter="saveNewProgram"
          @keydown.escape="creatingProgram = false"
        />
        <button
          type="button"
          class="btn-create-submit"
          :disabled="!newProgramName.trim() || savingProgram"
          @click="saveNewProgram"
        >
          {{ savingProgram ? 'Creating…' : 'Create' }}
        </button>
        <button
          type="button"
          class="btn-icon-cancel"
          aria-label="Cancel creating new program"
          @click="creatingProgram = false"
        >
          ✕
        </button>
      </div>
    </Transition>

    <!-- Program cards loading state -->
    <div v-if="programsLoading" class="programs-loading-state">
      Loading programs…
    </div>

    <!-- Programs list -->
    <div v-else class="programs-list">
      <!-- 1. Default Built-in Program Card: Build From Zero -->
      <article
        class="program-card"
        :class="{ 'is-active': isBuiltInActive }"
      >
        <div class="program-card-header" :class="{ 'is-active': isBuiltInActive }">
          <div class="program-header-info">
            <div class="program-name-group">
              <span class="program-title-text">Build From Zero</span>
              <span v-if="isBuiltInActive" class="badge-active">Active</span>
              <span class="badge-days-count" style="background: oklch(14% 0.008 45); color: #a3a3a3">
                Default Program · 8 Weeks
              </span>
            </div>
          </div>

          <div class="program-actions-group">
            <RouterLink
              to="/program"
              class="btn-primary-action btn-edit-days"
              style="text-decoration: none; display: inline-flex; align-items: center; justify-content: center"
            >
              View Program
            </RouterLink>

            <button
              v-if="isBuiltInActive"
              type="button"
              class="btn-primary-action btn-active-plan"
              disabled
              aria-label="Build From Zero is currently active"
            >
              <span aria-hidden="true">✓</span> Active Plan
            </button>
            <button
              v-else
              type="button"
              class="btn-primary-action btn-activate-plan"
              :disabled="activatingBuiltIn"
              @click="handleActivateBuiltIn"
            >
              {{ activatingBuiltIn ? 'Activating…' : 'Activate Plan' }}
            </button>

            <!-- Overflow menu for built-in program -->
            <div class="overflow-container">
              <button
                type="button"
                class="btn-overflow-trigger"
                :aria-expanded="openMenuProgramId === 'builtin'"
                aria-label="More options for Build From Zero"
                aria-haspopup="true"
                @click.stop="toggleOverflowMenu('builtin')"
              >
                <span aria-hidden="true" class="overflow-dots">⋮</span>
              </button>

              <Transition name="dropdown-pop">
                <div
                  v-if="openMenuProgramId === 'builtin'"
                  class="overflow-dropdown-menu"
                  role="menu"
                  aria-label="Options for Build From Zero"
                  @click.stop
                >
                  <button
                    type="button"
                    role="menuitem"
                    class="overflow-menu-item"
                    @click="openExportProgram(builtInProgram); closeOverflowMenu()"
                  >
                    <span class="menu-item-icon" aria-hidden="true">↗</span>
                    <span>Export Program</span>
                  </button>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </article>

      <!-- 2. User's Custom Programs -->
      <article
        v-for="program in programs"
        :key="program.id"
        class="program-card"
        :class="{ 'is-active': isProgramActive(program) }"
      >
        <!-- Program card header -->
        <div class="program-card-header" :class="{ 'is-active': isProgramActive(program) }">
          <div class="program-header-info">
            <!-- Inline rename form -->
            <div v-if="renamingProgramId === program.id" class="rename-inline-form">
              <input
                ref="renameInput"
                v-model="renameProgramName"
                class="workout-input rename-input"
                aria-label="Rename program"
                @keydown.enter="confirmProgramRename(program.id)"
                @keydown.escape="renamingProgramId = null"
              />
              <button
                type="button"
                class="btn-save-rename"
                @click="confirmProgramRename(program.id)"
              >
                Save
              </button>
              <button
                type="button"
                class="btn-cancel-rename"
                aria-label="Cancel rename"
                @click="renamingProgramId = null"
              >
                ✕
              </button>
            </div>

            <!-- Standard program name & badges -->
            <div v-else class="program-name-group">
              <span class="program-title-text">{{ program.name }}</span>
              <span v-if="isProgramActive(program)" class="badge-active">Active</span>
              <span class="badge-days-count">
                {{ program.custom_program_days?.length ?? 0 }} day{{ (program.custom_program_days?.length ?? 0) !== 1 ? 's' : '' }}
              </span>
            </div>
          </div>

          <!-- Primary Actions (48px) + Secondary Overflow Menu (44px) -->
          <div class="program-actions-group">
            <!-- Primary Action 1: Edit Days Toggle -->
            <button
              type="button"
              class="btn-primary-action btn-edit-days"
              :class="{ expanded: expandedProgramId === program.id }"
              :aria-expanded="expandedProgramId === program.id"
              @click="toggleProgramEditor(program.id)"
            >
              {{ expandedProgramId === program.id ? 'Close Days' : 'Edit Days' }}
            </button>

            <!-- Primary Action 2: Activate / Active Status -->
            <button
              v-if="isProgramActive(program)"
              type="button"
              class="btn-primary-action btn-active-plan"
              disabled
              aria-label="This program is currently active"
            >
              <span aria-hidden="true">✓</span> Active Plan
            </button>
            <button
              v-else
              type="button"
              class="btn-primary-action btn-activate-plan"
              :disabled="activatingProgramId === program.id"
              @click="handleActivateProgram(program)"
            >
              {{ activatingProgramId === program.id ? 'Applying…' : 'Activate Plan' }}
            </button>

            <!-- Secondary Actions: Overflow Action Menu (3-Dots) -->
            <div class="overflow-container">
              <button
                type="button"
                class="btn-overflow-trigger"
                :aria-expanded="openMenuProgramId === program.id"
                :aria-label="`More options for ${program.name}`"
                aria-haspopup="true"
                @click.stop="toggleOverflowMenu(program.id)"
              >
                <span aria-hidden="true" class="overflow-dots">⋮</span>
              </button>

              <!-- Overflow Dropdown Menu Popover -->
              <Transition name="dropdown-pop">
                <div
                  v-if="openMenuProgramId === program.id"
                  class="overflow-dropdown-menu"
                  role="menu"
                  :aria-label="`Options for ${program.name}`"
                  @click.stop
                >
                  <!-- Regular secondary actions (when not confirming delete) -->
                  <template v-if="confirmDeleteProgramId !== program.id">
                    <button
                      type="button"
                      role="menuitem"
                      class="overflow-menu-item"
                      @click="startRenameFromMenu(program)"
                    >
                      <span class="menu-item-icon" aria-hidden="true">✏️</span>
                      <span>Rename Program</span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      class="overflow-menu-item"
                      @click="openExportProgram(program); closeOverflowMenu()"
                    >
                      <span class="menu-item-icon" aria-hidden="true">↗</span>
                      <span>Export Program</span>
                    </button>

                    <div class="overflow-menu-divider" role="separator" />

                    <button
                      type="button"
                      role="menuitem"
                      class="overflow-menu-item item-danger"
                      @click="confirmDeleteProgramId = program.id"
                    >
                      <span class="menu-item-icon" aria-hidden="true">🗑</span>
                      <span>Delete Program</span>
                    </button>
                  </template>

                  <!-- Clear 2-step inline deletion confirmation -->
                  <div v-else class="overflow-delete-confirmation" role="alertdialog" aria-label="Confirm program deletion">
                    <p class="delete-warning-text">Delete "{{ program.name }}"?</p>
                    <p class="delete-subtext">This program template and its scheduled days will be permanently removed.</p>
                    <div class="delete-confirm-actions">
                      <button
                        type="button"
                        class="btn-confirm-delete"
                        @click="handleDeleteProgram(program.id)"
                      >
                        Confirm Delete
                      </button>
                      <button
                        type="button"
                        class="btn-cancel-delete"
                        @click="confirmDeleteProgramId = null"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>

        <!-- Program day editor (expanded) -->
        <Transition name="rename-slide">
          <div v-if="expandedProgramId === program.id" class="program-day-editor-drawer">
            <div
              v-for="d in days"
              :key="d"
              class="program-day-row"
            >
              <!-- Day row header -->
              <button
                type="button"
                class="day-row-header-btn"
                :aria-expanded="expandedProgramDay === `${program.id}|${d}`"
                @click="toggleProgramDay(program.id, d)"
              >
                <div class="day-header-summary">
                  <span class="day-name-tag">{{ d }}</span>
                  <span v-if="getProgramDay(program, d)" class="day-title-tag">
                    {{ getProgramDay(program, d).title || `${getProgramDay(program, d).exercises?.length ?? 0} exercise${(getProgramDay(program, d).exercises?.length ?? 0) !== 1 ? 's' : ''}` }}
                  </span>
                  <span v-else class="day-empty-hint">Empty — tap to build</span>
                </div>
                <span class="day-accordion-icon" aria-hidden="true">
                  {{ expandedProgramDay === `${program.id}|${d}` ? '−' : '+' }}
                </span>
              </button>

              <!-- Day exercise editor -->
              <Transition name="rename-slide">
                <div
                  v-if="expandedProgramDay === `${program.id}|${d}`"
                  class="day-editor-content"
                >
                  <!-- Copy / Import from saved custom days -->
                  <div v-if="savedWorkouts.length > 0" class="import-saved-day-box">
                    <label :for="`import-${program.id}-${d}`" class="import-label">
                      Copy from Saved Custom Days
                    </label>
                    <select
                      :id="`import-${program.id}-${d}`"
                      class="import-select"
                      @change="importSavedDayIntoProgram(program.id, d, $event.target.value); $event.target.value = ''"
                    >
                      <option value="" disabled selected>Select a saved day to copy exercises…</option>
                      <option v-for="sd in savedWorkouts" :key="sd.id" :value="sd.id">
                        {{ sd.day_name }} — {{ sd.title || 'Untitled' }} ({{ sd.exercises?.length ?? 0 }} exercises)
                      </option>
                    </select>
                  </div>

                  <!-- Day Title -->
                  <div class="form-field-group">
                    <label :for="`title-${program.id}-${d}`" class="field-label">
                      Day Title <span class="optional-hint">(optional)</span>
                    </label>
                    <input
                      :id="`title-${program.id}-${d}`"
                      v-model="programDayDraft[`${program.id}|${d}`].title"
                      placeholder="e.g. Push Day, Upper Body, Leg Focus…"
                      class="workout-input"
                    />
                  </div>

                  <!-- Exercises -->
                  <div class="field-label exercises-header-label">Exercises</div>
                  <TransitionGroup name="exercise" tag="div" class="exercise-list-group">
                    <div
                      v-for="(ex, i) in programDayDraft[`${program.id}|${d}`].exercises"
                      :key="ex._id"
                      class="exercise-item-card"
                    >
                      <div class="exercise-card-main-row">
                        <span class="exercise-index" aria-hidden="true">{{ i + 1 }}</span>
                        <input
                          v-model="ex.name"
                          :aria-label="`Exercise ${i + 1} name`"
                          placeholder="Exercise name"
                          class="workout-input flex-input"
                        />
                        <div class="stepper-actions-group">
                          <button
                            type="button"
                            :disabled="i === 0"
                            :aria-label="`Move exercise ${i + 1} up`"
                            class="stepper-btn"
                            @click="moveProgramExerciseUp(program.id, d, i)"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            :disabled="i === programDayDraft[`${program.id}|${d}`].exercises.length - 1"
                            :aria-label="`Move exercise ${i + 1} down`"
                            class="stepper-btn"
                            @click="moveProgramExerciseDown(program.id, d, i)"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            :aria-label="`Remove exercise ${i + 1}`"
                            class="stepper-btn remove-btn"
                            @click="removeProgramExercise(program.id, d, i)"
                          >
                            <span aria-hidden="true">×</span>
                          </button>
                        </div>
                      </div>
                      <div class="sets-reps-row">
                        <div class="set-rep-col">
                          <label :for="`pd-${program.id}-${d}-${i}-sets`" class="mini-label">Sets</label>
                          <input
                            :id="`pd-${program.id}-${d}-${i}-sets`"
                            v-model="ex.sets"
                            placeholder="3"
                            class="workout-input center-input"
                          />
                        </div>
                        <div class="set-rep-col">
                          <label :for="`pd-${program.id}-${d}-${i}-reps`" class="mini-label">Reps</label>
                          <input
                            :id="`pd-${program.id}-${d}-${i}-reps`"
                            v-model="ex.reps"
                            placeholder="10"
                            class="workout-input center-input"
                          />
                        </div>
                      </div>
                    </div>
                  </TransitionGroup>

                  <button
                    type="button"
                    class="btn-add-exercise"
                    @click="addProgramExercise(program.id, d)"
                  >
                    + Add Exercise
                  </button>

                  <div class="day-save-actions-row">
                    <button
                      type="button"
                      class="btn-save-day"
                      :disabled="savingProgramDay === `${program.id}|${d}`"
                      @click="saveProgramDayHandler(program.id, d)"
                    >
                      {{ savingProgramDay === `${program.id}|${d}` ? 'Saving…' : `Save ${d}` }}
                    </button>
                    <button
                      v-if="getProgramDay(program, d)"
                      type="button"
                      class="btn-clear-day"
                      @click="handleDeleteProgramDay(program.id, d)"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </Transition>
      </article>
    </div>
  </section>

  <!-- ═════════════════════ TAB 2: DAY BUILDER & OVERRIDES ═════════════════════ -->
  <section v-else class="program-section" aria-label="Day Builder and Overrides">
    <div class="section-header">
      <div class="section-title">
        {{ editingCustomDayId ? 'Editing Custom Day Version' : 'Build & Save Custom Day' }}
      </div>
      <button
        v-if="editingCustomDayId"
        type="button"
        class="btn-new-version"
        @click="resetDayBuilder"
      >
        + New Version
      </button>
    </div>

    <!-- Day Selector -->
    <div class="day-selector-group">
      <div class="field-label">Day of Week</div>
      <div class="day-pills-row" role="group" aria-label="Select day of week">
        <button
          v-for="d in days"
          :key="d"
          type="button"
          class="day-pill-btn"
          :class="{ selected: selectedDay === d }"
          :aria-pressed="selectedDay === d"
          @click="selectedDay = d"
        >
          {{ d }}
        </button>
      </div>
    </div>

    <!-- Plan Title -->
    <div class="form-field-group">
      <label for="custom-day-title-input" class="field-label">
        Plan Title <span class="optional-hint">(optional e.g. Push Heavy, Delts Focus)</span>
      </label>
      <input
        id="custom-day-title-input"
        v-model="planTitle"
        placeholder="e.g. Push Heavy, Delts Focus, Chest Hypertrophy…"
        class="workout-input"
      />
    </div>

    <div class="field-label exercises-header-label">Exercises</div>

    <TransitionGroup name="exercise" tag="div" class="exercise-list-group">
      <div
        v-for="(ex, i) in exercises"
        :key="ex._id"
        class="exercise-item-card"
      >
        <div class="exercise-card-main-row">
          <span class="exercise-index" aria-hidden="true">{{ i + 1 }}</span>
          <input
            v-model="ex.name"
            :aria-label="`Exercise ${i + 1} name`"
            placeholder="Exercise name"
            class="workout-input flex-input"
          />
          <div class="stepper-actions-group">
            <button
              type="button"
              :disabled="i === 0"
              :aria-label="`Move exercise ${i + 1} up`"
              class="stepper-btn"
              @click="moveExerciseUp(i)"
            >
              ↑
            </button>
            <button
              type="button"
              :disabled="i === exercises.length - 1"
              :aria-label="`Move exercise ${i + 1} down`"
              class="stepper-btn"
              @click="moveExerciseDown(i)"
            >
              ↓
            </button>
            <button
              type="button"
              :aria-label="`Remove exercise ${i + 1}`"
              class="stepper-btn remove-btn"
              @click="removeExercise(i)"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        </div>

        <div class="sets-reps-row">
          <div class="set-rep-col">
            <label :for="`ex-${i}-sets`" class="mini-label">Sets</label>
            <input
              :id="`ex-${i}-sets`"
              v-model="ex.sets"
              placeholder="3"
              class="workout-input center-input"
            />
          </div>
          <div class="set-rep-col">
            <label :for="`ex-${i}-reps`" class="mini-label">Reps</label>
            <input
              :id="`ex-${i}-reps`"
              v-model="ex.reps"
              placeholder="10"
              class="workout-input center-input"
            />
          </div>
        </div>

        <div class="demo-link-row">
          <a
            v-if="ex.name.trim()"
            :href="yt(ex.name)"
            target="_blank"
            rel="noopener noreferrer"
            class="exercise-demo-link"
            :aria-label="`Watch video demonstration for ${ex.name}`"
          >
            Watch demo ↗
          </a>
          <span v-else class="demo-placeholder-text">Type a name to get a demo link</span>
        </div>
      </div>
    </TransitionGroup>

    <button
      type="button"
      class="btn-add-exercise"
      @click="addExercise"
    >
      + Add Exercise
    </button>

    <button
      type="button"
      class="btn-save-workout-version"
      :disabled="!hasValidExercises"
      @click="saveWorkout"
    >
      {{ editingCustomDayId ? 'Update Version for ' + selectedDay : 'Save Version for ' + selectedDay }}
    </button>

    <!-- SAVED CUSTOM DAYS LIST -->
    <div v-if="savedWorkouts.length > 0" class="saved-days-container">
      <div class="section-title saved-days-heading">
        Saved Custom Day Versions ({{ savedWorkouts.length }})
      </div>

      <article
        v-for="savedDay in savedWorkouts"
        :key="savedDay.id"
        class="saved-day-card"
      >
        <!-- Card header -->
        <div class="saved-day-header">
          <div class="saved-day-info">
            <div class="saved-day-badge-row">
              <span class="day-name-tag">{{ savedDay.day_name }}</span>
              <span class="badge-custom">Custom</span>
            </div>
            <div v-if="savedDay?.title" class="saved-day-title-text">
              {{ savedDay.title }}
            </div>
          </div>

          <Transition name="confirm" mode="out-in">
            <div v-if="confirmDeleteDayId === savedDay.id" key="confirm" class="confirm-delete-day-row">
              <span class="confirm-query-text">Remove?</span>
              <button
                type="button"
                class="btn-danger-confirm-day"
                @click="deleteDay(savedDay.id)"
              >
                Yes
              </button>
              <button
                type="button"
                class="btn-cancel-delete-day"
                @click="confirmDeleteDayId = null"
              >
                No
              </button>
            </div>
            <div v-else key="actions" class="saved-day-actions-row">
              <button
                type="button"
                class="btn-action-log"
                @click="openLogModal(savedDay)"
              >
                Log
              </button>
              <button
                type="button"
                class="btn-action-edit"
                @click="editDay(savedDay)"
              >
                Edit
              </button>
              <button
                type="button"
                class="btn-action-delete"
                @click="confirmDeleteDayId = savedDay.id"
              >
                Delete
              </button>
            </div>
          </Transition>
        </div>

        <!-- Exercise table -->
        <div class="saved-day-table-wrap">
          <table class="saved-exercise-table">
            <thead>
              <tr>
                <th scope="col" class="th-exercise-name">Exercise</th>
                <th scope="col" class="th-sets">Sets</th>
                <th scope="col" class="th-reps">Reps</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(ex, j) in (savedDay?.exercises ?? [])" :key="j" class="table-exercise-row">
                <td class="td-exercise-name">
                  <a
                    :href="yt(ex.name)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="table-demo-link"
                    :aria-label="`Watch demonstration for ${ex.name}`"
                  >
                    {{ ex.name }} ↗
                  </a>
                </td>
                <td class="td-sets-num">{{ ex.sets || '—' }}</td>
                <td class="td-reps-num">{{ ex.reps || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </div>
  </section>

  <!-- ═══════════════════════════ LOG MODAL ════════════════════════════ -->
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="logModal.open"
        class="modal-backdrop"
        role="dialog"
        aria-modal="true"
        :aria-label="`Log ${logModal.dayName} workout`"
        @click.self="closeLogModal"
        @keydown.escape="closeLogModal"
      >
        <div class="modal-sheet">
          <!-- Modal header -->
          <div class="modal-header">
            <div>
              <div class="modal-eyebrow">Log Workout</div>
              <div class="modal-title">
                {{ logModal.dayName }}<span v-if="logModal.title" class="modal-subtitle-part"> — {{ logModal.title }}</span>
              </div>
            </div>
            <button
              type="button"
              class="modal-close-btn"
              aria-label="Close log dialog"
              @click="closeLogModal"
            >
              ✕
            </button>
          </div>

          <!-- Exercise inputs -->
          <div class="modal-body">
            <div v-for="(group, exName) in logModal.groups" :key="exName" class="log-exercise-group">
              <div class="log-exercise-title">{{ exName }}</div>
              <div class="log-grid-header">
                <span></span>
                <span class="log-col-label">Target</span>
                <span class="log-col-label">Done</span>
                <span class="log-col-label">Weight (lbs)</span>
              </div>
              <div
                v-for="set in group"
                :key="set.setNumber"
                class="log-grid-row"
              >
                <span class="log-set-label">Set {{ set.setNumber }}</span>
                <span class="log-target-reps">{{ set.reps }}</span>
                <input
                  v-model.number="set.repsDone"
                  type="number"
                  min="0"
                  :placeholder="String(set.reps || '')"
                  class="workout-input log-input"
                  aria-label="Reps completed"
                />
                <input
                  v-model.number="set.weightLbs"
                  type="number"
                  min="0"
                  step="2.5"
                  placeholder="lbs"
                  class="workout-input log-input"
                  aria-label="Weight in pounds"
                />
              </div>
            </div>

            <div v-if="logModal.error" class="log-error-banner" role="alert">
              {{ logModal.error }}
            </div>

            <button
              type="button"
              class="btn-confirm-log"
              :disabled="logModal.saving"
              @click="confirmLog"
            >
              {{ logModal.saving ? 'Logging…' : 'Log Workout' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ── Export Program Modal ─────────────────────────────────── -->
  <ExportModal
    :show="showExportModal"
    :program="exportingProgram"
    @close="showExportModal = false"
  />
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useCustomDaysQuery, invalidateCustomDays } from '@/queries/customDays'
import {
  useCustomProgramsQuery,
  invalidateCustomPrograms,
  createProgram,
  renameProgram,
  saveProgramDay,
  deleteProgramDay,
  deleteProgram,
  activateProgram,
} from '@/queries/programs'
import { invalidateProfile } from '@/queries/profile'
import { logCustomDay } from '@/queries/customLog'
import { invalidateWorkoutHistory } from '@/queries/history'
import { parseSetCount } from '@/lib/workout'
import { program as builtInProgram } from '@/data/program'
import ExportModal from '@/components/ExportModal.vue'

const auth = useAuthStore()
const queryClient = useQueryClient()

const activeTab = ref('programs')
const toastMessage = ref(null)
let _toastTimer = null

const showExportModal = ref(false)
const exportingProgram = ref(null)

function openExportProgram(prog) {
  exportingProgram.value = prog
  showExportModal.value = true
}

function showToast(msg) {
  toastMessage.value = msg
  clearTimeout(_toastTimer)
  _toastTimer = setTimeout(() => {
    toastMessage.value = null
  }, 4000)
}

const userId = computed(() => auth.user?.id)
const { data: customDaysData } = useCustomDaysQuery(userId)
const { data: programsData, isPending: programsLoading } = useCustomProgramsQuery(userId)

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const yt = (q) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(q + ' exercise demonstration')}`

// ── Computed data ──────────────────────────────────────────────
const savedWorkouts = computed(() => customDaysData.value ?? [])
const programs = computed(() => programsData.value ?? [])

// ── Overflow Action Menu State ────────────────────────────────
const openMenuProgramId = ref(null)
const confirmDeleteProgramId = ref(null)

function toggleOverflowMenu(programId) {
  if (openMenuProgramId.value === programId) {
    closeOverflowMenu()
  } else {
    openMenuProgramId.value = programId
    confirmDeleteProgramId.value = null
  }
}

function closeOverflowMenu() {
  openMenuProgramId.value = null
  confirmDeleteProgramId.value = null
}

function handleGlobalClick(e) {
  if (openMenuProgramId.value && !e.target.closest('.overflow-container')) {
    closeOverflowMenu()
  }
}

function handleGlobalKeydown(e) {
  if (e.key === 'Escape') {
    closeOverflowMenu()
    renamingProgramId.value = null
    creatingProgram.value = false
  }
}

onMounted(() => {
  window.addEventListener('click', handleGlobalClick)
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('click', handleGlobalClick)
  window.removeEventListener('keydown', handleGlobalKeydown)
})

// ── Programs: create ──────────────────────────────────────────
const creatingProgram = ref(false)
const newProgramName = ref('')
const savingProgram = ref(false)
const newProgramInput = ref(null)

function startNewProgram() {
  creatingProgram.value = true
  newProgramName.value = ''
  nextTick(() => newProgramInput.value?.focus())
}

async function saveNewProgram() {
  if (!newProgramName.value.trim() || savingProgram.value) return
  savingProgram.value = true
  try {
    await createProgram(auth.user.id, newProgramName.value.trim())
    await invalidateCustomPrograms(queryClient)
    creatingProgram.value = false
    newProgramName.value = ''
    showToast('Created new program template!')
  } finally {
    savingProgram.value = false
  }
}

// ── Active Program Tracking ──────────────────────────────────
const activeProgramId = ref('builtin')

function syncActiveProgramId() {
  const uid = auth.user?.id
  const savedId =
    (uid ? localStorage.getItem(`active-program-id-${uid}`) : null) ||
    localStorage.getItem('active-program-id-last')
  activeProgramId.value = savedId && savedId !== 'builtin' ? savedId : 'builtin'
}

syncActiveProgramId()
onMounted(syncActiveProgramId)
watch(() => auth.user?.id, syncActiveProgramId)

const isBuiltInActive = computed(() => {
  return !activeProgramId.value || activeProgramId.value === 'builtin'
})

function isProgramActive(program) {
  if (!program || isBuiltInActive.value) return false
  return activeProgramId.value === program.id
}

// ── Activate Built-in Program (Build From Zero) ─────────────
const activatingBuiltIn = ref(false)

async function handleActivateBuiltIn() {
  activatingBuiltIn.value = true
  try {
    const uid = auth.user?.id
    if (uid) {
      // 1. Delete custom days for this user
      await supabase.from('custom_days').delete().eq('user_id', uid)
      // 2. Update profile program_adopted
      await supabase.from('profiles').update({ program_adopted: false }).eq('id', uid)
      // 3. Clear localStorage user keys
      localStorage.removeItem(`active-custom-days-v1-${uid}`)
      localStorage.setItem(`active-program-id-${uid}`, 'builtin')
      localStorage.setItem(`active-program-name-${uid}`, 'Build From Zero')
    }
    localStorage.removeItem('active-custom-days-v1-last')
    localStorage.setItem('active-program-id-last', 'builtin')
    localStorage.setItem('active-program-name-last', 'Build From Zero')

    activeProgramId.value = 'builtin'
    if (auth.profile) {
      auth.profile.program_adopted = false
    }

    await Promise.all([
      invalidateCustomDays(queryClient),
      invalidateCustomPrograms(queryClient),
      uid ? invalidateProfile(queryClient, uid) : Promise.resolve(),
    ])

    showToast('Activated "Build From Zero" program!')
  } catch (err) {
    console.error('Failed to activate built-in program:', err)
    showToast('Failed to switch to Build From Zero. Please try again.')
  } finally {
    activatingBuiltIn.value = false
  }
}

// ── Programs: rename ──────────────────────────────────────────
const renamingProgramId = ref(null)
const renameProgramName = ref('')
const renameInput = ref(null)

function startRenameFromMenu(program) {
  renamingProgramId.value = program.id
  renameProgramName.value = program.name
  closeOverflowMenu()
  nextTick(() => renameInput.value?.focus())
}

async function confirmProgramRename(programId) {
  if (!renameProgramName.value.trim()) return
  const newName = renameProgramName.value.trim()
  await renameProgram(programId, newName)
  if (activeProgramId.value === programId) {
    const uid = auth.user?.id
    if (uid) localStorage.setItem(`active-program-name-${uid}`, newName)
    localStorage.setItem('active-program-name-last', newName)
  }
  await invalidateCustomPrograms(queryClient)
  renamingProgramId.value = null
  showToast(`Renamed program to "${newName}"`)
}

// ── Programs: delete ──────────────────────────────────────────
async function handleDeleteProgram(programId) {
  await deleteProgram(programId)
  if (activeProgramId.value === programId) {
    activeProgramId.value = 'builtin'
    const uid = auth.user?.id
    if (uid) {
      localStorage.setItem(`active-program-id-${uid}`, 'builtin')
      localStorage.setItem(`active-program-name-${uid}`, 'Build From Zero')
    }
    localStorage.setItem('active-program-id-last', 'builtin')
    localStorage.setItem('active-program-name-last', 'Build From Zero')
  }
  await invalidateCustomPrograms(queryClient)
  closeOverflowMenu()
  if (expandedProgramId.value === programId) expandedProgramId.value = null
  showToast('Program deleted successfully')
}

// ── Programs: activate ────────────────────────────────────────
const activatingProgramId = ref(null)

async function handleActivateProgram(program) {
  const daysList = program.custom_program_days ?? []
  if (!daysList.length) {
    showToast('Add exercises to this program before activating!')
    return
  }
  activatingProgramId.value = program.id
  try {
    if (auth.user?.id) {
      await activateProgram(auth.user.id, daysList)
      await auth.adoptProgram()
    }
    activeProgramId.value = program.id

    // Build cache rows — ensure exercises is always a plain array
    const rows = daysList.map((d) => {
      let exList = d.exercises
      if (typeof exList === 'string') {
        try {
          exList = JSON.parse(exList)
        } catch {
          exList = []
        }
      }
      if (!Array.isArray(exList)) exList = []
      return {
        user_id: auth.user?.id,
        day_name: d.day_name,
        title: d.title ?? '',
        programTitle: program.name,
        exercises: exList,
      }
    })

    // Save to instant local cache so ProgramView renders synchronously without delay
    try {
      const uid = auth.user?.id
      const k = uid ? `active-custom-days-v1-${uid}` : 'active-custom-days-v1-anon'
      localStorage.setItem(k, JSON.stringify(rows))
      localStorage.setItem('active-custom-days-v1-last', JSON.stringify(rows))
      if (uid) {
        localStorage.setItem(`active-program-id-${uid}`, program.id)
        localStorage.setItem(`active-program-name-${uid}`, program.name)
      }
      localStorage.setItem('active-program-id-last', program.id)
      localStorage.setItem('active-program-name-last', program.name)
    } catch {}

    await Promise.all([
      invalidateCustomDays(queryClient),
      invalidateCustomPrograms(queryClient),
    ])

    showToast(`"${program.name}" is now active in your program!`)
  } catch (err) {
    console.error('Failed to activate custom program:', err)
    showToast('Failed to activate program. Please try again.')
  } finally {
    activatingProgramId.value = null
  }
}

// ── Programs: expand editor ───────────────────────────────────
const expandedProgramId = ref(null)
const expandedProgramDay = ref(null)

const programDayDraft = ref({})
let _draftId = 0

function getProgramDay(program, dayName) {
  return (program.custom_program_days ?? []).find((d) => d.day_name === dayName) ?? null
}

function getOrInitDraft(programId, dayName) {
  const key = `${programId}|${dayName}`
  if (!programDayDraft.value[key]) {
    const program = programs.value.find((p) => p.id === programId)
    const existing = getProgramDay(program, dayName)
    programDayDraft.value[key] = {
      title: existing?.title ?? '',
      exercises: existing?.exercises?.length
        ? existing.exercises.map((e) => ({ _id: _draftId++, name: e.name, sets: e.sets, reps: e.reps }))
        : [{ _id: _draftId++, name: '', sets: '', reps: '' }],
    }
  }
  return programDayDraft.value[key]
}

function importSavedDayIntoProgram(programId, dayName, savedDayId) {
  const sd = savedWorkouts.value.find((item) => item.id === savedDayId)
  if (!sd) return
  const draft = getOrInitDraft(programId, dayName)
  draft.title = sd.title ?? ''
  draft.exercises = (sd.exercises ?? []).map((e) => ({
    _id: _draftId++,
    name: e.name,
    sets: e.sets,
    reps: e.reps,
  }))
  showToast(`Copied "${sd.day_name}${sd.title ? ' — ' + sd.title : ''}" into ${dayName}!`)
}

function toggleProgramEditor(programId) {
  expandedProgramId.value = expandedProgramId.value === programId ? null : programId
  expandedProgramDay.value = null
}

function toggleProgramDay(programId, dayName) {
  const key = `${programId}|${dayName}`
  if (expandedProgramDay.value === key) {
    expandedProgramDay.value = null
  } else {
    expandedProgramDay.value = key
    getOrInitDraft(programId, dayName)
  }
}

function addProgramExercise(programId, dayName) {
  getOrInitDraft(programId, dayName).exercises.push({ _id: _draftId++, name: '', sets: '', reps: '' })
}

function removeProgramExercise(programId, dayName, idx) {
  const draft = getOrInitDraft(programId, dayName)
  if (draft.exercises.length === 1) {
    const id = draft.exercises[0]._id
    draft.exercises[0] = { _id: id, name: '', sets: '', reps: '' }
  } else {
    draft.exercises.splice(idx, 1)
  }
}

function moveProgramExerciseUp(programId, dayName, idx) {
  const draft = getOrInitDraft(programId, dayName)
  if (idx <= 0 || !draft.exercises[idx]) return
  const temp = draft.exercises[idx]
  draft.exercises[idx] = draft.exercises[idx - 1]
  draft.exercises[idx - 1] = temp
}

function moveProgramExerciseDown(programId, dayName, idx) {
  const draft = getOrInitDraft(programId, dayName)
  if (idx >= draft.exercises.length - 1 || !draft.exercises[idx]) return
  const temp = draft.exercises[idx]
  draft.exercises[idx] = draft.exercises[idx + 1]
  draft.exercises[idx + 1] = temp
}

const savingProgramDay = ref(null)

async function saveProgramDayHandler(programId, dayName) {
  const key = `${programId}|${dayName}`
  const draft = programDayDraft.value[key]
  if (!draft) return
  const clean = draft.exercises
    .filter((e) => e.name.trim())
    .map(({ name, sets, reps }) => ({ name, sets, reps }))
  savingProgramDay.value = key
  try {
    await saveProgramDay(programId, dayName, draft.title.trim(), clean)
    await invalidateCustomPrograms(queryClient)
    expandedProgramDay.value = null
    delete programDayDraft.value[key]
    showToast(`Saved exercises for ${dayName}`)
  } finally {
    savingProgramDay.value = null
  }
}

async function handleDeleteProgramDay(programId, dayName) {
  await deleteProgramDay(programId, dayName)
  await invalidateCustomPrograms(queryClient)
  const key = `${programId}|${dayName}`
  expandedProgramDay.value = null
  delete programDayDraft.value[key]
  showToast(`Cleared ${dayName}`)
}

// ── Quick day override & Builder ──────────────────────────────
const confirmDeleteDayId = ref(null)
const editingCustomDayId = ref(null)

const selectedDay = ref('Monday')
const planTitle = ref('')

let _exId = 0
const newEx = () => ({ _id: _exId++, name: '', sets: '', reps: '' })
const exercises = ref([newEx()])

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

function moveExerciseUp(i) {
  if (i <= 0) return
  const temp = exercises.value[i]
  exercises.value[i] = exercises.value[i - 1]
  exercises.value[i - 1] = temp
}

function moveExerciseDown(i) {
  if (i >= exercises.value.length - 1) return
  const temp = exercises.value[i]
  exercises.value[i] = exercises.value[i + 1]
  exercises.value[i + 1] = temp
}

function resetDayBuilder() {
  editingCustomDayId.value = null
  planTitle.value = ''
  exercises.value = [newEx()]
}

async function saveWorkout() {
  const toSave = exercises.value.filter((e) => e.name.trim())
  if (!toSave.length) return

  const clean = toSave.map(({ name, sets, reps }) => ({ name, sets, reps }))

  if (editingCustomDayId.value) {
    const { error } = await supabase
      .from('custom_days')
      .update({ day_name: selectedDay.value, title: planTitle.value.trim(), exercises: clean })
      .eq('id', editingCustomDayId.value)
    if (error) throw error
    showToast(`Updated custom day version for ${selectedDay.value}!`)
  } else {
    const { error } = await supabase
      .from('custom_days')
      .insert({ user_id: auth.user.id, day_name: selectedDay.value, title: planTitle.value.trim(), exercises: clean })
    if (error) throw error
    showToast(`Saved new custom day version for ${selectedDay.value}!`)
  }

  await invalidateCustomDays(queryClient)
  resetDayBuilder()
}

async function deleteDay(id) {
  await supabase.from('custom_days').delete().eq('id', id)
  await invalidateCustomDays(queryClient)
  confirmDeleteDayId.value = null
  if (editingCustomDayId.value === id) resetDayBuilder()
  showToast('Custom day removed')
}

function editDay(savedDay) {
  editingCustomDayId.value = savedDay.id
  exercises.value = (savedDay.exercises ?? []).map((e) => ({ _id: _exId++, name: e.name, sets: e.sets, reps: e.reps }))
  planTitle.value = savedDay.title ?? ''
  selectedDay.value = savedDay.day_name
  activeTab.value = 'overrides'
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ── Log modal ──────────────────────────────────────────────────
const logModal = ref({
  open: false,
  dayName: '',
  title: '',
  groups: {},
  saving: false,
  error: null,
})

function buildLogGroups(exerciseList) {
  const groups = {}
  for (const ex of exerciseList) {
    if (!ex.name.trim()) continue
    const setCount = parseSetCount(ex.sets) || 1
    const reps = ex.reps || ''
    groups[ex.name] = Array.from({ length: setCount }, (_, i) => ({
      setNumber: i + 1,
      reps,
      repsDone: null,
      weightLbs: null,
    }))
  }
  return groups
}

function openLogModal(savedDay) {
  const exList = savedDay?.exercises ?? []
  logModal.value = {
    open: true,
    dayName: savedDay.day_name,
    title: savedDay?.title ?? '',
    groups: buildLogGroups(exList),
    saving: false,
    error: null,
  }
}

function closeLogModal() {
  logModal.value.open = false
}

async function confirmLog() {
  logModal.value.saving = true
  logModal.value.error = null
  try {
    const setOverrides = []
    for (const [exName, sets] of Object.entries(logModal.value.groups)) {
      for (const set of sets) {
        setOverrides.push({
          exerciseName: exName,
          setNumber: set.setNumber,
          repsDone: set.repsDone ?? null,
          weightLbs: set.weightLbs ?? null,
        })
      }
    }

    const dayData = savedWorkouts.value.find((sd) => sd.day_name === logModal.value.dayName)
    const exList = dayData?.exercises ?? []

    await logCustomDay(
      auth.user.id,
      logModal.value.dayName,
      logModal.value.title,
      exList,
      setOverrides,
    )
    await invalidateWorkoutHistory(queryClient)
    closeLogModal()
    showToast(`Logged ${logModal.value.dayName} workout to History!`)
  } catch (err) {
    logModal.value.error = err?.message ?? 'Failed to log workout. Please try again.'
  } finally {
    logModal.value.saving = false
  }
}
</script>

<style scoped>
/* ── Design Tokens & Base Theme ──────────────────────────────── */
:root {
  --color-bg-base: oklch(8% 0.012 45);
  --color-bg-surface: oklch(10% 0.01 45);
  --color-bg-surface-elevated: oklch(12% 0.008 45);
  --color-border: oklch(18% 0.008 45);
  --color-border-subtle: oklch(14% 0.008 45);
  --color-text-primary: #f5f5f5;
  --color-text-secondary: #a3a3a3;
  --color-text-tertiary: #737373;
  --color-accent-purple: #a78bfa;
  --color-accent-purple-light: #c4b5fd;
  --color-accent-green: #22c55e;
  --color-accent-green-bg: #14532d;
  --color-danger: #f87171;
  --color-danger-bg: #7f3535;
}

/* ── Page Header ─────────────────────────────────────────────── */
.custom-header {
  border-bottom: 1px solid oklch(15% 0.008 45);
  padding: 32px 20px 24px;
  text-align: center;
  background: oklch(9% 0.01 45);
}

.custom-eyebrow {
  font-size: 0.6875rem;
  letter-spacing: 4px;
  color: #a3a3a3;
  text-transform: uppercase;
  margin-bottom: 8px;
  font-weight: 600;
}

.custom-title {
  font-size: clamp(1.75rem, 5vw, 2.75rem);
  font-weight: 400;
  margin: 0;
  color: #f5f5f5;
  letter-spacing: -1px;
  font-family: Georgia, serif;
}

.custom-subtitle {
  font-size: 0.875rem;
  color: #a3a3a3;
  margin: 8px 0 0;
  font-style: italic;
}

/* ── Segmented Navigation ────────────────────────────────────── */
.segmented-nav {
  display: flex;
  max-width: 440px;
  margin: 20px auto 0;
  background: oklch(12% 0.008 45);
  padding: 4px;
  border-radius: 9999px;
  border: 1px solid oklch(18% 0.008 45);
  gap: 4px;
}

.tab-btn {
  flex: 1;
  padding: 10px 16px;
  min-height: 44px;
  border-radius: 9999px;
  background: transparent;
  color: #a3a3a3;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  transition: all 180ms ease-out;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.tab-btn.active {
  background: #a78bfa;
  color: #ffffff;
  box-shadow: 0 2px 10px rgba(167, 139, 250, 0.3);
}

/* ── Toast Pill Feedback ─────────────────────────────────────── */
.toast-pill {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #15803d;
  color: #ffffff;
  padding: 12px 24px;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 600;
  z-index: 1000;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #22c55e;
}

.toast-icon {
  font-weight: 700;
}

/* ── Section & Layout ────────────────────────────────────────── */
.program-section {
  max-width: 680px;
  margin: 28px auto 60px;
  padding: 0 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 12px;
}

.section-title {
  font-size: 0.6875rem;
  letter-spacing: 2px;
  color: #a3a3a3;
  text-transform: uppercase;
  font-weight: 600;
}

/* ── New Program Form ────────────────────────────────────────── */
.btn-new-program {
  padding: 8px 18px;
  min-height: 44px;
  background: #a78bfa22;
  border: 1px solid #a78bfa;
  border-radius: 9999px;
  color: #c4b5fd;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 1px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 150ms ease-out;
}

.btn-new-program:hover {
  background: #a78bfa33;
  color: #ffffff;
}

.new-program-card {
  margin-bottom: 16px;
  padding: 16px;
  background: oklch(10% 0.01 45);
  border: 1px solid #a78bfa66;
  border-radius: 12px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.new-program-input {
  flex: 1;
  min-height: 44px;
}

.btn-create-submit {
  padding: 10px 20px;
  min-height: 44px;
  background: #a78bfa;
  border: none;
  border-radius: 9999px;
  color: #ffffff;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 1px;
  white-space: nowrap;
  transition: background 200ms;
}

.btn-create-submit:disabled {
  background: oklch(16% 0.008 45);
  color: #737373;
  cursor: not-allowed;
}

.btn-icon-cancel {
  background: transparent;
  border: none;
  color: #a3a3a3;
  cursor: pointer;
  font-size: 1.25rem;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

/* ── Program Cards ───────────────────────────────────────────── */
.programs-loading-state {
  padding: 36px 0;
  text-align: center;
  color: #a3a3a3;
  font-size: 0.875rem;
}

.empty-state-card {
  padding: 40px 20px;
  border: 1px dashed oklch(22% 0.008 45);
  border-radius: 12px;
  text-align: center;
  margin-bottom: 36px;
}

.empty-state-title {
  font-size: 1rem;
  color: #e5e5e5;
  font-weight: 500;
}

.empty-state-desc {
  font-size: 0.8125rem;
  color: #a3a3a3;
  margin-top: 6px;
  line-height: 1.5;
}

.programs-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.program-card {
  border: 1px solid oklch(18% 0.008 45);
  border-radius: 12px;
  overflow: visible;
  background: oklch(10% 0.01 45);
  transition: border-color 200ms ease, box-shadow 200ms ease;
  position: relative;
}

.program-card.is-active {
  border-color: #22c55e;
  box-shadow: 0 0 0 1px #22c55e44, 0 6px 24px -4px #22c55e22;
}

.program-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 18px;
  background: oklch(11% 0.01 45);
  border-radius: 12px;
  gap: 12px;
  flex-wrap: wrap;
}

.program-card-header.is-active {
  background: oklch(12% 0.02 145);
}

.program-header-info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.program-name-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.program-title-text {
  font-size: 1.0625rem;
  color: #f5f5f5;
  font-weight: 600;
}

.badge-active {
  font-size: 0.6875rem;
  padding: 3px 10px;
  border-radius: 20px;
  background: #22c55e22;
  color: #4ade80;
  border: 1px solid #22c55e55;
  font-weight: 700;
}

.badge-days-count {
  font-size: 0.6875rem;
  padding: 3px 10px;
  border-radius: 20px;
  background: oklch(16% 0.008 45);
  color: #a3a3a3;
  font-weight: 500;
}

.rename-inline-form {
  display: flex;
  gap: 8px;
  align-items: center;
  flex: 1;
  width: 100%;
}

.rename-input {
  flex: 1;
  font-size: 0.875rem;
  padding: 8px 12px;
  min-height: 44px;
}

.btn-save-rename {
  padding: 8px 16px;
  min-height: 44px;
  background: #a78bfa;
  border: none;
  border-radius: 9999px;
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-cancel-rename {
  min-width: 44px;
  min-height: 44px;
  background: transparent;
  border: 1px solid oklch(24% 0.008 45);
  border-radius: 9999px;
  color: #a3a3a3;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Program Actions (Primary 48px + Overflow Menu) ──────────── */
.program-actions-group {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.btn-primary-action {
  padding: 10px 18px;
  min-height: 48px;
  border-radius: 24px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 160ms ease-out;
}

.btn-edit-days {
  background: oklch(14% 0.008 45);
  border: 1px solid oklch(24% 0.008 45);
  color: #c4b5fd;
}

.btn-edit-days:hover,
.btn-edit-days.expanded {
  background: oklch(18% 0.008 45);
  border-color: #a78bfa66;
  color: #ffffff;
}

.btn-active-plan {
  background: #14532d;
  border: 1px solid #22c55e;
  color: #4ade80;
  font-weight: 700;
  cursor: default;
  opacity: 1;
}

.btn-activate-plan {
  background: #166534;
  border: 1px solid #22c55e;
  color: #ffffff;
}

.btn-activate-plan:hover {
  background: #15803d;
}

/* ── 3-Dots Overflow Action Menu ─────────────────────────────── */
.overflow-container {
  position: relative;
  display: inline-flex;
}

.btn-overflow-trigger {
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  border-radius: 50%;
  background: oklch(14% 0.008 45);
  border: 1px solid oklch(22% 0.008 45);
  color: #d4d4d4;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  transition: all 150ms ease-out;
}

.btn-overflow-trigger:hover {
  background: oklch(18% 0.008 45);
  color: #ffffff;
  border-color: #a78bfa55;
}

.overflow-dots {
  line-height: 1;
  font-size: 1.25rem;
}

.overflow-dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: oklch(12% 0.01 45);
  border: 1px solid oklch(22% 0.008 45);
  border-radius: 12px;
  padding: 6px;
  min-width: 220px;
  z-index: 120;
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.7);
}

.overflow-menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  min-height: 44px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #e5e5e5;
  font-size: 0.8125rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease;
}

.overflow-menu-item:hover {
  background: oklch(16% 0.008 45);
  color: #ffffff;
}

.overflow-menu-item.item-danger {
  color: #fca5a5;
}

.overflow-menu-item.item-danger:hover {
  background: #7f353533;
  color: #f87171;
}

.menu-item-icon {
  font-size: 0.9375rem;
  width: 18px;
  text-align: center;
}

.overflow-menu-divider {
  height: 1px;
  background: oklch(18% 0.008 45);
  margin: 4px 6px;
}

/* ── 2-Step In-Menu Deletion Confirmation ─────────────────────── */
.overflow-delete-confirmation {
  padding: 10px 8px;
}

.delete-warning-text {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #f87171;
  margin: 0 0 4px;
}

.delete-subtext {
  font-size: 0.6875rem;
  color: #a3a3a3;
  line-height: 1.4;
  margin: 0 0 12px;
}

.delete-confirm-actions {
  display: flex;
  gap: 8px;
}

.btn-confirm-delete {
  flex: 1;
  padding: 8px 12px;
  min-height: 44px;
  background: #7f3535;
  border: 1px solid #f87171;
  border-radius: 8px;
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 150ms;
}

.btn-confirm-delete:hover {
  background: #991b1b;
}

.btn-cancel-delete {
  padding: 8px 14px;
  min-height: 44px;
  background: transparent;
  border: 1px solid oklch(24% 0.008 45);
  border-radius: 8px;
  color: #a3a3a3;
  font-size: 0.75rem;
  cursor: pointer;
  transition: color 150ms;
}

.btn-cancel-delete:hover {
  color: #ffffff;
  border-color: oklch(32% 0.008 45);
}

/* ── Program Day Drawer & Accordion ───────────────────────────── */
.program-day-editor-drawer {
  background: oklch(8% 0.01 45);
  border-top: 1px solid oklch(16% 0.008 45);
  border-radius: 0 0 12px 12px;
}

.program-day-row {
  border-bottom: 1px solid oklch(13% 0.008 45);
}

.program-day-row:last-child {
  border-bottom: none;
}

.day-row-header-btn {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  min-height: 48px;
  transition: background 140ms ease;
}

.day-row-header-btn:hover {
  background: oklch(10% 0.008 45);
}

.day-header-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.day-name-tag {
  font-size: 0.6875rem;
  color: #a3a3a3;
  letter-spacing: 2px;
  text-transform: uppercase;
  font-weight: 600;
  min-width: 84px;
}

.day-title-tag {
  font-size: 0.8125rem;
  color: #e5e5e5;
  font-weight: 500;
}

.day-empty-hint {
  font-size: 0.75rem;
  color: #737373;
  font-style: italic;
}

.day-accordion-icon {
  color: #a3a3a3;
  font-size: 1.125rem;
}

.day-editor-content {
  padding: 12px 18px 20px;
}

.import-saved-day-box {
  margin-bottom: 16px;
  padding: 12px;
  background: oklch(12% 0.008 45);
  border: 1px solid #a78bfa44;
  border-radius: 8px;
}

.import-label {
  display: block;
  font-size: 0.625rem;
  letter-spacing: 1.5px;
  color: #c4b5fd;
  text-transform: uppercase;
  font-weight: 600;
  margin-bottom: 8px;
}

.import-select {
  width: 100%;
  padding: 10px 12px;
  background: oklch(8% 0.012 45);
  border: 1px solid oklch(24% 0.008 45);
  border-radius: 6px;
  color: #ffffff;
  font-size: 0.875rem;
  min-height: 44px;
  cursor: pointer;
}

.import-select:focus-visible {
  outline: 2px solid #a78bfa;
  outline-offset: 2px;
}

/* ── Form Inputs & Tokens ─────────────────────────────────────── */
.form-field-group {
  margin-bottom: 16px;
}

.field-label {
  display: block;
  font-size: 0.625rem;
  letter-spacing: 2px;
  color: #a3a3a3;
  text-transform: uppercase;
  font-weight: 600;
  margin-bottom: 6px;
}

.optional-hint {
  text-transform: none;
  letter-spacing: 0;
  color: #737373;
  font-weight: 400;
}

.exercises-header-label {
  margin-bottom: 10px;
}

.workout-input {
  width: 100%;
  background: oklch(8% 0.012 45);
  border: 1px solid oklch(24% 0.008 45);
  border-radius: 6px;
  padding: 10px 12px;
  color: #ffffff;
  font-size: 0.875rem;
  min-height: 44px;
  box-sizing: border-box;
  transition: border-color 150ms ease-out, box-shadow 150ms ease-out;
}

.workout-input:focus-visible {
  outline: 2px solid #a78bfa;
  outline-offset: 2px;
  border-color: #a78bfa;
}

.flex-input {
  flex: 1;
}

.center-input {
  text-align: center;
}

/* ── Exercise Item Cards & 44px Stepper Controls ──────────────── */
.exercise-list-group {
  position: relative;
}

.exercise-item-card {
  margin-bottom: 10px;
  padding: 14px;
  background: oklch(11% 0.01 45);
  border: 1px solid oklch(18% 0.008 45);
  border-radius: 8px;
}

.exercise-card-main-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
}

.exercise-index {
  font-size: 0.75rem;
  color: #a3a3a3;
  min-width: 20px;
  text-align: right;
}

.stepper-actions-group {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.stepper-btn {
  background: oklch(14% 0.008 45);
  border: 1px solid oklch(22% 0.008 45);
  border-radius: 6px;
  color: #c4b5fd;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 700;
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 140ms ease-out;
}

.stepper-btn:hover:not(:disabled) {
  background: oklch(18% 0.008 45);
  color: #ffffff;
}

.stepper-btn:disabled {
  opacity: 0.25;
  cursor: default;
}

.stepper-btn.remove-btn {
  background: transparent;
  border-color: transparent;
  color: #a3a3a3;
  font-size: 1.375rem;
}

.stepper-btn.remove-btn:hover {
  background: #7f353533;
  color: #f87171;
  border-color: #f8717133;
}

.sets-reps-row {
  display: flex;
  gap: 10px;
}

.set-rep-col {
  flex: 1;
  text-align: center;
}

.mini-label {
  display: block;
  font-size: 0.625rem;
  letter-spacing: 2px;
  color: #a3a3a3;
  text-transform: uppercase;
  margin-bottom: 4px;
  font-weight: 600;
}

.demo-link-row {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.exercise-demo-link {
  font-size: 0.75rem;
  color: #c4b5fd;
  text-decoration: none;
  border-bottom: 1px dashed #a78bfa77;
  padding-bottom: 1px;
  transition: opacity 120ms;
}

.exercise-demo-link:hover {
  opacity: 0.8;
}

.demo-placeholder-text {
  font-size: 0.75rem;
  color: #737373;
  font-style: italic;
}

.btn-add-exercise {
  width: 100%;
  min-height: 48px;
  padding: 12px;
  background: transparent;
  border: 1px dashed oklch(24% 0.008 45);
  border-radius: 8px;
  color: #a3a3a3;
  cursor: pointer;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 12px;
  transition: all 150ms ease-out;
}

.btn-add-exercise:hover {
  border-color: #a78bfa;
  color: #c4b5fd;
  background: #a78bfa11;
}

.day-save-actions-row {
  display: flex;
  gap: 10px;
}

.btn-save-day {
  flex: 1;
  padding: 12px;
  min-height: 48px;
  background: #a78bfa;
  border: none;
  border-radius: 9999px;
  color: #ffffff;
  cursor: pointer;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  transition: opacity 200ms;
}

.btn-save-day:disabled {
  opacity: 0.6;
  cursor: wait;
}

.btn-clear-day {
  padding: 12px 20px;
  min-height: 48px;
  background: transparent;
  border: 1px solid oklch(22% 0.008 45);
  border-radius: 9999px;
  color: #a3a3a3;
  cursor: pointer;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  transition: all 140ms;
}

.btn-clear-day:hover {
  border-color: oklch(30% 0.008 45);
  color: #f5f5f5;
}

/* ── Day Builder Tab 2 ───────────────────────────────────────── */
.btn-new-version {
  padding: 6px 14px;
  min-height: 44px;
  background: transparent;
  border: 1px solid oklch(24% 0.008 45);
  border-radius: 9999px;
  color: #a3a3a3;
  cursor: pointer;
  font-size: 0.6875rem;
  font-weight: 500;
}

.day-selector-group {
  margin-bottom: 24px;
}

.day-pills-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.day-pill-btn {
  padding: 10px 16px;
  min-height: 44px;
  background: transparent;
  border: 1px solid oklch(22% 0.008 45);
  border-radius: 9999px;
  color: #a3a3a3;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 1px;
  transition: all 150ms ease-out;
}

.day-pill-btn.selected {
  background: #a78bfa22;
  border-color: #a78bfa;
  color: #c4b5fd;
}

.btn-save-workout-version {
  width: 100%;
  padding: 14px;
  min-height: 48px;
  background: #a78bfa;
  border: none;
  border-radius: 9999px;
  color: #ffffff;
  cursor: pointer;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-bottom: 40px;
  transition: background 200ms ease-out, color 200ms ease-out;
}

.btn-save-workout-version:disabled {
  background: oklch(12% 0.008 45);
  color: #737373;
  cursor: default;
}

/* ── Saved Custom Days ───────────────────────────────────────── */
.saved-days-container {
  margin-top: 10px;
}

.saved-days-heading {
  margin-bottom: 12px;
}

.saved-day-card {
  margin-bottom: 12px;
  border: 1px solid oklch(18% 0.008 45);
  border-radius: 10px;
  overflow: hidden;
  background: oklch(10% 0.01 45);
}

.saved-day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  background: oklch(11% 0.01 45);
  flex-wrap: wrap;
  gap: 10px;
}

.saved-day-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.saved-day-badge-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.badge-custom {
  font-size: 0.6875rem;
  padding: 3px 10px;
  border-radius: 20px;
  background: #a78bfa22;
  color: #c4b5fd;
  letter-spacing: 1px;
  text-transform: uppercase;
  font-weight: 500;
}

.saved-day-title-text {
  font-size: 0.9375rem;
  color: #f5f5f5;
  font-weight: 500;
  letter-spacing: -0.2px;
  padding-left: 90px;
}

.saved-day-actions-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.btn-action-log {
  padding: 8px 16px;
  min-height: 44px;
  background: #166534;
  border: 1px solid #22c55e;
  border-radius: 20px;
  color: #ffffff;
  cursor: pointer;
  font-size: 0.6875rem;
  font-weight: 600;
}

.btn-action-edit {
  padding: 8px 16px;
  min-height: 44px;
  background: oklch(14% 0.008 45);
  border: 1px solid oklch(24% 0.008 45);
  border-radius: 20px;
  color: #c4b5fd;
  cursor: pointer;
  font-size: 0.6875rem;
  font-weight: 500;
}

.btn-action-delete {
  padding: 8px 14px;
  min-height: 44px;
  background: transparent;
  border: 1px solid #7f353555;
  border-radius: 20px;
  color: #fca5a5;
  cursor: pointer;
  font-size: 0.6875rem;
  font-weight: 500;
}

.confirm-delete-day-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.confirm-query-text {
  font-size: 0.75rem;
  color: #a3a3a3;
  margin-right: 4px;
}

.btn-danger-confirm-day {
  padding: 8px 16px;
  min-height: 44px;
  background: #7f3535;
  border: 1px solid #f87171;
  border-radius: 20px;
  color: #ffffff;
  font-size: 0.6875rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-cancel-delete-day {
  padding: 8px 14px;
  min-height: 44px;
  background: transparent;
  border: 1px solid oklch(24% 0.008 45);
  border-radius: 20px;
  color: #a3a3a3;
  font-size: 0.6875rem;
  cursor: pointer;
}

.saved-day-table-wrap {
  padding: 0 18px 16px;
  background: oklch(10% 0.01 45);
}

.saved-exercise-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  line-height: 1.4;
}

.th-exercise-name {
  padding: 10px 0 6px;
  font-size: 0.625rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  font-weight: 600;
  text-align: left;
  color: #a3a3a3;
}

.th-sets,
.th-reps {
  padding: 10px 0 6px;
  font-size: 0.625rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  text-align: center;
  font-weight: 600;
  color: #a3a3a3;
}

.table-exercise-row {
  border-top: 1px solid oklch(15% 0.008 45);
}

.td-exercise-name {
  padding: 12px 8px 12px 0;
}

.table-demo-link {
  color: #c4b5fd;
  text-decoration: none;
  border-bottom: 1px dashed #a78bfa77;
  padding-bottom: 1px;
  font-size: 0.9375rem;
  font-weight: 500;
}

.td-sets-num {
  text-align: center;
  color: #a78bfa;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  padding: 12px 4px;
  font-size: 1rem;
}

.td-reps-num {
  text-align: center;
  color: #e5e5e5;
  font-variant-numeric: tabular-nums;
  padding: 12px 0 12px 4px;
  white-space: nowrap;
}

/* ── Log Modal ────────────────────────────────────────────────── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  padding: 0;
}

.modal-sheet {
  width: 100%;
  max-width: 640px;
  background: oklch(11% 0.01 45);
  border-radius: 16px 16px 0 0;
  border: 1px solid oklch(22% 0.008 45);
  max-height: 88vh;
  overflow-y: auto;
}

.modal-header {
  padding: 20px 20px 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: sticky;
  top: 0;
  background: oklch(11% 0.01 45);
  border-bottom: 1px solid oklch(16% 0.008 45);
  z-index: 10;
}

.modal-eyebrow {
  font-size: 0.625rem;
  letter-spacing: 3px;
  color: #a3a3a3;
  text-transform: uppercase;
  margin-bottom: 4px;
  font-weight: 600;
}

.modal-title {
  font-size: 1.125rem;
  color: #ffffff;
  font-weight: 600;
}

.modal-subtitle-part {
  color: #a3a3a3;
}

.modal-close-btn {
  background: transparent;
  border: none;
  color: #a3a3a3;
  cursor: pointer;
  font-size: 1.5rem;
  line-height: 1;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.modal-close-btn:hover {
  color: #ffffff;
}

.modal-body {
  padding: 20px;
}

.log-exercise-group {
  margin-bottom: 20px;
}

.log-exercise-title {
  font-size: 0.9375rem;
  color: #ffffff;
  margin-bottom: 10px;
  font-weight: 600;
}

.log-grid-header {
  display: grid;
  grid-template-columns: 50px 1fr 1fr 1fr;
  gap: 8px;
  margin-bottom: 6px;
}

.log-col-label {
  font-size: 0.625rem;
  color: #a3a3a3;
  text-align: center;
  text-transform: uppercase;
  font-weight: 600;
}

.log-grid-row {
  display: grid;
  grid-template-columns: 50px 1fr 1fr 1fr;
  gap: 8px;
  margin-bottom: 6px;
  align-items: center;
}

.log-set-label {
  font-size: 0.75rem;
  color: #a3a3a3;
  font-weight: 500;
}

.log-target-reps {
  font-size: 0.8125rem;
  color: #a3a3a3;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.log-input {
  text-align: center;
  min-height: 44px;
  -moz-appearance: textfield;
}

.log-input::-webkit-outer-spin-button,
.log-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.log-error-banner {
  font-size: 0.8125rem;
  color: #f87171;
  margin-bottom: 14px;
}

.btn-confirm-log {
  width: 100%;
  padding: 16px;
  min-height: 52px;
  background: #22c55e;
  border: none;
  border-radius: 9999px;
  color: #ffffff;
  cursor: pointer;
  font-size: 0.75rem;
  letter-spacing: 3px;
  text-transform: uppercase;
  font-weight: 700;
  transition: background 200ms;
}

.btn-confirm-log:disabled {
  background: oklch(14% 0.008 45);
  color: #737373;
  cursor: wait;
}

/* ── Focus rings ─────────────────────────────────────────────── */
button:focus-visible,
input:focus-visible,
select:focus-visible,
a:focus-visible {
  outline: 2px solid #a78bfa;
  outline-offset: 2px;
}

/* ── Vue Transitions ─────────────────────────────────────────── */
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

.rename-slide-enter-active {
  transition: opacity 180ms ease-out, transform 180ms cubic-bezier(0.25, 1, 0.5, 1);
}
.rename-slide-leave-active {
  transition: opacity 120ms ease-in, transform 120ms ease-in;
}
.rename-slide-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
.rename-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.dropdown-pop-enter-active {
  transition: opacity 140ms ease-out, transform 140ms cubic-bezier(0.16, 1, 0.3, 1);
}
.dropdown-pop-leave-active {
  transition: opacity 100ms ease-in, transform 100ms ease-in;
}
.dropdown-pop-enter-from {
  opacity: 0;
  transform: translateY(-6px) scale(0.96);
}
.dropdown-pop-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.96);
}

.modal-enter-active {
  transition: opacity 200ms ease-out;
}
.modal-leave-active {
  transition: opacity 150ms ease-in;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
