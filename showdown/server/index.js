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
var server_exports = {};
__export(server_exports, {
  listen: () => listen
});
module.exports = __toCommonJS(server_exports);
var import_lib = require("../lib");
var import_sockets = require("./sockets");
var TeamValidatorAsync = __toESM(require("./team-validator-async"));
/**
 * Main file
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * This is the main Pokemon Showdown app, and the file that the
 * `pokemon-showdown` script runs if you start Pokemon Showdown normally.
 *
 * This file sets up our SockJS server, which handles communication
 * between users and your server, and also sets up globals. You can
 * see details in their corresponding files, but here's an overview:
 *
 * Users - from users.ts
 *
 *   Most of the communication with users happens in users.ts, we just
 *   forward messages between the sockets.js and users.ts.
 *
 *   It exports the global tables `Users.users` and `Users.connections`.
 *
 * Rooms - from rooms.ts
 *
 *   Every chat room and battle is a room, and what they do is done in
 *   rooms.ts. There's also a global room which every user is in, and
 *   handles miscellaneous things like welcoming the user.
 *
 *   It exports the global table `Rooms.rooms`.
 *
 * Dex - from sim/dex.ts
 *
 *   Handles getting data about Pokemon, items, etc.
 *
 * Ladders - from ladders.ts and ladders-remote.ts
 *
 *   Handles Elo rating tracking for players.
 *
 * Chat - from chat.ts
 *
 *   Handles chat and parses chat commands like /me and /ban
 *
 * Sockets - from sockets.js
 *
 *   Used to abstract out network connections. sockets.js handles
 *   the actual server and connection set-up.
 *
 * @license MIT
 */
require("source-map-support").install();
const nodeVersion = parseInt(process.versions.node);
if (isNaN(nodeVersion) || nodeVersion < 16) {
  throw new Error("We require Node.js version 16 or later; you're using " + process.version);
}
function setupGlobals() {
  const ConfigLoader = require("./config-loader");
  global.Config = ConfigLoader.Config;
  const { Monitor: Monitor2 } = require("./monitor");
  global.Monitor = Monitor2;
  global.__version = { head: "" };
  void Monitor2.version().then((hash) => {
    global.__version.tree = hash;
  });
  import_lib.Repl.cleanup();
  if (Config.watchconfig) {
    (0, import_lib.FS)("config/config.js").onModify(() => {
      try {
        global.Config = ConfigLoader.load(true);
        Chat.plugins["username-prefixes"]?.prefixManager.refreshConfig(true);
        Monitor2.notice("Reloaded ../config/config.js");
      } catch (e) {
        Monitor2.adminlog("Error reloading ../config/config.js: " + e.stack);
      }
    });
  }
  const { Dex } = require("../sim/dex");
  global.Dex = Dex;
  global.toID = Dex.toID;
  const { Teams } = require("../sim/teams");
  global.Teams = Teams;
  const { LoginServer } = require("./loginserver");
  global.LoginServer = LoginServer;
  const { Ladders } = require("./ladders");
  global.Ladders = Ladders;
  const { Chat } = require("./chat");
  global.Chat = Chat;
  const { Users } = require("./users");
  global.Users = Users;
  const { Punishments } = require("./punishments");
  global.Punishments = Punishments;
  const { Rooms } = require("./rooms");
  global.Rooms = Rooms;
  Rooms.global = new Rooms.GlobalRoomState();
  const Verifier = require("./verifier");
  global.Verifier = Verifier;
  Verifier.PM.spawn();
  const { Tournaments } = require("./tournaments");
  global.Tournaments = Tournaments;
  const { IPTools } = require("./ip-tools");
  global.IPTools = IPTools;
  void IPTools.loadHostsAndRanges();
}
setupGlobals();
if (Config.crashguard) {
  process.on("uncaughtException", (err) => {
    Monitor.crashlog(err, "The main process");
  });
  process.on("unhandledRejection", (err) => {
    Monitor.crashlog(err, "A main process Promise");
  });
}
global.Sockets = import_sockets.Sockets;
function listen(port, bindAddress, workerCount) {
  import_sockets.Sockets.listen(port, bindAddress, workerCount);
}
if (require.main === module) {
  let port;
  for (const arg of process.argv) {
    if (/^[0-9]+$/.test(arg)) {
      port = parseInt(arg);
      break;
    }
  }
  import_sockets.Sockets.listen(port);
}
global.TeamValidatorAsync = TeamValidatorAsync;
TeamValidatorAsync.PM.spawn();
import_lib.Repl.start("app", (cmd) => eval(cmd));
if (Config.startuphook) {
  process.nextTick(Config.startuphook);
}
if (Config.ofemain) {
  try {
    require.resolve("node-oom-heapdump");
  } catch (e) {
    if (e.code !== "MODULE_NOT_FOUND")
      throw e;
    throw new Error(
      "node-oom-heapdump is not installed, but it is a required dependency if Config.ofe is set to true! Run npm install node-oom-heapdump and restart the server."
    );
  }
  global.nodeOomHeapdump = require("node-oom-heapdump")({
    addTimestamp: true
  });
}
//# sourceMappingURL=index.js.map
