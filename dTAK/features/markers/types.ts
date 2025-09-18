export type Marker = {
    id: string;
    lon: number;
    lat: number;
    createdAt: number;
    title?: string;
    description?: string;
    iconId?: string;
};

export type MarkersState = {
    markers: Record<string, Marker>;
};

export type AddMarkerPayload = {
    lon: number;
    lat: number;
    meta?: {
        title?: string;
        description?: string;
        iconId?: string;
    };
};

export type MarkersAction =
    | { type: "addMarker"; payload: AddMarkerPayload }
    | { type: "removeMarker"; payload: { id: string } }
    | { type: "clearMarkers" }
    | { type: "loadMarkers"; payload: Marker[] };


