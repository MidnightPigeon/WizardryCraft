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
var abilities_exports = {};
__export(abilities_exports, {
  Abilities: () => Abilities
});
module.exports = __toCommonJS(abilities_exports);
const Abilities = {
  unaware: {
    inherit: true,
    onAnyModifyBoost(boosts, pokemon) {
      const unawareUser = this.effectState.target;
      if (unawareUser === pokemon)
        return;
      if (unawareUser === this.activePokemon && pokemon === this.activeTarget) {
        boosts["def"] = 0;
        boosts["spd"] = 0;
        boosts["evasion"] = 0;
      }
      if (pokemon === this.activePokemon && unawareUser === this.activeTarget) {
        boosts["atk"] = 0;
        boosts["def"] = 0;
        boosts["spa"] = 0;
        boosts["spd"] = 0;
        boosts["spe"] = 0;
        boosts["accuracy"] = 0;
      }
    }
  }
};
//# sourceMappingURL=abilities.js.map
