import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as Network from "expo-network";
import { getMeshConnectivity, subscribeToMeshConnectivity } from "./meshConnectivity";

type ConnectivityStatus = "internet" | "mesh" | "offline";

type ConnectivityContextValue = {
	status: ConnectivityStatus;
	internetReachable: boolean;
	meshConnected: boolean;
};

const ConnectivityContext = createContext<ConnectivityContextValue | undefined>(undefined);

const defaultValue: ConnectivityContextValue = {
	status: "offline",
	internetReachable: false,
	meshConnected: getMeshConnectivity(),
};

function resolveStatus(internetReachable: boolean, meshConnected: boolean): ConnectivityStatus {
	if (internetReachable) {
		return "internet";
	}
	if (meshConnected) {
		return "mesh";
	}
	return "offline";
}

type Props = {
	children: React.ReactNode;
};

export function ConnectivityProvider({ children }: Props) {
	const [internetReachable, setInternetReachable] = useState(false);
	const [meshConnected, setMeshConnected] = useState(getMeshConnectivity());

	useEffect(() => {
		let mounted = true;

		const handleState = (state: Network.NetworkState) => {
			const reachable = Boolean(state.isInternetReachable ?? state.isConnected);
			if (mounted) {
				setInternetReachable(reachable);
			}
		};

		Network.getNetworkStateAsync()
			.then(handleState)
			.catch(() => {
				if (mounted) {
					setInternetReachable(false);
				}
			});

		let subscription: Network.NetworkStateSubscription | undefined;
		if (typeof Network.addNetworkStateChangeListener === "function") {
			subscription = Network.addNetworkStateChangeListener(handleState);
		}

		const meshUnsubscribe = subscribeToMeshConnectivity((connected) => {
			if (mounted) {
				setMeshConnected(connected);
			}
		});

		return () => {
			mounted = false;
			subscription?.remove?.();
			meshUnsubscribe();
		};
	}, []);

	const value = useMemo<ConnectivityContextValue>(() => {
		return {
			status: resolveStatus(internetReachable, meshConnected),
			internetReachable,
			meshConnected,
		};
	}, [internetReachable, meshConnected]);

	return <ConnectivityContext.Provider value={value}>{children}</ConnectivityContext.Provider>;
}

export function useConnectivity() {
	const context = useContext(ConnectivityContext);
	if (!context) {
		return defaultValue;
	}
	return context;
}

export type { ConnectivityStatus };
