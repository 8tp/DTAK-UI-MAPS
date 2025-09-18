import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import "react-native-get-random-values";
import { FeatureDeletionProvider } from "../features/map/hooks/useFeatureDeletion";
import { CameraSessionProvider } from "../src/features/camera/CameraSessionContext";

export default function RootLayout() {
	return (
		<CameraSessionProvider>
			<FeatureDeletionProvider>
				<GestureHandlerRootView style={{ flex: 1 }}>
					<Stack
						screenOptions={{
							headerShown: false,
						}}>
						<Stack.Screen name="index" />
						<Stack.Screen name="camera/index" />
						<Stack.Screen name="camera/preview" />
						<Stack.Screen name="camera/edit" />
					</Stack>
				</GestureHandlerRootView>
			</FeatureDeletionProvider>
		</CameraSessionProvider>
	);
}
