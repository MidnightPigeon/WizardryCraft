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
  commander: {
    inherit: true,
    flags: { failroleplay: 1, noreceiver: 1, noentrain: 1, notrace: 1, failskillswap: 1, cantsuppress: 1, notransform: 1 }
  },
  gulpmissile: {
    inherit: true,
    flags: { cantsuppress: 1, notransform: 1 }
  },
  hadronengine: {
    inherit: true,
    flags: { failroleplay: 1, noreceiver: 1, noentrain: 1, notrace: 1, failskillswap: 1, cantsuppress: 1, notransform: 1 }
  },
  illuminate: {
    inherit: true,
    onTryBoost() {
    },
    onModifyMove() {
    },
    flags: {},
    rating: 0
  },
  mindseye: {
    inherit: true,
    isNonstandard: "Future"
  },
  orichalcumpulse: {
    inherit: true,
    flags: { failroleplay: 1, noreceiver: 1, noentrain: 1, notrace: 1, failskillswap: 1, cantsuppress: 1, notransform: 1 }
  },
  supersweetsyrup: {
    inherit: true,
    isNonstandard: "Future"
  },
  hospitality: {
    inherit: true,
    isNonstandard: "Future"
  },
  toxicchain: {
    inherit: true,
    isNonstandard: "Future"
  },
  embodyaspect: {
    inherit: true,
    isNonstandard: "Future"
  }
};
//# sourceMappingURL=abilities.js.map
