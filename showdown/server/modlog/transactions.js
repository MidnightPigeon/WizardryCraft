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
var transactions_exports = {};
__export(transactions_exports, {
  transactions: () => transactions
});
module.exports = __toCommonJS(transactions_exports);
const transactions = {
  insertion: (args, env) => {
    const modlogInsertion = env.statements.get(args.modlogInsertionStatement);
    const altsInsertion = env.statements.get(args.altsInsertionStatement);
    if (!modlogInsertion) {
      throw new Error(`Couldn't find prepared statement for provided value (args.modlogInsertionStatement=${args.modlogInsertionStatement}`);
    }
    if (!altsInsertion) {
      throw new Error(`Couldn't find prepared statement for provided value (args.altsInsertionStatement=${args.altsInsertionStatement}`);
    }
    for (const entry of args.entries) {
      entry.isGlobal = Number(entry.isGlobal);
      const result = modlogInsertion.run(entry);
      const rowid = result.lastInsertRowid;
      for (const alt of entry.alts || []) {
        altsInsertion.run(rowid, alt);
      }
    }
  }
};
//# sourceMappingURL=transactions.js.map
