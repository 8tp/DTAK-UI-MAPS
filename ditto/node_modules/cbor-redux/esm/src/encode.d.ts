import { CBORReplacer } from "./types.js";
/**
 * Converts a JavaScript value to a Concise Binary Object Representation (CBOR) buffer.
 *
 * ```typescript
 * const map = new Map<any, any>([[1, 2], ["1", 3000]])
 * const encoded = encode(map)
 * console.log(new Uint8Array(encoded)) // Expect: Uint8Array(8) [ 162,  1,  2,  97, 49, 25, 11, 184 ]
 * ```
 *
 * Add a replacer function - just like `JSON.stringify`.
 *
 * ```typescript
 * const map = new Map<any, any>([[1, 2], ["1", 3000]])
 * const encoded = encode(map, (key, value) => key === "1" ? OMIT_VALUE : value)
 * console.log(new Uint8Array(encoded)) // Expect: Uint8Array(8) [ 161, 1, 2 ]
 * ```
 *
 * @param value - A JavaScript value, usually an object or array, to be converted.
 * @param replacer - A function that alters the behavior of the encoding process,
 * or an array of strings or numbers naming properties of value that should be included
 * in the output. If replacer is null or not provided, all properties of the object are
 * included in the resulting CBOR buffer.
 * @returns The JavaScript value converted to CBOR format.
 */
export declare function encode<T = any>(value: T, replacer?: CBORReplacer | Array<string | number> | null): ArrayBuffer;
/**
 * Alias of `encode`. Converts a JavaScript value to a Concise Binary Object Representation (CBOR) buffer.
 * @param value - A JavaScript value, usually an object or array, to be converted.
 * @param replacer - A function that alters the behavior of the encoding process,
 * or an array of strings or numbers naming properties of value that should be included
 * in the output. If replacer is null or not provided, all properties of the object are
 * included in the resulting CBOR buffer.
 * @returns The JavaScript value converted to CBOR format.
 */
export declare function binarify(value: any, replacer?: CBORReplacer | Array<string | number> | null): ArrayBuffer;
