<template>
  <div class="program-day-nav">
    <button
      type="button"
      class="day-nav-btn"
      :disabled="activeIndex === 0"
      aria-label="Previous day"
      @click="$emit('prev')"
    >
      ‹
    </button>

    <div
      class="day-nav-center"
      @touchstart.passive="$emit('swipe-start', $event)"
      @touchend.passive="$emit('swipe-end', $event)"
    >
      <div class="day-nav-title">{{ title }}</div>
      <div v-if="subtitle" class="day-nav-subtitle">{{ subtitle }}</div>
      <div class="day-nav-counter">{{ activeIndex + 1 }} / {{ total }}</div>

      <div class="day-dots" role="tablist" :aria-label="ariaLabel">
        <button
          v-for="(item, i) in items"
          :key="item.key"
          type="button"
          role="tab"
          class="day-dot"
          :class="{ active: activeIndex === i, isToday: item.isToday }"
          :aria-selected="activeIndex === i"
          :aria-label="item.title"
          @click="$emit('select', i)"
        />
      </div>

      <button
        v-if="showJumpToday"
        type="button"
        class="jump-today-btn"
        @click="$emit('jump-today')"
      >
        Jump to today
      </button>
    </div>

    <button
      type="button"
      class="day-nav-btn"
      :disabled="activeIndex >= total - 1"
      aria-label="Next day"
      @click="$emit('next')"
    >
      ›
    </button>
  </div>
</template>

<script setup>
defineProps({
  items: { type: Array, required: true },
  activeIndex: { type: Number, required: true },
  total: { type: Number, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  showJumpToday: { type: Boolean, default: false },
  ariaLabel: { type: String, default: 'Select day' },
})

defineEmits(['prev', 'next', 'select', 'jump-today', 'swipe-start', 'swipe-end'])
</script>

<style scoped>
.program-day-nav {
  display: flex;
  align-items: stretch;
  gap: 10px;
  margin-bottom: 16px;
}

.day-nav-btn {
  flex-shrink: 0;
  align-self: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid oklch(22% 0.008 45);
  background: oklch(12% 0.008 45);
  color: #e8e8e8;
  font-size: 1.75rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 150ms, background 150ms;
}

.day-nav-btn:hover:not(:disabled) {
  border-color: var(--phase-color, #a78bfa);
  color: #fff;
}

.day-nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.day-nav-center {
  flex: 1;
  min-width: 0;
  text-align: center;
  padding: 12px 8px;
  border-radius: 12px;
  border: 1px solid oklch(20% 0.008 45);
  background: oklch(10.5% 0.01 45);
  touch-action: pan-y;
}

.day-nav-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #f5f5f5;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  font-family: system-ui, -apple-system, sans-serif;
}

.day-nav-subtitle {
  margin-top: 4px;
  font-size: 0.8125rem;
  color: var(--phase-color, #a78bfa);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.day-nav-counter {
  margin-top: 6px;
  font-size: 0.6875rem;
  color: var(--color-text-muted, #737373);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.day-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: nowrap;
}

.day-dot {
  width: 10px;
  height: 10px;
  padding: 0;
  border-radius: 50%;
  border: none;
  background: oklch(24% 0.008 45);
  cursor: pointer;
  transition: transform 150ms, background 150ms;
}

.day-dot.active {
  background: var(--phase-color, #a78bfa);
  transform: scale(1.35);
}

.day-dot.isToday:not(.active) {
  box-shadow: 0 0 0 2px var(--phase-color, #4ade80);
}

.day-dot:focus-visible {
  outline: 2px solid var(--phase-color, #a78bfa);
  outline-offset: 2px;
}

.jump-today-btn {
  margin-top: 10px;
  padding: 6px 12px;
  min-height: 36px;
  border-radius: 9999px;
  border: 1px solid oklch(24% 0.008 45);
  background: transparent;
  color: var(--color-text-secondary, #a3a3a3);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  cursor: pointer;
}

.jump-today-btn:hover {
  border-color: var(--phase-color, #a78bfa);
  color: #f5f5f5;
}
</style>
