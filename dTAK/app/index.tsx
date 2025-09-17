// App.tsx
import { Camera, MapView, RasterLayer, RasterSource } from "@maplibre/maplibre-react-native";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function App() {
	const router = useRouter();

	const openCamera = () => router.push("/camera" as never);

	return (
		<View style={styles.page}>
			<MapView style={styles.map}>
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
			</MapView>
				<Pressable
					accessibilityLabel="Open camera"
					onPress={openCamera}
					style={styles.cameraButton}>
				<Text style={styles.cameraButtonText}>Camera</Text>
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	page: { flex: 1 },
	map: { flex: 1 },
	cameraButton: {
		backgroundColor: "#1f2933",
		borderRadius: 24,
		paddingHorizontal: 20,
		paddingVertical: 12,
		position: "absolute",
		bottom: 32,
		right: 24,
		elevation: 2,
	},
	cameraButtonText: {
		color: "#ffffff",
		fontSize: 16,
		fontWeight: "600",
	},
});
