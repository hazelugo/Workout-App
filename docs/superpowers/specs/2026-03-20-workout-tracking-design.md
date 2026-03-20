# Workout Tracking Feature — Design Spec

**Date**: 2026-03-20
**Status**: Approved
**Approach**: Inline tracking within the Program view (Approach B)

---

## Overview

Add per-user workout tracking to the existing Vue 3 app. Users can log sets, reps, and weight inline within the Program view during a workout, review their history, see progressive overload suggestions, and export their data as PDF or CSV. Authentication is handled by Supabase (email/password + Google OAuth). Unauthenticated users retain full access to the program viewer.

---

## Goals

- Let users track sets in real time during a workout without leaving the Program view
- Store per-user workout history in Supabase
- Surface progressive overload suggestions inline next to each exercise
- Allow users to export their full history as PDF and CSV
- Gate tracking behind auth; program viewing remains unauthenticated

---

## Non-Goals (v1)

- Mobile app (noted for future consideration)
- Full-screen workout overlay mode
- Social/shared group logging
- Date-range filtering on exports
- Workout scheduling or calendar integration
- Pagination of history (full fetch acceptable for a small friend group)

---

## Data Model (Supabase / Postgres)

### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | References `auth.users` |
| `display_name` | `text` | |
| `created_at` | `timestamptz` | |

**Profile creation**: A Postgres `AFTER INSERT ON auth.users` trigger creates the corresponding `profiles` row automatically. For email/password sign-up, `display_name` is populated from the `raw_user_meta_data` field passed during `supabase.auth.signUp({ data: { display_name } })`. For Google OAuth, `display_name` is populated from `raw_user_meta_data.full_name` provided by Google's OAuth payload. If that field is absent, fall back to the email prefix.

### `workout_sessions`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | References `auth.users` |
| `date` | `date` | Date the session was started |
| `started_at` | `timestamptz` | Set when session is created |
| `phase` | `int` | 1–3 |
| `week` | `int` | 1–8 |
| `day_name` | `text` | e.g. "Monday" |
| `track` | `text` | "home" or "gym" |
| `completed_at` | `timestamptz` | null if session still active |

**Duration** is derived as `completed_at - started_at` and displayed on session cards.

**One active session constraint**: A partial unique index enforces that each user can have at most one open session at a time:
```sql
CREATE UNIQUE INDEX one_active_session ON workout_sessions (user_id) WHERE completed_at IS NULL;
```

### `set_logs`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | PK |
| `session_id` | `uuid` | References `workout_sessions` |
| `exercise_name` | `text` | |
| `set_number` | `int` | 1-indexed |
| `reps_programmed` | `int` | From program data at time of logging |
| `reps_done` | `int` | Nullable until set completed |
| `weight_kg` | `numeric` | Nullable; null for bodyweight exercises |
| `completed` | `boolean` | Default false |

Row-level security (RLS) enabled on all tables. Users can only read and write their own rows.

---

## Architecture

### New Dependencies
- `@supabase/supabase-js` — auth and database client
- `jspdf` — client-side PDF generation for export

### New Routes
| Path | View | Auth Required |
|------|------|--------------|
| `/login` | `AuthView.vue` | No (redirects to `/` if already authed) |
| `/history` | `HistoryView.vue` | Yes (redirects to `/login` if unauthed) |
| `/reset-password` | `ResetPasswordView.vue` | No |

### New Pinia Stores
- **`stores/auth.js`** — Supabase session, user object, `login`, `logout`, `signUp`, `signInWithGoogle` actions. Session is initialized by calling `supabase.auth.getSession()` synchronously before the router navigation guard runs (see Auth Initialization below).
- **`stores/tracking.js`** — Active workout session state: current `session_id`, set log entries keyed by `exercise_name + set_number`, dirty state. Persists to Supabase on each set completion.
- **`stores/history.js`** — Past sessions loaded from Supabase, personal records (max weight per exercise), export actions.

### Modified Files
- **`App.vue`** — Add `History` nav tab (visible when authenticated). Add user initials indicator in top-right with dropdown (display name, Export All, Sign Out).
- **`router/index.js`** — Add three new routes. Add navigation guard for `/history`. Auth store must be initialized before the guard runs (see Auth Initialization below).
- **`views/ProgramView.vue`** — Add "Start Workout" / "Resume Workout" / "Save & Finish" button on the active day header. Add inline set logger expansion to exercise rows when tracking mode is active.

---

## Feature Detail

### Defining "Today's Day"

The active day is determined by matching the current weekday to the program's day list. The program runs Monday–Friday. `new Date().toLocaleDateString('en-US', { weekday: 'long' })` returns the day name (e.g., "Monday"). This is matched against the current phase's day keys. If the current day is Saturday or Sunday, no day is active and the "Start Workout" button does not appear. The "Today" badge already uses this same logic.

---

### Auth Initialization

The `auth` store must be initialized **before** the Vue Router navigation guard runs, not in `App.vue`'s `onMounted`. The correct pattern:

```js
// main.js
const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

const authStore = useAuthStore(pinia)
await authStore.init() // calls supabase.auth.getSession() and sets up onAuthStateChange listener

app.use(router) // navigation guards run after auth is initialized
app.mount('#app')
```

