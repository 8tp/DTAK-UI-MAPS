import React from "react";
import {
	GestureResponderEvent,
	Image,
	ImageSourcePropType,
	StyleSheet,
	Text,
	TextStyle,
	TouchableOpacity,
	View,
	ViewStyle,
} from "react-native";

type ToolbarPill = {
	onPress?: (event: GestureResponderEvent) => void;
	icon: ImageSourcePropType; // require(...) or { uri: ... }
	text?: string;
	style?: ViewStyle; // allow external overrides
	textStyle?: TextStyle; // allow customizing text
};

export default function ToolbarPill({ onPress, icon, text, style, textStyle }: ToolbarPill) {
	return (
		<TouchableOpacity onPress={onPress} style={[styles.button, style]}>
			<View style={styles.content}>
				<Image source={icon} style={styles.icon} resizeMode="contain" />
				{text ? <Text style={[styles.text, textStyle]}>{text}</Text> : null}
			</View>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	button: {
		height: "auto",
		minWidth: 48,
		flexDirection: "row",
		alignItems: "center",
		borderRadius: 9,
		borderWidth: 1,
		borderColor: "#626A6F", // Neutral-400
		backgroundColor: "#26292B", // Neutral-Surface-Dark-700
		paddingHorizontal: 8,
		paddingVertical: 8,
	},
	content: {
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	icon: {
		width: 28,
		height: 28,
	},
	text: {
		color: "#FFFFFF", // default text color
		fontSize: 16,
	},
});
