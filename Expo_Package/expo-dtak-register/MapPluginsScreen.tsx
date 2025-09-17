// React Native implementation of the Map Plugins frame (Figma node 128:4016)
// Rebuilt from figma MCP export to run inside the Expo shell without Tailwind.

import React from "react";
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

type MapPluginsScreenProps = {
  onBack?: () => void;
};

type MapCollection = {
  id: string;
  name: string;
  selected: boolean;
  hint: string;
};

type QuickAction = {
  id: string;
  label: string;
  active: boolean;
  icon: string;
};

type Tone = "neutral" | "alert" | "inactive";

type StatusTile = {
  id: string;
  title: string;
  state: string;
  tone: Tone;
  icon: string;
};

type ToneStyles = {
  card: StyleProp<ViewStyle>;
  badge: StyleProp<ViewStyle>;
};

const palette = {
  bg: "#04070f",
  surface: "#111826",
  surfaceSoft: "#1b2536",
  border: "#1f2c3f",
  borderBright: "#2d3d55",
  accent: "#53e0b4",
  accentSoft: "#1e3b42",
  text: "#f5f7ff",
  subtext: "#92a4c0",
  badge: "#29344a",
  alert: "#ff647c",
} as const;

const mapCollections: MapCollection[] = [
  { id: "nyc", name: "New York", selected: true, hint: "Live" },
  { id: "chi", name: "Chicago", selected: false, hint: "Reserved" },
  { id: "mgm", name: "Montgomery", selected: false, hint: "Standby" },
];

const pluginQuickActions: QuickAction[] = [
  { id: "chat", label: "Chat", active: true, icon: "💬" },
  { id: "persco", label: "Persco", active: false, icon: "🧭" },
  { id: "killbox", label: "Killbox", active: false, icon: "🎯" },
];

const pluginStatusTiles: StatusTile[] = [
  { id: "visibility", title: "Visibility overlay", state: "Partial", tone: "neutral", icon: "👁" },
  { id: "threat", title: "Threat watch", state: "Live", tone: "alert", icon: "⚠️" },
  { id: "lowlight", title: "Low light", state: "Dim", tone: "inactive", icon: "🌙" },
];

const MapPluginsScreen: React.FC<MapPluginsScreenProps> = ({ onBack }) => (
  <ScrollView style={styles.wrapper} contentContainerStyle={styles.wrapperContent}>
    <View style={styles.headerRow}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.backButton} accessibilityRole="button">
          <Text style={styles.backGlyph}>{"‹"}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.backPlaceholder} />
      )}
      <View>
        <View style={styles.brandBadge}>
          <Text style={styles.brandBadgeGlyph}>Δ</Text>
        </View>
        <Text style={styles.brandLabel}>DTAK</Text>
        <Text style={styles.headerTitle}>Map plugins</Text>
      </View>
    </View>

    <View style={styles.deviceShell}>
      <View style={styles.mapPreview}>
        <View style={styles.previewBackdrop}>
          <View style={styles.gridLineHorizontal} />
          <View style={styles.gridLineVertical} />
        </View>
        <View style={styles.previewLabels}>
          <Text style={styles.previewTitle}>MISSION SECTOR</Text>
          <Text style={styles.previewSubtitle}>Urban mesh — Sector 7</Text>
        </View>
        <View style={styles.previewTopRow}>
          <TouchableOpacity style={styles.previewChip} accessibilityRole="button">
            <Text style={styles.previewChipGlyph}>👥</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.previewChip} accessibilityRole="button">
            <Text style={styles.previewChipGlyph}>🔔</Text>
            <View style={styles.alertDot} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sheet}>
        <SectionHeader title="My maps" />
        <MapCollectionGrid />

        <SectionHeader title="Plugins" style={{ marginTop: 24 }} />
        <PluginQuickActions />
        <PluginStatusTiles />
      </View>
    </View>
  </ScrollView>
);

const SectionHeader: React.FC<{ title: string; style?: StyleProp<ViewStyle> }> = ({ title, style }) => (
  <View style={[styles.sectionHeader, style]}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <ViewMorePill />
  </View>
);

const ViewMorePill: React.FC = () => (
  <TouchableOpacity style={styles.viewMore} accessibilityRole="button">
    <Text style={styles.viewMoreText}>View more</Text>
  </TouchableOpacity>
);

