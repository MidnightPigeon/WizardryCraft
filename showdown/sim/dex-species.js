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
var dex_species_exports = {};
__export(dex_species_exports, {
  DexSpecies: () => DexSpecies,
  Learnset: () => Learnset,
  Species: () => Species
});
module.exports = __toCommonJS(dex_species_exports);
var import_dex_data = require("./dex-data");
var CobblemonCache = __toESM(require("./cobblemon-cache"));
class Species extends import_dex_data.BasicEffect {
  constructor(data) {
    super(data);
    data = this;
    this.fullname = `pokemon: ${data.name}`;
    this.effectType = "Pokemon";
    this.baseSpecies = data.baseSpecies || this.name;
    this.forme = data.forme || "";
    this.baseForme = data.baseForme || "";
    this.cosmeticFormes = data.cosmeticFormes || void 0;
    this.otherFormes = data.otherFormes || void 0;
    this.formeOrder = data.formeOrder || void 0;
    this.spriteid = data.spriteid || (0, import_dex_data.toID)(this.baseSpecies) + (this.baseSpecies !== this.name ? `-${(0, import_dex_data.toID)(this.forme)}` : "");
    this.abilities = data.abilities || { 0: "" };
    this.types = data.types || ["???"];
    this.addedType = data.addedType || void 0;
    this.prevo = data.prevo || "";
    this.tier = data.tier || "";
    this.doublesTier = data.doublesTier || "";
    this.natDexTier = data.natDexTier || "";
    this.evos = data.evos || [];
    this.evoType = data.evoType || void 0;
    this.evoMove = data.evoMove || void 0;
    this.evoLevel = data.evoLevel || void 0;
    this.nfe = data.nfe || false;
    this.eggGroups = data.eggGroups || [];
    this.canHatch = data.canHatch || false;
    this.gender = data.gender || "";
    this.genderRatio = data.genderRatio || (this.gender === "M" ? { M: 1, F: 0 } : this.gender === "F" ? { M: 0, F: 1 } : this.gender === "N" ? { M: 0, F: 0 } : { M: 0.5, F: 0.5 });
    this.requiredItem = data.requiredItem || void 0;
    this.requiredItems = this.requiredItems || (this.requiredItem ? [this.requiredItem] : void 0);
    this.baseStats = data.baseStats || { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    this.bst = this.baseStats.hp + this.baseStats.atk + this.baseStats.def + this.baseStats.spa + this.baseStats.spd + this.baseStats.spe;
    this.weightkg = data.weightkg || 0;
    this.weighthg = this.weightkg * 10;
    this.heightm = data.heightm || 0;
    this.color = data.color || "";
    this.tags = data.tags || [];
    this.unreleasedHidden = data.unreleasedHidden || false;
    this.maleOnlyHidden = !!data.maleOnlyHidden;
    this.maxHP = data.maxHP || void 0;
    this.isMega = !!(this.forme && ["Mega", "Mega-X", "Mega-Y"].includes(this.forme)) || void 0;
    this.canGigantamax = data.canGigantamax || void 0;
    this.gmaxUnreleased = !!data.gmaxUnreleased;
    this.cannotDynamax = !!data.cannotDynamax;
    this.battleOnly = data.battleOnly || (this.isMega ? this.baseSpecies : void 0);
    this.changesFrom = data.changesFrom || (this.battleOnly !== this.baseSpecies ? this.battleOnly : this.baseSpecies);
    this.pokemonGoData = data.pokemonGoData || void 0;
    if (Array.isArray(data.changesFrom))
      this.changesFrom = data.changesFrom[0];
    if (!this.gen && this.num >= 1) {
      if (this.num >= 906 || this.forme.includes("Paldea")) {
        this.gen = 9;
      } else if (this.num >= 810 || ["Gmax", "Galar", "Galar-Zen", "Hisui"].includes(this.forme)) {
        this.gen = 8;
      } else if (this.num >= 722 || this.forme.startsWith("Alola") || this.forme === "Starter") {
        this.gen = 7;
      } else if (this.forme === "Primal") {
        this.gen = 6;
        this.isPrimal = true;
        this.battleOnly = this.baseSpecies;
      } else if (this.num >= 650 || this.isMega) {
        this.gen = 6;
      } else if (this.num >= 494) {
        this.gen = 5;
      } else if (this.num >= 387) {
        this.gen = 4;
      } else if (this.num >= 252) {
        this.gen = 3;
      } else if (this.num >= 152) {
        this.gen = 2;
      } else {
        this.gen = 1;
      }
    }
  }
}
class Learnset {
  constructor(data, species) {
    this.exists = true;
    this.effectType = "Learnset";
    this.learnset = data.learnset || void 0;
    this.eventOnly = !!data.eventOnly;
    this.eventData = data.eventData || void 0;
    this.encounters = data.encounters || void 0;
    this.species = species;
  }
}
class DexSpecies {
  constructor(dex) {
    this.speciesCache = /* @__PURE__ */ new Map();
    this.learnsetCache = /* @__PURE__ */ new Map();
    this.allCache = null;
    this.dex = dex;
  }
  get(name) {
    if (name && typeof name !== "string")
      return name;
    name = (name || "").trim();
    let id = (0, import_dex_data.toID)(name);
    if (id === "nidoran" && name.endsWith("\u2640")) {
      id = "nidoranf";
    } else if (id === "nidoran" && name.endsWith("\u2642")) {
      id = "nidoranm";
    }
    return this.getByID(id);
  }
  getByID(id) {
    let species = this.dex.currentMod === CobblemonCache.MOD_ID ? CobblemonCache.speciesByID(id) : this.speciesCache.get(id);
    if (species)
      return species;
    if (this.dex.data.Aliases.hasOwnProperty(id)) {
      if (this.dex.data.FormatsData.hasOwnProperty(id)) {
        const baseId = (0, import_dex_data.toID)(this.dex.data.Aliases[id]);
        species = new Species({
          ...this.dex.data.Pokedex[baseId],
          ...this.dex.data.FormatsData[id],
          name: id
        });
        species.abilities = { 0: species.abilities["S"] };
      } else {
        species = this.get(this.dex.data.Aliases[id]);
        if (species.cosmeticFormes) {
          for (const forme of species.cosmeticFormes) {
            if ((0, import_dex_data.toID)(forme) === id) {
              species = new Species({
                ...species,
                name: forme,
                forme: forme.slice(species.name.length + 1),
                baseForme: "",
                baseSpecies: species.name,
                otherFormes: null,
                cosmeticFormes: null
              });
              break;
            }
          }
        }
      }
      this.speciesCache.set(id, this.dex.deepFreeze(species));
      return species;
    }
    if (!this.dex.data.Pokedex.hasOwnProperty(id)) {
      let aliasTo = "";
      const formeNames = {
        alola: ["a", "alola", "alolan"],
        galar: ["g", "galar", "galarian"],
        hisui: ["h", "hisui", "hisuian"],
        paldea: ["p", "paldea", "paldean"],
        mega: ["m", "mega"],
        primal: ["p", "primal"]
      };
      for (const forme in formeNames) {
        let pokeName = "";
        for (const i of formeNames[forme]) {
          if (id.startsWith(i)) {
            pokeName = id.slice(i.length);
          } else if (id.endsWith(i)) {
            pokeName = id.slice(0, -i.length);
          }
        }
        if (this.dex.data.Aliases.hasOwnProperty(pokeName))
          pokeName = (0, import_dex_data.toID)(this.dex.data.Aliases[pokeName]);
        if (this.dex.data.Pokedex[pokeName + forme]) {
          aliasTo = pokeName + forme;
          break;
        }
      }
      if (aliasTo) {
        species = this.get(aliasTo);
        if (species.exists) {
          this.speciesCache.set(id, species);
          return species;
        }
      }
    }
    if (id && this.dex.data.Pokedex.hasOwnProperty(id)) {
      const pokedexData = this.dex.data.Pokedex[id];
      const baseSpeciesTags = pokedexData.baseSpecies && this.dex.data.Pokedex[(0, import_dex_data.toID)(pokedexData.baseSpecies)].tags;
      species = new Species({
        tags: baseSpeciesTags,
        ...pokedexData,
        ...this.dex.data.FormatsData[id]
      });
      const baseSpeciesStatuses = this.dex.data.Conditions[(0, import_dex_data.toID)(species.baseSpecies)];
      if (baseSpeciesStatuses !== void 0) {
        let key;
        for (key in baseSpeciesStatuses) {
          if (!(key in species))
            species[key] = baseSpeciesStatuses[key];
        }
      }
      if (!species.tier && !species.doublesTier && !species.natDexTier && species.baseSpecies !== species.name) {
        if (species.baseSpecies === "Mimikyu") {
          species.tier = this.dex.data.FormatsData[(0, import_dex_data.toID)(species.baseSpecies)].tier || "Illegal";
          species.doublesTier = this.dex.data.FormatsData[(0, import_dex_data.toID)(species.baseSpecies)].doublesTier || "Illegal";
          species.natDexTier = this.dex.data.FormatsData[(0, import_dex_data.toID)(species.baseSpecies)].natDexTier || "Illegal";
        } else if (species.id.endsWith("totem")) {
          species.tier = this.dex.data.FormatsData[species.id.slice(0, -5)].tier || "Illegal";
          species.doublesTier = this.dex.data.FormatsData[species.id.slice(0, -5)].doublesTier || "Illegal";
          species.natDexTier = this.dex.data.FormatsData[species.id.slice(0, -5)].natDexTier || "Illegal";
        } else if (species.battleOnly) {
          species.tier = this.dex.data.FormatsData[(0, import_dex_data.toID)(species.battleOnly)].tier || "Illegal";
          species.doublesTier = this.dex.data.FormatsData[(0, import_dex_data.toID)(species.battleOnly)].doublesTier || "Illegal";
          species.natDexTier = this.dex.data.FormatsData[(0, import_dex_data.toID)(species.battleOnly)].natDexTier || "Illegal";
        } else {
          const baseFormatsData = this.dex.data.FormatsData[(0, import_dex_data.toID)(species.baseSpecies)];
          if (!baseFormatsData) {
            throw new Error(`${species.baseSpecies} has no formats-data entry`);
          }
          species.tier = baseFormatsData.tier || "Illegal";
          species.doublesTier = baseFormatsData.doublesTier || "Illegal";
          species.natDexTier = baseFormatsData.natDexTier || "Illegal";
        }
      }
      if (!species.tier)
        species.tier = "Illegal";
      if (!species.doublesTier)
        species.doublesTier = species.tier;
      if (!species.natDexTier)
        species.natDexTier = species.tier;
      if (species.gen > this.dex.gen) {
        species.tier = "Illegal";
        species.doublesTier = "Illegal";
        species.natDexTier = "Illegal";
        species.isNonstandard = "Future";
      }
      if (this.dex.currentMod === "gen7letsgo" && !species.isNonstandard) {
        const isLetsGo = (species.num <= 151 || ["Meltan", "Melmetal"].includes(species.name)) && (!species.forme || ["Alola", "Mega", "Mega-X", "Mega-Y", "Starter"].includes(species.forme) && species.name !== "Pikachu-Alola");
        if (!isLetsGo)
          species.isNonstandard = "Past";
      }
      if (this.dex.currentMod === "gen8bdsp" && (!species.isNonstandard || ["Gigantamax", "CAP"].includes(species.isNonstandard))) {
        if (species.gen > 4 || species.num < 1 && species.isNonstandard !== "CAP" || species.id === "pichuspikyeared") {
          species.isNonstandard = "Future";
          species.tier = species.doublesTier = species.natDexTier = "Illegal";
        }
      }
      species.nfe = species.evos.some((evo) => {
        const evoSpecies = this.get(evo);
        return !evoSpecies.isNonstandard || evoSpecies.isNonstandard === species?.isNonstandard || // Pokemon with Hisui evolutions
        evoSpecies.isNonstandard === "Unobtainable";
      });
      species.canHatch = species.canHatch || !["Ditto", "Undiscovered"].includes(species.eggGroups[0]) && !species.prevo && species.name !== "Manaphy";
      if (this.dex.gen === 1)
        species.bst -= species.baseStats.spd;
      if (this.dex.gen < 5) {
        species.abilities = this.dex.deepClone(species.abilities);
        delete species.abilities["H"];
      }
      if (this.dex.gen === 3 && this.dex.abilities.get(species.abilities["1"]).gen === 4)
        delete species.abilities["1"];
    } else {
      species = new Species({
        id,
        name: id,
        exists: false,
        tier: "Illegal",
        doublesTier: "Illegal",
        natDexTier: "Illegal",
        isNonstandard: "Custom"
      });
    }
    if (species.exists)
      this.speciesCache.set(id, this.dex.deepFreeze(species));
    return species;
  }
  /**
   * @param id the ID of the species the move pool belongs to
   * @param isNatDex
   * @returns a Set of IDs of the full valid movepool of the given species for the current generation/mod.
   * Note that inter-move incompatibilities, such as those from exclusive events, are not considered and all moves are
   * lumped together. However, Necturna and Necturine's Sketchable moves are omitted from this pool, as their fundamental
   * incompatibility with each other is essential to the nature of those species.
   */
  getMovePool(id, isNatDex = false) {
    let eggMovesOnly = false;
    let maxGen = this.dex.gen;
    const movePool = /* @__PURE__ */ new Set();
    for (const { species, learnset } of this.getFullLearnset(id)) {
      for (const moveid in learnset) {
        if (eggMovesOnly) {
          if (learnset[moveid].some((source) => source.startsWith("9E"))) {
            movePool.add(moveid);
          }
        } else if (maxGen >= 9) {
          if (isNatDex || learnset[moveid].some((source) => source.startsWith("9"))) {
            movePool.add(moveid);
          }
        } else {
          if (learnset[moveid].some((source) => parseInt(source.charAt(0)) <= maxGen)) {
            movePool.add(moveid);
          }
        }
        if (moveid === "sketch" && movePool.has("sketch")) {
          if (species.isNonstandard === "CAP") {
            continue;
          }
          const sketchables = this.dex.moves.all().filter((m) => !m.noSketch && !m.isNonstandard);
          for (const move of sketchables) {
            movePool.add(move.id);
          }
          break;
        }
      }
      if (species.evoRegion) {
        if (this.dex.gen >= 9)
          eggMovesOnly = true;
        if (this.dex.gen === 8 && species.evoRegion === "Alola")
          maxGen = 7;
      }
    }
    return movePool;
  }
  getFullLearnset(id) {
    const originalSpecies = this.get(id);
    let species = originalSpecies;
    const out = [];
    const alreadyChecked = {};
    while (species?.name && !alreadyChecked[species.id]) {
      alreadyChecked[species.id] = true;
      const learnset = this.getLearnsetData(species.id);
      if (learnset.learnset) {
        out.push(learnset);
        species = this.learnsetParent(species);
        continue;
      }
      if ((species.changesFrom || species.baseSpecies) !== species.name) {
        species = this.get(species.changesFrom || species.baseSpecies);
        continue;
      }
      if (species.isNonstandard) {
        return out;
      }
      if (species.prevo && this.getLearnsetData((0, import_dex_data.toID)(species.prevo)).learnset) {
        species = this.get((0, import_dex_data.toID)(species.prevo));
        continue;
      }
      throw new Error(`Species with no learnset data: ${species.id}`);
    }
    return out;
  }
  learnsetParent(species) {
    if (["Gastrodon", "Pumpkaboo", "Sinistea", "Tatsugiri"].includes(species.baseSpecies) && species.forme) {
      return this.get(species.baseSpecies);
    } else if (species.name === "Lycanroc-Dusk") {
      return this.get("Rockruff-Dusk");
    } else if (species.name === "Greninja-Bond") {
      return null;
    } else if (species.prevo) {
      species = this.get(species.prevo);
      if (species.gen > Math.max(2, this.dex.gen))
        return null;
      return species;
    } else if (species.changesFrom && species.baseSpecies !== "Kyurem") {
      return this.get(species.changesFrom);
    }
    return null;
  }
  /**
   * Gets the raw learnset data for the species.
   *
   * In practice, if you're trying to figure out what moves a pokemon learns,
   * you probably want to `getFullLearnset` or `getMovePool` instead.
   */
  getLearnsetData(id) {
    let learnsetData = this.learnsetCache.get(id);
    if (learnsetData)
      return learnsetData;
    if (!this.dex.data.Learnsets.hasOwnProperty(id)) {
      return new Learnset({ exists: false }, this.get(id));
    }
    learnsetData = new Learnset(this.dex.data.Learnsets[id], this.get(id));
    this.learnsetCache.set(id, this.dex.deepFreeze(learnsetData));
    return learnsetData;
  }
  getPokemonGoData(id) {
    return this.dex.data.PokemonGoData[id];
  }
  all() {
    if (this.allCache)
      return this.allCache;
    const species = [];
    for (const id in this.dex.data.Pokedex) {
      species.push(this.getByID(id));
    }
    this.allCache = Object.freeze(species);
    return this.allCache;
  }
}
//# sourceMappingURL=dex-species.js.map
