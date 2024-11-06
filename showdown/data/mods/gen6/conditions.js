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
  brn: {
    inherit: true,
    onResidual(pokemon) {
      this.damage(pokemon.baseMaxhp / 8);
    }
  },
  par: {
    inherit: true,
    onModifySpe(spe, pokemon) {
      spe = this.finalModify(spe);
      if (!pokemon.hasAbility("quickfeet")) {
        spe = Math.floor(spe * 25 / 100);
      }
      return spe;
    }
  },
  confusion: {
    inherit: true,
    onBeforeMove(pokemon) {
      pokemon.volatiles["confusion"].time--;
      if (!pokemon.volatiles["confusion"].time) {
        pokemon.removeVolatile("confusion");
        return;
      }
      this.add("-activate", pokemon, "confusion");
      if (this.randomChance(1, 2)) {
        return;
      }
      const damage = this.actions.getConfusionDamage(pokemon, 40);
      if (typeof damage !== "number")
        throw new Error("Confusion damage not dealt");
      this.damage(damage, pokemon, pokemon, {
        id: "confused",
        effectType: "Move",
        type: "???"
      });
      return false;
    }
  },
  choicelock: {
    inherit: true,
    onBeforeMove() {
    }
  }
};
//# sourceMappingURL=conditions.js.map
