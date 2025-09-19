export type GeoLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
};

export type StoredPhoto = {
  id: string;
  uri: string;
  width: number;
  height: number;
  createdAt: number;
  sizeBytes?: number;
  geolocation?: GeoLocation;
};

export type StoredPhotoManifest = {
  version: 1;
  photos: StoredPhoto[];
};

export type AnnotatedPhotosState = {
  photos: StoredPhoto[];
  hydrated: boolean;
};

export type AnnotatedPhotosAction =
  | { type: "hydrate"; payload: StoredPhoto[] }
  | { type: "add-photo"; payload: StoredPhoto }
  | { type: "remove-photo"; payload: string };
