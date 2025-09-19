import type { MapViewRef } from "@maplibre/maplibre-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import { metersBetween, type LonLat } from "../utils/geometry/geodesy";

// Interaction mode for line drawing
export type LineInteractionMode = "DEFAULT" | "DRAW_LINE";

export type LineFeature = GeoJSON.Feature<
  GeoJSON.LineString,
  {
    id: string;
    start: LonLat;
    end: LonLat;
    lengthMeters: number;
    title?: string;
    description?: string;
    createdAt?: number;
  }
>;

function generateLineId(): string {
  // Simple UUID v4 generator that works in React Native
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useDrawLine() {
  const [mode, setMode] = useState<LineInteractionMode>("DEFAULT");
  const [start, setStart] = useState<LonLat | undefined>(undefined);
  const [end, setEnd] = useState<LonLat | undefined>(undefined);
  const [previewLine, setPreviewLine] = useState<GeoJSON.Feature<GeoJSON.LineString> | undefined>(undefined);
  const [previewPoints, setPreviewPoints] = useState<GeoJSON.FeatureCollection<GeoJSON.Point>>({ type: "FeatureCollection", features: [] });
  const [lines, setLines] = useState<GeoJSON.FeatureCollection<GeoJSON.LineString>>({ type: "FeatureCollection", features: [] });

  const mapRef = useRef<MapViewRef | null>(null);

  const startDrawing = useCallback((mapRefInstance: MapViewRef) => {
    mapRef.current = mapRefInstance;
    setMode("DRAW_LINE");
    setStart(undefined);
    setEnd(undefined);
    setPreviewLine(undefined);
    setPreviewPoints({ type: "FeatureCollection", features: [] });
  }, []);

  const stop = useCallback(() => {
    setMode("DEFAULT");
    setStart(undefined);
    setEnd(undefined);
    setPreviewLine(undefined);
    setPreviewPoints({ type: "FeatureCollection", features: [] });
  }, []);

  const onTap = useCallback(
    async (point: [number, number]) => {
      if (mode !== "DRAW_LINE") return;
      if (!mapRef.current) return;
      const coord = await mapRef.current.getCoordinateFromView(point);
      setStart([coord[0], coord[1]]);
      // Initialize preview points with only the start dot
      setPreviewPoints({
        type: "FeatureCollection",
        features: [
          { type: "Feature", geometry: { type: "Point", coordinates: [coord[0], coord[1]] }, properties: { role: "start" } },
        ],
      });
    },
    [mode]
  );

  const throttled = useRef<number | null>(null);
  const onDrag = useCallback(
    async (point: [number, number]) => {
      if (mode !== "DRAW_LINE" || !start) return;
      if (!mapRef.current) return;
      const now = Date.now();
      if (throttled.current && now - throttled.current < 75) return;
      throttled.current = now;
      const coord = await mapRef.current.getCoordinateFromView(point);
      const currentEnd: LonLat = [coord[0], coord[1]];
      setEnd(currentEnd);
      setPreviewLine({ type: "Feature", geometry: { type: "LineString", coordinates: [start, currentEnd] }, properties: {} });
      setPreviewPoints({
        type: "FeatureCollection",
        features: [
          { type: "Feature", geometry: { type: "Point", coordinates: start }, properties: { role: "start" } },
          { type: "Feature", geometry: { type: "Point", coordinates: currentEnd }, properties: { role: "end" } },
        ],
      });
    },
    [mode, start]
  );

  const onRelease = useCallback(
    async (point?: [number, number]): Promise<string | undefined> => {
      if (mode !== "DRAW_LINE" || !start) return undefined;
      let finalEnd = end;
      if (point && mapRef.current && !finalEnd) {
        const coord = await mapRef.current.getCoordinateFromView(point);
        finalEnd = [coord[0], coord[1]];
      }
      if (!finalEnd) return undefined;
      const length = metersBetween(start, finalEnd);
      const id = generateLineId();
      const feature: LineFeature = {
        type: "Feature",
        geometry: { type: "LineString", coordinates: [start, finalEnd] },
        properties: {
          id,
          start,
          end: finalEnd,
          lengthMeters: length,
          createdAt: Date.now(),
        },
      };
      setLines((prev) => ({ type: "FeatureCollection", features: [...prev.features, feature] }));
      setPreviewLine(undefined);
      setPreviewPoints({ type: "FeatureCollection", features: [] });
      setStart(undefined);
      setEnd(undefined);
      setMode("DEFAULT");
      return id;
    },
    [mode, start, end]
  );

  const removeLineById = useCallback((id: string) => {
    setLines((prev) => ({
      type: "FeatureCollection",
      features: prev.features.filter((f) => (f.properties as any)?.id !== id),
    }));
  }, []);

  const updateLineById = useCallback(
    (id: string, patch: Partial<{ title: string; description: string }>) => {
      setLines((prev) => ({
        type: "FeatureCollection",
        features: prev.features.map((f) => {
          const props = (f.properties as any) || {};
          if (props.id === id) {
            return { ...f, properties: { ...(f.properties as any), ...patch } } as any;
          }
          return f;
        }),
      }));
    },
    []
  );

  const sources = useMemo(
    () => ({
      lines,
      previewLine,
      previewPoints,
    }),
    [lines, previewLine, previewPoints]
  );

  const getLineById = useCallback(
    (id: string) => {
      return (lines.features as LineFeature[]).find((f) => f.properties.id === id);
    },
    [lines]
  );

  return {
    mode,
    start: startDrawing,
    stop,
    onTap,
    onDrag,
    onRelease,
    sources,
    mapRef,
    removeLineById,
    updateLineById,
    getLineById,
  } as const;
}
