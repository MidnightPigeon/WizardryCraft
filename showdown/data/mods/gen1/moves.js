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
  acid: {
    inherit: true,
    secondary: {
      chance: 33,
      boosts: {
        def: -1
      }
    },
    target: "normal"
  },
  amnesia: {
    inherit: true,
    boosts: {
      spa: 2,
      spd: 2
    }
  },
  aurorabeam: {
    inherit: true,
    secondary: {
      chance: 33,
      boosts: {
        atk: -1
      }
    }
  },
  bide: {
    inherit: true,
    priority: 0,
    accuracy: true,
    condition: {
      onStart(pokemon) {
        this.effectState.damage = 0;
        this.effectState.time = this.random(2, 4);
        this.add("-start", pokemon, "Bide");
      },
      onBeforeMove(pokemon, t, move) {
        const currentMove = this.dex.getActiveMove("bide");
        this.effectState.damage += this.lastDamage;
        this.effectState.time--;
        if (!this.effectState.time) {
          this.add("-end", pokemon, currentMove);
          if (!this.effectState.damage) {
            this.debug("Bide failed because no damage was stored");
            this.add("-fail", pokemon);
            pokemon.removeVolatile("bide");
            return false;
          }
          const target = this.getRandomTarget(pokemon, "Pound");
          this.actions.moveHit(target, pokemon, currentMove, { damage: this.effectState.damage * 2 });
          pokemon.removeVolatile("bide");
          return false;
        }
        this.add("-activate", pokemon, "Bide");
        return false;
      },
      onDisableMove(pokemon) {
        if (!pokemon.hasMove("bide")) {
          return;
        }
        for (const moveSlot of pokemon.moveSlots) {
          if (moveSlot.id !== "bide") {
            pokemon.disableMove(moveSlot.id);
          }
        }
      }
    },
    type: "???"
    // Will look as Normal but it's STAB-less
  },
  bind: {
    inherit: true,
    ignoreImmunity: true,
    volatileStatus: "partiallytrapped",
    self: {
      volatileStatus: "partialtrappinglock"
    },
    // FIXME: onBeforeMove(pokemon, target) {target.removeVolatile('mustrecharge')}
    onHit(target, source) {
      if (target.volatiles["partiallytrapped"]) {
        if (source.volatiles["partialtrappinglock"] && source.volatiles["partialtrappinglock"].duration > 1) {
          target.volatiles["partiallytrapped"].duration = 2;
        }
      }
    }
  },
  bite: {
    inherit: true,
    category: "Physical",
    secondary: {
      chance: 10,
      volatileStatus: "flinch"
    },
    type: "Normal"
  },
  blizzard: {
    inherit: true,
    accuracy: 90,
    target: "normal"
  },
  bubble: {
    inherit: true,
    secondary: {
      chance: 33,
      boosts: {
        spe: -1
      }
    },
    target: "normal"
  },
  bubblebeam: {
    inherit: true,
    secondary: {
      chance: 33,
      boosts: {
        spe: -1
      }
    }
  },
  clamp: {
    inherit: true,
    accuracy: 75,
    pp: 10,
    volatileStatus: "partiallytrapped",
    self: {
      volatileStatus: "partialtrappinglock"
    },
    // FIXME: onBeforeMove(pokemon, target) {target.removeVolatile('mustrecharge')}
    onHit(target, source) {
      if (target.volatiles["partiallytrapped"]) {
        if (source.volatiles["partialtrappinglock"] && source.volatiles["partialtrappinglock"].duration > 1) {
          target.volatiles["partiallytrapped"].duration = 2;
        }
      }
    }
  },
  constrict: {
    inherit: true,
    secondary: {
      chance: 33,
      boosts: {
        spe: -1
      }
    }
  },
  conversion: {
    inherit: true,
    target: "normal",
    onHit(target, source) {
      source.setType(target.getTypes(true));
      this.add("-start", source, "typechange", source.types.join("/"), "[from] move: Conversion", "[of] " + target);
    }
  },
  counter: {
    inherit: true,
    ignoreImmunity: true,
    willCrit: false,
    basePower: 1,
    damageCallback(pokemon, target) {
      const lastMove = target.side.lastMove && this.dex.moves.get(target.side.lastMove.id);
      const lastMoveIsCounterable = lastMove && lastMove.basePower > 0 && ["Normal", "Fighting"].includes(lastMove.type) && lastMove.id !== "counter";
      const lastSelectedMove = target.side.lastSelectedMove && this.dex.moves.get(target.side.lastSelectedMove);
      const lastSelectedMoveIsCounterable = lastSelectedMove && lastSelectedMove.basePower > 0 && ["Normal", "Fighting"].includes(lastSelectedMove.type) && lastSelectedMove.id !== "counter";
      if (!lastMoveIsCounterable && !lastSelectedMoveIsCounterable) {
        this.debug("Gen 1 Counter: last move was not Counterable");
        this.add("-fail", pokemon);
        return false;
      }
      if (this.lastDamage <= 0) {
        this.debug("Gen 1 Counter: no previous damage exists");
        this.add("-fail", pokemon);
        return false;
      }
      if (!lastMoveIsCounterable || !lastSelectedMoveIsCounterable) {
        this.hint("Desync Clause Mod activated!");
        this.add("-fail", pokemon);
        return false;
      }
      return 2 * this.lastDamage;
    },
    flags: { contact: 1, protect: 1, metronome: 1 }
  },
  crabhammer: {
    inherit: true,
    critRatio: 2
  },
  dig: {
    inherit: true,
    basePower: 100,
    condition: {},
    onTryMove(attacker, defender, move) {
      if (attacker.removeVolatile("twoturnmove")) {
        attacker.removeVolatile("invulnerability");
        return;
      }
      this.add("-prepare", attacker, move.name);
      attacker.addVolatile("twoturnmove", defender);
      attacker.addVolatile("invulnerability", defender);
      return null;
    }
  },
  disable: {
    num: 50,
    accuracy: 55,
    basePower: 0,
    category: "Status",
    name: "Disable",
    pp: 20,
    priority: 0,
    flags: { protect: 1, mirror: 1, bypasssub: 1, metronome: 1 },
    volatileStatus: "disable",
    onTryHit(target) {
      return target.moveSlots.some((ms) => ms.pp > 0) && !("disable" in target.volatiles) && void 0;
    },
    condition: {
      onStart(pokemon) {
        const moveSlot = this.sample(pokemon.moveSlots.filter((ms) => ms.pp > 0));
        this.add("-start", pokemon, "Disable", moveSlot.move);
        this.effectState.move = moveSlot.id;
        this.effectState.time = this.random(1, 9);
      },
      onEnd(pokemon) {
        this.add("-end", pokemon, "Disable");
      },
      onBeforeMovePriority: 6,
      onBeforeMove(pokemon, target, move) {
        pokemon.volatiles["disable"].time--;
        if (!pokemon.volatiles["disable"].time) {
          pokemon.removeVolatile("disable");
          return;
        }
        if (pokemon.volatiles["bide"])
          move = this.dex.getActiveMove("bide");
        if (move.id === this.effectState.move) {
          this.add("cant", pokemon, "Disable", move);
          pokemon.removeVolatile("twoturnmove");
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
    },
    secondary: null,
    target: "normal",
    type: "Normal"
  },
  dizzypunch: {
    inherit: true,
    secondary: null
  },
  doubleedge: {
    inherit: true,
    basePower: 100
  },
  dragonrage: {
    inherit: true,
    basePower: 1
  },
  explosion: {
    inherit: true,
    basePower: 170,
    target: "normal"
  },
  fireblast: {
    inherit: true,
    secondary: {
      chance: 30,
      status: "brn"
    }
  },
  firespin: {
    inherit: true,
    accuracy: 70,
    basePower: 15,
    volatileStatus: "partiallytrapped",
    self: {
      volatileStatus: "partialtrappinglock"
    },
    // FIXME: onBeforeMove(pokemon, target) {target.removeVolatile('mustrecharge')}
    onHit(target, source) {
      if (target.volatiles["partiallytrapped"]) {
        if (source.volatiles["partialtrappinglock"] && source.volatiles["partialtrappinglock"].duration > 1) {
          target.volatiles["partiallytrapped"].duration = 2;
        }
      }
    }
  },
  fly: {
    inherit: true,
    condition: {},
    onTryMove(attacker, defender, move) {
      if (attacker.removeVolatile("twoturnmove")) {
        attacker.removeVolatile("invulnerability");
        return;
      }
      this.add("-prepare", attacker, move.name);
      attacker.addVolatile("twoturnmove", defender);
      attacker.addVolatile("invulnerability", defender);
      return null;
    }
  },
  focusenergy: {
    inherit: true,
    condition: {
      onStart(pokemon) {
        this.add("-start", pokemon, "move: Focus Energy");
      },
      // This does nothing as it's dealt with on critical hit calculation.
      onModifyMove() {
      }
    }
  },
  glare: {
    inherit: true,
    ignoreImmunity: true
  },
  growth: {
    inherit: true,
    boosts: {
      spa: 1,
      spd: 1
    }
  },
  gust: {
    inherit: true,
    type: "Normal"
  },
  haze: {
    inherit: true,
    onHit(target, source) {
      this.add("-activate", target, "move: Haze");
      this.add("-clearallboost", "[silent]");
      for (const pokemon of this.getAllActive()) {
        pokemon.clearBoosts();
        if (pokemon !== source) {
          pokemon.cureStatus(true);
        }
        if (pokemon.status === "tox") {
          pokemon.setStatus("psn", null, null, true);
        }
        pokemon.updateSpeed();
        const silentHack = "|[silent]";
        const silentHackVolatiles = ["disable", "confusion"];
        const hazeVolatiles = {
          "disable": "",
          "confusion": "",
          "mist": "Mist",
          "focusenergy": "move: Focus Energy",
          "leechseed": "move: Leech Seed",
          "lightscreen": "Light Screen",
          "reflect": "Reflect",
          "residualdmg": "Toxic counter"
        };
        for (const v in hazeVolatiles) {
          if (!pokemon.removeVolatile(v)) {
            continue;
          }
          if (silentHackVolatiles.includes(v)) {
            this.log[this.log.length - 1] += silentHack;
          } else {
            this.add("-end", pokemon, hazeVolatiles[v], "[silent]");
          }
        }
      }
    },
    target: "self"
  },
  highjumpkick: {
    inherit: true,
    onMoveFail(target, source, move) {
      this.directDamage(1, source, target);
    }
  },
  jumpkick: {
    inherit: true,
    onMoveFail(target, source, move) {
      this.directDamage(1, source, target);
    }
  },
  karatechop: {
    inherit: true,
    critRatio: 2,
    type: "Normal"
  },
  leechseed: {
    inherit: true,
    onHit() {
    },
    condition: {
      onStart(target) {
        this.add("-start", target, "move: Leech Seed");
      },
      onAfterMoveSelfPriority: 1,
      onAfterMoveSelf(pokemon) {
        const leecher = this.getAtSlot(pokemon.volatiles["leechseed"].sourceSlot);
        if (!leecher || leecher.fainted || leecher.hp <= 0) {
          this.debug("Nothing to leech into");
          return;
        }
        let toxicCounter = 1;
        const residualdmg = pokemon.volatiles["residualdmg"];
        if (residualdmg) {
          residualdmg.counter++;
          toxicCounter = residualdmg.counter;
        }
        const toLeech = this.clampIntRange(Math.floor(pokemon.baseMaxhp / 16), 1) * toxicCounter;
        const damage = this.damage(toLeech, pokemon, leecher);
        if (residualdmg)
          this.hint("In Gen 1, Leech Seed's damage is affected by Toxic's counter.", true);
        if (!damage || toLeech > damage) {
          this.hint("In Gen 1, Leech Seed recovery is not limited by the remaining HP of the seeded Pokemon.", true);
        }
        this.heal(toLeech, leecher, pokemon);
      }
    }
  },
  lightscreen: {
    num: 113,
    accuracy: true,
    basePower: 0,
    category: "Status",
    name: "Light Screen",
    pp: 30,
    priority: 0,
    flags: { metronome: 1 },
    volatileStatus: "lightscreen",
    onTryHit(pokemon) {
      if (pokemon.volatiles["lightscreen"]) {
        return false;
      }
    },
    condition: {
      onStart(pokemon) {
        this.add("-start", pokemon, "Light Screen");
      }
    },
    target: "self",
    type: "Psychic"
  },
  mimic: {
    inherit: true,
    flags: { protect: 1, bypasssub: 1, metronome: 1 },
    onHit(target, source) {
      const moveslot = source.moves.indexOf("mimic");
      if (moveslot < 0)
        return false;
      const moves = target.moves;
      const moveid = this.sample(moves);
      if (!moveid)
        return false;
      const move = this.dex.moves.get(moveid);
      source.moveSlots[moveslot] = {
        move: move.name,
        id: move.id,
        pp: source.moveSlots[moveslot].pp,
        maxpp: move.pp * 8 / 5,
        target: move.target,
        disabled: false,
        used: false,
        virtual: true
      };
      this.add("-start", source, "Mimic", move.name);
    }
  },
  mirrormove: {
    inherit: true,
    onHit(pokemon) {
      const foe = pokemon.side.foe.active[0];
      if (!foe?.lastMove || foe.lastMove.id === "mirrormove") {
        return false;
      }
      pokemon.side.lastSelectedMove = foe.lastMove.id;
      this.actions.useMove(foe.lastMove.id, pokemon);
    }
  },
  mist: {
    inherit: true,
    condition: {
      onStart(pokemon) {
        this.add("-start", pokemon, "Mist");
      },
      onTryBoost(boost, target, source, effect) {
        if (effect.effectType === "Move" && effect.category !== "Status")
          return;
        if (source && target !== source) {
          let showMsg = false;
          let i;
          for (i in boost) {
            if (boost[i] < 0) {
              delete boost[i];
              showMsg = true;
            }
          }
          if (showMsg && !effect.secondaries) {
            this.add("-activate", target, "move: Mist");
          }
        }
      }
    }
  },
  nightshade: {
    inherit: true,
    ignoreImmunity: true,
    basePower: 1
  },
  petaldance: {
    inherit: true,
    onMoveFail() {
    }
  },
  poisonsting: {
    inherit: true,
    secondary: {
      chance: 20,
      status: "psn"
    }
  },
  psychic: {
    inherit: true,
    secondary: {
      chance: 33,
      boosts: {
        spa: -1,
        spd: -1
      }
    }
  },
  psywave: {
    inherit: true,
    basePower: 1,
    damageCallback(pokemon) {
      const psywaveDamage = this.random(0, this.trunc(1.5 * pokemon.level));
      if (psywaveDamage <= 0) {
        this.hint("Desync Clause Mod activated!");
        return false;
      }
      return psywaveDamage;
    }
  },
  rage: {
    inherit: true,
    self: {
      volatileStatus: "rage"
    },
    condition: {
      // Rage lock
      onStart(target, source, effect) {
        this.effectState.move = "rage";
        this.effectState.accuracy = 255;
      },
      onLockMove: "rage",
      onHit(target, source, move) {
        if (target.boosts.atk < 6 && (move.category !== "Status" && !move.selfdestruct)) {
          this.boost({ atk: 1 });
        }
      }
    }
  },
  razorleaf: {
    inherit: true,
    critRatio: 2,
    target: "normal"
  },
  razorwind: {
    inherit: true,
    critRatio: 1,
    target: "normal",
    onTryMove(attacker, defender, move) {
      if (attacker.removeVolatile("twoturnmove")) {
        attacker.removeVolatile("invulnerability");
        return;
      }
      this.add("-prepare", attacker, move.name);
      attacker.addVolatile("twoturnmove", defender);
      return null;
    }
  },
  recover: {
    inherit: true,
    heal: null,
    onHit(target) {
      if (target.hp === target.maxhp)
        return false;
      if (target.hp === target.maxhp || (target.hp === target.maxhp - 255 || target.hp === target.maxhp - 511) && target.hp % 256 !== 0) {
        this.hint(
          "In Gen 1, recovery moves fail if (user's maximum HP - user's current HP + 1) is divisible by 256, unless the current hp is also divisible by 256."
        );
        return false;
      }
      this.heal(Math.floor(target.maxhp / 2), target, target);
    }
  },
  reflect: {
    num: 115,
    accuracy: true,
    basePower: 0,
    category: "Status",
    name: "Reflect",
    pp: 20,
    priority: 0,
    flags: { metronome: 1 },
    volatileStatus: "reflect",
    onTryHit(pokemon) {
      if (pokemon.volatiles["reflect"]) {
        return false;
      }
    },
    condition: {
      onStart(pokemon) {
        this.add("-start", pokemon, "Reflect");
      }
    },
    secondary: null,
    target: "self",
    type: "Psychic"
  },
  rest: {
    inherit: true,
    onTry() {
    },
    onHit(target, source, move) {
      if (target.hp === target.maxhp)
        return false;
      if (target.hp === target.maxhp || (target.hp === target.maxhp - 255 || target.hp === target.maxhp - 511) && target.hp % 256 !== 0) {
        this.hint(
          "In Gen 1, recovery moves fail if (user's maximum HP - user's current HP + 1) is divisible by 256, unless the current hp is also divisible by 256."
        );
        return false;
      }
      if (!target.setStatus("slp", source, move))
        return false;
      target.statusState.time = 2;
      target.statusState.startTime = 2;
      this.heal(target.maxhp);
    }
  },
  roar: {
    inherit: true,
    forceSwitch: false,
    onTryHit() {
    },
    priority: 0
  },
  rockslide: {
    inherit: true,
    secondary: null,
    target: "normal"
  },
  rockthrow: {
    inherit: true,
    accuracy: 65
  },
  sandattack: {
    inherit: true,
    ignoreImmunity: true,
    type: "Normal"
  },
  seismictoss: {
    inherit: true,
    ignoreImmunity: true,
    basePower: 1
  },
  selfdestruct: {
    inherit: true,
    basePower: 130,
    target: "normal"
  },
  skullbash: {
    inherit: true,
    onTryMove(attacker, defender, move) {
      if (attacker.removeVolatile("twoturnmove")) {
        attacker.removeVolatile("invulnerability");
        return;
      }
      this.add("-prepare", attacker, move.name);
      attacker.addVolatile("twoturnmove", defender);
      return null;
    }
  },
  skyattack: {
    inherit: true,
    onTryMove(attacker, defender, move) {
      if (attacker.removeVolatile("twoturnmove")) {
        attacker.removeVolatile("invulnerability");
        return;
      }
      this.add("-prepare", attacker, move.name);
      attacker.addVolatile("twoturnmove", defender);
      return null;
    }
  },
  slash: {
    inherit: true,
    critRatio: 2
  },
  sludge: {
    inherit: true,
    secondary: {
      chance: 40,
      status: "psn"
    }
  },
  solarbeam: {
    inherit: true,
    onTryMove(attacker, defender, move) {
      if (attacker.removeVolatile("twoturnmove")) {
        attacker.removeVolatile("invulnerability");
        return;
      }
      this.add("-prepare", attacker, move.name);
      attacker.addVolatile("twoturnmove", defender);
      return null;
    }
  },
  sonicboom: {
    inherit: true,
    ignoreImmunity: true,
    basePower: 1
  },
  softboiled: {
    inherit: true,
    heal: null,
    onHit(target) {
      if (target.hp === target.maxhp)
        return false;
      if (target.hp === target.maxhp || (target.hp === target.maxhp - 255 || target.hp === target.maxhp - 511) && target.hp % 256 !== 0) {
        this.hint(
          "In Gen 1, recovery moves fail if (user's maximum HP - user's current HP + 1) is divisible by 256, unless the current hp is also divisible by 256."
        );
        return false;
      }
      this.heal(Math.floor(target.maxhp / 2), target, target);
    }
  },
  struggle: {
    inherit: true,
    pp: 10,
    recoil: [1, 2],
    onModifyMove() {
    }
  },
  substitute: {
    num: 164,
    accuracy: true,
    basePower: 0,
    category: "Status",
    name: "Substitute",
    pp: 10,
    priority: 0,
    flags: { metronome: 1 },
    volatileStatus: "substitute",
    onTryHit(target) {
      if (target.volatiles["substitute"]) {
        this.add("-fail", target, "move: Substitute");
        return null;
      }
      if (target.hp < target.maxhp / 4) {
        this.add("-fail", target, "move: Substitute", "[weak]");
        return null;
      }
    },
    onHit(target) {
      if (target.maxhp > 3) {
        this.directDamage(target.maxhp / 4, target, target);
      }
    },
    condition: {
      onStart(target) {
        this.add("-start", target, "Substitute");
        this.effectState.hp = Math.floor(target.maxhp / 4) + 1;
        delete target.volatiles["partiallytrapped"];
      },
      onTryHitPriority: -1,
      onTryHit(target, source, move) {
        if (move.category === "Status") {
          const SubBlocked = ["lockon", "meanlook", "mindreader", "nightmare"];
          if (move.status === "psn" || move.status === "tox" || move.boosts && target !== source || move.volatileStatus === "confusion" || SubBlocked.includes(move.id)) {
            return false;
          }
          return;
        }
        if (move.volatileStatus && target === source)
          return;
        let uncappedDamage = move.hit > 1 ? this.lastDamage : this.actions.getDamage(source, target, move);
        if (move.id === "bide")
          uncappedDamage = source.volatiles["bide"].damage * 2;
        if (!uncappedDamage && uncappedDamage !== 0)
          return null;
        uncappedDamage = this.runEvent("SubDamage", target, source, move, uncappedDamage);
        if (!uncappedDamage && uncappedDamage !== 0)
          return uncappedDamage;
        this.lastDamage = uncappedDamage;
        target.volatiles["substitute"].hp -= uncappedDamage > target.volatiles["substitute"].hp ? target.volatiles["substitute"].hp : uncappedDamage;
        if (target.volatiles["substitute"].hp <= 0) {
          target.removeVolatile("substitute");
          target.subFainted = true;
        } else {
          this.add("-activate", target, "Substitute", "[damage]");
        }
        if (target.volatiles["substitute"]) {
          if (move.recoil) {
            this.damage(
              this.clampIntRange(Math.floor(uncappedDamage * move.recoil[0] / move.recoil[1]), 1),
              source,
              target,
              "recoil"
            );
          }
          if (move.drain) {
            const amount = this.clampIntRange(Math.floor(uncappedDamage * move.drain[0] / move.drain[1]), 1);
            this.lastDamage = amount;
            this.heal(amount, source, target, "drain");
          }
          if (move.secondary?.volatileStatus === "confusion") {
            const secondary = move.secondary;
            if (secondary.chance === void 0 || this.randomChance(Math.ceil(secondary.chance * 256 / 100) - 1, 256)) {
              target.addVolatile(move.secondary.volatileStatus, source, move);
              this.hint(
                "In Gen 1, moves that inflict confusion as a secondary effect can confuse targets with a Substitute, as long as the move does not break the Substitute."
              );
            }
          }
        }
        this.runEvent("AfterSubDamage", target, source, move, uncappedDamage);
        const lastAttackedBy = target.getLastAttackedBy();
        if (!lastAttackedBy) {
          target.attackedBy.push({ source, move: move.id, damage: uncappedDamage, slot: source.getSlot(), thisTurn: true });
        } else {
          lastAttackedBy.move = move.id;
          lastAttackedBy.damage = uncappedDamage;
        }
        return 0;
      },
      onEnd(target) {
        this.add("-end", target, "Substitute");
      }
    },
    secondary: null,
    target: "self",
    type: "Normal"
  },
  superfang: {
    inherit: true,
    ignoreImmunity: true,
    basePower: 1
  },
  thrash: {
    inherit: true,
    onMoveFail() {
    }
  },
  thunder: {
    inherit: true,
    secondary: {
      chance: 10,
      status: "par"
    }
  },
  triattack: {
    inherit: true,
    onHit() {
    },
    secondary: null
  },
  whirlwind: {
    inherit: true,
    accuracy: 85,
    forceSwitch: false,
    onTryHit() {
    },
    priority: 0
  },
  wingattack: {
    inherit: true,
    basePower: 35
  },
  wrap: {
    inherit: true,
    accuracy: 85,
    ignoreImmunity: true,
    volatileStatus: "partiallytrapped",
    self: {
      volatileStatus: "partialtrappinglock"
    },
    // FIXME: onBeforeMove(pokemon, target) {target.removeVolatile('mustrecharge')}
    onHit(target, source) {
      if (target.volatiles["partiallytrapped"]) {
        if (source.volatiles["partialtrappinglock"] && source.volatiles["partialtrappinglock"].duration > 1) {
          target.volatiles["partiallytrapped"].duration = 2;
        }
      }
    }
  }
};
//# sourceMappingURL=moves.js.map
