import React, { Dispatch, SetStateAction } from "react";
import {
  ActivityIndicator,
  Image,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

/**
 * Centralized design tokens shared across the onboarding flow.
 * Keep this list in sync with docs/design-visual-guide.md.
 */
export const tokens = {
  bg: "#1F2021",
  surface: "#26292B",
  border: "#323639",
  text: "#fff",
  sub: "#D6D9DB",
  primary: "#1879C7",
  accent: "#2aa3ff",
} as const;

const DTAK_LOGO = require("../../assets/dtak-logo.png");

export const DtakLogoBadge: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <Image
    source={DTAK_LOGO}
    style={{ width: size, height: size, resizeMode: "contain" }}
  />
);

export type CTAProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
};

export const CTA: React.FC<CTAProps> = ({ title, onPress, disabled }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={[styles.cta, disabled && { opacity: 0.6 }]}
    accessibilityRole="button"
  >
    <Text style={styles.ctaTxt}>{title}</Text>
  </TouchableOpacity>
);

export type GhostButtonProps = {
  title: string;
  onPress: () => void;
};

export const GhostButton: React.FC<GhostButtonProps> = ({ title, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={styles.ghost}
    accessibilityRole="button"
  >
    <Text style={styles.ghostTxt}>{title}</Text>
  </TouchableOpacity>
);

export type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export const Card: React.FC<CardProps> = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

export type FieldProps = {
  label: string;
  value: string;
  onChangeText: Dispatch<SetStateAction<string>> | ((text: string) => void);
  placeholder?: string;
  secureTextEntry?: boolean;
};

export const Field: React.FC<FieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
}) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={tokens.sub}
      secureTextEntry={secureTextEntry}
      style={styles.input}
    />
  </View>
);

export const Loader: React.FC = () => (
  <View style={styles.loaderIcon}>
    <ActivityIndicator size="large" color={tokens.primary} />
  </View>
);

export const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.surface,
    borderColor: tokens.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  cta: {
    backgroundColor: tokens.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  ctaTxt: { color: "#0b0c10", fontWeight: "700", fontSize: 16 },
  ghost: {
    borderColor: tokens.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  ghostTxt: { color: tokens.text, fontSize: 16 },
  fieldContainer: { marginBottom: 14 },
  fieldLabel: {
    color: tokens.sub,
    fontSize: 12,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: "#0f1117",
    color: tokens.text,
    borderColor: tokens.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  loaderIcon: {
    alignSelf: "center",
    height: 64,
    width: 64,
    borderRadius: 32,
    backgroundColor: "#0f1117",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default {
  tokens,
  Card,
  CTA,
  GhostButton,
  Field,
  Loader,
  DtakLogoBadge,
  styles,
};
