// App.tsx - Enhanced with Ditto Mesh Networking
import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import { MapWithMessaging } from "../ditto/components/MapWithMessaging";
import { useDitto } from "../ditto/hooks/useDitto";
import { getDittoConfig } from "../ditto/config/DittoConfig";

export default function App() {
	const { isInitialized, isInitializing, error, initialize } = useDitto();
	const [initError, setInitError] = useState<string | null>(null);

	useEffect(() => {
		const initializeDitto = async () => {
			try {
				const config = getDittoConfig();
				await initialize(config);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Failed to initialize Ditto';
				setInitError(errorMessage);
				console.error('Ditto initialization failed:', err);
			}
		};

		initializeDitto();
	}, [initialize]);

	if (isInitializing) {
		return (
			<View style={styles.loadingContainer}>
				<Text style={styles.loadingText}>🔄 Initializing Mesh Network...</Text>
			</View>
		);
	}

	if (error || initError) {
		return (
			<View style={styles.errorContainer}>
				<Text style={styles.errorText}>❌ Mesh Network Error</Text>
				<Text style={styles.errorDetails}>{error || initError}</Text>
				<Text style={styles.errorNote}>
					The app will continue to work but mesh networking features will be unavailable.
				</Text>
			</View>
		);
	}

	if (!isInitialized) {
		return (
			<View style={styles.loadingContainer}>
				<Text style={styles.loadingText}>📡 Connecting to Mesh Network...</Text>
			</View>
		);
	}

	return (
		<MapWithMessaging 
			style={styles.map}
			initialCenter={[-95.7129, 37.0902]}
			initialZoom={5}
			showPeerPanel={true}
		/>
	);
}

const styles = StyleSheet.create({
	map: { 
		flex: 1 
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#f5f5f5',
	},
	loadingText: {
		fontSize: 18,
		color: '#333',
		textAlign: 'center',
	},
	errorContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#f5f5f5',
		padding: 20,
	},
	errorText: {
		fontSize: 20,
		color: '#FF3B30',
		textAlign: 'center',
		marginBottom: 10,
	},
	errorDetails: {
		fontSize: 16,
		color: '#666',
		textAlign: 'center',
		marginBottom: 20,
	},
	errorNote: {
		fontSize: 14,
		color: '#999',
		textAlign: 'center',
		fontStyle: 'italic',
	},
});
