import type { CBOROptions } from "./types.js";
export declare function objectIs(x: any, y: any): boolean;
export declare function options(options?: CBOROptions): Readonly<CBOROptions>;
export declare function lexicographicalCompare(left: Uint8Array, right: Uint8Array): number;