const MapCollectionGrid: React.FC = () => (
  <View style={styles.mapGrid}>
    {mapCollections.map((collection, index) => {
      const marginRight = (index + 1) % 3 === 0 ? 0 : 12;
      return (
        <View
          key={collection.id}
          style={[styles.mapCard, { marginRight }]}
          accessible
          accessibilityLabel={`${collection.name} map`}
        >
          <View style={styles.mapThumbnail}>
            <View style={styles.thumbnailOverlay}>
              <Text style={styles.thumbnailGlyph}>▣</Text>
            </View>
            {collection.selected ? (
              <View style={styles.livePill}>
                <Text style={styles.livePillText}>● {collection.hint}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.mapName}>{collection.name}</Text>
        </View>
      );
    })}
  </View>
);

const PluginQuickActions: React.FC = () => (
  <View style={styles.quickActionRow}>
    {pluginQuickActions.map((action, index) => {
      const marginRight = index === pluginQuickActions.length - 1 ? 0 : 12;
      const stateStyle = action.active ? styles.quickActionActive : styles.quickActionIdle;

      return (
        <TouchableOpacity
          key={action.id}
          style={[styles.quickAction, stateStyle, { marginRight }]}
          accessibilityRole="button"
        >
          <Text style={styles.quickActionGlyph}>{action.icon}</Text>
          <Text style={styles.quickActionLabel}>{action.label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const PluginStatusTiles: React.FC = () => (
  <View style={styles.statusRow}>
    {pluginStatusTiles.map((tile, index) => {
      const marginRight = index === pluginStatusTiles.length - 1 ? 0 : 12;
      const stylesForTone = toneStyle(tile.tone);

      return (
        <View key={tile.id} style={[styles.statusCard, { marginRight }, stylesForTone.card]}> 
          <View style={[styles.statusBadge, stylesForTone.badge]}>
            <Text style={styles.statusBadgeGlyph}>{tile.icon}</Text>
            <Text style={styles.statusBadgeText}>{tile.state}</Text>
          </View>
          <Text style={styles.statusTitle}>{tile.title}</Text>
          <Text style={styles.statusSubtitle}>Synced via TAK mesh</Text>
        </View>
      );
    })}
  </View>
);

function toneStyle(tone: Tone): ToneStyles {
  switch (tone) {
    case "alert":
      return {
        card: { borderColor: "#ff8696" },
        badge: { backgroundColor: "#ff527244" },
      };
    case "inactive":
      return {
        card: { borderColor: palette.border },
        badge: { backgroundColor: "#101621" },
      };
    default:
      return {
        card: { borderColor: palette.borderBright },
        badge: { backgroundColor: palette.badge },
      };
  }
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  wrapperContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  backButton: {
    height: 40,
    width: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  backPlaceholder: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  backGlyph: {
    color: palette.subtext,
    fontSize: 24,
  },
  brandBadge: {
    height: 26,
    width: 26,
    borderRadius: 8,
    backgroundColor: palette.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  brandBadgeGlyph: {
    color: "#01151a",
    fontWeight: "700",
  },
  brandLabel: {
    color: palette.subtext,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  headerTitle: {
    color: palette.text,
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4,
  },
  deviceShell: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    overflow: "hidden",
  },
  mapPreview: {
    height: 240,
    backgroundColor: "#162131",
    justifyContent: "flex-end",
    padding: 20,
  },
  previewBackdrop: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#24415a",
  },
  gridLineHorizontal: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "50%",
    height: 1,
    backgroundColor: "#24415a",
    opacity: 0.4,
  },
  gridLineVertical: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "50%",
    width: 1,
    backgroundColor: "#24415a",
    opacity: 0.4,
  },
  previewLabels: {
    marginBottom: 12,
  },
  previewTitle: {
    color: palette.subtext,
    fontSize: 12,
    letterSpacing: 4,
  },
  previewSubtitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  previewTopRow: {
    position: "absolute",
    top: 18,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  previewChip: {
    height: 46,
    width: 46,
    borderRadius: 18,
    backgroundColor: "#070b15cc",
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
  },
  previewChipGlyph: {
    fontSize: 20,
    color: palette.text,
  },
  alertDot: {
    position: "absolute",
    top: 10,
    right: 12,
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: palette.alert,
  },
  sheet: {
    backgroundColor: palette.surface,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: "700",
  },
  viewMore: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: palette.badge,
    borderWidth: 1,
    borderColor: palette.border,
  },
  viewMoreText: {
    color: palette.text,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  mapGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  mapCard: {
    width: "30%",
    backgroundColor: palette.surfaceSoft,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 10,
    marginBottom: 12,
  },
  mapThumbnail: {
    height: 96,
    borderRadius: 14,
    backgroundColor: "#1f2c3e",
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  thumbnailOverlay: {
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnailGlyph: {
    color: "#3c567a",
    fontSize: 28,
  },
  livePill: {
    position: "absolute",
    top: 10,
    right: 10,
    borderRadius: 12,
    backgroundColor: palette.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  livePillText: {
    color: "#01231d",
    fontSize: 12,
    fontWeight: "600",
  },
  mapName: {
    color: palette.text,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  quickActionRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  quickAction: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionActive: {
    backgroundColor: "#144437",
    borderColor: palette.accent,
  },
  quickActionIdle: {
    backgroundColor: palette.surfaceSoft,
    borderColor: palette.border,
  },
  quickActionGlyph: {
    fontSize: 20,
    marginBottom: 8,
  },
  quickActionLabel: {
    color: palette.text,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  statusRow: {
    flexDirection: "row",
  },
  statusCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: palette.surfaceSoft,
    padding: 16,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeGlyph: {
    fontSize: 16,
    marginRight: 4,
  },
  statusBadgeText: {
    color: palette.text,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  statusTitle: {
    color: palette.text,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 12,
  },
  statusSubtitle: {
    color: palette.subtext,
    fontSize: 12,
    marginTop: 4,
  },
});

export default MapPluginsScreen;
