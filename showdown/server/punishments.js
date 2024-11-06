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
var punishments_exports = {};
__export(punishments_exports, {
  Punishments: () => Punishments
});
module.exports = __toCommonJS(punishments_exports);
var import_lib = require("../lib");
/**
 * Punishments
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * Handles the punishing of users on PS.
 *
 * There are four types of global punishments on PS. Locks, bans, namelocks and rangelocks.
 * This file contains the lists of users that have been punished (both IPs and usernames),
 * as well as the functions that handle the execution of said punishments.
 *
 * @license MIT license
 */
const PUNISHMENT_FILE = "config/punishments.tsv";
const ROOM_PUNISHMENT_FILE = "config/room-punishments.tsv";
const SHAREDIPS_FILE = "config/sharedips.tsv";
const SHAREDIPS_BLACKLIST_FILE = "config/sharedips-blacklist.tsv";
const WHITELISTED_NAMES_FILE = "config/name-whitelist.tsv";
const RANGELOCK_DURATION = 60 * 60 * 1e3;
const LOCK_DURATION = 48 * 60 * 60 * 1e3;
const GLOBALBAN_DURATION = 7 * 24 * 60 * 60 * 1e3;
const BATTLEBAN_DURATION = 48 * 60 * 60 * 1e3;
const GROUPCHATBAN_DURATION = 7 * 24 * 60 * 60 * 1e3;
const MOBILE_PUNISHMENT_DURATIION = 6 * 60 * 60 * 1e3;
const ROOMBAN_DURATION = 48 * 60 * 60 * 1e3;
const BLACKLIST_DURATION = 365 * 24 * 60 * 60 * 1e3;
const USERID_REGEX = /^[a-z0-9]+$/;
const PUNISH_TRUSTED = false;
const PUNISHMENT_POINT_VALUES = { MUTE: 2, BLACKLIST: 3, ROOMBAN: 4 };
const AUTOLOCK_POINT_THRESHOLD = 8;
const AUTOWEEKLOCK_THRESHOLD = 5;
const AUTOWEEKLOCK_DAYS_TO_SEARCH = 60;
const MAX_PUNISHMENT_TIMER_LENGTH = 24 * 60 * 60 * 1e3;
const GROUPCHAT_PARTICIPANT_OVERLAP_THRESHOLD = 5;
const GROUPCHAT_MONITOR_INTERVAL = 10 * 60 * 1e3;
class PunishmentMap extends Map {
  constructor(roomid) {
    super();
    this.roomid = roomid;
  }
  removeExpiring(punishments) {
    for (const [i, punishment] of punishments.entries()) {
      if (Date.now() > punishment.expireTime) {
        punishments.splice(i, 1);
      }
    }
  }
  get(k) {
    const punishments = super.get(k);
    if (punishments) {
      this.removeExpiring(punishments);
      if (punishments.length)
        return punishments;
      this.delete(k);
    }
    return void 0;
  }
  has(k) {
    return !!this.get(k);
  }
  getByType(k, type) {
    return this.get(k)?.filter((p) => p.type === type)?.[0];
  }
  each(callback) {
    for (const [k, punishments] of super.entries()) {
      this.removeExpiring(punishments);
      if (punishments.length) {
        for (const punishment of punishments) {
          callback(punishment, k, this);
        }
      } else {
        this.delete(k);
      }
    }
  }
  deleteOne(k, punishment) {
    const list = this.get(k);
    if (!list)
      return;
    for (const [i, cur] of list.entries()) {
      if (punishment.type === cur.type && cur.id === punishment.id) {
        list.splice(i, 1);
        break;
      }
    }
    if (!list.length) {
      this.delete(k);
    }
    return true;
  }
  add(k, punishment) {
    let list = this.get(k);
    if (!list) {
      list = [];
      this.set(k, list);
    }
    for (const [i, curPunishment] of list.entries()) {
      if (punishment.type === curPunishment.type) {
        if (punishment.expireTime <= curPunishment.expireTime) {
          curPunishment.reason = punishment.reason;
          return this;
        }
        list.splice(i, 1);
      }
    }
    list.push(punishment);
    return this;
  }
}
class NestedPunishmentMap extends Map {
  nestedSet(k1, k2, value) {
    if (!this.get(k1)) {
      this.set(k1, new PunishmentMap(k1));
    }
    this.get(k1).add(k2, value);
  }
  nestedGet(k1, k2) {
    const subMap = this.get(k1);
    if (!subMap)
      return subMap;
    const punishments = subMap.get(k2);
    if (punishments?.length) {
      return punishments;
    }
    return void 0;
  }
  nestedGetByType(k1, k2, type) {
    return this.nestedGet(k1, k2)?.filter((p) => p.type === type)[0];
  }
  nestedHas(k1, k2) {
    return !!this.nestedGet(k1, k2);
  }
  nestedDelete(k1, k2) {
    const subMap = this.get(k1);
    if (!subMap)
      return;
    subMap.delete(k2);
    if (!subMap.size)
      this.delete(k1);
  }
  nestedEach(callback) {
    for (const [k1, subMap] of this.entries()) {
      for (const [k2, punishments] of subMap.entries()) {
        subMap.removeExpiring(punishments);
        if (punishments.length) {
          for (const punishment of punishments) {
            callback(punishment, k1, k2);
          }
        } else {
          this.nestedDelete(k1, k2);
        }
      }
    }
  }
}
const Punishments = new class {
  constructor() {
    /**
     * ips is an ip:punishment Map
     */
    this.ips = new PunishmentMap();
    /**
     * userids is a userid:punishment Map
     */
    this.userids = new PunishmentMap();
    /**
     * roomUserids is a roomid:userid:punishment nested Map
     */
    this.roomUserids = new NestedPunishmentMap();
    /**
     * roomIps is a roomid:ip:punishment Map
     */
    this.roomIps = new NestedPunishmentMap();
    /**
     * sharedIps is an ip:note Map
     */
    this.sharedIps = /* @__PURE__ */ new Map();
    /**
     * AddressRange:note map. In a separate map so we iterate a massive map a lot less.
     * (AddressRange is a bit of a premature optimization, but it saves us a conversion call on some trafficked spots)
     */
    this.sharedRanges = /* @__PURE__ */ new Map();
    /**
     * sharedIpBlacklist is an ip:note Map
     */
    this.sharedIpBlacklist = /* @__PURE__ */ new Map();
    /**
     * namefilterwhitelist is a whitelistedname:whitelister Map
     */
    this.namefilterwhitelist = /* @__PURE__ */ new Map();
    /**
     * Connection flood table. Separate table from IP bans.
     */
    this.cfloods = /* @__PURE__ */ new Set();
    /**
     * Participants in groupchats whose creators were banned from using groupchats.
     * Object keys are roomids of groupchats; values are Sets of user IDs.
     */
    this.bannedGroupchatParticipants = {};
    /** roomid:timestamp map */
    this.lastGroupchatMonitorTime = {};
    /**
     * Map<userid that has been warned, reason they were warned for>
     */
    this.offlineWarns = /* @__PURE__ */ new Map();
    /**
     * punishType is an allcaps string, for global punishments they can be
     * anything in the punishmentTypes map.
     *
     * This map can be extended with custom punishments by chat plugins.
     *
     * Keys in the map correspond to PunishInfo */
    this.punishmentTypes = new Map([
      ...global.Punishments?.punishmentTypes || [],
      ["LOCK", { desc: "locked" }],
      ["BAN", { desc: "globally banned" }],
      ["NAMELOCK", { desc: "namelocked" }],
      ["GROUPCHATBAN", { desc: "banned from using groupchats" }],
      ["BATTLEBAN", { desc: "banned from battling" }]
    ]);
    /**
     * For room punishments, they can be anything in the roomPunishmentTypes map.
     *
     * This map can be extended with custom punishments by chat plugins.
     *
     * Keys in the map correspond to punishTypes, values signify the way they
     * should be displayed in /alt.
     * By default, this includes:
     * - 'ROOMBAN'
     * - 'BLACKLIST'
     * - 'MUTE' (used by getRoomPunishments)
     *
     */
    this.roomPunishmentTypes = new Map([
      // references to global.Punishments? are here because if you hotpatch punishments without hotpatching chat,
      // old punishment types won't be loaded into here, which might cause issues. This guards against that.
      ...global.Punishments?.roomPunishmentTypes || [],
      ["ROOMBAN", { desc: "banned", activatePunishMonitor: true }],
      ["BLACKLIST", { desc: "blacklisted", activatePunishMonitor: true }],
      ["MUTE", { desc: "muted", activatePunishMonitor: true }]
    ]);
    this.sortedTypes = ["TICKETBAN", "LOCK", "NAMELOCK", "BAN"];
    this.sortedRoomTypes = [...global.Punishments?.sortedRoomTypes || [], "ROOMBAN", "BLACKLIST"];
    this.interactions = {
      NAMELOCK: { overrides: ["LOCK"] }
    };
    this.roomInteractions = {
      BLACKLIST: { overrides: ["ROOMBAN"] }
    };
    this.PunishmentMap = PunishmentMap;
    this.NestedPunishmentMap = NestedPunishmentMap;
    setImmediate(() => {
      void Punishments.loadPunishments();
      void Punishments.loadRoomPunishments();
      void Punishments.loadBanlist();
      void Punishments.loadSharedIps();
      void Punishments.loadSharedIpBlacklist();
      void Punishments.loadWhitelistedNames();
    });
  }
  // punishments.tsv is in the format:
  // punishType, userid, ips/usernames, expiration time, reason
  // room-punishments.tsv is in the format:
  // punishType, roomid:userid, ips/usernames, expiration time, reason
  async loadPunishments() {
    const data = await (0, import_lib.FS)(PUNISHMENT_FILE).readIfExists();
    if (!data)
      return;
    for (const row of data.split("\n")) {
      if (!row || row === "\r")
        continue;
      const [type, id, altKeys, expireTimeStr, ...reason] = row.trim().split("	");
      const expireTime = Number(expireTimeStr);
      if (type === "Punishment")
        continue;
      const keys = altKeys.split(",").concat(id);
      const punishment = { type, id, expireTime, reason: reason.join("	") };
      if (Date.now() >= expireTime) {
        continue;
      }
      for (const key of keys) {
        if (!key.trim())
          continue;
        if (!USERID_REGEX.test(key)) {
          Punishments.ips.add(key, punishment);
        } else {
          Punishments.userids.add(key, punishment);
        }
      }
    }
  }
  async loadRoomPunishments() {
    const data = await (0, import_lib.FS)(ROOM_PUNISHMENT_FILE).readIfExists();
    if (!data)
      return;
    for (const row of data.split("\n")) {
      if (!row || row === "\r")
        continue;
      const [type, id, altKeys, expireTimeStr, ...reason] = row.trim().split("	");
      const expireTime = Number(expireTimeStr);
      if (type === "Punishment")
        continue;
      const [roomid, userid] = id.split(":");
      if (!userid)
        continue;
      const keys = altKeys.split(",").concat(userid);
      const punishment = { type, id: userid, expireTime, reason: reason.join("	") };
      if (Date.now() >= expireTime) {
        continue;
      }
      for (const key of keys) {
        if (!USERID_REGEX.test(key)) {
          Punishments.roomIps.nestedSet(roomid, key, punishment);
        } else {
          Punishments.roomUserids.nestedSet(roomid, key, punishment);
        }
      }
    }
  }
  savePunishments() {
    (0, import_lib.FS)(PUNISHMENT_FILE).writeUpdate(() => {
      const saveTable = Punishments.getPunishments();
      let buf = "Punishment	User ID	IPs and alts	Expires	Reason\r\n";
      for (const [id, entry] of saveTable) {
        buf += Punishments.renderEntry(entry, id);
      }
      return buf;
    }, { throttle: 5e3 });
  }
  saveRoomPunishments() {
    (0, import_lib.FS)(ROOM_PUNISHMENT_FILE).writeUpdate(() => {
      const saveTable = [];
      for (const roomid of Punishments.roomIps.keys()) {
        for (const [userid, punishment] of Punishments.getPunishments(roomid, true)) {
          saveTable.push([`${roomid}:${userid}`, punishment]);
        }
      }
      let buf = "Punishment	Room ID:User ID	IPs and alts	Expires	Reason\r\n";
      for (const [id, entry] of saveTable) {
        buf += Punishments.renderEntry(entry, id);
      }
      return buf;
    }, { throttle: 5e3 });
  }
  getEntry(entryId) {
    let entry = null;
    Punishments.ips.each((punishment, ip) => {
      const { type, id, expireTime, reason, rest } = punishment;
      if (id !== entryId)
        return;
      if (entry) {
        entry.ips.push(ip);
        return;
      }
      entry = {
        userids: [],
        ips: [ip],
        punishType: type,
        expireTime,
        reason,
        rest: rest || []
      };
    });
    Punishments.userids.each((punishment, userid) => {
      const { type, id, expireTime, reason, rest } = punishment;
      if (id !== entryId)
        return;
      if (!entry) {
        entry = {
          userids: [],
          ips: [],
          punishType: type,
          expireTime,
          reason,
          rest: rest || []
        };
      }
      if (userid !== id)
        entry.userids.push(toID(userid));
    });
    return entry;
  }
  appendPunishment(entry, id, filename, allowNonUserIDs) {
    if (!allowNonUserIDs && id.startsWith("#"))
      return;
    const buf = Punishments.renderEntry(entry, id);
    return (0, import_lib.FS)(filename).append(buf);
  }
  renderEntry(entry, id) {
    const keys = entry.ips.concat(entry.userids).join(",");
    const row = [entry.punishType, id, keys, entry.expireTime, entry.reason, ...entry.rest];
    return row.join("	") + "\r\n";
  }
  async loadBanlist() {
    const data = await (0, import_lib.FS)("config/ipbans.txt").readIfExists();
    if (!data)
      return;
    const rangebans = [];
    for (const row of data.split("\n")) {
      const ip = row.split("#")[0].trim();
      if (!ip)
        continue;
      if (ip.includes("/")) {
        rangebans.push(ip);
      } else if (!Punishments.ips.has(ip)) {
        Punishments.ips.add(ip, { type: "LOCK", id: "#ipban", expireTime: Infinity, reason: "" });
      }
    }
    Punishments.checkRangeBanned = IPTools.checker(rangebans);
  }
  /**
   * sharedips.tsv is in the format:
   * IP, type (in this case always SHARED), note
   */
  async loadSharedIps() {
    const data = await (0, import_lib.FS)(SHAREDIPS_FILE).readIfExists();
    if (!data)
      return;
    let needsSave = false;
    for (const row of data.replace("\r", "").split("\n")) {
      if (!row)
        continue;
      const [ip, type, note] = row.trim().split("	");
      if (ip === "IP") {
        continue;
      }
      if (IPTools.ipRegex.test(note)) {
        Punishments.sharedIps.set(note, ip);
        needsSave = true;
        continue;
      }
      if (!IPTools.ipRegex.test(ip)) {
        const pattern = IPTools.stringToRange(ip);
        if (pattern) {
          Punishments.sharedRanges.set(pattern, note);
        } else {
          Monitor.adminlog(`Invalid range data in '${SHAREDIPS_FILE}': "${row}".`);
        }
        continue;
      }
      if (type !== "SHARED")
        continue;
      Punishments.sharedIps.set(ip, note);
    }
    if (needsSave) {
      void Punishments.saveSharedIps();
    }
  }
  appendSharedIp(ip, note) {
    const pattern = IPTools.stringToRange(ip);
    let ipString = ip;
    if (pattern && pattern.minIP !== pattern.maxIP) {
      ipString = IPTools.rangeToString(pattern);
    }
    const buf = `${ipString}	SHARED	${note}\r
`;
    return (0, import_lib.FS)(SHAREDIPS_FILE).append(buf);
  }
  saveSharedIps() {
    let buf = "IP	Type	Note\r\n";
    for (const [ip, note] of Punishments.sharedIps) {
      buf += `${ip}	SHARED	${note}\r
`;
    }
    for (const [range, note] of Punishments.sharedRanges) {
      buf += `${IPTools.rangeToString(range)}	SHARED	${note}\r
`;
    }
    return (0, import_lib.FS)(SHAREDIPS_FILE).write(buf);
  }
  /**
   * sharedips.tsv is in the format:
   * IP, type (in this case always SHARED), note
   */
  async loadSharedIpBlacklist() {
    const data = await (0, import_lib.FS)(SHAREDIPS_BLACKLIST_FILE).readIfExists();
    if (!data)
      return;
    for (const row of data.replace("\r", "").split("\n")) {
      if (!row)
        continue;
      const [ip, reason] = row.trim().split("	");
      if (!IPTools.ipRangeRegex.test(ip))
        continue;
      if (!reason)
        continue;
      Punishments.sharedIpBlacklist.set(ip, reason);
    }
  }
  appendSharedIpBlacklist(ip, reason) {
    const buf = `${ip}	${reason}\r
`;
    return (0, import_lib.FS)(SHAREDIPS_BLACKLIST_FILE).append(buf);
  }
  saveSharedIpBlacklist() {
    let buf = `IP	Reason\r
`;
    Punishments.sharedIpBlacklist.forEach((reason, ip) => {
      buf += `${ip}	${reason}\r
`;
    });
    return (0, import_lib.FS)(SHAREDIPS_BLACKLIST_FILE).write(buf);
  }
  async loadWhitelistedNames() {
    const data = await (0, import_lib.FS)(WHITELISTED_NAMES_FILE).readIfExists();
    if (!data)
      return;
    const lines = data.split("\n");
    lines.shift();
    for (const line of lines) {
      const [userid, whitelister] = line.split("	");
      this.namefilterwhitelist.set(toID(userid), toID(whitelister));
    }
  }
  appendWhitelistedName(name, whitelister) {
    return (0, import_lib.FS)(WHITELISTED_NAMES_FILE).append(`${toID(name)}	${toID(whitelister)}\r
`);
  }
  saveNameWhitelist() {
    let buf = `Userid	Whitelister	\r
`;
    Punishments.namefilterwhitelist.forEach((userid, whitelister) => {
      buf += `${userid}	${whitelister}\r
`;
    });
    return (0, import_lib.FS)(WHITELISTED_NAMES_FILE).write(buf);
  }
  /*********************************************************
   * Adding and removing
   *********************************************************/
  async punish(user, punishment, ignoreAlts, bypassPunishmentfilter = false) {
    user = Users.get(user) || user;
    if (typeof user === "string") {
      return Punishments.punishName(user, punishment);
    }
    Punishments.checkInteractions(user.getLastId(), punishment);
    if (!punishment.id)
      punishment.id = user.getLastId();
    const userids = /* @__PURE__ */ new Set();
    const ips = /* @__PURE__ */ new Set();
    const mobileIps = /* @__PURE__ */ new Set();
    const affected = ignoreAlts ? [user] : user.getAltUsers(PUNISH_TRUSTED, true);
    for (const alt of affected) {
      await this.punishInner(alt, punishment, userids, ips, mobileIps);
    }
    const { type, id, expireTime, reason, rest } = punishment;
    userids.delete(id);
    void Punishments.appendPunishment({
      userids: [...userids],
      ips: [...ips],
      punishType: type,
      expireTime,
      reason,
      rest: rest || []
    }, id, PUNISHMENT_FILE);
    if (mobileIps.size) {
      const mobileExpireTime = Date.now() + MOBILE_PUNISHMENT_DURATIION;
      const mobilePunishment = { type, id, expireTime: mobileExpireTime, reason, rest };
      for (const mobileIp of mobileIps) {
        Punishments.ips.add(mobileIp, mobilePunishment);
      }
    }
    if (!bypassPunishmentfilter)
      Chat.punishmentfilter(user, punishment);
    return affected;
  }
  async punishInner(user, punishment, userids, ips, mobileIps) {
    const existingPunishment = Punishments.userids.getByType(user.locked || toID(user.name), punishment.type);
    if (existingPunishment) {
      if (existingPunishment.expireTime > punishment.expireTime) {
        punishment.expireTime = existingPunishment.expireTime;
      }
      const types = ["LOCK", "NAMELOCK", "BAN"];
      if (types.indexOf(existingPunishment.type) > types.indexOf(punishment.type)) {
        punishment.type = existingPunishment.type;
      }
    }
    for (const ip of user.ips) {
      const { hostType } = await IPTools.lookup(ip);
      if (hostType !== "mobile") {
        Punishments.ips.add(ip, punishment);
        ips.add(ip);
      } else {
        mobileIps.add(ip);
      }
    }
    const lastUserId = user.getLastId();
    if (!lastUserId.startsWith("guest")) {
      Punishments.userids.add(lastUserId, punishment);
    }
    if (user.locked && !user.locked.startsWith("#")) {
      Punishments.userids.add(user.locked, punishment);
      userids.add(user.locked);
    }
    if (user.autoconfirmed) {
      Punishments.userids.add(user.autoconfirmed, punishment);
      userids.add(user.autoconfirmed);
    }
    if (user.trusted) {
      Punishments.userids.add(user.trusted, punishment);
      userids.add(user.trusted);
    }
  }
  punishName(userid, punishment) {
    if (!punishment.id)
      punishment.id = userid;
    const foundKeys = Punishments.search(userid).map(([key]) => key);
    const userids = /* @__PURE__ */ new Set([userid]);
    const ips = /* @__PURE__ */ new Set();
    Punishments.checkInteractions(userid, punishment);
    for (const key of foundKeys) {
      if (key.includes(".")) {
        ips.add(key);
      } else {
        userids.add(key);
      }
    }
    for (const id2 of userids) {
      Punishments.userids.add(id2, punishment);
    }
    for (const ip of ips) {
      Punishments.ips.add(ip, punishment);
    }
    const { type, id, expireTime, reason, rest } = punishment;
    const affected = Users.findUsers([...userids], [...ips], { includeTrusted: PUNISH_TRUSTED, forPunishment: true });
    userids.delete(id);
    void Punishments.appendPunishment({
      userids: [...userids],
      ips: [...ips],
      punishType: type,
      expireTime,
      reason,
      rest: rest || []
    }, id, PUNISHMENT_FILE);
    Chat.punishmentfilter(userid, punishment);
    return affected;
  }
  unpunish(id, punishType) {
    id = toID(id);
    const punishment = Punishments.userids.getByType(id, punishType);
    if (punishment) {
      id = punishment.id;
    }
    let success = false;
    Punishments.ips.each((cur, key) => {
      const { type: curPunishmentType, id: curId } = cur;
      if (curId === id && curPunishmentType === punishType) {
        Punishments.ips.deleteOne(key, cur);
        success = id;
      }
    });
    Punishments.userids.each((cur, key) => {
      const { type: curPunishmentType, id: curId } = cur;
      if (curId === id && curPunishmentType === punishType) {
        Punishments.userids.deleteOne(key, cur);
        success = id;
      }
    });
    if (success) {
      Punishments.savePunishments();
    }
    return success;
  }
  roomPunish(room, user, punishment) {
    if (typeof user === "string") {
      return Punishments.roomPunishName(room, user, punishment);
    }
    if (!punishment.id)
      punishment.id = user.getLastId();
    Punishments.checkInteractions(punishment.id, punishment, toID(room));
    const roomid = typeof room !== "string" ? room.roomid : room;
    const userids = /* @__PURE__ */ new Set();
    const ips = /* @__PURE__ */ new Set();
    const affected = user.getAltUsers(PUNISH_TRUSTED, true);
    for (const curUser of affected) {
      this.roomPunishInner(roomid, curUser, punishment, userids, ips);
    }
    const { type, id, expireTime, reason, rest } = punishment;
    userids.delete(id);
    void Punishments.appendPunishment({
      userids: [...userids],
      ips: [...ips],
      punishType: type,
      expireTime,
      reason,
      rest: rest || []
    }, roomid + ":" + id, ROOM_PUNISHMENT_FILE);
    if (typeof room !== "string") {
      room = room;
      if (!(room.settings.isPrivate === true || room.settings.isPersonal)) {
        void Punishments.monitorRoomPunishments(user);
      }
    }
    return affected;
  }
  roomPunishInner(roomid, user, punishment, userids, ips) {
    for (const ip of user.ips) {
      Punishments.roomIps.nestedSet(roomid, ip, punishment);
      ips.add(ip);
    }
    if (!user.id.startsWith("guest")) {
      Punishments.roomUserids.nestedSet(roomid, user.id, punishment);
    }
    if (user.autoconfirmed) {
      Punishments.roomUserids.nestedSet(roomid, user.autoconfirmed, punishment);
      userids.add(user.autoconfirmed);
    }
    if (user.trusted) {
      Punishments.roomUserids.nestedSet(roomid, user.trusted, punishment);
      userids.add(user.trusted);
    }
  }
  checkInteractions(userid, punishment, room) {
    const punishments = Punishments.search(userid);
    const results = [];
    const info = Punishments[room ? "roomInteractions" : "interactions"][punishment.type];
    if (!info)
      return;
    for (const [k, curRoom, curPunishment] of punishments) {
      if (k !== userid || room && curRoom !== room)
        continue;
      if (info.overrides.includes(curPunishment.type)) {
        results.push(curPunishment);
        if (room) {
          Punishments.roomUnpunish(room, userid, curPunishment.type);
        } else {
          Punishments.unpunish(userid, curPunishment.type);
        }
      }
    }
    return results;
  }
  roomPunishName(room, userid, punishment) {
    if (!punishment.id)
      punishment.id = userid;
    const roomid = typeof room !== "string" ? room.roomid : room;
    const foundKeys = Punishments.search(userid).map(([key]) => key);
    Punishments.checkInteractions(userid, punishment, roomid);
    const userids = /* @__PURE__ */ new Set([userid]);
    const ips = /* @__PURE__ */ new Set();
    for (const key of foundKeys) {
      if (key.includes(".")) {
        ips.add(key);
      } else {
        userids.add(key);
      }
    }
    for (const id2 of userids) {
      Punishments.roomUserids.nestedSet(roomid, id2, punishment);
    }
    for (const ip of ips) {
      Punishments.roomIps.nestedSet(roomid, ip, punishment);
    }
    const { type, id, expireTime, reason, rest } = punishment;
    const affected = Users.findUsers([...userids], [...ips], { includeTrusted: PUNISH_TRUSTED, forPunishment: true });
    userids.delete(id);
    void Punishments.appendPunishment({
      userids: [...userids],
      ips: [...ips],
      punishType: type,
      expireTime,
      reason,
      rest: rest || []
    }, roomid + ":" + id, ROOM_PUNISHMENT_FILE);
    if (typeof room !== "string") {
      room = room;
      if (!(room.settings.isPrivate === true || room.settings.isPersonal)) {
        void Punishments.monitorRoomPunishments(userid);
      }
    }
    return affected;
  }
  /**
   * @param ignoreWrite skip persistent storage
   */
  roomUnpunish(room, id, punishType, ignoreWrite = false) {
    const roomid = typeof room !== "string" ? room.roomid : room;
    id = toID(id);
    const punishment = Punishments.roomUserids.nestedGetByType(roomid, id, punishType);
    if (punishment) {
      id = punishment.id;
    }
    let success;
    const ipSubMap = Punishments.roomIps.get(roomid);
    if (ipSubMap) {
      for (const [key, punishmentList] of ipSubMap) {
        for (const [i, cur] of punishmentList.entries()) {
          if (cur.id === id && cur.type === punishType) {
            punishmentList.splice(i, 1);
            success = id;
          }
        }
        if (!punishmentList.length) {
          ipSubMap.delete(key);
        }
      }
    }
    const useridSubMap = Punishments.roomUserids.get(roomid);
    if (useridSubMap) {
      for (const [key, punishmentList] of useridSubMap) {
        for (const [i, cur] of punishmentList.entries()) {
          if (cur.id === id && cur.type === punishType) {
            punishmentList.splice(i, 1);
            success = id;
          }
          if (!punishmentList.length) {
            useridSubMap.delete(key);
          }
        }
      }
    }
    if (success && !ignoreWrite) {
      Punishments.saveRoomPunishments();
    }
    return success;
  }
  addRoomPunishmentType(opts, desc, callback) {
    if (typeof opts === "string") {
      if (!desc)
        throw new Error("Desc argument must be provided if type is string");
      opts = { onActivate: callback, desc, type: opts };
    }
    this.roomPunishmentTypes.set(opts.type, opts);
    if (!this.sortedRoomTypes.includes(opts.type))
      this.sortedRoomTypes.unshift(opts.type);
  }
  addPunishmentType(opts, desc, callback) {
    if (typeof opts === "string") {
      if (!desc)
        throw new Error("Desc argument must be provided if type is string");
      opts = { onActivate: callback, desc, type: opts };
    }
    this.punishmentTypes.set(opts.type, opts);
    if (!this.sortedTypes.includes(opts.type))
      this.sortedTypes.unshift(opts.type);
  }
  /*********************************************************
   * Specific punishments
   *********************************************************/
  async ban(user, expireTime, id, ignoreAlts, ...reason) {
    if (!expireTime)
      expireTime = Date.now() + GLOBALBAN_DURATION;
    const punishment = { type: "BAN", id, expireTime, reason: reason.join(" ") };
    const affected = await Punishments.punish(user, punishment, ignoreAlts);
    for (const curUser of affected) {
      curUser.locked = punishment.id;
      curUser.disconnectAll();
    }
    return affected;
  }
  unban(name) {
    return Punishments.unpunish(name, "BAN");
  }
  async lock(user, expireTime, id, ignoreAlts, reason, bypassPunishmentfilter = false, rest) {
    if (!expireTime)
      expireTime = Date.now() + LOCK_DURATION;
    const punishment = { type: "LOCK", id, expireTime, reason, rest };
    const userObject = Users.get(user);
    if (userObject)
      userObject.locked = punishment.id;
    const affected = await Punishments.punish(user, punishment, ignoreAlts, bypassPunishmentfilter);
    for (const curUser of affected) {
      Punishments.checkPunishmentTime(curUser, punishment);
      curUser.locked = punishment.id;
      curUser.updateIdentity();
    }
    return affected;
  }
  async autolock(user, room, source, reason, message, week = false, namelock) {
    if (!message)
      message = reason;
    let punishment = `LOCK`;
    let expires = null;
    if (week) {
      expires = Date.now() + 7 * 24 * 60 * 60 * 1e3;
      punishment = `WEEKLOCK`;
    }
    const userid = toID(user);
    if (Users.get(user)?.locked)
      return false;
    const name = typeof user === "string" ? user : user.name;
    if (namelock) {
      punishment = `NAME${punishment}`;
      await Punishments.namelock(user, expires, toID(namelock), false, `Autonamelock: ${name}: ${reason}`);
    } else {
      await Punishments.lock(user, expires, userid, false, `Autolock: ${name}: ${reason}`);
    }
    Monitor.log(`[${source}] ${punishment}ED: ${message}`);
    const logEntry = {
      action: `AUTO${punishment}`,
      visualRoomID: typeof room !== "string" ? room.roomid : room,
      ip: typeof user !== "string" ? user.latestIp : null,
      userid,
      note: reason,
      isGlobal: true
    };
    if (typeof user !== "string")
      logEntry.ip = user.latestIp;
    const roomObject = Rooms.get(room);
    const userObject = Users.get(user);
    if (roomObject) {
      roomObject.modlog(logEntry);
    } else {
      Rooms.global.modlog(logEntry);
    }
    if (roomObject?.battle && userObject && userObject.connections[0]) {
      Chat.parse("/savereplay forpunishment", roomObject, userObject, userObject.connections[0]);
    }
    const roomauth = Rooms.global.destroyPersonalRooms(userid);
    if (roomauth.length) {
      Monitor.log(`[CrisisMonitor] Autolocked user ${name} has public roomauth (${roomauth.join(", ")}), and should probably be demoted.`);
    }
  }
  unlock(name) {
    const user = Users.get(name);
    let id = toID(name);
    const success = [];
    if (user?.locked && !user.namelocked) {
      id = user.locked;
      user.locked = null;
      user.namelocked = null;
      user.destroyPunishmentTimer();
      user.updateIdentity();
      success.push(user.getLastName());
    }
    if (!id.startsWith("#")) {
      for (const curUser of Users.users.values()) {
        if (curUser.locked === id) {
          curUser.locked = null;
          curUser.namelocked = null;
          curUser.destroyPunishmentTimer();
          curUser.updateIdentity();
          success.push(curUser.getLastName());
        }
      }
    }
    if (["LOCK", "YEARLOCK"].some((type) => Punishments.unpunish(name, type))) {
      if (!success.length)
        success.push(name);
    }
    if (!success.length)
      return void 0;
    if (!success.some((v) => toID(v) === id)) {
      success.push(id);
    }
    return success;
  }
  /**
   * Sets the punishment timer for a user,
   * to either MAX_PUNISHMENT_TIMER_LENGTH or the amount of time left on the punishment.
   * It also expires a punishment if the time is up.
   */
  checkPunishmentTime(user, punishment) {
    if (user.punishmentTimer) {
      clearTimeout(user.punishmentTimer);
      user.punishmentTimer = null;
    }
    if (user.locked && user.locked.startsWith("#"))
      return;
    const { id, expireTime } = punishment;
    const timeLeft = expireTime - Date.now();
    if (timeLeft <= 1) {
      if (user.locked === id)
        Punishments.unlock(user.id);
      return;
    }
    const waitTime = Math.min(timeLeft, MAX_PUNISHMENT_TIMER_LENGTH);
    user.punishmentTimer = setTimeout(() => {
      global.Punishments.checkPunishmentTime(user, punishment);
    }, waitTime);
  }
  async namelock(user, expireTime, id, ignoreAlts, ...reason) {
    if (!expireTime)
      expireTime = Date.now() + LOCK_DURATION;
    const punishment = { type: "NAMELOCK", id, expireTime, reason: reason.join(" ") };
    const affected = await Punishments.punish(user, punishment, ignoreAlts);
    for (const curUser of affected) {
      Punishments.checkPunishmentTime(curUser, punishment);
      curUser.locked = punishment.id;
      curUser.namelocked = punishment.id;
      curUser.resetName(true);
      curUser.updateIdentity();
    }
    return affected;
  }
  unnamelock(name) {
    const user = Users.get(name);
    let id = toID(name);
    const success = [];
    if (user?.namelocked)
      name = user.namelocked;
    const unpunished = Punishments.unpunish(name, "NAMELOCK");
    if (user?.locked) {
      id = user.locked;
      user.locked = null;
      user.namelocked = null;
      user.destroyPunishmentTimer();
      user.resetName();
      success.push(user.getLastName());
    }
    if (!id.startsWith("#")) {
      for (const curUser of Users.users.values()) {
        if (curUser.locked === id) {
          curUser.locked = null;
          curUser.namelocked = null;
          curUser.destroyPunishmentTimer();
          curUser.resetName();
          success.push(curUser.getLastName());
        }
      }
    }
    if (unpunished && !success.length)
      success.push(name);
    if (!success.length)
      return false;
    if (!success.some((v) => toID(v) === id)) {
      success.push(id);
    }
    return success;
  }
  battleban(user, expireTime, id, ...reason) {
    if (!expireTime)
      expireTime = Date.now() + BATTLEBAN_DURATION;
    const punishment = { type: "BATTLEBAN", id, expireTime, reason: reason.join(" ") };
    for (const games of user.games.keys()) {
      const game = Rooms.get(games).getGame(Tournaments.Tournament);
      if (!game)
        continue;
      if (game.isTournamentStarted) {
        game.disqualifyUser(user.id, null, null);
      } else if (!game.isTournamentStarted) {
        game.removeUser(user.id);
      }
    }
    return Punishments.punish(user, punishment, false);
  }
  unbattleban(userid) {
    const user = Users.get(userid);
    if (user) {
      const punishment = Punishments.isBattleBanned(user);
      if (punishment)
        userid = punishment.id;
    }
    return Punishments.unpunish(userid, "BATTLEBAN");
  }
  isBattleBanned(user) {
    if (!user)
      throw new Error(`Trying to check if a non-existent user is battlebanned.`);
    let punishment = Punishments.userids.getByType(user.id, "BATTLEBAN");
    if (punishment)
      return punishment;
    if (user.autoconfirmed) {
      punishment = Punishments.userids.getByType(user.autoconfirmed, "BATTLEBAN");
      if (punishment)
        return punishment;
    }
    for (const ip of user.ips) {
      punishment = Punishments.ips.getByType(ip, "BATTLEBAN");
      if (punishment) {
        if (Punishments.isSharedIp(ip) && user.autoconfirmed)
          return;
        return punishment;
      }
    }
  }
  /**
   * Bans a user from using groupchats. Returns an array of roomids of the groupchat they created, if any.
   * We don't necessarily want to delete these, since we still need to warn the participants,
   * and make a modnote of the participant names, which doesn't seem appropriate for a Punishments method.
   */
  async groupchatBan(user, expireTime, id, reason) {
    if (!expireTime)
      expireTime = Date.now() + GROUPCHATBAN_DURATION;
    const punishment = { type: "GROUPCHATBAN", id, expireTime, reason };
    const groupchatsCreated = [];
    const targetUser = Users.get(user);
    if (targetUser) {
      for (const roomid of targetUser.inRooms || []) {
        const targetRoom = Rooms.get(roomid);
        if (!targetRoom?.roomid.startsWith("groupchat-"))
          continue;
        targetRoom.game?.removeBannedUser?.(targetUser);
        targetUser.leaveRoom(targetRoom.roomid);
        if (targetRoom.auth.get(targetUser) === Users.HOST_SYMBOL) {
          groupchatsCreated.push(targetRoom.roomid);
          Punishments.bannedGroupchatParticipants[targetRoom.roomid] = new Set(
            // Room#users is a UserTable where the keys are IDs,
            // but typed as strings so that they can be used as object keys.
            Object.keys(targetRoom.users).filter((u) => !targetRoom.users[u].can("lock"))
          );
        }
      }
    }
    await Punishments.punish(user, punishment, false);
    return groupchatsCreated;
  }
  groupchatUnban(user) {
    let userid = typeof user === "object" ? user.id : user;
    const punishment = Punishments.isGroupchatBanned(user);
    if (punishment)
      userid = punishment.id;
    return Punishments.unpunish(userid, "GROUPCHATBAN");
  }
  isGroupchatBanned(user) {
    const userid = toID(user);
    const targetUser = Users.get(user);
    let punishment = Punishments.userids.getByType(userid, "GROUPCHATBAN");
    if (punishment)
      return punishment;
    if (targetUser?.autoconfirmed) {
      punishment = Punishments.userids.getByType(targetUser.autoconfirmed, "GROUPCHATBAN");
      if (punishment)
        return punishment;
    }
    if (targetUser && !targetUser.trusted) {
      for (const ip of targetUser.ips) {
        punishment = Punishments.ips.getByType(ip, "GROUPCHATBAN");
        if (punishment) {
          if (Punishments.isSharedIp(ip) && targetUser.autoconfirmed)
            return;
          return punishment;
        }
      }
    }
  }
  isTicketBanned(user) {
    const ips = [];
    if (typeof user === "object") {
      ips.push(...user.ips);
      ips.unshift(user.latestIp);
      user = user.id;
    }
    const punishment = Punishments.userids.getByType(user, "TICKETBAN");
    if (punishment)
      return punishment;
    if (ips.some((ip) => Punishments.isSharedIp(ip)))
      return false;
    for (const ip of ips) {
      const curPunishment = Punishments.ips.getByType(ip, "TICKETBAN");
      if (curPunishment)
        return curPunishment;
    }
    return false;
  }
  /**
   * Monitors a groupchat, watching in case too many users who had participated in
   * a groupchat that was deleted because its owner was groupchatbanned join.
   */
  monitorGroupchatJoin(room, newUser) {
    if (Punishments.lastGroupchatMonitorTime[room.roomid] > Date.now() - GROUPCHAT_MONITOR_INTERVAL)
      return;
    const newUserID = toID(newUser);
    for (const [roomid, participants] of Object.entries(Punishments.bannedGroupchatParticipants)) {
      if (!participants.has(newUserID))
        continue;
      let overlap = 0;
      for (const participant of participants) {
        if (participant in room.users || room.auth.has(participant))
          overlap++;
      }
      if (overlap > GROUPCHAT_PARTICIPANT_OVERLAP_THRESHOLD) {
        let html = `|html|[GroupchatMonitor] The groupchat \xAB<a href="/${room.roomid}">${room.roomid}</a>\xBB `;
        if (Config.modloglink)
          html += `(<a href="${Config.modloglink(new Date(), room.roomid)}">logs</a>) `;
        html += `includes ${overlap} participants from forcibly deleted groupchat \xAB<a href="/${roomid}">${roomid}</a>\xBB`;
        if (Config.modloglink)
          html += ` (<a href="${Config.modloglink(new Date(), roomid)}">logs</a>)`;
        html += `.`;
        Rooms.global.notifyRooms(["staff"], html);
        Punishments.lastGroupchatMonitorTime[room.roomid] = Date.now();
      }
    }
  }
  punishRange(range, reason, expireTime, punishType) {
    if (!expireTime)
      expireTime = Date.now() + RANGELOCK_DURATION;
    if (!punishType)
      punishType = "LOCK";
    const punishment = { type: punishType, id: "#rangelock", expireTime, reason };
    Punishments.ips.add(range, punishment);
    const ips = [];
    const parsedRange = IPTools.stringToRange(range);
    if (!parsedRange)
      throw new Error(`Invalid IP range: ${range}`);
    const { minIP, maxIP } = parsedRange;
    for (let ipNumber = minIP; ipNumber <= maxIP; ipNumber++) {
      ips.push(IPTools.numberToIP(ipNumber));
    }
    void Punishments.appendPunishment({
      userids: [],
      ips,
      punishType,
      expireTime,
      reason,
      rest: []
    }, "#rangelock", PUNISHMENT_FILE, true);
  }
  banRange(range, reason, expireTime) {
    if (!expireTime)
      expireTime = Date.now() + RANGELOCK_DURATION;
    const punishment = { type: "BAN", id: "#rangelock", expireTime, reason };
    Punishments.ips.add(range, punishment);
  }
  roomBan(room, user, expireTime, id, ...reason) {
    if (!expireTime)
      expireTime = Date.now() + ROOMBAN_DURATION;
    const punishment = { type: "ROOMBAN", id, expireTime, reason: reason.join(" ") };
    const affected = Punishments.roomPunish(room, user, punishment);
    for (const curUser of affected) {
      room.game?.removeBannedUser?.(curUser);
      curUser.leaveRoom(room.roomid);
    }
    if (room.subRooms) {
      for (const subRoom of room.subRooms.values()) {
        for (const curUser of affected) {
          subRoom.game?.removeBannedUser?.(curUser);
          curUser.leaveRoom(subRoom.roomid);
        }
      }
    }
    return affected;
  }
  roomBlacklist(room, user, expireTime, id, ...reason) {
    if (!expireTime)
      expireTime = Date.now() + BLACKLIST_DURATION;
    const punishment = { type: "BLACKLIST", id, expireTime, reason: reason.join(" ") };
    const affected = Punishments.roomPunish(room, user, punishment);
    for (const curUser of affected) {
      Punishments.roomUnban(room, curUser.id || curUser);
      room.game?.removeBannedUser?.(curUser);
      curUser.leaveRoom(room.roomid);
    }
    if (room.subRooms) {
      for (const subRoom of room.subRooms.values()) {
        for (const curUser of affected) {
          subRoom.game?.removeBannedUser?.(curUser);
          curUser.leaveRoom(subRoom.roomid);
        }
      }
    }
    return affected;
  }
  roomUnban(room, userid) {
    const user = Users.get(userid);
    if (user) {
      const punishment = Punishments.isRoomBanned(user, room.roomid);
      if (punishment)
        userid = punishment.id;
    }
    return Punishments.roomUnpunish(room, userid, "ROOMBAN");
  }
  /**
   * @param ignoreWrite Flag to skip persistent storage.
   */
  roomUnblacklist(room, userid, ignoreWrite) {
    const user = Users.get(userid);
    if (user) {
      const punishment = Punishments.isRoomBanned(user, room.roomid);
      if (punishment)
        userid = punishment.id;
    }
    return Punishments.roomUnpunish(room, userid, "BLACKLIST", ignoreWrite);
  }
  roomUnblacklistAll(room) {
    const roombans = Punishments.roomUserids.get(room.roomid);
    if (!roombans)
      return false;
    const unblacklisted = [];
    roombans.each(({ type }, userid) => {
      if (type === "BLACKLIST") {
        Punishments.roomUnblacklist(room, userid, true);
        unblacklisted.push(userid);
      }
    });
    if (unblacklisted.length === 0)
      return false;
    Punishments.saveRoomPunishments();
    return unblacklisted;
  }
  addSharedIp(ip, note) {
    const pattern = IPTools.stringToRange(ip);
    const isRange = pattern && pattern.minIP !== pattern.maxIP;
    if (isRange) {
      Punishments.sharedRanges.set(pattern, note);
    } else {
      Punishments.sharedIps.set(ip, note);
    }
    void Punishments.appendSharedIp(ip, note);
    for (const user of Users.users.values()) {
      const sharedIp = user.ips.some(
        (curIP) => isRange ? IPTools.checkPattern([pattern], IPTools.ipToNumber(curIP)) : curIP === ip
      );
      if (user.locked && user.locked !== user.id && sharedIp) {
        if (!user.autoconfirmed) {
          user.semilocked = `#sharedip ${user.locked}`;
        }
        user.locked = null;
        user.namelocked = null;
        user.destroyPunishmentTimer();
        user.updateIdentity();
      }
    }
  }
  isSharedIp(ip) {
    if (this.sharedIps.has(ip))
      return true;
    const num = IPTools.ipToNumber(ip);
    for (const range of this.sharedRanges.keys()) {
      if (IPTools.checkPattern([range], num)) {
        return true;
      }
    }
    return false;
  }
  removeSharedIp(ip) {
    const pattern = IPTools.stringToRange(ip);
    if (pattern && pattern.minIP !== pattern.maxIP) {
      const isMatch = (range) => range.minIP === pattern.minIP && range.maxIP === pattern.maxIP;
      Punishments.sharedRanges = new Map([...Punishments.sharedRanges].filter(([range]) => !isMatch(range)));
    } else {
      Punishments.sharedIps.delete(ip);
    }
    void Punishments.saveSharedIps();
  }
  addBlacklistedSharedIp(ip, reason) {
    void Punishments.appendSharedIpBlacklist(ip, reason);
    Punishments.sharedIpBlacklist.set(ip, reason);
  }
  removeBlacklistedSharedIp(ip) {
    Punishments.sharedIpBlacklist.delete(ip);
    void Punishments.saveSharedIpBlacklist();
  }
  whitelistName(name, whitelister) {
    if (this.namefilterwhitelist.has(name))
      return false;
    name = toID(name);
    whitelister = toID(whitelister);
    this.namefilterwhitelist.set(name, whitelister);
    void this.appendWhitelistedName(name, whitelister);
    return true;
  }
  unwhitelistName(name) {
    name = toID(name);
    if (!this.namefilterwhitelist.has(name))
      return false;
    this.namefilterwhitelist.delete(name);
    void this.saveNameWhitelist();
    return true;
  }
  /*********************************************************
   * Checking
   *********************************************************/
  /**
   * Returns an array of [key, roomid, punishment] pairs.
   *
   * @param searchId userid or IP
   */
  search(searchId) {
    const results = [];
    Punishments.ips.each((punishment, ip) => {
      const { id } = punishment;
      if (searchId === id || searchId === ip) {
        results.push([ip, "", punishment]);
      }
    });
    Punishments.userids.each((punishment, userid) => {
      const { id } = punishment;
      if (searchId === id || searchId === userid) {
        results.push([userid, "", punishment]);
      }
    });
    Punishments.roomIps.nestedEach((punishment, roomid, ip) => {
      const { id: punishUserid } = punishment;
      if (searchId === punishUserid || searchId === ip) {
        results.push([ip, roomid, punishment]);
      }
    });
    Punishments.roomUserids.nestedEach((punishment, roomid, userid) => {
      const { id: punishUserid } = punishment;
      if (searchId === punishUserid || searchId === userid) {
        results.push([userid, roomid, punishment]);
      }
    });
    return results;
  }
  getPunishType(name) {
    let punishment = Punishments.userids.get(toID(name));
    if (punishment)
      return punishment[0].type;
    const user = Users.get(name);
    if (!user)
      return;
    punishment = Punishments.ipSearch(user.latestIp);
    if (punishment)
      return punishment[0].type;
    return "";
  }
  hasPunishType(name, types, ip) {
    if (typeof types === "string")
      types = [types];
    const byName = Punishments.userids.get(name)?.some((p) => types.includes(p.type));
    if (!ip)
      return byName;
    return byName || Punishments.ipSearch(ip)?.some((p) => types.includes(p.type));
  }
  hasRoomPunishType(room, name, types) {
    if (typeof types === "string")
      types = [types];
    if (typeof room.roomid === "string")
      room = room.roomid;
    return Punishments.roomUserids.nestedGet(room, name)?.some((p) => types.includes(p.type));
  }
  byWeight(punishments, room = false) {
    if (!punishments)
      return [];
    return import_lib.Utils.sortBy(
      punishments,
      (p) => -(room ? this.sortedRoomTypes : this.sortedTypes).indexOf(p.type)
    );
  }
  ipSearch(ip, type) {
    const allPunishments = [];
    let punishment = Punishments.ips.get(ip);
    if (punishment) {
      if (type)
        return punishment.find((p) => p.type === type);
      allPunishments.push(...punishment);
    }
    let dotIndex = ip.lastIndexOf(".");
    for (let i = 0; i < 4 && dotIndex > 0; i++) {
      ip = ip.substr(0, dotIndex);
      punishment = Punishments.ips.get(ip + ".*");
      if (punishment) {
        if (type)
          return punishment.find((p) => p.type === type);
        allPunishments.push(...punishment);
      }
      dotIndex = ip.lastIndexOf(".");
    }
    return allPunishments.length ? allPunishments : void 0;
  }
  /** Defined in Punishments.loadBanlist */
  checkRangeBanned(ip) {
    return false;
  }
  checkName(user, userid, registered) {
    if (userid.startsWith("guest"))
      return;
    for (const roomid of user.inRooms) {
      Punishments.checkNewNameInRoom(user, userid, roomid);
    }
    let punishments = [];
    const idPunishments = Punishments.userids.get(userid);
    if (idPunishments) {
      punishments = idPunishments;
    }
    const battleban = Punishments.isBattleBanned(user);
    if (battleban)
      punishments.push(battleban);
    if (user.namelocked) {
      let punishment = Punishments.userids.get(user.namelocked)?.[0];
      if (!punishment)
        punishment = { type: "NAMELOCK", id: user.namelocked, expireTime: 0, reason: "" };
      punishments.push(punishment);
    }
    if (user.locked) {
      let punishment = Punishments.userids.get(user.locked)?.[0];
      if (!punishment)
        punishment = { type: "LOCK", id: user.locked, expireTime: 0, reason: "" };
      punishments.push(punishment);
    }
    const ticket = Chat.pages?.help ? `<a href="view-help-request--appeal"><button class="button"><strong>Appeal your punishment</strong></button></a>` : "";
    if (!punishments.length)
      return;
    Punishments.byWeight(punishments);
    for (const punishment of punishments) {
      const id = punishment.type;
      const punishmentInfo = this.punishmentTypes.get(id);
      const punishUserid = punishment.id;
      const reason = punishment.reason ? import_lib.Utils.html`\n\nReason: ${punishment.reason}` : "";
      let appeal = ``;
      if (user.permalocked && Config.appealurl) {
        appeal += `

Permanent punishments can be appealed: <a href="${Config.appealurl}">${Config.appealurl}</a>`;
      } else if (ticket) {
        appeal += `

If you feel you were unfairly punished or wish to otherwise appeal, you can ${ticket}.`;
      } else if (Config.appealurl) {
        appeal += `

If you wish to appeal your punishment, please use: <a href="${Config.appealurl}">${Config.appealurl}</a>`;
      }
      const bannedUnder = punishUserid !== userid ? ` because you have the same IP as banned user: ${punishUserid}` : "";
      if (id === "BATTLEBAN") {
        if (punishUserid !== user.id && Punishments.isSharedIp(user.latestIp) && user.autoconfirmed) {
          Punishments.unpunish(userid, "BATTLEBAN");
        } else {
          void Punishments.punish(user, punishment, false);
          user.cancelReady();
          if (!Punishments.userids.getByType(userid, "BATTLEBAN")) {
            const appealLink = ticket || (Config.appealurl ? `appeal at: ${Config.appealurl}` : ``);
            user.send(
              `|popup||html|You are banned from battling${punishment.id !== userid ? ` because you have the same IP as banned user: ${punishUserid}` : ""}. Your battle ban will expire in a few days.${punishment.reason ? import_lib.Utils.html`\n\nReason: ${punishment.reason}` : ``}${appealLink ? `

Or you can ${appealLink}.` : ``}`
            );
            user.notified.punishment = true;
            continue;
          }
        }
      }
      if ((id === "LOCK" || id === "NAMELOCK") && punishUserid !== userid && Punishments.isSharedIp(user.latestIp)) {
        if (!user.autoconfirmed) {
          user.semilocked = `#sharedip ${user.locked}`;
        }
        user.locked = null;
        user.namelocked = null;
        user.destroyPunishmentTimer();
        user.updateIdentity();
        return;
      }
      if (id === "BAN") {
        const appealUrl = Config.banappealurl || Config.appealurl;
        user.popup(
          `Your username (${user.name}) is banned${bannedUnder}. Your ban will expire in a few days.${reason}${appealUrl ? `||||Or you can appeal at: ${appealUrl}` : ``}`
        );
        user.notified.punishment = true;
        if (registered)
          void Punishments.punish(user, punishment, false);
        user.disconnectAll();
        return;
      }
      if (id === "NAMELOCK" || user.namelocked) {
        user.send(`|popup||html|You are namelocked and can't have a username${bannedUnder}. Your namelock will expire in a few days.${reason}${appeal}`);
        user.locked = punishUserid;
        user.namelocked = punishUserid;
        user.resetName();
        user.updateIdentity();
      } else if (id === "LOCK") {
        if (punishUserid === "#hostfilter" || punishUserid === "#ipban") {
          user.send(`|popup||html|Your IP (${user.latestIp}) is currently locked due to being a proxy. We automatically lock these connections since they are used to spam, hack, or otherwise attack our server. Disable any proxies you are using to connect to PS.

<a href="view-help-request--appeal"><button class="button">Help me with a lock from a proxy</button></a>`);
        } else if (user.latestHostType === "proxy" && user.locked !== user.id) {
          user.send(`|popup||html|You are locked${bannedUnder} on the IP (${user.latestIp}), which is a proxy. We automatically lock these connections since they are used to spam, hack, or otherwise attack our server. Disable any proxies you are using to connect to PS.

<a href="view-help-request--appeal"><button class="button">Help me with a lock from a proxy</button></a>`);
        } else if (!user.notified.lock) {
          user.send(`|popup||html|You are locked${bannedUnder}. ${user.permalocked ? `This lock is permanent.` : `Your lock will expire in a few days.`}${reason}${appeal}`);
        }
        user.notified.lock = true;
        user.locked = punishUserid;
        user.updateIdentity();
      } else if (punishmentInfo?.onActivate) {
        punishmentInfo.onActivate.call(this, user, punishment, null, punishment.id === user.id);
      }
      Punishments.checkPunishmentTime(user, punishment);
    }
  }
  checkIp(user, connection) {
    const ip = connection.ip;
    let punishments = Punishments.ipSearch(ip);
    if (!punishments && Punishments.checkRangeBanned(ip)) {
      punishments = [{ type: "LOCK", id: "#ipban", expireTime: Infinity, reason: "" }];
    }
    if (punishments) {
      const isSharedIP = Punishments.isSharedIp(ip);
      let sharedAndHasPunishment = false;
      for (const punishment of punishments) {
        if (isSharedIP) {
          if (!user.locked && !user.autoconfirmed) {
            user.semilocked = `#sharedip ${punishment.id}`;
          }
          sharedAndHasPunishment = true;
        } else {
          if (["BAN", "LOCK", "NAMELOCK"].includes(punishment.type)) {
            user.locked = punishment.id;
            if (punishment.type === "NAMELOCK") {
              user.namelocked = punishment.id;
              user.resetName(true);
            }
          } else {
            const info = Punishments.punishmentTypes.get(punishment.type);
            info?.onActivate?.call(this, user, punishment, null, punishment.id === user.id);
          }
        }
      }
      if (!sharedAndHasPunishment)
        Punishments.checkPunishmentTime(user, Punishments.byWeight(punishments)[0]);
    }
    return IPTools.lookup(ip).then(({ dnsbl, host, hostType }) => {
      user = connection.user || user;
      if (hostType === "proxy" && !user.trusted && !user.locked) {
        user.locked = "#hostfilter";
      } else if (dnsbl && !user.autoconfirmed) {
        user.semilocked = "#dnsbl";
      }
      if (host) {
        user.latestHost = host;
        user.latestHostType = hostType;
      }
      Chat.hostfilter(host || "", user, connection, hostType);
    });
  }
  /**
   * IP bans need to be checked separately since we don't even want to
   * make a User object if an IP is banned.
   */
  checkIpBanned(connection) {
    const ip = connection.ip;
    if (Punishments.cfloods.has(ip) || Monitor.countConnection(ip) && Punishments.cfloods.add(ip)) {
      connection.send(`|popup||modal|PS is under heavy load and cannot accommodate your connection right now.`);
      return "#cflood";
    }
    if (Punishments.isSharedIp(ip))
      return false;
    let banned = false;
    const punishment = Punishments.ipSearch(ip, "BAN");
    if (punishment) {
      banned = punishment.id;
    }
    if (!banned)
      return false;
    const appealUrl = Config.banappealurl || Config.appealurl;
    connection.send(
      `|popup||modal|You are banned because you have the same IP (${ip}) as banned user '${banned}'. Your ban will expire in a few days.${appealUrl ? `||||Or you can appeal at: ${appealUrl}` : ``}`
    );
    Monitor.notice(`CONNECT BLOCKED - IP BANNED: ${ip} (${banned})`);
    return banned;
  }
  checkNameInRoom(user, roomid) {
    let punishment = Punishments.roomUserids.nestedGet(roomid, user.id);
    if (!punishment && user.autoconfirmed) {
      punishment = Punishments.roomUserids.nestedGet(roomid, user.autoconfirmed);
    }
    if (punishment?.some((p) => p.type === "ROOMBAN" || p.type === "BLACKLIST")) {
      return true;
    }
    const room = Rooms.get(roomid);
    if (room.parent) {
      return Punishments.checkNameInRoom(user, room.parent.roomid);
    }
    return false;
  }
  /**
   * @param userid The name into which the user is renamed.
   */
  checkNewNameInRoom(user, userid, roomid) {
    let punishments = Punishments.roomUserids.nestedGet(roomid, userid) || null;
    if (!punishments) {
      const room = Rooms.get(roomid);
      if (room.parent) {
        punishments = Punishments.roomUserids.nestedGet(room.parent.roomid, userid) || null;
      }
    }
    if (punishments) {
      for (const punishment of punishments) {
        const info = this.roomPunishmentTypes.get(punishment.type);
        if (info?.onActivate) {
          info.onActivate.call(this, user, punishment, Rooms.get(roomid), punishment.id === user.id);
          continue;
        }
        if (punishment.type !== "ROOMBAN" && punishment.type !== "BLACKLIST")
          return null;
        const room = Rooms.get(roomid);
        room.game?.removeBannedUser?.(user);
        user.leaveRoom(room.roomid);
      }
      return punishments;
    }
    return null;
  }
  /**
   * @return Descriptive text for the remaining time until the punishment expires, if any.
   */
  checkLockExpiration(userid) {
    if (!userid)
      return ``;
    const punishment = Punishments.userids.getByType(userid, "LOCK");
    const user = Users.get(userid);
    if (user?.permalocked)
      return ` (never expires; you are permalocked)`;
    return Punishments.checkPunishmentExpiration(punishment);
  }
  checkPunishmentExpiration(punishment) {
    if (!punishment)
      return ``;
    const expiresIn = new Date(punishment.expireTime).getTime() - Date.now();
    const expiresDays = Math.round(expiresIn / 1e3 / 60 / 60 / 24);
    let expiresText = "";
    if (expiresDays >= 1) {
      expiresText = `in around ${Chat.count(expiresDays, "days")}`;
    } else {
      expiresText = `soon`;
    }
    if (expiresIn > 1)
      return ` (expires ${expiresText})`;
  }
  isRoomBanned(user, roomid) {
    if (!user)
      throw new Error(`Trying to check if a non-existent user is room banned.`);
    let punishments = Punishments.roomUserids.nestedGet(roomid, user.id);
    for (const p of punishments || []) {
      if (p.type === "ROOMBAN" || p.type === "BLACKLIST")
        return p;
    }
    if (user.autoconfirmed) {
      punishments = Punishments.roomUserids.nestedGet(roomid, user.autoconfirmed);
      for (const p of punishments || []) {
        if (p.type === "ROOMBAN" || p.type === "BLACKLIST")
          return p;
      }
    }
    if (!user.trusted) {
      for (const ip of user.ips) {
        punishments = Punishments.roomIps.nestedGet(roomid, ip);
        if (punishments) {
          for (const punishment of punishments) {
            if (punishment.type === "ROOMBAN") {
              return punishment;
            } else if (punishment.type === "BLACKLIST") {
              if (Punishments.isSharedIp(ip) && user.autoconfirmed)
                continue;
              return punishment;
            }
          }
        }
      }
    }
    for (const id of user.previousIDs) {
      punishments = Punishments.roomUserids.nestedGet(roomid, id);
      for (const p of punishments || []) {
        if (["ROOMBAN", "BLACKLIST"].includes(p.type))
          return p;
      }
    }
    const room = Rooms.get(roomid);
    if (!room)
      throw new Error(`Trying to ban a user from a nonexistent room: ${roomid}`);
    if (room.parent)
      return Punishments.isRoomBanned(user, room.parent.roomid);
  }
  isGlobalBanned(user) {
    if (!user)
      throw new Error(`Trying to check if a non-existent user is global banned.`);
    const punishment = Punishments.userids.getByType(user.id, "BAN") || Punishments.userids.getByType(user.id, "FORCEBAN");
    if (punishment)
      return punishment;
  }
  isBlacklistedSharedIp(ip) {
    const pattern = IPTools.stringToRange(ip);
    if (!pattern) {
      throw new Error(`Invalid IP address: '${ip}'`);
    }
    for (const [blacklisted, reason] of this.sharedIpBlacklist) {
      const range = IPTools.stringToRange(blacklisted);
      if (!range)
        throw new Error("Falsy range in sharedIpBlacklist");
      if (IPTools.rangeIntersects(range, pattern))
        return reason;
    }
    return false;
  }
  /**
   * Returns an array of all room punishments associated with a user.
   *
   * options.publicOnly will make this only return public room punishments.
   * options.checkIps will also check the IP of the user for IP-based punishments.
   */
  getRoomPunishments(user, options = {}) {
    if (!user)
      return [];
    const userid = toID(user);
    const punishments = [];
    for (const curRoom of Rooms.global.chatRooms) {
      if (!curRoom || curRoom.settings.isPrivate === true || options.publicOnly && curRoom.settings.isPersonal)
        continue;
      let punishment = Punishments.roomUserids.nestedGet(curRoom.roomid, userid);
      if (punishment) {
        for (const p of punishment) {
          punishments.push([curRoom, p]);
        }
        continue;
      } else if (options?.checkIps) {
        if (typeof user !== "string") {
          let longestIPPunishment;
          for (const ip of user.ips) {
            punishment = Punishments.roomIps.nestedGet(curRoom.roomid, ip);
            if (punishment && (!longestIPPunishment || punishment[2] > longestIPPunishment[2])) {
              longestIPPunishment = punishment;
            }
          }
          if (longestIPPunishment) {
            for (const p of longestIPPunishment) {
              punishments.push([curRoom, p]);
            }
            continue;
          }
        }
      }
      if (typeof user !== "string" && curRoom.muteQueue) {
        for (const entry of curRoom.muteQueue) {
          if (userid === entry.userid || user.guestNum === entry.guestNum || user.autoconfirmed && user.autoconfirmed === entry.autoconfirmed) {
            punishments.push([curRoom, { type: "MUTE", id: entry.userid, expireTime: entry.time, reason: "" }]);
          }
        }
      }
    }
    return punishments;
  }
  getPunishments(roomid, ignoreMutes) {
    const punishmentTable = [];
    if (roomid && (!Punishments.roomIps.has(roomid) || !Punishments.roomUserids.has(roomid)))
      return punishmentTable;
    (roomid ? Punishments.roomIps.get(roomid) : Punishments.ips).each((punishment, ip) => {
      const { type, id, expireTime, reason, rest } = punishment;
      if (id !== "#rangelock" && id.startsWith("#"))
        return;
      let entry = punishmentTable.find((e) => e[0] === id && e[1].punishType === type)?.[1];
      if (entry) {
        entry.ips.push(ip);
        return;
      }
      entry = {
        userids: [],
        ips: [ip],
        punishType: type,
        expireTime,
        reason,
        rest: rest || []
      };
      punishmentTable.push([id, entry]);
    });
    (roomid ? Punishments.roomUserids.get(roomid) : Punishments.userids).each((punishment, userid) => {
      const { type, id, expireTime, reason, rest } = punishment;
      if (id.startsWith("#"))
        return;
      let entry = punishmentTable.find(([curId, cur]) => id === curId && cur.punishType === type)?.[1];
      if (!entry) {
        entry = {
          userids: [],
          ips: [],
          punishType: type,
          expireTime,
          reason,
          rest: rest || []
        };
        punishmentTable.push([id, entry]);
      }
      if (userid !== id)
        entry.userids.push(userid);
    });
    if (roomid && ignoreMutes !== false) {
      const room = Rooms.get(roomid);
      if (room?.muteQueue) {
        for (const mute of room.muteQueue) {
          punishmentTable.push([mute.userid, {
            userids: [],
            ips: [],
            punishType: "MUTE",
            expireTime: mute.time,
            reason: "",
            rest: []
          }]);
        }
      }
    }
    return punishmentTable;
  }
  visualizePunishments(punishments, user) {
    let buf = "";
    buf += `<div class="ladder pad"><h2>List of active punishments:</h2>`;
    buf += `<table">`;
    buf += `<tr>`;
    buf += `<th>Username</th>`;
    buf += `<th>Punishment type</th>`;
    buf += `<th>Expire time</th>`;
    buf += `<th>Reason</th>`;
    buf += `<th>Alts</th>`;
    if (user.can("ip"))
      buf += `<th>IPs</th>`;
    buf += `</tr>`;
    for (const [userid, punishment] of punishments) {
      const expiresIn = new Date(punishment.expireTime).getTime() - Date.now();
      if (expiresIn < 1e3)
        continue;
      const expireString = Chat.toDurationString(expiresIn, { precision: 1 });
      buf += `<tr>`;
      buf += `<td>${userid}</td>`;
      buf += `<td>${punishment.punishType}</td>`;
      buf += `<td>${expireString}</td>`;
      buf += `<td>${punishment.reason || " - "}</td>`;
      buf += `<td>${punishment.userids.join(", ") || " - "}</td>`;
      if (user.can("ip"))
        buf += `<td>${punishment.ips.join(", ") || " - "}</td>`;
      buf += `</tr>`;
    }
    buf += `</table>`;
    buf += `</div>`;
    return buf;
  }
  /**
   * Notifies staff if a user has three or more room punishments.
   */
  async monitorRoomPunishments(user) {
    if (user.locked)
      return;
    const userid = toID(user);
    const minPunishments = typeof Config.monitorminpunishments === "number" ? Config.monitorminpunishments : 3;
    if (!minPunishments)
      return;
    let punishments = Punishments.getRoomPunishments(user, { checkIps: true, publicOnly: true });
    punishments = punishments.filter(([room, punishment]) => Punishments.roomPunishmentTypes.get(punishment.type)?.activatePunishMonitor);
    if (punishments.length >= minPunishments) {
      let points = 0;
      const punishmentText = punishments.map(([room, punishment]) => {
        const { type: punishType, id: punishUserid, reason } = punishment;
        if (punishType in PUNISHMENT_POINT_VALUES)
          points += PUNISHMENT_POINT_VALUES[punishType];
        let punishDesc = Punishments.roomPunishmentTypes.get(punishType)?.desc;
        if (!punishDesc)
          punishDesc = `punished`;
        if (punishUserid !== userid)
          punishDesc += ` as ${punishUserid}`;
        const trimmedReason = reason?.trim();
        if (trimmedReason && !trimmedReason.startsWith("(PROOF:"))
          punishDesc += `: ${trimmedReason}`;
        return `<<${room}>> (${punishDesc})`;
      }).join(", ");
      if (Config.punishmentautolock && points >= AUTOLOCK_POINT_THRESHOLD) {
        const rooms = punishments.map(([room]) => room).join(", ");
        const reason = `Autolocked for having punishments in ${punishments.length} rooms: ${rooms}`;
        const message = `${user.name || userid} was locked for having punishments in ${punishments.length} rooms: ${punishmentText}`;
        const globalPunishments = await Rooms.Modlog.getGlobalPunishments(userid, AUTOWEEKLOCK_DAYS_TO_SEARCH);
        const isWeek = globalPunishments !== null && globalPunishments >= AUTOWEEKLOCK_THRESHOLD;
        void Punishments.autolock(user, "staff", "PunishmentMonitor", reason, message, isWeek);
        if (typeof user !== "string") {
          user.popup(
            `|modal|You've been locked for breaking the rules in multiple chatrooms.

If you feel that your lock was unjustified, you can still PM staff members (%, @, &) to discuss it${Config.appealurl ? " or you can appeal:\n" + Config.appealurl : "."}

Your lock will expire in a few days.`
          );
        }
      } else {
        Monitor.log(`[PunishmentMonitor] ${user.name || userid} currently has punishments in ${punishments.length} rooms: ${punishmentText}`);
      }
    }
  }
  renameRoom(oldID, newID) {
    for (const table of [Punishments.roomUserids, Punishments.roomIps]) {
      const entry = table.get(oldID);
      if (entry) {
        table.set(newID, entry);
        table.delete(oldID);
      }
    }
    Punishments.saveRoomPunishments();
  }
}();
//# sourceMappingURL=punishments.js.map
