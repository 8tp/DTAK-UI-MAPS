// Expo App.tsx
// TypeScript version of the state-driven onboarding flow plus plugin preview screen.

import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import MapPluginsScreen from "./MapPluginsScreen";

type Step =
  | "sign"
  | "address"
  | "selfie"
  | "creating"
  | "location"
  | "done"
  | "plugins";

type SetStep = Dispatch<SetStateAction<Step>>;

const T = {
  bg: "#0b0c10",
  surface: "#12141a",
  border: "#1f2430",
  text: "#e6e7ee",
  sub: "#9aa0a6",
  primary: "#4f6bff",
  primary2: "#2aa3ff",
  cta: "#4f6bff",
} as const;

const isEmail = (value: string): boolean => /.+@.+\..+/.test(value);
const strongEnough = (value: string): boolean => value.length >= 8;

const App: React.FC = () => {
  const [step, setStep] = useState<Step>("sign");

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [callsign, setCallsign] = useState<string>("");
  const [selfieTaken, setSelfieTaken] = useState<boolean>(false);
  const [ticks, setTicks] = useState<number>(0);

  useEffect(() => {
    if (step !== "creating") {
      return;
    }

    setTicks(0);
    const intervalHandle: ReturnType<typeof setInterval> = setInterval(
      () => setTicks((current) => current + 1),
      850,
    );
    const timeoutHandle: ReturnType<typeof setTimeout> = setTimeout(() => {
      clearInterval(intervalHandle);
      setStep("location");
    }, 3200);

    return () => {
      clearInterval(intervalHandle);
      clearTimeout(timeoutHandle);
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
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingBottom: 24 }}
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
};

function goBack(step: Step, setStep: SetStep): void {
  if (step === "address") {
    setStep("sign");
  } else if (step === "selfie") {
    setStep("address");
  } else if (step === "creating") {
    setStep("selfie");
  } else if (step === "location") {
    setStep("creating");
  }
}

type HeaderProps = {
  step: Step;
  onBack: () => void;
};

const Header: React.FC<HeaderProps> = ({ step, onBack }) => {
  const titleMap: Record<Exclude<Step, "plugins">, string> = {
    sign: "Create Account",
    address: "Home & Callsign",
    selfie: "Verify Identity",
    creating: "Setting Up",
    location: "Location Access",
    done: "Ready",
  };

  const title = step === "plugins" ? "" : titleMap[step];

  return (
    <View style={S.header}>
      <TouchableOpacity
        onPress={onBack}
        disabled={step === "sign" || step === "done"}
        style={[S.backBtn, (step === "sign" || step === "done") && { opacity: 0 }]}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text style={S.backTxt}>{"‹"}</Text>
      </TouchableOpacity>
      <View style={{ marginLeft: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={S.badge}>
            <Text style={S.badgeTxt}>Δ</Text>
          </View>
          <Text style={S.brand}>DTAK</Text>
        </View>
        {title.length > 0 && <Text style={S.title}>{title}</Text>}
      </View>
    </View>
  );
};

type CardProps = {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

const Card: React.FC<CardProps> = ({ children, style }) => (
  <View style={[S.card, style]}>{children}</View>
);

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
};

const Field: React.FC<FieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
}) => (
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

type CTAProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
};

const CTA: React.FC<CTAProps> = ({ title, onPress, disabled }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={[S.cta, disabled && { opacity: 0.6 }]}
    accessibilityRole="button"
  >
    <Text style={S.ctaTxt}>{title}</Text>
  </TouchableOpacity>
);

type GhostBtnProps = {
  title: string;
  onPress: () => void;
};

const GhostBtn: React.FC<GhostBtnProps> = ({ title, onPress }) => (
  <TouchableOpacity onPress={onPress} style={S.ghost} accessibilityRole="button">
    <Text style={S.ghostTxt}>{title}</Text>
  </TouchableOpacity>
);

type SignUpScreenProps = {
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  email: string;
  setEmail: Dispatch<SetStateAction<string>>;
  password: string;
  setPassword: Dispatch<SetStateAction<string>>;
  onNext: () => void;
};

const SignUpScreen: React.FC<SignUpScreenProps> = ({
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  onNext,
}) => {
  const canProceed = useMemo(
    () => name.trim().length > 1 && isEmail(email) && strongEnough(password),
    [name, email, password],
  );

  return (
    <Card>
      <Text style={S.subheader}>Mission-ready account setup</Text>
      <Text style={S.sectionTitle}>Securely create your account</Text>
      <View style={{ marginTop: 16 }}>
        <Field label="Full name" value={name} onChangeText={setName} placeholder="e.g. Alex Hunter" />
        <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@unit.mil" />
        <Field label="Password" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
      </View>
      <CTA title="Continue" onPress={onNext} disabled={!canProceed} />
      <Text style={S.legal}>By continuing you agree to mission terms and safety policies.</Text>
    </Card>
  );
};

type AddressCallsignScreenProps = {
  address: string;
  setAddress: Dispatch<SetStateAction<string>>;
  callsign: string;
  setCallsign: Dispatch<SetStateAction<string>>;
  onNext: () => void;
};

const AddressCallsignScreen: React.FC<AddressCallsignScreenProps> = ({
  address,
  setAddress,
  callsign,
  setCallsign,
  onNext,
}) => {
  const canProceed = useMemo(
    () => address.trim().length > 3 && callsign.trim().length > 1,
    [address, callsign],
  );

  return (
    <Card>
      <Text style={S.subheader}>Where to stage</Text>
      <Text style={S.sectionTitle}>Home address and callsign</Text>
      <View style={{ marginTop: 16 }}>
        <Field label="Home address" value={address} onChangeText={setAddress} placeholder="123 Mission Rd, City" />
        <Field label="Callsign" value={callsign} onChangeText={setCallsign} placeholder="e.g. Ranger-2" />
      </View>
      <CTA title="Continue" onPress={onNext} disabled={!canProceed} />
    </Card>
  );
};

type SelfieScreenProps = {
  selfieTaken: boolean;
  onCapture: () => void;
  onNext: () => void;
};

const SelfieScreen: React.FC<SelfieScreenProps> = ({ selfieTaken, onCapture, onNext }) => (
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
        <TouchableOpacity onPress={onCapture} style={S.primaryBtn} accessibilityRole="button">
          <Text style={S.primaryBtnTxt}>Take Selfie</Text>
        </TouchableOpacity>
      ) : (
        <CTA title="Looks good — Continue" onPress={onNext} />
      )}
      <Text style={[S.subText, { marginTop: 8 }]}>Photo processed on-device. Identity hashing occurs locally first.</Text>
    </View>
  </Card>
);

