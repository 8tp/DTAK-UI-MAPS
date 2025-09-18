export declare class Sequence<T = unknown> {
    #private;
    static from<T = unknown>(iterable: Iterable<T> | ArrayLike<T>): Sequence<T>;
    private _data;
    constructor(data?: T[]);
    /** Add data to the sequence and return the index of the item. */
    add(item: T): number;
    /** Removes an item from the sequence, returning the value. */
    remove(index: number): T;
    /** Get an item from the sequence by index. */
    get(index: number): T;
    /** Get a shallow clone of this CBOR Sequence. */
    clone(): Sequence<T>;
    /** Get a copy of the CBOR sequence data array. */
    get data(): T[];
    get size(): number;
    [Symbol.toStringTag](): string;
}
