import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import App from '../App';

describe('App onboarding flow', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('shows mission-ready copy and gates progression on valid sign-up input', () => {
    const { getByText, getByPlaceholderText, queryByText } = render(<App />);

    expect(getByText('Securely create your account')).toBeTruthy();

    const continueButton = getByText('Continue').parent;

    fireEvent.press(continueButton);

    expect(queryByText('Home address and callsign')).toBeNull();

    fireEvent.changeText(getByPlaceholderText('e.g. Alex Hunter'), 'Alex Hunter');
    fireEvent.changeText(getByPlaceholderText('you@unit.mil'), 'alex@unit.mil');
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'password123');

    expect(continueButton.props.accessibilityState?.disabled).not.toBe(true);

    fireEvent.press(continueButton);

    expect(getByText('Home address and callsign')).toBeTruthy();
  });

  it('walks the user through the onboarding flow to mission-ready state', () => {
    const { getByText, getByPlaceholderText } = render(<App />);

    fireEvent.changeText(getByPlaceholderText('e.g. Alex Hunter'), 'Alex Hunter');
    fireEvent.changeText(getByPlaceholderText('you@unit.mil'), 'alex@unit.mil');
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'password123');
    fireEvent.press(getByText('Continue').parent);

    fireEvent.changeText(getByPlaceholderText('123 Mission Rd, City'), '500 Base Lane, Tampa');
    fireEvent.changeText(getByPlaceholderText('e.g. Ranger-2'), 'Ranger-2');
    fireEvent.press(getByText('Continue').parent);

    fireEvent.press(getByText('Take Selfie').parent);
    fireEvent.press(getByText('Looks good — Continue').parent);

    expect(getByText('Creating your account…')).toBeTruthy();
    expect(getByText('Initializing secure container')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(3200);
    });

    expect(getByText('We need your location')).toBeTruthy();

    fireEvent.press(getByText('Grant Access').parent);

    expect(getByText('Setup complete')).toBeTruthy();
  });
});
