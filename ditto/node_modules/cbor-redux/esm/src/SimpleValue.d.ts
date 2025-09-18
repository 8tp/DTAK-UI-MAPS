/** Class for structuring a simple value. Unassigned or reserved simple values
 * are emitted as an instance of this class during decoding. This allows an
 * application to handle custom decoding in the `reviver` function of the decoder.
 *
 * ```typescript
 * const { buffer } = new Uint8Array([0x81,0xf8,0x64])
 * const decoded = decode(buffer, (key, value) => {
 *   // Let's pretend that a simple value of 100 stands for JavaScript NaN
 *   if (value instanceof SimpleValue && value.value === 100) return NaN
 *   return value
 * })
 * console.log(decoded) // Expect: [ NaN ]
 * ```
 *
 * Simple values can alsoe be encoded.
 *
 * ```typescript
 * const example = [NaN]
 * const encoded = encode(example, (key, value) => {
 *   if (Number.isNaN(value)) return new SimpleValue(100)
 *   return value
 * })
 * console.log(new Uint8Array(encoded)) // Expect: Uint8Array(3) [ 129, 248, 100 ]
 * ```
 */
export declare class SimpleValue {
    static create(value: boolean | number | null | undefined): SimpleValue;
    constructor(value: number);
    semantic: "reserved" | "unassigned" | "false" | "true" | "null" | "undefined";
    value: number;
    toPrimitive(): any;
}
