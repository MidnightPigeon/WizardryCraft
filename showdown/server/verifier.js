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
var verifier_exports = {};
__export(verifier_exports, {
  PM: () => PM,
  verify: () => verify
});
module.exports = __toCommonJS(verifier_exports);
var crypto = __toESM(require("crypto"));
var import_process_manager = require("../lib/process-manager");
/**
 * Verifier process
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * This is just an asynchronous implementation of a verifier for a
 * signed key, because Node.js's crypto functions are synchronous,
 * strangely, considering how everything else is asynchronous.
 *
 * I wrote this one day hoping it would help with performance, but
 * I don't think it had any noticeable effect.
 *
 * @license MIT
 */
const PM = new import_process_manager.QueryProcessManager(module, ({ data, signature }) => {
  const verifier = crypto.createVerify(Config.loginserverkeyalgo);
  verifier.update(data);
  let success = false;
  try {
    success = verifier.verify(Config.loginserverpublickey, signature, "hex");
  } catch {
  }
  return success;
});
function verify(data, signature) {
  return PM.query({ data, signature });
}
if (!PM.isParentProcess) {
  global.Config = require("./config-loader").Config;
  const Repl = require("../lib/repl").Repl;
  Repl.start("verifier", (cmd) => eval(cmd));
} else {
  PM.spawn(global.Config ? Config.verifierprocesses : 1);
}
//# sourceMappingURL=verifier.js.map
