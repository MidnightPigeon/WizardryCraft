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
var random_teams_exports = {};
__export(random_teams_exports, {
  RandomPOTDTeams: () => RandomPOTDTeams,
  default: () => random_teams_default
});
module.exports = __toCommonJS(random_teams_exports);
var import_random_teams = require("./../../random-teams");
const potdPokemon = [
  "hoopa",
  "groudon",
  "dachsbun",
  "squawkabilly",
  "cacturne",
  "typhlosion",
  "jolteon",
  "masquerain",
  "falinks",
  "wyrdeer",
  "gardevoir",
  "decidueye",
  "hawlucha",
  "azelf",
  "gothitelle",
  "donphan",
  "pikachu",
  "zaciancrowned",
  "quagsire",
  "uxie",
  "dondozo",
  "orthworm",
  "klawf",
  "dunsparce",
  "avalugg",
  "pawmot",
  "qwilfish",
  "lilliganthisui"
];
class RandomPOTDTeams extends import_random_teams.RandomTeams {
  randomTeam() {
    this.enforceNoDirectCustomBanlistChanges();
    const seed = this.prng.seed;
    const ruleTable = this.dex.formats.getRuleTable(this.format);
    const pokemon = [];
    const isMonotype = !!this.forceMonotype || ruleTable.has("sametypeclause");
    const isDoubles = this.format.gameType !== "singles";
    const typePool = this.dex.types.names();
    const type = this.forceMonotype || this.sample(typePool);
    const day = new Date().getDate();
    const potd = this.dex.species.get(potdPokemon[day > 28 ? 27 : day - 1]);
    const baseFormes = {};
    const tierCount = {};
    const typeCount = {};
    const typeComboCount = {};
    const typeWeaknesses = {};
    const teamDetails = {};
    const pokemonList = isDoubles ? Object.keys(this.randomDoublesSets) : Object.keys(this.randomSets);
    const [pokemonPool, baseSpeciesPool] = this.getPokemonPool(
      type,
      pokemon,
      isMonotype,
      pokemonList.filter((m) => this.dex.species.get(m).baseSpecies !== potd.baseSpecies)
    );
    for (const typeName of potd.types) {
      typeCount[typeName] = 1;
    }
    typeComboCount[potd.types.slice().sort().join()] = 1;
    for (const typeName of this.dex.types.names()) {
      if (this.dex.getEffectiveness(typeName, potd) > 0) {
        typeWeaknesses[typeName] = 1;
      }
    }
    while (baseSpeciesPool.length && pokemon.length < this.maxTeamSize) {
      const baseSpecies = this.sampleNoReplace(baseSpeciesPool);
      let species = this.dex.species.get(this.sample(pokemonPool[baseSpecies]));
      if (!species.exists)
        continue;
      if (baseFormes[species.baseSpecies])
        continue;
      if (species.baseSpecies === "Zoroark" && pokemon.length >= this.maxTeamSize - 1)
        continue;
      if (pokemon.some((pkmn) => pkmn.name === "Zoroark") && pokemon.length >= this.maxTeamSize - 1 && this.getLevel(species, isDoubles) < 72 && !this.adjustLevel) {
        continue;
      }
      if (["Basculegion", "Houndstone", "Zacian", "Zamazenta"].includes(species.baseSpecies) && !pokemon.length)
        continue;
      const tier = species.tier;
      const types = species.types;
      const typeCombo = types.slice().sort().join();
      const limitFactor = Math.round(this.maxTeamSize / 6) || 1;
      if (!isMonotype && !this.forceMonotype) {
        let skip = false;
        for (const typeName of types) {
          if (typeCount[typeName] >= 2 * limitFactor) {
            skip = true;
            break;
          }
        }
        if (skip)
          continue;
        for (const typeName of this.dex.types.names()) {
          if (this.dex.getEffectiveness(typeName, species) > 0) {
            if (!typeWeaknesses[typeName])
              typeWeaknesses[typeName] = 0;
            if (typeWeaknesses[typeName] >= 3 * limitFactor) {
              skip = true;
              break;
            }
          }
        }
        if (skip)
          continue;
      }
      if (!this.forceMonotype && typeComboCount[typeCombo] >= (isMonotype ? 2 : 1) * limitFactor)
        continue;
      if (potd?.exists && (pokemon.length === 1 || this.maxTeamSize === 1))
        species = potd;
      const set = this.randomSet(species, teamDetails, pokemon.length === 0, isDoubles);
      pokemon.push(set);
      if (pokemon.length === this.maxTeamSize) {
        const illusion = teamDetails.illusion;
        if (illusion)
          pokemon[illusion - 1].level = pokemon[this.maxTeamSize - 1].level;
        break;
      }
      baseFormes[species.baseSpecies] = 1;
      if (tierCount[tier]) {
        tierCount[tier]++;
      } else {
        tierCount[tier] = 1;
      }
      if (pokemon.length !== 1 && this.maxTeamSize !== 1) {
        for (const typeName of types) {
          if (typeName in typeCount) {
            typeCount[typeName]++;
          } else {
            typeCount[typeName] = 1;
          }
        }
        if (typeCombo in typeComboCount) {
          typeComboCount[typeCombo]++;
        } else {
          typeComboCount[typeCombo] = 1;
        }
        for (const typeName of this.dex.types.names()) {
          if (this.dex.getEffectiveness(typeName, species) > 0) {
            typeWeaknesses[typeName]++;
          }
        }
      }
      if (set.ability === "Drizzle" || set.moves.includes("raindance"))
        teamDetails.rain = 1;
      if (set.ability === "Drought" || set.moves.includes("sunnyday"))
        teamDetails.sun = 1;
      if (set.ability === "Sand Stream")
        teamDetails.sand = 1;
      if (set.ability === "Snow Warning" || set.moves.includes("snowscape") || set.moves.includes("chillyreception")) {
        teamDetails.snow = 1;
      }
      if (set.moves.includes("spikes"))
        teamDetails.spikes = (teamDetails.spikes || 0) + 1;
      if (set.moves.includes("stealthrock"))
        teamDetails.stealthRock = 1;
      if (set.moves.includes("stickyweb"))
        teamDetails.stickyWeb = 1;
      if (set.moves.includes("stoneaxe"))
        teamDetails.stealthRock = 1;
      if (set.moves.includes("toxicspikes"))
        teamDetails.toxicSpikes = 1;
      if (set.moves.includes("defog"))
        teamDetails.defog = 1;
      if (set.moves.includes("rapidspin"))
        teamDetails.rapidSpin = 1;
      if (set.moves.includes("mortalspin"))
        teamDetails.rapidSpin = 1;
      if (set.moves.includes("tidyup"))
        teamDetails.rapidSpin = 1;
      if (set.moves.includes("auroraveil") || set.moves.includes("reflect") && set.moves.includes("lightscreen")) {
        teamDetails.screens = 1;
      }
      if (set.role === "Tera Blast user")
        teamDetails.teraBlast = 1;
      if (set.ability === "Illusion")
        teamDetails.illusion = pokemon.length;
    }
    if (pokemon.length < this.maxTeamSize && pokemon.length < 12) {
      throw new Error(`Could not build a random team for ${this.format} (seed=${seed})`);
    }
    return pokemon;
  }
}
var random_teams_default = RandomPOTDTeams;
//# sourceMappingURL=random-teams.js.map
