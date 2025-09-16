# dTAK

dTAK is a lightweight, offline-capable TAK client that supports map operations, peer comms, and resilient sync over intermittent or no-internet networks.

## Prefix glossary
- **OM** — Offline Maps & Overlays  
- **CH** — Chat / Messaging  
- **TS** — TAK Server integration  
- **TP** — App plumbing (sync, settings, connectivity) & media capture  
- **OB** — Onboarding & permissions  
- **P2** — Peer-to-peer / mesh

---

## User Stories by Area

### OM — Offline Maps & Overlays
- **OM-1**: Download a map region for offline use  
- **OM-2**: Show whether the current map is offline or online  
- **OM-3**: Search streets or landmarks within downloaded regions  
- **OM-4**: View & drop markers (CoT points) on the offline map  
- **OM-5**: Share one or more points and shapes on a map  
- **OM-6**: Preload zoom levels 0–10  
- **OM-7**: Draw circle  
- **OM-8**: Draw square  
- **OM-9**: Draw grid  
- **OM-10**: Generate map tiles  
- **OM-11**: Measure distances

### CH — Chat / Messaging
- **CH-1**: Send text messages to a chat room  
- **CH-2**: Direct message a selected peer  
- **CH-3**: Attach images/files to chat messages  
- **CH-4**: View delivery status & resend failed messages  
- **CH-5**: Receive push notifications for new messages

### TS — TAK Server Integration
- **TS-1**: Log into a TAK Server using credentials and server URL  
- **TS-2**: Sync my location and markers with the TAK Server when connectivity exists  
- **TS-3**: View other team members on the map and open their shared attachments

### TP — App Plumbing, Settings & Media
- **TP-1**: Synchronize mission data (markers, files, logs, chat) across devices, including after reconnecting from offline  
- **TP-2**: Capture geo-tagged photos and markup (circles, arrows, text) before sharing with team  
- **TP-3**: Settings screen with a “dark mode” switch  
- **TP-4**: Network connectivity handling

### OB — Onboarding & Permissions
- **OB-1**: Select a region for maps  
- **OB-2**: Prompt for necessary permissions (precise location, push notifications, etc.)

---

## Notes
- Stories use standard **Given/When/Then** with a **Definition of Done** (tests, reviews, docs), where applicable.
- This README is a condensed view of the Trello board and is meant to guide scoping, sequencing, and implementation.
