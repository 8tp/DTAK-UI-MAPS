import type { CBOROptions } from "./types.js";
export declare const CBOR_OPTIONS: Readonly<CBOROptions>;
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
export declare const EMPTY_KEY: unique symbol;
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
export declare const OMIT_VALUE: unique symbol;
export declare const POW_2_24 = 5.960464477539063e-8;
export declare const POW_2_32 = 4294967296;
export declare const POW_2_53 = 9007199254740992;
export declare const MAX_SAFE_INTEGER = 18446744073709551616n;
export declare const DECODE_CHUNK_SIZE = 8192;
export declare const kCborTag = 6;
export declare const kCborTagUint8 = 64;
export declare const kCborTagUint16 = 69;
export declare const kCborTagUint32 = 70;
export declare const kCborTagInt8 = 72;
export declare const kCborTagInt16 = 77;
export declare const kCborTagInt32 = 78;
export declare const kCborTagFloat32 = 85;
export declare const kCborTagFloat64 = 86;
