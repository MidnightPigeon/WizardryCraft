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
    name: "slp",
    effectType: "Status",
    onStart(target, source, sourceEffect) {
      if (sourceEffect && sourceEffect.effectType === "Move") {
        this.add("-status", target, "slp", "[from] move: " + sourceEffect.name);
      } else {
        this.add("-status", target, "slp");
      }
      this.effectState.time = this.random(2, 6);
      this.effectState.skippedTime = 0;
      if (target.removeVolatile("nightmare")) {
        this.add("-end", target, "Nightmare", "[silent]");
      }
    },
    onSwitchIn(target) {
      this.effectState.time += this.effectState.skippedTime;
      this.effectState.skippedTime = 0;
    },
    onBeforeMovePriority: 10,
    onBeforeMove(pokemon, target, move) {
      if (pokemon.hasAbility("earlybird")) {
        pokemon.statusState.time--;
      }
      pokemon.statusState.time--;
      if (pokemon.statusState.time <= 0) {
        pokemon.cureStatus();
        return;
      }
      this.add("cant", pokemon, "slp");
      if (move.sleepUsable) {
        this.effectState.skippedTime++;
        return;
      }
      this.effectState.skippedTime = 0;
      return false;
    }
  },
  frz: {
    inherit: true,
    onDamagingHit(damage, target, source, move) {
      if (this.dex.moves.get(move.id).type === "Fire" && move.category !== "Status") {
        target.cureStatus();
      }
    }
  },
  sandstorm: {
    inherit: true,
    onModifySpD() {
    }
  }
};
//# sourceMappingURL=conditions.js.map
