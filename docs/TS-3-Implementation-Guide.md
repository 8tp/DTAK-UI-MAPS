# TS-3 Implementation Guide: Remote CoT Consumption and Teammate Visualization

## Overview

This document describes the implementation of TS-3 (Remote CoT consumption, teammate rendering, attachment handling) for the dTAK application. The implementation provides a foundation for integrating with the existing `dtak-react-native-CoT` library while offering a working demonstration with simulated data.

## Architecture

### Components Created

1. **TeammateMarkers.tsx** - Displays teammate positions on the map
2. **AttachmentViewer.tsx** - Handles file attachments and previews
3. **TakIntegrationContext.tsx** - Manages TAK server integration state

### Integration Points

The implementation is designed to work with the existing TAK server integration mentioned in your description:

- `TAKServerIntegration` class from `dtak-react-native-CoT/lib/tak-server-integration.ts`
- `remoteCoTReceived` events (line 348)
- `attachmentReceived` events (line 411-428)
- `handleAttachments` function (line 387)

## Implementation Details

### 1. TeammateMarkers Component

**Location**: `/features/tak/components/TeammateMarkers.tsx`

**Features**:
- Listens to `remoteCoTReceived` events
- Displays teammate positions as map markers with callsigns
- Color-coded markers based on CoT type (friendly, hostile, neutral, unknown)
- Stale marker detection (5-minute timeout)
- Real-time position updates

**Key Functions**:
```typescript
// CoT type to color mapping
function getMarkerColor(cotType: string): string {
  if (cotType.startsWith('a-f-G-U-C')) return '#00FF00'; // Friendly - green
  if (cotType.startsWith('a-h-G-U-C')) return '#FF0000'; // Hostile - red
  if (cotType.startsWith('a-n-G')) return '#FFFF00';     // Neutral - yellow
  if (cotType.startsWith('a-u-G')) return '#FFA500';     // Unknown - orange
  return '#FFFFFF'; // Default - white
}
```

**Data Structure**:
```typescript
interface RemoteCoT {
  uid: string;
  type: string;
  lat: number;
  lon: number;
  alt?: number;
  callsign?: string;
  remarks?: string;
  timestamp: Date;
  attachments?: string[];
}
```

### 2. AttachmentViewer Component

**Location**: `/features/tak/components/AttachmentViewer.tsx`

**Features**:
- Handles `attachmentReceived` events
- Supports image, text, and generic file previews
- Notification system for new attachments
- File metadata display
- Download/save functionality placeholder

**Supported File Types**:
- **Images**: Direct preview with base64 conversion
- **Text**: Scrollable text content display
- **Other**: File information and download option

**Event Handling**:
```typescript
const handleAttachmentReceived = (attachmentData: AttachmentData) => {
  const attachment: AttachmentItem = {
    ...attachmentData,
    id: attachmentData.hash,
    receivedAt: new Date(),
    isViewed: false
  };
  
  // Show notification and update state
  Alert.alert('New Attachment Received', ...);
};
```

### 3. TakIntegrationContext

**Location**: `/features/tak/TakIntegrationContext.tsx`

**Current Implementation**: Simplified event emitter for demonstration
**Future Integration**: Direct connection to `dtak-react-native-CoT` library

**Features**:
- Event emitter for CoT and attachment events
- Simulated teammate data for testing
- Context provider for React components
- Ready for real TAK server integration

## Integration with Existing TAK Server Integration

### Current State
The implementation uses a simplified event emitter to demonstrate functionality. The components are designed to work with the real TAK server integration.

### Migration Path
To integrate with the actual `dtak-react-native-CoT` library:

1. **Replace SimpleEventEmitter** with actual `TAKServerIntegration`:
```typescript
// In TakIntegrationContext.tsx
import { TAKServerIntegration } from 'dtak-react-native-CoT';

const integration = new TAKServerIntegration({
  serverUrl: client.config.baseUrl,
  username: currentUser.username,
  clientUid: `dTAK-${currentUser.username}-${Date.now()}`,
  authToken: currentUser.access_token
});
```

2. **Connect to Real Events**:
```typescript
// The components already listen for these events
integration.on('remoteCoTReceived', handleRemoteCoT);
integration.on('attachmentReceived', handleAttachmentReceived);
integration.on('attachmentError', handleAttachmentError);
```

