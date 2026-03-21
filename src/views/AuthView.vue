<template>
  <div :style="{ maxWidth: '400px', margin: '60px auto', padding: '0 20px' }">
    <div style="text-align: center; margin-bottom: 32px">
      <div style="font-size: 11px; letter-spacing: 4px; color: #888; text-transform: uppercase; margin-bottom: 8px">
        Workout App
      </div>
      <h1 style="font-size: 1.5rem; font-weight: 400; color: oklch(96% 0.005 45); margin: 0; letter-spacing: -0.5px">
        {{ isSignUp ? 'Create Account' : 'Sign In' }}
      </h1>
    </div>

    <form @submit.prevent="handleSubmit" style="display: flex; flex-direction: column; gap: 16px">

      <!-- Display name (sign up only) -->
      <div v-if="isSignUp" style="display: flex; flex-direction: column; gap: 6px">
        <label style="font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #888">Name</label>
        <input
          v-model="displayName"
          type="text"
          placeholder="Your name"
          required
          :style="inputStyle"
        />
        <span v-if="errors.displayName" style="font-size: 11px; color: #f87171">{{ errors.displayName }}</span>
      </div>

      <!-- Email -->
      <div style="display: flex; flex-direction: column; gap: 6px">
        <label style="font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #888">Email</label>
        <input
          v-model="email"
          type="email"
          placeholder="you@example.com"
          required
          :style="inputStyle"
        />
        <span v-if="errors.email" style="font-size: 11px; color: #f87171">{{ errors.email }}</span>
      </div>

      <!-- Password -->
      <div style="display: flex; flex-direction: column; gap: 6px">
        <label style="font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #888">Password</label>
        <input
          v-model="password"
          type="password"
          placeholder="••••••••"
          required
          :style="inputStyle"
        />
        <span v-if="errors.password" style="font-size: 11px; color: #f87171">{{ errors.password }}</span>
        <button
          v-if="!isSignUp"
          type="button"
          @click="handleForgotPassword"
          style="background: none; border: none; color: #888; font-size: 11px; cursor: pointer; text-align: left; padding: 0; font-family: Georgia, serif; text-decoration: underline"
        >Forgot password?</button>
      </div>

      <!-- General error -->
      <span v-if="errors.general" style="font-size: 12px; color: #f87171; text-align: center">{{ errors.general }}</span>
      <!-- Success message (e.g. reset email sent) -->
      <span v-if="successMsg" style="font-size: 12px; color: #4ade80; text-align: center">{{ successMsg }}</span>

      <!-- Submit -->
      <button
        type="submit"
        :disabled="loading"
        :style="{
          padding: '12px',
          background: loading ? 'oklch(20% 0.008 45)' : '#a78bfa',
          border: 'none',
          color: loading ? '#666' : '#fff',
          fontSize: '11px',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          cursor: loading ? 'not-allowed' : 'pointer',
          borderRadius: '4px',
          transition: 'background 0.15s',
          fontFamily: 'Georgia, serif',
        }"
      >{{ loading ? '...' : (isSignUp ? 'Create Account' : 'Sign In') }}</button>

      <!-- Divider -->
      <div style="display: flex; align-items: center; gap: 12px">
        <div style="flex: 1; height: 1px; background: oklch(18% 0.008 45)"></div>
        <span style="font-size: 11px; color: #555">or</span>
        <div style="flex: 1; height: 1px; background: oklch(18% 0.008 45)"></div>
      </div>

      <!-- Google OAuth -->
      <button
        type="button"
        @click="handleGoogle"
        :disabled="loading"
        :style="{
          padding: '12px',
          background: 'transparent',
          border: '1px solid oklch(22% 0.008 45)',
          color: '#e8e8e8',
          fontSize: '11px',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          cursor: 'pointer',
          borderRadius: '4px',
          fontFamily: 'Georgia, serif',
          transition: 'border-color 0.15s',
        }"
      >Continue with Google</button>

    </form>

    <!-- Toggle sign in / sign up -->
    <p style="text-align: center; margin-top: 24px; font-size: 12px; color: #888">
      {{ isSignUp ? 'Already have an account?' : "Don't have an account?" }}
      <button
        @click="toggleMode"
        style="background: none; border: none; color: #a78bfa; cursor: pointer; font-size: 12px; font-family: Georgia, serif; text-decoration: underline; padding: 0"
      >{{ isSignUp ? 'Sign in' : 'Sign up' }}</button>
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

const inputStyle = {
  padding: '10px 12px',
  background: 'oklch(11.5% 0.008 45)',
  border: '1px solid oklch(20% 0.008 45)',
  borderRadius: '4px',
  color: '#e8e8e8',
  fontSize: '14px',
  fontFamily: 'Georgia, serif',
  outline: 'none',
}

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
