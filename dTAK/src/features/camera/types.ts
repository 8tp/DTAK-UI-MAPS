import type { GeoLocation } from "../../../features/photos/types";

export type NormalizedPoint = {
  x: number;
  y: number;
};

export type CircleAnnotation = {
  id: string;
  type: "circle";
  center: NormalizedPoint;
  edge: NormalizedPoint;
  color: string;
};

export type ArrowAnnotation = {
  id: string;
  type: "arrow";
  start: NormalizedPoint;
  end: NormalizedPoint;
  color: string;
};

export type TextAnnotation = {
  id: string;
  type: "text";
  point: NormalizedPoint;
  text: string;
  color: string;
};

export type Annotation = CircleAnnotation | ArrowAnnotation | TextAnnotation;

export type CapturedPhoto = {
  id: string;
  uri: string;
  width: number;
  height: number;
  createdAt: number;
  sizeBytes?: number;
  exif?: Record<string, unknown>;
  geolocation?: GeoLocation;
};
