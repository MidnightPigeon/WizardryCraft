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
var ladders_challenges_exports = {};
__export(ladders_challenges_exports, {
  AbstractChallenge: () => AbstractChallenge,
  BattleChallenge: () => BattleChallenge,
  BattleInvite: () => BattleInvite,
  BattleReady: () => BattleReady,
  Challenges: () => Challenges,
  GameChallenge: () => GameChallenge,
  challenges: () => challenges
});
module.exports = __toCommonJS(ladders_challenges_exports);
class BattleReady {
  constructor(userid, formatid, settings, rating = 0, challengeType = "challenge") {
    this.userid = userid;
    this.formatid = formatid;
    this.settings = settings;
    this.rating = rating;
    this.challengeType = challengeType;
    this.time = Date.now();
  }
}
class AbstractChallenge {
  constructor(from, to, ready, options = {}) {
    this.from = from;
    this.to = to;
    this.ready = typeof ready === "string" ? null : ready;
    this.format = typeof ready === "string" ? ready : ready.formatid;
    this.acceptCommand = options.acceptCommand || null;
    this.message = options.message || "";
    this.roomid = options.roomid || "";
    this.acceptButton = options.acceptButton || "";
    this.rejectButton = options.rejectButton || "";
  }
  destroy(accepted) {
  }
}
class BattleChallenge extends AbstractChallenge {
}
class GameChallenge extends AbstractChallenge {
}
class BattleInvite extends AbstractChallenge {
  destroy(accepted) {
    if (accepted)
      return;
    const room = Rooms.get(this.roomid);
    if (!room)
      return;
    const battle = room.battle;
    let invitesFull = true;
    for (const player of battle.players) {
      if (!player.invite && !player.id)
        invitesFull = false;
      if (player.invite === this.to)
        player.invite = "";
    }
    if (invitesFull)
      battle.sendInviteForm(true);
  }
}
class Challenges extends Map {
  getOrCreate(userid) {
    let challenges2 = this.get(userid);
    if (challenges2)
      return challenges2;
    challenges2 = [];
    this.set(userid, challenges2);
    return challenges2;
  }
  /** Throws Chat.ErrorMessage if a challenge between these users is already in the table */
  add(challenge) {
    const oldChallenge = this.search(challenge.to, challenge.from);
    if (oldChallenge) {
      throw new Chat.ErrorMessage(`There is already a challenge (${challenge.format}) between ${challenge.to} and ${challenge.from}!`);
    }
    const to = this.getOrCreate(challenge.to);
    const from = this.getOrCreate(challenge.from);
    to.push(challenge);
    from.push(challenge);
    this.update(challenge.to, challenge.from);
    return true;
  }
  /** Returns false if the challenge isn't in the table */
  remove(challenge, accepted) {
    const to = this.getOrCreate(challenge.to);
    const from = this.getOrCreate(challenge.from);
    const toIndex = to.indexOf(challenge);
    let success = false;
    if (toIndex >= 0) {
      to.splice(toIndex, 1);
      if (!to.length)
        this.delete(challenge.to);
      success = true;
    }
    const fromIndex = from.indexOf(challenge);
    if (fromIndex >= 0) {
      from.splice(fromIndex, 1);
      if (!from.length)
        this.delete(challenge.from);
    }
    if (success) {
      this.update(challenge.to, challenge.from);
      challenge.destroy(accepted);
    }
    return success;
  }
  search(userid1, userid2) {
    const challenges2 = this.get(userid1);
    if (!challenges2)
      return null;
    for (const challenge of challenges2) {
      if (challenge.to === userid1 && challenge.from === userid2 || challenge.to === userid2 && challenge.from === userid1) {
        return challenge;
      }
    }
    return null;
  }
  searchByRoom(userid, roomid) {
    const challenges2 = this.get(userid);
    if (!challenges2)
      return null;
    for (const challenge of challenges2) {
      if (challenge.roomid === roomid)
        return challenge;
    }
    return null;
  }
  /**
   * Try to accept a custom challenge, throwing `Chat.ErrorMessage` on failure,
   * and returning the user the challenge was from on a success.
   */
  resolveAcceptCommand(context) {
    const targetid = context.target;
    const chall = this.search(context.user.id, targetid);
    if (!chall || chall.to !== context.user.id || chall.acceptCommand !== context.message) {
      throw new Chat.ErrorMessage(`Challenge not found. You are using the wrong command. Challenges should be accepted with /accept`);
    }
    return chall;
  }
  accept(context) {
    const chall = this.resolveAcceptCommand(context);
    this.remove(chall, true);
    const fromUser = Users.get(chall.from);
    if (!fromUser)
      throw new Chat.ErrorMessage(`User "${chall.from}" is not available right now.`);
    return fromUser;
  }
  clearFor(userid, reason) {
    const user = Users.get(userid);
    const userIdentity = user ? user.getIdentity() : ` ${userid}`;
    const challenges2 = this.get(userid);
    if (!challenges2)
      return 0;
    for (const challenge of challenges2) {
      const otherid = challenge.to === userid ? challenge.from : challenge.to;
      const otherUser = Users.get(otherid);
      const otherIdentity = otherUser ? otherUser.getIdentity() : ` ${otherid}`;
      const otherChallenges = this.get(otherid);
      const otherIndex = otherChallenges.indexOf(challenge);
      if (otherIndex >= 0)
        otherChallenges.splice(otherIndex, 1);
      if (otherChallenges.length === 0)
        this.delete(otherid);
      if (!user && !otherUser)
        continue;
      const header = `|pm|${userIdentity}|${otherIdentity}|`;
      let message = `${header}/challenge`;
      if (reason)
        message = `${header}/text Challenge cancelled because ${reason}.
${message}`;
      user?.send(message);
      otherUser?.send(message);
    }
    this.delete(userid);
    return challenges2.length;
  }
  getUpdate(challenge) {
    if (!challenge)
      return `/challenge`;
    const teambuilderFormat = challenge.ready ? challenge.ready.formatid : "";
    return `/challenge ${challenge.format}|${teambuilderFormat}|${challenge.message}|${challenge.acceptButton}|${challenge.rejectButton}`;
  }
  update(userid1, userid2) {
    const challenge = this.search(userid1, userid2);
    userid1 = challenge ? challenge.from : userid1;
    userid2 = challenge ? challenge.to : userid2;
    this.send(userid1, userid2, this.getUpdate(challenge));
  }
  send(userid1, userid2, message) {
    const user1 = Users.get(userid1);
    const user2 = Users.get(userid2);
    const user1Identity = user1 ? user1.getIdentity() : ` ${userid1}`;
    const user2Identity = user2 ? user2.getIdentity() : ` ${userid2}`;
    const fullMessage = `|pm|${user1Identity}|${user2Identity}|${message}`;
    user1?.send(fullMessage);
    user2?.send(fullMessage);
  }
  updateFor(connection) {
    const user = connection.user;
    const challenges2 = this.get(user.id);
    if (!challenges2)
      return;
    const userIdentity = user.getIdentity();
    let messages = "";
    for (const challenge of challenges2) {
      let fromIdentity, toIdentity;
      if (challenge.from === user.id) {
        fromIdentity = userIdentity;
        const toUser = Users.get(challenge.to);
        toIdentity = toUser ? toUser.getIdentity() : ` ${challenge.to}`;
      } else {
        const fromUser = Users.get(challenge.from);
        fromIdentity = fromUser ? fromUser.getIdentity() : ` ${challenge.from}`;
        toIdentity = userIdentity;
      }
      messages += `|pm|${fromIdentity}|${toIdentity}|${this.getUpdate(challenge)}
`;
    }
    connection.send(messages);
  }
}
const challenges = new Challenges();
//# sourceMappingURL=ladders-challenges.js.map
