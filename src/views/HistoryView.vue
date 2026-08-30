<template>
  <div
    style="
      border-bottom: 1px solid oklch(15% 0.008 45);
      padding: 32px 24px 20px;
      text-align: center;
    "
  >
    <div class="history-eyebrow">Your Log</div>
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
    <p class="history-subtitle">Completed sessions · tap to expand</p>
  </div>

  <div style="max-width: 640px; margin: 24px auto 0; padding: 0 16px">
    <div v-if="loading" class="history-loading">Loading history…</div>

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
      <div class="history-empty-title">No workouts logged yet</div>
      <div class="history-empty-hint">
        Open a day on the Program page and tap <strong style="color: #d4d4d4; font-weight: 500">Log workout</strong>
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
          <div class="history-stat-label">Sessions</div>
        </div>
        <div style="width: 1px; background: oklch(17% 0.008 45)" />
        <div style="flex: 1; text-align: center">
          <div style="font-size: 1.25rem; color: #e8e8e8; font-variant-numeric: tabular-nums">
            {{ totalSets }}
          </div>
          <div class="history-stat-label">Sets logged</div>
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
            padding: '16px 16px',
            background: expandedId === session.id ? 'oklch(12.5% 0.008 45)' : 'oklch(10% 0.01 45)',
            border: 'none',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            textAlign: 'left',
            color: '#f5f5f5',
            minHeight: '52px',
            transition: 'background 180ms ease-out',
          }"
        >
          <div style="display: flex; align-items: flex-start; gap: 10px; flex: 1">
            <span
              :style="{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: sessionAccentColor(session),
                marginTop: '6px',
                flexShrink: 0,
              }"
            />
            <div style="flex: 1">
              <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 4px">
                <span style="font-size: 0.9375rem; font-weight: 500">{{ session.day_name }}</span>
                <!-- Custom session badge -->
                <span v-if="session.phase == null"
                  style="font-size: 10px; padding: 3px 10px; border-radius: 20px; background: #a78bfa22; color: #c4b5fd; letter-spacing: 1px; text-transform: uppercase; font-weight: 500"
                >Custom</span>
                <!-- Program session badge -->
                <span v-else
                  :style="{
                    fontSize: '10px',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    background: `${phaseMeta(session.phase).color}22`,
                    color: phaseMeta(session.phase).color,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    fontWeight: '500',
                  }"
                >{{ phaseMeta(session.phase).name }}</span>
                <span v-if="session.track && session.track !== 'custom'" style="font-size: 11px; color: var(--color-text-secondary)">
                  {{ session.track === 'gym' ? 'Gym' : 'Home' }}
                </span>
              </div>
              <div style="font-size: 12px; color: var(--color-text-secondary); display: flex; flex-wrap: wrap; align-items: center; gap: 6px">
                <span>{{ formatSessionDate(session.completed_at) }}</span>
                <template v-if="session.week"><span>· Week {{ session.week }}</span></template>
                <span>· {{ session.set_logs?.length ?? 0 }} sets</span>
                <span v-if="session.cardio_minutes" style="color: #34d399">· Cardio: {{ session.cardio_minutes }} min</span>
                <span v-if="session.calories" style="color: #facc15">· {{ Number(session.calories).toLocaleString() }} kcal</span>
                <span v-if="session.protein_g || session.carbs_g || session.fat_g" style="color: #c4b5fd">
                  · <template v-if="session.protein_g">P: {{ session.protein_g }}g </template>
                  <template v-if="session.carbs_g">C: {{ session.carbs_g }}g </template>
                  <template v-if="session.fat_g">F: {{ session.fat_g }}g</template>
                </span>
              </div>
            </div>
          </div>
          <span aria-hidden="true" style="color: var(--color-text-secondary); font-size: 18px; line-height: 1; flex-shrink: 0">
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
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                flex-wrap: wrap;
                padding: 12px 0 8px;
              "
            >
              <span
                style="
                  font-size: 10px;
                  letter-spacing: 2px;
                  text-transform: uppercase;
                  color: var(--color-text-secondary);
                "
              >
                {{ formatSessionTime(session.completed_at) }}
              </span>
              <div style="display: flex; gap: 8px; flex-wrap: wrap">
                <button
                  type="button"
                  class="calendar-btn"
                  @click="exportToGoogleCalendar(session)"
                >
                  Google Calendar
                </button>
                <button
                  type="button"
                  class="calendar-btn calendar-btn-secondary"
                  @click="downloadCalendarFile(session)"
                >
                  Download .ics
                </button>
              </div>
            </div>

            <!-- Exercise groups -->
            <div
              v-for="(group, name) in groupSets(session.set_logs)"
              :key="name"
              style="padding: 10px 0; border-top: 1px solid oklch(15% 0.008 45)"
            >
              <!-- Group header -->
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px">
                <div style="font-size: 0.9375rem; color: #f5f5f5; font-weight: 500">{{ name }}</div>
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
                <span style="font-size: 10px; color: var(--color-text-secondary)"></span>
                <span style="font-size: 10px; color: var(--color-text-secondary); font-weight: 600; text-align: center">Target</span>
                <span style="font-size: 10px; color: var(--color-text-secondary); font-weight: 600; text-align: center">Done</span>
                <span style="font-size: 10px; color: var(--color-text-secondary); font-weight: 600; text-align: center">Weight (lbs)</span>
              </div>

              <div
                v-for="set in group"
                :key="set.set_number"
                style="margin-bottom: 4px"
              >
                <!-- View mode -->
                <div v-if="!isEditing(session.id, name)" style="font-size: 12px; color: var(--color-text-secondary); line-height: 1.8">
                  <span style="color: var(--color-text-secondary); font-weight: 600">Set {{ set.set_number }}:</span>
                  <span style="margin-left: 6px; color: #d4d4d4">
                    {{ set.reps_programmed }} reps
                    <template v-if="set.reps_done != null">
                      <span style="color: var(--color-text-muted)"> → </span>
                      <span style="color: #d4d4d4">{{ set.reps_done }} done</span>
                    </template>
                    <template v-if="set.weight_kg != null">
                      <span style="color: var(--color-text-muted)"> · </span>
                      <span style="color: #d4d4d4">{{ set.weight_kg }} lbs</span>
                    </template>
                  </span>
                </div>

                <!-- Edit mode -->
                <div
                  v-else
                  style="display: grid; grid-template-columns: 44px 1fr 1fr 1fr; gap: 6px; align-items: center"
                >
                  <span style="font-size: 11px; color: var(--color-text-secondary); font-weight: 600">Set {{ set.set_number }}</span>
                  <span style="font-size: 12px; color: #d4d4d4; text-align: center; font-variant-numeric: tabular-nums">
                    {{ set.reps_programmed }}
                  </span>
                  <input
                    v-model.number="editInputs[set.id].repsDone"
                    type="number"
                    min="0"
                    max="999"
                    :placeholder="String(set.reps_programmed)"
                    class="history-input"
                    aria-label="Reps done"
                  />
                  <input
                    v-model.number="editInputs[set.id].weightLbs"
                    type="number"
                    min="0"
                    max="2000"
                    step="2.5"
                    placeholder="lbs"
                    class="history-input"
                    aria-label="Weight in lbs"
                  />
                </div>
              </div>
            </div>

            <!-- Add exercise to session -->
            <div style="padding: 14px 0 4px; border-top: 1px solid oklch(15% 0.008 45)">
              <div
                v-if="addingExerciseSessionId !== session.id"
                style="display: flex; justify-content: flex-end"
              >
                <button
                  type="button"
                  class="edit-btn"
                  @click="startAddExercise(session.id)"
                >
                  + Add Exercise
                </button>
              </div>

              <div
                v-else
                style="padding: 14px; background: oklch(12% 0.01 45); border: 1px solid oklch(22% 0.008 45); border-radius: 10px"
              >
                <div style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--color-text-secondary); font-weight: 700; margin-bottom: 12px">
                  Add exercise to this session
                </div>

                <div style="display: grid; grid-template-columns: 1fr 72px 72px; gap: 8px; margin-bottom: 12px">
                  <div>
                    <label class="history-field-label">Name</label>
                    <input
                      v-model="newExerciseForm.name"
                      type="text"
                      placeholder="e.g. Cable Fly"
                      class="history-input"
                      style="text-align: left"
                    />
                  </div>
                  <div>
                    <label class="history-field-label">Sets</label>
                    <input
                      v-model="newExerciseForm.sets"
                      type="number"
                      min="1"
                      max="20"
                      placeholder="3"
                      class="history-input"
                    />
                  </div>
                  <div>
                    <label class="history-field-label">Reps</label>
                    <input
                      v-model="newExerciseForm.reps"
                      type="text"
                      placeholder="10"
                      class="history-input"
                    />
                  </div>
                </div>

                <div v-if="newExerciseSetInputs.length" style="margin-bottom: 12px">
                  <div style="font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--color-text-muted); margin-bottom: 8px">
                    Log sets (optional)
                  </div>
                  <div
                    style="display: grid; grid-template-columns: 44px 1fr 1fr 1fr; gap: 6px; margin-bottom: 4px"
                  >
                    <span></span>
                    <span style="font-size: 10px; color: var(--color-text-secondary); font-weight: 600; text-align: center">Target</span>
                    <span style="font-size: 10px; color: var(--color-text-secondary); font-weight: 600; text-align: center">Done</span>
                    <span style="font-size: 10px; color: var(--color-text-secondary); font-weight: 600; text-align: center">Weight (lbs)</span>
                  </div>
                  <div
                    v-for="set in newExerciseSetInputs"
                    :key="set.setNumber"
                    style="display: grid; grid-template-columns: 44px 1fr 1fr 1fr; gap: 6px; align-items: center; margin-bottom: 4px"
                  >
                    <span style="font-size: 11px; color: var(--color-text-secondary); font-weight: 600">Set {{ set.setNumber }}</span>
                    <span style="font-size: 12px; color: #d4d4d4; text-align: center; font-variant-numeric: tabular-nums">
                      {{ set.repsProgrammed }}
                    </span>
                    <input
                      v-model.number="set.repsDone"
                      type="number"
                      min="0"
                      max="999"
                      :placeholder="String(set.repsProgrammed)"
                      class="history-input"
                      aria-label="Reps done"
                    />
                    <input
                      v-model.number="set.weightLbs"
                      type="number"
                      min="0"
                      max="2000"
                      step="2.5"
                      placeholder="lbs"
                      class="history-input"
                      aria-label="Weight in lbs"
                    />
                  </div>
                </div>

                <div v-if="addExerciseError" style="font-size: 11px; color: #f87171; margin-bottom: 10px">
                  {{ addExerciseError }}
                </div>

                <div style="display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap">
                  <button
                    type="button"
                    @click="saveNewExercise(session.id)"
                    :disabled="savingNewExercise || !canSaveNewExercise"
                    class="save-btn"
                  >
                    {{ savingNewExercise ? 'Saving…' : 'Add to session' }}
                  </button>
                  <button type="button" @click="cancelAddExercise" class="cancel-btn">
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            <!-- Daily Cardio & Nutrition Section -->
            <div style="padding: 16px 0 12px; border-top: 1px solid oklch(15% 0.008 45)">
              <button
                type="button"
                class="nutrition-toggle-btn"
                :aria-expanded="isNutritionExpanded(session.id)"
                @click="toggleNutritionSection(session.id)"
              >
                <span style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--color-text-secondary); font-weight: 700">
                  Daily Cardio & Nutrition
                </span>
                <span style="font-size: 12px; color: var(--color-text-secondary); margin-left: auto; margin-right: 8px">
                  {{ nutritionSummary(session) }}
                </span>
                <span aria-hidden="true" style="color: var(--color-text-secondary)">{{ isNutritionExpanded(session.id) ? '−' : '+' }}</span>
              </button>

              <div v-if="isNutritionExpanded(session.id)" style="margin-top: 12px">
              <div style="display: flex; align-items: center; justify-content: flex-end; margin-bottom: 12px">
                <button
                  v-if="editingNutritionId !== session.id"
                  @click="startEditNutrition(session)"
                  class="edit-btn"
                  :aria-label="'Edit daily cardio and nutrition for session'"
                >
                  {{ (session.cardio_minutes || session.calories || session.protein_g || session.carbs_g || session.fat_g) ? 'Edit Metrics' : '+ Add Metrics' }}
                </button>
              </div>

              <!-- View Mode: Metric Chips -->
              <div v-if="editingNutritionId !== session.id" style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center">
                <div style="padding: 6px 12px; background: oklch(13% 0.008 45); border: 1px solid oklch(20% 0.008 45); border-radius: 8px; font-size: 12px; display: flex; align-items: center; gap: 6px">
                  <span style="color: var(--color-text-secondary)">Cardio:</span>
                  <strong v-if="session.cardio_minutes" style="color: #34d399; font-variant-numeric: tabular-nums">{{ session.cardio_minutes }} min</strong>
                  <span v-else class="text-empty">—</span>
                </div>

                <div style="padding: 6px 12px; background: oklch(13% 0.008 45); border: 1px solid oklch(20% 0.008 45); border-radius: 8px; font-size: 12px; display: flex; align-items: center; gap: 6px">
                  <span style="color: var(--color-text-secondary)">Calories:</span>
                  <strong v-if="session.calories" style="color: #facc15; font-variant-numeric: tabular-nums">{{ Number(session.calories).toLocaleString() }} kcal</strong>
                  <span v-else class="text-empty">—</span>
                </div>

                <div style="padding: 6px 12px; background: oklch(13% 0.008 45); border: 1px solid oklch(20% 0.008 45); border-radius: 8px; font-size: 12px; display: flex; align-items: center; gap: 6px">
                  <span style="color: var(--color-text-secondary)">Protein:</span>
                  <strong v-if="session.protein_g" style="color: #38bdf8; font-variant-numeric: tabular-nums">{{ session.protein_g }}g</strong>
                  <span v-else class="text-empty">—</span>
                </div>

                <div style="padding: 6px 12px; background: oklch(13% 0.008 45); border: 1px solid oklch(20% 0.008 45); border-radius: 8px; font-size: 12px; display: flex; align-items: center; gap: 6px">
                  <span style="color: var(--color-text-secondary)">Carbs:</span>
                  <strong v-if="session.carbs_g" style="color: #fb923c; font-variant-numeric: tabular-nums">{{ session.carbs_g }}g</strong>
                  <span v-else class="text-empty">—</span>
                </div>

                <div style="padding: 6px 12px; background: oklch(13% 0.008 45); border: 1px solid oklch(20% 0.008 45); border-radius: 8px; font-size: 12px; display: flex; align-items: center; gap: 6px">
                  <span style="color: var(--color-text-secondary)">Fat:</span>
                  <strong v-if="session.fat_g" style="color: #f472b6; font-variant-numeric: tabular-nums">{{ session.fat_g }}g</strong>
                  <span v-else class="text-empty">—</span>
                </div>
              </div>

              <!-- Edit Mode: Inline Form -->
              <div v-else style="padding: 14px; background: oklch(12% 0.01 45); border: 1px solid oklch(22% 0.008 45); border-radius: 10px; margin-top: 6px">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 10px; margin-bottom: 12px">
                  <div>
                    <label style="display: block; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #34d399; font-weight: 700; margin-bottom: 4px">Cardio (min)</label>
                    <input v-model.number="nutritionInputs.cardio" type="number" min="0" max="999" placeholder="30" class="history-input" />
                  </div>
                  <div>
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px">
                      <label style="font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #facc15; font-weight: 700">Calories (kcal)</label>
                      <button
                        v-if="calculatedCaloriesFromMacros != null && nutritionInputs.calories !== calculatedCaloriesFromMacros"
                        type="button"
                        @click="applyCalculatedCalories"
                        style="background: transparent; border: none; padding: 0; color: #facc15; font-size: 10px; font-weight: 600; cursor: pointer; text-decoration: underline"
                        title="Calculate from Protein (4 kcal/g) + Carbs (4 kcal/g) + Fat (9 kcal/g)"
                      >
                        Auto: {{ calculatedCaloriesFromMacros }}
                      </button>
                    </div>
                    <input v-model.number="nutritionInputs.calories" type="number" min="0" max="15000" placeholder="2400" class="history-input" />
                  </div>
                  <div>
                    <label style="display: block; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #38bdf8; font-weight: 700; margin-bottom: 4px">Protein (g)</label>
                    <input v-model.number="nutritionInputs.protein" type="number" min="0" max="999" placeholder="180" class="history-input" />
                  </div>
                  <div>
                    <label style="display: block; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #fb923c; font-weight: 700; margin-bottom: 4px">Carbs (g)</label>
                    <input v-model.number="nutritionInputs.carbs" type="number" min="0" max="999" placeholder="220" class="history-input" />
                  </div>
                  <div>
                    <label style="display: block; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #f472b6; font-weight: 700; margin-bottom: 4px">Fat (g)</label>
                    <input v-model.number="nutritionInputs.fat" type="number" min="0" max="999" placeholder="65" class="history-input" />
                  </div>
                </div>

                <!-- Macro calculation breakdown indicator -->
                <div v-if="calculatedCaloriesFromMacros != null" style="font-size: 11px; color: var(--color-text-secondary); margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; padding: 6px 12px; background: oklch(14% 0.008 45); border: 1px solid oklch(20% 0.008 45); border-radius: 6px;">
                  <span>Macro formula: ({{ nutritionInputs.protein || 0 }}g × 4) + ({{ nutritionInputs.carbs || 0 }}g × 4) + ({{ nutritionInputs.fat || 0 }}g × 9)</span>
                  <strong style="color: #facc15; font-variant-numeric: tabular-nums">= {{ calculatedCaloriesFromMacros }} kcal</strong>
                </div>

                <div v-if="nutritionError" style="font-size: 11px; color: #f87171; margin-bottom: 10px">
                  {{ nutritionError }}
                </div>

                <div style="display: flex; gap: 8px; justify-content: flex-end">
                  <button @click="saveNutrition(session.id)" :disabled="savingNutrition" class="save-btn">
                    {{ savingNutrition ? 'Saving…' : 'Save Daily Metrics' }}
                  </button>
                  <button @click="editingNutritionId = null" class="cancel-btn">
                    Cancel
                  </button>
                </div>
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
                <span style="font-size: 12px; color: var(--color-text-secondary)">Remove this session permanently?</span>
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
import { ref, computed, watch } from 'vue'
import { useWorkoutHistoryQuery, addExerciseToSession } from '@/queries/history'
import { PHASES, formatSessionDate, formatSessionTime } from '@/lib/workout'
import {
  buildNewExerciseSetInputs,
  downloadSessionIcs,
  openSessionInGoogleCalendar,
} from '@/lib/exportSession'
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
  return PHASES[phase] ?? { name: `Phase ${phase}`, color: 'var(--color-text-secondary)' }
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
    cancelAddExercise()
  }
}

