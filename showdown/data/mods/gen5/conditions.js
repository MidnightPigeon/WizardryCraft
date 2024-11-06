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
  slp: {
    inherit: true,
    onSwitchIn(target) {
      this.effectState.time = this.effectState.startTime;
    }
  },
  partiallytrapped: {
    inherit: true,
    onStart(pokemon, source) {
      this.add("-activate", pokemon, "move: " + this.effectState.sourceEffect, "[of] " + source);
      this.effectState.boundDivisor = source.hasItem("bindingband") ? 8 : 16;
    },
    onResidual(pokemon) {
      const trapper = this.effectState.source;
      if (trapper && (!trapper.isActive || trapper.hp <= 0 || !trapper.activeTurns)) {
        delete pokemon.volatiles["partiallytrapped"];
        return;
      }
      this.damage(pokemon.baseMaxhp / this.effectState.boundDivisor);
    }
  },
  stall: {
    // Protect, Detect, Endure counter
    duration: 2,
    counterMax: 256,
    onStart() {
      this.effectState.counter = 2;
    },
    onStallMove() {
      const counter = this.effectState.counter || 1;
      if (counter >= 256) {
        return this.random() * 4294967296 < 1;
      }
      this.debug("Success chance: " + Math.round(100 / counter) + "%");
      return this.randomChance(1, counter);
    },
    onRestart() {
      if (this.effectState.counter < this.effect.counterMax) {
        this.effectState.counter *= 2;
      }
      this.effectState.duration = 2;
    }
  },
  gem: {
    duration: 1,
    affectsFainted: true,
    onBasePower(basePower, user, target, move) {
      this.debug("Gem Boost");
      return this.chainModify(1.5);
    }
  }
};
//# sourceMappingURL=conditions.js.map
