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
var scripts_exports = {};
__export(scripts_exports, {
  Scripts: () => Scripts
});
module.exports = __toCommonJS(scripts_exports);
const Scripts = {
  inherit: "gen5",
  gen: 4,
  actions: {
    inherit: true,
    modifyDamage(baseDamage, pokemon, target, move, suppressMessages = false) {
      if (!move.type)
        move.type = "???";
      const type = move.type;
      if (pokemon.status === "brn" && baseDamage && move.category === "Physical" && !pokemon.hasAbility("guts")) {
        baseDamage = this.battle.modify(baseDamage, 0.5);
      }
      baseDamage = this.battle.runEvent("ModifyDamagePhase1", pokemon, target, move, baseDamage);
      if (move.spreadHit) {
        const spreadModifier = move.spreadModifier || (this.battle.gameType === "freeforall" ? 0.5 : 0.75);
        this.battle.debug("Spread modifier: " + spreadModifier);
        baseDamage = this.battle.modify(baseDamage, spreadModifier);
      }
      baseDamage = this.battle.runEvent("WeatherModifyDamage", pokemon, target, move, baseDamage);
      if (this.battle.gen === 3 && move.category === "Physical" && !Math.floor(baseDamage)) {
        baseDamage = 1;
      }
      baseDamage += 2;
      const isCrit = target.getMoveHitData(move).crit;
      if (isCrit) {
        baseDamage = this.battle.modify(baseDamage, move.critModifier || 2);
      }
      baseDamage = Math.floor(this.battle.runEvent("ModifyDamagePhase2", pokemon, target, move, baseDamage));
      baseDamage = this.battle.randomizer(baseDamage);
      if (type !== "???") {
        let stab = 1;
        if (move.forceSTAB || pokemon.hasType(type)) {
          stab = 1.5;
        }
        stab = this.battle.runEvent("ModifySTAB", pokemon, target, move, stab);
        baseDamage = this.battle.modify(baseDamage, stab);
      }
      let typeMod = target.runEffectiveness(move);
      typeMod = this.battle.clampIntRange(typeMod, -6, 6);
      target.getMoveHitData(move).typeMod = typeMod;
      if (typeMod > 0) {
        if (!suppressMessages)
          this.battle.add("-supereffective", target);
        for (let i = 0; i < typeMod; i++) {
          baseDamage *= 2;
        }
      }
      if (typeMod < 0) {
        if (!suppressMessages)
          this.battle.add("-resisted", target);
        for (let i = 0; i > typeMod; i--) {
          baseDamage = Math.floor(baseDamage / 2);
        }
      }
      if (isCrit && !suppressMessages)
        this.battle.add("-crit", target);
      baseDamage = this.battle.runEvent("ModifyDamage", pokemon, target, move, baseDamage);
      if (!Math.floor(baseDamage)) {
        return 1;
      }
      return Math.floor(baseDamage);
    },
    hitStepInvulnerabilityEvent(targets, pokemon, move) {
      const hitResults = this.battle.runEvent("Invulnerability", targets, pokemon, move);
      for (const [i, target] of targets.entries()) {
        if (hitResults[i] === false) {
          if (!move.spreadHit)
            this.battle.attrLastMove("[miss]");
          this.battle.add("-miss", pokemon, target);
        }
      }
      return hitResults;
    },
    hitStepAccuracy(targets, pokemon, move) {
      const hitResults = [];
      for (const [i, target] of targets.entries()) {
        this.battle.activeTarget = target;
        let accuracy = move.accuracy;
        if (move.ohko) {
          if (!target.isSemiInvulnerable()) {
            if (pokemon.level < target.level) {
              this.battle.add("-immune", target, "[ohko]");
              hitResults[i] = false;
              continue;
            }
            accuracy = 30 + pokemon.level - target.level;
          }
        } else {
          const boostTable = [1, 4 / 3, 5 / 3, 2, 7 / 3, 8 / 3, 3];
          let boosts;
          let boost;
          if (accuracy !== true) {
            if (!move.ignoreAccuracy) {
              boosts = this.battle.runEvent("ModifyBoost", pokemon, null, null, { ...pokemon.boosts });
              boost = this.battle.clampIntRange(boosts["accuracy"], -6, 6);
              if (boost > 0) {
                accuracy *= boostTable[boost];
              } else {
                accuracy /= boostTable[-boost];
              }
            }
            if (!move.ignoreEvasion) {
              boosts = this.battle.runEvent("ModifyBoost", target, null, null, { ...target.boosts });
              boost = this.battle.clampIntRange(boosts["evasion"], -6, 6);
              if (boost > 0) {
                accuracy /= boostTable[boost];
              } else if (boost < 0) {
                accuracy *= boostTable[-boost];
              }
            }
          }
          accuracy = this.battle.runEvent("ModifyAccuracy", target, pokemon, move, accuracy);
        }
        if (move.alwaysHit) {
          accuracy = true;
        } else {
          accuracy = this.battle.runEvent("Accuracy", target, pokemon, move, accuracy);
        }
        if (accuracy !== true && !this.battle.randomChance(accuracy, 100)) {
          if (!move.spreadHit)
            this.battle.attrLastMove("[miss]");
          this.battle.add("-miss", pokemon, target);
          hitResults[i] = false;
          continue;
        }
        hitResults[i] = true;
      }
      return hitResults;
    },
    calcRecoilDamage(damageDealt, move) {
      return this.battle.clampIntRange(Math.floor(damageDealt * move.recoil[0] / move.recoil[1]), 1);
    }
  }
};
//# sourceMappingURL=scripts.js.map
