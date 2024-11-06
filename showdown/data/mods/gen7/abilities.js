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
    },
    onUpdate(pokemon) {
      if (["mimikyu", "mimikyutotem"].includes(pokemon.species.id) && this.effectState.busted) {
        const speciesid = pokemon.species.id === "mimikyutotem" ? "Mimikyu-Busted-Totem" : "Mimikyu-Busted";
        pokemon.formeChange(speciesid, this.effect, true);
      }
    }
  },
  darkaura: {
    inherit: true,
    flags: { breakable: 1 }
  },
  fairyaura: {
    inherit: true,
    flags: { breakable: 1 }
  },
  innerfocus: {
    inherit: true,
    rating: 1,
    onTryBoost() {
    }
  },
  intimidate: {
    inherit: true,
    rating: 4
  },
  moody: {
    inherit: true,
    onResidual(pokemon) {
      let stats = [];
      const boost = {};
      let statPlus;
      for (statPlus in pokemon.boosts) {
        if (pokemon.boosts[statPlus] < 6) {
          stats.push(statPlus);
        }
      }
      let randomStat = stats.length ? this.sample(stats) : void 0;
      if (randomStat)
        boost[randomStat] = 2;
      stats = [];
      let statMinus;
      for (statMinus in pokemon.boosts) {
        if (pokemon.boosts[statMinus] > -6 && statMinus !== randomStat) {
          stats.push(statMinus);
        }
      }
      randomStat = stats.length ? this.sample(stats) : void 0;
      if (randomStat)
        boost[randomStat] = -1;
      this.boost(boost, pokemon, pokemon);
    }
  },
  oblivious: {
    inherit: true,
    onTryBoost() {
    }
  },
  owntempo: {
    inherit: true,
    onTryBoost() {
    }
  },
  rattled: {
    onDamagingHit(damage, target, source, move) {
      if (["Dark", "Bug", "Ghost"].includes(move.type)) {
        this.boost({ spe: 1 });
      }
    },
    name: "Rattled",
    rating: 1.5,
    num: 155
  },
  scrappy: {
    inherit: true,
    onTryBoost() {
    }
  },
  slowstart: {
    inherit: true,
    condition: {
      duration: 5,
      onResidualOrder: 28,
      onResidualSubOrder: 2,
      onStart(target) {
        this.add("-start", target, "ability: Slow Start");
      },
      onModifyAtkPriority: 5,
      onModifyAtk(atk, pokemon, target, move) {
        if (this.dex.moves.get(move.id).category === "Physical") {
          return this.chainModify(0.5);
        }
      },
      onModifySpAPriority: 5,
      onModifySpA(spa, pokemon, target, move) {
        if (this.dex.moves.get(move.id).category === "Physical") {
          return this.chainModify(0.5);
        }
      },
      onModifySpe(spe, pokemon) {
        return this.chainModify(0.5);
      },
      onEnd(target) {
        this.add("-end", target, "Slow Start");
      }
    }
  },
  soundproof: {
    inherit: true,
    onTryHit(target, source, move) {
      if (move.flags["sound"]) {
        this.add("-immune", target, "[from] ability: Soundproof");
        return null;
      }
    }
  },
  technician: {
    inherit: true,
    onBasePowerPriority: 19
  }
};
//# sourceMappingURL=abilities.js.map
