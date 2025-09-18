"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OMIT_VALUE = exports.EMPTY_KEY = void 0;
__exportStar(require("./src/CBOR.js"), exports);
var constants_js_1 = require("./src/constants.js");
Object.defineProperty(exports, "EMPTY_KEY", { enumerable: true, get: function () { return constants_js_1.EMPTY_KEY; } });
Object.defineProperty(exports, "OMIT_VALUE", { enumerable: true, get: function () { return constants_js_1.OMIT_VALUE; } });
__exportStar(require("./src/decode.js"), exports);
__exportStar(require("./src/encode.js"), exports);
__exportStar(require("./src/Sequence.js"), exports);
__exportStar(require("./src/SimpleValue.js"), exports);
__exportStar(require("./src/TaggedValue.js"), exports);
__exportStar(require("./src/types.js"), exports);
