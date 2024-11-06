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
var runner_exports = {};
__export(runner_exports, {
  Runner: () => Runner
});
module.exports = __toCommonJS(runner_exports);
var import_assert = require("assert");
var fs = __toESM(require("fs"));
var import__ = require("..");
var import_battle = require("../battle");
var BattleStreams = __toESM(require("../battle-stream"));
var import_state = require("../state");
var import_prng = require("../prng");
var import_random_player_ai = require("./random-player-ai");
/**
 * Battle Simulator runner.
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * @license MIT
 */
const _Runner = class {
  constructor(options) {
    this.format = options.format;
    this.prng = options.prng && !Array.isArray(options.prng) ? options.prng : new import_prng.PRNG(options.prng);
    this.p1options = { ..._Runner.AI_OPTIONS, ...options.p1options };
    this.p2options = { ..._Runner.AI_OPTIONS, ...options.p2options };
    this.p3options = { ..._Runner.AI_OPTIONS, ...options.p3options };
    this.p4options = { ..._Runner.AI_OPTIONS, ...options.p4options };
    this.input = !!options.input;
    this.output = !!options.output;
    this.error = !!options.error;
    this.dual = options.dual || false;
  }
  async run() {
    const battleStream = this.dual ? new DualStream(this.input, this.dual === "debug") : new RawBattleStream(this.input);
    const game = this.runGame(this.format, battleStream);
    if (!this.error)
      return game;
    return game.catch((err) => {
      console.log(`
${battleStream.rawInputLog.join("\n")}
`);
      throw err;
    });
  }
  async runGame(format, battleStream) {
    const streams = BattleStreams.getPlayerStreams(battleStream);
    const spec = { formatid: format, seed: this.prng.seed };
    const is4P = import__.Dex.formats.get(format).playerCount > 2;
    const p1spec = this.getPlayerSpec("Bot 1", this.p1options);
    const p2spec = this.getPlayerSpec("Bot 2", this.p2options);
    let p3spec, p4spec;
    if (is4P) {
      p3spec = this.getPlayerSpec("Bot 3", this.p3options);
      p4spec = this.getPlayerSpec("Bot 4", this.p4options);
    }
    const p1 = this.p1options.createAI(
      streams.p1,
      { seed: this.newSeed(), ...this.p1options }
    );
    const p2 = this.p2options.createAI(
      streams.p2,
      { seed: this.newSeed(), ...this.p2options }
    );
    let p3, p4;
    if (is4P) {
      p3 = this.p4options.createAI(
        streams.p3,
        { seed: this.newSeed(), ...this.p3options }
      );
      p4 = this.p4options.createAI(
        streams.p4,
        { seed: this.newSeed(), ...this.p4options }
      );
    }
    void p1.start();
    void p2.start();
    if (is4P) {
      void p3.start();
      void p4.start();
    }
    let initMessage = `>start ${JSON.stringify(spec)}
>player p1 ${JSON.stringify(p1spec)}
>player p2 ${JSON.stringify(p2spec)}`;
    if (is4P) {
      initMessage += `
>player p3 ${JSON.stringify(p3spec)}
>player p4 ${JSON.stringify(p4spec)}`;
    }
    void streams.omniscient.write(initMessage);
    for await (const chunk of streams.omniscient) {
      if (this.output)
        console.log(chunk);
    }
    return streams.omniscient.writeEnd();
  }
  // Same as PRNG#generatedSeed, only deterministic.
  // NOTE: advances this.prng's seed by 4.
  newSeed() {
    return [
      Math.floor(this.prng.next() * 65536),
      Math.floor(this.prng.next() * 65536),
      Math.floor(this.prng.next() * 65536),
      Math.floor(this.prng.next() * 65536)
    ];
  }
  getPlayerSpec(name, options) {
    if (options.team)
      return { name, team: options.team };
    return { name, seed: this.newSeed() };
  }
};
let Runner = _Runner;
Runner.AI_OPTIONS = {
  createAI: (s, o) => new import_random_player_ai.RandomPlayerAI(s, o),
  move: 0.7,
  mega: 0.6
};
class RawBattleStream extends BattleStreams.BattleStream {
  constructor(input) {
    super();
    this.input = !!input;
    this.rawInputLog = [];
  }
  _write(message) {
    if (this.input)
      console.log(message);
    this.rawInputLog.push(message);
    super._write(message);
  }
}
class DualStream {
  constructor(input, debug) {
    this.debug = debug;
    this.control = new RawBattleStream(input);
    this.test = new RawBattleStream(false);
  }
  get rawInputLog() {
    const control = this.control.rawInputLog;
    const test = this.test.rawInputLog;
    import_assert.strict.deepEqual(test, control);
    return control;
  }
  async read() {
    const control = await this.control.read();
    const test = await this.test.read();
    if (!this.debug)
      import_assert.strict.equal(import_state.State.normalizeLog(test), import_state.State.normalizeLog(control));
    return control;
  }
  write(message) {
    this.control._write(message);
    this.test._write(message);
    this.compare();
  }
  writeEnd() {
    this.compare(true);
    this.control._writeEnd();
    this.test._writeEnd();
  }
  compare(end) {
    if (!this.control.battle || !this.test.battle)
      return;
    const control = this.control.battle.toJSON();
    const test = this.test.battle.toJSON();
    try {
      import_assert.strict.deepEqual(import_state.State.normalize(test), import_state.State.normalize(control));
    } catch (err) {
      if (this.debug) {
        fs.writeFileSync("logs/control.json", JSON.stringify(control, null, 2));
        fs.writeFileSync("logs/test.json", JSON.stringify(test, null, 2));
      }
      throw new Error(err.message);
    }
    if (end)
      return;
    const send = this.test.battle.send;
    this.test.battle = import_battle.Battle.fromJSON(test);
    this.test.battle.restart(send);
  }
}
//# sourceMappingURL=runner.js.map