type CreatingScreenProps = {
  ticks: number;
};

const CreatingScreen: React.FC<CreatingScreenProps> = ({ ticks }) => {
  const steps = [
    "Initializing secure container",
    "Encrypting profile keys",
    "Verifying identity locally",
    "Finalizing setup",
  ];

  const activeIndex = Math.min(ticks, steps.length - 1);

  return (
    <Card>
      <View style={S.loaderIcon}>
        <ActivityIndicator size="large" color={T.primary} />
      </View>
      <Text style={S.sectionTitle}>Creating your account…</Text>
      <Text style={S.subText}>{steps[activeIndex]}</Text>
      <View style={{ marginTop: 16 }}>
        {steps.map((label, index) => (
          <Text key={label} style={[S.stepRow, { color: index <= activeIndex ? "#9ec3ff" : T.sub }]}>• {label}</Text>
        ))}
      </View>
    </Card>
  );
};

type LocationPromptScreenProps = {
  onGrant: () => void;
};

const LocationPromptScreen: React.FC<LocationPromptScreenProps> = ({ onGrant }) => (
  <Card>
    <View style={S.mapBadge}>
      <Text style={S.mapBadgeTxt}>📍</Text>
    </View>
    <Text style={S.sectionTitle}>We need your location</Text>
    <Text style={S.subText}>
      Used for team positioning and proximity alerts. Shared only with your authorized mission group.
    </Text>
    <CTA title="Grant Access" onPress={onGrant} />
    <GhostBtn title="Not now" onPress={() => {}} />
  </Card>
);

type FinalReadyProps = {
  onPreviewPlugins: () => void;
};

const FinalReady: React.FC<FinalReadyProps> = ({ onPreviewPlugins }) => (
  <Card>
    <Text style={S.sectionTitle}>Setup complete</Text>
    <Text style={S.subText}>You’re mission-ready.</Text>
    <TouchableOpacity style={S.primaryBtn} onPress={onPreviewPlugins} accessibilityRole="button">
      <Text style={S.primaryBtnTxt}>Preview plugins</Text>
    </TouchableOpacity>
    <GhostBtn title="Enter app" onPress={() => {}} />
  </Card>
);

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
  primaryBtnTxt: { color: "#081120", fontWeight: "700", fontSize: 16 },
});

export default App;
