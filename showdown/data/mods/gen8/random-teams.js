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
  MoveCounter: () => MoveCounter,
  RandomGen8Teams: () => RandomGen8Teams,
  default: () => random_teams_default
});
module.exports = __toCommonJS(random_teams_exports);
var import_dex = require("../../../sim/dex");
var import_lib = require("../../../lib");
var import_prng = require("../../../sim/prng");
var import_tags = require("./../../tags");
class MoveCounter extends import_lib.Utils.Multiset {
  constructor() {
    super();
    this.damagingMoves = /* @__PURE__ */ new Set();
    this.setupType = "";
  }
  get(key) {
    return super.get(key) || 0;
  }
}
const RECOVERY_MOVES = [
  "healorder",
  "milkdrink",
  "moonlight",
  "morningsun",
  "recover",
  "roost",
  "shoreup",
  "slackoff",
  "softboiled",
  "strengthsap",
  "synthesis"
];
const CONTRARY_MOVES = [
  "closecombat",
  "leafstorm",
  "overheat",
  "superpower",
  "vcreate"
];
const PHYSICAL_SETUP = [
  "bellydrum",
  "bulkup",
  "coil",
  "curse",
  "dragondance",
  "honeclaws",
  "howl",
  "meditate",
  "poweruppunch",
  "screech",
  "swordsdance"
];
const SPECIAL_SETUP = [
  "calmmind",
  "chargebeam",
  "geomancy",
  "nastyplot",
  "quiverdance",
  "tailglow"
];
const MIXED_SETUP = [
  "clangoroussoul",
  "growth",
  "happyhour",
  "holdhands",
  "noretreat",
  "shellsmash",
  "workup"
];
const SPEED_SETUP = [
  "agility",
  "autotomize",
  "flamecharge",
  "rockpolish"
];
const NO_STAB = [
  "accelerock",
  "aquajet",
  "beakblast",
  "bounce",
  "breakingswipe",
  "chatter",
  "clearsmog",
  "dragontail",
  "eruption",
  "explosion",
  "fakeout",
  "firstimpression",
  "flamecharge",
  "flipturn",
  "iceshard",
  "icywind",
  "incinerate",
  "machpunch",
  "meteorbeam",
  "pluck",
  "pursuit",
  "quickattack",
  "reversal",
  "selfdestruct",
  "skydrop",
  "snarl",
  "suckerpunch",
  "uturn",
  "watershuriken",
  "vacuumwave",
  "voltswitch",
  "waterspout"
];
const HAZARDS = [
  "spikes",
  "stealthrock",
  "stickyweb",
  "toxicspikes"
];
function sereneGraceBenefits(move) {
  return move.secondary?.chance && move.secondary.chance >= 20 && move.secondary.chance < 100;
}
class RandomGen8Teams {
  constructor(format, prng) {
    this.randomData = require("./random-data.json");
    this.randomCAP1v1Sets = require("./cap-1v1-sets.json");
    this.randomFactorySets = require("./factory-sets.json");
    this.randomBSSFactorySets = require("./bss-factory-sets.json");
    format = import_dex.Dex.formats.get(format);
    this.dex = import_dex.Dex.forFormat(format);
    this.gen = this.dex.gen;
    this.noStab = NO_STAB;
    this.priorityPokemon = [];
    const ruleTable = import_dex.Dex.formats.getRuleTable(format);
    this.maxTeamSize = ruleTable.maxTeamSize;
    this.adjustLevel = ruleTable.adjustLevel;
    this.maxMoveCount = ruleTable.maxMoveCount;
    const forceMonotype = ruleTable.valueRules.get("forcemonotype");
    this.forceMonotype = forceMonotype && this.dex.types.get(forceMonotype).exists ? this.dex.types.get(forceMonotype).name : void 0;
    this.factoryTier = "";
    this.format = format;
    this.prng = prng && !Array.isArray(prng) ? prng : new import_prng.PRNG(prng);
    this.moveEnforcementCheckers = {
      screens: (movePool, moves, abilities, types, counter, species, teamDetails) => {
        if (teamDetails.screens)
          return false;
        return moves.has("lightscreen") && movePool.includes("reflect") || moves.has("reflect") && movePool.includes("lightscreen");
      },
      recovery: (movePool, moves, abilities, types, counter, species, teamDetails) => !!counter.get("Status") && !counter.setupType && ["morningsun", "recover", "roost", "slackoff", "softboiled"].some((moveid) => movePool.includes(moveid)) && ["healingwish", "switcheroo", "trick", "trickroom"].every((moveid) => !moves.has(moveid)),
      misc: (movePool, moves, abilities, types, counter, species, teamDetails) => {
        if (movePool.includes("milkdrink") || movePool.includes("quiverdance"))
          return true;
        return movePool.includes("stickyweb") && !counter.setupType && !teamDetails.stickyWeb;
      },
      lead: (movePool, moves, abilities, types, counter) => movePool.includes("stealthrock") && !!counter.get("Status") && !counter.setupType && !counter.get("speedsetup") && !moves.has("substitute"),
      leechseed: (movePool, moves) => !moves.has("calmmind") && ["protect", "substitute", "spikyshield"].some((m) => movePool.includes(m)),
      Bug: (movePool) => movePool.includes("megahorn"),
      Dark: (movePool, moves, abilities, types, counter) => {
        if (!counter.get("Dark"))
          return true;
        return moves.has("suckerpunch") && (movePool.includes("knockoff") || movePool.includes("wickedblow"));
      },
      Dragon: (movePool, moves, abilities, types, counter) => !counter.get("Dragon") && !moves.has("dragonascent") && !moves.has("substitute") && !(moves.has("rest") && moves.has("sleeptalk")),
      Electric: (movePool, moves, abilities, types, counter) => !counter.get("Electric") || movePool.includes("thunder"),
      Fairy: (movePool, moves, abilities, types, counter) => !counter.get("Fairy") && ["dazzlinggleam", "moonblast", "fleurcannon", "playrough", "strangesteam"].some((moveid) => movePool.includes(moveid)),
      Fighting: (movePool, moves, abilities, types, counter) => !counter.get("Fighting") || !counter.get("stab"),
      Fire: (movePool, moves, abilities, types, counter, species) => {
        const enteiException = moves.has("extremespeed") && species.id === "entei";
        return !moves.has("bellydrum") && (!counter.get("Fire") || !enteiException && movePool.includes("flareblitz"));
      },
      Flying: (movePool, moves, abilities, types, counter) => !counter.get("Flying") && !types.has("Dragon") && [
        "airslash",
        "bravebird",
        "dualwingbeat",
        "oblivionwing"
      ].some((moveid) => movePool.includes(moveid)),
      Ghost: (movePool, moves, abilities, types, counter) => {
        if (moves.has("nightshade"))
          return false;
        if (!counter.get("Ghost") && !types.has("Dark"))
          return true;
        if (movePool.includes("poltergeist"))
          return true;
        return movePool.includes("spectralthief") && !counter.get("Dark");
      },
      Grass: (movePool, moves, abilities, types, counter, species) => {
        if (movePool.includes("leafstorm") || movePool.includes("grassyglide"))
          return true;
        return !counter.get("Grass") && species.baseStats.atk >= 100;
      },
      Ground: (movePool, moves, abilities, types, counter) => !counter.get("Ground"),
      Ice: (movePool, moves, abilities, types, counter) => {
        if (!counter.get("Ice"))
          return true;
        if (movePool.includes("iciclecrash"))
          return true;
        return abilities.has("Snow Warning") && movePool.includes("blizzard");
      },
      Normal: (movePool, moves, abilities, types, counter) => abilities.has("Guts") && movePool.includes("facade") || abilities.has("Pixilate") && !counter.get("Normal"),
      Poison: (movePool, moves, abilities, types, counter) => {
        if (counter.get("Poison"))
          return false;
        return types.has("Ground") || types.has("Psychic") || types.has("Grass") || !!counter.setupType || movePool.includes("gunkshot");
      },
      Psychic: (movePool, moves, abilities, types, counter) => {
        if (counter.get("Psychic"))
          return false;
        if (types.has("Ghost") || types.has("Steel"))
          return false;
        return abilities.has("Psychic Surge") || !!counter.setupType || movePool.includes("psychicfangs");
      },
      Rock: (movePool, moves, abilities, types, counter, species) => !counter.get("Rock") && species.baseStats.atk >= 80,
      Steel: (movePool, moves, abilities, types, counter, species) => {
        if (species.baseStats.atk < 95)
          return false;
        if (movePool.includes("meteormash"))
          return true;
        return !counter.get("Steel");
      },
      Water: (movePool, moves, abilities, types, counter, species) => {
        if (!counter.get("Water") && !moves.has("hypervoice"))
          return true;
        if (["hypervoice", "liquidation", "surgingstrikes"].some((m) => movePool.includes(m)))
          return true;
        return abilities.has("Huge Power") && movePool.includes("aquajet");
      }
    };
  }
  setSeed(prng) {
    this.prng = prng && !Array.isArray(prng) ? prng : new import_prng.PRNG(prng);
  }
  getTeam(options) {
    const generatorName = typeof this.format.team === "string" && this.format.team.startsWith("random") ? this.format.team + "Team" : "";
    return this[generatorName || "randomTeam"](options);
  }
  randomChance(numerator, denominator) {
    return this.prng.randomChance(numerator, denominator);
  }
  sample(items) {
    return this.prng.sample(items);
  }
  sampleIfArray(item) {
    if (Array.isArray(item)) {
      return this.sample(item);
    }
    return item;
  }
  random(m, n) {
    return this.prng.next(m, n);
  }
  /**
   * Remove an element from an unsorted array significantly faster
   * than .splice
   */
  fastPop(list, index) {
    const length = list.length;
    if (index < 0 || index >= list.length) {
      throw new Error(`Index ${index} out of bounds for given array`);
    }
    const element = list[index];
    list[index] = list[length - 1];
    list.pop();
    return element;
  }
  /**
   * Remove a random element from an unsorted array and return it.
   * Uses the battle's RNG if in a battle.
   */
  sampleNoReplace(list) {
    const length = list.length;
    if (length === 0)
      return null;
    const index = this.random(length);
    return this.fastPop(list, index);
  }
  /**
   * Removes n random elements from an unsorted array and returns them.
   * If n is less than the array's length, randomly removes and returns all the elements
   * in the array (so the returned array could have length < n).
   */
  multipleSamplesNoReplace(list, n) {
    const samples = [];
    while (samples.length < n && list.length) {
      samples.push(this.sampleNoReplace(list));
    }
    return samples;
  }
  /**
   * Check if user has directly tried to ban/unban/restrict things in a custom battle.
   * Doesn't count bans nested inside other formats/rules.
   */
  hasDirectCustomBanlistChanges() {
    if (!this.format.customRules)
      return false;
    for (const rule of this.format.customRules) {
      for (const banlistOperator of ["-", "+", "*"]) {
        if (rule.startsWith(banlistOperator))
          return true;
      }
    }
    return false;
  }
  /**
   * Inform user when custom bans are unsupported in a team generator.
   */
  enforceNoDirectCustomBanlistChanges() {
    if (this.hasDirectCustomBanlistChanges()) {
      throw new Error(`Custom bans are not currently supported in ${this.format.name}.`);
    }
  }
  /**
   * Inform user when complex bans are unsupported in a team generator.
   */
  enforceNoDirectComplexBans() {
    if (!this.format.customRules)
      return false;
    for (const rule of this.format.customRules) {
      if (rule.includes("+") && !rule.startsWith("+")) {
        throw new Error(`Complex bans are not currently supported in ${this.format.name}.`);
      }
    }
  }
  /**
   * Validate set element pool size is sufficient to support size requirements after simple bans.
   */
  enforceCustomPoolSizeNoComplexBans(effectTypeName, basicEffectPool, requiredCount, requiredCountExplanation) {
    if (basicEffectPool.length >= requiredCount)
      return;
    throw new Error(`Legal ${effectTypeName} count is insufficient to support ${requiredCountExplanation} (${basicEffectPool.length} / ${requiredCount}).`);
  }
  unrejectableMovesInSingles(move) {
    return (move.category !== "Status" || !move.flags.heal) && ![
      "facade",
      "leechseed",
      "lightscreen",
      "reflect",
      "sleeptalk",
      "spore",
      "substitute",
      "switcheroo",
      "teleport",
      "toxic",
      "trick"
    ].includes(move.id);
  }
  unrejectableMovesInDoubles(move) {
    return move.id !== "bodypress";
  }
  randomCCTeam() {
    this.enforceNoDirectCustomBanlistChanges();
    const dex = this.dex;
    const team = [];
    const natures = this.dex.natures.all();
    const items = this.dex.items.all();
    const randomN = this.randomNPokemon(this.maxTeamSize, this.forceMonotype, void 0, void 0, true);
    for (let forme of randomN) {
      let species = dex.species.get(forme);
      if (species.isNonstandard)
        species = dex.species.get(species.baseSpecies);
      let item = "";
      if (this.gen >= 2) {
        do {
          item = this.sample(items).name;
        } while (this.dex.items.get(item).gen > this.gen || this.dex.items.get(item).isNonstandard);
      }
      if (species.battleOnly) {
        if (typeof species.battleOnly === "string") {
          species = dex.species.get(species.battleOnly);
        } else {
          species = dex.species.get(this.sample(species.battleOnly));
        }
        forme = species.name;
      } else if (species.requiredItems && !species.requiredItems.some((req) => (0, import_dex.toID)(req) === item)) {
        if (!species.changesFrom)
          throw new Error(`${species.name} needs a changesFrom value`);
        species = dex.species.get(species.changesFrom);
        forme = species.name;
      }
      let itemData = this.dex.items.get(item);
      if (itemData.forcedForme && forme === this.dex.species.get(itemData.forcedForme).baseSpecies) {
        do {
          itemData = this.sample(items);
          item = itemData.name;
        } while (itemData.gen > this.gen || itemData.isNonstandard || itemData.forcedForme && forme === this.dex.species.get(itemData.forcedForme).baseSpecies);
      }
      const abilities = Object.values(species.abilities).filter((a) => this.dex.abilities.get(a).gen <= this.gen);
      const ability = this.gen <= 2 ? "No Ability" : this.sample(abilities);
      let pool = ["struggle"];
      if (forme === "Smeargle") {
        pool = this.dex.moves.all().filter((move) => !(move.isNonstandard || move.isZ || move.isMax || move.realMove)).map((m) => m.id);
      } else {
        pool = [...this.dex.species.getMovePool(species.id)];
      }
      const moves = this.multipleSamplesNoReplace(pool, this.maxMoveCount);
      const evs = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
      const s = ["hp", "atk", "def", "spa", "spd", "spe"];
      let evpool = 510;
      do {
        const x = this.sample(s);
        const y = this.random(Math.min(256 - evs[x], evpool + 1));
        evs[x] += y;
        evpool -= y;
      } while (evpool > 0);
      const ivs = {
        hp: this.random(32),
        atk: this.random(32),
        def: this.random(32),
        spa: this.random(32),
        spd: this.random(32),
        spe: this.random(32)
      };
      const nature = this.sample(natures).name;
      const mbstmin = 1307;
      let stats = species.baseStats;
      if (species.baseSpecies === "Wishiwashi")
        stats = import_dex.Dex.species.get("wishiwashischool").baseStats;
      let mbst = stats["hp"] * 2 + 31 + 21 + 100 + 10;
      mbst += stats["atk"] * 2 + 31 + 21 + 100 + 5;
      mbst += stats["def"] * 2 + 31 + 21 + 100 + 5;
      mbst += stats["spa"] * 2 + 31 + 21 + 100 + 5;
      mbst += stats["spd"] * 2 + 31 + 21 + 100 + 5;
      mbst += stats["spe"] * 2 + 31 + 21 + 100 + 5;
      let level;
      if (this.adjustLevel) {
        level = this.adjustLevel;
      } else {
        level = Math.floor(100 * mbstmin / mbst);
        while (level < 100) {
          mbst = Math.floor((stats["hp"] * 2 + 31 + 21 + 100) * level / 100 + 10);
          mbst += Math.floor(((stats["atk"] * 2 + 31 + 21 + 100) * level / 100 + 5) * level / 100);
          mbst += Math.floor((stats["def"] * 2 + 31 + 21 + 100) * level / 100 + 5);
          mbst += Math.floor(((stats["spa"] * 2 + 31 + 21 + 100) * level / 100 + 5) * level / 100);
          mbst += Math.floor((stats["spd"] * 2 + 31 + 21 + 100) * level / 100 + 5);
          mbst += Math.floor((stats["spe"] * 2 + 31 + 21 + 100) * level / 100 + 5);
          if (mbst >= mbstmin)
            break;
          level++;
        }
      }
      const happiness = this.random(256);
      const shiny = this.randomChance(1, 1024);
      const set = {
        name: species.baseSpecies,
        species: species.name,
        gender: species.gender,
        item,
        ability,
        moves,
        evs,
        ivs,
        nature,
        level,
        happiness,
        shiny
      };
      if (this.gen === 9) {
        set.teraType = this.sample(this.dex.types.all()).name;
      }
      team.push(set);
    }
    return team;
  }
  randomNPokemon(n, requiredType, minSourceGen, ruleTable, requireMoves = false) {
    if (requiredType && !this.dex.types.get(requiredType).exists) {
      throw new Error(`"${requiredType}" is not a valid type.`);
    }
    const isNotCustom = !ruleTable;
    const pool = [];
    let speciesPool = [];
    if (isNotCustom) {
      speciesPool = [...this.dex.species.all()];
      for (const species of speciesPool) {
        if (species.isNonstandard && species.isNonstandard !== "Unobtainable")
          continue;
        if (requireMoves) {
          const hasMovesInCurrentGen = this.dex.species.getMovePool(species.id).size;
          if (!hasMovesInCurrentGen)
            continue;
        }
        if (requiredType && !species.types.includes(requiredType))
          continue;
        if (minSourceGen && species.gen < minSourceGen)
          continue;
        const num = species.num;
        if (num <= 0 || pool.includes(num))
          continue;
        pool.push(num);
      }
    } else {
      const EXISTENCE_TAG = ["past", "future", "lgpe", "unobtainable", "cap", "custom", "nonexistent"];
      const nonexistentBanReason = ruleTable.check("nonexistent");
      for (const species of this.dex.species.all()) {
        if (requiredType && !species.types.includes(requiredType))
          continue;
        let banReason = ruleTable.check("pokemon:" + species.id);
        if (banReason)
          continue;
        if (banReason !== "") {
          if (species.isMega && ruleTable.check("pokemontag:mega"))
            continue;
          banReason = ruleTable.check("basepokemon:" + (0, import_dex.toID)(species.baseSpecies));
          if (banReason)
            continue;
          if (banReason !== "" || this.dex.species.get(species.baseSpecies).isNonstandard !== species.isNonstandard) {
            const nonexistentCheck = import_tags.Tags.nonexistent.genericFilter(species) && nonexistentBanReason;
            let tagWhitelisted = false;
            let tagBlacklisted = false;
            for (const ruleid of ruleTable.tagRules) {
              if (ruleid.startsWith("*"))
                continue;
              const tagid = ruleid.slice(12);
              const tag = import_tags.Tags[tagid];
              if ((tag.speciesFilter || tag.genericFilter)(species)) {
                const existenceTag = EXISTENCE_TAG.includes(tagid);
                if (ruleid.startsWith("+")) {
                  if (!existenceTag && nonexistentCheck)
                    continue;
                  tagWhitelisted = true;
                  break;
                }
                tagBlacklisted = true;
                break;
              }
            }
            if (tagBlacklisted)
              continue;
            if (!tagWhitelisted) {
              if (ruleTable.check("pokemontag:allpokemon"))
                continue;
            }
          }
        }
        speciesPool.push(species);
        const num = species.num;
        if (pool.includes(num))
          continue;
        pool.push(num);
      }
    }
    const hasDexNumber = {};
    for (let i = 0; i < n; i++) {
      const num = this.sampleNoReplace(pool);
      hasDexNumber[num] = i;
    }
    const formes = [];
    for (const species of speciesPool) {
      if (!(species.num in hasDexNumber))
        continue;
      if (isNotCustom && (species.gen > this.gen || species.isNonstandard && species.isNonstandard !== "Unobtainable"))
        continue;
      if (requiredType && !species.types.includes(requiredType))
        continue;
      if (!formes[hasDexNumber[species.num]])
        formes[hasDexNumber[species.num]] = [];
      formes[hasDexNumber[species.num]].push(species.name);
    }
    if (formes.length < n) {
      throw new Error(`Legal Pokemon forme count insufficient to support Max Team Size: (${formes.length} / ${n}).`);
    }
    const nPokemon = [];
    for (let i = 0; i < n; i++) {
      if (!formes[i].length) {
        throw new Error(`Invalid pokemon gen ${this.gen}: ${JSON.stringify(formes)} numbers ${JSON.stringify(hasDexNumber)}`);
      }
      nPokemon.push(this.sample(formes[i]));
    }
    return nPokemon;
  }
  randomHCTeam() {
    const hasCustomBans = this.hasDirectCustomBanlistChanges();
    const ruleTable = this.dex.formats.getRuleTable(this.format);
    const hasNonexistentBan = hasCustomBans && ruleTable.check("nonexistent");
    const hasNonexistentWhitelist = hasCustomBans && hasNonexistentBan === "";
    if (hasCustomBans) {
      this.enforceNoDirectComplexBans();
    }
    const doItemsExist = this.gen > 1;
    let itemPool = [];
    if (doItemsExist) {
      if (!hasCustomBans) {
        itemPool = [...this.dex.items.all()].filter((item) => item.gen <= this.gen && !item.isNonstandard);
      } else {
        const hasAllItemsBan = ruleTable.check("pokemontag:allitems");
        for (const item of this.dex.items.all()) {
          let banReason = ruleTable.check("item:" + item.id);
          if (banReason)
            continue;
          if (banReason !== "" && item.id) {
            if (hasAllItemsBan)
              continue;
            if (item.isNonstandard) {
              banReason = ruleTable.check("pokemontag:" + (0, import_dex.toID)(item.isNonstandard));
              if (banReason)
                continue;
              if (banReason !== "" && item.isNonstandard !== "Unobtainable") {
                if (hasNonexistentBan)
                  continue;
                if (!hasNonexistentWhitelist)
                  continue;
              }
            }
          }
          itemPool.push(item);
        }
        if (ruleTable.check("item:noitem")) {
          this.enforceCustomPoolSizeNoComplexBans("item", itemPool, this.maxTeamSize, "Max Team Size");
        }
      }
    }
    const doAbilitiesExist = this.gen > 2 && this.dex.currentMod !== "gen7letsgo";
    let abilityPool = [];
    if (doAbilitiesExist) {
      if (!hasCustomBans) {
        abilityPool = [...this.dex.abilities.all()].filter((ability) => ability.gen <= this.gen && !ability.isNonstandard);
      } else {
        const hasAllAbilitiesBan = ruleTable.check("pokemontag:allabilities");
        for (const ability of this.dex.abilities.all()) {
          let banReason = ruleTable.check("ability:" + ability.id);
          if (banReason)
            continue;
          if (banReason !== "") {
            if (hasAllAbilitiesBan)
              continue;
            if (ability.isNonstandard) {
              banReason = ruleTable.check("pokemontag:" + (0, import_dex.toID)(ability.isNonstandard));
              if (banReason)
                continue;
              if (banReason !== "") {
                if (hasNonexistentBan)
                  continue;
                if (!hasNonexistentWhitelist)
                  continue;
              }
            }
          }
          abilityPool.push(ability);
        }
        if (ruleTable.check("ability:noability")) {
          this.enforceCustomPoolSizeNoComplexBans("ability", abilityPool, this.maxTeamSize, "Max Team Size");
        }
      }
    }
    const setMoveCount = ruleTable.maxMoveCount;
    let movePool = [];
    if (!hasCustomBans) {
      movePool = [...this.dex.moves.all()].filter((move) => move.gen <= this.gen && !move.isNonstandard && !move.name.startsWith("Hidden Power "));
    } else {
      const hasAllMovesBan = ruleTable.check("pokemontag:allmoves");
      for (const move of this.dex.moves.all()) {
        if (move.name.startsWith("Hidden Power "))
          continue;
        let banReason = ruleTable.check("move:" + move.id);
        if (banReason)
          continue;
        if (banReason !== "") {
          if (hasAllMovesBan)
            continue;
          if (move.isNonstandard) {
            banReason = ruleTable.check("pokemontag:" + (0, import_dex.toID)(move.isNonstandard));
            if (banReason)
              continue;
            if (banReason !== "" && move.isNonstandard !== "Unobtainable") {
              if (hasNonexistentBan)
                continue;
              if (!hasNonexistentWhitelist)
                continue;
            }
          }
        }
        movePool.push(move);
      }
      this.enforceCustomPoolSizeNoComplexBans("move", movePool, this.maxTeamSize * setMoveCount, "Max Team Size * Max Move Count");
    }
    const doNaturesExist = this.gen > 2;
    let naturePool = [];
    if (doNaturesExist) {
      if (!hasCustomBans) {
        naturePool = [...this.dex.natures.all()];
      } else {
        const hasAllNaturesBan = ruleTable.check("pokemontag:allnatures");
        for (const nature of this.dex.natures.all()) {
          let banReason = ruleTable.check("nature:" + nature.id);
          if (banReason)
            continue;
          if (banReason !== "" && nature.id) {
            if (hasAllNaturesBan)
              continue;
            if (nature.isNonstandard) {
              banReason = ruleTable.check("pokemontag:" + (0, import_dex.toID)(nature.isNonstandard));
              if (banReason)
                continue;
              if (banReason !== "" && nature.isNonstandard !== "Unobtainable") {
                if (hasNonexistentBan)
                  continue;
                if (!hasNonexistentWhitelist)
                  continue;
              }
            }
          }
          naturePool.push(nature);
        }
      }
    }
    const randomN = this.randomNPokemon(
      this.maxTeamSize,
      this.forceMonotype,
      void 0,
      hasCustomBans ? ruleTable : void 0
    );
    const team = [];
    for (const forme of randomN) {
      const species = this.dex.species.get(forme);
      let item = "";
      let itemData;
      if (doItemsExist) {
        itemData = this.sampleNoReplace(itemPool);
        item = itemData?.name;
      }
      let ability = "No Ability";
      let abilityData;
      if (doAbilitiesExist) {
        abilityData = this.sampleNoReplace(abilityPool);
        ability = abilityData?.name;
      }
      const m = [];
      do {
        const move = this.sampleNoReplace(movePool);
        m.push(move.id);
      } while (m.length < setMoveCount);
      const evs = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
      if (this.gen === 6) {
        let evpool = 510;
        do {
          const x = this.sample(import_dex.Dex.stats.ids());
          const y = this.random(Math.min(256 - evs[x], evpool + 1));
          evs[x] += y;
          evpool -= y;
        } while (evpool > 0);
      } else {
        for (const x of import_dex.Dex.stats.ids()) {
          evs[x] = this.random(256);
        }
      }
      const ivs = {
        hp: this.random(32),
        atk: this.random(32),
        def: this.random(32),
        spa: this.random(32),
        spd: this.random(32),
        spe: this.random(32)
      };
      let nature = "";
      if (doNaturesExist && naturePool.length > 0) {
        nature = this.sample(naturePool).name;
      }
      const mbstmin = 1307;
      const stats = species.baseStats;
      let mbst = stats["hp"] * 2 + 31 + 21 + 100 + 10;
      mbst += stats["atk"] * 2 + 31 + 21 + 100 + 5;
      mbst += stats["def"] * 2 + 31 + 21 + 100 + 5;
      mbst += stats["spa"] * 2 + 31 + 21 + 100 + 5;
      mbst += stats["spd"] * 2 + 31 + 21 + 100 + 5;
      mbst += stats["spe"] * 2 + 31 + 21 + 100 + 5;
      let level;
      if (this.adjustLevel) {
        level = this.adjustLevel;
      } else {
        level = Math.floor(100 * mbstmin / mbst);
        while (level < 100) {
          mbst = Math.floor((stats["hp"] * 2 + 31 + 21 + 100) * level / 100 + 10);
          mbst += Math.floor(((stats["atk"] * 2 + 31 + 21 + 100) * level / 100 + 5) * level / 100);
          mbst += Math.floor((stats["def"] * 2 + 31 + 21 + 100) * level / 100 + 5);
          mbst += Math.floor(((stats["spa"] * 2 + 31 + 21 + 100) * level / 100 + 5) * level / 100);
          mbst += Math.floor((stats["spd"] * 2 + 31 + 21 + 100) * level / 100 + 5);
          mbst += Math.floor((stats["spe"] * 2 + 31 + 21 + 100) * level / 100 + 5);
          if (mbst >= mbstmin)
            break;
          level++;
        }
      }
      const happiness = this.random(256);
      const shiny = this.randomChance(1, 1024);
      const set = {
        name: species.baseSpecies,
        species: species.name,
        gender: species.gender,
        item,
        ability,
        moves: m,
        evs,
        ivs,
        nature,
        level,
        happiness,
        shiny
      };
      if (this.gen === 9) {
        set.teraType = this.sample(this.dex.types.all()).name;
      }
      team.push(set);
    }
    return team;
  }
  queryMoves(moves, types, abilities = /* @__PURE__ */ new Set(), movePool = []) {
    const counter = new MoveCounter();
    if (!moves?.size)
      return counter;
    const categories = { Physical: 0, Special: 0, Status: 0 };
    for (const moveid of moves) {
      let move = this.dex.moves.get(moveid);
      if (move.id === "naturepower") {
        if (this.gen === 5)
          move = this.dex.moves.get("earthquake");
      }
      let moveType = move.type;
      if (["judgment", "multiattack", "revelationdance"].includes(moveid))
        moveType = types[0];
      if (move.damage || move.damageCallback) {
        counter.add("damage");
        counter.damagingMoves.add(move);
      } else {
        categories[move.category]++;
      }
      if (moveid === "lowkick" || move.basePower && move.basePower <= 60 && moveid !== "rapidspin") {
        counter.add("technician");
      }
      if (move.multihit && Array.isArray(move.multihit) && move.multihit[1] === 5)
        counter.add("skilllink");
      if (move.recoil || move.hasCrashDamage)
        counter.add("recoil");
      if (move.drain)
        counter.add("drain");
      if (move.basePower > 30 || move.multihit || move.basePowerCallback || moveid === "infestation") {
        counter.add(moveType);
        if (types.includes(moveType)) {
          if (!this.noStab.includes(moveid) && (!moveid.startsWith("hiddenpower") || types.length === 1)) {
            counter.add("stab");
            categories[move.category] += 0.1;
          }
        } else if (moveType === "Normal" && ["Aerilate", "Galvanize", "Pixilate", "Refrigerate"].some((abil) => abilities.has(abil)) || move.priority === 0 && (abilities.has("Libero") || abilities.has("Protean")) && !this.noStab.includes(moveid) || moveType === "Steel" && abilities.has("Steelworker")) {
          counter.add("stab");
        }
        if (move.flags["bite"])
          counter.add("strongjaw");
        if (move.flags["punch"])
          counter.add("ironfist");
        if (move.flags["sound"])
          counter.add("sound");
        if (move.priority !== 0 || moveid === "grassyglide" && abilities.has("Grassy Surge")) {
          counter.add("priority");
        }
        counter.damagingMoves.add(move);
      }
      if (move.secondary) {
        counter.add("sheerforce");
        if (sereneGraceBenefits(move)) {
          counter.add("serenegrace");
        }
      }
      if (move.accuracy && move.accuracy !== true && move.accuracy < 90)
        counter.add("inaccurate");
      if (RECOVERY_MOVES.includes(moveid))
        counter.add("recovery");
      if (CONTRARY_MOVES.includes(moveid))
        counter.add("contrary");
      if (PHYSICAL_SETUP.includes(moveid)) {
        counter.add("physicalsetup");
        counter.setupType = "Physical";
      } else if (SPECIAL_SETUP.includes(moveid)) {
        counter.add("specialsetup");
        counter.setupType = "Special";
      }
      if (MIXED_SETUP.includes(moveid))
        counter.add("mixedsetup");
      if (SPEED_SETUP.includes(moveid))
        counter.add("speedsetup");
      if (HAZARDS.includes(moveid))
        counter.add("hazards");
    }
    for (const moveid of movePool) {
      const move = this.dex.moves.get(moveid);
      if (move.damageCallback)
        continue;
      if (move.category === "Physical")
        counter.add("physicalpool");
      if (move.category === "Special")
        counter.add("specialpool");
    }
    if (counter.get("mixedsetup")) {
      counter.setupType = "Mixed";
    } else if (counter.get("physicalsetup") && counter.get("specialsetup")) {
      const pool = {
        Physical: categories["Physical"] + counter.get("physicalpool"),
        Special: categories["Special"] + counter.get("specialpool")
      };
      if (pool.Physical === pool.Special) {
        if (categories["Physical"] > categories["Special"])
          counter.setupType = "Physical";
        if (categories["Special"] > categories["Physical"])
          counter.setupType = "Special";
      } else {
        counter.setupType = pool.Physical > pool.Special ? "Physical" : "Special";
      }
    } else if (counter.setupType === "Physical") {
      if (categories["Physical"] < 2 && (!counter.get("stab") || !counter.get("physicalpool")) && !(moves.has("rest") && moves.has("sleeptalk")) && !moves.has("batonpass")) {
        counter.setupType = "";
      }
    } else if (counter.setupType === "Special") {
      if (categories["Special"] < 2 && (!counter.get("stab") || !counter.get("specialpool")) && !moves.has("quiverdance") && !(moves.has("rest") && moves.has("sleeptalk")) && !(moves.has("wish") && moves.has("protect")) && !moves.has("batonpass")) {
        counter.setupType = "";
      }
    }
    counter.set("Physical", Math.floor(categories["Physical"]));
    counter.set("Special", Math.floor(categories["Special"]));
    counter.set("Status", categories["Status"]);
    return counter;
  }
  shouldCullMove(move, types, moves, abilities, counter, movePool, teamDetails, species, isLead, isDoubles, isNoDynamax) {
    if (isDoubles && species.baseStats.def >= 140 && movePool.includes("bodypress")) {
      return { cull: true };
    }
    if (species.id === "doublade" && movePool.includes("swordsdance") || species.id === "entei" && movePool.includes("extremespeed") || species.id === "genesectdouse" && movePool.includes("technoblast") || species.id === "golisopod" && movePool.includes("leechlife") && movePool.includes("firstimpression")) {
      return { cull: true };
    }
    const hasRestTalk = moves.has("rest") && moves.has("sleeptalk");
    switch (move.id) {
      case "acrobatics":
      case "junglehealing":
        return { cull: species.id.startsWith("rillaboom") && isLead || !isDoubles && !counter.setupType };
      case "dualwingbeat":
      case "fly":
        return { cull: !types.has(move.type) && !counter.setupType && !!counter.get("Status") };
      case "healbell":
        return { cull: movePool.includes("protect") || movePool.includes("wish") };
      case "fireblast":
        return { cull: abilities.has("Serene Grace") && (!moves.has("trick") || counter.get("Status") > 1) };
      case "firepunch":
        return { cull: movePool.includes("bellydrum") || moves.has("earthquake") && movePool.includes("substitute") };
      case "flamecharge":
        return { cull: movePool.includes("swordsdance") };
      case "hypervoice":
        return { cull: types.has("Electric") && movePool.includes("thunderbolt") };
      case "payback":
      case "psychocut":
        return { cull: !counter.get("Status") || hasRestTalk };
      case "rest":
        const bulkySetup = !moves.has("sleeptalk") && ["bulkup", "calmmind", "coil", "curse"].some((m) => movePool.includes(m));
        return { cull: species.id !== "registeel" && (movePool.includes("sleeptalk") || bulkySetup) };
      case "sleeptalk":
        if (!moves.has("rest"))
          return { cull: true };
        if (movePool.length > 1 && !abilities.has("Contrary")) {
          const rest = movePool.indexOf("rest");
          if (rest >= 0)
            this.fastPop(movePool, rest);
        }
        break;
      case "storedpower":
        return { cull: !counter.setupType };
      case "switcheroo":
      case "trick":
        return { cull: counter.get("Physical") + counter.get("Special") < 3 || moves.has("rapidspin") };
      case "trickroom":
        const webs = !!teamDetails.stickyWeb;
        return {
          cull: isLead || webs || !!counter.get("speedsetup") || counter.damagingMoves.size < 2 || movePool.includes("nastyplot")
        };
      case "zenheadbutt":
        return { cull: movePool.includes("boltstrike") || species.id === "eiscue" && moves.has("substitute") };
      case "bellydrum":
      case "bulkup":
      case "coil":
      case "curse":
      case "dragondance":
      case "honeclaws":
      case "swordsdance":
        if (counter.setupType !== "Physical")
          return { cull: true };
        if (counter.get("Physical") + counter.get("physicalpool") < 2 && !hasRestTalk)
          return { cull: true };
        if (isDoubles && moves.has("firstimpression"))
          return { cull: true };
        if (move.id === "swordsdance" && moves.has("dragondance"))
          return { cull: true };
        return { cull: false, isSetup: true };
      case "calmmind":
      case "nastyplot":
        if (species.id === "togekiss")
          return { cull: false };
        if (counter.setupType !== "Special")
          return { cull: true };
        if (counter.get("Special") + counter.get("specialpool") < 2 && !hasRestTalk && !(moves.has("wish") && moves.has("protect")))
          return { cull: true };
        if (moves.has("healpulse") || move.id === "calmmind" && moves.has("trickroom"))
          return { cull: true };
        return { cull: false, isSetup: true };
      case "quiverdance":
        return { cull: false, isSetup: true };
      case "clangoroussoul":
      case "shellsmash":
      case "workup":
        if (counter.setupType !== "Mixed")
          return { cull: true };
        if (counter.damagingMoves.size + counter.get("physicalpool") + counter.get("specialpool") < 2)
          return { cull: true };
        return { cull: false, isSetup: true };
      case "agility":
      case "autotomize":
      case "rockpolish":
      case "shiftgear":
        if (counter.damagingMoves.size < 2 || moves.has("rest"))
          return { cull: true };
        if (movePool.includes("calmmind") || movePool.includes("nastyplot"))
          return { cull: true };
        return { cull: false, isSetup: !counter.setupType };
      case "coaching":
      case "counter":
      case "reversal":
        return { cull: !!counter.setupType };
      case "bulletpunch":
      case "extremespeed":
      case "rockblast":
        return { cull: !!counter.get("speedsetup") || !isDoubles && moves.has("dragondance") || counter.damagingMoves.size < 2 };
      case "closecombat":
      case "flashcannon":
      case "pollenpuff":
        const substituteCullCondition = moves.has("substitute") && !types.has("Fighting") || moves.has("toxic") && movePool.includes("substitute");
        const preferHJKOverCCCullCondition = move.id === "closecombat" && !counter.setupType && (moves.has("highjumpkick") || movePool.includes("highjumpkick"));
        return { cull: substituteCullCondition || preferHJKOverCCCullCondition };
      case "defog":
        return { cull: !!counter.setupType || moves.has("healbell") || moves.has("toxicspikes") || !!teamDetails.defog };
      case "fakeout":
        return { cull: !!counter.setupType || ["protect", "rapidspin", "substitute", "uturn"].some((m) => moves.has(m)) };
      case "firstimpression":
      case "glare":
      case "icywind":
      case "tailwind":
      case "waterspout":
        return { cull: !!counter.setupType || !!counter.get("speedsetup") || moves.has("rest") };
      case "healingwish":
      case "memento":
        return { cull: !!counter.setupType || !!counter.get("recovery") || moves.has("substitute") || moves.has("uturn") };
      case "highjumpkick":
        return { cull: moves.has("curse") };
      case "partingshot":
        return { cull: !!counter.get("speedsetup") || moves.has("bulkup") || moves.has("uturn") };
      case "protect":
        if (!isDoubles && (counter.setupType && !moves.has("wish") || moves.has("rest")))
          return { cull: true };
        if (!isDoubles && counter.get("Status") < 2 && ["Hunger Switch", "Speed Boost"].every((m) => !abilities.has(m)))
          return { cull: true };
        if (movePool.includes("leechseed") || movePool.includes("toxic") && !moves.has("wish"))
          return { cull: true };
        if (isDoubles && (["bellydrum", "fakeout", "shellsmash", "spore"].some((m) => movePool.includes(m)) || moves.has("tailwind") || moves.has("waterspout") || counter.get("recovery")))
          return { cull: true };
        return { cull: false };
      case "rapidspin":
        const setup = ["curse", "nastyplot", "shellsmash"].some((m) => moves.has(m));
        return { cull: !!teamDetails.rapidSpin || setup || !!counter.setupType && counter.get("Fighting") >= 2 };
      case "shadowsneak":
        const sneakIncompatible = ["substitute", "trickroom", "dualwingbeat", "toxic"].some((m) => moves.has(m));
        return { cull: hasRestTalk || sneakIncompatible || counter.setupType === "Special" };
      case "spikes":
        return { cull: !!counter.setupType || !!teamDetails.spikes && teamDetails.spikes > 1 };
      case "stealthrock":
        return {
          cull: !!counter.setupType || !!counter.get("speedsetup") || !!teamDetails.stealthRock || ["rest", "substitute", "trickroom", "teleport"].some((m) => moves.has(m)) || species.id === "palossand" && movePool.includes("shoreup")
        };
      case "stickyweb":
        return { cull: counter.setupType === "Special" || !!teamDetails.stickyWeb };
      case "taunt":
        return { cull: moves.has("encore") || moves.has("nastyplot") || moves.has("swordsdance") };
      case "thunderwave":
      case "voltswitch":
        const cullInDoubles = isDoubles && (moves.has("electroweb") || moves.has("nuzzle"));
        return { cull: !!counter.setupType || !!counter.get("speedsetup") || moves.has("shiftgear") || moves.has("raindance") || cullInDoubles };
      case "toxic":
        return { cull: !!counter.setupType || ["sludgewave", "thunderwave", "willowisp"].some((m) => moves.has(m)) };
      case "toxicspikes":
        return { cull: !!counter.setupType || !!teamDetails.toxicSpikes };
      case "uturn":
        const bugSwordsDanceCase = types.has("Bug") && counter.get("recovery") && moves.has("swordsdance");
        return { cull: !!counter.get("speedsetup") || counter.setupType && !bugSwordsDanceCase || isDoubles && moves.has("leechlife") || moves.has("shiftgear") };
      case "explosion":
        const otherMoves = ["curse", "stompingtantrum", "rockblast", "painsplit", "wish"].some((m) => moves.has(m));
        return { cull: !!counter.get("speedsetup") || !!counter.get("recovery") || otherMoves };
      case "facade":
        return { cull: movePool.includes("doubleedge") };
      case "quickattack":
        const diggersbyCull = counter.get("Physical") > 3 && movePool.includes("uturn");
        return { cull: !!counter.get("speedsetup") || types.has("Rock") && !!counter.get("Status") || diggersbyCull };
      case "blazekick":
        return { cull: species.id === "genesect" && counter.get("Special") >= 1 };
      case "blueflare":
        return { cull: moves.has("vcreate") };
      case "firefang":
      case "flamethrower":
        const otherFireMoves = ["heatwave", "overheat"].some((m) => moves.has(m));
        return { cull: moves.has("fireblast") && counter.setupType !== "Physical" || otherFireMoves };
      case "flareblitz":
        return { cull: species.id === "solgaleo" && moves.has("flamecharge") };
      case "overheat":
        return { cull: moves.has("flareblitz") || isDoubles && moves.has("calmmind") };
      case "aquatail":
      case "flipturn":
        return { cull: moves.has("aquajet") || !!counter.get("Status") };
      case "hydropump":
        return { cull: moves.has("scald") && (counter.get("Special") < 4 && !moves.has("uturn") || species.types.length > 1 && counter.get("stab") < 3) };
      case "muddywater":
        return { cull: moves.has("liquidation") };
      case "scald":
        return { cull: moves.has("waterpulse") };
      case "thunderbolt":
        return { cull: moves.has("powerwhip") };
      case "energyball":
        return { cull: species.id === "shiinotic" && !moves.has("moonblast") };
      case "gigadrain":
        const celebiPreferLeafStorm = species.id === "celebi" && !counter.setupType && moves.has("uturn");
        return { cull: celebiPreferLeafStorm || types.has("Poison") && !counter.get("Poison") };
      case "leafblade":
        return { cull: (moves.has("leafstorm") || movePool.includes("leafstorm")) && counter.setupType !== "Physical" };
      case "leafstorm":
        const leafBladePossible = movePool.includes("leafblade") || moves.has("leafblade");
        return {
          cull: counter.setupType === "Physical" && (species.id === "virizion" || leafBladePossible) || moves.has("gigadrain") && !!counter.get("Status") || isDoubles && moves.has("energyball")
        };
      case "powerwhip":
        return { cull: moves.has("leechlife") };
      case "woodhammer":
        return { cull: moves.has("hornleech") && counter.get("Physical") < 4 };
      case "freezedry":
        const betterIceMove = moves.has("blizzard") && !!counter.setupType || moves.has("icebeam") && counter.get("Special") < 4;
        const preferThunderWave = movePool.includes("thunderwave") && types.has("Electric");
        return { cull: betterIceMove || preferThunderWave || movePool.includes("bodyslam") };
      case "bodypress":
        const turtonatorPressCull = species.id === "turtonator" && moves.has("earthquake") && movePool.includes("shellsmash");
        const pressIncompatible = ["shellsmash", "mirrorcoat", "whirlwind"].some((m) => moves.has(m));
        return { cull: turtonatorPressCull || pressIncompatible || counter.setupType === "Special" };
      case "circlethrow":
        return { cull: moves.has("stormthrow") && !moves.has("rest") };
      case "drainpunch":
        return { cull: moves.has("closecombat") || !types.has("Fighting") && movePool.includes("swordsdance") };
      case "dynamicpunch":
      case "thunderouskick":
        return { cull: moves.has("closecombat") || moves.has("facade") };
      case "focusblast":
        return { cull: movePool.includes("shellsmash") || hasRestTalk };
      case "hammerarm":
        return { cull: moves.has("fakeout") };
      case "stormthrow":
        return { cull: hasRestTalk };
      case "superpower":
        return {
          cull: moves.has("hydropump") || counter.get("Physical") >= 4 && movePool.includes("uturn") || moves.has("substitute") && !abilities.has("Contrary"),
          isSetup: abilities.has("Contrary")
        };
      case "poisonjab":
        return { cull: !types.has("Poison") && counter.get("Status") >= 2 };
      case "earthquake":
        const doublesCull = moves.has("earthpower") || moves.has("highhorsepower");
        const turtQuakeCull = species.id === "turtonator" && movePool.includes("bodypress") && movePool.includes("shellsmash");
        const subToxicPossible = moves.has("substitute") && movePool.includes("toxic");
        return { cull: turtQuakeCull || isDoubles && doublesCull || subToxicPossible || moves.has("bonemerang") };
      case "scorchingsands":
        return { cull: moves.has("willowisp") || moves.has("earthpower") || moves.has("toxic") && movePool.includes("earthpower") };
      case "airslash":
        return {
          cull: species.id === "naganadel" && moves.has("nastyplot") || hasRestTalk || abilities.has("Simple") && !!counter.get("recovery") || counter.setupType === "Physical"
        };
      case "bravebird":
        return { cull: moves.has("dragondance") };
      case "hurricane":
        return { cull: counter.setupType === "Physical" };
      case "futuresight":
        return { cull: moves.has("psyshock") || moves.has("trick") || movePool.includes("teleport") };
      case "photongeyser":
        return { cull: moves.has("morningsun") };
      case "psychic":
        const alcremieCase = species.id === "alcremiegmax" && counter.get("Status") < 2;
        return { cull: alcremieCase || moves.has("psyshock") && (!!counter.setupType || isDoubles) };
      case "psychicfangs":
        return { cull: moves.has("rapidspin") };
      case "psyshock":
        const sylveonCase = abilities.has("Pixilate") && counter.get("Special") < 4;
        return { cull: moves.has("psychic") || !counter.setupType && sylveonCase || isDoubles && moves.has("psychic") };
      case "bugbuzz":
        return { cull: moves.has("uturn") && !counter.setupType };
      case "leechlife":
        return {
          cull: isDoubles && moves.has("lunge") || moves.has("uturn") && !counter.setupType || movePool.includes("spikes")
        };
      case "stoneedge":
        const gutsCullCondition = abilities.has("Guts") && (!moves.has("dynamicpunch") || moves.has("spikes"));
        const rockSlidePlusStatusPossible = counter.get("Status") && movePool.includes("rockslide");
        const otherRockMove = moves.has("rockblast") || moves.has("rockslide");
        const lucarioCull = species.id === "lucario" && !!counter.setupType;
        return { cull: gutsCullCondition || !isDoubles && rockSlidePlusStatusPossible || otherRockMove || lucarioCull };
      case "poltergeist":
        return { cull: moves.has("knockoff") };
      case "shadowball":
        return {
          cull: isDoubles && moves.has("phantomforce") || abilities.has("Pixilate") && (!!counter.setupType || counter.get("Status") > 1) || !types.has("Ghost") && movePool.includes("focusblast")
        };
      case "shadowclaw":
        return { cull: types.has("Steel") && moves.has("shadowsneak") && counter.get("Physical") < 4 };
      case "dragonpulse":
      case "spacialrend":
        return { cull: moves.has("dracometeor") && counter.get("Special") < 4 };
      case "darkpulse":
        const pulseIncompatible = ["foulplay", "knockoff"].some((m) => moves.has(m)) || species.id === "shiftry" && (moves.has("defog") || moves.has("suckerpunch"));
        const shiftryCase = movePool.includes("nastyplot") && !moves.has("defog");
        return { cull: pulseIncompatible && !shiftryCase && counter.setupType !== "Special" };
      case "suckerpunch":
        return {
          cull: isNoDynamax && species.id === "shiftry" && moves.has("defog") || moves.has("rest") || counter.damagingMoves.size < 2 || counter.setupType === "Special" || counter.get("Dark") > 1 && !types.has("Dark")
        };
      case "dazzlinggleam":
        return { cull: ["fleurcannon", "moonblast", "petaldance"].some((m) => moves.has(m)) };
      case "bodyslam":
      case "clearsmog":
        const toxicCullCondition = moves.has("toxic") && !types.has("Normal");
        return { cull: moves.has("sludgebomb") || moves.has("trick") || movePool.includes("recover") || toxicCullCondition };
      case "haze":
        return { cull: !teamDetails.stealthRock && (moves.has("stealthrock") || movePool.includes("stealthrock")) };
      case "hypnosis":
        return { cull: moves.has("voltswitch") };
      case "willowisp":
      case "yawn":
        return { cull: moves.has("thunderwave") || moves.has("toxic") || moves.has("swordsdance") };
      case "painsplit":
      case "recover":
      case "synthesis":
        return { cull: moves.has("rest") || moves.has("wish") || move.id === "synthesis" && moves.has("gigadrain") };
      case "roost":
        return {
          cull: moves.has("throatchop") || moves.has("stoneedge") && species.id === "hawlucha" || moves.has("dualwingbeat") && (moves.has("outrage") || species.id === "scizor")
        };
      case "reflect":
      case "lightscreen":
        return { cull: !!teamDetails.screens };
      case "slackoff":
        return { cull: species.id === "slowking" && !moves.has("scald") };
      case "substitute":
        const moveBasedCull = ["bulkup", "nastyplot", "painsplit", "roost", "swordsdance"].some((m) => movePool.includes(m));
        const doublesGourgeist = isDoubles && movePool.includes("powerwhip");
        const calmMindCullCondition = !counter.get("recovery") && movePool.includes("calmmind") && species.id !== "calyrex";
        const eiscue = species.id === "eiscue" && moves.has("zenheadbutt");
        return { cull: moves.has("rest") || moveBasedCull || doublesGourgeist || calmMindCullCondition || eiscue };
      case "helpinghand":
        return { cull: moves.has("acupressure") };
      case "wideguard":
        return { cull: moves.has("protect") };
      case "grassknot":
        return { cull: moves.has("surf") };
      case "icepunch":
        return { cull: moves.has("rocktomb") };
      case "leechseed":
        return { cull: !!counter.setupType };
    }
    return { cull: false };
  }
  shouldCullAbility(ability, types, moves, abilities, counter, movePool, teamDetails, species, preferredType, role, isDoubles, isNoDynamax) {
    if ([
      "Flare Boost",
      "Hydration",
      "Ice Body",
      "Immunity",
      "Innards Out",
      "Insomnia",
      "Misty Surge",
      "Moody",
      "Perish Body",
      "Quick Feet",
      "Rain Dish",
      "Snow Cloak",
      "Steadfast",
      "Steam Engine"
    ].includes(ability))
      return true;
    switch (ability) {
      case "Contrary":
      case "Serene Grace":
      case "Skill Link":
      case "Strong Jaw":
        return !counter.get((0, import_dex.toID)(ability));
      case "Analytic":
        return moves.has("rapidspin") || species.nfe || isDoubles;
      case "Blaze":
        return isDoubles && abilities.has("Solar Power") || !isDoubles && !isNoDynamax && species.id === "charizard";
      case "Chlorophyll":
        return species.baseStats.spe > 100 || !counter.get("Fire") && !moves.has("sunnyday") && !teamDetails.sun;
      case "Cloud Nine":
        return !isNoDynamax || species.id !== "golduck";
      case "Competitive":
        return counter.get("Special") < 2 || moves.has("rest") && moves.has("sleeptalk");
      case "Compound Eyes":
      case "No Guard":
        return !counter.get("inaccurate");
      case "Cursed Body":
        return abilities.has("Infiltrator");
      case "Defiant":
        return !counter.get("Physical");
      case "Download":
        return counter.damagingMoves.size < 3 || moves.has("trick");
      case "Early Bird":
        return types.has("Grass") && isDoubles;
      case "Flash Fire":
        return this.dex.getEffectiveness("Fire", species) < -1 || abilities.has("Drought");
      case "Gluttony":
        return !moves.has("bellydrum");
      case "Guts":
        return !moves.has("facade") && !moves.has("sleeptalk") && !species.nfe;
      case "Harvest":
        return abilities.has("Frisk") && !isDoubles;
      case "Hustle":
      case "Inner Focus":
        return species.id !== "glalie" && counter.get("Physical") < 2 || abilities.has("Iron Fist");
      case "Infiltrator":
        return moves.has("rest") && moves.has("sleeptalk") || isDoubles && abilities.has("Clear Body");
      case "Intimidate":
        if (species.id === "salamence" && moves.has("dragondance"))
          return true;
        return ["bodyslam", "bounce", "tripleaxel"].some((m) => moves.has(m));
      case "Iron Fist":
        return counter.get("ironfist") < 2 || moves.has("dynamicpunch");
      case "Justified":
        return isDoubles && abilities.has("Inner Focus");
      case "Lightning Rod":
        return species.types.includes("Ground") || !isNoDynamax && counter.setupType === "Physical";
      case "Limber":
        return species.types.includes("Electric") || moves.has("facade");
      case "Liquid Voice":
        return !moves.has("hypervoice");
      case "Magic Guard":
        return abilities.has("Tinted Lens") && !counter.get("Status") && !isDoubles;
      case "Mold Breaker":
        return abilities.has("Adaptability") || abilities.has("Scrappy") || abilities.has("Unburden") && !!counter.setupType || abilities.has("Sheer Force") && !!counter.get("sheerforce");
      case "Moxie":
        return counter.get("Physical") < 2 || moves.has("stealthrock") || moves.has("defog");
      case "Overgrow":
        return !counter.get("Grass");
      case "Own Tempo":
        return !moves.has("petaldance");
      case "Power Construct":
        return species.forme === "10%" && !isDoubles;
      case "Prankster":
        return !counter.get("Status");
      case "Pressure":
        return !!counter.setupType || counter.get("Status") < 2 || isDoubles;
      case "Refrigerate":
        return !counter.get("Normal");
      case "Regenerator":
        return abilities.has("Magic Guard");
      case "Reckless":
        return !counter.get("recoil") || moves.has("curse");
      case "Rock Head":
        return !counter.get("recoil");
      case "Sand Force":
      case "Sand Veil":
        return !teamDetails.sand;
      case "Sand Rush":
        return !teamDetails.sand && (isNoDynamax || !counter.setupType || !counter.get("Rock") || moves.has("rapidspin"));
      case "Sap Sipper":
        return moves.has("roost");
      case "Scrappy":
        return moves.has("earthquake") && species.id === "miltank";
      case "Screen Cleaner":
        return !!teamDetails.screens;
      case "Shed Skin":
        return moves.has("dragondance");
      case "Sheer Force":
        return !counter.get("sheerforce") || abilities.has("Guts") || species.id === "druddigon" && !isDoubles;
      case "Shell Armor":
        return species.id === "omastar" && (moves.has("spikes") || moves.has("stealthrock"));
      case "Slush Rush":
        return !teamDetails.hail && !abilities.has("Swift Swim");
      case "Sniper":
        return species.name === "Inteleon" || counter.get("Water") > 1 && !moves.has("focusenergy");
      case "Solar Power":
        return isNoDynamax && !teamDetails.sun;
      case "Speed Boost":
        return isNoDynamax && species.id === "ninjask";
      case "Steely Spirit":
        return moves.has("fakeout") && !isDoubles;
      case "Sturdy":
        return moves.has("bulkup") || !!counter.get("recoil") || !isNoDynamax && abilities.has("Solid Rock");
      case "Swarm":
        return !counter.get("Bug") || !!counter.get("recovery");
      case "Sweet Veil":
        return types.has("Grass");
      case "Swift Swim":
        if (isNoDynamax) {
          const neverWantsSwim = !moves.has("raindance") && [
            "Intimidate",
            "Rock Head",
            "Water Absorb"
          ].some((m) => abilities.has(m));
          const noSwimIfNoRain = !moves.has("raindance") && [
            "Cloud Nine",
            "Lightning Rod",
            "Intimidate",
            "Rock Head",
            "Sturdy",
            "Water Absorb",
            "Weak Armor"
          ].some((m) => abilities.has(m));
          return teamDetails.rain ? neverWantsSwim : noSwimIfNoRain;
        }
        return !moves.has("raindance") && (["Intimidate", "Rock Head", "Slush Rush", "Water Absorb"].some((abil) => abilities.has(abil)) || abilities.has("Lightning Rod") && !counter.setupType);
      case "Synchronize":
        return counter.get("Status") < 3;
      case "Technician":
        return !counter.get("technician") || moves.has("tailslap") || abilities.has("Punk Rock") || // For Doubles Alolan Persian
        movePool.includes("snarl");
      case "Tinted Lens":
        return (
          // For Sigilyph
          moves.has("defog") || moves.has("hurricane") && abilities.has("Compound Eyes") || counter.get("Status") > 2 && !counter.setupType
        );
      case "Torrent":
        return moves.has("focusenergy") || moves.has("hypervoice");
      case "Tough Claws":
        return types.has("Steel") && !moves.has("fakeout");
      case "Unaware":
        return !!counter.setupType || moves.has("fireblast");
      case "Unburden":
        return abilities.has("Prankster") || !counter.setupType && !isDoubles;
      case "Volt Absorb":
        return this.dex.getEffectiveness("Electric", species) < -1;
      case "Water Absorb":
        return moves.has("raindance") || ["Drizzle", "Strong Jaw", "Unaware", "Volt Absorb"].some((abil) => abilities.has(abil));
      case "Weak Armor":
        return !isNoDynamax && species.baseStats.spe > 50 || species.id === "skarmory" || moves.has("shellsmash") || moves.has("rapidspin");
    }
    return false;
  }
  getAbility(types, moves, abilities, counter, movePool, teamDetails, species, preferredType, role, isDoubles, isNoDynamax) {
    const abilityData = Array.from(abilities).map((a) => this.dex.abilities.get(a));
    import_lib.Utils.sortBy(abilityData, (abil) => -abil.rating);
    if (abilityData.length <= 1)
      return abilityData[0].name;
    if (species.id === "lopunny" && moves.has("facade"))
      return "Cute Charm";
    if (species.id === "copperajahgmax")
      return "Heavy Metal";
    if (abilities.has("Guts") && // for Ursaring in BDSP
    !abilities.has("Quick Feet") && (species.id === "gurdurr" || species.id === "throh" || moves.has("facade") || moves.has("rest") && moves.has("sleeptalk")))
      return "Guts";
    if (abilities.has("Moxie") && (counter.get("Physical") > 3 || moves.has("bounce")) && !isDoubles)
      return "Moxie";
    if (isDoubles) {
      if (abilities.has("Competitive") && !abilities.has("Shadow Tag") && !abilities.has("Strong Jaw"))
        return "Competitive";
      if (abilities.has("Friend Guard"))
        return "Friend Guard";
      if (abilities.has("Gluttony") && moves.has("recycle"))
        return "Gluttony";
      if (abilities.has("Guts"))
        return "Guts";
      if (abilities.has("Harvest"))
        return "Harvest";
      if (abilities.has("Healer") && (abilities.has("Natural Cure") || abilities.has("Aroma Veil") && this.randomChance(1, 2)))
        return "Healer";
      if (abilities.has("Intimidate"))
        return "Intimidate";
      if (species.id === "lopunny")
        return "Klutz";
      if (abilities.has("Magic Guard") && !abilities.has("Unaware"))
        return "Magic Guard";
      if (abilities.has("Ripen"))
        return "Ripen";
      if (abilities.has("Stalwart"))
        return "Stalwart";
      if (abilities.has("Storm Drain"))
        return "Storm Drain";
      if (abilities.has("Telepathy") && (abilities.has("Pressure") || abilities.has("Analytic")))
        return "Telepathy";
    }
    let abilityAllowed = [];
    for (const ability of abilityData) {
      if (ability.rating >= 1 && !this.shouldCullAbility(
        ability.name,
        types,
        moves,
        abilities,
        counter,
        movePool,
        teamDetails,
        species,
        "",
        "",
        isDoubles,
        isNoDynamax
      )) {
        abilityAllowed.push(ability);
      }
    }
    if (!abilityAllowed.length) {
      for (const ability of abilityData) {
        if (ability.rating > 0)
          abilityAllowed.push(ability);
      }
      if (!abilityAllowed.length)
        abilityAllowed = abilityData;
    }
    if (abilityAllowed.length === 1)
      return abilityAllowed[0].name;
    if (abilityAllowed[2] && abilityAllowed[0].rating - 0.5 <= abilityAllowed[2].rating) {
      if (abilityAllowed[1].rating <= abilityAllowed[2].rating) {
        if (this.randomChance(1, 2))
          [abilityAllowed[1], abilityAllowed[2]] = [abilityAllowed[2], abilityAllowed[1]];
      } else {
        if (this.randomChance(1, 3))
          [abilityAllowed[1], abilityAllowed[2]] = [abilityAllowed[2], abilityAllowed[1]];
      }
      if (abilityAllowed[0].rating <= abilityAllowed[1].rating) {
        if (this.randomChance(2, 3))
          [abilityAllowed[0], abilityAllowed[1]] = [abilityAllowed[1], abilityAllowed[0]];
      } else {
        if (this.randomChance(1, 2))
          [abilityAllowed[0], abilityAllowed[1]] = [abilityAllowed[1], abilityAllowed[0]];
      }
    } else {
      if (abilityAllowed[0].rating <= abilityAllowed[1].rating) {
        if (this.randomChance(1, 2))
          [abilityAllowed[0], abilityAllowed[1]] = [abilityAllowed[1], abilityAllowed[0]];
      } else if (abilityAllowed[0].rating - 0.5 <= abilityAllowed[1].rating) {
        if (this.randomChance(1, 3))
          [abilityAllowed[0], abilityAllowed[1]] = [abilityAllowed[1], abilityAllowed[0]];
      }
    }
    return abilityAllowed[0].name;
  }
  getHighPriorityItem(ability, types, moves, counter, teamDetails, species, isLead, isDoubles) {
    if (moves.has("acrobatics") && ability !== "Ripen")
      return ability === "Grassy Surge" ? "Grassy Seed" : "";
    if (moves.has("geomancy") || moves.has("meteorbeam"))
      return "Power Herb";
    if (moves.has("shellsmash")) {
      if (ability === "Sturdy" && !isLead && !isDoubles)
        return "Heavy-Duty Boots";
      if (ability === "Solid Rock")
        return "Weakness Policy";
      return "White Herb";
    }
    if (moves.has("technoblast"))
      return "Douse Drive";
    if (["Corsola", "Garchomp", "Tangrowth"].includes(species.name) && counter.get("Status") && !counter.setupType && !isDoubles)
      return "Rocky Helmet";
    if (species.name === "Eternatus" && counter.get("Status") < 2)
      return "Metronome";
    if (species.name === "Farfetch\u2019d")
      return "Leek";
    if (species.name === "Froslass" && !isDoubles)
      return "Wide Lens";
    if (species.name === "Latios" && counter.get("Special") === 2 && !isDoubles)
      return "Soul Dew";
    if (species.name === "Lopunny")
      return isDoubles ? "Iron Ball" : "Toxic Orb";
    if (species.baseSpecies === "Marowak")
      return "Thick Club";
    if (species.baseSpecies === "Pikachu")
      return "Light Ball";
    if (species.name === "Regieleki" && !isDoubles)
      return "Magnet";
    if (species.name === "Shedinja") {
      const noSash = !teamDetails.defog && !teamDetails.rapidSpin && !isDoubles;
      return noSash ? "Heavy-Duty Boots" : "Focus Sash";
    }
    if (species.name === "Shuckle" && moves.has("stickyweb"))
      return "Mental Herb";
    if (species.name === "Unfezant" || moves.has("focusenergy"))
      return "Scope Lens";
    if (species.name === "Pincurchin")
      return "Shuca Berry";
    if (species.name === "Wobbuffet" && moves.has("destinybond"))
      return "Custap Berry";
    if (species.name === "Scyther" && counter.damagingMoves.size > 3)
      return "Choice Band";
    if (species.name === "Cinccino" && !moves.has("uturn"))
      return "Life Orb";
    if (moves.has("bellydrum") && moves.has("substitute"))
      return "Salac Berry";
    const HDBBetterThanEviolite = !isDoubles && (!isLead || moves.has("uturn")) && this.dex.getEffectiveness("Rock", species) >= 2;
    if (species.nfe)
      return HDBBetterThanEviolite ? "Heavy-Duty Boots" : "Eviolite";
    if (species.name === "Wobbuffet" || ["Cheek Pouch", "Harvest", "Ripen"].includes(ability))
      return "Sitrus Berry";
    if (ability === "Gluttony")
      return this.sample(["Aguav", "Figy", "Iapapa", "Mago", "Wiki"]) + " Berry";
    if (ability === "Imposter" || ability === "Magnet Pull" && moves.has("bodypress") && !isDoubles)
      return "Choice Scarf";
    if (ability === "Guts" && (counter.get("Physical") > 2 || isDoubles)) {
      return types.has("Fire") ? "Toxic Orb" : "Flame Orb";
    }
    if (ability === "Magic Guard" && counter.damagingMoves.size > 1) {
      return moves.has("counter") ? "Focus Sash" : "Life Orb";
    }
    if (ability === "Sheer Force" && counter.get("sheerforce"))
      return "Life Orb";
    if (ability === "Unburden")
      return moves.has("closecombat") || moves.has("curse") ? "White Herb" : "Sitrus Berry";
    if (moves.has("trick") || moves.has("switcheroo") && !isDoubles || ability === "Gorilla Tactics") {
      if (species.baseStats.spe >= 60 && species.baseStats.spe <= 108 && !counter.get("priority") && ability !== "Triage") {
        return "Choice Scarf";
      } else {
        return counter.get("Physical") > counter.get("Special") ? "Choice Band" : "Choice Specs";
      }
    }
    if (moves.has("auroraveil") || moves.has("lightscreen") && moves.has("reflect"))
      return "Light Clay";
    if (moves.has("rest") && !moves.has("sleeptalk") && ability !== "Shed Skin")
      return "Chesto Berry";
    if (moves.has("hypnosis") && ability === "Beast Boost")
      return "Blunder Policy";
    if (moves.has("bellydrum"))
      return "Sitrus Berry";
    if (this.dex.getEffectiveness("Rock", species) >= 2 && !isDoubles) {
      return "Heavy-Duty Boots";
    }
  }
  /** Item generation specific to Random Doubles */
  getDoublesItem(ability, types, moves, abilities, counter, teamDetails, species) {
    const defensiveStatTotal = species.baseStats.hp + species.baseStats.def + species.baseStats.spd;
    if (["dragonenergy", "eruption", "waterspout"].some((m) => moves.has(m)) && counter.damagingMoves.size >= 4)
      return "Choice Scarf";
    if (moves.has("blizzard") && ability !== "Snow Warning" && !teamDetails.hail)
      return "Blunder Policy";
    if (this.dex.getEffectiveness("Rock", species) >= 2 && !types.has("Flying"))
      return "Heavy-Duty Boots";
    if (counter.get("Physical") >= 4 && ["fakeout", "feint", "rapidspin", "suckerpunch"].every((m) => !moves.has(m)) && (types.has("Dragon") || types.has("Fighting") || types.has("Rock") || moves.has("flipturn") || moves.has("uturn"))) {
      return !counter.get("priority") && !abilities.has("Speed Boost") && species.baseStats.spe >= 60 && species.baseStats.spe <= 100 && this.randomChance(1, 2) ? "Choice Scarf" : "Choice Band";
    }
    if (counter.get("Special") >= 4 && (types.has("Dragon") || types.has("Fighting") || types.has("Rock") || moves.has("voltswitch")) || counter.get("Special") >= 3 && (moves.has("flipturn") || moves.has("uturn")) && !moves.has("acidspray") && !moves.has("electroweb")) {
      return species.baseStats.spe >= 60 && species.baseStats.spe <= 100 && this.randomChance(1, 2) ? "Choice Scarf" : "Choice Specs";
    }
    if (defensiveStatTotal < 250 && ability === "Regenerator" || species.name === "Pheromosa")
      return "Life Orb";
    if (counter.damagingMoves.size >= 4 && defensiveStatTotal >= 275)
      return "Assault Vest";
    if (counter.damagingMoves.size >= 3 && species.baseStats.spe >= 60 && ability !== "Multiscale" && ability !== "Sturdy" && [
      "acidspray",
      "clearsmog",
      "electroweb",
      "fakeout",
      "feint",
      "icywind",
      "incinerate",
      "naturesmadness",
      "rapidspin",
      "snarl",
      "uturn"
    ].every((m) => !moves.has(m)))
      return ability === "Defeatist" || defensiveStatTotal >= 275 ? "Sitrus Berry" : "Life Orb";
  }
  getMediumPriorityItem(ability, moves, counter, species, isLead, isDoubles, isNoDynamax) {
    const defensiveStatTotal = species.baseStats.hp + species.baseStats.def + species.baseStats.spd;
    if (!isDoubles && counter.get("Physical") >= 4 && ability !== "Serene Grace" && ["fakeout", "flamecharge", "rapidspin"].every((m) => !moves.has(m))) {
      const scarfReqs = (species.baseStats.atk >= 100 || ability === "Huge Power") && species.baseStats.spe >= 60 && species.baseStats.spe <= 108 && ability !== "Speed Boost" && !counter.get("priority") && (isNoDynamax || ["bounce", "dualwingbeat"].every((m) => !moves.has(m)));
      return scarfReqs && this.randomChance(2, 3) ? "Choice Scarf" : "Choice Band";
    }
    if (!isDoubles && (counter.get("Special") >= 4 && !moves.has("futuresight") || counter.get("Special") >= 3 && ["flipturn", "partingshot", "uturn"].some((m) => moves.has(m)))) {
      const scarfReqs = species.baseStats.spa >= 100 && species.baseStats.spe >= 60 && species.baseStats.spe <= 108 && ability !== "Tinted Lens" && !counter.get("Physical");
      return scarfReqs && this.randomChance(2, 3) ? "Choice Scarf" : "Choice Specs";
    }
    if (!isDoubles && counter.get("Physical") >= 3 && !moves.has("rapidspin") && ["copycat", "memento", "partingshot"].some((m) => moves.has(m)))
      return "Choice Band";
    if (!isDoubles && (counter.get("Physical") >= 3 && moves.has("defog") || counter.get("Special") >= 3 && moves.has("healingwish")) && !counter.get("priority") && !moves.has("uturn"))
      return "Choice Scarf";
    if (species.name === "Palkia")
      return "Lustrous Orb";
    if (moves.has("raindance") || moves.has("sunnyday") || ability === "Speed Boost" && !counter.get("hazards") || ability === "Stance Change" && counter.damagingMoves.size >= 3)
      return "Life Orb";
    if (!isDoubles && this.dex.getEffectiveness("Rock", species) >= 1 && (["Defeatist", "Emergency Exit", "Multiscale"].includes(ability) || ["courtchange", "defog", "rapidspin"].some((m) => moves.has(m))))
      return "Heavy-Duty Boots";
    if (species.name === "Necrozma-Dusk-Mane" || this.dex.getEffectiveness("Ground", species) < 2 && counter.get("speedsetup") && counter.damagingMoves.size >= 3 && defensiveStatTotal >= 300)
      return "Weakness Policy";
    if (counter.damagingMoves.size >= 4 && defensiveStatTotal >= 235)
      return "Assault Vest";
    if (["clearsmog", "curse", "haze", "healbell", "protect", "sleeptalk", "strangesteam"].some((m) => moves.has(m)) && !isDoubles)
      return "Leftovers";
  }
  getLowPriorityItem(ability, types, moves, abilities, counter, teamDetails, species, isLead, isDoubles, isNoDynamax) {
    const defensiveStatTotal = species.baseStats.hp + species.baseStats.def + species.baseStats.spd;
    if (isLead && !isDoubles && !["Disguise", "Sturdy"].includes(ability) && !moves.has("substitute") && !counter.get("drain") && !counter.get("recoil") && !counter.get("recovery") && (defensiveStatTotal <= 250 && counter.get("hazards") || defensiveStatTotal <= 210))
      return "Focus Sash";
    if (moves.has("clangoroussoul") || moves.has("boomburst") && Array.from(moves).some((m) => import_dex.Dex.moves.get(m).boosts?.spe))
      return "Throat Spray";
    const rockWeaknessCase = this.dex.getEffectiveness("Rock", species) >= 1 && (!teamDetails.defog || ability === "Intimidate" || moves.has("uturn") || moves.has("voltswitch"));
    const spinnerCase = moves.has("rapidspin") && (ability === "Regenerator" || !!counter.get("recovery"));
    if (!isDoubles && (rockWeaknessCase || spinnerCase))
      return "Heavy-Duty Boots";
    if (!isDoubles && this.dex.getEffectiveness("Ground", species) >= 2 && !types.has("Poison") && ability !== "Levitate" && !abilities.has("Iron Barbs"))
      return "Air Balloon";
    if (!isDoubles && counter.damagingMoves.size >= 3 && !counter.get("damage") && ability !== "Sturdy" && (species.baseStats.spe >= 90 || !moves.has("voltswitch")) && ["foulplay", "rapidspin", "substitute", "uturn"].every((m) => !moves.has(m)) && (counter.get("speedsetup") || counter.get("drain") && (!isNoDynamax || species.id !== "buzzwole" || moves.has("roost")) || moves.has("trickroom") || moves.has("psystrike") || species.baseStats.spe > 40 && defensiveStatTotal < 275))
      return "Life Orb";
    if (!isDoubles && counter.damagingMoves.size >= 4 && !counter.get("Dragon") && !counter.get("Normal")) {
      return "Expert Belt";
    }
    if (!isDoubles && !moves.has("substitute") && (moves.has("dragondance") || moves.has("swordsdance")) && (moves.has("outrage") || ["Bug", "Fire", "Ground", "Normal", "Poison"].every((type) => !types.has(type)) && !["Pastel Veil", "Storm Drain"].includes(ability)))
      return "Lum Berry";
  }
  getLevel(species, isDoubles, isNoDynamax) {
    const data = this.randomData[species.id];
    if (this.adjustLevel)
      return this.adjustLevel;
    if (isDoubles && data.doublesLevel)
      return data.doublesLevel;
    if (isNoDynamax) {
      const tier = species.name.endsWith("-Gmax") ? this.dex.species.get(species.changesFrom).tier : species.tier;
      const tierScale = {
        Uber: 76,
        OU: 80,
        UUBL: 81,
        UU: 82,
        RUBL: 83,
        RU: 84,
        NUBL: 85,
        NU: 86,
        PUBL: 87,
        PU: 88,
        "(PU)": 88,
        NFE: 88
      };
      const customScale = {
        // These Pokemon are too strong and need a lower level
        zaciancrowned: 65,
        calyrexshadow: 68,
        xerneas: 70,
        necrozmaduskmane: 72,
        zacian: 72,
        kyogre: 73,
        eternatus: 73,
        zekrom: 74,
        marshadow: 75,
        urshifurapidstrike: 79,
        haxorus: 80,
        inteleon: 80,
        cresselia: 83,
        jolteon: 84,
        swoobat: 84,
        dugtrio: 84,
        slurpuff: 84,
        polteageist: 84,
        wobbuffet: 86,
        scrafty: 86,
        // These Pokemon are too weak and need a higher level
        delibird: 100,
        vespiquen: 96,
        pikachu: 92,
        shedinja: 92,
        solrock: 90,
        arctozolt: 88,
        reuniclus: 87,
        decidueye: 87,
        noivern: 85,
        magnezone: 82,
        slowking: 81
      };
      return customScale[species.id] || tierScale[tier] || 80;
    }
    if (this.dex.currentMod === "gen8bdsp") {
      const tierScale = {
        Uber: 76,
        Unreleased: 76,
        OU: 80,
        UUBL: 81,
        UU: 82,
        RUBL: 83,
        RU: 84,
        NUBL: 85,
        NU: 86,
        PUBL: 87,
        PU: 88,
        "(PU)": 88,
        NFE: 88
      };
      const customScale = {
        delibird: 100,
        dugtrio: 76,
        glalie: 76,
        luvdisc: 100,
        spinda: 100,
        unown: 100
      };
      return customScale[species.id] || tierScale[species.tier] || 80;
    }
    if (data.level)
      return data.level;
    return 80;
  }
  getForme(species) {
    if (typeof species.battleOnly === "string") {
      return species.battleOnly;
    }
    if (species.cosmeticFormes)
      return this.sample([species.name].concat(species.cosmeticFormes));
    if (species.name.endsWith("-Gmax"))
      return species.name.slice(0, -5);
    if (["Magearna", "Polteageist", "Zarude"].includes(species.baseSpecies)) {
      return this.sample([species.name].concat(species.otherFormes));
    }
    if (species.baseSpecies === "Basculin")
      return "Basculin" + this.sample(["", "-Blue-Striped"]);
    if (species.baseSpecies === "Keldeo" && this.gen <= 7)
      return "Keldeo" + this.sample(["", "-Resolute"]);
    if (species.baseSpecies === "Pikachu" && this.dex.currentMod === "gen8") {
      return "Pikachu" + this.sample(
        ["", "-Original", "-Hoenn", "-Sinnoh", "-Unova", "-Kalos", "-Alola", "-Partner", "-World"]
      );
    }
    return species.name;
  }
  randomSet(species, teamDetails = {}, isLead = false, isDoubles = false, isNoDynamax = false) {
    species = this.dex.species.get(species);
    const forme = this.getForme(species);
    const gmax = species.name.endsWith("-Gmax");
    const data = this.randomData[species.id];
    const randMoves = isDoubles && data.doublesMoves || isNoDynamax && data.noDynamaxMoves || data.moves;
    const movePool = [...randMoves || this.dex.species.getMovePool(species.id)];
    if (this.format.playerCount > 2) {
      const allySwitch = movePool.indexOf("allyswitch");
      if (allySwitch > -1) {
        if (movePool.length > this.maxMoveCount) {
          this.fastPop(movePool, allySwitch);
        } else {
          movePool[allySwitch] = "sleeptalk";
        }
      }
    }
    const rejectedPool = [];
    let ability = "";
    let item = void 0;
    const evs = { hp: 85, atk: 85, def: 85, spa: 85, spd: 85, spe: 85 };
    const ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
    const types = new Set(species.types);
    const abilities = new Set(Object.values(species.abilities));
    if (species.unreleasedHidden)
      abilities.delete(species.abilities.H);
    const moves = /* @__PURE__ */ new Set();
    let counter;
    let hasHiddenPower = false;
    do {
      const pool = movePool.length ? movePool : rejectedPool;
      while (moves.size < this.maxMoveCount && pool.length) {
        const moveid = this.sampleNoReplace(pool);
        if (moveid.startsWith("hiddenpower")) {
          if (hasHiddenPower)
            continue;
          hasHiddenPower = true;
        }
        moves.add(moveid);
      }
      counter = this.queryMoves(moves, species.types, abilities, movePool);
      const runEnforcementChecker = (checkerName) => {
        if (!this.moveEnforcementCheckers[checkerName])
          return false;
        return this.moveEnforcementCheckers[checkerName](
          movePool,
          moves,
          abilities,
          types,
          counter,
          species,
          teamDetails
        );
      };
      for (const moveid of moves) {
        const move = this.dex.moves.get(moveid);
        let { cull, isSetup } = this.shouldCullMove(
          move,
          types,
          moves,
          abilities,
          counter,
          movePool,
          teamDetails,
          species,
          isLead,
          isDoubles,
          isNoDynamax
        );
        if (move.id !== "photongeyser" && (move.category === "Physical" && counter.setupType === "Special" || move.category === "Special" && counter.setupType === "Physical")) {
          const stabs = counter.get(species.types[0]) + (species.types[1] ? counter.get(species.types[1]) : 0);
          if (!types.has(move.type) || stabs > 1 || counter.get(move.category) < 2)
            cull = true;
        }
        const isLowBP = move.basePower && move.basePower < 50;
        const moveIsRejectable = !(species.id === "genesectdouse" && move.id === "technoblast") && !(species.id === "togekiss" && move.id === "nastyplot") && !(species.id === "shuckle" && ["stealthrock", "stickyweb"].includes(move.id)) && (move.category === "Status" || !types.has(move.type) && move.id !== "judgment" || isLowBP && !move.multihit && !abilities.has("Technician"));
        const notImportantSetup = !counter.setupType || counter.setupType === "Mixed" || counter.get(counter.setupType) + counter.get("Status") > 3 && !counter.get("hazards") || move.category !== counter.setupType && move.category !== "Status";
        if (moveIsRejectable && (!cull && !isSetup && !move.weather && !move.stallingMove && notImportantSetup && !move.damage && (isDoubles ? this.unrejectableMovesInDoubles(move) : this.unrejectableMovesInSingles(move)))) {
          if (!counter.get("stab") && counter.get("physicalpool") + counter.get("specialpool") > 0 && move.id !== "stickyweb" || moves.has("swordsdance") && species.id === "mew" && runEnforcementChecker("Flying") || abilities.has("Steelworker") && runEnforcementChecker("Steel") || !isDoubles && runEnforcementChecker("recovery") && move.id !== "stickyweb" || runEnforcementChecker("screens") || runEnforcementChecker("misc") || (isLead || species.id === "shuckle") && runEnforcementChecker("lead") || moves.has("leechseed") && runEnforcementChecker("leechseed")) {
            cull = true;
          } else if (move.id !== "stickyweb" && !(species.id === "azumarill" && move.id === "aquajet")) {
            for (const type of types) {
              if (runEnforcementChecker(type)) {
                cull = true;
              }
            }
          }
        }
        if (move.id === "rest" && cull) {
          const sleeptalk = movePool.indexOf("sleeptalk");
          if (sleeptalk >= 0) {
            if (movePool.length < 2) {
              cull = false;
            } else {
              this.fastPop(movePool, sleeptalk);
            }
          }
        }
        if (cull && movePool.length) {
          if (moveid.startsWith("hiddenpower"))
            hasHiddenPower = false;
          if (move.category !== "Status" && !move.damage)
            rejectedPool.push(moveid);
          moves.delete(moveid);
          break;
        }
        if (cull && rejectedPool.length) {
          if (moveid.startsWith("hiddenpower"))
            hasHiddenPower = false;
          moves.delete(moveid);
          break;
        }
      }
    } while (moves.size < this.maxMoveCount && (movePool.length || rejectedPool.length));
    if (hasHiddenPower) {
      let hpType;
      for (const move of moves) {
        if (move.startsWith("hiddenpower"))
          hpType = move.substr(11);
      }
      if (!hpType)
        throw new Error(`hasHiddenPower is true, but no Hidden Power move was found.`);
      const HPivs = this.dex.types.get(hpType).HPivs;
      let iv;
      for (iv in HPivs) {
        ivs[iv] = HPivs[iv];
      }
    }
    ability = this.getAbility(
      types,
      moves,
      abilities,
      counter,
      movePool,
      teamDetails,
      species,
      "",
      "",
      isDoubles,
      isNoDynamax
    );
    if (species.requiredItems) {
      item = this.sample(species.requiredItems);
    } else {
      item = this.getHighPriorityItem(ability, types, moves, counter, teamDetails, species, isLead, isDoubles);
      if (item === void 0 && isDoubles) {
        item = this.getDoublesItem(ability, types, moves, abilities, counter, teamDetails, species);
      }
      if (item === void 0) {
        item = this.getMediumPriorityItem(ability, moves, counter, species, isLead, isDoubles, isNoDynamax);
      }
      if (item === void 0) {
        item = this.getLowPriorityItem(
          ability,
          types,
          moves,
          abilities,
          counter,
          teamDetails,
          species,
          isLead,
          isDoubles,
          isNoDynamax
        );
      }
      if (item === void 0)
        item = isDoubles ? "Sitrus Berry" : "Leftovers";
    }
    if (item === "Leftovers" && types.has("Poison")) {
      item = "Black Sludge";
    }
    const level = this.getLevel(species, isDoubles, isNoDynamax);
    const srImmunity = ability === "Magic Guard" || item === "Heavy-Duty Boots";
    const srWeakness = srImmunity ? 0 : this.dex.getEffectiveness("Rock", species);
    while (evs.hp > 1) {
      const hp = Math.floor(Math.floor(2 * species.baseStats.hp + ivs.hp + Math.floor(evs.hp / 4) + 100) * level / 100 + 10);
      const multipleOfFourNecessary = moves.has("substitute") && !["Leftovers", "Black Sludge"].includes(item) && (item === "Sitrus Berry" || item === "Salac Berry" || ability === "Power Construct");
      if (multipleOfFourNecessary) {
        if (hp % 4 === 0)
          break;
      } else if (moves.has("bellydrum") && (item === "Sitrus Berry" || ability === "Gluttony")) {
        if (hp % 2 === 0)
          break;
      } else if (moves.has("substitute") && moves.has("reversal")) {
        if (hp % 4 > 0)
          break;
      } else {
        if (srWeakness <= 0 || hp % (4 / srWeakness) > 0)
          break;
      }
      evs.hp -= 4;
    }
    if (moves.has("shellsidearm") && item === "Choice Specs")
      evs.atk -= 8;
    const noAttackStatMoves = [...moves].every((m) => {
      const move = this.dex.moves.get(m);
      if (move.damageCallback || move.damage)
        return true;
      return move.category !== "Physical" || move.id === "bodypress";
    });
    if (noAttackStatMoves && !moves.has("transform") && (!moves.has("shellsidearm") || !counter.get("Status"))) {
      evs.atk = 0;
      ivs.atk = 0;
    }
    if (forme === "Nihilego")
      evs.spd -= 32;
    if (moves.has("gyroball") || moves.has("trickroom")) {
      evs.spe = 0;
      ivs.spe = 0;
    }
    return {
      name: species.baseSpecies,
      species: forme,
      gender: species.gender,
      shiny: this.randomChance(1, 1024),
      gigantamax: gmax,
      level,
      moves: Array.from(moves),
      ability,
      evs,
      ivs,
      item
    };
  }
  getPokemonPool(type, pokemonToExclude = [], isMonotype = false, pokemonList) {
    const exclude = pokemonToExclude.map((p) => (0, import_dex.toID)(p.species));
    const pokemonPool = {};
    const baseSpeciesPool = [];
    for (const pokemon of pokemonList) {
      let species = this.dex.species.get(pokemon);
      if (exclude.includes(species.id))
        continue;
      if (isMonotype) {
        if (!species.types.includes(type))
          continue;
        if (typeof species.battleOnly === "string") {
          species = this.dex.species.get(species.battleOnly);
          if (!species.types.includes(type))
            continue;
        }
      }
      if (species.baseSpecies in pokemonPool) {
        pokemonPool[species.baseSpecies].push(pokemon);
      } else {
        pokemonPool[species.baseSpecies] = [pokemon];
      }
    }
    for (const baseSpecies of Object.keys(pokemonPool)) {
      const weight = baseSpecies === "Squawkabilly" ? 1 : Math.min(Math.ceil(pokemonPool[baseSpecies].length / 3), 3);
      for (let i = 0; i < weight; i++)
        baseSpeciesPool.push(baseSpecies);
    }
    return [pokemonPool, baseSpeciesPool];
  }
  randomTeam() {
    this.enforceNoDirectCustomBanlistChanges();
    const seed = this.prng.seed;
    const ruleTable = this.dex.formats.getRuleTable(this.format);
    const pokemon = [];
    const isMonotype = !!this.forceMonotype || ruleTable.has("sametypeclause");
    const isDoubles = this.format.gameType !== "singles";
    const typePool = this.dex.types.names();
    const type = this.forceMonotype || this.sample(typePool);
    const usePotD = global.Config && Config.potd && ruleTable.has("potd");
    const potd = usePotD ? this.dex.species.get(Config.potd) : null;
    const baseFormes = {};
    const typeCount = {};
    const typeComboCount = {};
    const typeWeaknesses = {};
    const teamDetails = {};
    let numMaxLevelPokemon = 0;
    const pokemonList = [];
    for (const poke of Object.keys(this.randomData)) {
      if (isDoubles && this.randomData[poke]?.doublesMoves || !isDoubles && this.randomData[poke]?.moves) {
        pokemonList.push(poke);
      }
    }
    const [pokemonPool, baseSpeciesPool] = this.getPokemonPool(type, pokemon, isMonotype, pokemonList);
    while (baseSpeciesPool.length && pokemon.length < this.maxTeamSize) {
      const baseSpecies = this.sampleNoReplace(baseSpeciesPool);
      let species = this.dex.species.get(this.sample(pokemonPool[baseSpecies]));
      if (!species.exists)
        continue;
      if (baseFormes[species.baseSpecies])
        continue;
      if (species.name === "Zoroark" && pokemon.length >= this.maxTeamSize - 1)
        continue;
      if (pokemon.some((pkmn) => pkmn.name === "Zoroark") && pokemon.length >= this.maxTeamSize - 1 && ["Zacian", "Zacian-Crowned", "Zamazenta", "Zamazenta-Crowned", "Eternatus"].includes(species.name)) {
        continue;
      }
      const types = species.types;
      const typeCombo = types.slice().sort().join();
      const weakToFreezeDry = this.dex.getEffectiveness("Ice", species) > 0 || this.dex.getEffectiveness("Ice", species) > -2 && types.includes("Water");
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
        if (weakToFreezeDry) {
          if (!typeWeaknesses["Freeze-Dry"])
            typeWeaknesses["Freeze-Dry"] = 0;
          if (typeWeaknesses["Freeze-Dry"] >= 4 * limitFactor)
            continue;
        }
        if (!this.adjustLevel && numMaxLevelPokemon >= limitFactor && this.getLevel(species, isDoubles, this.dex.formats.getRuleTable(this.format).has("dynamaxclause")) === 100)
          continue;
      }
      if (!this.forceMonotype && isMonotype && typeComboCount[typeCombo] >= 3 * limitFactor)
        continue;
      if (potd?.exists && (pokemon.length === 1 || this.maxTeamSize === 1))
        species = potd;
      const set = this.randomSet(
        species,
        teamDetails,
        pokemon.length === 0,
        isDoubles,
        this.dex.formats.getRuleTable(this.format).has("dynamaxclause")
      );
      pokemon.push(set);
      if (pokemon.length === this.maxTeamSize)
        break;
      baseFormes[species.baseSpecies] = 1;
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
      if (weakToFreezeDry)
        typeWeaknesses["Freeze-Dry"]++;
      if (set.level === 100)
        numMaxLevelPokemon++;
      if (set.ability === "Drizzle" || set.moves.includes("raindance"))
        teamDetails.rain = 1;
      if (set.ability === "Drought" || set.moves.includes("sunnyday"))
        teamDetails.sun = 1;
      if (set.ability === "Sand Stream")
        teamDetails.sand = 1;
      if (set.ability === "Snow Warning")
        teamDetails.hail = 1;
      if (set.moves.includes("spikes"))
        teamDetails.spikes = (teamDetails.spikes || 0) + 1;
      if (set.moves.includes("stealthrock"))
        teamDetails.stealthRock = 1;
      if (set.moves.includes("stickyweb"))
        teamDetails.stickyWeb = 1;
      if (set.moves.includes("toxicspikes"))
        teamDetails.toxicSpikes = 1;
      if (set.moves.includes("defog"))
        teamDetails.defog = 1;
      if (set.moves.includes("rapidspin"))
        teamDetails.rapidSpin = 1;
      if (set.moves.includes("auroraveil") || set.moves.includes("reflect") && set.moves.includes("lightscreen")) {
        teamDetails.screens = 1;
      }
    }
    if (pokemon.length < this.maxTeamSize && pokemon.length < 12) {
      throw new Error(`Could not build a random team for ${this.format} (seed=${seed})`);
    }
    return pokemon;
  }
  randomCAP1v1Team() {
    this.enforceNoDirectCustomBanlistChanges();
    const pokemon = [];
    const pokemonPool = Object.keys(this.randomCAP1v1Sets);
    while (pokemonPool.length && pokemon.length < this.maxTeamSize) {
      const species = this.dex.species.get(this.sampleNoReplace(pokemonPool));
      if (!species.exists)
        throw new Error(`Invalid Pokemon "${species}" in ${this.format}`);
      if (this.forceMonotype && !species.types.includes(this.forceMonotype))
        continue;
      const setData = this.sample(this.randomCAP1v1Sets[species.name]);
      const set = {
        name: species.baseSpecies,
        species: species.name,
        gender: species.gender,
        item: this.sampleIfArray(setData.item) || "",
        ability: this.sampleIfArray(setData.ability),
        shiny: this.randomChance(1, 1024),
        level: this.adjustLevel || 100,
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, ...setData.evs },
        nature: setData.nature,
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31, ...setData.ivs || {} },
        moves: setData.moves.map((move) => this.sampleIfArray(move))
      };
      if (this.adjustLevel)
        set.level = this.adjustLevel;
      pokemon.push(set);
    }
    return pokemon;
  }
  randomFactorySet(species, teamData, tier) {
    const id = (0, import_dex.toID)(species.name);
    const setList = this.randomFactorySets[tier][id].sets;
    const itemsMax = {
      choicespecs: 1,
      choiceband: 1,
      choicescarf: 1
    };
    const movesMax = {
      rapidspin: 1,
      batonpass: 1,
      stealthrock: 1,
      defog: 1,
      spikes: 1,
      toxicspikes: 1
    };
    const requiredMoves = {
      stealthrock: "hazardSet",
      rapidspin: "hazardClear",
      defog: "hazardClear"
    };
    const weatherAbilities = ["drizzle", "drought", "snowwarning", "sandstream"];
    let effectivePool = [];
    const priorityPool = [];
    for (const curSet of setList) {
      const allowedItems = [];
      for (const itemString of curSet.item) {
        const item2 = this.dex.items.get(itemString);
        if (itemsMax[item2.id] && teamData.has[item2.id] >= itemsMax[item2.id])
          continue;
        allowedItems.push(itemString);
      }
      if (allowedItems.length === 0)
        continue;
      const curSetItem = this.sample(allowedItems);
      const allowedAbilities = [];
      for (const abilityString of curSet.ability) {
        const ability2 = this.dex.abilities.get(abilityString);
        if (teamData.weather && weatherAbilities.includes(ability2.id))
          continue;
        allowedAbilities.push(abilityString);
      }
      if (allowedAbilities.length === 0)
        continue;
      const curSetAbility = this.sample(allowedAbilities);
      let reject = false;
      let hasRequiredMove = false;
      const curSetVariants = [];
      for (const move of curSet.moves) {
        const variantIndex = this.random(move.length);
        const moveId = (0, import_dex.toID)(move[variantIndex]);
        if (movesMax[moveId] && teamData.has[moveId] >= movesMax[moveId]) {
          reject = true;
          break;
        }
        if (requiredMoves[moveId] && !teamData.has[requiredMoves[moveId]]) {
          hasRequiredMove = true;
        }
        curSetVariants.push(variantIndex);
      }
      if (reject)
        continue;
      const fullSetSpec = { set: curSet, moveVariants: curSetVariants, item: curSetItem, ability: curSetAbility };
      effectivePool.push(fullSetSpec);
      if (hasRequiredMove)
        priorityPool.push(fullSetSpec);
    }
    if (priorityPool.length)
      effectivePool = priorityPool;
    if (!effectivePool.length) {
      if (!teamData.forceResult)
        return null;
      for (const curSet of setList) {
        effectivePool.push({ set: curSet });
      }
    }
    const setData = this.sample(effectivePool);
    const moves = [];
    for (const [i, moveSlot] of setData.set.moves.entries()) {
      moves.push(setData.moveVariants ? moveSlot[setData.moveVariants[i]] : this.sample(moveSlot));
    }
    const item = setData.item || this.sampleIfArray(setData.set.item);
    const ability = setData.ability || this.sampleIfArray(setData.set.ability);
    const nature = this.sampleIfArray(setData.set.nature);
    const level = this.adjustLevel || setData.set.level || (tier === "LC" ? 5 : 100);
    return {
      name: setData.set.name || species.baseSpecies,
      species: setData.set.species,
      gender: setData.set.gender || species.gender || (this.randomChance(1, 2) ? "M" : "F"),
      item: item || "",
      ability: ability || species.abilities["0"],
      shiny: typeof setData.set.shiny === "undefined" ? this.randomChance(1, 1024) : setData.set.shiny,
      level,
      happiness: typeof setData.set.happiness === "undefined" ? 255 : setData.set.happiness,
      evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, ...setData.set.evs },
      ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31, ...setData.set.ivs },
      nature: nature || "Serious",
      moves
    };
  }
  randomFactoryTeam(side, depth = 0) {
    this.enforceNoDirectCustomBanlistChanges();
    const forceResult = depth >= 12;
    if (!this.factoryTier) {
      this.factoryTier = this.sample(["Uber", "OU", "UU", "RU", "NU", "PU", "LC"]);
    }
    const tierValues = {
      Uber: 5,
      OU: 4,
      UUBL: 4,
      UU: 3,
      RUBL: 3,
      RU: 2,
      NUBL: 2,
      NU: 1,
      PUBL: 1,
      PU: 0
    };
    const pokemon = [];
    const pokemonPool = Object.keys(this.randomFactorySets[this.factoryTier]);
    const teamData = {
      typeCount: {},
      typeComboCount: {},
      baseFormes: {},
      has: {},
      forceResult,
      weaknesses: {},
      resistances: {}
    };
    const requiredMoveFamilies = ["hazardSet", "hazardClear"];
    const requiredMoves = {
      stealthrock: "hazardSet",
      rapidspin: "hazardClear",
      defog: "hazardClear"
    };
    const weatherAbilitiesSet = {
      drizzle: "raindance",
      drought: "sunnyday",
      snowwarning: "hail",
      sandstream: "sandstorm"
    };
    const resistanceAbilities = {
      dryskin: ["Water"],
      waterabsorb: ["Water"],
      stormdrain: ["Water"],
      flashfire: ["Fire"],
      heatproof: ["Fire"],
      lightningrod: ["Electric"],
      motordrive: ["Electric"],
      voltabsorb: ["Electric"],
      sapsipper: ["Grass"],
      thickfat: ["Ice", "Fire"],
      levitate: ["Ground"]
    };
    while (pokemonPool.length && pokemon.length < this.maxTeamSize) {
      const species = this.dex.species.get(this.sampleNoReplace(pokemonPool));
      if (!species.exists)
        continue;
      if (this.factoryTier in tierValues && species.tier in tierValues && tierValues[species.tier] > tierValues[this.factoryTier])
        continue;
      if (teamData.baseFormes[species.baseSpecies])
        continue;
      const set = this.randomFactorySet(species, teamData, this.factoryTier);
      if (!set)
        continue;
      const itemData = this.dex.items.get(set.item);
      const types = species.types;
      const limitFactor = Math.round(this.maxTeamSize / 6) || 1;
      {
        let skip = false;
        for (const typeName of types) {
          if (teamData.typeCount[typeName] >= 2 * limitFactor && this.randomChance(4, 5)) {
            skip = true;
            break;
          }
        }
        if (skip)
          continue;
        let typeCombo2 = types.slice().sort().join();
        if (set.ability + "" === "Drought" || set.ability + "" === "Drizzle") {
          typeCombo2 = set.ability + "";
        }
        if (teamData.typeComboCount[typeCombo2] >= 1 * limitFactor)
          continue;
      }
      pokemon.push(set);
      const typeCombo = types.slice().sort().join();
      for (const typeName of types) {
        if (typeName in teamData.typeCount) {
          teamData.typeCount[typeName]++;
        } else {
          teamData.typeCount[typeName] = 1;
        }
      }
      teamData.typeComboCount[typeCombo] = teamData.typeComboCount[typeCombo] + 1 || 1;
      teamData.baseFormes[species.baseSpecies] = 1;
      if (itemData.id in teamData.has) {
        teamData.has[itemData.id]++;
      } else {
        teamData.has[itemData.id] = 1;
      }
      const abilityState = this.dex.abilities.get(set.ability);
      if (abilityState.id in weatherAbilitiesSet) {
        teamData.weather = weatherAbilitiesSet[abilityState.id];
      }
      for (const move of set.moves) {
        const moveId = (0, import_dex.toID)(move);
        if (moveId in teamData.has) {
          teamData.has[moveId]++;
        } else {
          teamData.has[moveId] = 1;
        }
        if (moveId in requiredMoves) {
          teamData.has[requiredMoves[moveId]] = 1;
        }
      }
      for (const typeName of this.dex.types.names()) {
        if (teamData.resistances[typeName] >= 1)
          continue;
        if (resistanceAbilities[abilityState.id]?.includes(typeName) || !this.dex.getImmunity(typeName, types)) {
          teamData.resistances[typeName] = (teamData.resistances[typeName] || 0) + 1;
          if (teamData.resistances[typeName] >= 1)
            teamData.weaknesses[typeName] = 0;
          continue;
        }
        const typeMod = this.dex.getEffectiveness(typeName, types);
        if (typeMod < 0) {
          teamData.resistances[typeName] = (teamData.resistances[typeName] || 0) + 1;
          if (teamData.resistances[typeName] >= 1)
            teamData.weaknesses[typeName] = 0;
        } else if (typeMod > 0) {
          teamData.weaknesses[typeName] = (teamData.weaknesses[typeName] || 0) + 1;
        }
      }
    }
    if (pokemon.length < this.maxTeamSize)
      return this.randomFactoryTeam(side, ++depth);
    if (!teamData.forceResult) {
      for (const requiredFamily of requiredMoveFamilies) {
        if (!teamData.has[requiredFamily])
          return this.randomFactoryTeam(side, ++depth);
      }
      for (const typeName in teamData.weaknesses) {
        if (teamData.weaknesses[typeName] >= 3)
          return this.randomFactoryTeam(side, ++depth);
      }
    }
    return pokemon;
  }
  randomBSSFactorySet(species, teamData) {
    const id = (0, import_dex.toID)(species.name);
    const setList = this.randomBSSFactorySets[id].sets;
    const movesMax = {
      batonpass: 1,
      stealthrock: 1,
      toxicspikes: 1,
      trickroom: 1,
      auroraveil: 1
    };
    const requiredMoves = {};
    let effectivePool = [];
    const priorityPool = [];
    for (const curSet of setList) {
      let reject = false;
      let hasRequiredMove = false;
      const curSetMoveVariants = [];
      for (const move of curSet.moves) {
        const variantIndex = this.random(move.length);
        const moveId = (0, import_dex.toID)(move[variantIndex]);
        if (movesMax[moveId] && teamData.has[moveId] >= movesMax[moveId]) {
          reject = true;
          break;
        }
        if (requiredMoves[moveId] && !teamData.has[requiredMoves[moveId]]) {
          hasRequiredMove = true;
        }
        curSetMoveVariants.push(variantIndex);
      }
      if (reject)
        continue;
      const set = { set: curSet, moveVariants: curSetMoveVariants };
      effectivePool.push(set);
      if (hasRequiredMove)
        priorityPool.push(set);
    }
    if (priorityPool.length)
      effectivePool = priorityPool;
    if (!effectivePool.length) {
      if (!teamData.forceResult)
        return null;
      for (const curSet of setList) {
        effectivePool.push({ set: curSet });
      }
    }
    const setData = this.sample(effectivePool);
    const moves = [];
    for (const [i, moveSlot] of setData.set.moves.entries()) {
      moves.push(setData.moveVariants ? moveSlot[setData.moveVariants[i]] : this.sample(moveSlot));
    }
    const setDataAbility = this.sampleIfArray(setData.set.ability);
    return {
      name: setData.set.nickname || setData.set.name || species.baseSpecies,
      species: setData.set.species,
      gigantamax: setData.set.gigantamax,
      gender: setData.set.gender || species.gender || (this.randomChance(1, 2) ? "M" : "F"),
      item: this.sampleIfArray(setData.set.item) || "",
      ability: setDataAbility || species.abilities["0"],
      shiny: typeof setData.set.shiny === "undefined" ? this.randomChance(1, 1024) : setData.set.shiny,
      level: setData.set.level || 50,
      happiness: typeof setData.set.happiness === "undefined" ? 255 : setData.set.happiness,
      evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, ...setData.set.evs },
      ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31, ...setData.set.ivs },
      nature: setData.set.nature || "Serious",
      moves
    };
  }
  randomBSSFactoryTeam(side, depth = 0) {
    this.enforceNoDirectCustomBanlistChanges();
    const forceResult = depth >= 4;
    const pokemon = [];
    const pokemonPool = Object.keys(this.randomBSSFactorySets);
    const teamData = {
      typeCount: {},
      typeComboCount: {},
      baseFormes: {},
      has: {},
      forceResult,
      weaknesses: {},
      resistances: {}
    };
    const weatherAbilitiesSet = {
      drizzle: "raindance",
      drought: "sunnyday",
      snowwarning: "hail",
      sandstream: "sandstorm"
    };
    const resistanceAbilities = {
      waterabsorb: ["Water"],
      flashfire: ["Fire"],
      lightningrod: ["Electric"],
      voltabsorb: ["Electric"],
      thickfat: ["Ice", "Fire"],
      levitate: ["Ground"]
    };
    const limitFactor = Math.ceil(this.maxTeamSize / 6);
    const shuffledSpecies = [];
    for (const speciesName of pokemonPool) {
      const sortObject = {
        speciesName,
        score: Math.pow(this.prng.next(), 1 / this.randomBSSFactorySets[speciesName].usage)
      };
      shuffledSpecies.push(sortObject);
    }
    shuffledSpecies.sort((a, b) => a.score - b.score);
    while (shuffledSpecies.length && pokemon.length < this.maxTeamSize) {
      const specie = shuffledSpecies.pop().speciesName;
      const species = this.dex.species.get(specie);
      if (!species.exists)
        continue;
      if (this.forceMonotype && !species.types.includes(this.forceMonotype))
        continue;
      if (teamData.baseFormes[species.baseSpecies])
        continue;
      const types = species.types;
      let skip = false;
      if (!this.forceMonotype) {
        for (const type of types) {
          if (teamData.typeCount[type] >= 2 * limitFactor && this.randomChance(4, 5)) {
            skip = true;
            break;
          }
        }
      }
      if (skip)
        continue;
      const set = this.randomBSSFactorySet(species, teamData);
      if (!set)
        continue;
      let typeCombo = types.slice().sort().join();
      if (set.ability === "Drought" || set.ability === "Drizzle") {
        typeCombo = set.ability;
      }
      if (!this.forceMonotype && teamData.typeComboCount[typeCombo] >= limitFactor)
        continue;
      const itemData = this.dex.items.get(set.item);
      if (teamData.has[itemData.id])
        continue;
      pokemon.push(set);
      for (const type of types) {
        if (type in teamData.typeCount) {
          teamData.typeCount[type]++;
        } else {
          teamData.typeCount[type] = 1;
        }
      }
      if (typeCombo in teamData.typeComboCount) {
        teamData.typeComboCount[typeCombo]++;
      } else {
        teamData.typeComboCount[typeCombo] = 1;
      }
      teamData.baseFormes[species.baseSpecies] = 1;
      teamData.has[itemData.id] = 1;
      const abilityState = this.dex.abilities.get(set.ability);
      if (abilityState.id in weatherAbilitiesSet) {
        teamData.weather = weatherAbilitiesSet[abilityState.id];
      }
      for (const move of set.moves) {
        const moveId = (0, import_dex.toID)(move);
        if (moveId in teamData.has) {
          teamData.has[moveId]++;
        } else {
          teamData.has[moveId] = 1;
        }
      }
      for (const typeName of this.dex.types.names()) {
        if (teamData.resistances[typeName] >= 1)
          continue;
        if (resistanceAbilities[abilityState.id]?.includes(typeName) || !this.dex.getImmunity(typeName, types)) {
          teamData.resistances[typeName] = (teamData.resistances[typeName] || 0) + 1;
          if (teamData.resistances[typeName] >= 1)
            teamData.weaknesses[typeName] = 0;
          continue;
        }
        const typeMod = this.dex.getEffectiveness(typeName, types);
        if (typeMod < 0) {
          teamData.resistances[typeName] = (teamData.resistances[typeName] || 0) + 1;
          if (teamData.resistances[typeName] >= 1)
            teamData.weaknesses[typeName] = 0;
        } else if (typeMod > 0) {
          teamData.weaknesses[typeName] = (teamData.weaknesses[typeName] || 0) + 1;
        }
      }
    }
    if (!teamData.forceResult && pokemon.length < this.maxTeamSize)
      return this.randomBSSFactoryTeam(side, ++depth);
    if (!teamData.forceResult && !this.forceMonotype) {
      for (const type in teamData.weaknesses) {
        if (teamData.weaknesses[type] >= 3 * limitFactor)
          return this.randomBSSFactoryTeam(side, ++depth);
      }
    }
    return pokemon;
  }
}
var random_teams_default = RandomGen8Teams;
//# sourceMappingURL=random-teams.js.map
