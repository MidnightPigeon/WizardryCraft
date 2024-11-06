"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var random_teams_exports = {};
__export(random_teams_exports, {
  RandomGen2Teams: () => RandomGen2Teams,
  default: () => random_teams_default
});
module.exports = __toCommonJS(random_teams_exports);
var import_random_teams = __toESM(require("../gen3/random-teams"));
const NO_STAB = [
  "explosion",
  "icywind",
  "machpunch",
  "pursuit",
  "quickattack",
  "reversal",
  "selfdestruct"
];
class RandomGen2Teams extends import_random_teams.default {
  constructor(format, prng) {
    super(format, prng);
    this.randomData = require("./random-data.json");
    this.noStab = NO_STAB;
    this.moveEnforcementCheckers = {
      Electric: (movePool, moves, abilities, types, counter) => !counter.get("Electric"),
      Fire: (movePool, moves, abilities, types, counter) => !counter.get("Fire"),
      Flying: (movePool, moves, abilities, types, counter) => !counter.get("Flying") && types.has("Ground"),
      Ground: (movePool, moves, abilities, types, counter) => !counter.get("Ground"),
      Ice: (movePool, moves, abilities, types, counter) => !counter.get("Ice"),
      Normal: (movePool, moves, abilities, types, counter) => !counter.get("Normal") && counter.setupType === "Physical",
      Psychic: (movePool, moves, abilities, types, counter) => !counter.get("Psychic") && (types.has("Grass") || types.has("Ice")),
      Rock: (movePool, moves, abilities, types, counter, species) => !counter.get("Rock") && species.baseStats.atk > 60,
      Water: (movePool, moves, abilities, types, counter) => !counter.get("Water")
    };
  }
  shouldCullMove(move, types, moves, abilities = {}, counter, movePool, teamDetails) {
    const restTalk = moves.has("rest") && moves.has("sleeptalk");
    switch (move.id) {
      case "bellydrum":
      case "curse":
      case "meditate":
      case "screech":
      case "swordsdance":
        return {
          cull: counter.setupType !== "Physical" || counter.get("physicalsetup") > 1 || (!counter.get("Physical") || counter.damagingMoves.size < 2 && !moves.has("batonpass") && !moves.has("sleeptalk")) || move.id === "bellydrum" && moves.has("sleeptalk"),
          isSetup: true
        };
      case "batonpass":
        return { cull: !counter.setupType && !counter.get("speedsetup") && !moves.has("meanlook") && !moves.has("spiderweb") };
      case "meanlook":
      case "spiderweb":
        return { cull: movePool.includes("perishsong") || movePool.includes("batonpass") };
      case "nightmare":
        return { cull: !moves.has("lovelykiss") && !moves.has("sleeppowder") };
      case "swagger":
        return { cull: !moves.has("substitute") };
      case "charm":
      case "counter":
        return { cull: !!counter.setupType };
      case "haze":
        return { cull: !!counter.setupType || restTalk };
      case "doubleedge":
        return { cull: moves.has("bodyslam") || moves.has("return") };
      case "explosion":
      case "selfdestruct":
        return { cull: moves.has("softboiled") || restTalk };
      case "extremespeed":
        return { cull: moves.has("bodyslam") || restTalk };
      case "hyperbeam":
        return { cull: moves.has("rockslide") };
      case "rapidspin":
        return { cull: !!teamDetails.rapidSpin || !!counter.setupType || moves.has("sleeptalk") };
      case "return":
        return { cull: moves.has("bodyslam") };
      case "surf":
        return { cull: moves.has("hydropump") };
      case "thunder":
        return { cull: moves.has("thunderbolt") };
      case "razorleaf":
        return { cull: moves.has("swordsdance") && movePool.includes("sludgebomb") };
      case "icebeam":
        return { cull: moves.has("dragonbreath") };
      case "destinybond":
        return { cull: moves.has("explosion") };
      case "pursuit":
        return { cull: moves.has("crunch") && moves.has("solarbeam") };
      case "thief":
        return { cull: moves.has("rest") || moves.has("substitute") };
      case "irontail":
        return { cull: types.has("Ground") && movePool.includes("earthquake") };
      case "encore":
      case "roar":
      case "whirlwind":
        return { cull: restTalk };
      case "lovelykiss":
        return { cull: ["healbell", "moonlight", "morningsun", "sleeptalk"].some((m) => moves.has(m)) };
      case "sleeptalk":
        return { cull: moves.has("curse") && counter.get("stab") >= 2 };
      case "softboiled":
        return { cull: movePool.includes("swordsdance") };
      case "spikes":
        return { cull: !!teamDetails.spikes };
      case "substitute":
        return { cull: moves.has("agility") || moves.has("rest") };
      case "synthesis":
        return { cull: moves.has("explosion") };
      case "thunderwave":
        return { cull: moves.has("thunder") || moves.has("toxic") };
    }
    return { cull: false };
  }
  getItem(ability, types, moves, counter, teamDetails, species) {
    if (species.name === "Ditto")
      return "Metal Powder";
    if (species.name === "Farfetch\u2019d")
      return "Stick";
    if (species.name === "Marowak")
      return "Thick Club";
    if (species.name === "Pikachu")
      return "Light Ball";
    if (species.name === "Unown")
      return "Twisted Spoon";
    if (moves.has("thief"))
      return "";
    if (moves.has("rest") && !moves.has("sleeptalk"))
      return "Mint Berry";
    if ((moves.has("bellydrum") || moves.has("swordsdance")) && species.baseStats.spe >= 60 && !types.includes("Ground") && !moves.has("sleeptalk") && !moves.has("substitute") && this.randomChance(1, 2)) {
      return "Miracle Berry";
    }
    return "Leftovers";
  }
  randomSet(species, teamDetails = {}) {
    species = this.dex.species.get(species);
    const data = this.randomData[species.id];
    const movePool = [...data.moves || this.dex.species.getMovePool(species.id)];
    const rejectedPool = [];
    const moves = /* @__PURE__ */ new Set();
    let ivs = { hp: 30, atk: 30, def: 30, spa: 30, spd: 30, spe: 30 };
    let availableHP = 0;
    for (const setMoveid of movePool) {
      if (setMoveid.startsWith("hiddenpower"))
        availableHP++;
    }
    const types = new Set(species.types);
    let counter;
    let hasHiddenPower = false;
    do {
      while (moves.size < this.maxMoveCount && movePool.length) {
        const moveid = this.sampleNoReplace(movePool);
        if (moveid.startsWith("hiddenpower")) {
          availableHP--;
          if (hasHiddenPower)
            continue;
          hasHiddenPower = true;
        }
        moves.add(moveid);
      }
      while (moves.size < this.maxMoveCount && rejectedPool.length) {
        const moveid = this.sampleNoReplace(rejectedPool);
        if (moveid.startsWith("hiddenpower")) {
          if (hasHiddenPower)
            continue;
          hasHiddenPower = true;
        }
        moves.add(moveid);
      }
      counter = this.queryMoves(moves, species.types, /* @__PURE__ */ new Set(), movePool);
      for (const moveid of moves) {
        const move = this.dex.moves.get(moveid);
        let { cull, isSetup } = this.shouldCullMove(move, types, moves, {}, counter, movePool, teamDetails);
        if (counter.setupType === "Physical" && move.category === "Special" && !counter.get("Physical")) {
          cull = true;
        }
        const moveIsRejectable = (move.category !== "Status" || !move.flags.heal) && // These moves cannot be rejected in favor of a forced move
        !["batonpass", "sleeptalk", "spikes", "spore", "sunnyday"].includes(move.id) && (move.category === "Status" || !types.has(move.type) || move.basePower && move.basePower < 40);
        if (!cull && !isSetup && moveIsRejectable && (counter.setupType || !move.stallingMove)) {
          if (!counter.get("stab") && !counter.get("damage") && !types.has("Ghost") && counter.get("physicalpool") + counter.get("specialpool") > 0 || (movePool.includes("megahorn") || movePool.includes("softboiled") && moves.has("present")) || (moves.has("rest") && movePool.includes("sleeptalk") || moves.has("sleeptalk") && movePool.includes("rest")) || (moves.has("sunnyday") && movePool.includes("solarbeam") || moves.has("solarbeam") && movePool.includes("sunnyday")) || ["milkdrink", "recover", "spikes", "spore"].some((m) => movePool.includes(m))) {
            cull = true;
          } else {
            for (const type of types) {
              if (this.moveEnforcementCheckers[type]?.(movePool, moves, /* @__PURE__ */ new Set(), types, counter, species, teamDetails))
                cull = true;
            }
          }
        }
        if (cull && (movePool.length - availableHP || availableHP && (move.id === "hiddenpower" || !hasHiddenPower))) {
          if (move.category !== "Status" && !move.damage && (move.id !== "hiddenpower" || !availableHP)) {
            rejectedPool.push(moveid);
          }
          moves.delete(moveid);
          if (moveid.startsWith("hiddenpower"))
            hasHiddenPower = false;
          break;
        }
        if (cull && rejectedPool.length) {
          moves.delete(moveid);
          if (moveid.startsWith("hiddenpower"))
            hasHiddenPower = false;
          break;
        }
      }
    } while (moves.size < this.maxMoveCount && (movePool.length || rejectedPool.length));
    for (const setMoveid of moves) {
      if (!setMoveid.startsWith("hiddenpower"))
        continue;
      const hpType = setMoveid.substr(11, setMoveid.length);
      const hpIVs = {
        dragon: { def: 28 },
        ice: { def: 26 },
        psychic: { def: 24 },
        electric: { atk: 28 },
        grass: { atk: 28, def: 28 },
        water: { atk: 28, def: 26 },
        fire: { atk: 28, def: 24 },
        steel: { atk: 26 },
        ghost: { atk: 26, def: 28 },
        bug: { atk: 26, def: 26 },
        rock: { atk: 26, def: 24 },
        ground: { atk: 24 },
        poison: { atk: 24, def: 28 },
        flying: { atk: 24, def: 26 },
        fighting: { atk: 24, def: 24 }
      };
      if (hpIVs[hpType]) {
        ivs = { ...ivs, ...hpIVs[hpType] };
      }
      if (ivs.atk === 28 || ivs.atk === 24)
        ivs.hp = 14;
      if (ivs.def === 28 || ivs.def === 24)
        ivs.hp -= 8;
    }
    const level = this.getLevel(species);
    return {
      name: species.name,
      species: species.name,
      moves: Array.from(moves),
      ability: "No Ability",
      evs: { hp: 255, atk: 255, def: 255, spa: 255, spd: 255, spe: 255 },
      ivs,
      item: this.getItem("None", species.types, moves, counter, teamDetails, species),
      level,
      // No shiny chance because Gen 2 shinies have bad IVs
      shiny: false,
      gender: species.gender ? species.gender : "M"
    };
  }
}
var random_teams_default = RandomGen2Teams;
//# sourceMappingURL=random-teams.js.map
