<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="show"
        class="library-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="library-picker-title"
        @click.self="$emit('close')"
      >
        <div class="library-sheet">
          <div class="library-header">
            <div>
              <div class="library-eyebrow">Exercise library</div>
              <h2 id="library-picker-title" class="library-title">Add from saved exercises</h2>
            </div>
            <button type="button" class="library-close-btn" aria-label="Close" @click="$emit('close')">
              ×
            </button>
          </div>

          <input
            v-model="search"
            type="search"
            class="workout-input library-search"
            placeholder="Search your exercises…"
            aria-label="Search saved exercises"
          />

          <div v-if="loading" class="library-empty">Loading exercises…</div>
          <div v-else-if="!filteredExercises.length" class="library-empty">
            <p v-if="!exercises.length">
              No saved exercises yet. Add some on the Exercises tab, then pick them here when building days.
            </p>
            <p v-else>No exercises match your search.</p>
            <RouterLink v-if="!exercises.length" to="/exercises" class="library-link" @click="$emit('close')">
              Go to Exercises tab →
            </RouterLink>
          </div>

          <div v-else class="library-list">
            <button
              v-for="ex in filteredExercises"
              :key="ex.id"
              type="button"
              class="library-item"
              @click="select(ex)"
            >
              <div class="library-item-main">
                <span class="library-item-name">{{ ex.name }}</span>
                <span class="library-item-category">{{ ex.category }}</span>
              </div>
              <span v-if="ex.default_sets || ex.default_reps" class="library-item-meta">
                {{ ex.default_sets || '—' }} × {{ ex.default_reps || '—' }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  exercises: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'select'])

const search = ref('')

watch(
  () => props.show,
  (open) => {
    if (open) search.value = ''
  },
)

const filteredExercises = computed(() => {
  const q = search.value.trim().toLowerCase()
  const list = props.exercises ?? []
  if (!q) return list
  return list.filter(
    (ex) =>
      ex.name.toLowerCase().includes(q) ||
      String(ex.category ?? '').toLowerCase().includes(q),
  )
})

function select(ex) {
  emit('select', ex)
  emit('close')
}
</script>

<style scoped>
.library-backdrop {
  position: fixed;
  inset: 0;
  z-index: 120;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
}

@media (min-width: 600px) {
  .library-backdrop {
    align-items: center;
    padding: 24px;
  }
}

.library-sheet {
  width: 100%;
  max-width: 520px;
  max-height: 82dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: oklch(11% 0.01 45);
  border: 1px solid oklch(20% 0.008 45);
  border-radius: 16px 16px 0 0;
  padding: 20px;
}

@media (min-width: 600px) {
  .library-sheet {
    border-radius: 16px;
  }
}

.library-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.library-eyebrow {
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--color-text-secondary, #a3a3a3);
  font-weight: 700;
  margin-bottom: 4px;
}

.library-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #f5f5f5;
}

.library-close-btn {
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

.library-search {
  margin-bottom: 12px;
}

.library-list {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.library-item {
  width: 100%;
  min-height: 52px;
  padding: 12px 14px;
  border: 1px solid oklch(18% 0.008 45);
  border-radius: 10px;
  background: oklch(10% 0.01 45);
  color: inherit;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.library-item:hover {
  border-color: #a78bfa66;
  background: oklch(12% 0.01 45);
}

.library-item-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.library-item-name {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #f5f5f5;
}

.library-item-category {
  font-size: 10px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #c4b5fd;
}

.library-item-meta {
  flex-shrink: 0;
  font-size: 0.75rem;
  color: var(--color-text-secondary, #a3a3a3);
  font-variant-numeric: tabular-nums;
}

.library-empty {
  padding: 24px 8px;
  text-align: center;
  color: var(--color-text-secondary, #a3a3a3);
  font-size: 0.875rem;
  line-height: 1.6;
}

.library-link {
  display: inline-block;
  margin-top: 12px;
  color: #c4b5fd;
  text-decoration: none;
  font-size: 0.8125rem;
  letter-spacing: 0.5px;
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
