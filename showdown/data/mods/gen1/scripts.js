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
const TWO_TURN_MOVES = ["dig", "fly", "razorwind", "skullbash", "skyattack", "solarbeam"];
const Scripts = {
  inherit: "gen2",
  gen: 1,
  init() {
    for (const i in this.data.Pokedex) {
      this.data.Pokedex[i].gender = "N";
      this.data.Pokedex[i].eggGroups = null;
    }
  },
  // BattlePokemon scripts.
  pokemon: {
    getStat(statName, unmodified) {
      if (statName === "hp")
        throw new Error("Please read `maxhp` directly");
      if (unmodified)
        return this.baseStoredStats[statName];
      return this.modifiedStats[statName];
    },
    // Gen 1 function to apply a stat modification that is only active until the stat is recalculated or mon switched.
    modifyStat(statName, modifier) {
      if (!(statName in this.storedStats))
        throw new Error("Invalid `statName` passed to `modifyStat`");
      const modifiedStats = this.battle.clampIntRange(Math.floor(this.modifiedStats[statName] * modifier), 1);
      this.modifiedStats[statName] = modifiedStats;
    },
    // In generation 1, boosting function increases the stored modified stat and checks for opponent's status.
    boostBy(boost) {
      let changed = false;
      let i;
      for (i in boost) {
        const delta = boost[i];
        if (delta === void 0)
          continue;
        if (delta > 0 && this.boosts[i] >= 6)
          continue;
        if (delta < 0 && this.boosts[i] <= -6)
          continue;
        if (i === "evasion" || i === "accuracy") {
          this.boosts[i] += delta;
          if (this.boosts[i] > 6) {
            this.boosts[i] = 6;
          }
          if (this.boosts[i] < -6) {
            this.boosts[i] = -6;
          }
          changed = true;
          continue;
        }
        if (delta > 0) {
          if (this.modifiedStats[i] === 999) {
            this.boosts[i] += delta;
            if (this.boosts[i] > 6) {
              this.boosts[i] = 6;
            }
            this.boosts[i]--;
            changed = 0;
          } else {
            this.boosts[i] += delta;
            if (this.boosts[i] > 6) {
              this.boosts[i] = 6;
            }
            changed = true;
          }
        }
        if (delta < 0) {
          if (this.modifiedStats[i] === 1) {
            this.boosts[i] += delta;
            if (this.boosts[i] < -6) {
              this.boosts[i] = -6;
            }
            this.boosts[i]++;
            changed = 0;
          } else {
            this.boosts[i] += delta;
            if (this.boosts[i] < -6) {
              this.boosts[i] = -6;
            }
            changed = true;
          }
        }
        if (changed) {
          this.modifiedStats[i] = this.storedStats[i];
          if (this.boosts[i] >= 0) {
            this.modifyStat(i, [1, 1.5, 2, 2.5, 3, 3.5, 4][this.boosts[i]]);
          } else {
            this.modifyStat(i, [100, 66, 50, 40, 33, 28, 25][-this.boosts[i]] / 100);
          }
          if (delta > 0 && this.modifiedStats[i] > 999) {
            this.modifiedStats[i] = 999;
          }
        }
      }
      return changed;
    },
    clearBoosts() {
      let i;
      for (i in this.boosts) {
        this.boosts[i] = 0;
        if (i === "evasion" || i === "accuracy")
          continue;
        this.modifiedStats[i] = this.storedStats[i];
      }
    }
  },
  actions: {
    // This function is the main one when running a move.
    // It deals with the beforeMove event.
    // It also deals with how PP reduction works on gen 1.
    runMove(moveOrMoveName, pokemon, targetLoc, sourceEffect) {
      const target = this.battle.getTarget(pokemon, moveOrMoveName, targetLoc);
      const move = this.battle.dex.getActiveMove(moveOrMoveName);
      if (target?.subFainted)
        target.subFainted = null;
      this.battle.setActiveMove(move, pokemon, target);
      if (pokemon.moveThisTurn || !this.battle.runEvent("BeforeMove", pokemon, target, move)) {
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
        if (pokemon.volatiles["twoturnmove"]) {
          pokemon.deductPP(pokemon.volatiles["twoturnmove"].originalMove, null, target);
        }
      }
      if (pokemon.volatiles["partialtrappinglock"] && target !== pokemon.volatiles["partialtrappinglock"].locked) {
        const moveSlot = pokemon.moveSlots.find((ms) => ms.id === move.id);
        if (moveSlot && moveSlot.pp < 0) {
          moveSlot.pp = 63;
          this.battle.hint("In Gen 1, if a player is forced to use a move with 0 PP, the move will underflow to have 63 PP.");
        }
      }
      this.useMove(move, pokemon, target, sourceEffect);
      if (pokemon.volatiles["twoturnmove"]) {
        pokemon.deductPP(move, -1, target);
        pokemon.volatiles["twoturnmove"].originalMove = move.id;
      }
    },
    // This function deals with AfterMoveSelf events.
    // This leads with partial trapping moves shenanigans after the move has been used.
    useMove(moveOrMoveName, pokemon, target, sourceEffect) {
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
      if (!TWO_TURN_MOVES.includes(move.id) || pokemon.volatiles["twoturnmove"])
        pokemon.lastMove = move;
      const moveResult = this.useMoveInner(moveOrMoveName, pokemon, target, sourceEffect);
      if (move.id !== "metronome") {
        if (move.id !== "mirrormove" || (!pokemon.side.foe.active[0]?.lastMove || pokemon.side.foe.active[0].lastMove?.id === "mirrormove")) {
          pokemon.side.lastMove = move;
          if (pokemon.volatiles["lockedmove"]?.time <= 0)
            pokemon.removeVolatile("lockedmove");
          if (target && target.hp <= 0) {
            if (pokemon.volatiles["mustrecharge"])
              pokemon.removeVolatile("mustrecharge");
            delete pokemon.volatiles["partialtrappinglock"];
          } else {
            if (pokemon.volatiles["mustrecharge"])
              this.battle.add("-mustrecharge", pokemon);
            if (pokemon.hp)
              this.battle.runEvent("AfterMoveSelf", pokemon, target, move);
          }
          if (move.volatileStatus === "partiallytrapped" && target && target.hp > 0) {
            if (pokemon.volatiles["partialtrappinglock"] && target.volatiles["partiallytrapped"]) {
              const sourceVolatile = pokemon.volatiles["partialtrappinglock"];
              const targetVolatile = target.volatiles["partiallytrapped"];
              if (!sourceVolatile.locked) {
                sourceVolatile.locked = target;
              } else if (target !== pokemon && target !== sourceVolatile.locked) {
                const duration = this.battle.sample([2, 2, 2, 3, 3, 3, 4, 5]);
                sourceVolatile.duration = duration;
                sourceVolatile.locked = target;
                targetVolatile.duration = 2;
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
      if (target.boosts.atk < 6 && (move.selfdestruct || move.id === "disable") && target.volatiles["rage"]) {
        this.battle.boost({ atk: 1 }, target, pokemon, this.dex.conditions.get("rage"));
        this.battle.hint(`In Gen 1, using ${move.name} causes the target to build Rage, even if it misses or fails`, true);
      }
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
    // This function attempts a move hit and returns the attempt result before the actual hit happens.
    // It deals with partial trapping weirdness and accuracy bugs as well.
    tryMoveHit(target, pokemon, move) {
      let damage = 0;
      if (move?.self?.volatileStatus === "lockedmove") {
        if (pokemon.volatiles["lockedmove"]) {
          pokemon.volatiles["lockedmove"].time--;
          if (!pokemon.volatiles["lockedmove"].time) {
            delete pokemon.volatiles["confusion"];
            pokemon.addVolatile("confusion", pokemon, this.dex.conditions.get("lockedmove"));
          }
        } else {
          pokemon.addVolatile("lockedmove", pokemon, move);
        }
      }
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
      if (move.volatileStatus === "partiallytrapped" && target === pokemon.volatiles["partialtrappinglock"]?.locked) {
        accuracy = true;
      }
      if (move.status === "slp" && target && target.volatiles["mustrecharge"]) {
        accuracy = true;
      }
      if (move.ohko) {
        if (target.getStat("spe") > pokemon.getStat("spe")) {
          this.battle.add("-immune", target, "[ohko]");
          return false;
        }
      }
      const boostTable = [25, 28, 33, 40, 50, 66, 100, 150, 200, 250, 300, 350, 400];
      if (accuracy !== true) {
        accuracy = Math.floor(accuracy * 255 / 100);
        if (pokemon.volatiles["lockedmove"])
          accuracy = pokemon.volatiles["lockedmove"].accuracy;
        if (pokemon.volatiles["rage"])
          accuracy = pokemon.volatiles["rage"].accuracy;
        if (accuracy !== true) {
          if (!move.ignoreAccuracy) {
            accuracy = Math.floor(accuracy * (boostTable[pokemon.boosts.accuracy + 6] / 100));
          }
          if (!move.ignoreEvasion) {
            accuracy = Math.floor(accuracy * (boostTable[-target.boosts.evasion + 6] / 100));
          }
          accuracy = this.battle.clampIntRange(accuracy, 1, 255);
        }
        if (pokemon.volatiles["lockedmove"])
          pokemon.volatiles["lockedmove"].accuracy = accuracy;
        if (pokemon.volatiles["rage"])
          pokemon.volatiles["rage"].accuracy = accuracy;
      }
      accuracy = this.battle.runEvent("Accuracy", target, pokemon, move, accuracy);
      if (move.target === "self" && accuracy !== true)
        accuracy++;
      if (accuracy !== true && !this.battle.randomChance(accuracy, 256)) {
        this.battle.attrLastMove("[miss]");
        this.battle.add("-miss", pokemon);
        if (accuracy === 255)
          this.battle.hint("In Gen 1, moves with 100% accuracy can still miss 1/256 of the time.");
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
      if (move.category !== "Status") {
        target.gotAttacked(move, damage, pokemon);
      }
      if (move.selfdestruct) {
        if (!target.subFainted) {
          this.battle.faint(pokemon, pokemon, move);
        } else {
          this.battle.hint(`In Gen 1, the user of ${move.name} will not take damage if it breaks a Substitute.`);
        }
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
    // It deals with the actual move hit, as the name indicates, dealing damage and/or effects.
    // This function also deals with the Gen 1 Substitute behaviour on the hitting process.
    moveHit(target, pokemon, move, moveData, isSecondary, isSelf) {
      let damage = 0;
      if (!isSecondary && !isSelf)
        this.battle.setActiveMove(move, pokemon, target);
      let hitResult = true;
      if (!moveData)
        moveData = move;
      if (move.ignoreImmunity === void 0) {
        move.ignoreImmunity = move.category === "Status";
      }
      const targetSub = target ? target.volatiles["substitute"] : false;
      const targetHadSub = targetSub !== null && targetSub !== false && typeof targetSub !== "undefined";
      let targetHasSub = void 0;
      if (target) {
        hitResult = this.battle.singleEvent("TryHit", moveData, {}, target, pokemon, move);
        if (targetSub && moveData.volatileStatus && moveData.volatileStatus === "partiallytrapped") {
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
          targetHasSub = !!target?.volatiles["substitute"];
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
        if (moveData.boosts && target.hp) {
          const willBoost = this.battle.boost(moveData.boosts, target, pokemon, move);
          if (!willBoost) {
            this.battle.add("-fail", target);
            return false;
          }
          didSomething = true;
          if (pokemon.side.foe.active[0].status) {
            if (pokemon.side.foe.active[0].status === "par") {
              pokemon.side.foe.active[0].modifyStat("spe", 0.25);
            }
            if (pokemon.side.foe.active[0].status === "brn") {
              pokemon.side.foe.active[0].modifyStat("atk", 0.5);
            }
          }
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
          if (moveData.status === "slp" && target.volatiles["mustrecharge"]) {
            if (target.setStatus(moveData.status, pokemon, move)) {
              target.removeVolatile("mustrecharge");
              this.battle.hint(
                "In Gen 1, if a Pok\xE9mon that has just used Hyper Beam and has yet to recharge is targeted with a sleep inducing move, any other status it may already have will be ignored and sleep will be induced regardless."
              );
            }
          } else if (!target.status) {
            if (target.setStatus(moveData.status, pokemon, move)) {
              if (moveData.status === "brn")
                target.modifyStat("atk", 0.5);
              if (moveData.status === "par")
                target.modifyStat("spe", 0.25);
            }
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
            if (moveData.forceStatus === "brn")
              target.modifyStat("atk", 0.5);
            if (moveData.forceStatus === "par")
              target.modifyStat("spe", 0.25);
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
      if (targetHasSub === void 0)
        targetHasSub = !!target?.volatiles["substitute"];
      const doSelf = targetHadSub && targetHasSub || !targetHadSub;
      if (moveData.self && moveData.self.volatileStatus !== "lockedmove" && (doSelf || moveData.self.volatileStatus === "partialtrappinglock")) {
        this.moveHit(pokemon, pokemon, move, moveData.self, isSecondary, true);
      }
      if (pokemon.volatiles["partialtrappinglock"]) {
        pokemon.volatiles["partialtrappinglock"].damage = this.battle.lastDamage;
      }
      if (moveData.secondaries && target && target.hp > 0) {
        for (const secondary of moveData.secondaries) {
          if (!move.multihit || move.lastHit) {
            if (!(secondary.status && ["par", "brn", "frz"].includes(secondary.status) && target.hasType(move.type))) {
              if (secondary.chance === void 0) {
                this.moveHit(target, pokemon, move, secondary, true, isSelf);
              } else {
                let secondaryChance = Math.ceil(secondary.chance * 256 / 100);
                if (secondary?.volatileStatus === "confusion")
                  secondaryChance--;
                if (this.battle.randomChance(secondaryChance, 256)) {
                  this.moveHit(target, pokemon, move, secondary, true, isSelf);
                }
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
    // This calculates the damage pokemon does to target with move.
    getDamage(source, target, move, suppressMessages) {
      if (typeof move === "string") {
        move = this.battle.dex.getActiveMove(move);
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
      if (move.damage || move.damage === 0) {
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
        let critChance = Math.floor(this.dex.species.get(source.set.species).baseStats["spe"] / 2);
        if (source.volatiles["focusenergy"]) {
          critChance = Math.floor(critChance / 2);
        } else {
          critChance = this.battle.clampIntRange(critChance * 2, 1, 255);
        }
        if (move.critRatio === 1) {
          critChance = Math.floor(critChance / 2);
        } else if (move.critRatio === 2) {
          critChance = this.battle.clampIntRange(critChance * 4, 1, 255);
        }
        if (critChance > 0) {
          isCrit = this.battle.randomChance(critChance, 256);
        }
      }
      if (isCrit)
        target.getMoveHitData(move).crit = true;
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
        if (attack >= 1024 || defense >= 1024) {
          this.battle.hint("In Gen 1, a stat will roll over to a small number if it is larger than 1024.");
        }
        attack = this.battle.clampIntRange(Math.floor(attack / 4) % 256, 1);
        defense = Math.floor(defense / 4) % 256;
        if (defense === 0) {
          this.battle.hint("Pokemon Showdown avoids division by zero by rounding defense up to 1. In game, the battle would have crashed.");
          defense = 1;
        }
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
        let typeMod = this.battle.dex.getEffectiveness(type, targetType);
        typeMod = this.battle.runEvent("Effectiveness", this.battle, targetType, move, typeMod);
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
  },
  // deals with Pokémon stat boosting.
  boost(boost, target, source = null, effect = null) {
    if (this.event) {
      if (!target)
        target = this.event.target;
      if (!source)
        source = this.event.source;
      if (!effect)
        effect = this.effect;
    }
    if (typeof effect === "string")
      effect = this.dex.conditions.get(effect);
    if (!target?.hp)
      return 0;
    let success = null;
    boost = this.runEvent("TryBoost", target, source, effect, { ...boost });
    let i;
    for (i in boost) {
      const currentBoost = {};
      currentBoost[i] = boost[i];
      if (boost[i] !== 0) {
        const boostResult = target.boostBy(currentBoost);
        if (boostResult) {
          success = true;
          let msg = "-boost";
          if (boost[i] < 0) {
            msg = "-unboost";
            boost[i] = -boost[i];
          }
          if (!effect || effect.effectType === "Move") {
            this.add(msg, target, i, boost[i]);
          } else {
            this.add(msg, target, i, boost[i], "[from] " + effect.fullname);
          }
          this.runEvent("AfterEachBoost", target, source, effect, currentBoost);
        }
        if (boostResult === 0) {
          let msg = "-boost";
          let secondmsg = "-unboost";
          if (boost[i] < 0) {
            msg = "-unboost";
            secondmsg = "-boost";
            boost[i] = -boost[i];
          }
          if (!effect || effect.effectType === "Move") {
            this.add(msg, target, i, boost[i]);
          } else {
            this.add(msg, target, i, boost[i], "[from] " + effect.fullname);
          }
          this.add(secondmsg, target, i, 1);
          if (msg === "-boost") {
            this.hint(`In Gen 1, boosting a stat at 999 will apply a -1 drop afterwards, and the stat remains at 999.`, true);
          } else {
            this.hint(`In Gen 1, dropping a stat at 1 will apply a +1 boost afterwards, and the stat remains at 1.`, true);
          }
          this.runEvent("AfterEachBoost", target, source, effect, currentBoost);
        }
      }
    }
    this.runEvent("AfterBoost", target, source, effect, boost);
    return success;
  }
};
//# sourceMappingURL=scripts.js.map
