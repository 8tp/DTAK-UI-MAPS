import React, { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
import * as Location from "expo-location";
import MapPluginsScreen from "./MapPluginsScreen";

type Step =
  | "login"
  | "sign"
  | "address"
  | "selfie"
  | "creating"
  | "location"
  | "done"
  | "plugins";

type NonPluginStep = Exclude<Step, "plugins">;

type SetStep = Dispatch<SetStateAction<Step>>;

type OnboardingFlowProps = {
  onEnterApp: () => void;
};

const palette = {
  bg: "#1F2021",
  surface: "#26292B",
  border: "#323639",
  text: "#ffffff",
  sub: "#D6D9DB",
  primary: "#1879C7",
} as const;

const DTAK_LOGO = require("@assets/onboarding/dtak-logo.png");

const FACE_SCANS = [
  require("@assets/onboarding/face-scan-1.png"),
  require("@assets/onboarding/face-scan-2.png"),
  require("@assets/onboarding/face-scan-3.png"),
  require("@assets/onboarding/face-scan-4.png"),
] as const;

const isEmail = (value: string): boolean => /.+@.+\..+/.test(value);
const strongEnough = (value: string): boolean =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{15,}$/.test(
    value
  );

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onEnterApp }) => {
  const [step, setStep] = useState<Step>("login");
  const [pluginsReturnStep, setPluginsReturnStep] = useState<NonPluginStep>("done");
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [callsign, setCallsign] = useState<string>("");
  const [selfieTaken, setSelfieTaken] = useState<boolean>(false);
  const [ticks, setTicks] = useState<number>(0);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    if (step !== "creating") {
      return;
    }

    setTicks(0);
    const intervalHandle: ReturnType<typeof setInterval> = setInterval(
      () => setTicks((current) => current + 1),
      850
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
      <SafeAreaView style={[styles.safe, { backgroundColor: "#04070f" }]}>
        <MapPluginsScreen onBack={() => setStep(pluginsReturnStep)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]}>
      <View style={styles.container}>
        <Header step={step} onBack={() => goBack(step, setStep)} />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          style={styles.scroll}
        >
          {step === "login" && (
            <LoginScreen
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              onSignIn={() => {
                setPluginsReturnStep("login");
                setStep("plugins");
              }}
              onCreateAccount={() => setStep("sign")}
            />
          )}
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
            <LocationPromptScreen
              onGrant={(position) => {
                setUserLocation(position);
                setStep("done");
              }}
              onSkip={() => setStep("done")}
            />
          )}
          {step === "done" && (
            <FinalReady
              onPreviewPlugins={() => {
                setPluginsReturnStep("done");
                setStep("plugins");
              }}
              onEnterApp={onEnterApp}
              location={userLocation}
            />
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

type HeaderProps = {
  step: Step;
  onBack: () => void;
};

const Header: React.FC<HeaderProps> = ({ step, onBack }) => {
  const titleMap: Record<NonPluginStep, string> = {
    login: "Sign In",
    sign: "Create Account",
    address: "Home & Callsign",
    selfie: "Verify Identity",
    creating: "Setting Up",
    location: "Location Access",
    done: "Ready",
  };

  const title = step === "plugins" ? "" : titleMap[step];
  const backDisabled = step === "login" || step === "done";

  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={onBack}
        disabled={backDisabled}
        style={[styles.backBtn, backDisabled && styles.backBtnDisabled]}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text style={styles.backTxt}>{"‹"}</Text>
      </TouchableOpacity>
      <View style={styles.logoContainer}>
        <Image source={DTAK_LOGO} style={styles.logo} resizeMode="contain" />
        {title.length > 0 && <Text style={styles.title}>{title}</Text>}
      </View>
    </View>
  );
};

type CardProps = {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

const Card: React.FC<CardProps> = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
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
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={palette.sub}
      secureTextEntry={secureTextEntry}
      style={styles.input}
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
    style={[styles.cta, disabled && styles.ctaDisabled]}
    accessibilityRole="button"
  >
    <Text style={styles.ctaTxt}>{title}</Text>
  </TouchableOpacity>
);

type GhostBtnProps = {
  title: string;
  onPress: () => void;
};

const GhostBtn: React.FC<GhostBtnProps> = ({ title, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.ghost} accessibilityRole="button">
    <Text style={styles.ghostTxt}>{title}</Text>
  </TouchableOpacity>
);

const FaceScanLoader: React.FC = () => {
  const [frameIndex, setFrameIndex] = useState<number>(0);

  useEffect(() => {
    const handle = setInterval(() => {
      setFrameIndex((index) => (index + 1) % FACE_SCANS.length);
    }, 180);

    return () => clearInterval(handle);
  }, []);

  return (
    <View style={styles.faceScanContainer} testID="face-scan-loader">
      <Image source={FACE_SCANS[frameIndex]} style={styles.faceScanImage} />
    </View>
  );
};

type LoginScreenProps = {
  email: string;
  setEmail: Dispatch<SetStateAction<string>>;
  password: string;
  setPassword: Dispatch<SetStateAction<string>>;
  onSignIn: () => void;
  onCreateAccount: () => void;
};

const LoginScreen: React.FC<LoginScreenProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  onSignIn,
  onCreateAccount,
}) => {
  const passwordValid = strongEnough(password);
  const canSignIn = useMemo(() => isEmail(email) && passwordValid, [email, passwordValid]);

  return (
    <Card>
      <Text style={styles.subheader}>dTAK Sign In</Text>
      <Text style={styles.sectionTitle}>Sign in to continue</Text>
      <View style={styles.sectionBody}>
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@gmail.com"

        />
        {!passwordValid && password.length > 0 && (
          <Text style={styles.passwordHint}>
            {
              "Use 15+ chars with at least one upper, lower, number, and special symbol. All special characters (e.g. !@#$%^&*()_+-=[]{};':\"\\|,.<>/?`~) are allowed."
            }
          </Text>
        )}
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
        />
      </View>
      <CTA title="Sign in" onPress={onSignIn} disabled={!canSignIn} />
      <GhostBtn title="Create account" onPress={onCreateAccount} />
    </Card>
  );
};

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
  const passwordValid = strongEnough(password);
  const canProceed = useMemo(
    () => name.trim().length > 1 && isEmail(email) && passwordValid,
    [name, email, passwordValid]
  );

  return (
    <Card>
      <Text style={styles.subheader}>Account setup</Text>
      <Text style={styles.sectionTitle}>Securely create your account</Text>
      <View style={styles.sectionBody}>
        <Field
          label="Full name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Alex Hunter"
        />
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@gmail.com"
        />
        {!passwordValid && password.length > 0 && (
          <Text style={styles.passwordHint}>
            {
              "Use 15+ chars with at least one upper, lower, number, and special symbol. All special characters (e.g. !@#$%^&*()_+-=[]{};':\"\\|,.<>/?`~) are allowed."
            }
          </Text>
        )}
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
        />
      </View>
      <CTA title="Continue" onPress={onNext} disabled={!canProceed} />
      <Text style={styles.legal}>
        By continuing, you agree to our terms of use.
      </Text>
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
    () => address.trim().length > 4 && callsign.trim().length > 1,
    [address, callsign]
  );

  return (
    <Card>
      <Text style={styles.subheader}>Emergency Info</Text>
      <Text style={styles.sectionTitle}>Where do you live?</Text>
      <View style={styles.sectionBody}>
        <Field
          label="Home Address"
          value={address}
          onChangeText={setAddress}
          placeholder="123 Mountain Way"
        />
        <Field
          label="Callsign"
          value={callsign}
          onChangeText={setCallsign}
          placeholder="e.g. Falcon"
        />
      </View>
      <CTA title="Continue" onPress={onNext} disabled={!canProceed} />
      <Text style={styles.legal}>Used to authenticate your profile.</Text>
    </Card>
  );
};

