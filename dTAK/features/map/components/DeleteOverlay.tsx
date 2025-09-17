import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFeatureDeletion } from "../hooks/useFeatureDeletion";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const DeleteOverlay: React.FC = () => {
    const { selected, select } = useFeatureDeletion();
    const insets = useSafeAreaInsets();
    if (!selected) return null;
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <View
                style={[
                    styles.container,
                    { top: insets.top + 12, right: insets.right + 12 },
                ]}
                pointerEvents="box-none"
            >
                <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => {
                        selected.delete();
                        select(undefined);
                    }}
                    activeOpacity={0.85}
                    style={styles.trashButton}
                >
                    <Ionicons name="trash" size={24} color="#ffffff" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        alignItems: "flex-end",
    },
    trashButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#ef4444",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
    },
});


