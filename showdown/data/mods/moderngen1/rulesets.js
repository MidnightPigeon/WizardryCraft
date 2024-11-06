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
  partialtrappingclause: {
    effectType: "ValidatorRule",
    name: "Partial Trapping Clause",
    desc: "Bans moves that partially trap the opponent",
    banlist: ["Infestation", "Magma Storm", "Sand Tomb", "Snap Trap", "Thunder Cage", "Whirlpool", "Wrap", "Bind", "Fire Spin", "Clamp"],
    onBegin() {
      this.add("rule", "Partial Trapping Clause: Partial Trapping moves are banned");
    }
  },
  protectclause: {
    effectType: "ValidatorRule",
    name: "Protect Clause",
    desc: "Bans Protect and Detect",
    banlist: ["Protect", "Detect"],
    onBegin() {
      this.add("rule", "Protect Clause: Widely-distributed protecting moves are banned");
    }
  },
  fieldeffectclause: {
    effectType: "ValidatorRule",
    name: "Field Effect Clause",
    desc: "Bans moves that set a field effect",
    banlist: ["Spikes", "Toxic Spikes", "Stealth Rock", "Sticky Web", "Stone Axe", "Ceaseless Edge", "Wonder Room", "Trick Room", "Magic Room", "Lucky Chant", "Tailwind", "Safeguard", "Gravity"],
    onBegin() {
      this.add("rule", "Field Effect Clause: Field Effects are banned");
    }
  },
  mg1mod: {
    effectType: "Rule",
    name: "MG1 Mod",
    desc: "At the start of a battle, gives each player a link to the Modern Gen 1 thread so they can use it to get information about new additions to the metagame.",
    onBegin() {
      this.add("-message", `Welcome to Modern Gen 1!`);
      this.add("-message", `This is essentially Gen 9 National Dex OU but played with Gen 1 mechanics!`);
      this.add("-message", `You can find our thread and metagame resources here:`);
      this.add("-message", `https://www.smogon.com/forums/threads/gen-9-modern-gen-1.3711533/`);
    }
  },
  uselessmovesclause: {
    effectType: "ValidatorRule",
    name: "Useless Moves Clause",
    desc: "Bans moves that have no effect (to aid in teambuilding).",
    banlist: [
      "Conversion 2",
      "Electric Terrain",
      "Electrify",
      "Encore",
      "Flower Shield",
      "Grassy Terrain",
      "Hail",
      "Healing Wish",
      "Heart Swap",
      "Ion Deluge",
      "Laser Focus",
      "Lunar Dance",
      "Misty Terrain",
      "Perish Song",
      "Psych Up",
      "Psychic Terrain",
      "Rain Dance",
      "Revival Blessing",
      "Sandstorm",
      "Sleep Talk",
      "Snowscape",
      "Speed Swap",
      "Sunny Day",
      "Wish",
      "Jungle Healing",
      "Lunar Blessing",
      "Life Dew"
    ],
    onBegin() {
      this.add("rule", "Useless Moves Clause: Prevents trainers from bringing moves with no effect");
    }
  }
};
//# sourceMappingURL=rulesets.js.map
