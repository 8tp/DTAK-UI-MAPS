# TP-2 – Camera Capture and Annotation

## Summary
- Added a dedicated capture → preview → edit flow under `/camera` to let users snap photos, review, and annotate.
- Stored capture state (photo, geo metadata, annotations) in a context so navigation resets cleanly and edit tools share data.
- Annotated images are flattened and optionally resized before saving to the device library, preserving geo-tag metadata separately for mission payloads.

## Key Decisions
- **Expo Camera stack:** used `expo-camera`/`CameraView` for capture to stay inside managed workflow and avoid native modules.
- **State container:** lightweight context instead of global store while feature remains isolated; promotes future reuse in reports/missions.
- **Annotation model:** normalised points keep shapes accurate regardless of render size; edit screen enforces original aspect ratio to avoid skew.
- **Image export:** wrapped editor with `react-native-view-shot` and `expo-image-manipulator` to produce shareable assets ≤1600px width, balancing fidelity with Ditto mesh constraints.

## Follow-ups / Open Questions
1. Determine how annotated output and raw photo should sync to Ditto/TAK (format, queueing, metadata payload).
2. Expand annotation toolset (freehand, color palette, measurement overlays) once UX flows are defined.
3. Consider offline permission rationale messaging so operators understand why location/media access is requested.
4. Add integration tests once an e2e harness exists; currently only pure helpers have automated coverage.
