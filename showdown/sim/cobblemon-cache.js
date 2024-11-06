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
var cobblemon_cache_exports = {};
__export(cobblemon_cache_exports, {
  MOD_ID: () => MOD_ID,
  allCache: () => allCache,
  registerSpecies: () => registerSpecies,
  resetSpecies: () => resetSpecies,
  speciesByID: () => speciesByID
});
module.exports = __toCommonJS(cobblemon_cache_exports);
var import_dex_species = require("./dex-species");
const MOD_ID = "cobblemon";
const cobblemonSpecies = /* @__PURE__ */ new Map();
function registerSpecies(speciesData) {
  const species = new import_dex_species.Species(speciesData);
  cobblemonSpecies.set(species.id, species);
  return species;
}
function resetSpecies() {
  cobblemonSpecies.clear();
}
function speciesByID(id) {
  return cobblemonSpecies.get(id);
}
function allCache() {
  return Array.from(cobblemonSpecies.values());
}
//# sourceMappingURL=cobblemon-cache.js.map
