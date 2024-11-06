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
var process_manager_exports = {};
__export(process_manager_exports, {
  ProcessManager: () => ProcessManager,
  QueryProcessManager: () => QueryProcessManager,
  QueryProcessWrapper: () => QueryProcessWrapper,
  RawProcessManager: () => RawProcessManager,
  RawProcessWrapper: () => RawProcessWrapper,
  StreamProcessManager: () => StreamProcessManager,
  StreamProcessWrapper: () => StreamProcessWrapper,
  StreamWorker: () => StreamWorker,
  exec: () => exec,
  processManagers: () => processManagers
});
module.exports = __toCommonJS(process_manager_exports);
var child_process = __toESM(require("child_process"));
var cluster = __toESM(require("cluster"));
var path = __toESM(require("path"));
var Streams = __toESM(require("./streams"));
var import_fs = require("./fs");
/**
 * Process Manager
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * This file abstract out multiprocess logic involved in several tasks.
 *
 * Child processes can be queried.
 *
 * @license MIT
 */
const processManagers = [];
function exec(args, execOptions) {
  if (Array.isArray(args)) {
    const cmd = args.shift();
    if (!cmd)
      throw new Error(`You must pass a command to ProcessManager.exec.`);
    return new Promise((resolve, reject) => {
      child_process.execFile(cmd, args, execOptions, (err, stdout, stderr) => {
        if (err)
          reject(err);
        if (typeof stdout !== "string")
          stdout = stdout.toString();
        if (typeof stderr !== "string")
          stderr = stderr.toString();
        resolve({ stdout, stderr });
      });
    });
  } else {
    return new Promise((resolve, reject) => {
      child_process.exec(args, execOptions, (error, stdout, stderr) => {
        if (error)
          reject(error);
        if (typeof stdout !== "string")
          stdout = stdout.toString();
        resolve(stdout);
      });
    });
  }
}
class SubprocessStream extends Streams.ObjectReadWriteStream {
  constructor(process2, taskId2) {
    super();
    this.process = process2;
    this.taskId = taskId2;
    this.process.process.send(`${taskId2}
NEW`);
  }
  _write(message2) {
    if (!this.process.process.connected) {
      this.pushError(new Error(`Process disconnected (possibly crashed?)`));
      return;
    }
    this.process.process.send(`${this.taskId}
WRITE
${message2}`);
  }
  _writeEnd() {
    this.process.process.send(`${this.taskId}
WRITEEND`);
  }
  _destroy() {
    if (!this.process.process.connected)
      return;
    this.process.process.send(`${this.taskId}
DESTROY`);
    this.process.deleteStream(this.taskId);
    this.process = null;
  }
}
class RawSubprocessStream extends Streams.ObjectReadWriteStream {
  constructor(process2) {
    super();
    this.process = process2;
  }
  _write(message2) {
    if (!this.process.getProcess().connected) {
      return;
    }
    this.process.process.send(message2);
  }
}
class QueryProcessWrapper {
  constructor(file, messageCallback) {
    this.process = child_process.fork(file, [], { cwd: import_fs.FS.ROOT_PATH });
    this.taskId = 0;
    this.file = file;
    this.pendingTasks = /* @__PURE__ */ new Map();
    this.pendingRelease = null;
    this.resolveRelease = null;
    this.messageCallback = messageCallback || null;
    this.process.on("message", (message2) => {
      if (message2.startsWith("THROW\n")) {
        const error = new Error();
        error.stack = message2.slice(6);
        throw error;
      }
      if (message2.startsWith("DEBUG\n")) {
        this.debug = message2.slice(6);
        return;
      }
      if (this.messageCallback && message2.startsWith(`CALLBACK
`)) {
        this.messageCallback(message2.slice(9));
        return;
      }
      const nlLoc2 = message2.indexOf("\n");
      if (nlLoc2 <= 0)
        throw new Error(`Invalid response ${message2}`);
      const taskId2 = parseInt(message2.slice(0, nlLoc2));
      const resolve = this.pendingTasks.get(taskId2);
      if (!resolve)
        throw new Error(`Invalid taskId ${message2.slice(0, nlLoc2)}`);
      this.pendingTasks.delete(taskId2);
      const resp = this.safeJSON(message2.slice(nlLoc2 + 1));
      resolve(resp);
      if (this.resolveRelease && !this.getLoad())
        this.destroy();
    });
  }
  safeJSON(obj) {
    if (obj === "undefined") {
      return void 0;
    }
    try {
      return JSON.parse(obj);
    } catch (e) {
      global.Monitor?.crashlog?.(e, `a ${path.basename(this.file)} process`, { result: obj });
      return void 0;
    }
  }
  getProcess() {
    return this.process;
  }
  getLoad() {
    return this.pendingTasks.size;
  }
  query(input) {
    this.taskId++;
    const taskId2 = this.taskId;
    this.process.send(`${taskId2}
${JSON.stringify(input)}`);
    return new Promise((resolve) => {
      this.pendingTasks.set(taskId2, resolve);
    });
  }
  release() {
    if (this.pendingRelease)
      return this.pendingRelease;
    if (!this.getLoad()) {
      this.destroy();
    } else {
      this.pendingRelease = new Promise((resolve) => {
        this.resolveRelease = resolve;
      });
    }
    return this.pendingRelease;
  }
  destroy() {
    if (this.pendingRelease && !this.resolveRelease) {
      return;
    }
    this.process.disconnect();
    for (const resolver of this.pendingTasks.values()) {
      resolver("");
    }
    this.pendingTasks.clear();
    if (this.resolveRelease) {
      this.resolveRelease();
      this.resolveRelease = null;
    } else if (!this.pendingRelease) {
      this.pendingRelease = Promise.resolve();
    }
  }
}
class StreamProcessWrapper {
  constructor(file, messageCallback) {
    this.taskId = 0;
    this.activeStreams = /* @__PURE__ */ new Map();
    this.pendingRelease = null;
    this.resolveRelease = null;
    this.process = child_process.fork(file, [], { cwd: import_fs.FS.ROOT_PATH });
    this.messageCallback = messageCallback;
    this.process.on("message", (message2) => {
      if (message2.startsWith("THROW\n")) {
        const error = new Error();
        error.stack = message2.slice(6);
        throw error;
      }
      if (this.messageCallback && message2.startsWith(`CALLBACK
`)) {
        this.messageCallback(message2.slice(9));
        return;
      }
      if (message2.startsWith("DEBUG\n")) {
        this.setDebug(message2.slice(6));
        return;
      }
      let nlLoc2 = message2.indexOf("\n");
      if (nlLoc2 <= 0)
        throw new Error(`Invalid response ${message2}`);
      const taskId2 = parseInt(message2.slice(0, nlLoc2));
      const stream2 = this.activeStreams.get(taskId2);
      if (!stream2)
        return;
      message2 = message2.slice(nlLoc2 + 1);
      nlLoc2 = message2.indexOf("\n");
      if (nlLoc2 < 0)
        nlLoc2 = message2.length;
      const messageType2 = message2.slice(0, nlLoc2);
      message2 = message2.slice(nlLoc2 + 1);
      if (messageType2 === "END") {
        stream2.pushEnd();
        this.deleteStream(taskId2);
        return;
      } else if (messageType2 === "PUSH") {
        stream2.push(message2);
      } else if (messageType2 === "THROW") {
        const error = new Error();
        error.stack = message2;
        stream2.pushError(error, true);
      } else {
        throw new Error(`Unrecognized messageType ${messageType2}`);
      }
    });
  }
  setDebug(message2) {
    this.debug = (this.debug || "").slice(-32768) + "\n=====\n" + message2;
  }
  getLoad() {
    return this.activeStreams.size;
  }
  getProcess() {
    return this.process;
  }
  deleteStream(taskId2) {
    this.activeStreams.delete(taskId2);
    if (this.resolveRelease && !this.getLoad())
      void this.destroy();
  }
  createStream() {
    this.taskId++;
    const taskId2 = this.taskId;
    const stream2 = new SubprocessStream(this, taskId2);
    this.activeStreams.set(taskId2, stream2);
    return stream2;
  }
  release() {
    if (this.pendingRelease)
      return this.pendingRelease;
    if (!this.getLoad()) {
      void this.destroy();
    } else {
      this.pendingRelease = new Promise((resolve) => {
        this.resolveRelease = resolve;
      });
    }
    return this.pendingRelease;
  }
  destroy() {
    if (this.pendingRelease && !this.resolveRelease) {
      return;
    }
    this.process.disconnect();
    const destroyed = [];
    for (const stream2 of this.activeStreams.values()) {
      destroyed.push(stream2.destroy());
    }
    this.activeStreams.clear();
    if (this.resolveRelease) {
      this.resolveRelease();
      this.resolveRelease = null;
    } else if (!this.pendingRelease) {
      this.pendingRelease = Promise.resolve();
    }
    return Promise.all(destroyed);
  }
}
class StreamWorker {
  constructor(stream2) {
    this.load = 0;
    this.workerid = 0;
    this.stream = stream2;
  }
}
class RawProcessWrapper {
  constructor(file, isCluster, env) {
    this.taskId = 0;
    this.pendingRelease = null;
    this.resolveRelease = null;
    this.workerid = 0;
    /** Not managed by RawProcessWrapper itself */
    this.load = 0;
    if (isCluster) {
      this.process = cluster.fork(env);
      this.workerid = this.process.id;
    } else {
      this.process = child_process.fork(file, [], { cwd: import_fs.FS.ROOT_PATH, env });
    }
    this.process.on("message", (message2) => {
      this.stream.push(message2);
    });
    this.stream = new RawSubprocessStream(this);
  }
  setDebug(message2) {
    this.debug = (this.debug || "").slice(-32768) + "\n=====\n" + message2;
  }
  getLoad() {
    return this.load;
  }
  getProcess() {
    return this.process.process ? this.process.process : this.process;
  }
  release() {
    if (this.pendingRelease)
      return this.pendingRelease;
    if (!this.getLoad()) {
      void this.destroy();
    } else {
      this.pendingRelease = new Promise((resolve) => {
        this.resolveRelease = resolve;
      });
    }
    return this.pendingRelease;
  }
  destroy() {
    if (this.pendingRelease && !this.resolveRelease) {
      return;
    }
    void this.stream.destroy();
    this.process.disconnect();
    return;
  }
}
const _ProcessManager = class {
  constructor(module2) {
    this.processes = [];
    this.releasingProcesses = [];
    this.crashedProcesses = [];
    this.crashTime = 0;
    this.crashRespawnCount = 0;
    this.filename = module2.filename;
    this.basename = path.basename(module2.filename);
    this.isParentProcess = process.mainModule !== module2 || !process.send;
    this.listen();
  }
  acquire() {
    if (!this.processes.length) {
      return null;
    }
    let lowestLoad = this.processes[0];
    for (const process2 of this.processes) {
      if (process2.getLoad() < lowestLoad.getLoad()) {
        lowestLoad = process2;
      }
    }
    return lowestLoad;
  }
  releaseCrashed(process2) {
    const index = this.processes.indexOf(process2);
    if (index < 0)
      return;
    this.processes.splice(index, 1);
    this.destroyProcess(process2);
    void process2.release().then(() => {
      const releasingIndex = this.releasingProcesses.indexOf(process2);
      if (releasingIndex >= 0) {
        this.releasingProcesses.splice(releasingIndex, 1);
      }
    });
    const now = Date.now();
    if (this.crashTime && now - this.crashTime > 30 * 60 * 1e3) {
      this.crashTime = 0;
      this.crashRespawnCount = 0;
    }
    if (!this.crashTime)
      this.crashTime = now;
    this.crashRespawnCount += 1;
    void Promise.reject(
      new Error(`Process ${this.basename} ${process2.getProcess().pid} crashed and had to be restarted`)
    );
    this.releasingProcesses.push(process2);
    this.crashedProcesses.push(process2);
    if (this.crashRespawnCount <= 5) {
      this.spawn(this.processes.length + 1);
    }
  }
  unspawn() {
    return Promise.all([...this.processes].map(
      (process2) => this.unspawnOne(process2)
    ));
  }
  async unspawnOne(process2) {
    if (!process2)
      return;
    this.destroyProcess(process2);
    const processIndex = this.processes.indexOf(process2);
    if (processIndex < 0)
      throw new Error("Process inactive");
    this.processes.splice(this.processes.indexOf(process2), 1);
    this.releasingProcesses.push(process2);
    await process2.release();
    const index = this.releasingProcesses.indexOf(process2);
    if (index < 0)
      return;
    this.releasingProcesses.splice(index, 1);
  }
  spawn(count = 1, force) {
    if (!this.isParentProcess)
      return;
    if (_ProcessManager.disabled && !force)
      return;
    const spawnCount = count - this.processes.length;
    for (let i = 0; i < spawnCount; i++) {
      this.spawnOne(force);
    }
  }
  spawnOne(force) {
    if (!this.isParentProcess)
      throw new Error("Must use in parent process");
    if (_ProcessManager.disabled && !force)
      return null;
    const process2 = this.createProcess();
    process2.process.on("disconnect", () => this.releaseCrashed(process2));
    this.processes.push(process2);
    return process2;
  }
  respawn(count = null) {
    if (count === null)
      count = this.processes.length;
    const unspawned = this.unspawn();
    this.spawn(count);
    return unspawned;
  }
  destroyProcess(process2) {
  }
  destroy() {
    const index = processManagers.indexOf(this);
    if (index >= 0)
      processManagers.splice(index, 1);
    return this.unspawn();
  }
};
let ProcessManager = _ProcessManager;
ProcessManager.disabled = false;
class QueryProcessManager extends ProcessManager {
  /**
   * @param timeout The number of milliseconds to wait before terminating a query. Defaults to 900000 ms (15 minutes).
   */
  constructor(module2, query, timeout = 15 * 60 * 1e3, debugCallback) {
    super(module2);
    this._query = query;
    this.timeout = timeout;
    this.messageCallback = debugCallback;
    processManagers.push(this);
  }
  async query(input, process2 = this.acquire()) {
    if (!process2)
      return this._query(input);
    const timeout = setTimeout(() => {
      const debugInfo = process2.debug || "No debug information found.";
      process2.destroy();
      this.spawnOne();
      throw new Error(
        `A query originating in ${this.basename} took too long to complete; the process has been respawned.
${debugInfo}`
      );
    }, this.timeout);
    const result = await process2.query(input);
    clearTimeout(timeout);
    return result;
  }
  queryTemporaryProcess(input, force) {
    const process2 = this.spawnOne(force);
    const result = this.query(input, process2);
    void this.unspawnOne(process2);
    return result;
  }
  createProcess() {
    return new QueryProcessWrapper(this.filename, this.messageCallback);
  }
  listen() {
    if (this.isParentProcess)
      return;
    process.on("message", (message) => {
      const nlLoc = message.indexOf("\n");
      if (nlLoc <= 0)
        throw new Error(`Invalid response ${message}`);
      const taskId = message.slice(0, nlLoc);
      message = message.slice(nlLoc + 1);
      if (taskId.startsWith("EVAL")) {
        process.send(`${taskId}
` + eval(message));
        return;
      }
      void Promise.resolve(this._query(JSON.parse(message))).then(
        (response) => process.send(`${taskId}
${JSON.stringify(response)}`)
      );
    });
    process.on("disconnect", () => {
      process.exit();
    });
  }
}
class StreamProcessManager extends ProcessManager {
  constructor(module2, createStream, messageCallback) {
    super(module2);
    this.activeStreams = /* @__PURE__ */ new Map();
    this._createStream = createStream;
    this.messageCallback = messageCallback;
    processManagers.push(this);
  }
  createStream() {
    const process2 = this.acquire();
    if (!process2)
      return this._createStream();
    return process2.createStream();
  }
  createProcess() {
    return new StreamProcessWrapper(this.filename, this.messageCallback);
  }
  async pipeStream(taskId2, stream2) {
    let done = false;
    while (!done) {
      try {
        let value;
        ({ value, done } = await stream2.next());
        process.send(`${taskId2}
PUSH
${value}`);
      } catch (err) {
        process.send(`${taskId2}
THROW
${err.stack}`);
      }
    }
    if (!this.activeStreams.has(taskId2)) {
      return;
    }
    process.send(`${taskId2}
END`);
    this.activeStreams.delete(taskId2);
  }
  listen() {
    if (this.isParentProcess)
      return;
    process.on("message", (message) => {
      let nlLoc = message.indexOf("\n");
      if (nlLoc <= 0)
        throw new Error(`Invalid request ${message}`);
      const taskId = message.slice(0, nlLoc);
      const stream = this.activeStreams.get(taskId);
      message = message.slice(nlLoc + 1);
      nlLoc = message.indexOf("\n");
      if (nlLoc < 0)
        nlLoc = message.length;
      const messageType = message.slice(0, nlLoc);
      message = message.slice(nlLoc + 1);
      if (taskId.startsWith("EVAL")) {
        process.send(`${taskId}
` + eval(message));
        return;
      }
      if (messageType === "NEW") {
        if (stream)
          throw new Error(`NEW: taskId ${taskId} already exists`);
        const newStream = this._createStream();
        this.activeStreams.set(taskId, newStream);
        void this.pipeStream(taskId, newStream);
      } else if (messageType === "DESTROY") {
        if (!stream)
          throw new Error(`DESTROY: Invalid taskId ${taskId}`);
        void stream.destroy();
        this.activeStreams.delete(taskId);
      } else if (messageType === "WRITE") {
        if (!stream)
          throw new Error(`WRITE: Invalid taskId ${taskId}`);
        void stream.write(message);
      } else if (messageType === "WRITEEND") {
        if (!stream)
          throw new Error(`WRITEEND: Invalid taskId ${taskId}`);
        void stream.writeEnd();
      } else {
        throw new Error(`Unrecognized messageType ${messageType}`);
      }
    });
    process.on("disconnect", () => {
      process.exit();
    });
  }
}
class RawProcessManager extends ProcessManager {
  constructor(options) {
    super(options.module);
    /** full list of processes - parent process only */
    this.workers = [];
    /** if spawning 0 worker processes, the worker is instead stored here in the parent process */
    this.masterWorker = null;
    /** stream used only in the child process */
    this.activeStream = null;
    this.spawnSubscription = null;
    this.unspawnSubscription = null;
    /** worker ID of cluster worker - cluster child process only (0 otherwise) */
    this.workerid = cluster.worker?.id || 0;
    this.isCluster = !!options.isCluster;
    this._setupChild = options.setupChild;
    this.env = options.env;
    if (this.isCluster && this.isParentProcess) {
      cluster.setupMaster({
        exec: this.filename,
        // @ts-ignore TODO: update type definition
        cwd: import_fs.FS.ROOT_PATH
      });
    }
    processManagers.push(this);
  }
  subscribeSpawn(callback) {
    this.spawnSubscription = callback;
  }
  subscribeUnspawn(callback) {
    this.unspawnSubscription = callback;
  }
  spawn(count) {
    super.spawn(count);
    if (!this.workers.length) {
      this.masterWorker = new StreamWorker(this._setupChild());
      this.workers.push(this.masterWorker);
      this.spawnSubscription?.(this.masterWorker);
    }
  }
  createProcess() {
    const process2 = new RawProcessWrapper(this.filename, this.isCluster, this.env);
    this.workers.push(process2);
    this.spawnSubscription?.(process2);
    return process2;
  }
  destroyProcess(process2) {
    const index = this.workers.indexOf(process2);
    if (index >= 0)
      this.workers.splice(index, 1);
    this.unspawnSubscription?.(process2);
  }
  async pipeStream(stream2) {
    let done = false;
    while (!done) {
      try {
        let value;
        ({ value, done } = await stream2.next());
        process.send(value);
      } catch (err) {
        process.send(`THROW
${err.stack}`);
      }
    }
  }
  listen() {
    if (this.isParentProcess)
      return;
    setImmediate(() => {
      this.activeStream = this._setupChild();
      void this.pipeStream(this.activeStream);
    });
    process.on("message", (message2) => {
      void this.activeStream.write(message2);
    });
    process.on("disconnect", () => {
      process.exit();
    });
  }
}
//# sourceMappingURL=process-manager.js.map
