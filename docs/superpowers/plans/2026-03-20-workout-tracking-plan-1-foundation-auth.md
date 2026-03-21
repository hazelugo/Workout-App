# Workout Tracking — Plan 1: Foundation & Auth

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up Supabase infrastructure and complete user authentication (email/password + Google OAuth) so the app can identify users before any tracking begins.

**Architecture:** Supabase handles auth and Postgres storage. A singleton client (`src/lib/supabase.js`) is shared across all stores. The `auth` store is initialized in `main.js` before the router mounts, so navigation guards see correct session state on hard refresh. Auth UI lives in a single `AuthView.vue` with sign-in/sign-up toggle.

**Tech Stack:** `@supabase/supabase-js`, Vue 3, Pinia, Vue Router, Vitest

---

**Spec:** `docs/superpowers/specs/2026-03-20-workout-tracking-design.md`

**This plan produces:** Working auth — users can sign up, sign in, sign in with Google, reset password, and sign out. The History nav tab appears when authenticated. Hard refresh to `/history` does not bounce to `/login`.

**Plans 2 and 3 depend on this plan being complete.**

---

## Pre-flight: Verify Test Setup

Before Task 1, confirm the test runner and `@` alias are configured.

- [ ] **Verify `vitest` is installed and `test:unit` script exists**

  ```bash
  npm run test:unit -- --version
  ```

  Expected: Vitest version printed (e.g. `vitest/4.x.x`). If not found, run `npm install`.

- [ ] **Verify `@` alias in `vite.config.js`**

  Open `vite.config.js`. Confirm it contains:

  ```js
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  }
  ```

  This alias must exist for all `@/stores/...`, `@/lib/...` test imports to resolve. It is already present in this project — just confirm before writing tests.

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/lib/supabase.js` | Supabase client singleton |
| Create | `src/stores/auth.js` | Session state, sign in/up/out actions |
| Create | `src/views/AuthView.vue` | Login + register UI |
| Create | `src/views/ResetPasswordView.vue` | Password reset confirmation |
| Create | `src/sql/schema.sql` | Full DB schema + RLS + trigger (reference) |
| Modify | `src/main.js` | Auth init before router mount |
| Modify | `src/router/index.js` | New routes + `/history` guard |
| Modify | `src/App.vue` | History nav tab + user initials dropdown |
| Create | `src/tests/auth.store.test.js` | Auth store unit tests |

---

## Task 1: Supabase Project Setup (Manual Steps)

These steps happen in the Supabase dashboard and your terminal — not in code.

**Files:** none (environment setup)

- [ ] **Step 1: Create Supabase project**

  Go to https://supabase.com, create a new project. Note the **Project URL** and **anon public key** from Settings → API.

- [ ] **Step 2: Create `.env.local`**

  Create `/.env.local` in the project root (already git-ignored by Vite):

  ```
  VITE_SUPABASE_URL=https://your-project-ref.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key-here
  ```

- [ ] **Step 3: Enable Google OAuth provider**

  In Supabase dashboard: Authentication → Providers → Google → Enable. You'll need a Google Cloud OAuth client ID and secret. Authorized redirect URI: `https://your-project-ref.supabase.co/auth/v1/callback`.

- [ ] **Step 4: Install `@supabase/supabase-js`**

  ```bash
  npm install @supabase/supabase-js
  ```

---

## Task 2: SQL Schema Migration

Create a reference SQL file. Run it in the Supabase dashboard SQL editor (Database → SQL Editor → New query).

**Files:**
- Create: `src/sql/schema.sql`

- [ ] **Step 1: Write the SQL file**

  ```sql
  -- profiles: one row per user, auto-created on sign-up
  create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    display_name text,
    created_at timestamptz default now()
  );

  -- Auto-create profile row on new user sign-up
  create or replace function public.handle_new_user()
  returns trigger language plpgsql security definer set search_path = public as $$
  begin
    insert into public.profiles (id, display_name)
    values (
      new.id,
      coalesce(
        new.raw_user_meta_data->>'display_name',
        new.raw_user_meta_data->>'full_name',
        split_part(new.email, '@', 1)
      )
    );
    return new;
  end;
  $$;

  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

  -- workout_sessions
  create table public.workout_sessions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users on delete cascade not null,
    date date not null,
    started_at timestamptz not null default now(),
    phase int not null check (phase between 1 and 3),
    week int not null check (week between 1 and 8),
    day_name text not null,
    track text not null check (track in ('home', 'gym')),
    completed_at timestamptz
  );

  -- Enforce one open session per user at a time
  create unique index one_active_session on public.workout_sessions (user_id)
    where completed_at is null;

  -- set_logs
  create table public.set_logs (
    id uuid default gen_random_uuid() primary key,
    session_id uuid references public.workout_sessions on delete cascade not null,
    exercise_name text not null,
    set_number int not null,
    reps_programmed int not null,
    reps_done int,
    weight_kg numeric,
    completed boolean not null default false
  );

  -- RLS
  alter table public.profiles enable row level security;
  alter table public.workout_sessions enable row level security;
  alter table public.set_logs enable row level security;

  -- profiles: own row only
  create policy "profiles: own row" on public.profiles
    for all using (auth.uid() = id);

  -- workout_sessions: own rows only
  create policy "sessions: own rows" on public.workout_sessions
    for all using (auth.uid() = user_id);

  -- set_logs: own via session join
  create policy "set_logs: own via session" on public.set_logs
    for all using (
      exists (
        select 1 from public.workout_sessions s
        where s.id = set_logs.session_id
          and s.user_id = auth.uid()
      )
    );
  ```

