# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The trainer and a small circle — friends, clients, and training partners. Used primarily on a mobile browser during live gym sessions: phone in hand between sets, glancing at the program, logging reps and weight immediately after each set.

## Product Purpose

A structured workout tracker built around a specific program the trainer designed. It replaces generic notes or off-the-shelf apps with a purpose-built interface that matches exactly how the program is organized and how sessions actually run. Success means the trainer and their people can execute any session from the app without needing to consult anything else, and see their history accumulate accurately over time.

## Positioning

The program is the trainer's own design. No third-party tracker can surface it in the right structure, with the right vocabulary, with offline reliability at the gym. The app *is* the program, made interactive — not a generic tracker that happens to hold it.

## Operating Context

- Used at the gym on a phone, often with poor or no connectivity
- Sessions follow a fixed program structure: exercises are predefined, users log reps done and weight lifted per set
- Offline-first: changes queue locally (IndexedDB) and sync to Supabase when connectivity returns
- Small trusted user base: trainer plus invited participants; no public sign-up flow is needed long-term
- Users are mid-session when they interact most — low cognitive bandwidth, one hand free

## Capabilities and Constraints

- **Auth:** Supabase email/password + optional password reset flow
- **Program view:** Predefined program structure the trainer controls; users execute sessions from it
- **Custom view:** User-defined workouts outside the main program
- **History view:** Past sessions with rep/weight detail; supports deletion with inline confirmation
- **Offline sync:** Connectivity store with pending-count indicator and sync on reconnect
- **PWA:** Installable via vite-plugin-pwa; intended to behave like a native app when added to home screen
- **Stack:** Vue 3 + Vite, Pinia, TanStack Vue Query, Supabase, idb, vue-router
- **Deployed:** Live on Vercel; actively being built out — not feature-complete

## Brand Commitments

No formal brand identity established. Current visual language: near-black background (oklch(8% 0.012 45)), burnt-orange accent (#e8440a), soft purple secondary (#a78bfa), Georgia serif typeface throughout. This aesthetic should be treated as a working hypothesis unless the user explicitly locks it in.

## Evidence on Hand

- Full source available in src/ — five views, Pinia stores, Supabase queries, offline sync layer
- No external brand assets, logos, or marketing copy exist yet
- No testimonials, benchmarks, or press

## Product Principles

1. **The program is the product.** The interface exists to serve the trainer's specific program structure, not a generic workout paradigm.
2. **Reliability in the gym.** Offline-first behavior is not a nice-to-have — it is table stakes. A dropped connection mid-session must never block logging.
3. **Low friction at the point of use.** Users are between sets with one hand. Every interaction must be fast, legible, and require no mental overhead.
4. **Small circle, high trust.** This is not a public product. Interactions can be direct and assume training literacy.
5. **Grow with the trainer's practice.** The custom workout layer means the system should gracefully expand beyond the core program as needs evolve.

## Accessibility & Inclusion

No formal accessibility standard committed to yet. prefers-reduced-motion is already respected in CSS. Mobile-first layout and font sizes should be validated for gym conditions (bright sunlight, one-handed use, glare on screen).
