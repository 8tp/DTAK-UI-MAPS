import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import "react-native-get-random-values";
import { FeatureDeletionProvider } from "../features/map/hooks/useFeatureDeletion";

export default function RootLayout() {
	return (
		<FeatureDeletionProvider>
			<GestureHandlerRootView style={{ flex: 1 }}>
				<Stack
					screenOptions={{
						headerShown: false,
					}}>
					<Stack.Screen name="index" />
				</Stack>
			</GestureHandlerRootView>
		</FeatureDeletionProvider>
	);
}
