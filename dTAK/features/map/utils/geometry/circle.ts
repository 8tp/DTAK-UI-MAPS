export type LonLat = [number, number];

const EARTH_RADIUS_M = 6371000;

function toRadians(deg: number): number {
    return (deg * Math.PI) / 180;
}

function toDegrees(rad: number): number {
    return (rad * 180) / Math.PI;
}

/**
 * Compute destination point given start (lon,lat), bearing, and distance on a sphere.
 */
function destinationPoint(start: LonLat, distanceMeters: number, bearingDegrees: number): LonLat {
    const [lon, lat] = start;
    const δ = distanceMeters / EARTH_RADIUS_M; // angular distance in radians
    const θ = toRadians(bearingDegrees);
    const φ1 = toRadians(lat);
    const λ1 = toRadians(lon);

    const sinφ1 = Math.sin(φ1);
    const cosφ1 = Math.cos(φ1);
    const sinδ = Math.sin(δ);
    const cosδ = Math.cos(δ);

    const sinφ2 = sinφ1 * cosδ + cosφ1 * sinδ * Math.cos(θ);
    const φ2 = Math.asin(sinφ2);
    const y = Math.sin(θ) * sinδ * cosφ1;
    const x = cosδ - sinφ1 * sinφ2;
    const λ2 = λ1 + Math.atan2(y, x);

    const lat2 = toDegrees(φ2);
    let lon2 = toDegrees(λ2);
    // normalize lon to [-180, 180]
    lon2 = ((lon2 + 540) % 360) - 180;
    return [lon2, lat2];
}

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

export function metersBetween(a: LonLat, b: LonLat): number {
    // Haversine distance
    const [lon1, lat1] = a;
    const [lon2, lat2] = b;
    const φ1 = toRadians(lat1);
    const φ2 = toRadians(lat2);
    const Δφ = toRadians(lat2 - lat1);
    const Δλ = toRadians(lon2 - lon1);

    const sinΔφ2 = Math.sin(Δφ / 2);
    const sinΔλ2 = Math.sin(Δλ / 2);
    const h = sinΔφ2 * sinΔφ2 + Math.cos(φ1) * Math.cos(φ2) * sinΔλ2 * sinΔλ2;
    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    return EARTH_RADIUS_M * c;
}


