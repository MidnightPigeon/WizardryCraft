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
  RandomGen5Teams: () => RandomGen5Teams,
  default: () => random_teams_default
});
module.exports = __toCommonJS(random_teams_exports);
var import_random_teams = __toESM(require("../gen6/random-teams"));
var import_lib = require("../../../lib");
var import_dex = require("../../../sim/dex");
const RECOVERY_MOVES = [
  "healorder",
  "milkdrink",
  "moonlight",
  "morningsun",
  "recover",
  "roost",
  "slackoff",
  "softboiled",
  "synthesis"
];
const PHYSICAL_SETUP = [
  "bellydrum",
  "bulkup",
  "coil",
  "curse",
  "dragondance",
  "honeclaws",
  "howl",
  "meditate",
  "screech",
  "swordsdance"
];
const SPEED_SETUP = [
  "agility",
  "autotomize",
  "flamecharge",
  "rockpolish"
];
const SETUP = [
  "acidarmor",
  "agility",
  "autotomize",
  "bellydrum",
  "bulkup",
  "calmmind",
  "coil",
  "curse",
  "dragondance",
  "flamecharge",
  "growth",
  "honeclaws",
  "howl",
  "irondefense",
  "meditate",
  "nastyplot",
  "quiverdance",
  "raindance",
  "rockpolish",
  "shellsmash",
  "shiftgear",
  "sunnyday",
  "swordsdance",
  "tailglow",
  "workup"
];
const NO_STAB = [
  "aquajet",
  "bulletpunch",
  "chatter",
  "clearsmog",
  "dragontail",
  "eruption",
  "explosion",
  "fakeout",
  "flamecharge",
  "futuresight",
  "iceshard",
  "icywind",
  "incinerate",
  "knockoff",
  "machpunch",
  "pluck",
  "pursuit",
  "quickattack",
  "rapidspin",
  "reversal",
  "selfdestruct",
  "shadowsneak",
  "skyattack",
  "skydrop",
  "snarl",
  "suckerpunch",
  "uturn",
  "vacuumwave",
  "voltswitch",
  "waterspout"
];
const HAZARDS = [
  "spikes",
  "stealthrock",
  "toxicspikes"
];
const PIVOT_MOVES = [
  "uturn",
  "voltswitch"
];
const MOVE_PAIRS = [
  ["lightscreen", "reflect"],
  ["sleeptalk", "rest"],
  ["protect", "wish"],
  ["leechseed", "substitute"]
];
const PRIORITY_POKEMON = [
  "bisharp",
  "breloom",
  "cacturne",
  "dusknoir",
  "honchkrow",
  "scizor",
  "shedinja",
  "shiftry"
];
class RandomGen5Teams extends import_random_teams.default {
  constructor(format, prng) {
    super(format, prng);
    this.randomSets = require("./random-sets.json");
    this.noStab = NO_STAB;
    this.priorityPokemon = PRIORITY_POKEMON;
    this.moveEnforcementCheckers = {
      Bug: (movePool, moves, abilities, types, counter) => !counter.get("Bug") && (movePool.includes("megahorn") || abilities.has("Tinted Lens")),
      Dark: (movePool, moves, abilities, types, counter) => !counter.get("Dark"),
      Dragon: (movePool, moves, abilities, types, counter) => !counter.get("Dragon"),
      Electric: (movePool, moves, abilities, types, counter) => !counter.get("Electric"),
      Fighting: (movePool, moves, abilities, types, counter) => !counter.get("Fighting"),
      Fire: (movePool, moves, abilities, types, counter) => !counter.get("Fire"),
      Flying: (movePool, moves, abilities, types, counter, species) => !counter.get("Flying") && !["mantine", "murkrow"].includes(species.id) && !movePool.includes("hiddenpowerflying"),
      Ghost: (movePool, moves, abilities, types, counter) => !counter.get("Ghost"),
      Grass: (movePool, moves, abilities, types, counter, species) => !counter.get("Grass") && (species.baseStats.atk >= 100 || movePool.includes("leafstorm")),
      Ground: (movePool, moves, abilities, types, counter) => !counter.get("Ground"),
      Ice: (movePool, moves, abilities, types, counter) => !counter.get("Ice"),
      Poison: (movePool, moves, abilities, types, counter) => !counter.get("Poison") && (types.has("Grass") || types.has("Ground")),
      Psychic: (movePool, moves, abilities, types, counter) => !counter.get("Psychic") && (types.has("Fighting") || movePool.includes("calmmind")),
      Rock: (movePool, moves, abilities, types, counter, species) => !counter.get("Rock") && (species.baseStats.atk >= 95 || abilities.has("Rock Head")),
      Steel: (movePool, moves, abilities, types, counter, species) => !counter.get("Steel") && ["aggron", "metagross"].includes(species.id),
      Water: (movePool, moves, abilities, types, counter) => !counter.get("Water")
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
    if (teamDetails.screens && movePool.length >= this.maxMoveCount + 2) {
      if (movePool.includes("reflect"))
        this.fastPop(movePool, movePool.indexOf("reflect"));
      if (movePool.includes("lightscreen"))
        this.fastPop(movePool, movePool.indexOf("lightscreen"));
      if (moves.size + movePool.length <= this.maxMoveCount)
        return;
    }
    if (teamDetails.stealthRock) {
      if (movePool.includes("stealthrock"))
        this.fastPop(movePool, movePool.indexOf("stealthrock"));
      if (moves.size + movePool.length <= this.maxMoveCount)
        return;
    }
    if (teamDetails.rapidSpin) {
      if (movePool.includes("rapidspin"))
        this.fastPop(movePool, movePool.indexOf("rapidspin"));
      if (moves.size + movePool.length <= this.maxMoveCount)
        return;
    }
    if (teamDetails.toxicSpikes) {
      if (movePool.includes("toxicspikes"))
        this.fastPop(movePool, movePool.indexOf("toxicspikes"));
      if (moves.size + movePool.length <= this.maxMoveCount)
        return;
    }
    if (teamDetails.spikes && teamDetails.spikes >= 2) {
      if (movePool.includes("spikes"))
        this.fastPop(movePool, movePool.indexOf("spikes"));
      if (moves.size + movePool.length <= this.maxMoveCount)
        return;
    }
    const badWithSetup = ["healbell", "pursuit", "toxic"];
    const statusMoves = this.dex.moves.all().filter((move) => move.category === "Status" && move.id !== "naturepower").map((move) => move.id);
    const incompatiblePairs = [
      // These moves don't mesh well with other aspects of the set
      [statusMoves, ["healingwish", "switcheroo", "trick"]],
      [SETUP, PIVOT_MOVES],
      [SETUP, HAZARDS],
      [SETUP, badWithSetup],
      [PHYSICAL_SETUP, PHYSICAL_SETUP],
      [["fakeout", "uturn"], ["switcheroo", "trick"]],
      ["substitute", PIVOT_MOVES],
      ["rest", "substitute"],
      // These attacks are redundant with each other
      ["psychic", "psyshock"],
      [["scald", "surf"], "hydropump"],
      [["bodyslam", "return"], ["bodyslam", "doubleedge"]],
      [["gigadrain", "leafstorm"], ["leafstorm", "petaldance", "powerwhip"]],
      [["drainpunch", "focusblast"], ["closecombat", "highjumpkick", "superpower"]],
      ["payback", "pursuit"],
      // Assorted hardcodes go here:
      // Zebstrika
      ["wildcharge", "thunderbolt"],
      // Manectric
      ["flamethrower", "overheat"],
      // Meganium
      ["leechseed", "dragontail"],
      // Volcarona and Heatran
      [["fierydance", "lavaplume"], "fireblast"],
      // Walrein
      ["encore", "roar"],
      // Lunatone
      ["moonlight", "rockpolish"],
      // Smeargle
      ["memento", "whirlwind"],
      // Seviper
      ["switcheroo", "suckerpunch"],
      // Jirachi
      ["bodyslam", "healingwish"]
    ];
    for (const pair of incompatiblePairs)
      this.incompatibleMoves(moves, movePool, pair[0], pair[1]);
    if (species.id === "dugtrio")
      this.incompatibleMoves(moves, movePool, statusMoves, "memento");
    const statusInflictingMoves = ["stunspore", "thunderwave", "toxic", "willowisp", "yawn"];
    if (!abilities.has("Prankster") && role !== "Staller") {
      this.incompatibleMoves(moves, movePool, statusInflictingMoves, statusInflictingMoves);
    }
    if (abilities.has("Guts"))
      this.incompatibleMoves(moves, movePool, "protect", "swordsdance");
  }
  // Generate random moveset for a given species, role, preferred type.
  randomMoveset(types, abilities, teamDetails, species, isLead, movePool, preferredType, role) {
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
    if (movePool.includes("facade") && abilities.has("Guts")) {
      counter = this.addMove(
        "facade",
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
    if (movePool.includes("thunderwave") && abilities.has("Prankster")) {
      counter = this.addMove(
        "thunderwave",
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
    if (["Bulky Support", "Spinner"].includes(role) && !teamDetails.rapidSpin) {
      if (movePool.includes("rapidspin")) {
        counter = this.addMove(
          "rapidspin",
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
    if (["Bulky Attacker", "Bulky Setup"].includes(role) || this.priorityPokemon.includes(species.id)) {
      const priorityMoves = [];
      for (const moveid of movePool) {
        const move = this.dex.moves.get(moveid);
        const moveType = this.getMoveType(move, species, abilities, preferredType);
        if (types.includes(moveType) && move.priority > 0 && (move.basePower || move.basePowerCallback)) {
          priorityMoves.push(moveid);
        }
      }
      if (priorityMoves.length) {
        const moveid = this.sample(priorityMoves);
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
    if (!counter.get("preferred")) {
      const stabMoves = [];
      for (const moveid of movePool) {
        const move = this.dex.moves.get(moveid);
        const moveType = this.getMoveType(move, species, abilities, preferredType);
        if (!this.noStab.includes(moveid) && (move.basePower || move.basePowerCallback) && preferredType === moveType) {
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
      } else {
        if (movePool.includes("uturn") && types.includes("Bug")) {
          counter = this.addMove(
            "uturn",
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
    if (["Bulky Support", "Bulky Attacker", "Bulky Setup", "Spinner", "Staller"].includes(role)) {
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
    if (role.includes("Setup")) {
      const nonSpeedSetupMoves = movePool.filter((moveid) => SETUP.includes(moveid) && !SPEED_SETUP.includes(moveid));
      if (nonSpeedSetupMoves.length) {
        const moveid = this.sample(nonSpeedSetupMoves);
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
      } else {
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
    }
    if (!counter.damagingMoves.size && !(moves.has("uturn") && types.includes("Bug"))) {
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
    if (["Fast Attacker", "Setup Sweeper", "Bulky Attacker", "Wallbreaker"].includes(role)) {
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
      case "Flare Boost":
      case "Gluttony":
      case "Ice Body":
      case "Moody":
      case "Pickpocket":
      case "Pressure":
      case "Sand Veil":
      case "Sniper":
      case "Snow Cloak":
      case "Steadfast":
      case "Unburden":
        return true;
      case "Chlorophyll":
        return species.baseStats.spe > 100 || moves.has("petaldance") || !moves.has("sunnyday") && !teamDetails.sun;
      case "Compound Eyes":
      case "No Guard":
        return !counter.get("inaccurate");
      case "Contrary":
      case "Skill Link":
        return !counter.get((0, import_dex.toID)(ability));
      case "Defiant":
      case "Justified":
      case "Moxie":
        return !counter.get("Physical");
      case "Guts":
        return !moves.has("facade") && !moves.has("sleeptalk");
      case "Hustle":
        return counter.get("Physical") < 2 || species.id === "delibird";
      case "Hydration":
      case "Rain Dish":
      case "Swift Swim":
        return species.baseStats.spe > 100 || !moves.has("raindance") && !teamDetails.rain || !moves.has("raindance") && ["Rock Head", "Water Absorb"].some((abil) => abilities.has(abil));
      case "Intimidate":
        return moves.has("bodyslam") || species.id === "staraptor";
      case "Iron Fist":
        return !counter.get((0, import_dex.toID)(ability)) || species.id === "golurk";
      case "Lightning Rod":
        return types.has("Ground") || (!!teamDetails.rain || moves.has("raindance")) && species.id === "seaking";
      case "Magic Guard":
      case "Speed Boost":
        return abilities.has("Tinted Lens") && role === "Wallbreaker";
      case "Mold Breaker":
        return species.baseSpecies === "Basculin" || species.id === "rampardos";
      case "Overgrow":
        return !counter.get("Grass");
      case "Prankster":
        return !counter.get("Status") || species.id === "tornadus" && moves.has("bulkup");
      case "Poison Heal":
        return species.id === "breloom" && role === "Fast Attacker";
      case "Synchronize":
        return counter.get("Status") < 2 || !!counter.get("recoil");
      case "Regenerator":
        return species.id === "mienshao" && role !== "Fast Attacker" || species.id === "reuniclus";
      case "Reckless":
      case "Rock Head":
        return !counter.get("recoil");
      case "Sand Force":
      case "Sand Rush":
        return !teamDetails.sand;
      case "Serene Grace":
        return !counter.get("serenegrace");
      case "Sheer Force":
        return !counter.get("sheerforce") || moves.has("doubleedge") || abilities.has("Guts");
      case "Simple":
        return !counter.get("setup");
      case "Solar Power":
        return !counter.get("Special") || !teamDetails.sun;
      case "Sticky Hold":
        return species.id !== "accelgor";
      case "Sturdy":
        return !!counter.get("recoil") && !counter.get("recovery") || species.id === "steelix" && !!counter.get("sheerforce");
      case "Swarm":
        return !counter.get("Bug") && !moves.has("uturn");
      case "Technician":
        return !counter.get("technician") || moves.has("tailslap");
      case "Tinted Lens":
        return moves.has("nightshade") || ["illumise", "sigilyph", "yanmega"].some((m) => species.id === m) && role !== "Wallbreaker";
      case "Torrent":
        return !counter.get("Water");
      case "Unaware":
        return role !== "Bulky Attacker" && role !== "Bulky Setup" || species.id === "swoobat";
      case "Water Absorb":
        return moves.has("raindance") || ["Drizzle", "Unaware", "Volt Absorb"].some((abil) => abilities.has(abil));
    }
    return false;
  }
  getAbility(types, moves, abilities, counter, movePool, teamDetails, species, preferredType, role) {
    const abilityData = Array.from(abilities).map((a) => this.dex.abilities.get(a));
    import_lib.Utils.sortBy(abilityData, (abil) => -abil.rating);
    if (abilityData.length <= 1)
      return abilityData[0].name;
    if (abilities.has("Guts") && !abilities.has("Quick Feet") && (moves.has("facade") || moves.has("sleeptalk") && moves.has("rest")))
      return "Guts";
    if (species.id === "starmie")
      return role === "Wallbreaker" ? "Analytic" : "Natural Cure";
    if (species.id === "ninetales")
      return "Drought";
    if (species.id === "gligar")
      return "Immunity";
    if (species.id === "arcanine")
      return "Intimidate";
    if (species.id === "altaria")
      return "Natural Cure";
    if (species.id === "mandibuzz")
      return "Overcoat";
    if (species.id === "ambipom" && !counter.get("technician"))
      return "Pickup";
    if (["spiritomb", "vespiquen", "weavile"].includes(species.id))
      return "Pressure";
    if (species.id === "druddigon")
      return "Rough Skin";
    if (species.id === "stunfisk")
      return "Static";
    if (species.id === "zangoose")
      return "Toxic Boost";
    if (species.id === "porygon2")
      return "Trace";
    if (abilities.has("Harvest"))
      return "Harvest";
    if (abilities.has("Shed Skin") && moves.has("rest") && !moves.has("sleeptalk"))
      return "Shed Skin";
    if (abilities.has("Unburden") && ["acrobatics", "closecombat"].some((m) => moves.has(m)))
      return "Unburden";
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
    if (abilityAllowed[2] && abilityAllowed[0].rating - 0.5 <= abilityAllowed[2].rating) {
      if (abilityAllowed[1].rating <= abilityAllowed[2].rating) {
        if (this.randomChance(1, 2))
          [abilityAllowed[1], abilityAllowed[2]] = [abilityAllowed[2], abilityAllowed[1]];
      } else {
        if (this.randomChance(1, 3))
          [abilityAllowed[1], abilityAllowed[2]] = [abilityAllowed[2], abilityAllowed[1]];
      }
      if (abilityAllowed[0].rating <= abilityAllowed[1].rating) {
        if (this.randomChance(2, 3))
          [abilityAllowed[0], abilityAllowed[1]] = [abilityAllowed[1], abilityAllowed[0]];
      } else {
        if (this.randomChance(1, 2))
          [abilityAllowed[0], abilityAllowed[1]] = [abilityAllowed[1], abilityAllowed[0]];
      }
    } else {
      if (abilityAllowed[0].rating <= abilityAllowed[1].rating) {
        if (this.randomChance(1, 2))
          [abilityAllowed[0], abilityAllowed[1]] = [abilityAllowed[1], abilityAllowed[0]];
      } else if (abilityAllowed[0].rating - 0.5 <= abilityAllowed[1].rating) {
        if (this.randomChance(1, 3))
          [abilityAllowed[0], abilityAllowed[1]] = [abilityAllowed[1], abilityAllowed[0]];
      }
    }
    return abilityAllowed[0].name;
  }
  getPriorityItem(ability, types, moves, counter, teamDetails, species, isLead, preferredType, role) {
    if (species.requiredItems)
      return this.sample(species.requiredItems);
    if (species.id === "farfetchd")
      return "Stick";
    if (species.id === "latias" || species.id === "latios")
      return "Soul Dew";
    if (species.id === "marowak")
      return "Thick Club";
    if (species.id === "pikachu")
      return "Light Ball";
    if (species.id === "shedinja" || species.id === "smeargle")
      return "Focus Sash";
    if (species.id === "unown")
      return "Choice Specs";
    if (species.id === "wobbuffet")
      return "Custap Berry";
    if (ability === "Harvest")
      return "Sitrus Berry";
    if (species.id === "ditto")
      return "Choice Scarf";
    if (species.id === "exploud" && role === "Bulky Attacker")
      return "Choice Band";
    if (ability === "Poison Heal" || moves.has("facade"))
      return "Toxic Orb";
    if (ability === "Speed Boost" && species.id !== "ninjask")
      return "Life Orb";
    if (species.nfe)
      return "Eviolite";
    if (["healingwish", "memento", "switcheroo", "trick"].some((m) => moves.has(m))) {
      if (species.baseStats.spe >= 60 && species.baseStats.spe <= 108 && role !== "Wallbreaker" && !counter.get("priority")) {
        return "Choice Scarf";
      } else {
        return counter.get("Physical") > counter.get("Special") ? "Choice Band" : "Choice Specs";
      }
    }
    if (moves.has("bellydrum"))
      return "Sitrus Berry";
    if (moves.has("shellsmash"))
      return "White Herb";
    if (moves.has("psychoshift"))
      return "Flame Orb";
    if (ability === "Magic Guard" && role !== "Bulky Support") {
      return moves.has("counter") ? "Focus Sash" : "Life Orb";
    }
    if (species.id === "rampardos" && role === "Fast Attacker")
      return "Choice Scarf";
    if (ability === "Sheer Force" && counter.get("sheerforce"))
      return "Life Orb";
    if (moves.has("acrobatics"))
      return "Flying Gem";
    if (species.id === "hitmonlee" && ability === "Unburden")
      return moves.has("fakeout") ? "Normal Gem" : "Fighting Gem";
    if (moves.has("lightscreen") && moves.has("reflect"))
      return "Light Clay";
    if (moves.has("rest") && !moves.has("sleeptalk") && !["Hydration", "Natural Cure", "Shed Skin"].includes(ability)) {
      return "Chesto Berry";
    }
    if (role === "Staller")
      return "Leftovers";
  }
  getItem(ability, types, moves, counter, teamDetails, species, isLead, preferredType, role) {
    const defensiveStatTotal = species.baseStats.hp + species.baseStats.def + species.baseStats.spd;
    const scarfReqs = role !== "Wallbreaker" && species.baseStats.spe >= 60 && species.baseStats.spe <= 108 && !counter.get("priority") && !moves.has("pursuit");
    if (moves.has("pursuit") && moves.has("suckerpunch") && counter.get("Dark") && (!this.priorityPokemon.includes(species.id) || counter.get("Dark") >= 2))
      return "Black Glasses";
    if (counter.get("Special") === 4) {
      return scarfReqs && species.baseStats.spa >= 90 && this.randomChance(1, 2) ? "Choice Scarf" : "Choice Specs";
    }
    if (counter.get("Special") === 3 && moves.has("uturn"))
      return "Choice Specs";
    if (counter.get("Physical") === 4 && species.id !== "jirachi" && species.id !== "spinda" && ["dragontail", "fakeout", "rapidspin"].every((m) => !moves.has(m))) {
      return scarfReqs && (species.baseStats.atk >= 100 || ability === "Pure Power" || ability === "Huge Power") && this.randomChance(1, 2) ? "Choice Scarf" : "Choice Band";
    }
    if (ability === "Sturdy" && moves.has("explosion"))
      return "Custap Berry";
    if (types.includes("Normal") && moves.has("fakeout") && !!counter.get("Normal"))
      return "Silk Scarf";
    if (species.id === "palkia")
      return "Lustrous Orb";
    if (moves.has("outrage") && counter.get("setup"))
      return "Lum Berry";
    if (ability === "Rough Skin" || species.id !== "hooh" && role !== "Wallbreaker" && ability === "Regenerator" && species.baseStats.hp + species.baseStats.def >= 180 && this.randomChance(1, 2))
      return "Rocky Helmet";
    if (["protect", "substitute"].some((m) => moves.has(m)))
      return "Leftovers";
    if (this.dex.getEffectiveness("Ground", species) >= 2 && ability !== "Levitate") {
      return "Air Balloon";
    }
    if (role === "Fast Support" && isLead && defensiveStatTotal < 255 && !counter.get("recovery") && (!counter.get("recoil") || ability === "Rock Head"))
      return "Focus Sash";
    if (role === "Fast Support") {
      return counter.get("Physical") + counter.get("Special") >= 3 && ["rapidspin", "uturn", "voltswitch"].every((m) => !moves.has(m)) && this.dex.getEffectiveness("Rock", species) < 2 ? "Life Orb" : "Leftovers";
    }
    const noExpertBeltMoves = this.noStab.filter((moveid) => ["Dragon", "Normal", "Poison"].includes(this.dex.moves.get(moveid).type));
    const expertBeltReqs = !counter.get("Dragon") && !counter.get("Normal") && !counter.get("Poison") && noExpertBeltMoves.every((m) => !moves.has(m));
    if (!counter.get("Status") && expertBeltReqs && (moves.has("uturn") || moves.has("voltswitch") || role === "Fast Attacker"))
      return "Expert Belt";
    if (["Fast Attacker", "Setup Sweeper", "Wallbreaker"].some((m) => role === m) && this.dex.getEffectiveness("Rock", species) < 2 && ability !== "Sturdy")
      return "Life Orb";
    return "Leftovers";
  }
  randomSet(species, teamDetails = {}, isLead = false) {
    species = this.dex.species.get(species);
    const forme = this.getForme(species);
    const sets = this.randomSets[species.id]["sets"];
    const possibleSets = [];
    let canSpinner = false;
    for (const set2 of sets) {
      if (!teamDetails.rapidSpin && set2.role === "Spinner")
        canSpinner = true;
    }
    for (const set2 of sets) {
      if (teamDetails.rapidSpin && set2.role === "Spinner")
        continue;
      if (canSpinner && set2.role !== "Spinner")
        continue;
      possibleSets.push(set2);
    }
    const set = this.sampleIfArray(possibleSets);
    const role = set.role;
    const movePool = Array.from(set.movepool);
    const preferredTypes = set.preferredTypes;
    const preferredType = this.sampleIfArray(preferredTypes) || "";
    let ability = "";
    let item = void 0;
    const evs = { hp: 85, atk: 85, def: 85, spa: 85, spd: 85, spe: 85 };
    const ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
    const types = species.types;
    const abilities = new Set(Object.values(species.abilities));
    if (species.unreleasedHidden)
      abilities.delete(species.abilities.H);
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
    item = this.getPriorityItem(ability, types, moves, counter, teamDetails, species, isLead, preferredType, role);
    if (item === void 0) {
      item = this.getItem(ability, types, moves, counter, teamDetails, species, isLead, preferredType, role);
    }
    if (item === "Leftovers" && types.includes("Poison")) {
      item = "Black Sludge";
    }
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
    const srImmunity = ability === "Magic Guard";
    let srWeakness = srImmunity ? 0 : this.dex.getEffectiveness("Rock", species);
    if (["highjumpkick", "jumpkick"].some((m) => moves.has(m)))
      srWeakness = 2;
    while (evs.hp > 1) {
      const hp = Math.floor(Math.floor(2 * species.baseStats.hp + ivs.hp + Math.floor(evs.hp / 4) + 100) * level / 100 + 10);
      if (moves.has("substitute") && item === "Sitrus Berry") {
        if (hp % 4 === 0)
          break;
      } else if (moves.has("bellydrum") && item === "Sitrus Berry") {
        if (hp % 2 === 0)
          break;
      } else {
        if (srWeakness <= 0 || ability === "Regenerator" || ["Black Sludge", "Leftovers", "Life Orb"].includes(item))
          break;
        if (item !== "Sitrus Berry" && hp % (4 / srWeakness) > 0)
          break;
        if (item === "Sitrus Berry" && hp % (4 / srWeakness) === 0)
          break;
      }
      evs.hp -= 4;
    }
    if (!counter.get("Physical") && !moves.has("transform")) {
      evs.atk = 0;
      ivs.atk = hasHiddenPower ? (ivs.atk || 31) - 28 : 0;
    }
    if (["gyroball", "metalburst", "trickroom"].some((m) => moves.has(m))) {
      evs.spe = 0;
      ivs.spe = hasHiddenPower ? (ivs.spe || 31) - 28 : 0;
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
    const pokemonList = Object.keys(this.randomSets);
    const [pokemonPool, baseSpeciesPool] = this.getPokemonPool(type, pokemon, isMonotype, pokemonList);
    while (baseSpeciesPool.length && pokemon.length < this.maxTeamSize) {
      const baseSpecies = this.sampleNoReplace(baseSpeciesPool);
      const species = this.dex.species.get(this.sample(pokemonPool[baseSpecies]));
      if (!species.exists)
        continue;
      if (baseFormes[species.baseSpecies])
        continue;
      if (species.name === "Zoroark" && pokemon.length >= this.maxTeamSize - 1)
        continue;
      const limitFactor = Math.round(this.maxTeamSize / 6) || 1;
      const types = species.types;
      if (!isMonotype && !this.forceMonotype) {
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
      const set = this.randomSet(species, teamDetails, pokemon.length === 0);
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
      if (set.ability === "Snow Warning" || set.moves.includes("hail"))
        teamDetails.hail = 1;
      if (set.ability === "Drizzle" || set.moves.includes("raindance"))
        teamDetails.rain = 1;
      if (set.ability === "Sand Stream")
        teamDetails.sand = 1;
      if (set.ability === "Drought" || set.moves.includes("sunnyday"))
        teamDetails.sun = 1;
      if (set.moves.includes("spikes"))
        teamDetails.spikes = (teamDetails.spikes || 0) + 1;
      if (set.moves.includes("stealthrock"))
        teamDetails.stealthRock = 1;
      if (set.moves.includes("toxicspikes"))
        teamDetails.toxicSpikes = 1;
      if (set.moves.includes("rapidspin"))
        teamDetails.rapidSpin = 1;
      if (set.moves.includes("reflect") && set.moves.includes("lightscreen"))
        teamDetails.screens = 1;
    }
    if (pokemon.length < this.maxTeamSize && pokemon.length < 12) {
      throw new Error(`Could not build a random team for ${this.format} (seed=${seed})`);
    }
    return pokemon;
  }
}
var random_teams_default = RandomGen5Teams;
//# sourceMappingURL=random-teams.js.map
