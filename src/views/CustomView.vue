<template>
  <!-- ═══════════════════════════ Page header ═══════════════════════════ -->
  <div
    style="
      border-bottom: 1px solid oklch(15% 0.008 45);
      padding: 32px 24px 20px;
      text-align: center;
      background: oklch(9% 0.01 45);
    "
  >
    <div
      style="
        font-size: 11px;
        letter-spacing: 4px;
        color: #a3a3a3;
        text-transform: uppercase;
        margin-bottom: 8px;
      "
    >
      Custom Workouts
    </div>
    <h1
      style="
        font-size: clamp(1.625rem, 5vw, 2.75rem);
        font-weight: 400;
        margin: 0;
        color: #f5f5f5;
        letter-spacing: -1px;
        font-family: Georgia, serif;
      "
    >
      Custom Studio
    </h1>
    <p style="font-size: 0.875rem; color: #a3a3a3; margin-top: 8px; font-style: italic">
      Build full week programs or mix & match saved custom days
    </p>

    <!-- Top Segmented Navigation Tabs -->
    <div
      style="
        display: flex;
        max-width: 440px;
        margin: 20px auto 0;
        background: oklch(12% 0.008 45);
        padding: 4px;
        border-radius: 9999px;
        border: 1px solid oklch(18% 0.008 45);
      "
    >
      <button
        @click="activeTab = 'programs'"
        :style="{
          flex: 1,
          padding: '10px 16px',
          borderRadius: '9999px',
          background: activeTab === 'programs' ? '#a78bfa' : 'transparent',
          color: activeTab === 'programs' ? '#ffffff' : '#a3a3a3',
          border: 'none',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: '600',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          minHeight: '44px',
          transition: 'all 180ms ease-out',
        }"
      >
        📋 My Programs ({{ programs.length }})
      </button>
      <button
        @click="activeTab = 'overrides'"
        :style="{
          flex: 1,
          padding: '10px 16px',
          borderRadius: '9999px',
          background: activeTab === 'overrides' ? '#a78bfa' : 'transparent',
          color: activeTab === 'overrides' ? '#ffffff' : '#a3a3a3',
          border: 'none',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: '600',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          minHeight: '44px',
          transition: 'all 180ms ease-out',
        }"
      >
        ⚡ Day Builder ({{ savedWorkouts.length }})
      </button>
    </div>
  </div>

  <!-- Activation / Copy Toast Feedback -->
  <Transition name="confirm">
    <div
      v-if="toastMessage"
      style="
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: #15803d;
        color: #ffffff;
        padding: 12px 24px;
        border-radius: 9999px;
        font-size: 13px;
        font-weight: 600;
        z-index: 999;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        gap: 8px;
      "
    >
      <span>✓</span> {{ toastMessage }}
    </div>
  </Transition>

  <!-- ═══════════════════════ TAB 1: MY PROGRAMS ═══════════════════════ -->
  <div v-if="activeTab === 'programs'" style="max-width: 640px; margin: 28px auto 0; padding: 0 16px">
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px">
      <div style="font-size: 11px; letter-spacing: 2px; color: #a3a3a3; text-transform: uppercase; font-weight: 600">
        Saved Program Templates
      </div>
      <button
        @click="startNewProgram"
        style="
          padding: 8px 16px;
          background: #a78bfa22;
          border: 1px solid #a78bfa;
          border-radius: 9999px;
          color: #c4b5fd;
          cursor: pointer;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1px;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 150ms ease-out;
        "
      >
        + New Program
      </button>
    </div>

    <!-- New program name input -->
    <Transition name="rename-slide">
      <div
        v-if="creatingProgram"
        style="
          margin-bottom: 16px;
          padding: 16px;
          background: oklch(10% 0.01 45);
          border: 1px solid #a78bfa66;
          border-radius: 12px;
          display: flex;
          gap: 10px;
          align-items: center;
        "
      >
        <input
          v-model="newProgramName"
          placeholder="Program name (e.g. Summer Cut, Hypertrophy Phase)"
          class="workout-input"
          :style="{ ...inputStyle, flex: 1, minHeight: '44px' }"
          @keydown.enter="saveNewProgram"
          @keydown.escape="creatingProgram = false"
          ref="newProgramInput"
        />
        <button
          @click="saveNewProgram"
          :disabled="!newProgramName.trim() || savingProgram"
          :style="{
            padding: '10px 18px',
            background: newProgramName.trim() ? '#a78bfa' : 'oklch(16% 0.008 45)',
            border: 'none',
            borderRadius: '9999px',
            color: newProgramName.trim() ? '#ffffff' : '#737373',
            cursor: newProgramName.trim() ? 'pointer' : 'default',
            fontSize: '12px',
            fontWeight: '600',
            letterSpacing: '1px',
            whiteSpace: 'nowrap',
            minHeight: '44px',
            transition: 'background 200ms, color 200ms',
          }"
        >
          {{ savingProgram ? 'Creating…' : 'Create' }}
        </button>
        <button
          @click="creatingProgram = false"
          style="background: transparent; border: none; color: #a3a3a3; cursor: pointer; font-size: 20px; min-width: 44px; min-height: 44px; display: flex; align-items: center; justify-content: center"
        >
          ✕
        </button>
      </div>
    </Transition>

    <!-- Program cards -->
    <div v-if="programsLoading" style="padding: 32px 0; text-align: center; color: #a3a3a3; font-size: 0.875rem">
      Loading programs…
    </div>

    <div v-else-if="programs.length === 0 && !creatingProgram"
      style="
        padding: 36px 20px;
        border: 1px dashed oklch(22% 0.008 45);
        border-radius: 12px;
        text-align: center;
        margin-bottom: 36px;
      "
    >
      <div style="font-size: 28px; margin-bottom: 12px; opacity: 0.6">📋</div>
      <div style="font-size: 0.9375rem; color: #e5e5e5; font-weight: 500">No custom programs yet</div>
      <div style="font-size: 13px; color: #a3a3a3; margin-top: 6px; line-height: 1.5">
        Create a program to save a full 7-day training schedule as a reusable template.
      </div>
    </div>

    <div v-else>
      <div
        v-for="program in programs"
        :key="program.id"
        style="margin-bottom: 14px; border: 1px solid oklch(18% 0.008 45); border-radius: 12px; overflow: hidden; background: oklch(10% 0.01 45)"
      >
        <!-- Program card header -->
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 18px;
            background: oklch(11% 0.01 45);
            gap: 12px;
            flex-wrap: wrap;
          "
        >
          <div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1">
            <!-- Editable program name -->
            <div v-if="renamingProgramId === program.id" style="display: flex; gap: 8px; align-items: center; flex: 1">
              <input
                v-model="renameProgramName"
                class="workout-input"
                :style="{ ...inputStyle, flex: 1, fontSize: '0.875rem', padding: '6px 12px', minHeight: '40px' }"
                @keydown.enter="confirmProgramRename(program.id)"
                @keydown.escape="renamingProgramId = null"
              />
              <button @click="confirmProgramRename(program.id)"
                style="padding: 6px 14px; background: #a78bfa; border: none; border-radius: 9999px; color: #fff; font-size: 11px; font-weight: 600; cursor: pointer; min-height: 38px">
                Save
              </button>
              <button @click="renamingProgramId = null"
                style="padding: 6px 10px; background: transparent; border: 1px solid oklch(24% 0.008 45); border-radius: 9999px; color: #a3a3a3; font-size: 11px; cursor: pointer; min-height: 38px">
                ✕
              </button>
            </div>
            <div v-else style="display: flex; align-items: center; gap: 12px">
              <span style="font-size: 1rem; color: #f5f5f5; font-weight: 600">{{ program.name }}</span>
              <span style="font-size: 11px; padding: 2px 10px; border-radius: 20px; background: oklch(16% 0.008 45); color: #a3a3a3; font-weight: 500">
                {{ program.custom_program_days?.length ?? 0 }} day{{ (program.custom_program_days?.length ?? 0) !== 1 ? 's' : '' }}
              </span>
            </div>
          </div>

          <!-- Action buttons with minimum 44px touch targets -->
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap">
            <button @click="toggleProgramEditor(program.id)"
              style="padding: 8px 14px; background: oklch(14% 0.008 45); border: 1px solid oklch(24% 0.008 45); border-radius: 20px; color: #c4b5fd; cursor: pointer; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; min-height: 38px; display: inline-flex; align-items: center">
              {{ expandedProgramId === program.id ? 'Close' : 'Edit Days' }}
            </button>
            <button @click="handleActivateProgram(program)"
              :disabled="activatingProgramId === program.id"
              style="padding: 8px 16px; background: #166534; border: 1px solid #22c55e; border-radius: 20px; color: #ffffff; cursor: pointer; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; min-height: 38px; display: inline-flex; align-items: center">
              {{ activatingProgramId === program.id ? 'Applying…' : 'Activate Plan' }}
            </button>
            <button @click="openExportProgram(program)"
              style="padding: 8px 12px; background: transparent; border: 1px solid #a78bfa55; border-radius: 20px; color: #c4b5fd; cursor: pointer; font-size: 11px; font-weight: 500; min-height: 38px; display: inline-flex; align-items: center; gap: 4px"
              aria-label="Export this custom program">
              <span aria-hidden="true">📤</span> Export
            </button>
            <button @click="renamingProgramId = program.id; renameProgramName = program.name"
              style="padding: 8px 12px; background: transparent; border: 1px solid oklch(20% 0.008 45); border-radius: 20px; color: #a3a3a3; cursor: pointer; font-size: 11px; font-weight: 500; min-height: 38px; display: inline-flex; align-items: center">
              Rename
            </button>
            <template v-if="confirmDeleteProgramId !== program.id">
              <button @click="confirmDeleteProgramId = program.id"
                style="padding: 8px 12px; background: transparent; border: 1px solid #7f353555; border-radius: 20px; color: #fca5a5; cursor: pointer; font-size: 11px; font-weight: 500; min-height: 38px; display: inline-flex; align-items: center">
                Delete
              </button>
            </template>
            <template v-else>
              <button @click="handleDeleteProgram(program.id)"
                style="padding: 8px 14px; background: #7f3535; border: 1px solid #f87171; border-radius: 20px; color: #fff; font-size: 11px; font-weight: 600; cursor: pointer; min-height: 38px">
                Confirm
              </button>
              <button @click="confirmDeleteProgramId = null"
                style="padding: 8px 10px; background: transparent; border: 1px solid oklch(24% 0.008 45); border-radius: 20px; color: #a3a3a3; font-size: 11px; cursor: pointer; min-height: 38px">
                No
              </button>
            </template>
          </div>
        </div>

        <!-- Program day editor (expanded) -->
        <Transition name="rename-slide">
          <div v-if="expandedProgramId === program.id"
            style="background: oklch(8% 0.01 45); border-top: 1px solid oklch(16% 0.008 45)"
          >
            <div
              v-for="d in days"
              :key="d"
              style="border-bottom: 1px solid oklch(13% 0.008 45)"
            >
              <!-- Day row header -->
              <button
                @click="toggleProgramDay(program.id, d)"
                style="
                  width: 100%;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  padding: 12px 18px;
                  background: transparent;
                  border: none;
                  cursor: pointer;
                  text-align: left;
                  min-height: 48px;
                "
              >
                <div style="display: flex; align-items: center; gap: 12px">
                  <span style="font-size: 11px; color: #a3a3a3; letter-spacing: 2px; text-transform: uppercase; font-weight: 600; min-width: 84px">{{ d }}</span>
                  <span v-if="getProgramDay(program, d)" style="font-size: 13px; color: #e5e5e5; font-weight: 500">
                    {{ getProgramDay(program, d).title || `${getProgramDay(program, d).exercises?.length ?? 0} exercise${(getProgramDay(program, d).exercises?.length ?? 0) !== 1 ? 's' : ''}` }}
                  </span>
                  <span v-else style="font-size: 12px; color: #737373; font-style: italic">Empty — tap to build</span>
                </div>
                <span style="color: #a3a3a3; font-size: 16px">
                  {{ expandedProgramDay === `${program.id}|${d}` ? '−' : '+' }}
                </span>
              </button>

              <!-- Day exercise editor -->
              <Transition name="rename-slide">
                <div v-if="expandedProgramDay === `${program.id}|${d}`"
                  style="padding: 12px 18px 18px"
                >
                  <!-- COPY / IMPORT FROM SAVED CUSTOM DAYS -->
                  <div v-if="savedWorkouts.length > 0" style="margin-bottom: 16px; padding: 12px; background: oklch(12% 0.008 45); border: 1px solid #a78bfa44; border-radius: 8px">
                    <div style="font-size: 10px; letter-spacing: 1.5px; color: #c4b5fd; text-transform: uppercase; font-weight: 600; margin-bottom: 8px">
                      📥 Copy from Saved Custom Days
                    </div>
                    <select
                      @change="importSavedDayIntoProgram(program.id, d, $event.target.value); $event.target.value = ''"
                      style="width: 100%; padding: 10px 12px; background: oklch(8% 0.012 45); border: 1px solid oklch(24% 0.008 45); border-radius: 6px; color: #ffffff; font-size: 0.875rem; min-height: 44px; cursor: pointer"
                    >
                      <option value="" disabled selected>Select a saved day to copy exercises…</option>
                      <option v-for="sd in savedWorkouts" :key="sd.id" :value="sd.id">
                        {{ sd.day_name }} — {{ sd.title || 'Untitled' }} ({{ sd.exercises?.length ?? 0 }} exercises)
                      </option>
                    </select>
                  </div>

                  <!-- Title -->
                  <div style="margin-bottom: 14px">
                    <div style="font-size: 10px; letter-spacing: 2px; color: #a3a3a3; text-transform: uppercase; font-weight: 600; margin-bottom: 6px">
                      Day Title <span style="text-transform: none; letter-spacing: 0; color: #737373">(optional)</span>
                    </div>
                    <input
                      v-model="programDayDraft[`${program.id}|${d}`].title"
                      placeholder="e.g. Push Day, Upper Body, Leg Focus…"
                      class="workout-input"
                      :style="inputStyle"
                    />
                  </div>

                  <!-- Exercises -->
                  <div style="font-size: 10px; letter-spacing: 2px; color: #a3a3a3; text-transform: uppercase; font-weight: 600; margin-bottom: 10px">
                    Exercises
                  </div>
                  <TransitionGroup name="exercise" tag="div" style="position: relative">
                    <div
                      v-for="(ex, i) in programDayDraft[`${program.id}|${d}`].exercises"
                      :key="ex._id"
                      style="margin-bottom: 10px; padding: 14px; background: oklch(11% 0.01 45); border: 1px solid oklch(18% 0.008 45); border-radius: 8px"
                    >
                      <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 10px">
                        <span style="font-size: 12px; color: #a3a3a3; min-width: 18px; text-align: right">{{ i + 1 }}</span>
                        <input
                          v-model="ex.name"
                          :aria-label="`Exercise ${i + 1} name`"
                          placeholder="Exercise name"
                          class="workout-input"
                          :style="inputStyle"
                        />
                        <button
                          @click="removeProgramExercise(program.id, d, i)"
                          :aria-label="`Remove exercise ${i + 1}`"
                          style="background: transparent; border: none; color: #a3a3a3; cursor: pointer; font-size: 20px; padding: 4px 8px; flex-shrink: 0; min-width: 44px; min-height: 44px; display: flex; align-items: center; justify-content: center"
                        >
                          <span aria-hidden="true">×</span>
                        </button>
                      </div>
                      <div style="display: flex; gap: 10px">
                        <div style="flex: 1; text-align: center">
                          <label :for="`pd-${program.id}-${d}-${i}-sets`" style="display: block; font-size: 10px; letter-spacing: 2px; color: #a3a3a3; text-transform: uppercase; margin-bottom: 4px">Sets</label>
                          <input :id="`pd-${program.id}-${d}-${i}-sets`" v-model="ex.sets" placeholder="3" class="workout-input" :style="{ ...inputStyle, textAlign: 'center' }" />
                        </div>
                        <div style="flex: 1; text-align: center">
                          <label :for="`pd-${program.id}-${d}-${i}-reps`" style="display: block; font-size: 10px; letter-spacing: 2px; color: #a3a3a3; text-transform: uppercase; margin-bottom: 4px">Reps</label>
                          <input :id="`pd-${program.id}-${d}-${i}-reps`" v-model="ex.reps" placeholder="10" class="workout-input" :style="{ ...inputStyle, textAlign: 'center' }" />
                        </div>
                      </div>
                    </div>
                  </TransitionGroup>

                  <button @click="addProgramExercise(program.id, d)"
                    style="width: 100%; min-height: 44px; padding: 10px; background: transparent; border: 1px dashed oklch(24% 0.008 45); border-radius: 8px; color: #a3a3a3; cursor: pointer; font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px"
                  >
                    + Add Exercise
                  </button>

                  <div style="display: flex; gap: 10px">
                    <button
                      @click="saveProgramDayHandler(program.id, d)"
                      :disabled="savingProgramDay === `${program.id}|${d}`"
                      :style="{
                        flex: 1,
                        padding: '12px',
                        minHeight: '44px',
                        background: '#a78bfa',
                        border: 'none',
                        borderRadius: '9999px',
                        color: '#ffffff',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '700',
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                        transition: 'opacity 200ms',
                        opacity: savingProgramDay === `${program.id}|${d}` ? 0.6 : 1,
                      }"
                    >
                      {{ savingProgramDay === `${program.id}|${d}` ? 'Saving…' : `Save ${d}` }}
                    </button>
                    <button
                      v-if="getProgramDay(program, d)"
                      @click="handleDeleteProgramDay(program.id, d)"
                      style="padding: 12px 18px; min-height: 44px; background: transparent; border: 1px solid oklch(22% 0.008 45); border-radius: 9999px; color: #a3a3a3; cursor: pointer; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>

  <!-- ═════════════════════ TAB 2: DAY BUILDER & OVERRIDES ═════════════════════ -->
  <div v-else style="max-width: 640px; margin: 28px auto 0; padding: 0 16px">
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px">
      <div style="font-size: 11px; letter-spacing: 2px; color: #a3a3a3; text-transform: uppercase; font-weight: 600">
        {{ editingCustomDayId ? 'Editing Custom Day Version' : 'Build & Save Custom Day' }}
      </div>
      <button
        v-if="editingCustomDayId"
        @click="resetDayBuilder"
        style="padding: 6px 14px; background: transparent; border: 1px solid oklch(24% 0.008 45); border-radius: 9999px; color: #a3a3a3; cursor: pointer; font-size: 11px; font-weight: 500; min-height: 38px"
      >
        + New Version
      </button>
    </div>

    <!-- Day Selector -->
    <div style="margin-bottom: 24px">
      <div style="font-size: 10px; letter-spacing: 3px; color: #a3a3a3; text-transform: uppercase; margin-bottom: 10px; font-weight: 600">
        Day of Week
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 8px">
        <button
          v-for="d in days"
          :key="d"
          @click="selectedDay = d"
          :style="{
            padding: '10px 16px',
            minHeight: '44px',
            background: selectedDay === d ? '#a78bfa22' : 'transparent',
            border: selectedDay === d ? '1px solid #a78bfa' : '1px solid oklch(22% 0.008 45)',
            borderRadius: '9999px',
            color: selectedDay === d ? '#c4b5fd' : '#a3a3a3',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            letterSpacing: '1px',
            transition: 'color 150ms ease-out, border-color 150ms ease-out, background 150ms ease-out',
          }"
        >
          {{ d }}
        </button>
      </div>
    </div>

    <!-- Plan Title -->
    <div style="margin-bottom: 24px">
      <div style="font-size: 10px; letter-spacing: 3px; color: #a3a3a3; text-transform: uppercase; margin-bottom: 10px; font-weight: 600">
        Plan Title <span style="color: #737373; letter-spacing: 1px; text-transform: none; font-weight: 400">(optional e.g. Push Heavy, Delts Focus)</span>
      </div>
      <input
        v-model="planTitle"
        placeholder="e.g. Push Heavy, Delts Focus, Chest Hypertrophy…"
        aria-label="Plan title"
        class="workout-input"
        :style="inputStyle"
      />
    </div>

    <div style="font-size: 10px; letter-spacing: 3px; color: #a3a3a3; text-transform: uppercase; margin-bottom: 10px; font-weight: 600">
      Exercises
    </div>

    <TransitionGroup name="exercise" tag="div" style="position: relative">
      <div
        v-for="(ex, i) in exercises"
        :key="ex._id"
        style="margin-bottom: 12px; padding: 16px; background: oklch(10% 0.01 45); border: 1px solid oklch(18% 0.008 45); border-radius: 10px"
      >
        <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 12px">
          <span style="font-size: 12px; color: #a3a3a3; min-width: 18px; text-align: right">{{ i + 1 }}</span>
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
            style="background: transparent; border: none; color: #a3a3a3; cursor: pointer; font-size: 22px; line-height: 1; padding: 4px 8px; flex-shrink: 0; min-width: 44px; min-height: 44px; display: flex; align-items: center; justify-content: center"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div style="display: flex; gap: 10px; margin-bottom: 10px">
          <div style="flex: 1">
            <label :for="`ex-${i}-sets`" style="display: block; font-size: 10px; letter-spacing: 2px; color: #a3a3a3; text-transform: uppercase; margin-bottom: 4px; text-align: center; font-weight: 600">Sets</label>
            <input :id="`ex-${i}-sets`" v-model="ex.sets" placeholder="3" class="workout-input" :style="{ ...inputStyle, textAlign: 'center' }" />
          </div>
          <div style="flex: 1">
            <label :for="`ex-${i}-reps`" style="display: block; font-size: 10px; letter-spacing: 2px; color: #a3a3a3; text-transform: uppercase; margin-bottom: 4px; text-align: center; font-weight: 600">Reps</label>
            <input :id="`ex-${i}-reps`" v-model="ex.reps" placeholder="10" class="workout-input" :style="{ ...inputStyle, textAlign: 'center' }" />
          </div>
        </div>

        <div v-if="ex.name.trim()" style="display: flex; align-items: center; gap: 6px">
          <span aria-hidden="true" style="font-size: 10px; color: #a78bfa">▶</span>
          <a :href="yt(ex.name)" target="_blank" rel="noopener noreferrer"
            style="font-size: 12px; color: #c4b5fd; text-decoration: none; border-bottom: 1px dashed #a78bfa77; padding-bottom: 1px"
          >Watch demo ↗</a>
        </div>
        <div v-else style="font-size: 12px; color: #737373; font-style: italic">Type a name to get a demo link</div>
      </div>
    </TransitionGroup>

    <button @click="addExercise"
      style="width: 100%; min-height: 48px; padding: 12px; background: transparent; border: 1px dashed oklch(24% 0.008 45); border-radius: 10px; color: #a3a3a3; cursor: pointer; font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px"
    >
      + Add Exercise
    </button>

    <button @click="saveWorkout" :disabled="!hasValidExercises"
      :style="{
        width: '100%',
        padding: '14px',
        minHeight: '48px',
        background: hasValidExercises ? '#a78bfa' : 'oklch(12% 0.008 45)',
        border: 'none',
        borderRadius: '9999px',
        color: hasValidExercises ? '#ffffff' : '#737373',
        cursor: hasValidExercises ? 'pointer' : 'default',
        fontSize: '11px',
        fontWeight: '700',
        letterSpacing: '3px',
        textTransform: 'uppercase',
        marginBottom: '40px',
        transition: 'background 200ms ease-out, color 200ms ease-out',
      }"
    >
      {{ editingCustomDayId ? 'Update Version for ' + selectedDay : 'Save Version for ' + selectedDay }}
    </button>

    <!-- SAVED CUSTOM DAYS LIST -->
    <div v-if="savedWorkouts.length > 0">
      <div style="font-size: 11px; letter-spacing: 2px; color: #a3a3a3; text-transform: uppercase; margin-bottom: 12px; font-weight: 600">
        Saved Custom Day Versions ({{ savedWorkouts.length }})
      </div>

      <div v-for="savedDay in savedWorkouts" :key="savedDay.id"
        style="margin-bottom: 12px; border: 1px solid oklch(18% 0.008 45); border-radius: 10px; overflow: hidden; background: oklch(10% 0.01 45)"
      >
        <!-- Card header -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: oklch(11% 0.01 45); flex-wrap: wrap; gap: 10px">
          <div style="display: flex; flex-direction: column; gap: 4px">
            <div style="display: flex; gap: 10px; align-items: center">
              <span style="font-size: 12px; color: #a3a3a3; letter-spacing: 2px; text-transform: uppercase; font-weight: 700; min-width: 80px">{{ savedDay.day_name }}</span>
              <span style="font-size: 11px; padding: 3px 10px; border-radius: 20px; background: #a78bfa22; color: #c4b5fd; letter-spacing: 1px; text-transform: uppercase; font-weight: 500">Custom</span>
            </div>
            <div v-if="savedDay?.title" style="font-size: 0.9375rem; color: #f5f5f5; font-weight: 500; letter-spacing: -0.2px; padding-left: 90px">
              {{ savedDay.title }}
            </div>
          </div>
          <Transition name="confirm" mode="out-in">
            <div v-if="confirmDeleteDayId === savedDay.id" key="confirm" style="display: flex; align-items: center">
              <span style="font-size: 12px; color: #a3a3a3; margin-right: 10px">Remove?</span>
              <button @click="deleteDay(savedDay.id)" style="padding: 6px 14px; background: #7f3535; border: 1px solid #f87171; border-radius: 20px; color: #fff; font-size: 11px; font-weight: 600; cursor: pointer; min-height: 38px; margin-right: 8px">Yes</button>
              <button @click="confirmDeleteDayId = null" style="padding: 6px 12px; background: transparent; border: 1px solid oklch(24% 0.008 45); border-radius: 20px; color: #a3a3a3; font-size: 11px; cursor: pointer; min-height: 38px">No</button>
            </div>
            <div v-else key="actions" style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: flex-end">
              <button @click="openLogModal(savedDay)" style="padding: 6px 14px; background: #166534; border: 1px solid #22c55e; border-radius: 20px; color: #ffffff; cursor: pointer; font-size: 11px; font-weight: 600; min-height: 38px; display: inline-flex; align-items: center">Log</button>
              <button @click="editDay(savedDay)" style="padding: 6px 12px; background: oklch(14% 0.008 45); border: 1px solid oklch(24% 0.008 45); border-radius: 20px; color: #c4b5fd; cursor: pointer; font-size: 11px; font-weight: 500; min-height: 38px; display: inline-flex; align-items: center">Edit</button>
              <button @click="confirmDeleteDayId = savedDay.id" style="padding: 6px 12px; background: transparent; border: 1px solid #7f353555; border-radius: 20px; color: #fca5a5; cursor: pointer; font-size: 11px; font-weight: 500; min-height: 38px; display: inline-flex; align-items: center">Delete</button>
            </div>
          </Transition>
        </div>

        <!-- Exercise table -->
        <div style="padding: 0 18px 16px; background: oklch(10% 0.01 45)">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem; line-height: 1.4">
            <thead>
              <tr style="color: #a3a3a3">
                <th scope="col" style="padding: 10px 0 6px; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; font-weight: 600; text-align: left">Exercise</th>
                <th scope="col" style="padding: 10px 0 6px; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; text-align: center; font-weight: 600">Sets</th>
                <th scope="col" style="padding: 10px 0 6px; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; text-align: center; font-weight: 600">Reps</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(ex, j) in (savedDay?.exercises ?? [])" :key="j" style="border-top: 1px solid oklch(15% 0.008 45)">
                <td style="padding: 12px 8px 12px 0">
                  <a :href="yt(ex.name)" target="_blank" rel="noopener noreferrer"
                    style="color: #c4b5fd; text-decoration: none; border-bottom: 1px dashed #a78bfa77; padding-bottom: 1px; font-size: 0.9375rem; font-weight: 500"
                  >{{ ex.name }} ↗</a>
                </td>
                <td style="text-align: center; color: #a78bfa; font-weight: 700; font-variant-numeric: tabular-nums; padding: 12px 4px; font-size: 1rem">{{ ex.sets || '—' }}</td>
                <td style="text-align: center; color: #e5e5e5; font-variant-numeric: tabular-nums; padding: 12px 0 12px 4px; white-space: nowrap">{{ ex.reps || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- ═══════════════════════════ LOG MODAL ════════════════════════════ -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="logModal.open"
        @click.self="closeLogModal"
        style="position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(4px); display: flex; align-items: flex-end; justify-content: center; z-index: 1000; padding: 0"
        role="dialog"
        aria-modal="true"
        :aria-label="`Log ${logModal.dayName} workout`"
      >
        <div style="width: 100%; max-width: 640px; background: oklch(11% 0.01 45); border-radius: 16px 16px 0 0; border: 1px solid oklch(22% 0.008 45); max-height: 88vh; overflow-y: auto">
          <!-- Modal header -->
          <div style="padding: 20px 20px 0; display: flex; justify-content: space-between; align-items: flex-start; position: sticky; top: 0; background: oklch(11% 0.01 45); padding-bottom: 16px; border-bottom: 1px solid oklch(16% 0.008 45); z-index: 10">
            <div>
              <div style="font-size: 10px; letter-spacing: 3px; color: #a3a3a3; text-transform: uppercase; margin-bottom: 4px; font-weight: 600">Log Workout</div>
              <div style="font-size: 1.125rem; color: #ffffff; font-weight: 600">{{ logModal.dayName }}<span v-if="logModal.title" style="color: #a3a3a3"> — {{ logModal.title }}</span></div>
            </div>
            <button @click="closeLogModal" style="background: transparent; border: none; color: #a3a3a3; cursor: pointer; font-size: 24px; line-height: 1; padding: 4px 8px; min-width: 44px; min-height: 44px">✕</button>
          </div>

          <!-- Exercise inputs -->
          <div style="padding: 20px">
            <div v-for="(group, exName) in logModal.groups" :key="exName" style="margin-bottom: 20px">
              <div style="font-size: 0.9375rem; color: #ffffff; margin-bottom: 10px; font-weight: 600">{{ exName }}</div>
              <div style="display: grid; grid-template-columns: 50px 1fr 1fr 1fr; gap: 8px; margin-bottom: 6px">
                <span style="font-size: 10px; color: #737373"></span>
                <span style="font-size: 10px; color: #a3a3a3; text-align: center; text-transform: uppercase; font-weight: 600">Target</span>
                <span style="font-size: 10px; color: #a3a3a3; text-align: center; text-transform: uppercase; font-weight: 600">Done</span>
                <span style="font-size: 10px; color: #a3a3a3; text-align: center; text-transform: uppercase; font-weight: 600">Weight (lbs)</span>
              </div>
              <div v-for="set in group" :key="set.setNumber" style="display: grid; grid-template-columns: 50px 1fr 1fr 1fr; gap: 8px; margin-bottom: 6px; align-items: center">
                <span style="font-size: 12px; color: #a3a3a3; font-weight: 500">Set {{ set.setNumber }}</span>
                <span style="font-size: 13px; color: #a3a3a3; text-align: center; font-variant-numeric: tabular-nums">{{ set.reps }}</span>
                <input
                  v-model.number="set.repsDone"
                  type="number" min="0"
                  :placeholder="String(set.reps || '')"
                  class="workout-input log-input"
                  aria-label="Reps done"
                />
                <input
                  v-model.number="set.weightLbs"
                  type="number" min="0" step="2.5"
                  placeholder="lbs"
                  class="workout-input log-input"
                  aria-label="Weight in lbs"
                />
              </div>
            </div>

            <div v-if="logModal.error" style="font-size: 13px; color: #f87171; margin-bottom: 14px">{{ logModal.error }}</div>

            <button
              @click="confirmLog"
              :disabled="logModal.saving"
              :style="{
                width: '100%',
                padding: '16px',
                minHeight: '52px',
                background: logModal.saving ? 'oklch(14% 0.008 45)' : '#22c55e',
                border: 'none',
                borderRadius: '9999px',
                color: logModal.saving ? '#737373' : '#ffffff',
                cursor: logModal.saving ? 'wait' : 'pointer',
                fontSize: '12px',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                fontWeight: '700',
                transition: 'background 200ms',
              }"
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
import { ref, computed, nextTick } from 'vue'
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
import { logCustomDay } from '@/queries/customLog'
import { invalidateWorkoutHistory } from '@/queries/history'
import { parseSetCount } from '@/lib/workout'
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

const inputStyle = {
  width: '100%',
  background: 'oklch(8% 0.012 45)',
  border: '1px solid oklch(24% 0.008 45)',
  borderRadius: '6px',
  padding: '10px 12px',
  color: '#ffffff',
  fontSize: '0.875rem',
  minHeight: '44px',
  boxSizing: 'border-box',
  transition: 'border-color 150ms ease-out',
}

// ── Computed data ──────────────────────────────────────────────
const savedWorkouts = computed(() => customDaysData.value ?? [])
const programs = computed(() => programsData.value ?? [])

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
  } finally {
    savingProgram.value = false
  }
}

