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

---

## Data Model (Supabase / Postgres)

### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | References `auth.users` |
| `display_name` | `text` | |
| `created_at` | `timestamptz` | |

### `workout_sessions`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | References `auth.users` |
| `date` | `date` | |
| `phase` | `int` | 1–3 |
| `week` | `int` | 1–8 |
| `day_name` | `text` | e.g. "Monday" |
| `track` | `text` | "home" or "gym" |
| `completed_at` | `timestamptz` | null if session still active |

### `set_logs`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | PK |
| `session_id` | `uuid` | References `workout_sessions` |
| `exercise_name` | `text` | |
| `set_number` | `int` | 1-indexed |
| `reps_programmed` | `int` | From program data at time of logging |
| `reps_done` | `int` | Nullable until set completed |
| `weight_kg` | `numeric` | Nullable until set completed |
| `completed` | `boolean` | Default false |

Row-level security (RLS) enabled on all tables. Users can only read and write their own rows.

---

## Architecture

### New Dependencies
- `@supabase/supabase-js` — auth and database client

### New Routes
| Path | View | Auth Required |
|------|------|--------------|
| `/login` | `AuthView.vue` | No (redirects to `/` if already authed) |
| `/history` | `HistoryView.vue` | Yes (redirects to `/login` if unauthed) |
| `/reset-password` | `ResetPasswordView.vue` | No |

### New Pinia Stores
- **`stores/auth.js`** — Supabase session, user object, `login`, `logout`, `signUp`, `signInWithGoogle` actions. Initializes from existing Supabase session on app mount.
- **`stores/tracking.js`** — Active workout session state: current `session_id`, set log entries keyed by `exercise_name + set_number`, dirty state. Persists to Supabase on each set completion.
- **`stores/history.js`** — Past sessions loaded from Supabase, personal records (max weight per exercise), export actions.

### Modified Files
- **`App.vue`** — Add `History` nav tab (visible when authenticated). Add user initials indicator in top-right with dropdown (display name, Export All, Sign Out).
- **`router/index.js`** — Add three new routes. Add navigation guard for `/history`.
- **`views/ProgramView.vue`** — Add "Start Workout" / "Resume Workout" / "Save & Finish" button on active day header. Add inline set logger expansion to exercise rows when tracking mode is active.

---

## Feature Detail

### Inline Tracking Mode

**Activating a session**
A "Start Workout" button appears on the active day's header alongside the "Today" badge. Tapping it creates a new `workout_sessions` row and activates tracking mode. Only one session can be active at a time. If a session exists with no `completed_at`, the button reads "Resume Workout."

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
- Progressive overload suggestion: if last session weight exists, suggest +2.5kg
- Tapping ✓ marks the set complete, saves the `set_log` row to Supabase immediately
- Completed exercises show a phase-colored checkmark on the collapsed row

**Finishing a session**
"Save & Finish" button is always available on the active day header once tracking mode is active. When all sets are marked complete it becomes "Finish Workout" (same action, clearer label). Tapping it sets `completed_at` on the session and exits tracking mode.

---

### History View (`/history`)

- Sessions listed in reverse chronological order
- Each session card shows: date, day name, phase/week badge (phase-colored), track, duration
- Sessions without `completed_at` show an "incomplete" indicator
- Expandable: shows full exercise list with sets × reps × weight as logged
- "Personal Records" section at top: heaviest weight logged per exercise across all sessions

**Export**
Two buttons at top of the view:
- **Export CSV** — flat table: date, day, exercise, set number, reps done, weight kg. Client-side file download from loaded session data.
- **Export PDF** — formatted training journal grouped by date. Generated client-side with `jsPDF` or `@pdf-lib/pdflib`. Readable, printable.

Both exports include the full history for the authenticated user (no date filtering in v1).

**Empty state**
"No sessions yet. Start your first workout from the Program view." with link to `/`.

---

### Auth Flow (`/login`)

Single page with Sign In / Sign Up modes toggled by a text link. No separate `/register` route.

- **Sign Up**: display name, email, password
- **Sign In**: email, password
- **Google OAuth**: single button on both modes, Supabase handles redirect
- Errors shown inline below relevant fields (no modals or toasts)
- On success: redirect to intended destination or `/`

**Password reset**
"Forgot password?" link on sign-in triggers Supabase's built-in reset email. `/reset-password` handles the confirmation link and shows a new-password input form.

**Session persistence**
Supabase manages session tokens in localStorage automatically. `auth` store initializes from existing session on `onMounted` in `App.vue`.

**Nav user indicator**
When authenticated: user initials in a small circle (violet accent) in top-right of nav. Tapping opens a minimal dropdown: display name, "Export All," "Sign Out."

---

## Success Criteria

- User can sign up, log in with email/password, and log in with Google
- User can start a workout on today's day, log sets with weight and reps, and finish the session
- Programmed sets and reps pre-fill the tracker; last session weight pre-fills the weight field
- Progressive overload suggestion (+2.5kg) appears when prior session data exists
- Completed sessions appear in `/history` with full set detail
- User can export history as CSV and PDF
- Unauthenticated users can use the full program viewer without any tracking UI interruption
- RLS ensures users cannot access other users' data
