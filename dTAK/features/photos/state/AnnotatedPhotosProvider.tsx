import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";

import { annotatedPhotosReducer, initialAnnotatedPhotosState } from "./annotatedPhotosReducer";
import { ensurePhotoStorage, readPhotoManifest, removeStoredPhotoFile, writePhotoManifest } from "../storage";
import type { StoredPhoto } from "../types";

export type AnnotatedPhotosContextValue = {
  photos: StoredPhoto[];
  hydrated: boolean;
  addPhoto: (photo: StoredPhoto) => void;
  removePhoto: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const AnnotatedPhotosContext = createContext<AnnotatedPhotosContextValue | undefined>(undefined);

export const AnnotatedPhotosProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(annotatedPhotosReducer, initialAnnotatedPhotosState);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await ensurePhotoStorage();
        const photos = await readPhotoManifest();
        if (!cancelled) {
          dispatch({ type: "hydrate", payload: photos });
        }
      } catch (error) {
        console.warn("Failed to hydrate annotated photos store", error);
        if (!cancelled) {
          dispatch({ type: "hydrate", payload: [] });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!state.hydrated) {
      return;
    }

    writePhotoManifest(state.photos).catch((error) => {
      console.warn("Failed to persist annotated photos manifest", error);
    });
  }, [state.photos, state.hydrated]);

  const addPhoto = useCallback((photo: StoredPhoto) => {
    dispatch({ type: "add-photo", payload: photo });
  }, []);

  const removePhoto = useCallback(
    async (id: string) => {
      const photo = state.photos.find((item) => item.id === id);
      if (!photo) {
        return;
      }

      await removeStoredPhotoFile(photo.uri);
      dispatch({ type: "remove-photo", payload: id });
    },
    [state.photos]
  );

  const refresh = useCallback(async () => {
    const photos = await readPhotoManifest();
    dispatch({ type: "hydrate", payload: photos });
  }, []);

  const value = useMemo(
    () => ({
      photos: state.photos,
      hydrated: state.hydrated,
      addPhoto,
      removePhoto,
      refresh,
    }),
    [state.photos, state.hydrated, addPhoto, removePhoto, refresh]
  );

  return <AnnotatedPhotosContext.Provider value={value}>{children}</AnnotatedPhotosContext.Provider>;
};

export function useAnnotatedPhotos() {
  const context = useContext(AnnotatedPhotosContext);
  if (!context) {
    throw new Error("useAnnotatedPhotos must be used within an AnnotatedPhotosProvider");
  }

  return context;
}
