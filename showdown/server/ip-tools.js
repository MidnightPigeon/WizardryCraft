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
var ip_tools_exports = {};
__export(ip_tools_exports, {
  IPTools: () => IPTools,
  default: () => ip_tools_default
});
module.exports = __toCommonJS(ip_tools_exports);
var dns = __toESM(require("dns"));
var import_lib = require("../lib");
/**
 * IP Tools
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * IPTools file has various tools for IP parsing and IP-based blocking.
 *
 * These include DNSBLs: DNS-based blackhole lists, which list IPs known for
 * running proxies, spamming, or other abuse.
 *
 * We also maintain our own database of datacenter IP ranges (usually
 * proxies). These are taken from https://github.com/client9/ipcat
 * but include our own database as well.
 *
 * @license MIT
 */
const BLOCKLISTS = ["sbl.spamhaus.org", "rbl.efnetrbl.org"];
const HOSTS_FILE = "config/hosts.csv";
const PROXIES_FILE = "config/proxies.csv";
function removeNohost(hostname) {
  if (hostname?.includes("-nohost")) {
    const parts = hostname.split(".");
    const suffix = parts.pop();
    return `${parts.join(".")}?/${suffix?.replace("-nohost", "")}`;
  }
  return hostname;
}
const IPTools = new class {
  constructor() {
    this.dnsblCache = /* @__PURE__ */ new Map([
      ["127.0.0.1", null]
    ]);
    this.connectionTestCache = /* @__PURE__ */ new Map();
    this.ipRegex = /^(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])$/;
    this.ipRangeRegex = /^(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9]|\*)){0,2}\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9]|\*)$/;
    this.hostRegex = /^.+\..{2,}$/;
    /**
     * Proxy and host management functions
     */
    this.ranges = [];
    this.singleIPOpenProxies = /* @__PURE__ */ new Set();
    this.torProxyIps = /* @__PURE__ */ new Set();
    this.proxyHosts = /* @__PURE__ */ new Set();
    this.residentialHosts = /* @__PURE__ */ new Set();
    this.mobileHosts = /* @__PURE__ */ new Set();
  }
  async lookup(ip) {
    const [dnsbl, host] = await Promise.all([
      IPTools.queryDnsbl(ip),
      IPTools.getHost(ip)
    ]);
    const shortHost = this.shortenHost(host);
    const hostType = this.getHostType(shortHost, ip);
    return { dnsbl, host, shortHost, hostType };
  }
  queryDnsblLoop(ip, callback, reversedIpDot, index) {
    if (index >= BLOCKLISTS.length) {
      IPTools.dnsblCache.set(ip, null);
      callback(null);
      return;
    }
    const blocklist = BLOCKLISTS[index];
    dns.lookup(reversedIpDot + blocklist, 4, (err, res) => {
      if (!err) {
        IPTools.dnsblCache.set(ip, blocklist);
        callback(blocklist);
        return;
      }
      IPTools.queryDnsblLoop(ip, callback, reversedIpDot, index + 1);
    });
  }
  /**
   * IPTools.queryDnsbl(ip, callback)
   *
   * Calls callb
   * ack(blocklist), where blocklist is the blocklist domain
   * if the passed IP is in a blocklist, or null if the IP is not in
   * any blocklist.
   *
   * Return value matches isBlocked when treated as a boolean.
   */
  queryDnsbl(ip) {
    if (!Config.dnsbl)
      return Promise.resolve(null);
    if (IPTools.dnsblCache.has(ip)) {
      return Promise.resolve(IPTools.dnsblCache.get(ip) || null);
    }
    const reversedIpDot = ip.split(".").reverse().join(".") + ".";
    return new Promise((resolve, reject) => {
      IPTools.queryDnsblLoop(ip, resolve, reversedIpDot, 0);
    });
  }
  /*********************************************************
   * IP parsing
   *********************************************************/
  ipToNumber(ip) {
    ip = ip.trim();
    if (ip.includes(":") && !ip.includes(".")) {
      return null;
    }
    if (ip.startsWith("::ffff:"))
      ip = ip.slice(7);
    else if (ip.startsWith("::"))
      ip = ip.slice(2);
    let num = 0;
    const parts = ip.split(".");
    if (parts.length !== 4)
      return null;
    for (const part of parts) {
      num *= 256;
      const partAsInt = import_lib.Utils.parseExactInt(part);
      if (isNaN(partAsInt) || partAsInt < 0 || partAsInt > 255)
        return null;
      num += partAsInt;
    }
    return num;
  }
  numberToIP(num) {
    const ipParts = [];
    if (num < 0 || num >= 256 ** 4 || num !== Math.trunc(num))
      return null;
    while (num) {
      const part = num % 256;
      num = (num - part) / 256;
      ipParts.unshift(part.toString());
    }
    while (ipParts.length < 4)
      ipParts.unshift("0");
    if (ipParts.length !== 4)
      return null;
    return ipParts.join(".");
  }
  getCidrRange(cidr) {
    if (!cidr)
      return null;
    const index = cidr.indexOf("/");
    if (index <= 0) {
      const ip = IPTools.ipToNumber(cidr);
      if (ip === null)
        return null;
      return { minIP: ip, maxIP: ip };
    }
    const low = IPTools.ipToNumber(cidr.slice(0, index));
    const bits = import_lib.Utils.parseExactInt(cidr.slice(index + 1));
    if (low === null || !bits || bits < 2 || bits > 32)
      return null;
    const high = low + (1 << 32 - bits) - 1;
    return { minIP: low, maxIP: high };
  }
  /** Is this an IP range supported by `stringToRange`? Note that exact IPs are also valid IP ranges. */
  isValidRange(range) {
    return IPTools.stringToRange(range) !== null;
  }
  stringToRange(range) {
    if (!range)
      return null;
    if (range.endsWith("*")) {
      const parts = range.replace(".*", "").split(".");
      if (parts.length > 3)
        return null;
      const [a, b, c] = parts;
      const minIP2 = IPTools.ipToNumber(`${a || "0"}.${b || "0"}.${c || "0"}.0`);
      const maxIP2 = IPTools.ipToNumber(`${a || "255"}.${b || "255"}.${c || "255"}.255`);
      if (minIP2 === null || maxIP2 === null)
        return null;
      return { minIP: minIP2, maxIP: maxIP2 };
    }
    const index = range.indexOf("-");
    if (index <= 0) {
      if (range.includes("/"))
        return IPTools.getCidrRange(range);
      const ip = IPTools.ipToNumber(range);
      if (ip === null)
        return null;
      return { maxIP: ip, minIP: ip };
    }
    const minIP = IPTools.ipToNumber(range.slice(0, index));
    const maxIP = IPTools.ipToNumber(range.slice(index + 1));
    if (minIP === null || maxIP === null || maxIP < minIP)
      return null;
    return { minIP, maxIP };
  }
  rangeToString(range, sep = "-") {
    return `${this.numberToIP(range.minIP)}${sep}${this.numberToIP(range.maxIP)}`;
  }
  /******************************
   * Range management functions *
   ******************************/
  checkPattern(patterns, num) {
    if (num === null)
      return false;
    for (const pattern of patterns) {
      if (num >= pattern.minIP && num <= pattern.maxIP) {
        return true;
      }
    }
    return false;
  }
  /**
   * Returns a checker function for the passed IP range or array of
   * ranges. The checker function returns true if its passed IP is
   * in the range.
   */
  checker(rangeString) {
    if (!rangeString?.length)
      return () => false;
    let ranges = [];
    if (typeof rangeString === "string") {
      const rangePatterns = IPTools.stringToRange(rangeString);
      if (rangePatterns)
        ranges = [rangePatterns];
    } else {
      ranges = rangeString.map(IPTools.stringToRange).filter((x) => x);
    }
    return (ip) => {
      const ipNumber = IPTools.ipToNumber(ip);
      return IPTools.checkPattern(ranges, ipNumber);
    };
  }
  async loadHostsAndRanges() {
    const data = await (0, import_lib.FS)(HOSTS_FILE).readIfExists() + await (0, import_lib.FS)(PROXIES_FILE).readIfExists();
    const rows = data.split("\n").map((row) => row.replace("\r", ""));
    const ranges = [];
    for (const row of rows) {
      if (!row)
        continue;
      let [type, hostOrLowIP, highIP, host] = row.split(",");
      if (!hostOrLowIP)
        continue;
      host = removeNohost(host);
      hostOrLowIP = removeNohost(hostOrLowIP);
      switch (type) {
        case "IP":
          IPTools.singleIPOpenProxies.add(hostOrLowIP);
          break;
        case "HOST":
          IPTools.proxyHosts.add(hostOrLowIP);
          break;
        case "RESIDENTIAL":
          IPTools.residentialHosts.add(hostOrLowIP);
          break;
        case "MOBILE":
          IPTools.mobileHosts.add(hostOrLowIP);
          break;
        case "RANGE":
          if (!host)
            continue;
          const minIP = IPTools.ipToNumber(hostOrLowIP);
          if (minIP === null) {
            Monitor.error(`Bad IP address in host or proxy file: '${hostOrLowIP}'`);
            continue;
          }
          const maxIP = IPTools.ipToNumber(highIP);
          if (maxIP === null) {
            Monitor.error(`Bad IP address in host or proxy file: '${highIP}'`);
            continue;
          }
          const range = { host: IPTools.urlToHost(host), maxIP, minIP };
          if (range.maxIP < range.minIP)
            throw new Error(`Bad range at ${hostOrLowIP}.`);
          ranges.push(range);
          break;
      }
    }
    IPTools.ranges = ranges;
    IPTools.sortRanges();
  }
  saveHostsAndRanges() {
    let hostsData = "";
    let proxiesData = "";
    for (const ip of IPTools.singleIPOpenProxies) {
      proxiesData += `IP,${ip}
`;
    }
    for (const host of IPTools.proxyHosts) {
      proxiesData += `HOST,${host}
`;
    }
    for (const host of IPTools.residentialHosts) {
      hostsData += `RESIDENTIAL,${host}
`;
    }
    for (const host of IPTools.mobileHosts) {
      hostsData += `MOBILE,${host}
`;
    }
    IPTools.sortRanges();
    for (const range of IPTools.ranges) {
      const data = `RANGE,${IPTools.rangeToString(range, ",")}${range.host ? `,${range.host}` : ``}
`;
      if (range.host?.endsWith("/proxy")) {
        proxiesData += data;
      } else {
        hostsData += data;
      }
    }
    void (0, import_lib.FS)(HOSTS_FILE).write(hostsData);
    void (0, import_lib.FS)(PROXIES_FILE).write(proxiesData);
  }
  addOpenProxies(ips) {
    for (const ip of ips) {
      IPTools.singleIPOpenProxies.add(ip);
    }
    return IPTools.saveHostsAndRanges();
  }
  addProxyHosts(hosts) {
    for (const host of hosts) {
      IPTools.proxyHosts.add(host);
    }
    return IPTools.saveHostsAndRanges();
  }
  addMobileHosts(hosts) {
    for (const host of hosts) {
      IPTools.mobileHosts.add(host);
    }
    return IPTools.saveHostsAndRanges();
  }
  addResidentialHosts(hosts) {
    for (const host of hosts) {
      IPTools.residentialHosts.add(host);
    }
    return IPTools.saveHostsAndRanges();
  }
  removeOpenProxies(ips) {
    for (const ip of ips) {
      IPTools.singleIPOpenProxies.delete(ip);
    }
    return IPTools.saveHostsAndRanges();
  }
  removeResidentialHosts(hosts) {
    for (const host of hosts) {
      IPTools.residentialHosts.delete(host);
    }
    return IPTools.saveHostsAndRanges();
  }
  removeProxyHosts(hosts) {
    for (const host of hosts) {
      IPTools.proxyHosts.delete(host);
    }
    return IPTools.saveHostsAndRanges();
  }
  removeMobileHosts(hosts) {
    for (const host of hosts) {
      IPTools.mobileHosts.delete(host);
    }
    return IPTools.saveHostsAndRanges();
  }
  rangeIntersects(a, b) {
    try {
      this.checkRangeConflicts(a, [b]);
    } catch {
      return true;
    }
    return false;
  }
  checkRangeConflicts(insertion, sortedRanges, widen) {
    if (insertion.maxIP < insertion.minIP) {
      throw new Error(
        `Invalid data for address range ${IPTools.rangeToString(insertion)} (${insertion.host})`
      );
    }
    let iMin = 0;
    let iMax = sortedRanges.length;
    while (iMin < iMax) {
      const i = Math.floor((iMax + iMin) / 2);
      if (insertion.minIP > sortedRanges[i].minIP) {
        iMin = i + 1;
      } else {
        iMax = i;
      }
    }
    if (iMin < sortedRanges.length) {
      const next = sortedRanges[iMin];
      if (insertion.minIP === next.minIP && insertion.maxIP === next.maxIP) {
        throw new Error(`The address range ${IPTools.rangeToString(insertion)} (${insertion.host}) already exists`);
      }
      if (insertion.minIP <= next.minIP && insertion.maxIP >= next.maxIP) {
        if (widen) {
          if (sortedRanges[iMin + 1]?.minIP <= insertion.maxIP) {
            throw new Error("You can only widen one address range at a time.");
          }
          return iMin;
        }
        throw new Error(
          `Too wide: ${IPTools.rangeToString(insertion)} (${insertion.host})
Intersects with: ${IPTools.rangeToString(next)} (${next.host})`
        );
      }
      if (insertion.maxIP >= next.minIP) {
        throw new Error(
          `Could not insert: ${IPTools.rangeToString(insertion)} ${insertion.host}
Intersects with: ${IPTools.rangeToString(next)} (${next.host})`
        );
      }
    }
    if (iMin > 0) {
      const prev = sortedRanges[iMin - 1];
      if (insertion.minIP >= prev.minIP && insertion.maxIP <= prev.maxIP) {
        throw new Error(
          `Too narrow: ${IPTools.rangeToString(insertion)} (${insertion.host})
Intersects with: ${IPTools.rangeToString(prev)} (${prev.host})`
        );
      }
      if (insertion.minIP <= prev.maxIP) {
        throw new Error(
          `Could not insert: ${IPTools.rangeToString(insertion)} (${insertion.host})
Intersects with: ${IPTools.rangeToString(prev)} (${prev.host})`
        );
      }
    }
  }
  /*********************************************************
   * Range handling functions
   *********************************************************/
  urlToHost(url) {
    if (url.startsWith("http://"))
      url = url.slice(7);
    if (url.startsWith("https://"))
      url = url.slice(8);
    if (url.startsWith("www."))
      url = url.slice(4);
    const slashIndex = url.indexOf("/");
    if (slashIndex > 0 && url[slashIndex - 1] !== "?")
      url = url.slice(0, slashIndex);
    return url;
  }
  sortRanges() {
    import_lib.Utils.sortBy(IPTools.ranges, (range) => range.minIP);
  }
  getRange(minIP, maxIP) {
    for (const range of IPTools.ranges) {
      if (range.minIP === minIP && range.maxIP === maxIP)
        return range;
    }
  }
  addRange(range) {
    if (IPTools.getRange(range.minIP, range.maxIP)) {
      IPTools.removeRange(range.minIP, range.maxIP);
    }
    IPTools.ranges.push(range);
    return IPTools.saveHostsAndRanges();
  }
  removeRange(minIP, maxIP) {
    IPTools.ranges = IPTools.ranges.filter((dc) => dc.minIP !== minIP || dc.maxIP !== maxIP);
    return IPTools.saveHostsAndRanges();
  }
  /**
   * Will not reject; IPs with no RDNS entry will resolve to
   * '[byte1].[byte2]?/unknown'.
   */
  getHost(ip) {
    return new Promise((resolve) => {
      if (!ip) {
        resolve("");
        return;
      }
      const ipNumber = IPTools.ipToNumber(ip);
      if (ipNumber === null)
        throw new Error(`Bad IP address: '${ip}'`);
      for (const range of IPTools.ranges) {
        if (ipNumber >= range.minIP && ipNumber <= range.maxIP) {
          resolve(range.host);
          return;
        }
      }
      dns.reverse(ip, (err, hosts) => {
        if (err) {
          resolve(`${ip.split(".").slice(0, 2).join(".")}?/unknown`);
          return;
        }
        if (!hosts?.[0]) {
          if (ip.startsWith("50.")) {
            resolve("comcast.net?/res");
          } else if (ipNumber >= telstraRange.minIP && ipNumber <= telstraRange.maxIP) {
            resolve(telstraRange.host);
          } else {
            this.testConnection(ip, (result) => {
              if (result) {
                resolve(`${ip.split(".").slice(0, 2).join(".")}?/proxy`);
              } else {
                resolve(`${ip.split(".").slice(0, 2).join(".")}?/unknown`);
              }
            });
          }
        } else {
          resolve(hosts[0]);
        }
      });
    });
  }
  /**
   * Does this IP respond to port 80? In theory, proxies are likely to
   * respond, while residential connections are likely to reject connections.
   *
   * Callback is guaranteed to be called exactly once, within a 1000ms
   * timeout.
   */
  testConnection(ip, callback) {
    const cachedValue = this.connectionTestCache.get(ip);
    if (cachedValue !== void 0) {
      return callback(cachedValue);
    }
    let connected = false;
    const socket = require("net").createConnection({
      port: 80,
      host: ip,
      timeout: 1e3
    }, () => {
      connected = true;
      this.connectionTestCache.set(ip, true);
      socket.destroy();
      return callback(true);
    });
    socket.on("error", () => {
    });
    socket.on("timeout", () => socket.destroy());
    socket.on("close", () => {
      if (!connected) {
        this.connectionTestCache.set(ip, false);
        return callback(false);
      }
    });
  }
  shortenHost(host) {
    if (host.split(".").pop()?.includes("/"))
      return host;
    let dotLoc = host.lastIndexOf(".");
    const tld = host.slice(dotLoc);
    if (tld === ".uk" || tld === ".au" || tld === ".br")
      dotLoc = host.lastIndexOf(".", dotLoc - 1);
    dotLoc = host.lastIndexOf(".", dotLoc - 1);
    return host.slice(dotLoc + 1);
  }
  /**
   * Host types:
   * - 'res' - normal residential ISP
   * - 'shared' - like res, but shared among many people: bans will have collateral damage
   * - 'mobile' - like res, but unstable IP (IP bans don't work)
   * - 'proxy' - datacenters, VPNs, proxy services, other untrustworthy sources
   *   (note that bots will usually be hosted on these)
   * - 'res?' - likely res, but host not specifically whitelisted
   * - 'unknown' - no rdns entry, treat with suspicion
   */
  getHostType(host, ip) {
    if (Punishments.isSharedIp(ip)) {
      return "shared";
    }
    if (this.singleIPOpenProxies.has(ip) || this.torProxyIps.has(ip)) {
      return "proxy";
    }
    if (/^he\.net(\?|)\/proxy$/.test(host)) {
      if (["74.82.60.", "72.52.87.", "65.49.126."].some((range) => ip.startsWith(range))) {
        return "proxy";
      }
      return "unknown";
    }
    if (this.proxyHosts.has(host) || host.endsWith("/proxy")) {
      return "proxy";
    }
    if (this.residentialHosts.has(host) || host.endsWith("/res")) {
      return "res";
    }
    if (this.mobileHosts.has(host) || host.endsWith("/mobile")) {
      return "mobile";
    }
    if (/^ip-[0-9]+-[0-9]+-[0-9]+\.net$/.test(host) || /^ip-[0-9]+-[0-9]+-[0-9]+\.eu$/.test(host)) {
      return "proxy";
    }
    if (host.endsWith("/unknown")) {
      return "unknown";
    }
    return "res?";
  }
  async updateTorRanges() {
    try {
      const raw = await (0, import_lib.Net)("https://check.torproject.org/torbulkexitlist").get();
      const torIps = raw.split("\n");
      for (const ip of torIps) {
        if (this.ipRegex.test(ip)) {
          this.torProxyIps.add(ip);
        }
      }
    } catch {
    }
  }
}();
const telstraRange = {
  minIP: IPTools.ipToNumber("101.160.0.0"),
  maxIP: IPTools.ipToNumber("101.191.255.255"),
  host: "telstra.net?/res"
};
var ip_tools_default = IPTools;
void IPTools.updateTorRanges();
//# sourceMappingURL=ip-tools.js.map
