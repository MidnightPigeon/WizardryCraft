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
var items_exports = {};
__export(items_exports, {
  Items: () => Items
});
module.exports = __toCommonJS(items_exports);
const Items = {
  berrysweet: {
    inherit: true,
    isNonstandard: "Past"
  },
  cloversweet: {
    inherit: true,
    isNonstandard: "Past"
  },
  dragonscale: {
    inherit: true,
    isNonstandard: "Past"
  },
  dubiousdisc: {
    inherit: true,
    isNonstandard: "Past"
  },
  electirizer: {
    inherit: true,
    isNonstandard: "Past"
  },
  eviolite: {
    inherit: true,
    onModifyDef(def, pokemon) {
      if (pokemon.baseSpecies.nfe || pokemon.baseSpecies.id === "dipplin") {
        return this.chainModify(1.5);
      }
    },
    onModifySpD(spd, pokemon) {
      if (pokemon.baseSpecies.nfe || pokemon.baseSpecies.id === "dipplin") {
        return this.chainModify(1.5);
      }
    }
  },
  flowersweet: {
    inherit: true,
    isNonstandard: "Past"
  },
  lovesweet: {
    inherit: true,
    isNonstandard: "Past"
  },
  magmarizer: {
    inherit: true,
    isNonstandard: "Past"
  },
  metalalloy: {
    inherit: true,
    isNonstandard: "Future"
  },
  protector: {
    inherit: true,
    isNonstandard: "Past"
  },
  ribbonsweet: {
    inherit: true,
    isNonstandard: "Past"
  },
  souldew: {
    inherit: true,
    isNonstandard: "Past"
  },
  starsweet: {
    inherit: true,
    isNonstandard: "Past"
  },
  strawberrysweet: {
    inherit: true,
    isNonstandard: "Past"
  },
  upgrade: {
    inherit: true,
    isNonstandard: "Past"
  }
};
//# sourceMappingURL=items.js.map
