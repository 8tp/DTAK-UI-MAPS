import { useFocusEffect, useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useCameraSession } from "../../src/features/camera/CameraSessionContext";
import { GeoLocation } from "../../src/features/camera/types";

const createId = () => `${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;

const CameraCaptureScreen = () => {
  const router = useRouter();
  const cameraRef = useRef<CameraView | null>(null);
  const { setCapturedPhoto, resetSession } = useCameraSession();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      resetSession();
    }, [resetSession])
  );

  useEffect(() => {
    if (!cameraPermission) {
      requestCameraPermission().catch((error) => {
        console.warn("Failed to request camera permission", error);
      });
    }
  }, [cameraPermission, requestCameraPermission]);

  const ensureCameraGranted = useCallback(async () => {
    if (cameraPermission?.granted) {
      return true;
    }

    const response = await requestCameraPermission();
    if (!response.granted) {
      Alert.alert(
        "Camera permission required",
        "Enable camera access in device settings to capture photos."
      );
    }

    return response.granted;
  }, [cameraPermission?.granted, requestCameraPermission]);

  const captureLocation = useCallback(async (): Promise<GeoLocation | undefined> => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        return undefined;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? undefined,
        timestamp: position.timestamp,
      };
    } catch (error) {
      console.warn("Failed to capture location", error);
      return undefined;
    }
  }, []);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current) {
      return;
    }

    const granted = await ensureCameraGranted();
    if (!granted) {
      return;
    }

    setIsCapturing(true);
    setErrorMessage(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        skipProcessing: true,
        exif: true,
      });

      if (!photo) {
        throw new Error("Capture returned no photo");
      }

      const location = await captureLocation();

      setCapturedPhoto({
        id: createId(),
        uri: photo.uri,
        width: photo.width ?? 0,
        height: photo.height ?? 0,
        exif: photo.exif ?? undefined,
        geolocation: location,
      });

      router.push("/camera/preview" as never);
    } catch (error) {
      console.error("Failed to take picture", error);
      setErrorMessage("Unable to capture photo. Try again.");
    } finally {
      setIsCapturing(false);
    }
  }, [captureLocation, ensureCameraGranted, router, setCapturedPhoto]);

  const permissionStatus = cameraPermission?.granted;
  const isPermissionUndetermined = useMemo(() => cameraPermission === null, [cameraPermission]);

  const goHome = () => router.replace("/" as never);

  return (
    <SafeAreaView style={styles.container}>
      {permissionStatus ? (
        <View style={styles.cameraContainer}>
          <CameraView ref={cameraRef} style={styles.camera} facing="back" enableTorch={false} />
          <View style={styles.topBar}>
            <TouchableOpacity accessibilityRole="button" onPress={goHome} style={styles.backButton}>
              <Text style={styles.backButtonText}>Home</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.controls}>
            <TouchableOpacity
              accessibilityHint="Capture a photo"
              accessibilityRole="button"
              disabled={isCapturing}
              onPress={handleCapture}
              style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
            >
              {isCapturing ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.captureButtonText}>Snap</Text>}
            </TouchableOpacity>
          </View>
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        </View>
      ) : (
        <View style={styles.permissionContainer}>
          {isPermissionUndetermined ? (
            <ActivityIndicator />
          ) : (
            <>
              <Text style={styles.permissionTitle}>Camera access needed</Text>
              <Text style={styles.permissionSubtitle}>
                We use the camera to capture images for mission annotations. Grant permission to continue.
              </Text>
              <TouchableOpacity onPress={requestCameraPermission} style={styles.permissionButton}>
                <Text style={styles.permissionButtonText}>Grant camera access</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  cameraContainer: { flex: 1, justifyContent: "flex-end" },
  camera: { ...StyleSheet.absoluteFillObject },
  controls: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 48,
  },
  topBar: {
    position: "absolute",
    top: 24,
    left: 20,
  },
  backButton: {
    backgroundColor: "rgba(17, 24, 39, 0.8)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backButtonText: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "600",
  },
  captureButton: {
    alignItems: "center",
    backgroundColor: "#1f2933",
    borderRadius: 48,
    height: 72,
    justifyContent: "center",
    width: 72,
  },
  captureButtonDisabled: {
    opacity: 0.65,
  },
  captureButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  errorText: {
    color: "#f87171",
    textAlign: "center",
    marginBottom: 16,
  },
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    backgroundColor: "#111827",
  },
  permissionTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  permissionSubtitle: {
    color: "#d1d5db",
    fontSize: 15,
    marginBottom: 24,
    textAlign: "center",
  },
  permissionButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  permissionButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CameraCaptureScreen;
