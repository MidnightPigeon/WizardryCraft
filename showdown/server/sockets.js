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
var sockets_exports = {};
__export(sockets_exports, {
  PM: () => PM,
  ServerStream: () => ServerStream,
  Sockets: () => Sockets
});
module.exports = __toCommonJS(sockets_exports);
var fs = __toESM(require("fs"));
var http = __toESM(require("http"));
var https = __toESM(require("https"));
var path = __toESM(require("path"));
var import_lib = require("../lib");
var import_ip_tools = require("./ip-tools");
var import_battle = require("../sim/battle");
/**
 * Connections
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * Abstraction layer for multi-process SockJS connections.
 *
 * This file handles all the communications between the users'
 * browsers, the networking processes, and users.ts in the
 * main process.
 *
 * @license MIT
 */
const Sockets = new class {
  async onSpawn(worker) {
    const id = worker.workerid;
    for await (const data2 of worker.stream) {
      switch (data2.charAt(0)) {
        case "*": {
          worker.load++;
          const [socketid, ip, protocol] = data2.substr(1).split("\n");
          Users.socketConnect(worker, id, socketid, ip, protocol);
          break;
        }
        case "!": {
          worker.load--;
          const socketid = data2.substr(1);
          Users.socketDisconnect(worker, id, socketid);
          break;
        }
        case "<": {
          const idx = data2.indexOf("\n");
          const socketid = data2.substr(1, idx - 1);
          const message = data2.substr(idx + 1);
          Users.socketReceive(worker, id, socketid, message);
          break;
        }
        default:
      }
    }
  }
  onUnspawn(worker) {
    Users.socketDisconnectAll(worker, worker.workerid);
  }
  listen(port, bindAddress, workerCount) {
    if (port !== void 0 && !isNaN(port)) {
      Config.port = port;
      Config.ssl = null;
    } else {
      port = Config.port;
      try {
        const cloudenv = require("cloud-env");
        bindAddress = cloudenv.get("IP", bindAddress);
        port = cloudenv.get("PORT", port);
      } catch {
      }
    }
    if (bindAddress !== void 0) {
      Config.bindaddress = bindAddress;
    }
    if (port !== void 0) {
      Config.port = port;
    }
    if (workerCount === void 0) {
      workerCount = Config.workers !== void 0 ? Config.workers : 1;
    }
    PM.env = { PSPORT: Config.port, PSBINDADDR: Config.bindaddress || "0.0.0.0", PSNOSSL: Config.ssl ? 0 : 1 };
    PM.subscribeSpawn((worker) => void this.onSpawn(worker));
    PM.subscribeUnspawn(this.onUnspawn);
    PM.spawn(workerCount);
  }
  socketSend(worker, socketid, message) {
    void worker.stream.write(`>${socketid}
${message}`);
  }
  socketDisconnect(worker, socketid) {
    void worker.stream.write(`!${socketid}`);
  }
  roomBroadcast(roomid, message) {
    for (const worker of PM.workers) {
      void worker.stream.write(`#${roomid}
${message}`);
    }
  }
  roomAdd(worker, roomid, socketid) {
    void worker.stream.write(`+${roomid}
${socketid}`);
  }
  roomRemove(worker, roomid, socketid) {
    void worker.stream.write(`-${roomid}
${socketid}`);
  }
  channelBroadcast(roomid, message) {
    for (const worker of PM.workers) {
      void worker.stream.write(`:${roomid}
${message}`);
    }
  }
  channelMove(worker, roomid, channelid, socketid) {
    void worker.stream.write(`.${roomid}
${channelid}
${socketid}`);
  }
  eval(worker, query) {
    void worker.stream.write(`$${query}`);
  }
}();
class ServerStream extends import_lib.Streams.ObjectReadWriteStream {
  constructor(config) {
    super();
    /** socketid:Connection */
    this.sockets = /* @__PURE__ */ new Map();
    /** roomid:socketid:Connection */
    this.rooms = /* @__PURE__ */ new Map();
    /** roomid:socketid:channelid */
    this.roomChannels = /* @__PURE__ */ new Map();
    this.socketCounter = 0;
    this.receivers = {
      "$"(data) {
        eval(data.substr(1));
      },
      "!"(data2) {
        const socketid = data2.substr(1);
        const socket = this.sockets.get(socketid);
        if (!socket)
          return;
        socket.destroy();
        this.sockets.delete(socketid);
        for (const [curRoomid, curRoom] of this.rooms) {
          curRoom.delete(socketid);
          const roomChannel = this.roomChannels.get(curRoomid);
          if (roomChannel)
            roomChannel.delete(socketid);
          if (!curRoom.size) {
            this.rooms.delete(curRoomid);
            if (roomChannel)
              this.roomChannels.delete(curRoomid);
          }
        }
      },
      ">"(data2) {
        const nlLoc = data2.indexOf("\n");
        const socketid = data2.substr(1, nlLoc - 1);
        const socket = this.sockets.get(socketid);
        if (!socket)
          return;
        const message = data2.substr(nlLoc + 1);
        socket.write(message);
      },
      "#"(data2) {
        const nlLoc = data2.indexOf("\n");
        const roomid = data2.substr(1, nlLoc - 1);
        const room = roomid ? this.rooms.get(roomid) : this.sockets;
        if (!room)
          return;
        const message = data2.substr(nlLoc + 1);
        for (const curSocket of room.values())
          curSocket.write(message);
      },
      "+"(data2) {
        const nlLoc = data2.indexOf("\n");
        const socketid = data2.substr(nlLoc + 1);
        const socket = this.sockets.get(socketid);
        if (!socket)
          return;
        const roomid = data2.substr(1, nlLoc - 1);
        let room = this.rooms.get(roomid);
        if (!room) {
          room = /* @__PURE__ */ new Map();
          this.rooms.set(roomid, room);
        }
        room.set(socketid, socket);
      },
      "-"(data2) {
        const nlLoc = data2.indexOf("\n");
        const roomid = data2.slice(1, nlLoc);
        const room = this.rooms.get(roomid);
        if (!room)
          return;
        const socketid = data2.slice(nlLoc + 1);
        room.delete(socketid);
        const roomChannel = this.roomChannels.get(roomid);
        if (roomChannel)
          roomChannel.delete(socketid);
        if (!room.size) {
          this.rooms.delete(roomid);
          if (roomChannel)
            this.roomChannels.delete(roomid);
        }
      },
      "."(data2) {
        const nlLoc = data2.indexOf("\n");
        const roomid = data2.slice(1, nlLoc);
        const nlLoc2 = data2.indexOf("\n", nlLoc + 1);
        const channelid = Number(data2.slice(nlLoc + 1, nlLoc2));
        const socketid = data2.slice(nlLoc2 + 1);
        let roomChannel = this.roomChannels.get(roomid);
        if (!roomChannel) {
          roomChannel = /* @__PURE__ */ new Map();
          this.roomChannels.set(roomid, roomChannel);
        }
        if (channelid === 0) {
          roomChannel.delete(socketid);
        } else {
          roomChannel.set(socketid, channelid);
        }
      },
      ":"(data2) {
        const nlLoc = data2.indexOf("\n");
        const roomid = data2.slice(1, nlLoc);
        const room = this.rooms.get(roomid);
        if (!room)
          return;
        const messages = [
          null,
          null,
          null,
          null,
          null
        ];
        const message = data2.substr(nlLoc + 1);
        const channelMessages = (0, import_battle.extractChannelMessages)(message, [0, 1, 2, 3, 4]);
        const roomChannel = this.roomChannels.get(roomid);
        for (const [curSocketid, curSocket] of room) {
          const channelid = roomChannel?.get(curSocketid) || 0;
          if (!messages[channelid])
            messages[channelid] = channelMessages[channelid].join("\n");
          curSocket.write(messages[channelid]);
        }
      }
    };
    if (!config.bindaddress)
      config.bindaddress = "0.0.0.0";
    this.isTrustedProxyIp = config.proxyip ? import_ip_tools.IPTools.checker(config.proxyip) : () => false;
    this.server = http.createServer();
    this.serverSsl = null;
    if (config.ssl) {
      let key;
      try {
        key = path.resolve(__dirname, config.ssl.options.key);
        if (!fs.statSync(key).isFile())
          throw new Error();
        try {
          key = fs.readFileSync(key);
        } catch (e) {
          (0, import_lib.crashlogger)(
            new Error(`Failed to read the configured SSL private key PEM file:
${e.stack}`),
            `Socket process ${process.pid}`
          );
        }
      } catch {
        console.warn("SSL private key config values will not support HTTPS server option values in the future. Please set it to use the absolute path of its PEM file.");
        key = config.ssl.options.key;
      }
      let cert;
      try {
        cert = path.resolve(__dirname, config.ssl.options.cert);
        if (!fs.statSync(cert).isFile())
          throw new Error();
        try {
          cert = fs.readFileSync(cert);
        } catch (e) {
          (0, import_lib.crashlogger)(
            new Error(`Failed to read the configured SSL certificate PEM file:
${e.stack}`),
            `Socket process ${process.pid}`
          );
        }
      } catch (e) {
        console.warn("SSL certificate config values will not support HTTPS server option values in the future. Please set it to use the absolute path of its PEM file.");
        cert = config.ssl.options.cert;
      }
      if (key && cert) {
        try {
          this.serverSsl = https.createServer({ ...config.ssl.options, key, cert });
        } catch (e) {
          (0, import_lib.crashlogger)(new Error(`The SSL settings are misconfigured:
${e.stack}`), `Socket process ${process.pid}`);
        }
      }
    }
    try {
      if (config.disablenodestatic)
        throw new Error("disablenodestatic");
      const StaticServer = require("node-static").Server;
      const roomidRegex = /^\/(?:[A-Za-z0-9][A-Za-z0-9-]*)\/?$/;
      const cssServer = new StaticServer("./config");
      const avatarServer = new StaticServer("./config/avatars");
      const staticServer = new StaticServer("./server/static");
      const staticRequestHandler = (req, res) => {
        req.resume();
        req.addListener("end", () => {
          if (config.customhttpresponse && config.customhttpresponse(req, res)) {
            return;
          }
          let server2 = staticServer;
          if (req.url) {
            if (req.url === "/custom.css") {
              server2 = cssServer;
            } else if (req.url.startsWith("/avatars/")) {
              req.url = req.url.substr(8);
              server2 = avatarServer;
            } else if (roomidRegex.test(req.url)) {
              req.url = "/";
            }
          }
          server2.serve(req, res, (e) => {
            if (e && e.status === 404) {
              staticServer.serveFile("404.html", 404, {}, req, res);
            }
          });
        });
      };
      this.server.on("request", staticRequestHandler);
      if (this.serverSsl)
        this.serverSsl.on("request", staticRequestHandler);
    } catch (e) {
      if (e.message === "disablenodestatic") {
        console.log("node-static is disabled");
      } else {
        console.log("Could not start node-static - try `npm install` if you want to use it");
      }
    }
    const sockjs = require("sockjs");
    const options = {
      sockjs_url: `//play.pokemonshowdown.com/js/lib/sockjs-1.4.0-nwjsfix.min.js`,
      prefix: "/showdown",
      log(severity, message) {
        if (severity === "error")
          console.log(`ERROR: ${message}`);
      }
    };
    if (config.wsdeflate !== null) {
      try {
        const deflate = require("permessage-deflate").configure(config.wsdeflate);
        options.faye_server_options = { extensions: [deflate] };
      } catch {
        (0, import_lib.crashlogger)(
          new Error("Dependency permessage-deflate is not installed or is otherwise unaccessable. No message compression will take place until server restart."),
          "Sockets"
        );
      }
    }
    const server = sockjs.createServer(options);
    process.once("disconnect", () => this.cleanup());
    process.once("exit", () => this.cleanup());
    server.on("connection", (connection) => this.onConnection(connection));
    server.installHandlers(this.server, {});
    this.server.listen(config.port, config.bindaddress);
    console.log(`Worker ${PM.workerid} now listening on ${config.bindaddress}:${config.port}`);
    if (this.serverSsl) {
      server.installHandlers(this.serverSsl, {});
      this.serverSsl.listen(config.ssl.port, config.bindaddress);
      console.log(`Worker ${PM.workerid} now listening for SSL on port ${config.ssl.port}`);
    }
    console.log(`Test your server at http://${config.bindaddress === "0.0.0.0" ? "localhost" : config.bindaddress}:${config.port}`);
  }
  /**
   * Clean up any remaining connections on disconnect. If this isn't done,
   * the process will not exit until any remaining connections have been destroyed.
   * Afterwards, the worker process will die on its own
   */
  cleanup() {
    for (const socket of this.sockets.values()) {
      try {
        socket.destroy();
      } catch {
      }
    }
    this.sockets.clear();
    this.rooms.clear();
    this.roomChannels.clear();
    this.server.close();
    if (this.serverSsl)
      this.serverSsl.close();
    setImmediate(() => process.exit(0));
  }
  onConnection(socket) {
    if (!socket)
      return;
    if (!socket.remoteAddress) {
      try {
        socket.destroy();
      } catch {
      }
      return;
    }
    const socketid = "" + ++this.socketCounter;
    this.sockets.set(socketid, socket);
    let socketip = socket.remoteAddress;
    if (this.isTrustedProxyIp(socketip)) {
      const ips = (socket.headers["x-forwarded-for"] || "").split(",").reverse();
      for (const ip of ips) {
        const proxy = ip.trim();
        if (!this.isTrustedProxyIp(proxy)) {
          socketip = proxy;
          break;
        }
      }
    }
    this.push(`*${socketid}
${socketip}
${socket.protocol}`);
    socket.on("data", (message) => {
      if (!message)
        return;
      if (message.length > 100 * 1024) {
        socket.write(`|popup|Your message must be below 100KB`);
        console.log(`Dropping client message ${message.length / 1024} KB...`);
        console.log(message.slice(0, 160));
        return;
      }
      if (typeof message !== "string" || message.startsWith("{"))
        return;
      const pipeIndex = message.indexOf("|");
      if (pipeIndex < 0 || pipeIndex === message.length - 1)
        return;
      this.push(`<${socketid}
${message}`);
    });
    socket.once("close", () => {
      this.push(`!${socketid}`);
      this.sockets.delete(socketid);
      for (const room of this.rooms.values())
        room.delete(socketid);
    });
  }
  _write(data2) {
    const receiver = this.receivers[data2.charAt(0)];
    if (receiver)
      receiver.call(this, data2);
  }
}
const PM = new import_lib.ProcessManager.RawProcessManager({
  module,
  setupChild: () => new ServerStream(Config),
  isCluster: true
});
if (!PM.isParentProcess) {
  global.Config = require("./config-loader").Config;
  if (Config.crashguard) {
    process.on("uncaughtException", (err) => {
      (0, import_lib.crashlogger)(err, `Socket process ${PM.workerid} (${process.pid})`);
    });
    process.on("unhandledRejection", (err) => {
      (0, import_lib.crashlogger)(err || {}, `Socket process ${PM.workerid} (${process.pid}) Promise`);
    });
  }
  if (Config.sockets) {
    try {
      require.resolve("node-oom-heapdump");
    } catch (e) {
      if (e.code !== "MODULE_NOT_FOUND")
        throw e;
      throw new Error(
        "node-oom-heapdump is not installed, but it is a required dependency if Config.ofesockets is set to true! Run npm install node-oom-heapdump and restart the server."
      );
    }
    global.nodeOomHeapdump = require("node-oom-heapdump")({
      addTimestamp: true
    });
  }
  if (process.env.PSPORT)
    Config.port = +process.env.PSPORT;
  if (process.env.PSBINDADDR)
    Config.bindaddress = process.env.PSBINDADDR;
  if (process.env.PSNOSSL && parseInt(process.env.PSNOSSL))
    Config.ssl = null;
  import_lib.Repl.start(`sockets-${PM.workerid}-${process.pid}`, (cmd) => eval(cmd));
}
//# sourceMappingURL=sockets.js.map
