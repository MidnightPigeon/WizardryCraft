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
var loginserver_exports = {};
__export(loginserver_exports, {
  LoginServer: () => LoginServer
});
module.exports = __toCommonJS(loginserver_exports);
var import_lib = require("../lib");
/**
 * Login server abstraction layer
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * This file handles communicating with the login server.
 *
 * @license MIT
 */
const LOGIN_SERVER_TIMEOUT = 3e4;
const LOGIN_SERVER_BATCH_TIME = 1e3;
class TimeoutError extends Error {
}
TimeoutError.prototype.name = TimeoutError.name;
function parseJSON(json) {
  if (json.startsWith("]"))
    json = json.substr(1);
  const data = { error: null, json: null };
  try {
    data.json = JSON.parse(json);
  } catch (err) {
    data.error = err.message;
  }
  return data;
}
class LoginServerInstance {
  constructor() {
    this.uri = Config.loginserver;
    this.requestQueue = [];
    this.requestTimer = null;
    this.requestLog = "";
    this.lastRequest = 0;
    this.openRequests = 0;
    this.disabled = false;
  }
  async instantRequest(action, data = null) {
    if (this.openRequests > 5) {
      return Promise.resolve(
        [null, new RangeError("Request overflow")]
      );
    }
    this.openRequests++;
    try {
      const request = (0, import_lib.Net)(this.uri);
      const buffer = await request.get({
        query: {
          ...data,
          act: action,
          serverid: Config.serverid,
          servertoken: Config.servertoken,
          nocache: new Date().getTime()
        }
      });
      const json = parseJSON(buffer);
      this.openRequests--;
      if (json.error) {
        return [null, new Error(json.error)];
      }
      this.openRequests--;
      return [json.json, null];
    } catch (error) {
      this.openRequests--;
      return [null, error];
    }
  }
  request(action, data = null) {
    if (this.disabled) {
      return Promise.resolve(
        [null, new Error(`Login server connection disabled.`)]
      );
    }
    if (this[action + "Server"]) {
      return this[action + "Server"].request(action, data);
    }
    const actionData = data || {};
    actionData.act = action;
    return new Promise((resolve) => {
      this.requestQueue.push([actionData, resolve]);
      this.requestTimerPoke();
    });
  }
  requestTimerPoke() {
    if (this.openRequests || this.requestTimer || !this.requestQueue.length)
      return;
    this.requestTimer = setTimeout(() => void this.makeRequests(), LOGIN_SERVER_BATCH_TIME);
  }
  async makeRequests() {
    this.requestTimer = null;
    const requests = this.requestQueue;
    this.requestQueue = [];
    if (!requests.length)
      return;
    const resolvers = [];
    const dataList = [];
    for (const [data, resolve] of requests) {
      resolvers.push(resolve);
      dataList.push(data);
    }
    this.requestStart(requests.length);
    try {
      const request = (0, import_lib.Net)(`${this.uri}action.php`);
      let buffer = await request.post({
        body: {
          serverid: Config.serverid,
          servertoken: Config.servertoken,
          nocache: new Date().getTime(),
          json: JSON.stringify(dataList)
        },
        timeout: LOGIN_SERVER_TIMEOUT
      });
      const data = parseJSON(buffer).json;
      if (buffer.startsWith(`[{"actionsuccess":true,`)) {
        buffer = "stream interrupt";
      }
      if (!data) {
        if (buffer.includes("<"))
          buffer = "invalid response";
        throw new Error(buffer);
      }
      for (const [i, resolve] of resolvers.entries()) {
        resolve([data[i], null]);
      }
      this.requestEnd();
    } catch (error) {
      for (const resolve of resolvers) {
        resolve([null, error]);
      }
      this.requestEnd(error);
    }
  }
  requestStart(size) {
    this.lastRequest = Date.now();
    this.requestLog += " | " + size + " rqs: ";
    this.openRequests++;
  }
  requestEnd(error) {
    this.openRequests = 0;
    if (error && error instanceof TimeoutError) {
      this.requestLog += "TIMEOUT";
    } else {
      this.requestLog += "" + (Date.now() - this.lastRequest) / 1e3 + "s";
    }
    this.requestLog = this.requestLog.substr(-1e3);
    this.requestTimerPoke();
  }
  getLog() {
    if (!this.lastRequest)
      return this.requestLog;
    return `${this.requestLog} (${Chat.toDurationString(Date.now() - this.lastRequest)} since last request)`;
  }
}
const LoginServer = Object.assign(new LoginServerInstance(), {
  TimeoutError,
  ladderupdateServer: new LoginServerInstance(),
  prepreplayServer: new LoginServerInstance()
});
(0, import_lib.FS)("./config/custom.css").onModify(() => {
  void LoginServer.request("invalidatecss");
});
if (!Config.nofswriting) {
  void LoginServer.request("invalidatecss");
}
//# sourceMappingURL=loginserver.js.map
