export const addNetworkStateChangeListener = (listener: (state: any) => void) => {
	return {
		remove: () => {
			// noop in mock
		},
	};
};

export const getNetworkStateAsync = async () => ({
	isConnected: false,
	isInternetReachable: false,
});
