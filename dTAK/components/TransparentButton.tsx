import React from "react";
import { GestureResponderEvent, Image, ImageSourcePropType, TouchableOpacity } from "react-native";

type TransparentButtonProps = {
	onPress?: (event: GestureResponderEvent) => void;
	asset: ImageSourcePropType;
	accessibilityLabel?: string;
	testID?: string;
};

export default function TransparentButton({ onPress, asset, accessibilityLabel, testID }: TransparentButtonProps) {
	return (
		<TouchableOpacity
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel}
			testID={testID}
			style={{
				backgroundColor: "transparent", // button stays transparent
				padding: 10,
			}}>
			<Image source={asset} style={{ width: 32, height: 32 }} resizeMode="contain" />
		</TouchableOpacity>
	);
}
