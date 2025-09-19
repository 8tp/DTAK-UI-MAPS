import type { LonLat } from "./geodesy";
import { destinationPoint } from "./geodesy";

/**
 * Builds a 6x6 axis-aligned grid as a MultiLineString within a square whose size is
 * controlled by the half-diagonal distance from the center. The grid consists of 7 vertical
 * and 7 horizontal line segments (6x6 cells).
 */
export function approximateGrid(
  center: LonLat,
  halfDiagonalMeters: number,
  cellsPerSide: number = 6
): GeoJSON.MultiLineString {
  const safeHalfDiag = Math.max(0, halfDiagonalMeters);
  // Convert half-diagonal to half-side for an axis-aligned square
  const halfSide = safeHalfDiag / Math.SQRT2;
  const side = halfSide * 2;
  const step = cellsPerSide > 0 ? side / cellsPerSide : side;

  const lines: LonLat[][] = [];

  // Vertical lines: i from 0..cellsPerSide -> 7 lines for 6 cells
  for (let i = 0; i <= cellsPerSide; i++) {
    const offset = -halfSide + i * step;
    const lineCenter = shiftEastWest(center, offset);
    const top = destinationPoint(lineCenter, halfSide, 0);
    const bottom = destinationPoint(lineCenter, halfSide, 180);
    lines.push([top, bottom]);
  }

  // Horizontal lines: i from 0..cellsPerSide
  for (let i = 0; i <= cellsPerSide; i++) {
    const offset = -halfSide + i * step;
    const lineCenter = shiftNorthSouth(center, offset);
    const left = destinationPoint(lineCenter, halfSide, 270);
    const right = destinationPoint(lineCenter, halfSide, 90);
    lines.push([left, right]);
  }

  return {
    type: "MultiLineString",
    coordinates: lines as unknown as number[][][],
  };
}

// Helper to shift center east/west by dx meters (positive east, negative west)
function shiftEastWest(pt: LonLat, dx: number): LonLat {
  if (dx === 0) return pt;
  const bearing = dx > 0 ? 90 : 270;
  return destinationPoint(pt, Math.abs(dx), bearing);
}

// Helper to shift center north/south by dy meters (positive north, negative south)
function shiftNorthSouth(pt: LonLat, dy: number): LonLat {
  if (dy === 0) return pt;
  const bearing = dy > 0 ? 0 : 180;
  return destinationPoint(pt, Math.abs(dy), bearing);
}
