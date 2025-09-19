import { RadialItem } from "../types/radial";

export const DEFAULT_RADIAL_ITEMS: RadialItem[] = [
	{ key: "drop-pin", action: "drop-pin", icon: { image: require("../../../assets/images/radial-pin.png") }, label: "Pin" },
	{ key: "grid", action: "grid", icon: { image: require("../../../assets/images/radial-grid.png") }, label: "Grid" },
	{ key: "square", action: "square", icon: { image: require("../../../assets/images/radial-square.png") }, label: "Square" },
	// Replace default icons with custom image-based items to keep an 8-item wheel
	{ key: "arrow", action: "annotate", icon: { image: require("../../../assets/images/radial-arrow.png") }, label: "Arrow" },
	{ key: "line", action: "annotate", icon: { image: require("../../../assets/images/radial-line.png") }, label: "Line" },
	{ key: "target", action: "annotate", icon: { image: require("../../../assets/images/radial-target.png") }, label: "Target" },
	{ key: "hazard", action: "annotate", icon: { image: require("../../../assets/images/radial-hazard.png") }, label: "Hazard" },
	{ key: "circle", action: "circle", icon: { image: require("../../../assets/images/radial-circle.png") }, label: "Circle" },
];
