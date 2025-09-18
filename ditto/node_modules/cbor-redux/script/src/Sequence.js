"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Sequence_instances, _Sequence_toInspectString;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sequence = void 0;
class Sequence {
    static from(iterable) {
        return new Sequence(Array.from(iterable));
    }
    constructor(data) {
        _Sequence_instances.add(this);
        Object.defineProperty(this, "_data", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        if (data)
            this._data = data;
        else
            this._data = [];
    }
    /** Add data to the sequence and return the index of the item. */
    add(item) {
        return this._data.push(item) - 1;
    }
    /** Removes an item from the sequence, returning the value. */
    remove(index) {
        return this._data.splice(index, 1)[0];
    }
    /** Get an item from the sequence by index. */
    get(index) {
        return this._data[index];
    }
    /** Get a shallow clone of this CBOR Sequence. */
    clone() {
        return new Sequence(this.data);
    }
    /** Get a copy of the CBOR sequence data array. */
    get data() {
        return Array.from(this._data);
    }
    get size() {
        return this._data.length;
    }
    [(_Sequence_instances = new WeakSet(), Symbol.toStringTag)]() {
        return "Sequence";
    }
    [(_Sequence_toInspectString = function _Sequence_toInspectString(inspect) {
        return `${this[Symbol.toStringTag]()}(${this.size}) ${inspect(this._data)}`;
    }, Symbol.for("Deno.customInspect"))](inspect) {
        return __classPrivateFieldGet(this, _Sequence_instances, "m", _Sequence_toInspectString).call(this, inspect);
    }
    [Symbol.for("nodejs.util.inspect.custom")](_depth, _opts, inspect) {
        return __classPrivateFieldGet(this, _Sequence_instances, "m", _Sequence_toInspectString).call(this, inspect);
    }
}
exports.Sequence = Sequence;
