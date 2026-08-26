---
name: Workout App Design System
description: Impeccable, high-contrast, mobile-first design system for gym workout tracking and custom programming.
colors:
  primary: "#a78bfa"
  primary-hover: "#c4b5fd"
  primary-subtle: "#a78bfa22"
  accent-green: "#22c55e"
  accent-green-bright: "#4ade80"
  accent-green-dark: "#166534"
  accent-green-deep: "#14532d"
  accent-cyan: "#38bdf8"
  accent-pink: "#f472b6"
  accent-emerald: "#34d399"
  surface-base: "oklch(8% 0.012 45)"
  surface-card: "oklch(10% 0.01 45)"
  surface-elevated: "oklch(12% 0.015 45)"
  surface-header: "oklch(11% 0.01 45)"
  surface-active: "oklch(12% 0.02 145)"
  border-subtle: "oklch(18% 0.008 45)"
  border-active: "oklch(24% 0.008 45)"
  border-accent: "#22c55e"
  border-purple: "#a78bfa44"
  text-primary: "#f5f5f5"
  text-secondary: "#a3a3a3"
  text-muted: "#737373"
  text-light: "#e5e5e5"
  text-soft: "#d4d4d4"
  text-white: "#ffffff"
  danger: "#f87171"
  danger-dark: "#7f3535"
  danger-light: "#fca5a5"
typography:
  display:
    fontFamily: "Georgia, 'Times New Roman', serif"
    fontSize: "clamp(1.75rem, 5vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
  title:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  body-sm:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "1.5px"
    textTransform: "uppercase"
  caption:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
  number:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif"
    fontVariantNumeric: "tabular-nums"
    fontWeight: 700
rounded:
  xs: "4px"
  sm: "6px"
  md: "10px"
  lg: "12px"
  badge: "20px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "14px"
  lg: "18px"
  xl: "24px"
  xxl: "36px"
---

# Workout App Design System

## Overview

The Workout App is designed for **1-handed mobile use in intense gym conditions** (bright lighting, glare, sweaty hands, brief recovery windows between sets).

The interface prioritizes:
1. **Immediate Legibility**: High contrast (`#f5f5f5` on dark `oklch(8% 0.012 45)` surfaces), clean sans-serif UI typography, and tabular figures for numbers.
2. **Zero Distraction**: No emojis or decorative iconography. Clean, typed text labels and purposeful state badges.
3. **Ergonomic Touch Targets**: Minimum 44px (recommended 48px–52px) tap targets for all buttons, day headers, inputs, and tab switches.
4. **Instant State Feedback**: Emerald green indicators (`#22c55e`) for activated programs, purple accents (`#a78bfa`) for studio editing and custom day modes.

---

## Colors

- **Background Canvas**: `oklch(8% 0.012 45)` — Deep charcoal slate, avoiding pure `#000` to prevent OLED smearing while preserving deep contrast.
- **Card Surfaces**: `oklch(10% 0.01 45)` with `1px solid oklch(18% 0.008 45)` borders.
- **Active Program Accent**: `#22c55e` (Emerald) for active plans, logged confirmations, and completed sets.
- **Studio & Custom Accent**: `#a78bfa` (Soft Purple) / `#c4b5fd` for custom days, builder actions, and exercise demo links.
- **Phase Accents**:
  - Phase 1 (Foundation): `#4ade80` (Green)
  - Phase 2 (Hypertrophy): `#38bdf8` (Cyan/Sky)
  - Phase 3 (Specialization): `#f472b6` (Pink/Magenta)

---

## Typography

- **Editorial Headings**: `Georgia, 'Times New Roman', serif` for top-level view titles.
- **Data, UI & Controls**: System sans stack (`system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', Roboto, sans-serif`).
- **Tabular Figures**: All reps, sets, weights, dates, and timer counters enforce `font-variant-numeric: tabular-nums` to maintain aligned columns.
- **Label Hierarchy**:
  - Section/Pill Labels: `10px–11px`, `letter-spacing: 1.5px–2px`, uppercase, `font-weight: 600`.
  - Body/Exercise Text: `14px–15px`, `color: #f5f5f5` (primary) / `#c4b5fd` (links).
  - Secondary Info: `12px–13px`, `color: #a3a3a3`.

---

## Layout

- **Mobile First Grid**: Max width `760px` centered for desktop, full-width fluid on mobile with `16px` padding.
- **7-Day Accordion**: Vertically stacked cards for each weekday (Monday–Sunday) with persistent expansion state.
- **Touch Targets**: All interactive elements maintain `min-height: 44px` (headers: `52px`, log buttons: `48px`).

---

## Elevation & Depth

- Elevation is achieved primarily through **tonal surface layering** (`oklch(8%)` → `oklch(10%)` → `oklch(12%)`) and subtle 1px border contrast.
- Active states use a soft 1px glow ring (`box-shadow: 0 0 0 1px #22c55e44, 0 4px 20px -4px #22c55e22`).

---

## Shapes

- **Outer Cards**: `border-radius: 12px`.
- **Inner Modules & Tables**: `border-radius: 8px–10px`.
- **Badges & Action Buttons**: `border-radius: 20px` (pills).
- **Segmented Tabs**: `border-radius: 9999px`.

---

## Components

### 1. Day Card & Accordion
- Header: Day name in uppercase tracking + workout title pill + today badge + expand/collapse toggle.
- Table: 3-column layout (Exercise | Sets | Reps), demo link on exercise name, accent color on programmed sets.
- CTA: Prominent full-width "Log workout" button with saved state transitions.

### 2. Segmented Navigation
- Top navigation bar with 48px touch targets, uppercase tracking, and bottom indicator bar on active route.

### 3. Studio Program Cards
- Distinct emerald border and badge for active custom programs.
- Quick inline day builder with mix-and-match copy dropdown.

---

## Do's and Don'ts

### Do:
- Use clean, typed text labels (`Home Track`, `Gym Track`, `Active`, `Export`).
- Keep touch targets large and accessible for thumb-reach.
- Ensure tabular numbers on all tables and inputs.
- Keep contrast high and readable under direct light.

### Don't:
- Don't use emojis or decorative icons in UI controls, badges, or buttons.
- Don't force serif fonts onto numeric inputs or small UI labels.
- Don't hide exercise details behind unnecessary multi-click flows.
