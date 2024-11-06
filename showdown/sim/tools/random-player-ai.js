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
var random_player_ai_exports = {};
__export(random_player_ai_exports, {
  RandomPlayerAI: () => RandomPlayerAI
});
module.exports = __toCommonJS(random_player_ai_exports);
var import_battle_stream = require("../battle-stream");
var import_prng = require("../prng");
/**
 * Example random player AI.
 *
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * @license MIT
 */
class RandomPlayerAI extends import_battle_stream.BattlePlayer {
  constructor(playerStream, options = {}, debug = false) {
    super(playerStream, debug);
    this.move = options.move || 1;
    this.mega = options.mega || 0;
    this.prng = options.seed && !Array.isArray(options.seed) ? options.seed : new import_prng.PRNG(options.seed);
  }
  receiveError(error) {
    if (error.message.startsWith("[Unavailable choice]"))
      return;
    throw error;
  }
  receiveRequest(request) {
    if (request.wait) {
    } else if (request.forceSwitch) {
      const pokemon = request.side.pokemon;
      const chosen = [];
      const choices = request.forceSwitch.map((mustSwitch, i) => {
        if (!mustSwitch)
          return `pass`;
        const canSwitch = range(1, 6).filter((j) => pokemon[j - 1] && // not active
        j > request.forceSwitch.length && // not chosen for a simultaneous switch
        !chosen.includes(j) && // not fainted or fainted and using Revival Blessing
        !!(+!!pokemon[i].reviving ^ +!pokemon[j - 1].condition.endsWith(` fnt`)));
        if (!canSwitch.length)
          return `pass`;
        const target = this.chooseSwitch(
          request.active,
          canSwitch.map((slot) => ({ slot, pokemon: pokemon[slot - 1] }))
        );
        chosen.push(target);
        return `switch ${target}`;
      });
      this.choose(choices.join(`, `));
    } else if (request.active) {
      let [canMegaEvo, canUltraBurst, canZMove, canDynamax, canTerastallize] = [true, true, true, true, true];
      const pokemon = request.side.pokemon;
      const chosen = [];
      const choices = request.active.map((active, i) => {
        if (pokemon[i].condition.endsWith(` fnt`) || pokemon[i].commanding)
          return `pass`;
        canMegaEvo = canMegaEvo && active.canMegaEvo;
        canUltraBurst = canUltraBurst && active.canUltraBurst;
        canZMove = canZMove && !!active.canZMove;
        canDynamax = canDynamax && !!active.canDynamax;
        canTerastallize = canTerastallize && !!active.canTerastallize;
        const change = (canMegaEvo || canUltraBurst || canDynamax) && this.prng.next() < this.mega;
        const useMaxMoves = !active.canDynamax && active.maxMoves || change && canDynamax;
        const possibleMoves = useMaxMoves ? active.maxMoves.maxMoves : active.moves;
        let canMove = range(1, possibleMoves.length).filter((j) => // not disabled
        !possibleMoves[j - 1].disabled).map((j) => ({
          slot: j,
          move: possibleMoves[j - 1].move,
          target: possibleMoves[j - 1].target,
          zMove: false
        }));
        if (canZMove) {
          canMove.push(...range(1, active.canZMove.length).filter((j) => active.canZMove[j - 1]).map((j) => ({
            slot: j,
            move: active.canZMove[j - 1].move,
            target: active.canZMove[j - 1].target,
            zMove: true
          })));
        }
        const hasAlly = pokemon.length > 1 && !pokemon[i ^ 1].condition.endsWith(` fnt`);
        const filtered = canMove.filter((m) => m.target !== `adjacentAlly` || hasAlly);
        canMove = filtered.length ? filtered : canMove;
        const moves = canMove.map((m) => {
          let move = `move ${m.slot}`;
          if (request.active.length > 1) {
            if ([`normal`, `any`, `adjacentFoe`].includes(m.target)) {
              move += ` ${1 + Math.floor(this.prng.next() * 2)}`;
            }
            if (m.target === `adjacentAlly`) {
              move += ` -${(i ^ 1) + 1}`;
            }
            if (m.target === `adjacentAllyOrSelf`) {
              if (hasAlly) {
                move += ` -${1 + Math.floor(this.prng.next() * 2)}`;
              } else {
                move += ` -${i + 1}`;
              }
            }
          }
          if (m.zMove)
            move += ` zmove`;
          return { choice: move, move: m };
        });
        const canSwitch = range(1, 6).filter((j) => pokemon[j - 1] && // not active
        !pokemon[j - 1].active && // not chosen for a simultaneous switch
        !chosen.includes(j) && // not fainted
        !pokemon[j - 1].condition.endsWith(` fnt`));
        const switches = active.trapped ? [] : canSwitch;
        if (switches.length && (!moves.length || this.prng.next() > this.move)) {
          const target = this.chooseSwitch(
            active,
            canSwitch.map((slot) => ({ slot, pokemon: pokemon[slot - 1] }))
          );
          chosen.push(target);
          return `switch ${target}`;
        } else if (moves.length) {
          const move = this.chooseMove(active, moves);
          if (move.endsWith(` zmove`)) {
            canZMove = false;
            return move;
          } else if (change) {
            if (canTerastallize) {
              canTerastallize = false;
              return `${move} terastallize`;
            } else if (canDynamax) {
              canDynamax = false;
              return `${move} dynamax`;
            } else if (canMegaEvo) {
              canMegaEvo = false;
              return `${move} mega`;
            } else {
              canUltraBurst = false;
              return `${move} ultra`;
            }
          } else {
            return move;
          }
        } else {
          throw new Error(`${this.constructor.name} unable to make choice ${i}. request='${request}', chosen='${chosen}', (mega=${canMegaEvo}, ultra=${canUltraBurst}, zmove=${canZMove}, dynamax='${canDynamax}', terastallize=${canTerastallize})`);
        }
      });
      this.choose(choices.join(`, `));
    } else {
      this.choose(this.chooseTeamPreview(request.side.pokemon));
    }
  }
  chooseTeamPreview(team) {
    return `default`;
  }
  chooseMove(active, moves) {
    return this.prng.sample(moves).choice;
  }
  chooseSwitch(active, switches) {
    return this.prng.sample(switches).slot;
  }
}
function range(start, end, step = 1) {
  if (end === void 0) {
    end = start;
    start = 0;
  }
  const result = [];
  for (; start <= end; start += step) {
    result.push(start);
  }
  return result;
}
//# sourceMappingURL=random-player-ai.js.map
