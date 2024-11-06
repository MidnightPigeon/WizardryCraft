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
var database_exports = {};
__export(database_exports, {
  Database: () => Database,
  DatabaseTable: () => DatabaseTable,
  MySQLDatabase: () => MySQLDatabase,
  PGDatabase: () => PGDatabase,
  SQL: () => SQL,
  SQLStatement: () => SQLStatement,
  connectedDatabases: () => connectedDatabases
});
module.exports = __toCommonJS(database_exports);
var mysql = __toESM(require("mysql2"));
var pg = __toESM(require("pg"));
class SQLStatement {
  constructor(strings, values) {
    this.sql = [strings[0]];
    this.values = [];
    for (let i = 0; i < strings.length; i++) {
      this.append(values[i], strings[i + 1]);
    }
  }
  append(value, nextString = "") {
    if (value instanceof SQLStatement) {
      if (!value.sql.length)
        return this;
      const oldLength = this.sql.length;
      this.sql = this.sql.concat(value.sql.slice(1));
      this.sql[oldLength - 1] += value.sql[0];
      this.values = this.values.concat(value.values);
      if (nextString)
        this.sql[this.sql.length - 1] += nextString;
    } else if (typeof value === "string" || typeof value === "number" || value === null) {
      this.values.push(value);
      this.sql.push(nextString);
    } else if (value === void 0) {
      this.sql[this.sql.length - 1] += nextString;
    } else if (Array.isArray(value)) {
      if ('"`'.includes(this.sql[this.sql.length - 1].slice(-1))) {
        const quoteChar = this.sql[this.sql.length - 1].slice(-1);
        for (const col of value) {
          this.append(col, `${quoteChar}, ${quoteChar}`);
        }
        this.sql[this.sql.length - 1] = this.sql[this.sql.length - 1].slice(0, -4) + nextString;
      } else {
        for (const val of value) {
          this.append(val, `, `);
        }
        this.sql[this.sql.length - 1] = this.sql[this.sql.length - 1].slice(0, -2) + nextString;
      }
    } else if (this.sql[this.sql.length - 1].endsWith("(")) {
      this.sql[this.sql.length - 1] += `"`;
      for (const col in value) {
        this.append(col, `", "`);
      }
      this.sql[this.sql.length - 1] = this.sql[this.sql.length - 1].slice(0, -4) + `") VALUES (`;
      for (const col in value) {
        this.append(value[col], `, `);
      }
      this.sql[this.sql.length - 1] = this.sql[this.sql.length - 1].slice(0, -2) + nextString;
    } else if (this.sql[this.sql.length - 1].toUpperCase().endsWith(" SET ")) {
      this.sql[this.sql.length - 1] += `"`;
      for (const col in value) {
        this.append(col, `" = `);
        this.append(value[col], `, "`);
      }
      this.sql[this.sql.length - 1] = this.sql[this.sql.length - 1].slice(0, -3) + nextString;
    } else {
      throw new Error(
        `Objects can only appear in (obj) or after SET; unrecognized: ${this.sql[this.sql.length - 1]}[obj]${nextString}`
      );
    }
    return this;
  }
}
function SQL(strings, ...values) {
  return new SQLStatement(strings, values);
}
const connectedDatabases = [];
class Database {
  constructor(connection, prefix = "") {
    this.type = "";
    this.prefix = prefix;
    this.connection = connection;
    connectedDatabases.push(this);
  }
  query(sql) {
    if (!sql)
      return (strings, ...rest) => this.query(new SQLStatement(strings, rest));
    const [query, values] = this._resolveSQL(sql);
    return this._query(query, values);
  }
  queryOne(sql) {
    if (!sql)
      return (strings, ...rest) => this.queryOne(new SQLStatement(strings, rest));
    return this.query(sql).then((res) => Array.isArray(res) ? res[0] : res);
  }
  queryExec(sql) {
    if (!sql)
      return (strings, ...rest) => this.queryExec(new SQLStatement(strings, rest));
    const [query, values] = this._resolveSQL(sql);
    return this._queryExec(query, values);
  }
  getTable(name, primaryKeyName = null) {
    return new DatabaseTable(this, name, primaryKeyName);
  }
  close() {
    void this.connection.end();
  }
}
class DatabaseTable {
  constructor(db, name, primaryKeyName = null) {
    this.db = db;
    this.name = db.prefix + name;
    this.primaryKeyName = primaryKeyName;
  }
  escapeId(param) {
    return this.db.escapeId(param);
  }
  query(sql) {
    return this.db.query(sql);
  }
  queryOne(sql) {
    return this.db.queryOne(sql);
  }
  queryExec(sql) {
    return this.db.queryExec(sql);
  }
  // low-level
  selectAll(entries) {
    if (!entries)
      entries = SQL`*`;
    if (Array.isArray(entries))
      entries = SQL`"${entries}"`;
    return (strings, ...rest) => this.query()`SELECT ${entries} FROM "${this.name}" ${new SQLStatement(strings, rest)}`;
  }
  selectOne(entries) {
    if (!entries)
      entries = SQL`*`;
    if (Array.isArray(entries))
      entries = SQL`"${entries}"`;
    return (strings, ...rest) => this.queryOne()`SELECT ${entries} FROM "${this.name}" ${new SQLStatement(strings, rest)} LIMIT 1`;
  }
  updateAll(partialRow) {
    return (strings, ...rest) => this.queryExec()`UPDATE "${this.name}" SET ${partialRow} ${new SQLStatement(strings, rest)}`;
  }
  updateOne(partialRow) {
    return (s, ...r) => this.queryExec()`UPDATE "${this.name}" SET ${partialRow} ${new SQLStatement(s, r)} LIMIT 1`;
  }
  deleteAll() {
    return (strings, ...rest) => this.queryExec()`DELETE FROM "${this.name}" ${new SQLStatement(strings, rest)}`;
  }
  deleteOne() {
    return (strings, ...rest) => this.queryExec()`DELETE FROM "${this.name}" ${new SQLStatement(strings, rest)} LIMIT 1`;
  }
  eval() {
    return (strings, ...rest) => this.queryOne()`SELECT ${new SQLStatement(strings, rest)} AS result FROM "${this.name}" LIMIT 1`.then((row) => row?.result);
  }
  // high-level
  insert(partialRow, where) {
    return this.queryExec()`INSERT INTO "${this.name}" (${partialRow}) ${where}`;
  }
  insertIgnore(partialRow, where) {
    return this.queryExec()`INSERT IGNORE INTO "${this.name}" (${partialRow}) ${where}`;
  }
  async tryInsert(partialRow, where) {
    try {
      return await this.insert(partialRow, where);
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return void 0;
      }
      throw err;
    }
  }
  upsert(partialRow, partialUpdate = partialRow, where) {
    if (this.db.type === "pg") {
      return this.queryExec()`INSERT INTO "${this.name}" (${partialRow}) ON CONFLICT (${this.primaryKeyName}) DO UPDATE ${partialUpdate} ${where}`;
    }
    return this.queryExec()`INSERT INTO "${this.name}" (${partialRow}) ON DUPLICATE KEY UPDATE ${partialUpdate} ${where}`;
  }
  set(primaryKey, partialRow, where) {
    if (!this.primaryKeyName)
      throw new Error(`Cannot set() without a single-column primary key`);
    partialRow[this.primaryKeyName] = primaryKey;
    return this.replace(partialRow, where);
  }
  replace(partialRow, where) {
    return this.queryExec()`REPLACE INTO "${this.name}" (${partialRow}) ${where}`;
  }
  get(primaryKey, entries) {
    if (!this.primaryKeyName)
      throw new Error(`Cannot get() without a single-column primary key`);
    return this.selectOne(entries)`WHERE "${this.primaryKeyName}" = ${primaryKey}`;
  }
  delete(primaryKey) {
    if (!this.primaryKeyName)
      throw new Error(`Cannot delete() without a single-column primary key`);
    return this.deleteAll()`WHERE "${this.primaryKeyName}" = ${primaryKey} LIMIT 1`;
  }
  update(primaryKey, data) {
    if (!this.primaryKeyName)
      throw new Error(`Cannot update() without a single-column primary key`);
    return this.updateAll(data)`WHERE "${this.primaryKeyName}" = ${primaryKey} LIMIT 1`;
  }
}
class MySQLDatabase extends Database {
  constructor(config) {
    const prefix = config.prefix || "";
    if (config.prefix) {
      config = { ...config };
      delete config.prefix;
    }
    super(mysql.createPool(config), prefix);
    this.type = "mysql";
  }
  _resolveSQL(query) {
    let sql = query.sql[0];
    const values = [];
    for (let i = 0; i < query.values.length; i++) {
      const value = query.values[i];
      if (query.sql[i + 1].startsWith("`") || query.sql[i + 1].startsWith('"')) {
        sql = sql.slice(0, -1) + this.escapeId("" + value) + query.sql[i + 1].slice(1);
      } else {
        sql += "?" + query.sql[i + 1];
        values.push(value);
      }
    }
    return [sql, values];
  }
  _query(query, values) {
    return new Promise((resolve, reject) => {
      this.connection.query(query, values, (e, results) => {
        if (e) {
          return reject(new Error(`${e.message} (${query}) (${values}) [${e.code}]`));
        }
        if (Array.isArray(results)) {
          for (const row of results) {
            for (const col in row) {
              if (Buffer.isBuffer(row[col]))
                row[col] = row[col].toString();
            }
          }
        }
        return resolve(results);
      });
    });
  }
  _queryExec(sql, values) {
    return this._query(sql, values);
  }
  escapeId(id) {
    return mysql.escapeId(id);
  }
}
class PGDatabase extends Database {
  constructor(config) {
    super(new pg.Pool(config));
    this.type = "pg";
  }
  _resolveSQL(query) {
    let sql = query.sql[0];
    const values = [];
    let paramCount = 0;
    for (let i = 0; i < query.values.length; i++) {
      const value = query.values[i];
      if (query.sql[i + 1].startsWith("`") || query.sql[i + 1].startsWith('"')) {
        sql = sql.slice(0, -1) + this.escapeId("" + value) + query.sql[i + 1].slice(1);
      } else {
        paramCount++;
        sql += `$${paramCount}` + query.sql[i + 1];
        values.push(value);
      }
    }
    return [sql, values];
  }
  _query(query, values) {
    return this.connection.query(query, values).then((res) => res.rows);
  }
  _queryExec(query, values) {
    return this.connection.query(query, values).then((res) => ({ affectedRows: res.rowCount }));
  }
  escapeId(id) {
    return pg.escapeIdentifier(id);
  }
}
//# sourceMappingURL=database.js.map
