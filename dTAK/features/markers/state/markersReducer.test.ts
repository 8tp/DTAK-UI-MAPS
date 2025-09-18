import { markersReducer, initialMarkersState } from "./markersReducer";

describe("markersReducer", () => {
    test("addMarker stores title/description/iconId and sets createdAt", () => {
        const state1 = markersReducer(initialMarkersState, {
            type: "addMarker",
            payload: { lon: 1, lat: 2, meta: { title: "T", description: "D", iconId: "marker-plane" } },
        });
        const markers = Object.values(state1.markers);
        expect(markers.length).toBe(1);
        const m = markers[0]!;
        expect(m.lon).toBe(1);
        expect(m.lat).toBe(2);
        expect(m.title).toBe("T");
        expect(m.description).toBe("D");
        expect(m.iconId).toBe("marker-plane");
        expect(typeof m.createdAt).toBe("number");
    });

    test("removeMarker deletes marker by id", () => {
        const s1 = markersReducer(initialMarkersState, { type: "addMarker", payload: { lon: 0, lat: 0 } });
        const id = Object.keys(s1.markers)[0]!;
        const s2 = markersReducer(s1, { type: "removeMarker", payload: { id } });
        expect(Object.keys(s2.markers).length).toBe(0);
    });

    test("clearMarkers clears all", () => {
        const s1 = markersReducer(initialMarkersState, { type: "addMarker", payload: { lon: 0, lat: 0 } });
        const s2 = markersReducer(s1, { type: "clearMarkers" });
        expect(Object.keys(s2.markers).length).toBe(0);
    });
});


