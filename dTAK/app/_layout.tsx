import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "react-native-reanimated";
import "react-native-get-random-values";
import { ConnectivityProvider } from "../features/connectivity";
import { FeatureDeletionProvider } from "../features/map/hooks/useFeatureDeletion";
import { CameraSessionProvider } from "../src/features/camera/CameraSessionContext";
import { TakProvider } from "../features/tak/TakContext";

export default function RootLayout() {
	return (
		<FeatureDeletionProvider>
			<CameraSessionProvider>
				<ConnectivityProvider>
					<TakProvider>
						<GestureHandlerRootView style={{ flex: 1 }}>
							<SafeAreaProvider>
								<Stack
									screenOptions={{
										headerShown: false,
									}}>
									<Stack.Screen name="index" />
									<Stack.Screen name="login" />
									<Stack.Screen name="camera/index" />
									<Stack.Screen name="camera/preview" />
									<Stack.Screen name="camera/edit" />
								</Stack>
							</SafeAreaProvider>
						</GestureHandlerRootView>
					</TakProvider>
				</ConnectivityProvider>
			</CameraSessionProvider>
		</FeatureDeletionProvider>
	);
}
