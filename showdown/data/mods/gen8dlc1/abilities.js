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
var abilities_exports = {};
__export(abilities_exports, {
  Abilities: () => Abilities
});
module.exports = __toCommonJS(abilities_exports);
const Abilities = {
  asoneglastrier: {
    inherit: true,
    isNonstandard: "Unobtainable"
  },
  asonespectrier: {
    inherit: true,
    isNonstandard: "Unobtainable"
  },
  chillingneigh: {
    inherit: true,
    isNonstandard: "Unobtainable"
  },
  curiousmedicine: {
    inherit: true,
    isNonstandard: "Unobtainable"
  },
  disguise: {
    inherit: true,
    onDamage(damage, target, source, effect) {
      if (effect && effect.effectType === "Move" && ["mimikyu", "mimikyutotem"].includes(target.species.id) && !target.transformed) {
        if (["rollout", "iceball"].includes(effect.id)) {
          source.volatiles[effect.id].contactHitCount--;
        }
        this.add("-activate", target, "ability: Disguise");
        this.effectState.busted = true;
        return 0;
      }
    }
  },
  dragonsmaw: {
    inherit: true,
    isNonstandard: "Unobtainable"
  },
  grimneigh: {
    inherit: true,
    isNonstandard: "Unobtainable"
  },
  iceface: {
    inherit: true,
    onDamage(damage, target, source, effect) {
      if (effect && effect.effectType === "Move" && effect.category === "Physical" && target.species.id === "eiscue" && !target.transformed) {
        if (["rollout", "iceball"].includes(effect.id)) {
          source.volatiles[effect.id].contactHitCount--;
        }
        this.add("-activate", target, "ability: Disguise");
        this.effectState.busted = true;
        return 0;
      }
    }
  },
  transistor: {
    inherit: true,
    isNonstandard: "Unobtainable"
  }
};
//# sourceMappingURL=abilities.js.map
