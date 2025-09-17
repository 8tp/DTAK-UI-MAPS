# AI Agent Instructions: Ditto Mesh Networking Implementation

## Overview
This document provides comprehensive instructions for AI agents implementing P2 Epics (P2-1 through P2-4) using the Ditto SDK for mesh networking capabilities in the dTAK React Native application. The implementation focuses on peer discovery, messaging, and sync deduplication with offline reliability.

## Project Context
- **Platform**: React Native with Expo Router
- **Map Library**: MapLibre React Native
- **Target SDK**: Ditto SDK (https://docs.ditto.live/sdk/latest/home)
- **Architecture**: Mesh networking for offline-first tactical communication

## P2 Epic Requirements

### P2-1: Peer Discovery
**Objective**: Implement automatic peer discovery in mesh network
**Key Features**:
- Auto-join mesh network on app startup
- Share presence and capabilities with nearby peers
- Handle peer connection/disconnection events
- Maintain peer registry with status tracking

### P2-2: Messaging & Data Propagation
**Objective**: Enable real-time message and data sync across mesh
**Key Features**:
- Message propagation via Ditto channels
- Marker and location sharing
- Delivery acknowledgements
- Conflict resolution for concurrent updates

### P2-3: Delivery Acknowledgements
**Objective**: Ensure reliable message delivery tracking
**Key Features**:
- Track message delivery status
- Implement retry mechanisms
- Provide UI feedback for delivery status
- Handle offline queuing

### P2-4: Sync Deduplication
**Objective**: Prevent duplicate data when bridging mesh to TAK Server
**Key Features**:
- Deterministic ID generation
- Deduplication logic for mesh ↔ server sync
- Conflict resolution strategies
- Data integrity validation

## Implementation Guidelines

### 1. Project Setup
```bash
# Install Ditto SDK
npm install @dittolive/ditto

# For React Native, additional native setup required
# Follow platform-specific installation guides
```

### 2. Core Architecture Patterns

#### Ditto Service Layer
Create a centralized service layer to manage all Ditto operations:
- `DittoService.ts` - Main service class
- `DittoTypes.ts` - Type definitions
- `DittoConfig.ts` - Configuration management
- `DittoUtils.ts` - Utility functions

#### Data Models
Define consistent data models for:
- Messages (chat, system notifications)
- Markers (map annotations, POIs)
- Presence (peer status, capabilities)
- Mission data (tactical information)

#### Event Handling
Implement robust event handling for:
- Peer lifecycle events
- Data synchronization events
- Network state changes
- Error conditions

### 3. Integration with Existing React Native App

#### Map Integration
- Integrate mesh-shared markers with MapLibre
- Real-time marker updates across peers
- Offline marker persistence

#### UI Components
- Peer status indicators
- Message delivery status
- Sync progress indicators
- Network health dashboard

#### State Management
- Use React Context or Redux for mesh state
- Persist critical data locally
- Handle offline/online state transitions

### 4. Security Considerations
- Implement encryption for sensitive data
- Validate peer identities
- Secure credential storage
- Data sanitization and validation

### 5. Performance Optimization
- Efficient data serialization
- Batch operations where possible
- Memory management for large datasets
- Background sync optimization

### 6. Error Handling & Resilience
- Graceful degradation when peers disconnect
- Retry mechanisms with exponential backoff
- Data corruption detection and recovery
- Network failure handling

### 7. Testing Strategy
- Unit tests for core Ditto operations
- Integration tests for mesh scenarios
- Offline/online transition testing
- Multi-device testing protocols

## Code Structure Guidelines

### File Organization
```
ditto/
├── services/
│   ├── DittoService.ts
│   ├── PeerDiscoveryService.ts
│   ├── MessagingService.ts
│   └── SyncService.ts
├── models/
│   ├── Message.ts
│   ├── Marker.ts
│   ├── Peer.ts
│   └── SyncData.ts
├── utils/
│   ├── DittoUtils.ts
│   ├── DeduplicationUtils.ts
│   └── ValidationUtils.ts
├── hooks/
│   ├── useDitto.ts
│   ├── usePeers.ts
│   └── useMessaging.ts
├── components/
│   ├── PeerStatus.tsx
│   ├── MessageStatus.tsx
│   └── SyncIndicator.tsx
└── types/
    └── DittoTypes.ts
```

### Naming Conventions
- Use PascalCase for classes and components
- Use camelCase for functions and variables
- Use UPPER_SNAKE_CASE for constants
- Prefix Ditto-specific types with `Ditto`

### Documentation Requirements
- JSDoc comments for all public methods
- README files for each major component
- API documentation with examples
- Troubleshooting guides

## Implementation Phases

### Phase 1: Core Setup (P2-1)
1. Install and configure Ditto SDK
2. Implement basic peer discovery
3. Create peer registry and status tracking
4. Add peer connection/disconnection handlers

### Phase 2: Messaging Foundation (P2-2)
1. Implement basic messaging service
2. Add message propagation via Ditto channels
3. Create marker sharing functionality
4. Implement location broadcasting

### Phase 3: Reliability Features (P2-3)
1. Add delivery acknowledgement system
2. Implement retry mechanisms
3. Create UI feedback components
4. Add offline message queuing

### Phase 4: Sync Optimization (P2-4)
1. Implement deduplication logic
2. Add conflict resolution strategies
3. Create TAK Server bridge
4. Optimize sync performance

## Quality Assurance

### Code Review Checklist
- [ ] Follows established patterns and conventions
- [ ] Includes comprehensive error handling
- [ ] Has appropriate logging and monitoring
- [ ] Includes unit and integration tests
- [ ] Documents public APIs
- [ ] Handles offline scenarios gracefully
- [ ] Implements security best practices
- [ ] Optimizes for performance and memory usage

### Testing Requirements
- Minimum 80% code coverage
- All critical paths tested
- Offline/online transition scenarios
- Multi-peer interaction testing
- Performance benchmarking
- Security vulnerability assessment

## Monitoring & Observability

### Key Metrics
- Peer connection count and stability
- Message delivery success rates
- Sync latency and throughput
- Data deduplication effectiveness
- Battery and memory usage impact

### Logging Strategy
- Structured logging with consistent format
- Different log levels for development/production
- Sensitive data redaction
- Performance metrics collection

## Troubleshooting Guide

### Common Issues
1. **Peer Discovery Failures**
   - Check network permissions
   - Verify Ditto configuration
   - Review firewall settings

2. **Message Delivery Issues**
   - Validate message format
   - Check peer connectivity
   - Review retry logic

3. **Sync Conflicts**
   - Examine conflict resolution rules
   - Check data model consistency
   - Review deduplication logic

4. **Performance Problems**
   - Profile memory usage
   - Analyze sync patterns
   - Optimize data serialization

## Resources & References
- [Ditto SDK Documentation](https://docs.ditto.live/sdk/latest/home)
- [React Native Integration Guide](https://docs.ditto.live/sdk/latest/react-native)
- [Mesh Networking Best Practices](https://docs.ditto.live/concepts/mesh-networking)
- [Conflict Resolution Strategies](https://docs.ditto.live/concepts/conflict-resolution)
