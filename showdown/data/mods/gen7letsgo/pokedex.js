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
var pokedex_exports = {};
__export(pokedex_exports, {
  Pokedex: () => Pokedex
});
module.exports = __toCommonJS(pokedex_exports);
const Pokedex = {
  pichu: {
    inherit: true,
    evos: []
  },
  pikachu: {
    inherit: true,
    prevo: "",
    evos: ["Raichu"]
  },
  raichualola: {
    inherit: true,
    prevo: ""
  },
  cleffa: {
    inherit: true,
    evos: []
  },
  clefairy: {
    inherit: true,
    prevo: ""
  },
  igglybuff: {
    inherit: true,
    evos: []
  },
  jigglypuff: {
    inherit: true,
    prevo: ""
  },
  golbat: {
    inherit: true,
    evos: []
  },
  gloom: {
    inherit: true,
    evos: ["Vileplume"]
  },
  poliwhirl: {
    inherit: true,
    evos: ["Poliwrath"]
  },
  slowpoke: {
    inherit: true,
    evos: ["Slowbro"]
  },
  magneton: {
    inherit: true,
    evos: []
  },
  onix: {
    inherit: true,
    evos: []
  },
  exeggcute: {
    inherit: true,
    evos: ["Exeggutor"]
  },
  exeggutoralola: {
    inherit: true,
    prevo: ""
  },
  cubone: {
    inherit: true,
    evos: ["Marowak"]
  },
  marowakalola: {
    inherit: true,
    prevo: ""
  },
  tyrogue: {
    inherit: true,
    evos: ["Hitmontop"]
  },
  hitmonlee: {
    inherit: true,
    prevo: ""
  },
  hitmonchan: {
    inherit: true,
    prevo: ""
  },
  lickitung: {
    inherit: true,
    evos: []
  },
  rhydon: {
    inherit: true,
    evos: []
  },
  happiny: {
    inherit: true,
    evos: []
  },
  chansey: {
    inherit: true,
    prevo: "",
    evos: []
  },
  tangela: {
    inherit: true,
    evos: []
  },
  seadra: {
    inherit: true,
    evos: []
  },
  mimejr: {
    inherit: true,
    evos: []
  },
  mrmime: {
    inherit: true,
    prevo: ""
  },
  scyther: {
    inherit: true,
    evos: []
  },
  smoochum: {
    inherit: true,
    evos: []
  },
  jynx: {
    inherit: true,
    prevo: ""
  },
  elekid: {
    inherit: true,
    evos: []
  },
  electabuzz: {
    inherit: true,
    prevo: "",
    evos: []
  },
  magby: {
    inherit: true,
    evos: []
  },
  magmar: {
    inherit: true,
    prevo: "",
    evos: []
  },
  eevee: {
    inherit: true,
    evos: ["Vaporeon", "Jolteon", "Flareon"]
  },
  porygon: {
    inherit: true,
    evos: []
  },
  munchlax: {
    inherit: true,
    evos: []
  },
  snorlax: {
    inherit: true,
    prevo: ""
  }
};
//# sourceMappingURL=pokedex.js.map
