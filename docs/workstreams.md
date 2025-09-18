# Workstreams & Backlog Synopsis

## Offline Maps (OM-1 – OM-11)
- **OM-1:** Enable region downloads with offline persistence and quota management.
- **OM-2:** Surface clear online/offline indicators throughout the UI.
- **OM-3:** Provide offline search for streets/landmarks within cached regions.
- **OM-4:** Allow viewing/placing CoT markers on offline maps.
- **OM-5:** Share points and shapes from offline context once connectivity returns.
- **OM-6:** Preload zoom levels 0–10 to ensure base map coverage.
- **OM-7:** Implement circle drawing; clarify whether size is free-form drag (open question from John Schell & Daniel Chantland).
- **OM-8:** Provide square drawing tools.
- **OM-9:** Deliver grid overlays; outstanding questions on overlay vs. free draw and customization (Alec Paxton & Daniel Chantland).
- **OM-10:** Generate map tiles via automation with validation.
- **OM-11:** Publish tiles to S3 and support distance measurement tooling.

**Dependencies & Risks**
- Tile generation (OM-10) and S3 publication (OM-11) unblock user-facing downloads (OM-1 – OM-6).
- Drawing tools rely on resolved UX requirements (OM-7 – OM-9) and consistent geo utilities shared with mission tooling.

## Mesh Networking (P2-1 – P2-4)
- **P2-1:** Auto-discover nearby devices and join mesh; concern about Ditto integration consistency across components.
- **P2-2:** Share location, markers, and chat in offline mode; avoid duplicates when TAK connectivity resumes (suggested dedupe IDs).
- **P2-3:** Indicate which peers received updates; question on TAK broadcast behavior vs. chat plugin reliance.
- **P2-4:** Bridge Ditto SDK into React Native with minimal native code; integration consistency noted as risk.

**Dependencies & Risks**
- Requires shared data schemas with TAK sync to prevent divergence.
- Needs observability into mesh health for troubleshooting.

## TAK Server Integration (TS-1 – TS-3)
- **TS-1:** Authenticate with TAK Server via credentials and server URL.
- **TS-2:** Sync location/markers when online.
- **TS-3:** Display team members and shared attachments from TAK.

**Dependencies & Risks**
- Must coordinate with Security for credential handling and with Mesh team for dedupe across transports.
- Attachment support touches mission data storage and UI rendering.

## Chat & Mission Collaboration (CH-1 – CH-5, TP-1 – TP-4)
- **CH-1 – CH-5:** Text chat (rooms + DMs), attachments, delivery tracking, resend, and push notifications.
- **TP-1:** Synchronize mission data across devices even after offline reconnection.
- **TP-2:** Capture geo-tagged photos with markup tools.
- **TP-3:** Provide settings screen including dark mode.
- **TP-4:** Present network connectivity controls/status (profile menu indicator via connectivity provider).
- **Mission-Service Dependencies:** Chat infrastructure feeds mission logs; attachments rely on S3 + CDN strategy and encryption.

## Onboarding (OB-1 – OB-3)
- **OB-1:** Region selection for maps.
- **OB-2:** Prompt for necessary permissions (location, push, others) with clear messaging.
- **OB-3:** Collect profile information (picture, name, callsign, optional home location).

**Dependencies & Risks**
- Onboarding must configure downloads, permissions, and profile data before mission features unlock.
- Coordinates with Security (data handling) and UX (trust-building flows).

## Cross-Cutting Themes
- **Plan → Develop → Test → Fix:** Apply the shared workflow to keep delivery predictable (see docs/engineering_process.md).
- **Security:** Ensure encryption for cached tiles, mission data, credentials, and attachments.
- **Observability:** Instrument download metrics, mesh delivery, TAK sync status, and push notification outcomes.
- **Documentation:** Update ADRs, API contracts, and user guides as requirements solidify (especially ambiguous drawing and dedupe behaviors).
