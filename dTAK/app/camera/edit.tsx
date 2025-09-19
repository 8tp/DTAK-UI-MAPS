import { useRouter } from "expo-router";
import { SaveFormat, manipulateAsync } from "expo-image-manipulator";
import * as MediaLibrary from "expo-media-library";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  GestureResponderEvent,
  LayoutChangeEvent,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import ViewShot from "react-native-view-shot";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";

import { useCameraSession } from "../../src/features/camera/CameraSessionContext";
import { normalizePoint, denormalizePoint } from "../../src/features/camera/annotationUtils";
import { Annotation, NormalizedPoint } from "../../src/features/camera/types";

const createId = () => `${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;

const DEFAULT_COLOR = "#f97316";
const MAX_WIDTH = 1600;

const CameraEditScreen = () => {
  const router = useRouter();
  const viewShotRef = useRef<ViewShot | null>(null);
  const { capturedPhoto, annotations, addAnnotation, setAnnotations, undoLastAnnotation, resetSession } = useCameraSession();
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number } | null>(null);
  const [activeTool, setActiveTool] = useState<"circle" | "arrow" | "text">("circle");
  const [pendingPoint, setPendingPoint] = useState<NormalizedPoint | null>(null);
  const [textModalVisible, setTextModalVisible] = useState(false);
  const [textDraft, setTextDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const captureFileName = useMemo(() => `dtak-annotated-${Date.now()}`, []);
  const instructionText = useMemo(() => {
    if (activeTool === "circle") {
      return pendingPoint ? "Tap again to set circle radius" : "Tap photo to choose circle center";
    }

    if (activeTool === "arrow") {
      return pendingPoint ? "Tap again to place arrow head" : "Tap photo to start arrow";
    }

    return "Tap photo to position text";
  }, [activeTool, pendingPoint]);

  useEffect(() => {
    if (!capturedPhoto) {
      router.replace("/camera" as never);
    }
  }, [capturedPhoto, router]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setCanvasSize({ width, height });
  };

  const handleCanvasPress = useCallback(
    (event: GestureResponderEvent) => {
      if (!canvasSize || !capturedPhoto) {
        return;
      }

      const { locationX, locationY } = event.nativeEvent;
      const normalized = normalizePoint({ x: locationX, y: locationY }, canvasSize);

      if (activeTool === "text") {
        setPendingPoint(normalized);
        setTextDraft("");
        setTextModalVisible(true);
        return;
      }

      if (!pendingPoint) {
        setPendingPoint(normalized);
        return;
      }

      if (activeTool === "circle") {
        addAnnotation({
          id: createId(),
          type: "circle",
          center: pendingPoint,
          edge: normalized,
          color: DEFAULT_COLOR,
        });
        setPendingPoint(null);
        return;
      }

      if (activeTool === "arrow") {
        addAnnotation({
          id: createId(),
          type: "arrow",
          start: pendingPoint,
          end: normalized,
          color: DEFAULT_COLOR,
        });
        setPendingPoint(null);
        return;
      }
    },
    [activeTool, addAnnotation, canvasSize, capturedPhoto, pendingPoint]
  );

  const confirmText = () => {
    if (!pendingPoint || textDraft.trim().length === 0) {
      setTextModalVisible(false);
      setPendingPoint(null);
      return;
    }

    addAnnotation({
      id: createId(),
      type: "text",
      point: pendingPoint,
      text: textDraft.trim(),
      color: DEFAULT_COLOR,
    });
    setTextModalVisible(false);
    setPendingPoint(null);
  };

  const cancelText = () => {
    setTextModalVisible(false);
    setPendingPoint(null);
  };

  const buildArrowHeadPath = useCallback((startPx: NormalizedPoint, endPx: NormalizedPoint) => {
    if (!canvasSize) {
      return "";
    }

    const start = denormalizePoint(startPx, canvasSize);
    const end = denormalizePoint(endPx, canvasSize);
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const arrowLength = 24;
    const arrowWidth = 12;

    const pathPoint1 = {
      x: end.x - arrowLength * Math.cos(angle - Math.PI / 6),
      y: end.y - arrowLength * Math.sin(angle - Math.PI / 6),
    };
    const pathPoint2 = {
      x: end.x - arrowLength * Math.cos(angle + Math.PI / 6),
      y: end.y - arrowLength * Math.sin(angle + Math.PI / 6),
    };

    return `M ${end.x} ${end.y} L ${pathPoint1.x} ${pathPoint1.y} L ${pathPoint2.x} ${pathPoint2.y} Z`;
  }, [canvasSize]);

  const renderAnnotation = useCallback(
    (annotation: Annotation) => {
      if (!canvasSize) {
        return null;
      }

      if (annotation.type === "circle") {
        const center = denormalizePoint(annotation.center, canvasSize);
        const edge = denormalizePoint(annotation.edge, canvasSize);
        const radius = Math.hypot(edge.x - center.x, edge.y - center.y);

        return (
          <Circle
            key={annotation.id}
            cx={center.x}
            cy={center.y}
            r={radius}
            stroke={annotation.color}
            strokeWidth={4}
            fill="transparent"
          />
        );
      }

      if (annotation.type === "arrow") {
        const start = denormalizePoint(annotation.start, canvasSize);
        const end = denormalizePoint(annotation.end, canvasSize);
        const arrowHeadPath = buildArrowHeadPath(annotation.start, annotation.end);

        return (
          <React.Fragment key={annotation.id}>
            <Line
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={annotation.color}
              strokeWidth={4}
            />
            <Path d={arrowHeadPath} fill={annotation.color} />
          </React.Fragment>
        );
      }

      if (annotation.type === "text") {
        const point = denormalizePoint(annotation.point, canvasSize);
        return (
          <SvgText
            key={annotation.id}
            fill={annotation.color}
            fontSize={24}
            fontWeight="bold"
            stroke="#000000"
            strokeWidth={0.25}
            x={point.x}
            y={point.y}
          >
            {annotation.text}
          </SvgText>
        );
      }

      return null;
    },
    [buildArrowHeadPath, canvasSize]
  );

  const handleSave = useCallback(async () => {
    if (!viewShotRef.current) {
      return;
    }

    try {
      setIsSaving(true);
      const capturedUri = await viewShotRef.current.capture?.();

      if (!capturedUri) {
        throw new Error("No image generated");
      }

      let finalUri = capturedUri;
      if (canvasSize && canvasSize.width > MAX_WIDTH) {
        const scale = MAX_WIDTH / canvasSize.width;
        const resized = await manipulateAsync(
          capturedUri,
          [{ resize: { width: MAX_WIDTH, height: Math.round(canvasSize.height * scale) } }],
          { compress: 0.85, format: SaveFormat.PNG }
        );
        finalUri = resized.uri;
      }

      const permission = await MediaLibrary.requestPermissionsAsync();
      const hasAccess =
        permission.status === "granted" || (permission as { accessPrivileges?: string }).accessPrivileges === "limited";

      if (!hasAccess) {
        Alert.alert("Storage permission required", "Enable photo library access to save annotations.");
        return;
      }

      await MediaLibrary.saveToLibraryAsync(finalUri);
      Alert.alert("Saved", "Annotated photo saved to camera roll.");
      resetSession();
      router.replace("/" as never);
    } catch (error) {
      console.error("Failed to save annotated photo", error);
      Alert.alert("Save failed", "We could not save the annotated image. Try again.");
    } finally {
      setIsSaving(false);
    }
  }, [canvasSize, router]);

  const undoDisabled = annotations.length === 0;

  const geotagDisplay = useMemo(() => {
    if (!capturedPhoto?.geolocation) {
      return "Location unavailable";
    }

    const { latitude, longitude, accuracy } = capturedPhoto.geolocation;
    const accuracyText = accuracy ? ` ±${accuracy.toFixed(0)}m` : "";
    return `Lat ${latitude.toFixed(5)} · Lng ${longitude.toFixed(5)}${accuracyText}`;
  }, [capturedPhoto]);

  if (!capturedPhoto) {
    return null;
  }

  const aspectRatio = capturedPhoto.width && capturedPhoto.height ? capturedPhoto.width / capturedPhoto.height : 4 / 3;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            resetSession();
            router.back();
          }}
          style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Annotate Photo</Text>
        <TouchableOpacity
          disabled={isSaving}
          onPress={handleSave}
          style={[styles.primaryButton, isSaving && styles.disabledButton]}
        >
          <Text style={styles.primaryButtonText}>{isSaving ? "Saving…" : "Save"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.toolRow}>
        <ToolButton label="Circle" active={activeTool === "circle"} onPress={() => setActiveTool("circle")} />
        <ToolButton label="Arrow" active={activeTool === "arrow"} onPress={() => setActiveTool("arrow")} />
        <ToolButton label="Text" active={activeTool === "text"} onPress={() => setActiveTool("text")} />
        <TouchableOpacity
          disabled={undoDisabled}
          onPress={undoLastAnnotation}
          style={[styles.secondaryButton, undoDisabled && styles.disabledButton]}
        >
          <Text style={styles.secondaryButtonText}>Undo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={annotations.length === 0}
          onPress={() => setAnnotations([])}
          style={[styles.secondaryButton, annotations.length === 0 && styles.disabledButton]}
        >
          <Text style={styles.secondaryButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.instructions}>{instructionText}</Text>

      <View style={styles.editorArea}>
        <View style={styles.canvasShell}>
          <ViewShot
            ref={viewShotRef}
            options={{
              fileName: captureFileName,
              format: "png",
              quality: 1,
            }}
            style={[styles.viewShot, { aspectRatio }]}
          >
            <View onLayout={handleLayout} style={styles.canvasWrapper}>
              <ImageBackground uri={capturedPhoto.uri} />
              {canvasSize ? (
                <View
                  pointerEvents="box-only"
                  style={StyleSheet.absoluteFill}
                  onStartShouldSetResponder={() => true}
                  onResponderRelease={handleCanvasPress}
                >
                  <Svg height={canvasSize.height} width={canvasSize.width}>
                    {annotations.map((annotation) => renderAnnotation(annotation))}
                    {pendingPoint && (
                      <Circle
                        cx={denormalizePoint(pendingPoint, canvasSize).x}
                        cy={denormalizePoint(pendingPoint, canvasSize).y}
                        r={8}
                        fill="#60a5fa"
                      />
                    )}
                  </Svg>
                </View>
              ) : null}
            </View>
          </ViewShot>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{geotagDisplay}</Text>
      </View>

      <Modal animationType="slide" transparent visible={textModalVisible} onRequestClose={cancelText}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add text annotation</Text>
            <TextInput
              autoFocus
              onChangeText={setTextDraft}
              placeholder="Enter label"
              placeholderTextColor="#6b7280"
              style={styles.textInput}
              value={textDraft}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={cancelText} style={[styles.secondaryButton, styles.modalButton]}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmText} style={[styles.primaryButton, styles.modalButton]}>
                <Text style={styles.primaryButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const ToolButton = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.toolButton, active && styles.toolButtonActive]}>
      <Text style={[styles.toolButtonText, active && styles.toolButtonTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
};

const ImageBackground = ({ uri }: { uri: string }) => {
  return (
    <Image
      accessible
      accessibilityIgnoresInvertColors
      contentFit="contain"
      source={{ uri }}
      style={styles.imagePlaceholder}
    />
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "700",
  },
  toolRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  instructions: {
    color: "#94a3b8",
    fontSize: 13,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  editorArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  canvasShell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  viewShot: {
    width: "100%",
    maxHeight: "100%",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  canvasWrapper: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  footerText: {
    color: "#93c5fd",
    textAlign: "center",
    fontSize: 14,
  },
  toolButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1e293b",
  },
  toolButtonActive: {
    backgroundColor: "#2563eb",
  },
  toolButtonText: {
    color: "#cbd5f5",
    fontSize: 14,
    fontWeight: "600",
  },
  toolButtonTextActive: {
    color: "#ffffff",
  },
  secondaryButton: {
    backgroundColor: "#1f2937",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: "#e5e7eb",
    fontSize: 14,
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#10b981",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.5,
  },
  imagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "700",
  },
  textInput: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    color: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 14,
  },
});

export default CameraEditScreen;
