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
var username_prefixes_exports = {};
__export(username_prefixes_exports, {
  PrefixManager: () => PrefixManager,
  commands: () => commands,
  prefixManager: () => prefixManager
});
module.exports = __toCommonJS(username_prefixes_exports);
var import_lib = require("../../lib");
const PREFIXES_FILE = "config/chat-plugins/username-prefixes.json";
const PREFIX_DURATION = 10 * 24 * 60 * 60 * 1e3;
class PrefixManager {
  constructor() {
    if (!Chat.oldPlugins["username-prefixes"])
      this.refreshConfig(true);
  }
  save() {
    (0, import_lib.FS)(PREFIXES_FILE).writeUpdate(() => JSON.stringify(Config.forcedprefixes || []));
  }
  refreshConfig(configJustLoaded = false) {
    if (!Config.forcedprefixes)
      Config.forcedprefixes = [];
    if (!Array.isArray(Config.forcedprefixes)) {
      const convertedPrefixes = [];
      for (const type in Config.forcedprefixes) {
        for (const prefix of Config.forcedprefixes[type].map(toID)) {
          convertedPrefixes.push({ type, prefix, expireAt: Date.now() + PREFIX_DURATION });
        }
      }
      Config.forcedprefixes = convertedPrefixes;
    }
    if (configJustLoaded) {
      for (const entry of Config.forcedprefixes) {
        entry.prefix = toID(entry.prefix);
      }
    }
    let data;
    try {
      data = JSON.parse((0, import_lib.FS)(PREFIXES_FILE).readSync());
    } catch (e) {
      if (e.code !== "ENOENT")
        throw e;
      return;
    }
    if (data.length) {
      for (const entry of data) {
        if (Config.forcedprefixes.includes(entry))
          continue;
        Config.forcedprefixes.push(entry);
      }
    }
  }
  addPrefix(prefix, type) {
    if (!Config.forcedprefixes)
      Config.forcedprefixes = [];
    const entry = Config.forcedprefixes.find((x) => x.prefix === prefix && x.type === type);
    if (entry) {
      throw new Chat.ErrorMessage(`Username prefix '${prefix}' is already configured to force ${type}.`);
    }
    Config.forcedprefixes.push({ type, prefix, expireAt: Date.now() + PREFIX_DURATION });
    this.save();
  }
  removePrefix(prefix, type) {
    const entry = Config.forcedprefixes.findIndex((x) => x.prefix === prefix && x.type === type);
    if (entry < 0) {
      throw new Chat.ErrorMessage(`Username prefix '${prefix}' is not configured to force ${type}!`);
    }
    Config.forcedprefixes.splice(entry, 1);
    this.save();
  }
  validateType(type) {
    if (type !== "privacy" && type !== "modchat") {
      throw new Chat.ErrorMessage(`'${type}' is not a valid type of forced prefix. Valid types are 'privacy' and 'modchat'.`);
    }
    return type;
  }
}
const prefixManager = new PrefixManager();
const commands = {
  forceprefix: "usernameprefix",
  forcedprefix: "usernameprefix",
  forcedprefixes: "usernameprefix",
  usernameprefixes: "usernameprefix",
  usernameprefix: {
    help: "",
    ""() {
      this.parse(`/help forcedprefix`);
    },
    delete: "add",
    remove: "add",
    add(target, room, user, connection, cmd) {
      this.checkCan("addhtml");
      const isAdding = cmd.includes("add");
      const [prefix, type] = target.split(",").map(toID);
      if (!prefix || !type)
        return this.parse(`/help usernameprefix`);
      if (prefix.length > 18) {
        throw new Chat.ErrorMessage(`Specified prefix '${prefix}' is longer than the maximum user ID length.`);
      }
      if (isAdding) {
        prefixManager.addPrefix(prefix, prefixManager.validateType(type));
      } else {
        prefixManager.removePrefix(prefix, prefixManager.validateType(type));
      }
      this.globalModlog(`FORCEDPREFIX ${isAdding ? "ADD" : "REMOVE"}`, null, `'${prefix}' ${isAdding ? "to" : "from"} ${type}`);
      this.addGlobalModAction(`${user.name} set the username prefix ${prefix} to${isAdding ? "" : " no longer"} disable ${type}.`);
    },
    view(target) {
      this.checkCan("addhtml");
      const types = target ? [prefixManager.validateType(toID(target))] : ["privacy", "modchat"];
      const entries = Config.forcedprefixes.filter((x) => types.includes(x.type));
      return this.sendReplyBox(types.map((type) => {
        const prefixes = entries.filter((x) => x.type === type).map((x) => x.prefix);
        const info = prefixes.length ? `<code>${prefixes.join("</code>, <code>")}</code>` : `none`;
        return `Username prefixes that disable <strong>${type}</strong>: ${info}.`;
      }).join(`<br />`));
    }
  },
  usernameprefixhelp() {
    return this.sendReplyBox(
      `<code>/usernameprefix add [prefix], [type]</code>: Sets the username prefix [prefix] to disable privacy or modchat on battles where at least one player has the prefix.<br /><code>/usernameprefix remove [prefix], [type]</code>: Removes a prefix configuration.<br /><code>/usernameprefix view [optional type]</code>: Displays the currently configured username prefixes.<br />Valid types are <code>privacy</code> (which forces battles to take place in public rooms) and <code>modchat</code> (which prevents players from setting moderated chat).<br />Requires: * &`
    );
  }
};
//# sourceMappingURL=username-prefixes.js.map
