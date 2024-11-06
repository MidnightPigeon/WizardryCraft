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
var dex_data_exports = {};
__export(dex_data_exports, {
  BasicEffect: () => BasicEffect,
  DexNatures: () => DexNatures,
  DexStats: () => DexStats,
  DexTypes: () => DexTypes,
  Nature: () => Nature,
  TypeInfo: () => TypeInfo,
  toID: () => toID
});
module.exports = __toCommonJS(dex_data_exports);
var import_lib = require("../lib");
/**
 * Dex Data
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * @license MIT
 */
function toID(text) {
  if (text && text.id) {
    text = text.id;
  } else if (text && text.userid) {
    text = text.userid;
  } else if (text && text.roomid) {
    text = text.roomid;
  }
  if (typeof text !== "string" && typeof text !== "number")
    return "";
  return ("" + text).toLowerCase().replace(/[^a-z0-9]+/g, "");
}
class BasicEffect {
  constructor(data) {
    this.exists = true;
    Object.assign(this, data);
    this.name = import_lib.Utils.getString(data.name).trim();
    this.id = data.realMove ? toID(data.realMove) : toID(this.name);
    this.fullname = import_lib.Utils.getString(data.fullname) || this.name;
    this.effectType = import_lib.Utils.getString(data.effectType) || "Condition";
    this.exists = !!(this.exists && this.id);
    this.num = data.num || 0;
    this.gen = data.gen || 0;
    this.shortDesc = data.shortDesc || "";
    this.desc = data.desc || "";
    this.isNonstandard = data.isNonstandard || null;
    this.duration = data.duration;
    this.noCopy = !!data.noCopy;
    this.affectsFainted = !!data.affectsFainted;
    this.status = data.status || void 0;
    this.weather = data.weather || void 0;
    this.sourceEffect = data.sourceEffect || "";
  }
  toString() {
    return this.name;
  }
}
class Nature extends BasicEffect {
  constructor(data) {
    super(data);
    data = this;
    this.fullname = `nature: ${this.name}`;
    this.effectType = "Nature";
    this.gen = 3;
    this.plus = data.plus || void 0;
    this.minus = data.minus || void 0;
  }
}
class DexNatures {
  constructor(dex) {
    this.natureCache = /* @__PURE__ */ new Map();
    this.allCache = null;
    this.dex = dex;
  }
  get(name) {
    if (name && typeof name !== "string")
      return name;
    return this.getByID(toID(name));
  }
  getByID(id) {
    let nature = this.natureCache.get(id);
    if (nature)
      return nature;
    if (this.dex.data.Aliases.hasOwnProperty(id)) {
      nature = this.get(this.dex.data.Aliases[id]);
      if (nature.exists) {
        this.natureCache.set(id, nature);
      }
      return nature;
    }
    if (id && this.dex.data.Natures.hasOwnProperty(id)) {
      const natureData = this.dex.data.Natures[id];
      nature = new Nature(natureData);
      if (nature.gen > this.dex.gen)
        nature.isNonstandard = "Future";
    } else {
      nature = new Nature({ name: id, exists: false });
    }
    if (nature.exists)
      this.natureCache.set(id, this.dex.deepFreeze(nature));
    return nature;
  }
  all() {
    if (this.allCache)
      return this.allCache;
    const natures = [];
    for (const id in this.dex.data.Natures) {
      natures.push(this.getByID(id));
    }
    this.allCache = Object.freeze(natures);
    return this.allCache;
  }
}
class TypeInfo {
  constructor(data) {
    this.exists = true;
    Object.assign(this, data);
    this.name = data.name;
    this.id = data.id;
    this.effectType = import_lib.Utils.getString(data.effectType) || "Type";
    this.exists = !!(this.exists && this.id);
    this.gen = data.gen || 0;
    this.isNonstandard = data.isNonstandard || null;
    this.damageTaken = data.damageTaken || {};
    this.HPivs = data.HPivs || {};
    this.HPdvs = data.HPdvs || {};
  }
  toString() {
    return this.name;
  }
}
class DexTypes {
  constructor(dex) {
    this.typeCache = /* @__PURE__ */ new Map();
    this.allCache = null;
    this.namesCache = null;
    this.dex = dex;
  }
  get(name) {
    if (name && typeof name !== "string")
      return name;
    return this.getByID(toID(name));
  }
  getByID(id) {
    let type = this.typeCache.get(id);
    if (type)
      return type;
    const typeName = id.charAt(0).toUpperCase() + id.substr(1);
    if (typeName && this.dex.data.TypeChart.hasOwnProperty(id)) {
      type = new TypeInfo({ name: typeName, id, ...this.dex.data.TypeChart[id] });
    } else {
      type = new TypeInfo({ name: typeName, id, exists: false, effectType: "EffectType" });
    }
    if (type.exists)
      this.typeCache.set(id, this.dex.deepFreeze(type));
    return type;
  }
  names() {
    if (this.namesCache)
      return this.namesCache;
    this.namesCache = this.all().filter((type) => !type.isNonstandard).map((type) => type.name);
    return this.namesCache;
  }
  isName(name) {
    const id = name.toLowerCase();
    const typeName = id.charAt(0).toUpperCase() + id.substr(1);
    return name === typeName && this.dex.data.TypeChart.hasOwnProperty(id);
  }
  all() {
    if (this.allCache)
      return this.allCache;
    const types = [];
    for (const id in this.dex.data.TypeChart) {
      types.push(this.getByID(id));
    }
    this.allCache = Object.freeze(types);
    return this.allCache;
  }
}
const idsCache = ["hp", "atk", "def", "spa", "spd", "spe"];
const reverseCache = {
  __proto: null,
  "hitpoints": "hp",
  "attack": "atk",
  "defense": "def",
  "specialattack": "spa",
  "spatk": "spa",
  "spattack": "spa",
  "specialatk": "spa",
  "special": "spa",
  "spc": "spa",
  "specialdefense": "spd",
  "spdef": "spd",
  "spdefense": "spd",
  "specialdef": "spd",
  "speed": "spe"
};
class DexStats {
  constructor(dex) {
    if (dex.gen !== 1) {
      this.shortNames = {
        __proto__: null,
        hp: "HP",
        atk: "Atk",
        def: "Def",
        spa: "SpA",
        spd: "SpD",
        spe: "Spe"
      };
      this.mediumNames = {
        __proto__: null,
        hp: "HP",
        atk: "Attack",
        def: "Defense",
        spa: "Sp. Atk",
        spd: "Sp. Def",
        spe: "Speed"
      };
      this.names = {
        __proto__: null,
        hp: "HP",
        atk: "Attack",
        def: "Defense",
        spa: "Special Attack",
        spd: "Special Defense",
        spe: "Speed"
      };
    } else {
      this.shortNames = {
        __proto__: null,
        hp: "HP",
        atk: "Atk",
        def: "Def",
        spa: "Spc",
        spd: "[SpD]",
        spe: "Spe"
      };
      this.mediumNames = {
        __proto__: null,
        hp: "HP",
        atk: "Attack",
        def: "Defense",
        spa: "Special",
        spd: "[Sp. Def]",
        spe: "Speed"
      };
      this.names = {
        __proto__: null,
        hp: "HP",
        atk: "Attack",
        def: "Defense",
        spa: "Special",
        spd: "[Special Defense]",
        spe: "Speed"
      };
    }
  }
  getID(name) {
    if (name === "Spd")
      return "spe";
    const id = toID(name);
    if (reverseCache[id])
      return reverseCache[id];
    if (idsCache.includes(id))
      return id;
    return null;
  }
  ids() {
    return idsCache;
  }
}
//# sourceMappingURL=dex-data.js.map
