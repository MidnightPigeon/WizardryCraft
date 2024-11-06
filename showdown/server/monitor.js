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
var monitor_exports = {};
__export(monitor_exports, {
  Monitor: () => Monitor,
  TimedCounter: () => TimedCounter
});
module.exports = __toCommonJS(monitor_exports);
var import_child_process = require("child_process");
var import_lib = require("../lib");
/**
 * Monitor
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * Various utility functions to make sure PS is running healthily.
 *
 * @license MIT
 */
const MONITOR_CLEAN_TIMEOUT = 2 * 60 * 60 * 1e3;
class TimedCounter extends Map {
  /**
   * Increments the number of times an action has been committed by one, and
   * updates the delta of time since it was last committed.
   *
   * @returns [action count, time delta]
   */
  increment(key, timeLimit) {
    const val = this.get(key);
    const now = Date.now();
    if (!val || now > val[1] + timeLimit) {
      this.set(key, [1, Date.now()]);
      return [1, 0];
    } else {
      val[0]++;
      return [val[0], now - val[1]];
    }
  }
}
if ("Config" in global && (typeof Config.loglevel !== "number" || Config.loglevel < 0 || Config.loglevel > 5)) {
  Config.loglevel = 2;
}
const Monitor = new class {
  constructor() {
    this.connections = new TimedCounter();
    this.netRequests = new TimedCounter();
    this.battles = new TimedCounter();
    this.battlePreps = new TimedCounter();
    this.groupChats = new TimedCounter();
    this.tickets = new TimedCounter();
    this.activeIp = null;
    this.networkUse = {};
    this.networkCount = {};
    this.hotpatchLock = {};
    this.TimedCounter = TimedCounter;
    this.updateServerLock = false;
    this.cleanInterval = null;
    /**
     * Inappropriate userid : has the user logged in since the FR
     */
    this.forceRenames = /* @__PURE__ */ new Map();
  }
  /*********************************************************
   * Logging
   *********************************************************/
  crashlog(err, source = "The main process", details = null) {
    const error = err || {};
    if ((error.stack || "").startsWith("@!!@")) {
      try {
        const stack = error.stack || "";
        const nlIndex = stack.indexOf("\n");
        [error.name, error.message, source, details] = JSON.parse(stack.slice(4, nlIndex));
        error.stack = stack.slice(nlIndex + 1);
      } catch {
      }
    }
    const crashType = (0, import_lib.crashlogger)(error, source, details);
    Rooms.global.reportCrash(error, source);
    if (crashType === "lockdown") {
      Config.autolockdown = false;
      Rooms.global.startLockdown(error);
    }
  }
  log(text) {
    this.notice(text);
    const staffRoom = Rooms.get("staff");
    if (staffRoom) {
      staffRoom.add(`|c|~|${text}`).update();
    }
  }
  adminlog(text) {
    this.notice(text);
    const upperstaffRoom = Rooms.get("upperstaff");
    if (upperstaffRoom) {
      upperstaffRoom.add(`|c|~|${text}`).update();
    }
  }
  logHTML(text) {
    this.notice(text);
    const staffRoom = Rooms.get("staff");
    if (staffRoom) {
      staffRoom.add(`|html|${text}`).update();
    }
  }
  error(text) {
    (Rooms.get("development") || Rooms.get("staff") || Rooms.get("lobby"))?.add(`|error|${text}`).update();
    if (Config.loglevel <= 3)
      console.error(text);
  }
  debug(text) {
    if (Config.loglevel <= 1)
      console.log(text);
  }
  warn(text) {
    if (Config.loglevel <= 3)
      console.log(text);
  }
  notice(text) {
    if (Config.loglevel <= 2)
      console.log(text);
  }
  slow(text) {
    const logRoom = Rooms.get("slowlog");
    if (logRoom) {
      logRoom.add(`|c|&|/log ${text}`).update();
    } else {
      this.warn(text);
    }
  }
  /*********************************************************
   * Resource Monitor
   *********************************************************/
  clean() {
    this.clearNetworkUse();
    this.battlePreps.clear();
    this.battles.clear();
    this.connections.clear();
    IPTools.dnsblCache.clear();
  }
  /**
   * Counts a connection. Returns true if the connection should be terminated for abuse.
   */
  countConnection(ip, name = "") {
    if (Config.noipchecks || Config.nothrottle)
      return false;
    const [count, duration] = this.connections.increment(ip, 30 * 60 * 1e3);
    if (count === 500) {
      this.adminlog(`[ResourceMonitor] IP ${ip} banned for cflooding (${count} times in ${Chat.toDurationString(duration)}${name ? ": " + name : ""})`);
      return true;
    }
    if (count > 500) {
      if (count % 500 === 0) {
        const c = count / 500;
        if (c === 2 || c === 4 || c === 10 || c === 20 || c % 40 === 0) {
          this.adminlog(`[ResourceMonitor] IP ${ip} still cflooding (${count} times in ${Chat.toDurationString(duration)}${name ? ": " + name : ""})`);
        }
      }
      return true;
    }
    return false;
  }
  /**
   * Counts battles created. Returns true if the connection should be
   * terminated for abuse.
   */
  countBattle(ip, name = "") {
    if (Config.noipchecks || Config.nothrottle)
      return false;
    const [count, duration] = this.battles.increment(ip, 30 * 60 * 1e3);
    if (duration < 5 * 60 * 1e3 && count % 30 === 0) {
      this.adminlog(`[ResourceMonitor] IP ${ip} has battled ${count} times in the last ${Chat.toDurationString(duration)}${name ? ": " + name : ""})`);
      return true;
    }
    if (count % 150 === 0) {
      this.adminlog(`[ResourceMonitor] IP ${ip} has battled ${count} times in the last ${Chat.toDurationString(duration)}${name ? ": " + name : ""}`);
      return true;
    }
    return false;
  }
  /**
   * Counts team validations. Returns true if too many.
   */
  countPrepBattle(ip, connection) {
    if (Config.noipchecks || Config.nothrottle)
      return false;
    const count = this.battlePreps.increment(ip, 3 * 60 * 1e3)[0];
    if (count <= 12)
      return false;
    if (count < 120 && Punishments.isSharedIp(ip))
      return false;
    connection.popup("Due to high load, you are limited to 12 battles and team validations every 3 minutes.");
    return true;
  }
  /**
   * Counts concurrent battles. Returns true if too many.
   */
  countConcurrentBattle(count, connection) {
    if (Config.noipchecks || Config.nothrottle)
      return false;
    if (count <= 5)
      return false;
    connection.popup(`Due to high load, you are limited to 5 games at the same time.`);
    return true;
  }
  /**
   * Counts group chat creation. Returns true if too much.
   */
  countGroupChat(ip) {
    if (Config.noipchecks)
      return false;
    const count = this.groupChats.increment(ip, 60 * 60 * 1e3)[0];
    return count > 4;
  }
  /**
   * Counts commands that use HTTPs requests. Returns true if too many.
   */
  countNetRequests(ip) {
    if (Config.noipchecks || Config.nothrottle)
      return false;
    const [count] = this.netRequests.increment(ip, 1 * 60 * 1e3);
    if (count <= 10)
      return false;
    if (count < 120 && Punishments.isSharedIp(ip))
      return false;
    return true;
  }
  /**
   * Counts ticket creation. Returns true if too much.
   */
  countTickets(ip) {
    if (Config.noipchecks || Config.nothrottle)
      return false;
    const count = this.tickets.increment(ip, 60 * 60 * 1e3)[0];
    if (Punishments.isSharedIp(ip)) {
      return count >= 20;
    } else {
      return count >= 5;
    }
  }
  /**
   * Counts the data length received by the last connection to send a
   * message, as well as the data length in the server's response.
   */
  countNetworkUse(size) {
    if (!Config.emergency || typeof this.activeIp !== "string" || Config.noipchecks || Config.nothrottle) {
      return;
    }
    if (this.activeIp in this.networkUse) {
      this.networkUse[this.activeIp] += size;
      this.networkCount[this.activeIp]++;
    } else {
      this.networkUse[this.activeIp] = size;
      this.networkCount[this.activeIp] = 1;
    }
  }
  writeNetworkUse() {
    let buf = "";
    for (const i in this.networkUse) {
      buf += `${this.networkUse[i]}	${this.networkCount[i]}	${i}
`;
    }
    void (0, import_lib.FS)("logs/networkuse.tsv").write(buf);
  }
  clearNetworkUse() {
    if (Config.emergency) {
      this.networkUse = {};
      this.networkCount = {};
    }
  }
  /**
   * Counts roughly the size of an object to have an idea of the server load.
   */
  sizeOfObject(object) {
    const objectCache = /* @__PURE__ */ new Set();
    const stack = [object];
    let bytes = 0;
    while (stack.length) {
      const value = stack.pop();
      switch (typeof value) {
        case "boolean":
          bytes += 4;
          break;
        case "string":
          bytes += value.length * 2;
          break;
        case "number":
          bytes += 8;
          break;
        case "object":
          if (!objectCache.has(value))
            objectCache.add(value);
          if (Array.isArray(value)) {
            for (const el of value)
              stack.push(el);
          } else {
            for (const i in value)
              stack.push(value[i]);
          }
          break;
      }
    }
    return bytes;
  }
  sh(command, options = {}) {
    return new Promise((resolve, reject) => {
      (0, import_child_process.exec)(command, options, (error, stdout, stderr) => {
        resolve([error?.code || 0, "" + stdout, "" + stderr]);
      });
    });
  }
  async version() {
    let hash;
    try {
      await (0, import_lib.FS)(".git/index").copyFile("logs/.gitindex");
      const index = (0, import_lib.FS)("logs/.gitindex");
      const options = {
        cwd: __dirname,
        env: { GIT_INDEX_FILE: index.path }
      };
      let [code, stdout, stderr] = await this.sh(`git add -A`, options);
      if (code || stderr)
        return;
      [code, stdout, stderr] = await this.sh(`git write-tree`, options);
      if (code || stderr)
        return;
      hash = stdout.trim();
      await this.sh(`git reset`, options);
      await index.unlinkIfExists();
    } catch {
    }
    return hash;
  }
}();
Monitor.cleanInterval = setInterval(() => Monitor.clean(), MONITOR_CLEAN_TIMEOUT);
//# sourceMappingURL=monitor.js.map
