import test from "node:test";
import assert from "node:assert/strict";

import { denormalizePoint, normalizePoint, distanceBetween } from "../src/features/camera/annotationUtils";

const canvas = { width: 400, height: 200 };

test("normalizePoint converts coordinates into unit space", () => {
  const normalized = normalizePoint({ x: 100, y: 50 }, canvas);
  assert.equal(normalized.x, 0.25);
  assert.equal(normalized.y, 0.25);
});

test("normalizePoint clamps negative or overflow coordinates", () => {
  const min = normalizePoint({ x: -10, y: -20 }, canvas);
  assert.equal(min.x, 0);
  assert.equal(min.y, 0);

  const max = normalizePoint({ x: 500, y: 600 }, canvas);
  assert.equal(max.x, 1);
  assert.equal(max.y, 1);
});

test("denormalizePoint converts unit space back into pixels", () => {
  const point = denormalizePoint({ x: 0.25, y: 0.5 }, canvas);
  assert.equal(point.x, 100);
  assert.equal(point.y, 100);
});

test("distanceBetween returns Euclidean distance in unit coordinates", () => {
  const origin = { x: 0, y: 0 } as const;
  const other = { x: 0.6, y: 0.8 } as const;
  assert.equal(distanceBetween(origin, other), 1);
});
