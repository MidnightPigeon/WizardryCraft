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
var remote_exports = {};
__export(remote_exports, {
  ATTRIBUTES: () => ATTRIBUTES,
  Limiter: () => Limiter,
  PM: () => PM,
  RemoteClassifier: () => RemoteClassifier,
  limiter: () => limiter
});
module.exports = __toCommonJS(remote_exports);
var import_lib = require("../../lib");
var import_config_loader = require("../config-loader");
var import_dex_data = require("../../sim/dex-data");
const PM_TIMEOUT = 20 * 60 * 1e3;
const ATTRIBUTES = {
  "SEVERE_TOXICITY": {},
  "TOXICITY": {},
  "IDENTITY_ATTACK": {},
  "INSULT": {},
  "PROFANITY": {},
  "THREAT": {},
  "SEXUALLY_EXPLICIT": {},
  "FLIRTATION": {}
};
function time() {
  return Math.floor(Math.floor(Date.now() / 1e3) / 60);
}
class Limiter {
  constructor(max) {
    this.lastTick = time();
    this.count = 0;
    this.max = max;
  }
  shouldRequest() {
    const now = time();
    if (this.lastTick !== now) {
      this.count = 0;
      this.lastTick = now;
    }
    this.count++;
    return this.count < this.max;
  }
}
function isCommon(message) {
  message = message.toLowerCase().replace(/\?!\., ;:/g, "");
  return ["gg", "wp", "ggwp", "gl", "hf", "glhf", "hello"].includes(message);
}
let throttleTime = null;
const limiter = new Limiter(800);
const PM = new import_lib.ProcessManager.QueryProcessManager(module, async (text) => {
  if (isCommon(text) || !limiter.shouldRequest())
    return null;
  if (throttleTime && Date.now() - throttleTime < 1e4) {
    return null;
  }
  if (throttleTime)
    throttleTime = null;
  const requestData = {
    // todo - support 'es', 'it', 'pt', 'fr' - use user.language? room.settings.language...?
    languages: ["en"],
    requestedAttributes: ATTRIBUTES,
    comment: { text }
  };
  try {
    const raw = await (0, import_lib.Net)(`https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze`).post({
      query: {
        key: import_config_loader.Config.perspectiveKey
      },
      body: JSON.stringify(requestData),
      headers: {
        "Content-Type": "application/json"
      },
      timeout: 10 * 1e3
      // 10s
    });
    if (!raw)
      return null;
    const data = JSON.parse(raw);
    if (data.error)
      throw new Error(data.message);
    const result = {};
    for (const k in data.attributeScores) {
      const score = data.attributeScores[k];
      result[k] = score.summaryScore.value;
    }
    return result;
  } catch (e) {
    throttleTime = Date.now();
    if (e.message.startsWith("Request timeout")) {
      return null;
    }
    Monitor.crashlog(e, "A Perspective API request", { request: JSON.stringify(requestData) });
    return null;
  }
}, PM_TIMEOUT);
if (require.main === module) {
  global.Config = import_config_loader.Config;
  global.Monitor = {
    crashlog(error, source = "A remote Artemis child process", details = null) {
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
      Monitor.crashlog(err, "A remote Artemis child process");
    }
  });
  import_lib.Repl.start(`abusemonitor-remote-${process.pid}`, (cmd) => eval(cmd));
} else if (!process.send) {
  PM.spawn(import_config_loader.Config.remoteartemisprocesses || 1);
}
class RemoteClassifier {
  classify(text) {
    if (!import_config_loader.Config.perspectiveKey)
      return Promise.resolve(null);
    return PM.query(text);
  }
  async suggestScore(text, data) {
    if (!import_config_loader.Config.perspectiveKey)
      return Promise.resolve(null);
    const body = {
      comment: { text },
      attributeScores: {}
    };
    for (const k in data) {
      body.attributeScores[k] = { summaryScore: { value: data[k] } };
    }
    try {
      const raw = await (0, import_lib.Net)(`https://commentanalyzer.googleapis.com/v1alpha1/comments:suggestscore`).post({
        query: {
          key: import_config_loader.Config.perspectiveKey
        },
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json"
        },
        timeout: 10 * 1e3
        // 10s
      });
      return JSON.parse(raw);
    } catch (e) {
      return { error: e.message };
    }
  }
  destroy() {
    return PM.destroy();
  }
  respawn() {
    return PM.respawn();
  }
  spawn(number) {
    PM.spawn(number);
  }
  getActiveProcesses() {
    return PM.processes.length;
  }
}
RemoteClassifier.PM = PM;
RemoteClassifier.ATTRIBUTES = ATTRIBUTES;
//# sourceMappingURL=remote.js.map
