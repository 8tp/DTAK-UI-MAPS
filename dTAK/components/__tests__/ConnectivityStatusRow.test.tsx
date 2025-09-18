import React from "react";
import { render } from "@testing-library/react-native";
import ConnectivityStatusRow from "../ConnectivityStatusRow";
import { useConnectivity } from "../../features/connectivity";
import type { ConnectivityStatus } from "../../features/connectivity";

jest.mock("../../features/connectivity", () => ({
	useConnectivity: jest.fn(),
}));

type ConnectivityFixture = {
	status: ConnectivityStatus;
	testId: string;
	expectedLabel: string;
};

const mockedUseConnectivity = useConnectivity as jest.MockedFunction<typeof useConnectivity>;

const fixtures: ConnectivityFixture[] = [
	{
		status: "internet",
		testId: "connectivity-indicator-internet",
		expectedLabel: "Internet Connected",
	},
	{
		status: "mesh",
		testId: "connectivity-indicator-mesh",
		expectedLabel: "Mesh Connected",
	},
	{
		status: "offline",
		testId: "connectivity-indicator-offline",
		expectedLabel: "Offline",
	},
];

describe("ConnectivityStatusRow", () => {
	afterEach(() => {
		mockedUseConnectivity.mockReset();
	});

	test.each(fixtures)("renders %s indicator", ({ status, testId, expectedLabel }) => {
		mockedUseConnectivity.mockReturnValue({
			status,
			internetReachable: status === "internet",
			meshConnected: status !== "offline",
		});

		const { getByTestId, getByText } = render(<ConnectivityStatusRow />);

		expect(getByTestId(testId)).toBeTruthy();
		expect(getByText(expectedLabel)).toBeTruthy();
	});
});
