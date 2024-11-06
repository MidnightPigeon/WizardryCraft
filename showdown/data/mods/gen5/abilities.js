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
  anticipation: {
    inherit: true,
    onStart(pokemon) {
      for (const target of pokemon.foes()) {
        for (const moveSlot of target.moveSlots) {
          const move = this.dex.moves.get(moveSlot.move);
          if (move.category !== "Status" && (this.dex.getImmunity(move.type, pokemon) && this.dex.getEffectiveness(move.type, pokemon) > 0 || move.ohko)) {
            this.add("-ability", pokemon, "Anticipation");
            return;
          }
        }
      }
    }
  },
  frisk: {
    inherit: true,
    onStart(pokemon) {
      const target = pokemon.side.randomFoe();
      if (target?.item) {
        this.add("-item", target, target.getItem().name, "[from] ability: Frisk", "[of] " + pokemon);
      }
    }
  },
  infiltrator: {
    inherit: true,
    rating: 1.5
  },
  keeneye: {
    inherit: true,
    onModifyMove() {
    }
  },
  oblivious: {
    inherit: true,
    onUpdate(pokemon) {
      if (pokemon.volatiles["attract"]) {
        pokemon.removeVolatile("attract");
        this.add("-end", pokemon, "move: Attract", "[from] ability: Oblivious");
      }
    },
    onTryHit(pokemon, target, move) {
      if (move.id === "captivate") {
        this.add("-immune", pokemon, "[from] Oblivious");
        return null;
      }
    },
    rating: 0.5
  },
  overcoat: {
    inherit: true,
    onTryHit() {
    },
    flags: {},
    rating: 0.5
  },
  sapsipper: {
    inherit: true,
    onAllyTryHitSide() {
    }
  },
  serenegrace: {
    inherit: true,
    onModifyMove(move) {
      if (move.secondaries && move.id !== "secretpower") {
        this.debug("doubling secondary chance");
        for (const secondary of move.secondaries) {
          if (secondary.chance)
            secondary.chance *= 2;
        }
      }
    }
  },
  soundproof: {
    inherit: true,
    onAllyTryHitSide() {
    }
  }
};
//# sourceMappingURL=abilities.js.map
