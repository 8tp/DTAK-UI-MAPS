jest.mock("react-native/Libraries/Animated/NativeAnimatedHelper");
import React from "react";
import { Text } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import AccountMenu from "../AccountMenu";

jest.mock("../ConnectivityStatusRow", () => () => <Text testID="mock-connectivity-row">Connectivity</Text>);

describe("AccountMenu", () => {
	it("renders connectivity status row when visible", () => {
		const { queryByTestId } = render(<AccountMenu visible onClose={jest.fn()} />);
		expect(queryByTestId("mock-connectivity-row")).toBeTruthy();
	});

	it("invokes onClose when tapping close icon", () => {
		const onClose = jest.fn();
		const { getByTestId } = render(<AccountMenu visible onClose={onClose} />);
		fireEvent.press(getByTestId("account-menu-close"));
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("invokes onClose when tapping backdrop", () => {
		const onClose = jest.fn();
		const { getByTestId } = render(<AccountMenu visible onClose={onClose} />);
		fireEvent.press(getByTestId("account-menu-backdrop"));
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
