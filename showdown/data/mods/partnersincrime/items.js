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
var items_exports = {};
__export(items_exports, {
  Items: () => Items
});
module.exports = __toCommonJS(items_exports);
const Items = {
  leppaberry: {
    inherit: true,
    onEat(pokemon) {
      const moveSlot = pokemon.moveSlots.find((move) => move.pp === 0) || pokemon.moveSlots.find((move) => move.pp < move.maxpp);
      if (!moveSlot)
        return;
      moveSlot.pp += 10;
      if (moveSlot.pp > moveSlot.maxpp)
        moveSlot.pp = moveSlot.maxpp;
      if (!pokemon.m.curMoves.includes(moveSlot.id) && pokemon.m.trackPP.get(moveSlot.id)) {
        pokemon.m.trackPP.set(moveSlot.id, moveSlot.maxpp - moveSlot.pp);
      }
      this.add("-activate", pokemon, "item: Leppa Berry", moveSlot.move, "[consumed]");
    }
  }
};
//# sourceMappingURL=items.js.map
