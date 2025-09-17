import React from "react";
import { act, fireEvent, render } from "@testing-library/react-native";
import App from "../App";

describe("App onboarding flow", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("shows mission-ready copy and gates progression on valid sign-up input", () => {
    const { getByText, getByPlaceholderText, queryByText, getByRole } = render(<App />);

    expect(getByText("Securely create your account")).toBeTruthy();

    const continueButton = getByRole("button", { name: "Continue" });

    fireEvent.press(continueButton);

    expect(queryByText("Home address and callsign")).toBeNull();

    fireEvent.changeText(getByPlaceholderText("e.g. Alex Hunter"), "Alex Hunter");
    fireEvent.changeText(getByPlaceholderText("you@unit.mil"), "alex@unit.mil");
    fireEvent.changeText(getByPlaceholderText("••••••••"), "password123");

    expect(continueButton.props.accessibilityState?.disabled).not.toBe(true);

    fireEvent.press(continueButton);

    expect(getByText("Home address and callsign")).toBeTruthy();
  });

  it("walks the user through the onboarding flow to mission-ready state", () => {
    const { getByText, getByPlaceholderText, getByRole } = render(<App />);

    fireEvent.changeText(getByPlaceholderText("e.g. Alex Hunter"), "Alex Hunter");
    fireEvent.changeText(getByPlaceholderText("you@unit.mil"), "alex@unit.mil");
    fireEvent.changeText(getByPlaceholderText("••••••••"), "password123");
    fireEvent.press(getByRole("button", { name: "Continue" }));

    fireEvent.changeText(getByPlaceholderText("123 Mission Rd, City"), "500 Base Lane, Tampa");
    fireEvent.changeText(getByPlaceholderText("e.g. Ranger-2"), "Ranger-2");
    fireEvent.press(getByRole("button", { name: "Continue" }));

    fireEvent.press(getByRole("button", { name: "Take Selfie" }));
    fireEvent.press(getByRole("button", { name: "Looks good — Continue" }));

    expect(getByText("Creating your account…")).toBeTruthy();
    expect(getByText("Initializing secure container")).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(3200);
    });

    expect(getByText("We need your location")).toBeTruthy();

    fireEvent.press(getByRole("button", { name: "Grant Access" }));

    expect(getByText("Setup complete")).toBeTruthy();
  });
});
