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

jest.mock(
  "expo-camera",
  () => {
    const React = require("react");
    const { View } = require("react-native");

    const takePictureAsync = jest.fn(async () => ({
      uri: "mock://selfie.jpg",
      base64: "c2VsZmll",
      width: 400,
      height: 400,
    }));

    const MockCameraView = React.forwardRef((props, ref) => {
      React.useImperativeHandle(ref, () => ({
        takePictureAsync,
      }));

      return <View {...props} />;
    });

    MockCameraView.displayName = "MockCameraView";

    const getCameraPermissionsAsync = jest.fn(async () => ({
      status: "granted",
    }));

    const requestCameraPermissionsAsync = jest.fn(async () => ({
      status: "granted",
    }));

    return {
      __esModule: true,
      CameraView: MockCameraView,
      CameraType: { front: "front", back: "back" },
      getCameraPermissionsAsync,
      requestCameraPermissionsAsync,
    };
  },
  { virtual: true }
);
