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
var repl_exports = {};
__export(repl_exports, {
  Repl: () => Repl
});
module.exports = __toCommonJS(repl_exports);
var fs = __toESM(require("fs"));
var net = __toESM(require("net"));
var path = __toESM(require("path"));
var repl = __toESM(require("repl"));
var import_crashlogger = require("./crashlogger");
var import_fs = require("./fs");
/**
 * REPL
 *
 * Documented in logs/repl/README.md
 * https://github.com/smogon/pokemon-showdown/blob/master/logs/repl/README.md
 *
 * @author kota
 * @license MIT
 */
const Repl = new class {
  constructor() {
    /**
     * Contains the pathnames of all active REPL sockets.
     */
    this.socketPathnames = /* @__PURE__ */ new Set();
    this.listenersSetup = false;
  }
  setupListeners(filename) {
    if (Repl.listenersSetup)
      return;
    Repl.listenersSetup = true;
    process.once("exit", (code) => {
      for (const s of Repl.socketPathnames) {
        try {
          fs.unlinkSync(s);
        } catch {
        }
      }
      if (code === 129 || code === 130) {
        process.exitCode = 0;
      }
    });
    if (!process.listeners("SIGHUP").length) {
      process.once("SIGHUP", () => process.exit(128 + 1));
    }
    if (!process.listeners("SIGINT").length) {
      process.once("SIGINT", () => process.exit(128 + 2));
    }
    global.heapdump = (targetPath) => {
      if (!targetPath)
        targetPath = `${filename}-${new Date().toISOString()}`;
      let handler;
      try {
        handler = require("node-oom-heapdump")();
      } catch (e) {
        if (e.code !== "MODULE_NOT_FOUND")
          throw e;
        throw new Error(`node-oom-heapdump is not installed. Run \`npm install --no-save node-oom-heapdump\` and try again.`);
      }
      return handler.createHeapSnapshot(targetPath);
    };
  }
  /**
   * Delete old sockets in the REPL directory (presumably from a crashed
   * previous launch of PS).
   *
   * Does everything synchronously, so that the directory is guaranteed
   * clean and ready for new REPL sockets by the time this function returns.
   */
  cleanup() {
    const config = typeof Config !== "undefined" ? Config : {};
    if (!config.repl)
      return;
    const directory = path.dirname(
      path.resolve(import_fs.FS.ROOT_PATH, config.replsocketprefix || "logs/repl", "app")
    );
    let files;
    try {
      files = fs.readdirSync(directory);
    } catch {
    }
    if (files) {
      for (const file of files) {
        const pathname = path.resolve(directory, file);
        const stat = fs.statSync(pathname);
        if (!stat.isSocket())
          continue;
        const socket = net.connect(pathname, () => {
          socket.end();
          socket.destroy();
        }).on("error", () => {
          fs.unlinkSync(pathname);
        });
      }
    }
  }
  /**
   * Starts a REPL server, using a UNIX socket for IPC. The eval function
   * parametre is passed in because there is no other way to access a file's
   * non-global context.
   */
  start(filename, evalFunction) {
    const config = typeof Config !== "undefined" ? Config : {};
    if (!config.repl)
      return;
    Repl.setupListeners(filename);
    const server = net.createServer((socket) => {
      repl.start({
        input: socket,
        output: socket,
        eval(cmd, context, unusedFilename, callback) {
          try {
            return callback(null, evalFunction(cmd));
          } catch (e) {
            return callback(e, void 0);
          }
        }
      }).on("exit", () => socket.end());
      socket.on("error", () => socket.destroy());
    });
    const pathname = path.resolve(import_fs.FS.ROOT_PATH, Config.replsocketprefix || "logs/repl", filename);
    try {
      server.listen(pathname, () => {
        fs.chmodSync(pathname, Config.replsocketmode || 384);
        Repl.socketPathnames.add(pathname);
      });
      server.once("error", (err) => {
        server.close();
        if (err.code === "EADDRINUSE") {
          fs.unlink(pathname, (_err) => {
            if (_err && _err.code !== "ENOENT") {
              (0, import_crashlogger.crashlogger)(_err, `REPL: ${filename}`);
            }
          });
        } else if (err.code === "EACCES") {
          if (process.platform !== "win32") {
            console.error(`Could not start REPL server "${filename}": Your filesystem doesn't support Unix sockets (everything else will still work)`);
          }
        } else {
          (0, import_crashlogger.crashlogger)(err, `REPL: ${filename}`);
        }
      });
      server.once("close", () => {
        Repl.socketPathnames.delete(pathname);
      });
    } catch (err) {
      console.error(`Could not start REPL server "${filename}": ${err}`);
    }
  }
}();
//# sourceMappingURL=repl.js.map
