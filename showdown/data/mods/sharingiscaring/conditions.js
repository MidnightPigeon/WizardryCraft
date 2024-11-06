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
var conditions_exports = {};
__export(conditions_exports, {
  Conditions: () => Conditions
});
module.exports = __toCommonJS(conditions_exports);
const Conditions = {
  choicelock: {
    inherit: true,
    onBeforeMove(pokemon, target, move) {
      const choiceItem = pokemon.getItem().isChoice || Object.keys(pokemon.volatiles).some((v) => v.startsWith("item:") && this.dex.items.get(v.split(":")[1]).isChoice);
      if (!choiceItem) {
        pokemon.removeVolatile("choicelock");
        return;
      }
      if (!pokemon.ignoringItem() && !pokemon.volatiles["dynamax"] && move.id !== this.effectState.move && move.id !== "struggle") {
        this.addMove("move", pokemon, move.name);
        this.attrLastMove("[still]");
        this.debug("Disabled by Choice item lock");
        this.add("-fail", pokemon);
        return false;
      }
    },
    onDisableMove(pokemon) {
      const choiceItem = pokemon.getItem().isChoice || Object.keys(pokemon.volatiles).some((v) => v.startsWith("item:") && this.dex.items.get(v.split(":")[1]).isChoice);
      if (!choiceItem || !pokemon.hasMove(this.effectState.move)) {
        pokemon.removeVolatile("choicelock");
        return;
      }
      if (pokemon.ignoringItem() || pokemon.volatiles["dynamax"]) {
        return;
      }
      for (const moveSlot of pokemon.moveSlots) {
        if (moveSlot.id !== this.effectState.move) {
          pokemon.disableMove(moveSlot.id, false, this.effectState.sourceEffect);
        }
      }
    }
  }
};
//# sourceMappingURL=conditions.js.map
