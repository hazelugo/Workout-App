import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'
import { profileQueryOptions, invalidateProfile } from '@/queries/profile'
import { queryKeys } from '@/queries/keys'

export const useAuthStore = defineStore('auth', () => {
  const session = ref(null)
  const user = ref(null)
  const profile = ref(null)
  const isReady = ref(false)
  let _subscription = null

  const isAuthenticated = computed(() => !!session.value)

  const userInitials = computed(() => {
    if (!profile.value?.display_name) return '?'
    const parts = profile.value.display_name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  })

  async function _loadProfile(userId) {
    profile.value = await queryClient.fetchQuery(profileQueryOptions(userId))
  }

  function _clearUserQueries() {
    queryClient.removeQueries({ queryKey: queryKeys.history.all })
    queryClient.removeQueries({ queryKey: queryKeys.customDays.all })
    queryClient.removeQueries({ queryKey: queryKeys.programs.all })
    queryClient.removeQueries({ queryKey: queryKeys.profile.all })
  }

  async function init() {
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    user.value = data.session?.user ?? null
    if (user.value) await _loadProfile(user.value.id)
    // Signal that auth is fully resolved — components can now safely render
    isReady.value = true

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      session.value = newSession
      user.value = newSession?.user ?? null
      if (user.value) {
        await _loadProfile(user.value.id)
      } else {
        profile.value = null
        _clearUserQueries()
      }
    })
    _subscription = listener.subscription
  }

  function cleanup() {
    _subscription?.unsubscribe()
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email, password, displayName) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })
    if (error) throw error
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function resetPasswordForEmail(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }

  async function adoptProgram() {
    if (!user.value) return
    await supabase.from('profiles').update({ program_adopted: true }).eq('id', user.value.id)
    if (profile.value) profile.value = { ...profile.value, program_adopted: true }
    await invalidateProfile(queryClient, user.value.id)
  }

  return {
    session,
    user,
    profile,
    isReady,
    isAuthenticated,
    userInitials,
    init,
    cleanup,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPasswordForEmail,
    adoptProgram,
  }
})
