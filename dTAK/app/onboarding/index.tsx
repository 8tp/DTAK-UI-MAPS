import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import OnboardingFlow from "../../features/onboarding/OnboardingFlow";
import { markOnboardingComplete } from "../../features/onboarding/storage";

export default function OnboardingScreen() {
  const router = useRouter();

  const handleEnterApp = useCallback(() => {
    markOnboardingComplete()
      .catch((error) => {
        console.warn("Failed to persist onboarding completion", error);
      })
      .finally(() => {
        router.replace("/" as never);
      });
  }, [router]);

  return <OnboardingFlow onEnterApp={handleEnterApp} />;
}
