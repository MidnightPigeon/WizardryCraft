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
var generator_round_robin_exports = {};
__export(generator_round_robin_exports, {
  RoundRobin: () => RoundRobin
});
module.exports = __toCommonJS(generator_round_robin_exports);
var import_utils = require("../../lib/utils");
class RoundRobin {
  constructor(isDoubles) {
    this.name = "Round Robin";
    this.isDrawingSupported = true;
    this.isDoubles = !!isDoubles;
    this.isBracketFrozen = false;
    this.players = [];
    this.matches = [];
    this.totalPendingMatches = -1;
    this.perPlayerPendingMatches = -1;
    if (isDoubles)
      this.name = "Double " + this.name;
  }
  getPendingBracketData(players) {
    return {
      type: "table",
      tableHeaders: {
        cols: players.slice(0),
        rows: players.slice(0)
      },
      tableContents: players.map(
        (p1, row) => players.map((p2, col) => {
          if (!this.isDoubles && col >= row)
            return null;
          if (p1 === p2)
            return null;
          return {
            state: "unavailable"
          };
        })
      ),
      scores: players.map((player) => 0)
    };
  }
  getBracketData() {
    const players = this.players;
    return {
      type: "table",
      tableHeaders: {
        cols: players.slice(0),
        rows: players.slice(0)
      },
      tableContents: players.map(
        (p1, row) => players.map((p2, col) => {
          if (!this.isDoubles && col >= row)
            return null;
          if (p1 === p2)
            return null;
          const match = this.matches[row][col];
          if (!match)
            return null;
          const cell = {
            state: match.state
          };
          if (match.state === "finished" && match.score) {
            cell.result = match.result;
            cell.score = match.score.slice(0);
          }
          return cell;
        })
      ),
      scores: players.map((player) => player.score)
    };
  }
  freezeBracket(players) {
    this.players = players;
    this.isBracketFrozen = true;
    this.matches = players.map(
      (p1, row) => players.map((p2, col) => {
        if (!this.isDoubles && col >= row)
          return null;
        if (p1 === p2)
          return null;
        return { state: "available" };
      })
    );
    this.matchesPerPlayer = players.length - 1;
    this.totalPendingMatches = players.length * this.matchesPerPlayer / 2;
    if (this.isDoubles) {
      this.totalPendingMatches *= 2;
      this.matchesPerPlayer *= 2;
    }
  }
  disqualifyUser(user) {
    if (!this.isBracketFrozen)
      return "BracketNotFrozen";
    const playerIndex = this.players.indexOf(user);
    for (const [col, match] of this.matches[playerIndex].entries()) {
      if (!match || match.state !== "available")
        continue;
      const p2 = this.players[col];
      match.state = "finished";
      match.result = "loss";
      match.score = [0, 1];
      p2.score += 1;
      p2.games += 1;
      this.totalPendingMatches--;
    }
    for (const [row, challenges] of this.matches.entries()) {
      const match = challenges[playerIndex];
      if (!match || match.state !== "available")
        continue;
      const p1 = this.players[row];
      match.state = "finished";
      match.result = "win";
      match.score = [1, 0];
      p1.score += 1;
      p1.games += 1;
      this.totalPendingMatches--;
    }
    user.game.updatePlayer(user, null);
  }
  getAvailableMatches() {
    if (!this.isBracketFrozen)
      return "BracketNotFrozen";
    const matches = [];
    for (const [row, challenges] of this.matches.entries()) {
      const p1 = this.players[row];
      for (const [col, match] of challenges.entries()) {
        const p2 = this.players[col];
        if (!match)
          continue;
        if (match.state === "available" && !p1.isBusy && !p2.isBusy) {
          matches.push([p1, p2]);
        }
      }
    }
    return matches;
  }
  setMatchResult([p1, p2], result, score) {
    if (!this.isBracketFrozen)
      return "BracketNotFrozen";
    if (!["win", "loss", "draw"].includes(result))
      return "InvalidMatchResult";
    const row = this.players.indexOf(p1);
    const col = this.players.indexOf(p2);
    if (row < 0 || col < 0)
      return "UserNotAdded";
    const match = this.matches[row][col];
    if (!match || match.state !== "available")
      return "InvalidMatch";
    match.state = "finished";
    match.result = result;
    match.score = score.slice(0);
    this.totalPendingMatches--;
    if (this.matchesPerPlayer) {
      if (p1.games === this.matchesPerPlayer) {
        p1.sendRoom(`|tournament|update|{"isJoined":false}`);
        p1.game.updatePlayer(p1, null);
      }
      if (p2.games === this.matchesPerPlayer) {
        p2.sendRoom(`|tournament|update|{"isJoined":false}`);
        p2.game.updatePlayer(p2, null);
      }
    }
  }
  isTournamentEnded() {
    return this.isBracketFrozen && this.totalPendingMatches === 0;
  }
  getResults() {
    if (!this.isTournamentEnded())
      return "TournamentNotEnded";
    const sortedScores = import_utils.Utils.sortBy([...this.players], (p) => -p.score);
    const results = [];
    let currentScore = sortedScores[0].score;
    let currentRank = [];
    results.push(currentRank);
    for (const player of sortedScores) {
      if (player.score < currentScore) {
        currentScore = player.score;
        currentRank = [];
        results.push(currentRank);
      }
      currentRank.push(player);
    }
    return results;
  }
}
//# sourceMappingURL=generator-round-robin.js.map
