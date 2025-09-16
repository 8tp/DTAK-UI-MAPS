import { useNavigation } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

const Home = () => {
	//Navigation customization block
	const navigation = useNavigation();

	return (
		<View style={styles.body}>
			<Text>Hello</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	body: {
		paddingTop: 32,
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

export default Home;
