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
var conditions_exports = {};
__export(conditions_exports, {
  Conditions: () => Conditions
});
module.exports = __toCommonJS(conditions_exports);
const Conditions = {
  deltastream: {
    inherit: true,
    onEffectiveness(typeMod, target, type, move) {
      if (move && move.effectType === "Move" && move.category !== "Status" && type === "Normal" && typeMod > 0) {
        this.add("-fieldactivate", "Delta Stream");
        return 0;
      }
    }
  },
  arceus: {
    inherit: true,
    onType(types, pokemon) {
      if (pokemon.transformed || pokemon.ability !== "multitype" && this.gen >= 8)
        return types;
      let type = "Normal";
      if (pokemon.ability === "multitype") {
        type = pokemon.getItem().onPlate;
        if (!type) {
          type = "Normal";
        }
      }
      type = type.replace(/(Ghost|Fairy)/g, "Psychic").replace(/Bug/g, "Grass").replace(/Ice/g, "Water").replace(/(Rock|Ground)/g, "Fighting").replace(/Flying/g, "Normal").replace(/Poison/g, "Dark");
      return [type];
    }
  },
  silvally: {
    inherit: true,
    onType(types, pokemon) {
      if (pokemon.transformed || pokemon.ability !== "rkssystem" && this.gen >= 8)
        return types;
      let type = "Normal";
      if (pokemon.ability === "rkssystem") {
        type = pokemon.getItem().onMemory;
        if (!type) {
          type = "Normal";
        }
      }
      type = type.replace(/(Ghost|Fairy)/g, "Psychic").replace(/Bug/g, "Grass").replace(/Ice/g, "Water").replace(/(Rock|Ground)/g, "Fighting").replace(/Flying/g, "Normal").replace(/Poison/g, "Dark");
      return [type];
    }
  }
};
//# sourceMappingURL=conditions.js.map
