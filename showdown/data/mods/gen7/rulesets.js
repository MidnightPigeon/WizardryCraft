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
    ruleset: ["Obtainable", "Team Preview", "Sleep Clause Mod", "Species Clause", "Nickname Clause", "OHKO Clause", "Moody Clause", "Evasion Items Clause", "Evasion Moves Clause", "Endless Battle Clause", "HP Percentage Mod", "Cancel Mod"]
  },
  standarddoubles: {
    inherit: true,
    ruleset: ["Obtainable", "Team Preview", "Species Clause", "Nickname Clause", "OHKO Clause", "Moody Clause", "Evasion Abilities Clause", "Evasion Moves Clause", "Gravity Sleep Clause", "Endless Battle Clause", "HP Percentage Mod", "Cancel Mod"]
  },
  obtainablemoves: {
    inherit: true,
    banlist: [
      // Leaf Blade: Gen 6+ Nuzleaf level-up
      // Sucker Punch: Gen 4 Shiftry tutor
      "Shiftry + Leaf Blade + Sucker Punch",
      // Aura Break Zygarde can't be changed to 10% forme in gen 7
      // making moves only obtainable from gen 6 illegal
      "Zygarde-10% + Aura Break + Rock Smash",
      "Zygarde-10% + Aura Break + Secret Power",
      "Zygarde-10% + Aura Break + Strength"
    ]
  },
  gravitysleepclause: {
    effectType: "ValidatorRule",
    name: "Gravity Sleep Clause",
    desc: "Bans Gravity + sleep moves below 100% accuracy",
    banlist: ["Gravity ++ Grass Whistle", "Gravity ++ Hypnosis", "Gravity ++ Lovely Kiss", "Gravity ++ Sing", "Gravity ++ Sleep Powder"],
    onBegin() {
      this.add("rule", "Gravity Sleep Clause: The combination of Gravity and sleep-inducing moves with imperfect accuracy are banned");
    }
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
  }
};
//# sourceMappingURL=rulesets.js.map
