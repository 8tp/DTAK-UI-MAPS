export const ICONS: { id: string; src: any; label: string }[] = [
    { id: "marker-default-pin", src: require("../../../assets/images/marker-default_pin.png"), label: "Default" },
    { id: "marker-friendly", src: require("../../../assets/images/marker-friendly.png"), label: "Friendly" },
    { id: "marker-opfor", src: require("../../../assets/images/marker-opfor.png"), label: "OPFOR" },
    { id: "marker-plane", src: require("../../../assets/images/marker-plane.png"), label: "Aircraft" },
    { id: "marker-red-cross", src: require("../../../assets/images/marker-red-cross.png"), label: "Medical" },
];

export const ICONS_MAP = {
    "marker-default-pin": require("../../../assets/images/marker-default_pin.png"),
    "marker-friendly": require("../../../assets/images/marker-friendly.png"),
    "marker-opfor": require("../../../assets/images/marker-opfor.png"),
    "marker-plane": require("../../../assets/images/marker-plane.png"),
    "marker-red-cross": require("../../../assets/images/marker-red-cross.png"),
} as const;


