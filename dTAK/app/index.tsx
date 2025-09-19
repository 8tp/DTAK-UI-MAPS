import AccountMenu from "@components/AccountMenu";
import MapsSection from "@components/MapsSection";
import PluginsSection from "@components/PluginsSection";
import Toolbar from "@components/Toolbar";
import ChatInboxModal, { type ChatThread, type MinimalUser } from "@components/chat/ChatInboxModal";
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
	UserLocation,
	type MapViewRef,
} from "@maplibre/maplibre-react-native";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GestureResponderEvent, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { performAction } from "../features/map/actions/radialActions";
import { RadialMenu } from "../features/map/components/RadialMenu";
import { CircleDetailsModal } from "../features/map/components/CircleDetailsModal";
import { SquareDetailsModal } from "../features/map/components/SquareDetailsModal";
import { GridDetailsModal } from "../features/map/components/GridDetailsModal";
import { useDrawCircle } from "../features/map/hooks/useDrawCircle";
import { useDrawSquare } from "../features/map/hooks/useDrawSquare";
import { useDrawGrid } from "../features/map/hooks/useDrawGrid";
import {
	MarkerCreationOverlay,
	type MarkerCreationOverlayHandle,
} from "../features/markers/components/MarkerCreationOverlay";
import { MarkersOverlay } from "../features/markers/components/MarkersOverlay";
import { MarkerDetailsModal } from "../features/markers/components/MarkerDetailsModal";
import { ICONS } from "../features/markers/constants/icons";
import OfflineManagerSheet from "../features/offline/OfflineManagerSheet";
import type { BBox } from "../features/offline/tiles";
import { useOfflineMaps } from "../features/offline/useOfflineMaps";
import { GiftedChat, IMessage } from "react-native-gifted-chat";
import { useMarkers } from "../features/markers/state/MarkersProvider";

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
	const [isChatOpen, setIsChatOpen] = useState(false);
	const mapRef = useRef<MapViewRef | null>(null);
	const draw = useDrawCircle();
	const drawSquare = useDrawSquare();
	const drawGrid = useDrawGrid();
	const offline = useOfflineMaps();
	const { state: markersState, dispatch: markersDispatch } = useMarkers();
	const markerCreationRef = useRef<MarkerCreationOverlayHandle | null>(null);
	const [createCircleId, setCreateCircleId] = useState<string | undefined>(undefined);
	const [viewCircleId, setViewCircleId] = useState<string | undefined>(undefined);
	const [createSquareId, setCreateSquareId] = useState<string | undefined>(undefined);
	const [viewSquareId, setViewSquareId] = useState<string | undefined>(undefined);
	const [createGridId, setCreateGridId] = useState<string | undefined>(undefined);
	const [viewGridId, setViewGridId] = useState<string | undefined>(undefined);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [createIconId, setCreateIconId] = useState<string>("marker-default-pin");
    const [pendingCreateCoord, setPendingCreateCoord] = useState<[number, number] | undefined>(undefined);
    const [viewMarkerId, setViewMarkerId] = useState<string | undefined>(undefined);

	const sheetRef = useRef<BottomSheet>(null);

	React.useEffect(() => {
		(async () => {
			try {
				await Location.requestForegroundPermissionsAsync();
			} catch {}
		})();
	}, []);

	const handleCameraPress = () => {
		router.push("/camera" as never);
	};
	const snapPoints = useMemo(() => ["32%", "55%", "90%"], []);
	const [bottomSheetIndex, setBottomSheetIndex] = useState(2);
	const isBottomSheetExpanded = bottomSheetIndex > -1;
	const ackTimeouts = useRef<Record<string, Array<ReturnType<typeof setTimeout>>>>({});
	const chatThreadsRef = useRef<ChatThread[]>([]);

	const currentUser = useMemo<MinimalUser>(
		() => ({
			_id: "home-user",
			name: "Jordan Rivera",
		}),
		[],
	);

	const familyMembers = useMemo(() => {
		return {
			spouse: {
				_id: "chat-family-maya",
				name: "Maya Rivera",
			} satisfies MinimalUser,
			child: {
				_id: "chat-family-sofia",
				name: "Sofia Rivera",
			} satisfies MinimalUser,
		};
	}, []);

	const peerDirectory = useMemo(() => {
		return {
			familyGroup: {
				_id: "chat-family",
				name: "Rivera Family",
			} satisfies MinimalUser,
			neighbor: {
				_id: "chat-neighbor",
				name: "Chris (Neighbor)",
			} satisfies MinimalUser,
			emsDispatch: {
				_id: "chat-ems",
				name: "City EMS Dispatch",
			} satisfies MinimalUser,
		};
	}, []);

	const initialThreads = useMemo<ChatThread[]>(() => {
		const now = Date.now();
		return [
			{
				id: "family-thread",
				title: "Rivera Family",
				peer: peerDirectory.familyGroup,
				messages: [
					{
						_id: "family-msg-2",
						text: "We're unpacking at Grandma's. River Road is already under water, I'll keep the updates coming.",
						createdAt: new Date(now - 1000 * 60 * 2),
						user: familyMembers.spouse,
					},
					{
						_id: "family-msg-1",
						text: "Grandma says hi! I grabbed the radio from the garage so we have it with us.",
						createdAt: new Date(now - 1000 * 60 * 4),
						user: familyMembers.child,
					},
					{
						_id: "family-msg-0",
						text: "Go-bags are ready. Leaving the house in 15 once the rain stops.",
						createdAt: new Date(now - 1000 * 60 * 9),
						user: currentUser,
					},
				],
			},
			{
				id: "neighbor-thread",
				title: "Chris (Neighbor)",
				peer: peerDirectory.neighbor,
				messages: [
					{
						_id: "neighbor-msg-1",
						text: "Water's at the curb. I can help stack sandbags if you need it.",
						createdAt: new Date(now - 1000 * 60 * 6),
						user: peerDirectory.neighbor,
					},
					{
						_id: "neighbor-msg-0",
						text: "Thanks, Chris. Pump is running but the basement drain is backing up.",
						createdAt: new Date(now - 1000 * 60 * 11),
						user: currentUser,
					},
				],
			},
			{
				id: "ems-thread",
				title: "EMS Dispatch",
				peer: peerDirectory.emsDispatch,
				messages: [
					{
						_id: "ems-msg-2",
						text: "Rescue boat en route, ETA 12 minutes. Stay on high ground and keep lights on.",
						createdAt: new Date(now - 1000 * 60 * 2),
						user: peerDirectory.emsDispatch,
					},
					{
						_id: "ems-msg-1",
						text: "We have two seniors with limited mobility and rising water in the living room.",
						createdAt: new Date(now - 1000 * 60 * 5),
						user: currentUser,
					},
					{
						_id: "ems-msg-0",
						text: "Copy. Confirming flash flood emergency at 482 River Bend?",
						createdAt: new Date(now - 1000 * 60 * 7),
						user: peerDirectory.emsDispatch,
					},
				],
			},
		];
	}, [peerDirectory, currentUser, familyMembers]);

	const [chatThreads, setChatThreads] = useState<ChatThread[]>(() => initialThreads);

	useEffect(() => {
		chatThreadsRef.current = chatThreads;
	}, [chatThreads]);

	useEffect(() => {
		return () => {
			Object.values(ackTimeouts.current).forEach((timeouts) => {
				timeouts.forEach(clearTimeout);
			});
			ackTimeouts.current = {};
		};
	}, []);

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
			startGrid: () => {
				if (mapRef.current) drawGrid.start(mapRef.current);
			},
			startMarker: () => {
				if (mapRef.current && anchor) {
					markerCreationRef.current?.startAtScreenPoint(mapRef.current, [
						anchor.x,
						anchor.y,
					]);
				}
			},
		} as const;
		performAction(action, ctx);
	};

	const handleMapSelect = (mapId: string) => {
		setSelectedMap(mapId);
		// The map will automatically update when selectedMap state changes
		// since we're using it in the MapView props
	};

	const handleChatPress = useCallback(() => {
		setIsChatOpen(true);
	}, []);

	const handleChatDismiss = useCallback(() => {
		setIsChatOpen(false);
	}, []);

	const handlePluginPress = useCallback(
		(pluginId: string) => {
			if (pluginId === "chat") {
				handleChatPress();
				return;
			}

			// Placeholder for plugin functionality
			console.log(`Plugin ${pluginId} pressed`);
		},
		[handleChatPress],
	);

	const handleViewMoreMaps = () => {
		// Placeholder for view more maps functionality
		console.log("View more maps pressed");
	};

	const handleViewMorePlugins = () => {
		// Placeholder for view more plugins functionality
		console.log("View more plugins pressed");
	};

	const handleChatSend = useCallback((threadId: string, outgoingMessages: IMessage[] = []) => {
		if (outgoingMessages.length === 0) {
			return;
		}

		const targetThread = chatThreadsRef.current.find((thread) => thread.id === threadId);
		if (!targetThread) {
			return;
		}

		setChatThreads((previousThreads) =>
			previousThreads.map((thread) =>
				thread.id === threadId
					? { ...thread, messages: GiftedChat.append(thread.messages, outgoingMessages) }
					: thread,
			),
		);

		const [firstMessage] = outgoingMessages;
		if (!firstMessage) {
			return;
		}

		const acknowledgement: IMessage = {
			_id: `ack-${threadId}-${firstMessage._id}-${Date.now()}`,
			text: "Okay, got it.",
			createdAt: new Date(Date.now() + 500),
			user: targetThread.peer,
		};

		const timeout = setTimeout(() => {
			setChatThreads((previousThreads) =>
				previousThreads.map((thread) =>
					thread.id === threadId
						? { ...thread, messages: GiftedChat.append(thread.messages, [acknowledgement]) }
						: thread,
				),
			);
			ackTimeouts.current[threadId] = (ackTimeouts.current[threadId] ?? []).filter(
				(item) => item !== timeout,
			);
		}, 650 + Math.random() * 600);

		ackTimeouts.current[threadId] = [...(ackTimeouts.current[threadId] ?? []), timeout];
	}, []);

	const onMapLongPress = (e: any) => {
		const coord = e?.geometry?.coordinates ?? e?.coordinates;
		const pointArray =
			e?.point ??
			(e?.properties ? [e.properties.screenPointX, e.properties.screenPointY] : undefined);

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
			{/* Set a base style URL to ensure proper layer graph and ordering */}
			<MapView
				ref={mapRef as any}
				style={styles.map}
				onLongPress={onMapLongPress}
				{...({ styleURL: "https://demotiles.maplibre.org/style.json" } as any)}>
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
					<ShapeSource
						id="circlesSource"
						shape={draw.sources.circles}
						onPress={(e: any) => {
							const id = e?.features?.[0]?.properties?.id as string | undefined;
							if (!id) return;
							setViewCircleId(id);
						}}
					>
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
					<ShapeSource
						id="squaresSource"
						shape={drawSquare.sources.squares}
						onPress={(e: any) => {
							const id = e?.features?.[0]?.properties?.id as string | undefined;
							if (!id) return;
							setViewSquareId(id);
						}}
					>
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
				{/* Grid preview source (white thick lines, no fill) */}
				{drawGrid.sources.preview && (
					<ShapeSource id="gridPreviewSource" shape={drawGrid.sources.preview}>
						<LineLayer
							id="gridPreviewLine"
							style={{
								lineColor: "#FFFFFF",
								lineWidth: 4,
								lineOpacity: 1,
								lineCap: "round",
								lineJoin: "round",
							}}
						/>
					</ShapeSource>
				)}
				{/* Persisted grids */}
				{drawGrid.sources.grids && drawGrid.sources.grids.features.length > 0 && (
					<ShapeSource
						id="gridsSource"
						shape={drawGrid.sources.grids}
						onPress={(e: any) => {
							const id = e?.features?.[0]?.properties?.id as string | undefined;
							if (!id) return;
							setViewGridId(id);
						}}
					>
						<LineLayer
							id="gridsLine"
							style={{
								lineColor: "#FFFFFF",
								lineWidth: 4,
								lineOpacity: 1,
								lineCap: "round",
								lineJoin: "round",
							}}
						/>
					</ShapeSource>
				)}
				{/* Markers overlay */}
				<MarkersOverlay onMarkerPress={(id) => setViewMarkerId(id)} />
				{/* Marker creation overlay with preview + modal (must be inside MapView) */}
				<MarkerCreationOverlay
					ref={markerCreationRef}
					onPreviewStart={(coord) => {
						setPendingCreateCoord(coord);
						setCreateIconId("marker-default-pin");
						setCreateModalVisible(true);
					}}
				/>

				{/* User location marker */}
				<UserLocation />
			</MapView>
			{/* Marker Details Modal - Create */}
			<MarkerDetailsModal
				visible={createModalVisible}
				mode="create"
				initialIconId={createIconId}
				icons={ICONS}
				onCancel={() => {
					setCreateModalVisible(false);
					setPendingCreateCoord(undefined);
					markerCreationRef.current?.cancel();
				}}
				onIconChange={(id) => {
					setCreateIconId(id);
					markerCreationRef.current?.setIconId(id);
				}}
				onSave={({ title, description, iconId }) => {
					if (!pendingCreateCoord) return;
					const [lon, lat] = pendingCreateCoord;
						markersDispatch({ type: "addMarker", payload: { lon, lat, meta: { title, description, iconId } } });
						setCreateModalVisible(false);
						setPendingCreateCoord(undefined);
						markerCreationRef.current?.cancel();
				}}
			/>

			{/* Marker Details Modal - View */}
			<MarkerDetailsModal
				visible={!!viewMarkerId}
				mode="view"
				icons={ICONS as any}
				onCancel={() => setViewMarkerId(undefined)}
				onDelete={() => {
					if (!viewMarkerId) return;
					markersDispatch({ type: "removeMarker", payload: { id: viewMarkerId } });
					setViewMarkerId(undefined);
				}}
				marker={viewMarkerId ? (() => { const m = markersState.markers[viewMarkerId]; return m ? { title: m.title, description: m.description, iconId: m.iconId, createdAt: m.createdAt } : undefined; })() : undefined}
			/>

            {/* Toolbar fixed at the top */}
            <SafeAreaView style={styles.toolbarContainer}>
				<Toolbar
					onAccountPress={() => setAccountMenuVisible((prev) => !prev)}
					onChatPress={handleChatPress}
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

			{/* Delete overlay removed: deletion now handled via per-shape modals */}

			{/* Radial menu */}
			<RadialMenu
				visible={visible}
				anchor={anchor}
				onSelect={handleSelect}
				onRequestClose={() => setVisible(false)}
			/>

			{/* Circle details - create mode */}
			<CircleDetailsModal
				visible={!!createCircleId}				mode="create"
				onCancel={() => {
					if (createCircleId) draw.removeCircleById(createCircleId);
					setCreateCircleId(undefined);
				}}
				onSave={(payload: { title?: string; description?: string }) => {
					const { title, description } = payload;
					if (createCircleId) {
						draw.updateCircleById(createCircleId, { title, description });
					}
					setCreateCircleId(undefined);
				}}
			/>

			{/* Circle details - view mode */}
			{(() => {
			  const viewCircle = viewCircleId ? draw.getCircleById(viewCircleId) : undefined;
			  return (
			    <CircleDetailsModal
      visible={!!viewCircle}
      mode="view"
      circle={
        viewCircle
          ? {
              title: (viewCircle.properties as any)?.title,
              description: (viewCircle.properties as any)?.description,
              createdAt: (viewCircle.properties as any)?.createdAt,
            }
          : undefined
      }
      onCancel={() => setViewCircleId(undefined)}
      onDelete={() => {
        if (viewCircleId) {
          draw.removeCircleById(viewCircleId);
        }
        setViewCircleId(undefined);
      }}
    />
  );
})()}

			{/* Square details - create mode */}
			<SquareDetailsModal
  visible={!!createSquareId}
  mode="create"
  onCancel={() => {
    if (createSquareId) drawSquare.removeSquareById(createSquareId);
    setCreateSquareId(undefined);
  }}
  onSave={(payload: { title?: string; description?: string }) => {
    const { title, description } = payload;
    if (createSquareId) {
      drawSquare.updateSquareById(createSquareId, { title, description });
    }
    setCreateSquareId(undefined);
  }}
/>

			{/* Square details - view mode */}
			{(() => {
  const viewSquare = viewSquareId ? drawSquare.getSquareById(viewSquareId) : undefined;
  return (
    <SquareDetailsModal
      visible={!!viewSquare}
      mode="view"
      square={
        viewSquare
          ? {
              title: (viewSquare.properties as any)?.title,
              description: (viewSquare.properties as any)?.description,
              createdAt: (viewSquare.properties as any)?.createdAt,
            }
          : undefined
      }
      onCancel={() => setViewSquareId(undefined)}
      onDelete={() => {
        if (viewSquareId) {
          drawSquare.removeSquareById(viewSquareId);
        }
        setViewSquareId(undefined);
      }}
    />
  );
})()}

			{/* Grid details - create mode */}
			<GridDetailsModal
  visible={!!createGridId}
  mode="create"
  onCancel={() => {
    if (createGridId) drawGrid.removeGridById(createGridId);
    setCreateGridId(undefined);
  }}
  onSave={(payload: { title?: string; description?: string }) => {
    const { title, description } = payload;
    if (createGridId) {
      drawGrid.updateGridById(createGridId, { title, description });
    }
    setCreateGridId(undefined);
  }}
/>

			{/* Grid details - view mode */}
			{(() => {
  const viewGrid = viewGridId ? drawGrid.getGridById(viewGridId) : undefined;
  return (
    <GridDetailsModal
      visible={!!viewGrid}
      mode="view"
      grid={
        viewGrid
          ? {
              title: (viewGrid.properties as any)?.title,
              description: (viewGrid.properties as any)?.description,
              createdAt: (viewGrid.properties as any)?.createdAt,
            }
          : undefined
      }
      onCancel={() => setViewGridId(undefined)}
      onDelete={() => {
        if (viewGridId) {
          drawGrid.removeGridById(viewGridId);
        }
        setViewGridId(undefined);
      }}
    />
  );
})()}

			<AccountMenu
				visible={accountMenuVisible}
				onClose={() => setAccountMenuVisible(false)}
			/>

			<ChatInboxModal
				visible={isChatOpen}
				onDismiss={handleChatDismiss}
				currentUser={currentUser}
				threads={chatThreads}
				onSend={handleChatSend}
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
					onResponderRelease={async (e: GestureResponderEvent) => {
						const { locationX, locationY } = e.nativeEvent;
						const id = await draw.onRelease([locationX, locationY]);
						if (id) setCreateCircleId(id);
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
					onResponderRelease={async (e: GestureResponderEvent) => {
						const { locationX, locationY } = e.nativeEvent;
						const id = await drawSquare.onRelease([locationX, locationY]);
						if (id) setCreateSquareId(id);
					}}
				/>
			)}
			{drawGrid.mode === "DRAW_GRID" && (
				<View
					style={StyleSheet.absoluteFill}
					pointerEvents="box-only"
					onStartShouldSetResponder={() => true}
					onMoveShouldSetResponder={() => true}
					onResponderGrant={(e: GestureResponderEvent) => {
						const { locationX, locationY } = e.nativeEvent;
						drawGrid.onTap([locationX, locationY]);
					}}
					onResponderMove={(e: GestureResponderEvent) => {
						const { locationX, locationY } = e.nativeEvent;
						drawGrid.onDrag([locationX, locationY]);
					}}
					onResponderRelease={async (e: GestureResponderEvent) => {
						const { locationX, locationY } = e.nativeEvent;
						const id = await drawGrid.onRelease([locationX, locationY]);
						if (id) setCreateGridId(id);
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
