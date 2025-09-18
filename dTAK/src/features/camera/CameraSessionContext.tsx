import React, { createContext, useCallback, useContext, useMemo, useReducer } from "react";
import { Annotation, CapturedPhoto } from "./types";

type CameraSessionState = {
  photo?: CapturedPhoto;
  annotations: Annotation[];
};

type CameraSessionAction =
  | { type: "set-photo"; payload?: CapturedPhoto }
  | { type: "set-annotations"; payload: Annotation[] }
  | { type: "add-annotation"; payload: Annotation }
  | { type: "pop-annotation" }
  | { type: "reset" };

const initialState: CameraSessionState = { annotations: [] };

const reducer = (state: CameraSessionState, action: CameraSessionAction): CameraSessionState => {
  switch (action.type) {
    case "set-photo":
      return { photo: action.payload, annotations: [] };
    case "set-annotations":
      return { ...state, annotations: action.payload };
    case "add-annotation":
      return { ...state, annotations: [...state.annotations, action.payload] };
    case "pop-annotation":
      return { ...state, annotations: state.annotations.slice(0, -1) };
    case "reset":
      return initialState;
    default:
      return state;
  }
};

type CameraSessionContextValue = {
  capturedPhoto?: CapturedPhoto;
  annotations: Annotation[];
  setCapturedPhoto: (photo?: CapturedPhoto) => void;
  setAnnotations: (annotations: Annotation[]) => void;
  addAnnotation: (annotation: Annotation) => void;
  undoLastAnnotation: () => void;
  resetSession: () => void;
};

const CameraSessionContext = createContext<CameraSessionContextValue | undefined>(undefined);

export const CameraSessionProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setCapturedPhoto = useCallback((photo?: CapturedPhoto) => {
    dispatch({ type: "set-photo", payload: photo });
  }, []);

  const setAnnotations = useCallback((annotations: Annotation[]) => {
    dispatch({ type: "set-annotations", payload: annotations });
  }, []);

  const addAnnotation = useCallback((annotation: Annotation) => {
    dispatch({ type: "add-annotation", payload: annotation });
  }, []);

  const undoLastAnnotation = useCallback(() => {
    dispatch({ type: "pop-annotation" });
  }, []);

  const resetSession = useCallback(() => {
    dispatch({ type: "reset" });
  }, []);

  const value = useMemo(
    () => ({
      capturedPhoto: state.photo,
      annotations: state.annotations,
      setCapturedPhoto,
      setAnnotations,
      addAnnotation,
      undoLastAnnotation,
      resetSession,
    }),
    [state.annotations, state.photo, addAnnotation, resetSession, setAnnotations, setCapturedPhoto]
  );

  return <CameraSessionContext.Provider value={value}>{children}</CameraSessionContext.Provider>;
};

export const useCameraSession = (): CameraSessionContextValue => {
  const context = useContext(CameraSessionContext);
  if (!context) {
    throw new Error("useCameraSession must be used within a CameraSessionProvider");
  }

  return context;
};
