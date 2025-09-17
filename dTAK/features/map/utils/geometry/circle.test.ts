import { approximateCircle, metersBetween } from "./circle";

describe("approximateCircle", () => {
    it("returns a closed polygon with expected vertex count", () => {
        const center: [number, number] = [0, 0];
        const steps = 32;
        const poly = approximateCircle(center, 1000, steps);
        expect(poly.type).toBe("Polygon");
        expect(poly.coordinates[0].length).toBe(steps + 1);
        const first = poly.coordinates[0][0];
        const last = poly.coordinates[0][poly.coordinates[0].length - 1];
        expect(first[0]).toBeCloseTo(last[0], 10);
        expect(first[1]).toBeCloseTo(last[1], 10);
    });

    it("approximates radius distance from center", () => {
        const center: [number, number] = [-73.9857, 40.7484];
        const radius = 500;
        const poly = approximateCircle(center, radius, 16);
        const pt = poly.coordinates[0][0];
        const d = metersBetween(center, pt as [number, number]);
        expect(d).toBeGreaterThan(400);
        expect(d).toBeLessThan(600);
    });
});


