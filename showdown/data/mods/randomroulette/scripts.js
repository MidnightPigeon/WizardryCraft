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
var import_prng = require("../../../sim/prng");
var import_pokemon = require("../../../sim/pokemon");
var import_teams = require("../../../sim/teams");
const Scripts = {
  start() {
    this.gen = this.random(1, 10);
    const format = Dex.formats.get(`gen${this.gen}randombattle@@@${(this.format.customRules || []).join(",")}`);
    this.dex = Dex.forFormat(format);
    this.ruleTable = this.dex.formats.getRuleTable(format);
    this.teamGenerator = import_teams.Teams.getGenerator(format);
    this.actions.battle = this;
    this.actions.dex = this.dex;
    if (this.actions.dex.data.Scripts.actions)
      Object.assign(this.actions, this.actions.dex.data.Scripts.actions);
    if (format.actions)
      Object.assign(this.actions, format.actions);
    for (const i in this.dex.data.Scripts) {
      const entry = this.dex.data.Scripts[i];
      if (typeof entry === "function")
        this[i] = entry;
    }
    for (const rule of this.ruleTable.keys()) {
      if ("+*-!".includes(rule.charAt(0)))
        continue;
      const subFormat = this.dex.formats.get(rule);
      if (subFormat.exists) {
        const hasEventHandler = Object.keys(subFormat).some(
          // skip event handlers that are handled elsewhere
          (val) => val.startsWith("on") && ![
            "onBegin",
            "onTeamPreview",
            "onBattleStart",
            "onValidateRule",
            "onValidateTeam",
            "onChangeSet",
            "onValidateSet"
          ].includes(val)
        );
        if (hasEventHandler)
          this.field.addPseudoWeather(rule);
      }
    }
    for (const side of this.sides) {
      this.teamGenerator.setSeed(import_prng.PRNG.generateSeed());
      const team = this.teamGenerator.getTeam();
      side.team = team;
      side.pokemon = [];
      for (let i = 0; i < team.length && i < 24; i++) {
        side.pokemon.push(new import_pokemon.Pokemon(team[i], side));
        side.pokemon[i].position = i;
      }
      side.dynamaxUsed = this.gen !== 8;
    }
    if (this.deserialized)
      return;
    if (!this.sides.every((side) => !!side))
      throw new Error(`Missing sides: ${this.sides}`);
    if (this.started)
      throw new Error(`Battle already started`);
    this.started = true;
    if (this.gameType === "multi") {
      this.sides[1].foe = this.sides[2];
      this.sides[0].foe = this.sides[3];
      this.sides[2].foe = this.sides[1];
      this.sides[3].foe = this.sides[0];
      this.sides[1].allySide = this.sides[3];
      this.sides[0].allySide = this.sides[2];
      this.sides[2].allySide = this.sides[0];
      this.sides[3].allySide = this.sides[1];
      this.sides[2].sideConditions = this.sides[0].sideConditions;
      this.sides[3].sideConditions = this.sides[1].sideConditions;
    } else {
      this.sides[1].foe = this.sides[0];
      this.sides[0].foe = this.sides[1];
      if (this.sides.length > 2) {
        this.sides[2].foe = this.sides[3];
        this.sides[3].foe = this.sides[2];
      }
    }
    for (const side of this.sides) {
      this.add("teamsize", side.id, side.pokemon.length);
    }
    this.add("gen", this.gen);
    this.add("tier", format.name);
    if (this.rated) {
      if (this.rated === "Rated battle")
        this.rated = true;
      this.add("rated", typeof this.rated === "string" ? this.rated : "");
    }
    if (format.onBegin)
      format.onBegin.call(this);
    for (const rule of this.ruleTable.keys()) {
      if ("+*-!".includes(rule.charAt(0)))
        continue;
      const subFormat = this.dex.formats.get(rule);
      if (subFormat.onBegin)
        subFormat.onBegin.call(this);
    }
    if (this.sides.some((side) => !side.pokemon[0])) {
      throw new Error("Battle not started: A player has an empty team.");
    }
    if (this.debugMode) {
      this.checkEVBalance();
    }
    if (format.onTeamPreview)
      format.onTeamPreview.call(this);
    for (const rule of this.ruleTable.keys()) {
      if ("+*-!".includes(rule.charAt(0)))
        continue;
      const subFormat = this.dex.formats.get(rule);
      if (subFormat.onTeamPreview)
        subFormat.onTeamPreview.call(this);
    }
    this.queue.addChoice({ choice: "start" });
    this.midTurn = true;
    if (!this.requestState)
      this.go();
  }
};
//# sourceMappingURL=scripts.js.map
