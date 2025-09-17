// App.tsx
import { Camera, MapView, RasterLayer, RasterSource, ShapeSource, FillLayer, LineLayer, type MapViewRef } from "@maplibre/maplibre-react-native";
import React, { useRef, useState } from "react";
import { GestureResponderEvent, PanResponder, StyleSheet, View, TouchableOpacity } from "react-native";
import { RadialMenu } from "../features/map/components/RadialMenu";
import { performAction } from "../features/map/actions/radialActions";
import { useDrawCircle } from "../features/map/hooks/useDrawCircle";
import { useFeatureDeletion } from "../features/map/hooks/useFeatureDeletion";
import { DeleteOverlay } from "../features/map/components/DeleteOverlay";

export default function App() {
    const [visible, setVisible] = useState(false);
    const [anchor, setAnchor] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [coordinate, setCoordinate] = useState<[number, number] | undefined>(undefined);
    const mapRef = useRef<MapViewRef | null>(null);
    const draw = useDrawCircle();
    const { select } = useFeatureDeletion();

	const onLongPress = (e: any) => {
		const coord = e?.geometry?.coordinates ?? e?.coordinates;
		const pointArray =
			e?.point ??
			(e?.properties
				? [e.properties.screenPointX, e.properties.screenPointY]
				: undefined);

		if (Array.isArray(pointArray) && pointArray.length >= 2) {
			setAnchor({ x: pointArray[0], y: pointArray[1] });
		}
		if (Array.isArray(coord) && coord.length >= 2) {
			setCoordinate([coord[0], coord[1]]);
		} else {
			setCoordinate(undefined);
		}
		setVisible(true);
	};

    const handleSelect = (action: any) => {
        setVisible(false);
        if (action === "circle" && mapRef.current) {
            draw.start(mapRef.current);
            return;
        }
        performAction(action, { screen: anchor, coordinate });
    };

    const onMapLongPress = (e: any) => {
        const coord = e?.geometry?.coordinates ?? e?.coordinates;
        const pointArray =
            e?.point ??
            (e?.properties
                ? [e.properties.screenPointX, e.properties.screenPointY]
                : undefined);

        if (Array.isArray(pointArray) && pointArray.length >= 2) {
            setAnchor({ x: pointArray[0], y: pointArray[1] });
        }

        if (Array.isArray(coord) && coord.length >= 2) {
            const circle = draw.findCircleAtCoordinate([coord[0], coord[1]]);
            if (circle) {
                select({
                    id: circle.properties.id,
                    type: "circle",
                    delete: () => draw.removeCircleById(circle.properties.id),
                });
                setVisible(false);
                return;
            }
            setCoordinate([coord[0], coord[1]]);
        } else {
            setCoordinate(undefined);
        }
        setVisible(true);
    };

	return (
		<View style={styles.page}>
            {/* @ts-expect-error styleURL exists on MapLibre MapView at runtime */}
            <MapView ref={mapRef as any} style={styles.map} onLongPress={onMapLongPress} onPress={(f) => {
                if (draw.mode === "DRAW_CIRCLE" && !draw.sources.preview) {
                    // First tap to set center uses screen coord
                    // f.properties has screenPointX/Y on MapLibreRN feature payload
                    // If unavailable, approximate via getPointInView fallback (not needed here)
                }
            }} styleURL="https://demotiles.maplibre.org/style.json">
				<Camera zoomLevel={5} centerCoordinate={[-95.7129, 37.0902]} />
				{/* RasterSource uses `tileUrlTemplates` (array of URL templates) */}
				{/* TODO: implement variable amount of raster sources */}
				<RasterSource
					id="satelliteSource"
					tileUrlTemplates={[
						"https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}.jpg?api_key=c177fb0b-10fa-4ba1-87ba-3a8446a7887d",
					]}
					tileSize={256}>
					{/* use sourceID to reference the source */}
					<RasterLayer
						id="satelliteLayer"
						sourceID="satelliteSource"
						style={{ rasterOpacity: 1 }}
					/>
				</RasterSource>
                {/* Circle preview source */}
                {draw.sources.preview && (
                    <ShapeSource id="circlePreviewSource" shape={draw.sources.preview}>
                        <FillLayer id="circlePreviewFill" style={{ fillOpacity: 0.25, fillColor: "#3b82f6" }} />
                        <LineLayer id="circlePreviewLine" style={{ lineColor: "#3b82f6", lineWidth: 2 }} />
                    </ShapeSource>
                )}
                {/* Persisted circles */}
                {draw.sources.circles.features.length > 0 && (
                    <ShapeSource id="circlesSource" shape={draw.sources.circles}>
                        <FillLayer id="circlesFill" style={{ fillOpacity: 0.2, fillColor: "#2563eb" }} />
                        <LineLayer id="circlesLine" style={{ lineColor: "#2563eb", lineWidth: 2 }} />
                    </ShapeSource>
                )}
            </MapView>
            <DeleteOverlay />
			<RadialMenu
				visible={visible}
				anchor={anchor}
				onSelect={handleSelect}
				onRequestClose={() => setVisible(false)}
			/>
            {/* Gesture overlay for draw circle mode */}
            {draw.mode === "DRAW_CIRCLE" && (
                <View style={StyleSheet.absoluteFill} pointerEvents="box-only"
                    onStartShouldSetResponder={() => true}
                    onMoveShouldSetResponder={() => true}
                    onResponderGrant={(e: GestureResponderEvent) => {
                        const { locationX, locationY } = e.nativeEvent;
                        draw.onTap([locationX, locationY]);
                    }}
                    onResponderMove={(e: GestureResponderEvent) => {
                        const { locationX, locationY } = e.nativeEvent;
                        draw.onDrag([locationX, locationY]);
                    }}
                    onResponderRelease={(e: GestureResponderEvent) => {
                        const { locationX, locationY } = e.nativeEvent;
                        draw.onRelease([locationX, locationY]);
                    }}
                />
            )}
		</View>
	);
}

const styles = StyleSheet.create({
	page: { flex: 1 },
	map: { flex: 1 },
    trashButton: {
        position: "absolute",
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#ef4444",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
    },
});