type SelfieScreenProps = {
  selfieTaken: boolean;
  onCapture: () => void;
  onNext: () => void;
};

const SelfieScreen: React.FC<SelfieScreenProps> = ({ selfieTaken, onCapture, onNext }) => (
  <Card style={{ paddingHorizontal: 0, paddingBottom: 0 }}>
    <View style={styles.cameraBox}>
      <FaceScanLoader />
      <View style={styles.reticleOuter}>
        <View style={styles.reticleCrossH} />
        <View style={styles.reticleCrossV} />
      </View>
      <View style={styles.cameraHint}>
        <Text style={styles.cameraHintTxt}>Align face within the circle and hold steady</Text>
      </View>
    </View>
    <View style={styles.cameraControls}>
      {!selfieTaken ? (
        <TouchableOpacity onPress={onCapture} style={styles.primaryBtn} accessibilityRole="button">
          <Text style={styles.primaryBtnTxt}>Take Selfie</Text>
        </TouchableOpacity>
      ) : (
        <CTA title="Looks good — Continue" onPress={onNext} />
      )}
      <Text style={[styles.subText, { marginTop: 8 }]}>Photo processed on-device. Identity hashing occurs locally first.</Text>
    </View>
  </Card>
);

type CreatingScreenProps = {
  ticks: number;
};

const CreatingScreen: React.FC<CreatingScreenProps> = ({ ticks: _unused }) => (
  <View style={styles.creatingFullScreen}>
    <FaceScanLoader />
  </View>
);

type LocationPromptScreenProps = {
  onGrant: (position: Location.LocationObject) => void;
  onSkip: () => void;
};

