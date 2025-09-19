import React, { useMemo } from "react";
import { ShapeSource, CircleLayer, SymbolLayer, Images } from "@maplibre/maplibre-react-native";
import type { FeatureCollection, Feature, Point } from "geojson";
import { useMarkers } from "../state/MarkersProvider";
import { ICONS_MAP } from "../constants/icons";

type Props = {
  onMarkerPress?: (id: string) => void;
};

function markersToFeatureCollection(markers: Record<string, { lon: number; lat: number; iconId?: string }>): FeatureCollection<Point> {
  const features: Feature<Point>[] = [];
  for (const id of Object.keys(markers)) {
    const m = markers[id];
    features.push({
      type: "Feature",
      properties: { icon: m.iconId ?? "placeholder", markerId: id },
      geometry: { type: "Point", coordinates: [m.lon, m.lat] },
    });
  }
  return { type: "FeatureCollection", features };
}

export function MarkersOverlay({ onMarkerPress }: Props) {
  const { state, dispatch } = useMarkers();

  const featureCollection = useMemo(() => {
    return markersToFeatureCollection(state.markers);
  }, [state.markers]);

  return (
    <>
      <Images images={ICONS_MAP as any} />

      <ShapeSource id="markers" shape={featureCollection} onPress={(e: any) => {
        const fid = e?.features?.[0]?.properties?.markerId as string | undefined;
        if (!fid) return;
        onMarkerPress && onMarkerPress(fid);
      }}>
        <CircleLayer id="markers-circles" aboveLayerID="satelliteLayer" style={{ circleColor: "#ff3b30", circleRadius: 6 }} filter={["==", ["get", "icon"], "placeholder"] as any} />
        <SymbolLayer id="markers-symbols" aboveLayerID="satelliteLayer" style={{ iconImage: ["get", "icon"], iconAllowOverlap: true, iconIgnorePlacement: true, iconSize: 1.0 }} filter={["!=", ["get", "icon"], "placeholder"] as any} />
      </ShapeSource>
    </>
  );
}


