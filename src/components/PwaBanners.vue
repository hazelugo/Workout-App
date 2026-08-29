<template>
  <Teleport to="body">
    <Transition name="pwa-banner">
      <div
        v-if="pwa.showInstallBanner"
        class="pwa-banner pwa-banner-install"
        role="region"
        aria-label="Install app"
      >
        <div class="pwa-banner-copy">
          <strong class="pwa-banner-title">Install Workout App</strong>
          <p v-if="pwa.isIos && !pwa.deferredPrompt" class="pwa-banner-text">
            Tap <span class="pwa-inline-icon">Share</span>, then
            <strong>Add to Home Screen</strong> for quick gym access.
          </p>
          <p v-else class="pwa-banner-text">
            Add to your home screen for faster access between sets.
          </p>
        </div>
        <div class="pwa-banner-actions">
          <button
            v-if="pwa.deferredPrompt"
            type="button"
            class="pwa-btn pwa-btn-primary"
            @click="pwa.promptInstall()"
          >
            Install
          </button>
          <button type="button" class="pwa-btn pwa-btn-ghost" @click="pwa.dismissInstall()">
            Not now
          </button>
        </div>
      </div>
    </Transition>

    <Transition name="pwa-banner">
      <div
        v-if="pwa.showUpdateBanner"
        class="pwa-banner pwa-banner-update"
        role="region"
        aria-label="App update available"
      >
        <div class="pwa-banner-copy">
          <strong class="pwa-banner-title">Update available</strong>
          <p class="pwa-banner-text">A new version is ready. Refresh when you're between sets.</p>
        </div>
        <div class="pwa-banner-actions">
          <button type="button" class="pwa-btn pwa-btn-primary" @click="pwa.applyUpdate()">
            Refresh
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { usePwaStore } from '@/stores/pwa'

const pwa = usePwaStore()
let teardown = null

onMounted(() => {
  teardown = pwa.init()
})

onUnmounted(() => {
  teardown?.()
})
</script>

<style scoped>
.pwa-banner {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: 72px;
  z-index: 200;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid oklch(24% 0.008 45);
  background: oklch(12% 0.01 45);
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.45);
}

@media (min-width: 640px) {
  .pwa-banner {
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    width: min(480px, calc(100% - 24px));
  }
}

.pwa-banner-install {
  border-color: #4285f466;
}

.pwa-banner-update {
  border-color: #a78bfa66;
}

.pwa-banner-copy {
  flex: 1;
  min-width: 0;
}

.pwa-banner-title {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #f5f5f5;
  margin-bottom: 4px;
}

.pwa-banner-text {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.5;
  color: #a3a3a3;
}

.pwa-inline-icon {
  color: #60a5fa;
  font-weight: 600;
}

.pwa-banner-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}

.pwa-btn {
  min-height: 40px;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  cursor: pointer;
  border: 1px solid transparent;
  white-space: nowrap;
}

.pwa-btn-primary {
  background: #a78bfa;
  border-color: #a78bfa;
  color: #111;
}

.pwa-btn-primary:hover {
  background: #c4b5fd;
}

.pwa-btn-ghost {
  background: transparent;
  border-color: oklch(24% 0.008 45);
  color: #a3a3a3;
}

.pwa-btn-ghost:hover {
  color: #f5f5f5;
}

.pwa-banner-enter-active,
.pwa-banner-leave-active {
  transition:
    opacity 180ms ease-out,
    transform 180ms ease-out;
}

.pwa-banner-enter-from,
.pwa-banner-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
