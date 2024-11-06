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
var exhaustive_runner_exports = {};
__export(exhaustive_runner_exports, {
  ExhaustiveRunner: () => ExhaustiveRunner
});
module.exports = __toCommonJS(exhaustive_runner_exports);
var import_dex = require("../dex");
var import_prng = require("../prng");
var import_random_player_ai = require("./random-player-ai");
var import_runner = require("./runner");
/**
 * Battle Simulator exhaustive runner.
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * @license MIT
 */
const _ExhaustiveRunner = class {
  constructor(options) {
    this.format = options.format;
    this.cycles = options.cycles || _ExhaustiveRunner.DEFAULT_CYCLES;
    this.prng = options.prng && !Array.isArray(options.prng) ? options.prng : new import_prng.PRNG(options.prng);
    this.log = !!options.log;
    this.maxGames = options.maxGames;
    this.maxFailures = options.maxFailures || _ExhaustiveRunner.MAX_FAILURES;
    this.dual = options.dual || false;
    this.failures = 0;
    this.games = 0;
  }
  async run() {
    const dex = import_dex.Dex.forFormat(this.format);
    dex.loadData();
    const seed = this.prng.seed;
    const pools = this.createPools(dex);
    const createAI = (s, o) => new CoordinatedPlayerAI(s, o, pools);
    const generator = new TeamGenerator(dex, this.prng, pools, _ExhaustiveRunner.getSignatures(dex, pools));
    do {
      this.games++;
      try {
        const is4P = dex.formats.get(this.format).gameType === "multi";
        await new import_runner.Runner({
          prng: this.prng,
          p1options: { team: generator.generate(), createAI },
          p2options: { team: generator.generate(), createAI },
          p3options: is4P ? { team: generator.generate(), createAI } : void 0,
          p4options: is4P ? { team: generator.generate(), createAI } : void 0,
          format: this.format,
          dual: this.dual,
          error: true
        }).run();
        if (this.log)
          this.logProgress(pools);
      } catch (err) {
        this.failures++;
        console.error(
          `

Run \`node tools/simulate exhaustive --cycles=${this.cycles} --format=${this.format} --seed=${seed.join()}\`:
`,
          err
        );
      }
    } while ((!this.maxGames || this.games < this.maxGames) && (!this.maxFailures || this.failures < this.maxFailures) && generator.exhausted < this.cycles);
    return this.failures;
  }
  createPools(dex) {
    return {
      pokemon: new Pool(
        _ExhaustiveRunner.onlyValid(dex.gen, dex.data.Pokedex, (p) => dex.species.get(p), (_, p) => p.name !== "Pichu-Spiky-eared" && p.name.substr(0, 8) !== "Pikachu-" && p.name !== "Greninja-Bond"),
        this.prng
      ),
      items: new Pool(_ExhaustiveRunner.onlyValid(dex.gen, dex.data.Items, (i) => dex.items.get(i)), this.prng),
      abilities: new Pool(_ExhaustiveRunner.onlyValid(dex.gen, dex.data.Abilities, (a) => dex.abilities.get(a)), this.prng),
      moves: new Pool(_ExhaustiveRunner.onlyValid(
        dex.gen,
        dex.data.Moves,
        (m) => dex.moves.get(m),
        (m) => m !== "struggle" && (m === "hiddenpower" || m.substr(0, 11) !== "hiddenpower")
      ), this.prng)
    };
  }
  logProgress(p) {
    if (this.games)
      process.stdout.write("\r\x1B[K");
    process.stdout.write(
      `[${this.format}] P:${p.pokemon} I:${p.items} A:${p.abilities} M:${p.moves} = ${this.games}`
    );
  }
  static getSignatures(dex, pools) {
    const signatures = /* @__PURE__ */ new Map();
    for (const id of pools.items.possible) {
      const item = dex.data.Items[id];
      if (item.megaEvolves) {
        const pokemon = (0, import_dex.toID)(item.megaEvolves);
        const combo = { item: id };
        let combos = signatures.get(pokemon);
        if (!combos) {
          combos = [];
          signatures.set(pokemon, combos);
        }
        combos.push(combo);
      } else if (item.itemUser) {
        for (const user of item.itemUser) {
          const pokemon = (0, import_dex.toID)(user);
          const combo = { item: id };
          if (item.zMoveFrom)
            combo.move = (0, import_dex.toID)(item.zMoveFrom);
          let combos = signatures.get(pokemon);
          if (!combos) {
            combos = [];
            signatures.set(pokemon, combos);
          }
          combos.push(combo);
        }
      }
    }
    return signatures;
  }
  static onlyValid(gen, obj, getter, additional, nonStandard) {
    return Object.keys(obj).filter((k) => {
      const v = getter(k);
      return v.gen <= gen && (!v.isNonstandard || !!nonStandard) && (!additional || additional(k, v));
    });
  }
};
let ExhaustiveRunner = _ExhaustiveRunner;
ExhaustiveRunner.DEFAULT_CYCLES = 1;
ExhaustiveRunner.MAX_FAILURES = 10;
// TODO: Add triple battles once supported by the AI.
ExhaustiveRunner.FORMATS = [
  "gen9customgame",
  "gen9doublescustomgame",
  "gen8customgame",
  "gen8doublescustomgame",
  "gen7customgame",
  "gen7doublescustomgame",
  "gen6customgame",
  "gen6doublescustomgame",
  "gen5customgame",
  "gen5doublescustomgame",
  "gen4customgame",
  "gen4doublescustomgame",
  "gen3customgame",
  "gen3doublescustomgame",
  "gen2customgame",
  "gen1customgame"
];
const _TeamGenerator = class {
  constructor(dex, prng, pools, signatures) {
    this.dex = dex;
    this.prng = prng && !Array.isArray(prng) ? prng : new import_prng.PRNG(prng);
    this.pools = pools;
    this.signatures = signatures;
    this.natures = Object.keys(this.dex.data.Natures);
  }
  get exhausted() {
    const exhausted = [this.pools.pokemon.exhausted, this.pools.moves.exhausted];
    if (this.dex.gen >= 2)
      exhausted.push(this.pools.items.exhausted);
    if (this.dex.gen >= 3)
      exhausted.push(this.pools.abilities.exhausted);
    return Math.min.apply(null, exhausted);
  }
  generate() {
    const team = [];
    for (const pokemon of this.pools.pokemon.next(6)) {
      const species = this.dex.species.get(pokemon);
      const randomEVs = () => this.prng.next(253);
      const randomIVs = () => this.prng.next(32);
      let item;
      const moves = [];
      const combos = this.signatures.get(species.id);
      if (combos && this.prng.next() > _TeamGenerator.COMBO) {
        const combo = this.prng.sample(combos);
        item = combo.item;
        if (combo.move)
          moves.push(combo.move);
      } else {
        item = this.dex.gen >= 2 ? this.pools.items.next() : "";
      }
      team.push({
        name: species.baseSpecies,
        species: species.name,
        gender: species.gender,
        item,
        ability: this.dex.gen >= 3 ? this.pools.abilities.next() : "None",
        moves: moves.concat(...this.pools.moves.next(4 - moves.length)),
        evs: {
          hp: randomEVs(),
          atk: randomEVs(),
          def: randomEVs(),
          spa: randomEVs(),
          spd: randomEVs(),
          spe: randomEVs()
        },
        ivs: {
          hp: randomIVs(),
          atk: randomIVs(),
          def: randomIVs(),
          spa: randomIVs(),
          spd: randomIVs(),
          spe: randomIVs()
        },
        nature: this.prng.sample(this.natures),
        level: this.prng.next(50, 100),
        happiness: this.prng.next(256),
        shiny: this.prng.randomChance(1, 1024)
      });
    }
    return team;
  }
};
let TeamGenerator = _TeamGenerator;
// By default, the TeamGenerator generates sets completely at random which unforunately means
// certain signature combinations (eg. Mega Stone/Z Moves which only work for specific Pokemon)
// are unlikely to be chosen. To combat this, we keep a mapping of these combinations and some
// fraction of the time when we are generating sets for these particular Pokemon we give them
// the combinations they need to exercise the simulator more thoroughly.
TeamGenerator.COMBO = 0.5;
class Pool {
  constructor(possible, prng) {
    this.possible = possible;
    this.prng = prng;
    this.exhausted = 0;
    this.unused = /* @__PURE__ */ new Set();
  }
  toString() {
    return `${this.exhausted} (${this.unused.size}/${this.possible.length})`;
  }
  reset() {
    if (this.filled)
      this.exhausted++;
    this.iter = void 0;
    this.unused = new Set(this.shuffle(this.possible));
    if (this.possible.length && this.filled) {
      for (const used of this.filled) {
        this.unused.delete(used);
      }
      this.filled = /* @__PURE__ */ new Set();
      if (!this.unused.size)
        this.reset();
    } else {
      this.filled = /* @__PURE__ */ new Set();
    }
    this.filler = this.possible.slice();
  }
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.prng.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  wasUsed(k) {
    this.iter = void 0;
    return !this.unused.has(k);
  }
  markUsed(k) {
    this.iter = void 0;
    this.unused.delete(k);
  }
  next(num) {
    if (!num)
      return this.choose();
    const chosen = [];
    for (let i = 0; i < num; i++) {
      chosen.push(this.choose());
    }
    return chosen;
  }
  // Returns the next option in our set of unused options which were shuffled
  // before insertion so as to come out in random order. The iterator is
  // reset when the pools are manipulated by the CombinedPlayerAI (`markUsed`
  // as it mutates the set, but also `wasUsed` because resetting the
  // iterator isn't so much 'marking it as invalid' as 'signalling that we
  // should move the unused options to the top again').
  //
  // As the pool of options dwindles, we run into scenarios where `choose`
  // will keep returning the same options. This helps ensure they get used,
  // but having a game with every Pokemon having the same move or ability etc
  // is less realistic, so instead we 'fill' out the remaining choices during a
  // generator round (ie. until our iterator gets invalidated during gameplay).
  //
  // The 'filler' choices are tracked in `filled` to later subtract from the next
  // exhaustion cycle of this pool, but in theory we could be so unlucky that
  // we loop through our fillers multiple times while dealing with a few stubborn
  // remaining options in `unused`, therefore undercounting our `exhausted` total,
  // but this is considered to be unlikely enough that we don't care (and
  // `exhausted` is a lower bound anyway).
  choose() {
    if (!this.unused.size)
      this.reset();
    if (this.iter) {
      if (!this.iter.done) {
        const next2 = this.iter.next();
        this.iter.done = next2.done;
        if (!next2.done)
          return next2.value;
      }
      return this.fill();
    }
    this.iter = this.unused.values();
    const next = this.iter.next();
    this.iter.done = next.done;
    return next.value;
  }
  fill() {
    let length = this.filler.length;
    if (!length) {
      this.filler = this.possible.slice();
      length = this.filler.length;
    }
    const index = this.prng.next(length);
    const element = this.filler[index];
    this.filler[index] = this.filler[length - 1];
    this.filler.pop();
    this.filled.add(element);
    return element;
  }
}
class CoordinatedPlayerAI extends import_random_player_ai.RandomPlayerAI {
  constructor(playerStream, options, pools) {
    super(playerStream, options);
    this.pools = pools;
  }
  chooseTeamPreview(team) {
    return `team ${this.choosePokemon(team.map((p, i) => ({ slot: i + 1, pokemon: p }))) || 1}`;
  }
  chooseMove(active, moves) {
    this.markUsedIfGmax(active);
    for (const { choice, move } of moves) {
      const id = this.fixMove(move);
      if (!this.pools.moves.wasUsed(id)) {
        this.pools.moves.markUsed(id);
        return choice;
      }
    }
    return super.chooseMove(active, moves);
  }
  chooseSwitch(active, switches) {
    this.markUsedIfGmax(active);
    return this.choosePokemon(switches) || super.chooseSwitch(active, switches);
  }
  choosePokemon(choices) {
    for (const { slot, pokemon } of choices) {
      const species = (0, import_dex.toID)(pokemon.details.split(",")[0]);
      if (!this.pools.pokemon.wasUsed(species) || !this.pools.abilities.wasUsed(pokemon.baseAbility) || !this.pools.items.wasUsed(pokemon.item) || pokemon.moves.some((m) => !this.pools.moves.wasUsed(this.fixMove(m)))) {
        this.pools.pokemon.markUsed(species);
        this.pools.abilities.markUsed(pokemon.baseAbility);
        this.pools.items.markUsed(pokemon.item);
        return slot;
      }
    }
  }
  // The move options provided by the simulator have been converted from the name
  // which we're tracking, so we need to convert them back.
  fixMove(m) {
    const id = (0, import_dex.toID)(m.move);
    if (id.startsWith("return"))
      return "return";
    if (id.startsWith("frustration"))
      return "frustration";
    if (id.startsWith("hiddenpower"))
      return "hiddenpower";
    return id;
  }
  // Gigantamax Pokemon need to be special cased for tracking because the current
  // tracking only works if you can switch in a Pokemon.
  markUsedIfGmax(active) {
    if (active && !active.canDynamax && active.maxMoves && active.maxMoves.gigantamax) {
      this.pools.pokemon.markUsed((0, import_dex.toID)(active.maxMoves.gigantamax));
    }
  }
}
//# sourceMappingURL=exhaustive-runner.js.map
