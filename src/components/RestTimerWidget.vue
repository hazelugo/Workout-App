<template>
  <div
    class="rest-timer-widget"
    :class="{
      embedded,
      expanded: embedded || expanded,
      running: restTimerRunning,
      done: restTimerSeconds === 0 && !restTimerRunning,
    }"
  >
    <button
      v-if="!embedded"
      type="button"
      class="rest-timer-fab"
      :aria-expanded="expanded"
      aria-label="Rest timer"
      @click="toggleExpanded"
    >
      <span class="rest-timer-fab-label">Rest</span>
      <span class="rest-timer-fab-time">{{ restTimerFormatted }}</span>
    </button>

    <Transition name="rest-panel">
      <div v-if="embedded || expanded" class="rest-timer-panel">
        <div class="rest-timer-panel-header">
          <span>Rest between sets</span>
          <button
            v-if="!embedded"
            type="button"
            class="rest-timer-close"
            aria-label="Close rest timer"
            @click="expanded = false"
          >
            ×
          </button>
        </div>

        <div class="rest-timer-main" :class="{ 'rest-timer-main--embedded': embedded }">
          <div class="rest-timer-digits" :class="{ isZero: restTimerSeconds === 0 }">
            {{ restTimerFormatted }}
          </div>
          <div class="rest-timer-presets">
            <button type="button" class="rest-preset-btn" @click="startRestTimer(60)">60s</button>
            <button type="button" class="rest-preset-btn" @click="startRestTimer(90)">90s</button>
            <button type="button" class="rest-preset-btn" @click="startRestTimer(120)">2m</button>
            <button type="button" class="rest-preset-btn" @click="addRestTime(30)">+30s</button>
          </div>
        </div>

        <div class="rest-timer-panel-actions">
          <button
            v-if="!restTimerRunning"
            type="button"
            class="rest-action-btn rest-action-start"
            @click="startRestTimer()"
          >
            Start
          </button>
          <button v-else type="button" class="rest-action-btn" @click="pauseRestTimer()">Pause</button>
          <button type="button" class="rest-action-btn" @click="resetRestTimer(90)">Reset</button>
          <button
            type="button"
            class="rest-auto-btn"
            :class="{ isOn: restTimerAutoStart }"
            :aria-pressed="restTimerAutoStart"
            @click="toggleRestTimerAutoStart"
          >
            Auto {{ restTimerAutoStart ? 'on' : 'off' }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'

defineProps({
  embedded: { type: Boolean, default: false },
})

const _restTimerAutoKey = 'rest-timer-auto-v1'
const restTimerAutoStart = ref(localStorage.getItem(_restTimerAutoKey) !== '0')
const restTimerSeconds = ref(90)
const restTimerRunning = ref(false)
const expanded = ref(false)
let restTimerTargetEnd = null
let _timerInterval = null

const restTimerFormatted = computed(() => {
  const mins = Math.floor(restTimerSeconds.value / 60)
  const secs = restTimerSeconds.value % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
})

function toggleRestTimerAutoStart() {
  restTimerAutoStart.value = !restTimerAutoStart.value
  localStorage.setItem(_restTimerAutoKey, restTimerAutoStart.value ? '1' : '0')
}

function updateRestTimerFromClock() {
  if (!restTimerRunning.value || !restTimerTargetEnd) return
  const remainingMs = restTimerTargetEnd - Date.now()
  if (remainingMs <= 0) {
    restTimerSeconds.value = 0
    pauseRestTimer()
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([200, 100, 200])
      } catch {}
    }
    return
  }
  restTimerSeconds.value = Math.ceil(remainingMs / 1000)
}

function startRestTimer(seconds) {
  if (typeof seconds === 'number') {
    restTimerSeconds.value = seconds
  } else if (restTimerSeconds.value <= 0) {
    restTimerSeconds.value = 90
  }
  restTimerTargetEnd = Date.now() + restTimerSeconds.value * 1000
  restTimerRunning.value = true
  expanded.value = true
  clearInterval(_timerInterval)
  _timerInterval = setInterval(updateRestTimerFromClock, 250)
}

