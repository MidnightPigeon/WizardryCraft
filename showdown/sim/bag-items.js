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
var bag_items_exports = {};
__export(bag_items_exports, {
  getItem: () => getItem,
  has: () => has,
  set: () => set
});
module.exports = __toCommonJS(bag_items_exports);
;
const bagItems = /* @__PURE__ */ new Map();
function set(itemId, bagItem) {
  bagItems.set(itemId, bagItem);
}
;
function getItem(itemId) {
  return bagItems.get(itemId);
}
;
function has(itemId) {
  return bagItems.has(itemId);
}
//# sourceMappingURL=bag-items.js.map
