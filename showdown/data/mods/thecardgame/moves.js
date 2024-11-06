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
  camouflage: {
    inherit: true,
    onHit(target) {
      let newType = "Normal";
      if (this.field.isTerrain("electricterrain")) {
        newType = "Electric";
      } else if (this.field.isTerrain("grassyterrain")) {
        newType = "Grass";
      } else if (this.field.isTerrain(["mistyterrain", "psychicterrain"])) {
        newType = "Psychic";
      }
      if (target.getTypes().join() === newType || !target.setType(newType))
        return false;
      this.add("-start", target, "typechange", newType);
    }
  },
  flyingpress: {
    inherit: true,
    onEffectiveness(typeMod, target, type, move) {
      return typeMod + this.dex.getEffectiveness("Normal", type);
    }
  },
  ivycudgel: {
    inherit: true,
    onModifyType(move, pokemon) {
      switch (pokemon.species.name) {
        case "Ogerpon-Wellspring":
        case "Ogerpon-Wellspring-Tera":
          move.type = "Water";
          break;
        case "Ogerpon-Hearthflame":
        case "Ogerpon-Hearthflame-Tera":
          move.type = "Fire";
          break;
        case "Ogerpon-Cornerstone":
        case "Ogerpon-Cornerstone-Tera":
          move.type = "Fighting";
          break;
      }
    }
  },
  roost: {
    inherit: true,
    condition: {
      duration: 1,
      onResidualOrder: 25,
      onStart(target) {
        if (!target.terastallized) {
          this.add("-singleturn", target, "move: Roost");
        } else if (target.terastallized === "Normal") {
          this.add("-hint", "If a Normal Terastallized Pokemon uses Roost, it remains Normal-type.");
        }
      },
      onTypePriority: -1,
      onType(types, pokemon) {
        this.effectState.typeWas = types;
        return types.filter((type) => type !== "Normal");
      }
    }
  },
  terrainpulse: {
    inherit: true,
    onModifyType(move, pokemon) {
      if (!pokemon.isGrounded())
        return;
      switch (this.field.terrain) {
        case "electricterrain":
          move.type = "Electric";
          break;
        case "grassyterrain":
          move.type = "Grass";
          break;
        case "mistyterrain":
        case "psychicterrain":
          move.type = "Psychic";
          break;
      }
    }
  },
  thousandarrows: {
    inherit: true,
    onEffectiveness(typeMod, target, type, move) {
      if (move.type !== "Fighting")
        return;
      if (!target)
        return;
      if (!target.runImmunity("Fighting")) {
        if (target.hasType("Normal"))
          return 0;
      }
    },
    ignoreImmunity: { "Fighting": true }
  },
  trickortreat: {
    inherit: true,
    onHit(target) {
      if (target.hasType("Psychic"))
        return false;
      if (!target.addType("Psychic"))
        return false;
      this.add("-start", target, "typeadd", "Psychic", "[from] move: Trick-or-Treat");
      if (target.side.active.length === 2 && target.position === 1) {
        const action = this.queue.willMove(target);
        if (action && action.move.id === "curse") {
          action.targetLoc = -1;
        }
      }
    }
  },
  weatherball: {
    inherit: true,
    onModifyType(move, pokemon) {
      switch (pokemon.effectiveWeather()) {
        case "sunnyday":
        case "desolateland":
          move.type = "Fire";
          break;
        case "raindance":
        case "primordialsea":
        case "hail":
        case "snow":
          move.type = "Water";
          break;
        case "sandstorm":
          move.type = "Fighting";
          break;
      }
    }
  }
};
//# sourceMappingURL=moves.js.map
