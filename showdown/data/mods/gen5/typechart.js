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
var typechart_exports = {};
__export(typechart_exports, {
  TypeChart: () => TypeChart
});
module.exports = __toCommonJS(typechart_exports);
const TypeChart = {
  electric: {
    inherit: true,
    damageTaken: {
      Bug: 0,
      Dark: 0,
      Dragon: 0,
      Electric: 2,
      Fighting: 0,
      Fire: 0,
      Flying: 2,
      Ghost: 0,
      Grass: 0,
      Ground: 1,
      Ice: 0,
      Normal: 0,
      Poison: 0,
      Psychic: 0,
      Rock: 0,
      Steel: 2,
      Water: 0
    }
  },
  ghost: {
    inherit: true,
    damageTaken: {
      Bug: 2,
      Dark: 1,
      Dragon: 0,
      Electric: 0,
      Fighting: 3,
      Fire: 0,
      Flying: 0,
      Ghost: 1,
      Grass: 0,
      Ground: 0,
      Ice: 0,
      Normal: 3,
      Poison: 2,
      Psychic: 0,
      Rock: 0,
      Steel: 0,
      Water: 0
    }
  },
  grass: {
    inherit: true,
    damageTaken: {
      Bug: 1,
      Dark: 0,
      Dragon: 0,
      Electric: 2,
      Fighting: 0,
      Fire: 1,
      Flying: 1,
      Ghost: 0,
      Grass: 2,
      Ground: 2,
      Ice: 1,
      Normal: 0,
      Poison: 1,
      Psychic: 0,
      Rock: 0,
      Steel: 0,
      Water: 2
    }
  },
  steel: {
    inherit: true,
    damageTaken: {
      psn: 3,
      tox: 3,
      sandstorm: 3,
      Bug: 2,
      Dark: 2,
      Dragon: 2,
      Electric: 0,
      Fighting: 1,
      Fire: 1,
      Flying: 2,
      Ghost: 2,
      Grass: 2,
      Ground: 1,
      Ice: 2,
      Normal: 2,
      Poison: 3,
      Psychic: 2,
      Rock: 2,
      Steel: 2,
      Water: 0
    }
  },
  fairy: {
    inherit: true,
    isNonstandard: "Future"
  }
};
//# sourceMappingURL=typechart.js.map
