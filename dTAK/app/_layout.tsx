import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import "react-native-get-random-values";
import { ConnectivityProvider } from "../features/connectivity";
import { FeatureDeletionProvider } from "../features/map/hooks/useFeatureDeletion";

export default function RootLayout() {
	return (
		<FeatureDeletionProvider>
			<ConnectivityProvider>
				<GestureHandlerRootView style={{ flex: 1 }}>
					<Stack
						screenOptions={{
							headerShown: false,
						}}>
						<Stack.Screen name="index" />
					</Stack>
				</GestureHandlerRootView>
			</ConnectivityProvider>
		</FeatureDeletionProvider>
	);
}
