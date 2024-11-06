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
    flags: { failroleplay: 1, noreceiver: 1, noentrain: 1, notrace: 1, failskillswap: 1, notransform: 1 }
  },
  gulpmissile: {
    inherit: true,
    flags: { failroleplay: 1, noreceiver: 1, noentrain: 1, notrace: 1, failskillswap: 1, cantsuppress: 1, notransform: 1 }
  },
  protosynthesis: {
    inherit: true,
    condition: {
      noCopy: true,
      onStart(pokemon, source, effect) {
        if (effect?.name === "Booster Energy") {
          this.effectState.fromBooster = true;
          this.add("-activate", pokemon, "ability: Protosynthesis", "[fromitem]");
        } else {
          this.add("-activate", pokemon, "ability: Protosynthesis");
        }
        this.effectState.bestStat = pokemon.getBestStat(false, true);
        this.add("-start", pokemon, "protosynthesis" + this.effectState.bestStat);
      },
      onModifyAtkPriority: 5,
      onModifyAtk(atk, pokemon) {
        if (this.effectState.bestStat !== "atk")
          return;
        this.debug("Protosynthesis atk boost");
        return this.chainModify([5325, 4096]);
      },
      onModifyDefPriority: 6,
      onModifyDef(def, pokemon) {
        if (this.effectState.bestStat !== "def")
          return;
        this.debug("Protosynthesis def boost");
        return this.chainModify([5325, 4096]);
      },
      onModifySpAPriority: 5,
      onModifySpA(spa, pokemon) {
        if (this.effectState.bestStat !== "spa")
          return;
        this.debug("Protosynthesis spa boost");
        return this.chainModify([5325, 4096]);
      },
      onModifySpDPriority: 6,
      onModifySpD(spd, pokemon) {
        if (this.effectState.bestStat !== "spd")
          return;
        this.debug("Protosynthesis spd boost");
        return this.chainModify([5325, 4096]);
      },
      onModifySpe(spe, pokemon) {
        if (this.effectState.bestStat !== "spe")
          return;
        this.debug("Protosynthesis spe boost");
        return this.chainModify(1.5);
      },
      onEnd(pokemon) {
        this.add("-end", pokemon, "Protosynthesis");
      }
    },
    flags: { failroleplay: 1, noreceiver: 1, noentrain: 1, notrace: 1, failskillswap: 1, notransform: 1, cantsuppress: 1 }
  },
  quarkdrive: {
    inherit: true,
    condition: {
      noCopy: true,
      onStart(pokemon, source, effect) {
        if (effect?.name === "Booster Energy") {
          this.effectState.fromBooster = true;
          this.add("-activate", pokemon, "ability: Quark Drive", "[fromitem]");
        } else {
          this.add("-activate", pokemon, "ability: Quark Drive");
        }
        this.effectState.bestStat = pokemon.getBestStat(false, true);
        this.add("-start", pokemon, "quarkdrive" + this.effectState.bestStat);
      },
      onModifyAtkPriority: 5,
      onModifyAtk(atk, pokemon) {
        if (this.effectState.bestStat !== "atk")
          return;
        this.debug("Quark Drive atk boost");
        return this.chainModify([5325, 4096]);
      },
      onModifyDefPriority: 6,
      onModifyDef(def, pokemon) {
        if (this.effectState.bestStat !== "def")
          return;
        this.debug("Quark Drive def boost");
        return this.chainModify([5325, 4096]);
      },
      onModifySpAPriority: 5,
      onModifySpA(spa, pokemon) {
        if (this.effectState.bestStat !== "spa")
          return;
        this.debug("Quark Drive spa boost");
        return this.chainModify([5325, 4096]);
      },
      onModifySpDPriority: 6,
      onModifySpD(spd, pokemon) {
        if (this.effectState.bestStat !== "spd")
          return;
        this.debug("Quark Drive spd boost");
        return this.chainModify([5325, 4096]);
      },
      onModifySpe(spe, pokemon) {
        if (this.effectState.bestStat !== "spe")
          return;
        this.debug("Quark Drive spe boost");
        return this.chainModify(1.5);
      },
      onEnd(pokemon) {
        this.add("-end", pokemon, "Quark Drive");
      }
    },
    flags: { failroleplay: 1, noreceiver: 1, noentrain: 1, notrace: 1, failskillswap: 1, notransform: 1, cantsuppress: 1 }
  }
};
//# sourceMappingURL=abilities.js.map
