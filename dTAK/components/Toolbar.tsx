import React from "react";
import { GestureResponderEvent, ScrollView, StyleSheet, View, ViewStyle } from "react-native";
import ToolbarPill from "./ToolbarPill";
import TransparentButton from "./TransparentButton";

type ToolbarProps = {
	style?: ViewStyle;
	onAccountPress?: (event: GestureResponderEvent) => void;
};

export default function Toolbar({ style, onAccountPress }: ToolbarProps) {
	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={[styles.container, style]}>
			{/* Transparent Account Button */}
			<View style={styles.iconsContainer}>
				<TransparentButton asset={require("@assets/images/user-icon.png")} />
				<TransparentButton asset={require("@assets/images/notification-icon.png")} />
			</View>
			<ToolbarPill icon={require("@assets/images/eye-icon.png")} />
			<ToolbarPill icon={require("@assets/images/group-chat.png")} text="Chat" />
			<ToolbarPill icon={require("@assets/images/jet-icon.png")} text="PERSCO" />
			<ToolbarPill icon={require("@assets/images/skull-icon.png")} text="Killbox" />
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row", // horizontal layout
		alignItems: "center",
		justifyContent: "flex-start",
		paddingHorizontal: 10,
		height: 56,
		backgroundColor: "transparent", // toolbar background
		gap: 16,
	},
	iconsContainer: {
		flexDirection: "row",
		justifyContent: "flex-start",
	},
	transparentButton: {
		backgroundColor: "transparent",
		padding: 8,
		marginRight: 12,
	},
});
