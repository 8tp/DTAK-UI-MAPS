import NetInfo from "@react-native-community/netinfo";
import * as FileSystem from "expo-file-system";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	OfflinePack,
	OfflinePackStatus,
	loadManifest,
	deletePack as storeDeletePack,
	upsertPack,
} from "./offlineStore";
import { BBox, countTiles, ensureDir, mapTilesDir, pathForTile, tileRangeForBBox } from "./tiles";

function generateId() {
	return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export type StartDownloadInput = {
	mapId: string;
	bbox: BBox;
	zoomMin: number;
	zoomMax: number;
	tileTemplate: string; // e.g. https://.../{z}/{x}/{y}.jpg
	tileExt?: "jpg" | "png";
	concurrency?: number;
};

export type DownloadProgress = {
	packId: string;
	downloadedTiles: number;
	totalTiles: number;
	bytes: number;
	status: OfflinePackStatus;
};

export function useOfflineMaps() {
	const [packs, setPacks] = useState<OfflinePack[]>([]);
	const [isOnline, setIsOnline] = useState<boolean>(true);

	useEffect(() => {
		let sub = NetInfo.addEventListener((state) => setIsOnline(Boolean(state.isConnected)));
		return () => sub && sub();
	}, []);

	useEffect(() => {
		loadManifest().then((m) => setPacks(m.packs));
	}, []);

	const reload = useCallback(async () => {
		const m = await loadManifest();
		setPacks(m.packs);
	}, []);

	const startDownload = useCallback(
		async (input: StartDownloadInput, onProgress?: (p: DownloadProgress) => void) => {
			const tileExt = input.tileExt ?? (input.tileTemplate.includes(".png") ? "png" : "jpg");
			const packId = generateId();
			const totalTiles = countTiles(input.bbox, input.zoomMin, input.zoomMax);
			const now = Date.now();
			let pack: OfflinePack = {
				id: packId,
				mapId: input.mapId,
				bbox: input.bbox,
				zoomMin: input.zoomMin,
				zoomMax: input.zoomMax,
				totalTiles,
				downloadedTiles: 0,
				bytes: 0,
				status: "downloading",
				createdAt: now,
				updatedAt: now,
			};
			await upsertPack(pack);
			reload();

			const concurrency = input.concurrency ?? 6;
			const queue: { z: number; x: number; y: number; url: string; local: string }[] = [];
			for (let z = input.zoomMin; z <= input.zoomMax; z++) {
				const r = tileRangeForBBox(input.bbox, z);
				for (let x = r.xMin; x <= r.xMax; x++) {
					for (let y = r.yMin; y <= r.yMax; y++) {
						const url = input.tileTemplate
							.replace("{z}", String(z))
							.replace("{x}", String(x))
							.replace("{y}", String(y));
						const local = pathForTile(input.mapId, z, x, y, tileExt);
						queue.push({ z, x, y, url, local });
					}
				}
			}

			await ensureDir(mapTilesDir(input.mapId));

			let active = 0;
			let index = 0;
			let stopped = false;
			const next = async (): Promise<void> => {
				if (stopped) return;
				if (index >= queue.length) return;
				if (active >= concurrency) return;
				const job = queue[index++];
				active++;
				try {
					await ensureDir(job.local.substring(0, job.local.lastIndexOf("/")));
					// Skip if exists
					const info = await FileSystem.getInfoAsync(job.local);
					if (!info.exists) {
						const res = await FileSystem.downloadAsync(job.url, job.local);
						pack.bytes +=
							res.headers &&
							(res.headers["content-length"]
								? Number(res.headers["content-length"])
								: 0);
					}
					pack.downloadedTiles += 1;
					pack.updatedAt = Date.now();
					onProgress?.({
						packId,
						downloadedTiles: pack.downloadedTiles,
						totalTiles: pack.totalTiles,
						bytes: pack.bytes,
						status: pack.status,
					});
					await upsertPack(pack);
				} catch (e: any) {
					pack.status = "error";
					pack.updatedAt = Date.now();
					pack.errorMessage = String(e?.message ?? e);
					await upsertPack(pack);
					reload();
					active--;
					return;
				}
				active--;
				if (pack.downloadedTiles >= pack.totalTiles) {
					pack.status = "completed";
					pack.updatedAt = Date.now();
					await upsertPack(pack);
					reload();
					return;
				}
				next();
				next(); // try to fill pipeline quickly
			};

			for (let i = 0; i < concurrency; i++) next();

			return {
				packId,
				pause: async () => {
					stopped = true;
					pack.status = "paused";
					pack.updatedAt = Date.now();
					await upsertPack(pack);
					reload();
				},
				resume: async () => {
					if (pack.status !== "paused") return;
					stopped = false;
					pack.status = "downloading";
					pack.updatedAt = Date.now();
					await upsertPack(pack);
					reload();
					for (let i = 0; i < concurrency; i++) next();
				},
				cancel: async () => {
					stopped = true;
					await storeDeletePack(packId);
					reload();
				},
			};
		},
		[reload]
	);

	const getLocalTemplate = useCallback(
		(mapId: string, ext: "jpg" | "png" = "jpg") =>
			`file://${mapTilesDir(mapId)}/{z}/{x}/{y}.${ext}`,
		[]
	);

	const api = useMemo(
		() => ({ packs, isOnline, reload, startDownload, getLocalTemplate }),
		[packs, isOnline, reload, startDownload, getLocalTemplate]
	);
	return api;
}
