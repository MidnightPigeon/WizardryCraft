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
var cg_teams_leveling_exports = {};
__export(cg_teams_leveling_exports, {
  addPokemon: () => addPokemon,
  dbSetupPromise: () => dbSetupPromise,
  handlers: () => handlers,
  incrementLosses: () => incrementLosses,
  incrementWins: () => incrementWins
});
module.exports = __toCommonJS(cg_teams_leveling_exports);
var import_lib = require("../../lib");
let addPokemon = null;
let incrementWins = null;
let incrementLosses = null;
let dbSetupPromise = null;
async function setupDatabase(database) {
  await database.runFile("./databases/schemas/battlestats.sql");
  addPokemon = await database.prepare(
    "INSERT OR IGNORE INTO gen9computergeneratedteams (species_id, wins, losses, level) VALUES (?, 0, 0, ?)"
  );
  incrementWins = await database.prepare(
    "UPDATE gen9computergeneratedteams SET wins = wins + 1 WHERE species_id = ?"
  );
  incrementLosses = await database.prepare(
    "UPDATE gen9computergeneratedteams SET losses = losses + 1 WHERE species_id = ?"
  );
}
if (Config.usesqlite && Config.usesqliteleveling) {
  const database = (0, import_lib.SQL)(module, {
    file: "./databases/battlestats.db"
  });
  dbSetupPromise = setupDatabase(database);
}
async function updateStats(battle, winner) {
  if (!incrementWins || !incrementLosses)
    await dbSetupPromise;
  if (battle.rated < 1e3 || toID(battle.format) !== "gen9computergeneratedteams")
    return;
  for (const player of battle.players) {
    const team = await battle.getPlayerTeam(player);
    if (!team)
      return;
    const increment = player.id === winner ? incrementWins : incrementLosses;
    for (const species of team) {
      await addPokemon?.run([toID(species.species), species.level]);
      await increment?.run([toID(species.species)]);
    }
  }
}
const handlers = {
  onBattleEnd(battle, winner) {
    if (!Config.usesqlite || !Config.usesqliteleveling)
      return;
    void updateStats(battle, winner);
  }
};
//# sourceMappingURL=cg-teams-leveling.js.map
