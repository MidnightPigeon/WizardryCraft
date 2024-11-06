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
var battle_queue_exports = {};
__export(battle_queue_exports, {
  BattleQueue: () => BattleQueue,
  default: () => battle_queue_default
});
module.exports = __toCommonJS(battle_queue_exports);
/**
 * Simulator Battle Action Queue
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * The action queue is the core of the battle simulation. A rough overview of
 * the core battle loop:
 *
 * - chosen moves/switches are added to the action queue
 * - the action queue is sorted in speed/priority order
 * - we go through the action queue
 * - repeat
 *
 * @license MIT
 */
class BattleQueue {
  constructor(battle) {
    this.battle = battle;
    this.list = [];
    const queueScripts = battle.format.queue || battle.dex.data.Scripts.queue;
    if (queueScripts)
      Object.assign(this, queueScripts);
  }
  shift() {
    return this.list.shift();
  }
  peek(end) {
    return this.list[end ? this.list.length - 1 : 0];
  }
  push(action) {
    return this.list.push(action);
  }
  unshift(action) {
    return this.list.unshift(action);
  }
  // eslint-disable-next-line no-restricted-globals
  [Symbol.iterator]() {
    return this.list[Symbol.iterator]();
  }
  entries() {
    return this.list.entries();
  }
  /**
   * Takes an ActionChoice, and fills it out into a full Action object.
   *
   * Returns an array of Actions because some ActionChoices (like mega moves)
   * resolve to two Actions (mega evolution + use move)
   */
  resolveAction(action, midTurn = false) {
    if (!action)
      throw new Error(`Action not passed to resolveAction`);
    if (action.choice === "pass")
      return [];
    const actions = [action];
    if (!action.side && action.pokemon)
      action.side = action.pokemon.side;
    if (!action.move && action.moveid)
      action.move = this.battle.dex.getActiveMove(action.moveid);
    if (!action.order) {
      const orders = {
        team: 1,
        start: 2,
        instaswitch: 3,
        beforeTurn: 4,
        beforeTurnMove: 5,
        revivalblessing: 6,
        runUnnerve: 100,
        runSwitch: 101,
        runPrimal: 102,
        switch: 103,
        megaEvo: 104,
        runDynamax: 105,
        terastallize: 106,
        priorityChargeMove: 107,
        shift: 200,
        // default is 200 (for moves)
        residual: 300
      };
      if (action.choice in orders) {
        action.order = orders[action.choice];
      } else {
        action.order = 200;
        if (!["move", "event"].includes(action.choice)) {
          throw new Error(`Unexpected orderless action ${action.choice}`);
        }
      }
    }
    if (!midTurn) {
      if (action.choice === "move") {
        if (!action.maxMove && !action.zmove && action.move.beforeTurnCallback) {
          actions.unshift(...this.resolveAction({
            choice: "beforeTurnMove",
            pokemon: action.pokemon,
            move: action.move,
            targetLoc: action.targetLoc
          }));
        }
        if (action.mega && !action.pokemon.isSkyDropped()) {
          actions.unshift(...this.resolveAction({
            choice: "megaEvo",
            pokemon: action.pokemon
          }));
        }
        if (action.terastallize && !action.pokemon.terastallized) {
          actions.unshift(...this.resolveAction({
            choice: "terastallize",
            pokemon: action.pokemon
          }));
        }
        if (action.maxMove && !action.pokemon.volatiles["dynamax"]) {
          actions.unshift(...this.resolveAction({
            choice: "runDynamax",
            pokemon: action.pokemon
          }));
        }
        if (!action.maxMove && !action.zmove && action.move.priorityChargeCallback) {
          actions.unshift(...this.resolveAction({
            choice: "priorityChargeMove",
            pokemon: action.pokemon,
            move: action.move
          }));
        }
        action.fractionalPriority = this.battle.runEvent("FractionalPriority", action.pokemon, null, action.move, 0);
      } else if (["switch", "instaswitch"].includes(action.choice)) {
        if (typeof action.pokemon.switchFlag === "string") {
          action.sourceEffect = this.battle.dex.moves.get(action.pokemon.switchFlag);
        }
        action.pokemon.switchFlag = false;
      }
    }
    const deferPriority = this.battle.gen === 7 && action.mega && action.mega !== "done";
    if (action.move) {
      let target = null;
      action.move = this.battle.dex.getActiveMove(action.move);
      if (!action.targetLoc) {
        target = this.battle.getRandomTarget(action.pokemon, action.move);
        if (target)
          action.targetLoc = action.pokemon.getLocOf(target);
      }
      action.originalTarget = action.pokemon.getAtLoc(action.targetLoc);
    }
    if (!deferPriority)
      this.battle.getActionSpeed(action);
    return actions;
  }
  /**
   * Makes the passed action happen next (skipping speed order).
   */
  prioritizeAction(action, sourceEffect) {
    for (const [i, curAction] of this.list.entries()) {
      if (curAction === action) {
        this.list.splice(i, 1);
        break;
      }
    }
    action.sourceEffect = sourceEffect;
    action.order = 3;
    this.list.unshift(action);
  }
  /**
   * Changes a pokemon's action, and inserts its new action
   * in priority order.
   *
   * You'd normally want the OverrideAction event (which doesn't
   * change priority order).
   */
  changeAction(pokemon, action) {
    this.cancelAction(pokemon);
    if (!action.pokemon)
      action.pokemon = pokemon;
    this.insertChoice(action);
  }
  addChoice(choices) {
    if (!Array.isArray(choices))
      choices = [choices];
    for (const choice of choices) {
      const resolvedChoices = this.resolveAction(choice);
      this.list.push(...resolvedChoices);
      for (const resolvedChoice of resolvedChoices) {
        if (resolvedChoice && resolvedChoice.choice === "move" && resolvedChoice.move.id !== "recharge") {
          resolvedChoice.pokemon.side.lastSelectedMove = resolvedChoice.move.id;
        }
      }
    }
  }
  willAct() {
    for (const action of this.list) {
      if (["move", "switch", "instaswitch", "shift"].includes(action.choice)) {
        return action;
      }
    }
    return null;
  }
  willMove(pokemon) {
    if (pokemon.fainted)
      return null;
    for (const action of this.list) {
      if (action.choice === "move" && action.pokemon === pokemon) {
        return action;
      }
    }
    return null;
  }
  cancelAction(pokemon) {
    const oldLength = this.list.length;
    for (let i = 0; i < this.list.length; i++) {
      if (this.list[i].pokemon === pokemon) {
        this.list.splice(i, 1);
        i--;
      }
    }
    return this.list.length !== oldLength;
  }
  cancelMove(pokemon) {
    for (const [i, action] of this.list.entries()) {
      if (action.choice === "move" && action.pokemon === pokemon) {
        this.list.splice(i, 1);
        return true;
      }
    }
    return false;
  }
  willSwitch(pokemon) {
    for (const action of this.list) {
      if (["switch", "instaswitch"].includes(action.choice) && action.pokemon === pokemon) {
        return action;
      }
    }
    return null;
  }
  /**
   * Inserts the passed action into the action queue when it normally
   * would have happened (sorting by priority/speed), without
   * re-sorting the existing actions.
   */
  insertChoice(choices, midTurn = false) {
    if (Array.isArray(choices)) {
      for (const choice2 of choices) {
        this.insertChoice(choice2);
      }
      return;
    }
    const choice = choices;
    if (choice.pokemon) {
      choice.pokemon.updateSpeed();
    }
    const actions = this.resolveAction(choice, midTurn);
    let firstIndex = null;
    let lastIndex = null;
    for (const [i, curAction] of this.list.entries()) {
      const compared = this.battle.comparePriority(actions[0], curAction);
      if (compared <= 0 && firstIndex === null) {
        firstIndex = i;
      }
      if (compared < 0) {
        lastIndex = i;
        break;
      }
    }
    if (firstIndex === null) {
      this.list.push(...actions);
    } else {
      if (lastIndex === null)
        lastIndex = this.list.length;
      const index = firstIndex === lastIndex ? firstIndex : this.battle.random(firstIndex, lastIndex + 1);
      this.list.splice(index, 0, ...actions);
    }
  }
  clear() {
    this.list = [];
  }
  debug(action) {
    if (action) {
      return `${action.order || ""}:${action.priority || ""}:${action.speed || ""}:${action.subOrder || ""} - ${action.choice}${action.pokemon ? " " + action.pokemon : ""}${action.move ? " " + action.move : ""}`;
    }
    return this.list.map(
      (queueAction) => this.debug(queueAction)
    ).join("\n") + "\n";
  }
  sort() {
    this.battle.speedSort(this.list);
    return this;
  }
}
var battle_queue_default = BattleQueue;
//# sourceMappingURL=battle-queue.js.map
