import { decode, parse } from "./decode.js";
import { binarify, encode } from "./encode.js";
/**
 * An intrinsic object that provides functions to convert JavaScript values
 * to and from the Concise Binary Object Representation (CBOR) format.
 *
 * ```typescript
 * // Simply a conveniently named-export.
 * CBOR.binarify(...)
 * CBOR.decode(...)
 * CBOR.encode(...)
 * CBOR.parse(...)
 * ```
 */
export const CBOR = {
    binarify,
    decode,
    encode,
    parse,
};
