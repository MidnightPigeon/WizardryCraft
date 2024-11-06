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
var private_messages_exports = {};
__export(private_messages_exports, {
  EXPIRY_TIME: () => EXPIRY_TIME,
  MAX_PENDING: () => MAX_PENDING,
  PM: () => PM,
  PrivateMessages: () => PrivateMessages,
  SEEN_EXPIRY_TIME: () => SEEN_EXPIRY_TIME
});
module.exports = __toCommonJS(private_messages_exports);
var import_lib = require("../../lib");
var import_config_loader = require("../config-loader");
var import_user_groups = require("../user-groups");
var import_database = require("./database");
const EXPIRY_TIME = 60 * 24 * 60 * 60 * 1e3;
const SEEN_EXPIRY_TIME = 7 * 24 * 60 * 60 * 1e3;
const MAX_PENDING = 20;
const PM = (0, import_lib.SQL)(module, {
  file: "databases/offline-pms.db",
  extension: "server/private-messages/database.js"
});
const PrivateMessages = new class {
  constructor() {
    this.database = PM;
    this.clearInterval = this.nextClear();
    this.offlineIsEnabled = import_config_loader.Config.usesqlitepms && import_config_loader.Config.usesqlite;
  }
  async sendOffline(to, from, message, context) {
    await this.checkCanSend(to, from);
    const result = await PM.transaction("send", [toID(from), toID(to), message]);
    if (result.error)
      throw new Chat.ErrorMessage(result.error);
    if (typeof from === "object") {
      from.send(`|pm|${this.getIdentity(from)}|${this.getIdentity(to)}|${message} __[sent offline]__`);
    }
    const changed = !!result.changes;
    if (changed && context) {
      Chat.runHandlers("onMessageOffline", context, message, toID(to));
    }
    return changed;
  }
  getSettings(userid) {
    return PM.get(import_database.statements.getSettings, [toID(userid)]);
  }
  deleteSettings(userid) {
    return PM.run(import_database.statements.deleteSettings, [toID(userid)]);
  }
  async checkCanSend(to, from) {
    from = toID(from);
    to = toID(to);
    const setting = await this.getSettings(to);
    const requirement = setting?.view_only || import_config_loader.Config.usesqlitepms || "friends";
    switch (requirement) {
      case "friends":
        if (!await Chat.Friends.findFriendship(to, from)) {
          if (import_config_loader.Config.usesqlitepms === "friends") {
            throw new Chat.ErrorMessage(`At this time, you may only send offline PMs to friends. ${to} is not friends with you.`);
          }
          throw new Chat.ErrorMessage(`${to} is only accepting offline PMs from friends at this time.`);
        }
        break;
      case "trusted":
        if (!Users.globalAuth.has(toID(from))) {
          throw new Chat.ErrorMessage(`${to} is currently blocking offline PMs from non-trusted users.`);
        }
        break;
      case "none":
        if (!import_user_groups.Auth.atLeast(Users.globalAuth.get(from), "%")) {
          throw new Chat.ErrorMessage(`${to} has indicated that they do not wish to receive offine PMs.`);
        }
        break;
      default:
        if (!import_user_groups.Auth.atLeast(Users.globalAuth.get(from), requirement)) {
          if (setting?.view_only) {
            throw new Chat.ErrorMessage(`That user is not allowing offline PMs from your rank at this time.`);
          }
          throw new Chat.ErrorMessage("You do not meet the rank requirement to send offline PMs at this time.");
        }
        break;
    }
  }
  setViewOnly(user, val) {
    const id = toID(user);
    if (!val) {
      return PM.run(import_database.statements.deleteSettings, [id]);
    }
    return PM.run(import_database.statements.setBlock, [id, val]);
  }
  checkCanUse(user, options = { forceBool: false, isLogin: false }) {
    if (!this.offlineIsEnabled) {
      if (options.forceBool)
        return false;
      throw new Chat.ErrorMessage(`Offline PMs are currently disabled.`);
    }
    if (!(options.isLogin ? user.registered : user.autoconfirmed)) {
      if (options.forceBool)
        return false;
      throw new Chat.ErrorMessage("You must be autoconfirmed to use offine messaging.");
    }
    if (!Users.globalAuth.atLeast(user, import_config_loader.Config.usesqlitepms)) {
      if (options.forceBool)
        return false;
      throw new Chat.ErrorMessage("You do not have the needed rank to send offline PMs.");
    }
    return true;
  }
  checkCanPM(user, pmTarget) {
    this.checkCanUse(user);
    if (import_config_loader.Config.usesqlitepms === "friends" && !user.friends?.has(pmTarget)) {
      throw new Chat.ErrorMessage(
        `At this time, you may only send offline messages to friends. You do not have ${pmTarget} friended.`
      );
    }
  }
  async sendReceived(user) {
    const userid = toID(user);
    const messages = await this.fetchUnseen(userid);
    for (const { message, time, sender } of messages) {
      user.send(
        `|pm|${this.getIdentity(sender)}|${this.getIdentity(user)}|/html ${import_lib.Utils.escapeHTML(message)} __[sent offline, <time>${new Date(time).toISOString()}</time>]__`
      );
    }
  }
  getIdentity(user) {
    user = Users.getExact(user) || user;
    if (typeof user === "object") {
      return user.getIdentity();
    }
    return `${Users.globalAuth.get(toID(user))}${user}`;
  }
  nextClear() {
    if (!PM.isParentProcess)
      return null;
    const time = Date.now();
    const nextMidnight = new Date(time + 24 * 60 * 60 * 1e3);
    nextMidnight.setHours(0, 0, 1);
    if (this.clearInterval)
      clearTimeout(this.clearInterval);
    this.clearInterval = setTimeout(() => {
      void this.clearOffline();
      void this.clearSeen();
      this.nextClear();
    }, nextMidnight.getTime() - time);
    return this.clearInterval;
  }
  clearSeen() {
    return PM.run(import_database.statements.clearSeen);
  }
  send(message, user, pmTarget, onlyRecipient = null) {
    const buf = `|pm|${user.getIdentity()}|${pmTarget.getIdentity()}|${message}`;
    if (onlyRecipient)
      return onlyRecipient.send(buf);
    user.send(buf);
    if (pmTarget !== user)
      pmTarget.send(buf);
    pmTarget.lastPM = user.id;
    user.lastPM = pmTarget.id;
  }
  async fetchUnseen(user) {
    const userid = toID(user);
    return await PM.transaction("listNew", [userid]) || [];
  }
  async fetchAll(user) {
    return await PM.all(import_database.statements.fetch, [toID(user)]) || [];
  }
  async renderReceived(user) {
    const all = await this.fetchAll(user);
    let buf = `<div class="ladder pad">`;
    buf += `<h2>PMs received offline in the last ${Chat.toDurationString(SEEN_EXPIRY_TIME)}</h2>`;
    const sortedPMs = {};
    for (const curPM of all) {
      if (!sortedPMs[curPM.sender])
        sortedPMs[curPM.sender] = [];
      sortedPMs[curPM.sender].push(curPM);
    }
    for (const k in sortedPMs) {
      import_lib.Utils.sortBy(sortedPMs[k], (pm) => -pm.time);
    }
    buf += `<div class="mainmenuwrapper" style="margin-left:40px">`;
    for (const pair of import_lib.Utils.sortBy(Object.entries(sortedPMs), ([id]) => id)) {
      const [sender, messages] = pair;
      const group = Users.globalAuth.get(toID(sender));
      const name = Users.getExact(sender)?.name || sender;
      const id = toID(name);
      buf += import_lib.Utils.html`<div class="pm-window pm-window-${id}" width="30px" data-userid="${id}" data-name="${group}${name}" style="width:300px">`;
      buf += import_lib.Utils.html`<h3><small>${group}</small>${name}</h3>`;
      buf += `<div class="pm-log"><div class="pm-buttonbar">`;
      for (const { message, time } of messages) {
        buf += `<div class="chat chatmessage-${toID(sender)}">&nbsp;&nbsp;`;
        buf += `<small>[<time>${new Date(time).toISOString()}</time>] </small>`;
        buf += import_lib.Utils.html`<small>${group}</small>`;
        buf += import_lib.Utils.html`<span class="username" data-roomgroup="${group}" data-name="${name}"><username>${name}</username></span>: `;
        buf += `<em>${message}</em></div>`;
      }
      buf += `</div></div></div>`;
      buf += `<br />`;
    }
    buf += `</div>`;
    return buf;
  }
  clearOffline() {
    return PM.run(import_database.statements.clearDated);
  }
  destroy() {
    void PM.destroy();
  }
}();
if (import_config_loader.Config.usesqlite) {
  if (!process.send) {
    PM.spawn(import_config_loader.Config.pmprocesses || 1);
    void PM.run(import_database.statements.clearDated);
  } else if (process.send && process.mainModule === module) {
    global.Monitor = {
      crashlog(error, source = "A private message child process", details = null) {
        const repr = JSON.stringify([error.name, error.message, source, details]);
        process.send(`THROW
@!!@${repr}
${error.stack}`);
      }
    };
    process.on("uncaughtException", (err) => {
      Monitor.crashlog(err, "A private message database process");
    });
    process.on("unhandledRejection", (err) => {
      Monitor.crashlog(err, "A private message database process");
    });
  }
}
//# sourceMappingURL=index.js.map
