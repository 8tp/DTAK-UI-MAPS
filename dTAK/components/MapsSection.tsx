import React from "react";
import {
	GestureResponderEvent,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import MapThumbnail from "./MapThumbnail";

type MapData = {
	id: string;
	name: string;
	thumbnail: any;
	selected?: boolean;
};

type MapsSectionProps = {
	onMapSelect?: (mapId: string) => void;
	onViewMore?: (event: GestureResponderEvent) => void;
	maps?: MapData[];
};

export default function MapsSection({
	onMapSelect,
	onViewMore,
	maps = defaultMaps,
}: MapsSectionProps) {
	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.title}>My maps</Text>
				<TouchableOpacity onPress={onViewMore} style={styles.viewMoreButton}>
					<Text style={styles.viewMoreText}>View more</Text>
					<Text style={styles.arrow}>→</Text>
				</TouchableOpacity>
			</View>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.mapsContainer}>
				{maps.map((map) => (
					<MapThumbnail
						key={map.id}
						name={map.name}
						thumbnail={map.thumbnail}
						selected={map.selected}
						onPress={() => onMapSelect?.(map.id)}
					/>
				))}
			</ScrollView>
		</View>
	);
}

// Default map data - in a real app, this would come from props or state
const defaultMaps: MapData[] = [
	{
		id: "new-york",
		name: "New York",
		thumbnail: require("@assets/images/radial-pin.png"), // Placeholder - you'll need actual map thumbnails
		selected: true,
	},
	{
		id: "chicago",
		name: "Chicago",
		thumbnail: require("@assets/images/radial-pin.png"), // Placeholder
		selected: false,
	},
	{
		id: "montgomery",
		name: "Montgomery",
		thumbnail: require("@assets/images/radial-pin.png"), // Placeholder
		selected: false,
	},
];

const styles = StyleSheet.create({
	container: {
		marginBottom: 32,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 16,
	},
	title: {
		color: "#FFFFFF",
		fontSize: 18,
		fontWeight: "600",
	},
	viewMoreButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#26292B",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 6,
		gap: 4,
	},
	viewMoreText: {
		color: "#FFFFFF",
		fontSize: 14,
		fontWeight: "500",
	},
	arrow: {
		color: "#FFFFFF",
		fontSize: 14,
		fontWeight: "bold",
	},
	mapsContainer: {
		paddingRight: 16,
	},
});
