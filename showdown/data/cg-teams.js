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
var cg_teams_exports = {};
__export(cg_teams_exports, {
  default: () => TeamGenerator,
  levelUpdateInterval: () => levelUpdateInterval
});
module.exports = __toCommonJS(cg_teams_exports);
var import_sim = require("../sim");
var import_cg_team_data = require("./cg-team-data");
const MAX_WEAK_TO_SAME_TYPE = 3;
const levelOverride = {};
let levelUpdateInterval = null;
async function updateLevels(database) {
  const updateSpecies = await database.prepare(
    "UPDATE gen9computergeneratedteams SET wins = 0, losses = 0, level = ? WHERE species_id = ?"
  );
  const updateHistory = await database.prepare(
    `INSERT INTO gen9_historical_levels (level, species_id, timestamp) VALUES (?, ?, ${Date.now()})`
  );
  const data = await database.all("SELECT species_id, wins, losses, level FROM gen9computergeneratedteams");
  for (let { species_id, wins, losses, level } of data) {
    const total = wins + losses;
    if (total > 10) {
      if (wins / total >= 0.55)
        level--;
      if (wins / total <= 0.45)
        level++;
      level = Math.max(1, Math.min(100, level));
      await updateSpecies?.run([level, species_id]);
      await updateHistory?.run([level, species_id]);
    }
    levelOverride[species_id] = level;
  }
}
if (global.Config && Config.usesqlite && Config.usesqliteleveling) {
  const database = (0, import_sim.SQL)(module, { file: "./databases/battlestats.db" });
  void updateLevels(database);
  levelUpdateInterval = setInterval(() => void updateLevels(database), 1e3 * 60 * 60 * 2);
}
class TeamGenerator {
  constructor(format, seed) {
    /** An estimate of the highest raw speed in the metagame */
    this.TOP_SPEED = 300;
    this.dex = import_sim.Dex.forFormat(format);
    this.format = import_sim.Dex.formats.get(format);
    this.teamSize = this.format.ruleTable?.maxTeamSize || 6;
    this.prng = seed instanceof import_sim.PRNG ? seed : new import_sim.PRNG(seed);
    this.itemPool = this.dex.items.all().filter((i) => i.exists && i.isNonstandard !== "Past" && !i.isPokeball);
    this.specialItems = {};
    for (const i of this.itemPool) {
      if (i.itemUser && !i.isNonstandard) {
        for (const user of i.itemUser) {
          if (import_sim.Dex.species.get(user).requiredItems?.[0] !== i.name)
            this.specialItems[user] = i.id;
        }
      }
    }
    const rules = import_sim.Dex.formats.getRuleTable(this.format);
    if (rules.adjustLevel)
      this.forceLevel = rules.adjustLevel;
  }
  getTeam() {
    let speciesPool = this.dex.species.all().filter((s) => {
      if (!s.exists)
        return false;
      if (s.isNonstandard || s.isNonstandard === "Unobtainable")
        return false;
      if (s.nfe)
        return false;
      if (s.battleOnly && (!s.requiredItems?.length || s.name.endsWith("-Tera")))
        return false;
      return true;
    });
    const teamStats = {
      hazardSetters: {},
      typeWeaknesses: {},
      hazardRemovers: 0
    };
    const team = [];
    while (team.length < this.teamSize && speciesPool.length) {
      const species = this.prng.sample(speciesPool);
      const haveRoomToReject = speciesPool.length >= this.teamSize - team.length;
      const isGoodFit = this.speciesIsGoodFit(species, teamStats);
      if (haveRoomToReject && !isGoodFit)
        continue;
      speciesPool = speciesPool.filter((s) => s.baseSpecies !== species.baseSpecies);
      team.push(this.makeSet(species, teamStats));
    }
    return team;
  }
  makeSet(species, teamStats) {
    const abilityPool = Object.values(species.abilities);
    const abilityWeights = abilityPool.map((a) => this.getAbilityWeight(this.dex.abilities.get(a)));
    const ability = this.weightedRandomPick(abilityPool, abilityWeights);
    const level = this.forceLevel || TeamGenerator.getLevel(species);
    const moves = [];
    let movePool = [...this.dex.species.getMovePool(species.id)];
    if (!movePool.length)
      throw new Error(`No moves for ${species.id}`);
    const numberOfMovesToConsider = Math.min(movePool.length, Math.max(15, Math.trunc(movePool.length * 0.3)));
    let movePoolIsTrimmed = false;
    let isRound2 = false;
    const movePoolCopy = movePool;
    let interimMovePool = [];
    while (moves.length < 4 && movePool.length) {
      let weights;
      if (!movePoolIsTrimmed) {
        if (!isRound2) {
          for (const move of movePool) {
            const weight = this.getMoveWeight(this.dex.moves.get(move), teamStats, species, moves, ability, level);
            interimMovePool.push({ move, weight });
          }
          interimMovePool.sort((a, b) => b.weight - a.weight);
        } else {
          const originalWeights = [];
          for (const move of moves) {
            originalWeights.push(interimMovePool.find((m) => m.move === move.id));
          }
          interimMovePool = originalWeights;
          for (const moveID2 of movePoolCopy) {
            const move = this.dex.moves.get(moveID2);
            if (moves.includes(move))
              continue;
            const weight = this.getMoveWeight(move, teamStats, species, moves, ability, level);
            interimMovePool.push({ move: moveID2, weight });
          }
          interimMovePool.sort((a, b) => b.weight - a.weight);
          moves.splice(0);
        }
        movePool = [];
        weights = [];
        for (let i = 0; i < numberOfMovesToConsider; i++) {
          movePool.push(interimMovePool[i].move);
          weights.push(interimMovePool[i].weight);
        }
        movePoolIsTrimmed = true;
      } else {
        weights = movePool.map((m) => this.getMoveWeight(this.dex.moves.get(m), teamStats, species, moves, ability, level));
      }
      const moveID = this.weightedRandomPick(movePool, weights, { remove: true });
      moves.push(this.dex.moves.get(moveID));
      if (TeamGenerator.moveIsHazard(moves[moves.length - 1])) {
        teamStats.hazardSetters[moveID] = (teamStats.hazardSetters[moveID] || 0) + 1;
      }
      if (["defog", "courtchange", "tidyup", "rapidspin", "mortalspin"].includes(moveID))
        teamStats.hazardRemovers++;
      if (!isRound2 && moves.length === 3) {
        isRound2 = true;
        movePoolIsTrimmed = false;
        continue;
      }
      const pairedMove = import_cg_team_data.MOVE_PAIRINGS[moveID];
      const alreadyHavePairedMove = moves.some((m) => m.id === pairedMove);
      if (moves.length < 4 && pairedMove && !alreadyHavePairedMove && // We don't check movePool because sometimes paired moves are bad.
      this.dex.species.getLearnsetData(species.id).learnset?.[pairedMove]) {
        moves.push(this.dex.moves.get(pairedMove));
        const pairedMoveIndex = movePool.indexOf(pairedMove);
        if (pairedMoveIndex > -1)
          movePool.splice(pairedMoveIndex, 1);
      }
    }
    let item = "";
    const nonStatusMoves = moves.filter((move) => this.dex.moves.get(move).category !== "Status");
    if (species.requiredItem) {
      item = species.requiredItem;
    } else if (species.requiredItems) {
      item = this.prng.sample(species.requiredItems.filter((i) => !this.dex.items.get(i).isNonstandard));
    } else if (this.specialItems[species.name] && nonStatusMoves.length) {
      item = this.specialItems[species.name];
    } else if (moves.every((m) => m.id !== "acrobatics")) {
      const weights = [];
      const items = [];
      for (const i of this.itemPool) {
        const weight = this.getItemWeight(i, teamStats, species, moves, ability, level);
        if (weight !== 0) {
          weights.push(weight);
          items.push(i.name);
        }
      }
      if (!item)
        item = this.weightedRandomPick(items, weights);
    } else if (["Quark Drive", "Protosynthesis"].includes(ability)) {
      item = "Booster Energy";
    }
    const ivs = {
      hp: 31,
      atk: moves.some((move) => this.dex.moves.get(move).category === "Physical") ? 31 : 0,
      def: 31,
      spa: 31,
      spd: 31,
      spe: 31
    };
    const hasTeraBlast = moves.some((m) => m.id === "terablast");
    const hasRevelationDance = moves.some((m) => m.id === "revelationdance");
    let teraType;
    if (species.forceTeraType) {
      teraType = species.forceTeraType;
    } else if (item === "blacksludge" && this.prng.randomChance(2, 3)) {
      teraType = "Poison";
    } else if (hasTeraBlast && ability === "Contrary" && this.prng.randomChance(2, 3)) {
      teraType = "Stellar";
    } else {
      let types = nonStatusMoves.map((move) => TeamGenerator.moveType(this.dex.moves.get(move), species));
      const noStellar = ability === "Adaptability" || new Set(types).size < 3;
      if (hasTeraBlast || hasRevelationDance || !nonStatusMoves.length) {
        types = [...this.dex.types.all().map((t) => t.name)];
        if (noStellar)
          types.splice(types.indexOf("Stellar"));
      } else {
        if (!noStellar)
          types.push("Stellar");
      }
      teraType = this.prng.sample(types);
    }
    return {
      name: species.name,
      species: species.name,
      item,
      ability,
      moves: moves.map((m) => m.name),
      nature: "Quirky",
      gender: species.gender,
      evs: { hp: 84, atk: 84, def: 84, spa: 84, spd: 84, spe: 84 },
      ivs,
      level,
      teraType,
      shiny: this.prng.randomChance(1, 1024),
      happiness: 255
    };
  }
  /**
   * @returns true if the Pokémon is a good fit for the team so far, and no otherwise
   */
  speciesIsGoodFit(species, stats) {
    for (const type of this.dex.types.all()) {
      const effectiveness = this.dex.getEffectiveness(type.name, species.types);
      if (effectiveness === 1) {
        if (stats.typeWeaknesses[type.name] === void 0) {
          stats.typeWeaknesses[type.name] = 0;
        }
        if (stats.typeWeaknesses[type.name] >= MAX_WEAK_TO_SAME_TYPE) {
          return false;
        }
      }
    }
    for (const type of this.dex.types.all()) {
      const effectiveness = this.dex.getEffectiveness(type.name, species.types);
      if (effectiveness === 1) {
        stats.typeWeaknesses[type.name]++;
      }
    }
    return true;
  }
  /**
   * @returns A weighting for the Pokémon's ability.
   */
  getAbilityWeight(ability) {
    return ability.rating + 1;
  }
  static moveIsHazard(move) {
    return !!(move.sideCondition && move.target === "foeSide");
  }
  /**
   * @returns A weight for a given move on a given Pokémon.
   */
  getMoveWeight(move, teamStats, species, movesSoFar, ability, level) {
    if (!move.exists)
      return 0;
    if (move.target === "adjacentAlly")
      return 0;
    if (ability === "Tera Shift")
      species = this.dex.species.get("Terapagos-Terastal");
    const adjustedStats = {
      hp: species.baseStats.hp * level / 100 + level,
      atk: species.baseStats.atk * level * level / 1e4,
      def: species.baseStats.def * level / 100,
      spa: species.baseStats.spa * level * level / 1e4,
      spd: species.baseStats.spd * level / 100,
      spe: species.baseStats.spe * level / 100
    };
    if (move.category === "Status") {
      let weight2 = 2400;
      if (move.status)
        weight2 *= TeamGenerator.statusWeight(move.status) * 2;
      if (TeamGenerator.moveIsHazard(move) && (teamStats.hazardSetters[move.id] || 0) < 1) {
        weight2 *= move.id === "spikes" ? 12 : 16;
        if (movesSoFar.some((m) => TeamGenerator.moveIsHazard(m)))
          weight2 *= 2;
      }
      if (["defog", "courtchange", "tidyup"].includes(move.id) && !teamStats.hazardRemovers) {
        weight2 *= 32;
        weight2 *= Math.pow(0.8, Object.values(teamStats.hazardSetters).reduce((total, num) => total + num, 0));
      }
      weight2 *= this.boostWeight(move, movesSoFar, species, ability, level);
      weight2 *= this.opponentDebuffWeight(move);
      if (move.id === "focusenergy" && ability !== "Super Luck") {
        const highCritMoves = movesSoFar.filter((m) => m.critRatio && m.critRatio > 1);
        weight2 *= 1 + highCritMoves.length * (ability === "Sniper" ? 2 : 1);
      } else if (move.id === "tailwind" && ability === "Wind Rider" && movesSoFar.some((m) => m.category === "Physical")) {
        weight2 *= 2.5;
      }
      if (!movesSoFar.some((m) => m.stallingMove)) {
        if (adjustedStats.def >= 80 || adjustedStats.spd >= 80 || adjustedStats.hp >= 80) {
          switch (move.volatileStatus) {
            case "endure":
              weight2 *= 3;
              break;
            case "protect":
            case "kingsshield":
            case "silktrap":
              weight2 *= 4;
              break;
            case "banefulbunker":
            case "burningbulwark":
            case "spikyshield":
              weight2 *= 5;
              break;
            default:
              break;
          }
        }
      }
      if (move.id in import_cg_team_data.HARDCODED_MOVE_WEIGHTS)
        weight2 *= import_cg_team_data.HARDCODED_MOVE_WEIGHTS[move.id];
      const goodAttacker = adjustedStats.atk > 65 || adjustedStats.spa > 65;
      if (goodAttacker && movesSoFar.filter((m) => m.category !== "Status").length < 2) {
        weight2 *= 0.3;
      }
      if (move.heal && movesSoFar.some((m) => m.heal))
        weight2 *= 0.5;
      return weight2;
    }
    let basePower = move.basePower;
    if (import_cg_team_data.WEIGHT_BASED_MOVES.includes(move.id) || import_cg_team_data.TARGET_HP_BASED_MOVES.includes(move.id))
      basePower = 60;
    if (move.id === "electroball")
      basePower = Math.min(150, adjustedStats.spe / 2);
    const slownessRating = Math.max(0, this.TOP_SPEED - adjustedStats.spe) / this.TOP_SPEED;
    if (move.id === "gyroball")
      basePower = 150 * slownessRating;
    let baseStat = move.category === "Physical" ? adjustedStats.atk : adjustedStats.spa;
    if (move.id === "foulplay")
      baseStat = adjustedStats.spe * level / 100;
    if (move.id === "bodypress")
      baseStat = adjustedStats.def * level / 100;
    let accuracy = move.accuracy === true || ability === "No Guard" ? 110 : move.accuracy;
    if (accuracy < 100) {
      if (ability === "Compound Eyes")
        accuracy = Math.min(100, Math.round(accuracy * 1.3));
      if (ability === "Victory Star")
        accuracy = Math.min(100, Math.round(accuracy * 1.1));
    }
    accuracy /= 100;
    const moveType = TeamGenerator.moveType(move, species);
    let powerEstimate = basePower * baseStat * accuracy;
    if (species.types.includes(moveType))
      powerEstimate *= ability === "Adaptability" ? 2 : 1.5;
    if (ability === "Technician" && move.basePower <= 60)
      powerEstimate *= 1.5;
    if (ability === "Sheer Force" && (move.secondary || move.secondaries))
      powerEstimate *= 1.3;
    const numberOfHits = Array.isArray(move.multihit) ? ability === "Skill Link" ? move.multihit[1] : (move.multihit[0] + move.multihit[1]) / 2 : move.multihit || 1;
    powerEstimate *= numberOfHits;
    if (species.requiredItems) {
      const item = this.dex.items.get(this.specialItems[species.name]);
      if (item.onBasePower && (species.types.includes(moveType) || item.name.endsWith("Mask")))
        powerEstimate *= 1.2;
    } else if (this.specialItems[species.name]) {
      const item = this.dex.items.get(this.specialItems[species.name]);
      if (item.onBasePower && species.types.includes(moveType))
        powerEstimate *= 1.2;
      if (item.id === "lightball")
        powerEstimate *= 2;
    }
    const hasSpecialSetup = movesSoFar.some((m) => m.boosts?.spa || m.self?.boosts?.spa || m.selfBoost?.boosts?.spa);
    const hasPhysicalSetup = movesSoFar.some((m) => m.boosts?.atk || m.self?.boosts?.atk || m.selfBoost?.boosts?.atk);
    if (move.category === "Physical" && !["bodypress", "foulplay"].includes(move.id) && hasSpecialSetup) {
      powerEstimate *= 0.7;
    }
    if (move.category === "Special" && hasPhysicalSetup)
      powerEstimate *= 0.7;
    const abilityBonus = ((import_cg_team_data.ABILITY_MOVE_BONUSES[ability] || {})[move.id] || 1) * ((import_cg_team_data.ABILITY_MOVE_TYPE_BONUSES[ability] || {})[moveType] || 1);
    let weight = powerEstimate * abilityBonus;
    if (move.id in import_cg_team_data.HARDCODED_MOVE_WEIGHTS)
      weight *= import_cg_team_data.HARDCODED_MOVE_WEIGHTS[move.id];
    if (!this.specialItems[species.name] && !species.requiredItem) {
      if (move.id === "acrobatics")
        weight *= 1.75;
      if (move.id === "facade")
        weight *= 1.5;
    }
    if (move.priority > 0 && move.id !== "upperhand")
      weight *= Math.max(105 - adjustedStats.spe, 0) / 105 * 0.5 + 1;
    if (move.priority < 0 || move.id === "upperhand")
      weight *= Math.min(1 / adjustedStats.spe * 25, 1);
    if (move.flags.charge || move.flags.recharge && ability !== "Truant")
      weight *= 0.5;
    if (move.flags.contact) {
      if (ability === "Tough Claws")
        weight *= 1.3;
      if (ability === "Unseen Fist")
        weight *= 1.1;
      if (ability === "Poison Touch")
        weight *= TeamGenerator.statusWeight("psn", 1 - Math.pow(0.7, numberOfHits));
    }
    if (move.flags.bite && ability === "Strong Jaw")
      weight *= 1.5;
    if (move.flags.bypasssub)
      weight *= 1.05;
    if (move.flags.pulse && ability === "Mega Launcher")
      weight *= 1.5;
    if (move.flags.punch && ability === "Iron Fist")
      weight *= 1.2;
    if (!move.flags.protect)
      weight *= 1.05;
    if (move.flags.slicing && ability === "Sharpness")
      weight *= 1.5;
    if (move.flags.sound && ability === "Punk Rock")
      weight *= 1.3;
    weight *= this.boostWeight(move, movesSoFar, species, ability, level);
    const secondaryChance = Math.min((move.secondary?.chance || 100) * (ability === "Serene Grace" ? 2 : 1) / 100, 100);
    if (move.secondary || move.secondaries) {
      if (ability === "Sheer Force") {
        weight *= 1.3;
      } else {
        const secondaries = move.secondaries || [move.secondary];
        for (const secondary of secondaries) {
          if (secondary.status) {
            weight *= TeamGenerator.statusWeight(secondary.status, secondaryChance, slownessRating);
            if (ability === "Poison Puppeteer" && ["psn", "tox"].includes(secondary.status)) {
              weight *= TeamGenerator.statusWeight("confusion", secondaryChance);
            }
          }
          if (secondary.volatileStatus) {
            weight *= TeamGenerator.statusWeight(secondary.volatileStatus, secondaryChance, slownessRating);
          }
        }
      }
    }
    if (ability === "Toxic Chain")
      weight *= TeamGenerator.statusWeight("tox", 1 - Math.pow(0.7, numberOfHits));
    if (move.id === "lashout")
      weight *= 1 + 0.2 * slownessRating;
    if (move.id === "burningjealousy")
      weight *= TeamGenerator.statusWeight("brn", 0.2 * slownessRating);
    if (move.id === "alluringvoice")
      weight *= TeamGenerator.statusWeight("confusion", 0.2 * slownessRating);
    if (move.self?.volatileStatus)
      weight *= 0.8;
    if (movesSoFar.some((m) => m.category !== "Status" && m.type === moveType && m.basePower >= 60))
      weight *= 0.3;
    if (move.selfdestruct)
      weight *= 0.3;
    if (move.recoil && ability !== "Rock Head" && ability !== "Magic Guard") {
      weight *= 1 - move.recoil[0] / move.recoil[1];
      if (ability === "Reckless")
        weight *= 1.2;
    }
    if (move.hasCrashDamage && ability !== "Magic Guard") {
      weight *= 1 - 0.75 * (1.2 - accuracy);
      if (ability === "Reckless")
        weight *= 1.2;
    }
    if (move.mindBlownRecoil)
      weight *= 0.25;
    if (move.flags["futuremove"])
      weight *= 0.3;
    let critRate = move.willCrit ? 4 : move.critRatio || 1;
    if (ability === "Super Luck")
      critRate++;
    if (movesSoFar.some((m) => m.id === "focusenergy")) {
      critRate += 2;
      weight *= 0.9;
    }
    if (critRate > 4)
      critRate = 4;
    weight *= 1 + [0, 1 / 24, 1 / 8, 1 / 2, 1][critRate] * (ability === "Sniper" ? 1 : 0.5);
    if (["rapidspin", "mortalspin"].includes(move.id)) {
      weight *= 1 + 20 * Math.pow(0.25, teamStats.hazardRemovers);
      teamStats.hazardRemovers++;
    }
    if (move.drain) {
      const drainedFraction = move.drain[0] / move.drain[1];
      weight *= 1 + drainedFraction * 0.5;
    }
    if (move.id === "terablast" && (species.baseSpecies === "Oricorio" || species.forceTeraType))
      weight *= 0.5;
    return weight;
  }
  /**
   * @returns The effective type of moves with variable types such as Judgment
   */
  static moveType(move, species) {
    switch (move.id) {
      case "judgment":
      case "revelationdance":
        return species.types[0];
      case "ivycudgel":
        if (species.types.length > 1)
          return species.types[1];
    }
    return move.type;
  }
  /**
   * @returns A multiplier to a move weighting based on the status it inflicts.
   */
  static statusWeight(status, chance = 1, slownessRating) {
    if (chance !== 1)
      return 1 + (TeamGenerator.statusWeight(status) - 1) * chance;
    switch (status) {
      case "brn":
        return 2;
      case "frz":
        return 5;
      case "par":
        return slownessRating && slownessRating > 0.25 ? 2 + slownessRating : 2;
      case "psn":
        return 1.75;
      case "tox":
        return 4;
      case "slp":
        return 4;
      case "confusion":
        return 1.5;
      case "healblock":
        return 1.75;
      case "flinch":
        return slownessRating ? slownessRating * 3 : 1;
      case "saltcure":
        return 2;
      case "sparklingaria":
        return 0.95;
      case "syrupbomb":
        return 1.5;
    }
    return 1;
  }
  /**
   * @returns A multiplier to a move weighting based on the boosts it produces for the user.
   */
  boostWeight(move, movesSoFar, species, ability, level) {
    const physicalIsRelevant = move.category === "Physical" || movesSoFar.some((m) => m.category === "Physical" && !m.overrideOffensiveStat && !m.overrideOffensivePokemon);
    const specialIsRelevant = move.category === "Special" || movesSoFar.some((m) => m.category === "Special");
    const adjustedStats = {
      hp: species.baseStats.hp * level / 100 + level,
      atk: species.baseStats.atk * level * level / 1e4,
      def: species.baseStats.def * level / 100,
      spa: species.baseStats.spa * level * level / 1e4,
      spd: species.baseStats.spd * level / 100,
      spe: species.baseStats.spe * level / 100
    };
    let weight = 0;
    const accuracy = move.accuracy === true ? 100 : move.accuracy / 100;
    const secondaryChance = move.secondary && ability !== "Sheer Force" ? Math.min((move.secondary.chance || 100) * (ability === "Serene Grace" ? 2 : 1) / 100, 100) * accuracy : 0;
    const abilityMod = ability === "Simple" ? 2 : ability === "Contrary" ? -1 : 1;
    const bodyPressMod = movesSoFar.some((m) => m.id === "bodyPress") ? 2 : 1;
    const electroBallMod = movesSoFar.some((m) => m.id === "electroball") ? 2 : 1;
    for (const { chance, boosts } of [
      { chance: 1, boosts: move.boosts },
      { chance: 1, boosts: move.self?.boosts },
      { chance: 1, boosts: move.selfBoost?.boosts },
      {
        chance: secondaryChance,
        boosts: move.secondary?.self?.boosts
      }
    ]) {
      if (!boosts || chance === 0)
        continue;
      const statusMod = move.category === "Status" ? 1 : 0.5;
      if (boosts.atk && physicalIsRelevant)
        weight += chance * boosts.atk * abilityMod * 2 * statusMod;
      if (boosts.spa && specialIsRelevant)
        weight += chance * boosts.spa * abilityMod * 2 * statusMod;
      if (boosts.def) {
        weight += chance * boosts.def * abilityMod * bodyPressMod * (adjustedStats.def > 60 ? 0.5 : 1) * statusMod;
      }
      if (boosts.spd)
        weight += chance * boosts.spd * abilityMod * (adjustedStats.spd > 60 ? 0.5 : 1) * statusMod;
      if (boosts.spe) {
        weight += chance * boosts.spe * abilityMod * electroBallMod * (adjustedStats.spe > 95 ? 0.5 : 1) * statusMod;
      }
    }
    return weight >= 0 ? 1 + weight : 1 / (1 - weight);
  }
  /**
   * @returns A weight for a move based on how much it will reduce the opponent's stats.
   */
  opponentDebuffWeight(move) {
    if (!["allAdjacentFoes", "allAdjacent", "foeSide", "normal"].includes(move.target))
      return 1;
    let averageNumberOfDebuffs = 0;
    for (const { chance, boosts } of [
      { chance: 1, boosts: move.boosts },
      {
        chance: move.secondary ? (move.secondary.chance || 100) / 100 : 0,
        boosts: move.secondary?.boosts
      }
    ]) {
      if (!boosts || chance === 0)
        continue;
      const numBoosts = Object.values(boosts).filter((x) => x < 0).length;
      averageNumberOfDebuffs += chance * numBoosts;
    }
    return 1 + 0.5 * averageNumberOfDebuffs;
  }
  /**
   * @returns A weight for an item.
   */
  getItemWeight(item, teamStats, species, moves, ability, level) {
    const adjustedStats = {
      hp: species.baseStats.hp * level / 100 + level,
      atk: species.baseStats.atk * level * level / 1e4,
      def: species.baseStats.def * level / 100,
      spa: species.baseStats.spa * level * level / 1e4,
      spd: species.baseStats.spd * level / 100,
      spe: species.baseStats.spe * level / 100
    };
    let weight;
    switch (item.id) {
      case "choiceband":
        return moves.every((x) => x.category === "Physical") ? 50 : 0;
      case "choicespecs":
        return moves.every((x) => x.category === "Special") ? 50 : 0;
      case "choicescarf":
        if (moves.some((x) => x.category === "Status" || x.secondary?.self?.boosts?.spe))
          return 0;
        if (adjustedStats.spe > 50 && adjustedStats.spe < 120)
          return 50;
        return 10;
      case "lifeorb":
        return moves.filter((x) => x.category !== "Status" && !x.damage && !x.damageCallback).length * 8;
      case "focussash":
        if (ability === "Sturdy")
          return 0;
        if (adjustedStats.hp < 65 && adjustedStats.def < 65 && adjustedStats.spd < 65)
          return 35;
        return 10;
      case "heavydutyboots":
        switch (this.dex.getEffectiveness("Rock", species)) {
          case 1:
            return 30;
          case 0:
            return 10;
        }
        return 5;
      case "assaultvest":
        if (moves.some((x) => x.category === "Status"))
          return 0;
        return 30;
      case "scopelens":
        const attacks = moves.filter((x) => x.category !== "Status" && !x.damage && !x.damageCallback && !x.willCrit);
        if (moves.some((m) => m.id === "focusenergy")) {
          if (ability === "Super Luck")
            return 0;
          return attacks.length * (ability === "Sniper" ? 16 : 12);
        } else if (attacks.filter((x) => (x.critRatio || 1) > 1).length || ability === "Super Luck") {
          return attacks.reduce((total, x) => {
            let ratio = ability === "Super Luck" ? 2 : 1;
            if ((x.critRatio || 1) > 1)
              ratio++;
            return total + [0, 3, 6, 12][ratio] * (ability === "Sniper" ? 4 / 3 : 1);
          }, 0);
        }
        return 0;
      case "eviolite":
        return species.nfe || species.id === "dipplin" ? 100 : 0;
      case "flameorb":
        weight = ability === "Guts" && !species.types.includes("Fire") ? 30 : 0;
        if (moves.some((m) => m.id === "facade"))
          weight *= 2;
        return weight;
      case "toxicorb":
        if (species.types.includes("Poison"))
          return 0;
        weight = 0;
        if (ability === "Poison Heal")
          weight += 25;
        if (moves.some((m) => m.id === "facade"))
          weight += 25;
        return weight;
      case "leftovers":
        return moves.some((m) => m.stallingMove) ? 40 : 20;
      case "blacksludge":
        return species.types.includes("Poison") ? moves.some((m) => m.stallingMove) ? 20 : 10 : 0;
      case "sitrusberry":
      case "magoberry":
        return 20;
      case "throatspray":
        if (moves.some((m) => m.flags.sound) && moves.some((m) => m.category === "Special"))
          return 30;
        return 0;
      default:
        return 0;
    }
  }
  /**
   * @returns The level a Pokémon should be.
   */
  static getLevel(species) {
    if (levelOverride[species.id])
      return levelOverride[species.id];
    switch (species.tier) {
      case "Uber":
        return 70;
      case "OU":
      case "Unreleased":
        return 80;
      case "UU":
        return 90;
      case "LC":
      case "NFE":
        return 100;
    }
    return 100;
  }
  /**
   * Picks a choice from `choices` based on the weights in `weights`.
   * `weights` must be the same length as `choices`.
   */
  weightedRandomPick(choices, weights, options) {
    if (!choices.length)
      throw new Error(`Can't pick from an empty list`);
    if (choices.length !== weights.length)
      throw new Error(`Choices and weights must be the same length`);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let randomWeight = this.prng.next(0, totalWeight);
    for (let i = 0; i < choices.length; i++) {
      randomWeight -= weights[i];
      if (randomWeight < 0) {
        const choice = choices[i];
        if (options?.remove)
          choices.splice(i, 1);
        return choice;
      }
    }
    if (options?.remove && choices.length)
      return choices.pop();
    return choices[choices.length - 1];
  }
  setSeed(seed) {
    this.prng.seed = seed;
  }
}
//# sourceMappingURL=cg-teams.js.map
