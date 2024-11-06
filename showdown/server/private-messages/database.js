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
var database_exports = {};
__export(database_exports, {
  functions: () => functions,
  onDatabaseStart: () => onDatabaseStart,
  statements: () => statements,
  transactions: () => transactions
});
module.exports = __toCommonJS(database_exports);
var import_lib = require("../../lib");
var import__ = require(".");
const functions = {
  should_expire: (time) => {
    const diff = Date.now() - time;
    if (diff > import__.EXPIRY_TIME) {
      return 1;
    }
    return 0;
  },
  seen_duration: (seen) => {
    if (!seen)
      return 0;
    const diff = Date.now() - seen;
    if (diff >= import__.SEEN_EXPIRY_TIME) {
      return 1;
    }
    return 0;
  }
};
const statements = {
  send: "INSERT INTO offline_pms (sender, receiver, message, time) VALUES (?, ?, ?, ?)",
  clear: "DELETE FROM offline_pms WHERE receiver = ?",
  fetch: "SELECT * FROM offline_pms WHERE receiver = ?",
  fetchNew: "SELECT * FROM offline_pms WHERE receiver = ? AND seen IS NULL",
  clearDated: "DELETE FROM offline_pms WHERE EXISTS (SELECT * FROM offline_pms WHERE should_expire(time) = 1)",
  checkSentCount: "SELECT count(*) as count FROM offline_pms WHERE sender = ? AND receiver = ?",
  setSeen: "UPDATE offline_pms SET seen = ? WHERE receiver = ?",
  clearSeen: "DELETE FROM offline_pms WHERE seen_duration(seen) = 1",
  getSettings: "SELECT * FROM pm_settings WHERE userid = ?",
  setBlock: "REPLACE INTO pm_settings (userid, view_only) VALUES (?, ?)",
  deleteSettings: "DELETE FROM pm_settings WHERE userid = ?"
};
class StatementMap {
  constructor(env) {
    this.env = env;
  }
  run(name, args) {
    return this.getStatement(name).run(args);
  }
  all(name, args) {
    return this.getStatement(name).all(args);
  }
  get(name, args) {
    return this.getStatement(name).get(args);
  }
  getStatement(name) {
    const source = statements[name];
    return this.env.statements.get(source);
  }
}
const transactions = {
  send: (args, env) => {
    const statementList = new StatementMap(env);
    const [sender, receiver, message] = args;
    const count = statementList.get("checkSentCount", [sender, receiver])?.count;
    if (count && count > import__.MAX_PENDING) {
      return { error: `You have already sent the maximum ${import__.MAX_PENDING} offline PMs to that user.` };
    }
    return statementList.run("send", [sender, receiver, message, Date.now()]);
  },
  listNew: (args, env) => {
    const list = new StatementMap(env);
    const [receiver] = args;
    const pms = list.all("fetchNew", [receiver]);
    list.run("setSeen", [Date.now(), receiver]);
    return pms;
  }
};
function onDatabaseStart(database) {
  let version;
  try {
    version = database.prepare("SELECT * FROM db_info").get().version;
  } catch {
    const schemaContent = (0, import_lib.FS)("databases/schemas/pms.sql").readSync();
    database.exec(schemaContent);
  }
  const migrations = (0, import_lib.FS)("databases/migrations/pms").readdirIfExistsSync();
  if (version !== migrations.length) {
    for (const migration of migrations) {
      const num = /(\d+)\.sql$/.exec(migration)?.[1];
      if (!num || version >= num)
        continue;
      database.exec("BEGIN TRANSACTION");
      try {
        database.exec((0, import_lib.FS)(`databases/migrations/pms/${migration}`).readSync());
      } catch (e) {
        console.log(`Error in PM migration ${migration} - ${e.message}`);
        console.log(e.stack);
        database.exec("ROLLBACK");
        continue;
      }
      database.exec("COMMIT");
    }
  }
}
//# sourceMappingURL=database.js.map
