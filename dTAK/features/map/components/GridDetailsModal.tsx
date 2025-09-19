import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";

export type GridView = {
  title?: string;
  description?: string;
  createdAt?: number;
};

type Props = {
  visible: boolean;
  mode: "create" | "view";
  grid?: GridView;
  onCancel: () => void;
  onSave?: (payload: { title?: string; description?: string }) => void;
  onDelete?: () => void;
};

export const GridDetailsModal: React.FC<Props> = ({
  visible,
  mode,
  grid,
  onCancel,
  onSave,
  onDelete,
}) => {
  const isCreate = mode === "create";
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  useEffect(() => {
    if (visible && isCreate) {
      setTitle("");
      setDescription("");
    }
  }, [visible, isCreate]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ width: "100%" }}
        >
          <View style={styles.card}>
            <ScrollView contentContainerStyle={{ gap: 12 }}>
              {isCreate ? (
                <>
                  <Text style={styles.label}>Title</Text>
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    style={styles.input}
                    placeholder="Enter title"
                    placeholderTextColor="#9ca3af"
                  />
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    style={[styles.input, styles.inputMultiline]}
                    placeholder="Enter description"
                    placeholderTextColor="#9ca3af"
                    multiline
                  />
                </>
              ) : (
                <>
                  {grid?.title ? (
                    <Text style={styles.viewTitle}>{grid.title}</Text>
                  ) : null}
                  {grid?.description ? (
                    <Text style={styles.viewDescription}>{grid.description}</Text>
                  ) : null}
                  {grid?.createdAt ? (
                    <Text style={styles.timestamp}>
                      Created: {new Date(grid.createdAt).toLocaleString()}
                    </Text>
                  ) : null}
                </>
              )}
            </ScrollView>

            <View style={styles.footer}>
              {mode === "view" && onDelete ? (
                <TouchableOpacity
                  onPress={onDelete}
                  style={[styles.btn, styles.btnDanger]}
                  accessibilityLabel="Delete grid"
                >
                  <Text style={[styles.btnText, { color: "#ffffff" }]}>Delete</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity onPress={onCancel} style={[styles.btn, styles.btnSecondary]}>
                <Text style={[styles.btnText, { color: "#FFFFFF" }]}>
                  {isCreate ? "Cancel" : "Close"}
                </Text>
              </TouchableOpacity>
              {isCreate && onSave ? (
                <TouchableOpacity
                  onPress={() => {
                    onSave({
                      title: title?.trim() || undefined,
                      description: description?.trim() || undefined,
                    });
                  }}
                  style={[styles.btn, styles.btnPrimary]}
                >
                  <Text style={[styles.btnText, { color: "#FFFFFF" }]}>Save</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: 16,
  },
  card: {
    width: "100%",
    backgroundColor: "#26292B",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
    gap: 12,
  },
  label: { color: "#FFFFFF", fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#626A6F",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#FFFFFF",
    backgroundColor: "#1F2325",
  },
  inputMultiline: { minHeight: 80, textAlignVertical: "top" },
  viewTitle: { fontSize: 16, fontWeight: "700", color: "#FFFFFF", textAlign: "center" },
  viewDescription: { fontSize: 14, color: "#FFFFFF", textAlign: "center" },
  timestamp: { fontSize: 12, color: "#9CA3AF", textAlign: "center" },
  footer: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 8 },
  btn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  btnSecondary: { backgroundColor: "#26292B", borderWidth: 1, borderColor: "#626A6F" },
  btnPrimary: {
    backgroundColor: "#3b82f6",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  btnDanger: { backgroundColor: "#ef4444" },
  btnText: { color: "#FFFFFF", fontWeight: "600" },
});
