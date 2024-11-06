"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var main_exports = {};
__export(main_exports, {
  translations: () => translations
});
module.exports = __toCommonJS(main_exports);
const translations = {
  name: "Turkish",
  strings: {
    "Please follow the rules:": "L\xFCtfen kurallara uyun:",
    "[TN: Link to the PS rules for your language (path after pokemonshowdown.com]/rules": "/pages/rules-tr",
    "Global Rules": "Genel kurallar",
    "${room} room rules": "${room} odas\u0131 kurallar\u0131"
  }
};
//# sourceMappingURL=main.js.map
