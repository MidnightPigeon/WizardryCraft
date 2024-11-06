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
var wifi_exports = {};
__export(wifi_exports, {
  GTS: () => GTS,
  LotteryGiveaway: () => LotteryGiveaway,
  QuestionGiveaway: () => QuestionGiveaway,
  commands: () => commands,
  handlers: () => handlers,
  pages: () => pages,
  wifiData: () => wifiData
});
module.exports = __toCommonJS(wifi_exports);
var import_lib = require("../../lib");
Punishments.addRoomPunishmentType({
  type: "GIVEAWAYBAN",
  desc: "banned from giveaways"
});
const BAN_DURATION = 7 * 24 * 60 * 60 * 1e3;
const RECENT_THRESHOLD = 30 * 24 * 60 * 60 * 1e3;
const DATA_FILE = "config/chat-plugins/wifi.json";
const defaults = {
  whitelist: [],
  stats: {},
  storedGiveaways: {
    question: [],
    lottery: []
  },
  submittedGiveaways: {
    question: [],
    lottery: []
  }
};
let wifiData = (() => {
  try {
    return JSON.parse((0, import_lib.FS)(DATA_FILE).readSync());
  } catch (e) {
    if (e.code !== "ENOENT")
      throw e;
    return defaults;
  }
})();
function saveData() {
  (0, import_lib.FS)(DATA_FILE).writeUpdate(() => JSON.stringify(wifiData));
}
if (!wifiData.stats && !wifiData.storedGiveaways && !wifiData.submittedGiveaways) {
  const stats = { ...wifiData };
  wifiData = { ...defaults, stats };
  saveData();
}
if (!wifiData.whitelist)
  wifiData.whitelist = [];
