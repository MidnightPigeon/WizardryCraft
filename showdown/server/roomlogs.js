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
var roomlogs_exports = {};
__export(roomlogs_exports, {
  Roomlog: () => Roomlog,
  Roomlogs: () => Roomlogs
});
module.exports = __toCommonJS(roomlogs_exports);
var import_lib = require("../lib");
/**
 * Roomlogs
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * This handles data storage for rooms.
 *
 * @license MIT
 */
class Roomlog {
  constructor(room, options = {}) {
    this.visibleMessageCount = 0;
    this.roomid = room.roomid;
    this.isMultichannel = !!options.isMultichannel;
    this.noAutoTruncate = !!options.noAutoTruncate;
    this.noLogTimes = !!options.noLogTimes;
    this.log = [];
    this.broadcastBuffer = [];
    this.roomlogStream = void 0;
    this.roomlogFilename = "";
    this.numTruncatedLines = 0;
    void this.setupRoomlogStream(true);
  }
  getScrollback(channel = 0) {
    let log = this.log;
    if (!this.noLogTimes)
      log = [`|:|${~~(Date.now() / 1e3)}`].concat(log);
    if (!this.isMultichannel) {
      return log.join("\n") + "\n";
    }
    log = [];
    for (let i = 0; i < this.log.length; ++i) {
      const line = this.log[i];
      const split = /\|split\|p(\d)/g.exec(line);
      if (split) {
        const canSeePrivileged = channel === Number(split[1]) || channel === -1;
        const ownLine = this.log[i + (canSeePrivileged ? 1 : 2)];
        if (ownLine)
          log.push(ownLine);
        i += 2;
      } else {
        log.push(line);
      }
    }
    return log.join("\n") + "\n";
  }
  async setupRoomlogStream(sync = false) {
    if (this.roomlogStream === null)
      return;
    if (!Config.logchat) {
      this.roomlogStream = null;
      return;
    }
    if (this.roomid.startsWith("battle-")) {
      this.roomlogStream = null;
      return;
    }
    const date = new Date();
    const dateString = Chat.toTimestamp(date).split(" ")[0];
    const monthString = dateString.split("-", 2).join("-");
    const basepath = `logs/chat/${this.roomid}/`;
    const relpath = `${monthString}/${dateString}.txt`;
    if (relpath === this.roomlogFilename)
      return;
    if (sync) {
      (0, import_lib.FS)(basepath + monthString).mkdirpSync();
    } else {
      await (0, import_lib.FS)(basepath + monthString).mkdirp();
      if (this.roomlogStream === null)
        return;
    }
    this.roomlogFilename = relpath;
    if (this.roomlogStream)
      void this.roomlogStream.writeEnd();
    this.roomlogStream = (0, import_lib.FS)(basepath + relpath).createAppendStream();
    const link0 = basepath + "today.txt.0";
    (0, import_lib.FS)(link0).unlinkIfExistsSync();
    try {
      (0, import_lib.FS)(link0).symlinkToSync(relpath);
      (0, import_lib.FS)(link0).renameSync(basepath + "today.txt");
    } catch {
    }
    if (!Roomlogs.rollLogTimer)
      void Roomlogs.rollLogs();
  }
  add(message) {
    this.roomlog(message);
    if (["|c|", "|c:|", "|raw|", "|html|", "|uhtml"].some((k) => message.startsWith(k))) {
      this.visibleMessageCount++;
    }
    message = this.withTimestamp(message);
    this.log.push(message);
    this.broadcastBuffer.push(message);
    return this;
  }
  withTimestamp(message) {
    if (!this.noLogTimes && message.startsWith("|c|")) {
      return `|c:|${Math.trunc(Date.now() / 1e3)}|${message.slice(3)}`;
    } else {
      return message;
    }
  }
  hasUsername(username) {
    const userid = toID(username);
    for (const line of this.log) {
      if (line.startsWith("|c:|")) {
        const curUserid = toID(line.split("|", 4)[3]);
        if (curUserid === userid)
          return true;
      } else if (line.startsWith("|c|")) {
        const curUserid = toID(line.split("|", 3)[2]);
        if (curUserid === userid)
          return true;
      }
    }
    return false;
  }
  clearText(userids, lineCount = 0) {
    const cleared = [];
    const clearAll = lineCount === 0;
    this.log = this.log.reverse().filter((line) => {
      const parsed = this.parseChatLine(line);
      if (parsed) {
        const userid = toID(parsed.user);
        if (userids.includes(userid)) {
          if (!cleared.includes(userid))
            cleared.push(userid);
          if (this.roomid.startsWith("battle-"))
            return true;
          if (clearAll)
            return false;
          if (lineCount > 0) {
            lineCount--;
            return false;
          }
          return true;
        }
      }
      return true;
    }).reverse();
    return cleared;
  }
  uhtmlchange(name, message) {
    const originalStart = "|uhtml|" + name + "|";
    const fullMessage = originalStart + message;
    for (const [i, line] of this.log.entries()) {
      if (line.startsWith(originalStart)) {
        this.log[i] = fullMessage;
        break;
      }
    }
    this.broadcastBuffer.push(fullMessage);
  }
  attributedUhtmlchange(user, name, message) {
    const start = `/uhtmlchange ${name},`;
    const fullMessage = this.withTimestamp(`|c|${user.getIdentity()}|${start}${message}`);
    let matched = false;
    for (const [i, line] of this.log.entries()) {
      if (this.parseChatLine(line)?.message.startsWith(start)) {
        this.log[i] = fullMessage;
        matched = true;
        break;
      }
    }
    if (!matched)
      this.log.push(fullMessage);
    this.broadcastBuffer.push(fullMessage);
  }
  parseChatLine(line) {
    const messageStart = !this.noLogTimes ? "|c:|" : "|c|";
    const section = !this.noLogTimes ? 4 : 3;
    if (line.startsWith(messageStart)) {
      const parts = import_lib.Utils.splitFirst(line, "|", section);
      return { user: parts[section - 1], message: parts[section] };
    }
  }
  roomlog(message, date = new Date()) {
    if (!this.roomlogStream)
      return;
    const timestamp = Chat.toTimestamp(date).split(" ")[1] + " ";
    message = message.replace(/<img[^>]* src="data:image\/png;base64,[^">]+"[^>]*>/g, "");
    void this.roomlogStream.write(timestamp + message + "\n");
  }
  modlog(entry, overrideID) {
    void Rooms.Modlog.write(this.roomid, entry, overrideID);
  }
  async rename(newID) {
    const roomlogPath = `logs/chat`;
    const roomlogStreamExisted = this.roomlogStream !== null;
    await this.destroy();
    const [roomlogExists, newRoomlogExists] = await Promise.all([
      (0, import_lib.FS)(roomlogPath + `/${this.roomid}`).exists(),
      (0, import_lib.FS)(roomlogPath + `/${newID}`).exists()
    ]);
    if (roomlogExists && !newRoomlogExists) {
      await (0, import_lib.FS)(roomlogPath + `/${this.roomid}`).rename(roomlogPath + `/${newID}`);
    }
    await Rooms.Modlog.rename(this.roomid, newID);
    this.roomid = newID;
    Roomlogs.roomlogs.set(newID, this);
    if (roomlogStreamExisted) {
      this.roomlogStream = void 0;
      this.roomlogFilename = "";
      await this.setupRoomlogStream(true);
    }
    return true;
  }
  static async rollLogs() {
    if (Roomlogs.rollLogTimer === true)
      return;
    if (Roomlogs.rollLogTimer) {
      clearTimeout(Roomlogs.rollLogTimer);
    }
    Roomlogs.rollLogTimer = true;
    for (const log of Roomlogs.roomlogs.values()) {
      await log.setupRoomlogStream();
    }
    const time = Date.now();
    const nextMidnight = new Date(time + 24 * 60 * 60 * 1e3);
    nextMidnight.setHours(0, 0, 1);
    Roomlogs.rollLogTimer = setTimeout(() => void Roomlog.rollLogs(), nextMidnight.getTime() - time);
  }
  truncate() {
    if (this.noAutoTruncate)
      return;
    if (this.log.length > 100) {
      const truncationLength = this.log.length - 100;
      this.log.splice(0, truncationLength);
      this.numTruncatedLines += truncationLength;
    }
  }
  /**
   * Returns the total number of lines in the roomlog, including truncated lines.
   */
  getLineCount(onlyVisible = true) {
    return (onlyVisible ? this.visibleMessageCount : this.log.length) + this.numTruncatedLines;
  }
  destroy() {
    const promises = [];
    if (this.roomlogStream) {
      promises.push(this.roomlogStream.writeEnd());
      this.roomlogStream = null;
    }
    Roomlogs.roomlogs.delete(this.roomid);
    return Promise.all(promises);
  }
}
const roomlogs = /* @__PURE__ */ new Map();
function createRoomlog(room, options = {}) {
  let roomlog = Roomlogs.roomlogs.get(room.roomid);
  if (roomlog)
    throw new Error(`Roomlog ${room.roomid} already exists`);
  roomlog = new Roomlog(room, options);
  Roomlogs.roomlogs.set(room.roomid, roomlog);
  return roomlog;
}
const Roomlogs = {
  create: createRoomlog,
  Roomlog,
  roomlogs,
  rollLogs: Roomlog.rollLogs,
  rollLogTimer: null
};
//# sourceMappingURL=roomlogs.js.map
