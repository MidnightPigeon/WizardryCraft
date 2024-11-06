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
    onBeforeMove(pokemon, target, move) {
      if (this.effectState.timerDecreased !== this.turn) {
        this.effectState.timerDecreased = this.turn;
        if (pokemon.hasAbility("earlybird")) {
          pokemon.statusState.time--;
        }
        pokemon.statusState.time--;
        if (pokemon.statusState.time <= 0) {
          pokemon.cureStatus();
          return;
        }
        this.add("cant", pokemon, "slp");
      }
      if (move.sleepUsable)
        return;
      return false;
    }
  },
  frz: {
    inherit: true,
    onBeforeMove(pokemon, target, move) {
      if (move.flags["defrost"])
        return;
      if (this.effectState.durationRolled !== this.turn && this.randomChance(1, 5)) {
        pokemon.cureStatus();
        return;
      }
      if (this.effectState.durationRolled !== this.turn) {
        this.effectState.durationRolled = this.turn;
        this.add("cant", pokemon, "frz");
      }
      return false;
    }
  },
  confusion: {
    inherit: true,
    onBeforeMove(pokemon) {
      if (this.effectState.timerDecreased !== this.turn) {
        this.effectState.timerDecreased = this.turn;
        pokemon.volatiles.confusion.time--;
        if (!pokemon.volatiles.confusion.time) {
          pokemon.removeVolatile("confusion");
          return;
        }
      }
      this.add("-activate", pokemon, "confusion");
      if (!this.randomChance(1, 3)) {
        return;
      }
      this.activeTarget = pokemon;
      const damage = this.actions.getDamage(pokemon, pokemon, 40);
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
  gem: {
    inherit: true,
    onBeforeMove(pokemon) {
      if (pokemon.moveThisTurn)
        pokemon.removeVolatile("gem");
    }
  }
};
//# sourceMappingURL=conditions.js.map
