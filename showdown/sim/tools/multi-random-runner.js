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
var multi_random_runner_exports = {};
__export(multi_random_runner_exports, {
  MultiRandomRunner: () => MultiRandomRunner
});
module.exports = __toCommonJS(multi_random_runner_exports);
var import_prng = require("../prng");
var import_runner = require("./runner");
/**
 * Battle Simulator multi random runner.
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * @license MIT
 */
const _MultiRandomRunner = class {
  constructor(options) {
    this.options = { ...options };
    this.totalGames = options.totalGames;
    this.prng = options.prng && !Array.isArray(options.prng) ? options.prng : new import_prng.PRNG(options.prng);
    this.options.prng = this.prng;
    this.format = options.format;
    this.cycle = !!options.cycle;
    this.all = !!options.all;
    this.isAsync = !!options.async;
    this.formatIndex = 0;
    this.numGames = 0;
  }
  async run() {
    let games = [];
    let format;
    let lastFormat = false;
    let failures = 0;
    while (format = this.getNextFormat()) {
      if (this.all && lastFormat && format !== lastFormat) {
        if (this.isAsync)
          await Promise.all(games);
        games = [];
      }
      const seed = this.prng.seed;
      const game = new import_runner.Runner({ format, ...this.options }).run().catch((err) => {
        failures++;
        console.error(
          `Run \`node tools/simulate multi 1 --format=${format} --seed=${seed.join()}\` to debug (optionally with \`--output\` and/or \`--input\` for more info):
`,
          err
        );
      });
      if (!this.isAsync)
        await game;
      games.push(game);
      lastFormat = format;
    }
    if (this.isAsync)
      await Promise.all(games);
    return failures;
  }
  getNextFormat() {
    const FORMATS = _MultiRandomRunner.FORMATS;
    if (this.formatIndex > FORMATS.length)
      return false;
    if (this.numGames++ < this.totalGames) {
      if (this.format) {
        return this.format;
      } else if (this.all) {
        return FORMATS[this.formatIndex];
      } else if (this.cycle) {
        const format = FORMATS[this.formatIndex];
        this.formatIndex = (this.formatIndex + 1) % FORMATS.length;
        return format;
      } else {
        return this.prng.sample(FORMATS);
      }
    } else if (this.all) {
      this.numGames = 1;
      this.formatIndex++;
      return FORMATS[this.formatIndex];
    }
    return false;
  }
};
let MultiRandomRunner = _MultiRandomRunner;
MultiRandomRunner.FORMATS = [
  "gen8randombattle",
  "gen8randomdoublesbattle",
  "gen8battlefactory",
  "gen7randombattle",
  "gen7randomdoublesbattle",
  "gen7battlefactory",
  "gen6randombattle",
  "gen6battlefactory",
  "gen5randombattle",
  "gen4randombattle",
  "gen3randombattle",
  "gen2randombattle",
  "gen1randombattle"
];
//# sourceMappingURL=multi-random-runner.js.map
