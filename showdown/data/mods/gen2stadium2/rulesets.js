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
    effectType: "ValidatorRule",
    name: "Standard",
    ruleset: ["Obtainable", "Team Preview", "Stadium Sleep Clause", "Freeze Clause Mod", "Self-KO Clause", "Species Clause", "Nickname Clause", "OHKO Clause", "Evasion Moves Clause", "Exact HP Mod", "Cancel Mod", "Stadium Items Clause"]
  },
  selfkoclause: {
    effectType: "Rule",
    name: "Self-KO Clause",
    desc: "If a player's last Pokemon uses Self-Destruct or Explosion, they automatically lose the battle.",
    onBegin() {
      this.add("rule", "Self-KO Clause: If a player's last Pokemon uses Self-Destruct/Explosion, they automatically lose");
    }
  }
};
//# sourceMappingURL=rulesets.js.map
