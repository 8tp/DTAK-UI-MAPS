import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ConnectivityStatus, useConnectivity } from "../features/connectivity";

type StatusVisual = {
	label: string;
	description: string;
	color: string;
	iconTestId: string;
};

const STATUS_MAP: Record<ConnectivityStatus, StatusVisual> = {
	internet: {
		label: "Internet Connected",
		description: "Your device can reach the internet.",
		color: "#22c55e",
		iconTestId: "connectivity-indicator-internet",
	},
	mesh: {
		label: "Mesh Connected",
		description: "Internet is offline; Ditto mesh is available.",
		color: "#facc15",
		iconTestId: "connectivity-indicator-mesh",
	},
	offline: {
		label: "Offline",
		description: "No internet or mesh connections detected.",
		color: "#ef4444",
		iconTestId: "connectivity-indicator-offline",
	},
};

export default function ConnectivityStatusRow() {
	const connectivity = useConnectivity();

	const visual = useMemo(() => STATUS_MAP[connectivity.status], [connectivity.status]);

	return (
		<View style={styles.container} testID="connectivity-status-row">
			<View
				accessibilityLabel={`${connectivity.status} connectivity`}
				style={[styles.indicator, { backgroundColor: visual.color }]}
				testID={visual.iconTestId}
			/>
			<View style={styles.textContainer}>
				<Text style={styles.label}>{visual.label}</Text>
				<Text style={styles.description}>{visual.description}</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 12,
		backgroundColor: "#1f2933",
		marginBottom: 16,
	},
	indicator: {
		width: 16,
		height: 16,
		borderRadius: 8,
		marginRight: 12,
	},
	textContainer: {
		flex: 1,
	},
	label: {
		color: "#f8fafc",
		fontWeight: "600",
		fontSize: 16,
	},
	description: {
		color: "#cbd5f5",
		fontSize: 13,
		marginTop: 2,
	},
});
