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
  airballoon: {
    inherit: true,
    // airborneness implemented in sim/pokemon.js:Pokemon#isGrounded
    onDamagingHit(damage, target, source, move) {
      this.add("-enditem", target, "Air Balloon");
      if (target.item === "airballoon") {
        target.item = "";
        target.itemState = { id: "", target };
      } else {
        delete target.volatiles["item:airballoon"];
        target.m.sharedItemsUsed.push("airballoon");
      }
      this.runEvent("AfterUseItem", target, null, null, this.dex.items.get("airballoon"));
    },
    onAfterSubDamage(damage, target, source, effect) {
      this.debug("effect: " + effect.id);
      if (effect.effectType === "Move") {
        this.add("-enditem", target, "Air Balloon");
        if (target.item === "airballoon") {
          target.item = "";
          target.itemState = { id: "", target };
        } else {
          delete target.volatiles["item:airballoon"];
          target.m.sharedItemsUsed.push("airballoon");
        }
        this.runEvent("AfterUseItem", target, null, null, this.dex.items.get("airballoon"));
      }
    }
  }
};
//# sourceMappingURL=items.js.map
