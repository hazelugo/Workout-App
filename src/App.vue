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
    <!-- Nav -->
    <nav style="display: flex; align-items: stretch; border-bottom: 1px solid oklch(15% 0.008 45); position: relative">
      <RouterLink to="/" class="nav-link">Program</RouterLink>
      <RouterLink to="/custom" class="nav-link">Custom</RouterLink>
      <RouterLink v-if="auth.isAuthenticated" to="/history" class="nav-link">History</RouterLink>

      <!-- Sign in link (unauthenticated) -->
      <RouterLink v-if="!auth.isAuthenticated" to="/login" class="nav-link" style="margin-left: auto">Sign In</RouterLink>

      <!-- User indicator (authenticated) -->
      <div v-if="auth.isAuthenticated" style="margin-left: auto; display: flex; align-items: center; padding-right: 12px; position: relative">
        <button
          @click="dropdownOpen = !dropdownOpen"
          :aria-expanded="dropdownOpen"
          aria-label="User menu"
          :style="{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: '#a78bfa22',
            border: '1px solid #a78bfa66',
            color: '#a78bfa',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            cursor: 'pointer',
            fontFamily: 'Georgia, serif',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }"
        >{{ auth.userInitials }}</button>

        <!-- Dropdown -->
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
            <div style="padding: 10px 14px; font-size: 12px; color: #888; border-bottom: 1px solid oklch(18% 0.008 45)">
              {{ auth.profile?.display_name }}
            </div>
            <!-- Export CSV button added by Plan 3 Task 5 -->
            <button
              @click="handleSignOut"
              style="
                width: 100%;
                padding: 10px 14px;
                background: transparent;
                border: none;
                color: #e8e8e8;
                font-size: 11px;
                letter-spacing: 1.5px;
                text-transform: uppercase;
                text-align: left;
                cursor: pointer;
                font-family: Georgia, serif;
              "
            >Sign Out</button>
          </div>
        </Transition>
      </div>
    </nav>

    <Transition name="page" mode="out-in">
      <RouterView />
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'

const auth = useAuthStore()
const router = useRouter()
const dropdownOpen = ref(false)

async function handleSignOut() {
  dropdownOpen.value = false
  await auth.signOut()
  router.push('/login')
}
</script>

<style>
button, input, select, textarea {
  font-family: Georgia, serif;
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>

<style scoped>
.nav-link {
  flex-shrink: 0;
  padding: 12px 8px;
  min-width: 72px;
  background: transparent;
  border-bottom: 2px solid transparent;
  color: #777;
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  text-align: center;
  text-decoration: none;
  display: block;
  font-family: Georgia, serif;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
}
.nav-link:focus-visible {
  outline: 2px solid #e8e8e8;
  outline-offset: -2px;
}
.nav-link.router-link-exact-active {
  background: oklch(11.5% 0.008 45);
  border-bottom-color: #e8e8e8;
  color: #e8e8e8;
}
.page-enter-active { transition: opacity 120ms ease-out; }
.page-leave-active { transition: opacity 80ms ease-in; }
.page-enter-from, .page-leave-to { opacity: 0; }
.reveal-enter-active { transition: opacity 120ms ease-out, transform 120ms ease-out; }
.reveal-leave-active { transition: opacity 80ms ease-in; }
.reveal-enter-from { opacity: 0; transform: translateY(-4px); }
.reveal-leave-to { opacity: 0; }
</style>
