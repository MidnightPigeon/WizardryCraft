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
  RandomLetsGoTeams: () => RandomLetsGoTeams,
  default: () => random_teams_default
});
module.exports = __toCommonJS(random_teams_exports);
var import_random_teams = require("../gen8/random-teams");
class RandomLetsGoTeams extends import_random_teams.RandomGen8Teams {
  constructor(format, prng) {
    super(format, prng);
    this.randomData = require("./random-data.json");
    this.moveEnforcementCheckers = {
      Dark: (movePool, moves, abilities, types, counter) => !counter.get("Dark"),
      Dragon: (movePool, moves, abilities, types, counter) => !counter.get("Dragon"),
      Electric: (movePool, moves, abilities, types, counter) => !counter.get("Electric"),
      Fighting: (movePool, moves, abilities, types, counter) => !counter.get("Fighting") && (!!counter.setupType || !counter.get("Status")),
      Fire: (movePool, moves, abilities, types, counter) => !counter.get("Fire"),
      Ghost: (movePool, moves, abilities, types, counter) => !types.has("Dark") && !counter.get("Ghost"),
      Ground: (movePool, moves, abilities, types, counter) => !counter.get("Ground"),
      Ice: (movePool, moves, abilities, types, counter) => !counter.get("Ice"),
      Water: (movePool, moves, abilities, types, counter) => !counter.get("Water") || !counter.get("stab")
    };
  }
  shouldCullMove(move, types, moves, abilities, counter, movePool, teamDetails) {
    switch (move.id) {
      case "bulkup":
      case "swordsdance":
        return {
          cull: counter.setupType !== "Physical" || counter.get("physicalsetup") > 1 || counter.get("Physical") + counter.get("physicalpool") < 2,
          isSetup: true
        };
      case "calmmind":
      case "nastyplot":
      case "quiverdance":
        return {
          cull: counter.setupType !== "Special" || counter.get("specialsetup") > 1 || counter.get("Special") + counter.get("specialpool") < 2,
          isSetup: true
        };
      case "growth":
      case "shellsmash":
        return {
          cull: counter.setupType !== "Mixed" || counter.damagingMoves.size + counter.get("physicalpool") + counter.get("specialpool") < 2,
          isSetup: true
        };
      case "agility":
        return {
          cull: counter.damagingMoves.size < 2 && !counter.setupType,
          isSetup: !counter.setupType
        };
      case "dragontail":
        return { cull: !!counter.setupType || !!counter.get("speedsetup") || ["encore", "roar", "whirlwind"].some((m) => moves.has(m)) };
      case "fakeout":
      case "uturn":
      case "teleport":
        return { cull: !!counter.setupType || !!counter.get("speedsetup") || moves.has("substitute") };
      case "haze":
      case "leechseed":
      case "roar":
      case "whirlwind":
        return { cull: !!counter.setupType || !!counter.get("speedsetup") || moves.has("dragontail") };
      case "protect":
        return { cull: !!counter.setupType || ["rest", "lightscreen", "reflect"].some((m) => moves.has(m)) };
      case "seismictoss":
        return { cull: counter.damagingMoves.size > 1 || !!counter.setupType };
      case "stealthrock":
        return { cull: !!counter.setupType || !!counter.get("speedsetup") || !!teamDetails.stealthRock };
      case "leechlife":
      case "substitute":
        return { cull: moves.has("uturn") };
      case "dragonpulse":
        return { cull: moves.has("dragontail") || moves.has("outrage") };
      case "thunderbolt":
        return { cull: moves.has("thunder") };
      case "flareblitz":
      case "flamethrower":
        return { cull: moves.has("fireblast") || moves.has("firepunch") };
      case "megadrain":
        return { cull: moves.has("petaldance") || moves.has("powerwhip") };
      case "bonemerang":
        return { cull: moves.has("earthquake") };
      case "icebeam":
        return { cull: moves.has("blizzard") };
      case "rockslide":
        return { cull: moves.has("stoneedge") };
      case "hydropump":
      case "willowisp":
        return { cull: moves.has("scald") };
      case "surf":
        return { cull: moves.has("hydropump") || moves.has("scald") };
    }
    if (move.priority !== 0 && !!counter.get("speedsetup"))
      return { cull: true };
    if (move.category === "Physical" && counter.setupType === "Special" || move.category === "Special" && counter.setupType === "Physical") {
      if (!types.has(move.type) || counter.get("stab") > 1 || counter.get(move.category) < 2)
        return { cull: true };
    }
    return { cull: false };
  }
  randomSet(species, teamDetails = {}) {
    species = this.dex.species.get(species);
    let forme = species.name;
    if (typeof species.battleOnly === "string") {
      forme = species.battleOnly;
    }
    const data = this.randomData[species.id];
    const movePool = [...data.moves || this.dex.species.getMovePool(species.id)];
    const types = new Set(species.types);
    const moves = /* @__PURE__ */ new Set();
    let counter;
    do {
      while (moves.size < this.maxMoveCount && movePool.length) {
        const moveid = this.sampleNoReplace(movePool);
        moves.add(moveid);
      }
      counter = this.queryMoves(moves, species.types, /* @__PURE__ */ new Set(), movePool);
      for (const moveid of moves) {
        const move = this.dex.moves.get(moveid);
        let { cull, isSetup } = this.shouldCullMove(move, types, moves, /* @__PURE__ */ new Set(), counter, movePool, teamDetails);
        if (!isSetup && counter.setupType && counter.setupType !== "Mixed" && move.category !== counter.setupType && counter.get(counter.setupType) < 2 && // Mono-attacking with setup and RestTalk is allowed
        // Reject Status moves only if there is nothing else to reject
        (move.category !== "Status" || counter.get(counter.setupType) + counter.get("Status") > 3 && counter.get("physicalsetup") + counter.get("specialsetup") < 2)) {
          cull = true;
        }
        const moveIsRejectable = !move.damage && (move.category !== "Status" || !move.flags.heal) && (move.category === "Status" || !types.has(move.type) || move.selfSwitch || move.basePower && move.basePower < 40 && !move.multihit);
        if (moveIsRejectable && !cull && !isSetup && counter.get("physicalsetup") + counter.get("specialsetup") < 2 && (!counter.setupType || counter.setupType === "Mixed" || move.category !== counter.setupType && move.category !== "Status" || counter.get(counter.setupType) + counter.get("Status") > 3)) {
          if ((counter.damagingMoves.size === 0 || !counter.get("stab")) && (counter.get("physicalpool") || counter.get("specialpool"))) {
            cull = true;
          } else {
            for (const type of types) {
              if (this.moveEnforcementCheckers[type]?.(movePool, moves, /* @__PURE__ */ new Set(), types, counter, species, teamDetails))
                cull = true;
            }
          }
        }
        if (cull && movePool.length) {
          moves.delete(moveid);
          break;
        }
      }
    } while (moves.size < this.maxMoveCount && movePool.length);
    const ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
    if (!counter.get("Physical") && !moves.has("transform"))
      ivs.atk = 0;
    const requiredItem = species.requiredItem || (species.requiredItems ? this.sample(species.requiredItems) : null);
    return {
      name: species.baseSpecies,
      species: forme,
      level: this.adjustLevel || 100,
      gender: species.gender,
      happiness: 70,
      shiny: this.randomChance(1, 1024),
      item: requiredItem || "",
      ability: "No Ability",
      evs: { hp: 20, atk: 20, def: 20, spa: 20, spd: 20, spe: 20 },
      moves: Array.from(moves),
      ivs
    };
  }
  randomTeam() {
    this.enforceNoDirectCustomBanlistChanges();
    const pokemon = [];
    const pokemonPool = [];
    for (const id in this.dex.data.FormatsData) {
      const species = this.dex.species.get(id);
      if (species.num < 1 || species.num > 151 && ![808, 809].includes(species.num) || species.gen > 7 || species.nfe || !this.randomData[species.id]?.moves || this.forceMonotype && !species.types.includes(this.forceMonotype)) {
        continue;
      }
      pokemonPool.push(id);
    }
    const typeCount = {};
    const typeComboCount = {};
    const baseFormes = {};
    const teamDetails = {};
    while (pokemonPool.length && pokemon.length < this.maxTeamSize) {
      const species = this.dex.species.get(this.sampleNoReplace(pokemonPool));
      if (!species.exists)
        continue;
      if (baseFormes[species.baseSpecies])
        continue;
      const types = species.types;
      let skip = false;
      for (const type of species.types) {
        if (typeCount[type] > 1 && this.randomChance(4, 5)) {
          skip = true;
          break;
        }
      }
      if (skip)
        continue;
      const typeCombo = types.slice().sort().join();
      if (!this.forceMonotype && typeComboCount[typeCombo] >= 1)
        continue;
      const set = this.randomSet(species, teamDetails);
      pokemon.push(set);
      baseFormes[species.baseSpecies] = 1;
      for (const type of types) {
        if (type in typeCount) {
          typeCount[type]++;
        } else {
          typeCount[type] = 1;
        }
      }
      if (typeCombo in typeComboCount) {
        typeComboCount[typeCombo]++;
      } else {
        typeComboCount[typeCombo] = 1;
      }
      if (set.moves.includes("stealthrock"))
        teamDetails.stealthRock = 1;
      if (set.moves.includes("rapidspin"))
        teamDetails.rapidSpin = 1;
    }
    return pokemon;
  }
}
var random_teams_default = RandomLetsGoTeams;
//# sourceMappingURL=random-teams.js.map
