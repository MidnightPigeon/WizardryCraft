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
var ladders_remote_exports = {};
__export(ladders_remote_exports, {
  LadderStore: () => LadderStore
});
module.exports = __toCommonJS(ladders_remote_exports);
var import_lib = require("../lib");
/**
 * Main server ladder library
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * This file handles ladders for the main server on
 * play.pokemonshowdown.com.
 *
 * Ladders for all other servers is handled by ladders.ts.
 *
 * Matchmaking is currently still implemented in rooms.ts.
 *
 * @license MIT
 */
class LadderStore {
  constructor(formatid) {
    this.formatid = formatid;
  }
  /**
   * Returns [formatid, html], where html is an the HTML source of a
   * ladder toplist, to be displayed directly in the ladder tab of the
   * client.
   */
  // This requires to be `async` because it must conform with the `LadderStore` interface
  // eslint-disable-next-line @typescript-eslint/require-await
  async getTop(prefix) {
    return null;
  }
  /**
   * Returns a Promise for the Elo rating of a user
   */
  async getRating(userid) {
    const formatid = this.formatid;
    const user = Users.getExact(userid);
    if (user?.mmrCache[formatid]) {
      return user.mmrCache[formatid];
    }
    const [data] = await LoginServer.request("mmr", {
      format: formatid,
      user: userid
    });
    let mmr = NaN;
    if (data && !data.errorip) {
      mmr = Number(data);
    }
    if (isNaN(mmr))
      return 1e3;
    if (user && user.id === userid) {
      user.mmrCache[formatid] = mmr;
    }
    return mmr;
  }
  /**
   * Update the Elo rating for two players after a battle, and display
   * the results in the passed room.
   */
  async updateRating(p1name, p2name, p1score, room) {
    if (Ladders.disabled) {
      room.addRaw(`Ratings not updated. The ladders are currently disabled.`).update();
      return [p1score, null, null];
    }
    const formatid = this.formatid;
    const p1 = Users.getExact(p1name);
    const p2 = Users.getExact(p2name);
    const p1id = toID(p1name);
    const p2id = toID(p2name);
    const ladderUpdatePromise = LoginServer.request("ladderupdate", {
      p1: p1name,
      p2: p2name,
      score: p1score,
      format: formatid
    });
    const [p1OldElo, p2OldElo] = (await Promise.all([this.getRating(p1id), this.getRating(p2id)])).map(Math.round);
    const p1NewElo = Math.round(this.calculateElo(p1OldElo, p1score, p2OldElo));
    const p2NewElo = Math.round(this.calculateElo(p2OldElo, 1 - p1score, p1OldElo));
    const p1Act = p1score > 0.9 ? `winning` : p1score < 0.1 ? `losing` : `tying`;
    let p1Reasons = `${p1NewElo - p1OldElo} for ${p1Act}`;
    if (!p1Reasons.startsWith("-"))
      p1Reasons = "+" + p1Reasons;
    room.addRaw(import_lib.Utils.html`${p1name}'s rating: ${p1OldElo} &rarr; <strong>${p1NewElo}</strong><br />(${p1Reasons})`);
    const p2Act = p1score > 0.9 || p1score < 0 ? `losing` : p1score < 0.1 ? `winning` : `tying`;
    let p2Reasons = `${p2NewElo - p2OldElo} for ${p2Act}`;
    if (!p2Reasons.startsWith("-"))
      p2Reasons = "+" + p2Reasons;
    room.addRaw(import_lib.Utils.html`${p2name}'s rating: ${p2OldElo} &rarr; <strong>${p2NewElo}</strong><br />(${p2Reasons})`);
    room.rated = Math.min(p1NewElo, p2NewElo);
    if (p1)
      p1.mmrCache[formatid] = +p1NewElo;
    if (p2)
      p2.mmrCache[formatid] = +p2NewElo;
    room.update();
    const [data, error] = await ladderUpdatePromise;
    let problem = false;
    if (error) {
      if (error.message !== "stream interrupt") {
        room.add(`||Ladder isn't responding, score probably updated but might not have (${error.message}).`);
        problem = true;
      }
    } else if (!room.battle) {
      problem = true;
    } else if (!data) {
      room.add(`|error|Unexpected response ${data} from ladder server.`);
      room.update();
      problem = true;
    } else if (data.errorip) {
      room.add(`|error|This server's request IP ${data.errorip} is not a registered server.`);
      room.add(`|error|You should be using ladders.js and not ladders-remote.js for ladder tracking.`);
      room.update();
      problem = true;
    }
    if (problem) {
      return [p1score, null, null];
    }
    return [p1score, data?.p1rating, data?.p2rating];
  }
  /**
   * Returns a Promise for an array of strings of <tr>s for ladder ratings of the user
   */
  // This requires to be `async` because it must conform with the `LadderStore` interface
  // eslint-disable-next-line @typescript-eslint/require-await
  static async visualizeAll(username) {
    return [`<tr><td><strong>Please use the official client at play.pokemonshowdown.com</strong></td></tr>`];
  }
  /**
   * Calculates Elo based on a match result
   */
  calculateElo(oldElo, score, foeElo) {
    let K = 50;
    if (oldElo < 1100) {
      if (score < 0.5) {
        K = 20 + (oldElo - 1e3) * 30 / 100;
      } else if (score > 0.5) {
        K = 80 - (oldElo - 1e3) * 30 / 100;
      }
    } else if (oldElo > 1300) {
      K = 40;
    }
    const E = 1 / (1 + Math.pow(10, (foeElo - oldElo) / 400));
    const newElo = oldElo + K * (score - E);
    return Math.max(newElo, 1e3);
  }
}
LadderStore.formatsListPrefix = "";
//# sourceMappingURL=ladders-remote.js.map
