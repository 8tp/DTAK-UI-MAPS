import React from "react";
import {
	GestureResponderEvent,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import PluginPill from "./PluginPill";

type PluginData = {
	id: string;
	name: string;
	icon: any;
};

type PluginsSectionProps = {
	onPluginPress?: (pluginId: string) => void;
	onViewMore?: (event: GestureResponderEvent) => void;
	plugins?: PluginData[];
};

export default function PluginsSection({
	onPluginPress,
	onViewMore,
	plugins = defaultPlugins,
}: PluginsSectionProps) {
	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.title}>Apps</Text>
				<TouchableOpacity onPress={onViewMore} style={styles.viewMoreButton}>
					<Text style={styles.viewMoreText}>View more</Text>
					<Text style={styles.arrow}>→</Text>
				</TouchableOpacity>
			</View>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.pluginsContainer}>
				{plugins.map((plugin) => (
					<PluginPill
						key={plugin.id}
						icon={plugin.icon}
						text={plugin.name}
						onPress={() => onPluginPress?.(plugin.id)}
					/>
				))}
			</ScrollView>
		</View>
	);
}

// Default plugin data
const defaultPlugins: PluginData[] = [
	{
		id: "chat",
		name: "CHAT",
		icon: require("../assets/images/group-chat.png"),
	},
];

const styles = StyleSheet.create({
	container: {
		marginBottom: 16,
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
	pluginsContainer: {
		paddingRight: 16,
	},
});
