import * as FileSystem from "expo-file-system/legacy";

import type { StoredPhoto, StoredPhotoManifest } from "./types";

const DOC_DIR: string = ((FileSystem as any).documentDirectory ??
  (FileSystem as any).cacheDirectory ??
  "file:///data/user/0/app/files/") as string;

const PHOTOS_DIR = `${DOC_DIR}photos`;
const PHOTO_FILES_DIR = `${PHOTOS_DIR}/files`;
const MANIFEST_PATH = `${PHOTOS_DIR}/manifest.json`;

async function ensureDirectory(path: string) {
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  }
}

export async function ensurePhotoStorage() {
  await ensureDirectory(PHOTOS_DIR);
  await ensureDirectory(PHOTO_FILES_DIR);
}

export function photoFilePathFor(id: string, extension = "jpg") {
  return `${PHOTO_FILES_DIR}/${id}.${extension}`;
}

export async function readPhotoManifest(): Promise<StoredPhoto[]> {
  await ensurePhotoStorage();
  const info = await FileSystem.getInfoAsync(MANIFEST_PATH);
  if (!info.exists) {
    return [];
  }

  try {
    const content = await FileSystem.readAsStringAsync(MANIFEST_PATH);
    const data = JSON.parse(content) as StoredPhotoManifest;
    return Array.isArray(data.photos) ? data.photos : [];
  } catch (error) {
    console.warn("Failed to parse stored photo manifest", error);
    return [];
  }
}

export async function writePhotoManifest(photos: StoredPhoto[]): Promise<void> {
  await ensurePhotoStorage();
  const manifest: StoredPhotoManifest = { version: 1, photos };
  await FileSystem.writeAsStringAsync(MANIFEST_PATH, JSON.stringify(manifest));
}

export async function movePhotoIntoStorage(tempUri: string, id: string) {
  await ensurePhotoStorage();

  const extensionFromUri = tempUri.split("?")[0]?.split(".").pop() ?? "jpg";
  const normalizedExtension = extensionFromUri.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const extension = normalizedExtension === "jpeg" ? "jpg" : normalizedExtension || "jpg";
  const destination = photoFilePathFor(id, extension);

  try {
    const existing = await FileSystem.getInfoAsync(destination);
    if (existing.exists) {
      await FileSystem.deleteAsync(destination, { idempotent: true });
    }
  } catch (error) {
    console.warn("Failed to clean up existing stored photo", error);
  }

  await FileSystem.copyAsync({ from: tempUri, to: destination });

  try {
    await FileSystem.deleteAsync(tempUri, { idempotent: true });
  } catch (error) {
    // Non-fatal: temp file might already be deleted by OS.
    console.warn("Failed to delete temporary photo", error);
  }

  return destination;
}

export async function removeStoredPhotoFile(uri: string) {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch (error) {
    console.warn("Failed to delete stored photo file", error);
  }
}

export async function statPhoto(uri: string) {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists ? info : undefined;
  } catch (error) {
    console.warn("Failed to stat stored photo", error);
    return undefined;
  }
}
