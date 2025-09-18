import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Image } from "expo-image";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useCameraSession } from "../../src/features/camera/CameraSessionContext";

const CameraPreviewScreen = () => {
  const router = useRouter();
  const { capturedPhoto, setCapturedPhoto } = useCameraSession();

  useEffect(() => {
    if (!capturedPhoto) {
      router.replace("/camera" as never);
    }
  }, [capturedPhoto, router]);

  if (!capturedPhoto) {
    return null;
  }

  const goBackToCamera = () => router.replace("/camera" as never);
  const openEditor = () => router.push("/camera/edit" as never);

  const handleRetake = () => {
    setCapturedPhoto(undefined);
    goBackToCamera();
  };

  const handleAccept = () => {
    openEditor();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          contentFit="contain"
          source={{ uri: capturedPhoto.uri }}
          style={styles.image}
          transition={250}
        />
      </View>
      <View style={styles.metadataContainer}>
        {capturedPhoto.geolocation ? (
          <Text style={styles.metadataText}>
            Lat {capturedPhoto.geolocation.latitude.toFixed(5)} · Lng {capturedPhoto.geolocation.longitude.toFixed(5)}
          </Text>
        ) : (
          <Text style={styles.metadataText}>Location unavailable</Text>
        )}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={handleRetake} style={[styles.button, styles.cancelButton]}>
          <Text style={styles.buttonText}>Retake</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleAccept} style={[styles.button, styles.acceptButton]}>
          <Text style={styles.buttonText}>Use Photo</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  imageContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  image: {
    height: "100%",
    width: "100%",
    borderRadius: 12,
  },
  metadataContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  metadataText: {
    color: "#d1d5db",
    fontSize: 14,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  button: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    marginHorizontal: 8,
    borderRadius: 28,
  },
  cancelButton: {
    backgroundColor: "#374151",
  },
  acceptButton: {
    backgroundColor: "#2563eb",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CameraPreviewScreen;
