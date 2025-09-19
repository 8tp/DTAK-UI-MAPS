import React, { forwardRef, useImperativeHandle, useState } from "react";
import { ShapeSource, SymbolLayer, type MapViewRef } from "@maplibre/maplibre-react-native";

export type MarkerCreationOverlayHandle = {
  startAtScreenPoint: (mapRef: MapViewRef, screenPoint: [number, number]) => Promise<void>;
  setIconId: (iconId: string) => void;
  getPendingCoord: () => [number, number] | undefined;
  cancel: () => void;
};

type Props = {
  onPreviewStart?: (coord: [number, number]) => void;
};

export const MarkerCreationOverlay = forwardRef<MarkerCreationOverlayHandle, Props>((props, ref) => {
  const [visible, setVisible] = useState(false);
  const [pendingCoord, setPendingCoord] = useState<[number, number] | undefined>(undefined);
  const [pendingIconId, setPendingIconId] = useState<string>("marker-default-pin");

  useImperativeHandle(
    ref,
    () => ({
      async startAtScreenPoint(mapRef: MapViewRef, screenPoint: [number, number]) {
        try {
          const coord = await (mapRef as any).getCoordinateFromView(screenPoint);
          if (
            Array.isArray(coord) &&
            coord.length >= 2 &&
            Number.isFinite(coord[0]) &&
            Number.isFinite(coord[1])
          ) {
            setPendingCoord([coord[0], coord[1]]);
            setPendingIconId("marker-default-pin");
            setVisible(true);
            props.onPreviewStart && props.onPreviewStart([coord[0], coord[1]]);
          }
        } catch {
          // ignore
        }
      },
      setIconId(iconId: string) {
        setPendingIconId(iconId || "marker-default-pin");
      },
      getPendingCoord() {
        return pendingCoord;
      },
      cancel() {
        setVisible(false);
        setPendingCoord(undefined);
      },
    }),
    [pendingCoord, props.onPreviewStart]
  );

  return (
    <>
      {visible &&
        pendingCoord &&
        Number.isFinite(pendingCoord[0]) &&
        Number.isFinite(pendingCoord[1]) && (
          <ShapeSource
            id="markerPreviewSource"
            shape={{
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  geometry: { type: "Point", coordinates: [pendingCoord[0], pendingCoord[1]] },
                  properties: { icon: pendingIconId || "marker-default-pin" },
                },
              ],
            } as any}
          >
            <SymbolLayer
              id="markerPreviewSymbol"
              style={{ iconImage: ["get", "icon"], iconAllowOverlap: true, iconIgnorePlacement: true, iconSize: 1.0 }}
            />
          </ShapeSource>
        )}
    </>
  );
});


