import React, { useState } from "react";
import { GestureResponderEvent, ScrollView, StyleSheet, View, ViewStyle } from "react-native";
import ToolbarPill from "./ToolbarPill";
import { Feather } from "@expo/vector-icons";
import TransparentButton from "./TransparentButton";

type ToolbarProps = {
	style?: ViewStyle;
	onAccountPress?: (event: GestureResponderEvent) => void;
	onCameraPress?: (event: GestureResponderEvent) => void;
	onChatPress?: (event: GestureResponderEvent) => void;
};

export default function Toolbar({ style, onAccountPress, onCameraPress, onChatPress }: ToolbarProps) {
	const [showUtilityPills, setShowUtilityPills] = useState(true);

	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={[styles.container, style]}>
			{/* Transparent Account Button */}
			<View style={styles.iconsContainer}>
				<TransparentButton
				onPress={onAccountPress}
				asset={require("@assets/images/user-icon.png")}
				accessibilityLabel="Open account menu"
				testID="toolbar-account-button"
			/>
		</View>
		<ToolbarPill
			icon={require("@assets/images/eye-icon.png")}
			onPress={() => setShowUtilityPills((prev) => !prev)}
			accessibilityLabel={showUtilityPills ? "Hide toolbar shortcuts" : "Show toolbar shortcuts"}
		/>
		{showUtilityPills ? (
			<>
				<ToolbarPill
					iconComponent={<Feather name="camera" size={20} color="#FFFFFF" />}
					onPress={onCameraPress}
					accessibilityLabel="Open camera"
					ariaHint="Launches the camera capture workflow"
				/>
				<ToolbarPill
				icon={require("@assets/images/group-chat.png")}
				text="Chat"
				onPress={onChatPress}
			/>
			</>
		) : null}
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
