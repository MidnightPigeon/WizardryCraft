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
const SKIP_LASTDAMAGE = /* @__PURE__ */ new Set([
  "confuseray",
  "conversion",
  "counter",
  "focusenergy",
  "glare",
  "haze",
  "leechseed",
  "lightscreen",
  "mimic",
  "mist",
  "poisongas",
  "poisonpowder",
  "recover",
  "reflect",
  "rest",
  "softboiled",
  "splash",
  "stunspore",
  "substitute",
  "supersonic",
  "teleport",
  "thunderwave",
  "toxic",
  "transform"
]);
const Scripts = {
  inherit: "gen1",
  gen: 1,
  // BattlePokemon scripts. Stadium shares gen 1 code but it fixes some problems with it.
  pokemon: {
    inherit: true,
    // This is run on Stadium after boosts and status changes.
    recalculateStats() {
      let statName;
      for (statName in this.storedStats) {
        let stat = this.species.baseStats[statName];
        stat = Math.floor(
          Math.floor(
            2 * stat + this.set.ivs[statName] + Math.floor(this.set.evs[statName] / 4)
          ) * this.level / 100 + 5
        );
        this.baseStoredStats[statName] = this.storedStats[statName] = Math.floor(stat);
        this.modifiedStats[statName] = Math.floor(stat);
        if (this.status === "par" && statName === "spe")
          this.modifyStat("spe", 0.25);
        if (this.status === "brn" && statName === "atk")
          this.modifyStat("atk", 0.5);
        if (this.boosts[statName] !== 0) {
          if (this.boosts[statName] >= 0) {
            this.modifyStat(statName, [1, 1.5, 2, 2.5, 3, 3.5, 4][this.boosts[statName]]);
          } else {
            this.modifyStat(statName, [100, 66, 50, 40, 33, 28, 25][-this.boosts[statName]] / 100);
          }
        }
        if (this.modifiedStats[statName] > 999) {
          this.modifiedStats[statName] = 999;
        }
      }
    },
    // Stadium's fixed boosting function.
    boostBy(boost) {
      let changed = false;
      let i;
      for (i in boost) {
        let delta = boost[i];
        if (delta === void 0)
          continue;
        this.boosts[i] += delta;
        if (this.boosts[i] > 6) {
          delta -= this.boosts[i] - 6;
          this.boosts[i] = 6;
        }
        if (this.boosts[i] < -6) {
          delta -= this.boosts[i] - -6;
          this.boosts[i] = -6;
        }
        if (delta)
          changed = true;
      }
      this.recalculateStats();
      return changed;
    },
    // Remove stat recalculation logic from gen 1
    clearBoosts() {
      let i;
      for (i in this.boosts) {
        this.boosts[i] = 0;
      }
    }
  },
  actions: {
    inherit: true,
    runMove(moveOrMoveName, pokemon, targetLoc, sourceEffect) {
      const move = this.dex.getActiveMove(moveOrMoveName);
      const target = this.battle.getTarget(pokemon, move, targetLoc);
      if (target?.subFainted)
        target.subFainted = null;
      this.battle.setActiveMove(move, pokemon, target);
      if (pokemon.moveThisTurn || !this.battle.runEvent("BeforeMove", pokemon, target, move)) {
        this.battle.debug("" + pokemon.fullname + " move interrupted; movedThisTurn: " + pokemon.moveThisTurn);
        this.battle.clearActiveMove(true);
        this.battle.runEvent("AfterMoveSelf", pokemon, target, move);
        return;
      }
      if (move.beforeMoveCallback) {
        if (move.beforeMoveCallback.call(this.battle, pokemon, target, move)) {
          this.battle.clearActiveMove(true);
          return;
        }
      }
      let lockedMove = this.battle.runEvent("LockMove", pokemon);
      if (lockedMove === true)
        lockedMove = false;
      if (!lockedMove && (!pokemon.volatiles["partialtrappinglock"] || pokemon.volatiles["partialtrappinglock"].locked !== target)) {
        pokemon.deductPP(move, null, target);
      } else {
        sourceEffect = move;
      }
      this.battle.actions.useMove(move, pokemon, target, sourceEffect);
    },
    // This function deals with AfterMoveSelf events.
    // This leads with partial trapping moves shenanigans after the move has been used.
    useMove(moveOrMoveName, pokemon, target, sourceEffect) {
      const moveResult = this.useMoveInner(moveOrMoveName, pokemon, target, sourceEffect);
      if (!sourceEffect && this.battle.effect.id)
        sourceEffect = this.battle.effect;
      const baseMove = this.battle.dex.moves.get(moveOrMoveName);
      let move = this.battle.dex.getActiveMove(baseMove);
      if (target === void 0)
        target = this.battle.getRandomTarget(pokemon, move);
      if (move.target === "self") {
        target = pokemon;
      }
      if (sourceEffect)
        move.sourceEffect = sourceEffect.id;
      this.battle.singleEvent("ModifyMove", move, null, pokemon, target, move, move);
      if (baseMove.target !== move.target) {
        target = this.battle.getRandomTarget(pokemon, move);
      }
      move = this.battle.runEvent("ModifyMove", pokemon, target, move, move);
      if (baseMove.target !== move.target) {
        target = this.battle.getRandomTarget(pokemon, move);
      }
      if (move.id !== "metronome") {
        if (move.id !== "mirrormove" || (!pokemon.side.foe.active[0]?.lastMove || pokemon.side.foe.active[0].lastMove?.id === "mirrormove")) {
          pokemon.side.lastMove = move;
          pokemon.lastMove = move;
          this.battle.singleEvent("AfterMove", move, null, pokemon, target, move);
          if (target && target.hp <= 0) {
            delete pokemon.volatiles["partialtrappinglock"];
          } else {
            this.battle.runEvent("AfterMoveSelf", pokemon, target, move);
          }
          if (pokemon.volatiles["mustrecharge"])
            this.battle.add("-mustrecharge", pokemon);
          if (move.volatileStatus === "partiallytrapped" && target && target.hp > 0) {
            target.removeVolatile("mustrecharge");
            if (pokemon.volatiles["partialtrappinglock"] && target.volatiles["partiallytrapped"]) {
              if (!pokemon.volatiles["partialtrappinglock"].locked) {
                pokemon.volatiles["partialtrappinglock"].locked = target;
              }
            }
          }
        }
      }
      return moveResult;
    },
    // This is the function that actually uses the move, running ModifyMove events.
    // It uses the move and then deals with the effects after the move.
    useMoveInner(moveOrMoveName, pokemon, target, sourceEffect) {
      if (!sourceEffect && this.battle.effect.id)
        sourceEffect = this.battle.effect;
      const baseMove = this.battle.dex.moves.get(moveOrMoveName);
      let move = this.battle.dex.getActiveMove(baseMove);
      if (target === void 0)
        target = this.battle.getRandomTarget(pokemon, move);
      if (move.target === "self") {
        target = pokemon;
      }
      if (sourceEffect)
        move.sourceEffect = sourceEffect.id;
      this.battle.setActiveMove(move, pokemon, target);
      this.battle.singleEvent("ModifyMove", move, null, pokemon, target, move, move);
      if (baseMove.target !== move.target) {
        target = this.battle.getRandomTarget(pokemon, move);
      }
      move = this.battle.runEvent("ModifyMove", pokemon, target, move, move);
      if (baseMove.target !== move.target) {
        target = this.battle.getRandomTarget(pokemon, move);
        this.battle.debug("not a gen 1 mechanic");
      }
      if (!move)
        return false;
      let attrs = "";
      if (pokemon.fainted) {
        return false;
      }
      if (sourceEffect)
        attrs += "|[from]" + this.battle.dex.conditions.get(sourceEffect);
      this.battle.addMove("move", pokemon, move.name, target + attrs);
      if (!this.battle.singleEvent("Try", move, null, pokemon, target, move)) {
        return true;
      }
      if (!this.battle.singleEvent("TryMove", move, null, pokemon, target, move) || !this.battle.runEvent("TryMove", pokemon, target, move)) {
        return true;
      }
      if (move.ignoreImmunity === void 0) {
        move.ignoreImmunity = move.category === "Status";
      }
      let damage = false;
      if (!target || target.fainted) {
        this.battle.attrLastMove("[notarget]");
        this.battle.add("-notarget");
        return true;
      }
      if (!SKIP_LASTDAMAGE.has(move.id))
        this.battle.lastDamage = 0;
      damage = this.tryMoveHit(target, pokemon, move);
      if (damage === false) {
        this.battle.singleEvent("MoveFail", move, null, target, pokemon, move);
        return true;
      }
      if (!move.negateSecondary) {
        this.battle.singleEvent("AfterMoveSecondarySelf", move, null, pokemon, target, move);
        this.battle.runEvent("AfterMoveSecondarySelf", pokemon, target, move);
      }
      return true;
    },
    tryMoveHit(target, pokemon, move) {
      let damage = 0;
      let hitResult = this.battle.runEvent("Invulnerability", target, pokemon, move);
      if (hitResult === false) {
        this.battle.attrLastMove("[miss]");
        this.battle.add("-miss", pokemon);
        if (move.selfdestruct) {
          this.battle.faint(pokemon, pokemon, move);
        }
        return false;
      }
      if ((!move.ignoreImmunity || move.ignoreImmunity !== true && !move.ignoreImmunity[move.type]) && !target.runImmunity(move.type, true)) {
        if (move.selfdestruct) {
          this.battle.faint(pokemon, pokemon, move);
        }
        return false;
      }
      hitResult = this.battle.singleEvent("TryImmunity", move, null, target, pokemon, move);
      if (hitResult === false) {
        this.battle.add("-immune", target);
        return false;
      }
      let accuracy = move.accuracy;
      if (pokemon.volatiles["partialtrappinglock"]) {
        if (move.volatileStatus === "partiallytrapped" && target === pokemon.volatiles["partialtrappinglock"].locked) {
          accuracy = true;
        } else if (pokemon.volatiles["partialtrappinglock"].locked !== target) {
          delete pokemon.volatiles["partialtrappinglock"];
          return false;
        }
      }
      if (move.ohko) {
        if (target.speed > pokemon.speed) {
          this.battle.add("-immune", target, "[ohko]");
          return false;
        }
      }
      const boostTable = [1 / 3, 0.36, 0.43, 0.5, 0.66, 0.75, 1, 1.33, 1.66, 2, 2.33, 2.66, 3];
      if (accuracy !== true) {
        accuracy = Math.floor(accuracy * 255 / 100);
        if (!move.ignoreAccuracy) {
          accuracy = Math.floor(accuracy * boostTable[pokemon.boosts.accuracy + 6]);
        }
        if (!move.ignoreEvasion) {
          accuracy = Math.floor(accuracy * boostTable[-target.boosts.evasion + 6]);
        }
        accuracy = Math.min(accuracy, 255);
      }
      accuracy = this.battle.runEvent("Accuracy", target, pokemon, move, accuracy);
      if (accuracy !== true && !this.battle.randomChance(accuracy + 1, 256)) {
        this.battle.attrLastMove("[miss]");
        this.battle.add("-miss", pokemon);
        damage = false;
        this.battle.lastDamage = 0;
      }
      if (damage !== false) {
        if (move.multihit) {
          let hits = move.multihit;
          if (Array.isArray(hits)) {
            if (hits[0] === 2 && hits[1] === 5) {
              hits = this.battle.sample([2, 2, 2, 3, 3, 3, 4, 5]);
            } else {
              hits = this.battle.random(hits[0], hits[1] + 1);
            }
          }
          hits = Math.floor(hits);
          let moveDamage = 0;
          let i;
          for (i = 0; i < hits && target.hp && pokemon.hp; i++) {
            move.hit = i + 1;
            if (move.hit === hits)
              move.lastHit = true;
            moveDamage = this.moveHit(target, pokemon, move);
            if (moveDamage === false)
              break;
            damage = moveDamage || 0;
            if (i === 0)
              move.damage = damage;
            if (target.subFainted) {
              i++;
              break;
            }
          }
          move.damage = null;
          if (i === 0)
            return 1;
          this.battle.add("-hitcount", target, i);
        } else {
          damage = this.moveHit(target, pokemon, move);
        }
      }
      if (move.category !== "Status")
        target.gotAttacked(move, damage, pokemon);
      if (move.selfdestruct) {
        this.battle.faint(pokemon, pokemon, move);
      }
      if (damage === false) {
        delete pokemon.volatiles["partialtrappinglock"];
        return false;
      }
      if (move.ohko)
        this.battle.add("-ohko");
      if (!move.negateSecondary) {
        this.battle.singleEvent("AfterMoveSecondary", move, null, target, pokemon, move);
        this.battle.runEvent("AfterMoveSecondary", target, pokemon, move);
      }
      return damage;
    },
    moveHit(target, pokemon, moveOrMoveName, moveData, isSecondary, isSelf) {
      let damage = 0;
      const move = this.dex.getActiveMove(moveOrMoveName);
      if (!isSecondary && !isSelf)
        this.battle.setActiveMove(move, pokemon, target);
      let hitResult = true;
      if (!moveData)
        moveData = move;
      if (move.ignoreImmunity === void 0) {
        move.ignoreImmunity = move.category === "Status";
      }
      if (target) {
        hitResult = this.battle.singleEvent("TryHit", moveData, {}, target, pokemon, move);
        const targetHadSub = !!target.volatiles["substitute"];
        if (targetHadSub && moveData.volatileStatus && moveData.volatileStatus === "partiallytrapped") {
          target.addVolatile(moveData.volatileStatus, pokemon, move);
          if (!pokemon.volatiles["partialtrappinglock"] || pokemon.volatiles["partialtrappinglock"].duration > 1) {
            target.volatiles[moveData.volatileStatus].duration = 2;
          }
        }
        if (!hitResult) {
          if (hitResult === false)
            this.battle.add("-fail", target);
          return false;
        }
        if (!isSelf && !isSecondary) {
          hitResult = this.battle.runEvent("TryHit", target, pokemon, move);
          if (!hitResult) {
            if (hitResult === false)
              this.battle.add("-fail", target);
            if (hitResult !== 0) {
              return false;
            }
          }
          if (!this.battle.runEvent("TryFieldHit", target, pokemon, move)) {
            return false;
          }
        } else if (isSecondary && !moveData.self) {
          hitResult = this.battle.runEvent("TrySecondaryHit", target, pokemon, moveData);
        }
        if (hitResult === 0) {
          target = null;
        } else if (!hitResult) {
          if (hitResult === false)
            this.battle.add("-fail", target);
          return false;
        }
      }
      if (target) {
        let didSomething = false;
        damage = this.getDamage(pokemon, target, moveData);
        if (damage && damage > target.hp) {
          damage = target.hp;
        }
        if ((damage || damage === 0) && !target.fainted) {
          damage = this.battle.damage(damage, target, pokemon, move);
          if (!(damage || damage === 0))
            return false;
          didSomething = true;
        } else if (damage === false && typeof hitResult === "undefined") {
          this.battle.add("-fail", target);
        }
        if (damage === false || damage === null) {
          return false;
        }
        if (moveData.boosts && !target.fainted) {
          this.battle.boost(moveData.boosts, target, pokemon, move);
        }
        if (moveData.heal && !target.fainted) {
          const d = target.heal(Math.floor(target.maxhp * moveData.heal[0] / moveData.heal[1]));
          if (!d) {
            this.battle.add("-fail", target);
            return false;
          }
          this.battle.add("-heal", target, target.getHealth);
          didSomething = true;
        }
        if (moveData.status) {
          if (!target.status) {
            target.setStatus(moveData.status, pokemon, move);
            target.recalculateStats();
          } else if (!isSecondary) {
            if (target.status === moveData.status) {
              this.battle.add("-fail", target, target.status);
            } else {
              this.battle.add("-fail", target);
            }
          }
          didSomething = true;
        }
        if (moveData.forceStatus) {
          if (target.setStatus(moveData.forceStatus, pokemon, move)) {
            target.recalculateStats();
            didSomething = true;
          }
        }
        if (moveData.volatileStatus) {
          if (target.addVolatile(moveData.volatileStatus, pokemon, move)) {
            didSomething = true;
          }
        }
        if (moveData.sideCondition) {
          if (target.side.addSideCondition(moveData.sideCondition, pokemon, move)) {
            didSomething = true;
          }
        }
        if (moveData.pseudoWeather) {
          if (this.battle.field.addPseudoWeather(moveData.pseudoWeather, pokemon, move)) {
            didSomething = true;
          }
        }
        hitResult = this.battle.singleEvent("Hit", moveData, {}, target, pokemon, move);
        if (!isSelf && !isSecondary) {
          this.battle.runEvent("Hit", target, pokemon, move);
        }
        if (!hitResult && !didSomething) {
          if (hitResult === false)
            this.battle.add("-fail", target);
          return false;
        }
      }
      if (moveData.self) {
        this.moveHit(pokemon, pokemon, move, moveData.self, isSecondary, true);
      }
      if (pokemon.volatiles["partialtrappinglock"]) {
        pokemon.volatiles["partialtrappinglock"].damage = this.battle.lastDamage;
      }
      if (moveData.secondaries && target && target.hp > 0) {
        for (const secondary of moveData.secondaries) {
          if (!move.multihit || move.lastHit) {
            if (!(secondary.status && ["par", "brn", "frz"].includes(secondary.status) && target.hasType(move.type))) {
              const effectChance = Math.floor((secondary.chance || 100) * 255 / 100);
              if (typeof secondary.chance === "undefined" || this.battle.randomChance(effectChance + 1, 256)) {
                this.moveHit(target, pokemon, move, secondary, true, isSelf);
              }
            }
          }
        }
      }
      if (move.selfSwitch && pokemon.hp) {
        pokemon.switchFlag = move.selfSwitch === true ? true : this.dex.toID(move.selfSwitch);
      }
      return damage;
    },
    getDamage(source, target, move, suppressMessages) {
      if (typeof move === "string") {
        move = this.dex.getActiveMove(move);
      } else if (typeof move === "number") {
        move = {
          basePower: move,
          type: "???",
          category: "Physical",
          willCrit: false,
          flags: {}
        };
      }
      if (!move.ignoreImmunity || move.ignoreImmunity !== true && !move.ignoreImmunity[move.type]) {
        if (!target.runImmunity(move.type, true)) {
          return false;
        }
      }
      if (move.ohko) {
        return 65535;
      }
      if (move.damageCallback) {
        return move.damageCallback.call(this.battle, source, target);
      }
      if (move.damage === "level") {
        return source.level;
      }
      if (move.damage) {
        return move.damage;
      }
      if (move.volatileStatus === "partiallytrapped" && move.type === "Normal" && target.hasType("Ghost")) {
        return 0;
      }
      if (source.volatiles["partialtrappinglock"] && target === source.volatiles["partialtrappinglock"].locked) {
        return source.volatiles["partialtrappinglock"].damage;
      }
      if (!move.category)
        move.category = "Physical";
      if (!move.type)
        move.type = "???";
      const type = move.type;
      let basePower = move.basePower;
      if (move.basePowerCallback) {
        basePower = move.basePowerCallback.call(this.battle, source, target, move);
      }
      if (!basePower) {
        return basePower === 0 ? void 0 : basePower;
      }
      basePower = this.battle.clampIntRange(basePower, 1);
      let isCrit = move.willCrit || false;
      if (!isCrit) {
        let critChance = source.species.baseStats["spe"] + 76;
        critChance = critChance >> 2;
        if (source.volatiles["focusenergy"]) {
          critChance = critChance << 2;
          critChance += 160;
        } else {
          critChance = critChance << 1;
        }
        if (move.critRatio === 2) {
          critChance = critChance << 2;
        } else if (move.critRatio === 1) {
          critChance = critChance >> 1;
        }
        critChance = this.battle.clampIntRange(critChance, 1, 255);
        if (critChance > 0) {
          isCrit = this.battle.randomChance(critChance, 256);
        }
      }
      if (isCrit && this.battle.runEvent("CriticalHit", target, null, move)) {
        target.getMoveHitData(move).crit = true;
      }
      if (basePower) {
        basePower = this.battle.runEvent("BasePower", source, target, move, basePower);
        if (basePower && move.basePowerModifier) {
          basePower *= move.basePowerModifier;
        }
      }
      if (!basePower)
        return 0;
      basePower = this.battle.clampIntRange(basePower, 1);
      let level = source.level;
      const attacker = move.overrideOffensivePokemon === "target" ? target : source;
      const defender = move.overrideDefensivePokemon === "source" ? source : target;
      const isPhysical = move.category === "Physical";
      const atkType = move.overrideOffensiveStat || (isPhysical ? "atk" : "spa");
      const defType = move.overrideDefensiveStat || (isPhysical ? "def" : "spd");
      let attack = attacker.getStat(atkType);
      let defense = defender.getStat(defType);
      if (defType === "def" && defender.volatiles["reflect"] || defType === "spd" && defender.volatiles["lightscreen"]) {
        this.battle.debug("Screen doubling (Sp)Def");
        defense *= 2;
        defense = this.battle.clampIntRange(defense, 1, 1998);
      }
      if (isCrit) {
        move.ignoreOffensive = true;
        move.ignoreDefensive = true;
        level *= 2;
        if (!suppressMessages)
          this.battle.add("-crit", target);
      }
      if (move.ignoreOffensive) {
        this.battle.debug("Negating (sp)atk boost/penalty.");
        attack = attacker.getStat(atkType, true);
      }
      if (move.ignoreDefensive) {
        this.battle.debug("Negating (sp)def boost/penalty.");
        defense = target.getStat(defType, true);
      }
      if (attack >= 256 || defense >= 256) {
        attack = this.battle.clampIntRange(Math.floor(attack / 4) % 256, 1);
        defense = this.battle.clampIntRange(Math.floor(defense / 4) % 256, 1);
      }
      if (move.selfdestruct && defType === "def") {
        defense = this.battle.clampIntRange(Math.floor(defense / 2), 1);
      }
      let damage = level * 2;
      damage = Math.floor(damage / 5);
      damage += 2;
      damage *= basePower;
      damage *= attack;
      damage = Math.floor(damage / defense);
      damage = this.battle.clampIntRange(Math.floor(damage / 50), 0, 997);
      damage += 2;
      if (type !== "???" && source.hasType(type)) {
        damage += Math.floor(damage / 2);
      }
      for (const targetType of target.types) {
        const typeMod = this.battle.dex.getEffectiveness(type, targetType);
        if (typeMod > 0) {
          damage *= 20;
          damage = Math.floor(damage / 10);
        }
        if (typeMod < 0) {
          damage *= 5;
          damage = Math.floor(damage / 10);
        }
      }
      const totalTypeMod = target.runEffectiveness(move);
      if (totalTypeMod > 0) {
        if (!suppressMessages)
          this.battle.add("-supereffective", target);
      }
      if (totalTypeMod < 0) {
        if (!suppressMessages)
          this.battle.add("-resisted", target);
      }
      if (damage === 0)
        return damage;
      if (damage > 1) {
        damage *= this.battle.random(217, 256);
        damage = Math.floor(damage / 255);
      }
      return Math.floor(damage);
    }
  }
};
//# sourceMappingURL=scripts.js.map
