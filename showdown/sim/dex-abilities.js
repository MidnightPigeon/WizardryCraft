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
var dex_abilities_exports = {};
__export(dex_abilities_exports, {
  Ability: () => Ability,
  DexAbilities: () => DexAbilities
});
module.exports = __toCommonJS(dex_abilities_exports);
var import_dex_data = require("./dex-data");
class Ability extends import_dex_data.BasicEffect {
  constructor(data) {
    super(data);
    this.fullname = `ability: ${this.name}`;
    this.effectType = "Ability";
    this.suppressWeather = !!data.suppressWeather;
    this.flags = data.flags || {};
    this.rating = data.rating || 0;
    if (!this.gen) {
      if (this.num >= 268) {
        this.gen = 9;
      } else if (this.num >= 234) {
        this.gen = 8;
      } else if (this.num >= 192) {
        this.gen = 7;
      } else if (this.num >= 165) {
        this.gen = 6;
      } else if (this.num >= 124) {
        this.gen = 5;
      } else if (this.num >= 77) {
        this.gen = 4;
      } else if (this.num >= 1) {
        this.gen = 3;
      }
    }
  }
}
class DexAbilities {
  constructor(dex) {
    this.abilityCache = /* @__PURE__ */ new Map();
    this.allCache = null;
    this.dex = dex;
  }
  get(name = "") {
    if (name && typeof name !== "string")
      return name;
    const id = (0, import_dex_data.toID)(name);
    return this.getByID(id);
  }
  getByID(id) {
    let ability = this.abilityCache.get(id);
    if (ability)
      return ability;
    if (this.dex.data.Aliases.hasOwnProperty(id)) {
      ability = this.get(this.dex.data.Aliases[id]);
    } else if (id && this.dex.data.Abilities.hasOwnProperty(id)) {
      const abilityData = this.dex.data.Abilities[id];
      const abilityTextData = this.dex.getDescs("Abilities", id, abilityData);
      ability = new Ability({
        name: id,
        ...abilityData,
        ...abilityTextData
      });
      if (ability.gen > this.dex.gen) {
        ability.isNonstandard = "Future";
      }
      if (this.dex.currentMod === "gen7letsgo" && ability.id !== "noability") {
        ability.isNonstandard = "Past";
      }
      if ((this.dex.currentMod === "gen7letsgo" || this.dex.gen <= 2) && ability.id === "noability") {
        ability.isNonstandard = null;
      }
    } else {
      ability = new Ability({
        id,
        name: id,
        exists: false
      });
    }
    if (ability.exists)
      this.abilityCache.set(id, this.dex.deepFreeze(ability));
    return ability;
  }
  all() {
    if (this.allCache)
      return this.allCache;
    const abilities = [];
    for (const id in this.dex.data.Abilities) {
      abilities.push(this.getByID(id));
    }
    this.allCache = abilities;
    return this.allCache;
  }
}
//# sourceMappingURL=dex-abilities.js.map
