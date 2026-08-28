<template>
  <div style="max-width: 400px; margin: 60px auto; padding: 0 20px">
    <div style="text-align: center; margin-bottom: 32px">
      <div
        style="
          font-size: 12px;
          letter-spacing: 4px;
          color: var(--color-primary, #a78bfa);
          text-transform: uppercase;
          margin-bottom: 8px;
          font-weight: 700;
        "
      >
        Workout App
      </div>
      <h1
        style="
          font-size: 1.5rem;
          font-weight: 400;
          color: oklch(96% 0.005 45);
          margin: 0;
          letter-spacing: -0.5px;
        "
      >
        {{ isSignUp ? 'Create Account' : 'Sign In' }}
      </h1>
    </div>

    <form @submit.prevent="handleSubmit" style="display: flex; flex-direction: column; gap: 16px">
      <div v-if="isSignUp" style="display: flex; flex-direction: column; gap: 6px">
        <label
          for="auth-display-name"
          style="font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #a3a3a3; font-weight: 600"
        >
          Name
        </label>
        <input
          id="auth-display-name"
          v-model="displayName"
          type="text"
          placeholder="Your name"
          required
          class="auth-input"
        />
        <span v-if="errors.displayName" style="font-size: 11px; color: #f87171">{{
          errors.displayName
        }}</span>
      </div>

      <div style="display: flex; flex-direction: column; gap: 6px">
        <label
          for="auth-email"
          style="font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #a3a3a3; font-weight: 600"
        >
          Email
        </label>
        <input
          id="auth-email"
          v-model="email"
          type="email"
          placeholder="you@example.com"
          required
          class="auth-input"
        />
        <span v-if="errors.email" style="font-size: 11px; color: #f87171">{{ errors.email }}</span>
      </div>

      <div style="display: flex; flex-direction: column; gap: 6px">
        <label
          for="auth-password"
          style="font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #a3a3a3; font-weight: 600"
        >
          Password
        </label>
        <input
          id="auth-password"
          v-model="password"
          type="password"
          placeholder="••••••••"
          required
          class="auth-input"
        />
        <span v-if="errors.password" style="font-size: 11px; color: #f87171">{{
          errors.password
        }}</span>
        <button
          v-if="!isSignUp"
          type="button"
          @click="handleForgotPassword"
          class="auth-link-btn"
          style="
            background: none;
            border: none;
            color: #a3a3a3;
            font-size: 11px;
            cursor: pointer;
            text-align: left;
            padding: 4px 0;
            font-family: Georgia, serif;
            text-decoration: underline;
          "
        >
          Forgot password?
        </button>
      </div>

      <span v-if="errors.general" style="font-size: 12px; color: #f87171; text-align: center">{{
        errors.general
      }}</span>
      <!-- Success message (e.g. reset email sent) -->
      <span v-if="successMsg" style="font-size: 12px; color: #4ade80; text-align: center">{{
        successMsg
      }}</span>

      <button
        type="submit"
        :disabled="loading"
        class="auth-submit-btn"
      >
        {{ loading ? '...' : isSignUp ? 'Create Account' : 'Sign In' }}
      </button>

      <!-- Divider -->
      <div style="display: flex; align-items: center; gap: 12px">
        <div style="flex: 1; height: 1px; background: oklch(18% 0.008 45)"></div>
        <span style="font-size: 11px; color: #a3a3a3">or</span>
        <div style="flex: 1; height: 1px; background: oklch(18% 0.008 45)"></div>
      </div>

      <button
        type="button"
        @click="handleGoogle"
        :disabled="loading"
        class="auth-google-btn"
      >
        Continue with Google
      </button>
    </form>

    <p style="text-align: center; margin-top: 24px; font-size: 12px; color: #a3a3a3">
      {{ isSignUp ? 'Already have an account?' : "Don't have an account?" }}
      <button
        @click="toggleMode"
        class="auth-link-btn"
        style="
          background: none;
          border: none;
          color: #a78bfa;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          font-family: Georgia, serif;
          text-decoration: underline;
          padding: 2px 4px;
        "
      >
        {{ isSignUp ? 'Sign in' : 'Sign up' }}
      </button>
    </p>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const isSignUp = ref(false)
const email = ref('')
const password = ref('')
const displayName = ref('')
const loading = ref(false)
const errors = reactive({ email: '', password: '', displayName: '', general: '' })
const successMsg = ref('')

function clearErrors() {
  errors.email = ''
  errors.password = ''
  errors.displayName = ''
  errors.general = ''
  successMsg.value = ''
}

function toggleMode() {
  isSignUp.value = !isSignUp.value
  clearErrors()
}

async function handleSubmit() {
  clearErrors()
  loading.value = true
  try {
    if (isSignUp.value) {
      await auth.signUp(email.value, password.value, displayName.value)
    } else {
      await auth.signIn(email.value, password.value)
    }
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (err) {
    const msg = err.message || 'Something went wrong'
    if (msg.toLowerCase().includes('email')) errors.email = msg
    else if (msg.toLowerCase().includes('password')) errors.password = msg
    else errors.general = msg
  } finally {
    loading.value = false
  }
}

async function handleGoogle() {
  clearErrors()
  loading.value = true
  try {
    await auth.signInWithGoogle()
    // Supabase handles redirect — no push needed
  } catch (err) {
    errors.general = err.message || 'Google sign-in failed'
    loading.value = false
  }
}

async function handleForgotPassword() {
  clearErrors()
  if (!email.value) {
    errors.email = 'Enter your email address first'
    return
  }
  loading.value = true
  try {
    await auth.resetPasswordForEmail(email.value)
    successMsg.value = 'Password reset email sent. Check your inbox.'
  } catch (err) {
    errors.general = err.message || 'Failed to send reset email'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-input {
  padding: 10px 12px;
  min-height: 44px;
  background: oklch(11.5% 0.008 45);
  border: 1px solid oklch(20% 0.008 45);
  border-radius: 4px;
  color: #f5f5f5;
  font-size: 14px;
  font-family: Georgia, serif;
  outline: none;
  transition: border-color 0.15s, outline 0.15s;
}

.auth-input:focus-visible {
  border-color: #a78bfa;
  outline: 2px solid #a78bfa;
}

.auth-submit-btn {
  padding: 12px;
  min-height: 44px;
  background: #a78bfa;
  border: none;
  color: #121118;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s, opacity 0.15s;
  font-family: Georgia, serif;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-submit-btn:hover:not(:disabled) {
  background: #c4b5fd;
}

.auth-submit-btn:disabled {
  background: oklch(20% 0.008 45);
  color: #737373;
  cursor: not-allowed;
}

.auth-submit-btn:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
}

.auth-google-btn {
  padding: 12px;
  min-height: 44px;
  background: transparent;
  border: 1px solid oklch(22% 0.008 45);
  color: #f5f5f5;
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 4px;
  font-family: Georgia, serif;
  transition: border-color 0.15s, background 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-google-btn:hover:not(:disabled) {
  border-color: #a78bfa;
  background: #a78bfa11;
}

.auth-google-btn:focus-visible {
  outline: 2px solid #a78bfa;
  outline-offset: 2px;
}

.auth-link-btn:focus-visible {
  outline: 2px solid #a78bfa;
  outline-offset: 2px;
  border-radius: 2px;
}
</style>
