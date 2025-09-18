"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kCborTagFloat64 = exports.kCborTagFloat32 = exports.kCborTagInt32 = exports.kCborTagInt16 = exports.kCborTagInt8 = exports.kCborTagUint32 = exports.kCborTagUint16 = exports.kCborTagUint8 = exports.kCborTag = exports.DECODE_CHUNK_SIZE = exports.MAX_SAFE_INTEGER = exports.POW_2_53 = exports.POW_2_32 = exports.POW_2_24 = exports.OMIT_VALUE = exports.EMPTY_KEY = exports.CBOR_OPTIONS = void 0;
exports.CBOR_OPTIONS = Object.freeze({
    dictionary: "object",
    mode: "strict",
});
/** A symbol which is emitted by the `reviver` and `replacer` functions when a value is not associated with a key or CBOR label.
 * In JSON, a value with no key simply emits an empty string; this would be indistinguishable from a valid CBOR data sequence.
 * Using a symbol acheives emitting a comparable value without the value being a valid CBOR data type.
 *
 * ```typescript
 * const encoded = encode('Plain string', (key, value) => {
 *   console.log(key)
 *   return value
 * })
 * // Expected: Symbol(EMPTY_KEY)
 * decode(encoded, (key, value) => {
 *   console.log(key)
 *   return value
 * })
 * // Expected: Symbol(EMPTY_KEY)
 * ```
 */
exports.EMPTY_KEY = Symbol("EMPTY_KEY");
/** A symbol which may be returned by the user in the encoder's `replacer` function to omit values. Just like detecting an empty
 * key, using a symbol acheives emitting a comparable value without the value being a valid CBOR data type. Use this in a custom
 * replacer function as the return value to indicate to the encoder that the value is to be skipped from arrays and dictionaries.
 *
 * ```typescript
 * const map = new Map<any, any>([[1, 2], ["1", 3000]])
 * const encoded = encode(map, (key, value) => key === "1" ? OMIT_VALUE : value)
 * console.log(new Uint8Array(encoded)) // Expect: Uint8Array(8) [ 161, 1, 2 ]
 * ```
 */
exports.OMIT_VALUE = Symbol("OMIT_VALUE");
exports.POW_2_24 = 5.960464477539063e-8;
exports.POW_2_32 = 4294967296;
exports.POW_2_53 = 9007199254740992;
exports.MAX_SAFE_INTEGER = 18446744073709551616n;
exports.DECODE_CHUNK_SIZE = 8192;
// CBOR defined tag values
exports.kCborTag = 6;
// RFC8746 Tag values for typed little endian arrays
exports.kCborTagUint8 = 64;
exports.kCborTagUint16 = 69;
exports.kCborTagUint32 = 70;
exports.kCborTagInt8 = 72;
exports.kCborTagInt16 = 77;
exports.kCborTagInt32 = 78;
exports.kCborTagFloat32 = 85;
exports.kCborTagFloat64 = 86;
