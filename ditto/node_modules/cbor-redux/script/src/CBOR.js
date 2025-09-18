"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CBOR = void 0;
const decode_js_1 = require("./decode.js");
const encode_js_1 = require("./encode.js");
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
exports.CBOR = {
    binarify: encode_js_1.binarify,
    decode: decode_js_1.decode,
    encode: encode_js_1.encode,
    parse: decode_js_1.parse,
};
