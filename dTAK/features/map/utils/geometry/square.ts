import type { LonLat } from "./geodesy";
import { destinationPoint } from "./geodesy";

/**
 * Approximate an axis-aligned square centered at `center` by using bearings
 * at 45° offsets to compute the four corners given the half-diagonal distance.
 * Returns a GeoJSON Polygon geometry with a closed linear ring.
 */
export function approximateSquare(center: LonLat, halfDiagonalMeters: number): GeoJSON.Polygon {
    const bearings = [45, 135, 225, 315];
    const corners: LonLat[] = bearings.map(b => destinationPoint(center, Math.max(0, halfDiagonalMeters), b));
    // Order as NE (45), NW (135), SW (225), SE (315) to form a ring
    const ring: LonLat[] = [corners[0], corners[1], corners[2], corners[3], corners[0]];
    return {
        type: "Polygon",
        coordinates: [ring],
    };
}

/** Ray casting algorithm for point-in-polygon on a single ring polygon. */
export function pointInPolygon(point: LonLat, polygon: GeoJSON.Polygon): boolean {
    const ring = polygon.coordinates[0] as LonLat[];
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0], yi = ring[i][1];
        const xj = ring[j][0], yj = ring[j][1];
        const intersect = ((yi > point[1]) !== (yj > point[1])) &&
            (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi + 0.0) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}


