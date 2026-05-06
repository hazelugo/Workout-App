<template>
  <div :style="{ maxWidth: '400px', margin: '60px auto', padding: '0 20px' }">
    <div style="text-align: center; margin-bottom: 32px">
      <h1 style="font-size: 1.5rem; font-weight: 400; color: oklch(96% 0.005 45); margin: 0">
        Set New Password
      </h1>
    </div>

    <div v-if="!ready" style="text-align: center; color: #888; font-size: 13px">
      Verifying reset link...
    </div>

    <form v-else @submit.prevent="handleSubmit" style="display: flex; flex-direction: column; gap: 16px">
      <div style="display: flex; flex-direction: column; gap: 6px">
        <label style="font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #888">New Password</label>
        <input
          v-model="password"
          type="password"
          placeholder="••••••••"
          required
          minlength="8"
          :style="inputStyle"
        />
        <span v-if="error" style="font-size: 11px; color: #f87171">{{ error }}</span>
      </div>

      <span v-if="success" style="font-size: 12px; color: #4ade80; text-align: center">
        Password updated. <RouterLink to="/login" style="color: #a78bfa">Sign in</RouterLink>
      </span>

      <button
        v-if="!success"
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
          fontFamily: 'Georgia, serif',
        }"
      >{{ loading ? '...' : 'Update Password' }}</button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'

const ready = ref(false)
const password = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)

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

onMounted(() => {
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      ready.value = true
    }
  })
})

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    const { error: err } = await supabase.auth.updateUser({ password: password.value })
    if (err) throw err
    success.value = true
  } catch (err) {
    error.value = err.message || 'Failed to update password'
  } finally {
    loading.value = false
  }
}
</script>
