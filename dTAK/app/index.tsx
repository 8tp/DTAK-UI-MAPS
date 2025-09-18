import AccountMenu from "@components/AccountMenu";
import MapsSection from "@components/MapsSection";
import PluginsSection from "@components/PluginsSection";
import Toolbar from "@components/Toolbar";
import BottomSheet, {
	BottomSheetBackgroundProps,
	BottomSheetHandleProps,
	BottomSheetView,
} from "@gorhom/bottom-sheet";
import {
	Camera,
	FillLayer,
	LineLayer,
	MapView,
	RasterLayer,
	RasterSource,
	ShapeSource,
	type MapViewRef,
} from "@maplibre/maplibre-react-native";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import { GestureResponderEvent, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { performAction } from "../features/map/actions/radialActions";
import { DeleteOverlay } from "../features/map/components/DeleteOverlay";
import { RadialMenu } from "../features/map/components/RadialMenu";
import { useDrawCircle } from "../features/map/hooks/useDrawCircle";
import { useDrawSquare } from "../features/map/hooks/useDrawSquare";
import { useFeatureDeletion } from "../features/map/hooks/useFeatureDeletion";
import OfflineManagerSheet from "../features/offline/OfflineManagerSheet";
import type { BBox } from "../features/offline/tiles";
import { useOfflineMaps } from "../features/offline/useOfflineMaps";

const BOTTOM_SHEET_BACKGROUND = "#26292B";

const CustomBackground = ({ style }: BottomSheetBackgroundProps) => (
	<View style={[style, { backgroundColor: BOTTOM_SHEET_BACKGROUND, borderRadius: 16 }]} />
);

const CustomHandle = (_props: BottomSheetHandleProps) => (
	<View style={[styles.handleContainer]}>
		<View style={styles.handle} />
	</View>
);

// Map configurations for different tile sets
const mapConfigurations = {
	"new-york": {
		styleURL: "https://demotiles.maplibre.org/style.json",
		centerCoordinate: [-74.006, 40.7128] as [number, number],
		zoomLevel: 10,
	},
	chicago: {
		styleURL: "https://demotiles.maplibre.org/style.json",
		centerCoordinate: [-87.6298, 41.8781] as [number, number],
		zoomLevel: 10,
	},
	montgomery: {
		styleURL: "https://demotiles.maplibre.org/style.json",
		centerCoordinate: [-86.2999, 32.3617] as [number, number],
		zoomLevel: 10,
	},
};

export default function App() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const [visible, setVisible] = useState(false);
	const [anchor, setAnchor] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
	const [coordinate, setCoordinate] = useState<[number, number] | undefined>(undefined);
	const [selectedMap, setSelectedMap] = useState<string>("new-york");
	const [accountMenuVisible, setAccountMenuVisible] = useState(false);
	const [offlineMode, setOfflineMode] = useState<boolean>(false);
	const [showOfflineManager, setShowOfflineManager] = useState<boolean>(false);
	const [downloadBBox, setDownloadBBox] = useState<BBox | null>(null);
	const mapRef = useRef<MapViewRef | null>(null);
	const draw = useDrawCircle();
	const drawSquare = useDrawSquare();
	const { select } = useFeatureDeletion();
	const offline = useOfflineMaps();

	const sheetRef = useRef<BottomSheet>(null);

	const handleCameraPress = () => {
		router.push("/camera" as never);
	};
	const snapPoints = useMemo(() => ["32%", "55%", "90%"], []);
	const [bottomSheetIndex, setBottomSheetIndex] = useState(2);
	const isBottomSheetExpanded = bottomSheetIndex > -1;

	const handleSelect = (action: any) => {
		setVisible(false);
		const ctx = {
			screen: anchor,
			coordinate,
			startCircle: () => {
				if (mapRef.current) draw.start(mapRef.current);
			},
			startSquare: () => {
				if (mapRef.current) drawSquare.start(mapRef.current);
			},
		} as const;
		performAction(action, ctx);
	};

	const handleMapSelect = (mapId: string) => {
		setSelectedMap(mapId);
		// The map will automatically update when selectedMap state changes
		// since we're using it in the MapView props
	};

	const handlePluginPress = (pluginId: string) => {
		// Placeholder for plugin functionality
		console.log(`Plugin ${pluginId} pressed`);
	};

	const handleViewMoreMaps = () => {
		// Placeholder for view more maps functionality
		console.log("View more maps pressed");
	};

	const handleViewMorePlugins = () => {
		// Placeholder for view more plugins functionality
		console.log("View more plugins pressed");
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

	// decide tile template
	const remoteTemplate =
		"https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}.jpg?api_key=c177fb0b-10fa-4ba1-87ba-3a8446a7887d";
	const localTemplate = offline.getLocalTemplate(selectedMap, "jpg");
	const useLocal =
		// Force local tiles when offline mode is enabled OR device is offline
		offlineMode || !offline.isOnline
			? true
			: offline.packs.some((p) => p.mapId === selectedMap && p.status === "completed");

	// Build maps list with badges from offline aggregates
	const mapsForSection = [
		{
			id: "new-york",
			name: "New York",
			thumbnail: require("@assets/images/radial-pin.png"),
		},
		{ id: "chicago", name: "Chicago", thumbnail: require("@assets/images/radial-pin.png") },
		{
			id: "montgomery",
			name: "Montgomery",
			thumbnail: require("@assets/images/radial-pin.png"),
		},
	].map((m) => {
		const agg = offline.getAggregateForMap?.(m.id);
		let badgeText: string | undefined;
		let badgeColor: string | undefined;
		if (agg && agg.total > 0) {
			badgeText = `${agg.percent}%`;
			badgeColor = agg.hasCompleted ? "#16a34a" : "#334155";
		}
		return { ...m, selected: selectedMap === m.id, badgeText, badgeColor };
	});

	// Compute current camera bbox helper
	const getCurrentBBox = async (): Promise<[number, number, number, number] | null> => {
		try {
			if (!mapRef.current) return null;
			const visible = await (mapRef.current as any).getVisibleBounds?.();
			// MapLibre getVisibleBounds returns [[west, south], [east, north]]
			if (Array.isArray(visible) && visible.length === 2) {
				const west = visible[0][0];
				const south = visible[0][1];
				const east = visible[1][0];
				const north = visible[1][1];
				return [west, south, east, north];
			}
			return null;
		} catch {
			return null;
		}
	};

	return (
		<View style={styles.page}>
			<MapView ref={mapRef as any} style={styles.map} onLongPress={onMapLongPress}>
				<Camera
					zoomLevel={
						mapConfigurations[selectedMap as keyof typeof mapConfigurations].zoomLevel
					}
					centerCoordinate={
						mapConfigurations[selectedMap as keyof typeof mapConfigurations]
							.centerCoordinate
					}
				/>
				<RasterSource
					id="satelliteSource"
					key={`sat-src-${selectedMap}-${useLocal ? "local" : "remote"}`}
					tileUrlTemplates={[useLocal ? localTemplate : remoteTemplate]}
					tileSize={256}>
					<RasterLayer
						id="satelliteLayer"
						sourceID="satelliteSource"
						style={{ rasterOpacity: 1 }}
					/>
				</RasterSource>

				{/* Circle preview source */}
				{draw.sources.preview && (
					<ShapeSource id="circlePreviewSource" shape={draw.sources.preview}>
						<FillLayer
							id="circlePreviewFill"
							style={{ fillOpacity: 0.25, fillColor: "#3b82f6" }}
						/>
						<LineLayer
							id="circlePreviewLine"
							style={{ lineColor: "#3b82f6", lineWidth: 2 }}
						/>
					</ShapeSource>
				)}
				{/* Persisted circles */}
				{draw.sources.circles.features.length > 0 && (
					<ShapeSource id="circlesSource" shape={draw.sources.circles}>
						<FillLayer
							id="circlesFill"
							style={{ fillOpacity: 0.2, fillColor: "#2563eb" }}
						/>
						<LineLayer
							id="circlesLine"
							style={{ lineColor: "#2563eb", lineWidth: 2 }}
						/>
					</ShapeSource>
				)}
				{/* Square preview source */}
				{drawSquare.sources.preview && (
					<ShapeSource id="squarePreviewSource" shape={drawSquare.sources.preview}>
						<FillLayer
							id="squarePreviewFill"
							style={{ fillOpacity: 0.25, fillColor: "#22c55e" }}
						/>
						<LineLayer
							id="squarePreviewLine"
							style={{ lineColor: "#22c55e", lineWidth: 2 }}
						/>
					</ShapeSource>
				)}
				{/* Persisted squares */}
				{drawSquare.sources.squares.features.length > 0 && (
					<ShapeSource id="squaresSource" shape={drawSquare.sources.squares}>
						<FillLayer
							id="squaresFill"
							style={{ fillOpacity: 0.2, fillColor: "#16a34a" }}
						/>
						<LineLayer
							id="squaresLine"
							style={{ lineColor: "#16a34a", lineWidth: 2 }}
						/>
					</ShapeSource>
				)}
			</MapView>

			{/* Toolbar fixed at the top */}
			<SafeAreaView style={styles.toolbarContainer}>
				<Toolbar
					onAccountPress={() => setAccountMenuVisible((prev) => !prev)}
					onCameraPress={handleCameraPress}
				/>
			</SafeAreaView>

			{/* Bottom drawer always visible */}
			<BottomSheet
				ref={sheetRef}
				index={bottomSheetIndex}
				snapPoints={snapPoints}
				backgroundComponent={CustomBackground}
				handleComponent={CustomHandle}
				enablePanDownToClose
				bottomInset={insets.bottom}
				onChange={(index) => setBottomSheetIndex(index ?? 0)}
				style={styles.bottomSheet}>
				<BottomSheetView style={styles.contentContainer}>
					<View
						style={{
							flexDirection: "row",
							justifyContent: "space-between",
							alignItems: "center",
							marginBottom: 12,
						}}>
						<Pressable
							onPress={() => setOfflineMode((v) => !v)}
							style={{
								backgroundColor: offlineMode ? "#16a34a" : "#334155",
								paddingVertical: 8,
								paddingHorizontal: 12,
								borderRadius: 8,
							}}>
							<Text style={{ color: "#fff" }}>
								{offlineMode ? "Offline mode: ON" : "Offline mode: OFF"}
							</Text>
						</Pressable>
						<Pressable
							onPress={async () => {
								const bbox = await getCurrentBBox();
								if (bbox) setDownloadBBox(bbox);
								setShowOfflineManager(true);
							}}
							style={{
								backgroundColor: "#3b82f6",
								paddingVertical: 8,
								paddingHorizontal: 12,
								borderRadius: 8,
							}}>
							<Text style={{ color: "#fff" }}>Download current view</Text>
						</Pressable>
					</View>
					<MapsSection
						onMapSelect={handleMapSelect}
						onViewMore={handleViewMoreMaps}
						maps={mapsForSection}
					/>
					<PluginsSection
						onPluginPress={handlePluginPress}
						onViewMore={handleViewMorePlugins}
					/>
					{showOfflineManager && (
						<View style={{ marginTop: 12 }}>
							<OfflineManagerSheet
								mapId={selectedMap}
								currentBBox={
									downloadBBox ??
									((mapConfigurations[
										selectedMap as keyof typeof mapConfigurations
									].centerCoordinate
										? [
												mapConfigurations[
													selectedMap as keyof typeof mapConfigurations
												].centerCoordinate[0] - 0.05,
												mapConfigurations[
													selectedMap as keyof typeof mapConfigurations
												].centerCoordinate[1] - 0.05,
												mapConfigurations[
													selectedMap as keyof typeof mapConfigurations
												].centerCoordinate[0] + 0.05,
												mapConfigurations[
													selectedMap as keyof typeof mapConfigurations
												].centerCoordinate[1] + 0.05,
										  ]
										: [-86.35, 32.3, -86.25, 32.4]) as BBox)
								}
								remoteTemplate={remoteTemplate}
								defaultZoomMin={8}
								defaultZoomMax={14}
							/>
							<Pressable
								onPress={() => setShowOfflineManager(false)}
								style={{ marginTop: 8, alignItems: "center" }}>
								<Text style={{ color: "#94a3b8" }}>Close</Text>
							</Pressable>
						</View>
					)}
				</BottomSheetView>
			</BottomSheet>
			<View
				pointerEvents="none"
				style={[
					styles.bottomInsetOverlay,
					{
						height: insets.bottom,
						backgroundColor: isBottomSheetExpanded
							? BOTTOM_SHEET_BACKGROUND
							: "transparent",
					},
				]}
			/>

			{/* Delete overlay */}
			<DeleteOverlay />

			{/* Radial menu */}
			<RadialMenu
				visible={visible}
				anchor={anchor}
				onSelect={handleSelect}
				onRequestClose={() => setVisible(false)}
			/>

			<AccountMenu
				visible={accountMenuVisible}
				onClose={() => setAccountMenuVisible(false)}
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
		padding: 24,
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
	bottomInsetOverlay: {
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
