# Engineering Process & Collaboration

## Lifecycle: Plan → Develop → Test → Fix
1. **Plan**
   - Break tickets into incremental deliverables linked to Trello IDs.
   - Surface requirements gaps, especially for drawing tools (OM-7 – OM-9) and mesh dedupe (P2-2).
   - Align dependencies with DevOps (tile pipeline, S3), Security (credential policies), UX (interaction design), and QA (test data).
2. **Develop**
   - Implement behind feature flags where feasible; keep modules decoupled for offline map, mesh, chat, and mission domains.
   - Document architecture decisions (ADRs), API contracts, and schema updates.
   - Pair with relevant roles when bridging native code (P2-4) or altering shared data models.
3. **Test**
   - Cover unit, integration, and end-to-end scenarios; simulate offline/online transitions, mesh-only collaboration, and TAK reconnection.
   - Ensure observability hooks emit metrics/logs for new flows.
   - QA to run acceptance suites derived from docs/testing_strategy.md.
4. **Fix**
   - Triage defects with priority on mission-critical regressions (map availability, sync failures, chat delivery).
   - Capture lessons learned in retrospectives and update documentation/runbooks.
   - Feed recurring issues into backlog grooming for preventative improvements.

## Role Collaboration
- **Tech Lead:** Guards architecture alignment, reviews cross-cutting changes, and facilitates ADR creation.
- **Senior Developers:** Own module-level design, code quality, and mentoring across feature teams.
- **Project Manager:** Maintains roadmap, resolves dependencies, and tracks risk mitigation actions.
- **QA Engineer:** Designs coverage, validates edge cases, and maintains automated suites.
- **DevOps Engineer:** Oversees CI/CD, infrastructure automation, observability, and S3/tile pipelines.
- **Security Expert:** Reviews authentication, encryption, data handling, and compliance.
- **UX/UI Designer:** Ensures consistent, accessible experiences and resolves open UX questions.
- **DBA:** Manages schemas, indexing, replication policies, and data lifecycle.

## Communication Rituals
- **Backlog Refinement:** Confirm requirements, acceptance criteria, and dependencies before sprint commitment.
- **Daily Syncs/Async Updates:** Highlight blockers on tile generation, mesh dedupe, or TAK integration.
- **Demo/Review:** Showcase offline and online flows; gather feedback from security and operations stakeholders.
- **Incident Reviews:** Document failures (e.g., failed S3 upload, mesh partition) and update runbooks/testing.

## Documentation Expectations
- Update `docs/` artifacts when architecture, workflows, or dependencies shift.
- Record major decisions and rationale in ADRs stored alongside the codebase.
- Maintain API/Schema references so Ditto mesh and TAK Server integrations stay aligned.
