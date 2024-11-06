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
var abilities_exports = {};
__export(abilities_exports, {
  Abilities: () => Abilities
});
module.exports = __toCommonJS(abilities_exports);
const Abilities = {
  neutralizinggas: {
    inherit: true,
    // Ability suppression implemented in sim/pokemon.ts:Pokemon#ignoringAbility
    onPreStart(pokemon) {
      this.add("-ability", pokemon, "Neutralizing Gas");
      pokemon.abilityState.ending = false;
      for (const target of this.getAllActive()) {
        if (target.hasItem("Ability Shield")) {
          this.add("-block", target, "item: Ability Shield");
          continue;
        }
        if (target.illusion) {
          this.singleEvent("End", this.dex.abilities.get("Illusion"), target.abilityState, target, pokemon, "neutralizinggas");
        }
        if (target.volatiles["slowstart"]) {
          delete target.volatiles["slowstart"];
          this.add("-end", target, "Slow Start", "[silent]");
        }
        if (target.m.innate) {
          if (!this.dex.abilities.get(target.m.innate.slice(8)).flags["cantsuppress"]) {
            target.removeVolatile(target.m.innate);
          }
        }
      }
    },
    onEnd(source) {
      this.add("-end", source, "ability: Neutralizing Gas");
      if (source.abilityState.ending)
        return;
      source.abilityState.ending = true;
      const sortedActive = this.getAllActive();
      this.speedSort(sortedActive);
      for (const pokemon of sortedActive) {
        if (pokemon.m.innate) {
          if (!pokemon.volatiles[pokemon.m.innate])
            pokemon.addVolatile(pokemon.m.innate, pokemon);
        }
        if (pokemon !== source) {
          this.singleEvent("Start", pokemon.getAbility(), pokemon.abilityState, pokemon);
        }
      }
    }
  },
  trace: {
    inherit: true,
    onUpdate(pokemon) {
      if (!pokemon.isStarted || this.effectState.gaveUp)
        return;
      const isAbility = pokemon.ability === "trace";
      const possibleTargets = pokemon.adjacentFoes().filter(
        (target2) => !target2.getAbility().flags["notrace"] && target2.ability !== "noability"
      );
      if (!possibleTargets.length)
        return;
      const target = this.sample(possibleTargets);
      const ability = target.getAbility();
      this.add("-ability", pokemon, ability, "[from] ability: Trace", "[of] " + target);
      if (isAbility) {
        pokemon.setAbility(ability);
      } else {
        pokemon.removeVolatile("ability:trace");
        pokemon.addVolatile("ability:" + ability.id, pokemon);
      }
    }
  }
};
//# sourceMappingURL=abilities.js.map
