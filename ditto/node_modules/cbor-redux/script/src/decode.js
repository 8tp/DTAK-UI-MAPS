"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = exports.decode = void 0;
// deno-lint-ignore-file no-explicit-any
const constants_js_1 = require("./constants.js");
const helpers_js_1 = require("./helpers.js");
const Sequence_js_1 = require("./Sequence.js");
const SimpleValue_js_1 = require("./SimpleValue.js");
const TaggedValue_js_1 = require("./TaggedValue.js");
function decode(data, reviver, cborOptions = {}) {
    const { dictionary, mode } = (0, helpers_js_1.options)(cborOptions);
    const isStrict = mode === "sequence" || mode === "strict";
    const dataView = new DataView(data);
    const ta = new Uint8Array(data);
    let offset = 0;
    let reviverFunction = function (_key, value) {
        return value;
    };
    if (typeof reviver === "function")
        reviverFunction = reviver;
    function commitRead(length, value) {
        offset += length;
        return value;
    }
    function readArrayBuffer(length) {
        return commitRead(length, new Uint8Array(data, offset, length));
    }
    function readFloat16() {
        const tempArrayBuffer = new ArrayBuffer(4);
        const tempDataView = new DataView(tempArrayBuffer);
        const value = readUint16();
        const sign = value & 0x8000;
        let exponent = value & 0x7c00;
        const fraction = value & 0x03ff;
        if (exponent === 0x7c00)
            exponent = 0xff << 10;
        else if (exponent !== 0)
            exponent += (127 - 15) << 10;
        else if (fraction !== 0)
            return (sign ? -1 : 1) * fraction * constants_js_1.POW_2_24;
        tempDataView.setUint32(0, (sign << 16) | (exponent << 13) | (fraction << 13));
        return tempDataView.getFloat32(0);
    }
    function readFloat32() {
        return commitRead(4, dataView.getFloat32(offset));
    }
    function readFloat64() {
        return commitRead(8, dataView.getFloat64(offset));
    }
    function readUint8() {
        return commitRead(1, ta[offset]);
    }
    function readUint16() {
        return commitRead(2, dataView.getUint16(offset));
    }
    function readUint32() {
        return commitRead(4, dataView.getUint32(offset));
    }
    function readUint64() {
        return commitRead(8, dataView.getBigUint64(offset));
    }
    function readBreak() {
        if (ta[offset] !== 0xff)
            return false;
        offset += 1;
        return true;
    }
    function readLength(additionalInformation) {
        if (additionalInformation < 24)
            return additionalInformation;
        if (additionalInformation === 24)
            return readUint8();
        if (additionalInformation === 25)
            return readUint16();
        if (additionalInformation === 26)
            return readUint32();
        if (additionalInformation === 27) {
            const integer = readUint64();
            if (integer < constants_js_1.POW_2_53)
                return Number(integer);
            return integer;
        }
        if (additionalInformation === 31)
            return -1;
        throw new Error("CBORError: Invalid length encoding");
    }
    function readIndefiniteStringLength(majorType) {
        const initialByte = readUint8();
        if (initialByte === 0xff)
            return -1;
        const length = readLength(initialByte & 0x1f);
        if (length < 0 || initialByte >> 5 !== majorType) {
            throw new Error("CBORError: Invalid indefinite length element");
        }
        return Number(length);
    }
    function appendUtf16Data(utf16data, length) {
        for (let i = 0; i < length; ++i) {
            let value = readUint8();
            if (value & 0x80) {
                if (value < 0xe0) {
                    value = ((value & 0x1f) << 6) | (readUint8() & 0x3f);
                    length -= 1;
                }
                else if (value < 0xf0) {
                    value = ((value & 0x0f) << 12) | ((readUint8() & 0x3f) << 6) |
                        (readUint8() & 0x3f);
                    length -= 2;
                }
                else {
                    value = ((value & 0x0f) << 18) | ((readUint8() & 0x3f) << 12) |
                        ((readUint8() & 0x3f) << 6) | (readUint8() & 0x3f);
                    length -= 3;
                }
            }
            if (value < 0x10000) {
                utf16data.push(value);
            }
            else {
                value -= 0x10000;
                utf16data.push(0xd800 | (value >> 10));
                utf16data.push(0xdc00 | (value & 0x3ff));
            }
        }
    }
    function decodeItem() {
        const initialByte = readUint8();
        const majorType = initialByte >> 5;
        const additionalInformation = initialByte & 0x1f;
        let i;
        let length;
        if (majorType === 7) {
            switch (additionalInformation) {
                case 25:
                    return readFloat16();
                case 26:
                    return readFloat32();
                case 27:
                    return readFloat64();
            }
        }
        length = readLength(additionalInformation);
        if (length < 0 && (majorType < 2 || 6 < majorType)) {
            throw new Error("CBORError: Invalid length");
        }
        switch (majorType) {
            case 0:
                return reviverFunction(constants_js_1.EMPTY_KEY, length);
            case 1:
                if (typeof length === "number") {
                    return reviverFunction(constants_js_1.EMPTY_KEY, -1 - length);
                }
                return reviverFunction(constants_js_1.EMPTY_KEY, -1n - length);
            case 2: {
                if (length < 0) {
                    const elements = [];
                    let fullArrayLength = 0;
                    while ((length = readIndefiniteStringLength(majorType)) >= 0) {
                        fullArrayLength += length;
                        elements.push(readArrayBuffer(length));
                    }
                    const fullArray = new Uint8Array(fullArrayLength);
                    let fullArrayOffset = 0;
                    for (i = 0; i < elements.length; ++i) {
                        fullArray.set(elements[i], fullArrayOffset);
                        fullArrayOffset += elements[i].length;
                    }
                    return reviverFunction(constants_js_1.EMPTY_KEY, fullArray);
                }
                return reviverFunction(constants_js_1.EMPTY_KEY, readArrayBuffer(length));
            }
            case 3: {
                const utf16data = [];
                if (length < 0) {
                    while ((length = readIndefiniteStringLength(majorType)) >= 0) {
                        appendUtf16Data(utf16data, length);
                    }
                }
                else {
                    appendUtf16Data(utf16data, length);
                }
                let string = "";
                for (i = 0; i < utf16data.length; i += constants_js_1.DECODE_CHUNK_SIZE) {
                    string += String.fromCharCode.apply(null, utf16data.slice(i, i + constants_js_1.DECODE_CHUNK_SIZE));
                }
                return reviverFunction(constants_js_1.EMPTY_KEY, string);
            }
            case 4: {
                let retArray;
                if (length < 0) {
                    retArray = [];
                    let index = 0;
                    while (!readBreak()) {
                        retArray.push(reviverFunction(index++, decodeItem()));
                    }
                }
                else {
                    retArray = new Array(length);
                    for (i = 0; i < length; ++i) {
                        retArray[i] = reviverFunction(i, decodeItem());
                    }
                }
                return reviverFunction(constants_js_1.EMPTY_KEY, retArray);
            }
            case 5: {
                if (dictionary === "map") {
                    const retMap = new Map();
                    for (i = 0; i < length || (length < 0 && !readBreak()); ++i) {
                        const key = decodeItem();
                        if (isStrict && retMap.has(key)) {
                            throw new Error("CBORError: Duplicate key encountered");
                        }
                        retMap.set(key, reviverFunction(key, decodeItem()));
                    }
                    return reviverFunction(constants_js_1.EMPTY_KEY, retMap);
                }
                const retObject = {};
                for (i = 0; i < length || (length < 0 && !readBreak()); ++i) {
                    const key = decodeItem();
                    if (isStrict &&
                        Object.prototype.hasOwnProperty.call(retObject, key)) {
                        throw new Error("CBORError: Duplicate key encountered");
                    }
                    retObject[key] = reviverFunction(key, decodeItem());
                }
                return reviverFunction(constants_js_1.EMPTY_KEY, retObject);
            }
            case 6: {
                const value = decodeItem();
                const tag = length;
                if (value instanceof Uint8Array) {
                    // Handles round-trip of typed arrays as they are a built-in JS language feature.
                    // Similar decision was made for built-in JS language primitives with SimpleValue.
                    const buffer = value.buffer.slice(value.byteOffset, value.byteLength + value.byteOffset);
                    switch (tag) {
                        case constants_js_1.kCborTagUint8:
                            return reviverFunction(constants_js_1.EMPTY_KEY, new Uint8Array(buffer));
                        case constants_js_1.kCborTagInt8:
                            return reviverFunction(constants_js_1.EMPTY_KEY, new Int8Array(buffer));
                        case constants_js_1.kCborTagUint16:
                            return reviverFunction(constants_js_1.EMPTY_KEY, new Uint16Array(buffer));
                        case constants_js_1.kCborTagInt16:
                            return reviverFunction(constants_js_1.EMPTY_KEY, new Int16Array(buffer));
                        case constants_js_1.kCborTagUint32:
                            return reviverFunction(constants_js_1.EMPTY_KEY, new Uint32Array(buffer));
                        case constants_js_1.kCborTagInt32:
                            return reviverFunction(constants_js_1.EMPTY_KEY, new Int32Array(buffer));
                        case constants_js_1.kCborTagFloat32:
                            return reviverFunction(constants_js_1.EMPTY_KEY, new Float32Array(buffer));
                        case constants_js_1.kCborTagFloat64:
                            return reviverFunction(constants_js_1.EMPTY_KEY, new Float64Array(buffer));
                    }
                }
                return reviverFunction(constants_js_1.EMPTY_KEY, new TaggedValue_js_1.TaggedValue(value, tag));
            }
            case 7:
                switch (length) {
                    case 20:
                        return reviverFunction(constants_js_1.EMPTY_KEY, false);
                    case 21:
                        return reviverFunction(constants_js_1.EMPTY_KEY, true);
                    case 22:
                        return reviverFunction(constants_js_1.EMPTY_KEY, null);
                    case 23:
                        return reviverFunction(constants_js_1.EMPTY_KEY, undefined);
                    default:
                        return reviverFunction(constants_js_1.EMPTY_KEY, new SimpleValue_js_1.SimpleValue(length));
                }
        }
    }
    const ret = decodeItem();
    if (offset !== data.byteLength) {
        if (mode !== "sequence")
            throw new Error("CBORError: Remaining bytes");
        const seq = new Sequence_js_1.Sequence([ret]);
        while (offset < data.byteLength) {
            seq.add(reviverFunction(constants_js_1.EMPTY_KEY, decodeItem()));
        }
        return seq;
    }
    return mode === "sequence" ? new Sequence_js_1.Sequence([ret]) : ret;
}
exports.decode = decode;
function parse(data, reviver, cborOptions) {
    return decode(data, reviver, cborOptions);
}
exports.parse = parse;
