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
var random_doubles_teams_exports = {};
__export(random_doubles_teams_exports, {
  RandomGen7DoublesTeams: () => RandomGen7DoublesTeams,
  default: () => random_doubles_teams_default
});
module.exports = __toCommonJS(random_doubles_teams_exports);
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
class RandomGen7DoublesTeams extends import_random_teams.RandomGen8Teams {
  constructor(format, prng) {
    super(format, prng);
    this.randomDoublesData = require("./random-doubles-data.json");
    this.moveEnforcementCheckers = {
      Bug: (movePool, moves, abilities, types, counter) => ["megahorn", "pinmissile"].some((m) => movePool.includes(m)) || !counter.get("Bug") && (abilities.has("Tinted Lens") || abilities.has("Adaptability")),
      Dark: (movePool, moves, abilities, types, counter, species) => !counter.get("Dark") && !abilities.has("Protean") || moves.has("pursuit") && species.types.length > 1 && counter.get("Dark") === 1,
      Dragon: (movePool, moves, abilities, types, counter) => !counter.get("Dragon") && !abilities.has("Aerilate") && !abilities.has("Pixilate") && !moves.has("dragonascent") && !moves.has("fly") && !moves.has("rest") && !moves.has("sleeptalk"),
      Electric: (movePool, moves, abilities, types, counter) => !counter.get("Electric") || movePool.includes("thunder"),
      Fairy: (movePool, moves, abilities, types, counter) => !counter.get("Fairy") && !types.has("Flying") && !abilities.has("Pixilate"),
      Fighting: (movePool, moves, abilities, types, counter) => !counter.get("Fighting") || !counter.get("stab"),
      Fire: (movePool, moves, abilities, types, counter) => !counter.get("Fire") || ["eruption", "quiverdance"].some((m) => movePool.includes(m)) || moves.has("flamecharge") && (movePool.includes("flareblitz") || movePool.includes("blueflare")),
      Flying: (movePool, moves, abilities, types, counter, species) => !counter.get("Flying") && (species.id === "rotomfan" || abilities.has("Gale Wings") || abilities.has("Serene Grace") || types.has("Normal") && (movePool.includes("beakblast") || movePool.includes("bravebird"))),
      Ghost: (movePool, moves, abilities, types, counter) => (!counter.get("Ghost") || movePool.includes("spectralthief")) && !types.has("Dark") && !abilities.has("Steelworker"),
      Grass: (movePool, moves, abilities, types, counter, species) => !counter.get("Grass") && (species.baseStats.atk >= 100 || movePool.includes("leafstorm")),
      Ground: (movePool, moves, abilities, types, counter) => !counter.get("Ground") && !moves.has("rest") && !moves.has("sleeptalk"),
      Ice: (movePool, moves, abilities, types, counter) => !abilities.has("Refrigerate") && (!counter.get("Ice") || movePool.includes("iciclecrash") || abilities.has("Snow Warning") && movePool.includes("blizzard")),
      Normal: (movePool) => movePool.includes("facade"),
      Poison: (movePool, moves, abilities, types, counter) => !counter.get("Poison") && (!!counter.setupType || abilities.has("Adaptability") || abilities.has("Sheer Force") || movePool.includes("gunkshot")),
      Psychic: (movePool, moves, abilities, types, counter, species) => !counter.get("Psychic") && (abilities.has("Psychic Surge") || movePool.includes("psychicfangs") || !types.has("Steel") && !types.has("Flying") && !abilities.has("Pixilate") && counter.get("stab") < species.types.length),
      Rock: (movePool, moves, abilities, types, counter, species) => !counter.get("Rock") && !types.has("Fairy") && (counter.setupType === "Physical" || species.baseStats.atk >= 105 || abilities.has("Rock Head")),
      Steel: (movePool, moves, abilities, types, counter, species) => !counter.get("Steel") && (species.baseStats.atk >= 100 || abilities.has("Steelworker")),
      Water: (movePool, moves, abilities, types, counter, species) => !counter.get("Water") && !abilities.has("Protean") || !counter.get("stab") || movePool.includes("crabhammer") || abilities.has("Huge Power") && movePool.includes("aquajet"),
      Adaptability: (movePool, moves, abilities, types, counter, species) => !counter.setupType && species.types.length > 1 && (!counter.get(species.types[0]) || !counter.get(species.types[1])),
      Contrary: (movePool, moves, abilities, types, counter, species) => !counter.get("contrary") && species.name !== "Shuckle",
      "Slow Start": (movePool) => movePool.includes("substitute")
    };
  }
  shouldCullMove(move, types, moves, abilities, counter, movePool, teamDetails, species, isLead) {
    switch (move.id) {
      case "clangingscales":
      case "electricterrain":
      case "happyhour":
      case "holdhands":
        return {
          cull: !!teamDetails.zMove,
          isSetup: move.id === "happyhour" || move.id === "holdhands"
        };
      case "cottonguard":
      case "defendorder":
        return { cull: !counter.get("recovery") && !moves.has("rest") };
      case "bounce":
      case "dig":
      case "fly":
        return { cull: !!teamDetails.zMove || counter.setupType !== "Physical" };
      case "focuspunch":
        return { cull: !moves.has("substitute") || counter.damagingMoves.size < 2 };
      case "icebeam":
        return { cull: abilities.has("Tinted Lens") && !!counter.get("Status") };
      case "lightscreen":
        if (movePool.length > 1) {
          const screen = movePool.indexOf("reflect");
          if (screen >= 0)
            this.fastPop(movePool, screen);
        }
        return { cull: !moves.has("reflect") };
      case "perishsong":
        return { cull: !moves.has("protect") };
      case "reflect":
        if (movePool.length > 1) {
          const screen = movePool.indexOf("lightscreen");
          if (screen >= 0)
            this.fastPop(movePool, screen);
        }
        return { cull: !moves.has("calmmind") && !moves.has("lightscreen") };
      case "rest":
        return { cull: movePool.includes("sleeptalk") };
      case "sleeptalk":
        if (movePool.length > 1) {
          const rest = movePool.indexOf("rest");
          if (rest >= 0)
            this.fastPop(movePool, rest);
        }
        return { cull: !moves.has("rest") };
      case "storedpower":
        return { cull: !counter.setupType };
      case "switcheroo":
      case "trick":
        return { cull: counter.get("Physical") + counter.get("Special") < 3 || ["electroweb", "snarl", "suckerpunch"].some((m) => moves.has(m)) };
      case "bellydrum":
      case "bulkup":
      case "coil":
      case "curse":
      case "dragondance":
      case "honeclaws":
      case "swordsdance":
        return { cull: counter.setupType !== "Physical" || counter.get("physicalsetup") > 1 || counter.get("Physical") + counter.get("physicalpool") < 2 || move.id === "bellydrum" && !abilities.has("Unburden") && !counter.get("priority"), isSetup: true };
      case "calmmind":
      case "geomancy":
      case "nastyplot":
      case "tailglow":
        if (types.has("Dark") && moves.has("darkpulse")) {
          counter.setupType = "Special";
          return { cull: false, isSetup: true };
        }
        return { cull: counter.setupType !== "Special" || counter.get("specialsetup") > 1 || counter.get("Special") + counter.get("specialpool") < 2, isSetup: true };
      case "growth":
      case "shellsmash":
      case "workup":
        return { cull: counter.setupType !== "Mixed" || counter.get("mixedsetup") > 1 || counter.damagingMoves.size + counter.get("physicalpool") + counter.get("specialpool") < 2 || move.id === "growth" && !moves.has("sunnyday"), isSetup: true };
      case "agility":
      case "autotomize":
      case "rockpolish":
      case "shiftgear":
        return { cull: counter.damagingMoves.size < 2, isSetup: !counter.setupType };
      case "flamecharge":
        return { cull: moves.has("dracometeor") || moves.has("overheat") || counter.damagingMoves.size < 3 && !counter.setupType };
      case "circlethrow":
      case "dragontail":
        return { cull: !!counter.get("speedsetup") || moves.has("superpower") || !!counter.setupType && (!moves.has("rest") && !moves.has("sleeptalk") || moves.has("stormthrow")) || ["encore", "raindance", "roar", "trickroom", "whirlwind"].some((m) => moves.has(m)) || counter.get(move.type) > 1 && counter.get("Status") > 1 || abilities.has("Sheer Force") && !!counter.get("sheerforce") };
      case "defog":
        return { cull: !!counter.setupType || moves.has("spikes") || moves.has("stealthrock") || !!teamDetails.defog };
      case "fakeout":
      case "tailwind":
        return { cull: !!counter.setupType || ["substitute", "switcheroo", "trick"].some((m) => moves.has(m)) };
      case "foulplay":
        return { cull: !!counter.setupType || !!counter.get("speedsetup") || counter.get("Dark") > 2 || moves.has("clearsmog") || !!counter.get("priority") && counter.damagingMoves.size - 1 === counter.get("priority") };
      case "haze":
      case "spikes":
        return { cull: !!counter.setupType || !!counter.get("speedsetup") || moves.has("trickroom") };
      case "healbell":
      case "technoblast":
        return { cull: !!counter.get("speedsetup") };
      case "healingwish":
      case "memento":
        return { cull: !!counter.setupType || !!counter.get("recovery") || moves.has("substitute") };
      case "helpinghand":
      case "superfang":
      case "yawn":
        return { cull: !!counter.setupType };
      case "icywind":
      case "stringshot":
        return { cull: !!counter.get("speedsetup") || moves.has("trickroom") };
      case "leechseed":
      case "roar":
      case "whirlwind":
        return { cull: !!counter.setupType || !!counter.get("speedsetup") || moves.has("dragontail") || (movePool.includes("protect") || movePool.includes("spikyshield")) };
      case "protect":
        const doublesCondition = moves.has("fakeout") || moves.has("tailwind") && moves.has("roost") || movePool.includes("bellydrum") || movePool.includes("shellsmash");
        return { cull: doublesCondition || !!counter.get("speedsetup") || moves.has("rest") || moves.has("roar") || moves.has("whirlwind") || moves.has("lightscreen") && moves.has("reflect") };
      case "pursuit":
        return { cull: !!counter.setupType || counter.get("Status") > 1 || counter.get("Dark") > 2 || moves.has("knockoff") && !types.has("Dark") };
      case "rapidspin":
        return { cull: !!counter.setupType || !!teamDetails.rapidSpin };
      case "reversal":
        return { cull: moves.has("substitute") && !!teamDetails.zMove };
      case "seismictoss":
        return { cull: !abilities.has("Parental Bond") && (counter.damagingMoves.size > 1 || !!counter.setupType) };
      case "stealthrock":
        return { cull: !!counter.setupType || !!counter.get("speedsetup") || ["rest", "substitute", "trickroom"].some((m) => moves.has(m)) || !!teamDetails.stealthRock };
      case "stickyweb":
        return { cull: !!teamDetails.stickyWeb };
      case "toxicspikes":
        return { cull: !!counter.setupType || !!teamDetails.toxicSpikes };
      case "trickroom":
        return { cull: !!counter.setupType || !!counter.get("speedsetup") || counter.damagingMoves.size < 2 || moves.has("lightscreen") || moves.has("reflect") };
      case "uturn":
        return { cull: abilities.has("Speed Boost") && moves.has("protect") || abilities.has("Protean") && counter.get("Status") > 2 || !!counter.setupType || !!counter.get("speedsetup") };
      case "voltswitch":
        return { cull: !!counter.setupType || !!counter.get("speedsetup") || movePool.includes("boltstrike") || ["electricterrain", "raindance", "uturn"].some((m) => moves.has(m)) };
      case "wish":
        return { cull: species.baseStats.hp < 110 && !abilities.has("Regenerator") && !movePool.includes("protect") && !["ironhead", "protect", "spikyshield", "uturn"].some((m) => moves.has(m)) };
      case "bugbite":
      case "bugbuzz":
      case "infestation":
      case "signalbeam":
        return { cull: moves.has("uturn") && !counter.setupType && !abilities.has("Tinted Lens") };
      case "darkestlariat":
      case "nightslash":
        return { cull: moves.has("knockoff") || moves.has("pursuit") };
      case "darkpulse":
        return { cull: ["crunch", "knockoff", "hyperspacefury"].some((m) => moves.has(m)) && counter.setupType !== "Special" };
      case "suckerpunch":
        return { cull: counter.damagingMoves.size < 2 || moves.has("glare") || !types.has("Dark") && counter.get("Dark") > 1 };
      case "dragonpulse":
      case "spacialrend":
        return { cull: moves.has("dracometeor") || moves.has("outrage") || moves.has("dragontail") && !counter.setupType };
      case "outrage":
        return { cull: moves.has("dragonclaw") || moves.has("dracometeor") && counter.damagingMoves.size < 3 || moves.has("clangingscales") && !teamDetails.zMove };
      case "thunderbolt":
        return { cull: ["discharge", "wildcharge"].some((m) => moves.has(m)) };
      case "moonblast":
        return { cull: moves.has("dazzlinggleam") };
      case "aurasphere":
      case "focusblast":
        return { cull: (moves.has("closecombat") || moves.has("superpower")) && counter.setupType !== "Special" };
      case "drainpunch":
        return { cull: !moves.has("bulkup") && (moves.has("closecombat") || moves.has("highjumpkick")) || (moves.has("focusblast") || moves.has("superpower")) && counter.setupType !== "Physical" };
      case "closecombat":
      case "highjumpkick":
        return { cull: moves.has("bulkup") && moves.has("drainpunch") || counter.setupType === "Special" && ["aurasphere", "focusblast"].some((m) => moves.has(m) || movePool.includes(m)) };
      case "dynamicpunch":
      case "vacuumwave":
        return { cull: (moves.has("closecombat") || moves.has("facade")) && counter.setupType !== "Special" };
      case "stormthrow":
        return { cull: moves.has("circlethrow") };
      case "superpower":
        return {
          cull: counter.get("Fighting") > 1 && !!counter.setupType,
          isSetup: abilities.has("Contrary")
        };
      case "fierydance":
      case "heatwave":
        return { cull: moves.has("fireblast") };
      case "firefang":
      case "firepunch":
      case "flamethrower":
        return { cull: ["blazekick", "heatwave", "overheat"].some((m) => moves.has(m)) || (moves.has("fireblast") || moves.has("lavaplume")) && counter.setupType !== "Physical" };
      case "fireblast":
      case "magmastorm":
        return { cull: moves.has("flareblitz") && counter.setupType !== "Special" || moves.has("lavaplume") && !counter.setupType && !counter.get("speedsetup") };
      case "lavaplume":
        return { cull: moves.has("firepunch") || moves.has("fireblast") && (!!counter.setupType || !!counter.get("speedsetup")) };
      case "overheat":
        return { cull: ["fireblast", "flareblitz", "lavaplume"].some((m) => moves.has(m)) };
      case "hurricane":
        return { cull: moves.has("bravebird") || moves.has("airslash") && !!counter.get("Status") };
      case "hex":
        return { cull: !moves.has("thunderwave") && !moves.has("willowisp") };
      case "shadowball":
        return { cull: moves.has("darkpulse") || moves.has("hex") && moves.has("willowisp") };
      case "shadowclaw":
        return { cull: moves.has("shadowforce") || moves.has("shadowsneak") || moves.has("shadowball") && counter.setupType !== "Physical" };
      case "shadowsneak":
        return { cull: moves.has("trick") || types.has("Ghost") && species.types.length > 1 && counter.get("stab") < 2 };
      case "gigadrain":
        return { cull: moves.has("petaldance") || moves.has("powerwhip") || moves.has("leafstorm") && counter.get("Special") < 4 && !counter.setupType && !moves.has("trickroom") };
      case "leafblade":
      case "woodhammer":
        return { cull: moves.has("gigadrain") && counter.setupType !== "Physical" || moves.has("hornleech") && !!counter.setupType };
      case "leafstorm":
        return { cull: moves.has("trickroom") || moves.has("energyball") || counter.get("Grass") > 1 && !!counter.setupType };
      case "solarbeam":
        return { cull: !abilities.has("Drought") && !moves.has("sunnyday") || moves.has("gigadrain") || moves.has("leafstorm") };
      case "bonemerang":
      case "precipiceblades":
        return { cull: moves.has("earthquake") };
      case "earthpower":
        return { cull: moves.has("earthquake") && counter.setupType !== "Special" };
      case "earthquake":
        return { cull: moves.has("highhorsepower") || moves.has("closecombat") && abilities.has("Aerilate") };
      case "freezedry":
        return { cull: moves.has("icebeam") || moves.has("icywind") || counter.get("stab") < species.types.length || moves.has("blizzard") && !!counter.setupType };
      case "bodyslam":
      case "return":
        return { cull: moves.has("doubleedge") || moves.has("glare") && moves.has("headbutt") || move.id === "return" && moves.has("bodyslam") };
      case "endeavor":
        return { cull: !isLead && !abilities.has("Defeatist") };
      case "explosion":
        return { cull: !!counter.setupType || moves.has("wish") || abilities.has("Refrigerate") && (moves.has("freezedry") || movePool.includes("return")) };
      case "extremespeed":
      case "skyattack":
        return { cull: moves.has("substitute") || counter.setupType !== "Physical" && moves.has("vacuumwave") };
      case "facade":
        return { cull: moves.has("bulkup") };
      case "hiddenpower":
        return { cull: moves.has("rest") || !counter.get("stab") && counter.damagingMoves.size < 2 || counter.setupType === "Special" && types.has("Fairy") && movePool.includes("moonblast") };
      case "hypervoice":
        return { cull: moves.has("blizzard") };
      case "judgment":
        return { cull: counter.setupType !== "Special" && counter.get("stab") > 1 };
      case "quickattack":
        return { cull: !!counter.get("speedsetup") || types.has("Rock") && !!counter.get("Status") || moves.has("feint") || types.has("Normal") && !counter.get("stab") };
      case "weatherball":
        return { cull: !moves.has("raindance") && !moves.has("sunnyday") };
      case "poisonjab":
        return { cull: moves.has("gunkshot") };
      case "acidspray":
      case "sludgewave":
        return { cull: moves.has("poisonjab") || moves.has("sludgebomb") };
      case "psychic":
        return { cull: moves.has("psyshock") };
      case "psychocut":
      case "zenheadbutt":
        return { cull: (moves.has("psychic") || moves.has("psyshock")) && counter.setupType !== "Physical" || abilities.has("Contrary") && !counter.setupType && !!counter.get("physicalpool") };
      case "psyshock":
        const psychic = movePool.indexOf("psychic");
        if (psychic >= 0)
          this.fastPop(movePool, psychic);
        return { cull: false };
      case "headsmash":
        return { cull: moves.has("stoneedge") || moves.has("rockslide") };
      case "stoneedge":
        return { cull: moves.has("rockslide") || species.id === "machamp" && !moves.has("dynamicpunch") };
      case "bulletpunch":
        return { cull: types.has("Steel") && counter.get("stab") < 2 && !abilities.has("Technician") };
      case "flashcannon":
        return { cull: (moves.has("ironhead") || moves.has("meteormash")) && counter.setupType !== "Special" };
      case "hydropump":
        return { cull: moves.has("liquidation") || moves.has("waterfall") || moves.has("scald") && (counter.get("Special") < 4 && !moves.has("uturn") || species.types.length > 1 && counter.get("stab") < 3) };
      case "muddywater":
        return { cull: moves.has("scald") || moves.has("hydropump") };
      case "originpulse":
      case "surf":
        return { cull: moves.has("hydropump") || moves.has("scald") };
      case "scald":
        return { cull: ["liquidation", "waterfall", "waterpulse"].some((m) => moves.has(m)) };
      case "electroweb":
      case "stunspore":
      case "thunderwave":
        return { cull: !!counter.setupType || !!counter.get("speedsetup") || ["discharge", "spore", "toxic", "trickroom", "yawn"].some((m) => moves.has(m)) };
      case "glare":
      case "headbutt":
        return { cull: moves.has("bodyslam") || !moves.has("glare") };
      case "toxic":
        const otherStatus = ["hypnosis", "sleeppowder", "toxicspikes", "willowisp", "yawn"].some((m) => moves.has(m));
        return { cull: otherStatus || !!counter.setupType || moves.has("flamecharge") || moves.has("raindance") };
      case "raindance":
        return { cull: counter.get("Physical") + counter.get("Special") < 2 || moves.has("rest") || !types.has("Water") && !counter.get("Water") };
      case "sunnyday":
        const cull = counter.get("Physical") + counter.get("Special") < 2 || !abilities.has("Chlorophyll") && !abilities.has("Flower Gift") && !moves.has("solarbeam");
        if (cull && movePool.length > 1) {
          const solarbeam = movePool.indexOf("solarbeam");
          if (solarbeam >= 0)
            this.fastPop(movePool, solarbeam);
          if (movePool.length > 1) {
            const weatherball = movePool.indexOf("weatherball");
            if (weatherball >= 0)
              this.fastPop(movePool, weatherball);
          }
        }
        return { cull };
      case "painsplit":
      case "recover":
      case "roost":
      case "synthesis":
        return { cull: moves.has("leechseed") || moves.has("rest") || moves.has("wish") && (moves.has("protect") || movePool.includes("protect")) };
      case "substitute":
        const moveBasedCull = ["copycat", "dragondance", "shiftgear"].some((m) => movePool.includes(m));
        return { cull: moves.has("dracometeor") || moves.has("leafstorm") && !abilities.has("Contrary") || ["encore", "pursuit", "rest", "taunt", "uturn", "voltswitch", "whirlwind"].some((m) => moves.has(m)) || moveBasedCull };
      case "powersplit":
        return { cull: moves.has("guardsplit") };
      case "wideguard":
        return { cull: moves.has("protect") };
      case "bravebird":
        return { cull: (moves.has("raindance") || abilities.has("Drizzle")) && movePool.includes("hurricane") };
    }
    return { cull: false };
  }
  shouldCullAbility(ability, types, moves, abilities, counter, movePool, teamDetails, species) {
    switch (ability) {
      case "Battle Bond":
      case "Dazzling":
      case "Flare Boost":
      case "Hyper Cutter":
      case "Ice Body":
      case "Innards Out":
      case "Moody":
      case "Steadfast":
      case "Magician":
        return true;
      case "Aerilate":
      case "Galvanize":
      case "Pixilate":
      case "Refrigerate":
        return !counter.get("Normal");
      case "Analytic":
      case "Download":
        return species.nfe;
      case "Battle Armor":
      case "Sturdy":
        return !!counter.get("recoil") && !counter.get("recovery");
      case "Chlorophyll":
        return species.baseStats.spe > 100 || abilities.has("Harvest") || !moves.has("sunnyday") && !teamDetails.sun;
      case "Competitive":
        return !counter.get("Special") || moves.has("sleeptalk") && moves.has("rest");
      case "Compound Eyes":
      case "No Guard":
        return !counter.get("inaccurate");
      case "Contrary":
      case "Iron Fist":
      case "Skill Link":
      case "Strong Jaw":
        return !counter.get((0, import_dex.toID)(ability));
      case "Defiant":
      case "Justified":
      case "Moxie":
        return !counter.get("Physical") || moves.has("dragontail");
      case "Flash Fire":
        return abilities.has("Drought");
      case "Gluttony":
        return !moves.has("bellydrum");
      case "Harvest":
        return abilities.has("Frisk");
      case "Hustle":
        return counter.get("Physical") < 2;
      case "Hydration":
      case "Rain Dish":
      case "Swift Swim":
        return species.baseStats.spe > 100 || !moves.has("raindance") && !teamDetails.rain || !moves.has("raindance") && ["Rock Head", "Water Absorb"].some((abil) => abilities.has(abil));
      case "Slush Rush":
      case "Snow Cloak":
        return !teamDetails.hail;
      case "Immunity":
      case "Snow Warning":
        return moves.has("facade") || moves.has("hypervoice");
      case "Intimidate":
        return moves.has("bodyslam") || moves.has("rest") || abilities.has("Reckless") && counter.get("recoil") > 1;
      case "Lightning Rod":
        return species.types.includes("Ground") || (!!teamDetails.rain || moves.has("raindance")) && abilities.has("Swift Swim");
      case "Limber":
        return species.types.includes("Electric");
      case "Liquid Voice":
        return !counter.get("sound");
      case "Magic Guard":
      case "Speed Boost":
        return abilities.has("Tinted Lens") && (!counter.get("Status") || moves.has("uturn"));
      case "Magnet Pull":
        return !!counter.get("Normal") || !types.has("Electric") && !moves.has("earthpower");
      case "Mold Breaker":
        return moves.has("acrobatics") || moves.has("sleeptalk") || abilities.has("Adaptability") || abilities.has("Iron Fist") || abilities.has("Sheer Force") && !!counter.get("sheerforce");
      case "Overgrow":
        return !counter.get("Grass");
      case "Poison Heal":
        return abilities.has("Technician") && !!counter.get("technician");
      case "Power Construct":
        return species.forme === "10%";
      case "Prankster":
        return !counter.get("Status");
      case "Pressure":
      case "Synchronize":
        return counter.get("Status") < 2 || !!counter.get("recoil") || !!species.isMega;
      case "Regenerator":
        return abilities.has("Magic Guard");
      case "Quick Feet":
        return moves.has("bellydrum");
      case "Reckless":
      case "Rock Head":
        return !counter.get("recoil") || !!species.isMega;
      case "Sand Force":
      case "Sand Rush":
      case "Sand Veil":
        return !teamDetails.sand;
      case "Scrappy":
        return !species.types.includes("Normal");
      case "Serene Grace":
        return !counter.get("serenegrace") || species.name === "Blissey";
      case "Sheer Force":
        return !counter.get("sheerforce") || moves.has("doubleedge") || abilities.has("Guts") || !!species.isMega;
      case "Simple":
        return !counter.setupType && !moves.has("flamecharge");
      case "Solar Power":
        return !counter.get("Special") || abilities.has("Harvest") || !teamDetails.sun || !!species.isMega;
      case "Swarm":
        return !counter.get("Bug") || !!species.isMega;
      case "Sweet Veil":
        return types.has("Grass");
      case "Technician":
        return !counter.get("technician") || moves.has("tailslap") || !!species.isMega;
      case "Tinted Lens":
        return moves.has("protect") || !!counter.get("damage") || counter.get("Status") > 2 && !counter.setupType || abilities.has("Prankster") || abilities.has("Magic Guard") && !!counter.get("Status");
      case "Torrent":
        return !counter.get("Water") || !!species.isMega;
      case "Unaware":
        return !!counter.setupType || abilities.has("Magic Guard");
      case "Unburden":
        return !!species.isMega || abilities.has("Prankster") || !counter.setupType && !moves.has("acrobatics");
      case "Water Absorb":
        return moves.has("raindance") || ["Drizzle", "Unaware", "Volt Absorb"].some((abil) => abilities.has(abil));
      case "Weak Armor":
        return counter.setupType !== "Physical";
    }
    return false;
  }
  getAbility(types, moves, abilities, counter, movePool, teamDetails, species) {
    if (species.battleOnly && !species.requiredAbility) {
      abilities = new Set(Object.values(this.dex.species.get(species.battleOnly).abilities));
    }
    const abilityData = Array.from(abilities).map((a) => this.dex.abilities.get(a));
    import_lib.Utils.sortBy(abilityData, (abil) => -abil.rating);
    if (abilityData.length <= 1)
      return abilityData[0].name;
    if (abilities.has("Guts") && !abilities.has("Quick Feet") && (moves.has("facade") || moves.has("sleeptalk") && moves.has("rest")))
      return "Guts";
    if (abilities.has("Intimidate"))
      return "Intimidate";
    if (abilities.has("Guts"))
      return "Guts";
    if (abilities.has("Storm Drain"))
      return "Storm Drain";
    if (abilities.has("Harvest"))
      return "Harvest";
    if (abilities.has("Unburden") && !abilities.has("Prankster") && !species.isMega)
      return "Unburden";
    if (species.name === "Ambipom" && !counter.get("technician")) {
      return "Pickup";
    }
    if (species.name === "Raticate-Alola")
      return "Hustle";
    if (species.baseSpecies === "Altaria")
      return "Natural Cure";
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
        species
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
  /** Item generation specific to Random Doubles */
  getDoublesItem(ability, types, moves, abilities, counter, teamDetails, species) {
    const defensiveStatTotal = species.baseStats.hp + species.baseStats.def + species.baseStats.spd;
    if (species.requiredItems) {
      if (species.baseSpecies === "Arceus" && (moves.has("judgment") || !counter.get(species.types[0]) || teamDetails.zMove)) {
        return species.requiredItems[0];
      }
      return this.sample(species.requiredItems);
    }
    if (species.name === "Dedenne")
      return moves.has("substitute") ? "Petaya Berry" : "Sitrus Berry";
    if (species.name === "Deoxys-Attack")
      return "Life Orb";
    if (species.name === "Farfetch\u2019d")
      return "Stick";
    if (species.name === "Genesect" && moves.has("technoblast"))
      return "Douse Drive";
    if (species.baseSpecies === "Marowak")
      return "Thick Club";
    if (species.name === "Pikachu")
      return "Light Ball";
    if (species.name === "Shedinja" || species.name === "Smeargle")
      return "Focus Sash";
    if (species.name === "Unfezant" && counter.get("Physical") >= 2)
      return "Scope Lens";
    if (species.name === "Unown")
      return "Choice Specs";
    if (species.name === "Wobbuffet")
      return "Custap Berry";
    if (ability === "Harvest" || ability === "Emergency Exit" && !!counter.get("Status"))
      return "Sitrus Berry";
    if (ability === "Imposter")
      return "Choice Scarf";
    if (ability === "Poison Heal")
      return "Toxic Orb";
    if (species.nfe)
      return ability === "Technician" && counter.get("Physical") >= 4 ? "Choice Band" : "Eviolite";
    if (moves.has("switcheroo") || moves.has("trick")) {
      if (species.baseStats.spe >= 60 && species.baseStats.spe <= 108) {
        return "Choice Scarf";
      } else {
        return counter.get("Physical") > counter.get("Special") ? "Choice Band" : "Choice Specs";
      }
    }
    if (moves.has("bellydrum")) {
      if (ability === "Gluttony") {
        return `${this.sample(["Aguav", "Figy", "Iapapa", "Mago", "Wiki"])} Berry`;
      } else if (species.baseStats.spe <= 50 && !teamDetails.zMove && this.randomChance(1, 2)) {
        return "Normalium Z";
      } else {
        return "Sitrus Berry";
      }
    }
    if (moves.has("copycat") && counter.get("Physical") >= 3)
      return "Choice Band";
    if (moves.has("geomancy") || moves.has("skyattack"))
      return "Power Herb";
    if (moves.has("shellsmash")) {
      return ability === "Solid Rock" && !!counter.get("priority") ? "Weakness Policy" : "White Herb";
    }
    if ((ability === "Guts" || moves.has("facade")) && !moves.has("sleeptalk")) {
      return types.has("Fire") || ability === "Quick Feet" || ability === "Toxic Boost" ? "Toxic Orb" : "Flame Orb";
    }
    if (ability === "Magic Guard" && counter.damagingMoves.size > 1) {
      return moves.has("counter") ? "Focus Sash" : "Life Orb";
    }
    if (ability === "Sheer Force" && counter.get("sheerforce"))
      return "Life Orb";
    if (ability === "Unburden")
      return moves.has("fakeout") ? "Normal Gem" : "Sitrus Berry";
    if (moves.has("acrobatics"))
      return "";
    if (moves.has("electricterrain") || ability === "Electric Surge" && moves.has("thunderbolt"))
      return "Electrium Z";
    if (moves.has("happyhour") || moves.has("holdhands") || moves.has("encore") && ability === "Contrary")
      return "Normalium Z";
    if (moves.has("raindance")) {
      if (species.baseSpecies === "Castform" && !teamDetails.zMove) {
        return "Waterium Z";
      } else {
        return ability === "Forecast" ? "Damp Rock" : "Life Orb";
      }
    }
    if (moves.has("sunnyday")) {
      if ((species.baseSpecies === "Castform" || species.baseSpecies === "Cherrim") && !teamDetails.zMove) {
        return "Firium Z";
      } else {
        return ability === "Forecast" ? "Heat Rock" : "Life Orb";
      }
    }
    if (moves.has("solarbeam") && ability !== "Drought" && !moves.has("sunnyday") && !teamDetails.sun) {
      return !teamDetails.zMove ? "Grassium Z" : "Power Herb";
    }
    if (moves.has("auroraveil") || moves.has("lightscreen") && moves.has("reflect"))
      return "Light Clay";
    if (moves.has("rest") && !moves.has("sleeptalk") && ability !== "Natural Cure" && ability !== "Shed Skin" && ability !== "Shadow Tag") {
      return "Chesto Berry";
    }
    if (!teamDetails.zMove) {
      if (species.name === "Decidueye" && moves.has("spiritshackle") && counter.setupType) {
        return "Decidium Z";
      }
      if (species.name === "Kommo-o")
        return moves.has("clangingscales") ? "Kommonium Z" : "Dragonium Z";
      if (species.baseSpecies === "Lycanroc" && moves.has("stoneedge") && counter.setupType) {
        return "Lycanium Z";
      }
      if (species.name === "Marshadow" && moves.has("spectralthief") && counter.setupType) {
        return "Marshadium Z";
      }
      if (species.name === "Necrozma-Dusk-Mane" || species.name === "Necrozma-Dawn-Wings") {
        if (moves.has("autotomize") && moves.has("sunsteelstrike")) {
          return "Solganium Z";
        } else if (moves.has("trickroom") && moves.has("moongeistbeam")) {
          return "Lunalium Z";
        } else {
          return "Ultranecrozium Z";
        }
      }
      if (species.name === "Mimikyu" && moves.has("playrough") && counter.setupType)
        return "Mimikium Z";
      if (species.name === "Raichu-Alola" && moves.has("thunderbolt") && counter.setupType)
        return "Aloraichium Z";
      if (moves.has("bugbuzz") && counter.setupType && species.baseStats.spa > 100)
        return "Buginium Z";
      if (moves.has("darkpulse") && ability === "Fur Coat" && counter.setupType || moves.has("suckerpunch") && ability === "Moxie" && counter.get("Dark") < 2) {
        return "Darkinium Z";
      }
      if (moves.has("outrage") && counter.setupType && !moves.has("fly"))
        return "Dragonium Z";
      if (moves.has("fleurcannon") && !!counter.get("speedsetup"))
        return "Fairium Z";
      if (moves.has("focusblast") && types.has("Fighting") && counter.setupType || moves.has("reversal") && moves.has("substitute")) {
        return "Fightinium Z";
      }
      if (moves.has("fly") || moves.has("hurricane") && species.baseStats.spa >= 125 && (!!counter.get("Status") || moves.has("superpower")) || (moves.has("bounce") || moves.has("bravebird")) && counter.setupType) {
        return "Flyinium Z";
      }
      if (moves.has("shadowball") && counter.setupType && ability === "Beast Boost")
        return "Ghostium Z";
      if (moves.has("sleeppowder") && types.has("Grass") && counter.setupType && species.baseStats.spe <= 70) {
        return "Grassium Z";
      }
      if (moves.has("magmastorm"))
        return "Firium Z";
      if (moves.has("dig"))
        return "Groundium Z";
      if (moves.has("photongeyser") && counter.setupType)
        return "Psychium Z";
      if (moves.has("stoneedge") && types.has("Rock") && moves.has("swordsdance"))
        return "Rockium Z";
      if (moves.has("hydropump") && ability === "Battle Bond" && moves.has("uturn"))
        return "Waterium Z";
      if (moves.has("hail") || moves.has("blizzard") && ability !== "Snow Warning")
        return "Icium Z";
    }
    if ((ability === "Speed Boost" || ability === "Stance Change" || species.name === "Pheromosa") && counter.get("Physical") + counter.get("Special") > 2 && !moves.has("uturn")) {
      return "Life Orb";
    }
    if (moves.has("uturn") && counter.get("Physical") === 4 && !moves.has("fakeout")) {
      return species.baseStats.spe >= 60 && species.baseStats.spe <= 108 && !counter.get("priority") && this.randomChance(1, 2) ? "Choice Scarf" : "Choice Band";
    }
    if (counter.get("Special") === 4 && (moves.has("waterspout") || moves.has("eruption"))) {
      return "Choice Scarf";
    }
    if (["endeavor", "flail", "reversal"].some((m) => moves.has(m)) && ability !== "Sturdy") {
      return ability === "Defeatist" ? "Expert Belt" : "Focus Sash";
    }
    if (moves.has("outrage") && counter.setupType)
      return "Lum Berry";
    if (counter.damagingMoves.size >= 3 && species.baseStats.spe >= 70 && ability !== "Multiscale" && ability !== "Sturdy" && [
      "acidspray",
      "electroweb",
      "fakeout",
      "feint",
      "flamecharge",
      "icywind",
      "incinerate",
      "naturesmadness",
      "rapidspin",
      "snarl",
      "suckerpunch",
      "uturn"
    ].every((m) => !moves.has(m))) {
      return defensiveStatTotal >= 275 ? "Sitrus Berry" : "Life Orb";
    }
    if (moves.has("substitute"))
      return counter.damagingMoves.size > 2 && !!counter.get("drain") ? "Life Orb" : "Leftovers";
    if ((ability === "Iron Barbs" || ability === "Rough Skin") && this.randomChance(1, 2))
      return "Rocky Helmet";
    if (counter.get("Physical") + counter.get("Special") >= 4 && species.baseStats.spd >= 50 && defensiveStatTotal >= 235) {
      return "Assault Vest";
    }
    if (species.name === "Palkia" && (moves.has("dracometeor") || moves.has("spacialrend")) && moves.has("hydropump")) {
      return "Lustrous Orb";
    }
    if (species.types.includes("Normal") && moves.has("fakeout") && counter.get("Normal") >= 2)
      return "Silk Scarf";
    if (counter.damagingMoves.size >= 4) {
      return counter.get("Dragon") || moves.has("suckerpunch") || counter.get("Normal") ? "Life Orb" : "Expert Belt";
    }
    if (counter.damagingMoves.size >= 3 && !!counter.get("speedsetup") && defensiveStatTotal >= 300) {
      return "Weakness Policy";
    }
    if (moves.has("stickyweb") && ability === "Sturdy")
      return "Mental Herb";
    if (ability === "Serene Grace" && moves.has("airslash") && species.baseStats.spe > 100)
      return "Metronome";
    if (ability === "Sturdy" && moves.has("explosion") && !counter.get("speedsetup"))
      return "Custap Berry";
    if (ability === "Super Luck")
      return "Scope Lens";
  }
  randomSet(species, teamDetails = {}, isLead = false, isDoubles = true) {
    species = this.dex.species.get(species);
    let forme = species.name;
    if (typeof species.battleOnly === "string") {
      forme = species.battleOnly;
    }
    if (species.cosmeticFormes) {
      forme = this.sample([species.name].concat(species.cosmeticFormes));
    }
    const data = this.randomDoublesData[species.id];
    const movePool = [...data.moves || this.dex.species.getMovePool(species.id)];
    if (this.format.gameType === "multi") {
      const allySwitch = movePool.indexOf("allyswitch");
      if (allySwitch > -1) {
        if (movePool.length > this.maxMoveCount) {
          this.fastPop(movePool, allySwitch);
        } else {
          movePool[allySwitch] = "sleeptalk";
        }
      }
    }
    const rejectedPool = [];
    const moves = /* @__PURE__ */ new Set();
    let ability = "";
    const evs = { hp: 85, atk: 85, def: 85, spa: 85, spd: 85, spe: 85 };
    const ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
    const types = new Set(species.types);
    const abilities = /* @__PURE__ */ new Set();
    for (const abilityName of Object.values(species.abilities)) {
      if (abilityName === species.abilities.S || species.unreleasedHidden && abilityName === species.abilities.H)
        continue;
      abilities.add(abilityName);
    }
    let availableHP = 0;
    for (const moveid of movePool) {
      if (moveid.startsWith("hiddenpower"))
        availableHP++;
    }
    const SetupException = ["closecombat", "diamondstorm", "extremespeed", "superpower", "clangingscales"];
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
      counter = this.queryMoves(moves, species.types, abilities, movePool);
      const runEnforcementChecker = (checkerName) => {
        if (!this.moveEnforcementCheckers[checkerName])
          return false;
        return this.moveEnforcementCheckers[checkerName](
          movePool,
          moves,
          abilities,
          types,
          counter,
          species,
          teamDetails
        );
      };
      for (const moveid of moves) {
        const move = this.dex.moves.get(moveid);
        let { cull, isSetup } = this.shouldCullMove(
          move,
          types,
          moves,
          abilities,
          counter,
          movePool,
          teamDetails,
          species,
          isLead
        );
        if (move.category === "Physical" && counter.setupType === "Special" || move.category === "Special" && counter.setupType === "Physical") {
          const stabs = counter.get(species.types[0]) + (counter.get(species.types[1]) || 0);
          if (!SetupException.includes(moveid) && (!types.has(move.type) || stabs > 1 || counter.get(move.category) < 2))
            cull = true;
        }
        if (counter.setupType === "Special" && moveid === "hiddenpower" && species.types.length > 1 && counter.get("Special") <= 2 && !types.has(move.type) && !counter.get("Physical") && counter.get("specialpool")) {
          cull = true;
        }
        if (!cull && !move.damage && !isSetup && !move.weather && !move.stallingMove && (!counter.setupType || counter.setupType === "Mixed" || move.category !== counter.setupType && move.category !== "Status" || counter.get(counter.setupType) + counter.get("Status") > 3 && !counter.get("hazards")) && (move.category === "Status" || !types.has(move.type) || move.basePower && move.basePower < 40 && !move.multihit)) {
          if (!counter.get("stab") && !moves.has("nightshade") && !moves.has("seismictoss") && (species.types.length > 1 || species.types[0] !== "Normal" && species.types[0] !== "Psychic" || !moves.has("icebeam") || species.baseStats.spa >= species.baseStats.spd) || moves.has("suckerpunch") && !abilities.has("Contrary") && counter.get("stab") < species.types.length && species.id !== "honchkrow" || ["recover", "roost", "slackoff", "softboiled"].some((m) => movePool.includes(m)) && counter.get("Status") && !counter.setupType && ["healingwish", "switcheroo", "trick", "trickroom"].every((m) => !moves.has(m)) || (movePool.includes("milkdrink") || movePool.includes("shoreup") || movePool.includes("moonlight") && types.size < 2 || movePool.includes("stickyweb") && !counter.setupType && !teamDetails.stickyWeb || movePool.includes("quiverdance") && ["defog", "uturn", "stickyweb"].every((m) => !moves.has(m)) && counter.get("Special") < 4) || isLead && movePool.includes("stealthrock") && counter.get("Status") && !counter.setupType && !counter.get("speedsetup") && !moves.has("substitute") || species.requiredMove && movePool.includes((0, import_dex.toID)(species.requiredMove)) || !counter.get("Normal") && (abilities.has("Aerilate") || abilities.has("Pixilate") || abilities.has("Refrigerate") && !moves.has("blizzard"))) {
            cull = true;
          } else {
            for (const type of types) {
              if (runEnforcementChecker(type)) {
                cull = true;
              }
            }
            for (const abil of abilities) {
              if (runEnforcementChecker(abil)) {
                cull = true;
              }
            }
          }
        }
        if (moveid === "rest" && cull) {
          const sleeptalk = movePool.indexOf("sleeptalk");
          if (sleeptalk >= 0) {
            if (movePool.length < 2) {
              cull = false;
            } else {
              this.fastPop(movePool, sleeptalk);
            }
          }
        }
        const moveIsHP = moveid.startsWith("hiddenpower");
        if (cull && (movePool.length - availableHP || availableHP && (moveIsHP || !hasHiddenPower))) {
          if (move.category !== "Status" && !move.damage && !move.flags.charge && (!moveIsHP || !availableHP)) {
            rejectedPool.push(moveid);
          }
          if (moveIsHP)
            hasHiddenPower = false;
          moves.delete(moveid);
          break;
        }
        if (cull && rejectedPool.length) {
          if (moveIsHP)
            hasHiddenPower = false;
          moves.delete(moveid);
          break;
        }
      }
    } while (moves.size < this.maxMoveCount && (movePool.length || rejectedPool.length));
    const battleOnly = species.battleOnly && !species.requiredAbility;
    const baseSpecies = battleOnly ? this.dex.species.get(species.battleOnly) : species;
    ability = this.getAbility(types, moves, abilities, counter, movePool, teamDetails, species);
    if (species.name === "Genesect" && moves.has("technoblast"))
      forme = "Genesect-Douse";
    if (!moves.has("photongeyser") && !teamDetails.zMove && (species.name === "Necrozma-Dusk-Mane" || species.name === "Necrozma-Dawn-Wings")) {
      for (const moveid of moves) {
        const move = this.dex.moves.get(moveid);
        if (move.category === "Status" || types.has(move.type))
          continue;
        moves.delete(moveid);
        moves.add("photongeyser");
        break;
      }
    }
    let item = this.getDoublesItem(ability, types, moves, abilities, counter, teamDetails, species);
    if (item === void 0)
      item = "Sitrus Berry";
    if (item === "Leftovers" && types.has("Poison")) {
      item = "Black Sludge";
    }
    if (species.baseSpecies === "Basculin") {
      forme = "Basculin" + this.sample(["", "-Blue-Striped"]);
    }
    if (species.baseSpecies === "Keldeo") {
      forme = "Keldeo" + this.sample(["", "-Resolute"]);
    }
    if (species.baseSpecies === "Magearna") {
      forme = "Magearna" + this.sample(["", "-Original"]);
    }
    let level;
    if (this.adjustLevel) {
      level = this.adjustLevel;
    } else {
      const baseStats = species.baseStats;
      let bst = species.bst;
      if (species.baseSpecies === "Wishiwashi")
        bst = this.dex.species.get("wishiwashischool").bst;
      const speciesAbility = baseSpecies === species ? ability : species.abilities[0];
      if (speciesAbility === "Huge Power" || speciesAbility === "Pure Power") {
        bst += baseStats.atk;
      } else if (speciesAbility === "Parental Bond") {
        bst += 0.25 * (counter.get("Physical") > counter.get("Special") ? baseStats.atk : baseStats.spa);
      } else if (speciesAbility === "Protean") {
        bst += 0.3 * (counter.get("Physical") > counter.get("Special") ? baseStats.atk : baseStats.spa);
      } else if (speciesAbility === "Fur Coat") {
        bst += baseStats.def;
      } else if (speciesAbility === "Slow Start") {
        bst -= baseStats.atk / 2 + baseStats.spe / 2;
      } else if (speciesAbility === "Truant") {
        bst *= 2 / 3;
      }
      if (item === "Eviolite") {
        bst += 0.5 * (baseStats.def + baseStats.spd);
      } else if (item === "Light Ball") {
        bst += baseStats.atk + baseStats.spa;
      }
      level = 70 + Math.floor((600 - import_lib.Utils.clampIntRange(bst, 300, 600)) / 10.34);
    }
    const srWeakness = this.dex.getEffectiveness("Rock", species);
    while (evs.hp > 1) {
      const hp = Math.floor(Math.floor(2 * species.baseStats.hp + ivs.hp + Math.floor(evs.hp / 4) + 100) * level / 100 + 10);
      if (moves.has("substitute") && moves.has("reversal")) {
        if (hp % 4 > 0)
          break;
      } else if (moves.has("substitute") && (item === "Petaya Berry" || item === "Sitrus Berry" || ability === "Power Construct" && item !== "Leftovers")) {
        if (hp % 4 === 0)
          break;
      } else if (moves.has("bellydrum") && (item === "Sitrus Berry" || ability === "Gluttony")) {
        if (hp % 2 === 0)
          break;
      } else {
        if (srWeakness <= 0 || hp % (4 / srWeakness) > 0)
          break;
      }
      evs.hp -= 4;
    }
    if (!counter.get("Physical") && !moves.has("copycat") && !moves.has("transform")) {
      evs.atk = 0;
      ivs.atk = 0;
    }
    if (forme === "Nihilego")
      evs.spd -= 32;
    if (ability === "Beast Boost" && counter.get("Special") < 1) {
      evs.spa = 0;
      ivs.spa = 0;
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
    if (["gyroball", "metalburst", "trickroom"].some((m) => moves.has(m))) {
      evs.spe = 0;
      ivs.spe = hasHiddenPower && level < 100 ? ivs.spe - 30 : 0;
    }
    return {
      name: species.baseSpecies,
      species: forme,
      gender: species.gender,
      shiny: this.randomChance(1, 1024),
      moves: Array.from(moves),
      ability,
      evs,
      ivs,
      item,
      level
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
    const tierCount = {};
    const typeCount = {};
    const typeComboCount = {};
    const typeWeaknesses = {};
    const teamDetails = {};
    for (const restrict of [true, false]) {
      if (pokemon.length >= this.maxTeamSize)
        break;
      const pokemonList = Object.keys(this.randomDoublesData);
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
        if (!species.exists)
          continue;
        if (baseFormes[species.baseSpecies])
          continue;
        if (hasMega && species.isMega)
          continue;
        const tier = species.tier;
        const types = species.types;
        const typeCombo = types.slice().sort().join();
        const limitFactor = Math.round(this.maxTeamSize / 6) || 1;
        if (restrict) {
          if (tierCount[tier] >= (isMonotype || this.forceMonotype ? 2 : 1) * limitFactor && !this.randomChance(1, Math.pow(5, tierCount[tier]))) {
            continue;
          }
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
          }
          if (!this.forceMonotype && typeComboCount[typeCombo] >= (isMonotype ? 3 : 1) * limitFactor)
            continue;
        }
        const set = this.randomSet(
          species,
          teamDetails,
          pokemon.length === this.maxTeamSize - 1,
          true
        );
        const item = this.dex.items.get(set.item);
        if (item.zMove && teamDetails.zMove)
          continue;
        if (set.ability === "Illusion") {
          if (pokemon.length < 1)
            continue;
          set.level = pokemon[pokemon.length - 1].level;
        }
        pokemon.unshift(set);
        if (pokemon.length === this.maxTeamSize)
          break;
        baseFormes[species.baseSpecies] = 1;
        if (tierCount[tier]) {
          tierCount[tier]++;
        } else {
          tierCount[tier] = 1;
        }
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
}
var random_doubles_teams_default = RandomGen7DoublesTeams;
//# sourceMappingURL=random-doubles-teams.js.map
