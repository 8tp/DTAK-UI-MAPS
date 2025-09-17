// Expo App.js
// This embeds the same registration flow implemented in MVP - Onboarding, Map/RN_App.jsx
// to make it runnable in an Expo starter without external navigation.

import React, { useMemo, useState, useEffect } from "react";
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import MapPluginsScreen from "./MapPluginsScreen";

// Theme tokens (Frame-inspired)
const T = {
  bg: "#0b0c10",
  surface: "#12141a",
  border: "#1f2430",
  text: "#e6e7ee",
  sub: "#9aa0a6",
  primary: "#4f6bff", // Frame blue
  primary2: "#2aa3ff",
  cta: "#4f6bff", // CTA buttons use Frame blue
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

  if (step === "plugins") {
    return (
      <SafeAreaView style={[S.safe, { backgroundColor: "#04070f" }]}>
        <MapPluginsScreen onBack={() => setStep("done")} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[S.safe, { backgroundColor: T.bg }]}> 
      <View style={S.container}>
        <Header step={step} onBack={() => goBack(step, setStep)} />
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 24 }}
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
            <FinalReady onPreviewPlugins={() => setStep("plugins")} />
          )}
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
}

function Header({ step, onBack }) {
  const title = {
    sign: "Create Account",
    address: "Home & Callsign",
    selfie: "Verify Identity",
    creating: "Setting Up",
    location: "Location Access",
    done: "Ready",
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
  return <View style={[S.card, style]}>{children}</View>;
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
          <Text key={s} style={[S.stepRow, { color: i <= idx ? "#9ec3ff" : T.sub }]}>• {s}</Text>
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

function FinalReady({ onPreviewPlugins }) {
  return (
    <Card>
      <Text style={S.sectionTitle}>Setup complete</Text>
      <Text style={S.subText}>You’re mission‑ready.</Text>
      <TouchableOpacity style={S.primaryBtn} onPress={onPreviewPlugins}> 
        <Text style={S.primaryBtnTxt}>Preview plugins</Text>
      </TouchableOpacity>
      <GhostBtn title="Enter app" onPress={() => {}} />
    </Card>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 16, backgroundColor: T.bg },
  header: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  backBtn: { height: 36, width: 36, alignItems: "center", justifyContent: "center" },
  backTxt: { color: T.sub, fontSize: 22 },
  badge: { height: 24, width: 24, borderRadius: 6, backgroundColor: T.primary, alignItems: "center", justifyContent: "center" },
  badgeTxt: { color: "#0b1220", fontWeight: "700" },
  brand: { color: "#c8cbd2", fontSize: 13 },
  title: { color: T.text, fontSize: 18, fontWeight: "700", marginTop: 2 },
  card: { backgroundColor: T.surface, borderColor: T.border, borderWidth: 1, borderRadius: 16, padding: 16 },
  subheader: { color: T.sub, fontSize: 14 },
  sectionTitle: { color: T.text, fontSize: 18, fontWeight: "600", marginTop: 2 },
  fieldLabel: { color: T.sub, fontSize: 12, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.6 },
  input: { backgroundColor: "#0f1117", color: T.text, borderColor: T.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16 },
  cta: { backgroundColor: T.cta, paddingVertical: 12, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 14 },
  ctaTxt: { color: "#0b0c10", fontWeight: "700", fontSize: 16 },
  ghost: { borderColor: T.border, borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center", justifyContent: "center", marginTop: 10 },
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
  primaryBtnTxt: { color: "#081120", fontWeight: "700", fontSize: 16 }
});
