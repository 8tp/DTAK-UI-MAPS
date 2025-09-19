import * as FileSystem from "expo-file-system";

const baseDirectory = FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? null;

const STATE_DIRECTORY = baseDirectory ? `${baseDirectory}app-state` : null;
const ONBOARDING_FLAG_PATH = STATE_DIRECTORY ? `${STATE_DIRECTORY}/onboarding.json` : null;

let memoryFlag = false;

async function ensureStateDirectoryExists(): Promise<void> {
	if (!STATE_DIRECTORY) {
		return;
	}
	const info = await FileSystem.getInfoAsync(STATE_DIRECTORY);
	if (!info.exists) {
		await FileSystem.makeDirectoryAsync(STATE_DIRECTORY, { intermediates: true });
	}
}

export async function isOnboardingComplete(): Promise<boolean> {
	if (!ONBOARDING_FLAG_PATH) {
		return memoryFlag;
	}
	try {
		const info = await FileSystem.getInfoAsync(ONBOARDING_FLAG_PATH);
		return info.exists;
	} catch {
		return false;
	}
}

export async function markOnboardingComplete(): Promise<void> {
	if (!ONBOARDING_FLAG_PATH) {
		memoryFlag = true;
		return;
	}
	await ensureStateDirectoryExists();
	const payload = JSON.stringify({ completedAt: Date.now() });
	await FileSystem.writeAsStringAsync(ONBOARDING_FLAG_PATH, payload, {
		encoding: FileSystem.EncodingType.UTF8,
	});
}

export async function resetOnboardingFlag(): Promise<void> {
	if (!ONBOARDING_FLAG_PATH) {
		memoryFlag = false;
		return;
	}
	try {
		const info = await FileSystem.getInfoAsync(ONBOARDING_FLAG_PATH);
		if (info.exists) {
			await FileSystem.deleteAsync(ONBOARDING_FLAG_PATH, { idempotent: true });
		}
	} catch {
		// ignore persistence reset errors for environments without file write access
	}
}
