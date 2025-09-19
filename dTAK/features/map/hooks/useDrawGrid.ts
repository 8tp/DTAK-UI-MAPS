import type { MapViewRef } from "@maplibre/maplibre-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import { approximateGrid } from "../utils/geometry/grid";
import { approximateSquare, pointInPolygon } from "../utils/geometry/square";
import { metersBetween, type LonLat } from "../utils/geometry/geodesy";

type InteractionMode = "DEFAULT" | "DRAW_GRID";

export type GridFeature = GeoJSON.Feature<
  GeoJSON.MultiLineString,
  {
    id: string;
    center: LonLat;
    halfDiagonal: number;
    units: "meters";
    cellsPerSide: number;
    title?: string;
    description?: string;
    createdAt?: number;
  }
>;

function generateGridId(): string {
  // Simple UUID v4 generator that works in React Native
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useDrawGrid(cellsPerSide: number = 6) {
  const [mode, setMode] = useState<InteractionMode>("DEFAULT");
  const [center, setCenter] = useState<LonLat | undefined>(undefined);
  const [halfDiagonal, setHalfDiagonal] = useState<number | undefined>(undefined);
  const [preview, setPreview] = useState<GeoJSON.Feature<GeoJSON.MultiLineString> | undefined>(
    undefined
  );
  const [grids, setGrids] = useState<GeoJSON.FeatureCollection<GeoJSON.MultiLineString>>({
    type: "FeatureCollection",
    features: [],
  });

  const mapRef = useRef<MapViewRef | null>(null);

  const start = useCallback((mapRefInstance: MapViewRef) => {
    mapRef.current = mapRefInstance;
    setMode("DRAW_GRID");
    setCenter(undefined);
    setHalfDiagonal(undefined);
    setPreview(undefined);
  }, []);

  const stop = useCallback(() => {
    setMode("DEFAULT");
    setCenter(undefined);
    setHalfDiagonal(undefined);
    setPreview(undefined);
  }, []);

  const onTap = useCallback(
    async (point: [number, number]) => {
      if (mode !== "DRAW_GRID") return;
      if (!mapRef.current) return;
      const coord = await mapRef.current.getCoordinateFromView(point);
      setCenter([coord[0], coord[1]]);
    },
    [mode]
  );

  const throttled = useRef<number | null>(null);
  const onDrag = useCallback(
    async (point: [number, number]) => {
      if (mode !== "DRAW_GRID" || !center) return;
      if (!mapRef.current) return;
      const now = Date.now();
      if (throttled.current && now - throttled.current < 75) return;
      throttled.current = now;
      const coord = await mapRef.current.getCoordinateFromView(point);
      const hd = metersBetween(center, [coord[0], coord[1]]);
      setHalfDiagonal(hd);
      const grid = approximateGrid(center, Math.max(0, hd), cellsPerSide);
      setPreview({ type: "Feature", geometry: grid, properties: {} });
    },
    [mode, center, cellsPerSide]
  );

  const onRelease = useCallback(
    async (point?: [number, number]): Promise<string | undefined> => {
      if (mode !== "DRAW_GRID" || !center) return undefined;
      let finalHalf = halfDiagonal ?? 0;
      if (point && mapRef.current && finalHalf === 0) {
        const coord = await mapRef.current.getCoordinateFromView(point);
        finalHalf = metersBetween(center, [coord[0], coord[1]]);
      }
      const grid = approximateGrid(center, Math.max(0, finalHalf), cellsPerSide);
      const id = generateGridId();
      const feature: GridFeature = {
        type: "Feature",
        geometry: grid,
        properties: {
          id,
          center,
          halfDiagonal: Math.max(0, finalHalf),
          units: "meters",
          cellsPerSide,
          createdAt: Date.now(),
        },
      };
      setGrids((prev) => ({
        type: "FeatureCollection",
        features: [...prev.features, feature],
      }));
      setPreview(undefined);
      setCenter(undefined);
      setHalfDiagonal(undefined);
      setMode("DEFAULT");
      return id;
    },
    [mode, center, halfDiagonal, cellsPerSide]
  );

  const removeGridById = useCallback((id: string) => {
    setGrids((prev) => ({
      type: "FeatureCollection",
      features: prev.features.filter((f) => (f.properties as any)?.id !== id),
    }));
  }, []);

  const sources = useMemo(
    () => ({
      grids,
      preview,
    }),
    [grids, preview]
  );

  const updateGridById = useCallback(
    (id: string, patch: Partial<{ title: string; description: string }>) => {
      setGrids((prev) => ({
        type: "FeatureCollection",
        features: prev.features.map((f) => {
          const props = (f.properties as any) || {};
          if (props.id === id) {
            return {
              ...f,
              properties: { ...(f.properties as any), ...patch },
            } as any;
          }
          return f;
        }),
      }));
    },
    []
  );

  const getGridById = useCallback(
    (id: string) => {
      return (grids.features as GridFeature[]).find((f) => f.properties.id === id);
    },
    [grids]
  );

  const findGridAtCoordinate = useCallback(
    (coord: LonLat, toleranceMeters: number = 10) => {
      // First: inside test against the grid's outer square for generous selection
      for (const feature of grids.features as GridFeature[]) {
        const { center, halfDiagonal } = feature.properties;
        const outerSquare = approximateSquare(center, halfDiagonal);
        if (pointInPolygon(coord, outerSquare)) return feature;
      }

      // Fallback: proximity to any grid line within tolerance
      const metersPerDegree = (latDeg: number) => {
        const mPerDegLat = 111320; // approx
        const mPerDegLon = 111320 * Math.cos((latDeg * Math.PI) / 180);
        return { mPerDegLat, mPerDegLon };
      };
      const distancePointToSegmentMeters = (p: LonLat, a: LonLat, b: LonLat): number => {
        const { mPerDegLat, mPerDegLon } = metersPerDegree(p[1]);
        const toMeters = (q: LonLat) => ({
          x: (q[0] - p[0]) * mPerDegLon,
          y: (q[1] - p[1]) * mPerDegLat,
        });
        const P = { x: 0, y: 0 };
        const A = toMeters(a);
        const B = toMeters(b);
        const ABx = B.x - A.x;
        const ABy = B.y - A.y;
        const APx = P.x - A.x;
        const APy = P.y - A.y;
        const ab2 = ABx * ABx + ABy * ABy;
        const t = ab2 === 0 ? 0 : Math.max(0, Math.min(1, (APx * ABx + APy * ABy) / ab2));
        const Cx = A.x + t * ABx;
        const Cy = A.y + t * ABy;
        const dx = P.x - Cx;
        const dy = P.y - Cy;
        return Math.sqrt(dx * dx + dy * dy);
      };
      for (const feature of grids.features as GridFeature[]) {
        const mls = feature.geometry.coordinates;
        for (const line of mls) {
          for (let i = 0; i < line.length - 1; i++) {
            const a = line[i] as LonLat;
            const b = line[i + 1] as LonLat;
            const d = distancePointToSegmentMeters(coord, a, b);
            if (d <= toleranceMeters) return feature;
          }
        }
      }
      return undefined;
    },
    [grids]
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
    removeGridById,
    findGridAtCoordinate,
    updateGridById,
    getGridById,
  } as const;
}
