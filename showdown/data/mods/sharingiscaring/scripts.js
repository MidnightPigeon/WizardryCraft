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
var scripts_exports = {};
__export(scripts_exports, {
  Scripts: () => Scripts
});
module.exports = __toCommonJS(scripts_exports);
var import_pokemon = require("../../../sim/pokemon");
const Scripts = {
  gen: 9,
  inherit: "gen9",
  pokemon: {
    isGrounded(negateImmunity) {
      if ("gravity" in this.battle.field.pseudoWeather)
        return true;
      if ("ingrain" in this.volatiles && this.battle.gen >= 4)
        return true;
      if ("smackdown" in this.volatiles)
        return true;
      const item = this.ignoringItem() ? "" : this.item;
      if (item === "ironball" || this.volatiles["item:ironball"] && !this.ignoringItem())
        return true;
      if (!negateImmunity && this.hasType("Flying") && !(this.hasType("???") && "roost" in this.volatiles))
        return false;
      if (this.hasAbility("levitate") && !this.battle.suppressingAbility(this))
        return null;
      if ("magnetrise" in this.volatiles)
        return false;
      if ("telekinesis" in this.volatiles)
        return false;
      if (item === "airballoon" || this.volatiles["item:airballoon"] && !this.ignoringItem())
        return false;
      return true;
    },
    hasItem(item) {
      if (Array.isArray(item)) {
        return item.some((i) => this.hasItem(i));
      } else {
        if (this.battle.toID(item) !== this.item && !this.volatiles["item:" + this.battle.toID(item)])
          return false;
      }
      return !this.ignoringItem();
    },
    useItem(source, sourceEffect) {
      const hasAnyItem = !!this.item || Object.keys(this.volatiles).some((v) => v.startsWith("item:"));
      if (!sourceEffect && this.battle.effect)
        sourceEffect = this.battle.effect;
      if (!source && this.battle.event && this.battle.event.target)
        source = this.battle.event.target;
      const item = sourceEffect?.id.startsWith("item:") ? sourceEffect : this.getItem();
      if (!this.hp && !item.isGem || !this.isActive)
        return false;
      if (!hasAnyItem)
        return false;
      if (this.battle.runEvent("UseItem", this, null, null, item)) {
        switch (item.id.startsWith("item:") ? item.id.slice(5) : item.id) {
          case "redcard":
            this.battle.add("-enditem", this, item.fullname, "[of] " + source);
            break;
          default:
            if (item.isGem) {
              this.battle.add("-enditem", this, item.fullname, "[from] gem");
            } else {
              this.battle.add("-enditem", this, item.fullname);
            }
            break;
        }
        if (item.boosts) {
          this.battle.boost(item.boosts, this, source, item);
        }
        this.battle.singleEvent("Use", item, this.itemState, this, source, sourceEffect);
        if (item.id.startsWith("item:")) {
          delete this.volatiles[item.id];
          this.m.sharedItemsUsed.push(item.id.slice(5));
        } else {
          this.lastItem = this.item;
          this.item = "";
          this.itemState = { id: "", target: this };
        }
        this.usedItemThisTurn = true;
        this.battle.runEvent("AfterUseItem", this, null, null, item);
        return true;
      }
      return false;
    },
    eatItem(force, source, sourceEffect) {
      const hasAnyItem = !!this.item || Object.keys(this.volatiles).some((v) => v.startsWith("item:"));
      if (!sourceEffect && this.battle.effect)
        sourceEffect = this.battle.effect;
      if (!source && this.battle.event && this.battle.event.target)
        source = this.battle.event.target;
      const item = sourceEffect?.id.startsWith("item:") ? sourceEffect : this.getItem();
      if (!hasAnyItem)
        return false;
      if (!this.hp && this.battle.toID(item.name) !== "jabocaberry" && this.battle.toID(item.name) !== "rowapberry" || !this.isActive)
        return false;
      if (this.battle.runEvent("UseItem", this, null, null, item) && (force || this.battle.runEvent("TryEatItem", this, null, null, item))) {
        this.battle.add("-enditem", this, item.fullname, "[eat]");
        this.battle.singleEvent("Eat", item, this.itemState, this, source, sourceEffect);
        this.battle.runEvent("EatItem", this, null, null, item);
        if (import_pokemon.RESTORATIVE_BERRIES.has(item.id.startsWith("item:") ? item.id.slice(5) : item.id)) {
          switch (this.pendingStaleness) {
            case "internal":
              if (this.staleness !== "external")
                this.staleness = "internal";
              break;
            case "external":
              this.staleness = "external";
              break;
          }
          this.pendingStaleness = void 0;
        }
        if (item.id.startsWith("item:")) {
          delete this.volatiles[item.id];
          this.m.sharedItemsUsed.push(item.id.slice(5));
        } else {
          this.lastItem = this.item;
          this.item = "";
          this.itemState = { id: "", target: this };
        }
        this.usedItemThisTurn = true;
        this.ateBerry = true;
        this.battle.runEvent("AfterUseItem", this, null, null, item);
        return true;
      }
      return false;
    },
    setItem(item, source, effect) {
      if (!this.hp || !this.isActive)
        return false;
      if (this.itemState.knockedOff)
        return false;
      if (typeof item === "string")
        item = this.battle.dex.items.get(item);
      const effectid = this.battle.effect ? this.battle.effect.id : "";
      if (import_pokemon.RESTORATIVE_BERRIES.has("leppaberry")) {
        const inflicted = ["trick", "switcheroo"].includes(effectid);
        const external = inflicted && source && !source.isAlly(this);
        this.pendingStaleness = external ? "external" : "internal";
      } else {
        this.pendingStaleness = void 0;
      }
      const oldItem = this.getItem();
      const oldItemState = this.itemState;
      this.item = item.id;
      this.itemState = { id: item.id, target: this };
      if (oldItem.exists)
        this.battle.singleEvent("End", oldItem, oldItemState, this);
      if (item.id) {
        this.battle.singleEvent("Start", item, this.itemState, this, source, effect);
        for (const ally of this.side.pokemon) {
          if (!ally.m.sharedItemsUsed)
            continue;
          ally.m.sharedItemsUsed = ally.m.sharedItemsUsed.filter((i) => i !== item.id);
        }
      }
      return true;
    }
  }
};
//# sourceMappingURL=scripts.js.map
