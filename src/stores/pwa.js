import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const INSTALL_DISMISS_KEY = 'pwa-install-dismissed-v1'

function getStorageItem(key) {
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      return localStorage.getItem(key)
    }
  } catch {
    return null
  }
  return null
}

function setStorageItem(key, value) {
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
      localStorage.setItem(key, value)
    }
  } catch {}
}

function isStandaloneMode() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function isIosDevice() {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export const usePwaStore = defineStore('pwa', () => {
  const deferredPrompt = ref(null)
  const needRefresh = ref(false)
  const offlineReady = ref(false)
  const installDismissed = ref(getStorageItem(INSTALL_DISMISS_KEY) === '1')

  let refreshHandler = null

  const isStandalone = computed(() => isStandaloneMode())
  const isIos = computed(() => isIosDevice())

  const showInstallBanner = computed(() => {
    if (import.meta.env.DEV) return false
    if (isStandalone.value || installDismissed.value) return false
    return Boolean(deferredPrompt.value) || isIos.value
  })

  const showUpdateBanner = computed(() => needRefresh.value)

  function captureInstallPrompt(event) {
    event.preventDefault()
    deferredPrompt.value = event
  }

  async function promptInstall() {
    const prompt = deferredPrompt.value
    if (!prompt) return false

    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    deferredPrompt.value = null

    if (outcome === 'accepted') {
      installDismissed.value = true
      setStorageItem(INSTALL_DISMISS_KEY, '1')
    }

    return outcome === 'accepted'
  }

  function dismissInstall() {
    installDismissed.value = true
    setStorageItem(INSTALL_DISMISS_KEY, '1')
  }

  function setRefreshHandler(handler) {
    refreshHandler = handler
  }

  function markNeedRefresh() {
    needRefresh.value = true
  }

  function markOfflineReady() {
    offlineReady.value = true
  }

  async function applyUpdate() {
    if (refreshHandler) {
      await refreshHandler(true)
    }
    needRefresh.value = false
  }

  function init() {
    if (typeof window === 'undefined') return undefined

    const onBeforeInstallPrompt = (event) => captureInstallPrompt(event)
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    }
  }

  return {
    deferredPrompt,
    needRefresh,
    offlineReady,
    isStandalone,
    isIos,
    showInstallBanner,
    showUpdateBanner,
    captureInstallPrompt,
    promptInstall,
    dismissInstall,
    setRefreshHandler,
    markNeedRefresh,
    markOfflineReady,
    applyUpdate,
    init,
  }
})
