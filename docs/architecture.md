# Architecture Overview

## Platform Layers
- **Mobile Client (React Native):** Hosts offline map UI, chat experiences, mission tools, and onboarding flows. Integrates Ditto SDK for mesh sync and TAK Client libraries for server interoperability. Maintains encrypted local stores for tiles, mission data, and queued messages.
- **Sync & Collaboration Services:**
  - **Ditto Mesh Fabric (P2-1 – P2-4):** Peer discovery, conflict resolution, and replication queues for offline-to-offline communication.
  - **TAK Server (TS-1 – TS-3):** Authentication endpoints, CoT feeds, attachment sharing, and presence tracking for connected operations.
  - **Mission Data Service (TP-1 – TP-4):** Aggregates markers, logs, geo-tagged media, and settings for multi-device consistency.
- **Map Tile Pipeline (OM-6, OM-10, OM-11):** Generates raster/vector tiles, validates integrity, and publishes to S3 with versioned manifests for download clients.
- **Messaging & Notifications (CH-1 – CH-5):** Chat routing, attachment storage, and push notification gateway integrated with both mesh and TAK pathways.
- **Observability:** Centralized logging, metrics, and alerting for download rates, sync health, push delivery, and authentication failures.

## Data Stores
- **Local Mobile Storage:**
  - Tile cache per region with resumable download metadata (OM-1 – OM-6).
  - Local mission data store for markers, shapes, chat history, and geo-tagged assets pending sync (TP-1 – TP-2, CH-*).
  - Credential vault for TAK auth tokens and mesh identities (TS-1, P2-*).
- **Cloud & Edge Storage:**
  - S3 buckets for tiles and attachments with signed URL distribution (OM-11, CH-3).
  - TAK Server data stores for CoT messages and attachments.
  - Optional CDN caches to accelerate tile delivery when connected.

## Key Flows
### Offline Map Lifecycle (OM Series)
1. **Tile Production:** Automated job renders tiles (OM-10) and validates checksums.
2. **Distribution:** Tiles uploaded to S3 with region manifests (OM-11); CDN invalidation triggered when new versions deploy.
3. **Client Download:** Users select regions (OB-1); app requests manifests, downloads tiles with pause/resume (OM-1, OM-6), and surfaces status indicators (OM-2).
4. **Usage:** Map rendering engine consumes local cache, enabling search (OM-3), markers (OM-4), shapes (OM-7 – OM-9), and measurement tools (OM-11).

### Mesh ↔ TAK Sync Strategy (P2 & TS Series)
1. **Discovery:** Ditto peers auto-join mesh (P2-1) sharing presence + capabilities.
2. **Local Collaboration:** Messages, markers, and locations propagate via Ditto channels (P2-2) with delivery acknowledgements (P2-3).
3. **Bridging:** When connectivity returns, sync orchestrator deduplicates updates between mesh queues and TAK Server (P2-2 concerns) using deterministic IDs.
4. **Server Sync:** TAK Client authenticates (TS-1), pushes local deltas, and streams remote updates to the device (TS-2, TS-3).

### Chat & Mission Data (CH & TP Series)
1. **Composition:** Users send chats or geo-tagged media; payloads stored locally until delivered (CH-1 – CH-3, TP-2).
2. **Transport Selection:** Offline -> Ditto mesh, Online -> TAK/Server push; fallback ensures single authoritative delivery.
3. **Feedback:** UI shows delivery status and retry actions (CH-4) plus push notifications for new activity (CH-5).
4. **Mission Sync:** Mission data service aggregates attachments, markers, and logs for cross-device continuity (TP-1, TP-3, TP-4).

## Integration Concerns
- **Shape Drawing (OM-7 – OM-9):** Clarify requirements on circle sizing and grid customization; architecture should allow configurable renderers.
- **Ditto SDK Bridging (P2-4):** Maintain a thin native module with typed interfaces shared across features; handle schema evolution centrally.
- **Security Envelope:** Encrypt tiles and cached mission data; apply least-privilege IAM for S3 and push services; rotate TAK credentials regularly.
- **Observability & Telemetry:** Emit metrics for download throughput, mesh connection counts, sync latency, and push success to enable proactive operations.

## Future Considerations
- Support incremental delta updates for tiles to minimize bandwidth.
- Introduce event-sourced audit logs for mission updates to aid after-action reviews.
- Evaluate modularization of the React Native app to isolate map, chat, and mission features for faster iteration.
