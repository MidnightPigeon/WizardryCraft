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
var moves_exports = {};
__export(moves_exports, {
  Moves: () => Moves
});
module.exports = __toCommonJS(moves_exports);
const Moves = {
  gastroacid: {
    inherit: true,
    condition: {
      // Ability suppression implemented in Pokemon.ignoringAbility() within sim/pokemon.js
      onStart(pokemon) {
        this.add("-endability", pokemon);
        this.singleEvent("End", pokemon.getAbility(), pokemon.abilityState, pokemon, pokemon, "gastroacid");
        if (pokemon.m.innates) {
          for (const innate of pokemon.m.innates) {
            pokemon.removeVolatile("ability" + innate);
          }
        }
      }
    }
  }
};
//# sourceMappingURL=moves.js.map
