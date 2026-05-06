import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi
        .fn()
        .mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { display_name: 'Test User' }, error: null }),
    }),
  },
}))

import { useAuthStore } from '@/stores/auth'

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with null user and session', async () => {
    const store = useAuthStore()
    await store.init()
    expect(store.user).toBeNull()
    expect(store.session).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  it('isAuthenticated is true when session exists', () => {
    const store = useAuthStore()
    store.session = { user: { id: 'abc' } }
    expect(store.isAuthenticated).toBe(true)
  })

  it('userInitials returns first two initials from display name', () => {
    const store = useAuthStore()
    store.profile = { display_name: 'Hector Garcia' }
    expect(store.userInitials).toBe('HG')
  })

  it('userInitials falls back to single initial', () => {
    const store = useAuthStore()
    store.profile = { display_name: 'Hector' }
    expect(store.userInitials).toBe('H')
  })

  it('userInitials returns ? when no profile', () => {
    const store = useAuthStore()
    store.profile = null
    expect(store.userInitials).toBe('?')
  })
})
