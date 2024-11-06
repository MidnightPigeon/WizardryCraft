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
var sql_exports = {};
__export(sql_exports, {
  DB_NOT_FOUND: () => DB_NOT_FOUND,
  DatabaseTable: () => DatabaseTable,
  SQL: () => SQL,
  SQLDatabaseManager: () => SQLDatabaseManager,
  Statement: () => Statement,
  tables: () => tables
});
module.exports = __toCommonJS(sql_exports);
var import_process_manager = require("./process-manager");
var import_fs = require("./fs");
const DB_NOT_FOUND = null;
function getModule() {
  try {
    return require("better-sqlite3");
  } catch {
    return null;
  }
}
class Statement {
  constructor(statement, db) {
    this.db = db;
    this.statement = statement;
  }
  run(data) {
    return this.db.run(this.statement, data);
  }
  all(data) {
    return this.db.all(this.statement, data);
  }
  get(data) {
    return this.db.get(this.statement, data);
  }
  toString() {
    return this.statement;
  }
  toJSON() {
    return this.statement;
  }
}
class SQLDatabaseManager extends import_process_manager.QueryProcessManager {
  constructor(module2, options) {
    super(module2, (query) => {
      if (!this.dbReady) {
        this.setupDatabase();
      }
      try {
        switch (query.type) {
          case "load-extension": {
            if (!this.database)
              return null;
            this.loadExtensionFile(query.data);
            return true;
          }
          case "transaction": {
            const transaction = this.state.transactions.get(query.name);
            if (!transaction || !this.database) {
              return null;
            }
            const env = {
              db: this.database,
              statements: this.state.statements
            };
            return transaction(query.data, env) || null;
          }
          case "exec": {
            if (!this.database)
              return { changes: 0 };
            this.database.exec(query.data);
            return true;
          }
          case "get": {
            if (!this.database) {
              return null;
            }
            return this.extractStatement(query).get(query.data);
          }
          case "run": {
            if (!this.database) {
              return null;
            }
            return this.extractStatement(query).run(query.data);
          }
          case "all": {
            if (!this.database) {
              return null;
            }
            return this.extractStatement(query).all(query.data);
          }
          case "prepare":
            if (!this.database) {
              return null;
            }
            this.state.statements.set(query.data, this.database.prepare(query.data));
            return query.data;
        }
      } catch (error) {
        return this.onError(error, query);
      }
    });
    this.database = null;
    this.dbReady = false;
    this.options = options;
    this.state = {
      transactions: /* @__PURE__ */ new Map(),
      statements: /* @__PURE__ */ new Map()
    };
    if (!this.isParentProcess)
      this.setupDatabase();
  }
  onError(err, query) {
    if (this.options.onError) {
      const result = this.options.onError(err, query, false);
      if (result)
        return result;
    }
    return {
      queryError: {
        stack: err.stack,
        message: err.message,
        query
      }
    };
  }
  cacheStatement(source) {
    source = source.trim();
    let statement = this.state.statements.get(source);
    if (!statement) {
      statement = this.database.prepare(source);
      this.state.statements.set(source, statement);
    }
    return statement;
  }
  registerFunction(key, cb) {
    this.database.function(key, cb);
  }
  extractStatement(query) {
    query.statement = query.statement.trim();
    const statement = query.noPrepare ? this.state.statements.get(query.statement) : this.cacheStatement(query.statement);
    if (!statement)
      throw new Error(`Missing cached statement "${query.statement}" where required`);
    return statement;
  }
  setupDatabase() {
    if (this.dbReady)
      return;
    this.dbReady = true;
    const { file, extension } = this.options;
    const Database = getModule();
    this.database = Database ? new Database(file) : null;
    if (extension)
      this.loadExtensionFile(extension);
  }
  loadExtensionFile(extension) {
    return this.handleExtensions(require("../" + extension));
  }
  handleExtensions(imports) {
    if (!this.database)
      return;
    const {
      functions,
      transactions: storedTransactions,
      statements: storedStatements,
      onDatabaseStart
    } = imports;
    if (onDatabaseStart) {
      onDatabaseStart.call(this, this.database);
    }
    if (functions) {
      for (const k in functions) {
        this.registerFunction(k, functions[k]);
      }
    }
    if (storedTransactions) {
      for (const t in storedTransactions) {
        const transaction = this.database.transaction(storedTransactions[t]);
        this.state.transactions.set(t, transaction);
      }
    }
    if (storedStatements) {
      for (const k in storedStatements) {
        const statement = this.database.prepare(storedStatements[k]);
        this.state.statements.set(statement.source, statement);
      }
    }
  }
  async query(input) {
    const result = await super.query(input);
    if (result?.queryError) {
      const err = new Error(result.queryError.message);
      err.stack = result.queryError.stack;
      if (this.options.onError) {
        const errResult = this.options.onError(err, result.queryError.query, true);
        if (errResult)
          return errResult;
      }
      throw err;
    }
    return result;
  }
  all(statement, data = [], noPrepare) {
    if (typeof statement !== "string")
      statement = statement.toString();
    return this.query({ type: "all", statement, data, noPrepare });
  }
  get(statement, data = [], noPrepare) {
    if (typeof statement !== "string")
      statement = statement.toString();
    return this.query({ type: "get", statement, data, noPrepare });
  }
  run(statement, data = [], noPrepare) {
    if (typeof statement !== "string")
      statement = statement.toString();
    return this.query({ type: "run", statement, data, noPrepare });
  }
  transaction(name, data = []) {
    return this.query({ type: "transaction", name, data });
  }
  async prepare(statement) {
    const source = await this.query({ type: "prepare", data: statement });
    if (!source)
      return null;
    return new Statement(source, this);
  }
  exec(data) {
    return this.query({ type: "exec", data });
  }
  loadExtension(filepath) {
    return this.query({ type: "load-extension", data: filepath });
  }
  async runFile(file) {
    const contents = await (0, import_fs.FS)(file).read();
    return this.query({ type: "exec", data: contents });
  }
}
const tables = /* @__PURE__ */ new Map();
class DatabaseTable {
  constructor(name, primaryKeyName, database) {
    this.name = name;
    this.database = database;
    this.primaryKeyName = primaryKeyName;
    tables.set(this.name, this);
  }
  async selectOne(entries, where) {
    const query = where || SQL.SQL``;
    query.append(" LIMIT 1");
    const rows = await this.selectAll(entries, query);
    return rows?.[0] || null;
  }
  selectAll(entries, where) {
    const query = SQL.SQL`SELECT `;
    if (typeof entries === "string") {
      query.append(` ${entries} `);
    } else {
      for (let i = 0; i < entries.length; i++) {
        query.append(entries[i]);
        if (typeof entries[i + 1] !== "undefined")
          query.append(", ");
      }
      query.append(" ");
    }
    query.append(`FROM ${this.name} `);
    if (where) {
      query.append(" WHERE ");
      query.append(where);
    }
    return this.all(query);
  }
  get(entries, keyId) {
    const query = SQL.SQL``;
    query.append(this.primaryKeyName);
    query.append(SQL.SQL` = ${keyId}`);
    return this.selectOne(entries, query);
  }
  updateAll(toParams, where, limit) {
    const to = Object.entries(toParams);
    const query = SQL.SQL`UPDATE `;
    query.append(this.name + " SET ");
    for (let i = 0; i < to.length; i++) {
      const [k, v] = to[i];
      query.append(`${k} = `);
      query.append(SQL.SQL`${v}`);
      if (typeof to[i + 1] !== "undefined") {
        query.append(", ");
      }
    }
    if (where) {
      query.append(` WHERE `);
      query.append(where);
    }
    if (limit)
      query.append(SQL.SQL` LIMIT ${limit}`);
    return this.run(query);
  }
  updateOne(to, where) {
    return this.updateAll(to, where, 1);
  }
  deleteAll(where, limit) {
    const query = SQL.SQL`DELETE FROM `;
    query.append(this.name);
    if (where) {
      query.append(" WHERE ");
      query.append(where);
    }
    if (limit) {
      query.append(SQL.SQL` LIMIT ${limit}`);
    }
    return this.run(query);
  }
  delete(keyEntry) {
    const query = SQL.SQL``;
    query.append(this.primaryKeyName);
    query.append(SQL.SQL` = ${keyEntry}`);
    return this.deleteOne(query);
  }
  deleteOne(where) {
    return this.deleteAll(where, 1);
  }
  insert(colMap, rest, isReplace = false) {
    const query = SQL.SQL``;
    query.append(`${isReplace ? "REPLACE" : "INSERT"} INTO ${this.name} (`);
    const keys = Object.keys(colMap);
    for (let i = 0; i < keys.length; i++) {
      query.append(keys[i]);
      if (typeof keys[i + 1] !== "undefined")
        query.append(", ");
    }
    query.append(") VALUES (");
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      query.append(SQL.SQL`${colMap[key]}`);
      if (typeof keys[i + 1] !== "undefined")
        query.append(", ");
    }
    query.append(") ");
    if (rest)
      query.append(rest);
    return this.database.run(query.sql, query.values);
  }
  replace(cols, rest) {
    return this.insert(cols, rest, true);
  }
  update(primaryKey, data) {
    const query = SQL.SQL``;
    query.append(this.primaryKeyName + " = ");
    query.append(SQL.SQL`${primaryKey}`);
    return this.updateOne(data, query);
  }
  // catch-alls for "we can't fit this query into any of the wrapper functions"
  run(sql) {
    return this.database.run(sql.sql, sql.values);
  }
  all(sql) {
    return this.database.all(sql.sql, sql.values);
  }
}
function getSQL(module2, input) {
  const { processes } = input;
  const PM = new SQLDatabaseManager(module2, input);
  if (PM.isParentProcess) {
    if (processes)
      PM.spawn(processes);
  }
  return PM;
}
const SQL = Object.assign(getSQL, {
  DatabaseTable,
  SQLDatabaseManager,
  tables,
  SQL: (() => {
    try {
      return require("sql-template-strings");
    } catch {
      return () => {
        throw new Error("Using SQL-template-strings without it installed");
      };
    }
  })()
});
//# sourceMappingURL=sql.js.map
