import React from "react";
import { View, StyleSheet, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DEFAULT_RADIAL_ITEMS } from "../constants/radialItems";
import type { RadialItem, RadialAction } from "../types/radial";

type Props = {
	visible: boolean;
	anchor: { x: number; y: number };
	onSelect: (action: RadialAction) => void;
	onRequestClose?: () => void;
	items?: RadialItem[];
	radius?: number;
};

export const RadialMenu: React.FC<Props> = ({
	visible,
	anchor,
	onSelect,
	onRequestClose,
	items = DEFAULT_RADIAL_ITEMS,
	radius = 100,
}) => {
    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

    if (!visible) return null;

	const angleStep = (2 * Math.PI) / items.length;
    // Derive a ring that visually contains the current icon orbit.
    // We keep icon positions unchanged, and draw a donut-shaped ring behind them
    // with thin grey dividers creating wedge cells.
    const buttonSize = 48; // fixed circular button to center icon in cell
    const estimatedIconWrapperRadius = buttonSize / 2;
    const ringPadding = 8; // small breathing room around icon chips
    const innerRadius = Math.max(24, radius - estimatedIconWrapperRadius - ringPadding);
    const outerRadius = radius + estimatedIconWrapperRadius + ringPadding;
    const ringThickness = outerRadius - innerRadius;

	return (
		<View style={StyleSheet.absoluteFill} pointerEvents="box-none">
			<Pressable style={StyleSheet.absoluteFill} onPress={onRequestClose} />
            <View style={[styles.center, { left: anchor.x, top: anchor.y }]}>
                {/* Donut ring background (non-interactive) */}
                <View
                    pointerEvents="none"
                    style={[
                        styles.ring,
                        {
                            width: outerRadius * 2,
                            height: outerRadius * 2,
                            borderRadius: outerRadius,
                            borderWidth: ringThickness,
                            // Center the ring at the anchor (container origin is the anchor)
                            transform: [
                                { translateX: -outerRadius },
                                { translateY: -outerRadius },
                            ],
                        },
                    ]}
                />

                {/* Sector dividers (non-interactive) */}
                {items.map((_, i) => {
                    const angle = i * angleStep - Math.PI / 2;
                    const deg = (angle * 180) / Math.PI;
                    const dividerWidth = 2; // visual thickness of divider
                    const isBoundary =
                        hoveredIndex !== null && (i === hoveredIndex || i === (hoveredIndex + 1) % items.length);
                    return (
                        <View
                            key={`divider-${i}`}
                            pointerEvents="none"
                            style={[
                                styles.divider,
                                {
                                    width: dividerWidth,
                                    height: ringThickness,
                                    transform: [
                                        // move element center to origin so rotation pivots around center
                                        { translateX: -dividerWidth / 2 },
                                        { translateY: -ringThickness / 2 },
                                        { rotate: `${deg}deg` },
                                        // push outward so the divider spans only the ring band
                                        { translateY: -(innerRadius + ringThickness / 2) },
                                    ],
                                },
                                isBoundary && { backgroundColor: "rgba(148, 150, 153, 0.35)" },
                            ]}
                        />
                    );
                })}

                {items.map((item, i) => {
                    // Center icons within sectors by offsetting by half an angle step
                    const angle = (i + 0.5) * angleStep - Math.PI / 2;
                    const posX = Math.cos(angle) * radius;
                    const posY = Math.sin(angle) * radius;
                    return (
                        <Pressable
							key={item.key}
                            accessibilityRole="button"
                            style={[
                                styles.iconWrapper,
                                {
                                    width: buttonSize,
                                    height: buttonSize,
                                    borderRadius: buttonSize / 2,
                                    backgroundColor: hoveredIndex === i ? "rgba(148, 150, 153, 0.18)" : "transparent",
                                    transform: [
                                        { translateX: posX - buttonSize / 2 },
                                        { translateY: posY - buttonSize / 2 },
                                        ...(hoveredIndex === i ? [{ scale: 1.06 }] : []),
                                    ],
                                },
                            ]}
							onPress={() => onSelect(item.action)}
                            onHoverIn={() => setHoveredIndex(i)}
                            onHoverOut={() => setHoveredIndex((curr) => (curr === i ? null : curr))}
                            onPressIn={() => setHoveredIndex(i)}
                            onPressOut={() => setHoveredIndex((curr) => (curr === i ? null : curr))}
                            hitSlop={12}>
						{item.icon.image ? (
							<Image
								source={item.icon.image}
								style={{ width: 28, height: 28, resizeMode: "contain" }}
							/>
						) : (
							<Ionicons name={item.icon.name as any} size={28} color="white" />
                        )}
                        </Pressable>
					);
				})}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	center: { position: "absolute", width: 0, height: 0 },
	iconWrapper: {
		position: "absolute",
        backgroundColor: "transparent",
        alignItems: "center",
        justifyContent: "center",
	},
    ring: {
        position: "absolute",
        backgroundColor: "transparent",
        borderColor: "rgba(0,0,0,0.35)", // shaded outer band
        // subtle shadow to lift the ring from the map
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        // Android
        elevation: 6,
    },
    divider: {
        position: "absolute",
        left: 0,
        top: 0,
        backgroundColor: "rgba(148, 150, 153, 0.13)", // light gray, lower contrast
        borderRadius: 1,
    },
});


