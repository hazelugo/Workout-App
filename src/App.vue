<template>
  <div
    style="
      min-height: 100vh;
      background: oklch(8% 0.012 45);
      color: #e8e8e8;
      font-family: Georgia, serif;
      padding-bottom: 60px;
    "
  >
    <nav
      style="
        display: flex;
        align-items: stretch;
        border-bottom: 1px solid oklch(15% 0.008 45);
        position: relative;
      "
    >
      <RouterLink to="/" class="nav-link">Program</RouterLink>
      <RouterLink to="/custom" class="nav-link">Custom</RouterLink>
      <RouterLink v-if="auth.isAuthenticated" to="/history" class="nav-link">History</RouterLink>
      <div
        v-if="connectivity.isOnline === false || connectivity.pendingCount > 0"
        style="
          position: absolute;
          left: 50%;
          bottom: 6px;
          transform: translateX(-50%);
          font-size: 9px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #888;
          pointer-events: none;
          white-space: nowrap;
        "
      >
        <span v-if="!connectivity.isOnline" style="color: #facc15">● Offline</span>
        <span v-else-if="connectivity.syncing" style="color: #4ade80">↻ Syncing…</span>
        <span v-else style="color: #4ade80">{{ connectivity.pendingCount }} queued</span>
      </div>
      <RouterLink
        v-if="!auth.isAuthenticated"
        to="/login"
        class="nav-link"
        style="margin-left: auto"
        >Sign In</RouterLink
      >
      <div
        v-if="auth.isAuthenticated"
        style="
          margin-left: auto;
          display: flex;
          align-items: center;
          padding-right: 8px;
          position: relative;
        "
      >
        <button
          @click="dropdownOpen = !dropdownOpen"
          :aria-expanded="dropdownOpen"
          aria-label="User menu"
          class="profile-avatar-btn"
        >
          <span class="profile-avatar-inner">
            {{ auth.userInitials }}
          </span>
        </button>

        <Transition name="reveal">
          <div
            v-if="dropdownOpen"
            style="
              position: absolute;
              top: calc(100% + 6px);
              right: 0;
              background: oklch(13% 0.008 45);
              border: 1px solid oklch(20% 0.008 45);
              border-radius: 4px;
              min-width: 160px;
              z-index: 100;
              overflow: hidden;
            "
          >
            <div
              style="
                padding: 10px 14px;
                font-size: 12px;
                color: var(--color-text-secondary, #a3a3a3);
                border-bottom: 1px solid oklch(18% 0.008 45);
              "
            >
              {{ auth.profile?.display_name }}
            </div>
            <button
              @click="handleSignOut"
              class="sign-out-btn"
            >
              Sign Out
            </button>
          </div>
        </Transition>
      </div>
    </nav>

    <Transition name="page" mode="out-in">
      <RouterView />
    </Transition>

    <PwaBanners />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useConnectivityStore } from './stores/connectivity'
import PwaBanners from './components/PwaBanners.vue'

const auth = useAuthStore()
const connectivity = useConnectivityStore()
const router = useRouter()
const dropdownOpen = ref(false)

onMounted(() => {
  connectivity.init(() => auth.user?.id ?? null)
})

onUnmounted(() => {
  connectivity.cleanup()
})

watch(
  () => auth.user?.id,
  (id) => connectivity.setUserId(id),
)

watch(
  () => auth.isAuthenticated,
  (isAuth) => {
    if (!isAuth) router.push('/login')
  },
)

async function handleSignOut() {
  dropdownOpen.value = false
  await auth.signOut()
}
</script>

<style>
/* Modern, accessible, high-legibility typography & design token system */
:root {
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --font-serif: Georgia, 'Times New Roman', serif;

  /* Standard semantic design tokens */
  --color-text-primary: #f5f5f5;
  --color-text-secondary: #a3a3a3;
  --color-text-muted: #737373;
  --color-primary: #a78bfa;
  --color-accent: #22c55e;
  --color-bg: oklch(8% 0.012 45);
  --color-surface: oklch(10% 0.01 45);
  --color-surface-elevated: oklch(13% 0.008 45);
  --color-border: oklch(18% 0.008 45);
}

*, *::before, *::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: oklch(8% 0.012 45);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

button,
input,
select,
textarea {
  font-family: var(--font-sans);
}

/* Tabular numbers for all weights, sets, reps, and metrics */
table,
.tabular-nums,
input[type="number"] {
  font-variant-numeric: tabular-nums;
}

/* Custom scrollbars */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: oklch(24% 0.008 45);
  border-radius: 9999px;
}
::-webkit-scrollbar-thumb:hover {
  background: oklch(32% 0.008 45);
}

/* Text selection accent */
::selection {
  background: #a78bfa44;
  color: #ffffff;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>

<style scoped>
.nav-link {
  flex-shrink: 0;
  padding: 14px 18px;
  min-width: 76px;
  min-height: 48px;
  background: transparent;
  border-bottom: 2px solid transparent;
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  text-align: center;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-sans);
  transition:
    color 0.15s,
    background 0.15s,
    border-color 0.15s;
}
.nav-link:hover {
  color: var(--color-text-primary);
}
.nav-link:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}
.nav-link.router-link-exact-active {
  background: oklch(11.5% 0.008 45);
  border-bottom-color: var(--color-primary);
  color: var(--color-text-primary);
}

/* Profile Avatar Button with >=44x44px touch area & focus-visible ring */
.profile-avatar-btn {
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
.profile-avatar-inner {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #a78bfa22;
  border: 1px solid #a78bfa66;
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  font-family: var(--font-serif);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, border-color 0.15s;
}
.profile-avatar-btn:hover .profile-avatar-inner {
  background: #a78bfa33;
  border-color: var(--color-primary);
}
.profile-avatar-btn:focus-visible {
  outline: none;
}
.profile-avatar-btn:focus-visible .profile-avatar-inner {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Sign-out button */
.sign-out-btn {
  width: 100%;
  padding: 12px 14px;
  min-height: 44px;
  background: transparent;
  border: none;
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  text-align: left;
  cursor: pointer;
  font-family: var(--font-sans);
  display: flex;
  align-items: center;
  transition: background 0.15s, color 0.15s;
}
.sign-out-btn:hover {
  background: oklch(18% 0.008 45);
  color: #c4b5fd;
}
.sign-out-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}
.page-enter-active {
  transition: opacity 120ms ease-out;
}
.page-leave-active {
  transition: opacity 80ms ease-in;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
}
.reveal-enter-active {
  transition:
    opacity 120ms ease-out,
    transform 120ms ease-out;
}
.reveal-leave-active {
  transition: opacity 80ms ease-in;
}
.reveal-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}
.reveal-leave-to {
  opacity: 0;
}
</style>
