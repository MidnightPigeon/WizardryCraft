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
var random_teams_exports = {};
__export(random_teams_exports, {
  RandomGen7Teams: () => RandomGen7Teams,
  ZeroAttackHPIVs: () => ZeroAttackHPIVs,
  default: () => random_teams_default
});
module.exports = __toCommonJS(random_teams_exports);
var import_random_teams = require("../gen8/random-teams");
var import_lib = require("../../../lib");
var import_dex = require("../../../sim/dex");
const ZeroAttackHPIVs = {
  grass: { hp: 30, spa: 30 },
  fire: { spa: 30, spe: 30 },
  ice: { def: 30 },
  ground: { spa: 30, spd: 30 },
  fighting: { def: 30, spa: 30, spd: 30, spe: 30 },
  electric: { def: 30, spe: 30 },
  psychic: { spe: 30 },
  flying: { spa: 30, spd: 30, spe: 30 },
  rock: { def: 30, spd: 30, spe: 30 }
};
const RECOVERY_MOVES = [
  "healorder",
  "milkdrink",
  "moonlight",
  "morningsun",
  "recover",
  "recycle",
  "roost",
  "shoreup",
  "slackoff",
  "softboiled",
  "strengthsap",
  "synthesis"
];
const CONTRARY_MOVES = [
  "closecombat",
  "leafstorm",
  "overheat",
  "superpower",
  "vcreate"
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
  "poweruppunch",
  "screech",
  "swordsdance"
];
const SPECIAL_SETUP = [
  "calmmind",
  "chargebeam",
  "geomancy",
  "nastyplot",
  "quiverdance",
  "tailglow"
];
const MIXED_SETUP = [
  "celebrate",
  "growth",
  "happyhour",
  "holdhands",
  "shellsmash",
  "workup"
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
  "celebrate",
  "coil",
  "conversion",
  "curse",
  "dragondance",
  "electricterrain",
  "flamecharge",
  "focusenergy",
  "geomancy",
  "growth",
  "happyhour",
  "holdhands",
  "honeclaws",
  "howl",
  "irondefense",
  "meditate",
  "nastyplot",
  "poweruppunch",
  "quiverdance",
  "raindance",
  "rockpolish",
  "shellsmash",
  "shiftgear",
  "swordsdance",
  "tailglow",
  "workup"
];
const NO_STAB = [
  "accelerock",
  "aquajet",
  "bulletpunch",
  "clearsmog",
  "dragontail",
  "eruption",
  "explosion",
  "fakeout",
  "firstimpression",
  "flamecharge",
  "futuresight",
  "iceshard",
  "icywind",
  "incinerate",
  "machpunch",
  "nuzzle",
  "pluck",
  "poweruppunch",
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
  "watershuriken",
  "vacuumwave",
  "voltswitch",
  "waterspout"
];
const HAZARDS = [
  "spikes",
  "stealthrock",
  "stickyweb",
  "toxicspikes"
];
const PROTECT_MOVES = [
  "banefulbunker",
  "kingsshield",
  "protect",
  "spikyshield"
];
const PIVOT_MOVES = [
  "partingshot",
  "uturn",
  "voltswitch"
];
const MOVE_PAIRS = [
  ["lightscreen", "reflect"],
  ["sleeptalk", "rest"],
  ["protect", "wish"],
  ["spikyshield", "wish"],
  ["leechseed", "substitute"],
  ["perishsong", "protect"],
  ["solarbeam", "sunnyday"]
];
const PRIORITY_POKEMON = [
  "aegislashblade",
  "banette",
  "breloom",
  "cacturne",
  "doublade",
  "dusknoir",
  "golisopod",
  "honchkrow",
  "mimikyu",
  "scizor",
  "scizormega",
  "shedinja"
];
function sereneGraceBenefits(move) {
  return move.secondary?.chance && move.secondary.chance >= 20 && move.secondary.chance < 100;
}
class RandomGen7Teams extends import_random_teams.RandomGen8Teams {
  constructor(format, prng) {
    super(format, prng);
    this.randomSets = require("./random-sets.json");
    this.randomFactorySets = require("./factory-sets.json");
    this.randomBSSFactorySets = require("./bss-factory-sets.json");
    this.noStab = NO_STAB;
    this.priorityPokemon = PRIORITY_POKEMON;
    this.moveEnforcementCheckers = {
      Bug: (movePool, moves, abilities, types, counter) => ["megahorn", "pinmissile"].some((m) => movePool.includes(m)) || !counter.get("Bug") && (abilities.has("Tinted Lens") || abilities.has("Adaptability")),
      Dark: (movePool, moves, abilities, types, counter) => !counter.get("Dark"),
      Dragon: (movePool, moves, abilities, types, counter) => !counter.get("Dragon") && !abilities.has("Aerilate"),
      Electric: (movePool, moves, abilities, types, counter) => !counter.get("Electric"),
      Fairy: (movePool, moves, abilities, types, counter) => !counter.get("Fairy"),
      Fighting: (movePool, moves, abilities, types, counter) => !counter.get("Fighting"),
      Fire: (movePool, moves, abilities, types, counter) => !counter.get("Fire"),
      Flying: (movePool, moves, abilities, types, counter, species) => !counter.get("Flying") && !["aerodactylmega", "charizardmegay", "mantine"].includes(species.id) && !movePool.includes("hiddenpowerflying"),
      Ghost: (movePool, moves, abilities, types, counter) => !counter.get("Ghost"),
      Grass: (movePool, moves, abilities, types, counter, species) => !counter.get("Grass") && (species.baseStats.atk >= 100 || movePool.includes("leafstorm")),
      Ground: (movePool, moves, abilities, types, counter) => !counter.get("Ground"),
      Ice: (movePool, moves, abilities, types, counter) => !counter.get("Ice") || !moves.has("blizzard") && movePool.includes("freezedry") || abilities.has("Refrigerate") && (movePool.includes("return") || movePool.includes("hypervoice")),
      Normal: (movePool) => movePool.includes("boomburst"),
      Poison: (movePool, moves, abilities, types, counter) => !counter.get("Poison"),
      Psychic: (movePool, moves, abilities, types, counter) => !counter.get("Psychic") && (types.has("Fighting") || movePool.includes("psychicfangs") || movePool.includes("calmmind")),
      Rock: (movePool, moves, abilities, types, counter, species) => !counter.get("Rock") && (species.baseStats.atk >= 100 || abilities.has("Rock Head")),
      Steel: (movePool, moves, abilities, types, counter, species) => !counter.get("Steel") && species.baseStats.atk >= 100,
      Water: (movePool, moves, abilities, types, counter) => !counter.get("Water")
    };
  }
  newQueryMoves(moves, species, preferredType, abilities = /* @__PURE__ */ new Set()) {
    const counter = new import_random_teams.MoveCounter();
    const types = species.types;
    if (!moves?.size)
      return counter;
    const categories = { Physical: 0, Special: 0, Status: 0 };
    for (const moveid of moves) {
      let move = this.dex.moves.get(moveid);
      if (this.gen === 5 && moveid === "naturepower")
        move = this.dex.moves.get("earthquake");
      const moveType = this.getMoveType(move, species, abilities, preferredType);
      if (move.damage || move.damageCallback) {
        counter.add("damage");
        counter.damagingMoves.add(move);
      } else {
        categories[move.category]++;
      }
      if (moveid === "lowkick" || move.basePower && move.basePower <= 60 && !["nuzzle", "rapidspin"].includes(moveid)) {
        counter.add("technician");
      }
      if (move.multihit && Array.isArray(move.multihit) && move.multihit[1] === 5)
        counter.add("skilllink");
      if (move.recoil || move.hasCrashDamage)
        counter.add("recoil");
      if (move.drain)
        counter.add("drain");
      if (move.basePower || move.basePowerCallback) {
        if (!this.noStab.includes(moveid) || this.priorityPokemon.includes(species.id) && move.priority > 0) {
          counter.add(moveType);
          if (types.includes(moveType))
            counter.add("stab");
          if (preferredType === moveType)
            counter.add("preferred");
          counter.damagingMoves.add(move);
        }
        if (move.flags["bite"])
          counter.add("strongjaw");
        if (move.flags["punch"])
          counter.add("ironfist");
        if (move.flags["sound"])
          counter.add("sound");
        if (move.priority > 0 || moveid === "grassyglide" && abilities.has("Grassy Surge")) {
          counter.add("priority");
        }
      }
      if (move.secondary || move.hasSheerForce) {
        counter.add("sheerforce");
        if (sereneGraceBenefits(move)) {
          counter.add("serenegrace");
        }
      }
      if (move.accuracy && move.accuracy !== true && move.accuracy < 90)
        counter.add("inaccurate");
      if (RECOVERY_MOVES.includes(moveid))
        counter.add("recovery");
      if (CONTRARY_MOVES.includes(moveid))
        counter.add("contrary");
      if (PHYSICAL_SETUP.includes(moveid))
        counter.add("physicalsetup");
      if (SPECIAL_SETUP.includes(moveid))
        counter.add("specialsetup");
      if (MIXED_SETUP.includes(moveid))
        counter.add("mixedsetup");
      if (SPEED_SETUP.includes(moveid))
        counter.add("speedsetup");
      if (SETUP.includes(moveid))
        counter.add("setup");
      if (HAZARDS.includes(moveid))
        counter.add("hazards");
    }
    counter.set("Physical", Math.floor(categories["Physical"]));
    counter.set("Special", Math.floor(categories["Special"]));
    counter.set("Status", categories["Status"]);
    return counter;
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
    if (teamDetails.stickyWeb) {
      if (movePool.includes("stickyweb"))
        this.fastPop(movePool, movePool.indexOf("stickyweb"));
      if (moves.size + movePool.length <= this.maxMoveCount)
        return;
    }
    if (teamDetails.stealthRock) {
      if (movePool.includes("stealthrock"))
        this.fastPop(movePool, movePool.indexOf("stealthrock"));
      if (moves.size + movePool.length <= this.maxMoveCount)
        return;
    }
    if (teamDetails.defog || teamDetails.rapidSpin) {
      if (movePool.includes("defog"))
        this.fastPop(movePool, movePool.indexOf("defog"));
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
    const badWithSetup = ["defog", "dragontail", "haze", "healbell", "nuzzle", "pursuit", "rapidspin", "toxic"];
    const statusMoves = this.dex.moves.all().filter((move) => move.category === "Status").map((move) => move.id);
    const incompatiblePairs = [
      // These moves don't mesh well with other aspects of the set
      [statusMoves, ["healingwish", "memento", "switcheroo", "trick"]],
      [SETUP, PIVOT_MOVES],
      [SETUP, HAZARDS],
      [SETUP, badWithSetup],
      [PHYSICAL_SETUP, PHYSICAL_SETUP],
      [SPEED_SETUP, "quickattack"],
      ["defog", HAZARDS],
      [["fakeout", "uturn"], ["switcheroo", "trick"]],
      ["substitute", PIVOT_MOVES],
      ["leechseed", "dragontail"],
      ["rest", "substitute"],
      [PHYSICAL_SETUP, "dracometeor"],
      [SPECIAL_SETUP, "knockoff"],
      // These attacks are redundant with each other
      ["psychic", "psyshock"],
      ["scald", ["hydropump", "originpulse", "waterpulse"]],
      ["return", ["bodyslam", "doubleedge"]],
      [["fierydance", "firelash", "lavaplume"], ["fireblast", "magmastorm"]],
      [["flamethrower", "flareblitz"], ["fireblast", "overheat"]],
      ["hornleech", "woodhammer"],
      [["gigadrain", "leafstorm"], ["leafstorm", "petaldance", "powerwhip"]],
      ["wildcharge", "thunderbolt"],
      ["gunkshot", "poisonjab"],
      [["drainpunch", "focusblast"], ["closecombat", "highjumpkick", "superpower"]],
      ["stoneedge", "headsmash"],
      ["dracometeor", "dragonpulse"],
      ["dragonclaw", "outrage"],
      ["knockoff", ["darkestlariat", "darkpulse", "foulplay"]],
      // Status move incompatibilities
      ["toxic", "toxicspikes"],
      ["taunt", "disable"],
      ["defog", ["leechseed", "substitute"]],
      // Assorted hardcodes go here:
      // Lunatone
      ["moonlight", "rockpolish"],
      // Smeargle
      ["destinybond", "whirlwind"],
      // Liepard
      ["copycat", "uturn"],
      // Seviper
      ["switcheroo", "suckerpunch"],
      // Jirachi
      ["bodyslam", "healingwish"]
    ];
    for (const pair of incompatiblePairs)
      this.incompatibleMoves(moves, movePool, pair[0], pair[1]);
    if (!types.includes("Dark") && preferredType !== "Dark") {
      this.incompatibleMoves(moves, movePool, "knockoff", ["pursuit", "suckerpunch"]);
    }
    const statusInflictingMoves = ["thunderwave", "toxic", "willowisp", "yawn"];
    if (!abilities.has("Prankster")) {
      this.incompatibleMoves(moves, movePool, statusInflictingMoves, statusInflictingMoves);
    }
    if (abilities.has("Guts"))
      this.incompatibleMoves(moves, movePool, "protect", "swordsdance");
    if (species.id === "porygonz") {
      this.incompatibleMoves(moves, movePool, "shadowball", "recover");
    }
  }
  // Checks for and removes incompatible moves, starting with the first move in movesA.
  incompatibleMoves(moves, movePool, movesA, movesB) {
    const moveArrayA = Array.isArray(movesA) ? movesA : [movesA];
    const moveArrayB = Array.isArray(movesB) ? movesB : [movesB];
    if (moves.size + movePool.length <= this.maxMoveCount)
      return;
    for (const moveid1 of moves) {
      if (moveArrayB.includes(moveid1)) {
        for (const moveid2 of moveArrayA) {
          if (moveid1 !== moveid2 && movePool.includes(moveid2)) {
            this.fastPop(movePool, movePool.indexOf(moveid2));
            if (moves.size + movePool.length <= this.maxMoveCount)
              return;
          }
        }
      }
      if (moveArrayA.includes(moveid1)) {
        for (const moveid2 of moveArrayB) {
          if (moveid1 !== moveid2 && movePool.includes(moveid2)) {
            this.fastPop(movePool, movePool.indexOf(moveid2));
            if (moves.size + movePool.length <= this.maxMoveCount)
              return;
          }
        }
      }
    }
  }
  // Adds a move to the moveset, returns the MoveCounter
  addMove(move, moves, types, abilities, teamDetails, species, isLead, movePool, preferredType, role) {
    moves.add(move);
    this.fastPop(movePool, movePool.indexOf(move));
    const counter = this.newQueryMoves(moves, species, preferredType, abilities);
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
    return counter;
  }
  // Returns the type of a given move for STAB/coverage enforcement purposes
  getMoveType(move, species, abilities, preferredType) {
    if (["judgment", "multiattack", "revelationdance"].includes(move.id))
      return species.types[0];
    if (species.id === "genesectdouse" && move.id === "technoblast")
      return "Water";
    const moveType = move.type;
    if (moveType === "Normal") {
      if (abilities.has("Aerilate"))
        return "Flying";
      if (abilities.has("Galvanize"))
        return "Electric";
      if (abilities.has("Pixilate"))
        return "Fairy";
      if (abilities.has("Refrigerate"))
        return "Ice";
    }
    return moveType;
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
    for (const moveid of ["blizzard", "seismictoss", "spore", "stickyweb"]) {
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
    if (movePool.includes("shadowsneak") && species.id === "kecleon") {
      counter = this.addMove(
        "shadowsneak",
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
    if (role === "Bulky Support" && !teamDetails.defog && !teamDetails.rapidSpin) {
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
      if (movePool.includes("defog")) {
        counter = this.addMove(
          "defog",
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
      const enforcedMoves = [...PROTECT_MOVES, "toxic", "wish"];
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
    if (role.includes("Setup") || role === "Z-Move user") {
      const setupMoves = movePool.filter((moveid) => SETUP.includes(moveid) && moveid !== "flamecharge");
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
      } else {
        if (movePool.includes("flamecharge")) {
          counter = this.addMove(
            "flamecharge",
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
    if (["Fast Attacker", "Setup Sweeper", "Bulky Attacker", "Wallbreaker", "Z-Move user"].includes(role)) {
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
      case "Battle Bond":
      case "Dazzling":
      case "Flare Boost":
      case "Gluttony":
      case "Harvest":
      case "Hyper Cutter":
      case "Ice Body":
      case "Innards Out":
      case "Liquid Voice":
      case "Magician":
      case "Moody":
      case "Pressure":
      case "Sand Veil":
      case "Sniper":
      case "Snow Cloak":
      case "Steadfast":
      case "Weak Armor":
        return true;
      case "Aerilate":
      case "Galvanize":
      case "Pixilate":
      case "Refrigerate":
        return ["doubleedge", "hypervoice", "return"].every((m) => !moves.has(m));
      case "Chlorophyll":
        return species.baseStats.spe > 100 || moves.has("petaldance") || !moves.has("sunnyday") && !teamDetails.sun;
      case "Competitive":
        return !counter.get("Special");
      case "Compound Eyes":
      case "No Guard":
        return !counter.get("inaccurate") || moves.has("shadowpunch");
      case "Contrary":
      case "Skill Link":
      case "Strong Jaw":
        return !counter.get((0, import_dex.toID)(ability));
      case "Defiant":
      case "Justified":
      case "Moxie":
        return !counter.get("Physical");
      case "Guts":
        return !moves.has("facade") && !moves.has("sleeptalk");
      case "Hustle":
        return counter.get("Physical") < 2;
      case "Hydration":
      case "Rain Dish":
      case "Swift Swim":
        return species.baseStats.spe > 100 || !moves.has("raindance") && !teamDetails.rain || !moves.has("raindance") && ["Rock Head", "Water Absorb"].some((abil) => abilities.has(abil));
      case "Intimidate":
        return moves.has("bodyslam") || species.id === "staraptor";
      case "Iron Fist":
        return !counter.get((0, import_dex.toID)(ability)) || moves.has("dynamicpunch");
      case "Lightning Rod":
        return types.has("Ground") || species.id === "marowakalola" || (!!teamDetails.rain || moves.has("raindance")) && species.id === "seaking";
      case "Magic Guard":
      case "Speed Boost":
        return abilities.has("Tinted Lens") && role === "Wallbreaker";
      case "Mold Breaker":
        return species.baseSpecies === "Basculin" || species.id === "pangoro" || species.id === "pinsirmega" || abilities.has("Sheer Force");
      case "Oblivious":
      case "Prankster":
        return !counter.get("Status") || species.id === "tornadus" && moves.has("bulkup");
      case "Overcoat":
        return types.has("Grass");
      case "Overgrow":
        return !counter.get("Grass");
      case "Power Construct":
        return species.forme === "10%";
      case "Synchronize":
        return counter.get("Status") < 2 || !!counter.get("recoil") || !!species.isMega;
      case "Regenerator":
        return species.id === "mienshao" || species.id === "reuniclus";
      case "Reckless":
      case "Rock Head":
        return !counter.get("recoil") || !!species.isMega;
      case "Sand Force":
      case "Sand Rush":
        return !teamDetails.sand;
      case "Scrappy":
        return !types.has("Normal");
      case "Serene Grace":
        return !counter.get("serenegrace");
      case "Sheer Force":
        return !counter.get("sheerforce") || moves.has("doubleedge") || abilities.has("Guts") || !!species.isMega;
      case "Simple":
        return !counter.get("setup");
      case "Slush Rush":
        return !teamDetails.hail;
      case "Snow Warning":
        return moves.has("hypervoice");
      case "Solar Power":
        return !counter.get("Special") || !teamDetails.sun || !!species.isMega;
      case "Sturdy":
        return !!counter.get("recoil") && !counter.get("recovery") || species.id === "steelix" && role === "Wallbreaker";
      case "Swarm":
        return !counter.get("Bug") && !moves.has("uturn") || !!species.isMega;
      case "Technician":
        return !counter.get("technician") || moves.has("tailslap") || !!species.isMega || species.id === "persianalola";
      case "Tinted Lens":
        return ["illumise", "sigilyph", "yanmega"].some((m) => species.id === m) && role !== "Wallbreaker";
      case "Torrent":
        return !counter.get("Water") || !!species.isMega;
      case "Unaware":
        return role !== "Bulky Support" && role !== "Staller";
      case "Unburden":
        return !!species.isMega || !counter.get("setup") && !moves.has("acrobatics");
      case "Water Absorb":
        return moves.has("raindance") || ["Drizzle", "Unaware", "Volt Absorb"].some((abil) => abilities.has(abil));
    }
    return false;
  }
  getAbility(types, moves, abilities, counter, movePool, teamDetails, species, preferredType, role) {
    if (species.battleOnly && !species.requiredAbility) {
      abilities = new Set(Object.values(this.dex.species.get(species.battleOnly).abilities));
    }
    const abilityData = Array.from(abilities).map((a) => this.dex.abilities.get(a));
    import_lib.Utils.sortBy(abilityData, (abil) => -abil.rating);
    if (abilityData.length <= 1)
      return abilityData[0].name;
    if (species.id === "gurdurr" || abilities.has("Guts") && !abilities.has("Quick Feet") && (moves.has("facade") || moves.has("sleeptalk") && moves.has("rest")))
      return "Guts";
    if (species.id === "starmie")
      return role === "Wallbreaker" ? "Analytic" : "Natural Cure";
    if (species.id === "drampa" && moves.has("roost"))
      return "Berserk";
    if (species.id === "ninetales")
      return "Drought";
    if (species.id === "talonflame" && role === "Z-Move user")
      return "Gale Wings";
    if (species.id === "golemalola" && moves.has("return"))
      return "Galvanize";
    if (species.id === "raticatealola")
      return "Hustle";
    if (species.id === "ninjask" || species.id === "seviper")
      return "Infiltrator";
    if (species.id === "arcanine")
      return "Intimidate";
    if (species.id === "lucariomega")
      return "Justified";
    if (species.id === "toucannon" && !counter.get("sheerforce") && !counter.get("skilllink"))
      return "Keen Eye";
    if (species.baseSpecies === "Altaria")
      return "Natural Cure";
    if (species.id === "ambipom" && !counter.get("technician"))
      return "Pickup";
    if (species.id === "muk")
      return "Poison Touch";
    if (["dusknoir", "raikou", "suicune", "vespiquen"].includes(species.id))
      return "Pressure";
    if (species.id === "tsareena")
      return "Queenly Majesty";
    if (species.id === "druddigon" && role === "Bulky Support")
      return "Rough Skin";
    if (species.id === "pangoro" && !counter.get("ironfist"))
      return "Scrappy";
    if (species.id === "kommoo" && role === "Z-Move user")
      return "Soundproof";
    if (species.id === "stunfisk")
      return "Static";
    if (species.id === "breloom")
      return "Technician";
    if (species.id === "zangoose")
      return "Toxic Boost";
    if (species.id === "porygon2")
      return "Trace";
    if (abilities.has("Gluttony") && (moves.has("recycle") || moves.has("bellydrum")))
      return "Gluttony";
    if (abilities.has("Harvest") && (role === "Bulky Support" || role === "Staller"))
      return "Harvest";
    if (abilities.has("Moxie") && (counter.get("Physical") > 3 || moves.has("bounce")))
      return "Moxie";
    if (abilities.has("Regenerator") && role === "AV Pivot")
      return "Regenerator";
    if (abilities.has("Shed Skin") && moves.has("rest") && !moves.has("sleeptalk"))
      return "Shed Skin";
    if (abilities.has("Sniper") && moves.has("focusenergy"))
      return "Sniper";
    if (abilities.has("Unburden") && ["acrobatics", "bellydrum", "closecombat"].some((m) => moves.has(m)))
      return "Unburden";
    if (abilities.has("Weak Armor") && types.has("Water") && counter.get("setup"))
      return "Weak Armor";
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
    if (role === "Z-Move user") {
      if (species.baseSpecies === "Arceus" && species.requiredItems)
        return species.requiredItems[1];
      if (species.name === "Raichu-Alola")
        return "Aloraichium Z";
      if (species.name === "Decidueye")
        return "Decidium Z";
      if (species.name === "Kommo-o")
        return "Kommonium Z";
      if (species.name === "Lunala")
        return "Lunalium Z";
      if (species.baseSpecies === "Lycanroc")
        return "Lycanium Z";
      if (species.name === "Marshadow")
        return "Marshadium Z";
      if (species.name === "Mew")
        return "Mewnium Z";
      if (species.name === "Mimikyu")
        return "Mimikium Z";
      if (species.name === "Necrozma-Dusk-Mane" || species.name === "Necrozma-Dawn-Wings") {
        if (moves.has("autotomize") && moves.has("sunsteelstrike"))
          return "Solganium Z";
        if (moves.has("autotomize") && moves.has("moongeistbeam"))
          return "Lunalium Z";
        return "Ultranecrozium Z";
      }
      if (preferredType === "Normal")
        return "Normalium Z";
      if (preferredType)
        return this.dex.species.get(`Arceus-${preferredType}`).requiredItems[1];
    }
    if (species.requiredItems) {
      if (species.baseSpecies === "Arceus")
        return species.requiredItems[0];
      return this.sample(species.requiredItems);
    }
    if (role === "AV Pivot")
      return "Assault Vest";
    if (species.name === "Farfetch\u2019d")
      return "Stick";
    if (species.baseSpecies === "Marowak")
      return "Thick Club";
    if (species.name === "Pikachu")
      return "Light Ball";
    if (species.name === "Shedinja" || species.name === "Smeargle")
      return "Focus Sash";
    if (species.name === "Unfezant" || moves.has("focusenergy"))
      return "Scope Lens";
    if (species.name === "Unown")
      return "Choice Specs";
    if (species.name === "Wobbuffet")
      return "Custap Berry";
    if (species.name === "Shuckle")
      return "Mental Herb";
    if (ability === "Harvest" || ability === "Cheek Pouch" || ability === "Emergency Exit" && !!counter.get("Status"))
      return "Sitrus Berry";
    if (species.name === "Ditto")
      return "Choice Scarf";
    if (ability === "Poison Heal")
      return "Toxic Orb";
    if (ability === "Speed Boost")
      return "Life Orb";
    if (species.nfe)
      return species.name === "Scyther" && role === "Fast Attacker" ? "Choice Band" : "Eviolite";
    if (["healingwish", "memento", "switcheroo", "trick"].some((m) => moves.has(m))) {
      if (species.baseStats.spe >= 60 && species.baseStats.spe <= 108 && role !== "Wallbreaker") {
        return "Choice Scarf";
      } else {
        return counter.get("Physical") > counter.get("Special") ? "Choice Band" : "Choice Specs";
      }
    }
    if (moves.has("bellydrum") || moves.has("recycle")) {
      if (ability === "Gluttony") {
        return `${this.sample(["Aguav", "Figy", "Iapapa", "Mago", "Wiki"])} Berry`;
      } else {
        return "Sitrus Berry";
      }
    }
    if (moves.has("geomancy") || moves.has("skyattack"))
      return "Power Herb";
    if (moves.has("shellsmash")) {
      return ability === "Solid Rock" && !!counter.get("priority") ? "Weakness Policy" : "White Herb";
    }
    if ((ability === "Guts" || moves.has("facade")) && !moves.has("sleeptalk")) {
      return types.includes("Fire") || ability === "Quick Feet" || ability === "Toxic Boost" ? "Toxic Orb" : "Flame Orb";
    }
    if (ability === "Magic Guard" && role !== "Bulky Support") {
      return moves.has("counter") ? "Focus Sash" : "Life Orb";
    }
    if (species.id === "rampardos" && role === "Fast Attacker")
      return "Choice Scarf";
    if (ability === "Sheer Force" && counter.get("sheerforce"))
      return "Life Orb";
    if (ability === "Unburden")
      return moves.has("closecombat") ? "White Herb" : "Sitrus Berry";
    if (moves.has("acrobatics"))
      return "";
    if (moves.has("auroraveil") || moves.has("lightscreen") && moves.has("reflect"))
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
    if (moves.has("pursuit") && moves.has("suckerpunch") && counter.get("Dark") && !this.priorityPokemon.includes(species.id))
      return "Black Glasses";
    if (counter.get("Special") === 4) {
      return scarfReqs && species.baseStats.spa >= 90 && this.randomChance(1, 2) ? "Choice Scarf" : "Choice Specs";
    }
    if (counter.get("Special") === 3 && moves.has("uturn"))
      return "Choice Specs";
    if (counter.get("Physical") === 4 && species.id !== "jirachi" && ["dragontail", "fakeout", "flamecharge", "nuzzle", "rapidspin"].every((m) => !moves.has(m))) {
      return scarfReqs && (species.baseStats.atk >= 100 || ability === "Pure Power" || ability === "Huge Power") && this.randomChance(1, 2) ? "Choice Scarf" : "Choice Band";
    }
    if (ability === "Sturdy" && moves.has("explosion") && !counter.get("speedsetup"))
      return "Custap Berry";
    if (types.includes("Normal") && moves.has("fakeout") && !!counter.get("Normal"))
      return "Silk Scarf";
    if (role === "Bulky Setup" && !!counter.get("speedsetup") && !moves.has("swordsdance")) {
      return "Weakness Policy";
    }
    if (species.id === "palkia")
      return "Lustrous Orb";
    if (species.id === "archeops")
      return "Expert Belt";
    if (!counter.get("Status") && (["Fast Support", "Bulky Support", "Bulky Attacker"].some((m) => role === m) || moves.has("rapidspin"))) {
      return "Assault Vest";
    }
    if (moves.has("outrage") && counter.get("setup"))
      return "Lum Berry";
    if (ability === "Rough Skin" || species.id !== "hooh" && ability === "Regenerator" && species.baseStats.hp + species.baseStats.def >= 180 && this.randomChance(1, 2))
      return "Rocky Helmet";
    if (["kingsshield", "protect", "spikyshield", "substitute"].some((m) => moves.has(m)))
      return "Leftovers";
    if (this.dex.getEffectiveness("Ground", species) >= 2 && ability !== "Levitate" && species.id !== "golemalola") {
      return "Air Balloon";
    }
    if ((role === "Fast Support" || moves.has("stickyweb")) && isLead && defensiveStatTotal < 255 && !counter.get("recovery") && !moves.has("defog") && (!counter.get("recoil") || ability === "Rock Head") && ability !== "Regenerator")
      return "Focus Sash";
    if (role === "Fast Support") {
      return counter.get("Physical") + counter.get("Special") >= 3 && ["nuzzle", "rapidspin", "uturn", "voltswitch"].every((m) => !moves.has(m)) && this.dex.getEffectiveness("Rock", species) < 2 ? "Life Orb" : "Leftovers";
    }
    if (!counter.get("Status")) {
      return (moves.has("uturn") || moves.has("voltswitch")) && !counter.get("Dragon") && !counter.get("Normal") ? "Expert Belt" : "Life Orb";
    }
    if (["Fast Attacker", "Setup Sweeper", "Wallbreaker"].some((m) => role === m) && (this.dex.getEffectiveness("Rock", species) < 2 || species.id === "ninjask") && ability !== "Sturdy")
      return "Life Orb";
    return "Leftovers";
  }
  getLevel(species) {
    if (this.adjustLevel)
      return this.adjustLevel;
    if (this.gen >= 3) {
      const sets = this.randomSets[species.id];
      if (sets.level)
        return sets.level;
    } else {
      const data = this.randomData[species.id];
      if (data.level)
        return data.level;
    }
    if (this.gen === 2) {
      const levelScale = {
        ZU: 81,
        ZUBL: 79,
        PU: 77,
        PUBL: 75,
        NU: 73,
        NUBL: 71,
        UU: 69,
        UUBL: 67,
        OU: 65,
        Uber: 61
      };
      if (levelScale[species.tier])
        return levelScale[species.tier];
    }
    return 80;
  }
  randomSet(species, teamDetails = {}, isLead = false) {
    species = this.dex.species.get(species);
    const forme = this.getForme(species);
    const sets = this.randomSets[species.id]["sets"];
    const possibleSets = [];
    let canZMove = false;
    for (const set2 of sets) {
      if (!teamDetails.zMove && set2.role === "Z-Move user")
        canZMove = true;
    }
    for (const set2 of sets) {
      if (teamDetails.zMove && set2.role === "Z-Move user")
        continue;
      if (canZMove && ["Setup Sweeper", "Bulky Setup"].includes(set2.role))
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
    if (!counter.get("Physical") && !moves.has("copycat") && !moves.has("transform")) {
      evs.atk = 0;
      ivs.atk = 0;
    }
    if (ability === "Beast Boost" && !counter.get("Special")) {
      evs.spa = 0;
      ivs.spa = 0;
    }
    let hasHiddenPower = false;
    for (const move of moves) {
      if (move.startsWith("hiddenpower"))
        hasHiddenPower = true;
    }
    if (hasHiddenPower && level < 100) {
      let hpType;
      for (const move of moves) {
        if (move.startsWith("hiddenpower"))
          hpType = move.substr(11);
      }
      if (!hpType)
        throw new Error(`hasHiddenPower is true, but no Hidden Power move was found.`);
      const HPivs = ivs.atk === 0 ? ZeroAttackHPIVs[hpType] : this.dex.types.get(hpType).HPivs;
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
      if (moves.has("substitute") && (item === "Sitrus Berry" || ability === "Power Construct" && item !== "Leftovers")) {
        if (hp % 4 === 0)
          break;
      } else if (moves.has("bellydrum") && (item === "Sitrus Berry" || ability === "Gluttony")) {
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
    if (forme === "Nihilego") {
      while (evs.spd > 1) {
        const spa = Math.floor(Math.floor(2 * species.baseStats.spa + ivs.spa + Math.floor(evs.spa / 4)) * level / 100 + 5);
        const spd = Math.floor(Math.floor(2 * species.baseStats.spd + ivs.spd + Math.floor(evs.spd / 4)) * level / 100 + 5);
        if (spa >= spd)
          break;
        evs.spd -= 4;
      }
    }
    if (["gyroball", "metalburst", "trickroom"].some((m) => moves.has(m))) {
      evs.spe = 0;
      ivs.spe = hasHiddenPower && level < 100 ? ivs.spe - 30 : 0;
    }
    const shuffledMoves = Array.from(moves);
    this.prng.shuffle(shuffledMoves);
    if (species.id === "porygonz" && role === "Z-Move user") {
      const firstMove = moves.has("shadowball") ? "shadowball" : "thunderbolt";
      this.fastPop(shuffledMoves, shuffledMoves.indexOf(firstMove));
      shuffledMoves.unshift(firstMove);
    }
    return {
      name: species.baseSpecies,
      species: forme,
      gender: species.baseSpecies === "Greninja" ? "M" : species.gender,
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
    let hasMega = false;
    const typeCount = {};
    const typeComboCount = {};
    const typeWeaknesses = {};
    const teamDetails = {};
    let numMaxLevelPokemon = 0;
    for (const restrict of [true, false]) {
      if (pokemon.length >= this.maxTeamSize)
        break;
      const pokemonList = Object.keys(this.randomSets);
      const [pokemonPool, baseSpeciesPool] = this.getPokemonPool(type, pokemon, isMonotype, pokemonList);
      while (baseSpeciesPool.length && pokemon.length < this.maxTeamSize) {
        const baseSpecies = this.sampleNoReplace(baseSpeciesPool);
        const currentSpeciesPool = [];
        let canMega = false;
        for (const poke of pokemonPool[baseSpecies]) {
          const species2 = this.dex.species.get(poke);
          if (!hasMega && species2.isMega)
            canMega = true;
        }
        for (const poke of pokemonPool[baseSpecies]) {
          const species2 = this.dex.species.get(poke);
          if (hasMega && species2.isMega)
            continue;
          if (canMega && !species2.isMega)
            continue;
          currentSpeciesPool.push(species2);
        }
        const species = this.sample(currentSpeciesPool);
        if (this.gen === 7) {
          if (this.randomSets[species.id]["sets"].length === 1 && this.randomSets[species.id]["sets"][0]["role"] === "Z-Move user" && teamDetails.zMove)
            continue;
        }
        if (!species.exists)
          continue;
        if (baseFormes[species.baseSpecies])
          continue;
        if (hasMega && species.isMega)
          continue;
        const types = species.types;
        const typeCombo = types.slice().sort().join();
        const weakToFreezeDry = this.dex.getEffectiveness("Ice", species) > 0 || this.dex.getEffectiveness("Ice", species) > -2 && types.includes("Water");
        const limitFactor = Math.round(this.maxTeamSize / 6) || 1;
        if (restrict) {
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
            if (weakToFreezeDry) {
              if (!typeWeaknesses["Freeze-Dry"])
                typeWeaknesses["Freeze-Dry"] = 0;
              if (typeWeaknesses["Freeze-Dry"] >= 4 * limitFactor)
                continue;
            }
            if (!this.adjustLevel && this.getLevel(species) === 100 && numMaxLevelPokemon >= limitFactor) {
              continue;
            }
          }
          if (!this.forceMonotype && isMonotype && typeComboCount[typeCombo] >= 3 * limitFactor)
            continue;
        }
        const set = this.randomSet(
          species,
          teamDetails,
          pokemon.length === this.maxTeamSize - 1
        );
        const item = this.dex.items.get(set.item);
        if (item.zMove && teamDetails.zMove)
          continue;
        if (set.ability === "Illusion" && pokemon.length < 1)
          continue;
        pokemon.unshift(set);
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
        if (typeCombo in typeComboCount) {
          typeComboCount[typeCombo]++;
        } else {
          typeComboCount[typeCombo] = 1;
        }
        for (const typeName of this.dex.types.names()) {
          if (this.dex.getEffectiveness(typeName, species) > 0) {
            typeWeaknesses[typeName]++;
          }
        }
        if (weakToFreezeDry)
          typeWeaknesses["Freeze-Dry"]++;
        if (set.level === 100)
          numMaxLevelPokemon++;
        if (item.megaStone || species.name === "Rayquaza-Mega")
          hasMega = true;
        if (item.zMove)
          teamDetails.zMove = 1;
        if (set.ability === "Snow Warning" || set.moves.includes("hail"))
          teamDetails.hail = 1;
        if (set.moves.includes("raindance") || set.ability === "Drizzle" && !item.onPrimal)
          teamDetails.rain = 1;
        if (set.ability === "Sand Stream")
          teamDetails.sand = 1;
        if (set.moves.includes("sunnyday") || set.ability === "Drought" && !item.onPrimal)
          teamDetails.sun = 1;
        if (set.moves.includes("spikes"))
          teamDetails.spikes = (teamDetails.spikes || 0) + 1;
        if (set.moves.includes("stealthrock"))
          teamDetails.stealthRock = 1;
        if (set.moves.includes("stickyweb"))
          teamDetails.stickyWeb = 1;
        if (set.moves.includes("toxicspikes"))
          teamDetails.toxicSpikes = 1;
        if (set.moves.includes("defog"))
          teamDetails.defog = 1;
        if (set.moves.includes("rapidspin"))
          teamDetails.rapidSpin = 1;
        if (set.moves.includes("auroraveil") || set.moves.includes("reflect") && set.moves.includes("lightscreen")) {
          teamDetails.screens = 1;
        }
      }
    }
    if (pokemon.length < this.maxTeamSize && pokemon.length < 12) {
      throw new Error(`Could not build a random team for ${this.format} (seed=${seed})`);
    }
    return pokemon;
  }
  randomFactorySet(species, teamData, tier) {
    const id = (0, import_dex.toID)(species.name);
    const setList = this.randomFactorySets[tier][id].sets;
    const itemsMax = {
      choicespecs: 1,
      choiceband: 1,
      choicescarf: 1
    };
    const movesMax = {
      rapidspin: 1,
      batonpass: 1,
      stealthrock: 1,
      defog: 1,
      spikes: 1,
      toxicspikes: 1
    };
    const requiredMoves = {
      stealthrock: "hazardSet",
      rapidspin: "hazardClear",
      defog: "hazardClear"
    };
    const weatherAbilitiesRequire = {
      hydration: "raindance",
      swiftswim: "raindance",
      leafguard: "sunnyday",
      solarpower: "sunnyday",
      chlorophyll: "sunnyday",
      sandforce: "sandstorm",
      sandrush: "sandstorm",
      sandveil: "sandstorm",
      slushrush: "hail",
      snowcloak: "hail"
    };
    const weatherAbilities = ["drizzle", "drought", "snowwarning", "sandstream"];
    let effectivePool = [];
    const priorityPool = [];
    for (const curSet of setList) {
      if (this.forceMonotype && !species.types.includes(this.forceMonotype))
        continue;
      const allowedItems = [];
      for (const itemString of curSet.item) {
        const item2 = this.dex.items.get(itemString);
        if (teamData.megaCount && teamData.megaCount > 0 && item2.megaStone)
          continue;
        if (teamData.zCount && teamData.zCount > 0 && item2.zMove)
          continue;
        if (itemsMax[item2.id] && teamData.has[item2.id] >= itemsMax[item2.id])
          continue;
        allowedItems.push(itemString);
      }
      if (allowedItems.length === 0)
        continue;
      const curSetItem = this.sample(allowedItems);
      const allowedAbilities = [];
      for (const abilityString of curSet.ability) {
        const ability2 = this.dex.abilities.get(abilityString);
        if (weatherAbilitiesRequire[ability2.id] && teamData.weather !== weatherAbilitiesRequire[ability2.id])
          continue;
        if (teamData.weather && weatherAbilities.includes(ability2.id))
          continue;
        allowedAbilities.push(abilityString);
      }
      if (allowedAbilities.length === 0)
        continue;
      const curSetAbility = this.sample(allowedAbilities);
      let reject = false;
      let hasRequiredMove = false;
      const curSetVariants = [];
      for (const move of curSet.moves) {
        const variantIndex = this.random(move.length);
        const moveId = (0, import_dex.toID)(move[variantIndex]);
        if (movesMax[moveId] && teamData.has[moveId] >= movesMax[moveId]) {
          reject = true;
          break;
        }
        if (requiredMoves[moveId] && !teamData.has[requiredMoves[moveId]]) {
          hasRequiredMove = true;
        }
        curSetVariants.push(variantIndex);
      }
      if (reject)
        continue;
      const fullSetSpec = { set: curSet, moveVariants: curSetVariants, item: curSetItem, ability: curSetAbility };
      effectivePool.push(fullSetSpec);
      if (hasRequiredMove)
        priorityPool.push(fullSetSpec);
    }
    if (priorityPool.length)
      effectivePool = priorityPool;
    if (!effectivePool.length) {
      if (!teamData.forceResult)
        return null;
      for (const curSet of setList) {
        effectivePool.push({ set: curSet });
      }
    }
    const setData = this.sample(effectivePool);
    const moves = [];
    for (const [i, moveSlot] of setData.set.moves.entries()) {
      moves.push(setData.moveVariants ? moveSlot[setData.moveVariants[i]] : this.sample(moveSlot));
    }
    const item = setData.item || this.sampleIfArray(setData.set.item);
    const ability = setData.ability || this.sampleIfArray(setData.set.ability);
    const nature = this.sampleIfArray(setData.set.nature);
    const level = this.adjustLevel || setData.set.level || (tier === "LC" ? 5 : 100);
    return {
      name: setData.set.name || species.baseSpecies,
      species: setData.set.species,
      gender: setData.set.gender || species.gender || (this.randomChance(1, 2) ? "M" : "F"),
      item: item || "",
      ability: ability || species.abilities["0"],
      shiny: typeof setData.set.shiny === "undefined" ? this.randomChance(1, 1024) : setData.set.shiny,
      level,
      happiness: typeof setData.set.happiness === "undefined" ? 255 : setData.set.happiness,
      evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, ...setData.set.evs },
      ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31, ...setData.set.ivs },
      nature: nature || "Serious",
      moves
    };
  }
  randomFactoryTeam(side, depth = 0) {
    this.enforceNoDirectCustomBanlistChanges();
    const forceResult = depth >= 12;
    const isMonotype = !!this.forceMonotype || this.dex.formats.getRuleTable(this.format).has("sametypeclause");
    if (!this.factoryTier) {
      this.factoryTier = isMonotype ? "Mono" : this.sample(["Uber", "OU", "UU", "RU", "NU", "PU", "LC"]);
    } else if (isMonotype && this.factoryTier !== "Mono") {
      throw new Error(`Can't generate a Monotype Battle Factory set in a battle with factory tier ${this.factoryTier}`);
    }
    const tierValues = {
      Uber: 5,
      OU: 4,
      UUBL: 4,
      UU: 3,
      RUBL: 3,
      RU: 2,
      NUBL: 2,
      NU: 1,
      PUBL: 1,
      PU: 0
    };
    const pokemon = [];
    const pokemonPool = Object.keys(this.randomFactorySets[this.factoryTier]);
    const typePool = this.dex.types.names();
    const type = this.sample(typePool);
    const teamData = {
      typeCount: {},
      typeComboCount: {},
      baseFormes: {},
      megaCount: 0,
      zCount: 0,
      has: {},
      forceResult,
      weaknesses: {},
      resistances: {}
    };
    const requiredMoveFamilies = ["hazardSet", "hazardClear"];
    const requiredMoves = {
      stealthrock: "hazardSet",
      rapidspin: "hazardClear",
      defog: "hazardClear"
    };
    const weatherAbilitiesSet = {
      drizzle: "raindance",
      drought: "sunnyday",
      snowwarning: "hail",
      sandstream: "sandstorm"
    };
    const resistanceAbilities = {
      dryskin: ["Water"],
      waterabsorb: ["Water"],
      stormdrain: ["Water"],
      flashfire: ["Fire"],
      heatproof: ["Fire"],
      lightningrod: ["Electric"],
      motordrive: ["Electric"],
      voltabsorb: ["Electric"],
      sapsipper: ["Grass"],
      thickfat: ["Ice", "Fire"],
      levitate: ["Ground"]
    };
    while (pokemonPool.length && pokemon.length < this.maxTeamSize) {
      const species = this.dex.species.get(this.sampleNoReplace(pokemonPool));
      if (!species.exists)
        continue;
      if (this.factoryTier in tierValues && species.tier in tierValues && tierValues[species.tier] > tierValues[this.factoryTier])
        continue;
      const speciesFlags = this.randomFactorySets[this.factoryTier][species.id].flags;
      if (teamData.baseFormes[species.baseSpecies])
        continue;
      if (!teamData.megaCount)
        teamData.megaCount = 0;
      if (teamData.megaCount >= 1 && speciesFlags.megaOnly)
        continue;
      const set = this.randomFactorySet(species, teamData, this.factoryTier);
      if (!set)
        continue;
      const itemData = this.dex.items.get(set.item);
      if (teamData.megaCount >= 1 && itemData.megaStone)
        continue;
      if (teamData.zCount && teamData.zCount >= 1 && itemData.zMove)
        continue;
      let types = species.types;
      const limitFactor = Math.round(this.maxTeamSize / 6) || 1;
      if (isMonotype) {
        if (itemData.megaStone) {
          const megaSpecies = this.dex.species.get(itemData.megaStone);
          if (types.length > megaSpecies.types.length)
            types = [species.types[0]];
          if (megaSpecies.types[1] && types[1] && megaSpecies.types[1] !== types[1]) {
            types = [megaSpecies.types[0]];
          }
        }
        if (!types.includes(type))
          continue;
      } else {
        let skip = false;
        for (const typeName of types) {
          if (teamData.typeCount[typeName] >= 2 * limitFactor && this.randomChance(4, 5)) {
            skip = true;
            break;
          }
        }
        if (skip)
          continue;
        let typeCombo2 = types.slice().sort().join();
        if (set.ability + "" === "Drought" || set.ability + "" === "Drizzle") {
          typeCombo2 = set.ability + "";
        }
        if (teamData.typeComboCount[typeCombo2] >= 1 * limitFactor)
          continue;
      }
      pokemon.push(set);
      const typeCombo = types.slice().sort().join();
      for (const typeName of types) {
        if (typeName in teamData.typeCount) {
          teamData.typeCount[typeName]++;
        } else {
          teamData.typeCount[typeName] = 1;
        }
      }
      teamData.typeComboCount[typeCombo] = teamData.typeComboCount[typeCombo] + 1 || 1;
      teamData.baseFormes[species.baseSpecies] = 1;
      if (itemData.megaStone)
        teamData.megaCount++;
      if (itemData.zMove) {
        if (!teamData.zCount)
          teamData.zCount = 0;
        teamData.zCount++;
      }
      if (itemData.id in teamData.has) {
        teamData.has[itemData.id]++;
      } else {
        teamData.has[itemData.id] = 1;
      }
      const abilityState = this.dex.abilities.get(set.ability);
      if (abilityState.id in weatherAbilitiesSet) {
        teamData.weather = weatherAbilitiesSet[abilityState.id];
      }
      for (const move of set.moves) {
        const moveId = (0, import_dex.toID)(move);
        if (moveId in teamData.has) {
          teamData.has[moveId]++;
        } else {
          teamData.has[moveId] = 1;
        }
        if (moveId in requiredMoves) {
          teamData.has[requiredMoves[moveId]] = 1;
        }
      }
      for (const typeName of this.dex.types.names()) {
        if (teamData.resistances[typeName] >= 1)
          continue;
        if (resistanceAbilities[abilityState.id]?.includes(typeName) || !this.dex.getImmunity(typeName, types)) {
          teamData.resistances[typeName] = (teamData.resistances[typeName] || 0) + 1;
          if (teamData.resistances[typeName] >= 1)
            teamData.weaknesses[typeName] = 0;
          continue;
        }
        const typeMod = this.dex.getEffectiveness(typeName, types);
        if (typeMod < 0) {
          teamData.resistances[typeName] = (teamData.resistances[typeName] || 0) + 1;
          if (teamData.resistances[typeName] >= 1)
            teamData.weaknesses[typeName] = 0;
        } else if (typeMod > 0) {
          teamData.weaknesses[typeName] = (teamData.weaknesses[typeName] || 0) + 1;
        }
      }
    }
    if (pokemon.length < this.maxTeamSize)
      return this.randomFactoryTeam(side, ++depth);
    if (!teamData.forceResult) {
      for (const requiredFamily of requiredMoveFamilies) {
        if (!teamData.has[requiredFamily])
          return this.randomFactoryTeam(side, ++depth);
      }
      for (const typeName in teamData.weaknesses) {
        if (teamData.weaknesses[typeName] >= 3)
          return this.randomFactoryTeam(side, ++depth);
      }
    }
    return pokemon;
  }
  randomBSSFactorySet(species, teamData) {
    const id = (0, import_dex.toID)(species.name);
    const setList = this.randomBSSFactorySets[id].sets;
    const movesMax = {
      batonpass: 1,
      stealthrock: 1,
      spikes: 1,
      toxicspikes: 1,
      doubleedge: 1,
      trickroom: 1
    };
    const requiredMoves = {};
    const weatherAbilitiesRequire = {
      swiftswim: "raindance",
      sandrush: "sandstorm",
      sandveil: "sandstorm"
    };
    const weatherAbilities = ["drizzle", "drought", "snowwarning", "sandstream"];
    let effectivePool = [];
    const priorityPool = [];
    for (const curSet of setList) {
      if (this.forceMonotype && !species.types.includes(this.forceMonotype))
        continue;
      const item = this.dex.items.get(curSet.item);
      if (teamData.megaCount && teamData.megaCount > 1 && item.megaStone)
        continue;
      if (teamData.zCount && teamData.zCount > 1 && item.zMove)
        continue;
      if (teamData.has[item.id])
        continue;
      const ability = this.dex.abilities.get(curSet.ability);
      if (weatherAbilitiesRequire[ability.id] && teamData.weather !== weatherAbilitiesRequire[ability.id])
        continue;
      if (teamData.weather && weatherAbilities.includes(ability.id))
        continue;
      if (curSet.species === "Aron" && teamData.weather !== "sandstorm")
        continue;
      let reject = false;
      let hasRequiredMove = false;
      const curSetVariants = [];
      for (const move of curSet.moves) {
        const variantIndex = this.random(move.length);
        const moveId = (0, import_dex.toID)(move[variantIndex]);
        if (movesMax[moveId] && teamData.has[moveId] >= movesMax[moveId]) {
          reject = true;
          break;
        }
        if (requiredMoves[moveId] && !teamData.has[requiredMoves[moveId]]) {
          hasRequiredMove = true;
        }
        curSetVariants.push(variantIndex);
      }
      if (reject)
        continue;
      effectivePool.push({ set: curSet, moveVariants: curSetVariants });
      if (hasRequiredMove)
        priorityPool.push({ set: curSet, moveVariants: curSetVariants });
    }
    if (priorityPool.length)
      effectivePool = priorityPool;
    if (!effectivePool.length) {
      if (!teamData.forceResult)
        return null;
      for (const curSet of setList) {
        effectivePool.push({ set: curSet });
      }
    }
    const setData = this.sample(effectivePool);
    const moves = [];
    for (const [i, moveSlot] of setData.set.moves.entries()) {
      moves.push(setData.moveVariants ? moveSlot[setData.moveVariants[i]] : this.sample(moveSlot));
    }
    return {
      name: setData.set.nickname || setData.set.name || species.baseSpecies,
      species: setData.set.species,
      gender: setData.set.gender || species.gender || (this.randomChance(1, 2) ? "M" : "F"),
      item: this.sampleIfArray(setData.set.item) || "",
      ability: setData.set.ability || species.abilities["0"],
      shiny: typeof setData.set.shiny === "undefined" ? this.randomChance(1, 1024) : setData.set.shiny,
      level: setData.set.level || 50,
      happiness: typeof setData.set.happiness === "undefined" ? 255 : setData.set.happiness,
      evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, ...setData.set.evs },
      ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31, ...setData.set.ivs },
      nature: setData.set.nature || "Serious",
      moves
    };
  }
  randomBSSFactoryTeam(side, depth = 0) {
    this.enforceNoDirectCustomBanlistChanges();
    const forceResult = depth >= 4;
    const pokemon = [];
    const pokemonPool = Object.keys(this.randomBSSFactorySets);
    const teamData = {
      typeCount: {},
      typeComboCount: {},
      baseFormes: {},
      megaCount: 0,
      zCount: 0,
      eeveeLimCount: 0,
      has: {},
      forceResult,
      weaknesses: {},
      resistances: {}
    };
    const requiredMoveFamilies = [];
    const requiredMoves = {};
    const weatherAbilitiesSet = {
      drizzle: "raindance",
      drought: "sunnyday",
      snowwarning: "hail",
      sandstream: "sandstorm"
    };
    const resistanceAbilities = {
      waterabsorb: ["Water"],
      flashfire: ["Fire"],
      lightningrod: ["Electric"],
      voltabsorb: ["Electric"],
      thickfat: ["Ice", "Fire"],
      levitate: ["Ground"]
    };
    while (pokemonPool.length && pokemon.length < this.maxTeamSize) {
      const species = this.dex.species.get(this.sampleNoReplace(pokemonPool));
      if (!species.exists)
        continue;
      const speciesFlags = this.randomBSSFactorySets[species.id].flags;
      if (!teamData.megaCount)
        teamData.megaCount = 0;
      if (teamData.baseFormes[species.baseSpecies])
        continue;
      if (teamData.megaCount + (teamData.zCount ? teamData.zCount : 0) >= 3 && speciesFlags.megaOnly)
        continue;
      const limitFactor = Math.round(this.maxTeamSize / 6) || 1;
      const types = species.types;
      let skip = false;
      for (const type of types) {
        if (teamData.typeCount[type] >= 2 * limitFactor && this.randomChance(4, 5)) {
          skip = true;
          break;
        }
      }
      if (skip)
        continue;
      if (speciesFlags.limEevee) {
        if (!teamData.eeveeLimCount)
          teamData.eeveeLimCount = 0;
        teamData.eeveeLimCount++;
      }
      if (teamData.eeveeLimCount && teamData.eeveeLimCount >= 1 && speciesFlags.limEevee)
        continue;
      const set = this.randomBSSFactorySet(species, teamData);
      if (!set)
        continue;
      let typeCombo = types.slice().sort().join();
      if (set.ability === "Drought" || set.ability === "Drizzle") {
        typeCombo = set.ability;
      }
      if (teamData.typeComboCount[typeCombo] >= 1 * limitFactor)
        continue;
      pokemon.push(set);
      for (const type of types) {
        if (type in teamData.typeCount) {
          teamData.typeCount[type]++;
        } else {
          teamData.typeCount[type] = 1;
        }
      }
      teamData.typeComboCount[typeCombo] = teamData.typeComboCount[typeCombo] + 1 || 1;
      teamData.baseFormes[species.baseSpecies] = 1;
      const itemData = this.dex.items.get(set.item);
      if (itemData.megaStone)
        teamData.megaCount++;
      if (itemData.zMove) {
        if (!teamData.zCount)
          teamData.zCount = 0;
        teamData.zCount++;
      }
      teamData.has[itemData.id] = 1;
      const abilityState = this.dex.abilities.get(set.ability);
      if (abilityState.id in weatherAbilitiesSet) {
        teamData.weather = weatherAbilitiesSet[abilityState.id];
      }
      for (const move of set.moves) {
        const moveId = (0, import_dex.toID)(move);
        if (moveId in teamData.has) {
          teamData.has[moveId]++;
        } else {
          teamData.has[moveId] = 1;
        }
        if (moveId in requiredMoves) {
          teamData.has[requiredMoves[moveId]] = 1;
        }
      }
      for (const typeName of this.dex.types.names()) {
        if (teamData.resistances[typeName] >= 1)
          continue;
        if (resistanceAbilities[abilityState.id]?.includes(typeName) || !this.dex.getImmunity(typeName, types)) {
          teamData.resistances[typeName] = (teamData.resistances[typeName] || 0) + 1;
          if (teamData.resistances[typeName] >= 1)
            teamData.weaknesses[typeName] = 0;
          continue;
        }
        const typeMod = this.dex.getEffectiveness(typeName, types);
        if (typeMod < 0) {
          teamData.resistances[typeName] = (teamData.resistances[typeName] || 0) + 1;
          if (teamData.resistances[typeName] >= 1)
            teamData.weaknesses[typeName] = 0;
        } else if (typeMod > 0) {
          teamData.weaknesses[typeName] = (teamData.weaknesses[typeName] || 0) + 1;
        }
      }
    }
    if (pokemon.length < this.maxTeamSize)
      return this.randomBSSFactoryTeam(side, ++depth);
    if (!teamData.forceResult) {
      for (const requiredFamily of requiredMoveFamilies) {
        if (!teamData.has[requiredFamily])
          return this.randomBSSFactoryTeam(side, ++depth);
      }
      for (const type in teamData.weaknesses) {
        if (teamData.weaknesses[type] >= 3)
          return this.randomBSSFactoryTeam(side, ++depth);
      }
    }
    return pokemon;
  }
}
var random_teams_default = RandomGen7Teams;
//# sourceMappingURL=random-teams.js.map
