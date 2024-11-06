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
var postgres_exports = {};
__export(postgres_exports, {
  PostgresDatabase: () => PostgresDatabase
});
module.exports = __toCommonJS(postgres_exports);
var Streams = __toESM(require("./streams"));
var import_fs = require("./fs");
var Utils = __toESM(require("./utils"));
class PostgresDatabase {
  constructor(config = PostgresDatabase.getConfig()) {
    try {
      this.pool = new (require("pg")).Pool(config);
    } catch (e) {
      this.pool = null;
    }
  }
  destroy() {
    return this.pool.end();
  }
  async query(statement, values) {
    if (!this.pool) {
      throw new Error(`Attempting to use postgres without 'pg' installed`);
    }
    let result;
    try {
      result = await this.pool.query(statement, values);
    } catch (e) {
      throw new Error(e.message);
    }
    return result?.rows || [];
  }
  static getConfig() {
    let config = {};
    try {
      config = require(import_fs.FS.ROOT_PATH + "/config/config").usepostgres;
      if (!config)
        throw new Error("Missing config for pg database");
    } catch (e) {
    }
    return config;
  }
  async transaction(callback, depth = 0) {
    const conn = await this.pool.connect();
    await conn.query(`BEGIN`);
    let result;
    try {
      result = await callback(conn);
    } catch (e) {
      await conn.query(`ROLLBACK`);
      if (e.code === "40001" && depth <= 10) {
        return this.transaction(callback, depth + 1);
      } else if (e.code === "23505" && !depth) {
        return this.transaction(callback, depth + 1);
      } else {
        throw e;
      }
    }
    await conn.query(`COMMIT`);
    return result;
  }
  stream(query) {
    const db = this;
    return new Streams.ObjectReadStream({
      async read() {
        const result = await db.query(query);
        if (!result.length)
          return this.pushEnd();
        this.buf.push(...result);
      }
    });
  }
  async ensureMigrated(opts) {
    let value;
    try {
      const stored = await this.query(
        `SELECT value FROM db_info WHERE key = 'version' AND name = $1`,
        [opts.table]
      );
      if (stored.length) {
        value = stored[0].value || "0";
      }
    } catch (e) {
      await this.query(`CREATE TABLE db_info (name TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL)`);
    }
    if (!value) {
      value = "0";
      await this.query("INSERT INTO db_info (name, key, value) VALUES ($1, $2, $3)", [opts.table, "version", value]);
    }
    value = Number(value);
    const files = (0, import_fs.FS)(opts.migrationsFolder).readdirSync().filter((f) => f.endsWith(".sql")).map((f) => Number(f.slice(1).split(".")[0]));
    Utils.sortBy(files, (f) => f);
    const curVer = files[files.length - 1] || 0;
    if (curVer !== value) {
      if (!value) {
        try {
          await this.query(`SELECT * FROM ${opts.table} LIMIT 1`);
        } catch {
          await this.query((0, import_fs.FS)(opts.baseSchemaFile).readSync());
        }
      }
      for (const n of files) {
        if (n <= value)
          continue;
        await this.query((0, import_fs.FS)(`${opts.migrationsFolder}/v${n}.sql`).readSync());
        await this.query(
          `UPDATE db_info SET value = $1 WHERE key = 'version' AND name = $2`,
          [`${n}`, opts.table]
        );
      }
    }
  }
}
//# sourceMappingURL=postgres.js.map
