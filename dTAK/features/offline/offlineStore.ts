import * as FileSystem from "expo-file-system";

export type OfflinePackStatus = "idle" | "downloading" | "paused" | "completed" | "error";

export type OfflinePack = {
	id: string;
	mapId: string;
	bbox: [number, number, number, number];
	zoomMin: number;
	zoomMax: number;
	totalTiles: number;
	downloadedTiles: number;
	bytes: number;
	status: OfflinePackStatus;
	createdAt: number;
	updatedAt: number;
	errorMessage?: string;
};

export type OfflineManifest = {
	packs: OfflinePack[];
};

const DOC_DIR: string = ((FileSystem as any).documentDirectory ??
	(FileSystem as any).cacheDirectory ??
	"file:///data/user/0/app/files/") as string;
const manifestPath = `${DOC_DIR}offline/manifest.json`;

async function ensureManifestDir() {
	const dir = `${DOC_DIR}offline`;
	const info = await FileSystem.getInfoAsync(dir);
	if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
}

export async function loadManifest(): Promise<OfflineManifest> {
	await ensureManifestDir();
	const info = await FileSystem.getInfoAsync(manifestPath);
	if (!info.exists) return { packs: [] };
	try {
		const content = await FileSystem.readAsStringAsync(manifestPath);
		return JSON.parse(content) as OfflineManifest;
	} catch {
		return { packs: [] };
	}
}

export async function saveManifest(m: OfflineManifest) {
	await ensureManifestDir();
	await FileSystem.writeAsStringAsync(manifestPath, JSON.stringify(m));
}

export async function upsertPack(pack: OfflinePack) {
	const m = await loadManifest();
	const idx = m.packs.findIndex((p) => p.id === pack.id);
	if (idx >= 0) m.packs[idx] = pack;
	else m.packs.push(pack);
	await saveManifest(m);
	return pack;
}

export async function getPack(packId: string) {
	const m = await loadManifest();
	return m.packs.find((p) => p.id === packId);
}

export async function listPacksForMap(mapId: string) {
	const m = await loadManifest();
	return m.packs.filter((p) => p.mapId === mapId);
}

export async function deletePack(packId: string) {
	const m = await loadManifest();
	const pack = m.packs.find((p) => p.id === packId);
	m.packs = m.packs.filter((p) => p.id !== packId);
	await saveManifest(m);
	return pack;
}
