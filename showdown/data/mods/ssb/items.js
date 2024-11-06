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
  // Alpha
  caioniumz: {
    name: "Caionium Z",
    onTakeItem: false,
    zMove: "Blistering Ice Age",
    zMoveFrom: "Blizzard",
    itemUser: ["Aurorus"],
    gen: 8,
    desc: "If held by an Aurorus with Blizzard, it can use Blistering Ice Age."
  },
  // A Quag To The Past
  quagniumz: {
    name: "Quagnium Z",
    onTakeItem: false,
    zMove: "Bounty Place",
    zMoveFrom: "Scorching Sands",
    itemUser: ["Quagsire"],
    gen: 8,
    desc: "If held by a Quagsire with Scorching Sands, it can use Bounty Place."
  },
  // Kalalokki
  kalalokkiumz: {
    name: "Kalalokkium Z",
    onTakeItem: false,
    zMove: "Gaelstrom",
    zMoveFrom: "Blackbird",
    itemUser: ["Wingull"],
    gen: 8,
    desc: "If held by a Wingull with Blackbird, it can use Gaelstrom."
  },
  // Robb576
  modium6z: {
    name: "Modium-6 Z",
    onTakeItem: false,
    zMove: "Integer Overflow",
    zMoveFrom: "Photon Geyser",
    itemUser: ["Necrozma-Ultra"],
    gen: 8,
    desc: "If held by a Robb576 with Photon Geyser, it can use Integer Overflow."
  }
};
//# sourceMappingURL=items.js.map