`authStore.init()` resolves before the router is attached, so the `/history` guard sees the correct auth state on hard refresh.

---

### Inline Tracking Mode

**Activating a session**
A "Start Workout" button appears on the active day's header alongside the "Today" badge. Tapping it creates a new `workout_sessions` row (with `started_at` set to now) and activates tracking mode. The partial unique index prevents duplicate open sessions. If a session exists with no `completed_at`, the button reads "Resume Workout."

Unauthenticated users see the button but tapping it shows an inline prompt: "Sign in to track your workouts" with a link to `/login`.

**Exercise row expansion**
In tracking mode, each exercise row is tappable to expand a set logger beneath it:

```
Squat                          3    8
  ─────────────────────────────────────
  Last session: 3×8 @ 60kg — try 62.5kg
  Set 1:  [ 60 kg ]  [ 8 reps ]  ✓
  Set 2:  [ 60 kg ]  [ 8 reps ]  ✓
  Set 3:  [ 60 kg ]  [   reps ]  ○
```

- Reps fields pre-filled from program data
- Weight field pre-filled from last session for that exercise (null if no history)
- Tapping ✓ marks the set complete, saves the `set_log` row to Supabase immediately
- Completed exercises show a phase-colored checkmark on the collapsed row

**Progressive overload suggestion rules**

| Condition | Behavior |
|-----------|----------|
| No prior session for this exercise | No suggestion shown; weight field is blank |
| Prior session exists, weight_kg is null (bodyweight exercise) | No suggestion shown |
| Prior session exists, all sets completed at same weight | Show "Last: N×M @ Xkg — try X+2.5kg" |
| Prior session exists, sets completed at mixed weights | Show "Last: N×M @ Xkg" (highest weight used), no increment suggestion |
| Prior session exists but was incomplete (not all sets done) | Show last weight logged, no increment suggestion |

**Finishing a session**
"Save & Finish" button is always available on the active day header once tracking mode is active. When all sets are marked complete it becomes "Finish Workout" (same action, clearer label). Tapping it sets `completed_at` on the session and exits tracking mode.

---

### History View (`/history`)

- Sessions listed in reverse chronological order
- Each session card shows: date, day name, phase/week badge (phase-colored), track, duration (`completed_at - started_at`; omitted if session is incomplete)
- Sessions without `completed_at` show an "incomplete" indicator
- Expandable: shows full exercise list with sets × reps × weight as logged
- "Personal Records" section at top: heaviest `weight_kg` logged per exercise across all sessions
- No pagination in v1 — full fetch from Supabase is acceptable for a small user group

**Export**
Two buttons at top of the view:
- **Export CSV** — flat table: date, day, exercise, set number, reps done, weight kg. Client-side file download from loaded session data.
- **Export PDF** — formatted training journal grouped by date. Generated client-side with `jspdf`. Readable, printable.

Both exports include the full history for the authenticated user (no date filtering in v1).

**Empty state**
"No sessions yet. Start your first workout from the Program view." with link to `/`.

---

### Auth Flow (`/login`)

Single page with Sign In / Sign Up modes toggled by a text link. No separate `/register` route.

- **Sign Up**: display name, email, password. `display_name` passed as `raw_user_meta_data` to `supabase.auth.signUp()`.
- **Sign In**: email, password
- **Google OAuth**: single button on both modes. Supabase handles the redirect. `display_name` populated from Google's `full_name` OAuth payload in the `profiles` trigger; falls back to email prefix if absent.
- Errors shown inline below relevant fields (no modals or toasts)
- On success: redirect to intended destination or `/`

**Password reset**
"Forgot password?" link on sign-in triggers `supabase.auth.resetPasswordForEmail()`. `/reset-password` handles the confirmation redirect. On load, the view subscribes to `supabase.auth.onAuthStateChange` and waits for the `PASSWORD_RECOVERY` event before showing the new-password form. On confirmation, calls `supabase.auth.updateUser({ password })`. This is the required Supabase recovery flow — the recovery token sets a temporary session that `updateUser` consumes.

**Session persistence**
Supabase manages session tokens in localStorage automatically. Auth store is initialized via `supabase.auth.getSession()` in `main.js` before the router mounts (see Auth Initialization above).

**Nav user indicator**
When authenticated: user initials in a small circle (violet accent) in top-right of nav. Tapping opens a minimal dropdown: display name, "Export All," "Sign Out."

---

## Success Criteria

- User can sign up, log in with email/password, and log in with Google
- `profiles` row is created automatically on sign-up for both auth methods
- User can start a workout on today's day, log sets with weight and reps, and finish the session
- Programmed sets and reps pre-fill the tracker; last session weight pre-fills the weight field
- Progressive overload suggestion appears according to the rules table above
- Completed sessions appear in `/history` with full set detail and duration
- User can export history as CSV and PDF
- Unauthenticated users can use the full program viewer without any tracking UI interruption
- RLS ensures users cannot access other users' data
- Hard refresh to `/history` while authenticated does not incorrectly redirect to `/login`
