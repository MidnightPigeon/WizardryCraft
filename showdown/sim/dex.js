"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var dex_exports = {};
__export(dex_exports, {
  Dex: () => Dex,
  ModdedDex: () => ModdedDex,
  default: () => dex_default,
  toID: () => toID
});
module.exports = __toCommonJS(dex_exports);
var Data = __toESM(require("./dex-data"));
var import_dex_conditions = require("./dex-conditions");
var import_dex_moves = require("./dex-moves");
var import_dex_items = require("./dex-items");
var import_dex_abilities = require("./dex-abilities");
var import_dex_species = require("./dex-species");
var import_dex_formats = require("./dex-formats");
var import_lib = require("../lib");
var CobblemonCache = __toESM(require("./cobblemon-cache"));
/**
 * Dex
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * Handles getting data about pokemon, items, etc. Also contains some useful
 * helper functions for using dex data.
 *
 * By default, nothing is loaded until you call Dex.mod(mod) or
 * Dex.forFormat(format).
 *
 * You may choose to preload some things:
 * - Dex.includeMods() ~10ms
 *   This will preload `Dex.dexes`, giving you a list of possible mods.
 * - Dex.includeFormats() ~30ms
 *   As above, but will also preload `Dex.formats.all()`.
 * - Dex.includeData() ~500ms
 *   As above, but will also preload all of Dex.data for Gen 8, so
 *   functions like `Dex.species.get`, etc will be instantly usable.
 * - Dex.includeModData() ~1500ms
 *   As above, but will also preload `Dex.dexes[...].data` for all mods.
 *
 * Note that preloading is never necessary. All the data will be
 * automatically preloaded when needed, preloading will just spend time
 * now so you don't need to spend time later.
 *
 * @license MIT
 */
