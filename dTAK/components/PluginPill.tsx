import React from "react";
import {
	GestureResponderEvent,
	Image,
	ImageSourcePropType,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

type PluginPillProps = {
	onPress?: (event: GestureResponderEvent) => void;
	icon: ImageSourcePropType;
	text: string;
};

export default function PluginPill({ onPress, icon, text }: PluginPillProps) {
	return (
		<TouchableOpacity onPress={onPress} style={styles.container}>
			<View style={styles.content}>
				<Image source={icon} style={styles.icon} resizeMode="contain" />
				<Text style={styles.text}>{text}</Text>
			</View>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: "#26292B", // Dark gray background
		borderRadius: 8,
		paddingHorizontal: 16,
		paddingVertical: 12,
		marginRight: 12,
		minWidth: 100,
	},
	content: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	icon: {
		width: 20,
		height: 20,
	},
	text: {
		color: "#FFFFFF",
		fontSize: 14,
		fontWeight: "500",
	},
});
