<template>
  <div style="max-width: 400px; margin: 60px auto; padding: 0 20px">
    <div style="text-align: center; margin-bottom: 32px">
      <h1 style="font-size: 1.5rem; font-weight: 400; color: oklch(96% 0.005 45); margin: 0">
        Set New Password
      </h1>
    </div>

    <div v-if="!ready" style="text-align: center; color: #a3a3a3; font-size: 13px">
      Verifying reset link...
    </div>

    <form v-else @submit.prevent="handleSubmit" style="display: flex; flex-direction: column; gap: 16px">
      <div style="display: flex; flex-direction: column; gap: 6px">
        <label
          for="reset-password"
          style="font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #a3a3a3; font-weight: 600"
        >
          New Password
        </label>
        <input
          id="reset-password"
          v-model="password"
          type="password"
          placeholder="••••••••"
          required
          minlength="8"
          class="reset-input"
        />
        <span v-if="error" style="font-size: 11px; color: #f87171">{{ error }}</span>
      </div>

      <div v-if="success" role="status" aria-live="polite" class="reset-success-banner">
        Password updated. <RouterLink to="/login" class="reset-link">Sign in</RouterLink>
      </div>

      <button
        v-if="!success"
        type="submit"
        :disabled="loading"
        class="reset-submit-btn"
      >
        {{ loading ? '...' : 'Update Password' }}
      </button>
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

<style scoped>
.reset-input {
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

.reset-input:focus-visible {
  border-color: #a78bfa;
  outline: 2px solid #a78bfa;
}

.reset-submit-btn {
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

.reset-submit-btn:hover:not(:disabled) {
  background: #c4b5fd;
}

.reset-submit-btn:disabled {
  background: oklch(20% 0.008 45);
  color: #737373;
  cursor: not-allowed;
}

.reset-submit-btn:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
}

.reset-link {
  color: #a78bfa;
  font-weight: 600;
  text-decoration: underline;
  padding: 2px 4px;
}

.reset-link:focus-visible {
  outline: 2px solid #a78bfa;
  outline-offset: 2px;
  border-radius: 2px;
}

.reset-success-banner {
  padding: 12px 14px;
  border-radius: 6px;
  border: 1px solid #4ade8066;
  background: #4ade8018;
  color: #4ade80;
  font-size: 13px;
  line-height: 1.5;
  text-align: center;
}
</style>
