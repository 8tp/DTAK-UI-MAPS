import { AnnotatedPhotosAction, AnnotatedPhotosState } from "../types";

export const initialAnnotatedPhotosState: AnnotatedPhotosState = {
  photos: [],
  hydrated: false,
};

export function annotatedPhotosReducer(
  state: AnnotatedPhotosState,
  action: AnnotatedPhotosAction
): AnnotatedPhotosState {
  switch (action.type) {
    case "hydrate": {
      const mergedMap = new Map(action.payload.map((photo) => [photo.id, photo] as const));
      state.photos.forEach((photo) => {
        mergedMap.set(photo.id, photo);
      });
      const merged = Array.from(mergedMap.values()).sort((a, b) => b.createdAt - a.createdAt);
      return {
        photos: merged,
        hydrated: true,
      };
    }
    case "add-photo": {
      const filtered = state.photos.filter((photo) => photo.id !== action.payload.id);
      return {
        ...state,
        photos: [action.payload, ...filtered].sort((a, b) => b.createdAt - a.createdAt),
      };
    }
    case "remove-photo": {
      return {
        ...state,
        photos: state.photos.filter((photo) => photo.id !== action.payload),
      };
    }
    default:
      return state;
  }
}
