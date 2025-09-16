// App.tsx
import { Camera, MapView, RasterLayer, RasterSource } from "@maplibre/maplibre-react-native";
import React from "react";
import { StyleSheet } from "react-native";

export default function App() {
	return (
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
	);
}

const styles = StyleSheet.create({
	page: { flex: 1 },
	map: { flex: 1 },
});
