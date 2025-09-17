// App.tsx
import Toolbar from "@components/Toolbar";
import BottomSheet, {
	BottomSheetBackgroundProps,
	BottomSheetHandleProps,
	BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Camera, MapView, RasterLayer, RasterSource } from "@maplibre/maplibre-react-native";
import React, { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { performAction } from "../features/map/actions/radialActions";
import { RadialMenu } from "../features/map/components/RadialMenu";

// Custom background
const CustomBackground = ({ style }: BottomSheetBackgroundProps) => (
	<View style={[style, { backgroundColor: "#26292B", borderRadius: 16 }]} />
);

// Custom handle
const CustomHandle = ({}: BottomSheetHandleProps) => (
	<View style={[styles.handleContainer]}>
		<View style={styles.handle} />
	</View>
);

export default function App() {
	const [visible, setVisible] = useState(false);
	const [anchor, setAnchor] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
	const [coordinate, setCoordinate] = useState<[number, number] | undefined>(undefined);

	const sheetRef = useRef<BottomSheet>(null);

	const onLongPress = (e: any) => {
		sheetRef.current?.snapToIndex(1);

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

	const handleSelect = (action: any) => {
		setVisible(false);
		performAction(action, { screen: anchor, coordinate });
	};

	return (
		<View style={styles.page}>
			{/* Background map */}
			<MapView style={styles.map} onLongPress={onLongPress}>
				<Camera zoomLevel={5} centerCoordinate={[-95.7129, 37.0902]} />
				<RasterSource
					id="satelliteSource"
					tileUrlTemplates={[
						"https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}.jpg?api_key=c177fb0b-10fa-4ba1-87ba-3a8446a7887d",
					]}
					tileSize={256}>
					<RasterLayer
						id="satelliteLayer"
						sourceID="satelliteSource"
						style={{ rasterOpacity: 1 }}
					/>
				</RasterSource>
			</MapView>

			{/* Toolbar fixed at the top */}
			<SafeAreaView style={styles.toolbarContainer}>
				<Toolbar />
			</SafeAreaView>

			{/* Bottom drawer always visible */}
			<BottomSheet
				ref={sheetRef}
				index={2} // 👈 50% open by default
				snapPoints={["25%", "50%", "90%"]}
				backgroundComponent={CustomBackground}
				handleComponent={CustomHandle}
				enablePanDownToClose
				style={styles.bottomSheet}>
				<BottomSheetView style={styles.contentContainer}>
					<Text>Awesome 🎉</Text>
				</BottomSheetView>
			</BottomSheet>

			{/* Radial menu */}
			<RadialMenu
				visible={visible}
				anchor={anchor}
				onSelect={handleSelect}
				onRequestClose={() => setVisible(false)}
			/>
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
		backgroundColor: "#626A6F", // 👈 handle color
	},
});
