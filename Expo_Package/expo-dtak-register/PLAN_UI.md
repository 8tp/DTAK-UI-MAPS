**Objective**
- Build five high‑fidelity, React Native mobile screens for DTAK using DTAK_Improved_System_Prompt_V2.md.
- Apply consistent Frame‑inspired color and typography: dark surfaces, cobalt/indigo primary, amber CTA, high contrast.
- Keep components reusable and lightweight for offline/low‑compute contexts.

**2025-09-18 – TypeScript Hardening**
- Migrated the Expo shell (`App.tsx`, `MapPluginsScreen.tsx`, tests) to strict TypeScript for safer refactors.
- Added `tsconfig.json` (extends `expo/tsconfig.base`) and a `typecheck` npm script to run `tsc --noEmit`.
- Introduced explicit prop/step types to the onboarding state machine and plugin preview components to keep navigation intent clear.
- Updated Jest matching to cover `*.test.tsx` and kept Testing Library flows green under fake timers.
- Dev dependencies now include `typescript`, `@types/react`, `@types/react-native`, and `@types/jest` for end-to-end typing.

**2025-09-18 – Design & Component Library Docs**
- Added `docs/design-visual-guide.md` to capture color tokens, typography, and spacing rules for quick reference.
- Created `src/components/ui-library.tsx` that centralizes reusable primitives (logo badge, Card, CTA, GhostButton, Field, Loader) for future screen work.

**2025-09-19 – Login Entry Screen**
- Added a `LoginScreen` state before signup so returning users authenticate without re-entering profile data.
- Captured plugin preview return intent with a `pluginsReturnStep` state so both login-driven previews and post-onboarding previews close back to the correct screen.
- Updated onboarding tests to open the signup path via the new "Create account" secondary action while still validating input gating.
- Replaced the generic spinner with a looping face-scan animation during the creating step, reusing the four `Face Scan` assets to signal identity processing visually.
- Simplified the creating experience to a full-screen face-scan interstitial so users focus on the identity verification motif while setup completes.
- Wired `LocationPromptScreen` to `expo-location`, including async permission handling, retry messaging, and persistence of the returned coordinates for later screens.
- Strengthened password requirements to 15+ characters with mixed case, numeric, and symbolic characters, with inline warning copy when the password falls short.
- Elevated the runtime baseline to Expo SDK 54.0.5 and refreshed allied dependencies (`expo-status-bar`, `expo-location`, `react-native`, `jest-expo`) accordingly.

**What I Implemented**
- Single portable RN app with a state-driven flow (no external nav dependencies) in `MVP - Onboarding, Map/RN_App.jsx`:
  - Sign Up (Register Screen 1 reference): name, email, password, CTA.
  - Address + Callsign: home address, callsign; layout consistent with Sign Up.
  - Selfie (Register Screen 2 reference): simulated camera with circular reticle; on-device privacy note.
  - Creating (Register Screen 3 reference): spinner + four progressing setup steps.
  - Location Prompt (Register Screen 4 reference): reason + Grant/Not now.
  - Notifications feed (Figma frame 128:4419) surfaced from the figma MCP export and wired as an optional post-onboarding screen for mission updates.
- Jest-driven UI flow tests in `expo-dtak-register/__tests__/App.test.js` using jest-expo + Testing Library to enforce the DTAK system prompt copy and progression.
- Reusable components: `Header`, `Card`, `Field`, `CTA`, `GhostBtn` and theme tokens `T`.
- Reference strip rendering thumbnails of the wireframe PNGs for quick visual validation.

**Design System Choices**
- Tokens: bg, surface, border, text, sub, primary, primary2, cta.
- Typography: medium/semibold headers, uppercase labels, 14–16px body.
- Controls: rounded 12–16px corners, large touch targets, strong focus/contrast.

**Assumptions**
- Camera and geolocation interactions are simulated to remain offline‑first.
- Images referenced are available under `MVP - Onboarding, Map/` as `Register Screen {1..4}.png`.

**Next Steps (optional)**
- Swap state machine for React Navigation stack.
- Integrate `react-native-vision-camera` and `react-native-permissions` when runtime allows.
- Add day/night/stealth theme toggles backed by the same token system.
