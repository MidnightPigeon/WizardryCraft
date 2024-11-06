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
var user_groups_exports = {};
__export(user_groups_exports, {
  Auth: () => Auth,
  GLOBAL_PERMISSIONS: () => GLOBAL_PERMISSIONS,
  GlobalAuth: () => GlobalAuth,
  HOST_SYMBOL: () => HOST_SYMBOL,
  PLAYER_SYMBOL: () => PLAYER_SYMBOL,
  ROOM_PERMISSIONS: () => ROOM_PERMISSIONS,
  RoomAuth: () => RoomAuth,
  SECTIONLEADER_SYMBOL: () => SECTIONLEADER_SYMBOL
});
module.exports = __toCommonJS(user_groups_exports);
var import_fs = require("../lib/fs");
var import_dex_data = require("../sim/dex-data");
const SECTIONLEADER_SYMBOL = "\xA7";
const PLAYER_SYMBOL = "\u2606";
const HOST_SYMBOL = "\u2605";
const ROOM_PERMISSIONS = [
  "addhtml",
  "announce",
  "ban",
  "bypassafktimer",
  "declare",
  "editprivacy",
  "editroom",
  "exportinputlog",
  "game",
  "gamemanagement",
  "gamemoderation",
  "joinbattle",
  "kick",
  "minigame",
  "modchat",
  "modlog",
  "mute",
  "nooverride",
  "receiveauthmessages",
  "roombot",
  "roomdriver",
  "roommod",
  "roomowner",
  "roomsectionleader",
  "roomvoice",
  "roomprizewinner",
  "show",
  "showmedia",
  "timer",
  "tournaments",
  "warn"
];
const GLOBAL_PERMISSIONS = [
  // administrative
  "bypassall",
  "console",
  "disableladder",
  "lockdown",
  "potd",
  // other
  "addhtml",
  "alts",
  "altsself",
  "autotimer",
  "globalban",
  "bypassblocks",
  "bypassafktimer",
  "forcepromote",
  "forcerename",
  "forcewin",
  "gdeclare",
  "hiderank",
  "ignorelimits",
  "importinputlog",
  "ip",
  "ipself",
  "lock",
  "makeroom",
  "modlog",
  "rangeban",
  "promote"
];
const _Auth = class extends Map {
  /**
   * Will return the default group symbol if the user isn't in a group.
   *
   * Passing a User will read `user.group`, which is relevant for unregistered
   * users with temporary global auth.
   */
  get(user) {
    if (typeof user !== "string")
      return user.tempGroup;
    return super.get(user) || _Auth.defaultSymbol();
  }
  isStaff(userid) {
    if (this.has(userid)) {
      const rank = this.get(userid);
      return _Auth.atLeast(rank, "*") || _Auth.atLeast(rank, SECTIONLEADER_SYMBOL) || _Auth.atLeast(rank, "%");
    } else {
      return false;
    }
  }
  atLeast(user, group) {
    if (user.hasSysopAccess())
      return true;
    if (group === "trusted" || group === "autoconfirmed") {
      if (user.trusted && group === "trusted")
        return true;
      if (user.autoconfirmed && !user.locked && group === "autoconfirmed")
        return true;
      group = Config.groupsranking[1];
    }
    if (user.locked || user.semilocked)
      return false;
    if (group === "unlocked")
      return true;
    if (group === "whitelist" && this.has(user.id)) {
      return true;
    }
    if (!Config.groups[group])
      return false;
    if (this.get(user.id) === " " && group !== " ")
      return false;
    return _Auth.atLeast(this.get(user.id), group);
  }
  static defaultSymbol() {
    return Config.groupsranking[0];
  }
  static getGroup(symbol, fallback) {
    if (Config.groups[symbol])
      return Config.groups[symbol];
    if (fallback !== void 0)
      return fallback;
    return {
      ...Config.groups["+"] || {},
      symbol,
      id: "voice",
      name: symbol
    };
  }
  getEffectiveSymbol(user) {
    const group = this.get(user);
    if (this.has(user.id) && group === _Auth.defaultSymbol()) {
      return "whitelist";
    }
    return group;
  }
  static hasPermission(user, permission, target, room, cmd, cmdToken) {
    if (user.hasSysopAccess())
      return true;
    const auth = room ? room.auth : Users.globalAuth;
    const symbol = auth.getEffectiveSymbol(user);
    let targetSymbol;
    if (!target) {
      targetSymbol = null;
    } else if (typeof target === "string" && !(0, import_dex_data.toID)(target)) {
      targetSymbol = target;
    } else {
      targetSymbol = auth.get(target);
    }
    if (!targetSymbol || ["whitelist", "trusted", "autoconfirmed"].includes(targetSymbol)) {
      targetSymbol = _Auth.defaultSymbol();
    }
    let group = _Auth.getGroup(symbol);
    if (group["root"])
      return true;
    if (room?.settings.section && room.settings.section === Users.globalAuth.sectionLeaders.get(user.id) && // Global drivers who are SLs should get room mod powers too
    Users.globalAuth.atLeast(user, SECTIONLEADER_SYMBOL) && _Auth.getGroup("@").rank > group.rank) {
      group = _Auth.getGroup("@");
    }
    let jurisdiction = group[permission];
    if (jurisdiction === true && permission !== "jurisdiction") {
      jurisdiction = group["jurisdiction"] || true;
    }
    const roomPermissions = room ? room.settings.permissions : null;
    if (roomPermissions) {
      let foundSpecificPermission = false;
      if (cmd) {
        if (!cmdToken)
          cmdToken = `/`;
        const namespace = cmd.slice(0, cmd.indexOf(" "));
        if (roomPermissions[`${cmdToken}${cmd}`]) {
          if (!auth.atLeast(user, roomPermissions[`${cmdToken}${cmd}`]))
            return false;
          jurisdiction = "u";
          foundSpecificPermission = true;
        } else if (roomPermissions[`${cmdToken}${namespace}`]) {
          if (!auth.atLeast(user, roomPermissions[`${cmdToken}${namespace}`]))
            return false;
          jurisdiction = "u";
          foundSpecificPermission = true;
        }
        if (foundSpecificPermission && targetSymbol === Users.Auth.defaultSymbol()) {
          jurisdiction += Users.Auth.defaultSymbol();
        }
      }
      if (!foundSpecificPermission && roomPermissions[permission]) {
        if (!auth.atLeast(user, roomPermissions[permission]))
          return false;
        jurisdiction = "u";
      }
    }
    return _Auth.hasJurisdiction(symbol, jurisdiction, targetSymbol);
  }
  static atLeast(symbol, symbol2) {
    return _Auth.getGroup(symbol).rank >= _Auth.getGroup(symbol2).rank;
  }
  static supportedRoomPermissions(room = null) {
    const commands = [];
    for (const handler of Chat.allCommands()) {
      if (!handler.hasRoomPermissions && !handler.broadcastable)
        continue;
      const cmdPrefix = handler.hasRoomPermissions ? "/" : "!";
      commands.push(`${cmdPrefix}${handler.fullCmd}`);
      if (handler.aliases.length) {
        for (const alias of handler.aliases) {
          commands.push(`${cmdPrefix}${handler.fullCmd.replace(handler.cmd, alias)}`);
        }
      }
    }
    return [
      ...ROOM_PERMISSIONS,
      ...commands
    ];
  }
  static hasJurisdiction(symbol, jurisdiction, targetSymbol) {
    if (!targetSymbol) {
      return !!jurisdiction;
    }
    if (typeof jurisdiction !== "string") {
      return !!jurisdiction;
    }
    if (jurisdiction.includes(targetSymbol)) {
      return true;
    }
    if (jurisdiction.includes("a")) {
      return true;
    }
    if (jurisdiction.includes("u") && _Auth.getGroup(symbol).rank > _Auth.getGroup(targetSymbol).rank) {
      return true;
    }
    return false;
  }
  static listJurisdiction(user, permission) {
    const symbols = Object.keys(Config.groups);
    return symbols.filter((targetSymbol) => _Auth.hasPermission(user, permission, targetSymbol));
  }
  static isValidSymbol(symbol) {
    if (symbol.length !== 1)
      return false;
    return !/[A-Za-z0-9|,]/.test(symbol);
  }
  static isAuthLevel(level) {
    if (Config.groupsranking.includes(level))
      return true;
    return ["\u203D", "!", "unlocked", "trusted", "autoconfirmed", "whitelist"].includes(level);
  }
};
let Auth = _Auth;
Auth.ROOM_PERMISSIONS = ROOM_PERMISSIONS;
Auth.GLOBAL_PERMISSIONS = GLOBAL_PERMISSIONS;
class RoomAuth extends Auth {
  constructor(room) {
    super();
    this.room = room;
  }
  get(userOrID) {
    const id = typeof userOrID === "string" ? userOrID : userOrID.id;
    const parentAuth = this.room.parent ? this.room.parent.auth : this.room.settings.isPrivate !== true ? Users.globalAuth : null;
    const parentGroup = parentAuth ? parentAuth.get(userOrID) : Auth.defaultSymbol();
    if (this.has(id)) {
      const roomGroup = this.getDirect(id);
      let group = Config.greatergroupscache[`${roomGroup}${parentGroup}`];
      if (!group) {
        const roomRank = Auth.getGroup(roomGroup, { rank: Infinity }).rank;
        const globalRank = Auth.getGroup(parentGroup).rank;
        if (roomGroup === Users.PLAYER_SYMBOL || roomGroup === Users.HOST_SYMBOL || roomGroup === "#") {
          group = roomGroup;
        } else {
          group = roomRank > globalRank ? roomGroup : parentGroup;
        }
        Config.greatergroupscache[`${roomGroup}${parentGroup}`] = group;
      }
      return group;
    }
    return parentGroup;
  }
  getEffectiveSymbol(user) {
    const symbol = super.getEffectiveSymbol(user);
    if (!this.room.persist && symbol === user.tempGroup) {
      const replaceGroup = Auth.getGroup(symbol).globalGroupInPersonalRoom;
      if (replaceGroup)
        return replaceGroup;
    }
    if (this.room.settings.isPrivate === true && user.can("makeroom")) {
      return Users.globalAuth.get(user);
    }
    return symbol;
  }
  /** gets the room group without inheriting */
  getDirect(id) {
    return super.get(id);
  }
  save() {
    const auth = /* @__PURE__ */ Object.create(null);
    for (const [userid, groupSymbol] of this) {
      auth[userid] = groupSymbol;
    }
    this.room.settings.auth = auth;
    this.room.saveSettings();
  }
  load() {
    for (const userid in this.room.settings.auth) {
      super.set(userid, this.room.settings.auth[userid]);
    }
  }
  set(id, symbol) {
    if (symbol === "whitelist") {
      symbol = Auth.defaultSymbol();
    }
    super.set(id, symbol);
    this.room.settings.auth[id] = symbol;
    this.room.saveSettings();
    const user = Users.get(id);
    if (user)
      this.room.onUpdateIdentity(user);
    return this;
  }
  delete(id) {
    if (!this.has(id))
      return false;
    super.delete(id);
    delete this.room.settings.auth[id];
    this.room.saveSettings();
    return true;
  }
}
class GlobalAuth extends Auth {
  constructor() {
    super();
    this.usernames = /* @__PURE__ */ new Map();
    this.sectionLeaders = /* @__PURE__ */ new Map();
    this.load();
  }
  save() {
    (0, import_fs.FS)("config/usergroups.csv").writeUpdate(() => {
      let buffer = "";
      for (const [userid, groupSymbol] of this) {
        buffer += `${this.usernames.get(userid) || userid},${groupSymbol},${this.sectionLeaders.get(userid) || ""}
`;
      }
      return buffer;
    });
  }
  load() {
    const data = (0, import_fs.FS)("config/usergroups.csv").readIfExistsSync();
    for (const row of data.split("\n")) {
      if (!row)
        continue;
      const [name, symbol, sectionid] = row.split(",");
      const id = (0, import_dex_data.toID)(name);
      if (!id) {
        Monitor.warn("Dropping malformed usergroups line (missing ID):");
        Monitor.warn(row);
        continue;
      }
      this.usernames.set(id, name);
      if (sectionid)
        this.sectionLeaders.set(id, sectionid);
      const newSymbol = symbol.charAt(0);
      const preexistingSymbol = super.has(id) ? super.get(id) : null;
      if (preexistingSymbol && Auth.atLeast(preexistingSymbol, newSymbol))
        continue;
      super.set(id, newSymbol);
    }
  }
  set(id, group, username) {
    if (!username)
      username = id;
    const user = Users.get(id, true);
    if (user) {
      user.tempGroup = group;
      user.updateIdentity();
      username = user.name;
      Rooms.global.checkAutojoin(user);
    }
    this.usernames.set(id, username);
    super.set(id, group);
    void this.save();
    return this;
  }
  delete(id) {
    if (!super.has(id))
      return false;
    super.delete(id);
    const user = Users.get(id);
    if (user) {
      user.tempGroup = " ";
    }
    this.usernames.delete(id);
    this.save();
    return true;
  }
  setSection(id, sectionid, username) {
    if (!username)
      username = id;
    const user = Users.get(id);
    if (user) {
      user.updateIdentity();
      username = user.name;
      Rooms.global.checkAutojoin(user);
    }
    if (!super.has(id))
      this.set(id, " ", username);
    this.sectionLeaders.set(id, sectionid);
    void this.save();
    return this;
  }
  deleteSection(id) {
    if (!this.sectionLeaders.has(id))
      return false;
    this.sectionLeaders.delete(id);
    if (super.get(id) === " ") {
      return this.delete(id);
    }
    const user = Users.get(id);
    if (user) {
      user.updateIdentity();
      Rooms.global.checkAutojoin(user);
    }
    this.save();
    return true;
  }
}
//# sourceMappingURL=user-groups.js.map
