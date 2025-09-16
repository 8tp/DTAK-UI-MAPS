import { MapView } from "@maplibre/maplibre-react-native";
import { useNavigation } from "expo-router";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Home = () => {
	const insets = useSafeAreaInsets();

	const styles = StyleSheet.create({
		body: {
			paddingTop: insets.top,
			gap: 40,
			height: "100%",
			width: "100%",
			alignItems: "center",
		},
		tileContainer: {
			gap: 24,
			alignItems: "center",
		},
		tileParent: {
			height: 540,
			width: "100%",
		},
	});

	//Navigation customization block
	const navigation = useNavigation();

	return <MapView style={{ flex: 1 }} />;
};

export default Home;
