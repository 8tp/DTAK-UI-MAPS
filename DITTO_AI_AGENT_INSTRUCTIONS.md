# Ditto SDK AI Agent Implementation Instructions

## Quick Start Guide for AI Agents

This document provides step-by-step instructions for implementing offline storage and sync capabilities in a **React Native mobile map application** using the **Ditto SDK**. Use this as a reference when instructing an AI agent to build the system using Ditto's distributed database technology.

## Why Choose Ditto Over Custom SQLite Implementation?

### Key Advantages
- **Zero Sync Configuration**: Automatic synchronization without manual queue management
- **Real-time Updates**: Live queries provide instant UI updates across devices
- **Peer-to-Peer Sync**: Devices can sync directly without internet connectivity
- **Built-in Conflict Resolution**: CRDT-based automatic conflict handling
- **Cross-Platform**: Single codebase works on iOS, Android, Web
- **Offline-First by Design**: No network connectivity required for core functionality

## Implementation Checklist

### Phase 1: Ditto SDK Setup (Priority: High)
- [ ] **Choose JavaScript or TypeScript** based on team preference
- [ ] Install Ditto SDK (`@dittolive/ditto`)
- [ ] Install required permissions package (react-native-permissions)
- [ ] Configure Ditto plugin for Expo (if using Expo)
- [ ] Set up iOS and Android permissions for local networking
- [ ] Configure authentication (onlinePlayground for dev, onlineWithAuthentication for prod)

### Phase 2: Ditto Configuration (Priority: High)
- [ ] Create DittoConfig singleton class
- [ ] Set up authentication identity (playground or production)
- [ ] Configure transport settings for peer-to-peer sync
- [ ] Initialize Ditto instance and start sync
- [ ] Set up error handling for Ditto initialization
- [ ] Configure logging level for debugging

### Phase 3: Data Layer with Ditto (Priority: High)
- [ ] Define MapPoint data structure (TypeScript interface OR JavaScript object schema)
- [ ] Create DittoManager base class
- [ ] Implement PointManager with Ditto CRUD operations
- [ ] Set up collection subscriptions for real-time sync
- [ ] Add data validation for map points
- [ ] Implement soft delete functionality

### Phase 4: Real-time Data Subscriptions (Priority: Medium)
- [ ] Create data hooks with live queries for frontend integration
- [ ] Set up Ditto observers for real-time data updates
- [ ] Implement bounds-based filtering for geographic queries
- [ ] Add category-based filtering capabilities
- [ ] Handle subscription cleanup and memory management
- [ ] Provide loading and error states for frontend consumption

### Phase 5: Sync Management (Priority: Medium)
- [ ] Set up Ditto presence observer for peer detection
- [ ] Create sync status monitoring and reporting
- [ ] Add network connectivity detection
- [ ] Implement background sync handling
- [ ] Monitor sync conflict resolution (automatic with Ditto)
- [ ] Provide sync status data for frontend consumption

### Phase 6: Testing & Optimization (Priority: Low)
- [ ] Create unit tests with mocked Ditto SDK
- [ ] Add integration tests for offline scenarios
- [ ] Test peer-to-peer sync between devices
- [ ] Performance testing with large datasets
- [ ] Test data persistence across app backgrounding
- [ ] Add comprehensive error handling for data operations

## Key Implementation Points

### 1. Ditto Setup and Authentication

**TypeScript Version:**
```typescript
// Essential Ditto initialization
import { Ditto, Identity } from '@dittolive/ditto';

const identity: Identity = {
  type: 'onlinePlayground',
  appID: 'your-app-id',
  token: 'your-token',
};

const ditto = new Ditto(identity);

// Enable all available transports
ditto.updateTransportConfig((config) => {
  config.setAvailablePeerToPeerEnabled(true);
});

await ditto.startSync();
```

**JavaScript Version:**
```javascript
// Essential Ditto initialization
import { Ditto } from '@dittolive/ditto';

const identity = {
  type: 'onlinePlayground',
  appID: 'your-app-id',
  token: 'your-token',
};

const ditto = new Ditto(identity);

// Enable all available transports
ditto.updateTransportConfig((config) => {
  config.setAvailablePeerToPeerEnabled(true);
});

await ditto.startSync();
```

