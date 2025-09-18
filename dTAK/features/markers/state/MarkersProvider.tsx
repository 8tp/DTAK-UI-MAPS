import React, { createContext, useContext, useMemo, useReducer } from "react";
import type { MarkersAction, MarkersState } from "../types";
import { initialMarkersState, markersReducer } from "./markersReducer";

type MarkersContextValue = {
    state: MarkersState;
    dispatch: React.Dispatch<MarkersAction>;
};

const MarkersContext = createContext<MarkersContextValue | undefined>(undefined);

export const MarkersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(markersReducer, initialMarkersState);
    const value = useMemo(() => ({ state, dispatch }), [state]);
    return <MarkersContext.Provider value={value}>{children}</MarkersContext.Provider>;
};

export function useMarkers() {
    const ctx = useContext(MarkersContext);
    if (!ctx) throw new Error("useMarkers must be used within a MarkersProvider");
    return ctx;
}


