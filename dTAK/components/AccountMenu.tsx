import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ConnectivityStatusRow from "./ConnectivityStatusRow";

const DRAWER_WIDTH = 320;
const AnimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView);

type Props = {
	visible: boolean;
	onClose: () => void;
};

export default function AccountMenu({ visible, onClose }: Props) {
	const [renderDrawer, setRenderDrawer] = useState(visible);
	const translateX = useRef(new Animated.Value(visible ? 0 : -DRAWER_WIDTH)).current;
	const backdropOpacity = useRef(new Animated.Value(visible ? 0.6 : 0)).current;

	useEffect(() => {
		if (visible) {
			setRenderDrawer(true);
		}

		const toValue = visible ? 0 : -DRAWER_WIDTH;

		Animated.parallel([
			Animated.timing(translateX, {
				toValue,
				duration: 240,
				easing: Easing.out(Easing.cubic),
				useNativeDriver: true,
			}),
			Animated.timing(backdropOpacity, {
				toValue: visible ? 0.6 : 0,
				duration: 240,
				easing: Easing.out(Easing.cubic),
				useNativeDriver: true,
			}),
		]).start(({ finished }) => {
			if (finished && !visible) {
				setRenderDrawer(false);
			}
		});
	}, [visible, translateX, backdropOpacity]);

	if (!renderDrawer) {
		return null;
	}

	return (
		<Modal
			visible={renderDrawer}
			animationType="none"
			transparent
			onRequestClose={onClose}
			testID="account-menu-modal">
			<View style={styles.overlay}>
				<AnimatedSafeAreaView
					style={[styles.panel, { transform: [{ translateX }] }]}
					testID="account-menu-panel">
					<View style={styles.header}>
						<Text style={styles.title}>Mission Control</Text>
						<Pressable
							onPress={onClose}
							style={styles.closeButton}
							accessibilityRole="button"
							accessibilityLabel="Close account menu"
							testID="account-menu-close">
							<Text style={styles.closeIcon}>×</Text>
						</Pressable>
					</View>

					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Connectivity</Text>
						<ConnectivityStatusRow />
					</View>

					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Notifications</Text>
						<Pressable
							style={styles.settingsRow}
							accessibilityRole="button"
							accessibilityLabel="Open notification settings"
							testID="account-menu-notifications">
							<View style={styles.rowIconContainer}>
								<Image
									source={require("@assets/images/notification-icon.png")}
									style={styles.rowIcon}
									resizeMode="contain"
								/>
							</View>
							<View style={styles.rowTextContainer}>
								<Text style={styles.rowTitle}>Alerts & Notifications</Text>
								<Text style={styles.rowSubtitle}>Configure delivery preferences</Text>
							</View>
						</Pressable>
					</View>

					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Quick Actions</Text>
						<View style={styles.placeholderCard}>
							<Text style={styles.placeholderTitle}>Coming soon</Text>
							<Text style={styles.placeholderDescription}>
								Profile options and mission tools will appear here.
							</Text>
						</View>
					</View>
				</AnimatedSafeAreaView>

				<Pressable style={styles.backdropPressable} onPress={onClose} testID="account-menu-backdrop">
					<Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
				</Pressable>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		flexDirection: "row",
	},
	panel: {
		width: DRAWER_WIDTH,
		height: "100%",
		backgroundColor: "#0f172a",
		borderTopRightRadius: 24,
		borderBottomRightRadius: 24,
		paddingHorizontal: 24,
		paddingTop: 36,
		paddingBottom: 32,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.25,
		shadowRadius: 20,
		elevation: 12,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 28,
	},
	title: {
		color: "#e2e8f0",
		fontSize: 22,
		fontWeight: "700",
	},
	closeButton: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: "rgba(148, 163, 184, 0.18)",
		alignItems: "center",
		justifyContent: "center",
	},
	closeIcon: {
		color: "#e2e8f0",
		fontSize: 20,
		lineHeight: 20,
	},
	section: {
		marginBottom: 32,
	},
	sectionTitle: {
		color: "#94a3b8",
		fontSize: 14,
		fontWeight: "600",
		letterSpacing: 0.6,
		textTransform: "uppercase",
		marginBottom: 12,
	},
	settingsRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 14,
		paddingHorizontal: 16,
		borderRadius: 16,
		backgroundColor: "rgba(148, 163, 184, 0.08)",
	},
	rowIconContainer: {
		width: 44,
		height: 44,
		borderRadius: 16,
		backgroundColor: "rgba(148, 163, 184, 0.15)",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 16,
	},
	rowIcon: {
		width: 24,
		height: 24,
	},
	rowTextContainer: {
		flex: 1,
	},
	rowTitle: {
		color: "#f8fafc",
		fontSize: 16,
		fontWeight: "600",
	},
	rowSubtitle: {
		color: "#cbd5f5",
		fontSize: 13,
		marginTop: 4,
		lineHeight: 18,
	},
	placeholderCard: {
		borderRadius: 16,
		padding: 20,
		backgroundColor: "rgba(148, 163, 184, 0.08)",
	},
	placeholderTitle: {
		color: "#f8fafc",
		fontSize: 16,
		fontWeight: "600",
		marginBottom: 6,
	},
	placeholderDescription: {
		color: "#cbd5f5",
		fontSize: 13,
		lineHeight: 18,
	},
	backdropPressable: {
		flex: 1,
	},
	backdrop: {
		flex: 1,
		backgroundColor: "rgba(15, 23, 42, 0.7)",
	},
});

