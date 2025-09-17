import { useCallback, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { MapViewRef } from "@maplibre/maplibre-react-native";
import { approximateSquare, pointInPolygon } from "../utils/geometry/square";
import { metersBetween, type LonLat } from "../utils/geometry/geodesy";

type InteractionMode = "DEFAULT" | "DRAW_SQUARE";

export type SquareFeature = GeoJSON.Feature<GeoJSON.Polygon, {
    id: string;
    center: LonLat;
    halfDiagonal: number;
    units: "meters";
}>;

function generateSquareId(): string {
    return uuidv4();
}

export function useDrawSquare() {
    const [mode, setMode] = useState<InteractionMode>("DEFAULT");
    const [center, setCenter] = useState<LonLat | undefined>(undefined);
    const [halfDiagonal, setHalfDiagonal] = useState<number | undefined>(undefined);
    const [preview, setPreview] = useState<GeoJSON.Feature<GeoJSON.Polygon> | undefined>(undefined);
    const [squares, setSquares] = useState<GeoJSON.FeatureCollection<GeoJSON.Polygon>>({ type: "FeatureCollection", features: [] });

    const mapRef = useRef<MapViewRef | null>(null);

    const start = useCallback((mapRefInstance: MapViewRef) => {
        mapRef.current = mapRefInstance;
        setMode("DRAW_SQUARE");
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

    const onTap = useCallback(async (point: [number, number]) => {
        if (mode !== "DRAW_SQUARE") return;
        if (!mapRef.current) return;
        const coord = await mapRef.current.getCoordinateFromView(point);
        setCenter([coord[0], coord[1]]);
    }, [mode]);

    const throttled = useRef<number | null>(null);
    const onDrag = useCallback(async (point: [number, number]) => {
        if (mode !== "DRAW_SQUARE" || !center) return;
        if (!mapRef.current) return;
        const now = Date.now();
        if (throttled.current && now - throttled.current < 75) return;
        throttled.current = now;
        const coord = await mapRef.current.getCoordinateFromView(point);
        const hd = metersBetween(center, [coord[0], coord[1]]);
        setHalfDiagonal(hd);
        const poly = approximateSquare(center, Math.max(0, hd));
        setPreview({ type: "Feature", geometry: poly, properties: {} });
    }, [mode, center]);

    const onRelease = useCallback(async (point?: [number, number]) => {
        if (mode !== "DRAW_SQUARE" || !center) return;
        let finalHalf = halfDiagonal ?? 0;
        if (point && mapRef.current && finalHalf === 0) {
            const coord = await mapRef.current.getCoordinateFromView(point);
            finalHalf = metersBetween(center, [coord[0], coord[1]]);
        }
        const poly = approximateSquare(center, Math.max(0, finalHalf));
        const feature: SquareFeature = {
            type: "Feature",
            geometry: poly,
            properties: {
                id: generateSquareId(),
                center,
                halfDiagonal: Math.max(0, finalHalf),
                units: "meters",
            },
        };
        setSquares(prev => ({ type: "FeatureCollection", features: [...prev.features, feature] }));
        setPreview(undefined);
        setCenter(undefined);
        setHalfDiagonal(undefined);
        setMode("DEFAULT");
    }, [mode, center, halfDiagonal]);

    const removeSquareById = useCallback((id: string) => {
        setSquares(prev => ({
            type: "FeatureCollection",
            features: prev.features.filter(f => (f.properties as any)?.id !== id),
        }));
    }, []);

    const findSquareAtCoordinate = useCallback((coord: LonLat) => {
        for (const feature of squares.features as SquareFeature[]) {
            if (pointInPolygon(coord, feature.geometry)) {
                return feature;
            }
        }
        return undefined;
    }, [squares]);

    const sources = useMemo(() => ({
        squares,
        preview,
    }), [squares, preview]);

    return {
        mode,
        start,
        stop,
        onTap,
        onDrag,
        onRelease,
        sources,
        mapRef,
        removeSquareById,
        findSquareAtCoordinate,
    } as const;
}


