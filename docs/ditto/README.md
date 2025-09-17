# Ditto Mesh Networking Implementation

This directory contains comprehensive documentation and implementation guides for integrating Ditto SDK mesh networking capabilities into the dTAK React Native application, enabling offline-first tactical communication.

## Documentation Overview

### 📋 [AI Agent Instructions](./ai-agent-instructions.md)
Comprehensive guide for AI agents implementing P2 Epics (P2-1 through P2-4) with the Ditto SDK. Includes:
- Project setup and architecture patterns
- Implementation phases and quality assurance
- Code structure guidelines and naming conventions
- Testing strategies and troubleshooting guides

### 🔍 [Peer Discovery Implementation (P2-1)](./peer-discovery-implementation.md)
Detailed implementation for automatic peer discovery in mesh networks:
- Ditto service setup and configuration
- Peer presence broadcasting and monitoring
- React hooks and UI components for peer status
- Platform-specific permissions and configuration

### 💬 [Messaging Implementation (P2-2 & P2-3)](./messaging-implementation.md)
Complete messaging system with offline reliability:
- Message data models (chat, location, markers, system)
- Delivery acknowledgements and retry mechanisms
- Real-time message propagation via Ditto channels
- Integration with MapLibre for marker sharing

### 🔄 [Sync Deduplication (P2-4)](./sync-deduplication-implementation.md)
Advanced deduplication and conflict resolution for mesh-to-server sync:
- Deterministic ID generation for data integrity
- Conflict detection and resolution strategies
- TAK Server bridge implementation
- Data normalization and hash-based deduplication

## P2 Epic Requirements

| Epic | Description | Status | Documentation |
|------|-------------|--------|---------------|
| P2-1 | Peer Discovery | ✅ Complete | [peer-discovery-implementation.md](./peer-discovery-implementation.md) |
| P2-2 | Messaging & Data Propagation | ✅ Complete | [messaging-implementation.md](./messaging-implementation.md) |
| P2-3 | Delivery Acknowledgements | ✅ Complete | [messaging-implementation.md](./messaging-implementation.md) |
| P2-4 | Sync Deduplication | ✅ Complete | [sync-deduplication-implementation.md](./sync-deduplication-implementation.md) |

## Quick Start

### 1. Install Dependencies
```bash
cd dTAK
npm install @dittolive/ditto
npm install react-native-device-info
```

### 2. Platform Configuration

#### iOS Setup
```ruby
# ios/Podfile
pod 'DittoObjC', '~> 4.0'
```

#### Android Setup
```gradle
# android/app/build.gradle
implementation 'live.ditto:ditto:4.+'
```

### 3. Initialize Ditto Service
```typescript
import { DittoService } from './ditto/services/DittoService';

// In your app initialization
const dittoService = DittoService.getInstance();
await dittoService.initialize('your-app-id', 'your-playground-token');
```

### 4. Add Mesh Networking to Your App
```typescript
import { usePeerDiscovery } from './ditto/hooks/usePeerDiscovery';
import { useMessaging } from './ditto/hooks/useMessaging';

export function App() {
  const { peers, startDiscovery } = usePeerDiscovery();
  const { sendChatMessage, sendMarker } = useMessaging();

  useEffect(() => {
    startDiscovery();
  }, []);

  // Your app components
}
```

## Architecture Integration

The Ditto implementation integrates seamlessly with the existing dTAK architecture:

- **Mobile Client Layer**: React Native app with MapLibre integration
- **Mesh Fabric**: Ditto SDK providing peer-to-peer communication
- **Data Synchronization**: Offline-first with eventual consistency
- **TAK Server Bridge**: Deduplication and conflict resolution for server sync

## Key Features

### 🌐 Mesh Networking
- Automatic peer discovery via Bluetooth LE, WiFi, and AWDL
- Real-time presence sharing and capability broadcasting
- Robust connection management with reconnection logic

### 📱 Offline-First Messaging
- Chat messages with delivery acknowledgements
- Location sharing and real-time tracking
- Map marker collaboration across peers
- Retry mechanisms with exponential backoff

### 🔄 Data Synchronization
- Deterministic ID generation for conflict-free replication
- Last-write-wins and merge-based conflict resolution
- Efficient deduplication using content hashing
- Seamless mesh-to-server synchronization

### 🗺️ Map Integration
- Real-time marker sharing on MapLibre maps
- Location broadcasting and peer tracking
- Offline map annotation collaboration
- Tactical overlay synchronization

## Security Considerations

- End-to-end encryption for sensitive tactical data
- Peer identity validation and authentication
- Secure credential storage for TAK Server integration
- Data sanitization and input validation

## Performance Optimization

- Efficient data serialization and compression
- Battery-optimized background sync
- Memory management for large datasets
- Bandwidth-aware sync strategies

## Testing & Validation

Each implementation includes comprehensive testing strategies:
- Unit tests for core functionality
- Integration tests for multi-peer scenarios
- Offline/online transition testing
- Performance and battery usage monitoring

## Troubleshooting

Common issues and solutions are documented in each implementation guide:
- Peer discovery failures and network configuration
- Message delivery issues and retry logic
- Sync conflicts and resolution strategies
- Performance optimization techniques

## Contributing

When extending or modifying the Ditto implementation:
1. Follow the established patterns and conventions
2. Include comprehensive error handling and logging
3. Add appropriate unit and integration tests
4. Update documentation with any API changes
5. Consider offline scenarios and edge cases

## Resources

- [Ditto SDK Documentation](https://docs.ditto.live/sdk/latest/home)
- [React Native Integration Guide](https://docs.ditto.live/sdk/latest/react-native)
- [Mesh Networking Best Practices](https://docs.ditto.live/concepts/mesh-networking)
- [Conflict Resolution Strategies](https://docs.ditto.live/concepts/conflict-resolution)

---

This implementation enables robust, offline-first tactical communication through mesh networking, ensuring reliable data synchronization and collaboration even in challenging network environments.
