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
var moves_exports = {};
__export(moves_exports, {
  Moves: () => Moves
});
module.exports = __toCommonJS(moves_exports);
const Moves = {
  aurawheel: {
    inherit: true,
    isNonstandard: "Past"
  },
  bloodmoon: {
    inherit: true,
    isNonstandard: "Future"
  },
  clangingscales: {
    inherit: true,
    isNonstandard: "Past"
  },
  clangoroussoul: {
    inherit: true,
    isNonstandard: "Past"
  },
  darkvoid: {
    inherit: true,
    isNonstandard: "Past"
  },
  doomdesire: {
    inherit: true,
    isNonstandard: "Past"
  },
  forestscurse: {
    inherit: true,
    isNonstandard: "Past"
  },
  grassyglide: {
    inherit: true,
    basePower: 60
  },
  ivycudgel: {
    inherit: true,
    isNonstandard: "Future"
  },
  jetpunch: {
    inherit: true,
    hasSheerForce: true
  },
  matchagotcha: {
    inherit: true,
    isNonstandard: "Future"
  },
  seedflare: {
    inherit: true,
    isNonstandard: "Past"
  },
  strangesteam: {
    inherit: true,
    isNonstandard: "Past"
  },
  syrupbomb: {
    inherit: true,
    isNonstandard: "Future"
  },
  tailglow: {
    inherit: true,
    isNonstandard: "Past"
  },
  takeheart: {
    inherit: true,
    isNonstandard: "Past"
  },
  toxicthread: {
    inherit: true,
    isNonstandard: "Past"
  }
};
//# sourceMappingURL=moves.js.map
