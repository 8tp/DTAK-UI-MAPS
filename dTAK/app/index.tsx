import Toolbar from "@components/Toolbar";
import BottomSheet, {
	BottomSheetBackgroundProps,
	BottomSheetHandleProps,
	BottomSheetView,
} from "@gorhom/bottom-sheet";
import {
	Camera,
	MapView,
	RasterLayer,
	RasterSource,
	ShapeSource,
	FillLayer,
	LineLayer,
	type MapViewRef,
} from "@maplibre/maplibre-react-native";
import React, { useRef, useState } from "react";
import { GestureResponderEvent, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { performAction } from "../features/map/actions/radialActions";
import { RadialMenu } from "../features/map/components/RadialMenu";
import { useDrawCircle } from "../features/map/hooks/useDrawCircle";
import { useDrawSquare } from "../features/map/hooks/useDrawSquare";
import { useFeatureDeletion } from "../features/map/hooks/useFeatureDeletion";
import { DeleteOverlay } from "../features/map/components/DeleteOverlay";

const CustomBackground = ({ style }: BottomSheetBackgroundProps) => (
	<View style={[style, { backgroundColor: "#26292B", borderRadius: 16 }]} />
);

const CustomHandle = ({}: BottomSheetHandleProps) => (
	<View style={[styles.handleContainer]}>
		<View style={styles.handle} />
	</View>
);

export default function App() {
	const [visible, setVisible] = useState(false);
	const [anchor, setAnchor] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
	const [coordinate, setCoordinate] = useState<[number, number] | undefined>(undefined);
	const mapRef = useRef<MapViewRef | null>(null);
    const draw = useDrawCircle();
    const drawSquare = useDrawSquare();
	const { select } = useFeatureDeletion();

	const sheetRef = useRef<BottomSheet>(null);

	const handleSelect = (action: any) => {
		setVisible(false);
        const ctx = {
            screen: anchor,
            coordinate,
            startCircle: () => { if (mapRef.current) draw.start(mapRef.current); },
            startSquare: () => { if (mapRef.current) drawSquare.start(mapRef.current); },
        } as const;
		performAction(action, ctx);
	};

	const onMapLongPress = (e: any) => {
		// Reveal the bottom sheet when long pressing
		sheetRef.current?.snapToIndex(1);

		const coord = e?.geometry?.coordinates ?? e?.coordinates;
		const pointArray =
			e?.point ??
			(e?.properties ? [e.properties.screenPointX, e.properties.screenPointY] : undefined);

		if (Array.isArray(pointArray) && pointArray.length >= 2) {
			setAnchor({ x: pointArray[0], y: pointArray[1] });
		}

        if (Array.isArray(coord) && coord.length >= 2) {
            const square = drawSquare.findSquareAtCoordinate([coord[0], coord[1]]);
            if (square) {
                select({
                    id: (square.properties as any).id,
                    type: "square",
                    delete: () => drawSquare.removeSquareById((square.properties as any).id),
                });
                setVisible(false);
                return;
            }
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
			<MapView ref={mapRef as any} style={styles.map} onLongPress={onMapLongPress} styleURL="https://demotiles.maplibre.org/style.json">
				<Camera zoomLevel={5} centerCoordinate={[-95.7129, 37.0902]} />
				<RasterSource
					id="satelliteSource"
					tileUrlTemplates={[
						"https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}.jpg?api_key=c177fb0b-10fa-4ba1-87ba-3a8446a7887d",
					]}
					tileSize={256}
				>
					<RasterLayer id="satelliteLayer" sourceID="satelliteSource" style={{ rasterOpacity: 1 }} />
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
                {/* Square preview source */}
                {drawSquare.sources.preview && (
                    <ShapeSource id="squarePreviewSource" shape={drawSquare.sources.preview}>
                        <FillLayer id="squarePreviewFill" style={{ fillOpacity: 0.25, fillColor: "#22c55e" }} />
                        <LineLayer id="squarePreviewLine" style={{ lineColor: "#22c55e", lineWidth: 2 }} />
                    </ShapeSource>
                )}
                {/* Persisted squares */}
                {drawSquare.sources.squares.features.length > 0 && (
                    <ShapeSource id="squaresSource" shape={drawSquare.sources.squares}>
                        <FillLayer id="squaresFill" style={{ fillOpacity: 0.2, fillColor: "#16a34a" }} />
                        <LineLayer id="squaresLine" style={{ lineColor: "#16a34a", lineWidth: 2 }} />
                    </ShapeSource>
                )}
			</MapView>

			{/* Toolbar fixed at the top */}
			<SafeAreaView style={styles.toolbarContainer}>
				<Toolbar />
			</SafeAreaView>

			{/* Bottom drawer always visible */}
			<BottomSheet
				ref={sheetRef}
				index={2}
				snapPoints={["25%", "50%", "90%"]}
				backgroundComponent={CustomBackground}
				handleComponent={CustomHandle}
				enablePanDownToClose
				style={styles.bottomSheet}
			>
				<BottomSheetView style={styles.contentContainer}>
					<Text>Awesome 🎉</Text>
				</BottomSheetView>
			</BottomSheet>

			{/* Delete overlay */}
			<DeleteOverlay />

			{/* Radial menu */}
			<RadialMenu
				visible={visible}
				anchor={anchor}
				onSelect={handleSelect}
				onRequestClose={() => setVisible(false)}
			/>

			{/* Gesture overlay for draw circle mode */}
            {draw.mode === "DRAW_CIRCLE" && (
				<View
					style={StyleSheet.absoluteFill}
					pointerEvents="box-only"
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
            {drawSquare.mode === "DRAW_SQUARE" && (
                <View
                    style={StyleSheet.absoluteFill}
                    pointerEvents="box-only"
                    onStartShouldSetResponder={() => true}
                    onMoveShouldSetResponder={() => true}
                    onResponderGrant={(e: GestureResponderEvent) => {
                        const { locationX, locationY } = e.nativeEvent;
                        drawSquare.onTap([locationX, locationY]);
                    }}
                    onResponderMove={(e: GestureResponderEvent) => {
                        const { locationX, locationY } = e.nativeEvent;
                        drawSquare.onDrag([locationX, locationY]);
                    }}
                    onResponderRelease={(e: GestureResponderEvent) => {
                        const { locationX, locationY } = e.nativeEvent;
                        drawSquare.onRelease([locationX, locationY]);
                    }}
                />
            )}
		</View>
	);
}

const styles = StyleSheet.create({
	page: { flex: 1 },
	map: { flex: 1 },
	contentContainer: {
		flex: 1,
		padding: 36,
		alignItems: "center",
	},
	// Toolbar locked at top
	toolbarContainer: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
	},
	// BottomSheet always docked at bottom
	bottomSheet: {
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 0,
	},
	handleContainer: {
		alignItems: "center",
		paddingVertical: 8,
	},
	handle: {
		width: 40,
		height: 4,
		borderRadius: 2,
		backgroundColor: "#626A6F",
	},
});


