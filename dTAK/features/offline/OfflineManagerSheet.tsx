import Slider from "@react-native-community/slider";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BBox, countTiles, estimateSizeMB } from "./tiles";
import { useOfflineMaps } from "./useOfflineMaps";

export type OfflineManagerSheetProps = {
	mapId: string;
	currentBBox: BBox;
	remoteTemplate: string;
	defaultZoomMin: number;
	defaultZoomMax: number;
};

export default function OfflineManagerSheet({
	mapId,
	currentBBox,
	remoteTemplate,
	defaultZoomMin,
	defaultZoomMax,
}: OfflineManagerSheetProps) {
	const { startDownload } = useOfflineMaps();
	const [zoomMin, setZoomMin] = useState(defaultZoomMin);
	const [zoomMax, setZoomMax] = useState(defaultZoomMax);

	const tiles = useMemo(
		() => countTiles(currentBBox, zoomMin, zoomMax),
		[currentBBox, zoomMin, zoomMax]
	);
	const sizeMB = useMemo(() => estimateSizeMB(tiles), [tiles]);

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Download map for offline</Text>
			<View style={styles.row}>
				<Text style={styles.label}>Zoom range</Text>
				<Text style={styles.value}>
					{zoomMin} - {zoomMax}
				</Text>
			</View>
			<View style={styles.sliderRow}>
				<Text style={styles.sliderLabel}>Min</Text>
				<Slider
					minimumValue={1}
					maximumValue={18}
					step={1}
					value={zoomMin}
					onValueChange={setZoomMin}
					style={styles.slider}
				/>
			</View>
			<View style={styles.sliderRow}>
				<Text style={styles.sliderLabel}>Max</Text>
				<Slider
					minimumValue={zoomMin}
					maximumValue={20}
					step={1}
					value={zoomMax}
					onValueChange={setZoomMax}
					style={styles.slider}
				/>
			</View>
			<View style={styles.row}>
				<Text style={styles.label}>Tiles</Text>
				<Text style={styles.value}>{tiles.toLocaleString()}</Text>
			</View>
			<View style={styles.row}>
				<Text style={styles.label}>Est. size</Text>
				<Text style={styles.value}>{sizeMB.toFixed(1)} MB</Text>
			</View>
			<TouchableOpacity
				style={styles.button}
				onPress={async () => {
					await startDownload({
						mapId,
						bbox: currentBBox,
						zoomMin,
						zoomMax,
						tileTemplate: remoteTemplate,
					});
				}}>
				<Text style={styles.buttonText}>Start download</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { gap: 12 },
	title: { color: "#fff", fontSize: 18, fontWeight: "600" },
	row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
	label: { color: "#cbd5e1" },
	value: { color: "#fff" },
	sliderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
	sliderLabel: { color: "#cbd5e1", width: 40 },
	slider: { flex: 1 },
	button: {
		backgroundColor: "#3b82f6",
		paddingVertical: 10,
		borderRadius: 8,
		alignItems: "center",
		marginTop: 8,
	},
	buttonText: { color: "#fff", fontWeight: "600" },
});
