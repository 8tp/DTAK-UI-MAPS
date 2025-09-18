// deno-lint-ignore-file no-explicit-any
import { CBOR_OPTIONS } from "./constants.js";
export function objectIs(x, y) {
    if (typeof Object.is === "function")
        return Object.is(x, y);
    // SameValue algorithm
    // Steps 1-5, 7-10
    if (x === y) {
        // Steps 6.b-6.e: +0 != -0
        return x !== 0 || 1 / x === 1 / y;
    }
    // Step 6.a: NaN == NaN
    return x !== x && y !== y;
}
export function options(options) {
    function isDictionary(value) {
        return typeof value === "string" && ["object", "map"].includes(value);
    }
    function isMode(value) {
        return typeof value === "string" &&
            ["loose", "strict", "sequence"].includes(value);
    }
    const bag = { ...CBOR_OPTIONS };
    if (typeof options === "object") {
        bag.dictionary = isDictionary(options.dictionary)
            ? options.dictionary
            : CBOR_OPTIONS.dictionary;
        bag.mode = isMode(options.mode) ? options.mode : CBOR_OPTIONS.mode;
    }
    return Object.freeze(bag);
}
export function lexicographicalCompare(left, right) {
    const minLength = Math.min(left.byteLength, right.byteLength);
    for (let i = 0; i < minLength; i++) {
        const result = left[i] - right[i];
        if (result !== 0)
            return result;
    }
    return left.byteLength - right.byteLength;
}
