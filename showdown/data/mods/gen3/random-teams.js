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
  RandomGen3Teams: () => RandomGen3Teams,
  default: () => random_teams_default
});
module.exports = __toCommonJS(random_teams_exports);
var import_random_teams = __toESM(require("../gen4/random-teams"));
var import_lib = require("../../../lib");
const RECOVERY_MOVES = [
  "milkdrink",
  "moonlight",
  "morningsun",
  "recover",
  "slackoff",
  "softboiled",
  "synthesis"
];
const SETUP = [
  "acidarmor",
  "agility",
  "bellydrum",
  "bulkup",
  "calmmind",
  "curse",
  "dragondance",
  "growth",
  "howl",
  "irondefense",
  "meditate",
  "raindance",
  "sunnyday",
  "swordsdance",
  "tailglow"
];
const NO_STAB = [
  "eruption",
  "explosion",
  "fakeout",
  "focuspunch",
  "futuresight",
  "icywind",
  "knockoff",
  "machpunch",
  "pursuit",
  "quickattack",
  "rapidspin",
  "selfdestruct",
  "skyattack",
  "waterspout"
];
const MOVE_PAIRS = [
  ["sleeptalk", "rest"],
  ["protect", "wish"],
  ["leechseed", "substitute"],
  ["focuspunch", "substitute"],
  ["batonpass", "spiderweb"]
];
class RandomGen3Teams extends import_random_teams.default {
  constructor(format, prng) {
    super(format, prng);
    this.randomSets = require("./random-sets.json");
    this.noStab = NO_STAB;
    this.battleHasDitto = false;
    this.battleHasWobbuffet = false;
    this.moveEnforcementCheckers = {
      Bug: (movePool, moves, abilities, types, counter, species) => !counter.get("Bug") && ["armaldo", "heracross", "parasect"].includes(species.id),
      Dark: (movePool, moves, abilities, types, counter) => !counter.get("Dark"),
      Electric: (movePool, moves, abilities, types, counter) => !counter.get("Electric"),
      Fighting: (movePool, moves, abilities, types, counter) => !counter.get("Fighting"),
      Fire: (movePool, moves, abilities, types, counter) => !counter.get("Fire"),
      Flying: (movePool, moves, abilities, types, counter, species) => !counter.get("Flying") && species.id !== "crobat",
      Ghost: (movePool, moves, abilities, types, counter) => !counter.get("Ghost"),
      Ground: (movePool, moves, abilities, types, counter) => !counter.get("Ground"),
      Ice: (movePool, moves, abilities, types, counter) => !counter.get("Ice"),
      Normal: (movePool, moves, abilities, types, counter, species) => !counter.get("Normal"),
      Poison: (movePool, moves, abilities, types, counter) => !counter.get("Poison") && !counter.get("Bug"),
      Psychic: (movePool, moves, abilities, types, counter, species) => !counter.get("Psychic") && species.baseStats.spa >= 100,
      Rock: (movePool, moves, abilities, types, counter, species) => !counter.get("Rock"),
      Steel: (movePool, moves, abilities, types, counter, species) => !counter.get("Steel") && species.id !== "forretress",
      Water: (movePool, moves, abilities, types, counter, species) => !counter.get("Water")
    };
  }
  cullMovePool(types, moves, abilities, counter, movePool, teamDetails, species, isLead, preferredType, role) {
    let hasHiddenPower = false;
    for (const move of moves) {
      if (move.startsWith("hiddenpower"))
        hasHiddenPower = true;
    }
    if (hasHiddenPower) {
      let movePoolHasHiddenPower = true;
      while (movePoolHasHiddenPower) {
        movePoolHasHiddenPower = false;
        for (const moveid of movePool) {
          if (moveid.startsWith("hiddenpower")) {
            this.fastPop(movePool, movePool.indexOf(moveid));
            movePoolHasHiddenPower = true;
            break;
          }
        }
      }
    }
    if (moves.size + movePool.length <= this.maxMoveCount)
      return;
    if (moves.size === this.maxMoveCount - 2) {
      const unpairedMoves = [...movePool];
      for (const pair of MOVE_PAIRS) {
        if (movePool.includes(pair[0]) && movePool.includes(pair[1])) {
          this.fastPop(unpairedMoves, unpairedMoves.indexOf(pair[0]));
          this.fastPop(unpairedMoves, unpairedMoves.indexOf(pair[1]));
        }
      }
      if (unpairedMoves.length === 1) {
        this.fastPop(movePool, movePool.indexOf(unpairedMoves[0]));
      }
    }
    if (moves.size === this.maxMoveCount - 1) {
      for (const pair of MOVE_PAIRS) {
        if (movePool.includes(pair[0]) && movePool.includes(pair[1])) {
          this.fastPop(movePool, movePool.indexOf(pair[0]));
          this.fastPop(movePool, movePool.indexOf(pair[1]));
        }
      }
    }
    if (teamDetails.rapidSpin) {
      if (movePool.includes("rapidspin"))
        this.fastPop(movePool, movePool.indexOf("rapidspin"));
      if (moves.size + movePool.length <= this.maxMoveCount)
        return;
    }
    const badWithSetup = ["knockoff", "rapidspin", "toxic"];
    const statusMoves = this.dex.moves.all().filter((move) => move.category === "Status").map((move) => move.id);
    const incompatiblePairs = [
      // These moves don't mesh well with other aspects of the set
      [statusMoves, "trick"],
      [SETUP, badWithSetup],
      ["rest", ["protect", "substitute"]],
      [["selfdestruct", "explosion"], ["destinybond", "painsplit", "rest"]],
      // These attacks are redundant with each other
      ["surf", "hydropump"],
      [["bodyslam", "return"], ["bodyslam", "doubleedge"]],
      ["fireblast", "flamethrower"],
      // Assorted hardcodes go here:
      // Granbull
      ["bulkup", "overheat"],
      // Heracross
      ["endure", "substitute"]
    ];
    for (const pair of incompatiblePairs)
      this.incompatibleMoves(moves, movePool, pair[0], pair[1]);
    const statusInflictingMoves = ["stunspore", "thunderwave", "toxic", "willowisp", "yawn"];
    if (role !== "Staller") {
      this.incompatibleMoves(moves, movePool, statusInflictingMoves, statusInflictingMoves);
    }
  }
  // Generate random moveset for a given species, role, preferred type.
  randomMoveset(types, abilities, teamDetails, species, isLead, movePool, preferredType, role) {
    const preferredTypes = preferredType ? preferredType.split(",") : [];
    const moves = /* @__PURE__ */ new Set();
    let counter = this.newQueryMoves(moves, species, preferredType, abilities);
    this.cullMovePool(
      types,
      moves,
      abilities,
      counter,
      movePool,
      teamDetails,
      species,
      isLead,
      preferredType,
      role
    );
    if (movePool.length <= this.maxMoveCount) {
      while (movePool.length) {
        const moveid = this.sample(movePool);
        counter = this.addMove(
          moveid,
          moves,
          types,
          abilities,
          teamDetails,
          species,
          isLead,
          movePool,
          preferredType,
          role
        );
      }
      return moves;
    }
    const runEnforcementChecker = (checkerName) => {
      if (!this.moveEnforcementCheckers[checkerName])
        return false;
      return this.moveEnforcementCheckers[checkerName](
        movePool,
        moves,
        abilities,
        new Set(types),
        counter,
        species,
        teamDetails
      );
    };
    if (species.requiredMove) {
      const move = this.dex.moves.get(species.requiredMove).id;
      counter = this.addMove(
        move,
        moves,
        types,
        abilities,
        teamDetails,
        species,
        isLead,
        movePool,
        preferredType,
        role
      );
    }
    for (const moveid of ["seismictoss", "spore"]) {
      if (movePool.includes(moveid)) {
        counter = this.addMove(
          moveid,
          moves,
          types,
          abilities,
          teamDetails,
          species,
          isLead,
          movePool,
          preferredType,
          role
        );
      }
    }
    if (!role.includes("Setup")) {
      if (movePool.includes("batonpass") && movePool.includes("substitute")) {
        counter = this.addMove(
          "substitute",
          moves,
          types,
          abilities,
          teamDetails,
          species,
          isLead,
          movePool,
          preferredType,
          role
        );
      }
    }
    for (const type of preferredTypes) {
      if (!counter.get(type)) {
        const stabMoves = [];
        for (const moveid of movePool) {
          const move = this.dex.moves.get(moveid);
          const moveType = this.getMoveType(move, species, abilities, preferredType);
          if (!this.noStab.includes(moveid) && (move.basePower || move.basePowerCallback) && type === moveType) {
            stabMoves.push(moveid);
          }
        }
        if (stabMoves.length) {
          const moveid = this.sample(stabMoves);
          counter = this.addMove(
            moveid,
            moves,
            types,
            abilities,
            teamDetails,
            species,
            isLead,
            movePool,
            preferredType,
            role
          );
        }
      }
    }
    for (const type of types) {
      const stabMoves = [];
      for (const moveid of movePool) {
        const move = this.dex.moves.get(moveid);
        const moveType = this.getMoveType(move, species, abilities, preferredType);
        if (!this.noStab.includes(moveid) && (move.basePower || move.basePowerCallback) && type === moveType) {
          stabMoves.push(moveid);
        }
      }
      while (runEnforcementChecker(type)) {
        if (!stabMoves.length)
          break;
        const moveid = this.sampleNoReplace(stabMoves);
        counter = this.addMove(
          moveid,
          moves,
          types,
          abilities,
          teamDetails,
          species,
          isLead,
          movePool,
          preferredType,
          role
        );
      }
    }
    if (!counter.get("stab")) {
      const stabMoves = [];
      for (const moveid of movePool) {
        const move = this.dex.moves.get(moveid);
        const moveType = this.getMoveType(move, species, abilities, preferredType);
        if (!this.noStab.includes(moveid) && (move.basePower || move.basePowerCallback) && types.includes(moveType)) {
          stabMoves.push(moveid);
        }
      }
      if (stabMoves.length) {
        const moveid = this.sample(stabMoves);
        counter = this.addMove(
          moveid,
          moves,
          types,
          abilities,
          teamDetails,
          species,
          isLead,
          movePool,
          preferredType,
          role
        );
      }
    }
    if (["Bulky Support", "Bulky Attacker", "Bulky Setup", "Staller"].includes(role)) {
      const recoveryMoves = movePool.filter((moveid) => RECOVERY_MOVES.includes(moveid));
      if (recoveryMoves.length) {
        const moveid = this.sample(recoveryMoves);
        counter = this.addMove(
          moveid,
          moves,
          types,
          abilities,
          teamDetails,
          species,
          isLead,
          movePool,
          preferredType,
          role
        );
      }
    }
    if (role === "Staller") {
      const enforcedMoves = ["protect", "toxic", "wish"];
      for (const move of enforcedMoves) {
        if (movePool.includes(move)) {
          counter = this.addMove(
            move,
            moves,
            types,
            abilities,
            teamDetails,
            species,
            isLead,
            movePool,
            preferredType,
            role
          );
        }
      }
    }
    if (role.includes("Setup") || role === "Berry Sweeper") {
      const setupMoves = movePool.filter((moveid) => SETUP.includes(moveid));
      if (setupMoves.length) {
        const moveid = this.sample(setupMoves);
        counter = this.addMove(
          moveid,
          moves,
          types,
          abilities,
          teamDetails,
          species,
          isLead,
          movePool,
          preferredType,
          role
        );
      }
    }
    if (role === "Berry Sweeper") {
      for (const move of ["flail", "reversal"]) {
        if (movePool.includes(move)) {
          counter = this.addMove(
            move,
            moves,
            types,
            abilities,
            teamDetails,
            species,
            isLead,
            movePool,
            preferredType,
            role
          );
        }
      }
      const hpControlMoves = [];
      for (const moveid of movePool) {
        if (["endure", "substitute"].includes(moveid))
          hpControlMoves.push(moveid);
      }
      if (hpControlMoves.length) {
        const moveid = this.sample(hpControlMoves);
        counter = this.addMove(
          moveid,
          moves,
          types,
          abilities,
          teamDetails,
          species,
          isLead,
          movePool,
          preferredType,
          role
        );
      }
    }
    if (!counter.damagingMoves.size) {
      const attackingMoves = [];
      for (const moveid of movePool) {
        const move = this.dex.moves.get(moveid);
        if (!this.noStab.includes(moveid) && move.category !== "Status")
          attackingMoves.push(moveid);
      }
      if (attackingMoves.length) {
        const moveid = this.sample(attackingMoves);
        counter = this.addMove(
          moveid,
          moves,
          types,
          abilities,
          teamDetails,
          species,
          isLead,
          movePool,
          preferredType,
          role
        );
      }
    }
    if (["Fast Attacker", "Setup Sweeper", "Bulky Attacker", "Wallbreaker", "Berry Sweeper"].includes(role)) {
      if (counter.damagingMoves.size === 1) {
        const currentAttackType = counter.damagingMoves.values().next().value.type;
        const coverageMoves = [];
        for (const moveid of movePool) {
          const move = this.dex.moves.get(moveid);
          const moveType = this.getMoveType(move, species, abilities, preferredType);
          if (!this.noStab.includes(moveid) && (move.basePower || move.basePowerCallback)) {
            if (currentAttackType !== moveType)
              coverageMoves.push(moveid);
          }
        }
        if (coverageMoves.length) {
          const moveid = this.sample(coverageMoves);
          counter = this.addMove(
            moveid,
            moves,
            types,
            abilities,
            teamDetails,
            species,
            isLead,
            movePool,
            preferredType,
            role
          );
        }
      }
    }
    while (moves.size < this.maxMoveCount && movePool.length) {
      const moveid = this.sample(movePool);
      counter = this.addMove(
        moveid,
        moves,
        types,
        abilities,
        teamDetails,
        species,
        isLead,
        movePool,
        preferredType,
        role
      );
      for (const pair of MOVE_PAIRS) {
        if (moveid === pair[0] && movePool.includes(pair[1])) {
          counter = this.addMove(
            pair[1],
            moves,
            types,
            abilities,
            teamDetails,
            species,
            isLead,
            movePool,
            preferredType,
            role
          );
        }
        if (moveid === pair[1] && movePool.includes(pair[0])) {
          counter = this.addMove(
            pair[0],
            moves,
            types,
            abilities,
            teamDetails,
            species,
            isLead,
            movePool,
            preferredType,
            role
          );
        }
      }
    }
    return moves;
  }
  shouldCullAbility(ability, types, moves, abilities, counter, movePool, teamDetails, species, preferredType, role) {
    switch (ability) {
      case "Rain Dish":
      case "Sand Veil":
      case "Soundproof":
      case "Sticky Hold":
        return true;
      case "Chlorophyll":
        return !moves.has("sunnyday") && !teamDetails.sun;
      case "Hustle":
        return !counter.get("Physical");
      case "Rock Head":
        return !counter.get("recoil");
      case "Swarm":
        return !counter.get("Bug");
      case "Swift Swim":
        return (
          // Relicanth always wants Swift Swim if it doesn't have Double-Edge
          !moves.has("raindance") && !teamDetails.rain && !(species.id === "relicanth" && !counter.get("recoil")) || !moves.has("raindance") && abilities.has("Water Absorb")
        );
      case "Thick Fat":
        return species.id === "snorlax" || species.id === "hariyama" && moves.has("sleeptalk");
      case "Water Absorb":
        return species.id === "mantine" && moves.has("raindance");
    }
    return false;
  }
  getAbility(types, moves, abilities, counter, movePool, teamDetails, species, preferredType, role) {
    const abilityData = Array.from(abilities).map((a) => this.dex.abilities.get(a));
    import_lib.Utils.sortBy(abilityData, (abil) => -abil.rating);
    if (abilityData.length <= 1)
      return abilityData[0].name;
    if (species.id === "yanma" && counter.get("inaccurate"))
      return "Compound Eyes";
    if (species.id === "arcanine")
      return "Intimidate";
    if (species.id === "blissey")
      return "Natural Cure";
    if (species.id === "heracross" && role === "Berry Sweeper")
      return "Swarm";
    if (species.id === "gardevoir")
      return "Trace";
    let abilityAllowed = [];
    for (const ability of abilityData) {
      if (ability.rating >= 1 && !this.shouldCullAbility(
        ability.name,
        types,
        moves,
        abilities,
        counter,
        movePool,
        teamDetails,
        species,
        preferredType,
        role
      )) {
        abilityAllowed.push(ability);
      }
    }
    if (!abilityAllowed.length) {
      for (const ability of abilityData) {
        if (ability.rating > 0)
          abilityAllowed.push(ability);
      }
      if (!abilityAllowed.length)
        abilityAllowed = abilityData;
    }
    if (abilityAllowed.length === 1)
      return abilityAllowed[0].name;
    if (abilityAllowed[0].rating <= abilityAllowed[1].rating) {
      if (this.randomChance(1, 2))
        [abilityAllowed[0], abilityAllowed[1]] = [abilityAllowed[1], abilityAllowed[0]];
    } else if (abilityAllowed[0].rating - 0.5 <= abilityAllowed[1].rating) {
      if (this.randomChance(1, 3))
        [abilityAllowed[0], abilityAllowed[1]] = [abilityAllowed[1], abilityAllowed[0]];
    }
    return abilityAllowed[0].name;
  }
  getItem(ability, types, moves, counter, teamDetails, species, isLead, preferredType, role) {
    if (species.id === "farfetchd")
      return "Stick";
    if (species.id === "latias" || species.id === "latios")
      return "Soul Dew";
    if (species.id === "linoone" && role === "Setup Sweeper")
      return "Silk Scarf";
    if (species.id === "marowak")
      return "Thick Club";
    if (species.id === "pikachu")
      return "Light Ball";
    if (species.id === "shedinja")
      return "Lum Berry";
    if (species.id === "shuckle")
      return "Leftovers";
    if (species.id === "unown")
      return counter.get("Physical") ? "Choice Band" : "Twisted Spoon";
    if (moves.has("trick"))
      return "Choice Band";
    if (moves.has("rest") && !moves.has("sleeptalk") && (moves.has("dragondance") || !["Early Bird", "Natural Cure", "Shed Skin"].includes(ability)))
      return "Chesto Berry";
    if (counter.get("Physical") >= 4)
      return "Choice Band";
    if (counter.get("Physical") >= 3 && (moves.has("batonpass") || role === "Wallbreaker" && counter.get("Special"))) {
      return "Choice Band";
    }
    if (moves.has("dragondance") && ability !== "Natural Cure" && !moves.has("healbell") && !moves.has("substitute"))
      return "Lum Berry";
    if (moves.has("bellydrum"))
      return moves.has("substitute") ? "Salac Berry" : "Lum Berry";
    if (moves.has("raindance") && counter.get("Special") >= 3)
      return "Petaya Berry";
    if (role === "Berry Sweeper") {
      if (moves.has("endure"))
        return "Salac Berry";
      if (moves.has("flail") || moves.has("reversal"))
        return species.baseStats.spe >= 90 ? "Liechi Berry" : "Salac Berry";
      if (moves.has("substitute") && counter.get("Physical") >= 3)
        return "Liechi Berry";
      if (moves.has("substitute") && counter.get("Special") >= 3)
        return "Petaya Berry";
    }
    const salacReqs = species.baseStats.spe >= 60 && species.baseStats.spe <= 100 && !counter.get("priority");
    if (moves.has("bulkup") && moves.has("substitute") && counter.get("Status") === 2 && salacReqs)
      return "Salac Berry";
    if (moves.has("swordsdance") && moves.has("substitute") && counter.get("Status") === 2) {
      if (salacReqs)
        return "Salac Berry";
      if (species.baseStats.spe > 100 && counter.get("Physical") >= 2)
        return "Liechi Berry";
    }
    if (moves.has("swordsdance") && counter.get("Status") === 1) {
      if (salacReqs)
        return "Salac Berry";
      if (species.baseStats.spe > 100) {
        return counter.get("Physical") >= 3 && this.randomChance(1, 2) ? "Liechi Berry" : "Lum Berry";
      }
    }
    if (species.id === "deoxys" || species.id === "deoxysattack")
      return "White Herb";
    return "Leftovers";
  }
  randomSet(species, teamDetails = {}, isLead = false) {
    species = this.dex.species.get(species);
    const forme = this.getForme(species);
    const sets = this.randomSets[species.id]["sets"];
    const set = this.sampleIfArray(sets);
    const role = set.role;
    const movePool = Array.from(set.movepool);
    const preferredTypes = set.preferredTypes;
    const preferredType = preferredTypes ? preferredTypes.join() : "";
    let ability = "";
    let item = void 0;
    const evs = { hp: 85, atk: 85, def: 85, spa: 85, spd: 85, spe: 85 };
    const ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
    const types = species.types;
    const abilities = new Set(Object.values(species.abilities));
    const moves = this.randomMoveset(
      types,
      abilities,
      teamDetails,
      species,
      isLead,
      movePool,
      preferredType,
      role
    );
    const counter = this.newQueryMoves(moves, species, preferredType, abilities);
    ability = this.getAbility(
      new Set(types),
      moves,
      abilities,
      counter,
      movePool,
      teamDetails,
      species,
      preferredType,
      role
    );
    item = this.getItem(ability, types, moves, counter, teamDetails, species, isLead, preferredType, role);
    const level = this.getLevel(species);
    let hasHiddenPower = false;
    for (const move of moves) {
      if (move.startsWith("hiddenpower"))
        hasHiddenPower = true;
    }
    if (hasHiddenPower) {
      let hpType;
      for (const move of moves) {
        if (move.startsWith("hiddenpower"))
          hpType = move.substr(11);
      }
      if (!hpType)
        throw new Error(`hasHiddenPower is true, but no Hidden Power move was found.`);
      const HPivs = this.dex.types.get(hpType).HPivs;
      let iv;
      for (iv in HPivs) {
        ivs[iv] = HPivs[iv];
      }
    }
    while (evs.hp > 1) {
      const hp2 = Math.floor(Math.floor(2 * species.baseStats.hp + ivs.hp + Math.floor(evs.hp / 4) + 100) * level / 100 + 10);
      if (moves.has("substitute") && ["flail", "reversal"].some((m) => moves.has(m))) {
        if (hp2 % 4 > 0)
          break;
      } else if (moves.has("substitute") && (item === "Salac Berry" || item === "Petaya Berry" || item === "Liechi Berry")) {
        if (hp2 % 4 === 0)
          break;
      } else if (moves.has("bellydrum")) {
        if (hp2 % 2 > 0)
          break;
      } else {
        break;
      }
      evs.hp -= 4;
    }
    if (!counter.get("Physical") && !moves.has("transform")) {
      evs.atk = 0;
      ivs.atk = hasHiddenPower ? (ivs.atk || 31) - 28 : 0;
    }
    let hp = Math.floor(Math.floor(2 * species.baseStats.hp + ivs.hp + Math.floor(evs.hp / 4) + 100) * level / 100 + 10);
    if (moves.has("substitute") && ["endeavor", "flail", "reversal"].some((m) => moves.has(m))) {
      if (hp % 4 === 0)
        evs.hp -= 4;
    } else if (moves.has("substitute") && (item === "Salac Berry" || item === "Petaya Berry" || item === "Liechi Berry")) {
      while (hp % 4 > 0) {
        evs.hp -= 4;
        hp = Math.floor(Math.floor(2 * species.baseStats.hp + ivs.hp + Math.floor(evs.hp / 4) + 100) * level / 100 + 10);
      }
    }
    const shuffledMoves = Array.from(moves);
    this.prng.shuffle(shuffledMoves);
    return {
      name: species.baseSpecies,
      species: forme,
      gender: species.gender,
      shiny: this.randomChance(1, 1024),
      level,
      moves: shuffledMoves,
      ability,
      evs,
      ivs,
      item,
      role
    };
  }
  randomTeam() {
    this.enforceNoDirectCustomBanlistChanges();
    const seed = this.prng.seed;
    const ruleTable = this.dex.formats.getRuleTable(this.format);
    const pokemon = [];
    const isMonotype = !!this.forceMonotype || ruleTable.has("sametypeclause");
    const typePool = this.dex.types.names();
    const type = this.forceMonotype || this.sample(typePool);
    const baseFormes = {};
    const typeCount = {};
    const typeWeaknesses = {};
    const teamDetails = {};
    let numMaxLevelPokemon = 0;
    const pokemonList = this.gen === 3 ? Object.keys(this.randomSets) : Object.keys(this.randomData);
    const [pokemonPool, baseSpeciesPool] = this.getPokemonPool(type, pokemon, isMonotype, pokemonList);
    while (baseSpeciesPool.length && pokemon.length < this.maxTeamSize) {
      const baseSpecies = this.sampleNoReplace(baseSpeciesPool);
      const species = this.dex.species.get(this.sample(pokemonPool[baseSpecies]));
      if (!species.exists)
        continue;
      if (baseFormes[species.baseSpecies])
        continue;
      if (species.name === "Wobbuffet" && this.battleHasWobbuffet)
        continue;
      if (this.dex.gen < 3 && species.name === "Ditto" && this.battleHasDitto)
        continue;
      const types = species.types;
      if (!isMonotype && !this.forceMonotype) {
        const limitFactor = Math.round(this.maxTeamSize / 6) || 1;
        let skip = false;
        for (const typeName of types) {
          if (typeCount[typeName] >= 2 * limitFactor) {
            skip = true;
            break;
          }
        }
        if (skip)
          continue;
        for (const typeName of this.dex.types.names()) {
          if (this.dex.getEffectiveness(typeName, species) > 0) {
            if (!typeWeaknesses[typeName])
              typeWeaknesses[typeName] = 0;
            if (typeWeaknesses[typeName] >= 3 * limitFactor) {
              skip = true;
              break;
            }
          }
        }
        if (skip)
          continue;
        if (!this.adjustLevel && this.getLevel(species) === 100 && numMaxLevelPokemon >= limitFactor) {
          continue;
        }
      }
      const set = this.randomSet(species, teamDetails);
      pokemon.push(set);
      if (pokemon.length === this.maxTeamSize)
        break;
      baseFormes[species.baseSpecies] = 1;
      for (const typeName of types) {
        if (typeName in typeCount) {
          typeCount[typeName]++;
        } else {
          typeCount[typeName] = 1;
        }
      }
      for (const typeName of this.dex.types.names()) {
        if (this.dex.getEffectiveness(typeName, species) > 0) {
          typeWeaknesses[typeName]++;
        }
      }
      if (set.level === 100)
        numMaxLevelPokemon++;
      if (set.ability === "Drizzle" || set.moves.includes("raindance"))
        teamDetails.rain = 1;
      if (set.ability === "Drought" || set.moves.includes("sunnyday"))
        teamDetails.sun = 1;
      if (set.ability === "Sand Stream")
        teamDetails.sand = 1;
      if (set.moves.includes("spikes"))
        teamDetails.spikes = 1;
      if (set.moves.includes("rapidspin"))
        teamDetails.rapidSpin = 1;
      if (species.id === "wobbuffet")
        this.battleHasWobbuffet = true;
      if (species.id === "ditto")
        this.battleHasDitto = true;
    }
    if (pokemon.length < this.maxTeamSize && !isMonotype && !this.forceMonotype && pokemon.length < 12) {
      throw new Error(`Could not build a random team for ${this.format} (seed=${seed})`);
    }
    return pokemon;
  }
}
var random_teams_default = RandomGen3Teams;
//# sourceMappingURL=random-teams.js.map
