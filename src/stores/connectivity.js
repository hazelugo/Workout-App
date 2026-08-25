import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'
import { invalidateWorkoutHistory } from '@/queries/history'
import { getPendingCount, syncPendingWorkouts } from '@/lib/offlineQueue'

export const useConnectivityStore = defineStore('connectivity', () => {
  const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const pendingCount = ref(0)
  const syncing = ref(false)

  let userId = null
  let flushPromise = null
  let teardown = null

  async function refreshPendingCount() {
    if (!userId) {
      pendingCount.value = 0
      return
    }
    pendingCount.value = await getPendingCount(userId)
  }

  async function flushQueue() {
    if (!userId || !isOnline.value || syncing.value || pendingCount.value === 0) return

    syncing.value = true
    try {
      const { synced } = await syncPendingWorkouts(supabase, userId)
      await refreshPendingCount()
      if (synced > 0) {
        await invalidateWorkoutHistory(queryClient)
      }
    } finally {
      syncing.value = false
    }
  }

  function scheduleFlush() {
    if (!flushPromise) {
      flushPromise = flushQueue().finally(() => {
        flushPromise = null
      })
    }
    return flushPromise
  }

  function setUserId(id) {
    userId = id ?? null
    refreshPendingCount()
    if (userId && isOnline.value) scheduleFlush()
  }

  async function onWorkoutQueued() {
    await refreshPendingCount()
  }

  function init(getUserId) {
    teardown?.()
    setUserId(getUserId?.() ?? null)

    const onOnline = () => {
      isOnline.value = true
      scheduleFlush()
    }
    const onOffline = () => {
      isOnline.value = false
    }

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    teardown = () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }

  function cleanup() {
    teardown?.()
    teardown = null
  }

  return {
    isOnline,
    pendingCount,
    syncing,
    init,
    setUserId,
    cleanup,
    scheduleFlush,
    refreshPendingCount,
    onWorkoutQueued,
  }
})
