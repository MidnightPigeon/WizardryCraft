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
  gen: 8,
  inherit: "gen8",
  actions: {
    // 1 mega per pokemon
    runMegaEvo(pokemon) {
      if (pokemon.name === "Struchni" && pokemon.species.name === "Aggron")
        pokemon.canMegaEvo = "Aggron-Mega";
      if (pokemon.name === "Raj.Shoot" && pokemon.species.name === "Charizard")
        pokemon.canMegaEvo = "Charizard-Mega-X";
      const speciesid = pokemon.canMegaEvo || pokemon.canUltraBurst;
      if (!speciesid)
        return false;
      pokemon.formeChange(speciesid, pokemon.getItem(), true);
      if (pokemon.canMegaEvo) {
        pokemon.canMegaEvo = null;
      } else {
        pokemon.canUltraBurst = null;
      }
      this.battle.runEvent("AfterMega", pokemon);
      if (["Kaiju Bunny", "Overneat", "EpicNikolai"].includes(pokemon.name) && !pokemon.illusion) {
        this.battle.add("-start", pokemon, "typechange", pokemon.types.join("/"));
      }
      this.battle.add("-ability", pokemon, `${pokemon.getAbility().name}`);
      return true;
    },
    // Modded for Mega Rayquaza
    canMegaEvo(pokemon) {
      const species = pokemon.baseSpecies;
      const altForme = species.otherFormes && this.dex.species.get(species.otherFormes[0]);
      const item = pokemon.getItem();
      if (altForme?.isMega && altForme?.requiredMove && pokemon.baseMoves.includes(this.battle.toID(altForme.requiredMove)) && !item.zMove) {
        return altForme.name;
      }
      if (item.megaEvolves === species.baseSpecies && item.megaStone !== species.name) {
        return item.megaStone;
      }
      return null;
    },
    // 1 Z per pokemon
    canZMove(pokemon) {
      if (pokemon.m.zMoveUsed || pokemon.transformed && (pokemon.species.isMega || pokemon.species.isPrimal || pokemon.species.forme === "Ultra"))
        return;
      const item = pokemon.getItem();
      if (!item.zMove)
        return;
      if (item.itemUser && !item.itemUser.includes(pokemon.species.name))
        return;
      let atLeastOne = false;
      let mustStruggle = true;
      const zMoves = [];
      for (const moveSlot of pokemon.moveSlots) {
        if (moveSlot.pp <= 0) {
          zMoves.push(null);
          continue;
        }
        if (!moveSlot.disabled) {
          mustStruggle = false;
        }
        const move = this.dex.moves.get(moveSlot.move);
        let zMoveName = this.getZMove(move, pokemon, true) || "";
        if (zMoveName) {
          const zMove = this.dex.moves.get(zMoveName);
          if (!zMove.isZ && zMove.category === "Status")
            zMoveName = "Z-" + zMoveName;
          zMoves.push({ move: zMoveName, target: zMove.target });
        } else {
          zMoves.push(null);
        }
        if (zMoveName)
          atLeastOne = true;
      }
      if (atLeastOne && !mustStruggle)
        return zMoves;
    },
    getZMove(move, pokemon, skipChecks) {
      const item = pokemon.getItem();
      if (!skipChecks) {
        if (pokemon.m.zMoveUsed)
          return;
        if (!item.zMove)
          return;
        if (item.itemUser && !item.itemUser.includes(pokemon.species.name))
          return;
        const moveData = pokemon.getMoveData(move);
        if (!moveData?.pp)
          return;
      }
      if (move.name === item.zMoveFrom) {
        return item.zMove;
      } else if (item.zMove === true && move.type === item.zMoveType) {
        if (move.category === "Status") {
          return move.name;
        } else if (move.zMove?.basePower) {
          return this.Z_MOVES[move.type];
        }
      }
    },
    runMove(moveOrMoveName, pokemon, targetLoc, sourceEffect, zMove, externalMove, maxMove, originalTarget) {
      pokemon.activeMoveActions++;
      let target = this.battle.getTarget(pokemon, maxMove || zMove || moveOrMoveName, targetLoc, originalTarget);
      let baseMove = this.dex.getActiveMove(moveOrMoveName);
      const pranksterBoosted = baseMove.pranksterBoosted;
      if (baseMove.id !== "struggle" && !zMove && !maxMove && !externalMove) {
        const changedMove = this.battle.runEvent("OverrideAction", pokemon, target, baseMove);
        if (changedMove && changedMove !== true) {
          baseMove = this.dex.getActiveMove(changedMove);
          if (pranksterBoosted)
            baseMove.pranksterBoosted = pranksterBoosted;
          target = this.battle.getRandomTarget(pokemon, baseMove);
        }
      }
      let move = baseMove;
      if (zMove) {
        move = this.getActiveZMove(baseMove, pokemon);
      } else if (maxMove) {
        move = this.getActiveMaxMove(baseMove, pokemon);
      }
      move.isExternal = externalMove;
      this.battle.setActiveMove(move, pokemon, target);
      const willTryMove = this.battle.runEvent("BeforeMove", pokemon, target, move);
      if (!willTryMove) {
        this.battle.runEvent("MoveAborted", pokemon, target, move);
        this.battle.clearActiveMove(true);
        pokemon.moveThisTurnResult = willTryMove;
        return;
      }
      if (move.beforeMoveCallback) {
        if (move.beforeMoveCallback.call(this.battle, pokemon, target, move)) {
          this.battle.clearActiveMove(true);
          pokemon.moveThisTurnResult = false;
          return;
        }
      }
      pokemon.lastDamage = 0;
      let lockedMove;
      if (!externalMove) {
        lockedMove = this.battle.runEvent("LockMove", pokemon);
        if (lockedMove === true)
          lockedMove = false;
        if (!lockedMove) {
          if (!pokemon.deductPP(baseMove, null, target) && move.id !== "struggle") {
            this.battle.add("cant", pokemon, "nopp", move);
            const gameConsole = [
              null,
              "Game Boy",
              "Game Boy Color",
              "Game Boy Advance",
              "DS",
              "DS",
              "3DS",
              "3DS"
            ][this.battle.gen] || "Switch";
            this.battle.hint(`This is not a bug, this is really how it works on the ${gameConsole}; try it yourself if you don't believe us.`);
            this.battle.clearActiveMove(true);
            pokemon.moveThisTurnResult = false;
            return;
          }
        } else {
          sourceEffect = this.dex.conditions.get("lockedmove");
        }
        pokemon.moveUsed(move, targetLoc);
      }
      const noLock = externalMove && !pokemon.volatiles["lockedmove"];
      if (zMove) {
        if (pokemon.illusion) {
          this.battle.singleEvent("End", this.dex.abilities.get("Illusion"), pokemon.abilityState, pokemon);
        }
        this.battle.add("-zpower", pokemon);
        pokemon.m.zMoveUsed = true;
      }
      const moveDidSomething = this.battle.actions.useMove(baseMove, pokemon, target, sourceEffect, zMove, maxMove);
      if (this.battle.activeMove)
        move = this.battle.activeMove;
      this.battle.singleEvent("AfterMove", move, null, pokemon, target, move);
      this.battle.runEvent("AfterMove", pokemon, target, move);
      if (move.flags["dance"] && moveDidSomething && !move.isExternal) {
        const dancers = [];
        for (const currentPoke of this.battle.getAllActive()) {
          if (pokemon === currentPoke)
            continue;
          if (currentPoke.hasAbility("dancer") && !currentPoke.isSemiInvulnerable()) {
            dancers.push(currentPoke);
          }
        }
        dancers.sort(
          (a, b) => -(b.storedStats["spe"] - a.storedStats["spe"]) || b.abilityOrder - a.abilityOrder
        );
        for (const dancer of dancers) {
          if (this.battle.faintMessages())
            break;
          if (dancer.fainted)
            continue;
          this.battle.add("-activate", dancer, "ability: Dancer");
          const dancersTarget = !target.isAlly(dancer) && pokemon.isAlly(dancer) ? target : pokemon;
          const dancersTargetLoc = dancer.getLocOf(dancersTarget);
          this.runMove(move.id, dancer, dancersTargetLoc, this.dex.abilities.get("dancer"), void 0, true);
        }
      }
      if (noLock && pokemon.volatiles["lockedmove"])
        delete pokemon.volatiles["lockedmove"];
    },
    // Dollar Store Brand prankster immunity implementation
    hitStepTryImmunity(targets, pokemon, move) {
      const hitResults = [];
      for (const [i, target] of targets.entries()) {
        if (this.battle.gen >= 6 && move.flags["powder"] && target !== pokemon && !this.dex.getImmunity("powder", target)) {
          this.battle.debug("natural powder immunity");
          this.battle.add("-immune", target);
          hitResults[i] = false;
        } else if (!this.battle.singleEvent("TryImmunity", move, {}, target, pokemon, move)) {
          this.battle.add("-immune", target);
          hitResults[i] = false;
        } else if (this.battle.gen >= 7 && move.pranksterBoosted && (pokemon.hasAbility("prankster") || pokemon.hasAbility("plausibledeniability") || pokemon.volatiles["nol"]) && !targets[i].isAlly(pokemon) && !this.dex.getImmunity("prankster", target)) {
          this.battle.debug("natural prankster immunity");
          if (!target.illusion)
            this.battle.hint("Since gen 7, Dark is immune to Prankster moves.");
          this.battle.add("-immune", target);
          hitResults[i] = false;
        } else {
          hitResults[i] = true;
        }
      }
      return hitResults;
    },
    // For Jett's The Hunt is On!
    useMoveInner(moveOrMoveName, pokemon, target, sourceEffect, zMove, maxMove) {
      if (!sourceEffect && this.battle.effect.id)
        sourceEffect = this.battle.effect;
      if (sourceEffect && ["instruct", "custapberry"].includes(sourceEffect.id))
        sourceEffect = null;
      let move = this.dex.getActiveMove(moveOrMoveName);
      if (move.id === "weatherball" && zMove) {
        this.battle.singleEvent("ModifyType", move, null, pokemon, target, move, move);
        if (move.type !== "Normal")
          sourceEffect = move;
      }
      if (zMove || move.category !== "Status" && sourceEffect && sourceEffect.isZ) {
        move = this.getActiveZMove(move, pokemon);
      }
      if (maxMove && move.category !== "Status") {
        this.battle.singleEvent("ModifyType", move, null, pokemon, target, move, move);
        this.battle.runEvent("ModifyType", pokemon, target, move, move);
      }
      if (maxMove || move.category !== "Status" && sourceEffect && sourceEffect.isMax) {
        move = this.getActiveMaxMove(move, pokemon);
      }
      if (this.battle.activeMove) {
        move.priority = this.battle.activeMove.priority;
        if (!move.hasBounced)
          move.pranksterBoosted = this.battle.activeMove.pranksterBoosted;
      }
      const baseTarget = move.target;
      if (target === void 0)
        target = this.battle.getRandomTarget(pokemon, move);
      if (move.target === "self" || move.target === "allies") {
        target = pokemon;
      }
      if (sourceEffect) {
        move.sourceEffect = sourceEffect.id;
        move.ignoreAbility = false;
      }
      let moveResult = false;
      this.battle.setActiveMove(move, pokemon, target);
      this.battle.singleEvent("ModifyType", move, null, pokemon, target, move, move);
      this.battle.singleEvent("ModifyMove", move, null, pokemon, target, move, move);
      if (baseTarget !== move.target) {
        target = this.battle.getRandomTarget(pokemon, move);
      }
      move = this.battle.runEvent("ModifyType", pokemon, target, move, move);
      move = this.battle.runEvent("ModifyMove", pokemon, target, move, move);
      if (baseTarget !== move.target) {
        target = this.battle.getRandomTarget(pokemon, move);
      }
      if (!move || pokemon.fainted) {
        return false;
      }
      let attrs = "";
      let movename = move.name;
      if (move.id === "hiddenpower")
        movename = "Hidden Power";
      if (sourceEffect)
        attrs += "|[from]" + this.dex.conditions.get(sourceEffect);
      if (zMove && move.isZ === true) {
        attrs = "|[anim]" + movename + attrs;
        movename = "Z-" + movename;
      }
      this.battle.addMove("move", pokemon, movename, target + attrs);
      if (zMove)
        this.runZPower(move, pokemon);
      if (!target) {
        this.battle.attrLastMove("[notarget]");
        this.battle.add(this.battle.gen >= 5 ? "-fail" : "-notarget", pokemon);
        return false;
      }
      const { targets, pressureTargets } = pokemon.getMoveTargets(move, target);
      if (targets.length) {
        target = targets[targets.length - 1];
      }
      if (!sourceEffect || sourceEffect.id === "pursuit" || sourceEffect.id === "thehuntison") {
        let extraPP = 0;
        for (const source of pressureTargets) {
          const ppDrop = this.battle.runEvent("DeductPP", source, pokemon, move);
          if (ppDrop !== true) {
            extraPP += ppDrop || 0;
          }
        }
        if (extraPP > 0) {
          pokemon.deductPP(move, extraPP);
        }
      }
      if (!this.battle.singleEvent("TryMove", move, null, pokemon, target, move) || !this.battle.runEvent("TryMove", pokemon, target, move)) {
        move.mindBlownRecoil = false;
        return false;
      }
      this.battle.singleEvent("UseMoveMessage", move, null, pokemon, target, move);
      if (move.ignoreImmunity === void 0) {
        move.ignoreImmunity = move.category === "Status";
      }
      if (this.battle.gen !== 4 && move.selfdestruct === "always") {
        this.battle.faint(pokemon, pokemon, move);
      }
      let damage = false;
      if (move.target === "all" || move.target === "foeSide" || move.target === "allySide" || move.target === "allyTeam") {
        damage = this.tryMoveHit(target, pokemon, move);
        if (damage === this.battle.NOT_FAIL)
          pokemon.moveThisTurnResult = null;
        if (damage || damage === 0 || damage === void 0)
          moveResult = true;
      } else {
        if (!targets.length) {
          this.battle.attrLastMove("[notarget]");
          this.battle.add(this.battle.gen >= 5 ? "-fail" : "-notarget", pokemon);
          return false;
        }
        if (this.battle.gen === 4 && move.selfdestruct === "always") {
          this.battle.faint(pokemon, pokemon, move);
        }
        moveResult = this.trySpreadMoveHit(targets, pokemon, move);
      }
      if (move.selfBoost && moveResult)
        this.moveHit(pokemon, pokemon, move, move.selfBoost, false, true);
      if (!pokemon.hp) {
        this.battle.faint(pokemon, pokemon, move);
      }
      if (!moveResult) {
        this.battle.singleEvent("MoveFail", move, null, target, pokemon, move);
        return false;
      }
      if (!move.negateSecondary && !(move.hasSheerForce && pokemon.hasAbility(["sheerforce", "aquilasblessing"])) && !this.battle.getAllActive().some((x) => x.hasAbility("skilldrain"))) {
        const originalHp = pokemon.hp;
        this.battle.singleEvent("AfterMoveSecondarySelf", move, null, pokemon, target, move);
        this.battle.runEvent("AfterMoveSecondarySelf", pokemon, target, move);
        if (pokemon !== target && move.category !== "Status") {
          if (pokemon.hp <= pokemon.maxhp / 2 && originalHp > pokemon.maxhp / 2) {
            this.battle.runEvent("EmergencyExit", pokemon, pokemon);
          }
        }
      }
      if (move.selfSwitch && this.battle.getAllActive().some((x) => x.hasAbility("skilldrain"))) {
        this.battle.hint(`Self-switching doesn't trigger when a Pokemon with Skill Drain is active.`);
      }
      return true;
    },
    afterMoveSecondaryEvent(targets, pokemon, move) {
      if (!move.negateSecondary && !(move.hasSheerForce && pokemon.hasAbility(["sheerforce", "aquilasblessing"])) && !this.battle.getAllActive().some((x) => x.hasAbility("skilldrain"))) {
        this.battle.singleEvent("AfterMoveSecondary", move, null, targets[0], pokemon, move);
        this.battle.runEvent("AfterMoveSecondary", targets, pokemon, move);
      }
      return void 0;
    },
    hitStepMoveHitLoop(targets, pokemon, move) {
      const damage = [];
      for (const i of targets.keys()) {
        damage[i] = 0;
      }
      move.totalDamage = 0;
      pokemon.lastDamage = 0;
      let targetHits = move.multihit || 1;
      if (Array.isArray(targetHits)) {
        if (targetHits[0] === 2 && targetHits[1] === 5) {
          if (this.battle.gen >= 5) {
            targetHits = this.battle.sample([2, 2, 3, 3, 4, 5]);
          } else {
            targetHits = this.battle.sample([2, 2, 2, 3, 3, 3, 4, 5]);
          }
        } else {
          targetHits = this.battle.random(targetHits[0], targetHits[1] + 1);
        }
      }
      targetHits = Math.floor(targetHits);
      let nullDamage = true;
      let moveDamage;
      const isSleepUsable = move.sleepUsable || this.dex.moves.get(move.sourceEffect).sleepUsable;
      let targetsCopy = targets.slice(0);
      let hit;
      for (hit = 1; hit <= targetHits; hit++) {
        if (damage.includes(false))
          break;
        if (hit > 1 && pokemon.status === "slp" && !isSleepUsable)
          break;
        if (targets.every((target2) => !target2?.hp))
          break;
        move.hit = hit;
        if (move.smartTarget && targets.length > 1) {
          targetsCopy = [targets[hit - 1]];
        } else {
          targetsCopy = targets.slice(0);
        }
        const target = targetsCopy[0];
        if (target && typeof move.smartTarget === "boolean") {
          if (hit > 1) {
            this.battle.addMove("-anim", pokemon, move.name, target);
          } else {
            this.battle.retargetLastMove(target);
          }
        }
        if (target && move.multiaccuracy && hit > 1) {
          let accuracy = move.accuracy;
          const boostTable = [1, 4 / 3, 5 / 3, 2, 7 / 3, 8 / 3, 3];
          if (accuracy !== true) {
            if (!move.ignoreAccuracy) {
              const boosts = this.battle.runEvent("ModifyBoost", pokemon, null, null, { ...pokemon.boosts });
              const boost = this.battle.clampIntRange(boosts["accuracy"], -6, 6);
              if (boost > 0) {
                accuracy *= boostTable[boost];
              } else {
                accuracy /= boostTable[-boost];
              }
            }
            if (!move.ignoreEvasion) {
              const boosts = this.battle.runEvent("ModifyBoost", target, null, null, { ...target.boosts });
              const boost = this.battle.clampIntRange(boosts["evasion"], -6, 6);
              if (boost > 0) {
                accuracy /= boostTable[boost];
              } else if (boost < 0) {
                accuracy *= boostTable[-boost];
              }
            }
          }
          accuracy = this.battle.runEvent("ModifyAccuracy", target, pokemon, move, accuracy);
          if (!move.alwaysHit) {
            accuracy = this.battle.runEvent("Accuracy", target, pokemon, move, accuracy);
            if (accuracy !== true && !this.battle.randomChance(accuracy, 100))
              break;
          }
        }
        const moveData = move;
        if (!moveData.flags)
          moveData.flags = {};
        [moveDamage, targetsCopy] = this.spreadMoveHit(targetsCopy, pokemon, move, moveData);
        if (!moveDamage.some((val) => val !== false))
          break;
        nullDamage = false;
        for (const [i, md] of moveDamage.entries()) {
          damage[i] = md === true || !md ? 0 : md;
          move.totalDamage += damage[i];
        }
        if (move.mindBlownRecoil) {
          this.battle.damage(Math.round(pokemon.maxhp / 2), pokemon, pokemon, this.dex.conditions.get("Mind Blown"), true);
          move.mindBlownRecoil = false;
        }
        this.battle.eachEvent("Update");
        if (!pokemon.hp && targets.length === 1) {
          hit++;
          break;
        }
      }
      if (hit === 1)
        return damage.fill(false);
      if (nullDamage)
        damage.fill(false);
      if (move.multihit && typeof move.smartTarget !== "boolean") {
        this.battle.add("-hitcount", targets[0], hit - 1);
      }
      if (move.recoil && move.totalDamage) {
        this.battle.damage(this.calcRecoilDamage(move.totalDamage, move, pokemon), pokemon, pokemon, "recoil");
      }
      if (move.struggleRecoil) {
        let recoilDamage;
        if (this.dex.gen >= 5) {
          recoilDamage = this.battle.clampIntRange(Math.round(pokemon.baseMaxhp / 4), 1);
        } else {
          recoilDamage = this.battle.trunc(pokemon.maxhp / 4);
        }
        this.battle.directDamage(recoilDamage, pokemon, pokemon, { id: "strugglerecoil" });
      }
      if (move.smartTarget)
        targetsCopy = targets.slice(0);
      for (const [i, target] of targetsCopy.entries()) {
        if (target && pokemon !== target) {
          target.gotAttacked(move, damage[i], pokemon);
        }
      }
      if (move.ohko && !targets[0].hp)
        this.battle.add("-ohko");
      if (!damage.some((val) => !!val || val === 0))
        return damage;
      this.battle.eachEvent("Update");
      this.afterMoveSecondaryEvent(targetsCopy.filter((val) => !!val), pokemon, move);
      if (!move.negateSecondary && !(move.hasSheerForce && pokemon.hasAbility(["sheerforce", "aquilasblessing"])) && !this.battle.getAllActive().some((x) => x.hasAbility("skilldrain"))) {
        for (const [i, d] of damage.entries()) {
          const curDamage = targets.length === 1 ? move.totalDamage : d;
          if (typeof curDamage === "number" && targets[i].hp) {
            if (targets[i].hp <= targets[i].maxhp / 2 && targets[i].hp + curDamage > targets[i].maxhp / 2) {
              this.battle.runEvent("EmergencyExit", targets[i], pokemon);
            }
          }
        }
      }
      return damage;
    },
    // For Spandan's custom move and Brandon's ability
    getDamage(source, target, move, suppressMessages = false) {
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
      const category = this.battle.getCategory(move);
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
      const level = source.level;
      const attacker = move.overrideOffensivePokemon === "target" ? target : source;
      const defender = move.overrideDefensivePokemon === "source" ? source : target;
      const isPhysical = move.category === "Physical";
      let attackStat = move.overrideOffensiveStat || (isPhysical ? "atk" : "spa");
      const defenseStat = move.overrideDefensiveStat || (isPhysical ? "def" : "spd");
      const statTable = { atk: "Atk", def: "Def", spa: "SpA", spd: "SpD", spe: "Spe" };
      let atkBoosts = attacker.boosts[attackStat];
      let defBoosts = defender.boosts[defenseStat];
      let ignoreNegativeOffensive = !!move.ignoreNegativeOffensive;
      let ignorePositiveDefensive = !!move.ignorePositiveDefensive;
      if (moveHit.crit) {
        ignoreNegativeOffensive = true;
        ignorePositiveDefensive = true;
      }
      const ignoreOffensive = !!(move.ignoreOffensive || ignoreNegativeOffensive && atkBoosts < 0);
      const ignoreDefensive = !!(move.ignoreDefensive || ignorePositiveDefensive && defBoosts > 0);
      if (ignoreOffensive) {
        this.battle.debug("Negating (sp)atk boost/penalty.");
        atkBoosts = 0;
      }
      if (ignoreDefensive) {
        this.battle.debug("Negating (sp)def boost/penalty.");
        defBoosts = 0;
      }
      let attack = attacker.calculateStat(attackStat, atkBoosts);
      let defense = defender.calculateStat(defenseStat, defBoosts);
      attackStat = category === "Physical" ? "atk" : "spa";
      attack = this.battle.runEvent("Modify" + statTable[attackStat], source, target, move, attack);
      defense = this.battle.runEvent("Modify" + statTable[defenseStat], target, source, move, defense);
      if (this.battle.gen <= 4 && ["explosion", "selfdestruct"].includes(move.id) && defenseStat === "def") {
        defense = this.battle.clampIntRange(Math.floor(defense / 2), 1);
      }
      const tr = this.battle.trunc;
      const baseDamage = tr(tr(tr(tr(2 * level / 5 + 2) * basePower * attack) / defense) / 50);
      return this.modifyDamage(baseDamage, source, target, move, suppressMessages);
    },
    runMoveEffects(damage, targets, pokemon, move, moveData, isSecondary, isSelf) {
      let didAnything = damage.reduce(this.combineResults);
      for (const [i, target] of targets.entries()) {
        if (target === false)
          continue;
        let hitResult;
        let didSomething = void 0;
        if (target) {
          if (moveData.boosts && !target.fainted) {
            hitResult = this.battle.boost(moveData.boosts, target, pokemon, move, isSecondary, isSelf);
            didSomething = this.combineResults(didSomething, hitResult);
          }
          if (moveData.heal && !target.fainted) {
            if (target.hp >= target.maxhp) {
              this.battle.add("-fail", target, "heal");
              this.battle.attrLastMove("[still]");
              damage[i] = this.combineResults(damage[i], false);
              didAnything = this.combineResults(didAnything, null);
              continue;
            }
            const amount = target.baseMaxhp * moveData.heal[0] / moveData.heal[1];
            const d = target.heal((this.battle.gen < 5 ? Math.floor : Math.round)(amount));
            if (!d && d !== 0) {
              this.battle.add("-fail", pokemon);
              this.battle.attrLastMove("[still]");
              this.battle.debug("heal interrupted");
              damage[i] = this.combineResults(damage[i], false);
              didAnything = this.combineResults(didAnything, null);
              continue;
            }
            this.battle.add("-heal", target, target.getHealth);
            didSomething = true;
          }
          if (moveData.status) {
            hitResult = target.trySetStatus(moveData.status, pokemon, moveData.ability ? moveData.ability : move);
            if (!hitResult && move.status) {
              damage[i] = this.combineResults(damage[i], false);
              didAnything = this.combineResults(didAnything, null);
              continue;
            }
            didSomething = this.combineResults(didSomething, hitResult);
          }
          if (moveData.forceStatus) {
            hitResult = target.setStatus(moveData.forceStatus, pokemon, move);
            didSomething = this.combineResults(didSomething, hitResult);
          }
          if (moveData.volatileStatus) {
            hitResult = target.addVolatile(moveData.volatileStatus, pokemon, move);
            didSomething = this.combineResults(didSomething, hitResult);
          }
          if (moveData.sideCondition) {
            hitResult = target.side.addSideCondition(moveData.sideCondition, pokemon, move);
            didSomething = this.combineResults(didSomething, hitResult);
          }
          if (moveData.slotCondition) {
            hitResult = target.side.addSlotCondition(target, moveData.slotCondition, pokemon, move);
            didSomething = this.combineResults(didSomething, hitResult);
          }
          if (moveData.weather) {
            hitResult = this.battle.field.setWeather(moveData.weather, pokemon, move);
            didSomething = this.combineResults(didSomething, hitResult);
          }
          if (moveData.terrain) {
            hitResult = this.battle.field.setTerrain(moveData.terrain, pokemon, move);
            didSomething = this.combineResults(didSomething, hitResult);
          }
          if (moveData.pseudoWeather) {
            hitResult = this.battle.field.addPseudoWeather(moveData.pseudoWeather, pokemon, move);
            didSomething = this.combineResults(didSomething, hitResult);
          }
          if (moveData.forceSwitch && !this.battle.getAllActive().some((x) => x.hasAbility("skilldrain"))) {
            hitResult = !!this.battle.canSwitch(target.side);
            didSomething = this.combineResults(didSomething, hitResult);
          }
          if (move.target === "all" && !isSelf) {
            if (moveData.onHitField) {
              hitResult = this.battle.singleEvent("HitField", moveData, {}, target, pokemon, move);
              didSomething = this.combineResults(didSomething, hitResult);
            }
          } else if ((move.target === "foeSide" || move.target === "allySide") && !isSelf) {
            if (moveData.onHitSide) {
              hitResult = this.battle.singleEvent("HitSide", moveData, {}, target.side, pokemon, move);
              didSomething = this.combineResults(didSomething, hitResult);
            }
          } else {
            if (moveData.onHit) {
              hitResult = this.battle.singleEvent("Hit", moveData, {}, target, pokemon, move);
              didSomething = this.combineResults(didSomething, hitResult);
            }
            if (!isSelf && !isSecondary) {
              this.battle.runEvent("Hit", target, pokemon, move);
            }
          }
        }
        if (moveData.selfdestruct === "ifHit" && damage[i] !== false) {
          this.battle.faint(pokemon, pokemon, move);
        }
        if (moveData.selfSwitch && !this.battle.getAllActive().some((x) => x.hasAbility("skilldrain"))) {
          if (this.battle.canSwitch(pokemon.side)) {
            didSomething = true;
          } else {
            didSomething = this.combineResults(didSomething, false);
          }
        }
        if (didSomething === void 0)
          didSomething = true;
        damage[i] = this.combineResults(damage[i], didSomething === null ? false : didSomething);
        didAnything = this.combineResults(didAnything, didSomething);
      }
      if (!didAnything && didAnything !== 0 && !moveData.self && !moveData.selfdestruct) {
        if (!isSelf && !isSecondary) {
          if (didAnything === false) {
            this.battle.add("-fail", pokemon);
            this.battle.attrLastMove("[still]");
          }
        }
        this.battle.debug("move failed because it did nothing");
      } else if (move.selfSwitch && pokemon.hp && !this.battle.getAllActive().some((x) => x.hasAbility("skilldrain"))) {
        pokemon.switchFlag = move.id;
      }
      return damage;
    }
  },
  pokemon: {
    isGrounded(negateImmunity) {
      if ("gravity" in this.battle.field.pseudoWeather)
        return true;
      if ("ingrain" in this.volatiles && this.battle.gen >= 4)
        return true;
      if ("smackdown" in this.volatiles)
        return true;
      const item = this.ignoringItem() ? "" : this.item;
      if (item === "ironball")
        return true;
      if (!negateImmunity && this.hasType("Flying") && !("roost" in this.volatiles))
        return false;
      if (this.hasAbility("levitate") && !this.battle.suppressingAbility())
        return null;
      if ("magnetrise" in this.volatiles)
        return false;
      if ("telekinesis" in this.volatiles)
        return false;
      return item !== "airballoon";
    },
    setStatus(status, source, sourceEffect, ignoreImmunities) {
      if (!this.hp)
        return false;
      status = this.battle.dex.conditions.get(status);
      if (this.battle.event) {
        if (!source)
          source = this.battle.event.source;
        if (!sourceEffect)
          sourceEffect = this.battle.effect;
      }
      if (!source)
        source = this;
      if (this.status === status.id) {
        if (sourceEffect?.status === this.status) {
          this.battle.add("-fail", this, this.status);
        } else if (sourceEffect?.status) {
          this.battle.add("-fail", source);
          this.battle.attrLastMove("[still]");
        }
        return false;
      }
      if (!ignoreImmunities && status.id && !((source?.hasAbility("corrosion") || source?.hasAbility("hackedcorrosion") || sourceEffect?.id === "cradilychaos") && ["tox", "psn"].includes(status.id))) {
        if (!this.runStatusImmunity(status.id === "tox" ? "psn" : status.id)) {
          this.battle.debug("immune to status");
          if (sourceEffect?.status) {
            this.battle.add("-immune", this);
          }
          return false;
        }
      }
      const prevStatus = this.status;
      const prevStatusState = this.statusState;
      if (status.id) {
        const result = this.battle.runEvent("SetStatus", this, source, sourceEffect, status);
        if (!result) {
          this.battle.debug("set status [" + status.id + "] interrupted");
          return result;
        }
      }
      this.status = status.id;
      this.statusState = { id: status.id, target: this };
      if (source)
        this.statusState.source = source;
      if (status.duration)
        this.statusState.duration = status.duration;
      if (status.durationCallback) {
        this.statusState.duration = status.durationCallback.call(this.battle, this, source, sourceEffect);
      }
      if (status.id && !this.battle.singleEvent("Start", status, this.statusState, this, source, sourceEffect)) {
        this.battle.debug("status start [" + status.id + "] interrupted");
        this.status = prevStatus;
        this.statusState = prevStatusState;
        return false;
      }
      if (status.id && !this.battle.runEvent("AfterSetStatus", this, source, sourceEffect, status)) {
        return false;
      }
      return true;
    }
  },
  // Modded to add a property to work with Struchni's move
  nextTurn() {
    this.turn++;
    this.lastSuccessfulMoveThisTurn = null;
    const trappedBySide = [];
    const stalenessBySide = [];
    for (const side of this.sides) {
      let sideTrapped = true;
      let sideStaleness;
      for (const pokemon of side.active) {
        if (!pokemon)
          continue;
        pokemon.moveThisTurn = "";
        pokemon.newlySwitched = false;
        pokemon.moveLastTurnResult = pokemon.moveThisTurnResult;
        pokemon.moveThisTurnResult = void 0;
        if (this.turn !== 1) {
          pokemon.usedItemThisTurn = false;
          pokemon.m.statsRaisedLastTurn = !!pokemon.statsRaisedThisTurn;
          pokemon.statsRaisedThisTurn = false;
          pokemon.statsLoweredThisTurn = false;
          pokemon.hurtThisTurn = null;
        }
        pokemon.maybeDisabled = false;
        for (const moveSlot of pokemon.moveSlots) {
          moveSlot.disabled = false;
          moveSlot.disabledSource = "";
        }
        this.runEvent("DisableMove", pokemon);
        if (!pokemon.ateBerry)
          pokemon.disableMove("belch");
        if (!pokemon.getItem().isBerry)
          pokemon.disableMove("stuffcheeks");
        if (pokemon.getLastAttackedBy() && this.gen >= 7)
          pokemon.knownType = true;
        for (let i = pokemon.attackedBy.length - 1; i >= 0; i--) {
          const attack = pokemon.attackedBy[i];
          if (attack.source.isActive) {
            attack.thisTurn = false;
          } else {
            pokemon.attackedBy.splice(pokemon.attackedBy.indexOf(attack), 1);
          }
        }
        if (this.gen >= 7) {
          const seenPokemon = pokemon.illusion || pokemon;
          const realTypeString = seenPokemon.getTypes(true).join("/");
          if (realTypeString !== seenPokemon.apparentType) {
            this.add("-start", pokemon, "typechange", realTypeString, "[silent]");
            seenPokemon.apparentType = realTypeString;
            if (pokemon.addedType) {
              this.add("-start", pokemon, "typeadd", pokemon.addedType, "[silent]");
            }
          }
        }
        pokemon.trapped = pokemon.maybeTrapped = false;
        this.runEvent("TrapPokemon", pokemon);
        if (!pokemon.knownType || this.dex.getImmunity("trapped", pokemon)) {
          this.runEvent("MaybeTrapPokemon", pokemon);
        }
        if (this.gen > 2) {
          for (const source of pokemon.foes()) {
            const species = (source.illusion || source).species;
            if (!species.abilities)
              continue;
            for (const abilitySlot in species.abilities) {
              const abilityName = species.abilities[abilitySlot];
              if (abilityName === source.ability) {
                continue;
              }
              const ruleTable = this.ruleTable;
              if ((ruleTable.has("+hackmons") || !ruleTable.has("obtainableabilities")) && !this.format.team) {
                continue;
              } else if (abilitySlot === "H" && species.unreleasedHidden) {
                continue;
              }
              const ability = this.dex.abilities.get(abilityName);
              if (ruleTable.has("-ability:" + ability.id))
                continue;
              if (pokemon.knownType && !this.dex.getImmunity("trapped", pokemon))
                continue;
              this.singleEvent("FoeMaybeTrapPokemon", ability, {}, pokemon, source);
            }
          }
        }
        if (pokemon.fainted)
          continue;
        sideTrapped = sideTrapped && pokemon.trapped;
        const staleness = pokemon.volatileStaleness || pokemon.staleness;
        if (staleness)
          sideStaleness = sideStaleness === "external" ? sideStaleness : staleness;
        pokemon.activeTurns++;
      }
      trappedBySide.push(sideTrapped);
      stalenessBySide.push(sideStaleness);
      side.faintedLastTurn = side.faintedThisTurn;
      side.faintedThisTurn = null;
    }
    if (this.maybeTriggerEndlessBattleClause(trappedBySide, stalenessBySide))
      return;
    if (this.gameType === "triples" && !this.sides.filter((side) => side.pokemonLeft > 1).length) {
      const actives = this.getAllActive();
      if (actives.length > 1 && !actives[0].isAdjacent(actives[1])) {
        this.swapPosition(actives[0], 1, "[silent]");
        this.swapPosition(actives[1], 1, "[silent]");
        this.add("-center");
      }
    }
    this.add("turn", this.turn);
    this.makeRequest("move");
  }
};
//# sourceMappingURL=scripts.js.map
