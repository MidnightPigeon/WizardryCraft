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
var battle_exports = {};
__export(battle_exports, {
  Battle: () => Battle,
  extractChannelMessages: () => extractChannelMessages
});
module.exports = __toCommonJS(battle_exports);
var import_dex_formats = require("./dex-formats");
var import_dex = require("./dex");
var import_teams = require("./teams");
var import_field = require("./field");
var import_pokemon = require("./pokemon");
var import_prng = require("./prng");
var import_side = require("./side");
var import_state = require("./state");
var import_battle_queue = require("./battle-queue");
var import_battle_actions = require("./battle-actions");
var import_lib = require("../lib");
var BagItems = __toESM(require("./bag-items"));
/**
 * Simulator Battle
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * This file is where the battle simulation itself happens.
 *
 * The most important part of the simulation is the event system:
 * see the `runEvent` function definition for details.
 *
 * General battle mechanics are in `battle-actions`; move-specific,
 * item-specific, etc mechanics are in the corresponding file in
 * `data`.
 *
 * @license MIT
 */
const splitRegex = /^\|split\|p([1234])\n(.*)\n(.*)|.+/gm;
function extractChannelMessages(message, channelIds) {
  const channelIdSet = new Set(channelIds);
  const channelMessages = {
    [-1]: [],
    0: [],
    1: [],
    2: [],
    3: [],
    4: []
  };
  for (const [lineMatch, playerMatch, secretMessage, sharedMessage] of message.matchAll(splitRegex)) {
    const player = playerMatch ? parseInt(playerMatch) : 0;
    for (const channelId of channelIdSet) {
      let line = lineMatch;
      if (player) {
        line = channelId === -1 || player === channelId ? secretMessage : sharedMessage;
        if (!line)
          continue;
      }
      channelMessages[channelId].push(line);
    }
  }
  return channelMessages;
}
class Battle {
  constructor(options) {
    this.toID = import_dex.toID;
    this.log = [];
    this.add("t:", Math.floor(Date.now() / 1e3));
    let format = void 0;
    if (!!options.format && options.format.debug == void 0) {
      format = new import_dex_formats.Format(options.format);
    } else {
      format = options.format || import_dex.Dex.formats.get(options.formatid, true);
    }
    this.format = format;
    this.dex = import_dex.Dex.forFormat(format);
    this.gen = options.format.gen || this.dex.gen;
    this.ruleTable = this.dex.formats.getRuleTable(format);
    this.trunc = this.dex.trunc;
    this.clampIntRange = import_lib.Utils.clampIntRange;
    for (const i in this.dex.data.Scripts) {
      const entry = this.dex.data.Scripts[i];
      if (typeof entry === "function")
        this[i] = entry;
    }
    if (format.battle)
      Object.assign(this, format.battle);
    this.id = "";
    this.debugMode = format.debug || !!options.debug;
    this.forceRandomChance = this.debugMode && typeof options.forceRandomChance === "boolean" ? options.forceRandomChance : null;
    this.deserialized = !!options.deserialized;
    this.strictChoices = !!options.strictChoices;
    this.formatData = { id: format.id };
    this.gameType = format.gameType || "singles";
    this.field = new import_field.Field(this);
    this.sides = Array(format.playerCount).fill(null);
    this.activePerHalf = this.gameType === "triples" ? 3 : format.playerCount > 2 || this.gameType === "doubles" ? 2 : 1;
    this.prng = options.prng || new import_prng.PRNG(options.seed || void 0);
    this.prngSeed = this.prng.startingSeed.slice();
    this.rated = options.rated || !!options.rated;
    this.reportExactHP = !!format.debug;
    this.reportPercentages = false;
    this.supportCancel = false;
    this.queue = new import_battle_queue.BattleQueue(this);
    this.actions = new import_battle_actions.BattleActions(this);
    this.faintQueue = [];
    this.inputLog = [];
    this.messageLog = [];
    this.sentLogPos = 0;
    this.sentEnd = false;
    this.requestState = "";
    this.turn = 0;
    this.midTurn = false;
    this.started = false;
    this.ended = false;
    this.effect = { id: "" };
    this.effectState = { id: "" };
    this.event = { id: "" };
    this.events = null;
    this.eventDepth = 0;
    this.activeMove = null;
    this.activePokemon = null;
    this.activeTarget = null;
    this.lastMove = null;
    this.lastMoveLine = -1;
    this.lastSuccessfulMoveThisTurn = null;
    this.lastDamage = 0;
    this.abilityOrder = 0;
    this.quickClawRoll = false;
    this.teamGenerator = null;
    this.hints = /* @__PURE__ */ new Set();
    this.NOT_FAIL = "";
    this.HIT_SUBSTITUTE = 0;
    this.FAIL = false;
    this.SILENT_FAIL = null;
    this.send = options.send || (() => {
    });
    const inputOptions = {
      formatid: options.formatid,
      seed: this.prng.seed
    };
    if (this.rated)
      inputOptions.rated = this.rated;
    if (typeof __version !== "undefined") {
      if (__version.head) {
        this.inputLog.push(`>version ${__version.head}`);
      }
      if (__version.origin) {
        this.inputLog.push(`>version-origin ${__version.origin}`);
      }
    }
    this.inputLog.push(`>start ` + JSON.stringify(inputOptions));
    this.add("gametype", this.gameType);
    for (const rule of this.ruleTable.keys()) {
      if ("+*-!".includes(rule.charAt(0)))
        continue;
      const subFormat = this.dex.formats.get(rule);
      if (subFormat.exists) {
        const hasEventHandler = Object.keys(subFormat).some(
          // skip event handlers that are handled elsewhere
          (val) => val.startsWith("on") && ![
            "onBegin",
            "onTeamPreview",
            "onBattleStart",
            "onValidateRule",
            "onValidateTeam",
            "onChangeSet",
            "onValidateSet"
          ].includes(val)
        );
        if (hasEventHandler)
          this.field.addPseudoWeather(rule);
      }
    }
    const sides = ["p1", "p2", "p3", "p4"];
    for (const side of sides) {
      if (options[side]) {
        this.setPlayer(side, options[side]);
      }
    }
  }
  toJSON() {
    return import_state.State.serializeBattle(this);
  }
  static fromJSON(serialized) {
    return import_state.State.deserializeBattle(serialized);
  }
  get p1() {
    return this.sides[0];
  }
  get p2() {
    return this.sides[1];
  }
  get p3() {
    return this.sides[2];
  }
  get p4() {
    return this.sides[3];
  }
  toString() {
    return `Battle: ${this.format}`;
  }
  random(m, n) {
    return this.prng.next(m, n);
  }
  randomChance(numerator, denominator) {
    if (this.forceRandomChance !== null)
      return this.forceRandomChance;
    return this.prng.randomChance(numerator, denominator);
  }
  sample(items) {
    return this.prng.sample(items);
  }
  /** Note that passing `undefined` resets to the starting seed, but `null` will roll a new seed */
  resetRNG(seed = this.prng.startingSeed) {
    this.prng = new import_prng.PRNG(seed);
    this.add("message", "The battle's RNG was reset.");
  }
  suppressingAbility(target) {
    return this.activePokemon && this.activePokemon.isActive && (this.activePokemon !== target || this.gen < 8) && this.activeMove && this.activeMove.ignoreAbility && !target?.hasItem("Ability Shield");
  }
  setActiveMove(move, pokemon, target) {
    this.activeMove = move || null;
    this.activePokemon = pokemon || null;
    this.activeTarget = target || pokemon || null;
  }
  clearActiveMove(failed) {
    if (this.activeMove) {
      if (!failed) {
        this.lastMove = this.activeMove;
      }
      this.activeMove = null;
      this.activePokemon = null;
      this.activeTarget = null;
    }
  }
  updateSpeed() {
    for (const pokemon of this.getAllActive()) {
      pokemon.updateSpeed();
    }
  }
  /**
   * The default sort order for actions, but also event listeners.
   *
   * 1. Order, low to high (default last)
   * 2. Priority, high to low (default 0)
   * 3. Speed, high to low (default 0)
   * 4. SubOrder, low to high (default 0)
   *
   * Doesn't reference `this` so doesn't need to be bound.
   */
  comparePriority(a, b) {
    return -((b.order || 4294967296) - (a.order || 4294967296)) || (b.priority || 0) - (a.priority || 0) || (b.speed || 0) - (a.speed || 0) || -((b.subOrder || 0) - (a.subOrder || 0)) || 0;
  }
  static compareRedirectOrder(a, b) {
    return (b.priority || 0) - (a.priority || 0) || (b.speed || 0) - (a.speed || 0) || (a.effectHolder && b.effectHolder ? -(b.effectHolder.abilityOrder - a.effectHolder.abilityOrder) : 0) || 0;
  }
  static compareLeftToRightOrder(a, b) {
    return -((b.order || 4294967296) - (a.order || 4294967296)) || (b.priority || 0) - (a.priority || 0) || -((b.index || 0) - (a.index || 0)) || 0;
  }
  /** Sort a list, resolving speed ties the way the games do. */
  speedSort(list, comparator = this.comparePriority) {
    if (list.length < 2)
      return;
    let sorted = 0;
    while (sorted + 1 < list.length) {
      let nextIndexes = [sorted];
      for (let i = sorted + 1; i < list.length; i++) {
        const delta = comparator(list[nextIndexes[0]], list[i]);
        if (delta < 0)
          continue;
        if (delta > 0)
          nextIndexes = [i];
        if (delta === 0)
          nextIndexes.push(i);
      }
      for (let i = 0; i < nextIndexes.length; i++) {
        const index = nextIndexes[i];
        if (index !== sorted + i) {
          [list[sorted + i], list[index]] = [list[index], list[sorted + i]];
        }
      }
      if (nextIndexes.length > 1) {
        this.prng.shuffle(list, sorted, sorted + nextIndexes.length);
      }
      sorted += nextIndexes.length;
    }
  }
  /**
   * Runs an event with no source on each Pokémon on the field, in Speed order.
   */
  eachEvent(eventid, effect, relayVar) {
    const actives = this.getAllActive();
    if (!effect && this.effect)
      effect = this.effect;
    this.speedSort(actives, (a, b) => b.speed - a.speed);
    for (const pokemon of actives) {
      this.runEvent(eventid, pokemon, null, effect, relayVar);
    }
    if (eventid === "Weather" && this.gen >= 7) {
      this.eachEvent("Update");
    }
  }
  /**
   * Runs an event with no source on each effect on the field, in Speed order.
   *
   * Unlike `eachEvent`, this contains a lot of other handling and is intended only for the residual step.
   */
  residualEvent(eventid, relayVar) {
    const callbackName = `on${eventid}`;
    let handlers = this.findBattleEventHandlers(callbackName, "duration");
    handlers = handlers.concat(this.findFieldEventHandlers(this.field, `onField${eventid}`, "duration"));
    for (const side of this.sides) {
      if (side.n < 2 || !side.allySide) {
        handlers = handlers.concat(this.findSideEventHandlers(side, `onSide${eventid}`, "duration"));
      }
      for (const active of side.active) {
        if (!active)
          continue;
        handlers = handlers.concat(this.findPokemonEventHandlers(active, callbackName, "duration"));
        handlers = handlers.concat(this.findSideEventHandlers(side, callbackName, void 0, active));
        handlers = handlers.concat(this.findFieldEventHandlers(this.field, callbackName, void 0, active));
      }
    }
    this.speedSort(handlers);
    while (handlers.length) {
      const handler = handlers[0];
      handlers.shift();
      const effect = handler.effect;
      if (handler.effectHolder.fainted)
        continue;
      if (handler.end && handler.state && handler.state.duration) {
        handler.state.duration--;
        if (!handler.state.duration) {
          const endCallArgs = handler.endCallArgs || [handler.effectHolder, effect.id];
          handler.end.call(...endCallArgs);
          if (this.ended)
            return;
          continue;
        }
      }
      let handlerEventid = eventid;
      if (handler.effectHolder.sideConditions)
        handlerEventid = `Side${eventid}`;
      if (handler.effectHolder.pseudoWeather)
        handlerEventid = `Field${eventid}`;
      if (handler.callback) {
        this.singleEvent(handlerEventid, effect, handler.state, handler.effectHolder, null, null, relayVar, handler.callback);
      }
      this.faintMessages();
      if (this.ended)
        return;
    }
  }
  /** The entire event system revolves around this function and runEvent. */
  singleEvent(eventid, effect, state, target, source, sourceEffect, relayVar, customCallback) {
    if (this.eventDepth >= 8) {
      this.add("message", "STACK LIMIT EXCEEDED");
      this.add("message", "PLEASE REPORT IN BUG THREAD");
      this.add("message", "Event: " + eventid);
      this.add("message", "Parent event: " + this.event.id);
      throw new Error("Stack overflow");
    }
    if (this.log.length - this.sentLogPos > 1e3) {
      this.add("message", "LINE LIMIT EXCEEDED");
      this.add("message", "PLEASE REPORT IN BUG THREAD");
      this.add("message", "Event: " + eventid);
      this.add("message", "Parent event: " + this.event.id);
      throw new Error("Infinite loop");
    }
    let hasRelayVar = true;
    if (relayVar === void 0) {
      relayVar = true;
      hasRelayVar = false;
    }
    if (effect.effectType === "Status" && target instanceof import_pokemon.Pokemon && target.status !== effect.id) {
      return relayVar;
    }
    if (eventid !== "Start" && eventid !== "TakeItem" && eventid !== "Primal" && effect.effectType === "Item" && target instanceof import_pokemon.Pokemon && target.ignoringItem()) {
      this.debug(eventid + " handler suppressed by Embargo, Klutz or Magic Room");
      return relayVar;
    }
    if (eventid !== "End" && effect.effectType === "Ability" && target instanceof import_pokemon.Pokemon && target.ignoringAbility()) {
      this.debug(eventid + " handler suppressed by Gastro Acid or Neutralizing Gas");
      return relayVar;
    }
    if (effect.effectType === "Weather" && eventid !== "FieldStart" && eventid !== "FieldResidual" && eventid !== "FieldEnd" && this.field.suppressingWeather()) {
      this.debug(eventid + " handler suppressed by Air Lock");
      return relayVar;
    }
    const callback = customCallback || effect[`on${eventid}`];
    if (callback === void 0)
      return relayVar;
    const parentEffect = this.effect;
    const parentEffectState = this.effectState;
    const parentEvent = this.event;
    this.effect = effect;
    this.effectState = state || {};
    this.event = { id: eventid, target, source, effect: sourceEffect };
    this.eventDepth++;
    const args = [target, source, sourceEffect];
    if (hasRelayVar)
      args.unshift(relayVar);
    let returnVal;
    if (typeof callback === "function") {
      returnVal = callback.apply(this, args);
    } else {
      returnVal = callback;
    }
    this.eventDepth--;
    this.effect = parentEffect;
    this.effectState = parentEffectState;
    this.event = parentEvent;
    return returnVal === void 0 ? relayVar : returnVal;
  }
  /**
   * runEvent is the core of Pokemon Showdown's event system.
   *
   * Basic usage
   * ===========
   *
   *   this.runEvent('Blah')
   * will trigger any onBlah global event handlers.
   *
   *   this.runEvent('Blah', target)
   * will additionally trigger any onBlah handlers on the target, onAllyBlah
   * handlers on any active pokemon on the target's team, and onFoeBlah
   * handlers on any active pokemon on the target's foe's team
   *
   *   this.runEvent('Blah', target, source)
   * will additionally trigger any onSourceBlah handlers on the source
   *
   *   this.runEvent('Blah', target, source, effect)
   * will additionally pass the effect onto all event handlers triggered
   *
   *   this.runEvent('Blah', target, source, effect, relayVar)
   * will additionally pass the relayVar as the first argument along all event
   * handlers
   *
   * You may leave any of these null. For instance, if you have a relayVar but
   * no source or effect:
   *   this.runEvent('Damage', target, null, null, 50)
   *
   * Event handlers
   * ==============
   *
   * Items, abilities, statuses, and other effects like SR, confusion, weather,
   * or Trick Room can have event handlers. Event handlers are functions that
   * can modify what happens during an event.
   *
   * event handlers are passed:
   *   function (target, source, effect)
   * although some of these can be blank.
   *
   * certain events have a relay variable, in which case they're passed:
   *   function (relayVar, target, source, effect)
   *
   * Relay variables are variables that give additional information about the
   * event. For instance, the damage event has a relayVar which is the amount
   * of damage dealt.
   *
   * If a relay variable isn't passed to runEvent, there will still be a secret
   * relayVar defaulting to `true`, but it won't get passed to any event
   * handlers.
   *
   * After an event handler is run, its return value helps determine what
   * happens next:
   * 1. If the return value isn't `undefined`, relayVar is set to the return
   *    value
   * 2. If relayVar is falsy, no more event handlers are run
   * 3. Otherwise, if there are more event handlers, the next one is run and
   *    we go back to step 1.
   * 4. Once all event handlers are run (or one of them results in a falsy
   *    relayVar), relayVar is returned by runEvent
   *
   * As a shortcut, an event handler that isn't a function will be interpreted
   * as a function that returns that value.
   *
   * You can have return values mean whatever you like, but in general, we
   * follow the convention that returning `false` or `null` means
   * stopping or interrupting the event.
   *
   * For instance, returning `false` from a TrySetStatus handler means that
   * the pokemon doesn't get statused.
   *
   * If a failed event usually results in a message like "But it failed!"
   * or "It had no effect!", returning `null` will suppress that message and
   * returning `false` will display it. Returning `null` is useful if your
   * event handler already gave its own custom failure message.
   *
   * Returning `undefined` means "don't change anything" or "keep going".
   * A function that does nothing but return `undefined` is the equivalent
   * of not having an event handler at all.
   *
   * Returning a value means that that value is the new `relayVar`. For
   * instance, if a Damage event handler returns 50, the damage event
   * will deal 50 damage instead of whatever it was going to deal before.
   *
   * Useful values
   * =============
   *
   * In addition to all the methods and attributes of Dex, Battle, and
   * Scripts, event handlers have some additional values they can access:
   *
   * this.effect:
   *   the Effect having the event handler
   * this.effectState:
   *   the data store associated with the above Effect. This is a plain Object
   *   and you can use it to store data for later event handlers.
   * this.effectState.target:
   *   the Pokemon, Side, or Battle that the event handler's effect was
   *   attached to.
   * this.event.id:
   *   the event ID
   * this.event.target, this.event.source, this.event.effect:
   *   the target, source, and effect of the event. These are the same
   *   variables that are passed as arguments to the event handler, but
   *   they're useful for functions called by the event handler.
   */
  runEvent(eventid, target, source, sourceEffect, relayVar, onEffect, fastExit) {
    if (this.eventDepth >= 8) {
      this.add("message", "STACK LIMIT EXCEEDED");
      this.add("message", "PLEASE REPORT IN BUG THREAD");
      this.add("message", "Event: " + eventid);
      this.add("message", "Parent event: " + this.event.id);
      throw new Error("Stack overflow");
    }
    if (!target)
      target = this;
    let effectSource = null;
    if (source instanceof import_pokemon.Pokemon)
      effectSource = source;
    const handlers = this.findEventHandlers(target, eventid, effectSource);
    if (onEffect) {
      if (!sourceEffect)
        throw new Error("onEffect passed without an effect");
      const callback = sourceEffect[`on${eventid}`];
      if (callback !== void 0) {
        if (Array.isArray(target))
          throw new Error("");
        handlers.unshift(this.resolvePriority({
          effect: sourceEffect,
          callback,
          state: {},
          end: null,
          effectHolder: target
        }, `on${eventid}`));
      }
    }
    if (["Invulnerability", "TryHit", "DamagingHit", "EntryHazard"].includes(eventid)) {
      handlers.sort(Battle.compareLeftToRightOrder);
    } else if (fastExit) {
      handlers.sort(Battle.compareRedirectOrder);
    } else {
      this.speedSort(handlers);
    }
    let hasRelayVar = 1;
    const args = [target, source, sourceEffect];
    if (relayVar === void 0 || relayVar === null) {
      relayVar = true;
      hasRelayVar = 0;
    } else {
      args.unshift(relayVar);
    }
    const parentEvent = this.event;
    this.event = { id: eventid, target, source, effect: sourceEffect, modifier: 1 };
    this.eventDepth++;
    let targetRelayVars = [];
    if (Array.isArray(target)) {
      if (Array.isArray(relayVar)) {
        targetRelayVars = relayVar;
      } else {
        for (let i = 0; i < target.length; i++)
          targetRelayVars[i] = true;
      }
    }
    for (const handler of handlers) {
      if (handler.index !== void 0) {
        if (!targetRelayVars[handler.index] && !(targetRelayVars[handler.index] === 0 && eventid === "DamagingHit"))
          continue;
        if (handler.target) {
          args[hasRelayVar] = handler.target;
          this.event.target = handler.target;
        }
        if (hasRelayVar)
          args[0] = targetRelayVars[handler.index];
      }
      const effect = handler.effect;
      const effectHolder = handler.effectHolder;
      if (effect.effectType === "Status" && effectHolder.status !== effect.id) {
        continue;
      }
      if (effect.effectType === "Ability" && effect.flags["breakable"] && this.suppressingAbility(effectHolder)) {
        if (effect.flags["breakable"]) {
          this.debug(eventid + " handler suppressed by Mold Breaker");
          continue;
        }
        if (!effect.num) {
          const AttackingEvents = {
            BeforeMove: 1,
            BasePower: 1,
            Immunity: 1,
            RedirectTarget: 1,
            Heal: 1,
            SetStatus: 1,
            CriticalHit: 1,
            ModifyAtk: 1,
            ModifyDef: 1,
            ModifySpA: 1,
            ModifySpD: 1,
            ModifySpe: 1,
            ModifyAccuracy: 1,
            ModifyBoost: 1,
            ModifyDamage: 1,
            ModifySecondaries: 1,
            ModifyWeight: 1,
            TryAddVolatile: 1,
            TryHit: 1,
            TryHitSide: 1,
            TryMove: 1,
            Boost: 1,
            DragOut: 1,
            Effectiveness: 1
          };
          if (eventid in AttackingEvents) {
            this.debug(eventid + " handler suppressed by Mold Breaker");
            continue;
          } else if (eventid === "Damage" && sourceEffect && sourceEffect.effectType === "Move") {
            this.debug(eventid + " handler suppressed by Mold Breaker");
            continue;
          }
        }
      }
      if (eventid !== "Start" && eventid !== "SwitchIn" && eventid !== "TakeItem" && effect.effectType === "Item" && effectHolder instanceof import_pokemon.Pokemon && effectHolder.ignoringItem()) {
        if (eventid !== "Update") {
          this.debug(eventid + " handler suppressed by Embargo, Klutz or Magic Room");
        }
        continue;
      } else if (eventid !== "End" && effect.effectType === "Ability" && effectHolder instanceof import_pokemon.Pokemon && effectHolder.ignoringAbility()) {
        if (eventid !== "Update") {
          this.debug(eventid + " handler suppressed by Gastro Acid or Neutralizing Gas");
        }
        continue;
      }
      if ((effect.effectType === "Weather" || eventid === "Weather") && eventid !== "Residual" && eventid !== "End" && this.field.suppressingWeather()) {
        this.debug(eventid + " handler suppressed by Air Lock");
        continue;
      }
      let returnVal;
      if (typeof handler.callback === "function") {
        const parentEffect = this.effect;
        const parentEffectState = this.effectState;
        this.effect = handler.effect;
        this.effectState = handler.state || {};
        this.effectState.target = effectHolder;
        returnVal = handler.callback.apply(this, args);
        this.effect = parentEffect;
        this.effectState = parentEffectState;
      } else {
        returnVal = handler.callback;
      }
      if (returnVal !== void 0) {
        relayVar = returnVal;
        if (!relayVar || fastExit) {
          if (handler.index !== void 0) {
            targetRelayVars[handler.index] = relayVar;
            if (targetRelayVars.every((val) => !val))
              break;
          } else {
            break;
          }
        }
        if (hasRelayVar) {
          args[0] = relayVar;
        }
      }
    }
    this.eventDepth--;
    if (typeof relayVar === "number" && relayVar === Math.abs(Math.floor(relayVar))) {
      relayVar = this.modify(relayVar, this.event.modifier);
    }
    this.event = parentEvent;
    return Array.isArray(target) ? targetRelayVars : relayVar;
  }
  /**
   * priorityEvent works just like runEvent, except it exits and returns
   * on the first non-undefined value instead of only on null/false.
   */
  priorityEvent(eventid, target, source, effect, relayVar, onEffect) {
    return this.runEvent(eventid, target, source, effect, relayVar, onEffect, true);
  }
  resolvePriority(handler, callbackName) {
    handler.order = handler.effect[`${callbackName}Order`] || false;
    handler.priority = handler.effect[`${callbackName}Priority`] || 0;
    handler.subOrder = handler.effect[`${callbackName}SubOrder`] || 0;
    if (handler.effectHolder && handler.effectHolder.getStat) {
      handler.speed = handler.effectHolder.speed;
    }
    return handler;
  }
  findEventHandlers(target, eventName, source) {
    let handlers = [];
    if (Array.isArray(target)) {
      for (const [i, pokemon] of target.entries()) {
        const curHandlers = this.findEventHandlers(pokemon, eventName, source);
        for (const handler of curHandlers) {
          handler.target = pokemon;
          handler.index = i;
        }
        handlers = handlers.concat(curHandlers);
      }
      return handlers;
    }
    const prefixedHandlers = !["BeforeTurn", "Update", "Weather", "WeatherChange", "TerrainChange"].includes(eventName);
    if (target instanceof import_pokemon.Pokemon && (target.isActive || source?.isActive)) {
      handlers = this.findPokemonEventHandlers(target, `on${eventName}`);
      if (prefixedHandlers) {
        for (const allyActive of target.alliesAndSelf()) {
          handlers.push(...this.findPokemonEventHandlers(allyActive, `onAlly${eventName}`));
          handlers.push(...this.findPokemonEventHandlers(allyActive, `onAny${eventName}`));
        }
        for (const foeActive of target.foes()) {
          handlers.push(...this.findPokemonEventHandlers(foeActive, `onFoe${eventName}`));
          handlers.push(...this.findPokemonEventHandlers(foeActive, `onAny${eventName}`));
        }
      }
      target = target.side;
    }
    if (source && prefixedHandlers) {
      handlers.push(...this.findPokemonEventHandlers(source, `onSource${eventName}`));
    }
    if (target instanceof import_side.Side) {
      for (const side of this.sides) {
        if (side.n >= 2 && side.allySide)
          break;
        if (side === target || side === target.allySide) {
          handlers.push(...this.findSideEventHandlers(side, `on${eventName}`));
        } else if (prefixedHandlers) {
          handlers.push(...this.findSideEventHandlers(side, `onFoe${eventName}`));
        }
        if (prefixedHandlers)
          handlers.push(...this.findSideEventHandlers(side, `onAny${eventName}`));
      }
    }
    handlers.push(...this.findFieldEventHandlers(this.field, `on${eventName}`));
    handlers.push(...this.findBattleEventHandlers(`on${eventName}`));
    return handlers;
  }
  findPokemonEventHandlers(pokemon, callbackName, getKey) {
    const handlers = [];
    const status = pokemon.getStatus();
    let callback = status[callbackName];
    if (callback !== void 0 || getKey && pokemon.statusState[getKey]) {
      handlers.push(this.resolvePriority({
        effect: status,
        callback,
        state: pokemon.statusState,
        end: pokemon.clearStatus,
        effectHolder: pokemon
      }, callbackName));
    }
    for (const id in pokemon.volatiles) {
      const volatileState = pokemon.volatiles[id];
      const volatile = this.dex.conditions.getByID(id);
      callback = volatile[callbackName];
      if (callback !== void 0 || getKey && volatileState[getKey]) {
        handlers.push(this.resolvePriority({
          effect: volatile,
          callback,
          state: volatileState,
          end: pokemon.removeVolatile,
          effectHolder: pokemon
        }, callbackName));
      }
    }
    const ability = pokemon.getAbility();
    callback = ability[callbackName];
    if (callback !== void 0 || getKey && pokemon.abilityState[getKey]) {
      handlers.push(this.resolvePriority({
        effect: ability,
        callback,
        state: pokemon.abilityState,
        end: pokemon.clearAbility,
        effectHolder: pokemon
      }, callbackName));
    }
    const item = pokemon.getItem();
    callback = item[callbackName];
    if (callback !== void 0 || getKey && pokemon.itemState[getKey]) {
      handlers.push(this.resolvePriority({
        effect: item,
        callback,
        state: pokemon.itemState,
        end: pokemon.clearItem,
        effectHolder: pokemon
      }, callbackName));
    }
    const species = pokemon.baseSpecies;
    callback = species[callbackName];
    if (callback !== void 0) {
      handlers.push(this.resolvePriority({
        effect: species,
        callback,
        state: pokemon.speciesState,
        end() {
        },
        effectHolder: pokemon
      }, callbackName));
    }
    const side = pokemon.side;
    for (const conditionid in side.slotConditions[pokemon.position]) {
      const slotConditionState = side.slotConditions[pokemon.position][conditionid];
      const slotCondition = this.dex.conditions.getByID(conditionid);
      callback = slotCondition[callbackName];
      if (callback !== void 0 || getKey && slotConditionState[getKey]) {
        handlers.push(this.resolvePriority({
          effect: slotCondition,
          callback,
          state: slotConditionState,
          end: side.removeSlotCondition,
          endCallArgs: [side, pokemon, slotCondition.id],
          effectHolder: side
        }, callbackName));
      }
    }
    return handlers;
  }
  findBattleEventHandlers(callbackName, getKey) {
    const handlers = [];
    let callback;
    const format = this.format;
    callback = format[callbackName];
    if (callback !== void 0 || getKey && this.formatData[getKey]) {
      handlers.push(this.resolvePriority({
        effect: format,
        callback,
        state: this.formatData,
        end: null,
        effectHolder: this
      }, callbackName));
    }
    if (this.events && (callback = this.events[callbackName]) !== void 0) {
      for (const handler of callback) {
        const state = handler.target.effectType === "Format" ? this.formatData : null;
        handlers.push({
          effect: handler.target,
          callback: handler.callback,
          state,
          end: null,
          effectHolder: this,
          priority: handler.priority,
          order: handler.order,
          subOrder: handler.subOrder
        });
      }
    }
    return handlers;
  }
  findFieldEventHandlers(field, callbackName, getKey, customHolder) {
    const handlers = [];
    let callback;
    for (const id in field.pseudoWeather) {
      const pseudoWeatherState = field.pseudoWeather[id];
      const pseudoWeather = this.dex.conditions.getByID(id);
      callback = pseudoWeather[callbackName];
      if (callback !== void 0 || getKey && pseudoWeatherState[getKey]) {
        handlers.push(this.resolvePriority({
          effect: pseudoWeather,
          callback,
          state: pseudoWeatherState,
          end: customHolder ? null : field.removePseudoWeather,
          effectHolder: customHolder || field
        }, callbackName));
      }
    }
    const weather = field.getWeather();
    callback = weather[callbackName];
    if (callback !== void 0 || getKey && this.field.weatherState[getKey]) {
      handlers.push(this.resolvePriority({
        effect: weather,
        callback,
        state: this.field.weatherState,
        end: customHolder ? null : field.clearWeather,
        effectHolder: customHolder || field
      }, callbackName));
    }
    const terrain = field.getTerrain();
    callback = terrain[callbackName];
    if (callback !== void 0 || getKey && field.terrainState[getKey]) {
      handlers.push(this.resolvePriority({
        effect: terrain,
        callback,
        state: field.terrainState,
        end: customHolder ? null : field.clearTerrain,
        effectHolder: customHolder || field
      }, callbackName));
    }
    return handlers;
  }
  findSideEventHandlers(side, callbackName, getKey, customHolder) {
    const handlers = [];
    for (const id in side.sideConditions) {
      const sideConditionData = side.sideConditions[id];
      const sideCondition = this.dex.conditions.getByID(id);
      const callback = sideCondition[callbackName];
      if (callback !== void 0 || getKey && sideConditionData[getKey]) {
        handlers.push(this.resolvePriority({
          effect: sideCondition,
          callback,
          state: sideConditionData,
          end: customHolder ? null : side.removeSideCondition,
          effectHolder: customHolder || side
        }, callbackName));
      }
    }
    return handlers;
  }
  /**
   * Use this function to attach custom event handlers to a battle. See Battle#runEvent for
   * more information on how to write callbacks for event handlers.
   *
   * Try to use this sparingly. Most event handlers can be simply placed in a format instead.
   *
   *     this.onEvent(eventid, target, callback)
   * will set the callback as an event handler for the target when eventid is called with the
   * default priority. Currently only valid formats are supported as targets but this will
   * eventually be expanded to support other target types.
   *
   *     this.onEvent(eventid, target, priority, callback)
   * will set the callback as an event handler for the target when eventid is called with the
   * provided priority. Priority can either be a number or an object that contains the priority,
   * order, and subOrder for the event handler as needed (undefined keys will use default values)
   */
  onEvent(eventid, target, ...rest) {
    if (!eventid)
      throw new TypeError("Event handlers must have an event to listen to");
    if (!target)
      throw new TypeError("Event handlers must have a target");
    if (!rest.length)
      throw new TypeError("Event handlers must have a callback");
    if (target.effectType !== "Format") {
      throw new TypeError(`${target.name} is a ${target.effectType} but only Format targets are supported right now`);
    }
    let callback, priority, order, subOrder, data;
    if (rest.length === 1) {
      [callback] = rest;
      priority = 0;
      order = false;
      subOrder = 0;
    } else {
      [data, callback] = rest;
      if (typeof data === "object") {
        priority = data["priority"] || 0;
        order = data["order"] || false;
        subOrder = data["subOrder"] || 0;
      } else {
        priority = data || 0;
        order = false;
        subOrder = 0;
      }
    }
    const eventHandler = { callback, target, priority, order, subOrder };
    if (!this.events)
      this.events = {};
    const callbackName = `on${eventid}`;
    const eventHandlers = this.events[callbackName];
    if (eventHandlers === void 0) {
      this.events[callbackName] = [eventHandler];
    } else {
      eventHandlers.push(eventHandler);
    }
  }
  checkMoveMakesContact(move, attacker, defender, announcePads = false) {
    if (move.flags["contact"] && attacker.hasItem("protectivepads")) {
      if (announcePads) {
        this.add("-activate", defender, this.effect.fullname);
        this.add("-activate", attacker, "item: Protective Pads");
      }
      return false;
    }
    return move.flags["contact"];
  }
  getPokemon(fullname) {
    if (typeof fullname !== "string")
      fullname = fullname.fullname;
    for (const side of this.sides) {
      for (const pokemon of side.pokemon) {
        if (pokemon.fullname === fullname)
          return pokemon;
      }
    }
    return null;
  }
  getPokemonByPNX(pnx) {
    for (const side of this.sides) {
      for (const pokemon of side.pokemon) {
        if (pokemon.getSlot().toString() === pnx)
          return pokemon;
      }
    }
    return null;
  }
  getPokemonById(pokemonId) {
    for (const side of this.sides) {
      for (const pokemon of side.pokemon) {
        if (pokemon.uuid === pokemonId) {
          return pokemon;
        }
      }
    }
  }
  getAllPokemon() {
    const pokemonList = [];
    for (const side of this.sides) {
      pokemonList.push(...side.pokemon);
    }
    return pokemonList;
  }
  getAllActive() {
    const pokemonList = [];
    for (const side of this.sides) {
      for (const pokemon of side.active) {
        if (pokemon && !pokemon.fainted) {
          pokemonList.push(pokemon);
        }
      }
    }
    return pokemonList;
  }
  makeRequest(type) {
    if (type) {
      this.requestState = type;
      for (const side of this.sides) {
        side.clearChoice();
      }
    } else {
      type = this.requestState;
    }
    for (const side of this.sides) {
      side.activeRequest = null;
    }
    if (type === "teampreview") {
      const pickedTeamSize = this.ruleTable.pickedTeamSize;
      this.add("teampreview" + (pickedTeamSize ? "|" + pickedTeamSize : ""));
    }
    const requests = this.getRequests(type);
    for (let i = 0; i < this.sides.length; i++) {
      this.sides[i].emitRequest(requests[i]);
    }
    if (this.sides.every((side) => side.isChoiceDone())) {
      throw new Error(`Choices are done immediately after a request`);
    }
  }
  clearRequest() {
    this.requestState = "";
    for (const side of this.sides) {
      side.activeRequest = null;
      side.clearChoice();
    }
  }
  getRequests(type) {
    const requests = Array(this.sides.length).fill(null);
    switch (type) {
      case "switch":
        for (let i = 0; i < this.sides.length; i++) {
          const side = this.sides[i];
          if (!side.pokemonLeft)
            continue;
          const switchTable = side.active.map((pokemon) => !!pokemon?.switchFlag);
          if (switchTable.some(Boolean)) {
            requests[i] = { forceSwitch: switchTable, side: side.getRequestData() };
          }
        }
        break;
      case "teampreview":
        for (let i = 0; i < this.sides.length; i++) {
          const side = this.sides[i];
          const maxChosenTeamSize = this.ruleTable.pickedTeamSize || void 0;
          requests[i] = { teamPreview: true, maxChosenTeamSize, side: side.getRequestData() };
        }
        break;
      default:
        for (let i = 0; i < this.sides.length; i++) {
          const side = this.sides[i];
          if (!side.pokemonLeft)
            continue;
          const activeData = side.active.map((pokemon) => pokemon?.getMoveRequestData());
          requests[i] = { active: activeData, side: side.getRequestData() };
          if (side.allySide) {
            requests[i].ally = side.allySide.getRequestData(true);
          }
        }
        break;
    }
    const multipleRequestsExist = requests.filter(Boolean).length >= 2;
    for (let i = 0; i < this.sides.length; i++) {
      if (requests[i]) {
        if (!this.supportCancel || !multipleRequestsExist)
          requests[i].noCancel = true;
      } else {
        requests[i] = { wait: true, side: this.sides[i].getRequestData() };
      }
    }
    return requests;
  }
  tiebreak() {
    if (this.ended)
      return false;
    this.inputLog.push(`>tiebreak`);
    this.add("message", "Time's up! Going to tiebreaker...");
    const notFainted = this.sides.map((side) => side.pokemon.filter((pokemon) => !pokemon.fainted).length);
    this.add("-message", this.sides.map((side, i) => `${side.name}: ${notFainted[i]} Pokemon left`).join("; "));
    const maxNotFainted = Math.max(...notFainted);
    let tiedSides = this.sides.filter((side, i) => notFainted[i] === maxNotFainted);
    if (tiedSides.length <= 1) {
      return this.win(tiedSides[0]);
    }
    const hpPercentage = tiedSides.map((side) => side.pokemon.map((pokemon) => pokemon.hp / pokemon.maxhp).reduce((a, b) => a + b) * 100 / 6);
    this.add("-message", tiedSides.map((side, i) => `${side.name}: ${Math.round(hpPercentage[i])}% total HP left`).join("; "));
    const maxPercentage = Math.max(...hpPercentage);
    tiedSides = tiedSides.filter((side, i) => hpPercentage[i] === maxPercentage);
    if (tiedSides.length <= 1) {
      return this.win(tiedSides[0]);
    }
    const hpTotal = tiedSides.map((side) => side.pokemon.map((pokemon) => pokemon.hp).reduce((a, b) => a + b));
    this.add("-message", tiedSides.map((side, i) => `${side.name}: ${Math.round(hpTotal[i])} total HP left`).join("; "));
    const maxTotal = Math.max(...hpTotal);
    tiedSides = tiedSides.filter((side, i) => hpTotal[i] === maxTotal);
    if (tiedSides.length <= 1) {
      return this.win(tiedSides[0]);
    }
    return this.tie();
  }
  forceWin(side = null) {
    if (this.ended)
      return false;
    this.inputLog.push(side ? `>forcewin ${side}` : `>forcetie`);
    return this.win(side);
  }
  tie() {
    return this.win();
  }
  win(side) {
    if (this.ended)
      return false;
    if (side && typeof side === "string") {
      side = this.getSide(side);
    } else if (!side || !this.sides.includes(side)) {
      side = null;
    }
    this.winner = side ? side.name : "";
    this.add("");
    if (side?.allySide) {
      this.add("win", side.name + " & " + side.allySide.name);
    } else if (side) {
      this.add("win", side.name);
    } else {
      this.add("tie");
    }
    this.updatePP();
    this.ended = true;
    this.requestState = "";
    for (const s of this.sides) {
      if (s)
        s.activeRequest = null;
    }
    return true;
  }
  lose(side) {
    if (typeof side === "string") {
      side = this.getSide(side);
    }
    if (!side)
      return;
    if (this.gameType !== "freeforall") {
      return this.win(side.foe);
    }
    if (!side.pokemonLeft)
      return;
    side.pokemonLeft = 0;
    side.active[0]?.faint();
    this.faintMessages(false, true);
    if (!this.ended && side.requestState) {
      side.emitRequest({ wait: true, side: side.getRequestData() });
      side.clearChoice();
      if (this.allChoicesDone())
        this.commitDecisions();
    }
    return true;
  }
  canSwitch(side) {
    return this.possibleSwitches(side).length;
  }
  getRandomSwitchable(side) {
    const canSwitchIn = this.possibleSwitches(side);
    return canSwitchIn.length ? this.sample(canSwitchIn) : null;
  }
  possibleSwitches(side) {
    if (!side.pokemonLeft)
      return [];
    const canSwitchIn = [];
    for (let i = side.active.length; i < side.pokemon.length; i++) {
      const pokemon = side.pokemon[i];
      if (!pokemon.fainted) {
        canSwitchIn.push(pokemon);
      }
    }
    return canSwitchIn;
  }
  swapPosition(pokemon, newPosition, attributes) {
    if (newPosition >= pokemon.side.active.length) {
      throw new Error("Invalid swap position");
    }
    const target = pokemon.side.active[newPosition];
    if (newPosition !== 1 && (!target || target.fainted))
      return false;
    this.add("swap", pokemon, newPosition, attributes || "");
    const side = pokemon.side;
    side.pokemon[pokemon.position] = target;
    side.pokemon[newPosition] = pokemon;
    side.active[pokemon.position] = side.pokemon[pokemon.position];
    side.active[newPosition] = side.pokemon[newPosition];
    if (target)
      target.position = pokemon.position;
    pokemon.position = newPosition;
    this.runEvent("Swap", target, pokemon);
    this.runEvent("Swap", pokemon, target);
    return true;
  }
  getAtSlot(slot) {
    if (!slot)
      return null;
    const side = this.sides[slot.charCodeAt(1) - 49];
    const position = slot.charCodeAt(2) - 97;
    const positionOffset = Math.floor(side.n / 2) * side.active.length;
    return side.active[position - positionOffset];
  }
  faint(pokemon, source, effect) {
    pokemon.faint(source, effect);
  }
  nextTurn() {
    this.turn++;
    this.lastSuccessfulMoveThisTurn = null;
    const dynamaxEnding = [];
    for (const pokemon of this.getAllActive()) {
      if (pokemon.volatiles["dynamax"]?.turns === 3) {
        dynamaxEnding.push(pokemon);
      }
    }
    if (dynamaxEnding.length > 1) {
      this.updateSpeed();
      this.speedSort(dynamaxEnding);
    }
    for (const pokemon of dynamaxEnding) {
      pokemon.removeVolatile("dynamax");
    }
    if (this.gen === 1) {
      for (const pokemon of this.getAllActive()) {
        if (pokemon.volatiles["partialtrappinglock"]) {
          const target = pokemon.volatiles["partialtrappinglock"].locked;
          if (target.hp <= 0 || !target.volatiles["partiallytrapped"]) {
            delete pokemon.volatiles["partialtrappinglock"];
          }
        }
        if (pokemon.volatiles["partiallytrapped"]) {
          const source = pokemon.volatiles["partiallytrapped"].source;
          if (source.hp <= 0 || !source.volatiles["partialtrappinglock"]) {
            delete pokemon.volatiles["partiallytrapped"];
          }
        }
      }
    }
    const trappedBySide = [];
    const stalenessBySide = [];
    for (const side of this.sides) {
      let sideTrapped = true;
      let sideStaleness;
      for (const pokemon of side.active) {
        if (!pokemon)
          continue;
        pokemon.moveThisTurn = "";
        pokemon.newlySwitched = false;
        pokemon.moveLastTurnResult = pokemon.moveThisTurnResult;
        pokemon.moveThisTurnResult = void 0;
        if (this.turn !== 1) {
          pokemon.usedItemThisTurn = false;
          pokemon.statsRaisedThisTurn = false;
          pokemon.statsLoweredThisTurn = false;
          pokemon.hurtThisTurn = null;
        }
        pokemon.maybeDisabled = false;
        for (const moveSlot of pokemon.moveSlots) {
          moveSlot.disabled = false;
          moveSlot.disabledSource = "";
        }
        this.runEvent("DisableMove", pokemon);
        for (const moveSlot of pokemon.moveSlots) {
          const activeMove = this.dex.getActiveMove(moveSlot.id);
          this.singleEvent("DisableMove", activeMove, null, pokemon);
          if (activeMove.flags["cantusetwice"] && pokemon.lastMove?.id === moveSlot.id) {
            pokemon.disableMove(pokemon.lastMove.id);
          }
        }
        if (pokemon.getLastAttackedBy() && this.gen >= 7)
          pokemon.knownType = true;
        for (let i = pokemon.attackedBy.length - 1; i >= 0; i--) {
          const attack = pokemon.attackedBy[i];
          if (attack.source.isActive) {
            attack.thisTurn = false;
          } else {
            pokemon.attackedBy.splice(pokemon.attackedBy.indexOf(attack), 1);
          }
        }
        if (this.gen >= 7 && !pokemon.terastallized) {
          const seenPokemon = pokemon.illusion || pokemon;
          const realTypeString = seenPokemon.getTypes(true).join("/");
          if (realTypeString !== seenPokemon.apparentType) {
            this.add("-start", pokemon, "typechange", realTypeString, "[silent]");
            seenPokemon.apparentType = realTypeString;
            if (pokemon.addedType) {
              this.add("-start", pokemon, "typeadd", pokemon.addedType, "[silent]");
            }
          }
        }
        pokemon.trapped = pokemon.maybeTrapped = false;
        this.runEvent("TrapPokemon", pokemon);
        if (!pokemon.knownType || this.dex.getImmunity("trapped", pokemon)) {
          this.runEvent("MaybeTrapPokemon", pokemon);
        }
        if (this.gen > 2) {
          for (const source of pokemon.foes()) {
            const species = (source.illusion || source).species;
            if (!species.abilities)
              continue;
            for (const abilitySlot in species.abilities) {
              const abilityName = species.abilities[abilitySlot];
              if (abilityName === source.ability) {
                continue;
              }
              const ruleTable = this.ruleTable;
              if ((ruleTable.has("+hackmons") || !ruleTable.has("obtainableabilities")) && !this.format.team) {
                continue;
              } else if (abilitySlot === "H" && species.unreleasedHidden) {
                continue;
              }
              const ability = this.dex.abilities.get(abilityName);
              if (ruleTable.has("-ability:" + ability.id))
                continue;
              if (pokemon.knownType && !this.dex.getImmunity("trapped", pokemon))
                continue;
              this.singleEvent("FoeMaybeTrapPokemon", ability, {}, pokemon, source);
            }
          }
        }
        if (pokemon.fainted)
          continue;
        sideTrapped = sideTrapped && pokemon.trapped;
        const staleness = pokemon.volatileStaleness || pokemon.staleness;
        if (staleness)
          sideStaleness = sideStaleness === "external" ? sideStaleness : staleness;
        pokemon.activeTurns++;
      }
      trappedBySide.push(sideTrapped);
      stalenessBySide.push(sideStaleness);
      side.faintedLastTurn = side.faintedThisTurn;
      side.faintedThisTurn = null;
    }
    if (this.maybeTriggerEndlessBattleClause(trappedBySide, stalenessBySide))
      return;
    if (this.gameType === "triples" && this.sides.every((side) => side.pokemonLeft === 1)) {
      const actives = this.getAllActive();
      if (actives.length > 1 && !actives[0].isAdjacent(actives[1])) {
        this.swapPosition(actives[0], 1, "[silent]");
        this.swapPosition(actives[1], 1, "[silent]");
        this.add("-center");
      }
    }
    this.add("turn", this.turn);
    if (this.gameType === "multi") {
      for (const side of this.sides) {
        if (side.canDynamaxNow()) {
          if (this.turn === 1) {
            this.addSplit(side.id, ["-candynamax", side.id]);
          } else {
            this.add("-candynamax", side.id);
          }
        }
      }
    }
    this.updatePP();
    if (this.gen === 2)
      this.quickClawRoll = this.randomChance(60, 256);
    if (this.gen === 3)
      this.quickClawRoll = this.randomChance(1, 5);
    if (this.ruleTable.has("crazyhouserule")) {
      for (const side of this.sides) {
        let buf = `raw|${side.name}'s team:<br />`;
        for (const pokemon of side.pokemon) {
          if (!buf.endsWith("<br />"))
            buf += "/</span>&#8203;";
          if (pokemon.fainted) {
            buf += `<span style="white-space:nowrap;"><span style="opacity:.3"><psicon pokemon="${pokemon.species.id}" /></span>`;
          } else {
            buf += `<span style="white-space:nowrap"><psicon pokemon="${pokemon.species.id}" />`;
          }
        }
        this.add(`${buf}</span>`);
      }
    }
    this.makeRequest("move");
  }
  maybeTriggerEndlessBattleClause(trappedBySide, stalenessBySide) {
    if (this.gen <= 1) {
      const noProgressPossible = this.sides.every((side) => {
        const foeAllGhosts = side.foe.pokemon.every((pokemon) => pokemon.fainted || pokemon.hasType("Ghost"));
        const foeAllTransform = side.foe.pokemon.every((pokemon) => pokemon.fainted || (this.dex.currentMod !== "gen1stadium" || pokemon.species.id !== "ditto") && // there are some subtleties such as a Mew with only Transform and auto-fail moves,
        // but it's unlikely to come up in a real game so there's no need to handle it
        pokemon.moves.every((moveid) => moveid === "transform"));
        return side.pokemon.every((pokemon) => pokemon.fainted || // frozen pokemon can't thaw in gen 1 without outside help
        pokemon.status === "frz" || pokemon.moves.every((moveid) => moveid === "transform") && foeAllTransform || pokemon.moveSlots.every((slot) => slot.pp === 0) && foeAllGhosts);
      });
      if (noProgressPossible) {
        this.add("-message", `This battle cannot progress. Endless Battle Clause activated!`);
        return this.tie();
      }
    }
    if (this.turn <= 100)
      return;
    if (this.turn >= 1e3) {
      this.add("message", `It is turn 1000. You have hit the turn limit!`);
      this.tie();
      return true;
    }
    if (this.turn >= 500 && this.turn % 100 === 0 || this.turn >= 900 && this.turn % 10 === 0 || // every 10 turns past turn 900,
    this.turn >= 990) {
      const turnsLeft = 1e3 - this.turn;
      const turnsLeftText = turnsLeft === 1 ? `1 turn` : `${turnsLeft} turns`;
      this.add("bigerror", `You will auto-tie if the battle doesn't end in ${turnsLeftText} (on turn 1000).`);
    }
    if (!this.ruleTable.has("endlessbattleclause"))
      return;
    if (this.format.gameType === "freeforall")
      return;
    if (!stalenessBySide.every((s) => !!s) || !stalenessBySide.some((s) => s === "external"))
      return;
    const canSwitch = [];
    for (const [i, trapped] of trappedBySide.entries()) {
      canSwitch[i] = false;
      if (trapped)
        break;
      const side = this.sides[i];
      for (const pokemon of side.pokemon) {
        if (!pokemon.fainted && !(pokemon.volatileStaleness || pokemon.staleness)) {
          canSwitch[i] = true;
          break;
        }
      }
    }
    if (canSwitch.every((s) => s))
      return;
    const losers = [];
    for (const side of this.sides) {
      let berry = false;
      let cycle = false;
      for (const pokemon of side.pokemon) {
        berry = import_pokemon.RESTORATIVE_BERRIES.has((0, import_dex.toID)(pokemon.set.item));
        if (["harvest", "pickup"].includes((0, import_dex.toID)(pokemon.set.ability)) || pokemon.set.moves.map(import_dex.toID).includes("recycle")) {
          cycle = true;
        }
        if (berry && cycle)
          break;
      }
      if (berry && cycle)
        losers.push(side);
    }
    if (losers.length === 1) {
      const loser = losers[0];
      this.add("-message", `${loser.name}'s team started with the rudimentary means to perform restorative berry-cycling and thus loses.`);
      return this.win(loser.foe);
    }
    if (losers.length === this.sides.length) {
      this.add("-message", `Each side's team started with the rudimentary means to perform restorative berry-cycling.`);
    }
    return this.tie();
  }
  start() {
    if (this.deserialized)
      return;
    if (!this.sides.every((side) => !!side))
      throw new Error(`Missing sides: ${this.sides}`);
    if (this.started)
      throw new Error(`Battle already started`);
    const format = this.format;
    this.started = true;
    if (this.gameType === "multi") {
      this.sides[1].foe = this.sides[2];
      this.sides[0].foe = this.sides[3];
      this.sides[2].foe = this.sides[1];
      this.sides[3].foe = this.sides[0];
      this.sides[1].allySide = this.sides[3];
      this.sides[0].allySide = this.sides[2];
      this.sides[2].allySide = this.sides[0];
      this.sides[3].allySide = this.sides[1];
      this.sides[2].sideConditions = this.sides[0].sideConditions;
      this.sides[3].sideConditions = this.sides[1].sideConditions;
    } else {
      this.sides[1].foe = this.sides[0];
      this.sides[0].foe = this.sides[1];
      if (this.sides.length > 2) {
        this.sides[2].foe = this.sides[3];
        this.sides[3].foe = this.sides[2];
      }
    }
    for (const side of this.sides) {
      this.add("teamsize", side.id, side.pokemon.length);
    }
    this.add("gen", this.gen);
    this.add("tier", format.name);
    if (this.rated) {
      if (this.rated === "Rated battle")
        this.rated = true;
      this.add("rated", typeof this.rated === "string" ? this.rated : "");
    }
    if (format.onBegin)
      format.onBegin.call(this);
    for (const rule of this.ruleTable.keys()) {
      if ("+*-!".includes(rule.charAt(0)))
        continue;
      const subFormat = this.dex.formats.get(rule);
      if (subFormat.onBegin)
        subFormat.onBegin.call(this);
    }
    if (this.sides.some((side) => !side.pokemon[0])) {
      throw new Error("Battle not started: A player has an empty team.");
    }
    if (this.debugMode) {
      this.checkEVBalance();
    }
    if (format.onTeamPreview)
      format.onTeamPreview.call(this);
    for (const rule of this.ruleTable.keys()) {
      if ("+*-!".includes(rule.charAt(0)))
        continue;
      const subFormat = this.dex.formats.get(rule);
      if (subFormat.onTeamPreview)
        subFormat.onTeamPreview.call(this);
    }
    this.queue.addChoice({ choice: "start" });
    this.midTurn = true;
    if (!this.requestState)
      this.go();
  }
  restart(send) {
    if (!this.deserialized)
      throw new Error("Attempt to restart a battle which has not been deserialized");
    this.send = send;
  }
  checkEVBalance() {
    let limitedEVs = null;
    for (const side of this.sides) {
      const sideLimitedEVs = !side.pokemon.some(
        (pokemon) => Object.values(pokemon.set.evs).reduce((a, b) => a + b, 0) > 510
      );
      if (limitedEVs === null) {
        limitedEVs = sideLimitedEVs;
      } else if (limitedEVs !== sideLimitedEVs) {
        this.add("bigerror", "Warning: One player isn't adhering to a 510 EV limit, and the other player is.");
      }
    }
  }
  boost(boost, target = null, source = null, effect = null, isSecondary = false, isSelf = false) {
    if (this.event) {
      if (!target)
        target = this.event.target;
      if (!source)
        source = this.event.source;
      if (!effect)
        effect = this.effect;
    }
    if (!target?.hp)
      return 0;
    if (!target.isActive)
      return false;
    if (this.gen > 5 && !target.side.foePokemonLeft())
      return false;
    boost = this.runEvent("ChangeBoost", target, source, effect, { ...boost });
    boost = target.getCappedBoost(boost);
    boost = this.runEvent("TryBoost", target, source, effect, { ...boost });
    let success = null;
    let boosted = isSecondary;
    let boostName;
    for (boostName in boost) {
      const currentBoost = {
        [boostName]: boost[boostName]
      };
      let boostBy = target.boostBy(currentBoost);
      let msg = "-boost";
      if (boost[boostName] < 0 || target.boosts[boostName] === -6) {
        msg = "-unboost";
        boostBy = -boostBy;
      }
      if (boostBy) {
        success = true;
        switch (effect?.id) {
          case "bellydrum":
          case "angerpoint":
            this.add("-setboost", target, "atk", target.boosts["atk"], "[from] " + effect.fullname);
            break;
          case "bellydrum2":
            this.add(msg, target, boostName, boostBy, "[silent]");
            this.hint("In Gen 2, Belly Drum boosts by 2 when it fails.");
            break;
          case "zpower":
            this.add(msg, target, boostName, boostBy, "[zeffect]");
            break;
          default:
            if (!effect)
              break;
            if (effect.effectType === "Move") {
              this.add(msg, target, boostName, boostBy);
            } else if (effect.effectType === "Item") {
              this.add(msg, target, boostName, boostBy, "[from] item: " + effect.name);
            } else {
              if (effect.effectType === "Ability" && !boosted) {
                this.add("-ability", target, effect.name, "boost");
                boosted = true;
              }
              this.add(msg, target, boostName, boostBy);
            }
            break;
        }
        this.runEvent("AfterEachBoost", target, source, effect, currentBoost);
      } else if (effect?.effectType === "Ability") {
        if (isSecondary || isSelf)
          this.add(msg, target, boostName, boostBy);
      } else if (!isSecondary && !isSelf) {
        this.add(msg, target, boostName, boostBy);
      }
    }
    this.runEvent("AfterBoost", target, source, effect, boost);
    if (success) {
      if (Object.values(boost).some((x) => x > 0))
        target.statsRaisedThisTurn = true;
      if (Object.values(boost).some((x) => x < 0))
        target.statsLoweredThisTurn = true;
    }
    return success;
  }
  spreadDamage(damage, targetArray = null, source = null, effect = null, instafaint = false) {
    if (!targetArray)
      return [0];
    const retVals = [];
    if (typeof effect === "string" || !effect)
      effect = this.dex.conditions.getByID(effect || "");
    for (const [i, curDamage] of damage.entries()) {
      const target = targetArray[i];
      let targetDamage = curDamage;
      if (!(targetDamage || targetDamage === 0)) {
        retVals[i] = targetDamage;
        continue;
      }
      if (!target || !target.hp) {
        retVals[i] = 0;
        continue;
      }
      if (!target.isActive) {
        retVals[i] = false;
        continue;
      }
      if (targetDamage !== 0)
        targetDamage = this.clampIntRange(targetDamage, 1);
      if (effect.id !== "struggle-recoil") {
        if (effect.effectType === "Weather" && !target.runStatusImmunity(effect.id)) {
          this.debug("weather immunity");
          retVals[i] = 0;
          continue;
        }
        targetDamage = this.runEvent("Damage", target, source, effect, targetDamage, true);
        if (!(targetDamage || targetDamage === 0)) {
          this.debug("damage event failed");
          retVals[i] = curDamage === true ? void 0 : targetDamage;
          continue;
        }
      }
      if (targetDamage !== 0)
        targetDamage = this.clampIntRange(targetDamage, 1);
      if (this.gen <= 1) {
        if (this.dex.currentMod === "gen1stadium" || !["recoil", "drain", "leechseed"].includes(effect.id) && effect.effectType !== "Status") {
          this.lastDamage = targetDamage;
        }
      }
      retVals[i] = targetDamage = target.damage(targetDamage, source, effect);
      if (targetDamage !== 0)
        target.hurtThisTurn = target.hp;
      if (source && effect.effectType === "Move")
        source.lastDamage = targetDamage;
      const name = effect.fullname === "tox" ? "psn" : effect.fullname;
      switch (effect.id) {
        case "partiallytrapped":
          this.add("-damage", target, target.getHealth, "[from] " + this.effectState.sourceEffect.fullname, "[partiallytrapped]");
          break;
        case "powder":
          this.add("-damage", target, target.getHealth, "[silent]");
          break;
        case "confused":
          this.add("-damage", target, target.getHealth, "[from] confusion");
          break;
        default:
          if (effect.effectType === "Move" || !name) {
            this.add("-damage", target, target.getHealth);
          } else if (source && (source !== target || effect.effectType === "Ability")) {
            this.add("-damage", target, target.getHealth, "[from] " + name, "[of] " + source);
          } else {
            this.add("-damage", target, target.getHealth, "[from] " + name);
          }
          break;
      }
      if (targetDamage && effect.effectType === "Move") {
        if (this.gen <= 1 && effect.recoil && source) {
          if (this.dex.currentMod !== "gen1stadium" || target.hp > 0) {
            const amount = this.clampIntRange(Math.floor(targetDamage * effect.recoil[0] / effect.recoil[1]), 1);
            this.damage(amount, source, target, "recoil");
          }
        }
        if (this.gen <= 4 && effect.drain && source) {
          const amount = this.clampIntRange(Math.floor(targetDamage * effect.drain[0] / effect.drain[1]), 1);
          if (this.gen <= 1)
            this.lastDamage = amount;
          this.heal(amount, source, target, "drain");
        }
        if (this.gen > 4 && effect.drain && source) {
          const amount = Math.round(targetDamage * effect.drain[0] / effect.drain[1]);
          this.heal(amount, source, target, "drain");
        }
      }
    }
    if (instafaint) {
      for (const [i, target] of targetArray.entries()) {
        if (!retVals[i] || !target)
          continue;
        if (target.hp <= 0) {
          this.debug("instafaint: " + this.faintQueue.map((entry) => entry.target.name));
          this.faintMessages(true);
          if (this.gen <= 2) {
            target.faint();
            if (this.gen <= 1) {
              this.queue.clear();
              for (const pokemon of this.getAllActive()) {
                if (pokemon.volatiles["bide"] && pokemon.volatiles["bide"].damage) {
                  pokemon.volatiles["bide"].damage = 0;
                  this.hint("Desync Clause Mod activated!");
                  this.hint("In Gen 1, Bide's accumulated damage is reset to 0 when a Pokemon faints.");
                }
              }
            }
          }
        }
      }
    }
    return retVals;
  }
  damage(damage, target = null, source = null, effect = null, instafaint = false) {
    if (this.event) {
      if (!target)
        target = this.event.target;
      if (!source)
        source = this.event.source;
      if (!effect)
        effect = this.effect;
    }
    return this.spreadDamage([damage], [target], source, effect, instafaint)[0];
  }
  directDamage(damage, target, source = null, effect = null) {
    if (this.event) {
      if (!target)
        target = this.event.target;
      if (!source)
        source = this.event.source;
      if (!effect)
        effect = this.effect;
    }
    if (!target?.hp)
      return 0;
    if (!damage)
      return 0;
    damage = this.clampIntRange(damage, 1);
    if (typeof effect === "string" || !effect)
      effect = this.dex.conditions.getByID(effect || "");
    if (this.gen <= 1 && this.dex.currentMod !== "gen1stadium" && ["confusion", "jumpkick", "highjumpkick"].includes(effect.id)) {
      this.lastDamage = damage;
      if (target.volatiles["substitute"]) {
        const hint = "In Gen 1, if a Pokemon with a Substitute hurts itself due to confusion or Jump Kick/Hi Jump Kick recoil and the target";
        if (source?.volatiles["substitute"]) {
          source.volatiles["substitute"].hp -= damage;
          if (source.volatiles["substitute"].hp <= 0) {
            source.removeVolatile("substitute");
            source.subFainted = true;
          } else {
            this.add("-activate", source, "Substitute", "[damage]");
          }
          this.hint(hint + " has a Substitute, the target's Substitute takes the damage.");
          return damage;
        } else {
          this.hint(hint + " does not have a Substitute there is no damage dealt.");
          return 0;
        }
      }
    }
    damage = target.damage(damage, source, effect);
    switch (effect.id) {
      case "strugglerecoil":
        this.add("-damage", target, target.getHealth, "[from] recoil");
        break;
      case "confusion":
        this.add("-damage", target, target.getHealth, "[from] confusion");
        break;
      default:
        this.add("-damage", target, target.getHealth);
        break;
    }
    if (target.fainted)
      this.faint(target);
    return damage;
  }
  heal(damage, target, source = null, effect = null) {
    if (this.event) {
      if (!target)
        target = this.event.target;
      if (!source)
        source = this.event.source;
      if (!effect)
        effect = this.effect;
    }
    if (effect === "drain")
      effect = this.dex.conditions.getByID(effect);
    if (damage && damage <= 1)
      damage = 1;
    damage = this.trunc(damage);
    damage = this.runEvent("TryHeal", target, source, effect, damage);
    if (!damage)
      return damage;
    if (!target?.hp)
      return false;
    if (!target.isActive)
      return false;
    if (target.hp >= target.maxhp)
      return false;
    const finalDamage = target.heal(damage, source, effect);
    switch (effect?.id) {
      case "leechseed":
      case "rest":
        this.add("-heal", target, target.getHealth, "[silent]");
        break;
      case "drain":
        this.add("-heal", target, target.getHealth, "[from] drain", "[of] " + source);
        break;
      case "wish":
        break;
      case "zpower":
        this.add("-heal", target, target.getHealth, "[zeffect]");
        break;
      default:
        if (!effect)
          break;
        if (effect.effectType === "Move") {
          this.add("-heal", target, target.getHealth);
        } else if (source && source !== target) {
          this.add("-heal", target, target.getHealth, "[from] " + effect.fullname, "[of] " + source);
        } else {
          this.add("-heal", target, target.getHealth, "[from] " + effect.fullname);
        }
        break;
    }
    this.runEvent("Heal", target, source, effect, finalDamage);
    return finalDamage;
  }
  chain(previousMod, nextMod) {
    if (Array.isArray(previousMod)) {
      previousMod = this.trunc(previousMod[0] * 4096 / previousMod[1]);
    } else {
      previousMod = this.trunc(previousMod * 4096);
    }
    if (Array.isArray(nextMod)) {
      nextMod = this.trunc(nextMod[0] * 4096 / nextMod[1]);
    } else {
      nextMod = this.trunc(nextMod * 4096);
    }
    return (previousMod * nextMod + 2048 >> 12) / 4096;
  }
  chainModify(numerator, denominator) {
    const previousMod = this.trunc(this.event.modifier * 4096);
    if (Array.isArray(numerator)) {
      denominator = numerator[1];
      numerator = numerator[0];
    }
    const nextMod = this.trunc(numerator * 4096 / (denominator || 1));
    this.event.modifier = (previousMod * nextMod + 2048 >> 12) / 4096;
  }
  modify(value, numerator, denominator) {
    if (!denominator)
      denominator = 1;
    if (Array.isArray(numerator)) {
      denominator = numerator[1];
      numerator = numerator[0];
    }
    const tr = this.trunc;
    const modifier = tr(numerator * 4096 / denominator);
    return tr((tr(value * modifier) + 2048 - 1) / 4096);
  }
  /** Given a table of base stats and a pokemon set, return the actual stats. */
  spreadModify(baseStats, set) {
    const modStats = { atk: 10, def: 10, spa: 10, spd: 10, spe: 10 };
    const tr = this.trunc;
    let statName;
    for (statName in modStats) {
      const stat = baseStats[statName];
      modStats[statName] = tr(tr(2 * stat + set.ivs[statName] + tr(set.evs[statName] / 4)) * set.level / 100 + 5);
    }
    if ("hp" in baseStats) {
      const stat = baseStats["hp"];
      modStats["hp"] = tr(tr(2 * stat + set.ivs["hp"] + tr(set.evs["hp"] / 4) + 100) * set.level / 100 + 10);
    }
    return this.natureModify(modStats, set);
  }
  natureModify(stats, set) {
    const tr = this.trunc;
    const nature = this.dex.natures.get(set.nature);
    let s;
    if (nature.plus) {
      s = nature.plus;
      const stat = this.ruleTable.has("overflowstatmod") ? Math.min(stats[s], 595) : stats[s];
      stats[s] = tr(tr(stat * 110, 16) / 100);
    }
    if (nature.minus) {
      s = nature.minus;
      const stat = this.ruleTable.has("overflowstatmod") ? Math.min(stats[s], 728) : stats[s];
      stats[s] = tr(tr(stat * 90, 16) / 100);
    }
    return stats;
  }
  finalModify(relayVar) {
    relayVar = this.modify(relayVar, this.event.modifier);
    this.event.modifier = 1;
    return relayVar;
  }
  getCategory(move) {
    return this.dex.moves.get(move).category || "Physical";
  }
  randomizer(baseDamage) {
    const tr = this.trunc;
    return tr(tr(baseDamage * (100 - this.random(16))) / 100);
  }
  /**
   * Returns whether a proposed target for a move is valid.
   */
  validTargetLoc(targetLoc, source, targetType) {
    if (targetLoc === 0)
      return true;
    const numSlots = this.activePerHalf;
    const sourceLoc = source.getLocOf(source);
    if (Math.abs(targetLoc) > numSlots)
      return false;
    const isSelf = sourceLoc === targetLoc;
    const isFoe = this.gameType === "freeforall" ? !isSelf : targetLoc > 0;
    const acrossFromTargetLoc = -(numSlots + 1 - targetLoc);
    const isAdjacent = targetLoc > 0 ? Math.abs(acrossFromTargetLoc - sourceLoc) <= 1 : Math.abs(targetLoc - sourceLoc) === 1;
    if (this.gameType === "freeforall" && targetType === "adjacentAlly") {
      return isAdjacent;
    }
    switch (targetType) {
      case "randomNormal":
      case "scripted":
      case "normal":
        return isAdjacent;
      case "adjacentAlly":
        return isAdjacent && !isFoe;
      case "adjacentAllyOrSelf":
        return isAdjacent && !isFoe || isSelf;
      case "adjacentFoe":
        return isAdjacent && isFoe;
      case "any":
        return !isSelf;
    }
    return false;
  }
  validTarget(target, source, targetType) {
    return this.validTargetLoc(source.getLocOf(target), source, targetType);
  }
  getTarget(pokemon, move, targetLoc, originalTarget) {
    move = this.dex.moves.get(move);
    let tracksTarget = move.tracksTarget;
    if (pokemon.hasAbility(["stalwart", "propellertail"]))
      tracksTarget = true;
    if (tracksTarget && originalTarget && originalTarget.isActive) {
      return originalTarget;
    }
    if (move.smartTarget) {
      const curTarget = pokemon.getAtLoc(targetLoc);
      return curTarget && !curTarget.fainted ? curTarget : this.getRandomTarget(pokemon, move);
    }
    const selfLoc = pokemon.getLocOf(pokemon);
    if (["adjacentAlly", "any", "normal"].includes(move.target) && targetLoc === selfLoc && !pokemon.volatiles["twoturnmove"] && !pokemon.volatiles["iceball"] && !pokemon.volatiles["rollout"]) {
      return move.flags["futuremove"] ? pokemon : null;
    }
    if (move.target !== "randomNormal" && this.validTargetLoc(targetLoc, pokemon, move.target)) {
      const target = pokemon.getAtLoc(targetLoc);
      if (target?.fainted) {
        if (this.gameType === "freeforall") {
          return target;
        }
        if (target.isAlly(pokemon)) {
          return target;
        }
      }
      if (target && !target.fainted) {
        return target;
      }
    }
    return this.getRandomTarget(pokemon, move);
  }
  getRandomTarget(pokemon, move) {
    move = this.dex.moves.get(move);
    if (["self", "all", "allySide", "allyTeam", "adjacentAllyOrSelf"].includes(move.target)) {
      return pokemon;
    } else if (move.target === "adjacentAlly") {
      if (this.gameType === "singles")
        return null;
      const adjacentAllies = pokemon.adjacentAllies();
      return adjacentAllies.length ? this.sample(adjacentAllies) : null;
    }
    if (this.gameType === "singles")
      return pokemon.side.foe.active[0];
    if (this.activePerHalf > 2) {
      if (move.target === "adjacentFoe" || move.target === "normal" || move.target === "randomNormal") {
        const adjacentFoes = pokemon.adjacentFoes();
        if (adjacentFoes.length)
          return this.sample(adjacentFoes);
        return pokemon.side.foe.active[pokemon.side.foe.active.length - 1 - pokemon.position];
      }
    }
    return pokemon.side.randomFoe() || pokemon.side.foe.active[0];
  }
  checkFainted() {
    for (const side of this.sides) {
      for (const pokemon of side.active) {
        if (pokemon.fainted) {
          pokemon.status = "fnt";
          pokemon.switchFlag = true;
        }
      }
    }
  }
  capture(pokemon) {
    if (this.ended)
      return;
    if (!pokemon.fainted) {
      this.add("capture", pokemon);
      if (pokemon.side.pokemonLeft)
        pokemon.side.pokemonLeft--;
      this.singleEvent("End", pokemon.getAbility(), pokemon.abilityState, pokemon);
      pokemon.clearVolatile(false);
      pokemon.fainted = true;
      pokemon.illusion = null;
      pokemon.isActive = false;
      pokemon.isStarted = false;
      pokemon.side.faintedThisTurn = pokemon;
      if (this.checkWin())
        return true;
    }
    return false;
  }
  // COBBLED: Sends out the entire team with updates on each move PP
  updatePP() {
    for (const side of this.sides) {
      for (const pokemon of side.pokemon) {
        pokemon.updatePP();
      }
    }
  }
  faintMessages(lastFirst = false, forceCheck = false, checkWin = true) {
    if (this.ended)
      return;
    const length = this.faintQueue.length;
    if (!length) {
      if (forceCheck && this.checkWin())
        return true;
      return false;
    }
    if (lastFirst) {
      this.faintQueue.unshift(this.faintQueue[this.faintQueue.length - 1]);
      this.faintQueue.pop();
    }
    let faintQueueLeft, faintData;
    while (this.faintQueue.length) {
      faintQueueLeft = this.faintQueue.length;
      faintData = this.faintQueue.shift();
      const pokemon = faintData.target;
      if (!pokemon.fainted && this.runEvent("BeforeFaint", pokemon, faintData.source, faintData.effect)) {
        this.add("faint", pokemon);
        if (pokemon.side.pokemonLeft)
          pokemon.side.pokemonLeft--;
        if (pokemon.side.totalFainted < 100)
          pokemon.side.totalFainted++;
        this.runEvent("Faint", pokemon, faintData.source, faintData.effect);
        this.singleEvent("End", pokemon.getAbility(), pokemon.abilityState, pokemon);
        pokemon.clearVolatile(false);
        pokemon.fainted = true;
        pokemon.illusion = null;
        pokemon.isActive = false;
        pokemon.isStarted = false;
        delete pokemon.terastallized;
        pokemon.side.faintedThisTurn = pokemon;
        if (this.faintQueue.length >= faintQueueLeft)
          checkWin = true;
      }
    }
    if (this.gen <= 1) {
      this.queue.clear();
      for (const pokemon of this.getAllActive()) {
        if (pokemon.volatiles["bide"] && pokemon.volatiles["bide"].damage) {
          pokemon.volatiles["bide"].damage = 0;
          this.hint("Desync Clause Mod activated!");
          this.hint("In Gen 1, Bide's accumulated damage is reset to 0 when a Pokemon faints.");
        }
      }
    } else if (this.gen <= 3 && this.gameType === "singles") {
      for (const pokemon of this.getAllActive()) {
        if (this.gen <= 2) {
          this.queue.cancelMove(pokemon);
        } else {
          this.queue.cancelAction(pokemon);
        }
      }
    }
    if (checkWin && this.checkWin(faintData))
      return true;
    if (faintData && length) {
      this.runEvent("AfterFaint", faintData.target, faintData.source, faintData.effect, length);
    }
    return false;
  }
  checkWin(faintData) {
    let team1PokemonLeft = this.sides[0].pokemonLeft;
    let team2PokemonLeft = this.sides[1].pokemonLeft;
    const team3PokemonLeft = this.gameType === "freeforall" && this.sides[2].pokemonLeft;
    const team4PokemonLeft = this.gameType === "freeforall" && this.sides[3].pokemonLeft;
    if (this.gameType === "multi") {
      team1PokemonLeft += this.sides[2].pokemonLeft;
      team2PokemonLeft += this.sides[3].pokemonLeft;
    }
    if (!team1PokemonLeft && !team2PokemonLeft && !team3PokemonLeft && !team4PokemonLeft) {
      this.win(faintData && this.gen > 4 ? faintData.target.side : null);
      return true;
    }
    for (const side of this.sides) {
      if (!side.foePokemonLeft()) {
        this.win(side);
        return true;
      }
    }
  }
  getActionSpeed(action) {
    if (action.choice === "move") {
      let move = action.move;
      if (action.zmove) {
        const zMoveName = this.actions.getZMove(action.move, action.pokemon, true);
        if (zMoveName) {
          const zMove = this.dex.getActiveMove(zMoveName);
          if (zMove.exists && zMove.isZ) {
            move = zMove;
          }
        }
      }
      if (action.maxMove) {
        const maxMoveName = this.actions.getMaxMove(action.maxMove, action.pokemon);
        if (maxMoveName) {
          const maxMove = this.actions.getActiveMaxMove(action.move, action.pokemon);
          if (maxMove.exists && maxMove.isMax) {
            move = maxMove;
          }
        }
      }
      let priority = this.dex.moves.get(move.id).priority;
      priority = this.singleEvent("ModifyPriority", move, null, action.pokemon, null, null, priority);
      priority = this.runEvent("ModifyPriority", action.pokemon, null, move, priority);
      action.priority = priority + action.fractionalPriority;
      if (this.gen > 5)
        action.move.priority = priority;
    }
    if (!action.pokemon) {
      action.speed = 1;
    } else {
      action.speed = action.pokemon.getActionSpeed();
    }
  }
  runAction(action) {
    const pokemonOriginalHP = action.pokemon?.hp;
    let residualPokemon = [];
    switch (action.choice) {
      case "start": {
        for (const side of this.sides) {
          if (side.pokemonLeft)
            side.pokemonLeft = side.pokemon.filter((pk) => !pk.fainted).length;
        }
        this.add("start");
        for (const pokemon of this.getAllPokemon()) {
          let rawSpecies = null;
          if (pokemon.species.id === "zacian" && pokemon.item === "rustedsword") {
            rawSpecies = this.dex.species.get("Zacian-Crowned");
          } else if (pokemon.species.id === "zamazenta" && pokemon.item === "rustedshield") {
            rawSpecies = this.dex.species.get("Zamazenta-Crowned");
          }
          if (!rawSpecies)
            continue;
          const species = pokemon.setSpecies(rawSpecies);
          if (!species)
            continue;
          pokemon.baseSpecies = rawSpecies;
          pokemon.details = species.name + (pokemon.level === 100 ? "" : ", L" + pokemon.level) + (pokemon.gender === "" ? "" : ", " + pokemon.gender) + (pokemon.set.shiny ? ", shiny" : "");
          pokemon.setAbility(species.abilities["0"], null, true);
          pokemon.baseAbility = pokemon.ability;
          const behemothMove = {
            "Zacian-Crowned": "behemothblade",
            "Zamazenta-Crowned": "behemothbash"
          };
          const ironHead = pokemon.baseMoves.indexOf("ironhead");
          if (ironHead >= 0) {
            const move = this.dex.moves.get(behemothMove[rawSpecies.name]);
            pokemon.baseMoveSlots[ironHead] = {
              move: move.name,
              id: move.id,
              pp: move.noPPBoosts || move.isZ ? move.pp : move.pp * 8 / 5,
              maxpp: move.noPPBoosts || move.isZ ? move.pp : move.pp * 8 / 5,
              target: move.target,
              disabled: false,
              disabledSource: "",
              used: false
            };
            pokemon.moveSlots = pokemon.baseMoveSlots.slice();
          }
        }
        if (this.format.onBattleStart)
          this.format.onBattleStart.call(this);
        for (const rule of this.ruleTable.keys()) {
          if ("+*-!".includes(rule.charAt(0)))
            continue;
          const subFormat = this.dex.formats.get(rule);
          if (subFormat.onBattleStart)
            subFormat.onBattleStart.call(this);
        }
        for (const side of this.sides) {
          for (let i = 0; i < side.active.length; i++) {
            if (!side.pokemonLeft) {
              side.active[i] = side.pokemon[i];
              side.active[i].fainted = true;
              side.active[i].hp = 0;
            } else {
              this.actions.switchIn(side.pokemon[i], i);
            }
          }
        }
        for (const pokemon of this.getAllPokemon()) {
          this.singleEvent("Start", this.dex.conditions.getByID(pokemon.species.id), pokemon.speciesState, pokemon);
        }
        this.midTurn = true;
        break;
      }
      case "move":
        if (!action.pokemon.isActive)
          return false;
        if (action.pokemon.fainted)
          return false;
        this.actions.runMove(
          action.move,
          action.pokemon,
          action.targetLoc,
          action.sourceEffect,
          action.zmove,
          void 0,
          action.maxMove,
          action.originalTarget
        );
        break;
      case "megaEvo":
        this.actions.runMegaEvo(action.pokemon);
        break;
      case "runDynamax":
        action.pokemon.addVolatile("dynamax");
        action.pokemon.side.dynamaxUsed = true;
        if (action.pokemon.side.allySide)
          action.pokemon.side.allySide.dynamaxUsed = true;
        break;
      case "terastallize":
        this.actions.terastallize(action.pokemon);
        break;
      case "beforeTurnMove":
        if (!action.pokemon.isActive)
          return false;
        if (action.pokemon.fainted)
          return false;
        this.debug("before turn callback: " + action.move.id);
        const target = this.getTarget(action.pokemon, action.move, action.targetLoc);
        if (!target)
          return false;
        if (!action.move.beforeTurnCallback)
          throw new Error(`beforeTurnMove has no beforeTurnCallback`);
        action.move.beforeTurnCallback.call(this, action.pokemon, target);
        break;
      case "priorityChargeMove":
        if (!action.pokemon.isActive)
          return false;
        if (action.pokemon.fainted)
          return false;
        this.debug("priority charge callback: " + action.move.id);
        if (!action.move.priorityChargeCallback)
          throw new Error(`priorityChargeMove has no priorityChargeCallback`);
        action.move.priorityChargeCallback.call(this, action.pokemon);
        break;
      case "event":
        this.runEvent(action.event, action.pokemon);
        break;
      case "team":
        if (action.index === 0) {
          action.pokemon.side.pokemon = [];
        }
        action.pokemon.side.pokemon.push(action.pokemon);
        action.pokemon.position = action.index;
        return;
      case "pass":
        return;
      case "instaswitch":
      case "switch":
        if (action.choice === "switch" && action.pokemon.status) {
          this.singleEvent("CheckShow", this.dex.abilities.getByID("naturalcure"), null, action.pokemon);
        }
        if (this.actions.switchIn(action.target, action.pokemon.position, action.sourceEffect) === "pursuitfaint") {
          if (this.gen <= 4) {
            this.hint("Previously chosen switches continue in Gen 2-4 after a Pursuit target faints.");
            action.priority = -101;
            this.queue.unshift(action);
            break;
          } else {
            this.hint("A Pokemon can't switch between when it runs out of HP and when it faints");
            break;
          }
        }
        break;
      case "revivalblessing":
        action.pokemon.side.pokemonLeft++;
        if (action.target.position < action.pokemon.side.active.length) {
          this.queue.addChoice({
            choice: "instaswitch",
            pokemon: action.target,
            target: action.target
          });
        }
        action.target.fainted = false;
        action.target.faintQueued = false;
        action.target.subFainted = false;
        action.target.status = "";
        action.target.hp = 1;
        action.target.sethp(action.target.maxhp / 2);
        this.add("-heal", action.target, action.target.getHealth, "[from] move: Revival Blessing");
        action.pokemon.side.removeSlotCondition(action.pokemon, "revivalblessing");
        break;
      case "runUnnerve":
        this.singleEvent("PreStart", action.pokemon.getAbility(), action.pokemon.abilityState, action.pokemon);
        break;
      case "runSwitch":
        this.actions.runSwitch(action.pokemon);
        break;
      case "runPrimal":
        if (!action.pokemon.transformed) {
          this.singleEvent("Primal", action.pokemon.getItem(), action.pokemon.itemState, action.pokemon);
        }
        break;
      case "shift":
        if (!action.pokemon.isActive)
          return false;
        if (action.pokemon.fainted)
          return false;
        this.swapPosition(action.pokemon, 1);
        break;
      case "beforeTurn":
        this.eachEvent("BeforeTurn");
        break;
      case "residual":
        this.add("");
        this.clearActiveMove(true);
        this.updateSpeed();
        residualPokemon = this.getAllActive().map((pokemon) => [pokemon, pokemon.getUndynamaxedHP()]);
        this.residualEvent("Residual");
        this.add("upkeep");
        break;
    }
    for (const side of this.sides) {
      for (const pokemon of side.active) {
        if (pokemon.forceSwitchFlag) {
          if (pokemon.hp)
            this.actions.dragIn(pokemon.side, pokemon.position);
          pokemon.forceSwitchFlag = false;
        }
      }
    }
    this.clearActiveMove();
    this.faintMessages();
    if (this.ended)
      return true;
    if (!this.queue.peek() || this.gen <= 3 && ["move", "residual"].includes(this.queue.peek().choice)) {
      this.checkFainted();
    } else if (action.choice === "megaEvo" && this.gen === 7) {
      this.eachEvent("Update");
      for (const [i, queuedAction] of this.queue.list.entries()) {
        if (queuedAction.pokemon === action.pokemon && queuedAction.choice === "move") {
          this.queue.list.splice(i, 1);
          queuedAction.mega = "done";
          this.queue.insertChoice(queuedAction, true);
          break;
        }
      }
      return false;
    } else if (this.queue.peek()?.choice === "instaswitch") {
      return false;
    }
    if (this.gen >= 5) {
      this.eachEvent("Update");
      for (const [pokemon, originalHP] of residualPokemon) {
        const maxhp = pokemon.getUndynamaxedHP(pokemon.maxhp);
        if (pokemon.hp && pokemon.getUndynamaxedHP() <= maxhp / 2 && originalHP > maxhp / 2) {
          this.runEvent("EmergencyExit", pokemon);
        }
      }
    }
    if (action.choice === "runSwitch") {
      const pokemon = action.pokemon;
      if (pokemon.hp && pokemon.hp <= pokemon.maxhp / 2 && pokemonOriginalHP > pokemon.maxhp / 2) {
        this.runEvent("EmergencyExit", pokemon);
      }
    }
    const switches = this.sides.map(
      (side) => side.active.some((pokemon) => pokemon && !!pokemon.switchFlag)
    );
    for (let i = 0; i < this.sides.length; i++) {
      let reviveSwitch = false;
      if (switches[i] && !this.canSwitch(this.sides[i])) {
        for (const pokemon of this.sides[i].active) {
          if (this.sides[i].slotConditions[pokemon.position]["revivalblessing"]) {
            reviveSwitch = true;
            continue;
          }
          pokemon.switchFlag = false;
        }
        if (!reviveSwitch)
          switches[i] = false;
      } else if (switches[i]) {
        for (const pokemon of this.sides[i].active) {
          if (pokemon.hp && pokemon.switchFlag && pokemon.switchFlag !== "revivalblessing" && !pokemon.skipBeforeSwitchOutEventFlag) {
            this.runEvent("BeforeSwitchOut", pokemon);
            pokemon.skipBeforeSwitchOutEventFlag = true;
            this.faintMessages();
            if (this.ended)
              return true;
            if (pokemon.fainted) {
              switches[i] = this.sides[i].active.some((sidePokemon) => sidePokemon && !!sidePokemon.switchFlag);
            }
          }
        }
      }
    }
    for (const playerSwitch of switches) {
      if (playerSwitch) {
        this.makeRequest("switch");
        return true;
      }
    }
    if (this.gen < 5)
      this.eachEvent("Update");
    if (this.gen >= 8 && (this.queue.peek()?.choice === "move" || this.queue.peek()?.choice === "runDynamax")) {
      this.updateSpeed();
      for (const queueAction of this.queue.list) {
        if (queueAction.pokemon)
          this.getActionSpeed(queueAction);
      }
      this.queue.sort();
    }
    return false;
  }
  go() {
    this.add("");
    this.add("t:", Math.floor(Date.now() / 1e3));
    if (this.requestState)
      this.requestState = "";
    if (!this.midTurn) {
      this.queue.insertChoice({ choice: "beforeTurn" });
      this.queue.addChoice({ choice: "residual" });
      this.midTurn = true;
    }
    let action;
    while (action = this.queue.shift()) {
      this.runAction(action);
      if (this.requestState || this.ended)
        return;
    }
    this.nextTurn();
    this.midTurn = false;
    this.queue.clear();
  }
  /**
   * Takes a choice string passed from the client. Starts the next
   * turn if all required choices have been made.
   */
  choose(sideid, input) {
    const side = this.getSide(sideid);
    if (!side.choose(input))
      return false;
    if (!side.isChoiceDone()) {
      side.emitChoiceError(`Incomplete choice: ${input} - missing other pokemon`);
      return false;
    }
    if (this.allChoicesDone())
      this.commitDecisions();
    return true;
  }
  /**
   * Convenience method for easily making choices.
   */
  makeChoices(...inputs) {
    if (inputs.length) {
      for (const [i, input] of inputs.entries()) {
        if (input)
          this.sides[i].choose(input);
      }
    } else {
      for (const side of this.sides) {
        side.autoChoose();
      }
    }
    this.commitDecisions();
  }
  commitDecisions() {
    this.updateSpeed();
    const oldQueue = this.queue.list;
    this.queue.clear();
    if (!this.allChoicesDone())
      throw new Error("Not all choices done");
    for (const side of this.sides) {
      const choice = side.getChoice();
      if (choice)
        this.inputLog.push(`>${side.id} ${choice}`);
    }
    for (const side of this.sides) {
      this.queue.addChoice(side.choice.actions);
    }
    this.clearRequest();
    this.queue.sort();
    this.queue.list.push(...oldQueue);
    this.requestState = "";
    for (const side of this.sides) {
      side.activeRequest = null;
    }
    this.go();
    if (this.log.length - this.sentLogPos > 500)
      this.sendUpdates();
  }
  splitFirst(str, delimiter, limit = 1) {
    const splitStr = [];
    while (splitStr.length < limit) {
      const delimiterIndex = str.indexOf(delimiter);
      if (delimiterIndex >= 0) {
        splitStr.push(str.slice(0, delimiterIndex));
        str = str.slice(delimiterIndex + delimiter.length);
      } else {
        splitStr.push(str);
        str = "";
      }
    }
    splitStr.push(str);
    return splitStr;
  }
  useItem(message) {
    if (message === void 0)
      throw new Error(`No message offered for useItem`);
    const [pokemonId, itemName, itemId, data] = this.splitFirst(message, " ", 4);
    const messageStart = `${pokemonId} ${itemName} ${itemId}`;
    var dataArray = message.substring(message.indexOf(messageStart) + messageStart.length).split(" ").filter((v) => v != "");
    if (pokemonId === void 0)
      throw new Error(`Pokemon ID required for useitem`);
    if (itemName === void 0)
      throw new Error("Item Name required for useitem");
    if (itemId === void 0)
      throw new Error("Item ID required for useitem");
    if (!BagItems.has(itemId)) {
      throw new Error("Invalid item: " + itemId);
    }
    const item = BagItems.getItem(itemId);
    const pokemon = this.getPokemonById(pokemonId);
    if (!pokemon)
      throw new Error(`No pokemon found for ID ${pokemonId}`);
    if (this.ended) {
      return;
    }
    this.add("bagitem", pokemon.uuid, itemName, itemId);
    item.use(this, pokemon, itemId, dataArray);
  }
  undoChoice(sideid) {
    const side = this.getSide(sideid);
    if (!side.requestState)
      return;
    if (side.choice.cantUndo) {
      side.emitChoiceError(`Can't undo: A trapping/disabling effect would cause undo to leak information`);
      return;
    }
    side.clearChoice();
  }
  /**
   * returns true if both decisions are complete
   */
  allChoicesDone() {
    let totalActions = 0;
    for (const side of this.sides) {
      if (side.isChoiceDone()) {
        if (!this.supportCancel)
          side.choice.cantUndo = true;
        totalActions++;
      }
    }
    return totalActions >= this.sides.length;
  }
  hint(hint, once, side) {
    if (this.hints.has(hint))
      return;
    if (side) {
      this.addSplit(side.id, ["-hint", hint]);
    } else {
      this.add("-hint", hint);
    }
    if (once)
      this.hints.add(hint);
  }
  addSplit(side, secret, shared) {
    this.log.push(`|split|${side}`);
    this.add(...secret);
    if (shared) {
      this.add(...shared);
    } else {
      this.log.push("");
    }
  }
  add(...parts) {
    if (!parts.some((part) => typeof part === "function")) {
      this.log.push(`|${parts.join("|")}`);
      return;
    }
    let side = null;
    const secret = [];
    const shared = [];
    for (const part of parts) {
      if (typeof part === "function") {
        const split = part();
        if (side && side !== split.side)
          throw new Error("Multiple sides passed to add");
        side = split.side;
        secret.push(split.secret);
        shared.push(split.shared);
      } else {
        secret.push(part);
        shared.push(part);
      }
    }
    this.addSplit(side, secret, shared);
  }
  // eslint-disable-next-line @typescript-eslint/ban-types
  addMove(...args) {
    this.lastMoveLine = this.log.length;
    this.log.push(`|${args.join("|")}`);
  }
  // eslint-disable-next-line @typescript-eslint/ban-types
  attrLastMove(...args) {
    if (this.lastMoveLine < 0)
      return;
    if (this.log[this.lastMoveLine].startsWith("|-anim|")) {
      if (args.includes("[still]")) {
        this.log.splice(this.lastMoveLine, 1);
        this.lastMoveLine = -1;
        return;
      }
    } else if (args.includes("[still]")) {
      const parts = this.log[this.lastMoveLine].split("|");
      parts[4] = "";
      this.log[this.lastMoveLine] = parts.join("|");
    }
    this.log[this.lastMoveLine] += `|${args.join("|")}`;
  }
  retargetLastMove(newTarget) {
    if (this.lastMoveLine < 0)
      return;
    const parts = this.log[this.lastMoveLine].split("|");
    parts[4] = newTarget.toString();
    this.log[this.lastMoveLine] = parts.join("|");
  }
  debug(activity) {
    if (this.debugMode) {
      this.add("debug", activity);
    }
  }
  getDebugLog() {
    const channelMessages = extractChannelMessages(this.log.join("\n"), [-1]);
    return channelMessages[-1].join("\n");
  }
  debugError(activity) {
    this.add("debug", activity);
  }
  // players
  getTeam(options) {
    let team = options.team;
    if (typeof team === "string")
      team = import_teams.Teams.unpack(team);
    if (team)
      return team;
    if (!options.seed) {
      options.seed = import_prng.PRNG.generateSeed();
    }
    if (!this.teamGenerator) {
      this.teamGenerator = import_teams.Teams.getGenerator(this.format, options.seed);
    } else {
      this.teamGenerator.setSeed(options.seed);
    }
    team = this.teamGenerator.getTeam(options);
    return team;
  }
  showOpenTeamSheets(hideFromSpectators = false) {
    if (this.turn !== 0)
      return;
    for (const side of this.sides) {
      const team = side.pokemon.map((pokemon) => {
        const set = pokemon.set;
        const newSet = {
          name: "",
          species: set.species,
          item: set.item,
          ability: set.ability,
          moves: set.moves,
          nature: "",
          gender: pokemon.gender,
          evs: null,
          ivs: null,
          level: set.level
        };
        if (this.gen === 8)
          newSet.gigantamax = set.gigantamax;
        if (this.gen === 9)
          newSet.teraType = set.teraType;
        if (set.moves.some((m) => this.dex.moves.get(m).id === "hiddenpower"))
          newSet.hpType = set.hpType;
        if ((0, import_dex.toID)(set.species) === "zacian" && (0, import_dex.toID)(set.item) === "rustedsword" || (0, import_dex.toID)(set.species) === "zamazenta" && (0, import_dex.toID)(set.item) === "rustedshield") {
          newSet.species = import_dex.Dex.species.get(set.species + "crowned").name;
          const crowned = {
            "Zacian-Crowned": "behemothblade",
            "Zamazenta-Crowned": "behemothbash"
          };
          const ironHead = set.moves.map(import_dex.toID).indexOf("ironhead");
          if (ironHead >= 0) {
            newSet.moves[ironHead] = crowned[newSet.species];
          }
        }
        return newSet;
      });
      if (hideFromSpectators) {
        for (const s of this.sides) {
          this.addSplit(s.id, ["showteam", side.id, import_teams.Teams.pack(team)]);
        }
      } else {
        this.add("showteam", side.id, import_teams.Teams.pack(team));
      }
    }
  }
  setPlayer(slot, options) {
    let side;
    let didSomething = true;
    const slotNum = parseInt(slot[1]) - 1;
    if (!this.sides[slotNum]) {
      const team = this.getTeam(options);
      side = new import_side.Side(options.name || `Player ${slotNum + 1}`, this, slotNum, team);
      if (options.avatar)
        side.avatar = "" + options.avatar;
      this.sides[slotNum] = side;
    } else {
      side = this.sides[slotNum];
      didSomething = false;
      if (options.name && side.name !== options.name) {
        side.name = options.name;
        didSomething = true;
      }
      if (options.avatar && side.avatar !== "" + options.avatar) {
        side.avatar = "" + options.avatar;
        didSomething = true;
      }
      if (options.team)
        throw new Error(`Player ${slot} already has a team!`);
    }
    if (options.team && typeof options.team !== "string") {
      options.team = import_teams.Teams.pack(options.team);
    }
    if (!didSomething)
      return;
    this.inputLog.push(`>player ${slot} ` + JSON.stringify(options));
    this.add("player", side.id, side.name, side.avatar, options.rating || "");
    if (this.sides.every((playerSide) => !!playerSide) && !this.started)
      this.start();
  }
  /** @deprecated */
  join(slot, name, avatar, team) {
    this.setPlayer(slot, { name, avatar, team });
    return this.getSide(slot);
  }
  sendUpdates() {
    if (this.sentLogPos >= this.log.length)
      return;
    this.send("update", this.log.slice(this.sentLogPos));
    this.sentLogPos = this.log.length;
    if (!this.sentEnd && this.ended) {
      const log = {
        winner: this.winner,
        seed: this.prngSeed,
        turns: this.turn,
        p1: this.sides[0].name,
        p2: this.sides[1].name,
        p3: this.sides[2] && this.sides[2].name,
        p4: this.sides[3] && this.sides[3].name,
        p1team: this.sides[0].team,
        p2team: this.sides[1].team,
        p3team: this.sides[2] && this.sides[2].team,
        p4team: this.sides[3] && this.sides[3].team,
        score: [this.sides[0].pokemonLeft, this.sides[1].pokemonLeft],
        inputLog: this.inputLog
      };
      if (this.sides[2]) {
        log.score.push(this.sides[2].pokemonLeft);
      } else {
        delete log.p3;
        delete log.p3team;
      }
      if (this.sides[3]) {
        log.score.push(this.sides[3].pokemonLeft);
      } else {
        delete log.p4;
        delete log.p4team;
      }
      this.send("end", JSON.stringify(log));
      this.sentEnd = true;
    }
  }
  getSide(sideid) {
    return this.sides[parseInt(sideid[1]) - 1];
  }
  destroy() {
    this.field.destroy();
    this.field = null;
    for (let i = 0; i < this.sides.length; i++) {
      if (this.sides[i]) {
        this.sides[i].destroy();
        this.sides[i] = null;
      }
    }
    for (const action of this.queue.list) {
      delete action.pokemon;
    }
    this.queue.battle = null;
    this.queue = null;
    this.log = [];
  }
}
//# sourceMappingURL=battle.js.map
