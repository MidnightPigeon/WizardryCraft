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
var dex_items_exports = {};
__export(dex_items_exports, {
  DexItems: () => DexItems,
  Item: () => Item
});
module.exports = __toCommonJS(dex_items_exports);
var import_dex_data = require("./dex-data");
class Item extends import_dex_data.BasicEffect {
  constructor(data) {
    super(data);
    data = this;
    this.fullname = `item: ${this.name}`;
    this.effectType = "Item";
    this.fling = data.fling || void 0;
    this.onDrive = data.onDrive || void 0;
    this.onMemory = data.onMemory || void 0;
    this.megaStone = data.megaStone || void 0;
    this.megaEvolves = data.megaEvolves || void 0;
    this.zMove = data.zMove || void 0;
    this.zMoveType = data.zMoveType || void 0;
    this.zMoveFrom = data.zMoveFrom || void 0;
    this.itemUser = data.itemUser || void 0;
    this.isBerry = !!data.isBerry;
    this.ignoreKlutz = !!data.ignoreKlutz;
    this.onPlate = data.onPlate || void 0;
    this.isGem = !!data.isGem;
    this.isPokeball = !!data.isPokeball;
    if (!this.gen) {
      if (this.num >= 1124) {
        this.gen = 9;
      } else if (this.num >= 927) {
        this.gen = 8;
      } else if (this.num >= 689) {
        this.gen = 7;
      } else if (this.num >= 577) {
        this.gen = 6;
      } else if (this.num >= 537) {
        this.gen = 5;
      } else if (this.num >= 377) {
        this.gen = 4;
      } else {
        this.gen = 3;
      }
    }
    if (this.isBerry)
      this.fling = { basePower: 10 };
    if (this.id.endsWith("plate"))
      this.fling = { basePower: 90 };
    if (this.onDrive)
      this.fling = { basePower: 70 };
    if (this.megaStone)
      this.fling = { basePower: 80 };
    if (this.onMemory)
      this.fling = { basePower: 50 };
  }
}
class DexItems {
  constructor(dex) {
    this.itemCache = /* @__PURE__ */ new Map();
    this.allCache = null;
    this.dex = dex;
  }
  get(name) {
    if (name && typeof name !== "string")
      return name;
    name = (name || "").trim();
    const id = (0, import_dex_data.toID)(name);
    return this.getByID(id);
  }
  getByID(id) {
    let item = this.itemCache.get(id);
    if (item)
      return item;
    if (this.dex.data.Aliases.hasOwnProperty(id)) {
      item = this.get(this.dex.data.Aliases[id]);
      if (item.exists) {
        this.itemCache.set(id, item);
      }
      return item;
    }
    if (id && !this.dex.data.Items[id] && this.dex.data.Items[id + "berry"]) {
      item = this.getByID(id + "berry");
      this.itemCache.set(id, item);
      return item;
    }
    if (id && this.dex.data.Items.hasOwnProperty(id)) {
      const itemData = this.dex.data.Items[id];
      const itemTextData = this.dex.getDescs("Items", id, itemData);
      item = new Item({
        name: id,
        ...itemData,
        ...itemTextData
      });
      if (item.gen > this.dex.gen) {
        item.isNonstandard = "Future";
      }
      if (this.dex.currentMod === "gen7letsgo" && !item.isNonstandard && !item.megaStone) {
        item.isNonstandard = "Past";
      }
    } else {
      item = new Item({ name: id, exists: false });
    }
    if (item.exists)
      this.itemCache.set(id, this.dex.deepFreeze(item));
    return item;
  }
  all() {
    if (this.allCache)
      return this.allCache;
    const items = [];
    for (const id in this.dex.data.Items) {
      items.push(this.getByID(id));
    }
    this.allCache = Object.freeze(items);
    return this.allCache;
  }
}
//# sourceMappingURL=dex-items.js.map
