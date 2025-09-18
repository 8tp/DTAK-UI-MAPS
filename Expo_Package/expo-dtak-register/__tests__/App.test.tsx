import "@testing-library/jest-native/extend-expect";
import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
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

    expect(getByText("Sign in to continue")).toBeTruthy();

    const createAccountButton = getByRole("button", { name: "Create account" });
    fireEvent.press(createAccountButton);

    expect(getByText("Securely create your account")).toBeTruthy();

    const continueButton = getByRole("button", { name: "Continue" });

    fireEvent.press(continueButton);

    expect(queryByText("Home address and callsign")).toBeNull();

    fireEvent.changeText(getByPlaceholderText("e.g. Alex Hunter"), "Alex Hunter");
    fireEvent.changeText(getByPlaceholderText("you@unit.mil"), "alex@unit.mil");
    fireEvent.changeText(
      getByPlaceholderText("••••••••"),
      "StrongPassword123!"
    );

    expect(continueButton.props.accessibilityState?.disabled).not.toBe(true);

    fireEvent.press(continueButton);

    expect(getByText("Home address and callsign")).toBeTruthy();
  });

  it("walks the user through the onboarding flow to mission-ready state", async () => {
    const { getByText, getByPlaceholderText, getByRole, getByTestId } = render(
      <App />
    );

    fireEvent.press(getByRole("button", { name: "Create account" }));

    fireEvent.changeText(getByPlaceholderText("e.g. Alex Hunter"), "Alex Hunter");
    fireEvent.changeText(getByPlaceholderText("you@unit.mil"), "alex@unit.mil");
    fireEvent.changeText(
      getByPlaceholderText("••••••••"),
      "StrongPassword123!"
    );
    fireEvent.press(getByRole("button", { name: "Continue" }));

    fireEvent.changeText(getByPlaceholderText("123 Mission Rd, City"), "500 Base Lane, Tampa");
    fireEvent.changeText(getByPlaceholderText("e.g. Ranger-2"), "Ranger-2");
    fireEvent.press(getByRole("button", { name: "Continue" }));

    const captureButton = await waitFor(() =>
      getByRole("button", { name: "Take Selfie" })
    );

    await act(async () => {
      fireEvent.press(captureButton);
    });

    const continueButton = await waitFor(() =>
      getByRole("button", { name: "Looks good — Continue" })
    );

    fireEvent.press(continueButton);

    expect(getByTestId("face-scan-loader")).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(3200);
    });

    expect(getByText("We need your location")).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByRole("button", { name: "Grant Access" }));
    });

    await waitFor(() => expect(getByText("Setup complete")).toBeTruthy());
    expect(getByText(/Last known location/)).toHaveTextContent("27.951°");
  });
});
