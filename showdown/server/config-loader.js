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
var config_loader_exports = {};
__export(config_loader_exports, {
  Config: () => Config,
  cacheGroupData: () => cacheGroupData,
  checkRipgrepAvailability: () => checkRipgrepAvailability,
  load: () => load
});
module.exports = __toCommonJS(config_loader_exports);
var defaults = __toESM(require("../config/config-example"));
var import_lib = require("../lib");
/**
 * Config loader
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * @license MIT
 */
const FLAG_PRESETS = /* @__PURE__ */ new Map([
  ["--no-security", ["nothrottle", "noguestsecurity", "noipchecks"]]
]);
const CONFIG_PATH = (0, import_lib.FS)("./config/config.js").path;
function load(invalidate = false) {
  if (invalidate)
    delete require.cache[CONFIG_PATH];
  const config = { ...defaults, ...require(CONFIG_PATH) };
  config.routes = { ...defaults.routes, ...config.routes };
  if (config.usesqlite) {
    try {
      require("better-sqlite3");
    } catch {
      throw new Error(`better-sqlite3 is not installed or could not be loaded, but Config.usesqlite is enabled.`);
    }
  }
  for (const [preset, values] of FLAG_PRESETS) {
    if (process.argv.includes(preset)) {
      for (const value of values)
        config[value] = true;
    }
  }
  cacheGroupData(config);
  return config;
}
function cacheGroupData(config) {
  if (config.groups) {
    reportError(
      `You are using a deprecated version of user group specification in config.
Support for this will be removed soon.
Please ensure that you update your config.js to the new format (see config-example.js, line 457).
`
    );
  } else {
    config.punishgroups = /* @__PURE__ */ Object.create(null);
    config.groups = /* @__PURE__ */ Object.create(null);
    config.groupsranking = [];
    config.greatergroupscache = /* @__PURE__ */ Object.create(null);
  }
  const groups = config.groups;
  const punishgroups = config.punishgroups;
  const cachedGroups = {};
  function isPermission(key) {
    return !["symbol", "id", "name", "rank", "globalGroupInPersonalRoom"].includes(key);
  }
  function cacheGroup(symbol, groupData) {
    if (cachedGroups[symbol] === "processing") {
      throw new Error(`Cyclic inheritance in group config for symbol "${symbol}"`);
    }
    if (cachedGroups[symbol] === true)
      return;
    for (const key in groupData) {
      if (isPermission(key)) {
        const jurisdiction = groupData[key];
        if (typeof jurisdiction === "string" && jurisdiction.includes("s")) {
          reportError(`Outdated jurisdiction for permission "${key}" of group "${symbol}": 's' is no longer a supported jurisdiction; we now use 'ipself' and 'altsself'`);
          delete groupData[key];
        }
      }
    }
    if (groupData["inherit"]) {
      cachedGroups[symbol] = "processing";
      const inheritGroup = groups[groupData["inherit"]];
      cacheGroup(groupData["inherit"], inheritGroup);
      for (const key in inheritGroup) {
        if (key in groupData)
          continue;
        if (!isPermission(key))
          continue;
        groupData[key] = inheritGroup[key];
      }
      delete groupData["inherit"];
    }
    cachedGroups[symbol] = true;
  }
  if (config.grouplist) {
    const grouplist = config.grouplist;
    const numGroups = grouplist.length;
    for (let i = 0; i < numGroups; i++) {
      const groupData = grouplist[i];
      if (groupData.punishgroup) {
        punishgroups[groupData.id] = groupData;
        continue;
      }
      groupData.rank = numGroups - i - 1;
      groups[groupData.symbol] = groupData;
      config.groupsranking.unshift(groupData.symbol);
    }
  }
  for (const sym in groups) {
    const groupData = groups[sym];
    cacheGroup(sym, groupData);
  }
  if (!punishgroups.locked) {
    punishgroups.locked = {
      name: "Locked",
      id: "locked",
      symbol: "\u203D"
    };
  }
  if (!punishgroups.muted) {
    punishgroups.muted = {
      name: "Muted",
      id: "muted",
      symbol: "!"
    };
  }
}
function checkRipgrepAvailability() {
  if (Config.ripgrepmodlog === void 0) {
    const cwd = import_lib.FS.ROOT_PATH;
    Config.ripgrepmodlog = (async () => {
      try {
        await import_lib.ProcessManager.exec(["rg", "--version"], { cwd });
        await import_lib.ProcessManager.exec(["tac", "--version"], { cwd });
        return true;
      } catch {
        return false;
      }
    })();
  }
  return Config.ripgrepmodlog;
}
function reportError(msg) {
  setImmediate(() => global.Monitor?.error?.(msg));
}
const Config = load();
//# sourceMappingURL=config-loader.js.map
