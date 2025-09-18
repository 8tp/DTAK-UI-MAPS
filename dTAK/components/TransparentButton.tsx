import React from "react";
import { GestureResponderEvent, Image, ImageSourcePropType, TouchableOpacity } from "react-native";

type TransparentButtonProps = {
	onPress?: (event: GestureResponderEvent) => void;
	asset: ImageSourcePropType;
};

export default function TransparentButton({ onPress, asset }: TransparentButtonProps) {
	return (
		<TouchableOpacity
			onPress={onPress}
			style={{
				backgroundColor: "transparent", // button stays transparent
				padding: 10,
			}}>
			<Image source={asset} style={{ width: 32, height: 32 }} resizeMode="contain" />
		</TouchableOpacity>
	);
}
