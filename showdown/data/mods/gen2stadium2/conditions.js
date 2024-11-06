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
      target.addVolatile("brnattackdrop");
    },
    onAfterMoveSelfPriority: 3,
    onAfterMoveSelf(pokemon) {
      residualdmg(this, pokemon);
    },
    onSwitchIn(pokemon) {
      pokemon.addVolatile("brnattackdrop");
    },
    onAfterSwitchInSelf(pokemon) {
      residualdmg(this, pokemon);
    }
  },
  par: {
    name: "par",
    effectType: "Status",
    onStart(target) {
      this.add("-status", target, "par");
      target.addVolatile("parspeeddrop");
    },
    onBeforeMovePriority: 2,
    onBeforeMove(pokemon) {
      if (this.randomChance(1, 4)) {
        this.add("cant", pokemon, "par");
        return false;
      }
    },
    onSwitchIn(pokemon) {
      pokemon.addVolatile("parspeeddrop");
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
      this.effectState.time = this.random(2, 5);
      if (target.removeVolatile("nightmare")) {
        this.add("-end", target, "Nightmare", "[silent]");
      }
    },
    onBeforeMovePriority: 10,
    onBeforeMove(pokemon, target, move) {
      pokemon.statusState.time--;
      if (pokemon.statusState.time <= 0) {
        pokemon.cureStatus();
        return;
      }
      this.add("cant", pokemon, "slp");
      if (move.sleepUsable) {
        return;
      }
      return false;
    }
  },
  confusion: {
    inherit: true,
    // Stadium 2 fixed Berserk Gene afflicting Confusion for 255 turns.
    onStart(target, source, sourceEffect) {
      if (sourceEffect && sourceEffect.id === "lockedmove") {
        this.add("-start", target, "confusion", "[silent]");
      } else {
        this.add("-start", target, "confusion");
      }
      this.effectState.time = this.random(2, 6);
    },
    onBeforeMove(pokemon, target, move) {
      pokemon.volatiles["confusion"].time--;
      if (!pokemon.volatiles["confusion"].time) {
        pokemon.removeVolatile("confusion");
        return;
      }
      this.add("-activate", pokemon, "confusion");
      if (this.randomChance(1, 2)) {
        return;
      }
      move = {
        basePower: 40,
        type: "???",
        baseMoveType: move.type,
        category: "Physical",
        willCrit: false,
        isConfusionSelfHit: true,
        noDamageVariance: true,
        flags: {},
        selfdestruct: move.selfdestruct
      };
      const damage = this.actions.getDamage(pokemon, pokemon, move);
      if (typeof damage !== "number")
        throw new Error("Confusion damage not dealt");
      this.directDamage(damage);
      return false;
    }
  },
  residualdmg: {
    name: "residualdmg",
    onStart(target) {
      target.volatiles["residualdmg"].counter = 0;
    },
    onAfterMoveSelfPriority: 100,
    onAfterMoveSelf(pokemon) {
      if (["brn", "psn", "tox"].includes(pokemon.status))
        pokemon.volatiles["residualdmg"].counter++;
    },
    onAfterSwitchInSelf(pokemon) {
      if (["brn", "psn", "tox"].includes(pokemon.status))
        pokemon.volatiles["residualdmg"].counter++;
    }
  }
};
function residualdmg(battle, pokemon) {
  if (pokemon.volatiles["residualdmg"]) {
    const residualDmg = battle.clampIntRange(
      Math.floor(pokemon.maxhp / 16) * pokemon.volatiles["residualdmg"].counter,
      1
    );
    battle.damage(residualDmg, pokemon);
    battle.hint("In Gen 2, Toxic's counter is retained through Baton Pass/Heal Bell and applies to PSN/BRN.", true);
  } else {
    battle.damage(battle.clampIntRange(Math.floor(pokemon.maxhp / 8), 1), pokemon);
  }
}
//# sourceMappingURL=conditions.js.map
