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
var pokedex_exports = {};
__export(pokedex_exports, {
  Pokedex: () => Pokedex
});
module.exports = __toCommonJS(pokedex_exports);
const Pokedex = {
  shiftry: {
    inherit: true,
    abilities: { 0: "Chlorophyll", 1: "Early Bird", H: "Pickpocket" }
  },
  piplup: {
    inherit: true,
    abilities: { 0: "Torrent", H: "Defiant" }
  },
  prinplup: {
    inherit: true,
    abilities: { 0: "Torrent", H: "Defiant" }
  },
  empoleon: {
    inherit: true,
    abilities: { 0: "Torrent", H: "Defiant" }
  }
};
//# sourceMappingURL=pokedex.js.map
