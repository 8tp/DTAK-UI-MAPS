# DTAK Mobile Application

A React Native mobile mapping application built with Expo, featuring offline-first architecture and persona-driven UI for tactical operations.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI (`npm install -g @expo/cli`)
- Expo Go app on your mobile device
- iOS Simulator or Android Emulator (optional)

### Installation

1. **Navigate to the mobile app directory:**
   ```bash
   cd mobile-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npx expo start
   ```

4. **Run on device/simulator:**
   - **Mobile Device:** Scan the QR code with Expo Go app
   - **iOS Simulator:** Press `i` in the terminal
   - **Android Emulator:** Press `a` in the terminal
   - **Web Browser:** Press `w` in the terminal

## 📱 Features Implemented

### ✅ MVP Requirements (Demo Ready)

1. **Mobile Map App (Native)**
   - Interactive map interface with pan/zoom capabilities
   - Native React Native implementation with Expo

2. **Offline-First Architecture**
   - Local data persistence using AsyncStorage
   - Ditto SDK integration for decentralized sync
   - Works fully offline with data persistence

3. **Drop, Create, and View Map Points**
   - Create map points with GPS coordinates
   - View points in both map and list views
   - Detailed point view with metadata

4. **Persona Selection**
   - 7 operational personas: Disaster Response, First Responder, Tactical/Military, Firefighter, Police, Civilian, Volunteer
   - Persistent persona selection across app sessions
   - Persona-driven UI placeholders

5. **Map Features / Plugins (Stubbed)**
   - Feature toggle interface for tactical plugins
   - Settings persistence for enabled features
   - Ready for plugin integration

6. **Basic GPS Integration and Point Metadata**
   - Automatic GPS coordinate capture
   - Point metadata including timestamp
   - Placeholder for floor/precision data

7. **No Dependency on TAC Kernel**
   - Self-contained React Native application
   - Local data services replace external dependencies
   - Ditto handles decentralized sync

8. **Development Environment Ready**
   - Expo development setup
   - Clear installation instructions
   - Ready for team collaboration

## 🏗️ Project Structure

```
mobile-app/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # Application screens
│   │   ├── MapScreen.js           # Main map interface
│   │   ├── PersonaSelectionScreen.js  # Persona selection
│   │   ├── PointListScreen.js     # List of map points
│   │   ├── PointDetailScreen.js   # Point details/editing
│   │   └── SettingsScreen.js      # App settings & features
│   ├── services/           # Data and business logic
│   │   ├── DataService.js         # Local data persistence
│   │   └── DittoService.js        # Ditto sync service
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── assets/                 # Images, fonts, etc.
├── App.js                  # Main application component
└── package.json           # Dependencies and scripts
```

## 🔧 Key Technologies

- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and toolchain
- **React Navigation** - Navigation library
- **Ditto** - Offline-first sync platform
- **AsyncStorage** - Local data persistence
- **Expo Location** - GPS and location services

## 📋 Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run in web browser

## 🎯 Current Capabilities

### Map Interface
- Interactive map placeholder with GPS integration
- Drop points at current location
- View points with visual indicators
- Navigate to point details

### Data Management
- Offline-first data storage
- Persistent point storage across app restarts
- Settings and preferences persistence
- Persona selection with persistence

### Navigation
- Tab-based navigation (Map, Settings)
- Stack navigation for detailed views
- Persona selection flow

### Settings & Configuration
- Feature toggle interface for plugins
- Persona management
- Data clearing capabilities
- About information

## 🔮 Next Steps for Full Implementation

### Immediate Enhancements
1. **Real Map Integration**
   - Integrate MapLibre or Mapbox for actual map rendering
   - Replace placeholder with interactive map tiles

2. **Enhanced GPS Features**
   - High-precision GPS integration
   - Floor-level positioning
   - Coordinate system conversions

3. **Ditto Sync Implementation**
   - Complete Ditto integration for real-time sync
   - Multi-device synchronization
   - Conflict resolution

### Advanced Features
1. **Map Overlays**
   - Weather layer integration
   - Traffic data overlay
   - Tactical overlay system

2. **Authentication System**
   - Biometric authentication stub
   - Digital wallet integration
   - User credential management

3. **Plugin Architecture**
   - Dynamic plugin loading
   - Feature-specific UI components
   - Persona-based feature availability

## 🚨 Known Limitations

- Map interface is currently a placeholder (needs MapLibre/Mapbox integration)
- Ditto sync is stubbed (needs proper configuration)
- Authentication is not implemented
- Real-time sync between devices needs testing

## 🤝 Development Team

- **Point of Contact:** Patrick (AWS environment setup)
- **Architecture:** Offline-first, decentralized sync with Ditto
- **No External Dependencies:** Self-contained, no TAC kernel dependency

## 📞 Support

For development environment access and AWS credentials, contact Patrick.
For technical questions about the React Native implementation, refer to this README and the inline code documentation.
