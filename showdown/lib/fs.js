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
var fs_exports = {};
__export(fs_exports, {
  FS: () => FS,
  FSPath: () => FSPath
});
module.exports = __toCommonJS(fs_exports);
var fs = __toESM(require("fs"));
var pathModule = __toESM(require("path"));
var import_streams = require("./streams");
/**
 * FS
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * An abstraction layer around Node's filesystem.
 *
 * Advantages:
 * - write() etc do nothing in unit tests
 * - paths are always relative to PS's base directory
 * - Promises (seriously wtf Node Core what are you thinking)
 * - PS-style API: FS("foo.txt").write("bar") for easier argument order
 * - mkdirp
 *
 * FS is used nearly everywhere, but exceptions include:
 * - crashlogger.js - in case the crash is in here
 * - repl.js - which use Unix sockets out of this file's scope
 * - launch script - happens before modules are loaded
 * - sim/ - intended to be self-contained
 *
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */
const DIST = `${pathModule.sep}dist${pathModule.sep}`;
const ROOT_PATH = pathModule.resolve(__dirname, __dirname.includes(DIST) ? ".." : "", "..");
if (!global.__fsState) {
  global.__fsState = {
    pendingUpdates: /* @__PURE__ */ new Map()
  };
}
class FSPath {
  constructor(path) {
    this.path = pathModule.resolve(ROOT_PATH, path);
  }
  parentDir() {
    return new FSPath(pathModule.dirname(this.path));
  }
  read(options = "utf8") {
    if (typeof options !== "string" && options.encoding === void 0) {
      options.encoding = "utf8";
    }
    return new Promise((resolve, reject) => {
      fs.readFile(this.path, options, (err, data) => {
        err ? reject(err) : resolve(data);
      });
    });
  }
  readSync(options = "utf8") {
    if (typeof options !== "string" && options.encoding === void 0) {
      options.encoding = "utf8";
    }
    return fs.readFileSync(this.path, options);
  }
  readBuffer(options = {}) {
    return new Promise((resolve, reject) => {
      fs.readFile(this.path, options, (err, data) => {
        err ? reject(err) : resolve(data);
      });
    });
  }
  readBufferSync(options = {}) {
    return fs.readFileSync(this.path, options);
  }
  exists() {
    return new Promise((resolve) => {
      fs.exists(this.path, (exists) => {
        resolve(exists);
      });
    });
  }
  existsSync() {
    return fs.existsSync(this.path);
  }
  readIfExists() {
    return new Promise((resolve, reject) => {
      fs.readFile(this.path, "utf8", (err, data) => {
        if (err && err.code === "ENOENT")
          return resolve("");
        err ? reject(err) : resolve(data);
      });
    });
  }
  readIfExistsSync() {
    try {
      return fs.readFileSync(this.path, "utf8");
    } catch (err) {
      if (err.code !== "ENOENT")
        throw err;
    }
    return "";
  }
  write(data, options = {}) {
    if (global.Config?.nofswriting)
      return Promise.resolve();
    return new Promise((resolve, reject) => {
      fs.writeFile(this.path, data, options, (err) => {
        err ? reject(err) : resolve();
      });
    });
  }
  writeSync(data, options = {}) {
    if (global.Config?.nofswriting)
      return;
    return fs.writeFileSync(this.path, data, options);
  }
  /**
   * Writes to a new file before renaming to replace an old file. If
   * the process crashes while writing, the old file won't be lost.
   * Does not protect against simultaneous writing; use writeUpdate
   * for that.
   */
  async safeWrite(data, options = {}) {
    await FS(this.path + ".NEW").write(data, options);
    await FS(this.path + ".NEW").rename(this.path);
  }
  safeWriteSync(data, options = {}) {
    FS(this.path + ".NEW").writeSync(data, options);
    FS(this.path + ".NEW").renameSync(this.path);
  }
  /**
   * Safest way to update a file with in-memory state. Pass a callback
   * that fetches the data to be written. It will write an update,
   * avoiding race conditions. The callback may not necessarily be
   * called, if `writeUpdate` is called many times in a short period.
   *
   * `options.throttle`, if it exists, will make sure updates are not
   * written more than once every `options.throttle` milliseconds.
   *
   * No synchronous version because there's no risk of race conditions
   * with synchronous code; just use `safeWriteSync`.
   */
  writeUpdate(dataFetcher, options = {}) {
    if (global.Config?.nofswriting)
      return;
    const pendingUpdate = __fsState.pendingUpdates.get(this.path);
    const throttleTime = options.throttle ? Date.now() + options.throttle : 0;
    if (pendingUpdate) {
      pendingUpdate.pendingDataFetcher = dataFetcher;
      pendingUpdate.pendingOptions = options;
      if (pendingUpdate.throttleTimer && throttleTime < pendingUpdate.throttleTime) {
        pendingUpdate.throttleTime = throttleTime;
        clearTimeout(pendingUpdate.throttleTimer);
        pendingUpdate.throttleTimer = setTimeout(() => this.checkNextUpdate(), throttleTime - Date.now());
      }
      return;
    }
    if (!throttleTime) {
      this.writeUpdateNow(dataFetcher, options);
      return;
    }
    const update = {
      isWriting: false,
      pendingDataFetcher: dataFetcher,
      pendingOptions: options,
      throttleTime,
      throttleTimer: setTimeout(() => this.checkNextUpdate(), throttleTime - Date.now())
    };
    __fsState.pendingUpdates.set(this.path, update);
  }
  writeUpdateNow(dataFetcher, options) {
    const throttleTime = options.throttle ? Date.now() + options.throttle : 0;
    const update = {
      isWriting: true,
      pendingDataFetcher: null,
      pendingOptions: null,
      throttleTime,
      throttleTimer: null
    };
    __fsState.pendingUpdates.set(this.path, update);
    void this.safeWrite(dataFetcher(), options).then(() => this.finishUpdate());
  }
  checkNextUpdate() {
    const pendingUpdate = __fsState.pendingUpdates.get(this.path);
    if (!pendingUpdate)
      throw new Error(`FS: Pending update not found`);
    if (pendingUpdate.isWriting)
      throw new Error(`FS: Conflicting update`);
    const { pendingDataFetcher: dataFetcher, pendingOptions: options } = pendingUpdate;
    if (!dataFetcher || !options) {
      __fsState.pendingUpdates.delete(this.path);
      return;
    }
    this.writeUpdateNow(dataFetcher, options);
  }
  finishUpdate() {
    const pendingUpdate = __fsState.pendingUpdates.get(this.path);
    if (!pendingUpdate)
      throw new Error(`FS: Pending update not found`);
    if (!pendingUpdate.isWriting)
      throw new Error(`FS: Conflicting update`);
    pendingUpdate.isWriting = false;
    const throttleTime = pendingUpdate.throttleTime;
    if (!throttleTime || throttleTime < Date.now()) {
      this.checkNextUpdate();
      return;
    }
    pendingUpdate.throttleTimer = setTimeout(() => this.checkNextUpdate(), throttleTime - Date.now());
  }
  append(data, options = {}) {
    if (global.Config?.nofswriting)
      return Promise.resolve();
    return new Promise((resolve, reject) => {
      fs.appendFile(this.path, data, options, (err) => {
        err ? reject(err) : resolve();
      });
    });
  }
  appendSync(data, options = {}) {
    if (global.Config?.nofswriting)
      return;
    return fs.appendFileSync(this.path, data, options);
  }
  symlinkTo(target) {
    if (global.Config?.nofswriting)
      return Promise.resolve();
    return new Promise((resolve, reject) => {
      fs.symlink(target, this.path, (err) => {
        err ? reject(err) : resolve();
      });
    });
  }
  symlinkToSync(target) {
    if (global.Config?.nofswriting)
      return;
    return fs.symlinkSync(target, this.path);
  }
  copyFile(dest) {
    if (global.Config?.nofswriting)
      return Promise.resolve();
    return new Promise((resolve, reject) => {
      fs.copyFile(this.path, dest, (err) => {
        err ? reject(err) : resolve();
      });
    });
  }
  rename(target) {
    if (global.Config?.nofswriting)
      return Promise.resolve();
    return new Promise((resolve, reject) => {
      fs.rename(this.path, target, (err) => {
        err ? reject(err) : resolve();
      });
    });
  }
  renameSync(target) {
    if (global.Config?.nofswriting)
      return;
    return fs.renameSync(this.path, target);
  }
  readdir() {
    return new Promise((resolve, reject) => {
      fs.readdir(this.path, (err, data) => {
        err ? reject(err) : resolve(data);
      });
    });
  }
  readdirSync() {
    return fs.readdirSync(this.path);
  }
  async readdirIfExists() {
    if (await this.exists())
      return this.readdir();
    return Promise.resolve([]);
  }
  readdirIfExistsSync() {
    if (this.existsSync())
      return this.readdirSync();
    return [];
  }
  createReadStream() {
    return new FileReadStream(this.path);
  }
  createWriteStream(options = {}) {
    if (global.Config?.nofswriting) {
      return new import_streams.WriteStream({ write() {
      } });
    }
    return new import_streams.WriteStream(fs.createWriteStream(this.path, options));
  }
  createAppendStream(options = {}) {
    if (global.Config?.nofswriting) {
      return new import_streams.WriteStream({ write() {
      } });
    }
    options.flags = options.flags || "a";
    return new import_streams.WriteStream(fs.createWriteStream(this.path, options));
  }
  unlinkIfExists() {
    if (global.Config?.nofswriting)
      return Promise.resolve();
    return new Promise((resolve, reject) => {
      fs.unlink(this.path, (err) => {
        if (err && err.code === "ENOENT")
          return resolve();
        err ? reject(err) : resolve();
      });
    });
  }
  unlinkIfExistsSync() {
    if (global.Config?.nofswriting)
      return;
    try {
      fs.unlinkSync(this.path);
    } catch (err) {
      if (err.code !== "ENOENT")
        throw err;
    }
  }
  async rmdir(recursive) {
    if (global.Config?.nofswriting)
      return Promise.resolve();
    return new Promise((resolve, reject) => {
      fs.rmdir(this.path, { recursive }, (err) => {
        err ? reject(err) : resolve();
      });
    });
  }
  rmdirSync(recursive) {
    if (global.Config?.nofswriting)
      return;
    return fs.rmdirSync(this.path, { recursive });
  }
  mkdir(mode = 493) {
    if (global.Config?.nofswriting)
      return Promise.resolve();
    return new Promise((resolve, reject) => {
      fs.mkdir(this.path, mode, (err) => {
        err ? reject(err) : resolve();
      });
    });
  }
  mkdirSync(mode = 493) {
    if (global.Config?.nofswriting)
      return;
    return fs.mkdirSync(this.path, mode);
  }
  mkdirIfNonexistent(mode = 493) {
    if (global.Config?.nofswriting)
      return Promise.resolve();
    return new Promise((resolve, reject) => {
      fs.mkdir(this.path, mode, (err) => {
        if (err && err.code === "EEXIST")
          return resolve();
        err ? reject(err) : resolve();
      });
    });
  }
  mkdirIfNonexistentSync(mode = 493) {
    if (global.Config?.nofswriting)
      return;
    try {
      fs.mkdirSync(this.path, mode);
    } catch (err) {
      if (err.code !== "EEXIST")
        throw err;
    }
  }
  /**
   * Creates the directory (and any parent directories if necessary).
   * Does not throw if the directory already exists.
   */
  async mkdirp(mode = 493) {
    try {
      await this.mkdirIfNonexistent(mode);
    } catch (err) {
      if (err.code !== "ENOENT")
        throw err;
      await this.parentDir().mkdirp(mode);
      await this.mkdirIfNonexistent(mode);
    }
  }
  /**
   * Creates the directory (and any parent directories if necessary).
   * Does not throw if the directory already exists. Synchronous.
   */
  mkdirpSync(mode = 493) {
    try {
      this.mkdirIfNonexistentSync(mode);
    } catch (err) {
      if (err.code !== "ENOENT")
        throw err;
      this.parentDir().mkdirpSync(mode);
      this.mkdirIfNonexistentSync(mode);
    }
  }
  /** Calls the callback if the file is modified. */
  onModify(callback) {
    fs.watchFile(this.path, (curr, prev) => {
      if (curr.mtime > prev.mtime)
        return callback();
    });
  }
  /** Clears callbacks added with onModify(). */
  unwatch() {
    fs.unwatchFile(this.path);
  }
  async isFile() {
    return new Promise((resolve, reject) => {
      fs.stat(this.path, (err, stats) => {
        err ? reject(err) : resolve(stats.isFile());
      });
    });
  }
  isFileSync() {
    return fs.statSync(this.path).isFile();
  }
  async isDirectory() {
    return new Promise((resolve, reject) => {
      fs.stat(this.path, (err, stats) => {
        err ? reject(err) : resolve(stats.isDirectory());
      });
    });
  }
  isDirectorySync() {
    return fs.statSync(this.path).isDirectory();
  }
  async realpath() {
    return new Promise((resolve, reject) => {
      fs.realpath(this.path, (err, path) => {
        err ? reject(err) : resolve(path);
      });
    });
  }
  realpathSync() {
    return fs.realpathSync(this.path);
  }
}
class FileReadStream extends import_streams.ReadStream {
  constructor(file) {
    super();
    this.fd = new Promise((resolve, reject) => {
      fs.open(file, "r", (err, fd) => err ? reject(err) : resolve(fd));
    });
    this.atEOF = false;
  }
  _read(size = 16384) {
    return new Promise((resolve, reject) => {
      if (this.atEOF)
        return resolve();
      this.ensureCapacity(size);
      void this.fd.then((fd) => {
        fs.read(fd, this.buf, this.bufEnd, size, null, (err, bytesRead, buf) => {
          if (err)
            return reject(err);
          if (!bytesRead) {
            this.atEOF = true;
            this.resolvePush();
            return resolve();
          }
          this.bufEnd += bytesRead;
          this.resolvePush();
          resolve();
        });
      });
    });
  }
  _destroy() {
    return new Promise((resolve) => {
      void this.fd.then((fd) => {
        fs.close(fd, () => resolve());
      });
    });
  }
}
function getFs(path) {
  return new FSPath(path);
}
const FS = Object.assign(getFs, {
  FileReadStream,
  FSPath,
  ROOT_PATH
});
//# sourceMappingURL=fs.js.map
