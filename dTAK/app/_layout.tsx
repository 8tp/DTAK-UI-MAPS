import { Stack } from "expo-router";
import "react-native-reanimated";
import "react-native-get-random-values";
import { FeatureDeletionProvider } from "../features/map/hooks/useFeatureDeletion";

export default function RootLayout() {
	return (
		<FeatureDeletionProvider>
			<Stack
				screenOptions={{
					headerShown: false,
				}}>
				<Stack.Screen name="index" />
			</Stack>
		</FeatureDeletionProvider>
	);
}
