export type RadialAction =
	| "drop-pin"
	| "map-style"
	| "annotate"
	| "share"
	| "download"
	| "route"
	| "compass"
	| "info";

export type ScreenPoint = { x: number; y: number };

export type RadialItem = {
	key: string;
	action: RadialAction;
	icon: { name: string };
	label?: string;
};

export type RadialSelectContext = {
	screen: ScreenPoint;
	coordinate?: [number, number];
};


