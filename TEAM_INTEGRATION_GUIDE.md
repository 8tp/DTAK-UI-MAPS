# Team Integration Guide - Ditto Offline Storage & Sync

## Overview

This guide outlines the integration contracts, naming conventions, and collaboration guidelines for integrating the Ditto offline storage layer with the frontend map components.

## Data Contracts & Interfaces

### Core Data Structure

**MapPoint Object (Consistent across all components):**
```javascript
// Standard MapPoint structure - ALL team members should use this exact format
const mapPoint = {
  _id: "point_1642123456789_abc123",     // Unique identifier (string)
  latitude: 40.7128,                     // Number (required)
  longitude: -74.0060,                   // Number (required)
  title: "Central Park",                 // String (required)
  description: "Beautiful park in NYC",  // String (optional)
  category: "park",                      // String (optional)
  color: "#4CAF50",                      // Hex color string (optional)
  icon: "park-icon",                     // String identifier (optional)
  createdAt: "2024-01-14T10:30:00.000Z", // ISO timestamp string
  updatedAt: "2024-01-14T10:30:00.000Z", // ISO timestamp string
  isDeleted: false                       // Boolean (for soft deletes)
};
```

### Geographic Bounds Structure

```javascript
// For map viewport filtering - use this exact structure
const geoBounds = {
  northEast: {
    latitude: 40.7829,   // Number
    longitude: -73.9441  // Number
  },
  southWest: {
    latitude: 40.7489,   // Number
    longitude: -74.0441  // Number
  }
};
```

## Data Layer API Contract

### Hook Interface for Frontend Integration

```javascript
// useMapPoints hook - what frontend team will use
const {
  points,           // Array of MapPoint objects
  loading,          // Boolean - true while loading data
  error,            // String or null - error message if any
  createPoint,      // Function - async (pointData) => Promise<MapPoint>
  updatePoint,      // Function - async (id, updates) => Promise<MapPoint>
  deletePoint,      // Function - async (id) => Promise<boolean>
  syncStatus        // Object - { isOnline: boolean, connectedPeers: number }
} = useMapPoints(bounds); // bounds parameter is optional
```

### Function Signatures

```javascript
// CREATE - Frontend calls this to add new points
await createPoint({
  latitude: number,      // Required
  longitude: number,     // Required
  title: string,         // Required
  description?: string,  // Optional
  category?: string,     // Optional
  color?: string,        // Optional
  icon?: string         // Optional
});

// UPDATE - Frontend calls this to modify existing points
await updatePoint(pointId, {
  title?: string,
  description?: string,
  category?: string,
  color?: string,
  icon?: string
  // Note: Cannot update latitude/longitude after creation
});

// DELETE - Frontend calls this to remove points
const success = await deletePoint(pointId); // Returns boolean
```

## Naming Conventions

### Variable Names (ALL team members must use these)

```javascript
// Point-related variables
const mapPoint = {};        // Single point object
const mapPoints = [];       // Array of points
const pointId = "";         // Point identifier
const newPoint = {};        // Point being created
const selectedPoint = {};   // Currently selected point

// Geographic variables
const latitude = 0;         // Always use 'latitude' (not 'lat')
const longitude = 0;        // Always use 'longitude' (not 'lng', 'lon')
const bounds = {};          // Geographic boundaries
const region = {};          // Map viewport region

// UI state variables
const isLoading = false;    // Loading states
const hasError = false;     // Error states
const isOffline = false;    // Network status
const syncStatus = {};      // Sync information
```

### Function Names

```javascript
// Data operations (handled by storage layer)
createPoint()
updatePoint()
deletePoint()
getPointsInBounds()

// UI operations (handled by frontend team)
onMapPress()
onMarkerPress()
onPointSelect()
showPointDetails()
hidePointDetails()
```

### Event Handler Naming

```javascript
// Map interaction events
const handleMapPress = (event) => {};
const handleMarkerPress = (pointId) => {};
const handlePointCreate = (pointData) => {};
const handlePointUpdate = (pointId, updates) => {};
const handlePointDelete = (pointId) => {};

// UI events
const handleModalOpen = () => {};
const handleModalClose = () => {};
const handleFormSubmit = (data) => {};
```

## Error Handling Contract

### Error Types Frontend Should Handle

```javascript
// Storage layer will provide these error types
const errorTypes = {
  NETWORK_ERROR: "Network connection failed",
  VALIDATION_ERROR: "Invalid point data provided",
  NOT_FOUND_ERROR: "Point not found",
  PERMISSION_ERROR: "Insufficient permissions",
  SYNC_ERROR: "Synchronization failed"
};

// Frontend should handle errors like this:
try {
  await createPoint(pointData);
} catch (error) {
  if (error.type === 'VALIDATION_ERROR') {
    // Show validation message to user
  } else if (error.type === 'NETWORK_ERROR') {
    // Show offline mode message
  } else {
    // Show generic error message
  }
}
```

## Loading States Contract

### Loading State Management

```javascript
// Storage layer provides these loading states
const loadingStates = {
  loading: false,        // Initial data load
  creating: false,       // Creating new point
  updating: false,       // Updating existing point
  deleting: false,       // Deleting point
  syncing: false        // Background sync in progress
};

// Frontend should show appropriate UI for each state
if (loading) {
  return <LoadingSpinner />;
}

if (creating) {
  return <Button disabled>Creating...</Button>;
}
```

## Integration Checklist

### For Storage Layer Developer (You)

