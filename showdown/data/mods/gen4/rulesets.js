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
var rulesets_exports = {};
__export(rulesets_exports, {
  Rulesets: () => Rulesets
});
module.exports = __toCommonJS(rulesets_exports);
const Rulesets = {
  standard: {
    inherit: true,
    ruleset: ["Obtainable", "Sleep Clause Mod", "Species Clause", "Nickname Clause", "OHKO Clause", "Evasion Items Clause", "Evasion Moves Clause", "Endless Battle Clause", "HP Percentage Mod", "Cancel Mod"]
  },
  flatrules: {
    inherit: true,
    ruleset: ["Obtainable", "Species Clause", "Nickname Clause", "Item Clause", "Adjust Level Down = 50", "Cancel Mod"]
  },
  teampreview: {
    inherit: true,
    onTeamPreview() {
      this.add("clearpoke");
      for (const pokemon of this.getAllPokemon()) {
        const details = pokemon.details.replace(", shiny", "").replace(/(Arceus|Genesect|Greninja|Gourgeist|Pumpkaboo|Xerneas|Silvally|Urshifu|Dudunsparce)(-[a-zA-Z?-]+)?/g, "$1-*").replace(/(Zacian|Zamazenta)(?!-Crowned)/g, "$1-*");
        this.add("poke", pokemon.side.id, details, pokemon.item ? "item" : "");
      }
      this.makeRequest("teampreview");
    }
  },
  validatestats: {
    inherit: true,
    onValidateSet(set) {
      const species = this.dex.species.get(set.species);
      const item = this.dex.items.get(set.item);
      if (item && item.id === "griseousorb" && species.num !== 487) {
        return ["Griseous Orb can only be held by Giratina in Generation 4."];
      }
      if (species.num === 493 && set.evs) {
        const isEventArceus = set.moves.includes("roaroftime") || set.moves.includes("shadowforce") || set.moves.includes("spacialrend");
        if (isEventArceus) {
          let stat;
          for (stat in set.evs) {
            if (set.evs[stat] > 100) {
              return ["Event Arceus may not have more than 100 of any EVs in Generation 4."];
            }
          }
        }
      }
    }
  }
};
//# sourceMappingURL=rulesets.js.map
