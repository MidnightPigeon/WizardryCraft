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
const Scripts = {
  inherit: "gen6",
  init() {
    this.modData("Pokedex", "cherrimsunshine").types = ["Grass", "Fire"];
    this.modData("Learnsets", "masquerain").learnset.hurricane = ["5L100"];
    this.modData("Learnsets", "butterfree").learnset.hurricane = ["5L100"];
    this.modData("Learnsets", "beautifly").learnset.hurricane = ["5L100"];
    this.modData("Learnsets", "mothim").learnset.hurricane = ["5L100"];
    this.modData("Learnsets", "masquerain").learnset.surf = ["5M"];
    this.modData("Learnsets", "roserade").learnset.sludge = ["5L100"];
    this.modData("Learnsets", "meloetta").learnset.fierydance = ["5L100"];
    this.modData("Learnsets", "galvantula").learnset.zapcannon = ["5L100"];
    this.modData("Learnsets", "virizion").learnset.hornleech = ["5L100"];
    this.modData("Learnsets", "milotic").learnset.coil = ["5L100"];
    this.modData("Learnsets", "scolipede").learnset.coil = ["5L100"];
    this.modData("Learnsets", "steelix").learnset.coil = ["5L100"];
    this.modData("Learnsets", "rotomwash").learnset.bubblebeam = ["5L100"];
    this.modData("Learnsets", "rotomfan").learnset.hurricane = ["5L100"];
    this.modData("Learnsets", "rotomfan").learnset.twister = ["5L100"];
    this.modData("Learnsets", "rotomfrost").learnset.frostbreath = ["5L100"];
    this.modData("Learnsets", "rotomheat").learnset.heatwave = ["5L100"];
    this.modData("Learnsets", "rotommow").learnset.magicalleaf = ["5L100"];
    this.modData("Learnsets", "zoroark").learnset.earthquake = ["5M"];
    this.modData("Learnsets", "zoroark").learnset.stoneedge = ["5M"];
    this.modData("Learnsets", "zoroark").learnset.icebeam = ["5M"];
    this.modData("Learnsets", "zoroark").learnset.xscissor = ["5M"];
    this.modData("Learnsets", "zoroark").learnset.gigadrain = ["5T"];
    this.modData("Learnsets", "zoroark").learnset.superpower = ["5T"];
    this.modData("Learnsets", "mantine").learnset.recover = ["5L100"];
    this.modData("Learnsets", "mantine").learnset.whirlwind = ["5L100"];
    this.modData("Learnsets", "mantine").learnset.batonpass = ["5L100"];
    this.modData("Learnsets", "mantine").learnset.wish = ["5L100"];
    this.modData("Learnsets", "mantine").learnset.soak = ["5L100"];
    this.modData("Learnsets", "mantine").learnset.lockon = ["5L100"];
    this.modData("Learnsets", "mantine").learnset.acidspray = ["5L100"];
    this.modData("Learnsets", "mantine").learnset.octazooka = ["5L100"];
    this.modData("Learnsets", "mantine").learnset.stockpile = ["5L100"];
    this.modData("Learnsets", "aipom").learnset.sketch = ["5E"];
    this.modData("Learnsets", "spinda").learnset.sketch = ["5E"];
    this.modData("Learnsets", "mimejr").learnset.sketch = ["5E"];
    this.modData("Learnsets", "finneon").learnset.tailglow = ["5L100"];
    this.modData("Learnsets", "lumineon").learnset.tailglow = ["5L100"];
    this.modData("Learnsets", "mareep").learnset.tailglow = ["5L100"];
    this.modData("Learnsets", "ampharos").learnset.tailglow = ["5L100"];
    this.modData("Learnsets", "chinchou").learnset.tailglow = ["5L100"];
    this.modData("Learnsets", "lanturn").learnset.tailglow = ["5L100"];
    this.modData("Learnsets", "spinda").learnset.vcreate = ["5L100"];
    this.modData("Learnsets", "spinda").learnset.superpower = ["5L100"];
    this.modData("Learnsets", "spinda").learnset.closecombat = ["5L100"];
    this.modData("Learnsets", "spinda").learnset.overheat = ["5L100"];
    this.modData("Learnsets", "spinda").learnset.leafstorm = ["5L100"];
    this.modData("Learnsets", "spinda").learnset.dracometeor = ["5L100"];
    this.modData("Pokedex", "venusaur").abilities["1"] = "Leaf Guard";
    this.modData("Pokedex", "charizard").abilities["1"] = "Flame Body";
    this.modData("Pokedex", "blastoise").abilities["1"] = "Shell Armor";
    this.modData("Pokedex", "meganium").abilities["1"] = "Harvest";
    this.modData("Pokedex", "typhlosion").abilities["1"] = "Magma Armor";
    this.modData("Pokedex", "feraligatr").abilities["1"] = "Strong Jaw";
    this.modData("Pokedex", "sceptile").abilities["1"] = "Limber";
    this.modData("Pokedex", "blaziken").abilities["1"] = "Reckless";
    this.modData("Pokedex", "swampert").abilities["1"] = "Hydration";
    this.modData("Pokedex", "torterra").abilities["1"] = "Weak Armor";
    this.modData("Pokedex", "infernape").abilities["1"] = "No Guard";
    this.modData("Pokedex", "empoleon").abilities["1"] = "Ice Body";
    this.modData("Pokedex", "serperior").abilities["1"] = "Own Tempo";
    this.modData("Pokedex", "emboar").abilities["1"] = "Sheer Force";
    this.modData("Pokedex", "samurott").abilities["1"] = "Technician";
    this.modData("Pokedex", "chesnaught").abilities["1"] = "Battle Armor";
    this.modData("Pokedex", "delphox").abilities["1"] = "Magic Guard";
    this.modData("Pokedex", "greninja").abilities["1"] = "Pickpocket";
    this.modData("Pokedex", "unown").abilities["1"] = "Shadow Tag";
    this.modData("Pokedex", "flygon").abilities["1"] = "Compound Eyes";
    this.modData("Pokedex", "flygon").abilities["H"] = "Sand Rush";
    this.modData("Pokedex", "weezing").abilities["1"] = "Aftermath";
    this.modData("Pokedex", "eelektross").abilities["1"] = "Poison Heal";
    this.modData("Pokedex", "claydol").abilities["1"] = "Filter";
    this.modData("Pokedex", "mismagius").abilities["1"] = "Cursed Body";
    this.modData("Pokedex", "cryogonal").abilities["1"] = "Ice Body";
    this.modData("Pokedex", "mesprit").abilities["1"] = "Serene Grace";
    this.modData("Pokedex", "uxie").abilities["1"] = "Synchronize";
    this.modData("Pokedex", "azelf").abilities["1"] = "Steadfast";
    this.modData("Pokedex", "hydreigon").abilities["1"] = "Sheer Force";
    this.modData("Pokedex", "rotom").abilities["1"] = "Trace";
    this.modData("Pokedex", "rotomwash").abilities["1"] = "Trace";
    this.modData("Pokedex", "rotomheat").abilities["1"] = "Trace";
    this.modData("Pokedex", "rotommow").abilities["1"] = "Trace";
    this.modData("Pokedex", "rotomfrost").abilities["1"] = "Trace";
    this.modData("Pokedex", "rotomfan").abilities["1"] = "Trace";
    this.modData("Pokedex", "crawdaunt").abilities["H"] = "Tough Claws";
    this.modData("Pokedex", "vespiquen").abilities["1"] = "Swarm";
  }
};
//# sourceMappingURL=scripts.js.map
