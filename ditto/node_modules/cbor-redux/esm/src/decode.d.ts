import { Sequence } from "./Sequence.js";
import { CBOROptions, CBORReviver, CBORSequenceOptions } from "./types.js";
/**
 * Converts a Concise Binary Object Representation (CBOR) buffer into an object.
 *
 * ```typescript
 * const buffer = new Uint8Array([0xa2, 0x01, 0x02, 0x03, 0x04]).buffer
 * const decoded = decode(buffer)
 * console.log(decoded) // Expect: { "1": 2, "3": 4 }
 * ```
 *
 * Use custom handling with a reviver function - just like `JSON.parse`.
 *
 * ```typescript
 * const { buffer } = new Uint8Array([
 *   0xa1,0x63,0x75,0x72,0x6c,0xd8,0x20,0x70,
 *   0x68,0x74,0x74,0x70,0x3a,0x2f,0x2f,0x73,
 *   0x69,0x74,0x65,0x2e,0x63,0x6f,0x6d,0x2f
 * ])
 * const decoded = decode(buffer, (key, value) => {
 *   if (value instanceof TaggedValue && value.tag === 32) return new URL(value.value)
 *   return value
 * })
 * console.log(decoded) // Expect: { url: URL { href: "http://site.com/" } }
 * ```
 *
 * If maps which preserve the key data types are desired, use `dictionary: "map"`.
 *
 * ```typescript
 * const buffer = new Uint8Array([0xa2, 0x01, 0x02, 0x03, 0x04]).buffer
 * const decoded = decode(buffer, null, { dictionary: "map" })
 * console.log(decoded) // Expect: Map { 1 => 2, 3 => 4 }
 * ```
 *
 * @param data - A valid CBOR buffer.
 * @param reviver - If a function, this prescribes how the value originally produced by parsing is transformed, before being returned.
 * @param cborOptions - An options bag to specify the dictionary type and mode for the decoder.
 * @returns The CBOR buffer converted to a JavaScript value.
 */
export declare function decode<T = any>(data: ArrayBuffer | SharedArrayBuffer, reviver: CBORReviver | null | undefined, cborOptions: CBORSequenceOptions): Sequence<T>;
export declare function decode<T = any>(data: ArrayBuffer | SharedArrayBuffer, reviver?: CBORReviver | null, cborOptions?: CBOROptions): T;
/**
 * Alias of `decode`. Converts a Concise Binary Object Representation (CBOR) buffer into an object.
 * @param data - A valid CBOR buffer.
 * @param reviver - If a function, this prescribes how the value originally produced by parsing is transformed, before being returned.
 * @param cborOptions - An options bag to specify the dictionary type and mode for the decoder.
 * @returns The CBOR buffer converted to a JavaScript value.
 */
export declare function parse(data: ArrayBuffer | SharedArrayBuffer, reviver: CBORReviver | null | undefined, cborOptions: CBORSequenceOptions): Sequence<any>;
export declare function parse(data: ArrayBuffer | SharedArrayBuffer, reviver?: CBORReviver | null, cborOptions?: CBOROptions): any;
