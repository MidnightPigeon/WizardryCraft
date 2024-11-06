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
var streams_exports = {};
__export(streams_exports, {
  ObjectReadStream: () => ObjectReadStream,
  ObjectReadWriteStream: () => ObjectReadWriteStream,
  ObjectWriteStream: () => ObjectWriteStream,
  ReadStream: () => ReadStream,
  ReadWriteStream: () => ReadWriteStream,
  WriteStream: () => WriteStream,
  readAll: () => readAll,
  stdin: () => stdin,
  stdout: () => stdout,
  stdpipe: () => stdpipe
});
module.exports = __toCommonJS(streams_exports);
/**
 * Streams
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * The Node.js standard library's Streams are really hard to use. This
 * offers a better stream API.
 *
 * Documented in STREAMS.md.
 *
 * @license MIT
 */
const BUF_SIZE = 65536 * 4;
class ReadStream {
  constructor(optionsOrStreamLike = {}) {
    this.buf = Buffer.allocUnsafe(BUF_SIZE);
    this.bufStart = 0;
    this.bufEnd = 0;
    this.bufCapacity = BUF_SIZE;
    this.readSize = 0;
    this.atEOF = false;
    this.errorBuf = null;
    this.encoding = "utf8";
    this.isReadable = true;
    this.isWritable = false;
    this.nodeReadableStream = null;
    this.nextPushResolver = null;
    this.nextPush = new Promise((resolve) => {
      this.nextPushResolver = resolve;
    });
    this.awaitingPush = false;
    let options;
    if (typeof optionsOrStreamLike === "string") {
      options = { buffer: optionsOrStreamLike };
    } else if (optionsOrStreamLike instanceof Buffer) {
      options = { buffer: optionsOrStreamLike };
    } else if (typeof optionsOrStreamLike._readableState === "object") {
      options = { nodeStream: optionsOrStreamLike };
    } else {
      options = optionsOrStreamLike;
    }
    if (options.nodeStream) {
      const nodeStream = options.nodeStream;
      this.nodeReadableStream = nodeStream;
      nodeStream.on("data", (data) => {
        this.push(data);
      });
      nodeStream.on("end", () => {
        this.pushEnd();
      });
      options.read = function(unusedBytes) {
        this.nodeReadableStream.resume();
      };
      options.pause = function(unusedBytes) {
        this.nodeReadableStream.pause();
      };
    }
    if (options.read)
      this._read = options.read;
    if (options.pause)
      this._pause = options.pause;
    if (options.destroy)
      this._destroy = options.destroy;
    if (options.encoding)
      this.encoding = options.encoding;
    if (options.buffer !== void 0) {
      this.push(options.buffer);
      this.pushEnd();
    }
  }
  get bufSize() {
    return this.bufEnd - this.bufStart;
  }
  moveBuf() {
    if (this.bufStart !== this.bufEnd) {
      this.buf.copy(this.buf, 0, this.bufStart, this.bufEnd);
    }
    this.bufEnd -= this.bufStart;
    this.bufStart = 0;
  }
  expandBuf(newCapacity = this.bufCapacity * 2) {
    const newBuf = Buffer.allocUnsafe(newCapacity);
    this.buf.copy(newBuf, 0, this.bufStart, this.bufEnd);
    this.bufEnd -= this.bufStart;
    this.bufStart = 0;
    this.bufCapacity = newCapacity;
    this.buf = newBuf;
  }
  ensureCapacity(additionalCapacity) {
    if (this.bufEnd + additionalCapacity <= this.bufCapacity)
      return;
    const capacity = this.bufEnd - this.bufStart + additionalCapacity;
    if (capacity <= this.bufCapacity) {
      return this.moveBuf();
    }
    let newCapacity = this.bufCapacity * 2;
    while (newCapacity < capacity)
      newCapacity *= 2;
    this.expandBuf(newCapacity);
  }
  push(buf, encoding = this.encoding) {
    let size;
    if (this.atEOF)
      return;
    if (typeof buf === "string") {
      size = Buffer.byteLength(buf, encoding);
      this.ensureCapacity(size);
      this.buf.write(buf, this.bufEnd);
    } else {
      size = buf.length;
      this.ensureCapacity(size);
      buf.copy(this.buf, this.bufEnd);
    }
    this.bufEnd += size;
    if (this.bufSize > this.readSize && size * 2 < this.bufSize)
      this._pause();
    this.resolvePush();
  }
  pushEnd() {
    this.atEOF = true;
    this.resolvePush();
  }
  pushError(err, recoverable) {
    if (!this.errorBuf)
      this.errorBuf = [];
    this.errorBuf.push(err);
    if (!recoverable)
      this.atEOF = true;
    this.resolvePush();
  }
  readError() {
    if (this.errorBuf) {
      const err = this.errorBuf.shift();
      if (!this.errorBuf.length)
        this.errorBuf = null;
      throw err;
    }
  }
  peekError() {
    if (this.errorBuf) {
      throw this.errorBuf[0];
    }
  }
  resolvePush() {
    if (!this.nextPushResolver)
      throw new Error(`Push after end of read stream`);
    this.nextPushResolver();
    if (this.atEOF) {
      this.nextPushResolver = null;
      return;
    }
    this.nextPush = new Promise((resolve) => {
      this.nextPushResolver = resolve;
    });
  }
  _read(size = 0) {
    throw new Error(`ReadStream needs to be subclassed and the _read function needs to be implemented.`);
  }
  _destroy() {
  }
  _pause() {
  }
  /**
   * Reads until the internal buffer is non-empty. Does nothing if the
   * internal buffer is already non-empty.
   *
   * If `byteCount` is a number, instead read until the internal buffer
   * contains at least `byteCount` bytes.
   *
   * If `byteCount` is `true`, reads even if the internal buffer is
   * non-empty.
   */
  loadIntoBuffer(byteCount = null, readError) {
    this[readError ? "readError" : "peekError"]();
    if (byteCount === 0)
      return;
    this.readSize = Math.max(
      byteCount === true ? this.bufSize + 1 : byteCount === null ? 1 : byteCount,
      this.readSize
    );
    if (!this.errorBuf && !this.atEOF && this.bufSize < this.readSize) {
      let bytes = this.readSize - this.bufSize;
      if (bytes === Infinity || byteCount === null || byteCount === true)
        bytes = null;
      return this.doLoad(bytes, readError);
    }
  }
  async doLoad(chunkSize, readError) {
    while (!this.errorBuf && !this.atEOF && this.bufSize < this.readSize) {
      if (chunkSize)
        void this._read(chunkSize);
      else
        void this._read();
      await this.nextPush;
      this[readError ? "readError" : "peekError"]();
    }
  }
  peek(byteCount = null, encoding = this.encoding) {
    if (typeof byteCount === "string") {
      encoding = byteCount;
      byteCount = null;
    }
    const maybeLoad = this.loadIntoBuffer(byteCount);
    if (maybeLoad)
      return maybeLoad.then(() => this.peek(byteCount, encoding));
    if (!this.bufSize && byteCount !== 0)
      return null;
    if (byteCount === null)
      return this.buf.toString(encoding, this.bufStart, this.bufEnd);
    if (byteCount > this.bufSize)
      byteCount = this.bufSize;
    return this.buf.toString(encoding, this.bufStart, this.bufStart + byteCount);
  }
  peekBuffer(byteCount = null) {
    const maybeLoad = this.loadIntoBuffer(byteCount);
    if (maybeLoad)
      return maybeLoad.then(() => this.peekBuffer(byteCount));
    if (!this.bufSize && byteCount !== 0)
      return null;
    if (byteCount === null)
      return this.buf.slice(this.bufStart, this.bufEnd);
    if (byteCount > this.bufSize)
      byteCount = this.bufSize;
    return this.buf.slice(this.bufStart, this.bufStart + byteCount);
  }
  async read(byteCount = null, encoding = this.encoding) {
    if (typeof byteCount === "string") {
      encoding = byteCount;
      byteCount = null;
    }
    await this.loadIntoBuffer(byteCount, true);
    const out = this.peek(byteCount, encoding);
    if (out && typeof out !== "string") {
      throw new Error("Race condition; you must not read before a previous read has completed");
    }
    if (byteCount === null || byteCount >= this.bufSize) {
      this.bufStart = 0;
      this.bufEnd = 0;
      this.readSize = 0;
    } else {
      this.bufStart += byteCount;
      this.readSize -= byteCount;
    }
    return out;
  }
  byChunk(byteCount) {
    const byteStream = this;
    return new ObjectReadStream({
      async read() {
        const next = await byteStream.read(byteCount);
        if (typeof next === "string")
          this.push(next);
        else
          this.pushEnd();
      }
    });
  }
  byLine() {
    const byteStream = this;
    return new ObjectReadStream({
      async read() {
        const next = await byteStream.readLine();
        if (typeof next === "string")
          this.push(next);
        else
          this.pushEnd();
      }
    });
  }
  delimitedBy(delimiter) {
    const byteStream = this;
    return new ObjectReadStream({
      async read() {
        const next = await byteStream.readDelimitedBy(delimiter);
        if (typeof next === "string")
          this.push(next);
        else
          this.pushEnd();
      }
    });
  }
  async readBuffer(byteCount = null) {
    await this.loadIntoBuffer(byteCount, true);
    const out = this.peekBuffer(byteCount);
    if (out && out.then) {
      throw new Error("Race condition; you must not read before a previous read has completed");
    }
    if (byteCount === null || byteCount >= this.bufSize) {
      this.bufStart = 0;
      this.bufEnd = 0;
    } else {
      this.bufStart += byteCount;
    }
    return out;
  }
  async indexOf(symbol, encoding = this.encoding) {
    let idx = this.buf.indexOf(symbol, this.bufStart, encoding);
    while (!this.atEOF && (idx >= this.bufEnd || idx < 0)) {
      await this.loadIntoBuffer(true);
      idx = this.buf.indexOf(symbol, this.bufStart, encoding);
    }
    if (idx >= this.bufEnd)
      return -1;
    return idx - this.bufStart;
  }
  async readAll(encoding = this.encoding) {
    return await this.read(Infinity, encoding) || "";
  }
  peekAll(encoding = this.encoding) {
    return this.peek(Infinity, encoding);
  }
  async readDelimitedBy(symbol, encoding = this.encoding) {
    if (this.atEOF && !this.bufSize)
      return null;
    const idx = await this.indexOf(symbol, encoding);
    if (idx < 0) {
      return this.readAll(encoding);
    } else {
      const out = await this.read(idx, encoding);
      this.bufStart += Buffer.byteLength(symbol, "utf8");
      return out;
    }
  }
  async readLine(encoding = this.encoding) {
    if (!encoding)
      throw new Error(`readLine must have an encoding`);
    let line = await this.readDelimitedBy("\n", encoding);
    if (line?.endsWith("\r"))
      line = line.slice(0, -1);
    return line;
  }
  destroy() {
    this.atEOF = true;
    this.bufStart = 0;
    this.bufEnd = 0;
    if (this.nextPushResolver)
      this.resolvePush();
    return this._destroy();
  }
  async next(byteCount = null) {
    const value = await this.read(byteCount);
    return { value, done: value === null };
  }
  async pipeTo(outStream, options = {}) {
    let value, done;
    while ({ value, done } = await this.next(), !done) {
      await outStream.write(value);
    }
    if (!options.noEnd)
      return outStream.writeEnd();
  }
}
class WriteStream {
  constructor(optionsOrStream = {}) {
    this.isReadable = false;
    this.isWritable = true;
    this.encoding = "utf8";
    this.nodeWritableStream = null;
    this.drainListeners = [];
    let options = optionsOrStream;
    if (options._writableState) {
      options = { nodeStream: optionsOrStream };
    }
    if (options.nodeStream) {
      const nodeStream = options.nodeStream;
      this.nodeWritableStream = nodeStream;
      options.write = function(data) {
        const result = this.nodeWritableStream.write(data);
        if (result !== false)
          return void 0;
        if (!this.drainListeners.length) {
          this.nodeWritableStream.once("drain", () => {
            for (const listener of this.drainListeners)
              listener();
            this.drainListeners = [];
          });
        }
        return new Promise((resolve) => {
          this.drainListeners.push(resolve);
        });
      };
      if (nodeStream !== process.stdout && nodeStream !== process.stderr) {
        options.writeEnd = function() {
          return new Promise((resolve) => {
            this.nodeWritableStream.end(() => resolve());
          });
        };
      }
    }
    if (options.write)
      this._write = options.write;
    if (options.writeEnd)
      this._writeEnd = options.writeEnd;
  }
  write(chunk) {
    return this._write(chunk);
  }
  writeLine(chunk) {
    if (chunk === null) {
      return this.writeEnd();
    }
    return this.write(chunk + "\n");
  }
  _write(chunk) {
    throw new Error(`WriteStream needs to be subclassed and the _write function needs to be implemented.`);
  }
  _writeEnd() {
  }
  async writeEnd(chunk) {
    if (chunk) {
      await this.write(chunk);
    }
    return this._writeEnd();
  }
}
class ReadWriteStream extends ReadStream {
  constructor(options = {}) {
    super(options);
    this.isReadable = true;
    this.isWritable = true;
    this.nodeWritableStream = null;
    this.drainListeners = [];
    if (options.nodeStream) {
      const nodeStream = options.nodeStream;
      this.nodeWritableStream = nodeStream;
      options.write = function(data) {
        const result = this.nodeWritableStream.write(data);
        if (result !== false)
          return void 0;
        if (!this.drainListeners.length) {
          this.nodeWritableStream.once("drain", () => {
            for (const listener of this.drainListeners)
              listener();
            this.drainListeners = [];
          });
        }
        return new Promise((resolve) => {
          this.drainListeners.push(resolve);
        });
      };
      if (nodeStream !== process.stdout && nodeStream !== process.stderr) {
        options.writeEnd = function() {
          return new Promise((resolve) => {
            this.nodeWritableStream.end(() => resolve());
          });
        };
      }
    }
    if (options.write)
      this._write = options.write;
    if (options.writeEnd)
      this._writeEnd = options.writeEnd;
  }
  write(chunk) {
    return this._write(chunk);
  }
  writeLine(chunk) {
    return this.write(chunk + "\n");
  }
  _write(chunk) {
    throw new Error(`WriteStream needs to be subclassed and the _write function needs to be implemented.`);
  }
  /**
   * In a ReadWriteStream, `_read` does not need to be implemented,
   * because it's valid for the read stream buffer to be filled only by
   * `_write`.
   */
  _read(size) {
  }
  _writeEnd() {
  }
  async writeEnd() {
    return this._writeEnd();
  }
}
class ObjectReadStream {
  constructor(optionsOrStreamLike = {}) {
    this.buf = [];
    this.readSize = 0;
    this.atEOF = false;
    this.errorBuf = null;
    this.isReadable = true;
    this.isWritable = false;
    this.nodeReadableStream = null;
    this.nextPushResolver = null;
    this.nextPush = new Promise((resolve) => {
      this.nextPushResolver = resolve;
    });
    this.awaitingPush = false;
    let options;
    if (Array.isArray(optionsOrStreamLike)) {
      options = { buffer: optionsOrStreamLike };
    } else if (typeof optionsOrStreamLike._readableState === "object") {
      options = { nodeStream: optionsOrStreamLike };
    } else {
      options = optionsOrStreamLike;
    }
    if (options.nodeStream) {
      const nodeStream = options.nodeStream;
      this.nodeReadableStream = nodeStream;
      nodeStream.on("data", (data) => {
        this.push(data);
      });
      nodeStream.on("end", () => {
        this.pushEnd();
      });
      options = {
        read() {
          this.nodeReadableStream.resume();
        },
        pause() {
          this.nodeReadableStream.pause();
        }
      };
    }
    if (options.read)
      this._read = options.read;
    if (options.pause)
      this._pause = options.pause;
    if (options.destroy)
      this._destroy = options.destroy;
    if (options.buffer !== void 0) {
      this.buf = options.buffer.slice();
      this.pushEnd();
    }
  }
  push(elem) {
    if (this.atEOF)
      return;
    this.buf.push(elem);
    if (this.buf.length > this.readSize && this.buf.length >= 16)
      void this._pause();
    this.resolvePush();
  }
  pushEnd() {
    this.atEOF = true;
    this.resolvePush();
  }
  pushError(err, recoverable) {
    if (!this.errorBuf)
      this.errorBuf = [];
    this.errorBuf.push(err);
    if (!recoverable)
      this.atEOF = true;
    this.resolvePush();
  }
  readError() {
    if (this.errorBuf) {
      const err = this.errorBuf.shift();
      if (!this.errorBuf.length)
        this.errorBuf = null;
      throw err;
    }
  }
  peekError() {
    if (this.errorBuf) {
      throw this.errorBuf[0];
    }
  }
  resolvePush() {
    if (!this.nextPushResolver)
      throw new Error(`Push after end of read stream`);
    this.nextPushResolver();
    if (this.atEOF) {
      this.nextPushResolver = null;
      return;
    }
    this.nextPush = new Promise((resolve) => {
      this.nextPushResolver = resolve;
    });
  }
  _read(size = 0) {
    throw new Error(`ReadStream needs to be subclassed and the _read function needs to be implemented.`);
  }
  _destroy() {
  }
  _pause() {
  }
  async loadIntoBuffer(count = 1, readError) {
    this[readError ? "readError" : "peekError"]();
    if (count === true)
      count = this.buf.length + 1;
    if (this.buf.length >= count)
      return;
    this.readSize = Math.max(count, this.readSize);
    while (!this.errorBuf && !this.atEOF && this.buf.length < this.readSize) {
      const readResult = this._read();
      if (readResult) {
        await readResult;
      } else {
        await this.nextPush;
      }
      this[readError ? "readError" : "peekError"]();
    }
  }
  async peek() {
    if (this.buf.length)
      return this.buf[0];
    await this.loadIntoBuffer();
    return this.buf[0];
  }
  async read() {
    if (this.buf.length)
      return this.buf.shift();
    await this.loadIntoBuffer(1, true);
    if (!this.buf.length)
      return null;
    return this.buf.shift();
  }
  async peekArray(count = null) {
    await this.loadIntoBuffer(count === null ? 1 : count);
    return this.buf.slice(0, count === null ? Infinity : count);
  }
  async readArray(count = null) {
    await this.loadIntoBuffer(count === null ? 1 : count, true);
    const out = this.buf.slice(0, count === null ? Infinity : count);
    this.buf = this.buf.slice(out.length);
    return out;
  }
  async readAll() {
    await this.loadIntoBuffer(Infinity, true);
    const out = this.buf;
    this.buf = [];
    return out;
  }
  async peekAll() {
    await this.loadIntoBuffer(Infinity);
    return this.buf.slice();
  }
  destroy() {
    this.atEOF = true;
    this.buf = [];
    this.resolvePush();
    return this._destroy();
  }
  // eslint-disable-next-line no-restricted-globals
  [Symbol.asyncIterator]() {
    return this;
  }
  async next() {
    if (this.buf.length)
      return { value: this.buf.shift(), done: false };
    await this.loadIntoBuffer(1, true);
    if (!this.buf.length)
      return { value: void 0, done: true };
    return { value: this.buf.shift(), done: false };
  }
  async pipeTo(outStream, options = {}) {
    let value, done;
    while ({ value, done } = await this.next(), !done) {
      await outStream.write(value);
    }
    if (!options.noEnd)
      return outStream.writeEnd();
  }
}
class ObjectWriteStream {
  constructor(optionsOrStream = {}) {
    this.isReadable = false;
    this.isWritable = true;
    this.nodeWritableStream = null;
    let options = optionsOrStream;
    if (options._writableState) {
      options = { nodeStream: optionsOrStream };
    }
    if (options.nodeStream) {
      const nodeStream = options.nodeStream;
      this.nodeWritableStream = nodeStream;
      options.write = function(data) {
        const result = this.nodeWritableStream.write(data);
        if (result === false) {
          return new Promise((resolve) => {
            this.nodeWritableStream.once("drain", () => {
              resolve();
            });
          });
        }
      };
      if (nodeStream !== process.stdout && nodeStream !== process.stderr) {
        options.writeEnd = function() {
          return new Promise((resolve) => {
            this.nodeWritableStream.end(() => resolve());
          });
        };
      }
    }
    if (options.write)
      this._write = options.write;
    if (options.writeEnd)
      this._writeEnd = options.writeEnd;
  }
  write(elem) {
    if (elem === null) {
      return this.writeEnd();
    }
    return this._write(elem);
  }
  _write(elem) {
    throw new Error(`WriteStream needs to be subclassed and the _write function needs to be implemented.`);
  }
  _writeEnd() {
  }
  async writeEnd(elem) {
    if (elem !== void 0) {
      await this.write(elem);
    }
    return this._writeEnd();
  }
}
class ObjectReadWriteStream extends ObjectReadStream {
  constructor(options = {}) {
    super(options);
    this.isReadable = true;
    this.isWritable = true;
    this.nodeWritableStream = null;
    if (options.write)
      this._write = options.write;
    if (options.writeEnd)
      this._writeEnd = options.writeEnd;
  }
  write(elem) {
    return this._write(elem);
  }
  _write(elem) {
    throw new Error(`WriteStream needs to be subclassed and the _write function needs to be implemented.`);
  }
  /** In a ReadWriteStream, _read does not need to be implemented. */
  _read() {
  }
  _writeEnd() {
  }
  async writeEnd() {
    return this._writeEnd();
  }
}
function readAll(nodeStream, encoding) {
  return new ReadStream(nodeStream).readAll(encoding);
}
function stdin() {
  return new ReadStream(process.stdin);
}
function stdout() {
  return new WriteStream(process.stdout);
}
function stdpipe(stream) {
  const promises = [];
  if (stream.pipeTo) {
    promises.push(stream.pipeTo(stdout()));
  }
  if (stream.write) {
    promises.push(stdin().pipeTo(stream));
  }
  return Promise.all(promises);
}
//# sourceMappingURL=streams.js.map