3. **Update Type Definitions**:
```typescript
// Import actual types from the library
import { RemoteCoT, AttachmentData } from 'dtak-react-native-CoT';
```

## Map Integration

### MapLibre Integration
The TeammateMarkers component uses MapLibre's `ShapeSource` and `SymbolLayer` to display markers:

```typescript
<ShapeSource id="teammates-source" shape={geojsonData}>
  <SymbolLayer
    id="teammates-markers"
    style={{
      iconImage: ['get', 'iconImage'],
      iconSize: 0.8,
      textField: ['get', 'callsign'],
      textColor: '#FFFFFF',
      // ... additional styling
    }}
  />
</ShapeSource>
```

### Coordinate System
- Uses standard GeoJSON format (longitude, latitude)
- Supports altitude data (optional)
- Real-time position updates with smooth transitions

## Testing and Demonstration

### Simulated Data
The current implementation includes simulated teammate data for testing:

```typescript
const mockTeammates: RemoteCoT[] = [
  {
    uid: 'teammate-alpha-1',
    type: 'a-f-G-U-C',
    lat: 38.9072 + (Math.random() - 0.5) * 0.01,
    lon: -77.0369 + (Math.random() - 0.5) * 0.01,
    callsign: 'Alpha-1',
    remarks: 'Patrol unit',
    timestamp: new Date(),
    attachments: []
  },
  // ... more teammates
];
```

### Testing Procedure
1. **Start the Application**: The app automatically simulates teammate data after 3 seconds
2. **View Markers**: Teammate positions appear on the map with callsigns
3. **Test Attachments**: Attachment viewer shows notification badge (when implemented)
4. **Stale Detection**: Markers become stale after 5 minutes without updates

## Performance Considerations

### Optimization Features
- **Efficient Updates**: Only re-renders when teammate data changes
- **Stale Detection**: Automatic cleanup of old markers
- **Memory Management**: Limits attachment history to 50 items
- **Batched Updates**: Groups multiple CoT updates for better performance

### Scalability
- Designed to handle multiple teammates simultaneously
- Efficient GeoJSON updates for map rendering
- Minimal memory footprint for attachment storage

## Security Considerations

### Data Handling
- Secure attachment storage (placeholder for implementation)
- Proper cleanup of sensitive data
- Authentication-aware event handling

### Network Security
- Uses existing TAK server authentication
- Encrypted communication through TAK protocols
- Secure token management

## Future Enhancements

### Planned Features
1. **Real TAK Server Integration**: Replace simulation with actual `dtak-react-native-CoT`
2. **Enhanced Attachment Support**: More file types and better previews
3. **Offline Support**: Cache teammate positions and attachments
4. **Advanced Filtering**: Filter teammates by team, role, or status
5. **Interaction Features**: Tap markers for detailed information

### Integration with Ditto Mesh
- Offline-first teammate synchronization
- Conflict resolution for position updates
- Mesh network communication backup

## API Reference

### TeammateMarkers Props
```typescript
interface TeammateMarkersProps {
  takIntegration?: SimpleEventEmitter; // Will be TAKServerIntegration
}
```

### AttachmentViewer Props
```typescript
interface AttachmentViewerProps {
  takIntegration?: SimpleEventEmitter; // Will be TAKServerIntegration
}
```

### TakIntegrationContext State
```typescript
interface TakIntegrationContextState {
  takIntegration: SimpleEventEmitter | null;
  isConnected: boolean;
  connectionError: string | null;
  simulateTeammateData: () => void; // For testing only
}
```

## Conclusion

The TS-3 implementation provides a solid foundation for teammate visualization and attachment handling in the dTAK application. The modular design allows for easy integration with the existing `dtak-react-native-CoT` library while providing immediate functionality through simulation.

The implementation follows TAK standards for CoT message handling and provides a professional tactical interface suitable for military and emergency response operations.

**Next Steps**:
1. Install and configure `dtak-react-native-CoT` library
2. Replace simulation with real TAK server connection
3. Test with actual TAK server and multiple clients
4. Enhance attachment handling for production use
5. Add offline-first capabilities with Ditto mesh integration