const statNames = ["HP", "Atk", "Def", "SpA", "SpD", "Spe"];
const gameName = {
  SwSh: "Sword/Shield",
  BDSP: "Brilliant Diamond/Shining Pearl",
  SV: "Scarlet/Violet"
};
const gameidToGame = {
  swsh: "SwSh",
  bdsp: "BDSP",
  sv: "SV"
};
class Giveaway extends Rooms.SimpleRoomGame {
  constructor(host, giver, room, ot, tid, ivs, prize, game = "SV", ball, extraInfo) {
    super(room);
    this.gameid = "giveaway";
    this.gaNumber = room.nextGameNumber();
    this.host = host;
    this.giver = giver;
    this.room = room;
    this.ot = ot;
    this.tid = tid;
    this.ball = ball;
    this.extraInfo = extraInfo;
    this.game = game;
    this.ivs = ivs;
    this.prize = prize;
    this.phase = "pending";
    this.joined = /* @__PURE__ */ new Map();
    this.timer = null;
    [this.pokemonID, this.sprite] = Giveaway.getSprite(prize);
  }
  destroy() {
    this.clearTimer();
    super.destroy();
  }
  generateReminder() {
    return "";
  }
  getStyle() {
    const css = { class: "broadcast-blue" };
    if (this.game === "BDSP")
      css.style = { background: "#aa66a9", color: "#fff" };
    if (this.game === "SV")
      css.style = { background: "#CD5C5C", color: "#fff" };
    return css;
  }
  sendToUser(user, content) {
    user.sendTo(
      this.room,
      Chat.html`|uhtmlchange|giveaway${this.gaNumber}${this.phase}|${/* @__PURE__ */ Chat.h("div", { ...this.getStyle() }, content)}`
    );
  }
  send(content, isStart = false) {
    this.room.add(Chat.html`|uhtml|giveaway${this.gaNumber}${this.phase}|${/* @__PURE__ */ Chat.h("div", { ...this.getStyle() }, content)}`);
    if (isStart)
      this.room.add(`|c:|${Math.floor(Date.now() / 1e3)}|&|It's ${this.game} giveaway time!`);
    this.room.update();
  }
  changeUhtml(content) {
    this.room.uhtmlchange(`giveaway${this.gaNumber}${this.phase}`, Chat.html`${/* @__PURE__ */ Chat.h("div", { ...this.getStyle() }, content)}`);
    this.room.update();
  }
  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
  checkJoined(user) {
    for (const [ip, id] of this.joined) {
      if (user.latestIp === ip && !Config.noipchecks)
        return ip;
      if (user.previousIDs.includes(id))
        return id;
    }
    return false;
  }
  kickUser(user) {
    for (const [ip, id] of this.joined) {
      if (user.latestIp === ip && !Config.noipchecks || user.previousIDs.includes(id)) {
        this.sendToUser(user, this.generateReminder());
        this.joined.delete(ip);
      }
    }
  }
  checkExcluded(user) {
    return user === this.giver || !Config.noipchecks && this.giver.ips.includes(user.latestIp) || this.giver.previousIDs.includes(toID(user));
  }
  static checkCanCreate(context, targetUser, type) {
    const user = context.user;
    const isCreate = type === "create";
    const isForSelf = targetUser.id === user.id;
    if (wifiData.whitelist.includes(user.id) && isCreate && isForSelf) {
      return true;
    }
    if (isCreate && !(isForSelf && user.can("show", null, context.room))) {
      context.checkCan("warn", null, context.room);
    }
    if (!user.can("warn", null, context.room) && !isCreate && !isForSelf) {
      throw new Chat.ErrorMessage(`You can't ${type} giveways for other users.`);
    }
  }
  static checkBanned(room, user) {
    return Punishments.hasRoomPunishType(room, toID(user), "GIVEAWAYBAN");
  }
  static ban(room, user, reason) {
    Punishments.roomPunish(room, user, {
      type: "GIVEAWAYBAN",
      id: toID(user),
      expireTime: Date.now() + BAN_DURATION,
      reason
    });
  }
  static unban(room, user) {
    Punishments.roomUnpunish(room, user.id, "GIVEAWAYBAN", false);
  }
  static getSprite(set) {
    const species = Dex.species.get(set.species);
    let spriteid = species.spriteid;
    if (species.cosmeticFormes) {
      for (const forme of species.cosmeticFormes.map(toID)) {
        if (toID(set.species).includes(forme)) {
          spriteid += "-" + forme.slice(species.baseSpecies.length);
          break;
        }
      }
    }
    if (!spriteid.includes("-") && species.forme) {
      spriteid += "-" + toID(species.forme);
    }
    const shiny = set.shiny ? "-shiny" : "";
    const validFemale = [
      "abomasnow",
      "aipom",
      "ambipom",
      "beautifly",
      "bibarel",
      "bidoof",
      "blaziken",
      "buizel",
      "cacturne",
      "camerupt",
      "combee",
      "combusken",
      "croagunk",
      "donphan",
      "dustox",
      "finneon",
      "floatzel",
      "frillish",
      "gabite",
      "garchomp",
      "gible",
      "girafarig",
      "gligar",
      "golbat",
      "gulpin",
      "heracross",
      "hippopotas",
      "hippowdon",
      "houndoom",
      "indeedee",
      "jellicent",
      "kerfluffle",
      "kitsunoh",
      "kricketot",
      "kricketune",
      "ledian",
      "ledyba",
      "ludicolo",
      "lumineon",
      "luxio",
      "luxray",
      "magikarp",
      "mamoswine",
      "medicham",
      "meditite",
      "meganium",
      "meowstic",
      "milotic",
      "murkrow",
      "nidoran",
      "numel",
      "nuzleaf",
      "octillery",
      "pachirisu",
      "pikachu",
      "pikachu-starter",
      "piloswine",
      "politoed",
      "protowatt",
      "pyroar",
      "quagsire",
      "raticate",
      "rattata",
      "relicanth",
      "rhydon",
      "rhyperior",
      "roselia",
      "roserade",
      "rotom",
      "scizor",
      "scyther",
      "shiftry",
      "shinx",
      "sneasel",
      "snover",
      "staraptor",
      "staravia",
      "starly",
      "steelix",
      "sudowoodo",
      "swalot",
      "tangrowth",
      "torchic",
      "toxicroak",
      "unfezant",
      "unown",
      "ursaring",
      "voodoom",
      "weavile",
      "wobbuffet",
      "wooper",
      "xatu",
      "zubat"
    ];
    if (set.gender === "F" && validFemale.includes(species.id))
      spriteid += "-f";
    return [
      species.id,
      /* @__PURE__ */ Chat.h("img", { src: `/sprites/ani${shiny}/${spriteid}.gif` })
    ];
  }
  static updateStats(pokemonIDs) {
    for (const mon of pokemonIDs) {
      if (!wifiData.stats[mon])
        wifiData.stats[mon] = [];
      wifiData.stats[mon].push(Date.now());
    }
    saveData();
  }
  // Wi-Fi uses special IV syntax to show hyper trained IVs
  static convertIVs(setObj, ivs) {
    let set = Teams.exportSet(setObj);
    let ivsStr = "";
    if (ivs.length) {
      const convertedIVs = { hp: "31", atk: "31", def: "31", spa: "31", spd: "31", spe: "31" };
      for (const [i, iv] of ivs.entries()) {
        const numStr = iv.trim().split(" ")[0];
        const statName = statNames[i];
        convertedIVs[toID(statName)] = numStr;
      }
      const array = Object.keys(convertedIVs).map((x, i) => `${convertedIVs[x]} ${statNames[i]}`);
      ivsStr = `IVs: ${array.join(" / ")}  `;
    }
    if (ivsStr) {
      if (/\nivs:/i.test(set)) {
        const arr = set.split("\n");
        const index = arr.findIndex((x) => /^ivs:/i.test(x));
        arr[index] = ivsStr;
        set = arr.join("\n");
      } else if (/nature\n/i.test(set)) {
        const arr = set.split("\n");
        const index = arr.findIndex((x) => /nature$/i.test(x));
        arr.splice(index + 1, 0, ivsStr);
        set = arr.join("\n");
      } else {
        set += `
${ivsStr}`;
      }
    }
    return set;
  }
  generateWindow(rightSide) {
    const set = Giveaway.convertIVs(this.prize, this.ivs);
    return /* @__PURE__ */ Chat.h("center", null, /* @__PURE__ */ Chat.h("h3", null, "It's ", this.game, " giveaway time!"), /* @__PURE__ */ Chat.h("small", null, "Giveaway started by ", this.host.name), /* @__PURE__ */ Chat.h("table", { style: { marginLeft: "auto", marginRight: "auto" } }, /* @__PURE__ */ Chat.h("tr", null, /* @__PURE__ */ Chat.h("td", { colSpan: 2, style: { textAlign: "center" } }, /* @__PURE__ */ Chat.h("strong", null, "Giver:"), " ", this.giver.name, /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("strong", null, "OT:"), " ", this.ot, ", ", /* @__PURE__ */ Chat.h("strong", null, "TID:"), " ", this.tid)), /* @__PURE__ */ Chat.h("tr", null, /* @__PURE__ */ Chat.h("td", { style: { textAlign: "center", width: "45%" } }, /* @__PURE__ */ Chat.h("psicon", { item: this.ball }), " ", this.sprite, " ", /* @__PURE__ */ Chat.h("psicon", { item: this.ball }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h(Chat.JSX.FormatText, { isTrusted: true }, set)), /* @__PURE__ */ Chat.h("td", { style: { textAlign: "center", width: "45%" } }, rightSide)), !!this.extraInfo?.trim().length && /* @__PURE__ */ Chat.h("tr", null, /* @__PURE__ */ Chat.h("td", { colSpan: 2, style: { textAlign: "center" } }, /* @__PURE__ */ Chat.h("strong", null, "Extra Information"), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h(Chat.JSX.FormatText, { isTrusted: true }, this.extraInfo.trim().replace(/<br \/>/g, "\n"))))), /* @__PURE__ */ Chat.h("p", { style: { textAlign: "center", fontSize: "7pt", fontWeight: "bold" } }, /* @__PURE__ */ Chat.h("u", null, "Note:"), " You must have a Switch, Pok\xE9mon ", gameName[this.game], ", ", "and NSO to receive the prize. ", "Do not join if you are currently unable to trade. Do not enter if you have already won this exact Pok\xE9mon, ", "unless it is explicitly allowed."));
  }
}
class QuestionGiveaway extends Giveaway {
  constructor(host, giver, room, ot, tid, game, ivs, prize, question, answers, ball, extraInfo) {
    super(host, giver, room, ot, tid, ivs, prize, game, ball, extraInfo);
    this.type = "question";
    this.phase = "pending";
    this.question = question;
    this.answers = QuestionGiveaway.sanitizeAnswers(answers);
    this.answered = new import_lib.Utils.Multiset();
    this.winner = null;
    this.send(this.generateWindow("The question will be displayed in one minute! Use /guess to answer."), true);
    this.timer = setTimeout(() => this.start(), 1e3 * 60);
  }
  static splitTarget(target, sep = "|", context, user, type) {
    let [
      giver,
      ot,
      tid,
      game,
      question,
      answers,
      ivs,
      ball,
      extraInfo,
      ...prize
    ] = target.split(sep).map((param) => param.trim());
    if (!(giver && ot && tid && prize?.length && question && answers?.split(",").length)) {
      context.parse(`/help giveaway`);
      throw new Chat.Interruption();
    }
    const targetUser = Users.get(giver);
    if (!targetUser?.connected)
      throw new Chat.ErrorMessage(`User '${giver}' is not online.`);
    Giveaway.checkCanCreate(context, targetUser, type);
    if (!!ivs && ivs.split("/").length !== 6) {
      throw new Chat.ErrorMessage(`If you provide IVs, they must be provided for all stats.`);
    }
    if (!game)
      game = "SV";
    game = gameidToGame[toID(game)] || game;
    if (!game || !["SV", "BDSP", "SwSh"].includes(game)) {
      throw new Chat.ErrorMessage(`The game must be "SV," "BDSP," or "SwSh".`);
    }
    if (!ball)
      ball = "pokeball";
    if (!toID(ball).endsWith("ball"))
      ball = toID(ball) + "ball";
    if (!Dex.items.get(ball).isPokeball) {
      throw new Chat.ErrorMessage(`${Dex.items.get(ball).name} is not a Pok\xE9 Ball.`);
    }
    tid = toID(tid);
    if (isNaN(parseInt(tid)) || tid.length < 5 || tid.length > 6)
      throw new Chat.ErrorMessage("Invalid TID");
    if (!targetUser.autoconfirmed) {
      throw new Chat.ErrorMessage(`User '${targetUser.name}' needs to be autoconfirmed to give something away.`);
    }
    if (Giveaway.checkBanned(context.room, targetUser)) {
      throw new Chat.ErrorMessage(`User '${targetUser.name}' is giveaway banned.`);
    }
    return {
      targetUser,
      ot,
      tid,
      game,
      question,
      answers: answers.split(","),
      ivs: ivs.split("/"),
      ball,
      extraInfo,
      prize: prize.join("|")
    };
  }
  generateQuestion() {
    return this.generateWindow(/* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("p", { style: { textAlign: "center", fontSize: "13pt" } }, "Giveaway Question: ", /* @__PURE__ */ Chat.h("b", null, this.question)), /* @__PURE__ */ Chat.h("p", { style: { textAlign: "center" } }, "use /guess to answer.")));
  }
  start() {
    this.changeUhtml(/* @__PURE__ */ Chat.h("p", { style: { textAlign: "center", fontSize: "13pt", fontWeight: "bold" } }, "The giveaway has started! Scroll down to see the question."));
    this.phase = "started";
    this.send(this.generateQuestion());
    this.timer = setTimeout(() => this.end(false), 1e3 * 60 * 5);
  }
  choose(user, guess) {
    if (this.phase !== "started")
      return user.sendTo(this.room, "The giveaway has not started yet.");
    if (this.checkJoined(user) && ![...this.joined.values()].includes(user.id)) {
      return user.sendTo(this.room, "You have already joined the giveaway.");
    }
    if (Giveaway.checkBanned(this.room, user))
      return user.sendTo(this.room, "You are banned from entering giveaways.");
    if (this.checkExcluded(user))
      return user.sendTo(this.room, "You are disallowed from entering the giveaway.");
    if ((this.answered.get(user.id) ?? 0) >= 3) {
      return user.sendTo(
        this.room,
        "You have already guessed three times. You cannot guess anymore in this.giveaway."
      );
    }
    const sanitized = toID(guess);
    for (const answer of this.answers.map(toID)) {
      if (answer === sanitized) {
        this.winner = user;
        this.clearTimer();
        return this.end(false);
      }
    }
    this.joined.set(user.latestIp, user.id);
    this.answered.add(user.id);
    if ((this.answered.get(user.id) ?? 0) >= 3) {
      user.sendTo(
        this.room,
        `Your guess '${guess}' is wrong. You have used up all of your guesses. Better luck next time!`
      );
    } else {
      user.sendTo(this.room, `Your guess '${guess}' is wrong. Try again!`);
    }
  }
  change(value, user, answer = false) {
    if (user.id !== this.host.id)
      return user.sendTo(this.room, "Only the host can edit the giveaway.");
    if (this.phase !== "pending") {
      return user.sendTo(this.room, "You cannot change the question or answer once the giveaway has started.");
    }
    if (!answer) {
      this.question = value;
      return user.sendTo(this.room, `The question has been changed to ${value}.`);
    }
    const ans = QuestionGiveaway.sanitizeAnswers(value.split(",").map((val) => val.trim()));
    if (!ans.length) {
      return user.sendTo(this.room, "You must specify at least one answer and it must not contain any special characters.");
    }
    this.answers = ans;
    user.sendTo(this.room, `The answer${Chat.plural(ans, "s have", "has")} been changed to ${ans.join(", ")}.`);
  }
  end(force) {
    const style = { textAlign: "center", fontSize: "13pt", fontWeight: "bold" };
    if (force) {
      this.clearTimer();
      this.changeUhtml(/* @__PURE__ */ Chat.h("p", { style }, "The giveaway was forcibly ended."));
      this.room.send("The giveaway was forcibly ended.");
    } else {
      if (!this.winner) {
        this.changeUhtml(/* @__PURE__ */ Chat.h("p", { style }, "The giveaway was forcibly ended."));
        this.room.send("The giveaway has been forcibly ended as no one has answered the question.");
      } else {
        this.changeUhtml(/* @__PURE__ */ Chat.h("p", { style }, "The giveaway has ended! Scroll down to see the answer."));
        this.phase = "ended";
        this.clearTimer();
        this.room.modlog({
          action: "GIVEAWAY WIN",
          userid: this.winner.id,
          note: `${this.giver.name}'s giveaway for a "${this.prize.species}" (OT: ${this.ot} TID: ${this.tid} Nature: ${this.prize.nature} Ball: ${this.ball}${this.extraInfo ? ` Other box info: ${this.extraInfo}` : ""})`
        });
        this.send(this.generateWindow(/* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("p", { style: { textAlign: "center", fontSize: "12pt" } }, /* @__PURE__ */ Chat.h("b", null, this.winner.name), " won the giveaway! Congratulations!"), /* @__PURE__ */ Chat.h("p", { style: { textAlign: "center" } }, this.question, /* @__PURE__ */ Chat.h("br", null), "Correct answer", Chat.plural(this.answers), ": ", this.answers.join(", ")))));
        this.winner.sendTo(
          this.room,
          `|raw|You have won the giveaway. PM <b>${import_lib.Utils.escapeHTML(this.giver.name)}</b> to claim your prize!`
        );
        if (this.winner.connected) {
          this.winner.popup(`You have won the giveaway. PM **${this.giver.name}** to claim your prize!`);
        }
        if (this.giver.connected)
          this.giver.popup(`${this.winner.name} has won your question giveaway!`);
        Giveaway.updateStats(/* @__PURE__ */ new Set([this.pokemonID]));
      }
    }
    this.destroy();
  }
  static sanitize(str) {
    return str.toLowerCase().replace(/[^a-z0-9 .-]+/ig, "").trim();
  }
  static sanitizeAnswers(answers) {
    return answers.map(
      (val) => QuestionGiveaway.sanitize(val)
    ).filter(
      (val, index, array) => toID(val).length && array.indexOf(val) === index
    );
  }
  checkExcluded(user) {
    if (user === this.host)
      return true;
    if (this.host.ips.includes(user.latestIp) && !Config.noipchecks)
      return true;
    if (this.host.previousIDs.includes(toID(user)))
      return true;
    return super.checkExcluded(user);
  }
}
class LotteryGiveaway extends Giveaway {
  constructor(host, giver, room, ot, tid, ivs, game, prize, winners, ball, extraInfo) {
    super(host, giver, room, ot, tid, ivs, prize, game, ball, extraInfo);
    this.type = "lottery";
    this.phase = "pending";
    this.winners = [];
    this.maxWinners = winners || 1;
    this.send(this.generateReminder(false), true);
    this.timer = setTimeout(() => this.drawLottery(), 1e3 * 60 * 2);
  }
  static splitTarget(target, sep = "|", context, user, type) {
    let [giver, ot, tid, game, winners, ivs, ball, extraInfo, ...prize] = target.split(sep).map((param) => param.trim());
    if (!(giver && ot && tid && prize?.length)) {
      context.parse(`/help giveaway`);
      throw new Chat.Interruption();
    }
    const targetUser = Users.get(giver);
    if (!targetUser?.connected)
      throw new Chat.ErrorMessage(`User '${giver}' is not online.`);
    Giveaway.checkCanCreate(context, user, type);
    if (!!ivs && ivs.split("/").length !== 6) {
      throw new Chat.ErrorMessage(`If you provide IVs, they must be provided for all stats.`);
    }
    if (!game)
      game = "SV";
    game = gameidToGame[toID(game)] || game;
    if (!game || !["SV", "BDSP", "SwSh"].includes(game)) {
      throw new Chat.ErrorMessage(`The game must be "SV," "BDSP," or "SwSh".`);
    }
    if (!ball)
      ball = "pokeball";
    if (!toID(ball).endsWith("ball"))
      ball = toID(ball) + "ball";
    if (!Dex.items.get(ball).isPokeball) {
      throw new Chat.ErrorMessage(`${Dex.items.get(ball).name} is not a Pok\xE9 Ball.`);
    }
    tid = toID(tid);
    if (isNaN(parseInt(tid)) || tid.length < 5 || tid.length > 6)
      throw new Chat.ErrorMessage("Invalid TID");
    if (!targetUser.autoconfirmed) {
      throw new Chat.ErrorMessage(`User '${targetUser.name}' needs to be autoconfirmed to give something away.`);
    }
    if (Giveaway.checkBanned(context.room, targetUser)) {
      throw new Chat.ErrorMessage(`User '${targetUser.name}' is giveaway banned.`);
    }
    let numWinners = 1;
    if (winners) {
      numWinners = parseInt(winners);
      if (isNaN(numWinners) || numWinners < 1 || numWinners > 5) {
        throw new Chat.ErrorMessage("The lottery giveaway can have a minimum of 1 and a maximum of 5 winners.");
      }
    }
    return {
      targetUser,
      ot,
      tid,
      game,
      winners: numWinners,
      ivs: ivs.split("/"),
      ball,
      extraInfo,
      prize: prize.join("|")
    };
  }
  generateReminder(joined = false) {
    const cmd = joined ? "Leave" : "Join";
    return this.generateWindow(/* @__PURE__ */ Chat.h(Chat.Fragment, null, "The lottery drawing will occur in 2 minutes, and with ", Chat.count(this.maxWinners, "winners"), "!", /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("button", { class: "button", name: "send", value: `/giveaway ${toID(cmd)}lottery` }, /* @__PURE__ */ Chat.h("strong", null, cmd))));
  }
  display() {
    const joined = this.generateReminder(true);
    const notJoined = this.generateReminder();
    for (const i in this.room.users) {
      const thisUser = this.room.users[i];
      if (this.checkJoined(thisUser)) {
        this.sendToUser(thisUser, joined);
      } else {
        this.sendToUser(thisUser, notJoined);
      }
    }
  }
  addUser(user) {
    if (this.phase !== "pending")
      return user.sendTo(this.room, "The join phase of the lottery giveaway has ended.");
    if (!user.named)
      return user.sendTo(this.room, "You need to choose a name before joining a lottery giveaway.");
    if (this.checkJoined(user))
      return user.sendTo(this.room, "You have already joined the giveaway.");
    if (Giveaway.checkBanned(this.room, user))
      return user.sendTo(this.room, "You are banned from entering giveaways.");
    if (this.checkExcluded(user))
      return user.sendTo(this.room, "You are disallowed from entering the giveaway.");
    this.joined.set(user.latestIp, user.id);
    this.sendToUser(user, this.generateReminder(true));
    user.sendTo(this.room, "You have successfully joined the lottery giveaway.");
  }
  removeUser(user) {
    if (this.phase !== "pending")
      return user.sendTo(this.room, "The join phase of the lottery giveaway has ended.");
    if (!this.checkJoined(user))
      return user.sendTo(this.room, "You have not joined the lottery giveaway.");
    for (const [ip, id] of this.joined) {
      if (ip === user.latestIp && !Config.noipchecks || id === user.id) {
        this.joined.delete(ip);
      }
    }
    this.sendToUser(user, this.generateReminder(false));
    user.sendTo(this.room, "You have left the lottery giveaway.");
  }
  drawLottery() {
    this.clearTimer();
    const userlist = [...this.joined.values()];
    if (userlist.length === 0) {
      this.changeUhtml(/* @__PURE__ */ Chat.h("p", { style: { textAlign: "center", fontSize: "13pt", fontWeight: "bold" } }, "The giveaway was forcibly ended."));
      this.room.send("The giveaway has been forcibly ended as there are no participants.");
      return this.destroy();
    }
    while (this.winners.length < this.maxWinners && userlist.length > 0) {
      const winner = Users.get(userlist.splice(Math.floor(Math.random() * userlist.length), 1)[0]);
      if (!winner)
        continue;
      this.winners.push(winner);
    }
    this.end();
  }
  end(force = false) {
    const style = { textAlign: "center", fontSize: "13pt", fontWeight: "bold" };
    if (force) {
      this.clearTimer();
      this.changeUhtml(/* @__PURE__ */ Chat.h("p", { style }, "The giveaway was forcibly ended."));
      this.room.send("The giveaway was forcibly ended.");
    } else {
      this.changeUhtml(/* @__PURE__ */ Chat.h("p", { style }, "The giveaway has ended! Scroll down to see the winner", Chat.plural(this.winners), "."));
      this.phase = "ended";
      const winnerNames = this.winners.map((winner) => winner.name).join(", ");
      this.room.modlog({
        action: "GIVEAWAY WIN",
        note: `${winnerNames} won ${this.giver.name}'s giveaway for "${this.prize.species}" (OT: ${this.ot} TID: ${this.tid} Nature: ${this.prize.nature} Ball: ${this.ball}${this.extraInfo ? ` Other box info: ${this.extraInfo}` : ""})`
      });
      this.send(this.generateWindow(/* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("p", { style: { textAlign: "center", fontSize: "10pt", fontWeight: "bold" } }, "Lottery Draw"), /* @__PURE__ */ Chat.h("p", { style: { textAlign: "center" } }, Chat.count(this.joined.size, "users"), " joined the giveaway.", /* @__PURE__ */ Chat.h("br", null), "Our lucky winner", Chat.plural(this.winners), ": ", /* @__PURE__ */ Chat.h("b", null, winnerNames), "!", /* @__PURE__ */ Chat.h("br", null), "Congratulations!"))));
      for (const winner of this.winners) {
        winner.sendTo(
          this.room,
          `|raw|You have won the lottery giveaway! PM <b>${this.giver.name}</b> to claim your prize!`
        );
        if (winner.connected) {
          winner.popup(`You have won the lottery giveaway! PM **${this.giver.name}** to claim your prize!`);
        }
      }
      if (this.giver.connected)
        this.giver.popup(`The following users have won your lottery giveaway:
${winnerNames}`);
      Giveaway.updateStats(/* @__PURE__ */ new Set([this.pokemonID]));
    }
    this.destroy();
  }
}
class GTS extends Rooms.SimpleRoomGame {
  constructor(room, giver, amount, summary, deposit, lookfor) {
    super(room, true);
    this.gameid = "gts";
    this.gtsNumber = room.nextGameNumber();
    this.room = room;
    this.giver = giver;
    this.left = amount;
    this.summary = summary;
    this.deposit = GTS.linkify(import_lib.Utils.escapeHTML(deposit));
    this.lookfor = lookfor;
    [this.pokemonID, this.sprite] = Giveaway.getSprite({ species: summary });
    this.sent = [];
    this.noDeposits = false;
    this.timer = setInterval(() => this.send(this.generateWindow()), 1e3 * 60 * 5);
    this.send(this.generateWindow());
  }
  send(content) {
    this.room.add(Chat.html`|uhtml|gtsga${this.gtsNumber}|${/* @__PURE__ */ Chat.h("div", { class: "broadcast-blue" }, content)}`);
    this.room.update();
  }
  changeUhtml(content) {
    this.room.uhtmlchange(`gtsga${this.gtsNumber}`, Chat.html`${/* @__PURE__ */ Chat.h("div", { class: "broadcast-blue" }, content)}`);
    this.room.update();
  }
  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
  generateWindow() {
    const sentModifier = this.sent.length ? 5 : 0;
    const rightSide = this.noDeposits ? /* @__PURE__ */ Chat.h("strong", null, "More Pok\xE9mon have been deposited than there are prizes in this giveaway and new deposits will not be accepted. ", "If you have already deposited a Pok\xE9mon, please be patient, and do not withdraw your Pok\xE9mon.") : /* @__PURE__ */ Chat.h(Chat.Fragment, null, "To participate, deposit ", /* @__PURE__ */ Chat.h("strong", null, this.deposit), " into the GTS and look for ", /* @__PURE__ */ Chat.h("strong", null, this.lookfor));
    return /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("p", { style: { textAlign: "center", fontSize: "14pt", fontWeight: "bold", marginBottom: "2px" } }, "There is a GTS giveaway going on!"), /* @__PURE__ */ Chat.h("p", { style: { textAlign: "center", fontSize: "10pt", marginTop: 0 } }, "Hosted by: ", this.giver.name, " | Left: ", /* @__PURE__ */ Chat.h("b", null, this.left)), /* @__PURE__ */ Chat.h("table", { style: { margin: "inherit auto" } }, /* @__PURE__ */ Chat.h("tr", null, !!sentModifier && /* @__PURE__ */ Chat.h("td", { style: { textAlign: "center", width: "10%" } }, /* @__PURE__ */ Chat.h("b", null, "Last winners:"), /* @__PURE__ */ Chat.h("br", null), this.sent.join(/* @__PURE__ */ Chat.h("br", null))), /* @__PURE__ */ Chat.h("td", { style: { textAlign: "center", width: "15%" } }, this.sprite), /* @__PURE__ */ Chat.h("td", { style: { textAlign: "center", width: `${40 - sentModifier}%` } }, /* @__PURE__ */ Chat.h(Chat.JSX.FormatText, { isTrusted: true }, this.summary)), /* @__PURE__ */ Chat.h("td", { style: { textAlign: "center", width: `${35 - sentModifier}%` } }, rightSide))));
  }
  updateLeft(num) {
    this.left = num;
    if (this.left < 1)
      return this.end();
    this.changeUhtml(this.generateWindow());
  }
  updateSent(ign) {
    this.left--;
    if (this.left < 1)
      return this.end();
    this.sent.push(ign);
    if (this.sent.length > 5)
      this.sent.shift();
    this.changeUhtml(this.generateWindow());
  }
  stopDeposits() {
    this.noDeposits = true;
    this.room.send(Chat.html`|html|${/* @__PURE__ */ Chat.h("p", { style: { textAlign: "center", fontSize: "11pt" } }, "More Pok\xE9mon have been deposited than there are prizes in this giveaway and new deposits will not be accepted. ", "If you have already deposited a Pok\xE9mon, please be patient, and do not withdraw your Pok\xE9mon.")}`);
    this.changeUhtml(this.generateWindow());
  }
  end(force = false) {
    if (force) {
      this.clearTimer();
      this.changeUhtml(
        /* @__PURE__ */ Chat.h("p", { style: { textAlign: "center", fontSize: "13pt", fontWeight: "bold" } }, "The GTS giveaway was forcibly ended.")
      );
      this.room.send("The GTS giveaway was forcibly ended.");
    } else {
      this.clearTimer();
      this.changeUhtml(
        /* @__PURE__ */ Chat.h("p", { style: { textAlign: "center", fontSize: "13pt", fontWeight: "bold" } }, "The GTS giveaway has finished.")
      );
      this.room.modlog({
        action: "GTS FINISHED",
        userid: this.giver.id,
        note: `their GTS giveaway for "${this.summary}"`
      });
      this.send(/* @__PURE__ */ Chat.h("p", { style: { textAlign: "center", fontSize: "11pt" } }, 'The GTS giveaway for a "', /* @__PURE__ */ Chat.h("strong", null, this.lookfor), '" has finished.'));
      Giveaway.updateStats(/* @__PURE__ */ new Set([this.pokemonID]));
    }
    this.room.subGame = null;
    return this.left;
  }
  // This currently doesn't match some of the edge cases the other pokemon matching function does account for
  // (such as Type: Null). However, this should never be used as a fodder mon anyway,
  // so I don't see a huge need to implement it.
  static linkify(text) {
    const parsed = toID(text);
    for (const species of Dex.species.all()) {
      const id = species.id;
      const regexp = new RegExp(`\\b${id}\\b`, "ig");
      const res = regexp.exec(parsed);
      if (res) {
        const num = String(species.num).padStart(3, "0");
        return /* @__PURE__ */ Chat.h(Chat.Fragment, null, text.slice(0, res.index), /* @__PURE__ */ Chat.h("a", { href: `http://www.serebii.net/pokedex-sm/location/${num}.shtml` }, text.slice(res.index, res.index + res[0].length)), text.slice(res.index + res[0].length));
      }
    }
    return text;
  }
}
function hasSubmittedGiveaway(user) {
  for (const [key, giveaways] of Object.entries(wifiData.submittedGiveaways)) {
    for (const [index, giveaway] of giveaways.entries()) {
      if (user.id === giveaway.targetUserID) {
        return { index, type: key };
      }
    }
  }
  return null;
}
const handlers = {
  onDisconnect(user) {
    const giveaway = hasSubmittedGiveaway(user);
    if (giveaway) {
      wifiData.submittedGiveaways[giveaway.type].splice(giveaway.index, 1);
      saveData();
    }
  }
};
const commands = {
  gts: {
    new: "start",
    create: "start",
    start(target, room, user) {
      room = this.room = Rooms.search("wifi") || null;
      if (!room) {
        throw new Chat.ErrorMessage(`This command must be used in the Wi-Fi room.`);
      }
      if (room.getGame(GTS, true)) {
        throw new Chat.ErrorMessage(`There is already a GTS Giveaway going on.`);
      }
      return this.parse(`/help gts`);
    },
    left(target, room, user) {
      room = this.requireRoom("wifi");
      const game = this.requireGame(GTS, true);
      if (!user.can("warn", null, room) && user !== game.giver) {
        throw new Chat.ErrorMessage("Only the host or a staff member can update GTS giveaways.");
      }
      if (!target) {
        this.runBroadcast();
        let output = `The GTS giveaway from ${game.giver} has ${game.left} Pok\xE9mon remaining!`;
        if (game.sent.length)
          output += `Last winners: ${game.sent.join(", ")}`;
        return this.sendReply(output);
      }
      const newamount = parseInt(target);
      if (isNaN(newamount))
        return this.errorReply("Please enter a valid amount.");
      if (newamount > game.left)
        return this.errorReply("The new amount must be lower than the old amount.");
      if (newamount < game.left - 1) {
        this.modlog(`GTS GIVEAWAY`, null, `set from ${game.left} to ${newamount} left`);
      }
      game.updateLeft(newamount);
    },
    sent(target, room, user) {
      room = this.requireRoom("wifi");
      const game = this.requireGame(GTS, true);
      if (!user.can("warn", null, room) && user !== game.giver) {
        return this.errorReply("Only the host or a staff member can update GTS giveaways.");
      }
      if (!target || target.length > 12)
        return this.errorReply("Please enter a valid IGN.");
      game.updateSent(target);
    },
    full(target, room, user) {
      room = this.requireRoom("wifi");
      const game = this.requireGame(GTS, true);
      if (!user.can("warn", null, room) && user !== game.giver) {
        return this.errorReply("Only the host or a staff member can update GTS giveaways.");
      }
      if (game.noDeposits)
        return this.errorReply("The GTS giveaway was already set to not accept deposits.");
      game.stopDeposits();
    },
    end(target, room, user) {
      room = this.requireRoom("wifi");
      const game = this.requireGame(GTS, true);
      this.checkCan("warn", null, room);
      if (target && target.length > 300) {
        return this.errorReply("The reason is too long. It cannot exceed 300 characters.");
      }
      const amount = game.end(true);
      if (target)
        target = `: ${target}`;
      this.modlog("GTS END", null, `with ${amount} left${target}`);
      this.privateModAction(`The giveaway was forcibly ended by ${user.name} with ${amount} left${target}`);
    }
  },
  gtshelp: [
    `GTS giveaways are currently disabled. If you are a Room Owner and would like them to be re-enabled, contact Kris.`
  ],
  ga: "giveaway",
  giveaway: {
    help: "",
    ""() {
      this.runBroadcast();
      this.run("giveawayhelp");
    },
    view: {
      ""(target, room, user) {
        this.room = room = Rooms.search("wifi") || null;
        if (!room)
          throw new Chat.ErrorMessage(`The Wi-Fi room doesn't exist on this server.`);
        this.checkCan("warn", null, room);
        this.parse(`/j view-giveaways-default`);
      },
      stored(target, room, user) {
        this.room = room = Rooms.search("wifi") || null;
        if (!room)
          throw new Chat.ErrorMessage(`The Wi-Fi room doesn't exist on this server.`);
        this.checkCan("warn", null, room);
        this.parse(`/j view-giveaways-stored`);
      },
      submitted(target, room, user) {
        this.room = room = Rooms.search("wifi") || null;
        if (!room)
          throw new Chat.ErrorMessage(`The Wi-Fi room doesn't exist on this server.`);
        this.checkCan("warn", null, room);
        this.parse(`/j view-giveaways-submitted`);
      }
    },
    rm: "remind",
    remind(target, room, user) {
      room = this.requireRoom("wifi");
      this.runBroadcast();
      if (room.getGame(QuestionGiveaway)) {
        const game = room.getGame(QuestionGiveaway);
        if (game.phase !== "started") {
          throw new Chat.ErrorMessage(`The giveaway has not started yet.`);
        }
        game.send(game.generateQuestion());
      } else if (room.getGame(LotteryGiveaway)) {
        room.getGame(LotteryGiveaway).display();
      } else {
        throw new Chat.ErrorMessage(`There is no giveaway going on right now.`);
      }
    },
    leavelotto: "join",
    leavelottery: "join",
    leave: "join",
    joinlotto: "join",
    joinlottery: "join",
    join(target, room, user, conn, cmd) {
      room = this.requireRoom("wifi");
      this.checkChat();
      if (user.semilocked)
        return;
      const giveaway = this.requireGame(LotteryGiveaway);
      if (cmd.includes("join")) {
        giveaway.addUser(user);
      } else {
        giveaway.removeUser(user);
      }
    },
    ban(target, room, user) {
      if (!target)
        return false;
      room = this.requireRoom("wifi");
      this.checkCan("warn", null, room);
      const { targetUser, rest: reason } = this.requireUser(target, { allowOffline: true });
      if (reason.length > 300) {
        return this.errorReply("The reason is too long. It cannot exceed 300 characters.");
      }
      if (Punishments.hasRoomPunishType(room, targetUser.name, "GIVEAWAYBAN")) {
        return this.errorReply(`User '${targetUser.name}' is already giveawaybanned.`);
      }
      Giveaway.ban(room, targetUser, reason);
      (room.getGame(LotteryGiveaway) || room.getGame(QuestionGiveaway))?.kickUser(targetUser);
      this.modlog("GIVEAWAYBAN", targetUser, reason);
      const reasonMessage = reason ? ` (${reason})` : ``;
      this.privateModAction(`${targetUser.name} was banned from entering giveaways by ${user.name}.${reasonMessage}`);
    },
    unban(target, room, user) {
      if (!target)
        return false;
      room = this.requireRoom("wifi");
      this.checkCan("warn", null, room);
      const { targetUser } = this.requireUser(target, { allowOffline: true });
      if (!Giveaway.checkBanned(room, targetUser)) {
        return this.errorReply(`User '${targetUser.name}' isn't banned from entering giveaways.`);
      }
      Giveaway.unban(room, targetUser);
      this.privateModAction(`${targetUser.name} was unbanned from entering giveaways by ${user.name}.`);
      this.modlog("GIVEAWAYUNBAN", targetUser, null, { noip: 1, noalts: 1 });
    },
    new: "create",
    start: "create",
    create: {
      ""(target, room, user) {
        room = this.requireRoom("wifi");
        if (!user.can("show", null, room))
          this.checkCan("warn", null, room);
        this.parse("/j view-giveaways-create");
      },
      question(target, room, user) {
        room = this.room = Rooms.search("wifi") || null;
        if (!room) {
          throw new Chat.ErrorMessage(`This command must be used in the Wi-Fi room.`);
        }
        if (room.game) {
          throw new Chat.ErrorMessage(`There is already a room game (${room.game.constructor.name}) going on.`);
        }
        const {
          targetUser,
          ot,
          tid,
          game,
          question,
          answers,
          ivs,
          ball,
          extraInfo,
          prize
        } = QuestionGiveaway.splitTarget(target, "|", this, user, "create");
        const set = Teams.import(prize)?.[0];
        if (!set)
          throw new Chat.ErrorMessage(`Please submit the prize in the form of a PS set importable.`);
        room.game = new QuestionGiveaway(user, targetUser, room, ot, tid, game, ivs, set, question, answers, ball, extraInfo);
        this.privateModAction(`${user.name} started a question giveaway for ${targetUser.name}.`);
        this.modlog("QUESTION GIVEAWAY", null, `for ${targetUser.getLastId()} (OT: ${ot} TID: ${tid} Nature: ${room.game.prize.nature} Ball: ${ball}${extraInfo ? ` Other box info: ${extraInfo}` : ""})`);
      },
      lottery(target, room, user) {
        room = this.room = Rooms.search("wifi") || null;
        if (!room) {
          throw new Chat.ErrorMessage(`This command must be used in the Wi-Fi room.`);
        }
        if (room.game)
          throw new Chat.ErrorMessage(`There is already a room game (${room.game.constructor.name}) going on.`);
        const {
          targetUser,
          ot,
          tid,
          game,
          winners,
          ivs,
          ball,
          prize,
          extraInfo
        } = LotteryGiveaway.splitTarget(target, "|", this, user, "create");
        const set = Teams.import(prize)?.[0];
        if (!set)
          throw new Chat.ErrorMessage(`Please submit the prize in the form of a PS set importable.`);
        room.game = new LotteryGiveaway(user, targetUser, room, ot, tid, ivs, game, set, winners, ball, extraInfo);
        this.privateModAction(`${user.name} started a lottery giveaway for ${targetUser.name}.`);
        this.modlog("LOTTERY GIVEAWAY", null, `for ${targetUser.getLastId()} (OT: ${ot} TID: ${tid} Nature: ${room.game.prize.nature} Ball: ${ball}${extraInfo ? ` Other box info: ${extraInfo}` : ""})`);
      }
    },
    stop: "end",
    end(target, room, user) {
      room = this.requireRoom("wifi");
      if (!room.game?.constructor.name.includes("Giveaway")) {
        throw new Chat.ErrorMessage(`There is no giveaway going on at the moment.`);
      }
      const game = room.game;
      if (user.id !== game.host.id)
        this.checkCan("warn", null, room);
      if (target && target.length > 300) {
        return this.errorReply("The reason is too long. It cannot exceed 300 characters.");
      }
      game.end(true);
      this.modlog("GIVEAWAY END", null, target);
      if (target)
        target = `: ${target}`;
      this.privateModAction(`The giveaway was forcibly ended by ${user.name}${target}`);
    },
    guess(target, room, user) {
      this.parse(`/guess ${target}`);
    },
    changeanswer: "changequestion",
    changequestion(target, room, user, connection, cmd) {
      room = this.requireRoom("wifi");
      const giveaway = this.requireGame(QuestionGiveaway);
      target = target.trim();
      if (!target)
        throw new Chat.ErrorMessage("You must include a question or an answer.");
      giveaway.change(target, user, cmd.includes("answer"));
    },
    showanswer: "viewanswer",
    viewanswer(target, room, user) {
      room = this.requireRoom("wifi");
      const giveaway = this.requireGame(QuestionGiveaway);
      if (user.id !== giveaway.host.id && user.id !== giveaway.giver.id)
        return;
      this.sendReply(`The giveaway question is ${giveaway.question}.
The answer${Chat.plural(giveaway.answers, "s are", " is")} ${giveaway.answers.join(", ")}.`);
    },
    save: "store",
    store: {
      ""(target, room, user) {
        room = this.requireRoom("wifi");
        this.checkCan("warn", null, room);
        this.parse("/j view-giveaways-stored-add");
      },
      question(target, room, user) {
        room = this.room = Rooms.search("wifi") || null;
        if (!room) {
          throw new Chat.ErrorMessage(`This command must be used in the Wi-Fi room.`);
        }
        const {
          targetUser,
          ot,
          tid,
          game,
          prize,
          question,
          answers,
          ball,
          extraInfo,
          ivs
        } = QuestionGiveaway.splitTarget(target, "|", this, user, "store");
        const set = Teams.import(prize)?.[0];
        if (!set)
          throw new Chat.ErrorMessage(`Please submit the prize in the form of a PS set importable.`);
        if (!wifiData.storedGiveaways.question)
          wifiData.storedGiveaways.question = [];
        const data = { targetUserID: targetUser.id, ot, tid, game, prize: set, question, answers, ivs, ball, extraInfo };
        wifiData.storedGiveaways.question.push(data);
        saveData();
        this.privateModAction(`${user.name} saved a question giveaway for ${targetUser.name}.`);
        this.modlog("QUESTION GIVEAWAY SAVE");
      },
      lottery(target, room, user) {
        room = this.room = Rooms.search("wifi") || null;
        if (!room) {
          throw new Chat.ErrorMessage(`This command must be used in the Wi-Fi room.`);
        }
        const {
          targetUser,
          ot,
          tid,
          game,
          prize,
          winners,
          ball,
          extraInfo,
          ivs
        } = LotteryGiveaway.splitTarget(target, "|", this, user, "store");
        const set = Teams.import(prize)?.[0];
        if (!set)
          throw new Chat.ErrorMessage(`Please submit the prize in the form of a PS set importable.`);
        if (!wifiData.storedGiveaways.lottery)
          wifiData.storedGiveaways.lottery = [];
        const data = { targetUserID: targetUser.id, ot, tid, game, prize: set, winners, ball, extraInfo, ivs };
        wifiData.storedGiveaways.lottery.push(data);
        saveData();
        this.privateModAction(`${user.name} saved a lottery giveaway for ${targetUser.name}.`);
        this.modlog("LOTTERY GIVEAWAY SAVE");
      }
    },
    submit: {
      ""(target, room, user) {
        room = this.requireRoom("wifi");
        this.checkChat();
        this.parse("/j view-giveaways-submitted-add");
      },
      question(target, room, user) {
        room = this.room = Rooms.search("wifi") || null;
        if (!room) {
          throw new Chat.ErrorMessage(`This command must be used in the Wi-Fi room.`);
        }
        const {
          targetUser,
          ot,
          tid,
          game,
          prize,
          question,
          answers,
          ball,
          extraInfo,
          ivs
        } = QuestionGiveaway.splitTarget(target, "|", this, user, "submit");
        const set = Teams.import(prize)?.[0];
        if (!set)
          throw new Chat.ErrorMessage(`Please submit the prize in the form of a PS set importable.`);
        if (!wifiData.submittedGiveaways.question)
          wifiData.submittedGiveaways.question = [];
        const data = { targetUserID: targetUser.id, ot, tid, game, prize: set, question, answers, ball, extraInfo, ivs };
        wifiData.submittedGiveaways.question.push(data);
        saveData();
        this.sendReply(`You have submitted a question giveaway for ${set.species}. If you log out or go offline, the giveaway won't go through.`);
        const message = `|tempnotify|pendingapprovals|Pending question giveaway request!|${user.name} has requested to start a question giveaway for ${set.species}.|new question giveaway request`;
        room.sendRankedUsers(message, "%");
        room.sendMods(
          Chat.html`|uhtml|giveaway-request-${user.id}|${/* @__PURE__ */ Chat.h("div", { class: "infobox" }, user.name, " wants to start a question giveaway for ", set.species, /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("button", { class: "button", name: "send", value: "/j view-giveaways-submitted" }, "View pending giveaways"))}`
        );
      },
      lottery(target, room, user) {
        room = this.room = Rooms.search("wifi") || null;
        if (!room) {
          throw new Chat.ErrorMessage(`This command must be used in the Wi-Fi room.`);
        }
        const {
          targetUser,
          ot,
          tid,
          game,
          prize,
          winners,
          ball,
          extraInfo,
          ivs
        } = LotteryGiveaway.splitTarget(target, "|", this, user, "submit");
        const set = Teams.import(prize)?.[0];
        if (!set)
          throw new Chat.ErrorMessage(`Please submit the prize in the form of a PS set importable.`);
        if (!wifiData.submittedGiveaways.lottery)
          wifiData.submittedGiveaways.lottery = [];
        const data = { targetUserID: targetUser.id, ot, tid, game, prize: set, winners, ball, extraInfo, ivs };
        wifiData.submittedGiveaways.lottery.push(data);
        saveData();
        this.sendReply(`You have submitted a lottery giveaway for ${set.species}. If you log out or go offline, the giveaway won't go through.`);
        const message = `|tempnotify|pendingapprovals|Pending lottery giveaway request!|${user.name} has requested to start a lottery giveaway for ${set.species}.|new lottery giveaway request`;
        room.sendRankedUsers(message, "%");
        room.sendMods(Chat.html`|uhtml|giveaway-request-${user.id}|${/* @__PURE__ */ Chat.h("div", { class: "infobox" }, user.name, " wants to start a lottery giveaway for ", set.species, /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("button", { class: "button", name: "send", value: "/j view-giveaways-submitted" }, "View pending giveaways"))}`);
      }
    },
    approve(target, room, user) {
      room = this.room = Rooms.search("wifi") || null;
      if (!room) {
        throw new Chat.ErrorMessage(`This command must be used in the Wi-Fi room.`);
      }
      const targetUser = Users.get(target);
      if (!targetUser?.connected) {
        this.refreshPage("giveaways-submitted");
        throw new Chat.ErrorMessage(`${targetUser?.name || toID(target)} is offline, so their giveaway can't be run.`);
      }
      const hasGiveaway = hasSubmittedGiveaway(targetUser);
      if (!hasGiveaway) {
        this.refreshPage("giveaways-submitted");
        throw new Chat.ErrorMessage(`${targetUser?.name || toID(target)} doesn't have any submitted giveaways.`);
      }
      const giveaway = wifiData.submittedGiveaways[hasGiveaway.type][hasGiveaway.index];
      if (hasGiveaway.type === "question") {
        const data = giveaway;
        this.parse(`/giveaway create question ${data.targetUserID}|${data.ot}|${data.tid}|${data.game}|${data.question}|${data.answers.join(",")}|${data.ivs.join("/")}|${data.ball}|${data.extraInfo}|${Teams.pack([data.prize])}`);
      } else {
        const data = giveaway;
        this.parse(`/giveaway create lottery ${data.targetUserID}|${data.ot}|${data.tid}|${data.game}|${data.winners}|${data.ivs.join("/")}|${data.ball}|${data.extraInfo}|${Teams.pack([data.prize])}`);
      }
      wifiData.submittedGiveaways[hasGiveaway.type].splice(hasGiveaway.index, 1);
      saveData();
      this.refreshPage(`giveaways-submitted`);
      targetUser.send(`${user.name} has approved your ${hasGiveaway.type} giveaway!`);
      this.privateModAction(`${user.name} approved a ${hasGiveaway.type} giveaway by ${targetUser.name}.`);
      this.modlog(`GIVEAWAY APPROVE ${hasGiveaway.type.toUpperCase()}`, targetUser, null, { noalts: true, noip: true });
    },
    deny: "delete",
    delete(target, room, user, connection, cmd) {
      room = this.room = Rooms.search("wifi") || null;
      if (!room) {
        throw new Chat.ErrorMessage(`This command must be used in the Wi-Fi room.`);
      }
      if (!target)
        return this.parse("/help giveaway");
      const del = cmd === "delete";
      if (del) {
        const [type, indexStr] = target.split(",");
        const index = parseInt(indexStr) - 1;
        if (!type || !indexStr || index <= -1 || !["question", "lottery"].includes(toID(type)) || isNaN(index)) {
          return this.parse(`/help giveaway`);
        }
        const typedType = toID(type);
        const giveaway = wifiData.storedGiveaways[typedType][index];
        if (!giveaway) {
          throw new Chat.ErrorMessage(
            `There is no giveaway at index ${index}. Indices must be integers between 0 and ${wifiData.storedGiveaways[typedType].length - 1}.`
          );
        }
        wifiData.storedGiveaways[typedType].splice(index, 1);
        saveData();
        this.privateModAction(`${user.name} deleted a ${typedType} giveaway by ${giveaway.targetUserID}.`);
        this.modlog(`GIVEAWAY DELETE ${typedType.toUpperCase()}`);
      } else {
        const { targetUser, rest: reason } = this.splitUser(target);
        if (!targetUser?.connected) {
          throw new Chat.ErrorMessage(`${targetUser?.name || toID(target)} is offline, so their giveaway can't be run.`);
        }
        const hasGiveaway = hasSubmittedGiveaway(targetUser);
        if (!hasGiveaway) {
          this.refreshPage("giveaways-submitted");
          throw new Chat.ErrorMessage(`${targetUser?.name || toID(target)} doesn't have any submitted giveaways.`);
        }
        wifiData.submittedGiveaways[hasGiveaway.type].splice(hasGiveaway.index, 1);
        saveData();
        targetUser?.send(`Staff have rejected your giveaway${reason ? `: ${reason}` : "."}`);
        this.privateModAction(`${user.name} denied a ${hasGiveaway.type} giveaway by ${targetUser.name}.`);
        this.modlog(`GIVEAWAY DENY ${hasGiveaway.type.toUpperCase()}`, targetUser, reason || null, { noalts: true, noip: true });
      }
      this.refreshPage(del ? `giveaways-stored` : "giveaways-submitted");
    },
    unwhitelist: "whitelist",
    whitelist(target, room, user, connection, cmd) {
      room = this.requireRoom("wifi");
      this.checkCan("warn", null, room);
      const targetId = toID(target);
      if (!targetId)
        return this.parse(`/help giveaway whitelist`);
      if (cmd.includes("un")) {
        const idx = wifiData.whitelist.indexOf(targetId);
        if (idx < 0) {
          return this.errorReply(`'${targetId}' is not whitelisted.`);
        }
        wifiData.whitelist.splice(idx, 1);
        this.privateModAction(`${user.name} removed '${targetId}' from the giveaway whitelist.`);
        this.modlog(`GIVEAWAY UNWHITELIST`, targetId);
        saveData();
      } else {
        if (wifiData.whitelist.includes(targetId)) {
          return this.errorReply(`'${targetId}' is already whitelisted.`);
        }
        wifiData.whitelist.push(targetId);
        this.privateModAction(`${user.name} added ${targetId} to the giveaway whitelist.`);
        this.modlog(`GIVEAWAY WHITELIST`, targetId);
        saveData();
      }
    },
    whitelisthelp: [
      `/giveaway whitelist [user] - Allow the given [user] to make giveaways without staff help. Requires: % @ # &`,
      `/giveaway unwhitelist [user] - Remove the given user from the giveaway whitelist. Requires: % @ # &`
    ],
    whitelisted(target, room, user) {
      room = this.requireRoom("wifi");
      this.checkCan("warn", null, room);
      const buf = [/* @__PURE__ */ Chat.h("strong", null, "Currently whitelisted users"), /* @__PURE__ */ Chat.h("br", null)];
      if (!wifiData.whitelist.length) {
        buf.push(/* @__PURE__ */ Chat.h("div", { class: "message-error" }, "None."));
      } else {
        buf.push(wifiData.whitelist.map((n) => /* @__PURE__ */ Chat.h("username", null, n)));
      }
      this.sendReplyBox(/* @__PURE__ */ Chat.h(Chat.Fragment, null, buf));
    },
    claim(target, room, user) {
      room = this.requireRoom("wifi");
      this.checkCan("mute", null, room);
      const { targetUser } = this.requireUser(target);
      const hasGiveaway = hasSubmittedGiveaway(targetUser);
      if (!hasGiveaway) {
        this.refreshPage("giveaways-submitted");
        throw new Chat.ErrorMessage(`${targetUser?.name || toID(target)} doesn't have any submitted giveaways.`);
      }
      const giveaway = wifiData.submittedGiveaways[hasGiveaway.type][hasGiveaway.index];
      if (giveaway.claimed)
        throw new Chat.ErrorMessage(`That giveaway is already claimed by ${giveaway.claimed}.`);
      giveaway.claimed = user.id;
      Chat.refreshPageFor("giveaways-submitted", room);
      this.privateModAction(`${user.name} claimed ${targetUser.name}'s giveaway`);
      saveData();
    },
    unclaim(target, room, user) {
      room = this.requireRoom("wifi");
      this.checkCan("mute", null, room);
      const { targetUser } = this.requireUser(target);
      const hasGiveaway = hasSubmittedGiveaway(targetUser);
      if (!hasGiveaway) {
        this.refreshPage("giveaways-submitted");
        throw new Chat.ErrorMessage(`${targetUser?.name || toID(target)} doesn't have any submitted giveaways.`);
      }
      const giveaway = wifiData.submittedGiveaways[hasGiveaway.type][hasGiveaway.index];
      if (!giveaway.claimed)
        throw new Chat.ErrorMessage(`That giveaway is not claimed.`);
      delete giveaway.claimed;
      Chat.refreshPageFor("giveaways-submitted", room);
      saveData();
    },
    count(target, room, user) {
      room = this.requireRoom("wifi");
      if (!Dex.species.get(target).exists) {
        throw new Chat.ErrorMessage(`No Pok\xE9mon entered. Proper syntax: /giveaway count pokemon`);
      }
      target = Dex.species.get(target).id;
      this.runBroadcast();
      const count = wifiData.stats[target];
      if (!count)
        return this.sendReplyBox("This Pok\xE9mon has never been given away.");
      const recent = count.filter((val) => val + RECENT_THRESHOLD > Date.now()).length;
      this.sendReplyBox(`This Pok\xE9mon has been given away ${Chat.count(count, "times")}, a total of ${Chat.count(recent, "times")} in the past month.`);
    }
  },
  giveawayhelp(target, room, user) {
    room = this.requireRoom("wifi");
    this.runBroadcast();
    const buf = [];
    if (user.can("show", null, room)) {
      buf.push(/* @__PURE__ */ Chat.h("details", null, /* @__PURE__ */ Chat.h("summary", null, "Staff commands"), /* @__PURE__ */ Chat.h("code", null, "/giveaway create"), " - Pulls up a page to create a giveaway. Requires: + % @ # &", /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("code", null, "/giveaway create question Giver | OT | TID | Game | Question | Answer 1, Answer 2, Answer 3 | IV/IV/IV/IV/IV/IV | Pok\xE9 Ball | Extra Info | Prize"), " - Start a new question giveaway (voices can only host their own). Requires: + % @ # &", /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("code", null, "/giveaway create lottery Giver | OT | TID | Game | # of Winners | IV/IV/IV/IV/IV/IV | Pok\xE9 Ball | Extra Info | Prize"), " - Start a new lottery giveaway (voices can only host their own). Requires: + % @ # &", /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("code", null, "/giveaway changequestion/changeanswer"), " - Changes the question/answer of a question giveaway. Requires: Being giveaway host", /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("code", null, "/giveaway viewanswer"), " - Shows the answer of a question giveaway. Requires: Being giveaway host/giver", /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("code", null, "/giveaway ban [user], [reason]"), " - Temporarily bans [user] from entering giveaways. Requires: % @ # &", /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("code", null, "/giveaway end"), " - Forcibly ends the current giveaway. Requires: % @ # &", /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("code", null, "/giveaway count [pokemon]"), " - Shows how frequently a certain Pok\xE9mon has been given away.", /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("code", null, "/giveaway whitelist [user]"), " - Allow the given [user] to make giveaways. Requires: % @ # &", /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("code", null, "/giveaway unwhitelist [user]"), " - Remove the given user from the giveaway whitelist. Requires: % @ # &"));
    }
    buf.push(/* @__PURE__ */ Chat.h("details", null, /* @__PURE__ */ Chat.h("summary", null, "Giveaway participation commands"), /* @__PURE__ */ Chat.h("code", null, "/guess [target]"), " - Guesses an answer for a question giveaway.", /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("code", null, "/giveaway submit"), " - Allows users to submit giveaways. They must remain online after submitting for it to go through.", /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("code", null, "/giveaway viewanswer"), " - Guesses an answer for a question giveaway. Requires: Giveaway host/giver", /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("code", null, "/giveaway remind"), " - Shows the details of the current giveaway.", /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("code", null, "/giveaway join/leave"), " - Joins/leaves a lottery giveaway."));
    this.sendReplyBox(/* @__PURE__ */ Chat.h(Chat.Fragment, null, buf));
  }
};
function makePageHeader(user, pageid) {
  const titles = {
    create: `Create`,
    stored: `View Stored`,
    "stored-add": "Store",
    submitted: `View Submitted`,
    "submitted-add": `Submit`
  };
  const icons = {
    create: /* @__PURE__ */ Chat.h("i", { class: "fa fa-sticky-note" }),
    stored: /* @__PURE__ */ Chat.h("i", { class: "fa fa-paste" }),
    "stored-add": /* @__PURE__ */ Chat.h("i", { class: "fa fa-paste" }),
    submitted: /* @__PURE__ */ Chat.h("i", { class: "fa fa-inbox" }),
    "submitted-add": /* @__PURE__ */ Chat.h("i", { class: "fa fa-inbox" })
  };
  const buf = [];
  buf.push(/* @__PURE__ */ Chat.h("button", { class: "button", style: { float: "right" }, name: "send", value: `/j view-giveaways${pageid?.trim() ? `-${pageid.trim()}` : ""}` }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-refresh" }), " Refresh"));
  buf.push(/* @__PURE__ */ Chat.h("h1", null, "Wi-Fi Giveaways"));
  const urls = [];
  const room = Rooms.get("wifi");
  for (const i in titles) {
    if (urls.length)
      urls.push(" / ");
    if (!user.can("mute", null, room) && i !== "submitted-add") {
      continue;
    }
    const title = titles[i];
    const icon = icons[i];
    if (pageid === i) {
      urls.push(/* @__PURE__ */ Chat.h(Chat.Fragment, null, icon, " ", /* @__PURE__ */ Chat.h("strong", null, title)));
    } else {
      urls.push(/* @__PURE__ */ Chat.h(Chat.Fragment, null, icon, " ", /* @__PURE__ */ Chat.h("a", { href: `/view-giveaways-${i}`, target: "replace" }, title)));
    }
  }
  buf.push(/* @__PURE__ */ Chat.h(Chat.Fragment, null, [urls]), /* @__PURE__ */ Chat.h("hr", null));
  return /* @__PURE__ */ Chat.h("center", null, buf);
}
function formatFakeButton(url, text) {
  return /* @__PURE__ */ Chat.h("a", { class: "button", style: { textDecoration: "inherit" }, target: "replace", href: url }, text);
}
function generatePokeballDropdown() {
  const pokeballs = Dex.items.all().filter((item) => item.isPokeball).sort((a, b) => a.num - b.num);
  const pokeballsObj = [/* @__PURE__ */ Chat.h("option", { value: "" }, "Please select a Pok\xE9 Ball")];
  for (const pokeball of pokeballs) {
    pokeballsObj.push(/* @__PURE__ */ Chat.h("option", { value: pokeball.id }, pokeball.name));
  }
  return /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("label", { for: "ball" }, "Pok\xE9 Ball type: "), /* @__PURE__ */ Chat.h("select", { name: "ball" }, pokeballsObj));
}
const pages = {
  giveaways: {
    ""() {
      this.title = `[Giveaways]`;
      if (!Rooms.search("wifi"))
        return /* @__PURE__ */ Chat.h("h1", null, "There is no Wi-Fi room on this server.");
      this.checkCan("warn", null, Rooms.search("wifi"));
      return /* @__PURE__ */ Chat.h("div", { class: "pad" }, makePageHeader(this.user));
    },
    create(args, user) {
      this.title = `[Create Giveaways]`;
      const wifi = Rooms.search("wifi");
      if (!wifi)
        return /* @__PURE__ */ Chat.h("h1", null, "There is no Wi-Fi room on this server.");
      if (!(user.can("show", null, wifi) || wifiData.whitelist.includes(user.id))) {
        this.checkCan("warn", null, wifi);
      }
      const [type] = args;
      return /* @__PURE__ */ Chat.h("div", { class: "pad" }, makePageHeader(this.user, "create"), (() => {
        if (!type || !["lottery", "question"].includes(type)) {
          return /* @__PURE__ */ Chat.h("center", null, /* @__PURE__ */ Chat.h("h2", null, "Pick a Giveaway type"), formatFakeButton(`/view-giveaways-create-lottery`, /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("i", { class: "fa fa-random" }), " Lottery")), " | ", formatFakeButton(`/view-giveaways-create-question`, /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("i", { class: "fa fa-question" }), " Question")));
        }
        switch (type) {
          case "lottery":
            return /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("h2", null, "Make a Lottery Giveaway"), /* @__PURE__ */ Chat.h("form", { "data-submitsend": "/giveaway create lottery {giver}|{ot}|{tid}|{game}|{winners}|{ivs}|{ball}|{info}|{set}" }, /* @__PURE__ */ Chat.h("label", { for: "giver" }, "Giver: "), /* @__PURE__ */ Chat.h("input", { name: "giver" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "ot" }, "OT: "), /* @__PURE__ */ Chat.h("input", { name: "ot" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "tid" }, "TID: "), /* @__PURE__ */ Chat.h("input", { name: "tid" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), "Game: ", /* @__PURE__ */ Chat.h("div", null, /* @__PURE__ */ Chat.h("input", { type: "radio", id: "bdsp", name: "game", value: "bdsp" }), /* @__PURE__ */ Chat.h("label", { for: "bdsp" }, "BDSP"), /* @__PURE__ */ Chat.h("input", { type: "radio", id: "swsh", name: "game", value: "swsh" }), /* @__PURE__ */ Chat.h("label", { for: "swsh" }, "SwSh"), /* @__PURE__ */ Chat.h("input", { type: "radio", id: "sv", name: "game", value: "sv", checked: true }), /* @__PURE__ */ Chat.h("label", { for: "sv" }, "SV")), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "winners" }, "Number of winners: "), /* @__PURE__ */ Chat.h("input", { name: "winners" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), generatePokeballDropdown(), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "ivs" }, 'IVs (Formatted like "1/30/31/X/HT/30"): '), /* @__PURE__ */ Chat.h("input", { name: "ivs" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "set" }, "Prize:"), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("textarea", { style: { width: "70%", height: "300px" }, placeholder: "Paste set importable", name: "set" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "info" }, "Additional information (if any):"), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("textarea", { style: { width: "50%", height: "100px" }, placeholder: "Add any additional info", name: "info" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("button", { class: "button", type: "submit" }, "Create Lottery Giveaway")));
          case "question":
            return /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("h2", null, "Make a Question Giveaway"), /* @__PURE__ */ Chat.h("form", { "data-submitsend": "/giveaway create question {giver}|{ot}|{tid}|{game}|{question}|{answers}|{ivs}|{ball}|{info}|{set}" }, /* @__PURE__ */ Chat.h("label", { for: "giver" }, "Giver:"), /* @__PURE__ */ Chat.h("input", { name: "giver" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "ot" }, "OT:"), /* @__PURE__ */ Chat.h("input", { name: "ot" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "tid" }, "TID:"), /* @__PURE__ */ Chat.h("input", { name: "tid" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), "Game: ", /* @__PURE__ */ Chat.h("div", null, /* @__PURE__ */ Chat.h("input", { type: "radio", id: "bdsp", name: "game", value: "bdsp" }), /* @__PURE__ */ Chat.h("label", { for: "bdsp" }, "BDSP"), /* @__PURE__ */ Chat.h("input", { type: "radio", id: "swsh", name: "game", value: "swsh" }), /* @__PURE__ */ Chat.h("label", { for: "swsh" }, "SwSh"), /* @__PURE__ */ Chat.h("input", { type: "radio", id: "sv", name: "game", value: "sv", checked: true }), /* @__PURE__ */ Chat.h("label", { for: "sv" }, "SV")), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "question" }, "Question:"), /* @__PURE__ */ Chat.h("input", { name: "question" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "answers" }, "Answers (separated by comma):"), /* @__PURE__ */ Chat.h("input", { name: "answers" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), generatePokeballDropdown(), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "ivs" }, 'IVs (Formatted like "1/30/31/X/HT/30"): '), /* @__PURE__ */ Chat.h("input", { name: "ivs" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "set" }), /* @__PURE__ */ Chat.h("textarea", { style: { width: "70%", height: "300px" }, placeholder: "Paste set importable here", name: "set" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "info" }, "Additional information (if any):"), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("textarea", { style: { width: "50%", height: "100px" }, placeholder: "Add any additional info", name: "info" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("button", { class: "button", type: "submit" }, "Create Question Giveaway")));
        }
      })());
    },
    stored(args, user) {
      this.title = `[Stored Giveaways]`;
      if (!Rooms.search("wifi"))
        return /* @__PURE__ */ Chat.h("h1", null, "There is no Wi-Fi room on this server.");
      this.checkCan("warn", null, Rooms.search("wifi"));
      const [add, type] = args;
      const giveaways = [
        ...(wifiData.storedGiveaways || {}).lottery || [],
        ...(wifiData.storedGiveaways || {}).question || []
      ];
      const adding = add === "add";
      if (!giveaways.length && !adding) {
        return /* @__PURE__ */ Chat.h("div", { class: "pad" }, makePageHeader(this.user, adding ? "stored-add" : "stored"), /* @__PURE__ */ Chat.h("h2", null, "There are no giveaways stored"));
      }
      return /* @__PURE__ */ Chat.h("div", { class: "pad" }, makePageHeader(this.user, adding ? "stored-add" : "stored"), (() => {
        if (!adding) {
          const buf = [];
          for (let giveaway of giveaways) {
            if (wifiData.storedGiveaways.lottery.includes(giveaway)) {
              giveaway = giveaway;
              const targetUser = Users.get(giveaway.targetUserID);
              buf.push(/* @__PURE__ */ Chat.h("div", { class: "infobox" }, /* @__PURE__ */ Chat.h("h3", { style: { textAlign: "center" } }, "Lottery"), /* @__PURE__ */ Chat.h("hr", null), /* @__PURE__ */ Chat.h("strong", null, "Game:"), " ", gameName[giveaway.game], /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("strong", null, "Giver:"), " ", giveaway.targetUserID, ", ", /* @__PURE__ */ Chat.h("strong", null, "OT:"), " ", giveaway.ot, ", ", /* @__PURE__ */ Chat.h("strong", null, "TID:"), " ", giveaway.tid, /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("strong", null, "# of winners:"), " ", giveaway.winners, /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("strong", null, "Pok\xE9 Ball:"), " ", /* @__PURE__ */ Chat.h("psicon", { item: giveaway.ball }), /* @__PURE__ */ Chat.h("details", null, /* @__PURE__ */ Chat.h("summary", null, /* @__PURE__ */ Chat.h("psicon", { pokemon: giveaway.prize.species }), " Prize"), /* @__PURE__ */ Chat.h(Chat.JSX.FormatText, { isTrusted: true }, Giveaway.convertIVs(giveaway.prize, giveaway.ivs))), !!giveaway.extraInfo?.trim() && /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("hr", null), /* @__PURE__ */ Chat.h("details", null, /* @__PURE__ */ Chat.h("summary", null, "Extra Info"), /* @__PURE__ */ Chat.h(Chat.JSX.FormatText, { isTrusted: true }, giveaway.extraInfo.trim()))), /* @__PURE__ */ Chat.h("hr", null), /* @__PURE__ */ Chat.h("button", { class: "button", name: "send", value: `/giveaway delete lottery,${wifiData.storedGiveaways.lottery.indexOf(giveaway) + 1}` }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-trash" }), " Delete giveaway"), !targetUser?.connected ? /* @__PURE__ */ Chat.h("button", { title: "The giver is offline", disabled: true, class: "button disabled", style: { float: "right" } }, "Create giveaway") : /* @__PURE__ */ Chat.h("button", { class: "button", style: { float: "right" }, name: "send", value: `/giveaway create lottery ${giveaway.targetUserID}|${giveaway.ot}|${giveaway.tid}|${giveaway.game}|${giveaway.winners}|${giveaway.ivs.join("/")}|${giveaway.ball}|${giveaway.extraInfo.trim().replace(/\n/g, "<br />")}|${Teams.pack([giveaway.prize])}` }, "Create giveaway")));
            } else {
              giveaway = giveaway;
              const targetUser = Users.get(giveaway.targetUserID);
              buf.push(/* @__PURE__ */ Chat.h("div", { class: "infobox" }, /* @__PURE__ */ Chat.h("h3", { style: { textAlign: "center" } }, "Lottery"), /* @__PURE__ */ Chat.h("hr", null), /* @__PURE__ */ Chat.h("strong", null, "Game:"), " ", gameName[giveaway.game], /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("strong", null, "Giver:"), " ", giveaway.targetUserID, ", ", /* @__PURE__ */ Chat.h("strong", null, "OT:"), " ", giveaway.ot, ", ", /* @__PURE__ */ Chat.h("strong", null, "TID:"), " ", giveaway.tid, /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("strong", null, "Question:"), " ", giveaway.question, /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("strong", null, "Answer", Chat.plural(giveaway.answers.length, "s"), ":"), " ", giveaway.answers.join(", "), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("strong", null, "Pok\xE9 Ball:"), " ", /* @__PURE__ */ Chat.h("psicon", { item: giveaway.ball }), /* @__PURE__ */ Chat.h("details", null, /* @__PURE__ */ Chat.h("summary", null, /* @__PURE__ */ Chat.h("psicon", { pokemon: giveaway.prize.species }), " Prize"), /* @__PURE__ */ Chat.h(Chat.JSX.FormatText, { isTrusted: true }, Giveaway.convertIVs(giveaway.prize, giveaway.ivs))), !!giveaway.extraInfo?.trim() && /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("hr", null), /* @__PURE__ */ Chat.h("details", null, /* @__PURE__ */ Chat.h("summary", null, "Extra Info"), /* @__PURE__ */ Chat.h(Chat.JSX.FormatText, { isTrusted: true }, giveaway.extraInfo.trim()))), /* @__PURE__ */ Chat.h("hr", null), /* @__PURE__ */ Chat.h("button", { class: "button", name: "send", value: `/giveaway delete question,${wifiData.storedGiveaways.question.indexOf(giveaway) + 1}` }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-trash" }), " Delete giveaway"), !targetUser?.connected ? /* @__PURE__ */ Chat.h("button", { title: "The giver is offline", disabled: true, class: "button disabled", style: { float: "right" } }, "Create giveaway") : /* @__PURE__ */ Chat.h("button", { class: "button", style: { float: "right" }, name: "send", value: `/giveaway create question ${giveaway.targetUserID}|${giveaway.ot}|${giveaway.tid}|${giveaway.game}|${giveaway.question}|${giveaway.answers.join(",")}|${giveaway.ivs.join("/")}|${giveaway.ball}|${giveaway.extraInfo.trim().replace(/\n/g, "<br />")}|${Teams.pack([giveaway.prize])}` }, "Create giveaway")));
            }
          }
          return /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("h2", null, "Stored Giveaways"), buf);
        } else {
          return /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("h2", null, "Store a Giveaway"), (() => {
            if (!type || !["question", "lottery"].includes(type)) {
              return /* @__PURE__ */ Chat.h("center", null, /* @__PURE__ */ Chat.h("h3", null, "Pick a giveaway type"), formatFakeButton(`/view-giveaways-stored-add-lottery`, /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("i", { class: "fa fa-random" }), " Lottery")), " | ", formatFakeButton(`/view-giveaways-stored-add-question`, /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("i", { class: "fa fa-question" }), " Question")));
            }
            switch (type) {
              case "lottery":
                return /* @__PURE__ */ Chat.h("form", { "data-submitsend": "/giveaway store lottery {giver}|{ot}|{tid}|{game}|{winners}|{ivs}|{ball}|{info}|{set}" }, /* @__PURE__ */ Chat.h("label", { for: "giver" }, "Giver: "), /* @__PURE__ */ Chat.h("input", { name: "giver" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "ot" }, "OT: "), /* @__PURE__ */ Chat.h("input", { name: "ot" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "tid" }, "TID: "), /* @__PURE__ */ Chat.h("input", { name: "tid" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), "Game: ", /* @__PURE__ */ Chat.h("div", null, /* @__PURE__ */ Chat.h("input", { type: "radio", id: "bdsp", name: "game", value: "bdsp" }), /* @__PURE__ */ Chat.h("label", { for: "bdsp" }, "BDSP"), /* @__PURE__ */ Chat.h("input", { type: "radio", id: "swsh", name: "game", value: "swsh" }), /* @__PURE__ */ Chat.h("label", { for: "swsh" }, "SwSh"), /* @__PURE__ */ Chat.h("input", { type: "radio", id: "sv", name: "game", value: "sv", checked: true }), /* @__PURE__ */ Chat.h("label", { for: "sv" }, "SV")), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "winners" }, "Number of winners: "), /* @__PURE__ */ Chat.h("input", { name: "winners" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), generatePokeballDropdown(), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "ivs" }, 'IVs (Formatted like "1/30/31/X/HT/30"): '), /* @__PURE__ */ Chat.h("input", { name: "ivs" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "set" }, "Prize:"), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("textarea", { style: { width: "70%", height: "300px" }, placeholder: "Paste set importable", name: "set" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "info" }, "Additional information (if any):"), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("textarea", { style: { width: "50%", height: "100px" }, placeholder: "Add any additional info", name: "info" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("button", { class: "button", type: "submit" }, "Store Lottery Giveaway"));
              case "question":
                return /* @__PURE__ */ Chat.h("form", { "data-submitsend": "/giveaway store question {giver}|{ot}|{tid}|{game}|{question}|{answers}|{ivs}|{ball}|{info}|{set}" }, /* @__PURE__ */ Chat.h("label", { for: "giver" }, "Giver:"), /* @__PURE__ */ Chat.h("input", { name: "giver" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "ot" }, "OT:"), /* @__PURE__ */ Chat.h("input", { name: "ot" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "tid" }, "TID:"), /* @__PURE__ */ Chat.h("input", { name: "tid" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), "Game: ", /* @__PURE__ */ Chat.h("div", null, /* @__PURE__ */ Chat.h("input", { type: "radio", id: "bdsp", name: "game", value: "bdsp" }), /* @__PURE__ */ Chat.h("label", { for: "bdsp" }, "BDSP"), /* @__PURE__ */ Chat.h("input", { type: "radio", id: "swsh", name: "game", value: "swsh" }), /* @__PURE__ */ Chat.h("label", { for: "swsh" }, "SwSh"), /* @__PURE__ */ Chat.h("input", { type: "radio", id: "sv", name: "game", value: "sv", checked: true }), /* @__PURE__ */ Chat.h("label", { for: "sv" }, "SV")), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "question" }, "Question:"), /* @__PURE__ */ Chat.h("input", { name: "question" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "answers" }, "Answers (separated by comma):"), /* @__PURE__ */ Chat.h("input", { name: "answers" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), generatePokeballDropdown(), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "ivs" }, 'IVs (Formatted like "1/30/31/X/HT/30"): '), /* @__PURE__ */ Chat.h("input", { name: "ivs" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "set" }), /* @__PURE__ */ Chat.h("textarea", { style: { width: "70%", height: "300px" }, placeholder: "Paste set importable here", name: "set" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "info" }, "Additional information (if any):"), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("textarea", { style: { width: "50%", height: "100px" }, placeholder: "Add any additional info", name: "info" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("button", { class: "button", type: "submit" }, "Store Question Giveaway"));
            }
          })());
        }
      })());
    },
    submitted(args, user) {
      this.title = `[Submitted Giveaways]`;
      if (!Rooms.search("wifi"))
        return /* @__PURE__ */ Chat.h("h1", null, "There is no Wi-Fi room on this server.");
      const [add, type] = args;
      const adding = add === "add";
      if (!adding)
        this.checkCan("warn", null, Rooms.get("wifi"));
      const giveaways = [
        ...(wifiData.submittedGiveaways || {}).lottery || [],
        ...(wifiData.submittedGiveaways || {}).question || []
      ];
      if (!giveaways.length && !adding) {
        return /* @__PURE__ */ Chat.h("div", { class: "pad" }, makePageHeader(this.user, args[0] === "add" ? "submitted-add" : "submitted"), /* @__PURE__ */ Chat.h("h2", null, "There are no submitted giveaways."));
      }
      return /* @__PURE__ */ Chat.h("div", { class: "pad" }, makePageHeader(this.user, args[0] === "add" ? "submitted-add" : "submitted"), (() => {
        if (!adding) {
          const buf = [];
          for (let giveaway of giveaways) {
            const claimCmd = giveaway.claimed === user.id ? `/giveaway unclaim ${giveaway.targetUserID}` : `/giveaway claim ${giveaway.targetUserID}`;
            const claimedTitle = giveaway.claimed === user.id ? "Unclaim" : giveaway.claimed ? `Claimed by ${giveaway.claimed}` : `Claim`;
            const disabled = giveaway.claimed && giveaway.claimed !== user.id ? " disabled" : "";
            buf.push(/* @__PURE__ */ Chat.h("div", { class: "infobox" }, (() => {
              if (wifiData.submittedGiveaways.lottery.includes(giveaway)) {
                giveaway = giveaway;
                return /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("h3", { style: { textAlign: "center" } }, "Lottery"), /* @__PURE__ */ Chat.h("hr", null), /* @__PURE__ */ Chat.h("strong", null, "Game:"), " ", gameName[giveaway.game], ", ", /* @__PURE__ */ Chat.h("strong", null, "Giver:"), " ", giveaway.targetUserID, ", ", /* @__PURE__ */ Chat.h("strong", null, "OT:"), " ", giveaway.ot, ", ", /* @__PURE__ */ Chat.h("strong", null, "TID:"), " ", giveaway.tid, ", ", /* @__PURE__ */ Chat.h("strong", null, "# of winners:"), " ", giveaway.winners, !!giveaway.claimed && /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("strong", null, "Claimed:"), " ", giveaway.claimed), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("strong", null, "Pok\xE9 Ball:"), " ", /* @__PURE__ */ Chat.h("psicon", { item: giveaway.ball }), /* @__PURE__ */ Chat.h("details", null, /* @__PURE__ */ Chat.h("summary", null, /* @__PURE__ */ Chat.h("psicon", { pokemon: giveaway.prize.species }), " Prize"), /* @__PURE__ */ Chat.h(Chat.JSX.FormatText, { isTrusted: true }, Giveaway.convertIVs(giveaway.prize, giveaway.ivs))), !!giveaway.extraInfo?.trim() && /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("hr", null), /* @__PURE__ */ Chat.h("details", null, /* @__PURE__ */ Chat.h("summary", null, "Extra Info"), /* @__PURE__ */ Chat.h(Chat.JSX.FormatText, { isTrusted: true }, giveaway.extraInfo.trim()))));
              } else {
                giveaway = giveaway;
                return /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("h3", { style: { textAlign: "center" } }, "Question"), /* @__PURE__ */ Chat.h("hr", null), /* @__PURE__ */ Chat.h("strong", null, "Game:"), " ", gameName[giveaway.game], ", ", /* @__PURE__ */ Chat.h("strong", null, "Giver:"), " ", giveaway.targetUserID, ", ", /* @__PURE__ */ Chat.h("strong", null, "OT:"), " ", giveaway.ot, ", ", /* @__PURE__ */ Chat.h("strong", null, "TID:"), " ", giveaway.tid, !!giveaway.claimed && /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("strong", null, "Claimed:"), " ", giveaway.claimed), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("strong", null, "Question:"), " ", giveaway.question, /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("strong", null, "Answer", Chat.plural(giveaway.answers.length, "s"), ":"), " ", giveaway.answers.join(", "), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("strong", null, "Pok\xE9 Ball:"), " ", /* @__PURE__ */ Chat.h("psicon", { item: giveaway.ball }), /* @__PURE__ */ Chat.h("details", null, /* @__PURE__ */ Chat.h("summary", null, /* @__PURE__ */ Chat.h("psicon", { pokemon: giveaway.prize.species }), " Prize"), /* @__PURE__ */ Chat.h(Chat.JSX.FormatText, { isTrusted: true }, Giveaway.convertIVs(giveaway.prize, giveaway.ivs))), !!giveaway.extraInfo?.trim() && /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("hr", null), /* @__PURE__ */ Chat.h("details", null, /* @__PURE__ */ Chat.h("summary", null, "Extra Info"), /* @__PURE__ */ Chat.h(Chat.JSX.FormatText, { isTrusted: true }, giveaway.extraInfo.trim()))));
              }
            })(), /* @__PURE__ */ Chat.h("hr", null), !Users.get(giveaway.targetUserID)?.connected ? /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("button", { title: "The giver is offline", class: "button disabled", disabled: true }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-times-circle" }), " Deny giveaway"), /* @__PURE__ */ Chat.h("button", { style: { textAlign: "center" }, class: `button${disabled}`, name: "send", value: `/msgroom wifi,${claimCmd}` }, claimedTitle), /* @__PURE__ */ Chat.h("button", { title: "The giver is offline", disabled: true, class: "button disabled", style: { float: "right" } }, "Create giveaway")) : /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("button", { class: "button", name: "send", value: `/giveaway deny ${giveaway.targetUserID}` }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-times-circle" }), " Deny giveaway"), /* @__PURE__ */ Chat.h("button", { style: { textAlign: "center" }, class: `button${disabled}`, name: "send", value: `/msgroom wifi,${claimCmd}` }, claimedTitle), /* @__PURE__ */ Chat.h("button", { class: "button", style: { float: "right" }, name: "send", value: `/giveaway approve ${giveaway.targetUserID}` }, "Create giveaway"))));
          }
          return /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("h2", null, "Submitted Giveaways"), buf);
        } else {
          return /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("h2", null, "Submit a Giveaway"), (() => {
            if (!type || !["question", "lottery"].includes(type)) {
              return /* @__PURE__ */ Chat.h("center", null, /* @__PURE__ */ Chat.h("h3", null, "Pick a giveaway type"), formatFakeButton(`/view-giveaways-submitted-add-lottery`, /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("i", { class: "fa fa-random" }), " Lottery")), " | ", formatFakeButton(`/view-giveaways-submitted-add-question`, /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("i", { class: "fa fa-question" }), " Question")));
            }
            switch (type) {
              case "lottery":
                return /* @__PURE__ */ Chat.h("form", { "data-submitsend": "/giveaway submit lottery {giver}|{ot}|{tid}|{game}|{winners}|{ivs}|{ball}|{info}|{set}" }, /* @__PURE__ */ Chat.h("label", { for: "giver" }, "Giver: "), /* @__PURE__ */ Chat.h("input", { name: "giver" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "ot" }, "OT: "), /* @__PURE__ */ Chat.h("input", { name: "ot" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "tid" }, "TID: "), /* @__PURE__ */ Chat.h("input", { name: "tid" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), "Game: ", /* @__PURE__ */ Chat.h("div", null, /* @__PURE__ */ Chat.h("input", { type: "radio", id: "bdsp", name: "game", value: "bdsp" }), /* @__PURE__ */ Chat.h("label", { for: "bdsp" }, "BDSP"), /* @__PURE__ */ Chat.h("input", { type: "radio", id: "swsh", name: "game", value: "swsh" }), /* @__PURE__ */ Chat.h("label", { for: "swsh" }, "SwSh"), /* @__PURE__ */ Chat.h("input", { type: "radio", id: "sv", name: "game", value: "sv", checked: true }), /* @__PURE__ */ Chat.h("label", { for: "sv" }, "SV")), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "winners" }, "Number of winners: "), /* @__PURE__ */ Chat.h("input", { name: "winners" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), generatePokeballDropdown(), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "ivs" }, 'IVs (Formatted like "1/30/31/X/HT/30"): '), /* @__PURE__ */ Chat.h("input", { name: "ivs" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "set" }, "Prize:"), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("textarea", { style: { width: "70%", height: "300px" }, placeholder: "Paste set importable", name: "set" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "info" }, "Additional information (provide a link of proof here):"), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("textarea", { style: { width: "50%", height: "100px" }, placeholder: "Add any additional info", name: "info" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("button", { class: "button", type: "submit" }, "Submit Lottery Giveaway"));
              case "question":
                return /* @__PURE__ */ Chat.h("form", { "data-submitsend": "/giveaway submit question {giver}|{ot}|{tid}|{game}|{question}|{answers}|{ivs}|{ball}|{info}|{set}" }, /* @__PURE__ */ Chat.h("label", { for: "giver" }, "Giver:"), /* @__PURE__ */ Chat.h("input", { name: "giver" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "ot" }, "OT:"), /* @__PURE__ */ Chat.h("input", { name: "ot" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "tid" }, "TID:"), /* @__PURE__ */ Chat.h("input", { name: "tid" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), "Game: ", /* @__PURE__ */ Chat.h("div", null, /* @__PURE__ */ Chat.h("input", { type: "radio", id: "bdsp", name: "game", value: "bdsp" }), /* @__PURE__ */ Chat.h("label", { for: "bdsp" }, "BDSP"), /* @__PURE__ */ Chat.h("input", { type: "radio", id: "swsh", name: "game", value: "swsh" }), /* @__PURE__ */ Chat.h("label", { for: "swsh" }, "SwSh"), /* @__PURE__ */ Chat.h("input", { type: "radio", id: "sv", name: "game", value: "sv", checked: true }), /* @__PURE__ */ Chat.h("label", { for: "sv" }, "SV")), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "question" }, "Question:"), /* @__PURE__ */ Chat.h("input", { name: "question" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "answers" }, "Answers (separated by comma):"), /* @__PURE__ */ Chat.h("input", { name: "answers" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), generatePokeballDropdown(), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "ivs" }, 'IVs (Formatted like "1/30/31/X/HT/30"): '), /* @__PURE__ */ Chat.h("input", { name: "ivs" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "set" }), /* @__PURE__ */ Chat.h("textarea", { style: { width: "70%", height: "300px" }, placeholder: "Paste set importable", name: "set" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("label", { for: "info" }, "Additional information (provide a link of proof here):"), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("textarea", { style: { width: "50%", height: "100px" }, placeholder: "Add any additional info", name: "info" }), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("button", { class: "button", type: "submit" }, "Submit Question Giveaway"));
            }
          })());
        }
      })());
    }
  }
};
Chat.multiLinePattern.register(`/giveaway (create|new|start|store|submit|save) (question|lottery) `);
//# sourceMappingURL=wifi.js.map
