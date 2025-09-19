import * as FileSystem from "expo-file-system/legacy";

export type BBox = [number, number, number, number]; // [west, south, east, north]

export function lonLatToTileXY(lon: number, lat: number, zoom: number): { x: number; y: number } {
	const latRad = (lat * Math.PI) / 180;
	const n = 2 ** zoom;
	const x = Math.floor(((lon + 180) / 360) * n);
	const y = Math.floor(
		((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
	);
	return { x, y };
}

export function tileRangeForBBox(bbox: BBox, zoom: number) {
	const [west, south, east, north] = bbox;
	const tl = lonLatToTileXY(west, north, zoom);
	const br = lonLatToTileXY(east, south, zoom);
	return {
		xMin: Math.min(tl.x, br.x),
		xMax: Math.max(tl.x, br.x),
		yMin: Math.min(tl.y, br.y),
		yMax: Math.max(tl.y, br.y),
	};
}

export function countTiles(bbox: BBox, zoomMin: number, zoomMax: number) {
	let total = 0;
	for (let z = zoomMin; z <= zoomMax; z++) {
		const r = tileRangeForBBox(bbox, z);
		total += (r.xMax - r.xMin + 1) * (r.yMax - r.yMin + 1);
	}
	return total;
}

export function estimateSizeMB(tileCount: number, avgTileKB = 25) {
	return (tileCount * avgTileKB) / 1024;
}

const DOC_DIR: string = ((FileSystem as any).documentDirectory ??
	(FileSystem as any).cacheDirectory ??
	"file:///data/user/0/app/files/") as string;

export function tilesRootDir() {
	return `${DOC_DIR}tiles`;
}

export function mapTilesDir(mapId: string) {
	return `${tilesRootDir()}/${mapId}`;
}

export function pathForTile(
	mapId: string,
	z: number,
	x: number,
	y: number,
	ext: "jpg" | "png" = "jpg"
) {
	return `${mapTilesDir(mapId)}/${z}/${x}/${y}.${ext}`;
}

export async function ensureDir(uri: string) {
	const info = await FileSystem.getInfoAsync(uri);
	if (!info.exists) {
		await FileSystem.makeDirectoryAsync(uri, { intermediates: true });
	}
}

export async function fileExists(uri: string) {
	const info = await FileSystem.getInfoAsync(uri);
	return info.exists;
}

export function localTemplateForMap(mapId: string, ext: "jpg" | "png" = "jpg") {
	// MapLibre will substitute {z}/{x}/{y}
	return `${mapTilesDir(mapId)}/{z}/{x}/{y}.${ext}`;
}
