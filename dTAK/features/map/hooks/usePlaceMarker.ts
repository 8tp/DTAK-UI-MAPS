import { useCallback, useMemo, useRef, useState } from "react";
import type { MapViewRef } from "@maplibre/maplibre-react-native";
import type { Feature, Point } from "geojson";

type InteractionMode = "DEFAULT" | "PLACE_MARKER";

export function usePlaceMarker() {
    const [mode, setMode] = useState<InteractionMode>("DEFAULT");
    const [preview, setPreview] = useState<Feature<Point> | undefined>(undefined);
    const mapRef = useRef<MapViewRef | null>(null);

    const start = useCallback((ref: MapViewRef) => {
        mapRef.current = ref;
        setMode("PLACE_MARKER");
        setPreview(undefined);
    }, []);

    const cancel = useCallback(() => {
        setMode("DEFAULT");
        setPreview(undefined);
        mapRef.current = null;
    }, []);

    const onMove = useCallback(async (screenPoint: [number, number]) => {
        if (mode !== "PLACE_MARKER" || !mapRef.current) return;
        const coord = await mapRef.current.getCoordinateFromView(screenPoint);
        setPreview({
            type: "Feature",
            geometry: { type: "Point", coordinates: [coord[0], coord[1]] },
            properties: {},
        });
    }, [mode]);

    const onRelease = useCallback(async (screenPoint?: [number, number]) => {
        if (mode !== "PLACE_MARKER" || !mapRef.current) return undefined;
        let coord: [number, number] | undefined;
        if (screenPoint) {
            const c = await mapRef.current.getCoordinateFromView(screenPoint);
            coord = [c[0], c[1]];
        } else if (preview?.geometry?.type === "Point") {
            coord = preview.geometry.coordinates as [number, number];
        }
        setMode("DEFAULT");
        setPreview(undefined);
        mapRef.current = null;
        return coord;
    }, [mode, preview]);

    const sources = useMemo(() => {
        if (!preview) return undefined;
        return { type: "FeatureCollection", features: [preview] } as const;
    }, [preview]);

    return {
        mode,
        start,
        cancel,
        onMove,
        onRelease,
        preview,
        sources,
    } as const;
}