function pauseRestTimer() {
  if (restTimerRunning.value && restTimerTargetEnd) {
    const remainingMs = restTimerTargetEnd - Date.now()
    restTimerSeconds.value = Math.max(0, Math.ceil(remainingMs / 1000))
  }
  restTimerRunning.value = false
  restTimerTargetEnd = null
  clearInterval(_timerInterval)
}

function addRestTime(secs) {
  if (restTimerRunning.value && restTimerTargetEnd) {
    restTimerTargetEnd += secs * 1000
    updateRestTimerFromClock()
  } else {
    restTimerSeconds.value += secs
  }
}

function resetRestTimer(secs = 90) {
  pauseRestTimer()
  restTimerSeconds.value = secs
}

function toggleExpanded() {
  expanded.value = !expanded.value
}

function autoStart(seconds = 90) {
  if (!restTimerAutoStart.value) return
  startRestTimer(seconds)
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible' && restTimerRunning.value) {
    updateRestTimerFromClock()
  }
}

onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('focus', handleVisibilityChange)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('focus', handleVisibilityChange)
  clearInterval(_timerInterval)
})

defineExpose({ autoStart, startRestTimer })
</script>

<style scoped>
.rest-timer-widget {
  position: fixed;
  right: 16px;
  bottom: 72px;
  z-index: 45;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.rest-timer-widget.embedded {
  position: static;
  width: 100%;
  align-items: stretch;
  z-index: auto;
}

.rest-timer-widget.embedded .rest-timer-panel {
  width: 100%;
  box-shadow: none;
}

.rest-timer-main--embedded {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  text-align: left;
  margin-bottom: 10px;
}

.rest-timer-main--embedded .rest-timer-digits {
  margin-bottom: 0;
  font-size: 1.5rem;
  min-width: 4.5rem;
}

.rest-timer-main--embedded .rest-timer-presets {
  flex: 1;
  justify-content: flex-end;
}

.rest-timer-fab {
  min-width: 88px;
  min-height: 52px;
  padding: 10px 14px;
  border-radius: 9999px;
  border: 1px solid oklch(24% 0.008 45);
  background: oklch(12% 0.01 45);
  color: #f5f5f5;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.rest-timer-widget.running .rest-timer-fab {
  border-color: #22c55e66;
  background: #16653433;
}

.rest-timer-widget.done .rest-timer-fab {
  border-color: #f8717166;
  background: #7f1d1d33;
}

.rest-timer-fab-label {
  font-size: 9px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  font-weight: 700;
}

.rest-timer-fab-time {
  font-size: 1rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #4ade80;
}

.rest-timer-widget.done .rest-timer-fab-time {
  color: #f87171;
}

.rest-timer-panel {
  width: min(280px, calc(100vw - 32px));
  padding: 14px;
  border-radius: 14px;
  border: 1px solid oklch(22% 0.008 45);
  background: oklch(10% 0.01 45);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
}

.rest-timer-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  font-weight: 700;
}

.rest-timer-close {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #a3a3a3;
  font-size: 1.25rem;
  cursor: pointer;
}

.rest-timer-main {
  text-align: center;
  margin-bottom: 12px;
}

.rest-timer-digits {
  font-size: 2rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #4ade80;
  margin-bottom: 10px;
}

.rest-timer-digits.isZero {
  color: #f87171;
}

.rest-timer-presets,
.rest-timer-panel-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
}

.rest-preset-btn,
.rest-action-btn,
.rest-auto-btn {
  min-height: 40px;
  padding: 8px 12px;
  border-radius: 9999px;
  border: 1px solid oklch(22% 0.008 45);
  background: oklch(14% 0.008 45);
  color: #e5e5e5;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  cursor: pointer;
}

.rest-action-start {
  background: #166534;
  border-color: #22c55e;
  color: #ffffff;
}

.rest-auto-btn.isOn {
  border-color: #a78bfa;
  color: #c4b5fd;
  background: #a78bfa22;
}

.rest-panel-enter-active,
.rest-panel-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
}

.rest-panel-enter-from,
.rest-panel-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
