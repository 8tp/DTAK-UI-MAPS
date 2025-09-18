import * as CBORImpl from "./mod.js";
export function polyfill() {
    // dnt-shim-ignore
    if (typeof window === "object") {
        // dnt-shim-ignore
        window.CBOR = CBORImpl;
    }
    else {
        // dnt-shim-ignore
        globalThis.CBOR = CBORImpl;
    }
}
polyfill();
