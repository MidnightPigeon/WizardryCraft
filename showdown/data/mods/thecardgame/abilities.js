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
  aerilate: {
    inherit: true,
    onModifyType(move, pokemon) {
      const noModifyType = [
        "judgment",
        "multiattack",
        "naturalgift",
        "revelationdance",
        "technoblast",
        "terrainpulse",
        "weatherball"
      ];
      if (move.type === "Normal" && !noModifyType.includes(move.id) && !(move.isZ && move.category !== "Status") && !(move.name === "Tera Blast" && pokemon.terastallized)) {
        move.typeChangerBoosted = this.effect;
      }
    }
  },
  eartheater: {
    inherit: true,
    onTryHit(target, source, move) {
      if (target !== source && move.type === "Fighting") {
        if (!this.heal(target.baseMaxhp / 4)) {
          this.add("-immune", target, "[from] ability: Earth Eater");
        }
        return null;
      }
    }
  },
  fairyaura: {
    inherit: true,
    onAnyBasePower(basePower, source, target, move) {
      if (target === source || move.category === "Status" || move.type !== "Psychic")
        return;
      if (!move.auraBooster?.hasAbility("Fairy Aura"))
        move.auraBooster = this.effectState.target;
      if (move.auraBooster !== this.effectState.target)
        return;
      return this.chainModify([move.hasAuraBreak ? 3072 : 5448, 4096]);
    }
  },
  galewings: {
    inherit: true,
    onModifyPriority(priority, pokemon, target, move) {
      if (move?.type === "Normal" && pokemon.hp === pokemon.maxhp)
        return priority + 1;
    }
  },
  mimicry: {
    inherit: true,
    onTerrainChange(pokemon) {
      let types;
      switch (this.field.terrain) {
        case "electricterrain":
          types = ["Electric"];
          break;
        case "grassyterrain":
          types = ["Grass"];
          break;
        case "mistyterrain":
        case "psychicterrain":
          types = ["Psychic"];
          break;
        default:
          types = pokemon.baseSpecies.types;
      }
      const oldTypes = pokemon.getTypes();
      if (oldTypes.join() === types.join() || !pokemon.setType(types))
        return;
      if (this.field.terrain || pokemon.transformed) {
        this.add("-start", pokemon, "typechange", types.join("/"), "[from] ability: Mimicry");
        if (!this.field.terrain)
          this.hint("Transform Mimicry changes you to your original un-transformed types.");
      } else {
        this.add("-activate", pokemon, "ability: Mimicry");
        this.add("-end", pokemon, "typechange", "[silent]");
      }
    }
  },
  pixilate: {
    inherit: true,
    onModifyType(move, pokemon) {
      const noModifyType = [
        "judgment",
        "multiattack",
        "naturalgift",
        "revelationdance",
        "technoblast",
        "terrainpulse",
        "weatherball"
      ];
      if (move.type === "Normal" && !noModifyType.includes(move.id) && !(move.isZ && move.category !== "Status") && !(move.name === "Tera Blast" && pokemon.terastallized)) {
        move.type = "Psychic";
        move.typeChangerBoosted = this.effect;
      }
    }
  },
  purifyingsalt: {
    inherit: true,
    onSourceModifyAtk(atk, attacker, defender, move) {
      if (move.type === "Psychic") {
        this.debug("Purifying Salt weaken");
        return this.chainModify(0.5);
      }
    },
    onSourceModifySpA(spa, attacker, defender, move) {
      if (move.type === "Psychic") {
        this.debug("Purifying Salt weaken");
        return this.chainModify(0.5);
      }
    }
  },
  rattled: {
    inherit: true,
    onDamagingHit(damage, target, source, move) {
      if (["Dark", "Grass", "Psychic"].includes(move.type)) {
        this.boost({ spe: 1 });
      }
    }
  },
  refrigerate: {
    inherit: true,
    onModifyType(move, pokemon) {
      const noModifyType = [
        "judgment",
        "multiattack",
        "naturalgift",
        "revelationdance",
        "technoblast",
        "terrainpulse",
        "weatherball"
      ];
      if (move.type === "Normal" && !noModifyType.includes(move.id) && !(move.isZ && move.category !== "Status") && !(move.name === "Tera Blast" && pokemon.terastallized)) {
        move.type = "Water";
        move.typeChangerBoosted = this.effect;
      }
    }
  },
  rockypayload: {
    inherit: true,
    onModifyAtk(atk, attacker, defender, move) {
      if (move.type === "Fighting") {
        this.debug("Rocky Payload boost");
        return this.chainModify(1.5);
      }
    },
    onModifySpA(atk, attacker, defender, move) {
      if (move.type === "Fighting") {
        this.debug("Rocky Payload boost");
        return this.chainModify(1.5);
      }
    }
  },
  sandforce: {
    inherit: true,
    onBasePower(basePower, attacker, defender, move) {
      if (this.field.isWeather("sandstorm")) {
        if (move.type === "Fighting" || move.type === "Steel") {
          this.debug("Sand Force boost");
          return this.chainModify([5325, 4096]);
        }
      }
    }
  },
  swarm: {
    inherit: true,
    onModifyAtk(atk, attacker, defender, move) {
      if (move.type === "Grass" && attacker.hp <= attacker.maxhp / 3) {
        this.debug("Swarm boost");
        return this.chainModify(1.5);
      }
    },
    onModifySpA(atk, attacker, defender, move) {
      if (move.type === "Grass" && attacker.hp <= attacker.maxhp / 3) {
        this.debug("Swarm boost");
        return this.chainModify(1.5);
      }
    }
  },
  thickfat: {
    inherit: true,
    onSourceModifyAtk(atk, attacker, defender, move) {
      if (move.type === "Water" || move.type === "Fire") {
        this.debug("Thick Fat weaken");
        return this.chainModify(0.5);
      }
    },
    onSourceModifySpA(atk, attacker, defender, move) {
      if (move.type === "Water" || move.type === "Fire") {
        this.debug("Thick Fat weaken");
        return this.chainModify(0.5);
      }
    }
  },
  mountaineer: {
    inherit: true,
    onTryHit(target, source, move) {
      if (move.type === "Fighting" && !target.activeTurns) {
        this.add("-immune", target, "[from] ability: Mountaineer");
        return null;
      }
    }
  }
};
//# sourceMappingURL=abilities.js.map