const BASE_MOD = "gen9";
const DATA_PATH = "../data";
const DATA_DIR = DATA_PATH;
const MODS_DIR = DATA_PATH + "/mods";
const dexes = /* @__PURE__ */ Object.create(null);
const DATA_TYPES = [
  "Abilities",
  "Rulesets",
  "FormatsData",
  "Items",
  "Learnsets",
  "Moves",
  "Natures",
  "Pokedex",
  "Scripts",
  "Conditions",
  "TypeChart",
  "PokemonGoData"
];
const DATA_FILES = {
  Abilities: "abilities",
  Aliases: "aliases",
  Rulesets: "rulesets",
  FormatsData: "formats-data",
  Items: "items",
  Learnsets: "learnsets",
  Moves: "moves",
  Natures: "natures",
  Pokedex: "pokedex",
  PokemonGoData: "pokemongo",
  Scripts: "scripts",
  Conditions: "conditions",
  TypeChart: "typechart"
};
const toID = Data.toID;
class ModdedDex {
  constructor(mod = "base") {
    this.Data = Data;
    this.Condition = import_dex_conditions.Condition;
    this.Ability = import_dex_abilities.Ability;
    this.Item = import_dex_items.Item;
    this.Move = import_dex_moves.DataMove;
    this.Species = import_dex_species.Species;
    this.Format = import_dex_formats.Format;
    this.ModdedDex = ModdedDex;
    this.name = "[ModdedDex]";
    this.toID = Data.toID;
    this.gen = 0;
    this.parentMod = "";
    this.modsLoaded = false;
    this.deepClone = import_lib.Utils.deepClone;
    this.deepFreeze = import_lib.Utils.deepFreeze;
    this.isBase = mod === "base";
    this.currentMod = mod;
    this.dataDir = this.isBase ? DATA_DIR : MODS_DIR + "/" + this.currentMod;
    this.dataCache = null;
    this.textCache = null;
    this.formats = new import_dex_formats.DexFormats(this);
    this.abilities = new import_dex_abilities.DexAbilities(this);
    this.items = new import_dex_items.DexItems(this);
    this.moves = new import_dex_moves.DexMoves(this);
    this.species = new import_dex_species.DexSpecies(this);
    this.conditions = new import_dex_conditions.DexConditions(this);
    this.natures = new Data.DexNatures(this);
    this.types = new Data.DexTypes(this);
    this.stats = new Data.DexStats(this);
  }
  get data() {
    return this.loadData();
  }
  get dexes() {
    this.includeMods();
    return dexes;
  }
  mod(mod) {
    if (!dexes["base"].modsLoaded)
      dexes["base"].includeMods();
    return dexes[mod || "base"];
  }
  forGen(gen) {
    if (!gen)
      return this;
    return this.mod(`gen${gen}`);
  }
  forFormat(format) {
    if (!this.modsLoaded)
      this.includeMods();
    const mod = this.formats.get(format).mod;
    return dexes[mod || BASE_MOD].includeData();
  }
  modData(dataType, id) {
    if (this.isBase)
      return this.data[dataType][id];
    if (this.data[dataType][id] !== dexes[this.parentMod].data[dataType][id])
      return this.data[dataType][id];
    return this.data[dataType][id] = import_lib.Utils.deepClone(this.data[dataType][id]);
  }
  effectToString() {
    return this.name;
  }
  /**
   * Sanitizes a username or Pokemon nickname
   *
   * Returns the passed name, sanitized for safe use as a name in the PS
   * protocol.
   *
   * Such a string must uphold these guarantees:
   * - must not contain any ASCII whitespace character other than a space
   * - must not start or end with a space character
   * - must not contain any of: | , [ ]
   * - must not be the empty string
   * - must not contain Unicode RTL control characters
   *
   * If no such string can be found, returns the empty string. Calling
   * functions are expected to check for that condition and deal with it
   * accordingly.
   *
   * getName also enforces that there are not multiple consecutive space
   * characters in the name, although this is not strictly necessary for
   * safety.
   */
  getName(name) {
    if (typeof name !== "string" && typeof name !== "number")
      return "";
    name = ("" + name).replace(/[|\s[\],\u202e]+/g, " ").trim();
    if (name.length > 18)
      name = name.substr(0, 18).trim();
    name = name.replace(
      /[\u0300-\u036f\u0483-\u0489\u0610-\u0615\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06ED\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]{3,}/g,
      ""
    );
    name = name.replace(/[\u239b-\u23b9]/g, "");
    return name;
  }
  /**
   * Returns false if the target is immune; true otherwise.
   * Also checks immunity to some statuses.
   */
  getImmunity(source, target) {
    const sourceType = typeof source !== "string" ? source.type : source;
    const targetTyping = target.getTypes?.() || target.types || target;
    if (Array.isArray(targetTyping)) {
      for (const type of targetTyping) {
        if (!this.getImmunity(sourceType, type))
          return false;
      }
      return true;
    }
    const typeData = this.types.get(targetTyping);
    if (typeData && typeData.damageTaken[sourceType] === 3)
      return false;
    return true;
  }
  getEffectiveness(source, target) {
    const sourceType = typeof source !== "string" ? source.type : source;
    const targetTyping = target.getTypes?.() || target.types || target;
    let totalTypeMod = 0;
    if (Array.isArray(targetTyping)) {
      for (const type of targetTyping) {
        totalTypeMod += this.getEffectiveness(sourceType, type);
      }
      return totalTypeMod;
    }
    const typeData = this.types.get(targetTyping);
    if (!typeData)
      return 0;
    switch (typeData.damageTaken[sourceType]) {
      case 1:
        return 1;
      case 2:
        return -1;
      default:
        return 0;
    }
  }
  getDescs(table, id, dataEntry) {
    if (dataEntry.shortDesc) {
      return {
        desc: dataEntry.desc,
        shortDesc: dataEntry.shortDesc
      };
    }
    const entry = this.loadTextData()[table][id];
    if (!entry)
      return null;
    const descs = {
      desc: "",
      shortDesc: ""
    };
    for (let i = this.gen; i < dexes["base"].gen; i++) {
      const curDesc = entry[`gen${i}`]?.desc;
      const curShortDesc = entry[`gen${i}`]?.shortDesc;
      if (!descs.desc && curDesc) {
        descs.desc = curDesc;
      }
      if (!descs.shortDesc && curShortDesc) {
        descs.shortDesc = curShortDesc;
      }
      if (descs.desc && descs.shortDesc)
        break;
    }
    if (!descs.shortDesc)
      descs.shortDesc = entry.shortDesc || "";
    if (!descs.desc)
      descs.desc = entry.desc || descs.shortDesc;
    return descs;
  }
  /**
   * Ensure we're working on a copy of a move (and make a copy if we aren't)
   *
   * Remember: "ensure" - by default, it won't make a copy of a copy:
   *     moveCopy === Dex.getActiveMove(moveCopy)
   *
   * If you really want to, use:
   *     moveCopyCopy = Dex.getActiveMove(moveCopy.id)
   */
  getActiveMove(move) {
    if (move && typeof move.hit === "number")
      return move;
    move = this.moves.get(move);
    const moveCopy = this.deepClone(move);
    moveCopy.hit = 0;
    return moveCopy;
  }
  getHiddenPower(ivs) {
    const hpTypes = [
      "Fighting",
      "Flying",
      "Poison",
      "Ground",
      "Rock",
      "Bug",
      "Ghost",
      "Steel",
      "Fire",
      "Water",
      "Grass",
      "Electric",
      "Psychic",
      "Ice",
      "Dragon",
      "Dark"
    ];
    const tr = this.trunc;
    const stats = { hp: 31, atk: 31, def: 31, spe: 31, spa: 31, spd: 31 };
    if (this.gen <= 2) {
      const atkDV = tr(ivs.atk / 2);
      const defDV = tr(ivs.def / 2);
      const speDV = tr(ivs.spe / 2);
      const spcDV = tr(ivs.spa / 2);
      return {
        type: hpTypes[4 * (atkDV % 4) + defDV % 4],
        power: tr(
          (5 * ((spcDV >> 3) + 2 * (speDV >> 3) + 4 * (defDV >> 3) + 8 * (atkDV >> 3)) + spcDV % 4) / 2 + 31
        )
      };
    } else {
      let hpTypeX = 0;
      let hpPowerX = 0;
      let i = 1;
      for (const s in stats) {
        hpTypeX += i * (ivs[s] % 2);
        hpPowerX += i * (tr(ivs[s] / 2) % 2);
        i *= 2;
      }
      return {
        type: hpTypes[tr(hpTypeX * 15 / 63)],
        // After Gen 6, Hidden Power is always 60 base power
        power: this.gen && this.gen < 6 ? tr(hpPowerX * 40 / 63) + 30 : 60
      };
    }
  }
  /**
   * Truncate a number into an unsigned 32-bit integer, for
   * compatibility with the cartridge games' math systems.
   */
  trunc(num, bits = 0) {
    if (bits)
      return (num >>> 0) % 2 ** bits;
    return num >>> 0;
  }
  dataSearch(target, searchIn, isInexact) {
    if (!target)
      return null;
    searchIn = searchIn || ["Pokedex", "Moves", "Abilities", "Items", "Natures"];
    const searchObjects = {
      Pokedex: "species",
      Moves: "moves",
      Abilities: "abilities",
      Items: "items",
      Natures: "natures"
    };
    const searchTypes = {
      Pokedex: "pokemon",
      Moves: "move",
      Abilities: "ability",
      Items: "item",
      Natures: "nature"
    };
    let searchResults = [];
    for (const table of searchIn) {
      const res = this[searchObjects[table]].get(target);
      if (res.exists && res.gen <= this.gen) {
        searchResults.push({
          isInexact,
          searchType: searchTypes[table],
          name: res.name
        });
      }
    }
    if (searchResults.length)
      return searchResults;
    if (isInexact)
      return null;
    const cmpTarget = toID(target);
    let maxLd = 3;
    if (cmpTarget.length <= 1) {
      return null;
    } else if (cmpTarget.length <= 4) {
      maxLd = 1;
    } else if (cmpTarget.length <= 6) {
      maxLd = 2;
    }
    searchResults = null;
    for (const table of [...searchIn, "Aliases"]) {
      const searchObj = this.data[table];
      if (!searchObj)
        continue;
      for (const j in searchObj) {
        const ld = import_lib.Utils.levenshtein(cmpTarget, j, maxLd);
        if (ld <= maxLd) {
          const word = searchObj[j].name || searchObj[j].species || j;
          const results = this.dataSearch(word, searchIn, word);
          if (results) {
            searchResults = results;
            maxLd = ld;
          }
        }
      }
    }
    return searchResults;
  }
  loadDataFile(basePath, dataType) {
    try {
      const filePath = basePath + DATA_FILES[dataType];
      const dataObject = require(filePath);
      if (!dataObject || typeof dataObject !== "object") {
        throw new TypeError(`${filePath}, if it exists, must export a non-null object`);
      }
      if (dataObject[dataType]?.constructor?.name !== "Object") {
        throw new TypeError(`${filePath}, if it exists, must export an object whose '${dataType}' property is an Object`);
      }
      return dataObject[dataType];
    } catch (e) {
    }
    return {};
  }
  loadTextFile(name, exportName) {
    return require(`${DATA_DIR}/text/${name}`)[exportName];
  }
  includeMods() {
    const all_mods = [
      "fullpotential",
      "gen1",
      "gen1jpn",
      "gen1stadium",
      "gen2",
      "gen2stadium2",
      "gen3",
      "gen4",
      "gen4pt",
      "gen5",
      "gen5bw1",
      "gen6",
      "gen6xy",
      "gen7",
      "gen7letsgo",
      "gen7pokebilities",
      "gen7sm",
      "gen8",
      "gen8bdsp",
      "gen8dlc1",
      "gen8linked",
      "gen9dlc1",
      "gen9predlc",
      "gennext",
      "mixandmega",
      "moderngen1",
      "partnersincrime",
      "pokebilities",
      "potd",
      "randomroulette",
      "sharedpower",
      "sharingiscaring",
      "ssb",
      "thecardgame",
      "trademarked",
      "vaporemons",
      CobblemonCache.MOD_ID
    ];
    if (!this.isBase)
      throw new Error(`This must be called on the base Dex`);
    if (this.modsLoaded)
      return this;
    for (let mod of all_mods) {
      dexes[mod] = new ModdedDex(mod);
    }
    this.modsLoaded = true;
    return this;
  }
  includeModData() {
    for (const mod in this.dexes) {
      dexes[mod].includeData();
    }
    return this;
  }
  includeData() {
    this.loadData();
    return this;
  }
  loadTextData() {
    if (dexes["base"].textCache)
      return dexes["base"].textCache;
    dexes["base"].textCache = {
      Pokedex: this.loadTextFile("pokedex", "PokedexText"),
      Moves: this.loadTextFile("moves", "MovesText"),
      Abilities: this.loadTextFile("abilities", "AbilitiesText"),
      Items: this.loadTextFile("items", "ItemsText"),
      Default: this.loadTextFile("default", "DefaultText")
    };
    return dexes["base"].textCache;
  }
  loadData() {
    if (this.dataCache)
      return this.dataCache;
    dexes["base"].includeMods();
    const dataCache = {};
    const basePath = this.dataDir + "/";
    const Scripts = this.loadDataFile(basePath, "Scripts");
    this.parentMod = this.isBase ? "" : Scripts.inherit || "base";
    let parentDex;
    if (this.parentMod) {
      parentDex = dexes[this.parentMod];
      if (!parentDex || parentDex === this) {
        throw new Error(
          `Unable to load ${this.currentMod}. 'inherit' in scripts.ts should specify a parent mod from which to inherit data, or must be not specified.`
        );
      }
    }
    if (!parentDex) {
      this.includeFormats();
    }
    for (const dataType of DATA_TYPES.concat("Aliases")) {
      const BattleData = this.loadDataFile(basePath, dataType);
      if (BattleData !== dataCache[dataType])
        dataCache[dataType] = Object.assign(BattleData, dataCache[dataType]);
      if (dataType === "Rulesets" && !parentDex) {
        for (const format of this.formats.all()) {
          BattleData[format.id] = { ...format, ruleTable: null };
        }
      }
    }
    if (parentDex) {
      for (const dataType of DATA_TYPES) {
        const parentTypedData = parentDex.data[dataType];
        const childTypedData = dataCache[dataType] || (dataCache[dataType] = {});
        for (const entryId in parentTypedData) {
          if (childTypedData[entryId] === null) {
            delete childTypedData[entryId];
          } else if (!(entryId in childTypedData)) {
            if (dataType === "Pokedex") {
              childTypedData[entryId] = this.deepClone(parentTypedData[entryId]);
            } else {
              childTypedData[entryId] = parentTypedData[entryId];
            }
          } else if (childTypedData[entryId] && childTypedData[entryId].inherit) {
            delete childTypedData[entryId].inherit;
            for (const key in parentTypedData[entryId]) {
              if (key in childTypedData[entryId])
                continue;
              childTypedData[entryId][key] = parentTypedData[entryId][key];
            }
          }
        }
      }
      dataCache["Aliases"] = parentDex.data["Aliases"];
    }
    this.gen = dataCache.Scripts.gen;
    if (!this.gen)
      throw new Error(`Mod ${this.currentMod} needs a generation number in scripts.js`);
    this.dataCache = dataCache;
    if (Scripts.init)
      Scripts.init.call(this);
    return this.dataCache;
  }
  includeFormats() {
    this.formats.load();
    return this;
  }
}
dexes["base"] = new ModdedDex();
dexes[BASE_MOD] = dexes["base"];
const Dex = dexes["base"];
var dex_default = Dex;
//# sourceMappingURL=dex.js.map
