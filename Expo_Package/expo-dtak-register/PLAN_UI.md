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