const LocationPromptScreen: React.FC<LocationPromptScreenProps> = ({ onGrant, onSkip }) => {
  const [requesting, setRequesting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGrant = async (): Promise<void> => {
    if (requesting) {
      return;
    }

    setRequesting(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== Location.PermissionStatus.GRANTED) {
        setError("Permission denied. Enable location to continue.");
        setRequesting(false);
        return;
      }

      const lastKnown = await Location.getLastKnownPositionAsync();
      const position =
        lastKnown ??
        (await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          mayShowUserSettingsDialog: true,
        }));

      if (!position) {
        setError("Unable to determine your current position.");
        setRequesting(false);
        return;
      }

      onGrant(position);
    } catch (caughtError) {
      setError("Failed to retrieve location. Please try again.");
    } finally {
      setRequesting(false);
    }
  };

  return (
    <Card>
      <View style={styles.mapBadge}>
        <Text style={styles.mapBadgeTxt}>📍</Text>
      </View>
      <Text style={styles.sectionTitle}>We need your location</Text>
      <Text style={styles.subText}>
        Used for team positioning and proximity alerts. Shared only with your authorized mission group.
      </Text>
      {error && <Text style={styles.locationError}>{error}</Text>}
      {requesting && (
        <View style={styles.locationStatusRow}>
          <ActivityIndicator color={palette.primary} />
          <Text style={styles.locationStatusTxt}>Securing coordinates…</Text>
        </View>
      )}
      <CTA title="Grant Access" onPress={handleGrant} disabled={requesting} />
      <GhostBtn title="Not now" onPress={onSkip} />
    </Card>
  );
};

type FinalReadyProps = {
  onPreviewPlugins: () => void;
  onEnterApp: () => void;
  location: Location.LocationObject | null;
};

const FinalReady: React.FC<FinalReadyProps> = ({ onPreviewPlugins, onEnterApp, location }) => (
  <Card>
    <Text style={styles.sectionTitle}>Setup complete</Text>
    <Text style={styles.subText}>You’re mission-ready.</Text>
    {location && (
      <Text style={styles.locationSummary}>
        Last known location: {location.coords.latitude.toFixed(3)}°, {location.coords.longitude.toFixed(3)}°
      </Text>
    )}
    <TouchableOpacity style={styles.primaryBtn} onPress={onPreviewPlugins} accessibilityRole="button">
      <Text style={styles.primaryBtnTxt}>Preview plugins</Text>
    </TouchableOpacity>
    <GhostBtn title="Enter app" onPress={onEnterApp} />
  </Card>
);

function goBack(step: Step, setStep: SetStep): void {
  if (step === "sign") {
    setStep("login");
  } else if (step === "address") {
    setStep("sign");
  } else if (step === "selfie") {
    setStep("address");
  } else if (step === "creating") {
    setStep("selfie");
  } else if (step === "location") {
    setStep("creating");
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 16, backgroundColor: palette.bg },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  backBtn: {
    height: 36,
    width: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "transparent",
  },
  backBtnDisabled: {
    opacity: 0,
  },
  backTxt: { color: palette.sub, fontSize: 22 },
  logoContainer: { marginLeft: 4 },
  logo: { width: 28, height: 32 },
  title: { color: palette.text, fontSize: 18, fontWeight: "700", marginTop: 2 },
  card: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  subheader: { color: palette.sub, fontSize: 14 },
  sectionTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: "600",
    marginTop: 2,
  },
  fieldContainer: { marginBottom: 14 },
  fieldLabel: {
    color: palette.sub,
    fontSize: 12,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: "#0f1117",
    color: palette.text,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  cta: {
    backgroundColor: palette.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  ctaTxt: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
  ghost: {
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  ghostTxt: { color: palette.text, fontSize: 16 },
  legal: { color: "#80858f", fontSize: 12, textAlign: "center", marginTop: 10 },
  sectionBody: { marginTop: 16 },
  subText: { color: palette.sub, fontSize: 14 },
  cameraBox: {
    backgroundColor: "#0f1117",
    height: 380,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  reticleOuter: {
    position: "absolute",
    height: 220,
    width: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: "#6aa0ff",
    alignItems: "center",
    justifyContent: "center",
  },
  reticleCrossH: {
    position: "absolute",
    top: "50%",
    left: -110,
    right: -110,
    height: 1,
    backgroundColor: "#6aa0ff40",
  },
  reticleCrossV: {
    position: "absolute",
    left: "50%",
    top: -110,
    bottom: -110,
    width: 1,
    backgroundColor: "#6aa0ff40",
  },
  cameraHint: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: "#0b0c10cc",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  cameraHintTxt: { color: palette.text, textAlign: "center", fontSize: 13 },
  cameraControls: { padding: 16 },
  creatingFullScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  faceScanContainer: {
    alignSelf: "center",
    height: 900,
    width: 440,
    marginBottom: 18,
  },
  faceScanImage: {
    height: "100%",
    width: "100%",
    resizeMode: "contain",
  },
  passwordHint: {
    color: "#ff7185",
    fontSize: 13,
    marginBottom: 8,
  },
  locationError: {
    color: "#ff7185",
    fontSize: 14,
    marginTop: 12,
  },
  locationStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  locationStatusTxt: {
    color: palette.sub,
    fontSize: 14,
    marginLeft: 8,
  },
  locationSummary: {
    color: palette.sub,
    fontSize: 14,
    marginTop: 12,
  },
  mapBadge: {
    alignSelf: "center",
    height: 56,
    width: 56,
    borderRadius: 14,
    backgroundColor: "#143056",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  mapBadgeTxt: { fontSize: 24, textAlign: "center" },
  primaryBtn: {
    backgroundColor: palette.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  primaryBtnTxt: { color: "#081120", fontWeight: "700", fontSize: 16 },
});

export default OnboardingFlow;
