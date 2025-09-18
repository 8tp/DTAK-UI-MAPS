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
import type { ReactNode } from "react";

type ToolbarPillProps = {
	onPress?: (event: GestureResponderEvent) => void;
	icon?: ImageSourcePropType; // require(...) or { uri: ... }
	iconComponent?: ReactNode;
	text?: string;
	style?: ViewStyle; // allow external overrides
	textStyle?: TextStyle; // allow customizing text
	accessibilityLabel?: string;
};

export default function ToolbarPill({ onPress, icon, iconComponent, text, style, textStyle, accessibilityLabel }: ToolbarPillProps) {
	const iconNode = iconComponent ? (
		<View style={styles.iconWrapper}>{iconComponent}</View>
	) : icon ? (
		<Image source={icon} style={styles.icon} resizeMode="contain" />
	) : null;

	return (
		<TouchableOpacity
			onPress={onPress}
			style={[styles.button, style]}
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel}>
			<View style={styles.content}>
				{iconNode}
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
	iconWrapper: {
		width: 28,
		height: 28,
		alignItems: "center",
		justifyContent: "center",
	},
	text: {
		color: "#FFFFFF", // default text color
		fontSize: 16,
	},
});