### 2. CRUD Operations with DQL

**Both TypeScript and JavaScript use the same DQL syntax:**
```javascript
// Create
await ditto.store.execute(
  'INSERT INTO map_points DOCUMENTS (:point)',
  { point: newMapPoint }
);

// Read
const result = await ditto.store.execute(
  'SELECT * FROM map_points WHERE _id = :id',
  { id }
);

// Update
await ditto.store.execute(
  'UPDATE map_points SET title = :title WHERE _id = :id',
  { title: newTitle, id }
);

// Delete (soft)
await ditto.store.execute(
  'UPDATE map_points SET isDeleted = true WHERE _id = :id',
  { id }
);
```

### 3. Real-time Subscriptions

```typescript
// Register subscription for sync
await ditto.sync.registerSubscription(
  'SELECT * FROM map_points WHERE isDeleted != true'
);

// Live query observer
const unsubscribe = ditto.store.registerObserver(
  'SELECT * FROM map_points WHERE isDeleted != true',
  {},
  (result) => {
    const points = result.items.map(item => item.value);
    setPoints(points); // Update React state
  }
);
```

## Language Choice Guidance

### TypeScript vs JavaScript Decision

**Choose TypeScript if:**
- Your team is already using TypeScript
- You want better IDE support and type safety
- Team has TypeScript experience

**Choose JavaScript if:**
- Rest of team is using JavaScript
- Want simpler setup and faster development
- Team prefers dynamic typing

**⚠️ Important:** Ensure your entire team uses the same approach to avoid integration issues.

## Ditto-Specific Setup Requirements

### Project Dependencies

**For TypeScript projects:**
```json
{
  "dependencies": {
    "@dittolive/ditto": "^4.7.0",
    "react-native-permissions": "^4.1.5"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-native": "^0.72.0",
    "typescript": "^5.0.0"
  }
}
```

**For JavaScript projects:**
```json
{
  "dependencies": {
    "@dittolive/ditto": "^4.7.0",
    "react-native-permissions": "^4.1.5"
  }
}
```

### Installation Commands

```bash
# Install Ditto SDK
yarn add @dittolive/ditto

# Install supporting packages
yarn add react-native-permissions

# iOS setup
cd ios && pod install && cd ..
```

### Expo Configuration

```json
{
  "expo": {
    "plugins": ["@dittolive/ditto"],
    "ios": {
      "infoPlist": {
        "NSLocalNetworkUsageDescription": "Sync data with nearby devices",
        "NSBonjourServices": ["_ditto._tcp"]
      }
    },
    "android": {
      "permissions": [
        "android.permission.ACCESS_NETWORK_STATE",
        "android.permission.INTERNET",
        "android.permission.ACCESS_WIFI_STATE",
        "android.permission.CHANGE_WIFI_MULTICAST_STATE"
      ]
    }
  }
}
```

### Required Permissions

#### iOS (Info.plist)
```xml
<key>NSLocalNetworkUsageDescription</key>
<string>This app uses the local network to sync data with nearby devices.</string>
<key>NSBonjourServices</key>
<array>
  <string>_ditto._tcp</string>
</array>
```

