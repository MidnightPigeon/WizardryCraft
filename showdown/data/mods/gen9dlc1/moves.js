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
  aeroblast: {
    inherit: true,
    flags: { protect: 1, mirror: 1, distance: 1, metronome: 1 },
    isNonstandard: "Past"
  },
  alluringvoice: {
    inherit: true,
    isNonstandard: "Future"
  },
  beakblast: {
    inherit: true,
    isNonstandard: "Past"
  },
  bitterblade: {
    inherit: true,
    flags: { contact: 1, protect: 1, mirror: 1, metronome: 1, slicing: 1 }
  },
  blueflare: {
    inherit: true,
    isNonstandard: "Past"
  },
  boltstrike: {
    inherit: true,
    isNonstandard: "Past"
  },
  burningbulwark: {
    inherit: true,
    isNonstandard: "Future"
  },
  conversion: {
    inherit: true,
    isNonstandard: "Past"
  },
  conversion2: {
    inherit: true,
    isNonstandard: "Past"
  },
  crushgrip: {
    inherit: true,
    isNonstandard: "Past"
  },
  darkvoid: {
    inherit: true,
    noSketch: false
  },
  decorate: {
    inherit: true,
    isNonstandard: "Past"
  },
  dragoncheer: {
    inherit: true,
    isNonstandard: "Future"
  },
  dragonhammer: {
    inherit: true,
    isNonstandard: "Past"
  },
  electroshot: {
    inherit: true,
    isNonstandard: "Future"
  },
  ficklebeam: {
    inherit: true,
    isNonstandard: "Future"
  },
  floralhealing: {
    inherit: true,
    isNonstandard: "Past"
  },
  freezeshock: {
    inherit: true,
    isNonstandard: "Past"
  },
  fusionbolt: {
    inherit: true,
    isNonstandard: "Past"
  },
  fusionflare: {
    inherit: true,
    isNonstandard: "Past"
  },
  glaciate: {
    inherit: true,
    isNonstandard: "Past"
  },
  hardpress: {
    inherit: true,
    isNonstandard: "Future"
  },
  hyperspacefury: {
    inherit: true,
    noSketch: false
  },
  iceburn: {
    inherit: true,
    isNonstandard: "Past"
  },
  lusterpurge: {
    inherit: true,
    basePower: 70,
    isNonstandard: "Past"
  },
  malignantchain: {
    inherit: true,
    isNonstandard: "Future"
  },
  matchagotcha: {
    inherit: true,
    flags: { protect: 1, mirror: 1, defrost: 1, metronome: 1 }
  },
  mightycleave: {
    inherit: true,
    isNonstandard: "Future"
  },
  mistball: {
    inherit: true,
    basePower: 70,
    isNonstandard: "Past"
  },
  moongeistbeam: {
    inherit: true,
    isNonstandard: "Past"
  },
  photongeyser: {
    inherit: true,
    isNonstandard: "Past"
  },
  prismaticlaser: {
    inherit: true,
    isNonstandard: "Past"
  },
  psychicnoise: {
    inherit: true,
    isNonstandard: "Future"
  },
  psychoboost: {
    inherit: true,
    isNonstandard: "Past"
  },
  revivalblessing: {
    inherit: true,
    noSketch: false
  },
  rockwrecker: {
    inherit: true,
    isNonstandard: "Past"
  },
  sacredfire: {
    inherit: true,
    isNonstandard: "Past"
  },
  secretsword: {
    inherit: true,
    isNonstandard: "Past"
  },
  sketch: {
    inherit: true,
    isNonstandard: "Past"
  },
  sparklingaria: {
    inherit: true,
    isNonstandard: "Past"
  },
  sunsteelstrike: {
    inherit: true,
    isNonstandard: "Past"
  },
  supercellslam: {
    inherit: true,
    isNonstandard: "Future"
  },
  tachyoncutter: {
    inherit: true,
    isNonstandard: "Future"
  },
  terastarstorm: {
    inherit: true,
    isNonstandard: "Future"
  },
  thunderclap: {
    inherit: true,
    isNonstandard: "Future"
  },
  topsyturvy: {
    inherit: true,
    isNonstandard: "Past"
  },
  triplekick: {
    inherit: true,
    isNonstandard: "Past"
  },
  upperhand: {
    inherit: true,
    isNonstandard: "Future"
  }
};
//# sourceMappingURL=moves.js.map
