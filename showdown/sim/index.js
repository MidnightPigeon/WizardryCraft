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
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var sim_exports = {};
__export(sim_exports, {
  Battle: () => import_battle.Battle,
  BattleStream: () => import_battle_stream.BattleStream,
  Dex: () => import_dex.Dex,
  PRNG: () => import_prng.PRNG,
  Pokemon: () => import_pokemon.Pokemon,
  Side: () => import_side.Side,
  TeamValidator: () => import_team_validator.TeamValidator,
  Teams: () => import_teams.Teams,
  getPlayerStreams: () => import_battle_stream.getPlayerStreams,
  toID: () => import_dex.toID
});
module.exports = __toCommonJS(sim_exports);
var import_battle = require("./battle");
var import_battle_stream = require("./battle-stream");
var import_pokemon = require("./pokemon");
var import_prng = require("./prng");
var import_side = require("./side");
var import_dex = require("./dex");
var import_teams = require("./teams");
var import_team_validator = require("./team-validator");
__reExport(sim_exports, require("../lib"), module.exports);
/**
 * Simulator
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * Here's where all the simulator APIs get exported for general use.
 * `require('pokemon-showdown')` imports from here.
 *
 * @license MIT
 */
//# sourceMappingURL=index.js.map
