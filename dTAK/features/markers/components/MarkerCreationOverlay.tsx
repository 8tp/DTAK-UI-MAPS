import React, { forwardRef, useImperativeHandle, useState } from "react";
import { ShapeSource, SymbolLayer, type MapViewRef } from "@maplibre/maplibre-react-native";
import { useMarkers } from "../state/MarkersProvider";
import { MarkerDetailsModal } from "./MarkerDetailsModal";
import { ICONS } from "../constants/icons";

export type MarkerCreationOverlayHandle = {
  startAtScreenPoint: (mapRef: MapViewRef, screenPoint: [number, number]) => Promise<void>;
};

export const MarkerCreationOverlay = forwardRef<MarkerCreationOverlayHandle, {}>((_props, ref) => {
  const { dispatch } = useMarkers();
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
          }
        } catch {
          // ignore
        }
      },
    }),
    []
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

      <MarkerDetailsModal
        visible={visible}
        mode="create"
        initialIconId="marker-default-pin"
        icons={ICONS}
        onCancel={() => {
          setVisible(false);
          setPendingCoord(undefined);
        }}
        onIconChange={(id) => setPendingIconId(id)}
        onSave={({ title, description, iconId }) => {
          if (!pendingCoord) return;
          const [lon, lat] = pendingCoord;
          dispatch({ type: "addMarker", payload: { lon, lat, meta: { title, description, iconId } } });
          setVisible(false);
          setPendingCoord(undefined);
        }}
      />
    </>
  );
});


