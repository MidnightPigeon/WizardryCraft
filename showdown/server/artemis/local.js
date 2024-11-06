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
var local_exports = {};
__export(local_exports, {
  LocalClassifier: () => LocalClassifier,
  PM: () => PM
});
module.exports = __toCommonJS(local_exports);
var child_process = __toESM(require("child_process"));
var import_lib = require("../../lib");
var import_config_loader = require("../config-loader");
var import_dex_data = require("../../sim/dex-data");
class ArtemisStream extends import_lib.Streams.ObjectReadWriteStream {
  constructor() {
    super();
    this.tasks = /* @__PURE__ */ new Set();
    this.process = child_process.spawn("python3", [
      "-u",
      (0, import_lib.FS)("server/artemis/model.py").path,
      import_config_loader.Config.debugartemisprocesses ? "debug" : ""
    ].filter(Boolean));
    this.listen();
  }
  listen() {
    this.process.stdout.setEncoding("utf8");
    this.process.stderr.setEncoding("utf8");
    this.process.stdout.on("data", (data) => {
      data = data.trim();
      const [taskId, dataStr] = data.split("|");
      if (this.tasks.has(taskId)) {
        this.tasks.delete(taskId);
        return this.push(`${taskId}
${dataStr}`);
      }
      if (taskId === "error") {
        const info = JSON.parse(dataStr);
        Monitor.crashlog(new Error(info.error), "An Artemis script", info);
        try {
          this.pushEnd();
          this.process.disconnect();
        } catch {
        }
      }
    });
    this.process.stderr.on("data", (data) => {
      if (/Downloading: ([0-9]+)%/i.test(data)) {
        return;
      }
      Monitor.crashlog(new Error(data), "An Artemis process");
    });
    this.process.on("error", (err) => {
      Monitor.crashlog(err, "An Artemis process");
      this.pushEnd();
    });
    this.process.on("close", () => {
      this.pushEnd();
    });
  }
  _write(chunk) {
    const [taskId, message] = import_lib.Utils.splitFirst(chunk, "\n");
    this.tasks.add(taskId);
    this.process.stdin.write(`${taskId}|${message}
`);
  }
  destroy() {
    try {
      this.process.kill();
    } catch {
    }
    this.pushEnd();
  }
}
const PM = new import_lib.ProcessManager.StreamProcessManager(module, () => new ArtemisStream(), (message) => {
  if (message.startsWith("SLOW\n")) {
    Monitor.slow(message.slice(5));
  }
});
const _LocalClassifier = class {
  constructor() {
    this.enabled = false;
    this.requests = /* @__PURE__ */ new Map();
    this.lastTask = 0;
    this.readyPromise = null;
    _LocalClassifier.classifiers.push(this);
    void this.setupProcesses();
  }
  static destroy() {
    for (const classifier of this.classifiers)
      void classifier.destroy();
    return this.PM.destroy();
  }
  async setupProcesses() {
    this.readyPromise = new Promise((resolve) => {
      child_process.exec('python3 -c "import detoxify"', (err, out, stderr) => {
        if (err || stderr) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
    const res = await this.readyPromise;
    this.enabled = res;
    this.readyPromise = null;
    if (res) {
      this.stream = PM.createStream();
      void this.listen();
    }
  }
  async listen() {
    if (!this.stream)
      return null;
    for await (const chunk of this.stream) {
      const [rawTaskId, data] = import_lib.Utils.splitFirst(chunk, "\n");
      const task = parseInt(rawTaskId);
      const resolver = this.requests.get(task);
      if (resolver) {
        resolver(JSON.parse(data));
        this.requests.delete(task);
      }
    }
  }
  destroy() {
    _LocalClassifier.classifiers.splice(_LocalClassifier.classifiers.indexOf(this), 1);
    return this.stream?.destroy();
  }
  async classify(text) {
    if (this.readyPromise)
      await this.readyPromise;
    if (!this.stream)
      return null;
    const taskId = this.lastTask++;
    const data = await new Promise((resolve) => {
      this.requests.set(taskId, resolve);
      void this.stream?.write(`${taskId}
${text}`);
    });
    for (const k in data) {
      data[k] = parseFloat(data[k]);
    }
    return data;
  }
};
let LocalClassifier = _LocalClassifier;
LocalClassifier.PM = PM;
LocalClassifier.ATTRIBUTES = {
  sexual_explicit: {},
  severe_toxicity: {},
  toxicity: {},
  obscene: {},
  identity_attack: {},
  insult: {},
  threat: {}
};
LocalClassifier.classifiers = [];
if (require.main === module) {
  global.Config = import_config_loader.Config;
  global.Monitor = {
    crashlog(error, source = "A local Artemis child process", details = null) {
      const repr = JSON.stringify([error.name, error.message, source, details]);
      process.send(`THROW
@!!@${repr}
${error.stack}`);
    },
    slow(text) {
      process.send(`CALLBACK
SLOW
${text}`);
    }
  };
  global.toID = import_dex_data.toID;
  process.on("uncaughtException", (err) => {
    if (import_config_loader.Config.crashguard) {
      Monitor.crashlog(err, "A local Artemis child process");
    }
  });
  import_lib.Repl.start(`abusemonitor-local-${process.pid}`, (cmd) => eval(cmd));
} else if (!process.send) {
  PM.spawn(import_config_loader.Config.localartemisprocesses || 1);
}
//# sourceMappingURL=local.js.map
