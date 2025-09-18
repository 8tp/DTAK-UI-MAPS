import { useEffect, useState } from "react";

type MeshListener = (isConnected: boolean) => void;

let meshConnected = false;
const listeners = new Set<MeshListener>();

const notify = () => {
	for (const listener of listeners) {
		listener(meshConnected);
	}
};

export function setMeshConnectivity(isConnected: boolean) {
	if (meshConnected === isConnected) {
		return;
	}
	meshConnected = isConnected;
	notify();
}

export function getMeshConnectivity() {
	return meshConnected;
}

export function subscribeToMeshConnectivity(listener: MeshListener) {
	listeners.add(listener);
	listener(meshConnected);
	return () => {
		listeners.delete(listener);
	};
}

export function useMeshConnectivity() {
	const [isConnected, setIsConnected] = useState(meshConnected);

	useEffect(() => {
		return subscribeToMeshConnectivity(setIsConnected);
	}, []);

	return isConnected;
}

// Allow native modules to bridge their own connectivity providers when present.
type MeshConnectivityBridge = {
	subscribe?: (listener: MeshListener) => () => void;
	getState?: () => boolean;
	setState?: (value: boolean) => void;
};

const globalScope = typeof globalThis !== "undefined" ? (globalThis as typeof globalThis & {
	__dTAKMeshConnectivity?: MeshConnectivityBridge;
}) : undefined;

if (globalScope) {
	const bridge = globalScope.__dTAKMeshConnectivity;
	if (bridge) {
		if (typeof bridge.getState === "function") {
			setMeshConnectivity(bridge.getState());
		}
		if (typeof bridge.subscribe === "function") {
			bridge.subscribe(setMeshConnectivity);
		}
		if (typeof bridge.setState !== "function") {
			bridge.setState = setMeshConnectivity;
		}
	} else {
		globalScope.__dTAKMeshConnectivity = {
			getState: getMeshConnectivity,
			subscribe: subscribeToMeshConnectivity,
			setState: setMeshConnectivity,
		};
	}
}
