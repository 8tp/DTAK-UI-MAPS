# UI Changelog (Registration Screens)

Date: 2025-09-18

## Updated
- Migrated Expo shell components to TypeScript: `App.tsx`, `MapPluginsScreen.tsx`, and test suite `__tests__/App.test.tsx`.
- Added `tsconfig.json`, Jest test match coverage for `*.test.tsx`, and a `typecheck` npm script.
- Refined CTA/Touchable accessibility roles so Testing Library can target buttons via `getByRole`.
- `package.json` now declares TypeScript/tooling devDependencies (`typescript`, `@types/react`, `@types/react-native`, `@types/jest`).

## Notes
- New dev dependencies require an `npm install`; infra with restricted network must pull packages before running `npm run typecheck` or `npm test`.

Date: 2025-09-17

## Added
- `expo-dtak-register/MapPluginsScreen.tsx`: React Native translation of the Map Plugins frame for the Expo flow.
- `MVP - Onboarding, Map/MapPluginsScreen.jsx`: Tailwind React screen mirroring Figma frame `128:4016` (TAK Screens) fetched through the figma MCP integration.
- jest-expo test harness + Testing Library coverage in `expo-dtak-register/__tests__/App.test.tsx` to lock mission copy and step flow derived from DTAK_System_Prompt.md.
- `MVP - Onboarding, Map/RN_App.jsx`: Notifications feed (Figma frame `128:4419`) reachable post-onboarding via the new "View mission notifications" CTA.

- `PLAN_UI.md` to record the new automated UI verification work.
- `expo-dtak-register/App.tsx` now exposes a `Preview plugins` CTA that routes to the native implementation post-onboarding.
- Added optional notifications state transition inside `MVP - Onboarding, Map/RN_App.jsx` so field teams can inspect the MCP-derived feed without leaving the onboarding shell.

## Notes
- Placeholder map imagery uses `placehold.co` assets so we can swap in offline tile exports later without touching layout.
- Section headers reuse the "View more" pill to stay faithful to MCP nodes `Group 809/810`.
- Plugin status tiles echo the MCP-exported component variants (`check_selected`, `visibility_partial`) to ease future componentization.


Date: 2025-09-16

## Added
- `MVP - Onboarding, Map/RN_App.jsx`: React Native single-file app implementing five high-fidelity registration screens.
  - Sign Up (Register Screen 1 basis): name, email, password, amber CTA.
  - Address + Callsign: home address and callsign input; mirrored layout from Sign Up.
  - Selfie (Register Screen 2 basis): simulated camera preview with circular reticle, privacy note.
  - Creating (Register Screen 3 basis): loading spinner with staged status list.
  - Location Prompt (Register Screen 4 basis): access rationale with Grant/Not now actions.
- `PLAN_UI.md`: Plan describing decisions, tokens, components, and next steps.
 - `expo-dtak-register/` Expo starter project with `App.js` embedding the same flow for quick run/testing.
 - Static exports (SVG mocks) under `MVP - Onboarding, Map/exports/`:
   - `screen-signup.svg`
   - `screen-address.svg`
   - `screen-selfie.svg`
   - `screen-creating.svg`
   - `screen-location.svg`

## Design
- Color/typography follow Frame screens (269/270/271/273): dark surfaces, cobalt/indigo primary accents, blue call-to-action (updated), high-contrast and larger type.
- Reusable components: `Header`, `Card`, `Field`, `CTA`, `GhostBtn` to ensure consistency across screens.

## Notes
- Camera and geolocation are simulated to preserve offline-first behavior per DTAK constraints.
- Wireframe PNGs `Register Screen 1-4.png` are referenced as thumbnails in-app for quick comparison.

## 2025-09-16 Update
- Adjusted exported SVG aspect to iPhone 16 Pro canvas: 440x956.
- Increased font sizes for readability (body 18, sub 14, labels 12).
- Updated CTA buttons to Frame blue (`#4f6bff`).
- Mirrored type scale and blue CTAs inside the live Expo app (`expo-dtak-register/App.js`) and RN single-file (`MVP - Onboarding, Map/RN_App.jsx`).
- Centered primary component cards vertically in both RN apps (ScrollView `contentContainerStyle` with `justifyContent:'center'`).
- Centered composition in SVG exports using grouped `transform` to shift cards into the middle; refined optical centering by adjusting offsets:
  - signup/address/creating/location: translateY=180
  - selfie: translateY=170 (accounts for taller camera panel)
