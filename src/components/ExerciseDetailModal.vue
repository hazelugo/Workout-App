<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="show && profile"
        class="exercise-detail-backdrop"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="`exercise-detail-${profile.name}`"
        @click.self="$emit('close')"
      >
        <div class="exercise-detail-sheet">
          <div class="exercise-detail-header">
            <div>
              <div class="exercise-detail-eyebrow">{{ profile.pattern }}</div>
              <h2 :id="`exercise-detail-${profile.name}`" class="exercise-detail-title">
                {{ profile.name }}
              </h2>
            </div>
            <button type="button" class="exercise-detail-close" aria-label="Close" @click="$emit('close')">
              ×
            </button>
          </div>

          <div v-if="profile.sets || profile.reps" class="exercise-detail-programming">
            <span v-if="profile.sets">{{ profile.sets }} sets</span>
            <span v-if="profile.sets && profile.reps">·</span>
            <span v-if="profile.reps">{{ profile.reps }} reps</span>
          </div>

          <p class="exercise-detail-description">{{ profile.description }}</p>

          <div class="exercise-detail-section">
            <div class="exercise-detail-label">Targets</div>
            <div class="exercise-detail-chips">
              <span v-for="muscle in profile.muscles" :key="muscle" class="exercise-detail-chip">
                {{ muscle }}
              </span>
            </div>
          </div>

          <div class="exercise-detail-section">
            <div class="exercise-detail-label">Equipment</div>
            <div class="exercise-detail-value">{{ profile.equipment }}</div>
          </div>

          <div class="exercise-detail-actions">
            <a
              :href="profile.youtubeUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="exercise-detail-youtube"
            >
              Watch demo on YouTube ↗
            </a>
            <button type="button" class="exercise-detail-dismiss" @click="$emit('close')">Close</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { lookupExerciseInfo } from '@/data/exerciseInfo'

const props = defineProps({
  show: { type: Boolean, default: false },
  exercise: { type: Object, default: null },
})

defineEmits(['close'])

const profile = computed(() => {
  if (!props.exercise?.name) return null
  return lookupExerciseInfo(props.exercise.name, {
    note: props.exercise.note,
    sets: props.exercise.sets,
    reps: props.exercise.reps,
  })
})
</script>

<style scoped>
.exercise-detail-backdrop {
  position: fixed;
  inset: 0;
  z-index: 110;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
}

@media (min-width: 600px) {
  .exercise-detail-backdrop {
    align-items: center;
    padding: 24px;
  }
}

.exercise-detail-sheet {
  width: 100%;
  max-width: 520px;
  background: oklch(11% 0.01 45);
  border: 1px solid oklch(20% 0.008 45);
  border-radius: 16px 16px 0 0;
  padding: 20px;
}

@media (min-width: 600px) {
  .exercise-detail-sheet {
    border-radius: 16px;
  }
}

.exercise-detail-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.exercise-detail-eyebrow {
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #c4b5fd;
  font-weight: 700;
  margin-bottom: 4px;
}

.exercise-detail-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #f5f5f5;
  line-height: 1.3;
}

.exercise-detail-close {
  width: 40px;
  height: 40px;
  border: 1px solid oklch(22% 0.008 45);
  border-radius: 50%;
  background: transparent;
  color: #d4d4d4;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
}

.exercise-detail-programming {
  margin-bottom: 12px;
  font-size: 12px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.exercise-detail-description {
  margin: 0 0 16px;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #d4d4d4;
}

.exercise-detail-section {
  margin-bottom: 14px;
}

.exercise-detail-label {
  font-size: 10px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
  font-weight: 700;
}

.exercise-detail-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.exercise-detail-chip {
  padding: 6px 12px;
  border-radius: 9999px;
  background: #a78bfa18;
  border: 1px solid #a78bfa44;
  color: #e9d5ff;
  font-size: 12px;
}

.exercise-detail-value {
  font-size: 0.875rem;
  color: #e5e5e5;
}

.exercise-detail-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 18px;
}

.exercise-detail-youtube {
  flex: 1;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  border-radius: 9999px;
  background: #4285f418;
  border: 1px solid #4285f466;
  color: #93c5fd;
  text-decoration: none;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.exercise-detail-youtube:hover {
  background: #4285f433;
  color: #ffffff;
}

.exercise-detail-dismiss {
  min-height: 44px;
  padding: 10px 16px;
  border-radius: 9999px;
  border: 1px solid oklch(22% 0.008 45);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  cursor: pointer;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 150ms ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
