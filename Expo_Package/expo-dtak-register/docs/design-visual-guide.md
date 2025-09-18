# Design Visual Guide

This guide tracks the current design tokens and component styling patterns used in the Expo onboarding flow. Use it to keep implementation decisions consistent as we evolve the UI.

## Color Tokens (`T`)

| Token | Value | Usage |
|-------|-------|-------|
| `bg` | `#0b0c10` | App background, SafeAreaView wrapper |
| `surface` | `#12141a` | Card backgrounds, camera panel |
| `border` | `#1f2430` | Card outlines, input borders |
| `text` | `#e6e7ee` | Primary text, headings |
| `sub` | `#9aa0a6` | Secondary copy, labels, supporting text |
| `primary` | `#4f6bff` | CTA background, accent states |
| `primary2` | `#2aa3ff` | Secondary accent (currently unused) |
| `cta` | `#4f6bff` | CTA button fill (alias of `primary`) |

> The plugin preview screen uses darker palette overrides inline (`#04070f`, `#111826`, `#1b2536`, etc.). Consider promoting those into shared tokens if reused elsewhere.

## Typography

| Style | Font Size | Weight | Notes |
|-------|-----------|--------|-------|
| Header title (`S.sectionTitle`) | 18 | 600 | Primary headings inside cards |
| Subheader (`S.subheader`) | 14 | 400 | Step descriptions above headings |
| Body (`S.subText`) | 14 | 400 | Supporting copy |
| Field Label (`S.fieldLabel`) | 12 | Uppercase | Labels for inputs |
| CTA Text (`S.ctaTxt`, `S.primaryBtnTxt`) | 16 | 700 | Buttons with high contrast |

All text leverages the default system font (SF Pro on iOS). We enforce uppercase + tracking in labels and CTA buttons directly in styles.

## Spacing & Corners

- **Card radius:** 16px
- **Buttons:** 12px radius (CTA/Ghost)
- **Input padding:** 12px vertical, 12px horizontal
- **Layout padding:** 16px horizontal on main container; ScrollView bottom padding 24px

## Iconography & Logos

- **DTAK Badge:** `assets/dtak-logo.png` rendered via `Image` at `28x32` in header.
- **Emoji glyphs** stand in for map pins and quick actions until SVG/icon pack decisions are finalized.

## Components

- **Card:** Shared wrapper (`Card`) with `surface` background and `border` outline.
- **CTA / Ghost Button:** Primary and secondary button components with matching typography & padding.
- **Input Field:** Label + `TextInput` with dark background and subtext placeholders.
- **Header:** Back button + logo badge + step title.
- **Screens:** `LoginScreen`, `SignUpScreen`, `AddressCallsignScreen`, `SelfieScreen`, `CreatingScreen`, `LocationPromptScreen`, `FinalReady` share consistent spacing & reuse the components above.
- **LoginScreen:** Mirrors signup styling with only email/password fields, primary CTA (`Sign in`) and a secondary `GhostBtn` that routes into account creation.
- **FaceScanLoader:** 220×220 looping image sequence built from `assets/Face Scan {1-4}.png`; the Creating step now renders this loader full-screen to reinforce identity verification during account creation.
- **LocationPromptScreen:** Requests foreground permission via `expo-location`, shows spinner/error states while resolving coordinates, and surfaces the captured lat/long summary on the confirmation screen when available.
- **Password Validation Hint:** Inline helper text (system red) appears above password inputs when the 15+ char mixed-case/number/symbol requirement is not met.

## Plugin Preview Styling (MapPluginsScreen)

The dark plugin preview screen uses a separate palette defined inline:

| Token | Value | Notes |
|-------|-------|-------|
| `bg` | `#04070f` | Overall backdrop |
| `surface` | `#111826` | Device shell |
| `surfaceSoft` | `#1b2536` | Card fill |
| `border` | `#1f2c3f` | Card outline |
| `accent` | `#53e0b4` | Live pill background |
| `text` | `#f5f7ff` | Primary text |
| `subtext` | `#92a4c0` | Secondary text |

Consider promoting these values when we integrate the screen into the main flow to avoid duplication.

---

**Maintainers:** Update this doc whenever design tokens or major component styling changes. This helps downstream teams (design, QA, docs) keep a single source of truth.
