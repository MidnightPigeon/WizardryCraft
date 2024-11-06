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
    onBasePower(basePower, pokemon, target, move) {
      if (move.typeChangerBoosted === this.effect)
        return this.chainModify([5325, 4096]);
    },
    rating: 4.5
  },
  aftermath: {
    inherit: true,
    onDamagingHit(damage, target, source, move) {
      if (move.flags["contact"] && !target.hp) {
        this.damage(source.baseMaxhp / 4, source, target, null, true);
      }
    }
  },
  galewings: {
    inherit: true,
    onModifyPriority(priority, pokemon, target, move) {
      if (move && move.type === "Flying")
        return priority + 1;
    },
    rating: 4
  },
  ironbarbs: {
    inherit: true,
    onDamagingHit(damage, target, source, move) {
      if (move.flags["contact"]) {
        this.damage(source.baseMaxhp / 8, source, target, null, true);
      }
    }
  },
  liquidooze: {
    inherit: true,
    onSourceTryHeal(damage, target, source, effect) {
      this.debug("Heal is occurring: " + target + " <- " + source + " :: " + effect.id);
      const canOoze = ["drain", "leechseed"];
      if (canOoze.includes(effect.id)) {
        this.damage(damage, null, null, null, true);
        return 0;
      }
    }
  },
  magicguard: {
    inherit: true,
    onDamage(damage, target, source, effect) {
      if (effect.effectType !== "Move")
        return false;
    }
  },
  normalize: {
    inherit: true,
    onModifyMovePriority: 1,
    onModifyMove(move) {
      if (move.id !== "struggle" && this.dex.moves.get(move.id).type !== "Normal") {
        move.type = "Normal";
      }
    },
    onBasePower() {
    },
    rating: -1
  },
  parentalbond: {
    inherit: true,
    // Damage modifier implemented in BattleActions#modifyDamage()
    rating: 5
  },
  pixilate: {
    inherit: true,
    onBasePower(basePower, pokemon, target, move) {
      if (move.typeChangerBoosted === this.effect)
        return this.chainModify([5325, 4096]);
    },
    rating: 4.5
  },
  refrigerate: {
    inherit: true,
    onBasePower(basePower, pokemon, target, move) {
      if (move.typeChangerBoosted === this.effect)
        return this.chainModify([5325, 4096]);
    },
    rating: 4.5
  },
  roughskin: {
    inherit: true,
    onDamagingHit(damage, target, source, move) {
      if (move.flags["contact"]) {
        this.damage(source.baseMaxhp / 8, source, target, null, true);
      }
    }
  },
  stancechange: {
    inherit: true,
    onBeforeMovePriority: 11,
    onBeforeMove(attacker, defender, move) {
      if (attacker.species.baseSpecies !== "Aegislash" || attacker.transformed)
        return;
      if (move.category === "Status" && move.id !== "kingsshield")
        return;
      const targetForme = move.id === "kingsshield" ? "Aegislash" : "Aegislash-Blade";
      if (attacker.species.name !== targetForme)
        attacker.formeChange(targetForme);
    },
    onModifyMove() {
    }
  },
  symbiosis: {
    inherit: true,
    onAllyAfterUseItem(item, pokemon) {
      const source = this.effectState.target;
      const myItem = source.takeItem();
      if (!myItem)
        return;
      if (!this.singleEvent("TakeItem", myItem, source.itemState, pokemon, source, this.effect, myItem) || !pokemon.setItem(myItem)) {
        source.item = myItem.id;
        return;
      }
      this.add("-activate", source, "ability: Symbiosis", myItem, "[of] " + pokemon);
    }
  },
  weakarmor: {
    inherit: true,
    onDamagingHit(damage, target, source, move) {
      if (move.category === "Physical") {
        this.boost({ def: -1, spe: 1 }, target, target);
      }
    },
    rating: 0.5
  },
  zenmode: {
    inherit: true,
    flags: { failroleplay: 1, noentrain: 1, notrace: 1 }
  }
};
//# sourceMappingURL=abilities.js.map
