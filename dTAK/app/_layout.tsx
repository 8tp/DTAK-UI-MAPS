import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import "react-native-get-random-values";
import { ConnectivityProvider } from "../features/connectivity";
import { CameraSessionProvider } from "../src/features/camera/CameraSessionContext";
import { MarkersProvider } from "../features/markers/state/MarkersProvider";

export default function RootLayout() {
	return (
        
            <MarkersProvider>
                <CameraSessionProvider>
                    <ConnectivityProvider>
                        <GestureHandlerRootView style={{ flex: 1 }}>
						<Stack
							screenOptions={{
								headerShown: false,
							}}>
							<Stack.Screen name="index" />
							<Stack.Screen name="onboarding/index" />
							<Stack.Screen name="camera/index" />
							<Stack.Screen name="camera/preview" />
							<Stack.Screen name="camera/edit" />
						</Stack>
                        </GestureHandlerRootView>
                    </ConnectivityProvider>
                </CameraSessionProvider>
            </MarkersProvider>
  
	);
}
