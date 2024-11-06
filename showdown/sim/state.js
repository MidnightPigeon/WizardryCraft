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
var state_exports = {};
__export(state_exports, {
  State: () => State
});
module.exports = __toCommonJS(state_exports);
var import_battle = require("./battle");
var import_dex = require("./dex");
var import_field = require("./field");
var import_pokemon = require("./pokemon");
var import_prng = require("./prng");
var import_side = require("./side");
/**
 * Simulator State
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * Helper functions for serializing Battle instances to JSON and back.
 *
 * (You might also consider using input logs instead.)
 *
 * @license MIT
 */
const POSITIONS = "abcdefghijklmnopqrstuvwx";
const BATTLE = /* @__PURE__ */ new Set([
  "dex",
  "gen",
  "ruleTable",
  "id",
  "log",
  "inherit",
  "format",
  "teamGenerator",
  "HIT_SUBSTITUTE",
  "NOT_FAIL",
  "FAIL",
  "SILENT_FAIL",
  "field",
  "sides",
  "prng",
  "hints",
  "deserialized",
  "queue",
  "actions"
]);
const FIELD = /* @__PURE__ */ new Set(["id", "battle"]);
const SIDE = /* @__PURE__ */ new Set(["battle", "team", "pokemon", "choice", "activeRequest"]);
const POKEMON = /* @__PURE__ */ new Set([
  "side",
  "battle",
  "set",
  "name",
  "fullname",
  "id",
  "happiness",
  "level",
  "pokeball",
  "baseMoveSlots"
]);
const CHOICE = /* @__PURE__ */ new Set(["switchIns"]);
const ACTIVE_MOVE = /* @__PURE__ */ new Set(["move"]);
const State = new class {
  serializeBattle(battle) {
    const state = this.serialize(battle, BATTLE, battle);
    state.field = this.serializeField(battle.field);
    state.sides = new Array(battle.sides.length);
    for (const [i, side] of battle.sides.entries()) {
      state.sides[i] = this.serializeSide(side);
    }
    state.prng = battle.prng.seed;
    state.hints = Array.from(battle.hints);
    state.log = battle.log;
    state.queue = this.serializeWithRefs(battle.queue.list, battle);
    state.formatid = battle.format.id;
    return state;
  }
  // Deserialization can only really be done on the root Battle object as
  // the leaf nodes like Side or Pokemon contain backreferences to Battle
  // but don't contain the information to fill it in because the cycles in
  // the graph have been serialized as references. Once deserialzized, the
  // Battle can then be restarted (and provided with a `send` function for
  // receiving updates).
  deserializeBattle(serialized) {
    const state = typeof serialized === "string" ? JSON.parse(serialized) : serialized;
    const options = {
      formatid: state.formatid,
      seed: state.prngSeed,
      rated: state.rated,
      debug: state.debugMode,
      // We need to tell the Battle that we're creating that it's been
      // deserialized so that it allows us to populate it correctly and
      // doesn't attempt to start playing out until we're ready.
      deserialized: true,
      strictChoices: state.strictChoices
    };
    for (const side of state.sides) {
      const team = side.team.split(side.team.length > 9 ? "," : "");
      options[side.id] = {
        name: side.name,
        avatar: side.avatar,
        team: team.map((p) => side.pokemon[Number(p) - 1].set)
      };
    }
    const battle = new import_battle.Battle(options);
    for (const [i, s] of state.sides.entries()) {
      const side = battle.sides[i];
      const ordered = new Array(side.pokemon.length);
      const team = s.team.split(s.team.length > 9 ? "," : "");
      for (const [j, pos] of team.entries()) {
        ordered[Number(pos) - 1] = side.pokemon[j];
      }
      side.pokemon = ordered;
    }
    this.deserialize(state, battle, BATTLE, battle);
    this.deserializeField(state.field, battle.field);
    let activeRequests = false;
    for (const [i, side] of state.sides.entries()) {
      this.deserializeSide(side, battle.sides[i]);
      activeRequests = activeRequests || side.activeRequest === void 0;
    }
    if (activeRequests) {
      const requests = battle.getRequests(battle.requestState);
      for (const [i, side] of state.sides.entries()) {
        battle.sides[i].activeRequest = side.activeRequest === null ? null : requests[i];
      }
    }
    battle.prng = new import_prng.PRNG(state.prng);
    const queue = this.deserializeWithRefs(state.queue, battle);
    battle.queue.list = queue;
    battle.hints = new Set(state.hints);
    battle.log = state.log;
    return battle;
  }
  // Direct comparsions of serialized state will be flakey as the timestamp
  // protocol message |t:| can diverge between two different runs over the same state.
  // State must first be normalized before it is comparable.
  normalize(state) {
    state.log = this.normalizeLog(state.log);
    return state;
  }
  normalizeLog(log) {
    if (!log)
      return log;
    const normalized = (typeof log === "string" ? log.split("\n") : log).map((line) => line.startsWith(`|t:|`) ? `|t:|` : line);
    return typeof log === "string" ? normalized.join("\n") : normalized;
  }
  serializeField(field) {
    return this.serialize(field, FIELD, field.battle);
  }
  deserializeField(state, field) {
    this.deserialize(state, field, FIELD, field.battle);
  }
  serializeSide(side) {
    const state = this.serialize(side, SIDE, side.battle);
    state.pokemon = new Array(side.pokemon.length);
    const team = new Array(side.pokemon.length);
    for (const [i, pokemon] of side.pokemon.entries()) {
      state.pokemon[i] = this.serializePokemon(pokemon);
      team[side.team.indexOf(pokemon.set)] = i + 1;
    }
    state.team = team.join(team.length > 9 ? "," : "");
    state.choice = this.serializeChoice(side.choice, side.battle);
    if (side.activeRequest === null)
      state.activeRequest = null;
    return state;
  }
  deserializeSide(state, side) {
    this.deserialize(state, side, SIDE, side.battle);
    for (const [i, pokemon] of state.pokemon.entries()) {
      this.deserializePokemon(pokemon, side.pokemon[i]);
    }
    this.deserializeChoice(state.choice, side.choice, side.battle);
  }
  serializePokemon(pokemon) {
    const state = this.serialize(pokemon, POKEMON, pokemon.battle);
    state.set = pokemon.set;
    if (pokemon.baseMoveSlots.length !== pokemon.moveSlots.length || !pokemon.baseMoveSlots.every((ms, i) => ms === pokemon.moveSlots[i])) {
      state.baseMoveSlots = this.serializeWithRefs(pokemon.baseMoveSlots, pokemon.battle);
    }
    return state;
  }
  deserializePokemon(state, pokemon) {
    this.deserialize(state, pokemon, POKEMON, pokemon.battle);
    pokemon.set = state.set;
    let baseMoveSlots;
    if (state.baseMoveSlots) {
      baseMoveSlots = this.deserializeWithRefs(state.baseMoveSlots, pokemon.battle);
      for (const [i, baseMoveSlot] of baseMoveSlots.entries()) {
        const moveSlot = pokemon.moveSlots[i];
        if (moveSlot.id === baseMoveSlot.id && !moveSlot.virtual) {
          baseMoveSlots[i] = moveSlot;
        }
      }
    } else {
      baseMoveSlots = pokemon.moveSlots.slice();
    }
    pokemon.baseMoveSlots = baseMoveSlots;
    if (state.showCure === void 0)
      pokemon.showCure = void 0;
  }
  serializeChoice(choice, battle) {
    const state = this.serialize(choice, CHOICE, battle);
    state.switchIns = Array.from(choice.switchIns);
    return state;
  }
  deserializeChoice(state, choice, battle) {
    this.deserialize(state, choice, CHOICE, battle);
    choice.switchIns = new Set(state.switchIns);
  }
  // Simply looking for a 'hit' field to determine if an object is an ActiveMove or not seems
  // pretty fragile, but its no different than what the simulator is doing. We go further and
  // also check if the object has an 'id', as that's what we will intrepret as the Move.
  isActiveMove(obj) {
    return obj.hasOwnProperty("hit") && (obj.hasOwnProperty("id") || obj.hasOwnProperty("move"));
  }
  // ActiveMove is somewhat problematic (#5415) as it sometimes extends a Move and adds on
  // some mutable fields. We'd like to avoid displaying all the readonly fields of Move
  // (which in theory should not be changed by the ActiveMove...), so we collapse them
  // into a 'move: [Move:...]' reference.  If isActiveMove returns a false positive *and*
  // and object contains an 'id' field matching a Move *and* it contains fields with the
  // same name as said Move then we'll miss them during serialization and won't
  // deserialize properly. This is unlikely to be the case, and would probably indicate
  // a bug in the simulator if it ever happened, but if not, the isActiveMove check can
  // be extended.
  serializeActiveMove(move, battle) {
    const base = battle.dex.moves.get(move.id);
    const skip = /* @__PURE__ */ new Set([...ACTIVE_MOVE]);
    for (const [key, value] of Object.entries(base)) {
      if (typeof value === "object" || move[key] === value)
        skip.add(key);
    }
    const state = this.serialize(move, skip, battle);
    state.move = `[Move:${move.id}]`;
    return state;
  }
  deserializeActiveMove(state, battle) {
    const move = battle.dex.getActiveMove(this.fromRef(state.move, battle));
    this.deserialize(state, move, ACTIVE_MOVE, battle);
    return move;
  }
  serializeWithRefs(obj, battle) {
    switch (typeof obj) {
      case "function":
        return void 0;
      case "undefined":
      case "boolean":
      case "number":
      case "string":
        return obj;
      case "object":
        if (obj === null)
          return null;
        if (Array.isArray(obj)) {
          const arr = new Array(obj.length);
          for (const [i, o2] of obj.entries()) {
            arr[i] = this.serializeWithRefs(o2, battle);
          }
          return arr;
        }
        if (this.isActiveMove(obj))
          return this.serializeActiveMove(obj, battle);
        if (this.isReferable(obj))
          return this.toRef(obj);
        if (obj.constructor !== Object) {
          throw new TypeError(`Unsupported type ${obj.constructor.name}: ${obj}`);
        }
        const o = {};
        for (const [key, value] of Object.entries(obj)) {
          o[key] = this.serializeWithRefs(value, battle);
        }
        return o;
      default:
        throw new TypeError(`Unexpected typeof === '${typeof obj}': ${obj}`);
    }
  }
  deserializeWithRefs(obj, battle) {
    switch (typeof obj) {
      case "undefined":
      case "boolean":
      case "number":
        return obj;
      case "string":
        return this.fromRef(obj, battle) || obj;
      case "object":
        if (obj === null)
          return null;
        if (Array.isArray(obj)) {
          const arr = new Array(obj.length);
          for (const [i, o2] of obj.entries()) {
            arr[i] = this.deserializeWithRefs(o2, battle);
          }
          return arr;
        }
        if (this.isActiveMove(obj))
          return this.deserializeActiveMove(obj, battle);
        const o = {};
        for (const [key, value] of Object.entries(obj)) {
          o[key] = this.deserializeWithRefs(value, battle);
        }
        return o;
      case "function":
      default:
        throw new TypeError(`Unexpected typeof === '${typeof obj}': ${obj}`);
    }
  }
  isReferable(obj) {
    if (!this.REFERABLE) {
      this.REFERABLE = /* @__PURE__ */ new Set([
        import_battle.Battle,
        import_field.Field,
        import_side.Side,
        import_pokemon.Pokemon,
        import_dex.Dex.Condition,
        import_dex.Dex.Ability,
        import_dex.Dex.Item,
        import_dex.Dex.Move,
        import_dex.Dex.Species
      ]);
    }
    return this.REFERABLE.has(obj.constructor);
  }
  toRef(obj) {
    const id = obj instanceof import_pokemon.Pokemon ? `${obj.side.id}${POSITIONS[obj.position]}` : `${obj.id}`;
    return `[${obj.constructor.name}${id ? ":" : ""}${id}]`;
  }
  fromRef(ref, battle) {
    if (!ref.startsWith("[") && !ref.endsWith("]"))
      return void 0;
    ref = ref.substring(1, ref.length - 1);
    if (ref === "Battle")
      return battle;
    if (ref === "Field")
      return battle.field;
    const [type, id] = ref.split(":");
    switch (type) {
      case "Side":
        return battle.sides[Number(id[1]) - 1];
      case "Pokemon":
        return battle.sides[Number(id[1]) - 1].pokemon[POSITIONS.indexOf(id[2])];
      case "Ability":
        return battle.dex.abilities.get(id);
      case "Item":
        return battle.dex.items.get(id);
      case "Move":
        return battle.dex.moves.get(id);
      case "Condition":
        return battle.dex.conditions.get(id);
      case "Species":
        return battle.dex.species.get(id);
      default:
        return void 0;
    }
  }
  serialize(obj, skip, battle) {
    const state = {};
    for (const [key, value] of Object.entries(obj)) {
      if (skip.has(key))
        continue;
      const val = this.serializeWithRefs(value, battle);
      if (typeof val !== "undefined")
        state[key] = val;
    }
    return state;
  }
  deserialize(state, obj, skip, battle) {
    for (const [key, value] of Object.entries(state)) {
      if (skip.has(key))
        continue;
      obj[key] = this.deserializeWithRefs(value, battle);
    }
  }
}();
//# sourceMappingURL=state.js.map
