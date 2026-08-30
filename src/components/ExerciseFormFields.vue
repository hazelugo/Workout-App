<template>
  <div class="exercise-form-grid">
    <div class="form-field">
      <label class="field-label">Exercise name</label>
      <input v-model="model.name" class="workout-input" placeholder="e.g. Cable Fly" />
    </div>
    <div class="form-field">
      <label class="field-label">Category</label>
      <select v-model="model.category" class="workout-input">
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>
    </div>
    <div class="sets-reps-row">
      <div class="form-field">
        <label class="field-label">Default sets</label>
        <input v-model="model.default_sets" class="workout-input center-input" placeholder="3" />
      </div>
      <div class="form-field">
        <label class="field-label">Default reps</label>
        <input v-model="model.default_reps" class="workout-input center-input" placeholder="10" />
      </div>
    </div>
    <div class="form-field">
      <label class="field-label">Notes <span class="optional-hint">(optional)</span></label>
      <input v-model="model.notes" class="workout-input" placeholder="Form cues, equipment, etc." />
    </div>
  </div>
</template>

<script setup>
import { EXERCISE_CATEGORIES } from '@/queries/savedExercises'

const model = defineModel({ type: Object, required: true })
const categories = EXERCISE_CATEGORIES
</script>

<style scoped>
.exercise-form-grid {
  display: grid;
  gap: 12px;
}

.field-label {
  display: block;
  font-size: 10px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}

.optional-hint {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 400;
}

.sets-reps-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
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

.center-input {
  text-align: center;
}
</style>
