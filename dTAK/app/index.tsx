// App.tsx
import Toolbar from "@components/Toolbar";
import { Camera, MapView, RasterLayer, RasterSource } from "@maplibre/maplibre-react-native";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { performAction } from "../features/map/actions/radialActions";
import { RadialMenu } from "../features/map/components/RadialMenu";

export default function App() {
	const [visible, setVisible] = useState(false);
	const [anchor, setAnchor] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
	const [coordinate, setCoordinate] = useState<[number, number] | undefined>(undefined);

	const onLongPress = (e: any) => {
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
			<MapView style={styles.map} onLongPress={onLongPress}>
				<SafeAreaView>
					<Toolbar />
				</SafeAreaView>
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
});
