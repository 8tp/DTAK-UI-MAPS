import React, { useMemo, useState } from "react";
import { ShapeSource, CircleLayer, SymbolLayer, Images } from "@maplibre/maplibre-react-native";
import type { FeatureCollection, Feature, Point } from "geojson";
import { useMarkers } from "../state/MarkersProvider";
import { MarkerDetailsModal } from "./MarkerDetailsModal";
import { ICONS, ICONS_MAP } from "../constants/icons";

function markersToFeatureCollection(markers: Record<string, { lon: number; lat: number; iconId?: string }>): FeatureCollection<Point> {
  const features: Feature<Point>[] = [];
  for (const id of Object.keys(markers)) {
    const m = markers[id];
    features.push({
      type: "Feature",
      id,
      properties: { icon: m.iconId ?? "placeholder" },
      geometry: { type: "Point", coordinates: [m.lon, m.lat] },
    });
  }
  return { type: "FeatureCollection", features };
}

export function MarkersOverlay() {
  const { state, dispatch } = useMarkers();
  const [viewMarkerId, setViewMarkerId] = useState<string | undefined>(undefined);

  const featureCollection = useMemo(() => {
    return markersToFeatureCollection(state.markers);
  }, [state.markers]);

  const viewMarker = viewMarkerId ? state.markers[viewMarkerId] : undefined;

  return (
    <>
      <Images images={ICONS_MAP as any} />

      <ShapeSource id="markers" shape={featureCollection} onPress={(e: any) => {
        const id = e?.features?.[0]?.id as string | undefined;
        if (!id) return;
        setViewMarkerId(id);
      }}>
        <CircleLayer id="markers-circles" style={{ circleColor: "#ff3b30", circleRadius: 6 }} filter={["==", ["get", "icon"], "placeholder"] as any} />
        <SymbolLayer id="markers-symbols" style={{ iconImage: ["get", "icon"], iconAllowOverlap: true, iconIgnorePlacement: true, iconSize: 1.0 }} />
      </ShapeSource>

      <MarkerDetailsModal
        visible={!!viewMarker}
        mode="view"
        icons={ICONS as any}
        onCancel={() => setViewMarkerId(undefined)}
        onDelete={() => {
          if (!viewMarkerId) return;
          dispatch({ type: "removeMarker", payload: { id: viewMarkerId } });
          setViewMarkerId(undefined);
        }}
        marker={viewMarker ? { title: viewMarker.title, description: viewMarker.description, iconId: viewMarker.iconId, createdAt: viewMarker.createdAt } : undefined}
      />
    </>
  );
}


