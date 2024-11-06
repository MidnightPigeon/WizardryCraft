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
var team_validator_exports = {};
__export(team_validator_exports, {
  PokemonSources: () => PokemonSources,
  TeamValidator: () => TeamValidator
});
module.exports = __toCommonJS(team_validator_exports);
var import_dex = require("./dex");
var import_lib = require("../lib");
var import_tags = require("../data/tags");
var import_teams = require("./teams");
var import_prng = require("./prng");
/**
 * Team Validator
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * Handles team validation, and specifically learnset checking.
 *
 * @license MIT
 */
class PokemonSources {
  constructor(sourcesBefore = 0, sourcesAfter = 0) {
    this.sources = [];
    this.sourcesBefore = sourcesBefore;
    this.sourcesAfter = sourcesAfter;
    this.isHidden = null;
    this.limitedEggMoves = void 0;
    this.moveEvoCarryCount = 0;
    this.dreamWorldMoveCount = 0;
  }
  size() {
    if (this.sourcesBefore)
      return Infinity;
    return this.sources.length;
  }
  add(source, limitedEggMove) {
    if (this.sources[this.sources.length - 1] !== source)
      this.sources.push(source);
    if (limitedEggMove) {
      if (source.substr(0, 3) === "1ET") {
        this.tradebackLimitedEggMoves = [limitedEggMove];
      }
    }
    if (limitedEggMove && this.limitedEggMoves !== null) {
      this.limitedEggMoves = [limitedEggMove];
    } else if (limitedEggMove === null) {
      this.limitedEggMoves = null;
    }
  }
  addGen(sourceGen) {
    this.sourcesBefore = Math.max(this.sourcesBefore, sourceGen);
    this.limitedEggMoves = null;
  }
  minSourceGen() {
    if (this.sourcesBefore)
      return this.sourcesAfter || 1;
    let min = 10;
    for (const source of this.sources) {
      const sourceGen = parseInt(source.charAt(0));
      if (sourceGen < min)
        min = sourceGen;
    }
    if (min === 10)
      return 0;
    return min;
  }
  maxSourceGen() {
    let max = this.sourcesBefore;
    for (const source of this.sources) {
      const sourceGen = parseInt(source.charAt(0));
      if (sourceGen > max)
        max = sourceGen;
    }
    return max;
  }
  intersectWith(other) {
    if (this.pomegEventEgg && other.pomegEggMoves) {
      const newSources = [];
      for (const source of other.sources) {
        newSources.push(source.substr(0, 2) === "3E" ? this.pomegEventEgg : source);
      }
      other.sources = newSources;
    } else if (other.pomegEventEgg && this.pomegEventEgg !== null) {
      const newSources = [];
      for (const source of this.sources) {
        newSources.push(source.substr(0, 2) === "3E" ? other.pomegEventEgg : source);
      }
      this.sources = newSources;
      this.pomegEventEgg = other.pomegEventEgg;
    } else if (!other.pomegEggMoves && !other.sourcesBefore) {
      this.pomegEventEgg = null;
    }
    if (other.sourcesBefore || this.sourcesBefore) {
      if (other.sourcesBefore > this.sourcesBefore) {
        for (const source of this.sources) {
          const sourceGen = parseInt(source.charAt(0));
          if (sourceGen <= other.sourcesBefore) {
            other.sources.push(source);
          }
        }
      } else if (this.sourcesBefore > other.sourcesBefore) {
        for (const source of other.sources) {
          const sourceGen = parseInt(source.charAt(0));
          if (sourceGen <= this.sourcesBefore) {
            this.sources.push(source);
          }
        }
      }
      this.sourcesBefore = Math.min(other.sourcesBefore, this.sourcesBefore);
    }
    if (this.sources.length) {
      if (other.sources.length) {
        const sourcesSet = new Set(other.sources);
        const intersectSources = this.sources.filter((source) => sourcesSet.has(source));
        this.sources = intersectSources;
      } else {
        this.sources = [];
      }
    }
    if (other.restrictedMove && other.restrictedMove !== this.restrictedMove) {
      if (this.restrictedMove) {
        this.sources = [];
        this.sourcesBefore = 0;
      } else {
        this.restrictedMove = other.restrictedMove;
      }
    }
    if (other.limitedEggMoves) {
      if (!this.limitedEggMoves) {
        this.limitedEggMoves = other.limitedEggMoves;
      } else {
        this.limitedEggMoves.push(...other.limitedEggMoves);
      }
    }
    if (other.possiblyLimitedEggMoves) {
      if (!this.possiblyLimitedEggMoves) {
        this.possiblyLimitedEggMoves = other.possiblyLimitedEggMoves;
      } else {
        this.possiblyLimitedEggMoves.push(...other.possiblyLimitedEggMoves);
      }
    }
    if (other.tradebackLimitedEggMoves) {
      if (!this.tradebackLimitedEggMoves) {
        this.tradebackLimitedEggMoves = other.tradebackLimitedEggMoves;
      } else {
        this.tradebackLimitedEggMoves.push(...other.tradebackLimitedEggMoves);
      }
    }
    if (other.levelUpEggMoves) {
      if (!this.levelUpEggMoves) {
        this.levelUpEggMoves = other.levelUpEggMoves;
      } else {
        this.levelUpEggMoves.push(...other.levelUpEggMoves);
      }
    }
    if (other.pomegEggMoves) {
      if (!this.pomegEggMoves) {
        this.pomegEggMoves = other.pomegEggMoves;
      } else {
        this.pomegEggMoves.push(...other.pomegEggMoves);
      }
    }
    if (this.possiblyLimitedEggMoves && !this.sourcesBefore) {
      const eggSources = this.sources.filter((source) => source.charAt(1) === "E");
      let minEggGen = parseInt(eggSources[0]);
      for (const source of eggSources) {
        minEggGen = Math.min(minEggGen, parseInt(source.charAt(0)));
      }
      if (minEggGen) {
        for (const eggMoveAndGen of this.possiblyLimitedEggMoves) {
          if (!this.limitedEggMoves)
            this.limitedEggMoves = [];
          if (parseInt(eggMoveAndGen.charAt(0)) < minEggGen) {
            const eggMove = (0, import_dex.toID)(eggMoveAndGen.substr(1));
            if (!this.limitedEggMoves.includes(eggMove))
              this.limitedEggMoves.push(eggMove);
          }
        }
      }
    }
    let eggTradebackLegal = false;
    for (const source of this.sources) {
      if (source.substr(0, 3) === "1ET") {
        eggTradebackLegal = true;
        break;
      }
    }
    if (!eggTradebackLegal && this.tradebackLimitedEggMoves) {
      for (const eggMove of this.tradebackLimitedEggMoves) {
        if (!this.limitedEggMoves)
          this.limitedEggMoves = [];
        if (!this.limitedEggMoves.includes(eggMove))
          this.limitedEggMoves.push(eggMove);
      }
    }
    this.moveEvoCarryCount += other.moveEvoCarryCount;
    this.dreamWorldMoveCount += other.dreamWorldMoveCount;
    if (other.sourcesAfter > this.sourcesAfter)
      this.sourcesAfter = other.sourcesAfter;
    if (other.isHidden)
      this.isHidden = true;
  }
}
class TeamValidator {
  constructor(format, dex = import_dex.Dex) {
    this.format = dex.formats.get(format);
    this.dex = dex.forFormat(this.format);
    this.gen = this.dex.gen;
    this.ruleTable = this.dex.formats.getRuleTable(this.format);
    this.minSourceGen = this.ruleTable.minSourceGen;
    this.toID = import_dex.toID;
  }
  validateTeam(team, options = {}) {
    if (team && this.format.validateTeam) {
      return this.format.validateTeam.call(this, team, options) || null;
    }
    return this.baseValidateTeam(team, options);
  }
  baseValidateTeam(team, options = {}) {
    const format = this.format;
    const dex = this.dex;
    let problems = [];
    const ruleTable = this.ruleTable;
    if (format.team) {
      if (team) {
        return [
          `This format doesn't let you use your own team.`,
          `If you're not using a custom client, please report this as a bug. If you are, remember to use \`/utm null\` before starting a game in this format.`
        ];
      }
      const testTeamSeed = import_prng.PRNG.generateSeed();
      try {
        const testTeamGenerator = import_teams.Teams.getGenerator(format, testTeamSeed);
        testTeamGenerator.getTeam(options);
      } catch (e) {
        return [
          `${format.name}'s team generator (${format.team}) failed using these rules and seed (${testTeamSeed}):-`,
          `${e}`
        ];
      }
      return null;
    }
    if (!team) {
      return [
        `This format requires you to use your own team.`,
        `If you're not using a custom client, please report this as a bug.`
      ];
    }
    if (!Array.isArray(team)) {
      throw new Error(`Invalid team data`);
    }
    if (team.length < ruleTable.minTeamSize) {
      problems.push(`You must bring at least ${ruleTable.minTeamSize} Pok\xE9mon (your team has ${team.length}).`);
    }
    if (team.length > ruleTable.maxTeamSize) {
      return [`You may only bring up to ${ruleTable.maxTeamSize} Pok\xE9mon (your team has ${team.length}).`];
    }
    if (team.length > 24) {
      problems.push(`Your team has more than than 24 Pok\xE9mon, which the simulator can't handle.`);
      return problems;
    }
    const teamHas = {};
    let lgpeStarterCount = 0;
    let deoxysType;
    for (const set of team) {
      if (!set)
        return [`You sent invalid team data. If you're not using a custom client, please report this as a bug.`];
      let setProblems = null;
      if (options.skipSets && options.skipSets[set.name]) {
        for (const i in options.skipSets[set.name]) {
          teamHas[i] = (teamHas[i] || 0) + 1;
        }
      } else {
        setProblems = (format.validateSet || this.validateSet).call(this, set, teamHas);
      }
      if (set.species === "Pikachu-Starter" || set.species === "Eevee-Starter") {
        lgpeStarterCount++;
        if (lgpeStarterCount === 2 && ruleTable.isBanned("nonexistent")) {
          problems.push(`You can only have one of Pikachu-Starter or Eevee-Starter on a team.`);
        }
      }
      if (dex.gen === 3 && set.species.startsWith("Deoxys")) {
        if (!deoxysType) {
          deoxysType = set.species;
        } else if (deoxysType !== set.species && ruleTable.isBanned("nonexistent")) {
          return [
            `You cannot have more than one type of Deoxys forme.`,
            `(Each game in Gen 3 supports only one forme of Deoxys.)`
          ];
        }
      }
      if (setProblems) {
        problems = problems.concat(setProblems);
      }
      if (options.removeNicknames) {
        const useCrossSpeciesNicknames = format.name.includes("Cross Evolution") || ruleTable.has("franticfusionsmod");
        const species = dex.species.get(set.species);
        let crossSpecies;
        if (useCrossSpeciesNicknames && (crossSpecies = dex.species.get(set.name)).exists) {
          set.name = crossSpecies.name;
        } else {
          set.name = species.baseSpecies;
          if (species.baseSpecies === "Unown")
            set.species = "Unown";
        }
      }
    }
    for (const [rule, source, limit, bans] of ruleTable.complexTeamBans) {
      let count = 0;
      for (const ban of bans) {
        if (teamHas[ban] > 0) {
          count += limit ? teamHas[ban] : 1;
        }
      }
      if (limit && count > limit) {
        const clause = source ? ` by ${source}` : ``;
        problems.push(`You are limited to ${limit} of ${rule}${clause}.`);
      } else if (!limit && count >= bans.length) {
        const clause = source ? ` by ${source}` : ``;
        problems.push(`Your team has the combination of ${rule}, which is banned${clause}.`);
      }
    }
    for (const rule of ruleTable.keys()) {
      if ("!+-".includes(rule.charAt(0)))
        continue;
      const subformat = dex.formats.get(rule);
      if (subformat.onValidateTeam && ruleTable.has(subformat.id)) {
        problems = problems.concat(subformat.onValidateTeam.call(this, team, format, teamHas) || []);
      }
    }
    if (format.onValidateTeam) {
      problems = problems.concat(format.onValidateTeam.call(this, team, format, teamHas) || []);
    }
    if (!problems.length)
      return null;
    return problems;
  }
  getEventOnlyData(species, noRecurse) {
    const dex = this.dex;
    const learnset = dex.species.getLearnsetData(species.id);
    if (!learnset?.eventOnly) {
      if (noRecurse)
        return null;
      return this.getEventOnlyData(dex.species.get(species.prevo), true);
    }
    if (!learnset.eventData && species.forme) {
      return this.getEventOnlyData(dex.species.get(species.baseSpecies), true);
    }
    if (!learnset.eventData) {
      throw new Error(`Event-only species ${species.name} has no eventData table`);
    }
    return { species, eventData: learnset.eventData };
  }
  getValidationSpecies(set) {
    const dex = this.dex;
    const ruleTable = this.ruleTable;
    const species = dex.species.get(set.species);
    const item = dex.items.get(set.item);
    const ability = dex.abilities.get(set.ability);
    let outOfBattleSpecies = species;
    let tierSpecies = species;
    if (ability.id === "battlebond" && (0, import_dex.toID)(species.baseSpecies) === "greninja") {
      outOfBattleSpecies = dex.species.get("greninjabond");
      if (ruleTable.has("obtainableformes")) {
        tierSpecies = outOfBattleSpecies;
      }
    }
    if (ability.id === "owntempo" && species.id === "rockruff") {
      tierSpecies = outOfBattleSpecies = dex.species.get("rockruffdusk");
    }
    if (ruleTable.has("obtainableformes")) {
      const canMegaEvo = dex.gen <= 7 || ruleTable.has("+pokemontag:past");
      if (item.megaEvolves === species.name) {
        if (!item.megaStone)
          throw new Error(`Item ${item.name} has no base form for mega evolution`);
        tierSpecies = dex.species.get(item.megaStone);
      } else if (item.id === "redorb" && species.id === "groudon") {
        tierSpecies = dex.species.get("Groudon-Primal");
      } else if (item.id === "blueorb" && species.id === "kyogre") {
        tierSpecies = dex.species.get("Kyogre-Primal");
      } else if (canMegaEvo && species.id === "rayquaza" && set.moves.map(import_dex.toID).includes("dragonascent") && !ruleTable.has("megarayquazaclause")) {
        tierSpecies = dex.species.get("Rayquaza-Mega");
      } else if (item.id === "rustedsword" && species.id === "zacian") {
        tierSpecies = dex.species.get("Zacian-Crowned");
      } else if (item.id === "rustedshield" && species.id === "zamazenta") {
        tierSpecies = dex.species.get("Zamazenta-Crowned");
      }
    }
    return [outOfBattleSpecies, tierSpecies];
  }
  validateSet(set, teamHas) {
    const format = this.format;
    const dex = this.dex;
    const ruleTable = this.ruleTable;
    let problems = [];
    if (!set) {
      return [`This is not a Pokemon.`];
    }
    let species = dex.species.get(set.species);
    set.species = species.name;
    if (set.species.toLowerCase().endsWith("-gmax") && this.format.id !== "gen8megamax") {
      set.species = set.species.slice(0, -5);
      species = dex.species.get(set.species);
      if (set.name && set.name.endsWith("-Gmax"))
        set.name = species.baseSpecies;
      set.gigantamax = true;
    }
    if (set.name && set.name.length > 18) {
      if (set.name === set.species) {
        set.name = species.baseSpecies;
      } else {
        problems.push(`Nickname "${set.name}" too long (should be 18 characters or fewer)`);
      }
    }
    set.name = dex.getName(set.name);
    let item = dex.items.get(import_lib.Utils.getString(set.item));
    set.item = item.name;
    let ability = dex.abilities.get(import_lib.Utils.getString(set.ability));
    set.ability = ability.name;
    let nature = dex.natures.get(import_lib.Utils.getString(set.nature));
    set.nature = nature.name;
    if (!Array.isArray(set.moves))
      set.moves = [];
    set.name = set.name || species.baseSpecies;
    let name = set.species;
    if (set.species !== set.name && species.baseSpecies !== set.name) {
      name = `${set.name} (${set.species})`;
    }
    if (!set.teraType && this.gen === 9) {
      set.teraType = species.types[0];
    }
    if (!set.level)
      set.level = ruleTable.defaultLevel;
    let adjustLevel = ruleTable.adjustLevel;
    if (ruleTable.adjustLevelDown && set.level >= ruleTable.adjustLevelDown) {
      adjustLevel = ruleTable.adjustLevelDown;
    }
    if (set.level === adjustLevel || set.level === 100 && ruleTable.maxLevel < 100) {
      set.level = ruleTable.maxLevel;
    }
    if (set.level < ruleTable.minLevel) {
      problems.push(`${name} (level ${set.level}) is below the minimum level of ${ruleTable.minLevel}${ruleTable.blame("minlevel")}`);
    }
    if (set.level > ruleTable.maxLevel) {
      problems.push(`${name} (level ${set.level}) is above the maximum level of ${ruleTable.maxLevel}${ruleTable.blame("maxlevel")}`);
    }
    const setHas = {};
    if (!set.evs)
      set.evs = TeamValidator.fillStats(null, ruleTable.evLimit === null ? 252 : 0);
    if (!set.ivs)
      set.ivs = TeamValidator.fillStats(null, 31);
    if (ruleTable.has("obtainableformes")) {
      problems.push(...this.validateForme(set));
      species = dex.species.get(set.species);
    }
    const setSources = this.allSources(species);
    for (const [rule] of ruleTable) {
      if ("!+-".includes(rule.charAt(0)))
        continue;
      const subformat = dex.formats.get(rule);
      if (subformat.onChangeSet && ruleTable.has(subformat.id)) {
        problems = problems.concat(subformat.onChangeSet.call(this, set, format, setHas, teamHas) || []);
      }
    }
    if (format.onChangeSet) {
      problems = problems.concat(format.onChangeSet.call(this, set, format, setHas, teamHas) || []);
    }
    species = dex.species.get(set.species);
    item = dex.items.get(set.item);
    ability = dex.abilities.get(set.ability);
    const [outOfBattleSpecies, tierSpecies] = this.getValidationSpecies(set);
    if (ability.id === "battlebond" && (0, import_dex.toID)(species.baseSpecies) === "greninja") {
      if (ruleTable.has("obtainablemisc")) {
        if (set.gender && set.gender !== "M") {
          problems.push(`Battle Bond Greninja must be male.`);
        }
        set.gender = "M";
      }
    }
    if (species.id === "melmetal" && set.gigantamax && this.dex.species.getLearnsetData(species.id).eventData) {
      setSources.sourcesBefore = 0;
      setSources.sources = ["8S0 melmetal"];
    }
    if (!species.exists) {
      return [`The Pokemon "${set.species}" does not exist.`];
    }
    if (item.id && !item.exists) {
      return [`"${set.item}" is an invalid item.`];
    }
    if (ability.id && !ability.exists) {
      if (dex.gen < 3) {
        ability = dex.abilities.get("");
        set.ability = "";
      } else {
        return [`"${set.ability}" is an invalid ability.`];
      }
    }
    if (nature.id && !nature.exists) {
      if (dex.gen < 3) {
        nature = dex.natures.get("");
        set.nature = "";
      } else {
        problems.push(`"${set.nature}" is an invalid nature.`);
      }
    }
    if (set.happiness !== void 0 && isNaN(set.happiness)) {
      problems.push(`${name} has an invalid happiness value.`);
    }
    if (set.hpType) {
      const type = dex.types.get(set.hpType);
      if (!type.exists || ["normal", "fairy"].includes(type.id)) {
        problems.push(`${name}'s Hidden Power type (${set.hpType}) is invalid.`);
      } else {
        set.hpType = type.name;
      }
    }
    if (species.forceTeraType) {
      set.teraType = species.forceTeraType;
    }
    if (set.teraType) {
      const type = dex.types.get(set.teraType);
      if (!type.exists) {
        problems.push(`${name}'s Terastal type (${set.teraType}) is invalid.`);
      } else {
        set.teraType = type.name;
      }
    }
    let problem = this.checkSpecies(set, species, tierSpecies, setHas);
    if (problem)
      problems.push(problem);
    problem = this.checkItem(set, item, setHas);
    if (problem)
      problems.push(problem);
    if (ruleTable.has("obtainablemisc")) {
      if (dex.gen === 4 && item.id === "griseousorb" && species.num !== 487) {
        problems.push(`${set.name} cannot hold the Griseous Orb.`, `(In Gen 4, only Giratina could hold the Griseous Orb).`);
      }
      if (dex.gen <= 1) {
        if (item.id) {
          set.item = "";
        }
      }
    }
    if (!set.ability)
      set.ability = "No Ability";
    if (ruleTable.has("obtainableabilities")) {
      if (dex.gen <= 2 || dex.currentMod === "gen7letsgo") {
        set.ability = "No Ability";
      } else {
        if (!ability.name || ability.name === "No Ability") {
          problems.push(`${name} needs to have an ability.`);
        } else if (!Object.values(species.abilities).includes(ability.name)) {
          if (tierSpecies.abilities[0] === ability.name) {
            set.ability = species.abilities[0];
          } else {
            problems.push(`${name} can't have ${set.ability}.`);
          }
        }
        if (ability.name === species.abilities["H"]) {
          setSources.isHidden = true;
          let unreleasedHidden = species.unreleasedHidden;
          if (unreleasedHidden === "Past" && this.minSourceGen < dex.gen)
            unreleasedHidden = false;
          if (unreleasedHidden && ruleTable.has("-unreleased")) {
            problems.push(`${name}'s Hidden Ability is unreleased.`);
          } else if (dex.gen === 7 && ["entei", "suicune", "raikou"].includes(species.id) && this.minSourceGen > 1) {
            problems.push(`${name}'s Hidden Ability is only available from Virtual Console, which is not allowed in this format.`);
          } else if (dex.gen === 6 && ability.name === "Symbiosis" && (set.species.endsWith("Orange") || set.species.endsWith("White"))) {
            problems.push(`${name}'s Hidden Ability is unreleased for the Orange and White forms.`);
          } else if (dex.gen === 5 && set.level < 10 && (species.maleOnlyHidden || species.gender === "N")) {
            problems.push(`${name} must be at least level 10 to have a Hidden Ability.`);
          }
          if (species.maleOnlyHidden) {
            if (set.gender && set.gender !== "M") {
              problems.push(`${name} must be male to have a Hidden Ability.`);
            }
            set.gender = "M";
            setSources.sources = ["5D"];
          }
        } else {
          setSources.isHidden = false;
        }
      }
    }
    ability = dex.abilities.get(set.ability);
    problem = this.checkAbility(set, ability, setHas);
    if (problem)
      problems.push(problem);
    if (!set.nature || dex.gen <= 2) {
      set.nature = "";
    }
    nature = dex.natures.get(set.nature);
    problem = this.checkNature(set, nature, setHas);
    if (problem)
      problems.push(problem);
    if (set.moves && Array.isArray(set.moves)) {
      set.moves = set.moves.filter((val) => val);
    }
    if (!set.moves?.length) {
      problems.push(`${name} has no moves (it must have at least one to be usable).`);
      set.moves = [];
    }
    if (set.moves.length > ruleTable.maxMoveCount) {
      problems.push(`${name} has ${set.moves.length} moves, which is more than the limit of ${ruleTable.maxMoveCount}.`);
      return problems;
    }
    const moveLegalityWhitelist = {};
    for (const moveName of set.moves) {
      if (!moveName)
        continue;
      const move = dex.moves.get(import_lib.Utils.getString(moveName));
      if (!move.exists)
        return [`"${move.name}" is an invalid move.`];
      problem = this.checkMove(set, move, setHas);
      if (problem) {
        let allowedByOM;
        if (problem.includes("hacking or glitches") && ruleTable.has("omunobtainablemoves")) {
          problem = `${name}'s ${problem}`;
          allowedByOM = !this.omCheckCanLearn(move, outOfBattleSpecies, setSources, set, problem);
        }
        if (!allowedByOM) {
          problems.push(problem);
        } else {
          moveLegalityWhitelist[move.id] = true;
        }
      }
    }
    const pokemonGoProblems = this.validatePokemonGo(outOfBattleSpecies, set, setSources);
    const learnsetSpecies = dex.species.getLearnsetData(outOfBattleSpecies.id);
    let isFromRBYEncounter = false;
    if (this.gen === 1 && ruleTable.has("obtainablemisc") && !this.ruleTable.has("allowtradeback")) {
      let lowestEncounterLevel;
      for (const encounter of learnsetSpecies.encounters || []) {
        if (encounter.generation !== 1)
          continue;
        if (!encounter.level)
          continue;
        if (lowestEncounterLevel && encounter.level > lowestEncounterLevel)
          continue;
        lowestEncounterLevel = encounter.level;
      }
      if (lowestEncounterLevel) {
        if (set.level < lowestEncounterLevel) {
          problems.push(`${name} is not obtainable at levels below ${lowestEncounterLevel} in Gen 1.`);
        }
        isFromRBYEncounter = true;
      }
    }
    if (!isFromRBYEncounter && ruleTable.has("obtainablemisc")) {
      let evoSpecies = species;
      while (evoSpecies.prevo) {
        if (set.level < (evoSpecies.evoLevel || 0)) {
          if (!pokemonGoProblems || pokemonGoProblems && pokemonGoProblems.length) {
            problems.push(`${name} must be at least level ${evoSpecies.evoLevel} to be evolved.`);
            if (pokemonGoProblems && pokemonGoProblems.length) {
              problems.push(`It failed to validate as a Pokemon from Pokemon GO because:`);
              for (const pokemonGoProblem of pokemonGoProblems) {
                problems.push(pokemonGoProblem);
              }
            }
          } else {
            setSources.isFromPokemonGo = true;
            setSources.sources.push("8V");
            setSources.sourcesBefore = 0;
          }
          break;
        }
        evoSpecies = dex.species.get(evoSpecies.prevo);
      }
    }
    let moveProblems;
    if (ruleTable.has("obtainablemoves")) {
      moveProblems = this.validateMoves(outOfBattleSpecies, set.moves, setSources, set, name, moveLegalityWhitelist);
      problems.push(...moveProblems);
    }
    let eventOnlyData;
    if (!setSources.sourcesBefore && setSources.sources.length) {
      const legalSources = [];
      for (const source of setSources.sources) {
        if (this.validateSource(set, source, setSources, outOfBattleSpecies))
          continue;
        legalSources.push(source);
      }
      if (legalSources.length) {
        setSources.sources = legalSources;
      } else {
        let nonEggSource = null;
        for (const source of setSources.sources) {
          if (source.charAt(1) !== "E") {
            nonEggSource = source;
            break;
          }
        }
        if (!nonEggSource) {
          problems.push(`${name} can't get its egg move combination (${setSources.limitedEggMoves.join(", ")}) from any possible father.`);
          problems.push(`(Is this incorrect? If so, post the chainbreeding instructions in Bug Reports)`);
        } else {
          if (species.id === "mew" && pokemonGoProblems && !pokemonGoProblems.length) {
            setSources.isFromPokemonGo = true;
          } else {
            if (setSources.sources.length > 1) {
              problems.push(`${name} has an event-exclusive move that it doesn't qualify for (only one of several ways to get the move will be listed):`);
            }
            const eventProblems = this.validateSource(
              set,
              nonEggSource,
              setSources,
              outOfBattleSpecies,
              ` because it has a move only available`
            );
            if (eventProblems)
              problems.push(...eventProblems);
            if (species.id === "mew" && pokemonGoProblems && pokemonGoProblems.length) {
              problems.push(`Additionally, it failed to validate as a Pokemon from Pokemon GO because:`);
              for (const pokemonGoProblem of pokemonGoProblems) {
                problems.push(pokemonGoProblem);
              }
            }
          }
        }
      }
    } else if (ruleTable.has("obtainablemisc") && (eventOnlyData = this.getEventOnlyData(outOfBattleSpecies))) {
      const { species: eventSpecies, eventData } = eventOnlyData;
      let legal = false;
      for (const event of eventData) {
        if (this.validateEvent(set, setSources, event, eventSpecies))
          continue;
        legal = true;
        break;
      }
      if (!legal && species.gen <= 2 && dex.gen >= 7 && !this.validateSource(set, "7V", setSources, species)) {
        legal = true;
      }
      if (!legal) {
        if (!pokemonGoProblems || pokemonGoProblems && pokemonGoProblems.length) {
          if (eventData.length === 1) {
            problems.push(`${species.name} is only obtainable from an event - it needs to match its event:`);
          } else {
            problems.push(`${species.name} is only obtainable from events - it needs to match one of its events:`);
          }
          for (const [i, event] of eventData.entries()) {
            if (event.generation <= dex.gen && event.generation >= this.minSourceGen) {
              const eventInfo = event;
              const eventNum = i + 1;
              const eventName = eventData.length > 1 ? ` #${eventNum}` : ``;
              const eventProblems = this.validateEvent(
                set,
                setSources,
                eventInfo,
                eventSpecies,
                ` to be`,
                `from its event${eventName}`
              );
              if (eventProblems)
                problems.push(...eventProblems);
            }
          }
          if (pokemonGoProblems && pokemonGoProblems.length) {
            problems.push(`Additionally, it failed to validate as a Pokemon from Pokemon GO because:`);
            for (const pokemonGoProblem of pokemonGoProblems) {
              problems.push(pokemonGoProblem);
            }
          }
        } else {
          setSources.isFromPokemonGo = true;
        }
      }
    }
    const pokemonGoOnlySpecies = ["meltan", "melmetal", "gimmighoulroaming"];
    if (ruleTable.has("obtainablemisc") && pokemonGoOnlySpecies.includes(species.id)) {
      setSources.isFromPokemonGo = true;
      if (pokemonGoProblems && pokemonGoProblems.length) {
        problems.push(`${name} is only obtainable from Pokemon GO, and failed to validate because:`);
        for (const pokemonGoProblem of pokemonGoProblems) {
          problems.push(pokemonGoProblem);
        }
      }
    }
    if (ruleTable.isBanned("nonexistent")) {
      problems.push(...this.validateStats(set, species, setSources, pokemonGoProblems));
    }
    if (ruleTable.has("obtainablemoves") && setSources.isFromPokemonGo) {
      setSources.restrictiveMoves = [];
      setSources.sources = ["8V"];
      setSources.sourcesBefore = 0;
      if (moveProblems && !moveProblems.length) {
        problems.push(...this.validateMoves(
          outOfBattleSpecies,
          set.moves,
          setSources,
          set,
          name,
          moveLegalityWhitelist
        ));
      }
    }
    if (ruleTable.has("obtainablemoves")) {
      if (species.id === "keldeo" && set.moves.includes("secretsword") && this.minSourceGen > 5 && dex.gen <= 7) {
        problems.push(`${name} has Secret Sword, which is only compatible with Keldeo-Ordinary obtained from Gen 5.`);
      }
      const requiresGen3Source = setSources.maxSourceGen() <= 3;
      if (requiresGen3Source && dex.abilities.get(set.ability).gen === 4 && !species.prevo && dex.gen <= 5) {
        problems.push(`${name} has a Gen 4 ability and isn't evolved - it can't use moves from Gen 3.`);
      }
      const canUseAbilityPatch = dex.gen >= 8 && format.mod !== "gen8dlc1";
      if (setSources.isHidden && !canUseAbilityPatch && setSources.maxSourceGen() < 5) {
        problems.push(`${name} has a Hidden Ability - it can't use moves from before Gen 5.`);
      }
      if (species.maleOnlyHidden && setSources.isHidden && setSources.sourcesBefore < 5 && setSources.sources.every((source) => source.charAt(1) === "E")) {
        problems.push(`${name} has an unbreedable Hidden Ability - it can't use egg moves.`);
      }
    }
    if (teamHas) {
      for (const i in setHas) {
        if (i in teamHas) {
          teamHas[i]++;
        } else {
          teamHas[i] = 1;
        }
      }
    }
    for (const [rule, source, limit, bans] of ruleTable.complexBans) {
      let count = 0;
      for (const ban of bans) {
        if (setHas[ban])
          count++;
      }
      if (limit && count > limit) {
        const clause = source ? ` by ${source}` : ``;
        problems.push(`${name} is limited to ${limit} of ${rule}${clause}.`);
      } else if (!limit && count >= bans.length) {
        const clause = source ? ` by ${source}` : ``;
        if (source === "Obtainable Moves") {
          problems.push(`${name} has the combination of ${rule}, which is impossible to obtain legitimately.`);
        } else {
          problems.push(`${name} has the combination of ${rule}, which is banned${clause}.`);
        }
      }
    }
    for (const [rule] of ruleTable) {
      if ("!+-".includes(rule.charAt(0)))
        continue;
      const subformat = dex.formats.get(rule);
      if (subformat.onValidateSet && ruleTable.has(subformat.id)) {
        problems = problems.concat(subformat.onValidateSet.call(this, set, format, setHas, teamHas) || []);
      }
    }
    if (format.onValidateSet) {
      problems = problems.concat(format.onValidateSet.call(this, set, format, setHas, teamHas) || []);
    }
    const nameSpecies = dex.species.get(set.name);
    if (nameSpecies.exists && nameSpecies.name.toLowerCase() === set.name.toLowerCase()) {
      if (nameSpecies.baseSpecies === species.baseSpecies) {
        set.name = species.baseSpecies;
      } else if (nameSpecies.name !== species.name && nameSpecies.name !== species.baseSpecies && ruleTable.has("nicknameclause")) {
        problems.push(`${name} must not be nicknamed a different Pok\xE9mon species than what it actually is.`);
      }
    }
    if (!problems.length) {
      if (set.gender === "" && !species.gender) {
        set.gender = ["M", "F"][Math.floor(Math.random() * 2)];
      }
      if (adjustLevel)
        set.level = adjustLevel;
      return null;
    }
    return problems;
  }
  validateStats(set, species, setSources, pokemonGoProblems) {
    const ruleTable = this.ruleTable;
    const dex = this.dex;
    const allowAVs = ruleTable.has("allowavs");
    const evLimit = ruleTable.evLimit;
    const canBottleCap = dex.gen >= 7 && (set.level >= (dex.gen < 9 ? 100 : 50) || !ruleTable.has("obtainablemisc"));
    if (!set.evs)
      set.evs = TeamValidator.fillStats(null, evLimit === null ? 252 : 0);
    if (!set.ivs)
      set.ivs = TeamValidator.fillStats(null, 31);
    const problems = [];
    const name = set.name || set.species;
    const maxedIVs = Object.values(set.ivs).every((stat) => stat === 31);
    for (const moveName of set.moves) {
      const move = dex.moves.get(moveName);
      if (move.id === "hiddenpower" && move.type !== "Normal") {
        if (!set.hpType) {
          set.hpType = move.type;
        } else if (set.hpType !== move.type && ruleTable.has("obtainablemisc")) {
          problems.push(`${name}'s Hidden Power type ${set.hpType} is incompatible with Hidden Power ${move.type}`);
        }
      }
    }
    if (set.hpType && maxedIVs && ruleTable.has("obtainablemisc")) {
      if (dex.gen <= 2) {
        const HPdvs = dex.types.get(set.hpType).HPdvs;
        set.ivs = { hp: 30, atk: 30, def: 30, spa: 30, spd: 30, spe: 30 };
        let statName;
        for (statName in HPdvs) {
          set.ivs[statName] = HPdvs[statName] * 2;
        }
        set.ivs.hp = -1;
      } else if (!canBottleCap) {
        set.ivs = TeamValidator.fillStats(dex.types.get(set.hpType).HPivs, 31);
      }
    }
    if (!set.hpType && set.moves.some((m) => dex.moves.get(m).id === "hiddenpower")) {
      set.hpType = dex.getHiddenPower(set.ivs).type;
    }
    const cantBreedNorEvolve = species.eggGroups[0] === "Undiscovered" && !species.prevo && !species.nfe;
    const isLegendary = cantBreedNorEvolve && !species.tags.includes("Paradox") && ![
      "Pikachu",
      "Unown",
      "Dracozolt",
      "Arctozolt",
      "Dracovish",
      "Arctovish",
      "Gouging Fire",
      "Raging Bolt",
      "Iron Boulder",
      "Iron Crown",
      "Terapagos"
    ].includes(species.baseSpecies) || [
      "Manaphy",
      "Cosmog",
      "Cosmoem",
      "Solgaleo",
      "Lunala"
    ].includes(species.baseSpecies);
    const diancieException = species.name === "Diancie" && !set.shiny;
    const has3PerfectIVs = setSources.minSourceGen() >= 6 && isLegendary && !diancieException;
    if (set.hpType === "Fighting" && ruleTable.has("obtainablemisc")) {
      if (has3PerfectIVs) {
        problems.push(`${name} must not have Hidden Power Fighting because it starts with 3 perfect IVs because it's a Gen 6+ legendary.`);
      }
    }
    if (has3PerfectIVs && ruleTable.has("obtainablemisc")) {
      let perfectIVs = 0;
      for (const stat in set.ivs) {
        if (set.ivs[stat] >= 31)
          perfectIVs++;
      }
      if (perfectIVs < 3) {
        if (!pokemonGoProblems || pokemonGoProblems && pokemonGoProblems.length) {
          const reason = this.minSourceGen === 6 ? ` and this format requires Gen ${dex.gen} Pok\xE9mon` : ` in Gen 6 or later`;
          problems.push(`${name} must have at least three perfect IVs because it's a legendary${reason}.`);
          if (pokemonGoProblems && pokemonGoProblems.length) {
            problems.push(`Additionally, it failed to validate as a Pokemon from Pokemon GO because:`);
            for (const pokemonGoProblem of pokemonGoProblems) {
              problems.push(pokemonGoProblem);
            }
          }
        } else {
          setSources.isFromPokemonGo = true;
        }
      }
    }
    if (set.hpType && !canBottleCap) {
      const ivHpType = dex.getHiddenPower(set.ivs).type;
      if (set.hpType !== ivHpType) {
        problems.push(`${name} has Hidden Power ${set.hpType}, but its IVs are for Hidden Power ${ivHpType}.`);
      }
    } else if (set.hpType) {
      if (!this.possibleBottleCapHpType(set.hpType, set.ivs)) {
        problems.push(`${name} has Hidden Power ${set.hpType}, but its IVs don't allow this even with (Bottle Cap) Hyper Training.`);
      }
    }
    if (setSources.isFromPokemonGo) {
      for (const stat in set.ivs) {
        if (set.ivs[stat] % 2 === 0 && stat !== "spe") {
          set.ivs[stat]++;
        }
      }
      if (set.ivs.atk !== set.ivs.spa && !(canBottleCap && (set.ivs.atk === 31 || set.ivs.spa === 31))) {
        problems.push(`${name}'s Atk and Spa IVs must match because it is from Pokemon GO.`);
      }
      if (set.ivs.def !== set.ivs.spd && !(canBottleCap && (set.ivs.def === 31 || set.ivs.spd === 31))) {
        problems.push(`${name}'s Def and Spd IVs must match because it is from Pokemon GO.`);
      }
      if (set.hpType && set.hpType !== "Dark" && set.hpType !== "Ice") {
        problems.push(`${name} must have Hidden Power Dark or Ice because it is from Pokemon GO.`);
      }
    }
    if (dex.gen <= 2) {
      const ivs = set.ivs;
      const atkDV = Math.floor(ivs.atk / 2);
      const defDV = Math.floor(ivs.def / 2);
      const speDV = Math.floor(ivs.spe / 2);
      const spcDV = Math.floor(ivs.spa / 2);
      const expectedHpDV = atkDV % 2 * 8 + defDV % 2 * 4 + speDV % 2 * 2 + spcDV % 2;
      if (ivs.hp === -1)
        ivs.hp = expectedHpDV * 2;
      const hpDV = Math.floor(ivs.hp / 2);
      if (expectedHpDV !== hpDV) {
        problems.push(`${name} has an HP DV of ${hpDV}, but its Atk, Def, Spe, and Spc DVs give it an HP DV of ${expectedHpDV}.`);
      }
      if (ivs.spa !== ivs.spd) {
        if (dex.gen === 2) {
          problems.push(`${name} has different SpA and SpD DVs, which is not possible in Gen 2.`);
        } else {
          ivs.spd = ivs.spa;
        }
      }
      if (dex.gen > 1 && !species.gender) {
        const genderThreshold = species.genderRatio.F * 16;
        const expectedGender = atkDV >= genderThreshold ? "M" : "F";
        if (set.gender && set.gender !== expectedGender) {
          problems.push(`${name} is ${set.gender}, but it has an Atk DV of ${atkDV}, which makes its gender ${expectedGender}.`);
        } else {
          set.gender = expectedGender;
        }
      }
      if (set.species === "Marowak" && (0, import_dex.toID)(set.item) === "thickclub" && set.moves.map(import_dex.toID).includes("swordsdance") && set.level === 100) {
        set.ivs.atk = Math.floor(set.ivs.atk / 2) * 2;
        while (set.evs.atk > 0 && 2 * 80 + set.ivs.atk + Math.floor(set.evs.atk / 4) + 5 > 255) {
          set.evs.atk -= 4;
        }
      }
      if (dex.gen > 1) {
        const expectedShiny = !!(defDV === 10 && speDV === 10 && spcDV === 10 && atkDV % 4 >= 2);
        if (expectedShiny && !set.shiny) {
          problems.push(`${name} is not shiny, which does not match its DVs.`);
        } else if (!expectedShiny && set.shiny) {
          problems.push(`${name} is shiny, which does not match its DVs (its DVs must all be 10, except Atk which must be 2, 3, 6, 7, 10, 11, 14, or 15).`);
        }
      }
      set.nature = "Serious";
    }
    for (const stat in set.evs) {
      if (set.evs[stat] < 0) {
        problems.push(`${name} has less than 0 ${allowAVs ? "Awakening Values" : "EVs"} in ${import_dex.Dex.stats.names[stat]}.`);
      }
    }
    if (dex.currentMod === "gen7letsgo") {
      for (const stat in set.evs) {
        if (set.evs[stat] > 0 && !allowAVs) {
          problems.push(`${name} has Awakening Values but this format doesn't allow them.`);
          break;
        } else if (set.evs[stat] > 200) {
          problems.push(`${name} has more than 200 Awakening Values in ${import_dex.Dex.stats.names[stat]}.`);
        }
      }
    } else {
      for (const stat in set.evs) {
        if (set.evs[stat] > 255) {
          problems.push(`${name} has more than 255 EVs in ${import_dex.Dex.stats.names[stat]}.`);
        }
      }
      if (dex.gen <= 2) {
        if (set.evs.spa !== set.evs.spd) {
          if (dex.gen === 2) {
            problems.push(`${name} has different SpA and SpD EVs, which is not possible in Gen 2.`);
          } else {
            set.evs.spd = set.evs.spa;
          }
        }
      }
    }
    let totalEV = 0;
    for (const stat in set.evs)
      totalEV += set.evs[stat];
    if (!this.format.debug) {
      if (set.level > 1 && evLimit !== 0 && totalEV === 0) {
        problems.push(`${name} has exactly 0 EVs - did you forget to EV it? (If this was intentional, add exactly 1 to one of your EVs, which won't change its stats but will tell us that it wasn't a mistake).`);
      } else if (![508, 510].includes(evLimit) && [508, 510].includes(totalEV)) {
        problems.push(`${name} has exactly ${totalEV} EVs, but this format does not restrict you to 510 EVs (If this was intentional, add exactly 1 to one of your EVs, which won't change its stats but will tell us that it wasn't a mistake).`);
      }
      if (set.level === 50 && ruleTable.maxLevel !== 50 && !ruleTable.maxTotalLevel && evLimit !== 0 && totalEV % 4 === 0) {
        problems.push(`${name} is level 50, but this format allows level ${ruleTable.maxLevel} Pok\xE9mon. (If this was intentional, add exactly 1 to one of your EVs, which won't change its stats but will tell us that it wasn't a mistake).`);
      }
    }
    if (evLimit !== null && totalEV > evLimit) {
      if (!evLimit) {
        problems.push(`${name} has EVs, which is not allowed by this format.`);
      } else {
        problems.push(`${name} has ${totalEV} total EVs, which is more than this format's limit of ${evLimit}.`);
      }
    }
    return problems;
  }
  /**
   * Not exhaustive, just checks Atk and Spe, which are the only competitively
   * relevant IVs outside of extremely obscure situations.
   */
  possibleBottleCapHpType(type, ivs) {
    if (!type)
      return true;
    if (["Dark", "Dragon", "Grass", "Ghost", "Poison"].includes(type)) {
      if (ivs.spe % 2 === 0)
        return false;
    }
    if (["Psychic", "Fire", "Rock", "Fighting"].includes(type)) {
      if (ivs.spe !== 31 && ivs.spe % 2 === 1)
        return false;
    }
    if (type === "Dark") {
      if (ivs.atk % 2 === 0)
        return false;
    }
    if (["Ice", "Water"].includes(type)) {
      if (ivs.spe % 2 === 0 && ivs.atk % 2 === 0)
        return false;
    }
    return true;
  }
  /**
   * Returns array of error messages if invalid, undefined if valid
   *
   * If `because` is not passed, instead returns true if invalid.
   */
  validateSource(set, source, setSources, species, because) {
    let eventData;
    let eventSpecies = species;
    if (source.charAt(1) === "S") {
      const splitSource = source.substr(source.charAt(2) === "T" ? 3 : 2).split(" ");
      const dex = this.dex.gen === 1 ? this.dex.mod("gen2") : this.dex;
      eventSpecies = dex.species.get(splitSource[1]);
      const eventLsetData = this.dex.species.getLearnsetData(eventSpecies.id);
      eventData = eventLsetData.eventData?.[parseInt(splitSource[0])];
      if (!eventData) {
        throw new Error(`${eventSpecies.name} from ${species.name} doesn't have data for event ${source}`);
      }
    } else if (source === "7V") {
      const isMew = species.id === "mew";
      const isCelebi = species.id === "celebi";
      const g7speciesName = species.gen > 2 && species.prevo ? species.prevo : species.id;
      const isHidden = !!this.dex.mod("gen7").species.get(g7speciesName).abilities["H"];
      eventData = {
        generation: 2,
        level: isMew ? 5 : isCelebi ? 30 : 3,
        // Level 1/2 Pokémon can't be obtained by transfer from RBY/GSC
        perfectIVs: isMew || isCelebi ? 5 : 3,
        isHidden,
        shiny: isMew ? void 0 : 1,
        pokeball: "pokeball",
        from: "Gen 1-2 Virtual Console transfer"
      };
    } else if (source === "8V") {
      const isMew = species.id === "mew";
      eventData = {
        generation: 8,
        perfectIVs: isMew ? 3 : void 0,
        shiny: isMew ? void 0 : 1,
        from: "Gen 7 Let's Go! HOME transfer"
      };
    } else if (source.charAt(1) === "D") {
      eventData = {
        generation: 5,
        level: 10,
        from: "Gen 5 Dream World",
        isHidden: !!this.dex.mod("gen5").species.get(species.id).abilities["H"]
      };
    } else if (source.charAt(1) === "E") {
      if (this.findEggMoveFathers(source, species, setSources)) {
        return void 0;
      }
      if (because)
        throw new Error(`Wrong place to get an egg incompatibility message`);
      return true;
    } else {
      throw new Error(`Unidentified source ${source} passed to validateSource`);
    }
    return this.validateEvent(set, setSources, eventData, eventSpecies, because);
  }
  findEggMoveFathers(source, species, setSources, getAll, pokemonBlacklist, noRecurse) {
    if (!pokemonBlacklist)
      pokemonBlacklist = [];
    if (!pokemonBlacklist.includes(species.id))
      pokemonBlacklist.push(species.id);
    const eggGen = Math.max(parseInt(source.charAt(0)), 2);
    const fathers = [];
    if (!getAll && eggGen >= 6 && !setSources.levelUpEggMoves)
      return true;
    let eggMoves = setSources.limitedEggMoves;
    if (eggGen === 3)
      eggMoves = eggMoves?.filter((eggMove) => !setSources.pomegEggMoves?.includes(eggMove));
    if (!eggMoves) {
      return getAll ? ["*"] : true;
    }
    if (!getAll && eggMoves.length <= 1 && !setSources.levelUpEggMoves)
      return true;
    if (setSources.levelUpEggMoves && eggGen >= 6)
      eggMoves = setSources.levelUpEggMoves;
    const dex = this.dex.gen === 1 ? this.dex.mod("gen2") : this.dex;
    let eggGroups = species.eggGroups;
    if (species.id === "nidoqueen" || species.id === "nidorina") {
      eggGroups = dex.species.get("nidoranf").eggGroups;
    } else if (species.id === "shedinja") {
      eggGroups = dex.species.get("nincada").eggGroups;
    } else if (dex !== this.dex) {
      eggGroups = dex.species.get(species.id).eggGroups;
    }
    if (eggGroups[0] === "Undiscovered")
      eggGroups = dex.species.get(species.evos[0]).eggGroups;
    if (eggGroups[0] === "Undiscovered" || !eggGroups.length) {
      throw new Error(`${species.name} has no egg groups for source ${source}`);
    }
    if (!getAll && eggGroups.includes("Field"))
      return true;
    for (const father of dex.species.all()) {
      if (father.isNonstandard)
        continue;
      if (father.gen > eggGen)
        continue;
      if (father.gender === "N" || father.gender === "F")
        continue;
      if (!dex.species.getLearnsetData(father.id).learnset)
        continue;
      if (pokemonBlacklist.includes(father.id) && !["dragonite", "snorlax"].includes(father.id))
        continue;
      if (father.evos.length) {
        const evolvedFather = dex.species.get(father.evos[0]);
        if (evolvedFather.gen <= eggGen && evolvedFather.gender !== "F")
          continue;
      }
      if (!father.eggGroups.some((eggGroup) => eggGroups.includes(eggGroup)))
        continue;
      if (!this.fatherCanLearn(species, father, eggMoves, eggGen, pokemonBlacklist, noRecurse))
        continue;
      if (!getAll)
        return true;
      fathers.push(father.id);
    }
    if (!getAll)
      return false;
    return !fathers.length && eggGen < 6 ? null : fathers;
  }
  /**
   * We could, if we wanted, do a complete move validation of the father's
   * moveset to see if it's valid. This would recurse and be NP-Hard so
   * instead we won't. We'll instead use a simplified algorithm: The father
   * is allowed to have multiple egg moves and a maximum of one move from
   * any other restrictive source; recursion is done only if there are less
   * egg moves to validate or if the father has an egg group it doesn't
   * share with the egg Pokemon. Recursion is also limited to two iterations
   * of calling findEggMoveFathers.
   */
  fatherCanLearn(baseSpecies, species, moves, eggGen, pokemonBlacklist, noRecurse) {
    if (!this.dex.species.getLearnsetData(species.id).learnset)
      return false;
    if (species.id === "smeargle")
      return true;
    const canBreedWithSmeargle = species.eggGroups.includes("Field");
    const allEggSources = new PokemonSources();
    allEggSources.sourcesBefore = eggGen;
    for (const move of moves) {
      const eggSources = new PokemonSources();
      for (const { learnset, species: curSpecies } of this.dex.species.getFullLearnset(species.id)) {
        const eggPokemon = curSpecies.prevo ? curSpecies.id : "";
        if (learnset[move]) {
          for (const moveSource of learnset[move]) {
            if (eggGen > 8 && parseInt(moveSource.charAt(0)) <= 8)
              continue;
            if (parseInt(moveSource.charAt(0)) > eggGen)
              continue;
            const canLearnFromSmeargle = moveSource.charAt(1) === "E" && canBreedWithSmeargle;
            if (!"ESDV".includes(moveSource.charAt(1)) || canLearnFromSmeargle) {
              eggSources.addGen(parseInt(moveSource.charAt(0)));
              break;
            } else {
              if (moveSource.charAt(1) === "E") {
                eggSources.add(moveSource + eggPokemon, move);
                if (eggGen === 2 && this.dex.moves.getByID(move).gen === 1)
                  eggSources.add("1ET" + eggPokemon, move);
              } else {
                eggSources.add(moveSource + eggPokemon);
              }
            }
          }
        }
        if (eggSources.sourcesBefore === eggGen)
          break;
      }
      if (eggSources.sourcesBefore === eggGen)
        continue;
      if (!eggSources.sourcesBefore && !eggSources.sources.length)
        return false;
      const onlyEggSources = eggSources.sources.filter((source) => source.charAt(1) === "E");
      if (eggGen >= 3 && onlyEggSources.length && eggSources.limitedEggMoves === null && eggSources.sourcesBefore) {
        eggSources.possiblyLimitedEggMoves = [(0, import_dex.toID)(eggSources.sourcesBefore + move)];
      }
      allEggSources.intersectWith(eggSources);
      if (!allEggSources.size())
        return false;
    }
    pokemonBlacklist.push(species.id);
    if (allEggSources.limitedEggMoves && allEggSources.limitedEggMoves.length > 1) {
      if (noRecurse)
        return false;
      let canChainbreed = false;
      for (const fatherEggGroup of species.eggGroups) {
        if (!baseSpecies.eggGroups.includes(fatherEggGroup)) {
          canChainbreed = true;
          break;
        }
      }
      if (!canChainbreed && allEggSources.limitedEggMoves.length === moves.length)
        return false;
      const setSources = new PokemonSources();
      setSources.limitedEggMoves = allEggSources.limitedEggMoves;
      return this.findEggMoveFathers(allEggSources.sources[0], species, setSources, false, pokemonBlacklist, true);
    }
    return true;
  }
  validateForme(set) {
    const dex = this.dex;
    const name = set.name || set.species;
    const problems = [];
    const item = dex.items.get(set.item);
    const species = dex.species.get(set.species);
    if (species.name === "Necrozma-Ultra") {
      const whichMoves = (set.moves.includes("sunsteelstrike") ? 1 : 0) + (set.moves.includes("moongeistbeam") ? 2 : 0);
      if (item.name !== "Ultranecrozium Z") {
        problems.push(`Necrozma-Ultra must start the battle holding Ultranecrozium Z.`);
      } else if (whichMoves === 1) {
        set.species = "Necrozma-Dusk-Mane";
      } else if (whichMoves === 2) {
        set.species = "Necrozma-Dawn-Wings";
      } else {
        problems.push(`Necrozma-Ultra must start the battle as Necrozma-Dusk-Mane or Necrozma-Dawn-Wings holding Ultranecrozium Z. Please specify which Necrozma it should start as.`);
      }
    } else if (species.name === "Zygarde-Complete") {
      problems.push(`Zygarde-Complete must start the battle as Zygarde or Zygarde-10% with Power Construct. Please specify which Zygarde it should start as.`);
    } else if (species.battleOnly) {
      if (species.requiredAbility && set.ability !== species.requiredAbility) {
        problems.push(`${species.name} transforms in-battle with ${species.requiredAbility}, please fix its ability.`);
      }
      if (species.requiredItems) {
        if (!species.requiredItems.includes(item.name)) {
          problems.push(`${species.name} transforms in-battle with ${species.requiredItem}, please fix its item.`);
        }
      }
      if (species.requiredMove && !set.moves.map(import_dex.toID).includes((0, import_dex.toID)(species.requiredMove))) {
        problems.push(`${species.name} transforms in-battle with ${species.requiredMove}, please fix its moves.`);
      }
      if (typeof species.battleOnly !== "string") {
        throw new Error(`${species.name} should have a string battleOnly`);
      }
      set.species = species.battleOnly;
    } else {
      if (species.requiredAbility) {
        throw new Error(`Species ${species.name} has a required ability despite not being a battle-only forme; it should just be in its abilities table.`);
      }
      if (species.requiredItems && !species.requiredItems.includes(item.name)) {
        if (dex.gen >= 8 && (species.baseSpecies === "Arceus" || species.baseSpecies === "Silvally")) {
          if (set.ability === species.abilities[0]) {
            problems.push(
              `${name} needs to hold ${species.requiredItems.join(" or ")}.`,
              `(It will revert to its Normal forme if you remove the item or give it a different item.)`
            );
          }
        } else {
          const baseSpecies = this.dex.species.get(species.changesFrom);
          problems.push(
            `${name} needs to hold ${species.requiredItems.join(" or ")} to be in its ${species.forme} forme.`,
            `(It will revert to its ${baseSpecies.baseForme || "base"} forme if you remove the item or give it a different item.)`
          );
        }
      }
      if (species.requiredMove && !set.moves.map(import_dex.toID).includes((0, import_dex.toID)(species.requiredMove))) {
        const baseSpecies = this.dex.species.get(species.changesFrom);
        problems.push(
          `${name} needs to know the move ${species.requiredMove} to be in its ${species.forme} forme.`,
          `(It will revert to its ${baseSpecies.baseForme} forme if it forgets the move.)`
        );
      }
      if (item.forcedForme && species.name === dex.species.get(item.forcedForme).baseSpecies) {
        set.species = item.forcedForme;
      }
    }
    if (species.name === "Pikachu-Cosplay") {
      const cosplay = {
        meteormash: "Pikachu-Rock-Star",
        iciclecrash: "Pikachu-Belle",
        drainingkiss: "Pikachu-Pop-Star",
        electricterrain: "Pikachu-PhD",
        flyingpress: "Pikachu-Libre"
      };
      for (const moveid of set.moves) {
        if (moveid in cosplay) {
          set.species = cosplay[moveid];
          break;
        }
      }
    }
    if (species.name === "Keldeo" && set.moves.map(import_dex.toID).includes("secretsword") && dex.gen >= 8) {
      set.species = "Keldeo-Resolute";
    }
    const crowned = {
      "Zacian-Crowned": "behemothblade",
      "Zamazenta-Crowned": "behemothbash"
    };
    if (species.name in crowned) {
      const behemothMove = set.moves.map(import_dex.toID).indexOf(crowned[species.name]);
      if (behemothMove >= 0) {
        set.moves[behemothMove] = "ironhead";
      }
    }
    if (species.baseSpecies === "Hoopa" && dex.gen >= 9) {
      const moves = set.moves.map(import_dex.toID);
      const hyperspaceHole = moves.indexOf("hyperspacehole");
      const hyperspaceFury = moves.indexOf("hyperspacefury");
      if (species.name === "Hoopa" && hyperspaceFury >= 0) {
        problems.push(`In Generation 9, Hoopa cannot run Hyperspace Fury because it gets replaced with Hyperspace Hole upon changing forme.`);
      } else if (species.name === "Hoopa-Unbound" && hyperspaceHole >= 0) {
        problems.push(`In Generation 9, Hoopa-Unbound cannot run Hyperspace Hole because it gets replaced with Hyperspace Fury upon changing forme.`);
      }
    }
    if (species.baseSpecies === "Greninja" && (0, import_dex.toID)(set.ability) === "battlebond") {
      set.species = "Greninja-Bond";
    }
    if (species.baseSpecies === "Unown" && dex.gen === 2) {
      let resultBinary = "";
      for (const iv of ["atk", "def", "spe", "spa"]) {
        resultBinary += set.ivs[iv].toString(2).padStart(5, "0").slice(1, 3);
      }
      const resultDecimal = Math.floor(parseInt(resultBinary, 2) / 10);
      const expectedLetter = String.fromCharCode(resultDecimal + 65);
      const unownLetter = species.forme || "A";
      if (unownLetter !== expectedLetter) {
        problems.push(`Unown has forme ${unownLetter}, but its DVs give it the forme ${expectedLetter}.`);
      }
    }
    return problems;
  }
  checkSpecies(set, species, tierSpecies, setHas) {
    const dex = this.dex;
    const ruleTable = this.ruleTable;
    if (tierSpecies.id === "zamazentacrowned" && species.id === "zamazenta" || tierSpecies.id === "zaciancrowned" && species.id === "zacian") {
      species = tierSpecies;
    }
    setHas["pokemon:" + species.id] = true;
    setHas["basepokemon:" + (0, import_dex.toID)(species.baseSpecies)] = true;
    let isMega = false;
    if (tierSpecies !== species) {
      setHas["pokemon:" + tierSpecies.id] = true;
      if (tierSpecies.isMega || tierSpecies.isPrimal) {
        setHas["pokemontag:mega"] = true;
        isMega = true;
      }
    }
    let isGmax = false;
    if (tierSpecies.canGigantamax && set.gigantamax) {
      setHas["pokemon:" + tierSpecies.id + "gmax"] = true;
      isGmax = true;
    }
    if (tierSpecies.baseSpecies === "Greninja" && (0, import_dex.toID)(set.ability) === "battlebond") {
      setHas["pokemon:greninjabond"] = true;
    }
    const tier = tierSpecies.tier === "(PU)" ? "ZU" : tierSpecies.tier === "(NU)" ? "PU" : tierSpecies.tier;
    const tierTag = "pokemontag:" + (0, import_dex.toID)(tier);
    setHas[tierTag] = true;
    const doublesTier = tierSpecies.doublesTier === "(DUU)" ? "DNU" : tierSpecies.doublesTier;
    const doublesTierTag = "pokemontag:" + (0, import_dex.toID)(doublesTier);
    setHas[doublesTierTag] = true;
    const ndTier = tierSpecies.natDexTier === "(PU)" ? "ZU" : tierSpecies.natDexTier === "(NU)" ? "PU" : tierSpecies.natDexTier;
    const ndTierTag = "pokemontag:nd" + (0, import_dex.toID)(ndTier);
    setHas[ndTierTag] = true;
    if (!tierSpecies.canGigantamax && set.gigantamax) {
      return `${tierSpecies.name} cannot Gigantamax but is flagged as being able to.`;
    }
    let banReason = ruleTable.check("pokemon:" + species.id);
    if (banReason) {
      return `${species.name} is ${banReason}.`;
    }
    if (banReason === "")
      return null;
    if (tierSpecies !== species) {
      banReason = ruleTable.check("pokemon:" + tierSpecies.id);
      if (banReason) {
        return `${tierSpecies.name} is ${banReason}.`;
      }
      if (banReason === "")
        return null;
    }
    if (isMega) {
      banReason = ruleTable.check("pokemontag:mega", setHas);
      if (banReason) {
        return `Mega evolutions are ${banReason}.`;
      }
    }
    if (isGmax) {
      banReason = ruleTable.check("pokemon:" + tierSpecies.id + "gmax");
      if (banReason) {
        return `Gigantamaxing ${species.name} is ${banReason}.`;
      }
    }
    banReason = ruleTable.check("basepokemon:" + (0, import_dex.toID)(species.baseSpecies));
    if (banReason) {
      return `${species.name} is ${banReason}.`;
    }
    if (banReason === "") {
      const baseSpecies = dex.species.get(species.baseSpecies);
      if (baseSpecies.isNonstandard === species.isNonstandard) {
        return null;
      }
    }
    let nonexistentCheck = import_tags.Tags.nonexistent.genericFilter(tierSpecies) && ruleTable.check("nonexistent");
    const EXISTENCE_TAG = ["past", "future", "lgpe", "unobtainable", "cap", "custom", "nonexistent"];
    for (const ruleid of ruleTable.tagRules) {
      if (ruleid.startsWith("*"))
        continue;
      const tagid = ruleid.slice(12);
      const tag = import_tags.Tags[tagid];
      if ((tag.speciesFilter || tag.genericFilter)(tierSpecies)) {
        const existenceTag = EXISTENCE_TAG.includes(tagid);
        if (ruleid.startsWith("+")) {
          if (!existenceTag && nonexistentCheck)
            continue;
          return null;
        }
        if (existenceTag) {
          nonexistentCheck = "banned";
          break;
        }
        return `${species.name} is tagged ${tag.name}, which is ${ruleTable.check(ruleid.slice(1)) || "banned"}.`;
      }
    }
    if (nonexistentCheck) {
      if (tierSpecies.isNonstandard === "Past" || tierSpecies.isNonstandard === "Future") {
        return `${tierSpecies.name} does not exist in Gen ${dex.gen}.`;
      }
      if (tierSpecies.isNonstandard === "LGPE") {
        return `${tierSpecies.name} does not exist in this game, only in Let's Go Pikachu/Eevee.`;
      }
      if (tierSpecies.isNonstandard === "CAP") {
        return `${tierSpecies.name} is a CAP and does not exist in this game.`;
      }
      if (tierSpecies.isNonstandard === "Unobtainable") {
        return `${tierSpecies.name} is not possible to obtain in this game.`;
      }
      if (tierSpecies.isNonstandard === "Gigantamax") {
        return `${tierSpecies.name} is a placeholder for a Gigantamax sprite, not a real Pok\xE9mon. (This message is likely to be a validator bug.)`;
      }
      return `${tierSpecies.name} does not exist in this game.`;
    }
    if (nonexistentCheck === "")
      return null;
    if (tierSpecies.gmaxUnreleased && set.gigantamax) {
      banReason = ruleTable.check("pokemontag:unobtainable");
      if (banReason) {
        return `${tierSpecies.name} is flagged as gigantamax, but it cannot gigantamax without hacking or glitches.`;
      }
      if (banReason === "")
        return null;
    }
    banReason = ruleTable.check("pokemontag:allpokemon");
    if (banReason) {
      return `${species.name} is not in the list of allowed pokemon.`;
    }
    return null;
  }
  checkItem(set, item, setHas) {
    const dex = this.dex;
    const ruleTable = this.ruleTable;
    setHas["item:" + item.id] = true;
    let banReason = ruleTable.check("item:" + (item.id || "noitem"));
    if (banReason) {
      if (!item.id) {
        return `${set.name} not holding an item is ${banReason}.`;
      }
      return `${set.name}'s item ${item.name} is ${banReason}.`;
    }
    if (banReason === "")
      return null;
    if (!item.id)
      return null;
    banReason = ruleTable.check("pokemontag:allitems");
    if (banReason) {
      return `${set.name}'s item ${item.name} is not in the list of allowed items.`;
    }
    if (item.isNonstandard) {
      banReason = ruleTable.check("pokemontag:" + (0, import_dex.toID)(item.isNonstandard));
      if (banReason) {
        if (item.isNonstandard === "Unobtainable") {
          return `${item.name} is not obtainable without hacking or glitches.`;
        }
        return `${set.name}'s item ${item.name} is tagged ${item.isNonstandard}, which is ${banReason}.`;
      }
      if (banReason === "")
        return null;
    }
    if (item.isNonstandard && item.isNonstandard !== "Unobtainable") {
      banReason = ruleTable.check("nonexistent", setHas);
      if (banReason) {
        if (["Past", "Future"].includes(item.isNonstandard)) {
          return `${set.name}'s item ${item.name} does not exist in Gen ${dex.gen}.`;
        }
        return `${set.name}'s item ${item.name} does not exist in this game.`;
      }
      if (banReason === "")
        return null;
    }
    return null;
  }
  checkMove(set, move, setHas) {
    const dex = this.dex;
    const ruleTable = this.ruleTable;
    setHas["move:" + move.id] = true;
    let banReason = ruleTable.check("move:" + move.id);
    if (banReason) {
      return `${set.name}'s move ${move.name} is ${banReason}.`;
    }
    if (banReason === "")
      return null;
    banReason = ruleTable.check("pokemontag:allmoves");
    if (banReason) {
      return `${set.name}'s move ${move.name} is not in the list of allowed moves.`;
    }
    if (move.isNonstandard) {
      banReason = ruleTable.check("pokemontag:" + (0, import_dex.toID)(move.isNonstandard));
      if (banReason) {
        if (move.isNonstandard === "Unobtainable") {
          return `${move.name} is not obtainable without hacking or glitches${dex.gen >= 9 && move.gen < dex.gen ? ` in Gen ${dex.gen}` : ``}.`;
        }
        if (move.isNonstandard === "Gigantamax") {
          return `${move.name} is not usable without Gigantamaxing its user, ${move.isMax}.`;
        }
        return `${set.name}'s move ${move.name} is tagged ${move.isNonstandard}, which is ${banReason}.`;
      }
      if (banReason === "")
        return null;
    }
    if (move.isNonstandard && move.isNonstandard !== "Unobtainable") {
      banReason = ruleTable.check("nonexistent", setHas);
      if (banReason) {
        if (["Past", "Future"].includes(move.isNonstandard)) {
          return `${set.name}'s move ${move.name} does not exist in Gen ${dex.gen}.`;
        }
        return `${set.name}'s move ${move.name} does not exist in this game.`;
      }
      if (banReason === "")
        return null;
    }
    return null;
  }
  checkAbility(set, ability, setHas) {
    const dex = this.dex;
    const ruleTable = this.ruleTable;
    setHas["ability:" + ability.id] = true;
    if (this.format.id.startsWith("gen9pokebilities")) {
      const species = dex.species.get(set.species);
      const unSeenAbilities = Object.keys(species.abilities).filter((key) => key !== "S" && (key !== "H" || !species.unreleasedHidden)).map((key) => species.abilities[key]);
      if (ability.id !== this.toID(species.abilities["S"])) {
        for (const abilityName of unSeenAbilities) {
          setHas["ability:" + (0, import_dex.toID)(abilityName)] = true;
        }
      }
    }
    let banReason = ruleTable.check("ability:" + ability.id);
    if (banReason) {
      return `${set.name}'s ability ${ability.name} is ${banReason}.`;
    }
    if (banReason === "")
      return null;
    banReason = ruleTable.check("pokemontag:allabilities");
    if (banReason) {
      return `${set.name}'s ability ${ability.name} is not in the list of allowed abilities.`;
    }
    if (ability.isNonstandard) {
      banReason = ruleTable.check("pokemontag:" + (0, import_dex.toID)(ability.isNonstandard));
      if (banReason) {
        return `${set.name}'s ability ${ability.name} is tagged ${ability.isNonstandard}, which is ${banReason}.`;
      }
      if (banReason === "")
        return null;
      banReason = ruleTable.check("nonexistent", setHas);
      if (banReason) {
        if (["Past", "Future"].includes(ability.isNonstandard)) {
          return `${set.name}'s ability ${ability.name} does not exist in Gen ${dex.gen}.`;
        }
        return `${set.name}'s ability ${ability.name} does not exist in this game.`;
      }
      if (banReason === "")
        return null;
    }
    return null;
  }
  checkNature(set, nature, setHas) {
    const dex = this.dex;
    const ruleTable = this.ruleTable;
    setHas["nature:" + nature.id] = true;
    let banReason = ruleTable.check("nature:" + nature.id);
    if (banReason) {
      return `${set.name}'s nature ${nature.name} is ${banReason}.`;
    }
    if (banReason === "")
      return null;
    banReason = ruleTable.check("allnatures");
    if (banReason) {
      return `${set.name}'s nature ${nature.name} is not in the list of allowed natures.`;
    }
    if (nature.isNonstandard) {
      banReason = ruleTable.check("pokemontag:" + (0, import_dex.toID)(nature.isNonstandard));
      if (banReason) {
        return `${set.name}'s nature ${nature.name} is tagged ${nature.isNonstandard}, which is ${banReason}.`;
      }
      if (banReason === "")
        return null;
      banReason = ruleTable.check("nonexistent", setHas);
      if (banReason) {
        if (["Past", "Future"].includes(nature.isNonstandard)) {
          return `${set.name}'s nature ${nature.name} does not exist in Gen ${dex.gen}.`;
        }
        return `${set.name}'s nature ${nature.name} does not exist in this game.`;
      }
      if (banReason === "")
        return null;
    }
    return null;
  }
  /**
   * Returns array of error messages if invalid, undefined if valid
   *
   * If `because` is not passed, instead returns true if invalid.
   */
  validateEvent(set, setSources, eventData, eventSpecies, because = ``, from = `from an event`) {
    const dex = this.dex;
    let name = set.species;
    const species = dex.species.get(set.species);
    const maxSourceGen = this.ruleTable.has("allowtradeback") ? import_lib.Utils.clampIntRange(dex.gen + 1, 1, 8) : dex.gen;
    if (!eventSpecies)
      eventSpecies = species;
    if (set.name && set.species !== set.name && species.baseSpecies !== set.name)
      name = `${set.name} (${set.species})`;
    const fastReturn = !because;
    if (eventData.from)
      from = `from ${eventData.from}`;
    const etc = `${because} ${from}`;
    const problems = [];
    if (dex.gen < 8 && this.minSourceGen > eventData.generation) {
      if (fastReturn)
        return true;
      problems.push(`This format requires Pokemon from gen ${this.minSourceGen} or later and ${name} is from gen ${eventData.generation}${etc}.`);
    }
    if (maxSourceGen < eventData.generation) {
      if (fastReturn)
        return true;
      problems.push(`This format is in gen ${dex.gen} and ${name} is from gen ${eventData.generation}${etc}.`);
    }
    if (eventData.japan && dex.currentMod !== "gen1jpn") {
      if (fastReturn)
        return true;
      problems.push(`${name} has moves from Japan-only events, but this format simulates International Yellow/Crystal which can't trade with Japanese games.`);
    }
    if (eventData.level && (set.level || 0) < eventData.level) {
      if (fastReturn)
        return true;
      problems.push(`${name} must be at least level ${eventData.level}${etc}.`);
    }
    if (eventData.shiny === true && !set.shiny || !eventData.shiny && set.shiny) {
      if (fastReturn)
        return true;
      const shinyReq = eventData.shiny ? ` be shiny` : ` not be shiny`;
      problems.push(`${name} must${shinyReq}${etc}.`);
    }
    if (eventData.gender) {
      if (set.gender && eventData.gender !== set.gender) {
        if (fastReturn)
          return true;
        problems.push(`${name}'s gender must be ${eventData.gender}${etc}.`);
      }
    }
    const canMint = dex.gen > 7;
    if (eventData.nature && eventData.nature !== set.nature && !canMint) {
      if (fastReturn)
        return true;
      problems.push(`${name} must have a ${eventData.nature} nature${etc} - Mints are only available starting gen 8.`);
    }
    let requiredIVs = 0;
    if (eventData.ivs) {
      const canBottleCap = dex.gen >= 7 && set.level >= (dex.gen < 9 ? 100 : 50);
      if (!set.ivs)
        set.ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
      let statName;
      for (statName in eventData.ivs) {
        if (canBottleCap && set.ivs[statName] === 31)
          continue;
        if (set.ivs[statName] !== eventData.ivs[statName]) {
          if (fastReturn)
            return true;
          problems.push(`${name} must have ${eventData.ivs[statName]} ${import_dex.Dex.stats.names[statName]} IVs${etc}.`);
        }
      }
      if (canBottleCap) {
        if (Object.keys(eventData.ivs).length >= 6) {
          const requiredHpType = dex.getHiddenPower(eventData.ivs).type;
          if (set.hpType && set.hpType !== requiredHpType) {
            if (fastReturn)
              return true;
            problems.push(`${name} can only have Hidden Power ${requiredHpType}${etc}.`);
          }
          set.hpType = requiredHpType;
        }
      }
    } else {
      requiredIVs = eventData.perfectIVs || 0;
    }
    if (requiredIVs && set.ivs) {
      let perfectIVs = 0;
      let statName;
      for (statName in set.ivs) {
        if (set.ivs[statName] >= 31)
          perfectIVs++;
      }
      if (perfectIVs < requiredIVs) {
        if (fastReturn)
          return true;
        if (eventData.perfectIVs) {
          problems.push(`${name} must have at least ${requiredIVs} perfect IVs${etc}.`);
        }
      }
      if (dex.gen >= 3 && requiredIVs >= 3 && set.hpType === "Fighting") {
        if (fastReturn)
          return true;
        problems.push(`${name} can't use Hidden Power Fighting because it must have at least three perfect IVs${etc}.`);
      } else if (dex.gen >= 3 && requiredIVs >= 5 && set.hpType && !["Dark", "Dragon", "Electric", "Steel", "Ice"].includes(set.hpType)) {
        if (fastReturn)
          return true;
        problems.push(`${name} can only use Hidden Power Dark/Dragon/Electric/Steel/Ice because it must have at least 5 perfect IVs${etc}.`);
      }
    }
    const ruleTable = this.ruleTable;
    if (ruleTable.has("obtainablemoves")) {
      const ssMaxSourceGen = setSources.maxSourceGen();
      const tradebackEligible = dex.gen === 2 && (species.gen === 1 || eventSpecies.gen === 1);
      if (ssMaxSourceGen && eventData.generation > ssMaxSourceGen && !tradebackEligible) {
        if (fastReturn)
          return true;
        problems.push(`${name} must not have moves only learnable in gen ${ssMaxSourceGen}${etc}.`);
      }
      if (eventData.from === "Gen 5 Dream World" && setSources.dreamWorldMoveCount > 1) {
        problems.push(`${name} can only have one Dream World move.`);
      }
    }
    if (ruleTable.has("obtainableabilities")) {
      if (dex.gen <= 5 && eventData.abilities && eventData.abilities.length === 1 && !eventData.isHidden) {
        if (species.name === eventSpecies.name) {
          const requiredAbility = dex.abilities.get(eventData.abilities[0]).name;
          if (set.ability !== requiredAbility) {
            if (fastReturn)
              return true;
            problems.push(`${name} must have ${requiredAbility}${etc}.`);
          }
        } else {
          const ability1 = dex.abilities.get(eventSpecies.abilities["1"]);
          if (ability1.gen && eventData.generation >= ability1.gen) {
            const requiredAbilitySlot = (0, import_dex.toID)(eventData.abilities[0]) === ability1.id ? 1 : 0;
            const requiredAbility = dex.abilities.get(species.abilities[requiredAbilitySlot] || species.abilities["0"]).name;
            if (set.ability !== requiredAbility) {
              const originalAbility = dex.abilities.get(eventData.abilities[0]).name;
              if (fastReturn)
                return true;
              problems.push(`${name} must have ${requiredAbility}${because} from a ${originalAbility} ${eventSpecies.name} event.`);
            }
          }
        }
      }
      if (species.abilities["H"]) {
        const isHidden = set.ability === species.abilities["H"];
        if (!isHidden && eventData.isHidden && dex.gen <= 8) {
          if (fastReturn)
            return true;
          problems.push(`${name} must have its Hidden Ability${etc}.`);
        }
        const canUseAbilityPatch = dex.gen >= 8 && this.format.mod !== "gen8dlc1";
        if (isHidden && !eventData.isHidden && !canUseAbilityPatch) {
          if (fastReturn)
            return true;
          problems.push(`${name} must not have its Hidden Ability${etc}.`);
        }
      }
    }
    if (problems.length)
      return problems;
    if (eventData.gender)
      set.gender = eventData.gender;
  }
  allSources(species) {
    let minSourceGen = this.minSourceGen;
    if (this.dex.gen >= 3 && minSourceGen < 3)
      minSourceGen = 3;
    if (species)
      minSourceGen = Math.max(minSourceGen, species.gen);
    const maxSourceGen = this.ruleTable.has("allowtradeback") ? import_lib.Utils.clampIntRange(this.dex.gen + 1, 1, 8) : this.dex.gen;
    return new PokemonSources(maxSourceGen, minSourceGen);
  }
  validateMoves(species, moves, setSources, set, name = species.name, moveLegalityWhitelist = {}) {
    const dex = this.dex;
    const ruleTable = this.ruleTable;
    const problems = [];
    const checkCanLearn = ruleTable.checkCanLearn?.[0] || this.checkCanLearn;
    for (const moveName of moves) {
      const move = dex.moves.get(moveName);
      if (moveLegalityWhitelist[move.id])
        continue;
      const problem = checkCanLearn.call(this, move, species, setSources, set);
      if (problem) {
        problems.push(`${name}${problem}`);
        break;
      }
    }
    if (setSources.size() && setSources.moveEvoCarryCount > 3) {
      if (setSources.sourcesBefore < 6)
        setSources.sourcesBefore = 0;
      setSources.sources = setSources.sources.filter(
        (source) => source.charAt(1) === "E" && parseInt(source.charAt(0)) >= 6
      );
      if (!setSources.size()) {
        problems.push(`${name} needs to know ${species.evoMove || "a Fairy-type move"} to evolve, so it can only know 3 other moves from ${species.prevo}.`);
      }
    }
    if (problems.length)
      return problems;
    if (setSources.isHidden) {
      setSources.sources = setSources.sources.filter(
        (source) => parseInt(source.charAt(0)) >= 5
      );
      if (setSources.sourcesBefore < 5)
        setSources.sourcesBefore = 0;
      const canUseAbilityPatch = dex.gen >= 8 && this.format.mod !== "gen8dlc1";
      if (!setSources.size() && !canUseAbilityPatch) {
        problems.push(`${name} has a hidden ability - it can't have moves only learned before gen 5.`);
        return problems;
      }
    }
    if (setSources.babyOnly && setSources.sources.length) {
      const baby = dex.species.get(setSources.babyOnly);
      const babyEvo = (0, import_dex.toID)(baby.evos[0]);
      setSources.sources = setSources.sources.filter((source) => {
        if (source.charAt(1) === "S") {
          const sourceId = source.split(" ")[1];
          if (sourceId !== baby.id)
            return false;
        }
        if (source.charAt(1) === "E") {
          if (babyEvo && source.slice(2) === babyEvo)
            return false;
        }
        if (source.charAt(1) === "D") {
          if (babyEvo && source.slice(2) === babyEvo)
            return false;
        }
        return true;
      });
      if (!setSources.size()) {
        problems.push(`${name}'s event/egg moves are from an evolution, and are incompatible with its moves from ${baby.name}.`);
      }
    }
    if (setSources.babyOnly && setSources.size() && this.gen > 2) {
      const baby = dex.species.get(setSources.babyOnly);
      setSources.sources = setSources.sources.filter((source) => {
        if (baby.gen > parseInt(source.charAt(0)) && !source.startsWith("1ST"))
          return false;
        if (baby.gen > 2 && source === "7V")
          return false;
        return true;
      });
      if (setSources.sourcesBefore < baby.gen)
        setSources.sourcesBefore = 0;
      if (!setSources.size()) {
        problems.push(`${name} has moves from before Gen ${baby.gen}, which are incompatible with its moves from ${baby.name}.`);
      }
    }
    return problems;
  }
  /**
   * Returns a list of problems regarding a Pokemon's avilability in Pokemon GO (empty list if no problems)
   * If the Pokemon cannot be obtained from Pokemon GO, returns null
   */
  validatePokemonGo(species, set, setSources, name = species.name) {
    let problems = [];
    let minLevel = 50;
    let minIVs = 15;
    const dex = this.dex;
    const pokemonGoData = dex.species.getPokemonGoData(species.id);
    if (dex.gen < 8 || this.format.mod === "gen8dlc1")
      return null;
    if (!pokemonGoData) {
      const otherSpecies = this.dex.species.learnsetParent(species);
      if (otherSpecies && !species.evoLevel) {
        const otherProblems = this.validatePokemonGo(otherSpecies, set, setSources, name);
        if (otherProblems) {
          problems = otherProblems;
        } else {
          return null;
        }
      } else {
        return null;
      }
    } else {
      const pokemonGoSources = pokemonGoData.encounters;
      if (!pokemonGoSources)
        throw new Error(`Species with no Pokemon GO data: ${species.id}`);
      if (set.shiny)
        name = "Shiny " + name;
      if (set.shiny && pokemonGoSources.includes("noshiny")) {
        problems.push(`${name} is not obtainable from Pokemon GO.`);
      } else {
        if (pokemonGoSources.includes("wild") && !(set.shiny && pokemonGoSources.includes("nowildshiny"))) {
          minLevel = 1;
          minIVs = 0;
        }
        if (pokemonGoSources.includes("egg")) {
          minLevel = Math.min(minLevel, 2);
          minIVs = Math.min(minIVs, 10);
        }
        if (pokemonGoSources.includes("12kmegg")) {
          minLevel = Math.min(minLevel, 8);
          minIVs = Math.min(minIVs, 10);
        }
        if (pokemonGoSources.includes("raid")) {
          minLevel = Math.min(minLevel, 20);
          minIVs = Math.min(minIVs, 10);
        }
        if (species.id === "mewtwo" && set.level && set.level >= 20) {
          minIVs = Math.min(minIVs, 0);
        }
        if (pokemonGoSources.includes("research")) {
          minLevel = Math.min(minLevel, 15);
          minIVs = Math.min(minIVs, 10);
        }
        if (pokemonGoSources.includes("giovanni") && !set.shiny) {
          minLevel = Math.min(minLevel, 8);
          minIVs = Math.min(minIVs, 1);
          if (set.level && set.level < 12)
            setSources.pokemonGoSource = "purified";
        }
        if (!pokemonGoSources.includes("notrade")) {
          if (!set.shiny || species.id !== "deoxys") {
            const specialTrade = pokemonGoSources.includes("specialtrade") || set.shiny;
            minLevel = Math.min(minLevel, 12);
            minIVs = Math.min(minIVs, specialTrade ? 1 : 0);
          }
        }
        if (set.level && set.level < minLevel) {
          problems.push(`${name} must be at least level ${minLevel} to be from Pokemon GO.`);
        }
        const ivs = set.ivs || TeamValidator.fillStats(null, 31);
        for (const stat in ivs) {
          if (Math.floor(ivs[stat] / 2) < minIVs && stat !== "spe") {
            problems.push(`${name} must have at least ${minIVs} ` + (minIVs === 1 ? `IV` : `IVs`) + ` in non-Speed stats to be from Pokemon GO.`);
            break;
          }
        }
      }
    }
    return problems;
  }
  omCheckCanLearn(move, s, setSources = this.allSources(s), set = {}, problem = `${set.name || s.name} can't learn ${move.name}`) {
    if (!this.ruleTable.checkCanLearn?.[0])
      return problem;
    const baseCheckCanLearn = this.checkCanLearn;
    this.checkCanLearn = () => problem;
    const omVerdict = this.ruleTable.checkCanLearn[0].call(this, move, s, setSources, set);
    this.checkCanLearn = baseCheckCanLearn;
    return omVerdict;
  }
  /** Returns null if you can learn the move, or a string explaining why you can't learn it */
  checkCanLearn(move, originalSpecies, setSources = this.allSources(originalSpecies), set = {}) {
    const dex = this.dex;
    if (!setSources.size())
      throw new Error(`Bad sources passed to checkCanLearn`);
    move = dex.moves.get(move);
    const moveid = move.id;
    const baseSpecies = dex.species.get(originalSpecies);
    const format = this.format;
    const ruleTable = dex.formats.getRuleTable(format);
    const level = set.level || 100;
    let cantLearnReason = null;
    let limit1 = true;
    let sketch = false;
    let blockedHM = false;
    let babyOnly = "";
    const moveSources = new PokemonSources();
    const noFutureGen = !ruleTable.has("allowtradeback");
    const canSketchPostGen7Moves = ruleTable.has("sketchpostgen7moves") || this.dex.currentMod === "gen8bdsp";
    let tradebackEligible = false;
    const fullLearnset = dex.species.getFullLearnset(originalSpecies.id);
    if (!fullLearnset.length) {
      return ` can't learn any moves at all.`;
    }
    for (const { species, learnset } of fullLearnset) {
      if (dex.gen <= 2 && species.gen === 1)
        tradebackEligible = true;
      const checkingPrevo = species.baseSpecies !== originalSpecies.baseSpecies;
      if (checkingPrevo && !moveSources.size()) {
        if (!setSources.babyOnly || !species.prevo) {
          babyOnly = species.id;
        }
      }
      let sources = learnset[moveid] || [];
      if (moveid === "sketch") {
        sketch = true;
      } else if (learnset["sketch"]) {
        if (move.noSketch || move.isZ || move.isMax) {
          cantLearnReason = `can't be Sketched.`;
        } else if (move.gen > 7 && !canSketchPostGen7Moves && (dex.gen === 8 || dex.gen === 9 && ["gen9dlc1", "gen9predlc"].includes(format.mod))) {
          cantLearnReason = `can't be Sketched because it's a Gen ${move.gen} move and Sketch isn't available in Gen ${move.gen}.`;
        } else {
          if (!sources.length || !moveSources.size())
            sketch = true;
          sources = [...learnset["sketch"], ...sources];
        }
      }
      for (let learned of sources) {
        const learnedGen = parseInt(learned.charAt(0));
        if (learnedGen < this.minSourceGen) {
          if (!cantLearnReason) {
            cantLearnReason = `can't be transferred from Gen ${learnedGen} to ${this.minSourceGen}.`;
          }
          continue;
        }
        if (noFutureGen && learnedGen > dex.gen) {
          if (!cantLearnReason) {
            cantLearnReason = `can't be transferred from Gen ${learnedGen} to ${dex.gen}.`;
          }
          continue;
        }
        if (learnedGen <= moveSources.sourcesBefore)
          continue;
        if (baseSpecies.evoRegion === "Alola" && checkingPrevo && learnedGen >= 8 && (dex.gen < 9 || learned.charAt(1) !== "E")) {
          cantLearnReason = `is from a ${species.name} that can't be transferred to USUM to evolve into ${baseSpecies.name}.`;
          continue;
        }
        const canUseAbilityPatch = dex.gen >= 8 && format.mod !== "gen8dlc1";
        if (learnedGen < 7 && setSources.isHidden && !canUseAbilityPatch && !dex.mod("gen" + learnedGen).species.get(baseSpecies.name).abilities["H"]) {
          cantLearnReason = `can only be learned in gens without Hidden Abilities.`;
          continue;
        }
        const ability = dex.abilities.get(set.ability);
        if (dex.gen < 6 && ability.gen > learnedGen && !checkingPrevo) {
          cantLearnReason = `is learned in gen ${learnedGen}, but the Ability ${ability.name} did not exist then.`;
          continue;
        }
        if (!species.isNonstandard) {
          if (dex.gen >= 4 && learnedGen <= 3 && [
            "cut",
            "fly",
            "surf",
            "strength",
            "flash",
            "rocksmash",
            "waterfall",
            "dive"
          ].includes(moveid)) {
            cantLearnReason = `can't be transferred from Gen 3 to 4 because it's an HM move.`;
            continue;
          }
          if (dex.gen >= 5 && learnedGen <= 4 && [
            "cut",
            "fly",
            "surf",
            "strength",
            "rocksmash",
            "waterfall",
            "rockclimb"
          ].includes(moveid)) {
            cantLearnReason = `can't be transferred from Gen 4 to 5 because it's an HM move.`;
            continue;
          }
          if (dex.gen >= 5 && ["defog", "whirlpool"].includes(moveid) && learnedGen <= 4)
            blockedHM = true;
        }
        if (learned.charAt(1) === "L") {
          if (level >= parseInt(learned.substr(2)) || learnedGen === 7) {
          } else if (level >= 5 && learnedGen === 3 && species.canHatch) {
            learned = learnedGen + "Epomeg";
          } else if ((!species.gender || species.gender === "F") && learnedGen >= 2 && species.canHatch && !setSources.isFromPokemonGo) {
            learned = learnedGen + "Eany";
          } else {
            cantLearnReason = `is learned at level ${parseInt(learned.substr(2))}.`;
            continue;
          }
        }
        if (learnedGen >= 8 && learned.charAt(1) === "E" && learned.slice(1) !== "Eany" && learned.slice(1) !== "Epomeg" || "LMTR".includes(learned.charAt(1))) {
          if (learnedGen === dex.gen && learned.charAt(1) !== "R") {
            if (!(learnedGen >= 8 && learned.charAt(1) === "E") && babyOnly) {
              if (setSources.isFromPokemonGo && species.evoLevel) {
                cantLearnReason = `is from a prevo, which is incompatible with its Pokemon GO origin.`;
                continue;
              } else {
                setSources.babyOnly = babyOnly;
              }
            }
            if (!moveSources.moveEvoCarryCount)
              return null;
          }
          if (learned.charAt(1) === "R") {
            moveSources.restrictedMove = moveid;
          }
          limit1 = false;
          moveSources.addGen(learnedGen);
        } else if (learned.charAt(1) === "E") {
          let limitedEggMove = void 0;
          if (learned.slice(1) === "Eany") {
            if (species.gender === "F") {
              limitedEggMove = move.id;
              moveSources.levelUpEggMoves = [move.id];
            } else {
              limitedEggMove = null;
            }
          } else if (learned.slice(1) === "Epomeg") {
            moveSources.pomegEggMoves = [move.id];
          } else if (learnedGen < 6) {
            limitedEggMove = move.id;
          }
          learned = learnedGen + "E" + (species.prevo ? species.id : "");
          if (tradebackEligible && learnedGen === 2 && move.gen <= 1) {
            moveSources.add("1ET" + learned.slice(2), limitedEggMove);
          }
          moveSources.add(learned, limitedEggMove);
        } else if (learned.charAt(1) === "S") {
          if (tradebackEligible && learnedGen === 2 && move.gen <= 1) {
            moveSources.add("1ST" + learned.slice(2) + " " + species.id);
          }
          moveSources.add(learned + " " + species.id);
          const eventLearnset = dex.species.getLearnsetData(species.id);
          if (eventLearnset.eventData?.[parseInt(learned.charAt(2))].emeraldEventEgg && learnedGen === 3) {
            moveSources.pomegEventEgg = learned + " " + species.id;
          }
        } else if (learned.charAt(1) === "D") {
          moveSources.add(learned + species.id);
          moveSources.dreamWorldMoveCount++;
        } else if (learned.charAt(1) === "V" && this.minSourceGen < learnedGen) {
          if (learned === "8V" && setSources.isFromPokemonGo && babyOnly && species.evoLevel) {
            cantLearnReason = `is from a prevo, which is incompatible with its Pokemon GO origin.`;
            continue;
          }
          moveSources.add(learned);
        }
      }
      if (ruleTable.has("mimicglitch") && species.gen < 5) {
        const glitchMoves = ["metronome", "copycat", "transform", "mimic", "assist"];
        let getGlitch = false;
        for (const i of glitchMoves) {
          if (learnset[i]) {
            if (!(i === "mimic" && dex.abilities.get(set.ability).gen === 4 && !species.prevo)) {
              getGlitch = true;
              break;
            }
          }
        }
        if (getGlitch) {
          moveSources.addGen(4);
          if (move.gen < 5) {
            limit1 = false;
          }
        }
      }
      if (!moveSources.size()) {
        if (species.evoType === "levelMove" && species.evoMove !== move.name || species.id === "sylveon" && move.type !== "Fairy") {
          moveSources.moveEvoCarryCount = 1;
        }
      }
    }
    if (limit1 && sketch) {
      if (setSources.sketchMove) {
        return ` can't Sketch ${move.name} and ${setSources.sketchMove} because it can only Sketch 1 move.`;
      }
      setSources.sketchMove = move.name;
    }
    if (blockedHM) {
      if (setSources.hm)
        return ` can't simultaneously transfer Defog and Whirlpool from Gen 4 to 5.`;
      setSources.hm = moveid;
    }
    if (!setSources.restrictiveMoves) {
      setSources.restrictiveMoves = [];
    }
    setSources.restrictiveMoves.push(move.name);
    const checkedSpecies = babyOnly ? fullLearnset[fullLearnset.length - 1].species : baseSpecies;
    if (checkedSpecies && setSources.isFromPokemonGo && (setSources.pokemonGoSource === "purified" || checkedSpecies.id === "mew")) {
      const pokemonGoData = dex.species.getPokemonGoData(checkedSpecies.id);
      if (pokemonGoData.LGPERestrictiveMoves) {
        let levelUpMoveCount = 0;
        const restrictiveMovesToID = [];
        for (const moveName of setSources.restrictiveMoves) {
          restrictiveMovesToID.push((0, import_dex.toID)(moveName));
        }
        for (const restrictiveMove in pokemonGoData.LGPERestrictiveMoves) {
          const moveLevel = pokemonGoData.LGPERestrictiveMoves[restrictiveMove];
          if ((0, import_dex.toID)(move) === restrictiveMove) {
            if (!moveLevel) {
              return `'s move ${move.name} is incompatible with its Pokemon GO origin.`;
            } else if (set.level && set.level < moveLevel) {
              return ` must be at least level ${moveLevel} to learn ${move.name} due to its Pokemon GO origin.`;
            }
          }
          if (levelUpMoveCount)
            levelUpMoveCount++;
          if (restrictiveMovesToID.includes(restrictiveMove)) {
            if (!levelUpMoveCount) {
              levelUpMoveCount++;
            } else if (levelUpMoveCount > 4) {
              return `'s moves ${(setSources.restrictiveMoves || []).join(", ")} are incompatible with its Pokemon GO origin.`;
            }
          }
        }
      }
    }
    if (!moveSources.size()) {
      if (cantLearnReason)
        return `'s move ${move.name} ${cantLearnReason}`;
      return ` can't learn ${move.name}.`;
    }
    const eggSources = moveSources.sources.filter((source) => source.charAt(1) === "E");
    if (dex.gen >= 3 && eggSources.length && moveSources.limitedEggMoves === null && moveSources.sourcesBefore) {
      moveSources.possiblyLimitedEggMoves = [(0, import_dex.toID)(moveSources.sourcesBefore + move.id)];
    }
    const backupSources = setSources.sources;
    const backupSourcesBefore = setSources.sourcesBefore;
    setSources.intersectWith(moveSources);
    if (!setSources.size()) {
      setSources.sources = backupSources;
      setSources.sourcesBefore = backupSourcesBefore;
      if (setSources.isFromPokemonGo)
        return `'s move ${move.name} is incompatible with its Pokemon GO origin.`;
      return `'s moves ${(setSources.restrictiveMoves || []).join(", ")} are incompatible.`;
    }
    if (babyOnly)
      setSources.babyOnly = babyOnly;
    return null;
  }
  static fillStats(stats, fillNum = 0) {
    const filledStats = { hp: fillNum, atk: fillNum, def: fillNum, spa: fillNum, spd: fillNum, spe: fillNum };
    if (stats) {
      let statName;
      for (statName in filledStats) {
        const stat = stats[statName];
        if (typeof stat === "number")
          filledStats[statName] = stat;
      }
    }
    return filledStats;
  }
  static get(format) {
    return new TeamValidator(format);
  }
}
//# sourceMappingURL=team-validator.js.map