// ── Programs: rename ──────────────────────────────────────────
const renamingProgramId = ref(null)
const renameProgramName = ref('')

async function confirmProgramRename(programId) {
  if (!renameProgramName.value.trim()) return
  await renameProgram(programId, renameProgramName.value.trim())
  await invalidateCustomPrograms(queryClient)
  renamingProgramId.value = null
}

// ── Programs: delete ──────────────────────────────────────────
const confirmDeleteProgramId = ref(null)

async function handleDeleteProgram(programId) {
  await deleteProgram(programId)
  await invalidateCustomPrograms(queryClient)
  confirmDeleteProgramId.value = null
  if (expandedProgramId.value === programId) expandedProgramId.value = null
}

// ── Programs: activate ────────────────────────────────────────
const activatingProgramId = ref(null)

async function handleActivateProgram(program) {
  const days = program.custom_program_days ?? []
  if (!days.length) return
  activatingProgramId.value = program.id
  try {
    await activateProgram(auth.user.id, days)
    await invalidateCustomDays(queryClient)
    await auth.adoptProgram()

    // Save to instant local cache so ProgramView renders synchronously without delay
    const rows = days.map((d) => ({
      user_id: auth.user?.id,
      day_name: d.day_name,
      title: d.title ?? '',
      exercises: d.exercises,
    }))
    try {
      const k = auth.user?.id ? `active-custom-days-v1-${auth.user.id}` : 'active-custom-days-v1-anon'
      localStorage.setItem(k, JSON.stringify(rows))
      localStorage.setItem('active-custom-days-v1-last', JSON.stringify(rows))
    } catch (e) {}

    showToast(`"${program.name}" is now active in your program!`)
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

function buildLogGroups(exercises) {
  const groups = {}
  for (const ex of exercises) {
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
.workout-input:focus-visible {
  outline: 2px solid #a78bfa;
  outline-offset: 0;
  border-color: #a78bfa;
}

.log-input {
  text-align: center;
  min-height: 40px;
  -moz-appearance: textfield;
}
.log-input::-webkit-outer-spin-button,
.log-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.log-input:focus {
  outline: 2px solid #a78bfa;
  border-color: #a78bfa;
}
.log-input::placeholder {
  color: #737373;
}

button:focus-visible {
  outline: 2px solid #a78bfa;
  outline-offset: 2px;
}

a:focus-visible {
  outline: 2px solid #a78bfa;
  outline-offset: 2px;
  border-radius: 2px;
}

a {
  transition: opacity 100ms ease-out;
}
a:hover {
  opacity: 0.75;
}

.exercise-enter-active {
  transition:
    opacity 200ms ease-out,
    transform 200ms cubic-bezier(0.25, 1, 0.5, 1);
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
  transition:
    opacity 200ms ease-out,
    max-height 200ms cubic-bezier(0.25, 1, 0.5, 1);
  overflow: hidden;
  max-height: 800px;
}
.rename-slide-leave-active {
  transition:
    opacity 140ms ease-in,
    max-height 140ms ease-in;
  overflow: hidden;
  max-height: 800px;
}
.rename-slide-enter-from,
.rename-slide-leave-to {
  opacity: 0;
  max-height: 0;
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
