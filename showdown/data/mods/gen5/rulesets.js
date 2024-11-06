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
    ruleset: [
      "Obtainable",
      "Team Preview",
      "Species Clause",
      "Nickname Clause",
      "OHKO Clause",
      "Moody Clause",
      "Evasion Items Clause",
      "Evasion Moves Clause",
      "Endless Battle Clause",
      "HP Percentage Mod",
      "Cancel Mod"
    ]
  },
  obtainablemoves: {
    inherit: true,
    banlist: [
      // Shell Smash: Clamperl Gen 5+ level-up
      // Sucker Punch: Huntail Gen 4 tutor
      "Huntail + Shell Smash + Sucker Punch"
    ]
  },
  teampreview: {
    inherit: true,
    onTeamPreview() {
      this.add("clearpoke");
      for (const pokemon of this.getAllPokemon()) {
        const details = pokemon.details.replace(", shiny", "").replace(/(Arceus|Genesect|Greninja|Gourgeist|Pumpkaboo|Xerneas|Silvally|Urshifu|Dudunsparce)(-[a-zA-Z?-]+)?/g, "$1-*").replace(/(Zacian|Zamazenta)(?!-Crowned)/g, "$1-*");
        const item = pokemon.item.includes("mail") ? "mail" : pokemon.item ? "item" : "";
        this.add("poke", pokemon.side.id, details, item);
      }
      this.makeRequest("teampreview");
    }
  }
};
//# sourceMappingURL=rulesets.js.map
