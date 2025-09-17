// RN_App.jsx
// High‑fidelity React Native registration flow aligned to DTAK_Improved_System_Prompt_V2.md
// Five screens: Sign Up, Address + Callsign, Selfie, Creating Account, Location Prompt
// - No external navigation libs: simple state machine for flow to keep it portable
// - Color/typography follow the provided Frame references: dark surfaces, cobalt/indigo primary, amber CTA, high contrast
// - Wireframe references (local files in this folder):
//    Register Screen 1.png, Register Screen 2.png, Register Screen 3.png, Register Screen 4.png
// - Camera/geolocation are simulated for offline‑first behavior

import React, { useMemo, useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Image,
  ImageBackground,
} from "react-native";

// Theme tokens (Frame-inspired)
const T = {
  bg: "#0b0c10",
  surface: "#12141a",
  border: "#1f2430",
  text: "#e6e7ee",
  sub: "#9aa0a6",
  primary: "#4f6bff", // Frame blue
  primary2: "#2aa3ff",
  cta: "#4f6bff", // CTAs now blue per Frame
};

const isEmail = (v) => /.+@.+\..+/.test(v);
const strongEnough = (v) => v.length >= 8;

export default function App() {
  const [step, setStep] = useState("sign");

  // Shared state across steps
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [callsign, setCallsign] = useState("");
  const [selfieTaken, setSelfieTaken] = useState(false);
  const [ticks, setTicks] = useState(0);

  useEffect(() => {
    if (step !== "creating") return;
    setTicks(0);
    const iv = setInterval(() => setTicks((t) => t + 1), 850);
    const done = setTimeout(() => {
      clearInterval(iv);
      setStep("location");
    }, 3200);
    return () => {
      clearInterval(iv);
      clearTimeout(done);
    };
  }, [step]);

  const isNotifications = step === "notifications";

  return (
    <SafeAreaView style={[S.safe, { backgroundColor: T.bg }]}> 
      <View style={S.container}>
        <Header step={step} onBack={() => goBack(step, setStep)} />

        {/* Wireframe "links" as visual refs (non-interactive in RN) */}
        <ScrollView
          contentContainerStyle={
            isNotifications
              ? { paddingBottom: 24 }
              : { flexGrow: 1, justifyContent: "center", paddingBottom: 24 }
          }
          style={{ flex: 1 }}
        >
          {step === "sign" && (
            <SignUpScreen
              name={name}
              setName={setName}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              onNext={() => setStep("address")}
            />
          )}
          {step === "address" && (
            <AddressCallsignScreen
              address={address}
              setAddress={setAddress}
              callsign={callsign}
              setCallsign={setCallsign}
              onNext={() => setStep("selfie")}
            />
          )}
          {step === "selfie" && (
            <SelfieScreen
              selfieTaken={selfieTaken}
              onCapture={() => setSelfieTaken(true)}
              onNext={() => setStep("creating")}
            />
          )}
          {step === "creating" && <CreatingScreen ticks={ticks} />}
          {step === "location" && (
            <LocationPromptScreen onGrant={() => setStep("done")} />
          )}
          {step === "done" && (
            <FinalReady onViewNotifications={() => setStep("notifications")} />
          )}
          {step === "notifications" && <NotificationsScreen />}

          {/* Reference strip with thumbnail previews of wireframes */}
          {!isNotifications && <ReferenceStrip />}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function goBack(step, setStep) {
  if (step === "address") setStep("sign");
  else if (step === "selfie") setStep("address");
  else if (step === "creating") setStep("selfie");
  else if (step === "location") setStep("creating");
  else if (step === "notifications") setStep("done");
}

function Header({ step, onBack }) {
  const title = {
    sign: "Create Account",
    address: "Home & Callsign",
    selfie: "Verify Identity",
    creating: "Setting Up",
    location: "Location Access",
    done: "Ready",
    notifications: "Notifications",
  }[step];
  return (
    <View style={S.header}>
      <TouchableOpacity
        onPress={onBack}
        disabled={step === "sign" || step === "done"}
        style={[S.backBtn, (step === "sign" || step === "done") && { opacity: 0 }]}
      >
        <Text style={S.backTxt}>{"‹"}</Text>
      </TouchableOpacity>
      <View style={{ marginLeft: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={S.badge}><Text style={S.badgeTxt}>Δ</Text></View>
          <Text style={S.brand}>DTAK</Text>
        </View>
        <Text style={S.title}>{title}</Text>
      </View>
    </View>
  );
}

function Card({ children, style }) {
  return (
    <View style={[S.card, style]}>
      {children}
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, secureTextEntry }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={S.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={T.sub}
        secureTextEntry={secureTextEntry}
        style={S.input}
      />
    </View>
  );
}

function CTA({ title, onPress, disabled }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} style={[S.cta, disabled && { opacity: 0.6 }]}> 
      <Text style={S.ctaTxt}>{title}</Text>
    </TouchableOpacity>
  );
}

function GhostBtn({ title, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={S.ghost}> 
      <Text style={S.ghostTxt}>{title}</Text>
    </TouchableOpacity>
  );
}

function SignUpScreen({ name, setName, email, setEmail, password, setPassword, onNext }) {
  const can = useMemo(() => name.trim().length > 1 && isEmail(email) && strongEnough(password), [name, email, password]);
  return (
    <Card>
      <Text style={S.subheader}>Mission-ready account setup</Text>
      <Text style={S.sectionTitle}>Securely create your account</Text>
      <View style={{ marginTop: 16 }}>
        <Field label="Full name" value={name} onChangeText={setName} placeholder="e.g. Alex Hunter" />
        <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@unit.mil" />
        <Field label="Password" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
      </View>
      <CTA title="Continue" onPress={onNext} disabled={!can} />
      <Text style={S.legal}>By continuing you agree to mission terms and safety policies.</Text>
    </Card>
  );
}

function AddressCallsignScreen({ address, setAddress, callsign, setCallsign, onNext }) {
  const can = useMemo(() => address.trim().length > 3 && callsign.trim().length > 1, [address, callsign]);
  return (
    <Card>
      <Text style={S.subheader}>Where to stage</Text>
      <Text style={S.sectionTitle}>Home address and callsign</Text>
      <View style={{ marginTop: 16 }}>
        <Field label="Home address" value={address} onChangeText={setAddress} placeholder="123 Mission Rd, City" />
        <Field label="Callsign" value={callsign} onChangeText={setCallsign} placeholder="e.g. Ranger-2" />
      </View>
      <CTA title="Continue" onPress={onNext} disabled={!can} />
    </Card>
  );
}

function SelfieScreen({ selfieTaken, onCapture, onNext }) {
  return (
    <Card style={{ padding: 0 }}>
      <View style={S.cameraBox}>
        {/* Circular reticle */}
        <View style={S.reticleOuter}>
          <View style={S.reticleCrossH} />
          <View style={S.reticleCrossV} />
        </View>
        <View style={S.cameraHint}>
          <Text style={S.cameraHintTxt}>Align face within the circle and hold steady</Text>
        </View>
      </View>
      <View style={{ padding: 16 }}>
        {!selfieTaken ? (
          <TouchableOpacity onPress={onCapture} style={S.primaryBtn}> 
            <Text style={S.primaryBtnTxt}>Take Selfie</Text>
          </TouchableOpacity>
        ) : (
          <CTA title="Looks good — Continue" onPress={onNext} />
        )}
        <Text style={[S.subText, { marginTop: 8 }]}>Photo processed on-device. Identity hashing occurs locally first.</Text>
      </View>
    </Card>
  );
}

function CreatingScreen({ ticks }) {
  const steps = [
    "Initializing secure container",
    "Encrypting profile keys",
    "Verifying identity locally",
    "Finalizing setup",
  ];
  const idx = Math.min(ticks, steps.length - 1);
  return (
    <Card>
      <View style={S.loaderIcon}> 
        <ActivityIndicator size="large" color={T.primary} />
      </View>
      <Text style={S.sectionTitle}>Creating your account…</Text>
      <Text style={S.subText}>{steps[idx]}</Text>
      <View style={{ marginTop: 16 }}>
        {steps.map((s, i) => (
          <Text key={s} style={[S.stepRow, { color: i <= idx ? "#9ec3ff" : T.sub }]}>
            • {s}
          </Text>
        ))}
      </View>
    </Card>
  );
}

function LocationPromptScreen({ onGrant }) {
  return (
    <Card>
      <View style={S.mapBadge}><Text style={S.mapBadgeTxt}>📍</Text></View>
      <Text style={S.sectionTitle}>We need your location</Text>
      <Text style={S.subText}>Used for team positioning and proximity alerts. Shared only with your authorized mission group.</Text>
      <CTA title="Grant Access" onPress={onGrant} />
      <GhostBtn title="Not now" onPress={() => {}} />
    </Card>
  );
}

function FinalReady({ onViewNotifications }) {
  return (
    <Card>
      <Text style={S.sectionTitle}>Setup complete</Text>
      <Text style={S.subText}>You’re mission‑ready.</Text>
      <TouchableOpacity style={S.primaryBtn}>
        <Text style={S.primaryBtnTxt}>Enter app</Text>
      </TouchableOpacity>
      <GhostBtn title="View mission notifications" onPress={onViewNotifications} />
    </Card>
  );
}

function ReferenceStrip() {
  // Shows small thumbnails as visual breadcrumbs. In a live RN app these would be require() assets.
  const items = [
    "Register Screen 1.png",
    "Register Screen 2.png",
    "Register Screen 3.png",
    "Register Screen 4.png",
  ];
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={[S.subText, { marginBottom: 8 }]}>Wireframe references (thumbnails)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {items.map((p) => (
          <View key={p} style={S.thumbWrap}>
            <Image
              source={{ uri: p }}
              style={S.thumb}
              resizeMode="cover"
              // NOTE: In production, use require("./Register Screen 1.png") style imports
            />
            <Text style={S.thumbLabel}>{p.replace(".png", "")}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// Notifications feed derived from Figma frame 128:4419 (TAK Screens) via figma MCP export.
function NotificationsScreen() {
  const quickFilters = [
    { id: "chat", label: "CHAT", active: true },
    { id: "persco", label: "PERSCO", active: false },
    { id: "killbox", label: "Killbox", active: false },
  ];

  const mapCollections = [
    {
      id: "ny",
      name: "New York",
      image: "https://placehold.co/240x180/101828/1b2337?text=NYC",
      live: true,
    },
    {
      id: "chi",
      name: "Chicago",
      image: "https://placehold.co/240x180/0f172a/1b2337?text=CHI",
      live: false,
    },
    {
      id: "mgm",
      name: "Montgomery",
      image: "https://placehold.co/240x180/111827/1b2337?text=MGM",
      live: false,
    },
  ];

  const pluginQuickActions = [
    { id: "chat", label: "CHAT", icon: "💬", active: true },
    { id: "persco", label: "PERSCO", icon: "🪖", active: false },
    { id: "killbox", label: "Killbox", icon: "🎯", active: false },
  ];

  const feedItems = [
    {
      id: "map",
      title: "Map",
      description: "New pin dropped on Montgomery",
      icon: "📍",
      swatch: "#4f6bff",
    },
    {
      id: "chat",
      title: "Chat",
      description: "New message notification",
      icon: "💬",
      swatch: "#2aa3ff",
    },
    {
      id: "persco",
      title: "PERSCO",
      description: "New flight created",
      icon: "✈️",
      swatch: "#7dd3fc",
    },
    {
      id: "killbox",
      title: "Killbox",
      description: "New Killbox created",
      icon: "🛰️",
      swatch: "#facc15",
    },
  ];

  return (
    <View style={NS.container}>
      <ImageBackground
        source={{ uri: "https://placehold.co/600x360/0f172a/1b2337?text=Mission+Sector" }}
        style={NS.hero}
        imageStyle={NS.heroImage}
      >
        <View style={NS.heroOverlay} />
        <View style={NS.navRow}>
          <TouchableOpacity
            style={NS.navBtn}
            accessibilityLabel="Mission roster"
            accessibilityRole="button"
            onPress={() => {}}
          >
            <Text style={NS.navIcon}>👥</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={NS.navBtn}
            accessibilityLabel="Alerts"
            accessibilityRole="button"
            onPress={() => {}}
          >
            <Text style={NS.navIcon}>🔔</Text>
            <View style={NS.navDot} />
          </TouchableOpacity>
        </View>
        <View style={NS.filterRow}>
          {quickFilters.map((item) => (
            <QuickFilterChip key={item.id} label={item.label} active={item.active} />
          ))}
        </View>
      </ImageBackground>

      <View style={NS.sheet}>
        <View style={NS.sheetBlock}>
          <SheetHeader title="My maps" />
          <View style={NS.mapGrid}>
            {mapCollections.map((item) => (
              <MapCollectionCard key={item.id} {...item} />
            ))}
          </View>
        </View>

        <View style={NS.sheetBlock}>
          <SheetHeader title="Plugins" />
          <View style={NS.pluginRow}>
            {pluginQuickActions.map((item) => (
              <PluginQuickCard key={item.id} {...item} />
            ))}
          </View>
        </View>
      </View>

      <View style={NS.feed}>
        <Text style={NS.feedHeading}>Notifications</Text>
        {feedItems.map((item) => (
          <NotificationRow key={item.id} {...item} />
        ))}
      </View>
    </View>
  );
}

function QuickFilterChip({ label, active }) {
  return (
    <TouchableOpacity
      style={[NS.filterChip, active ? NS.filterChipActive : NS.filterChipInactive]}
      accessibilityRole="button"
      onPress={() => {}}
    >
      <Text style={[NS.filterText, active ? NS.filterTextActive : NS.filterTextInactive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SheetHeader({ title }) {
  return (
    <View style={NS.sectionHeader}>
      <Text style={NS.sectionTitle}>{title}</Text>
      <View style={NS.viewMorePill}>
        <Text style={NS.viewMoreText}>View more</Text>
        <Text style={NS.viewMoreArrow}>{"›"}</Text>
      </View>
    </View>
  );
}

function MapCollectionCard({ name, image, live }) {
  return (
    <View style={NS.mapCard}>
      <ImageBackground
        source={{ uri: image }}
        style={NS.mapPreview}
        imageStyle={NS.mapPreviewImage}
      >
        {live && (
          <View style={NS.mapBadge}>
            <Text style={NS.mapBadgeText}>Live</Text>
          </View>
        )}
      </ImageBackground>
      <Text style={NS.mapName}>{name}</Text>
    </View>
  );
}

function PluginQuickCard({ label, icon, active }) {
  return (
    <View style={[NS.pluginCard, active ? NS.pluginCardActive : null]}>
      <Text style={NS.pluginIcon}>{icon}</Text>
      <Text style={[NS.pluginLabel, active ? NS.pluginLabelActive : null]}>{label}</Text>
    </View>
  );
}

function NotificationRow({ title, description, icon, swatch }) {
  return (
    <View style={NS.feedCard}>
      <View style={[NS.feedIconWrap, { backgroundColor: `${swatch}20`, borderColor: `${swatch}40` }]}> 
        <Text style={NS.feedIcon}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={NS.feedTitle}>{title}</Text>
        <Text style={NS.feedSubtitle}>{description}</Text>
      </View>
      <View style={[NS.feedIndicator, { backgroundColor: swatch }]} />
    </View>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  backBtn: { height: 36, width: 36, alignItems: "center", justifyContent: "center" },
  backTxt: { color: T.sub, fontSize: 22 },
  badge: { height: 24, width: 24, borderRadius: 6, backgroundColor: T.primary, alignItems: "center", justifyContent: "center" },
  badgeTxt: { color: "#0b1220", fontWeight: "700" },
  brand: { color: "#c8cbd2", fontSize: 13 },
  title: { color: T.text, fontSize: 18, fontWeight: "700", marginTop: 2 },
  card: {
    backgroundColor: T.surface,
    borderColor: T.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  subheader: { color: T.sub, fontSize: 14 },
  sectionTitle: { color: T.text, fontSize: 18, fontWeight: "600", marginTop: 2 },
  fieldLabel: { color: T.sub, fontSize: 12, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.6 },
  input: {
    backgroundColor: "#0f1117",
    color: T.text,
    borderColor: T.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  cta: {
    backgroundColor: T.cta,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  ctaTxt: { color: "#0b0c10", fontWeight: "700", fontSize: 16 },
  ghost: {
    borderColor: T.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  ghostTxt: { color: T.text, fontSize: 16 },
  legal: { color: "#80858f", fontSize: 12, textAlign: "center", marginTop: 10 },
  subText: { color: T.sub, fontSize: 14 },
  cameraBox: { backgroundColor: "#0f1117", height: 380, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  reticleOuter: { height: 220, width: 220, borderRadius: 110, borderWidth: 2, borderColor: "#6aa0ff", alignItems: "center", justifyContent: "center" },
  reticleCrossH: { position: "absolute", top: "50%", left: -110, right: -110, height: 1, backgroundColor: "#6aa0ff40" },
  reticleCrossV: { position: "absolute", left: "50%", top: -110, bottom: -110, width: 1, backgroundColor: "#6aa0ff40" },
  cameraHint: { position: "absolute", bottom: 12, left: 12, right: 12, backgroundColor: "#0b0c10cc", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
  cameraHintTxt: { color: T.text, textAlign: "center", fontSize: 13 },
  loaderIcon: { alignSelf: "center", height: 64, width: 64, borderRadius: 32, backgroundColor: "#0f1117", alignItems: "center", justifyContent: "center" },
  stepRow: { fontSize: 13, marginVertical: 3 },
  mapBadge: { alignSelf: "center", height: 56, width: 56, borderRadius: 14, backgroundColor: "#143056", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  mapBadgeTxt: { fontSize: 24, textAlign: "center" },
  primaryBtn: { backgroundColor: T.primary, paddingVertical: 12, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 14 },
  primaryBtnTxt: { color: "#081120", fontWeight: "700", fontSize: 16 },
  thumbWrap: { width: 120, marginRight: 12 },
  thumb: { height: 120, width: 120, backgroundColor: "#0f1117", borderRadius: 10, borderWidth: 1, borderColor: T.border },
  thumbLabel: { color: T.sub, fontSize: 12, marginTop: 6 },
});

const NS = StyleSheet.create({
  container: {
    paddingBottom: 32,
    gap: 24,
  },
  hero: {
    height: 260,
    borderRadius: 28,
    overflow: "hidden",
    marginHorizontal: 4,
  },
  heroImage: {
    borderRadius: 28,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4, 6, 12, 0.45)",
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  navBtn: {
    height: 48,
    width: 48,
    borderRadius: 16,
    backgroundColor: "rgba(11, 12, 16, 0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  navIcon: {
    fontSize: 22,
    color: T.text,
  },
  navDot: {
    position: "absolute",
    top: 12,
    right: 12,
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: T.primary,
  },
  filterRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterChipActive: {
    borderColor: T.primary,
    backgroundColor: "rgba(79, 107, 255, 0.25)",
  },
  filterChipInactive: {
    borderColor: "rgba(79, 107, 255, 0.2)",
    backgroundColor: "rgba(18, 20, 26, 0.85)",
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  filterTextActive: {
    color: T.text,
  },
  filterTextInactive: {
    color: T.sub,
  },
  sheet: {
    marginTop: -36,
    marginHorizontal: 4,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: "#0f1117",
    borderWidth: 1,
    borderColor: T.border,
    gap: 24,
  },
  sheetBlock: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: T.text,
    fontSize: 18,
    fontWeight: "600",
  },
  viewMorePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(31, 36, 48, 0.9)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewMoreText: {
    color: T.sub,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  viewMoreArrow: {
    marginLeft: 6,
    color: T.sub,
    fontSize: 12,
  },
  mapGrid: {
    flexDirection: "row",
    gap: 12,
  },
  mapCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: "#0b0c10",
    overflow: "hidden",
  },
  mapPreview: {
    height: 96,
    justifyContent: "center",
  },
  mapPreviewImage: {
    borderRadius: 0,
  },
  mapBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: T.primary,
  },
  mapBadgeText: {
    color: "#081120",
    fontSize: 11,
    fontWeight: "700",
  },
  mapName: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: T.text,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  pluginRow: {
    flexDirection: "row",
    gap: 12,
  },
  pluginCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: "#101722",
  },
  pluginCardActive: {
    borderColor: T.primary,
    backgroundColor: "rgba(79, 107, 255, 0.18)",
  },
  pluginIcon: {
    fontSize: 22,
  },
  pluginLabel: {
    marginTop: 10,
    color: T.sub,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  pluginLabelActive: {
    color: T.text,
  },
  feed: {
    paddingHorizontal: 4,
    gap: 16,
  },
  feedHeading: {
    color: T.text,
    fontSize: 24,
    fontWeight: "700",
  },
  feedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 18,
    borderRadius: 22,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
  },
  feedIconWrap: {
    height: 52,
    width: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  feedIcon: {
    fontSize: 24,
  },
  feedTitle: {
    color: T.text,
    fontSize: 16,
    fontWeight: "600",
  },
  feedSubtitle: {
    color: T.sub,
    fontSize: 13,
    marginTop: 4,
  },
  feedIndicator: {
    height: 12,
    width: 12,
    borderRadius: 6,
  },
});
