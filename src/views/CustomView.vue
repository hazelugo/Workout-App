<template>
  <!-- ═══════════════════════════ Page header ═══════════════════════════ -->
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
      Custom Plan
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
      Build Your Day
    </h1>
    <p style="font-size: 0.875rem; color: #888; margin-top: 8px; font-style: italic">
      Save full programs or override any single day
    </p>
  </div>

  <!-- ═══════════════════════ MY PROGRAMS section ═══════════════════════ -->
  <div style="max-width: 640px; margin: 28px auto 0; padding: 0 16px">
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px">
      <div style="font-size: 10px; letter-spacing: 3px; color: #666; text-transform: uppercase">
        My Programs
      </div>
      <button
        @click="startNewProgram"
        style="
          padding: 5px 12px;
          background: #a78bfa18;
          border: 1px solid #a78bfa55;
          border-radius: 20px;
          color: #a78bfa;
          cursor: pointer;
          font-size: 10px;
          letter-spacing: 1px;
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
          margin-bottom: 12px;
          padding: 12px 14px;
          background: oklch(8% 0.012 45);
          border: 1px solid oklch(20% 0.008 45);
          border-radius: 8px;
          display: flex;
          gap: 8px;
          align-items: center;
        "
      >
        <input
          v-model="newProgramName"
          placeholder="Program name (e.g. Summer Cut)"
          class="workout-input"
          :style="{ ...inputStyle, flex: 1 }"
          @keydown.enter="saveNewProgram"
          @keydown.escape="creatingProgram = false"
          ref="newProgramInput"
        />
        <button
          @click="saveNewProgram"
          :disabled="!newProgramName.trim() || savingProgram"
          :style="{
            padding: '7px 14px',
            background: newProgramName.trim() ? '#a78bfa' : 'oklch(14% 0.008 45)',
            border: 'none',
            borderRadius: '6px',
            color: newProgramName.trim() ? '#fff' : '#444',
            cursor: newProgramName.trim() ? 'pointer' : 'default',
            fontSize: '11px',
            letterSpacing: '1px',
            whiteSpace: 'nowrap',
            transition: 'background 200ms, color 200ms',
          }"
        >
          {{ savingProgram ? 'Creating…' : 'Create' }}
        </button>
        <button
          @click="creatingProgram = false"
          style="background: transparent; border: none; color: #555; cursor: pointer; font-size: 16px"
        >
          ✕
        </button>
      </div>
    </Transition>

    <!-- Program cards -->
    <div v-if="programsLoading" style="padding: 24px 0; text-align: center; color: #555; font-size: 0.875rem">
      Loading programs…
    </div>

    <div v-else-if="programs.length === 0 && !creatingProgram"
      style="
        padding: 24px 20px;
        border: 1px dashed oklch(20% 0.008 45);
        border-radius: 8px;
        text-align: center;
        margin-bottom: 28px;
      "
    >
      <div style="font-size: 20px; margin-bottom: 8px; opacity: 0.4">📋</div>
      <div style="font-size: 0.875rem; color: #666">No programs yet.</div>
      <div style="font-size: 12px; color: #555; margin-top: 4px">
        Create a program to save a full week of workouts as a reusable plan.
      </div>
    </div>

    <div v-else>
      <div
        v-for="program in programs"
        :key="program.id"
        style="margin-bottom: 10px; border: 1px solid oklch(17% 0.008 45); border-radius: 8px; overflow: hidden"
      >
        <!-- Program card header -->
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 13px 16px;
            background: oklch(10% 0.01 45);
          "
        >
          <div style="display: flex; align-items: center; gap: 10px; min-width: 0">
            <!-- Editable program name -->
            <div v-if="renamingProgramId === program.id" style="display: flex; gap: 6px; align-items: center; flex: 1">
              <input
                v-model="renameProgramName"
                class="workout-input"
                :style="{ ...inputStyle, flex: 1, fontSize: '0.875rem', padding: '4px 8px' }"
                @keydown.enter="confirmProgramRename(program.id)"
                @keydown.escape="renamingProgramId = null"
              />
              <button @click="confirmProgramRename(program.id)"
                style="background: transparent; border: none; color: #a78bfa; cursor: pointer; font-size: 11px">
                Save
              </button>
              <button @click="renamingProgramId = null"
                style="background: transparent; border: none; color: #555; cursor: pointer; font-size: 14px">
                ✕
              </button>
            </div>
            <div v-else style="display: flex; align-items: center; gap: 10px">
              <span style="font-size: 0.9375rem; color: #e8e8e8; font-weight: 400">{{ program.name }}</span>
              <span style="font-size: 10px; color: #555; letter-spacing: 1px">
                {{ program.custom_program_days?.length ?? 0 }} day{{ (program.custom_program_days?.length ?? 0) !== 1 ? 's' : '' }}
              </span>
            </div>
          </div>
          <div style="display: flex; gap: 4px; align-items: center; flex-shrink: 0">
            <button @click="toggleProgramEditor(program.id)"
              style="background: transparent; border: none; color: #a78bfa; cursor: pointer; font-size: 11px; letter-spacing: 1px">
              {{ expandedProgramId === program.id ? 'Close' : 'Edit' }}
            </button>
            <span style="color: oklch(22% 0.008 45); font-size: 10px">|</span>
            <button @click="handleActivateProgram(program)"
              :disabled="activatingProgramId === program.id"
              style="background: transparent; border: none; color: #4ade80; cursor: pointer; font-size: 11px; letter-spacing: 1px">
              {{ activatingProgramId === program.id ? 'Applying…' : 'Activate' }}
            </button>
            <span style="color: oklch(22% 0.008 45); font-size: 10px">|</span>
            <button @click="renamingProgramId = program.id; renameProgramName = program.name"
              style="background: transparent; border: none; color: #666; cursor: pointer; font-size: 11px; letter-spacing: 1px">
              Rename
            </button>
            <span style="color: oklch(22% 0.008 45); font-size: 10px">|</span>
            <button v-if="confirmDeleteProgramId !== program.id"
              @click="confirmDeleteProgramId = program.id"
              style="background: transparent; border: none; color: #666; cursor: pointer; font-size: 11px; letter-spacing: 1px">
              Delete
            </button>
            <template v-else>
              <button @click="handleDeleteProgram(program.id)"
                style="background: transparent; border: none; color: #f87171; cursor: pointer; font-size: 11px; letter-spacing: 1px">
                Yes
              </button>
              <button @click="confirmDeleteProgramId = null"
                style="background: transparent; border: none; color: #777; cursor: pointer; font-size: 11px">
                No
              </button>
            </template>
          </div>
        </div>

        <!-- Program day editor (expanded) -->
        <Transition name="rename-slide">
          <div v-if="expandedProgramId === program.id"
            style="background: oklch(7% 0.01 45); border-top: 1px solid oklch(15% 0.008 45)"
          >
            <div
              v-for="d in days"
              :key="d"
              style="border-bottom: 1px solid oklch(12% 0.008 45)"
            >
              <!-- Day row header -->
              <button
                @click="toggleProgramDay(program.id, d)"
                style="
                  width: 100%;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  padding: 10px 16px;
                  background: transparent;
                  border: none;
                  cursor: pointer;
                  text-align: left;
                "
              >
                <div style="display: flex; align-items: center; gap: 10px">
                  <span style="font-size: 11px; color: #555; letter-spacing: 2px; text-transform: uppercase; min-width: 80px">{{ d }}</span>
                  <span v-if="getProgramDay(program, d)" style="font-size: 12px; color: #888">
                    {{ getProgramDay(program, d).title || `${getProgramDay(program, d).exercises?.length ?? 0} exercise${(getProgramDay(program, d).exercises?.length ?? 0) !== 1 ? 's' : ''}` }}
                  </span>
                  <span v-else style="font-size: 11px; color: #3a3a3a; font-style: italic">Empty — click to add</span>
                </div>
                <span style="color: #555; font-size: 14px">
                  {{ expandedProgramDay === `${program.id}|${d}` ? '−' : '+' }}
                </span>
              </button>

              <!-- Day exercise editor -->
              <Transition name="rename-slide">
                <div v-if="expandedProgramDay === `${program.id}|${d}`"
                  style="padding: 0 16px 16px"
                >
                  <!-- Title -->
                  <div style="margin-bottom: 12px">
                    <div style="font-size: 10px; letter-spacing: 2px; color: #555; text-transform: uppercase; margin-bottom: 6px">
                      Day Title <span style="text-transform: none; letter-spacing: 0; color: #444">(optional)</span>
                    </div>
                    <input
                      v-model="programDayDraft[`${program.id}|${d}`].title"
                      placeholder="e.g. Push Day, Upper Body…"
                      class="workout-input"
                      :style="inputStyle"
                    />
                  </div>

                  <!-- Exercises -->
                  <div style="font-size: 10px; letter-spacing: 2px; color: #555; text-transform: uppercase; margin-bottom: 8px">
                    Exercises
                  </div>
                  <TransitionGroup name="exercise" tag="div" style="position: relative">
                    <div
                      v-for="(ex, i) in programDayDraft[`${program.id}|${d}`].exercises"
                      :key="ex._id"
                      style="margin-bottom: 8px; padding: 12px; background: oklch(10% 0.01 45); border: 1px solid oklch(17% 0.008 45); border-radius: 8px"
                    >
                      <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px">
                        <span style="font-size: 11px; color: #555; min-width: 18px; text-align: right">{{ i + 1 }}</span>
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
                          style="background: transparent; border: none; color: #555; cursor: pointer; font-size: 18px; padding: 4px 8px; flex-shrink: 0; min-width: 36px; min-height: 36px; display: flex; align-items: center; justify-content: center"
                        >
                          <span aria-hidden="true">×</span>
                        </button>
                      </div>
                      <div style="display: flex; gap: 8px">
                        <div style="flex: 1; text-align: center">
                          <label :for="`pd-${program.id}-${d}-${i}-sets`" style="display: block; font-size: 9px; letter-spacing: 2px; color: #555; text-transform: uppercase; margin-bottom: 4px">Sets</label>
                          <input :id="`pd-${program.id}-${d}-${i}-sets`" v-model="ex.sets" placeholder="3" class="workout-input" :style="{ ...inputStyle, textAlign: 'center' }" />
                        </div>
                        <div style="flex: 1; text-align: center">
                          <label :for="`pd-${program.id}-${d}-${i}-reps`" style="display: block; font-size: 9px; letter-spacing: 2px; color: #555; text-transform: uppercase; margin-bottom: 4px">Reps</label>
                          <input :id="`pd-${program.id}-${d}-${i}-reps`" v-model="ex.reps" placeholder="10" class="workout-input" :style="{ ...inputStyle, textAlign: 'center' }" />
                        </div>
                      </div>
                    </div>
                  </TransitionGroup>

                  <button @click="addProgramExercise(program.id, d)"
                    style="width: 100%; padding: 8px; background: transparent; border: 1px dashed oklch(22% 0.008 45); border-radius: 6px; color: #555; cursor: pointer; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px"
                  >
                    + Add Exercise
                  </button>

                  <div style="display: flex; gap: 8px">
                    <button
                      @click="saveProgramDayHandler(program.id, d)"
                      :disabled="savingProgramDay === `${program.id}|${d}`"
                      :style="{
                        flex: 1,
                        padding: '9px',
                        background: '#a78bfa',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '10px',
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
                      style="padding: 9px 14px; background: transparent; border: 1px solid oklch(22% 0.008 45); border-radius: 6px; color: #666; cursor: pointer; font-size: 10px; letter-spacing: 1px; text-transform: uppercase"
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

  <!-- ════════════════════ QUICK DAY OVERRIDE section ════════════════════ -->
  <div style="max-width: 640px; margin: 32px auto 0; padding: 0 16px">
    <div style="font-size: 10px; letter-spacing: 3px; color: #666; text-transform: uppercase; margin-bottom: 16px">
      Quick Day Override
    </div>

    <!-- Day Selector -->
    <div style="margin-bottom: 24px">
      <div style="font-size: 10px; letter-spacing: 3px; color: #666; text-transform: uppercase; margin-bottom: 10px">
        Day of Week
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 8px">
        <button
          v-for="d in days"
          :key="d"
          @click="selectedDay = d"
          :style="{
            padding: '7px 14px',
            background: selectedDay === d ? '#a78bfa22' : 'transparent',
            border: selectedDay === d ? '1px solid #a78bfa' : '1px solid oklch(20% 0.008 45)',
            borderRadius: '20px',
            color: selectedDay === d ? '#a78bfa' : '#777',
            cursor: 'pointer',
            fontSize: '11px',
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
      <div style="font-size: 10px; letter-spacing: 3px; color: #666; text-transform: uppercase; margin-bottom: 10px">
        Plan Title <span style="color: #555; letter-spacing: 1px; text-transform: none">(optional)</span>
      </div>
      <input
        v-model="planTitle"
        placeholder="e.g. Upper Body, Leg Day, Push Day…"
        aria-label="Plan title"
        class="workout-input"
        :style="inputStyle"
      />
    </div>

    <div style="font-size: 10px; letter-spacing: 3px; color: #666; text-transform: uppercase; margin-bottom: 10px">
      Exercises
    </div>

    <TransitionGroup name="exercise" tag="div" style="position: relative">
      <div
        v-for="(ex, i) in exercises"
        :key="ex._id"
        style="margin-bottom: 10px; padding: 14px; background: oklch(10% 0.01 45); border: 1px solid oklch(17% 0.008 45); border-radius: 8px"
      >
        <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 10px">
          <span style="font-size: 11px; color: #666; min-width: 18px; text-align: right">{{ i + 1 }}</span>
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
            style="background: transparent; border: none; color: #777; cursor: pointer; font-size: 20px; line-height: 1; padding: 4px 8px; flex-shrink: 0; min-width: 44px; min-height: 44px; display: flex; align-items: center; justify-content: center"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div style="display: flex; gap: 8px; margin-bottom: 10px">
          <div style="flex: 1">
            <label :for="`ex-${i}-sets`" style="display: block; font-size: 0.625rem; letter-spacing: 2px; color: #666; text-transform: uppercase; margin-bottom: 4px; text-align: center">Sets</label>
            <input :id="`ex-${i}-sets`" v-model="ex.sets" placeholder="3" class="workout-input" :style="{ ...inputStyle, textAlign: 'center' }" />
          </div>
          <div style="flex: 1">
            <label :for="`ex-${i}-reps`" style="display: block; font-size: 0.625rem; letter-spacing: 2px; color: #666; text-transform: uppercase; margin-bottom: 4px; text-align: center">Reps</label>
            <input :id="`ex-${i}-reps`" v-model="ex.reps" placeholder="10" class="workout-input" :style="{ ...inputStyle, textAlign: 'center' }" />
          </div>
        </div>

        <div v-if="ex.name.trim()" style="display: flex; align-items: center; gap: 6px">
          <span aria-hidden="true" style="font-size: 10px; color: #666">▶</span>
          <a :href="yt(ex.name)" target="_blank" rel="noopener noreferrer"
            style="font-size: 11px; color: #a78bfa; text-decoration: none; border-bottom: 1px dashed #a78bfa55; padding-bottom: 1px"
          >Watch demo ↗</a>
        </div>
        <div v-else style="font-size: 11px; color: #555; font-style: italic">Type a name to get a demo link</div>
      </div>
    </TransitionGroup>

    <button @click="addExercise"
      style="width: 100%; padding: 11px; background: transparent; border: 1px dashed oklch(22% 0.008 45); border-radius: 8px; color: #666; cursor: pointer; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px"
    >
      + Add Exercise
    </button>

    <button @click="saveWorkout" :disabled="!hasValidExercises"
      :style="{
        width: '100%',
        padding: '13px',
        background: hasValidExercises ? '#a78bfa' : 'oklch(11.5% 0.008 45)',
        border: 'none',
        borderRadius: '8px',
        color: hasValidExercises ? '#fff' : '#444',
        cursor: hasValidExercises ? 'pointer' : 'default',
        fontSize: '11px',
        letterSpacing: '3px',
        textTransform: 'uppercase',
        marginBottom: '40px',
        transition: 'background 200ms ease-out, color 200ms ease-out',
      }"
    >
      Save for {{ selectedDay }}
    </button>
  </div>

  <!-- ═════════════════════ SAVED CUSTOM DAYS section ════════════════════ -->
  <div style="max-width: 640px; margin: 0 auto; padding: 0 16px">
    <div v-if="Object.keys(savedWorkouts).length > 0">
      <div style="font-size: 10px; letter-spacing: 3px; color: #666; text-transform: uppercase; margin-bottom: 10px">
        Saved Custom Days
      </div>

      <div v-for="(dayData, day) in savedWorkouts" :key="day"
        style="margin-bottom: 8px; border: 1px solid oklch(17% 0.008 45); border-radius: 8px; overflow: hidden"
      >
        <!-- Card header -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: oklch(10% 0.01 45)">
          <div style="display: flex; flex-direction: column; gap: 3px">
            <div style="display: flex; gap: 10px; align-items: center">
              <span style="font-size: 11px; color: #555; letter-spacing: 2px; text-transform: uppercase; min-width: 72px">{{ day }}</span>
              <span style="font-size: 11px; padding: 2px 8px; border-radius: 20px; background: #a78bfa18; color: #a78bfa; letter-spacing: 1px; text-transform: uppercase">Custom</span>
            </div>
            <div v-if="dayData?.title" style="font-size: 0.9375rem; color: oklch(90% 0.005 45); font-weight: 500; letter-spacing: -0.2px; padding-left: 82px">
              {{ dayData.title }}
            </div>
          </div>
          <Transition name="confirm" mode="out-in">
            <div v-if="confirmDeleteDay === day" key="confirm" style="display: flex; align-items: center">
              <span style="font-size: 11px; color: #888; font-family: Georgia, serif; margin-right: 8px">Remove?</span>
              <button @click="deleteDay(day)" style="background: transparent; border: none; color: #f87171; cursor: pointer; font-size: 11px; letter-spacing: 1px; margin-right: 8px">Yes</button>
              <button @click="confirmDeleteDay = null" style="background: transparent; border: none; color: #777; cursor: pointer; font-size: 11px; letter-spacing: 1px">No</button>
            </div>
            <div v-else key="actions" style="display: flex; gap: 4px; align-items: center; flex-wrap: wrap; justify-content: flex-end">
              <button @click="openLogModal(day, dayData)" style="background: transparent; border: none; color: #4ade80; cursor: pointer; font-size: 11px; letter-spacing: 1px">Log</button>
              <span style="color: oklch(22% 0.008 45); font-size: 10px">|</span>
              <button @click="editDay(day)" style="background: transparent; border: none; color: #a78bfa; cursor: pointer; font-size: 11px; letter-spacing: 1px">Edit</button>
              <span style="color: oklch(22% 0.008 45); font-size: 10px">|</span>
              <button @click="toggleRename(day)" style="background: transparent; border: none; color: #666; cursor: pointer; font-size: 11px; letter-spacing: 1px">Rename</button>
              <span style="color: oklch(22% 0.008 45); font-size: 10px">|</span>
              <button @click="confirmDeleteDay = day" style="background: transparent; border: none; color: #666; cursor: pointer; font-size: 11px; letter-spacing: 1px">Delete</button>
            </div>
          </Transition>
        </div>

        <!-- Inline rename row -->
        <Transition name="rename-slide">
          <div v-if="renamingDay === day"
            style="padding: 10px 16px; background: oklch(8% 0.012 45); border-bottom: 1px solid oklch(17% 0.008 45); display: flex; align-items: center; gap: 8px; flex-wrap: wrap"
          >
            <span style="font-size: 10px; letter-spacing: 2px; color: #666; text-transform: uppercase">Move to</span>
            <div style="display: flex; flex-wrap: wrap; gap: 6px; flex: 1">
              <button
                v-for="d in days.filter((d) => d !== day && !savedWorkouts[d])"
                :key="d"
                @click="renameTarget = d"
                :style="{
                  padding: '4px 10px',
                  background: renameTarget === d ? '#a78bfa22' : 'transparent',
                  border: renameTarget === d ? '1px solid #a78bfa' : '1px solid oklch(22% 0.008 45)',
                  borderRadius: '20px',
                  color: renameTarget === d ? '#a78bfa' : '#666',
                  cursor: 'pointer',
                  fontSize: '10px',
                  letterSpacing: '1px',
                  transition: 'color 150ms, border-color 150ms, background 150ms',
                }"
              >{{ d }}</button>
              <span v-if="days.filter((d) => d !== day && !savedWorkouts[d]).length === 0"
                style="font-size: 11px; color: #555; font-style: italic">All other days already have custom plans</span>
            </div>
            <button @click="confirmRename(day)" :disabled="!renameTarget"
              :style="{
                padding: '4px 12px',
                background: renameTarget ? '#a78bfa' : 'oklch(14% 0.008 45)',
                border: 'none',
                borderRadius: '4px',
                color: renameTarget ? '#fff' : '#444',
                cursor: renameTarget ? 'pointer' : 'default',
                fontSize: '10px',
                letterSpacing: '1px',
                transition: 'background 200ms, color 200ms',
              }"
            >Move</button>
            <button @click="renamingDay = null; renameTarget = null"
              style="background: transparent; border: none; color: #555; cursor: pointer; font-size: 11px">✕</button>
          </div>
        </Transition>

        <!-- Exercise table -->
        <div style="padding: 0 16px 14px; background: oklch(10% 0.01 45)">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem; line-height: 1.4">
            <thead>
              <tr style="color: #777">
                <th scope="col" style="padding: 8px 0 4px; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; font-weight: 400; text-align: left">Exercise</th>
                <th scope="col" style="padding: 8px 0 4px; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; text-align: center; font-weight: 400">Sets</th>
                <th scope="col" style="padding: 8px 0 4px; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; text-align: center; font-weight: 400">Reps</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(ex, j) in (dayData?.exercises ?? [])" :key="j" style="border-top: 1px solid oklch(15% 0.008 45)">
                <td style="padding: 10px 8px 10px 0">
                  <a :href="yt(ex.name)" target="_blank" rel="noopener noreferrer"
                    style="color: #a78bfa; text-decoration: none; border-bottom: 1px dashed #a78bfa55; padding-bottom: 1px; font-size: 0.875rem"
                  >{{ ex.name }} ↗</a>
                </td>
                <td style="text-align: center; color: #a78bfa; font-weight: 700; font-variant-numeric: tabular-nums; padding: 10px 4px">{{ ex.sets || '—' }}</td>
                <td style="text-align: center; color: #aaa; font-variant-numeric: tabular-nums; padding: 10px 0 10px 4px; white-space: nowrap">{{ ex.reps || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-else
      style="padding: 28px 20px; border: 1px dashed oklch(20% 0.008 45); border-radius: 8px; text-align: center; margin-bottom: 40px"
    >
      <div style="font-size: 22px; margin-bottom: 10px; opacity: 0.4">✎</div>
      <div style="font-size: 0.875rem; color: #777; margin-bottom: 6px">No custom days saved yet.</div>
      <div style="font-size: 12px; color: #555; line-height: 1.7; max-width: 320px; margin: 0 auto">
        Use this when you're traveling, at a different gym, or want to swap in your own exercises for a day.
      </div>
    </div>
  </div>

  <!-- ═══════════════════════════ LOG MODAL ════════════════════════════ -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="logModal.open"
        @click.self="closeLogModal"
        style="position: fixed; inset: 0; background: rgba(0,0,0,0.75); display: flex; align-items: flex-end; justify-content: center; z-index: 1000; padding: 0"
        role="dialog"
        aria-modal="true"
        :aria-label="`Log ${logModal.dayName} workout`"
      >
        <div style="width: 100%; max-width: 640px; background: oklch(9% 0.012 45); border-radius: 16px 16px 0 0; border: 1px solid oklch(18% 0.008 45); max-height: 88vh; overflow-y: auto">
          <!-- Modal header -->
          <div style="padding: 20px 20px 0; display: flex; justify-content: space-between; align-items: flex-start; position: sticky; top: 0; background: oklch(9% 0.012 45); padding-bottom: 16px; border-bottom: 1px solid oklch(15% 0.008 45)">
            <div>
              <div style="font-size: 10px; letter-spacing: 3px; color: #666; text-transform: uppercase; margin-bottom: 4px">Log Workout</div>
              <div style="font-size: 1rem; color: #e8e8e8; font-weight: 400">{{ logModal.dayName }}<span v-if="logModal.title" style="color: #888"> — {{ logModal.title }}</span></div>
            </div>
            <button @click="closeLogModal" style="background: transparent; border: none; color: #555; cursor: pointer; font-size: 22px; line-height: 1; padding: 0 0 0 12px">✕</button>
          </div>

          <!-- Exercise inputs -->
          <div style="padding: 16px 20px">
            <div v-for="(group, exName) in logModal.groups" :key="exName" style="margin-bottom: 16px">
              <div style="font-size: 0.875rem; color: #e8e8e8; margin-bottom: 8px">{{ exName }}</div>
              <div style="display: grid; grid-template-columns: 44px 1fr 1fr 1fr; gap: 6px; margin-bottom: 4px">
                <span style="font-size: 10px; color: #444"></span>
                <span style="font-size: 10px; color: #555; text-align: center">Target</span>
                <span style="font-size: 10px; color: #555; text-align: center">Done</span>
                <span style="font-size: 10px; color: #555; text-align: center">Weight (lbs)</span>
              </div>
              <div v-for="set in group" :key="set.setNumber" style="display: grid; grid-template-columns: 44px 1fr 1fr 1fr; gap: 6px; margin-bottom: 4px; align-items: center">
                <span style="font-size: 11px; color: #555">Set {{ set.setNumber }}</span>
                <span style="font-size: 12px; color: #555; text-align: center; font-variant-numeric: tabular-nums">{{ set.reps }}</span>
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

            <div v-if="logModal.error" style="font-size: 12px; color: #f87171; margin-bottom: 10px">{{ logModal.error }}</div>

            <button
              @click="confirmLog"
              :disabled="logModal.saving"
              :style="{
                width: '100%',
                padding: '13px',
                background: logModal.saving ? 'oklch(14% 0.008 45)' : '#4ade80',
                border: 'none',
                borderRadius: '8px',
                color: logModal.saving ? '#444' : '#000',
                cursor: logModal.saving ? 'wait' : 'pointer',
                fontSize: '11px',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                fontWeight: '600',
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

const auth = useAuthStore()
const queryClient = useQueryClient()

const { data: customDaysData } = useCustomDaysQuery()
const { data: programsData, isPending: programsLoading } = useCustomProgramsQuery()

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const yt = (q) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(q + ' exercise demonstration')}`

const inputStyle = {
  width: '100%',
  background: 'oklch(11.5% 0.008 45)',
  border: '1px solid oklch(20% 0.008 45)',
  borderRadius: '4px',
  padding: '8px 10px',
  color: '#e8e8e8',
  fontSize: '0.875rem',
  boxSizing: 'border-box',
  transition: 'border-color 150ms ease-out',
}

// ── Computed data ──────────────────────────────────────────────
const savedWorkouts = computed(() => customDaysData.value ?? {})
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
  } finally {
    activatingProgramId.value = null
  }
}

// ── Programs: expand editor ───────────────────────────────────
const expandedProgramId = ref(null)
const expandedProgramDay = ref(null) // "programId|dayName"

// Draft state for each program day being edited
// { "programId|dayName": { title, exercises: [{_id, name, sets, reps}] } }
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

const savingProgramDay = ref(null) // "programId|dayName" while saving

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

// ── Quick day override ────────────────────────────────────────
const confirmDeleteDay = ref(null)
const renamingDay = ref(null)
const renameTarget = ref(null)

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

async function saveWorkout() {
  const toSave = exercises.value.filter((e) => e.name.trim())
  if (!toSave.length) return

  const clean = toSave.map(({ name, sets, reps }) => ({ name, sets, reps }))
  await supabase
    .from('custom_days')
    .upsert(
      { user_id: auth.user.id, day_name: selectedDay.value, title: planTitle.value.trim(), exercises: clean },
      { onConflict: 'user_id,day_name' },
    )

  await invalidateCustomDays(queryClient)
  exercises.value = [newEx()]
  planTitle.value = ''
}

async function deleteDay(day) {
  await supabase.from('custom_days').delete().eq('day_name', day)
  await invalidateCustomDays(queryClient)
  confirmDeleteDay.value = null
}

function editDay(day) {
  const { title, exercises: exList } = savedWorkouts.value[day]
  exercises.value = exList.map((e) => ({ _id: _exId++, name: e.name, sets: e.sets, reps: e.reps }))
  planTitle.value = title ?? ''
  selectedDay.value = day
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function toggleRename(day) {
  if (renamingDay.value === day) {
    renamingDay.value = null
    renameTarget.value = null
  } else {
    renamingDay.value = day
    renameTarget.value = null
  }
}

async function confirmRename(day) {
  if (!renameTarget.value) return
  const newDay = renameTarget.value
  const { title, exercises: exList } = savedWorkouts.value[day]

  await supabase
    .from('custom_days')
    .upsert(
      { user_id: auth.user.id, day_name: newDay, title, exercises: exList },
      { onConflict: 'user_id,day_name' },
    )
  await supabase.from('custom_days').delete().eq('day_name', day).eq('user_id', auth.user.id)

  await invalidateCustomDays(queryClient)
  renamingDay.value = null
  renameTarget.value = null
}

// ── Log modal ──────────────────────────────────────────────────
const logModal = ref({
  open: false,
  dayName: '',
  title: '',
  groups: {}, // { exerciseName: [{ setNumber, reps, repsDone, weightLbs }] }
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

function openLogModal(day, dayData) {
  const exList = dayData?.exercises ?? []
  logModal.value = {
    open: true,
    dayName: day,
    title: dayData?.title ?? '',
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

    const dayData = savedWorkouts.value[logModal.value.dayName]
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
  border-color: #a78bfa44;
}

.log-input {
  text-align: center;
  -moz-appearance: textfield;
}
.log-input::-webkit-outer-spin-button,
.log-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.log-input:focus {
  outline: none;
  border-color: oklch(40% 0.008 45);
}
.log-input::placeholder {
  color: #3a3a3a;
}

button:focus-visible {
  outline: 2px solid #a78bfa;
  outline-offset: 2px;
  border-radius: 2px;
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
  max-height: 600px;
}
.rename-slide-leave-active {
  transition:
    opacity 140ms ease-in,
    max-height 140ms ease-in;
  overflow: hidden;
  max-height: 600px;
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