#### Android (AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.CHANGE_WIFI_MULTICAST_STATE" />
```

## Common Pitfalls to Avoid

1. **Don't forget subscriptions**: Always register sync subscriptions for collections you want to sync
2. **Don't block data operations**: Ditto operations are async - provide proper loading states to frontend
3. **Don't ignore permissions**: Local networking permissions are required for peer-to-peer sync
4. **Don't hardcode credentials**: Use environment variables for app IDs and tokens
5. **Don't skip error handling**: Network and authentication errors can occur
6. **Don't forget cleanup**: Unsubscribe from observers when data hooks unmount
7. **Don't expose raw Ditto objects**: Provide clean data interfaces to frontend components

## Testing Requirements

### Must-Have Tests
1. **Offline Functionality**: Test all CRUD operations without network
2. **Real-time Updates**: Test live query updates and data propagation
3. **Peer-to-Peer Sync**: Test device-to-device synchronization
4. **Authentication**: Test Ditto initialization and auth flows
5. **Error Handling**: Test network failures and recovery
6. **Data Integrity**: Test data consistency across sync operations
7. **Performance**: Test query performance with large datasets

### Test Setup with Mocked Ditto

```typescript
// Mock Ditto SDK for testing
jest.mock('@dittolive/ditto', () => ({
  Ditto: jest.fn().mockImplementation(() => ({
    store: {
      execute: jest.fn(),
      registerObserver: jest.fn(),
    },
    sync: {
      registerSubscription: jest.fn(),
    },
    presence: {
      observe: jest.fn(),
    },
    updateTransportConfig: jest.fn(),
    startSync: jest.fn(),
  })),
}));
```

## Ditto-Specific Performance Guidelines

1. **Use efficient DQL queries** with proper WHERE clauses
2. **Limit query results** with LIMIT clauses for large datasets
3. **Use indexes** on frequently queried fields
4. **Batch operations** when creating multiple documents
5. **Optimize subscriptions** to only sync needed data
6. **Use presence wisely** - don't observe if not needed
7. **Clean up observers** to prevent memory leaks
8. **Use React.memo** for components that render Ditto data

## Ditto-Specific Debugging Tips

1. **Enable Ditto logging** with `Logger.minimumLogLevel = 'Debug'`
2. **Use Ditto Inspector** (if available) for database inspection
3. **Monitor presence graph** to see connected peers
4. **Check sync subscriptions** are properly registered
5. **Verify authentication** tokens and app IDs
6. **Test on physical devices** for peer-to-peer functionality
7. **Use network simulation** to test offline scenarios
8. **Monitor Ditto logs** for sync and conflict resolution

## Success Criteria

The Ditto offline storage and sync implementation is successful when:
- ✅ Data persists across app restarts (automatic with Ditto)
- ✅ All CRUD operations work offline (built-in Ditto feature)
- ✅ Real-time data updates propagate across devices (live queries)
- ✅ Peer-to-peer sync works without internet (Ditto P2P)
- ✅ Data hooks provide instant updates to frontend (observers)
- ✅ No manual sync queue management needed (automatic)
- ✅ Conflicts resolve automatically (CRDT-based)
- ✅ Query performance is good with large datasets (efficient DQL)
- ✅ Clean data interfaces are provided to frontend components
- ✅ Sync status is available for frontend consumption

## Ditto vs SQLite Comparison

| Feature | Custom SQLite | Ditto SDK |
|---------|---------------|-----------|
| Offline Storage | ✅ Manual implementation | ✅ Built-in |
| Sync Management | ❌ Manual queue/retry logic | ✅ Automatic |
| Real-time Updates | ❌ Manual polling/refresh | ✅ Live queries |
| Conflict Resolution | ❌ Manual implementation | ✅ CRDT-based automatic |
| Peer-to-Peer | ❌ Not available | ✅ Built-in |
| Cross-Platform | ❌ Platform-specific code | ✅ Single codebase |
| Setup Complexity | ❌ High (database, sync, etc.) | ✅ Low (SDK handles it) |
| Learning Curve | ❌ High (SQL, sync patterns) | ✅ Medium (DQL, Ditto concepts) |

## Next Steps After Implementation

1. **Monitor sync performance** using Ditto analytics
2. **Optimize queries** based on usage patterns
3. **Add advanced features** like user authentication
4. **Implement data archiving** for old points
5. **Add collaborative features** using real-time sync
6. **Scale to multiple collections** for complex data models
7. **Add offline indicators** and sync status UI
8. **Implement data export/import** functionality

## Advanced Ditto Features to Consider

- **User Authentication**: Integrate with your auth system
- **Data Permissions**: Control who can read/write data
- **Collection Relationships**: Link related documents
- **Attachment Sync**: Sync files and images
- **Custom Conflict Resolution**: Override default CRDT behavior
- **Selective Sync**: Only sync relevant data subsets
- **Backup and Restore**: Export/import Ditto databases