- [ ] **Export consistent data structures** - Use exact MapPoint format
- [ ] **Provide clear hook interface** - useMapPoints with documented return values
- [ ] **Handle all async operations** - Don't expose Ditto complexity to frontend
- [ ] **Implement proper error handling** - Return user-friendly error messages
- [ ] **Provide loading states** - For all CRUD operations
- [ ] **Document function signatures** - Clear parameter and return types
- [ ] **Test with mock data** - Ensure hooks work before integration
- [ ] **Create example usage** - Show frontend team how to use your hooks

### For Frontend Team Members

- [ ] **Use provided hooks only** - Don't access Ditto directly
- [ ] **Follow naming conventions** - Use agreed variable names
- [ ] **Handle loading states** - Show appropriate UI during operations
- [ ] **Handle errors gracefully** - Display user-friendly error messages
- [ ] **Use exact data structures** - Don't modify MapPoint format
- [ ] **Test offline scenarios** - Ensure UI works without network
- [ ] **Respect async nature** - All data operations are asynchronous
- [ ] **Don't cache data locally** - Storage layer handles all caching

## Communication Guidelines

### What Storage Layer Will Provide

```javascript
// File: hooks/useMapPoints.js
export const useMapPoints = (bounds) => {
  // Returns: { points, loading, error, createPoint, updatePoint, deletePoint, syncStatus }
};

// File: hooks/useDittoSync.js  
export const useDittoSync = () => {
  // Returns: { isOnline, connectedPeers, syncActive }
};

// File: types/MapPoint.js (if using JavaScript with JSDoc)
/**
 * @typedef {Object} MapPoint
 * @property {string} _id - Unique identifier
 * @property {number} latitude - Geographic latitude
 * @property {number} longitude - Geographic longitude
 * @property {string} title - Point title
 * @property {string} [description] - Optional description
 * @property {string} [category] - Optional category
 * @property {string} [color] - Optional hex color
 * @property {string} [icon] - Optional icon identifier
 * @property {string} createdAt - ISO timestamp
 * @property {string} updatedAt - ISO timestamp
 * @property {boolean} isDeleted - Soft delete flag
 */
```

### What Frontend Team Should Provide

- **Map component props** - What props the map component expects
- **UI callback functions** - How to handle user interactions
- **Styling requirements** - Color schemes, icon sets, etc.
- **Navigation structure** - How map fits into app navigation
- **User feedback patterns** - Toast messages, modals, etc.

## Testing Integration

### Mock Data for Development

```javascript
// Provide this mock data for frontend development
export const mockMapPoints = [
  {
    _id: "point_1",
    latitude: 40.7128,
    longitude: -74.0060,
    title: "Central Park",
    description: "Famous park in Manhattan",
    category: "park",
    color: "#4CAF50",
    icon: "park",
    createdAt: "2024-01-14T10:30:00.000Z",
    updatedAt: "2024-01-14T10:30:00.000Z",
    isDeleted: false
  },
  {
    _id: "point_2", 
    latitude: 40.7589,
    longitude: -73.9851,
    title: "Times Square",
    description: "Busy commercial intersection",
    category: "landmark",
    color: "#FF5722",
    icon: "landmark",
    createdAt: "2024-01-14T11:00:00.000Z",
    updatedAt: "2024-01-14T11:00:00.000Z",
    isDeleted: false
  }
];
```

### Integration Testing Scenarios

1. **Create Point Flow**
   - User taps map → frontend calls `createPoint()` → point appears on map
   
2. **Update Point Flow**
   - User edits point → frontend calls `updatePoint()` → changes reflect immediately
   
3. **Delete Point Flow**
   - User deletes point → frontend calls `deletePoint()` → point disappears
   
4. **Offline Scenario**
   - Network disconnects → operations still work → sync when reconnected
   
5. **Loading States**
   - All operations show loading indicators → complete with success/error

## Common Integration Issues to Avoid

### 1. Data Format Mismatches
```javascript
// ❌ DON'T - Frontend creating different format
const wrongPoint = { lat: 40.7, lng: -74.0, name: "Point" };

// ✅ DO - Use exact MapPoint format
const correctPoint = { latitude: 40.7, longitude: -74.0, title: "Point" };
```

### 2. Direct Ditto Access
```javascript
// ❌ DON'T - Frontend accessing Ditto directly
import { Ditto } from '@dittolive/ditto';

// ✅ DO - Use provided hooks only
import { useMapPoints } from '../hooks/useMapPoints';
```

### 3. Synchronous Assumptions
```javascript
// ❌ DON'T - Assuming immediate results
createPoint(data);
console.log(points); // Won't include new point yet

// ✅ DO - Handle async properly
await createPoint(data);
// Point is now created and will appear in next render
```

### 4. State Management Conflicts
```javascript
// ❌ DON'T - Duplicating state management
const [localPoints, setLocalPoints] = useState([]);

// ✅ DO - Use storage layer state only
const { points } = useMapPoints();
```

## Deployment Considerations

### Environment Variables
```javascript
// .env file - coordinate these values with team
DITTO_APP_ID=your-app-id-here
DITTO_TOKEN=your-token-here
DITTO_ENVIRONMENT=development // or production
```

### Build Configuration
- Ensure Expo plugin is in shared app.json
- Coordinate iOS/Android permission requirements
- Test on both platforms before deployment

## Success Metrics

Integration is successful when:
- ✅ Frontend can create/read/update/delete points using provided hooks
- ✅ All team members use consistent data structures and naming
- ✅ Loading states and errors are handled gracefully
- ✅ Offline functionality works seamlessly
- ✅ Real-time updates appear across all components
- ✅ No direct Ditto SDK usage in frontend components
- ✅ Build process works for all team members