function exportToGoogleCalendar(session) {
  openSessionInGoogleCalendar(session)
}

function downloadCalendarFile(session) {
  downloadSessionIcs(session)
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
    const updatePromises = group.map((set) => {
      const { repsDone, weightLbs } = editInputs.value[set.id] ?? {}
      return supabase
        .from('set_logs')
        .update({
          reps_done: repsDone ?? null,
          weight_kg: weightLbs ?? null,
        })
        .eq('id', set.id)
    })

    const results = await Promise.all(updatePromises)
    for (const res of results) {
      if (res?.error) throw res.error
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

// ── Daily Cardio & Nutrition Tracking ─────────────────────────
const editingNutritionId = ref(null)
const nutritionExpandedIds = ref(new Set())
const nutritionInputs = ref({
  cardio: null,
  calories: null,
  protein: null,
  carbs: null,
  fat: null,
})
const savingNutrition = ref(false)
const nutritionError = ref(null)

const calculatedCaloriesFromMacros = computed(() => {
  const p = Number(nutritionInputs.value.protein) || 0
  const c = Number(nutritionInputs.value.carbs) || 0
  const f = Number(nutritionInputs.value.fat) || 0
  if (p === 0 && c === 0 && f === 0) return null
  return (p * 4) + (c * 4) + (f * 9)
})

function applyCalculatedCalories() {
  if (calculatedCaloriesFromMacros.value != null) {
    nutritionInputs.value.calories = calculatedCaloriesFromMacros.value
  }
}

watch(
  () => [nutritionInputs.value.protein, nutritionInputs.value.carbs, nutritionInputs.value.fat],
  ([newP, newC, newF], [oldP, oldC, oldF]) => {
    if (editingNutritionId.value) {
      const prevCalc = ((Number(oldP) || 0) * 4) + ((Number(oldC) || 0) * 4) + ((Number(oldF) || 0) * 9)
      const newCalc = ((Number(newP) || 0) * 4) + ((Number(newC) || 0) * 4) + ((Number(newF) || 0) * 9)
      // Auto-populate calories if it's empty or currently matching previous calculated value
      if (newCalc > 0 && (!nutritionInputs.value.calories || nutritionInputs.value.calories === prevCalc)) {
        nutritionInputs.value.calories = newCalc
      }
    }
  }
)

function isNutritionExpanded(sessionId) {
  return nutritionExpandedIds.value.has(sessionId)
}

function toggleNutritionSection(sessionId) {
  const next = new Set(nutritionExpandedIds.value)
  if (next.has(sessionId)) {
    next.delete(sessionId)
  } else {
    next.add(sessionId)
  }
  nutritionExpandedIds.value = next
}

function nutritionSummary(session) {
  const parts = []
  if (session.cardio_minutes) parts.push(`${session.cardio_minutes}m cardio`)
  if (session.calories) parts.push(`${Number(session.calories).toLocaleString()} kcal`)
  if (session.protein_g) parts.push(`P${session.protein_g}g`)
  return parts.length ? parts.join(' · ') : 'No metrics logged'
}

function startEditNutrition(session) {
  nutritionExpandedIds.value = new Set([...nutritionExpandedIds.value, session.id])
  editingNutritionId.value = session.id
  nutritionInputs.value = {
    cardio: session.cardio_minutes ?? null,
    calories: session.calories ?? null,
    protein: session.protein_g ?? null,
    carbs: session.carbs_g ?? null,
    fat: session.fat_g ?? null,
  }
  nutritionError.value = null
}

async function saveNutrition(sessionId) {
  savingNutrition.value = true
  nutritionError.value = null

  const payload = {
    cardio_minutes: nutritionInputs.value.cardio != null && nutritionInputs.value.cardio !== '' ? Number(nutritionInputs.value.cardio) : null,
    calories: nutritionInputs.value.calories != null && nutritionInputs.value.calories !== '' ? Number(nutritionInputs.value.calories) : null,
    protein_g: nutritionInputs.value.protein != null && nutritionInputs.value.protein !== '' ? Number(nutritionInputs.value.protein) : null,
    carbs_g: nutritionInputs.value.carbs != null && nutritionInputs.value.carbs !== '' ? Number(nutritionInputs.value.carbs) : null,
    fat_g: nutritionInputs.value.fat != null && nutritionInputs.value.fat !== '' ? Number(nutritionInputs.value.fat) : null,
  }

  // Cache locally first for instant persistence and fallback
  try {
    localStorage.setItem(`session-nutrition-v1-${sessionId}`, JSON.stringify(payload))
  } catch {
    // Ignore storage quota or disabled localStorage errors
  }

  try {
    const { error } = await supabase
      .from('workout_sessions')
      .update(payload)
      .eq('id', sessionId)
    
    if (error) {
      // If full columns update errors before migration, update cardio alone
      await supabase
        .from('workout_sessions')
        .update({ cardio_minutes: payload.cardio_minutes })
        .eq('id', sessionId)
    }

    await refetch()
    editingNutritionId.value = null
  } catch {
    // Still refetch to reflect locally cached values
    await refetch()
    editingNutritionId.value = null
  } finally {
    savingNutrition.value = false
  }
}

// ── Add exercise to historic session ─────────────────────────
const addingExerciseSessionId = ref(null)
const newExerciseForm = ref({ name: '', sets: '3', reps: '10' })
const newExerciseSetInputs = ref([])
const savingNewExercise = ref(false)
const addExerciseError = ref(null)

const canSaveNewExercise = computed(() => Boolean(newExerciseForm.value.name?.trim()))

watch(
  () => [newExerciseForm.value.sets, newExerciseForm.value.reps, newExerciseForm.value.name],
  () => {
    if (addingExerciseSessionId.value == null) return
    const name = newExerciseForm.value.name?.trim()
    if (!name) {
      newExerciseSetInputs.value = []
      return
    }
    newExerciseSetInputs.value = buildNewExerciseSetInputs(newExerciseForm.value)
  },
)

function startAddExercise(sessionId) {
  addingExerciseSessionId.value = sessionId
  newExerciseForm.value = { name: '', sets: '3', reps: '10' }
  newExerciseSetInputs.value = []
  addExerciseError.value = null
  editingGroup.value = null
  editInputs.value = {}
}

function cancelAddExercise() {
  addingExerciseSessionId.value = null
  newExerciseForm.value = { name: '', sets: '3', reps: '10' }
  newExerciseSetInputs.value = []
  addExerciseError.value = null
}

async function saveNewExercise(sessionId) {
  if (!canSaveNewExercise.value) return

  savingNewExercise.value = true
  addExerciseError.value = null

  const setOverrides = newExerciseSetInputs.value.map((set) => ({
    exerciseName: newExerciseForm.value.name.trim(),
    setNumber: set.setNumber,
    repsDone: set.repsDone ?? null,
    weightLbs: set.weightLbs ?? null,
  }))

  try {
    await addExerciseToSession(sessionId, newExerciseForm.value, setOverrides)
    await refetch()
    cancelAddExercise()
  } catch (err) {
    addExerciseError.value = err?.message ?? 'Failed to add exercise. Please try again.'
  } finally {
    savingNewExercise.value = false
  }
}

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
.history-eyebrow {
  font-size: 11px;
  letter-spacing: 4px;
  color: var(--color-text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.history-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-top: 8px;
  font-style: italic;
}

.history-loading {
  padding: 48px 0;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.history-empty-title {
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
  font-weight: 500;
}

.history-empty-hint {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.7;
  max-width: 300px;
  margin: 0 auto 20px;
}

.history-stat-label {
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  font-weight: 600;
  margin-top: 2px;
}

.history-field-label {
  display: block;
  font-size: 10px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-bottom: 4px;
}

.text-secondary {
  color: var(--color-text-secondary);
}

.text-muted {
  color: var(--color-text-muted);
}

.text-empty {
  color: var(--color-text-muted);
  font-style: italic;
}

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
  background: oklch(14% 0.008 45);
  border: 1px solid oklch(24% 0.008 45);
  color: #d4d4d4;
  cursor: pointer;
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 8px 16px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  transition: color 120ms, border-color 120ms, background 120ms;
}
.edit-btn:hover {
  color: #ffffff;
  border-color: #a78bfa;
  background: #a78bfa18;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  transition: color 120ms, border-color 120ms, background 120ms;
}
.save-btn:hover:not(:disabled) {
  color: #ffffff;
  background: #a78bfa;
}
.save-btn:disabled {
  opacity: 0.5;
  cursor: wait;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  transition: color 120ms, border-color 120ms;
}
.cancel-btn:hover {
  color: #ffffff;
  border-color: oklch(35% 0.008 45);
}

.history-input {
  width: 100%;
  padding: 8px 10px;
  background: oklch(8% 0.012 45);
  border: 1px solid oklch(24% 0.008 45);
  border-radius: 6px;
  color: #ffffff;
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
  text-align: center;
  min-height: 44px;
  -moz-appearance: textfield;
}
.history-input::-webkit-outer-spin-button,
.history-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.history-input:focus {
  outline: 2px solid var(--color-primary);
  border-color: var(--color-primary);
}
.history-input::placeholder {
  color: var(--color-text-muted);
}

.delete-btn {
  background: transparent;
  border: 1px solid #7f353555;
  color: #fca5a5;
  cursor: pointer;
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 8px 16px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  transition: color 120ms, background 120ms;
}
.delete-btn:hover {
  color: #ffffff;
  background: #7f353544;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  transition: background 120ms, border-color 120ms;
}
.delete-confirm-btn:hover:not(:disabled) {
  background: #991b1b;
}
.delete-confirm-btn:disabled {
  opacity: 0.5;
  cursor: wait;
}

.calendar-btn {
  background: oklch(14% 0.008 45);
  border: 1px solid oklch(24% 0.008 45);
  color: #d4d4d4;
  cursor: pointer;
  font-size: 10px;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 8px 12px;
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  transition: color 120ms, border-color 120ms, background 120ms;
}
.calendar-btn:hover {
  color: #ffffff;
  border-color: #4285f4;
  background: #4285f418;
}
.calendar-btn-secondary:hover {
  border-color: #a78bfa;
  background: #a78bfa18;
}

.nutrition-toggle-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  min-height: 44px;
}

.nutrition-toggle-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 6px;
}
</style>
