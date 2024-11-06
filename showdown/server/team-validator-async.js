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
var team_validator_async_exports = {};
__export(team_validator_async_exports, {
  PM: () => PM,
  TeamValidatorAsync: () => TeamValidatorAsync,
  get: () => get
});
module.exports = __toCommonJS(team_validator_async_exports);
var import_team_validator = require("../sim/team-validator");
var import_process_manager = require("../lib/process-manager");
/**
 * Team Validator
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * Spawns a child process to validate teams.
 *
 * @license MIT
 */
class TeamValidatorAsync {
  constructor(format) {
    this.format = Dex.formats.get(format);
  }
  validateTeam(team, options) {
    let formatid = this.format.id;
    if (this.format.customRules)
      formatid += "@@@" + this.format.customRules.join(",");
    if (team.length > 25 * 1024 - 6) {
      return Promise.resolve("0Your team is over 25KB. Please use a smaller team.");
    }
    return PM.query({ formatid, options, team });
  }
  static get(format) {
    return new TeamValidatorAsync(format);
  }
}
const get = TeamValidatorAsync.get;
const PM = new import_process_manager.QueryProcessManager(module, (message) => {
  const { formatid, options, team } = message;
  const parsedTeam = Teams.unpack(team);
  if (Config.debugvalidatorprocesses && process.send) {
    process.send("DEBUG\n" + JSON.stringify(message));
  }
  let problems;
  try {
    problems = import_team_validator.TeamValidator.get(formatid).validateTeam(parsedTeam, options);
  } catch (err) {
    Monitor.crashlog(err, "A team validation", {
      formatid,
      team
    });
    problems = [
      `Your team crashed the validator. We'll fix this crash within a few hours (we're automatically notified), but if you don't want to wait, just use a different team for now.`
    ];
  }
  if (problems?.length) {
    return "0" + problems.join("\n");
  }
  const packedTeam = Teams.pack(parsedTeam);
  return "1" + packedTeam;
}, 2 * 60 * 1e3);
if (!PM.isParentProcess) {
  global.Config = require("./config-loader").Config;
  global.Monitor = {
    crashlog(error, source = "A team validator process", details = null) {
      const repr = JSON.stringify([error.name, error.message, source, details]);
      process.send(`THROW
@!!@${repr}
${error.stack}`);
    }
  };
  if (Config.crashguard) {
    process.on("uncaughtException", (err) => {
      Monitor.crashlog(err, `A team validator process`);
    });
    process.on("unhandledRejection", (err) => {
      Monitor.crashlog(err || {}, "A team validator process Promise");
    });
  }
  global.Dex = require("../sim/dex").Dex.includeData();
  global.Teams = require("../sim/teams").Teams;
  require("../lib/repl").Repl.start(`team-validator-${process.pid}`, (cmd) => eval(cmd));
} else {
  PM.spawn(global.Config ? Config.validatorprocesses : 1);
}
//# sourceMappingURL=team-validator-async.js.map
