// Jest configuration for Expo + React Native + TypeScript
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.(ts|tsx|js)'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@react-navigation|expo(nent)?|expo-.*|@expo(nent)?/.*|@react-native-community/.*|@react-native|@maplibre/maplibre-react-native|@dittolive/ditto)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/__tests__/ditto/services/MessagingService.more2.test.ts',
    '<rootDir>/__tests__/ditto/services/PeerDiscoveryService.test.ts'
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/ditto/services/**/*.{ts,tsx}',
    '<rootDir>/ditto/config/**/*.{ts,tsx}',
    '!<rootDir>/ditto/services/DittoService.ts',
    '!<rootDir>/ditto/services/MessagingService.ts',
    '!<rootDir>/ditto/services/SyncDeduplicationService.ts',
    '!<rootDir>/ditto/services/PeerDiscoveryService.ts',
    '!**/__tests__/**',
    '!**/*.d.ts',
  ],
};
