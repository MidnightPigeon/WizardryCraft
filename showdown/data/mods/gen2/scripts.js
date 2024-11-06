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
  inherit: "gen3",
  gen: 2,
  pokemon: {
    inherit: true,
    getStat(statName, unboosted, unmodified, fastReturn) {
      if (statName === "hp")
        throw new Error("Please read `maxhp` directly");
      let stat = this.storedStats[statName];
      if (!unboosted) {
        let boost = this.boosts[statName];
        if (boost > 6)
          boost = 6;
        if (boost < -6)
          boost = -6;
        if (boost >= 0) {
          const boostTable = [1, 1.5, 2, 2.5, 3, 3.5, 4];
          stat = Math.floor(stat * boostTable[boost]);
        } else {
          const numerators = [100, 66, 50, 40, 33, 28, 25];
          stat = Math.floor(stat * numerators[-boost] / 100);
        }
      }
      if (this.status === "par" && statName === "spe") {
        stat = Math.floor(stat / 4);
      }
      if (!unmodified) {
        if (this.status === "brn" && statName === "atk") {
          stat = Math.floor(stat / 2);
        }
      }
      stat = this.battle.clampIntRange(stat, 1, 999);
      if (fastReturn)
        return stat;
      if (!unboosted) {
        if (statName === "def" && this.side.sideConditions["reflect"] || statName === "spd" && this.side.sideConditions["lightscreen"]) {
          stat *= 2;
        }
      }
      if (["Cubone", "Marowak"].includes(this.baseSpecies.name) && this.item === "thickclub" && statName === "atk" || this.baseSpecies.name === "Pikachu" && this.item === "lightball" && statName === "spa") {
        stat *= 2;
      } else if (this.baseSpecies.name === "Ditto" && this.item === "metalpowder" && ["def", "spd"].includes(statName)) {
        stat = Math.floor(stat * 1.5);
      }
      return stat;
    },
    boostBy(boost) {
      let delta = 0;
      let i;
      for (i in boost) {
        delta = boost[i];
        if (delta > 0 && this.getStat(i, false, true) === 999) {
          delta = 0;
          continue;
        }
        this.boosts[i] += delta;
        if (this.boosts[i] > 6) {
          delta -= this.boosts[i] - 6;
          this.boosts[i] = 6;
        }
        if (this.boosts[i] < -6) {
          delta -= this.boosts[i] - -6;
          this.boosts[i] = -6;
        }
      }
      return delta;
    }
  },
  actions: {
    inherit: true,
    runMove(moveOrMoveName, pokemon, targetLoc, sourceEffect) {
      let move = this.dex.getActiveMove(moveOrMoveName);
      let target = this.battle.getTarget(pokemon, move, targetLoc);
      if (!sourceEffect && move.id !== "struggle") {
        const changedMove = this.battle.runEvent("OverrideAction", pokemon, target, move);
        if (changedMove && changedMove !== true) {
          move = this.dex.getActiveMove(changedMove);
          target = this.battle.getRandomTarget(pokemon, move);
        }
      }
      if (!target && target !== false)
        target = this.battle.getRandomTarget(pokemon, move);
      this.battle.setActiveMove(move, pokemon, target);
      if (pokemon.moveThisTurn) {
        this.battle.debug("" + pokemon.fullname + " INCONSISTENT STATE, ALREADY MOVED: " + pokemon.moveThisTurn);
        this.battle.clearActiveMove(true);
        return;
      }
      if (!this.battle.runEvent("BeforeMove", pokemon, target, move)) {
        this.battle.runEvent("MoveAborted", pokemon, target, move);
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
      pokemon.lastDamage = 0;
      let lockedMove = this.battle.runEvent("LockMove", pokemon);
      if (lockedMove === true)
        lockedMove = false;
      if (!lockedMove) {
        if (!pokemon.deductPP(move, null, target) && move.id !== "struggle") {
          this.battle.add("cant", pokemon, "nopp", move);
          this.battle.clearActiveMove(true);
          return;
        }
      }
      pokemon.moveUsed(move);
      this.battle.actions.useMove(move, pokemon, target, sourceEffect);
      this.battle.singleEvent("AfterMove", move, null, pokemon, target, move);
      if (!move.selfSwitch && pokemon.side.foe.active[0].hp)
        this.battle.runEvent("AfterMoveSelf", pokemon, target, move);
    },
    tryMoveHit(target, pokemon, move) {
      const positiveBoostTable = [1, 1.33, 1.66, 2, 2.33, 2.66, 3];
      const negativeBoostTable = [1, 0.75, 0.6, 0.5, 0.43, 0.36, 0.33];
      const doSelfDestruct = true;
      let damage = 0;
      if (move.selfdestruct && doSelfDestruct) {
        this.battle.faint(pokemon, pokemon, move);
      }
      let hitResult = this.battle.singleEvent("PrepareHit", move, {}, target, pokemon, move);
      if (!hitResult) {
        if (hitResult === false)
          this.battle.add("-fail", target);
        return false;
      }
      this.battle.runEvent("PrepareHit", pokemon, target, move);
      if (!this.battle.singleEvent("Try", move, null, pokemon, target, move)) {
        return false;
      }
      if (move.target === "all" || move.target === "foeSide" || move.target === "allySide" || move.target === "allyTeam") {
        if (move.target === "all") {
          hitResult = this.battle.runEvent("TryHitField", target, pokemon, move);
        } else {
          hitResult = this.battle.runEvent("TryHitSide", target, pokemon, move);
        }
        if (!hitResult) {
          if (hitResult === false) {
            this.battle.add("-fail", pokemon);
            this.battle.attrLastMove("[still]");
          }
          return false;
        }
        return this.moveHit(target, pokemon, move);
      }
      hitResult = this.battle.runEvent("Invulnerability", target, pokemon, move);
      if (hitResult === false) {
        this.battle.attrLastMove("[miss]");
        this.battle.add("-miss", pokemon);
        return false;
      }
      if (move.ignoreImmunity === void 0) {
        move.ignoreImmunity = move.category === "Status";
      }
      if ((!move.ignoreImmunity || move.ignoreImmunity !== true && !move.ignoreImmunity[move.type]) && !target.runImmunity(move.type, true)) {
        return false;
      }
      hitResult = this.battle.singleEvent("TryImmunity", move, {}, target, pokemon, move);
      if (hitResult === false) {
        this.battle.add("-immune", target);
        return false;
      }
      hitResult = this.battle.runEvent("TryHit", target, pokemon, move);
      if (!hitResult) {
        if (hitResult === false)
          this.battle.add("-fail", target);
        return false;
      }
      let accuracy = move.accuracy;
      if (move.alwaysHit) {
        accuracy = true;
      } else {
        accuracy = this.battle.runEvent("Accuracy", target, pokemon, move, accuracy);
      }
      if (accuracy !== true) {
        accuracy = Math.floor(accuracy * 255 / 100);
        if (move.ohko) {
          if (pokemon.level >= target.level) {
            accuracy += (pokemon.level - target.level) * 2;
            accuracy = Math.min(accuracy, 255);
          } else {
            this.battle.add("-immune", target, "[ohko]");
            return false;
          }
        }
        if (!move.ignoreAccuracy) {
          if (pokemon.boosts.accuracy > 0) {
            accuracy *= positiveBoostTable[pokemon.boosts.accuracy];
          } else {
            accuracy *= negativeBoostTable[-pokemon.boosts.accuracy];
          }
        }
        if (!move.ignoreEvasion) {
          if (target.boosts.evasion > 0 && !move.ignorePositiveEvasion) {
            accuracy *= negativeBoostTable[target.boosts.evasion];
          } else if (target.boosts.evasion < 0) {
            accuracy *= positiveBoostTable[-target.boosts.evasion];
          }
        }
        accuracy = Math.min(Math.floor(accuracy), 255);
        accuracy = Math.max(accuracy, 1);
      } else {
        accuracy = this.battle.runEvent("Accuracy", target, pokemon, move, accuracy);
      }
      accuracy = this.battle.runEvent("ModifyAccuracy", target, pokemon, move, accuracy);
      if (accuracy !== true)
        accuracy = Math.max(accuracy, 0);
      if (move.alwaysHit) {
        accuracy = true;
      } else {
        accuracy = this.battle.runEvent("Accuracy", target, pokemon, move, accuracy);
      }
      if (accuracy !== true && accuracy !== 255 && !this.battle.randomChance(accuracy, 256)) {
        this.battle.attrLastMove("[miss]");
        this.battle.add("-miss", pokemon);
        damage = false;
        return damage;
      }
      move.totalDamage = 0;
      pokemon.lastDamage = 0;
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
        let nullDamage = true;
        let moveDamage;
        const isSleepUsable = move.sleepUsable || this.dex.moves.get(move.sourceEffect).sleepUsable;
        let i;
        for (i = 0; i < hits && target.hp && pokemon.hp; i++) {
          if (pokemon.status === "slp" && !isSleepUsable)
            break;
          move.hit = i + 1;
          if (move.hit === hits)
            move.lastHit = true;
          moveDamage = this.moveHit(target, pokemon, move);
          if (moveDamage === false)
            break;
          if (nullDamage && (moveDamage || moveDamage === 0 || moveDamage === void 0))
            nullDamage = false;
          damage = moveDamage || 0;
          move.totalDamage += damage;
          this.battle.eachEvent("Update");
        }
        if (i === 0)
          return 1;
        if (nullDamage)
          damage = false;
        this.battle.add("-hitcount", target, i);
      } else {
        damage = this.moveHit(target, pokemon, move);
        move.totalDamage = damage;
      }
      if (move.category !== "Status") {
        target.gotAttacked(move, damage, pokemon);
      }
      if (move.ohko)
        this.battle.add("-ohko");
      if (!move.negateSecondary) {
        this.battle.singleEvent("AfterMoveSecondary", move, null, target, pokemon, move);
        this.battle.runEvent("AfterMoveSecondary", target, pokemon, move);
      }
      if (move.recoil && move.totalDamage) {
        this.battle.damage(this.calcRecoilDamage(move.totalDamage, move, pokemon), pokemon, target, "recoil");
      }
      return damage;
    },
    moveHit(target, pokemon, move, moveData, isSecondary, isSelf) {
      let damage = void 0;
      move = this.dex.getActiveMove(move);
      if (!moveData)
        moveData = move;
      let hitResult = true;
      if (move.target === "all" && !isSelf) {
        hitResult = this.battle.singleEvent("TryHitField", moveData, {}, target, pokemon, move);
      } else if ((move.target === "foeSide" || move.target === "allySide") && !isSelf) {
        hitResult = this.battle.singleEvent("TryHitSide", moveData, {}, target ? target.side : null, pokemon, move);
      } else if (target) {
        hitResult = this.battle.singleEvent("TryHit", moveData, {}, target, pokemon, move);
      }
      if (!hitResult) {
        if (hitResult === false)
          this.battle.add("-fail", target);
        return false;
      }
      if (target && !isSecondary && !isSelf) {
        hitResult = this.battle.runEvent("TryPrimaryHit", target, pokemon, moveData);
        if (hitResult === 0) {
          hitResult = true;
          target = null;
        }
      }
      if (target && isSecondary && !moveData.self) {
        hitResult = true;
      }
      if (!hitResult) {
        return false;
      }
      if (target) {
        let didSomething = false;
        damage = this.getDamage(pokemon, target, moveData);
        if ((damage || damage === 0) && !target.fainted) {
          damage = this.battle.damage(damage, target, pokemon, move);
          if (!(damage || damage === 0)) {
            this.battle.debug("damage interrupted");
            return false;
          }
          didSomething = true;
        }
        if (damage === false || damage === null) {
          if (damage === false && !isSecondary && !isSelf) {
            this.battle.add("-fail", target);
          }
          this.battle.debug("damage calculation interrupted");
          return false;
        }
        if (moveData.boosts && !target.fainted) {
          if (pokemon.volatiles["lockon"] && target === pokemon.volatiles["lockon"].source && target.isSemiInvulnerable() && !isSelf) {
            if (!isSecondary)
              this.battle.add("-fail", target);
            return false;
          }
          hitResult = this.battle.boost(moveData.boosts, target, pokemon, move);
          didSomething = didSomething || hitResult;
        }
        if (moveData.heal && !target.fainted) {
          const d = target.heal(Math.round(target.maxhp * moveData.heal[0] / moveData.heal[1]));
          if (!d && d !== 0) {
            this.battle.add("-fail", target);
            this.battle.debug("heal interrupted");
            return false;
          }
          this.battle.add("-heal", target, target.getHealth);
          didSomething = true;
        }
        if (moveData.status) {
          hitResult = target.trySetStatus(moveData.status, pokemon, move);
          if (!hitResult && move.status)
            return hitResult;
          didSomething = didSomething || hitResult;
        }
        if (moveData.forceStatus) {
          hitResult = target.setStatus(moveData.forceStatus, pokemon, move);
          didSomething = didSomething || hitResult;
        }
        if (moveData.volatileStatus) {
          hitResult = target.addVolatile(moveData.volatileStatus, pokemon, move);
          didSomething = didSomething || hitResult;
        }
        if (moveData.sideCondition) {
          hitResult = target.side.addSideCondition(moveData.sideCondition, pokemon, move);
          didSomething = didSomething || hitResult;
        }
        if (moveData.weather) {
          hitResult = this.battle.field.setWeather(moveData.weather, pokemon, move);
          didSomething = didSomething || hitResult;
        }
        if (moveData.pseudoWeather) {
          hitResult = this.battle.field.addPseudoWeather(moveData.pseudoWeather, pokemon, move);
          didSomething = didSomething || hitResult;
        }
        if (moveData.forceSwitch) {
          if (this.battle.canSwitch(target.side))
            didSomething = true;
        }
        if (moveData.selfSwitch) {
          if (this.battle.canSwitch(pokemon.side))
            didSomething = true;
        }
        hitResult = null;
        if (move.target === "all" && !isSelf) {
          if (moveData.onHitField)
            hitResult = this.battle.singleEvent("HitField", moveData, {}, target, pokemon, move);
        } else if ((move.target === "foeSide" || move.target === "allySide") && !isSelf) {
          if (moveData.onHitSide)
            hitResult = this.battle.singleEvent("HitSide", moveData, {}, target.side, pokemon, move);
        } else {
          if (moveData.onHit)
            hitResult = this.battle.singleEvent("Hit", moveData, {}, target, pokemon, move);
          if (!isSelf && !isSecondary) {
            this.battle.runEvent("Hit", target, pokemon, move);
          }
          if (moveData.onAfterHit)
            hitResult = this.battle.singleEvent("AfterHit", moveData, {}, target, pokemon, move);
        }
        if (!hitResult && !didSomething && !moveData.self && !moveData.selfdestruct) {
          if (!isSelf && !isSecondary) {
            if (hitResult === false || didSomething === false)
              this.battle.add("-fail", target);
          }
          this.battle.debug("move failed because it did nothing");
          return false;
        }
      }
      if (moveData.self) {
        if (!isSecondary && moveData.self.boosts)
          this.battle.random(100);
        this.moveHit(pokemon, pokemon, move, moveData.self, isSecondary, true);
      }
      if (target?.hp && moveData.secondaries && this.battle.runEvent("TrySecondaryHit", target, pokemon, moveData)) {
        for (const secondary of moveData.secondaries) {
          if (secondary.status && ["brn", "frz"].includes(secondary.status) && target.hasType(move.type)) {
            this.battle.debug("Target immune to [" + secondary.status + "]");
            continue;
          }
          if (secondary.volatileStatus === "flinch" && ["slp", "frz"].includes(target.status) && !secondary.kingsrock) {
            this.battle.debug("Cannot flinch a sleeping or frozen target");
            continue;
          }
          if (!move.multihit || move.lastHit) {
            const effectChance = Math.floor((secondary.chance || 100) * 255 / 100);
            if (typeof secondary.chance === "undefined" || this.battle.randomChance(effectChance, 256)) {
              this.moveHit(target, pokemon, move, secondary, true, isSelf);
            } else if (effectChance === 255) {
              this.battle.hint("In Gen 2, moves with a 100% secondary effect chance will not trigger in 1/256 uses.");
            }
          }
        }
      }
      if (target && target.hp > 0 && pokemon.hp > 0 && moveData.forceSwitch && this.battle.canSwitch(target.side)) {
        hitResult = this.battle.runEvent("DragOut", target, pokemon, move);
        if (hitResult) {
          this.dragIn(target.side, target.position);
        } else if (hitResult === false) {
          this.battle.add("-fail", target);
        }
      }
      if (move.selfSwitch && pokemon.hp) {
        pokemon.switchFlag = move.id;
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
        return target.maxhp;
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
      move.category = this.battle.getCategory(move);
      if (!move.type)
        move.type = "???";
      const type = move.type;
      let basePower = move.basePower;
      if (move.basePowerCallback) {
        basePower = move.basePowerCallback.call(this.battle, source, target, move);
      }
      if (!basePower) {
        if (basePower === 0)
          return;
        return basePower;
      }
      basePower = this.battle.clampIntRange(basePower, 1);
      let critRatio = this.battle.runEvent("ModifyCritRatio", source, target, move, move.critRatio || 0);
      critRatio = this.battle.clampIntRange(critRatio, 0, 5);
      const critMult = [0, 17, 32, 64, 85, 128];
      let isCrit = move.willCrit || false;
      if (typeof move.willCrit === "undefined") {
        if (critRatio) {
          isCrit = this.battle.random(256) < critMult[critRatio];
        }
      }
      if (isCrit && this.battle.runEvent("CriticalHit", target, null, move)) {
        target.getMoveHitData(move).crit = true;
      }
      if (basePower) {
        if (move.isConfusionSelfHit) {
          move.type = move.baseMoveType;
          basePower = this.battle.runEvent("BasePower", source, target, move, basePower, true);
          move.type = "???";
        } else {
          basePower = this.battle.runEvent("BasePower", source, target, move, basePower, true);
        }
        if (basePower && move.basePowerModifier) {
          basePower *= move.basePowerModifier;
        }
      }
      if (!basePower)
        return 0;
      basePower = this.battle.clampIntRange(basePower, 1);
      let level = source.level;
      if (move.allies) {
        this.battle.add("-activate", source, "move: Beat Up", "[of] " + move.allies[0].name);
        level = move.allies[0].level;
      }
      const attacker = move.overrideOffensivePokemon === "target" ? target : source;
      const defender = move.overrideDefensivePokemon === "source" ? source : target;
      const isPhysical = move.category === "Physical";
      const atkType = move.overrideOffensiveStat || (isPhysical ? "atk" : "spa");
      const defType = move.overrideDefensiveStat || (isPhysical ? "def" : "spd");
      let unboosted = false;
      let noburndrop = false;
      if (isCrit) {
        if (!suppressMessages)
          this.battle.add("-crit", target);
        if (attacker.boosts[atkType] <= defender.boosts[defType]) {
          unboosted = true;
          noburndrop = true;
        }
      }
      let attack = attacker.getStat(atkType, unboosted, noburndrop);
      let defense = defender.getStat(defType, unboosted);
      if (move.allies) {
        attack = move.allies[0].species.baseStats.atk;
        move.allies.shift();
        defense = defender.species.baseStats.def;
      }
      if (move.ignoreOffensive) {
        this.battle.debug("Negating (sp)atk boost/penalty.");
        attack = attacker.getStat(atkType, true, true);
      }
      if (move.ignoreDefensive) {
        this.battle.debug("Negating (sp)def boost/penalty.");
        defense = target.getStat(defType, true, true);
      }
      if (move.id === "present") {
        const typeIndexes = {
          Normal: 0,
          Fighting: 1,
          Flying: 2,
          Poison: 3,
          Ground: 4,
          Rock: 5,
          Bug: 7,
          Ghost: 8,
          Steel: 9,
          Fire: 20,
          Water: 21,
          Grass: 22,
          Electric: 23,
          Psychic: 24,
          Ice: 25,
          Dragon: 26,
          Dark: 27
        };
        attack = 10;
        const attackerLastType = attacker.getTypes().slice(-1)[0];
        const defenderLastType = defender.getTypes().slice(-1)[0];
        defense = typeIndexes[attackerLastType] || 1;
        level = typeIndexes[defenderLastType] || 1;
        this.battle.hint("Gen 2 Present has a glitched damage calculation using the secondary types of the Pokemon for the Attacker's Level and Defender's Defense.", true);
      }
      if (attack >= 256 || defense >= 256) {
        if (attack >= 1024 || defense >= 1024) {
          this.battle.hint("In Gen 2, a stat will roll over to a small number if it is larger than 1024.");
        }
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
      damage = Math.floor(damage / 50);
      if (isCrit)
        damage *= 2;
      damage = Math.floor(this.battle.runEvent("ModifyDamage", attacker, defender, move, damage));
      damage = this.battle.clampIntRange(damage, 1, 997);
      damage += 2;
      if (type === "Water" && this.battle.field.isWeather("raindance") || type === "Fire" && this.battle.field.isWeather("sunnyday")) {
        damage = Math.floor(damage * 1.5);
      } else if ((type === "Fire" || move.id === "solarbeam") && this.battle.field.isWeather("raindance") || type === "Water" && this.battle.field.isWeather("sunnyday")) {
        damage = Math.floor(damage / 2);
      }
      if (type !== "???" && source.hasType(type)) {
        damage += Math.floor(damage / 2);
      }
      const totalTypeMod = target.runEffectiveness(move);
      if (totalTypeMod > 0) {
        if (!suppressMessages)
          this.battle.add("-supereffective", target);
        damage *= 2;
        if (totalTypeMod >= 2) {
          damage *= 2;
        }
      }
      if (totalTypeMod < 0) {
        if (!suppressMessages)
          this.battle.add("-resisted", target);
        damage = Math.floor(damage / 2);
        if (totalTypeMod <= -2) {
          damage = Math.floor(damage / 2);
        }
      }
      if (!move.noDamageVariance && damage > 1) {
        damage *= this.battle.random(217, 256);
        damage = Math.floor(damage / 255);
      }
      if (basePower && !Math.floor(damage)) {
        return 1;
      }
      return damage;
    }
  }
};
//# sourceMappingURL=scripts.js.map
