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
var replays_exports = {};
__export(replays_exports, {
  Replays: () => Replays,
  default: () => replays_default,
  replayPlayers: () => replayPlayers,
  replays: () => replays,
  replaysDB: () => replaysDB
});
module.exports = __toCommonJS(replays_exports);
var import_database = require("../lib/database");
const replaysDB = Config.replaysdb ? new import_database.PGDatabase(Config.replaysdb) : null;
const replays = replaysDB?.getTable("replays", "id");
const replayPlayers = replaysDB?.getTable("replayplayers");
const Replays = new class {
  constructor() {
    this.db = replaysDB;
    this.replaysTable = replays;
    this.replayPlayersTable = replayPlayers;
    this.passwordCharacters = "0123456789abcdefghijklmnopqrstuvwxyz";
  }
  toReplay(row) {
    const replay = {
      ...row,
      players: row.players.split(",").map((player) => player.startsWith("!") ? player.slice(1) : player)
    };
    if (!replay.password && replay.private === 1)
      replay.private = 2;
    return replay;
  }
  toReplays(rows) {
    return rows.map((row) => Replays.toReplay(row));
  }
  toReplayRow(replay) {
    const formatid = toID(replay.format);
    const replayData = {
      password: null,
      views: 0,
      ...replay,
      players: replay.players.join(","),
      formatid
    };
    if (replayData.private === 1 && !replayData.password) {
      replayData.password = Replays.generatePassword();
    } else {
      if (replayData.private === 2)
        replayData.private = 1;
      replayData.password = null;
    }
    return replayData;
  }
  async add(replay) {
    const fullid = replay.id + (replay.password ? `-${replay.password}pw` : "");
    const replayData = this.toReplayRow(replay);
    try {
      await replays.insert(replayData);
      for (const playerName of replay.players) {
        await replayPlayers.insert({
          playerid: toID(playerName),
          formatid: replayData.formatid,
          id: replayData.id,
          rating: replayData.rating,
          uploadtime: replayData.uploadtime,
          private: replayData.private,
          password: replayData.password,
          format: replayData.format,
          players: replayData.players
        });
      }
    } catch (e) {
      if (e?.routine !== "NewUniquenessConstraintViolationError")
        throw e;
      await replays.update(replay.id, {
        log: replayData.log,
        inputlog: replayData.inputlog,
        rating: replayData.rating,
        private: replayData.private,
        password: replayData.password
      });
      await replayPlayers.updateAll({
        rating: replayData.rating,
        private: replayData.private,
        password: replayData.password
      })`WHERE id = ${replay.id}`;
    }
    return fullid;
  }
  async get(id) {
    const replayData = await replays.get(id);
    if (!replayData)
      return null;
    await replays.update(replayData.id, { views: import_database.SQL`views + 1` });
    return this.toReplay(replayData);
  }
  async edit(replay) {
    const replayData = this.toReplayRow(replay);
    await replays.update(replay.id, { private: replayData.private, password: replayData.password });
  }
  generatePassword(length = 31) {
    let password = "";
    for (let i = 0; i < length; i++) {
      password += this.passwordCharacters[Math.floor(Math.random() * this.passwordCharacters.length)];
    }
    return password;
  }
  search(args) {
    const page = args.page || 0;
    if (page > 100)
      return Promise.resolve([]);
    let limit1 = 50 * (page - 1);
    if (limit1 < 0)
      limit1 = 0;
    const isPrivate = args.isPrivate ? 1 : 0;
    const format = args.format ? toID(args.format) : null;
    if (args.username) {
      const order = args.byRating ? import_database.SQL`ORDER BY rating DESC` : import_database.SQL`ORDER BY uploadtime DESC`;
      const userid = toID(args.username);
      if (args.username2) {
        const userid2 = toID(args.username2);
        if (format) {
          return replays.query()`SELECT 
							p1.uploadtime AS uploadtime, p1.id AS id, p1.format AS format, p1.players AS players, 
							p1.rating AS rating, p1.password AS password, p1.private AS private 
						FROM replayplayers p1 INNER JOIN replayplayers p2 ON p2.id = p1.id 
						WHERE p1.playerid = ${userid} AND p1.formatid = ${format} AND p1.private = ${isPrivate}
							AND p2.playerid = ${userid2} 
						${order} LIMIT ${limit1}, 51;`.then(this.toReplays);
        } else {
          return replays.query()`SELECT 
							p1.uploadtime AS uploadtime, p1.id AS id, p1.format AS format, p1.players AS players, 
							p1.rating AS rating, p1.password AS password, p1.private AS private 
						FROM replayplayers p1 INNER JOIN replayplayers p2 ON p2.id = p1.id 
						WHERE p1.playerid = ${userid} AND p1.private = ${isPrivate}
							AND p2.playerid = ${userid2} 
						${order} LIMIT ${limit1}, 51;`.then(this.toReplays);
        }
      } else {
        if (format) {
          return replays.query()`SELECT uploadtime, id, format, players, rating, password FROM replayplayers 
						WHERE playerid = ${userid} AND formatid = ${format} AND private = ${isPrivate} 
						${order} LIMIT ${limit1}, 51;`.then(this.toReplays);
        } else {
          return replays.query()`SELECT uploadtime, id, format, players, rating, password FROM replayplayers 
						WHERE playerid = ${userid} private = ${isPrivate} 
						${order} LIMIT ${limit1}, 51;`.then(this.toReplays);
        }
      }
    }
    if (args.byRating) {
      return replays.query()`SELECT uploadtime, id, format, players, rating, password 
				FROM replays 
				WHERE private = ${isPrivate} AND formatid = ${format} ORDER BY rating DESC LIMIT ${limit1}, 51`.then(this.toReplays);
    } else {
      return replays.query()`SELECT uploadtime, id, format, players, rating, password 
				FROM replays 
				WHERE private = ${isPrivate} AND formatid = ${format} ORDER BY uploadtime DESC LIMIT ${limit1}, 51`.then(this.toReplays);
    }
  }
  fullSearch(term, page = 0) {
    if (page > 0)
      return Promise.resolve([]);
    const patterns = term.split(",").map((subterm) => {
      const escaped = subterm.replace(/%/g, "\\%").replace(/_/g, "\\_");
      return `%${escaped}%`;
    });
    if (patterns.length !== 1 && patterns.length !== 2)
      return Promise.resolve([]);
    const secondPattern = patterns.length >= 2 ? import_database.SQL`AND log LIKE ${patterns[1]} ` : void 0;
    return replays.query()`SELECT /*+ MAX_EXECUTION_TIME(10000) */ 
			uploadtime, id, format, players, rating FROM ps_replays 
			WHERE private = 0 AND log LIKE ${patterns[0]} ${secondPattern}
			ORDER BY uploadtime DESC LIMIT 10;`.then(this.toReplays);
  }
  recent() {
    return replays.selectAll(
      import_database.SQL`uploadtime, id, format, players, rating`
    )`WHERE private = 0 ORDER BY uploadtime DESC LIMIT 50`.then(this.toReplays);
  }
}();
var replays_default = Replays;
//# sourceMappingURL=replays.js.map
