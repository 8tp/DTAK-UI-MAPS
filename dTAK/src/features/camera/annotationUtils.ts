import { NormalizedPoint } from "./types";

type Size = { width: number; height: number };

const clampUnit = (value: number): number => {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }

  if (value < 0) {
    return 0;
  }

  if (value > 1) {
    return 1;
  }

  return value;
};

export const normalizePoint = (point: { x: number; y: number }, size: Size): NormalizedPoint => {
  if (size.width <= 0 || size.height <= 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: clampUnit(point.x / size.width),
    y: clampUnit(point.y / size.height),
  };
};

export const denormalizePoint = (point: NormalizedPoint, size: Size): { x: number; y: number } => {
  return {
    x: point.x * size.width,
    y: point.y * size.height,
  };
};

export const distanceBetween = (a: NormalizedPoint, b: NormalizedPoint): number => {
  return Math.hypot(b.x - a.x, b.y - a.y);
};
