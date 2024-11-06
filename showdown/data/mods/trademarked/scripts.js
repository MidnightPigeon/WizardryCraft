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
  inherit: "gen9",
  nextTurn() {
    this.turn++;
    this.lastSuccessfulMoveThisTurn = null;
    for (const pokemon of this.getAllPokemon()) {
      pokemon.m.trademarkUsedThisTurn = false;
      pokemon.switchFlag = false;
      pokemon.forceSwitchFlag = false;
    }
    const dynamaxEnding = [];
    for (const pokemon of this.getAllActive()) {
      if (pokemon.volatiles["dynamax"]?.turns === 3) {
        dynamaxEnding.push(pokemon);
      }
    }
    if (dynamaxEnding.length > 1) {
      this.updateSpeed();
      this.speedSort(dynamaxEnding);
    }
    for (const pokemon of dynamaxEnding) {
      pokemon.removeVolatile("dynamax");
    }
    if (this.gen === 1) {
      for (const pokemon of this.getAllActive()) {
        if (pokemon.volatiles["partialtrappinglock"]) {
          const target = pokemon.volatiles["partialtrappinglock"].locked;
          if (target.hp <= 0 || !target.volatiles["partiallytrapped"]) {
            delete pokemon.volatiles["partialtrappinglock"];
          }
        }
        if (pokemon.volatiles["partiallytrapped"]) {
          const source = pokemon.volatiles["partiallytrapped"].source;
          if (source.hp <= 0 || !source.volatiles["partialtrappinglock"]) {
            delete pokemon.volatiles["partiallytrapped"];
          }
        }
      }
    }
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
        for (const moveSlot of pokemon.moveSlots) {
          const activeMove = this.dex.getActiveMove(moveSlot.id);
          this.singleEvent("DisableMove", activeMove, null, pokemon);
          if (activeMove.flags["cantusetwice"] && pokemon.lastMove?.id === moveSlot.id) {
            pokemon.disableMove(pokemon.lastMove.id);
          }
        }
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
        if (this.gen >= 7 && !pokemon.terastallized) {
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
    if (this.gameType === "triples" && this.sides.every((side) => side.pokemonLeft === 1)) {
      const actives = this.getAllActive();
      if (actives.length > 1 && !actives[0].isAdjacent(actives[1])) {
        this.swapPosition(actives[0], 1, "[silent]");
        this.swapPosition(actives[1], 1, "[silent]");
        this.add("-center");
      }
    }
    this.add("turn", this.turn);
    if (this.gameType === "multi") {
      for (const side of this.sides) {
        if (side.canDynamaxNow()) {
          if (this.turn === 1) {
            this.addSplit(side.id, ["-candynamax", side.id]);
          } else {
            this.add("-candynamax", side.id);
          }
        }
      }
    }
    if (this.gen === 2)
      this.quickClawRoll = this.randomChance(60, 256);
    if (this.gen === 3)
      this.quickClawRoll = this.randomChance(1, 5);
    if (this.ruleTable.has("crazyhouserule")) {
      for (const side of this.sides) {
        let buf = `raw|${side.name}'s team:<br />`;
        for (const pokemon of side.pokemon) {
          if (!buf.endsWith("<br />"))
            buf += "/</span>&#8203;";
          if (pokemon.fainted) {
            buf += `<span style="white-space:nowrap;"><span style="opacity:.3"><psicon pokemon="${pokemon.species.id}" /></span>`;
          } else {
            buf += `<span style="white-space:nowrap"><psicon pokemon="${pokemon.species.id}" />`;
          }
        }
        this.add(`${buf}</span>`);
      }
    }
    this.makeRequest("move");
  },
  pokemon: {
    getAbility() {
      const move = this.battle.dex.moves.get(this.battle.toID(this.ability));
      if (!move.exists)
        return Object.getPrototypeOf(this).getAbility.call(this);
      return {
        id: move.id,
        name: move.name,
        flags: {},
        // Does not need activation message with this
        fullname: "ability: " + move.name,
        onStart(pokemon) {
          if (pokemon.m.trademarkUsedThisTurn) {
            this.add("cant", pokemon, "ability: " + move.name);
            this.add("-hint", "Each Pokemon can use a trademark only once per turn to prevent infinite loops.");
          } else {
            pokemon.m.trademarkUsedThisTurn = true;
            const trademark = this.dex.getActiveMove(move.id);
            trademark.accuracy = true;
            this.actions.useMove(trademark, pokemon);
          }
        },
        toString() {
          return move.name;
        }
      };
    },
    transformInto(pokemon, effect) {
      const species = pokemon.species;
      if (pokemon.fainted || this.illusion || pokemon.illusion || pokemon.volatiles["substitute"] && this.battle.gen >= 5 || pokemon.transformed && this.battle.gen >= 2 || this.transformed && this.battle.gen >= 5 || species.name === "Eternatus-Eternamax" || ["Ogerpon", "Terapagos"].includes(species.baseSpecies) && (this.terastallized || pokemon.terastallized) || this.terastallized === "Stellar") {
        return false;
      }
      if (this.battle.dex.currentMod === "gen1stadium" && (species.name === "Ditto" || this.species.name === "Ditto" && pokemon.moves.includes("transform"))) {
        return false;
      }
      if (!this.setSpecies(species, effect, true))
        return false;
      this.transformed = true;
      this.weighthg = pokemon.weighthg;
      const types = pokemon.getTypes(true, true);
      this.setType(pokemon.volatiles["roost"] ? pokemon.volatiles["roost"].typeWas : types, true);
      this.addedType = pokemon.addedType;
      this.knownType = this.isAlly(pokemon) && pokemon.knownType;
      this.apparentType = pokemon.apparentType;
      let statName;
      for (statName in this.storedStats) {
        this.storedStats[statName] = pokemon.storedStats[statName];
        if (this.modifiedStats)
          this.modifiedStats[statName] = pokemon.modifiedStats[statName];
      }
      this.moveSlots = [];
      this.hpType = this.battle.gen >= 5 ? this.hpType : pokemon.hpType;
      this.hpPower = this.battle.gen >= 5 ? this.hpPower : pokemon.hpPower;
      this.timesAttacked = pokemon.timesAttacked;
      for (const moveSlot of pokemon.moveSlots) {
        let moveName = moveSlot.move;
        if (moveSlot.id === "hiddenpower") {
          moveName = "Hidden Power " + this.hpType;
        }
        this.moveSlots.push({
          move: moveName,
          id: moveSlot.id,
          pp: moveSlot.maxpp === 1 ? 1 : 5,
          maxpp: this.battle.gen >= 5 ? moveSlot.maxpp === 1 ? 1 : 5 : moveSlot.maxpp,
          target: moveSlot.target,
          disabled: false,
          used: false,
          virtual: true
        });
      }
      let boostName;
      for (boostName in pokemon.boosts) {
        this.boosts[boostName] = pokemon.boosts[boostName];
      }
      if (this.battle.gen >= 6) {
        const volatilesToCopy = ["dragoncheer", "focusenergy", "gmaxchistrike", "laserfocus"];
        for (const volatile of volatilesToCopy) {
          if (pokemon.volatiles[volatile]) {
            this.addVolatile(volatile);
            if (volatile === "gmaxchistrike")
              this.volatiles[volatile].layers = pokemon.volatiles[volatile].layers;
          } else {
            this.removeVolatile(volatile);
          }
        }
      }
      if (effect) {
        this.battle.add("-transform", this, pokemon, "[from] " + effect.fullname);
      } else {
        this.battle.add("-transform", this, pokemon);
      }
      if (this.terastallized) {
        this.knownType = true;
        this.apparentType = this.terastallized;
      }
      if (this.battle.gen > 2)
        this.setAbility(pokemon.getAbility(), this, true, true);
      if (this.battle.gen === 4) {
        if (this.species.num === 487) {
          if (this.species.name === "Giratina" && this.item === "griseousorb") {
            this.formeChange("Giratina-Origin");
          } else if (this.species.name === "Giratina-Origin" && this.item !== "griseousorb") {
            this.formeChange("Giratina");
          }
        }
        if (this.species.num === 493) {
          const item = this.getItem();
          const targetForme = item?.onPlate ? "Arceus-" + item.onPlate : "Arceus";
          if (this.species.name !== targetForme) {
            this.formeChange(targetForme);
          }
        }
      }
      if (this.species.baseSpecies === "Ogerpon" && this.canTerastallize)
        this.canTerastallize = false;
      if (this.species.baseSpecies === "Terapagos" && this.canTerastallize)
        this.canTerastallize = false;
      return true;
    }
  }
};
//# sourceMappingURL=scripts.js.map
