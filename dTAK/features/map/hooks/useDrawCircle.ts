import type { MapViewRef } from "@maplibre/maplibre-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import { approximateCircle } from "../utils/geometry/circle";
import { metersBetween, type LonLat } from "../utils/geometry/geodesy";

type InteractionMode = "DEFAULT" | "DRAW_CIRCLE";

export type CircleFeature = GeoJSON.Feature<
  GeoJSON.Polygon,
  {
    id: string;
    center: LonLat;
    radius: number;
    units: "meters";
  }
>;

function generateCircleId(): string {
  // Simple UUID v4 generator that works in React Native
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useDrawCircle() {
  const [mode, setMode] = useState<InteractionMode>("DEFAULT");
  const [center, setCenter] = useState<LonLat | undefined>(undefined);
  const [radius, setRadius] = useState<number | undefined>(undefined);
  const [preview, setPreview] = useState<
    GeoJSON.Feature<GeoJSON.Polygon> | undefined
  >(undefined);
  const [circles, setCircles] = useState<
    GeoJSON.FeatureCollection<GeoJSON.Polygon>
  >({
    type: "FeatureCollection",
    features: [],
  });

  const mapRef = useRef<MapViewRef | null>(null);

  const start = useCallback((mapRefInstance: MapViewRef) => {
    mapRef.current = mapRefInstance;
    setMode("DRAW_CIRCLE");
    setCenter(undefined);
    setRadius(undefined);
    setPreview(undefined);
  }, []);

  const stop = useCallback(() => {
    setMode("DEFAULT");
    setCenter(undefined);
    setRadius(undefined);
    setPreview(undefined);
  }, []);

  const onTap = useCallback(
    async (point: [number, number]) => {
      if (mode !== "DRAW_CIRCLE") return;
      if (!mapRef.current) return;
      const coord = await mapRef.current.getCoordinateFromView(point);
      setCenter([coord[0], coord[1]]);
    },
    [mode]
  );

  const throttled = useRef<number | null>(null);
  const onDrag = useCallback(
    async (point: [number, number]) => {
      if (mode !== "DRAW_CIRCLE" || !center) return;
      if (!mapRef.current) return;
      const now = Date.now();
      if (throttled.current && now - throttled.current < 75) return;
      throttled.current = now;
      const coord = await mapRef.current.getCoordinateFromView(point);
      const r = metersBetween(center, [coord[0], coord[1]]);
      setRadius(r);
      const poly = approximateCircle(center, Math.max(0, r), 24);
      setPreview({ type: "Feature", geometry: poly, properties: {} });
    },
    [mode, center]
  );

  const onRelease = useCallback(
    async (point?: [number, number]) => {
      if (mode !== "DRAW_CIRCLE" || !center) return;
      let finalRadius = radius ?? 0;
      if (point && mapRef.current && finalRadius === 0) {
        const coord = await mapRef.current.getCoordinateFromView(point);
        finalRadius = metersBetween(center, [coord[0], coord[1]]);
      }
      const poly = approximateCircle(center, Math.max(0, finalRadius), 32);
      const feature: CircleFeature = {
        type: "Feature",
        geometry: poly,
        properties: {
          id: generateCircleId(),
          center,
          radius: Math.max(0, finalRadius),
          units: "meters",
        },
      };
      setCircles((prev) => ({
        type: "FeatureCollection",
        features: [...prev.features, feature],
      }));
      setPreview(undefined);
      setCenter(undefined);
      setRadius(undefined);
      setMode("DEFAULT");
    },
    [mode, center, radius]
  );

  const removeCircleById = useCallback((id: string) => {
    setCircles((prev) => ({
      type: "FeatureCollection",
      features: prev.features.filter((f) => (f.properties as any)?.id !== id),
    }));
  }, []);

  const findCircleAtCoordinate = useCallback(
    (coord: LonLat) => {
      for (const feature of circles.features as CircleFeature[]) {
        const c = feature.properties.center;
        const d = metersBetween(c, coord);
        if (d <= feature.properties.radius) {
          return feature;
        }
      }
      return undefined;
    },
    [circles]
  );

  const sources = useMemo(
    () => ({
      circles,
      preview,
    }),
    [circles, preview]
  );

  return {
    mode,
    start,
    stop,
    onTap,
    onDrag,
    onRelease,
    sources,
    mapRef,
    removeCircleById,
    findCircleAtCoordinate,
  } as const;
}
