import { approximateSquare } from "./square";
import { metersBetween } from "./geodesy";

describe("approximateSquare", () => {
    it("returns a closed polygon with 5 coordinates", () => {
        const center: [number, number] = [0, 0];
        const poly = approximateSquare(center, 1000);
        expect(poly.type).toBe("Polygon");
        expect(poly.coordinates[0].length).toBe(5);
        const first = poly.coordinates[0][0];
        const last = poly.coordinates[0][poly.coordinates[0].length - 1];
        expect(first[0]).toBeCloseTo(last[0], 10);
        expect(first[1]).toBeCloseTo(last[1], 10);
    });

    it("corners are at approximately halfDiagonal distance", () => {
        const center: [number, number] = [-73.9857, 40.7484];
        const half = 500;
        const poly = approximateSquare(center, half);
        const corners = poly.coordinates[0].slice(0, 4) as [number, number][];
        for (const c of corners) {
            const d = metersBetween(center, c);
            expect(d).toBeGreaterThan(400);
            expect(d).toBeLessThan(600);
        }
    });
});


