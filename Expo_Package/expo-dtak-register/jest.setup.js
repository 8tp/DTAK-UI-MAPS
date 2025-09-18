import "@testing-library/jest-native/extend-expect";

const mockPosition = {
  coords: {
    accuracy: 5,
    altitude: 0,
    altitudeAccuracy: null,
    heading: 0,
    latitude: 27.9512,
    longitude: -82.4572,
    speed: 0,
  },
  timestamp: 0,
};

jest.mock(
  "expo-location",
  () => {
    const mockFunctions = {
      requestForegroundPermissionsAsync: jest.fn(async () => ({
        status: "granted",
      })),
      getLastKnownPositionAsync: jest.fn(async () => null),
      getCurrentPositionAsync: jest.fn(async () => mockPosition),
      PermissionStatus: { GRANTED: "granted" },
      Accuracy: { High: 3 },
    };

    return mockFunctions;
  },
  { virtual: true }
);
