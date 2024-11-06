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
var dex_conditions_exports = {};
__export(dex_conditions_exports, {
  Condition: () => Condition,
  DexConditions: () => DexConditions
});
module.exports = __toCommonJS(dex_conditions_exports);
var import_dex_data = require("./dex-data");
class Condition extends import_dex_data.BasicEffect {
  constructor(data) {
    super(data);
    data = this;
    this.effectType = ["Weather", "Status"].includes(data.effectType) ? data.effectType : "Condition";
  }
}
const EMPTY_CONDITION = new Condition({ name: "", exists: false });
class DexConditions {
  constructor(dex) {
    this.conditionCache = /* @__PURE__ */ new Map();
    this.dex = dex;
  }
  get(name) {
    if (!name)
      return EMPTY_CONDITION;
    if (typeof name !== "string")
      return name;
    return this.getByID(name.startsWith("item:") || name.startsWith("ability:") ? name : (0, import_dex_data.toID)(name));
  }
  getByID(id) {
    if (!id)
      return EMPTY_CONDITION;
    let condition = this.conditionCache.get(id);
    if (condition)
      return condition;
    let found;
    if (id.startsWith("item:")) {
      const item = this.dex.items.getByID(id.slice(5));
      condition = { ...item, id: "item:" + item.id };
    } else if (id.startsWith("ability:")) {
      const ability = this.dex.abilities.getByID(id.slice(8));
      condition = { ...ability, id: "ability:" + ability.id };
    } else if (this.dex.data.Rulesets.hasOwnProperty(id)) {
      condition = this.dex.formats.get(id);
      this.conditionCache.set(id, condition);
      return condition;
    } else if (this.dex.data.Conditions.hasOwnProperty(id)) {
      condition = new Condition({ name: id, ...this.dex.data.Conditions[id] });
    } else if (this.dex.data.Moves.hasOwnProperty(id) && (found = this.dex.data.Moves[id]).condition || this.dex.data.Abilities.hasOwnProperty(id) && (found = this.dex.data.Abilities[id]).condition || this.dex.data.Items.hasOwnProperty(id) && (found = this.dex.data.Items[id]).condition) {
      condition = new Condition({ name: found.name || id, ...found.condition });
    } else if (id === "recoil") {
      condition = new Condition({ name: "Recoil", effectType: "Recoil" });
    } else if (id === "drain") {
      condition = new Condition({ name: "Drain", effectType: "Drain" });
    } else {
      condition = new Condition({ name: id, exists: false });
    }
    this.conditionCache.set(id, this.dex.deepFreeze(condition));
    return condition;
  }
}
//# sourceMappingURL=dex-conditions.js.map
