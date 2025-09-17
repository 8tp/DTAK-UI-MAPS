# dTAK Engineering Handbook

## Purpose
The dTAK program delivers an offline-first tactical awareness kit built with React Native and supporting services. The product must provide resilient mapping, mesh-based collaboration, TAK Server interoperability, robust chat, and intuitive onboarding for teams operating with intermittent connectivity.

## Product Pillars
- **Offline Maps (OM-1 – OM-11):** Region download, tile generation + S3 delivery, markers, measurement, and drawing tools that work without network access.
- **Mesh Networking (P2-1 – P2-4):** Ditto SDK-backed peer discovery and synchronization to keep locations, markers, and chat flowing when disconnected.
- **TAK Server Sync (TS-1 – TS-3):** Secure authentication and two-way sync of user data, attachments, and situational awareness when connectivity exists.
- **Collaboration Suite (CH-1 – CH-5, TP-1 – TP-4):** Chat rooms, direct messages, attachments, mission data sync, geo-tagged photos, and settings management.
- **Onboarding Experience (OB-1 – OB-3):** Region selection, permissions prompts, and profile setup to prepare devices for operational use.

## System Snapshot
Refer to `docs/architecture.md` for the full view. At a glance:
- **Client:** React Native application with offline storage, Ditto mesh integration, and TAK Server client.
- **Services:** Tile generation pipeline, S3 asset hosting, TAK Server endpoints, push notification and messaging services.
- **Data Stores:** Local mobile caches (tiles, mission data), cloud object storage for tiles/attachments, enumerated sync queues.
- **Telemetry & Ops:** Observability for downloads, sync reconciliation, mesh health, and push delivery.

## Working Model
- **Plan → Develop → Test → Fix:** Shared workflow described in `docs/engineering_process.md` to protect delivery quality.
- **Documentation:** Additional deep dives live under `docs/` and role-specific prompt guidance under `role_prompts/`.
- **Backlog Integration:** Ticket references follow the Trello export (`OM-*`, `P2-*`, `TS-*`, `CH-*`, `TP-*`, `OB-*`).

## Directory Guide
- `docs/architecture.md` – Platform architecture, component responsibilities, data flows.
- `docs/workstreams.md` – Feature breakdown, dependencies, and open questions per ticket cluster.
- `docs/engineering_process.md` – Development lifecycle, roles, communication expectations.
- `docs/testing_strategy.md` – QA scope, automation, and validation requirements.
- `role_prompts/` – System prompts tailored for each cross-functional role plus a shared context prompt.

## Getting Started Checklist
1. Read the architecture and workstreams docs to understand technical scope and priorities.
2. Align with the engineering process to follow consistent Plan → Develop → Test → Fix practices.
3. Load the appropriate role prompt (or the generic system prompt) into your LLM tooling for contextual assistance.
4. Capture new decisions in Architecture Decision Records (ADRs) and update docs as tickets progress.

## Contributing
- Keep documentation current when backlog items move or implementation decisions change.
- Reference ticket IDs in commits, designs, and test plans for traceability.
- Coordinate with Security, DevOps, QA, and UX counterparts when changes span their domains.
