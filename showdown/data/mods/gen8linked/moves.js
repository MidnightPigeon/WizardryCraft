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
var moves_exports = {};
__export(moves_exports, {
  Moves: () => Moves
});
module.exports = __toCommonJS(moves_exports);
const Moves = {
  pursuit: {
    inherit: true,
    beforeTurnCallback(pokemon, target) {
      const linkedMoves = pokemon.getLinkedMoves();
      if (linkedMoves.length) {
        if (linkedMoves[0] !== "pursuit" && linkedMoves[1] === "pursuit")
          return;
      }
      target.side.addSideCondition("pursuit", pokemon);
      if (!target.side.sideConditions["pursuit"].sources) {
        target.side.sideConditions["pursuit"].sources = [];
      }
      target.side.sideConditions["pursuit"].sources.push(pokemon);
    }
  },
  mefirst: {
    inherit: true,
    onTryHit(target, pokemon) {
      const action = this.queue.willMove(target);
      if (action) {
        const move = this.dex.getActiveMove(action.linked?.[0] || action.move);
        if (move.category !== "Status" && !move.flags["failmefirst"]) {
          pokemon.addVolatile("mefirst");
          this.actions.useMove(move, pokemon, target);
          return null;
        }
      }
      return false;
    }
  },
  // Modify Sucker Punch to check if both moves in a link are status
  suckerpunch: {
    inherit: true,
    onTry(source, target) {
      const action = this.queue.willMove(target);
      if (!action || action.choice !== "move") {
        this.attrLastMove("[still]");
        this.add("-fail", source);
        return null;
      }
      if (target.volatiles.mustrecharge && target.volatiles.mustrecharge.duration < 2) {
        this.attrLastMove("[still]");
        this.add("-fail", source);
        return null;
      }
      if (!action.linked) {
        if (action.move.category === "Status" && action.move.id !== "mefirst") {
          this.attrLastMove("[still]");
          this.add("-fail", source);
          return null;
        }
      } else {
        for (const linkedMove of action.linked) {
          if (linkedMove.category !== "Status" || linkedMove.id === "mefirst")
            return;
        }
        this.attrLastMove("[still]");
        this.add("-fail", source);
        return null;
      }
    }
  },
  // Copy the last used move of a link
  sketch: {
    inherit: true,
    onHit(target, source) {
      const disallowedMoves = ["chatter", "sketch", "struggle"];
      const lastMove = target.m.lastMoveAbsolute;
      if (source.transformed || !lastMove || disallowedMoves.includes(lastMove.id) || source.moves.includes(lastMove.id) || lastMove.isZ)
        return false;
      const sketchIndex = source.moves.indexOf("sketch");
      if (sketchIndex < 0)
        return false;
      const move = this.dex.moves.get(lastMove);
      const sketchedMove = {
        move: move.name,
        id: move.id,
        pp: move.pp,
        maxpp: move.pp,
        target: move.target,
        disabled: false,
        used: false
      };
      source.moveSlots[sketchIndex] = sketchedMove;
      source.baseMoveSlots[sketchIndex] = sketchedMove;
      this.add("-activate", source, "move: Sketch", move.name);
    }
  },
  mimic: {
    inherit: true,
    onHit(target, source) {
      const lastMove = target.m.lastMoveAbsolute;
      if (source.transformed || !lastMove || lastMove.flags["failmimic"] || source.moves.includes(lastMove.id) || lastMove.isZ)
        return false;
      const mimicIndex = source.moves.indexOf("mimic");
      if (mimicIndex < 0)
        return false;
      const move = this.dex.moves.get(lastMove);
      source.moveSlots[mimicIndex] = {
        move: move.name,
        id: move.id,
        pp: move.pp,
        maxpp: move.pp,
        target: move.target,
        disabled: false,
        used: false,
        virtual: true
      };
      this.add("-start", source, "Mimic", move.name);
    }
  },
  // Copy/call last move of a link
  instruct: {
    inherit: true,
    onHit(target, source) {
      const lastMove = target.m.lastMoveAbsolute;
      if (!lastMove || target.volatiles["dynamax"])
        return false;
      const moveIndex = target.moves.indexOf(lastMove.id);
      if (lastMove.flags["failinstruct"] || lastMove.isZ || lastMove.isMax || lastMove.flags["charge"] || lastMove.flags["recharge"] || target.volatiles["beakblast"] || target.volatiles["focuspunch"] || target.volatiles["shelltrap"] || target.moveSlots[moveIndex] && target.moveSlots[moveIndex].pp <= 0) {
        return false;
      }
      this.add("-singleturn", target, "move: Instruct", "[of] " + source);
      this.actions.runMove(lastMove.id, target, target.lastMoveTargetLoc);
    }
  },
  mirrormove: {
    inherit: true,
    onTryHit(target, pokemon) {
      const move = target.m.lastMoveAbsolute;
      if (!move || !move.flags["mirror"] || move.isZ || move.isMax) {
        return false;
      }
      this.actions.useMove(move.id, pokemon, target);
      return null;
    }
  },
  // Disabling effects
  disable: {
    inherit: true,
    condition: {
      duration: 5,
      noCopy: true,
      // doesn't get copied by Baton Pass
      onStart(pokemon, source, effect) {
        const lastMove = pokemon.m.lastMoveAbsolute;
        if (this.queue.willMove(pokemon) || pokemon === this.activePokemon && this.activeMove && !this.activeMove.isExternal) {
          this.effectState.duration--;
        }
        if (!lastMove) {
          this.debug("pokemon hasn't moved yet");
          return false;
        }
        for (const moveSlot of pokemon.moveSlots) {
          if (moveSlot.id === lastMove.id) {
            if (!moveSlot.pp) {
              this.debug("Move out of PP");
              return false;
            } else {
              if (effect.id === "cursedbody") {
                this.add("-start", pokemon, "Disable", moveSlot.move, "[from] ability: Cursed Body", "[of] " + source);
              } else {
                this.add("-start", pokemon, "Disable", moveSlot.move);
              }
              this.effectState.move = lastMove.id;
              return;
            }
          }
        }
        return false;
      },
      onResidualOrder: 14,
      onEnd(pokemon) {
        this.add("-end", pokemon, "Disable");
      },
      onBeforeMovePriority: 7,
      onBeforeMove(attacker, defender, move) {
        if (!move.isZ && move.id === this.effectState.move) {
          this.add("cant", attacker, "Disable", move);
          return false;
        }
      },
      onDisableMove(pokemon) {
        for (const moveSlot of pokemon.moveSlots) {
          if (moveSlot.id === this.effectState.move) {
            pokemon.disableMove(moveSlot.id);
          }
        }
      }
    }
  },
  encore: {
    inherit: true,
    condition: {
      duration: 3,
      noCopy: true,
      // doesn't get copied by Z-Baton Pass
      onStart(target) {
        let lastMove = target.m.lastMoveAbsolute;
        if (!lastMove || target.volatiles["dynamax"])
          return false;
        if (lastMove.isZOrMaxPowered)
          lastMove = this.dex.moves.get(lastMove.baseMove);
        const linkedMoves = target.getLinkedMoves(true);
        const moveIndex = target.moves.indexOf(lastMove.id);
        if (linkedMoves.includes(lastMove.id) && this.dex.moves.get(linkedMoves[0]).flags["failencore"] && this.dex.moves.get(linkedMoves[1]).flags["failencore"]) {
          delete target.volatiles["encore"];
          return false;
        }
        if (lastMove.isZ || lastMove.flags["failencore"] || target.moveSlots[moveIndex] && target.moveSlots[moveIndex].pp <= 0) {
          delete target.volatiles["encore"];
          return false;
        }
        this.effectState.turnsActivated = {};
        this.effectState.move = lastMove.id;
        this.add("-start", target, "Encore");
        if (linkedMoves.includes(lastMove.id)) {
          this.effectState.move = linkedMoves;
        }
        if (!this.queue.willMove(target)) {
          this.effectState.duration++;
        }
      },
      onOverrideAction(pokemon, target, move) {
        if (!this.effectState.turnsActivated[this.turn]) {
          this.effectState.turnsActivated[this.turn] = 0;
        } else if (this.effectState.turnsActivated[this.turn] >= (Array.isArray(this.effectState.move) ? this.effectState.move.length : 1)) {
          return;
        }
        this.effectState.turnsActivated[this.turn]++;
        if (!Array.isArray(this.effectState.move)) {
          this.queue.cancelAction(pokemon);
          if (move.id !== this.effectState.move)
            return this.effectState.move;
          return;
        }
        switch (this.effectState.turnsActivated[this.turn]) {
          case 1: {
            if (this.effectState.move[0] !== move.id)
              return this.effectState.move[0];
            return;
          }
          case 2:
            if (this.effectState.move[1] !== move.id)
              return this.effectState.move[1];
            return;
        }
      },
      onResidualOrder: 13,
      onResidual(target) {
        const lastMove = target.m.lastMoveAbsolute;
        const index = target.moves.indexOf(lastMove.id);
        if (index === -1)
          return;
        if (target.hasLinkedMove(lastMove.id)) {
          if (target.moveSlots[0].pp <= 0 || target.moveSlots[1].pp <= 0) {
            delete target.volatiles.encore;
            this.add("-end", target, "Encore");
          }
        } else {
          if (target.moveSlots[index].pp <= 0) {
            delete target.volatiles.encore;
            this.add("-end", target, "Encore");
          }
        }
      },
      onEnd(target) {
        this.add("-end", target, "Encore");
      },
      onDisableMove(pokemon) {
        if (Array.isArray(this.effectState.move)) {
          for (const moveSlot of pokemon.moveSlots) {
            if (moveSlot.id !== this.effectState.move[0] && moveSlot.id !== this.effectState.move[1]) {
              pokemon.disableMove(moveSlot.id);
            }
          }
        }
        if (!this.effectState.move || !pokemon.hasMove(this.effectState.move)) {
          return;
        }
        for (const moveSlot of pokemon.moveSlots) {
          if (moveSlot.id !== this.effectState.move) {
            pokemon.disableMove(moveSlot.id);
          }
        }
      }
    }
  },
  torment: {
    inherit: true,
    condition: {
      noCopy: true,
      onStart(pokemon) {
        if (pokemon.volatiles["dynamax"]) {
          delete pokemon.volatiles["torment"];
          return false;
        }
        this.add("-start", pokemon, "Torment");
      },
      onEnd(pokemon) {
        this.add("-end", pokemon, "Torment");
      },
      onDisableMove(pokemon) {
        const lastMove = pokemon.lastMove;
        if (!lastMove || lastMove.id === "struggle")
          return;
        if (Array.isArray(lastMove)) {
          for (const move of lastMove) {
            pokemon.disableMove(move.id);
          }
        } else {
          pokemon.disableMove(lastMove.id);
        }
      }
    }
  },
  // PP-decreasing moves
  grudge: {
    inherit: true,
    condition: {
      onStart(pokemon) {
        this.add("-singlemove", pokemon, "Grudge");
      },
      onFaint(target, source, effect) {
        if (!source || source.fainted || !effect)
          return;
        const lastMove = source.m.lastMoveAbsolute;
        if (effect.effectType === "Move" && !effect.flags["futuremove"] && lastMove) {
          for (const moveSlot of source.moveSlots) {
            if (moveSlot.id === lastMove.id) {
              moveSlot.pp = 0;
              this.add("-activate", source, "move: Grudge", this.dex.moves.get(lastMove.id).name);
            }
          }
        }
      },
      onBeforeMovePriority: 100,
      onBeforeMove(pokemon) {
        if (pokemon.moveThisTurn)
          return;
        this.debug("removing Grudge before attack");
        pokemon.removeVolatile("grudge");
      }
    }
  },
  spite: {
    inherit: true,
    onHit(target) {
      const lastMove = target.m.lastMoveAbsolute;
      if (!lastMove || lastMove.isZ || lastMove.isMax)
        return false;
      const ppDeducted = target.deductPP(lastMove.id, 4);
      if (!ppDeducted)
        return false;
      this.add("-activate", target, "move: Spite", lastMove.name, ppDeducted);
    }
  },
  // Other lastMove checks
  conversion2: {
    inherit: true,
    onHit(target, source) {
      const lastMove = target.m.lastMoveAbsolute;
      if (!lastMove)
        return false;
      const possibleTypes = [];
      const attackType = lastMove.type;
      for (const type in this.dex.data.TypeChart) {
        if (source.hasType(type))
          continue;
        const typeCheck = this.dex.data.TypeChart[type].damageTaken[attackType];
        if (typeCheck === 2 || typeCheck === 3) {
          possibleTypes.push(type);
        }
      }
      if (!possibleTypes.length) {
        return false;
      }
      const randomType = this.sample(possibleTypes);
      if (!source.setType(randomType))
        return false;
      this.add("-start", source, "typechange", randomType);
    }
  },
  destinybond: {
    inherit: true,
    condition: {
      onStart(pokemon) {
        this.add("-singlemove", pokemon, "Destiny Bond");
      },
      onFaint(target, source, effect) {
        if (!source || !effect || target.side === source.side)
          return;
        if (effect.effectType === "Move" && !effect.flags["futuremove"]) {
          if (source.volatiles["dynamax"]) {
            this.add("-hint", "Dynamaxed Pok\xE9mon are immune to Destiny Bond.");
            return;
          }
          this.add("-activate", target, "move: Destiny Bond");
          source.faint();
        }
      },
      onBeforeMovePriority: -1,
      onBeforeMove(pokemon, target, move) {
        if (pokemon.moveThisTurn || move.id === "destinybond")
          return;
        this.debug("removing Destiny Bond before attack");
        pokemon.removeVolatile("destinybond");
      },
      onMoveAborted(pokemon, target, move) {
        pokemon.removeVolatile("destinybond");
      }
    }
  },
  iceball: {
    inherit: true,
    condition: {
      duration: 1,
      onLockMove: "iceball",
      onStart() {
        this.effectState.hitCount = 0;
      },
      onResidual(target) {
        const lastMove = target.m.lastMoveAbsolute;
        if (lastMove?.id === "struggle") {
          delete target.volatiles["iceball"];
        }
      }
    }
  },
  rollout: {
    inherit: true,
    condition: {
      duration: 1,
      onLockMove: "rollout",
      onStart() {
        this.effectState.hitCount = 0;
      },
      onResidual(target) {
        const lastMove = target.m.lastMoveAbsolute;
        if (lastMove?.id === "struggle") {
          delete target.volatiles["rollout"];
        }
      }
    }
  }
};
//# sourceMappingURL=moves.js.map
