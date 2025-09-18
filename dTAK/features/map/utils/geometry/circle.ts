export type LonLat = [number, number];
import { destinationPoint, metersBetween } from "./geodesy";

/**
 * Approximate a circle as a polygon with `steps` vertices.
 * Returns a GeoJSON Polygon geometry with a closed linear ring.
 */
export function approximateCircle(center: LonLat, radiusMeters: number, steps = 32): GeoJSON.Polygon {
    const coordinates: LonLat[] = [];
    const step = 360 / steps;
    for (let b = 0; b < 360; b += step) {
        coordinates.push(destinationPoint(center, radiusMeters, b));
    }
    // close ring
    if (coordinates.length > 0) {
        coordinates.push(coordinates[0]);
    }
    return {
        type: "Polygon",
        coordinates: [coordinates],
    };
}

export { metersBetween };


