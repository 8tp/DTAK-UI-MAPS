import { annotatedPhotosReducer, initialAnnotatedPhotosState } from "./annotatedPhotosReducer";
import type { StoredPhoto } from "../types";

describe("annotatedPhotosReducer", () => {
  const photo = (overrides: Partial<StoredPhoto> = {}): StoredPhoto => ({
    id: overrides.id ?? `photo-${Math.random()}`,
    uri: overrides.uri ?? "file:///dev/null",
    width: overrides.width ?? 1024,
    height: overrides.height ?? 768,
    createdAt: overrides.createdAt ?? Date.now(),
    sizeBytes: overrides.sizeBytes,
    geolocation: overrides.geolocation,
  });

  test("hydrate merges staged photos and sorts by recency", () => {
    const staged = annotatedPhotosReducer(initialAnnotatedPhotosState, {
      type: "add-photo",
      payload: photo({ id: "staged", createdAt: 200 }),
    });

    const result = annotatedPhotosReducer(staged, {
      type: "hydrate",
      payload: [photo({ id: "old", createdAt: 100 }), photo({ id: "new", createdAt: 300 })],
    });

    expect(result.hydrated).toBe(true);
    expect(result.photos.map((p) => p.id)).toEqual(["new", "staged", "old"]);
  });

  test("add-photo replaces existing entry and keeps latest first", () => {
    const hydrated = annotatedPhotosReducer(initialAnnotatedPhotosState, {
      type: "hydrate",
      payload: [],
    });

    const withPhoto = annotatedPhotosReducer(hydrated, {
      type: "add-photo",
      payload: photo({ id: "repeat", createdAt: 100 }),
    });

    const updated = annotatedPhotosReducer(withPhoto, {
      type: "add-photo",
      payload: photo({ id: "repeat", createdAt: 300 }),
    });

    expect(updated.photos).toHaveLength(1);
    expect(updated.photos[0]?.createdAt).toBe(300);
  });

  test("remove-photo deletes matching photo", () => {
    const hydrated = annotatedPhotosReducer(initialAnnotatedPhotosState, {
      type: "hydrate",
      payload: [],
    });

    const withPhoto = annotatedPhotosReducer(hydrated, {
      type: "add-photo",
      payload: photo({ id: "to-delete" }),
    });

    const result = annotatedPhotosReducer(withPhoto, {
      type: "remove-photo",
      payload: "to-delete",
    });

    expect(result.photos).toHaveLength(0);
  });
});