- [ ] **Step 2: Run in Supabase SQL editor**

  Paste the full file into Supabase dashboard → SQL Editor → Run. Verify no errors.

- [ ] **Step 3: Commit the SQL file**

  ```bash
  git add src/sql/schema.sql
  git commit -m "feat: add supabase schema SQL reference"
  ```

---

## Task 3: Supabase Client Singleton

**Files:**
- Create: `src/lib/supabase.js`

- [ ] **Step 1: Write the client**

  ```js
  // src/lib/supabase.js
  import { createClient } from '@supabase/supabase-js'

  export const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
  )
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/lib/supabase.js
  git commit -m "feat: add supabase client singleton"
  ```

---

## Task 4: Auth Store

**Files:**
- Create: `src/stores/auth.js`
- Create: `src/tests/auth.store.test.js`

- [ ] **Step 1: Write the failing tests first**

  ```js
  // src/tests/auth.store.test.js
  import { describe, it, expect, vi, beforeEach } from 'vitest'
  import { setActivePinia, createPinia } from 'pinia'

  // Mock supabase before importing store
  vi.mock('@/lib/supabase', () => ({
    supabase: {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
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
  ```

- [ ] **Step 2: Run tests — verify they fail**

  ```bash
  npm run test:unit -- src/tests/auth.store.test.js
  ```

  Expected: FAIL (store doesn't exist yet)

- [ ] **Step 3: Write the auth store**

  ```js
  // src/stores/auth.js
  import { defineStore } from 'pinia'
  import { ref, computed } from 'vue'
  import { supabase } from '@/lib/supabase'

  export const useAuthStore = defineStore('auth', () => {
    const session = ref(null)
    const user = ref(null)
    const profile = ref(null)
    let _subscription = null

    const isAuthenticated = computed(() => !!session.value)

    const userInitials = computed(() => {
      if (!profile.value?.display_name) return '?'
      const parts = profile.value.display_name.trim().split(/\s+/)
      if (parts.length === 1) return parts[0][0].toUpperCase()
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    })

    async function _loadProfile(userId) {
      const { data } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', userId)
        .single()
      profile.value = data
    }

    async function init() {
      const { data } = await supabase.auth.getSession()
      session.value = data.session
      user.value = data.session?.user ?? null
      if (user.value) await _loadProfile(user.value.id)

      const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        session.value = newSession
        user.value = newSession?.user ?? null
        if (user.value) {
          await _loadProfile(user.value.id)
        } else {
          profile.value = null
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

    return {
      session, user, profile,
      isAuthenticated, userInitials,
      init, cleanup, signIn, signUp, signInWithGoogle, signOut, resetPasswordForEmail,
    }
  })
  ```

- [ ] **Step 4: Run tests — verify they pass**

  ```bash
  npm run test:unit -- src/tests/auth.store.test.js
  ```

  Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

  ```bash
  git add src/stores/auth.js src/tests/auth.store.test.js
  git commit -m "feat: add auth store with supabase session management"
  ```

---

## Task 5: Update `main.js` — Auth Init Before Router

**Files:**
- Modify: `src/main.js`

- [ ] **Step 1: Rewrite main.js**

  ```js
  // src/main.js
  // Note: top-level await is valid here — Vite treats main.js as an ES module.
  import { createApp } from 'vue'
  import { createPinia } from 'pinia'
  import { useAuthStore } from './stores/auth'
  import App from './App.vue'
  import router from './router'

  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)

  // Auth must initialize before router mounts so navigation guards
  // see correct session state on hard refresh.
  const authStore = useAuthStore(pinia)
  await authStore.init()

  app.use(router)
  app.mount('#app')
  ```

- [ ] **Step 2: Verify dev server starts without errors**

  ```bash
  npm run dev
  ```

  Expected: Server starts, app loads at http://localhost:5173

- [ ] **Step 3: Commit**

  ```bash
  git add src/main.js
  git commit -m "feat: initialize auth store before router mounts"
  ```

---

## Task 6: Update Router — New Routes + Auth Guard

**Files:**
- Modify: `src/router/index.js`

- [ ] **Step 1: Rewrite router**

  ```js
  // src/router/index.js
  import { createRouter, createWebHistory } from 'vue-router'
  import ProgramView from '../views/ProgramView.vue'
  import CustomView from '../views/CustomView.vue'
  import AuthView from '../views/AuthView.vue'
  import HistoryView from '../views/HistoryView.vue'
  import ResetPasswordView from '../views/ResetPasswordView.vue'
  import { useAuthStore } from '../stores/auth'

  const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
      { path: '/', component: ProgramView },
      { path: '/custom', component: CustomView },
      { path: '/login', component: AuthView },
      { path: '/history', component: HistoryView, meta: { requiresAuth: true } },
      { path: '/reset-password', component: ResetPasswordView },
    ],
  })

  router.beforeEach((to) => {
    const auth = useAuthStore()
    if (to.meta.requiresAuth && !auth.isAuthenticated) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }
    if (to.path === '/login' && auth.isAuthenticated) {
      return { path: '/' }
    }
  })

  export default router
  ```

- [ ] **Step 2: Create placeholder views** (so the router doesn't crash — full implementations come later)

  Create `src/views/AuthView.vue`:
  ```html
  <template><div style="padding: 40px; text-align: center; color: #e8e8e8">Auth — coming soon</div></template>
  ```

  Create `src/views/HistoryView.vue`:
  ```html
  <template><div style="padding: 40px; text-align: center; color: #e8e8e8">History — coming soon</div></template>
  ```

  Create `src/views/ResetPasswordView.vue`:
  ```html
  <template><div style="padding: 40px; text-align: center; color: #e8e8e8">Reset password — coming soon</div></template>
  ```

- [ ] **Step 3: Verify routing works**

  ```bash
  npm run dev
  ```

  Navigate to http://localhost:5173/history — should redirect to `/login`. Navigate to `/login` while signed in — should redirect to `/`.

- [ ] **Step 4: Commit**

  ```bash
  git add src/router/index.js src/views/AuthView.vue src/views/HistoryView.vue src/views/ResetPasswordView.vue
  git commit -m "feat: add auth-gated routes and navigation guard"
  ```

---

## Task 7: Update `App.vue` — History Tab + User Indicator

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: Add History nav tab and user initials indicator**

  Replace the `<nav>` block and add auth store import. The nav adds a `History` link (only shown when authenticated) and a user initials circle in the top-right corner with a sign-out dropdown.

  Full updated `App.vue`:

  ```html
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

        <!-- User indicator -->
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
  ```

- [ ] **Step 2: Verify nav renders correctly in browser**

  Run `npm run dev`. Sign in as a test user — History tab and initials should appear. Dropdown should open/close. Sign out should redirect to `/login`.

- [ ] **Step 3: Commit**

  ```bash
  git add src/App.vue
  git commit -m "feat: add history tab and user initials dropdown to nav"
  ```

---

## Task 8: AuthView — Sign In / Sign Up / Google OAuth

**Files:**
- Modify: `src/views/AuthView.vue` (replace placeholder)

- [ ] **Step 1: Write full AuthView**

  ```html
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
  ```

- [ ] **Step 2: Verify in browser**

  Visit `/login`. Toggle between sign in/sign up. Test with a real Supabase account. Test Google button. Test "Forgot password?" with a valid email.

- [ ] **Step 3: Commit**

  ```bash
  git add src/views/AuthView.vue
  git commit -m "feat: add auth view with sign in, sign up, and google oauth"
  ```

---

## Task 9: ResetPasswordView

**Files:**
- Modify: `src/views/ResetPasswordView.vue` (replace placeholder)

- [ ] **Step 1: Write full ResetPasswordView**

  ```html
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
    // Wait for Supabase to fire the PASSWORD_RECOVERY event from the redirect token
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
  ```

- [ ] **Step 2: Test the password reset flow end-to-end**

  - Request a reset email from `/login`
  - Click the link in the email
  - Verify you land on `/reset-password` and the form appears
  - Set a new password, verify redirect to `/login`

- [ ] **Step 3: Commit**

  ```bash
  git add src/views/ResetPasswordView.vue
  git commit -m "feat: add password reset confirmation view"
  ```

---

## Verification

- [ ] `npm run test:unit` — all tests pass
- [ ] `npm run dev` — dev server starts, no console errors
- [ ] Sign up with email/password — profile row appears in Supabase dashboard
- [ ] Sign up with Google — profile row appears with `full_name` populated
- [ ] Hard refresh to `/history` while signed in — stays on `/history`, does not redirect
- [ ] Hard refresh to `/history` while signed out — redirects to `/login?redirect=%2Fhistory`
- [ ] After signing in from redirect — lands on `/history`
- [ ] Sign out — redirects to `/login`, History tab disappears
