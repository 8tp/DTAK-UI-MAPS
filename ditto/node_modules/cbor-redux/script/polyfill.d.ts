import * as dntShim from "./_dnt.shims.js";
import * as CBORImpl from "./mod.js";
declare global {
    interface Window {
        CBOR: typeof CBORImpl;
    }
    let CBOR: typeof CBORImpl;
    var window: Window & typeof dntShim.dntGlobalThis;
}
export declare function polyfill(): void;
