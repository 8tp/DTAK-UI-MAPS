import { v4 as uuidv4 } from "uuid";
import type { AddMarkerPayload, Marker, MarkersAction, MarkersState } from "../types";

export const initialMarkersState: MarkersState = {
    markers: {},
};

export function markersReducer(state: MarkersState, action: MarkersAction): MarkersState {
    switch (action.type) {
        case "addMarker": {
            const { lon, lat, meta } = action.payload as AddMarkerPayload;
            const id = uuidv4();
            const createdAt = Date.now();
            const marker: Marker = {
                id,
                lon,
                lat,
                createdAt,
                title: meta?.title,
                description: meta?.description,
                iconId: meta?.iconId ?? "marker-default-pin",
            };
            return {
                ...state,
                markers: { ...state.markers, [id]: marker },
            };
        }
        case "removeMarker": {
            const next = { ...state.markers };
            delete next[action.payload.id];
            return { ...state, markers: next };
        }
        case "clearMarkers": {
            return { ...state, markers: {} };
        }
        case "loadMarkers": {
            const rec: Record<string, Marker> = {};
            for (const m of action.payload) rec[m.id] = m;
            return { ...state, markers: rec };
        }
        default:
            return state;
    }
}


