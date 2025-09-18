import React from "react";
import {
	GestureResponderEvent,
	Image,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

type MapThumbnailProps = {
	onPress?: (event: GestureResponderEvent) => void;
	name: string;
	thumbnail: any; // Image source
	selected?: boolean;
	// New optional badge props
	badgeText?: string;
	badgeColor?: string;
};

export default function MapThumbnail({
	onPress,
	name,
	thumbnail,
	selected = false,
	badgeText,
	badgeColor,
}: MapThumbnailProps) {
	return (
		<TouchableOpacity onPress={onPress} style={styles.container}>
			<View style={[styles.thumbnailContainer, selected && styles.selectedContainer]}>
				<Image source={thumbnail} style={styles.thumbnail} resizeMode="cover" />
				{badgeText ? (
					<View style={[styles.badge, { backgroundColor: badgeColor ?? "#334155" }]}>
						<Text style={styles.badgeText}>{badgeText}</Text>
					</View>
				) : null}
				{selected && (
					<View style={styles.checkmarkContainer}>
						<View style={styles.checkmark}>
							<Text style={styles.checkmarkText}>✓</Text>
						</View>
					</View>
				)}
			</View>
			<Text style={styles.label}>{name}</Text>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	container: {
		alignItems: "center",
		marginRight: 16,
	},
	thumbnailContainer: {
		width: 120,
		height: 80,
		borderRadius: 8,
		overflow: "hidden",
		position: "relative",
		borderWidth: 2,
		borderColor: "transparent",
	},
	selectedContainer: {
		borderColor: "#3b82f6", // Blue border for selected state
	},
	thumbnail: {
		width: "100%",
		height: "100%",
	},
	badge: {
		position: "absolute",
		left: 8,
		top: 8,
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 6,
	},
	badgeText: {
		color: "#fff",
		fontSize: 12,
		fontWeight: "600",
	},
	checkmarkContainer: {
		position: "absolute",
		top: 8,
		right: 8,
	},
	checkmark: {
		width: 20,
		height: 20,
		borderRadius: 10,
		backgroundColor: "#3b82f6",
		alignItems: "center",
		justifyContent: "center",
	},
	checkmarkText: {
		color: "white",
		fontSize: 12,
		fontWeight: "bold",
	},
	label: {
		color: "#FFFFFF",
		fontSize: 14,
		marginTop: 8,
		fontWeight: "500",
	},
});
