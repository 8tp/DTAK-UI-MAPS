import { Stack } from "expo-router";
import "react-native-reanimated";

import { CameraSessionProvider } from "../src/features/camera/CameraSessionContext";

export default function RootLayout() {
	return (
		<CameraSessionProvider>
			<Stack
				screenOptions={{
					headerShown: false,
				}}>
				<Stack.Screen name="index" />
				<Stack.Screen name="camera/index" />
				<Stack.Screen name="camera/preview" />
				<Stack.Screen name="camera/edit" />
			</Stack>
		</CameraSessionProvider>
	);
}
