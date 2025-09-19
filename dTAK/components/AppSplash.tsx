import { Asset } from "expo-asset";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SvgUri } from "react-native-svg";

const LOGO_ASSET = Asset.fromModule(require("@assets/svg/DTAK_Logo.svg"));

const ACCENT = "#BD2724";

const loadLogoAsset = async (): Promise<string> => {
  if (!LOGO_ASSET.localUri) {
    await LOGO_ASSET.downloadAsync();
  }
  return LOGO_ASSET.localUri ?? LOGO_ASSET.uri;
};

const AppSplash: React.FC = () => {
  const [logoUri, setLogoUri] = useState<string | null>(LOGO_ASSET.localUri ?? null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const uri = await loadLogoAsset();
        if (!cancelled) {
          setLogoUri(uri);
        }
      } catch (error) {
        console.warn("Failed to load DTAK logo for splash", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const renderLogo = useMemo(() => {
    if (!logoUri) {
      return (
        <View style={styles.placeholderCircle}>
          <ActivityIndicator color={ACCENT} size="small" />
        </View>
      );
    }

    return (
      <View style={styles.logoContainer}>
        <SvgUri uri={logoUri} width={160} height={184} />
      </View>
    );
  }, [logoUri]);

  return (
    <View style={styles.container}>
      {renderLogo}
      <ActivityIndicator color={ACCENT} size="small" style={styles.spinner} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050608",
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "rgba(24, 29, 39, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 16,
  },
  placeholderCircle: {
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "rgba(24, 29, 39, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    marginTop: 32,
  },
});

export default AppSplash;
