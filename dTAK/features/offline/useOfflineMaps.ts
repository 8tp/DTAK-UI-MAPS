import NetInfo from "@react-native-community/netinfo";
import * as FileSystem from "expo-file-system/legacy";
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
		const sub = NetInfo.addEventListener((state) => {
			const reachable =
				state.isInternetReachable == null ? state.isConnected : state.isInternetReachable;
			setIsOnline(Boolean(reachable));
		});
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
					// Update in-memory state so UI reflects progress without waiting for reload()
					setPacks((prev) => {
						const next = [...prev];
						const i = next.findIndex((p) => p.id === pack.id);
						if (i >= 0) next[i] = { ...pack };
						else next.push({ ...pack });
						return next;
					});
				} catch (e: any) {
					pack.status = "error";
					pack.updatedAt = Date.now();
					pack.errorMessage = String(e?.message ?? e);
					await upsertPack(pack);
					setPacks((prev) => {
						const next = [...prev];
						const i = next.findIndex((p) => p.id === pack.id);
						if (i >= 0) next[i] = { ...pack };
						else next.push({ ...pack });
						return next;
					});
					reload();
					active--;
					return;
				}
				active--;
				if (pack.downloadedTiles >= pack.totalTiles) {
					pack.status = "completed";
					pack.updatedAt = Date.now();
					await upsertPack(pack);
					setPacks((prev) => {
						const next = [...prev];
						const i = next.findIndex((p) => p.id === pack.id);
						if (i >= 0) next[i] = { ...pack };
						else next.push({ ...pack });
						return next;
					});
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
		(mapId: string, ext: "jpg" | "png" = "jpg") => `${mapTilesDir(mapId)}/{z}/{x}/{y}.${ext}`,
		[]
	);

	// Helpers: aggregate progress and coverage
	const listPacksForMap = useCallback(
		(mapId: string) => packs.filter((p) => p.mapId === mapId),
		[packs]
	);

	const getAggregateForMap = useCallback(
		(mapId: string) => {
			const items = listPacksForMap(mapId);
			const total = items.reduce((a, p) => a + p.totalTiles, 0);
			const downloaded = items.reduce((a, p) => a + p.downloadedTiles, 0);
			const hasCompleted = items.some((p) => p.status === "completed");
			const percent = total > 0 ? Math.min(100, Math.floor((downloaded / total) * 100)) : 0;
			return { total, downloaded, percent, hasCompleted } as const;
		},
		[listPacksForMap]
	);

	function intersectBBox(a: BBox, b: BBox): BBox | null {
		const west = Math.max(a[0], b[0]);
		const south = Math.max(a[1], b[1]);
		const east = Math.min(a[2], b[2]);
		const north = Math.min(a[3], b[3]);
		if (west >= east || south >= north) return null;
		return [west, south, east, north];
	}

	const getCoverage = useCallback(
		(mapId: string, bbox: BBox, zoomMin: number, zoomMax: number) => {
			const items = listPacksForMap(mapId).filter((p) => p.status === "completed");
			const totalTiles = countTiles(bbox, zoomMin, zoomMax);
			let covered = 0;
			for (const pack of items) {
				const overlap = intersectBBox(bbox, pack.bbox as BBox);
				if (!overlap) continue;
				const zMin = Math.max(zoomMin, pack.zoomMin);
				const zMax = Math.min(zoomMax, pack.zoomMax);
				if (zMin > zMax) continue;
				covered += countTiles(overlap, zMin, zMax);
			}
			// Clamp to total to roughly avoid double counting overlaps
			covered = Math.min(covered, totalTiles);
			const percent = totalTiles > 0 ? Math.floor((covered / totalTiles) * 100) : 0;
			return { totalTiles, coveredTiles: covered, percent } as const;
		},
		[listPacksForMap]
	);

	const deletePack = useCallback(
		async (packId: string) => {
			await storeDeletePack(packId);
			await reload();
		},
		[reload]
	);

	const deleteAllForMap = useCallback(
		async (mapId: string) => {
			// Remove tiles directory for the map (fast) and clear manifest entries
			try {
				await FileSystem.deleteAsync(mapTilesDir(mapId), { idempotent: true });
			} catch {}
			const m = await loadManifest();
			m.packs = m.packs.filter((p) => p.mapId !== mapId);
			await FileSystem.writeAsStringAsync(
				`${
					(FileSystem as any).documentDirectory ??
					(FileSystem as any).cacheDirectory ??
					"file:///data/user/0/app/files/"
				}offline/manifest.json`,
				JSON.stringify(m)
			);
			await reload();
		},
		[reload]
	);

	const api = useMemo(
		() => ({
			packs,
			isOnline,
			reload,
			startDownload,
			getLocalTemplate,
			listPacksForMap,
			getAggregateForMap,
			getCoverage,
			deletePack,
			deleteAllForMap,
		}),
		[
			packs,
			isOnline,
			reload,
			startDownload,
			getLocalTemplate,
			listPacksForMap,
			getAggregateForMap,
			getCoverage,
			deletePack,
			deleteAllForMap,
		]
	);
	return api;
}
