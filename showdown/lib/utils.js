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
var utils_exports = {};
__export(utils_exports, {
  Multiset: () => Multiset,
  Utils: () => Utils,
  clampIntRange: () => clampIntRange,
  clearRequireCache: () => clearRequireCache,
  compare: () => compare,
  deepClone: () => deepClone,
  deepFreeze: () => deepFreeze,
  escapeHTML: () => escapeHTML,
  escapeHTMLForceWrap: () => escapeHTMLForceWrap,
  escapeRegex: () => escapeRegex,
  forceWrap: () => forceWrap,
  formatOrder: () => formatOrder,
  formatSQLArray: () => formatSQLArray,
  getString: () => getString,
  html: () => html,
  levenshtein: () => levenshtein,
  parseExactInt: () => parseExactInt,
  randomElement: () => randomElement,
  shuffle: () => shuffle,
  sortBy: () => sortBy,
  splitFirst: () => splitFirst,
  stripHTML: () => stripHTML,
  uncacheModuleTree: () => uncacheModuleTree,
  visualize: () => visualize,
  waitUntil: () => waitUntil
});
module.exports = __toCommonJS(utils_exports);
function getString(str) {
  return typeof str === "string" || typeof str === "number" ? "" + str : "";
}
function escapeRegex(str) {
  return str.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
}
function escapeHTML(str) {
  if (str === null || str === void 0)
    return "";
  return ("" + str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;").replace(/\//g, "&#x2f;").replace(/\n/g, "<br />");
}
function stripHTML(htmlContent) {
  if (!htmlContent)
    return "";
  return htmlContent.replace(/<[^>]*>/g, "");
}
function formatOrder(place) {
  let remainder = place % 100;
  if (remainder >= 10 && remainder <= 20)
    return place + "th";
  remainder = place % 10;
  if (remainder === 1)
    return place + "st";
  if (remainder === 2)
    return place + "nd";
  if (remainder === 3)
    return place + "rd";
  return place + "th";
}
function visualize(value, depth = 0) {
  if (value === void 0)
    return `undefined`;
  if (value === null)
    return `null`;
  if (typeof value === "number" || typeof value === "boolean") {
    return `${value}`;
  }
  if (typeof value === "string") {
    return `"${value}"`;
  }
  if (typeof value === "symbol") {
    return value.toString();
  }
  if (Array.isArray(value)) {
    if (depth > 10)
      return `[array]`;
    return `[` + value.map((elem) => visualize(elem, depth + 1)).join(`, `) + `]`;
  }
  if (value instanceof RegExp || value instanceof Date || value instanceof Function) {
    if (depth && value instanceof Function)
      return `Function`;
    return `${value}`;
  }
  let constructor = "";
  if (value.constructor && value.constructor.name && typeof value.constructor.name === "string") {
    constructor = value.constructor.name;
    if (constructor === "Object")
      constructor = "";
  } else {
    constructor = "null";
  }
  const baseClass = value?.toString && /\[object (.*)\]/.exec(value.toString())?.[1] || constructor;
  switch (baseClass) {
    case "Map":
      if (depth > 2)
        return `Map`;
      const mapped = [...value.entries()].map(
        (val) => `${visualize(val[0], depth + 1)} => ${visualize(val[1], depth + 1)}`
      );
      return `${constructor} (${value.size}) { ${mapped.join(", ")} }`;
    case "Set":
      if (depth > 2)
        return `Set`;
      return `${constructor} (${value.size}) { ${[...value].map((v) => visualize(v), depth + 1).join(", ")} }`;
  }
  if (value.toString) {
    try {
      const stringValue = value.toString();
      if (typeof stringValue === "string" && stringValue !== "[object Object]" && stringValue !== `[object ${constructor}]`) {
        return `${constructor}(${stringValue})`;
      }
    } catch {
    }
  }
  let buf = "";
  for (const key in value) {
    if (!Object.prototype.hasOwnProperty.call(value, key))
      continue;
    if (depth > 2 || depth && constructor) {
      buf = "...";
      break;
    }
    if (buf)
      buf += `, `;
    let displayedKey = key;
    if (!/^[A-Za-z0-9_$]+$/.test(key))
      displayedKey = JSON.stringify(key);
    buf += `${displayedKey}: ` + visualize(value[key], depth + 1);
  }
  if (constructor && !buf && constructor !== "null")
    return constructor;
  return `${constructor}{${buf}}`;
}
function compare(a, b) {
  if (typeof a === "number") {
    return a - b;
  }
  if (typeof a === "string") {
    return a.localeCompare(b);
  }
  if (typeof a === "boolean") {
    return (a ? 1 : 2) - (b ? 1 : 2);
  }
  if (Array.isArray(a)) {
    for (let i = 0; i < a.length; i++) {
      const comparison = compare(a[i], b[i]);
      if (comparison)
        return comparison;
    }
    return 0;
  }
  if ("reverse" in a) {
    return compare(b.reverse, a.reverse);
  }
  throw new Error(`Passed value ${a} is not comparable`);
}
function sortBy(array, callback) {
  if (!callback)
    return array.sort(compare);
  return array.sort((a, b) => compare(callback(a), callback(b)));
}
function splitFirst(str, delimiter, limit = 1) {
  const splitStr = [];
  while (splitStr.length < limit) {
    const delimiterIndex = str.indexOf(delimiter);
    if (delimiterIndex >= 0) {
      splitStr.push(str.slice(0, delimiterIndex));
      str = str.slice(delimiterIndex + delimiter.length);
    } else {
      splitStr.push(str);
      str = "";
    }
  }
  splitStr.push(str);
  return splitStr;
}
function html(strings, ...args) {
  let buf = strings[0];
  let i = 0;
  while (i < args.length) {
    buf += escapeHTML(args[i]);
    buf += strings[++i];
  }
  return buf;
}
function escapeHTMLForceWrap(text) {
  return escapeHTML(forceWrap(text)).replace(/\u200B/g, "<wbr />");
}
function forceWrap(text) {
  return text.replace(/[^\s]{30,}/g, (word) => {
    let lastBreak = 0;
    let brokenWord = "";
    for (let i = 1; i < word.length; i++) {
      if (i - lastBreak >= 10 || /[^a-zA-Z0-9([{][a-zA-Z0-9]/.test(word.slice(i - 1, i + 1))) {
        brokenWord += word.slice(lastBreak, i) + "\u200B";
        lastBreak = i;
      }
    }
    brokenWord += word.slice(lastBreak);
    return brokenWord;
  });
}
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function randomElement(arr) {
  const i = Math.floor(Math.random() * arr.length);
  return arr[i];
}
function clampIntRange(num, min, max) {
  if (typeof num !== "number")
    num = 0;
  num = Math.floor(num);
  if (min !== void 0 && num < min)
    num = min;
  if (max !== void 0 && num > max)
    num = max;
  return num;
}
function clearRequireCache(options = {}) {
  const excludes = options?.exclude || [];
  excludes.push("/node_modules/");
  for (const path in require.cache) {
    if (excludes.some((p) => path.includes(p)))
      continue;
    const mod = require.cache[path];
    if (!mod)
      continue;
    uncacheModuleTree(mod, excludes);
    delete require.cache[path];
  }
}
function uncacheModuleTree(mod, excludes, depth = 0) {
  depth++;
  if (depth >= 10)
    return;
  if (!mod.children || excludes.some((p) => mod.filename.includes(p)))
    return;
  for (const child of mod.children) {
    if (excludes.some((p) => child.filename.includes(p)))
      continue;
    uncacheModuleTree(child, excludes, depth);
  }
  delete mod.children;
}
function deepClone(obj) {
  if (obj === null || typeof obj !== "object")
    return obj;
  if (Array.isArray(obj))
    return obj.map((prop) => deepClone(prop));
  const clone = Object.create(Object.getPrototypeOf(obj));
  for (const key of Object.keys(obj)) {
    clone[key] = deepClone(obj[key]);
  }
  return clone;
}
function deepFreeze(obj) {
  if (obj === null || typeof obj !== "object")
    return obj;
  if (Object.isFrozen(obj))
    return obj;
  Object.freeze(obj);
  if (Array.isArray(obj)) {
    for (const elem of obj)
      deepFreeze(elem);
  } else {
    for (const elem of Object.values(obj))
      deepFreeze(elem);
  }
  return obj;
}
function levenshtein(s, t, l) {
  const d = [];
  const n = s.length;
  const m = t.length;
  if (n === 0)
    return m;
  if (m === 0)
    return n;
  if (l && Math.abs(m - n) > l)
    return Math.abs(m - n);
  for (let i = n; i >= 0; i--)
    d[i] = [];
  for (let i = n; i >= 0; i--)
    d[i][0] = i;
  for (let j = m; j >= 0; j--)
    d[0][j] = j;
  for (let i = 1; i <= n; i++) {
    const si = s.charAt(i - 1);
    for (let j = 1; j <= m; j++) {
      if (i === j && d[i][j] > 4)
        return n;
      const tj = t.charAt(j - 1);
      const cost = si === tj ? 0 : 1;
      let mi = d[i - 1][j] + 1;
      const b = d[i][j - 1] + 1;
      const c = d[i - 1][j - 1] + cost;
      if (b < mi)
        mi = b;
      if (c < mi)
        mi = c;
      d[i][j] = mi;
    }
  }
  return d[n][m];
}
function waitUntil(time) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), time - Date.now());
  });
}
function parseExactInt(str) {
  if (!/^-?(0|[1-9][0-9]*)$/.test(str))
    return NaN;
  return parseInt(str);
}
function formatSQLArray(arr, args) {
  args?.push(...arr);
  return [..."?".repeat(arr.length)].join(", ");
}
class Multiset extends Map {
  add(key) {
    this.set(key, (this.get(key) ?? 0) + 1);
    return this;
  }
  remove(key) {
    const newValue = (this.get(key) ?? 0) - 1;
    if (newValue <= 0)
      return this.delete(key);
    this.set(key, newValue);
    return true;
  }
}
const Utils = {
  parseExactInt,
  waitUntil,
  html,
  escapeHTML,
  compare,
  sortBy,
  levenshtein,
  shuffle,
  deepClone,
  clearRequireCache,
  randomElement,
  forceWrap,
  splitFirst,
  stripHTML,
  visualize,
  getString,
  escapeRegex,
  formatSQLArray,
  Multiset
};
//# sourceMappingURL=utils.js.map
