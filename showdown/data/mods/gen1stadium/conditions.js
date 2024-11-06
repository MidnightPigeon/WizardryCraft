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
    name: "brn",
    effectType: "Status",
    onStart(target) {
      this.add("-status", target, "brn");
    },
    onAfterMoveSelfPriority: 2,
    onAfterMoveSelf(pokemon) {
      this.damage(this.clampIntRange(Math.floor(pokemon.maxhp / 16), 1));
    },
    onAfterSwitchInSelf(pokemon) {
      this.damage(this.clampIntRange(Math.floor(pokemon.maxhp / 16), 1));
    }
  },
  par: {
    name: "par",
    effectType: "Status",
    onStart(target) {
      this.add("-status", target, "par");
    },
    onBeforeMovePriority: 2,
    onBeforeMove(pokemon) {
      if (this.randomChance(63, 256)) {
        this.add("cant", pokemon, "par");
        pokemon.removeVolatile("bide");
        pokemon.removeVolatile("lockedmove");
        pokemon.removeVolatile("twoturnmove");
        pokemon.removeVolatile("invulnerability");
        pokemon.removeVolatile("partialtrappinglock");
        return false;
      }
    }
  },
  slp: {
    name: "slp",
    effectType: "Status",
    onStart(target, source, sourceEffect) {
      if (sourceEffect && sourceEffect.effectType === "Move") {
        this.add("-status", target, "slp", "[from] move: " + sourceEffect.name);
      } else {
        this.add("-status", target, "slp");
      }
      this.effectState.startTime = this.random(1, 4);
      this.effectState.time = this.effectState.startTime;
      if (target.removeVolatile("nightmare")) {
        this.add("-end", target, "Nightmare", "[silent]");
      }
    },
    onBeforeMovePriority: 2,
    onBeforeMove(pokemon, target, move) {
      pokemon.statusState.time--;
      this.add("cant", pokemon, "slp");
      pokemon.lastMove = null;
      return false;
    },
    onAfterMoveSelf(pokemon) {
      if (pokemon.statusState.time <= 0)
        pokemon.cureStatus();
    }
  },
  frz: {
    name: "frz",
    effectType: "Status",
    onStart(target) {
      this.add("-status", target, "frz");
    },
    onBeforeMovePriority: 2,
    onBeforeMove(pokemon, target, move) {
      this.add("cant", pokemon, "frz");
      pokemon.lastMove = null;
      return false;
    },
    onHit(target, source, move) {
      if (move.type === "Fire" && move.category !== "Status") {
        target.cureStatus();
      }
    }
  },
  psn: {
    name: "psn",
    effectType: "Status",
    onStart(target) {
      this.add("-status", target, "psn");
    },
    onAfterMoveSelfPriority: 2,
    onAfterMoveSelf(pokemon) {
      this.damage(this.clampIntRange(Math.floor(pokemon.maxhp / 16), 1));
    },
    onAfterSwitchInSelf(pokemon) {
      this.damage(this.clampIntRange(Math.floor(pokemon.maxhp / 16), 1));
    }
  },
  confusion: {
    inherit: true,
    onStart(target) {
      this.add("-start", target, "confusion");
      this.effectState.time = this.random(2, 6);
    }
  },
  flinch: {
    inherit: true,
    onStart() {
    }
  },
  partiallytrapped: {
    name: "partiallytrapped",
    duration: 2,
    onBeforeMovePriority: 1,
    onStart(target, source, effect) {
      this.add("-activate", target, "move: " + effect, "[of] " + source);
    },
    onBeforeMove(pokemon) {
      if (this.effectState.source && (!this.effectState.source.isActive || this.effectState.source.hp <= 0)) {
        pokemon.removeVolatile("partiallytrapped");
        return;
      }
      this.add("cant", pokemon, "partiallytrapped");
      return false;
    },
    onEnd(pokemon) {
      this.add("-end", pokemon, this.effectState.sourceEffect, "[partiallytrapped]");
    }
  }
};
//# sourceMappingURL=conditions.js.map
