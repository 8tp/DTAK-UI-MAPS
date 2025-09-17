import { RadialItem } from "../types/radial";

export const DEFAULT_RADIAL_ITEMS: RadialItem[] = [
	{ key: "drop-pin", action: "drop-pin", icon: { image: require("../../../assets/images/radial-pin.png") }, label: "Pin" },
	{ key: "map-style", action: "map-style", icon: { image: require("../../../assets/images/radial-grid.png") }, label: "Style" },
	{ key: "annotate", action: "annotate", icon: { image: require("../../../assets/images/radial-square.png") }, label: "Annotate" },
	{ key: "share", action: "share", icon: { name: "share-social" }, label: "Share" },
	{ key: "download", action: "download", icon: { name: "download" }, label: "Download" },
	{ key: "route", action: "route", icon: { name: "walk" }, label: "Route" },
	{ key: "compass", action: "compass", icon: { name: "compass" }, label: "Compass" },
	{ key: "circle", action: "circle", icon: { image: require("../../../assets/images/radial-circle.png") }, label: "Circle" },
];


