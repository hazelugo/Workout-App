<template>
  <div class="exercise-name-picker" :class="{ 'is-focused': focused }">
    <input
      :id="inputId"
      ref="inputRef"
      :value="modelValue"
      :list="datalistId"
      :aria-label="ariaLabel"
      :placeholder="placeholder"
      class="workout-input flex-input"
      autocomplete="off"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
    />
    <datalist :id="datalistId">
      <option v-for="name in allExerciseNames" :key="name" :value="name" />
    </datalist>

    <Transition name="chips-fade">
      <div
        v-if="showPicker"
        class="exercise-picker-panel"
        role="listbox"
        :aria-label="ariaLabel ? `${ariaLabel} suggestions` : 'Exercise suggestions'"
      >
        <template v-if="modelValue.trim()">
          <div class="picker-section">
            <div class="picker-section-label">Matches</div>
            <div class="picker-chips">
              <button
                v-for="name in filteredMatches"
                :key="name"
                type="button"
                class="picker-chip"
                role="option"
                @mousedown.prevent="selectExercise(name)"
              >
                {{ name }}
              </button>
              <p v-if="filteredMatches.length === 0" class="picker-empty-hint">
                No matches — keep typing a custom name
              </p>
            </div>
          </div>
        </template>
        <template v-else>
          <div
            v-for="(exercises, group) in exerciseLibrary"
            :key="group"
            class="picker-section"
          >
            <div class="picker-section-label">{{ group }}</div>
            <div class="picker-chips">
              <button
                v-for="name in exercises"
                :key="name"
                type="button"
                class="picker-chip"
                role="option"
                @mousedown.prevent="selectExercise(name)"
              >
                {{ name }}
              </button>
            </div>
          </div>
        </template>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, useId } from 'vue'
import { exerciseLibrary, allExerciseNames, filterExercises } from '@/data/exerciseLibrary'

const props = defineProps({
  modelValue: { type: String, default: '' },
  ariaLabel: { type: String, default: 'Exercise name' },
  placeholder: { type: String, default: 'Exercise name' },
  inputId: { type: String, default: undefined },
})

const emit = defineEmits(['update:modelValue'])

const uid = useId()
const datalistId = `exercise-datalist-${uid}`
const inputRef = ref(null)
const focused = ref(false)
let blurTimer = null

const showPicker = computed(() => focused.value)

const filteredMatches = computed(() => filterExercises(props.modelValue, 10))

function onInput(e) {
  emit('update:modelValue', e.target.value)
}

function onFocus() {
  clearTimeout(blurTimer)
  focused.value = true
}

function onBlur() {
  blurTimer = setTimeout(() => {
    focused.value = false
  }, 150)
}

function selectExercise(name) {
  emit('update:modelValue', name)
  clearTimeout(blurTimer)
  focused.value = false
  inputRef.value?.blur()
}
</script>

<style scoped>
.exercise-name-picker {
  position: relative;
  flex: 1;
  min-width: 0;
}

.exercise-picker-panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 50;
  max-height: 280px;
  overflow-y: auto;
  padding: 10px;
  background: oklch(10% 0.01 45);
  border: 1px solid oklch(22% 0.008 45);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.picker-section + .picker-section {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid oklch(16% 0.008 45);
}

.picker-section-label {
  font-size: 0.625rem;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--color-text-secondary, #a3a3a3);
  margin-bottom: 6px;
}

.picker-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.picker-chip {
  min-height: 44px;
  padding: 8px 14px;
  background: oklch(14% 0.008 45);
  border: 1px solid oklch(22% 0.008 45);
  border-radius: 9999px;
  color: #e5e5e5;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 140ms ease, border-color 140ms ease, color 140ms ease;
  -webkit-tap-highlight-color: transparent;
}

.picker-chip:hover,
.picker-chip:active {
  background: oklch(18% 0.008 45);
  border-color: #a78bfa66;
  color: #ffffff;
}

.picker-empty-hint {
  margin: 0;
  font-size: 0.75rem;
  color: var(--color-text-muted, #737373);
  font-style: italic;
  padding: 4px 2px;
}

.chips-fade-enter-active {
  transition: opacity 140ms ease-out, transform 140ms cubic-bezier(0.16, 1, 0.3, 1);
}
.chips-fade-leave-active {
  transition: opacity 100ms ease-in, transform 100ms ease-in;
}
.chips-fade-enter-from,
.chips-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
