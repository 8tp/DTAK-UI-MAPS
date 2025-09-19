import type { ImageSourcePropType } from "react-native";

export type RadialAction =
	| "drop-pin"
	| "map-style"
	| "annotate"
	| "share"
	| "download"
	| "route"
	| "compass"
	| "circle"
	| "square"
	| "grid"
	| "line";

export type ScreenPoint = { x: number; y: number };

export type RadialItem = {
	key: string;
	action: RadialAction;
	icon: { name?: string; image?: ImageSourcePropType };
	label?: string;
};

export type RadialSelectContext = {
	screen: ScreenPoint;
	coordinate?: [number, number];
	startCircle?: () => void;
	startSquare?: () => void;
	startMarker?: () => void;
	startGrid?: () => void;
	startLine?: () => void;
};
