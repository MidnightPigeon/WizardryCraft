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
var responder_exports = {};
__export(responder_exports, {
  AutoResponder: () => AutoResponder,
  answererData: () => answererData,
  chatfilter: () => chatfilter,
  commands: () => commands,
  handlers: () => handlers,
  pages: () => pages
});
module.exports = __toCommonJS(responder_exports);
var import_lib = require("../../lib");
var import_chatlog = require("./chatlog");
var import_room_faqs = require("./room-faqs");
const DATA_PATH = "config/chat-plugins/responder.json";
const LOG_PATH = "logs/responder.jsonl";
let answererData = {};
try {
  answererData = JSON.parse((0, import_lib.FS)(DATA_PATH).readSync());
} catch {
}
const _AutoResponder = class {
  constructor(room, data) {
    this.room = room;
    this.data = data || { pairs: {}, ignore: [] };
    _AutoResponder.migrateStats(this.data, this);
  }
  static migrateStats(data, responder) {
    if (!data.stats)
      return data;
    for (const date in data.stats) {
      for (const entry of data.stats[date].matches) {
        void this.logMessage(responder.room.roomid, { ...entry, date });
      }
    }
    delete data.stats;
    responder.data = data;
    responder.writeState();
    return data;
  }
  static logMessage(roomid, entry) {
    return this.logStream.writeLine(JSON.stringify({
      ...entry,
      room: roomid,
      regex: entry.regex.toString()
    }));
  }
  find(question, user) {
    question = question.slice(0, 300);
    const room = this.room;
    const helpFaqs = import_room_faqs.roomFaqs[room.roomid];
    if (!helpFaqs)
      return null;
    const normalized = Chat.normalize(question);
    if (this.data.ignore) {
      if (this.data.ignore.some((t) => new RegExp(t, "i").test(normalized))) {
        return null;
      }
    }
    const faqs = Object.keys(helpFaqs).filter((item) => !helpFaqs[item].alias);
    for (const faq of faqs) {
      const match = this.test(normalized, faq);
      if (match) {
        if (user) {
          const timestamp = Chat.toTimestamp(new Date()).split(" ")[1];
          const log = `${timestamp} |c| ${user.name}|${question}`;
          this.log(log, faq, match.regex);
        }
        return helpFaqs[match.faq];
      }
    }
    return null;
  }
  visualize(question, hideButton, user) {
    const response = this.find(question, user);
    if (response) {
      let buf = "";
      buf += import_lib.Utils.html`<strong>You said:</strong> ${question}<br />`;
      buf += `<strong>Our automated reply:</strong> ${Chat.collapseLineBreaksHTML((0, import_room_faqs.visualizeFaq)(response))}`;
      if (!hideButton) {
        buf += import_lib.Utils.html`<hr /><button class="button" name="send" value="A: ${question}">`;
        buf += `Send to ${this.room.title} if you weren't answered correctly. </button>`;
      }
      return buf;
    }
    return null;
  }
  getFaqID(faq) {
    if (!faq)
      throw new Chat.ErrorMessage(`Your input must be in the format [input] => [faq].`);
    faq = faq.trim();
    if (!faq)
      throw new Chat.ErrorMessage(`Your FAQ ID can't be empty.`);
    const room = this.room;
    const entry = import_room_faqs.roomFaqs[room.roomid][faq];
    if (!entry)
      throw new Chat.ErrorMessage(`FAQ ID "${faq}" not found.`);
    if (!entry.alias)
      return faq;
    return entry.source;
  }
  async getStatsFor(date) {
    const stream = (0, import_lib.FS)(LOG_PATH).createReadStream();
    const buf = [];
    for await (const raw of stream.byLine()) {
      try {
        const data = JSON.parse(raw);
        if (data.date !== date || data.room !== this.room.roomid)
          continue;
        buf.push(data);
      } catch {
      }
    }
    return buf;
  }
  async listDays() {
    const stream = (0, import_lib.FS)(LOG_PATH).createReadStream();
    const buf = new import_lib.Utils.Multiset();
    for await (const raw of stream.byLine()) {
      try {
        const data = JSON.parse(raw);
        if (!data.date || data.room !== this.room.roomid)
          continue;
        buf.add(data.date);
      } catch {
      }
    }
    return buf;
  }
  /**
   * Checks if the FAQ exists. If not, deletes all references to it.
   */
  updateFaqData(faq) {
    if (Config.nofswriting)
      return true;
    const room = this.room;
    if (!room)
      return;
    if (import_room_faqs.roomFaqs[room.roomid][faq])
      return true;
    if (this.data.pairs[faq])
      delete this.data.pairs[faq];
    return false;
  }
  stringRegex(str, raw) {
    [str] = import_lib.Utils.splitFirst(str, "=>");
    const args = str.split(",").map((item) => item.trim());
    if (!raw && args.length > 10) {
      throw new Chat.ErrorMessage(`Too many arguments.`);
    }
    if (str.length > 300 && !raw)
      throw new Chat.ErrorMessage("Your given string is too long.");
    return args.map((item) => {
      const split = item.split("&").map((string) => {
        if (raw)
          return string;
        return string.replace(/[\\^$.*+?()[\]{}]/g, "\\$&").trim();
      });
      return split.map((term) => {
        if (term.length > 100 && !raw) {
          throw new Chat.ErrorMessage(`One or more of your arguments is too long. Use less than 100 characters.`);
        }
        if (item.startsWith("|") || item.endsWith("|")) {
          throw new Chat.ErrorMessage(`Invalid use of |. Make sure you have an option on either side.`);
        }
        if (term.startsWith("!")) {
          return `^(?!.*${term.slice(1)})`;
        }
        if (!term.trim())
          return null;
        return `(?=.*?(${term.trim()}))`;
      }).filter(Boolean).join("");
    }).filter(Boolean).join("");
  }
  test(question, faq) {
    if (!this.data.pairs[faq])
      this.data.pairs[faq] = [];
    const regexes = this.data.pairs[faq].map((item) => new RegExp(item, "i"));
    if (!regexes.length)
      return;
    for (const regex of regexes) {
      if (regex.test(question))
        return { faq, regex: regex.toString() };
    }
    return null;
  }
  log(entry, faq, expression) {
    const [day] = import_lib.Utils.splitFirst(Chat.toTimestamp(new Date()), " ");
    void _AutoResponder.logMessage(this.room.roomid, {
      message: entry,
      faqName: faq,
      regex: expression,
      date: day
    });
  }
  writeState() {
    for (const faq in this.data.pairs) {
      this.updateFaqData(faq);
    }
    answererData[this.room.roomid] = this.data;
    return (0, import_lib.FS)(DATA_PATH).writeUpdate(() => JSON.stringify(answererData));
  }
  tryAddRegex(inputString, raw) {
    let [args, faq] = inputString.split("=>").map((item) => item.trim());
    faq = this.getFaqID(toID(faq));
    if (!this.data.pairs)
      this.data.pairs = {};
    if (!this.data.pairs[faq])
      this.data.pairs[faq] = [];
    const regex = raw ? args.trim() : this.stringRegex(args, raw);
    if (this.data.pairs[faq].includes(regex)) {
      throw new Chat.ErrorMessage(`That regex is already stored.`);
    }
    Chat.validateRegex(regex);
    this.data.pairs[faq].push(regex);
    return this.writeState();
  }
  tryRemoveRegex(faq, index) {
    faq = this.getFaqID(faq);
    if (!this.data.pairs)
      this.data.pairs = {};
    if (!this.data.pairs[faq])
      throw new Chat.ErrorMessage(`There are no regexes for ${faq}.`);
    if (!this.data.pairs[faq][index])
      throw new Chat.ErrorMessage("Your provided index is invalid.");
    this.data.pairs[faq].splice(index, 1);
    this.writeState();
    return true;
  }
  static canOverride(user, room) {
    const devAuth = Rooms.get("development")?.auth;
    return devAuth?.atLeast(user, "%") && devAuth?.has(user.id) && room.auth.atLeast(user, "@") || user.can("rangeban");
  }
  destroy() {
    this.writeState();
    this.room.responder = null;
    this.room = null;
  }
  ignore(terms, context) {
    const filtered = terms.map((t) => context.filter(t)).filter(Boolean);
    if (filtered.length !== terms.length) {
      throw new Chat.ErrorMessage(`Invalid terms.`);
    }
    if (terms.some((t) => t.length > 300)) {
      throw new Chat.ErrorMessage(`One of your terms is too long.`);
    }
    if (!this.data.ignore)
      this.data.ignore = [];
    this.data.ignore.push(...terms);
    this.writeState();
    return terms;
  }
  unignore(terms) {
    if (!this.data.ignore) {
      throw new Chat.ErrorMessage(`The autoresponse filter in this room has no ignored terms.`);
    }
    this.data.ignore = this.data.ignore.filter((item) => !terms.includes(item));
    this.writeState();
    return true;
  }
};
let AutoResponder = _AutoResponder;
AutoResponder.logStream = (0, import_lib.FS)(LOG_PATH).createAppendStream();
for (const room of Rooms.rooms.values()) {
  room.responder?.destroy();
  if (answererData[room.roomid]) {
    room.responder = new AutoResponder(room, answererData[room.roomid]);
  }
}
const BYPASS_TERMS = ["a:", "A:", "!", "/"];
const chatfilter = function(message, user, room) {
  if (BYPASS_TERMS.some((t) => message.startsWith(t))) {
    return;
  }
  if (room?.responder && room.auth.get(user.id) === " ") {
    const responder = room.responder;
    const reply = responder.visualize(message, false, user);
    if (!reply) {
      return message;
    } else {
      this.sendReply(`|uhtml|askhelp-${user}-${toID(message)}|<div class="infobox">${reply}</div>`);
      const trimmedMessage = `<div class="infobox">${responder.visualize(message, true)}</div>`;
      setTimeout(() => {
        this.sendReply(`|uhtmlchange|askhelp-${user}-${toID(message)}|${trimmedMessage}`);
      }, 10 * 1e3);
      return false;
    }
  }
};
const commands = {
  question(target, room, user) {
    room = this.requireRoom();
    const responder = room.responder;
    if (!responder)
      return this.errorReply(`This room does not have an autoresponder configured.`);
    if (!target)
      return this.parse("/help question");
    const reply = responder.visualize(target, true);
    if (!reply)
      return this.sendReplyBox(`No answer found.`);
    this.runBroadcast();
    this.sendReplyBox(reply);
  },
  questionhelp: ["/question [question] - Asks the current room's auto-response filter a question."],
  ar: "autoresponder",
  autoresponder: {
    ""(target, room) {
      room = this.requireRoom();
      const responder = room.responder;
      if (!responder) {
        return this.errorReply(`This room has not configured an autoresponder.`);
      }
      if (!target) {
        return this.parse("/help autoresponder");
      }
      return this.parse(`/j view-autoresponder-${room.roomid}-${target}`);
    },
    view(target, room, user) {
      room = this.requireRoom();
      return this.parse(`/join view-autoresponder-${room.roomid}-${target}`);
    },
    toggle(target, room, user) {
      room = this.requireRoom();
      if (!target) {
        return this.sendReply(
          `The Help auto-response filter is currently set to: ${room.responder ? "ON" : "OFF"}`
        );
      }
      this.checkCan("ban", null, room);
      if (room.settings.isPrivate === true) {
        return this.errorReply(`Secret rooms cannot enable an autoresponder.`);
      }
      if (this.meansYes(target)) {
        if (room.responder)
          return this.errorReply(`The Autoresponder for this room is already enabled.`);
        room.responder = new AutoResponder(room, answererData[room.roomid]);
        room.responder.writeState();
      }
      if (this.meansNo(target)) {
        if (!room.responder)
          return this.errorReply(`The Autoresponder for this room is already disabled.`);
        room.responder.destroy();
      }
      this.privateModAction(`${user.name} ${!room.responder ? "disabled" : "enabled"} the auto-response filter.`);
      this.modlog(`AUTOFILTER`, null, !room.responder ? "OFF" : "ON");
    },
    forceadd: "add",
    add(target, room, user, connection, cmd) {
      room = this.requireRoom();
      if (!room.responder) {
        return this.errorReply(`This room has not configured an auto-response filter.`);
      }
      const force = cmd === "forceadd";
      if (force && !AutoResponder.canOverride(user, room)) {
        return this.errorReply(`You cannot use raw regex - use /autoresponder add instead.`);
      }
      this.checkCan("ban", null, room);
      room.responder.tryAddRegex(target, force);
      this.privateModAction(`${user.name} added regex for "${target.split("=>")[0]}" to the autoresponder.`);
      this.modlog(`AUTOFILTER ADD`, null, target);
    },
    remove(target, room, user) {
      const [faq, index] = target.split(",");
      room = this.requireRoom();
      if (!room.responder) {
        return this.errorReply(`${room.title} has not configured an auto-response filter.`);
      }
      this.checkCan("ban", null, room);
      const num = parseInt(index);
      if (isNaN(num))
        return this.errorReply("Invalid index.");
      room.responder.tryRemoveRegex(faq, num - 1);
      this.privateModAction(`${user.name} removed regex ${num} from the usable regexes for ${faq}.`);
      this.modlog("AUTOFILTER REMOVE", null, `removed regex ${index} for FAQ ${faq}`);
      const pages2 = [`keys`, `pairs`];
      for (const p of pages2) {
        this.refreshPage(`autofilter-${room.roomid}-${p}`);
      }
    },
    ignore(target, room, user) {
      room = this.requireRoom();
      if (!room.responder) {
        return this.errorReply(`This room has not configured an auto-response filter.`);
      }
      this.checkCan("ban", null, room);
      if (!toID(target)) {
        return this.parse(`/help autoresponder`);
      }
      const targets = target.split(",");
      room.responder.ignore(targets, this);
      this.privateModAction(
        `${user.name} added ${Chat.count(targets.length, "terms")} to the autoresponder ignore list.`
      );
      this.modlog(`AUTOFILTER IGNORE`, null, target);
    },
    unignore(target, room, user) {
      room = this.requireRoom();
      if (!room.responder) {
        return this.errorReply(`${room.title} has not configured an auto-response filter.`);
      }
      this.checkCan("ban", null, room);
      if (!toID(target)) {
        return this.parse(`/help autoresponder`);
      }
      const targets = target.split(",");
      room.responder.unignore(targets);
      this.privateModAction(`${user.name} removed ${Chat.count(targets.length, "terms")} from the autoresponder ignore list.`);
      this.modlog(`AUTOFILTER UNIGNORE`, null, target);
      if (this.connection.openPages?.has(`autoresponder-${room.roomid}-ignore`)) {
        return this.parse(`/join view-autoresponder-${room.roomid}-ignore`);
      }
    }
  },
  autoresponderhelp() {
    const help = [
      `<code>/autoresponder view [page]</code> - Views the Autoresponder page [page]. (options: keys, stats)`,
      `<code>/autoresponder toggle [on | off]</code> - Enables or disables the Autoresponder for the current room. Requires: @ # &`,
      `<code>/autoresponder add [input] => [faq]</code> - Adds regex made from the input string to the current room's Autoresponder, to respond with [faq] to matches.`,
      `<code>/autoresponder remove [faq], [regex index]</code> - removes the regex matching the [index] from the current room's responses for [faq].`,
      `Indexes can be found in /autoresponder keys.`,
      `Requires: @ # &`
    ];
    return this.sendReplyBox(help.join("<br/ >"));
  }
};
const pages = {
  async autoresponder(args, user) {
    const room = this.requireRoom();
    if (!room.responder) {
      return this.errorReply(`${room.title} does not have a configured autoresponder.`);
    }
    args.shift();
    const roomData = answererData[room.roomid];
    const canChange = user.can("ban", null, room);
    let buf = "";
    const refresh = (type, extra) => {
      if (extra)
        extra = extra.filter(Boolean);
      let button = `<button class="button" name="send" value="/join view-autoresponder-${room.roomid}-${type}`;
      button += `${extra?.length ? `-${extra.join("-")}` : ""}" style="float: right">`;
      button += `<i class="fa fa-refresh"></i> Refresh</button><br />`;
      return button;
    };
    const back = `<br /><a roomid="view-autoresponder-${room.roomid}">Back to all</a>`;
    switch (args[0]) {
      case "stats":
        args.shift();
        this.checkCan("mute", null, room);
        const date = args.join("-") || "";
        if (!!date && isNaN(new Date(date).getTime())) {
          return `<h2>Invalid date.</h2>`;
        }
        buf = `<div class="pad"><strong>Stats for the ${room.title} auto-response filter${date ? ` on ${date}` : ""}.</strong>`;
        buf += `${back}${refresh("stats", [date])}<hr />`;
        if (date) {
          const stats = await room.responder.getStatsFor(date);
          if (!stats)
            return `<h2>No stats.</h2>`;
          this.title = `[Autoresponder Stats] ${date ? date : ""}`;
          if (!stats.length)
            return `<h2>No stats for ${date}.</h2>`;
          buf += `<strong>Total messages answered: ${stats.length}</strong><hr />`;
          buf += `<details><summary>All messages and the corresponding answers (FAQs):</summary>`;
          for (const entry of stats) {
            buf += `<small>Message:</small>${import_chatlog.LogViewer.renderLine(entry.message)}`;
            buf += `<small>FAQ: ${entry.faqName}</small><br />`;
            buf += `<small>Regex: <code>${entry.regex}</code></small> <hr />`;
          }
          return import_chatlog.LogViewer.linkify(buf);
        }
        buf += `<strong> No date specified.<br />`;
        const days = [];
        let totalCount = 0;
        const dayKeys = await room.responder.listDays();
        for (const [dateKey, total] of dayKeys) {
          totalCount += total;
          days.push(`- <a roomid="view-autoresponder-${room.roomid}-stats-${dateKey}">${dateKey}</a> (${total})`);
        }
        buf += `Dates with stats:</strong><small>(total matches: ${totalCount})</small><br /><br />`;
        buf += days.join("<br />");
        break;
      case "pairs":
      case "keys":
        this.title = "[Autoresponder Regexes]";
        this.checkCan("show", null, room);
        buf = `<div class="pad"><h2>${room.title} responder regexes and responses:</h2>${back}${refresh("keys")}<hr />`;
        buf += Object.entries(roomData.pairs).map(([item, regexes]) => {
          if (regexes.length < 1)
            return null;
          let buffer = `<details><summary>${item}</summary>`;
          buffer += `<div class="ladder pad"><table><tr><th>Index</th><th>Regex</th>`;
          if (canChange)
            buffer += `<th>Options</th>`;
          buffer += `</tr>`;
          for (const regex of regexes) {
            const index = regexes.indexOf(regex) + 1;
            const button = `<button class="button" name="send"value="/msgroom ${room.roomid},/ar remove ${item}, ${index}">Remove</button>`;
            buffer += `<tr><td>${index}</td><td><code>${regex}</code></td>`;
            if (canChange)
              buffer += `<td>${button}</td></tr>`;
          }
          buffer += `</details>`;
          return buffer;
        }).filter(Boolean).join("<hr />");
        break;
      case "ignore":
        this.title = `[${room.title} Autoresponder ignore list]`;
        buf = `<div class="pad"><h2>${room.title} responder terms to ignore:</h2>${back}${refresh("ignore")}<hr />`;
        if (!roomData.ignore) {
          return this.errorReply(`No terms on ignore list.`);
        }
        for (const term of roomData.ignore) {
          buf += `- ${term} <button class="button" name="send"value="/msgroom ${room.roomid},/ar unignore ${term}">Remove</button><br />`;
        }
        buf += `</div>`;
        break;
      default:
        this.title = `[${room.title} Autoresponder]`;
        buf = `<div class="pad"><h2>Specify a filter page to view.</h2>`;
        buf += `<hr /><strong>Options:</strong><hr />`;
        buf += `<a roomid="view-autoresponder-${room.roomid}-stats">Stats</a><hr />`;
        buf += `<a roomid="view-autoresponder-${room.roomid}-keys">Regex keys</a><hr/>`;
        buf += `<a roomid="view-autoresponder-${room.roomid}-ignore">Ignore list</a><hr/>`;
        buf += `</div>`;
    }
    return import_chatlog.LogViewer.linkify(buf);
  }
};
const handlers = {
  onRenameRoom(oldID, newID) {
    if (answererData[oldID]) {
      if (!answererData[newID])
        answererData[newID] = { pairs: {} };
      Object.assign(answererData[newID], answererData[oldID]);
      delete answererData[oldID];
      (0, import_lib.FS)(DATA_PATH).writeUpdate(() => JSON.stringify(answererData));
    }
  }
};
//# sourceMappingURL=responder.js.map
