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
  gen: 9,
  actions: {
    getDamage(source, target, move, suppressMessages) {
      if (typeof move === "string")
        move = this.dex.getActiveMove(move);
      if (typeof move === "number") {
        const basePower2 = move;
        move = new Dex.Move({
          basePower: basePower2,
          type: "???",
          category: "Physical",
          willCrit: false
        });
        move.hit = 0;
      }
      if (!move.ignoreImmunity || move.ignoreImmunity !== true && !move.ignoreImmunity[move.type]) {
        if (!target.runImmunity(move.type, !suppressMessages)) {
          return false;
        }
      }
      if (move.ohko)
        return target.maxhp;
      if (move.damageCallback)
        return move.damageCallback.call(this.battle, source, target);
      if (move.damage === "level") {
        return source.level;
      } else if (move.damage) {
        return move.damage;
      }
      let basePower = move.basePower;
      if (move.basePowerCallback) {
        basePower = move.basePowerCallback.call(this.battle, source, target, move);
      }
      if (!basePower)
        return basePower === 0 ? void 0 : basePower;
      basePower = this.battle.clampIntRange(basePower, 1);
      let critMult;
      let critRatio = this.battle.runEvent("ModifyCritRatio", source, target, move, move.critRatio || 0);
      if (this.battle.gen <= 5) {
        critRatio = this.battle.clampIntRange(critRatio, 0, 5);
        critMult = [0, 16, 8, 4, 3, 2];
      } else {
        critRatio = this.battle.clampIntRange(critRatio, 0, 4);
        if (this.battle.gen === 6) {
          critMult = [0, 16, 8, 2, 1];
        } else {
          critMult = [0, 24, 8, 2, 1];
        }
      }
      const moveHit = target.getMoveHitData(move);
      moveHit.crit = move.willCrit || false;
      if (move.willCrit === void 0) {
        if (critRatio) {
          moveHit.crit = this.battle.randomChance(1, critMult[critRatio]);
        }
      }
      if (moveHit.crit) {
        moveHit.crit = this.battle.runEvent("CriticalHit", target, null, move);
      }
      basePower = this.battle.runEvent("BasePower", source, target, move, basePower, true);
      if (!basePower)
        return 0;
      basePower = this.battle.clampIntRange(basePower, 1);
      if (!source.volatiles["dynamax"] && move.isMax || move.isMax && this.dex.moves.get(move.baseMove).isMax) {
        basePower = 0;
      }
      const level = source.level;
      const attacker = move.overrideOffensivePokemon === "target" ? target : source;
      const defender = move.overrideDefensivePokemon === "source" ? source : target;
      const isPhysical = move.category === "Physical";
      const defenseStat = move.overrideDefensiveStat || (isPhysical ? "def" : "spd");
      const statTable = { atk: "Atk", def: "Def", spa: "SpA", spd: "SpD", spe: "Spe" };
      let maxAttack = 0;
      let defBoosts = defender.boosts[defenseStat];
      let ignoreNegativeOffensive = !!move.ignoreNegativeOffensive;
      let ignorePositiveDefensive = !!move.ignorePositiveDefensive;
      if (moveHit.crit) {
        ignoreNegativeOffensive = true;
        ignorePositiveDefensive = true;
      }
      const ignoreDefensive = !!(move.ignoreDefensive || ignorePositiveDefensive && defBoosts > 0);
      if (ignoreDefensive) {
        this.battle.debug("Negating (sp)def boost/penalty.");
        defBoosts = 0;
      }
      let attack = 0;
      for (const attackStat in statTable) {
        let atkBoosts = attacker.boosts[attackStat];
        const ignoreOffensive = !!(move.ignoreOffensive || ignoreNegativeOffensive && atkBoosts < 0);
        if (ignoreOffensive) {
          this.battle.debug("Negating (sp)atk boost/penalty.");
          atkBoosts = 0;
        }
        attack = attacker.calculateStat(attackStat, atkBoosts, 1, source);
        attack = this.battle.runEvent("Modify" + statTable[attackStat], source, target, move, attack);
        if (attack > maxAttack)
          maxAttack = attack;
      }
      let defense = defender.calculateStat(defenseStat, defBoosts, 1, target);
      defense = this.battle.runEvent("Modify" + statTable[defenseStat], target, source, move, defense);
      if (this.battle.gen <= 4 && ["explosion", "selfdestruct"].includes(move.id) && defenseStat === "def") {
        defense = this.battle.clampIntRange(Math.floor(defense / 2), 1);
      }
      const tr = this.battle.trunc;
      const baseDamage = tr(tr(tr(tr(2 * level / 5 + 2) * basePower * maxAttack) / defense) / 50);
      return this.modifyDamage(baseDamage, source, target, move, suppressMessages);
    }
  }
};
//# sourceMappingURL=scripts.js.map
