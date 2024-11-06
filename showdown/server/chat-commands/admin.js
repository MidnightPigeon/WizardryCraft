"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target2, all) => {
  for (var name in all)
    __defProp(target2, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target2) => (target2 = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target2, "default", { value: mod, enumerable: true }) : target2,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var admin_exports = {};
__export(admin_exports, {
  commands: () => commands,
  pages: () => pages
});
module.exports = __toCommonJS(admin_exports);
var path = __toESM(require("path"));
var child_process = __toESM(require("child_process"));
var import_lib = require("../../lib");
/**
 * Administration commands
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * These are administration commands, generally only useful for
 * programmers for managing the server.
 *
 * For the API, see chat-plugins/COMMANDS.md
 *
 * @license MIT
 */
function hasDevAuth(user2) {
  const devRoom = Rooms.get("development");
  return devRoom && Users.Auth.atLeast(devRoom.auth.getDirect(user2.id), "%");
}
function bash(command, context, cwd) {
  context.stafflog(`$ ${command}`);
  if (!cwd)
    cwd = import_lib.FS.ROOT_PATH;
  return new Promise((resolve) => {
    child_process.exec(command, { cwd }, (error, stdout, stderr) => {
      let log = `[o] ${stdout}[e] ${stderr}`;
      if (error)
        log = `[c] ${error.code}
${log}`;
      context.stafflog(log);
      resolve([error?.code || 0, stdout, stderr]);
    });
  });
}
function keysIncludingNonEnumerable(obj) {
  const methods = /* @__PURE__ */ new Set();
  let current = obj;
  do {
    const curProps = Object.getOwnPropertyNames(current);
    for (const prop of curProps) {
      methods.add(prop);
    }
  } while (current = Object.getPrototypeOf(current));
  return [...methods];
}
function keysToCopy(obj) {
  return keysIncludingNonEnumerable(obj).filter(
    // `__` matches sucrase init methods
    // prop is excluded because it can hit things like hasOwnProperty that are potentially annoying (?) with
    // the kind of prototype patching we want to do here - same for constructor and valueOf
    (prop) => !(prop.includes("__") || prop.toLowerCase().includes("prop") || ["valueOf", "constructor"].includes(prop))
  );
}
async function updateserver(context, codePath) {
  const exec = (command) => bash(command, context, codePath);
  context.sendReply(`Fetching newest version of code in the repository ${codePath}...`);
  let [code, stdout, stderr] = await exec(`git fetch`);
  if (code)
    throw new Error(`updateserver: Crash while fetching - make sure this is a Git repository`);
  if (!stdout && !stderr) {
    context.sendReply(`There were no updates.`);
    Monitor.updateServerLock = false;
    return true;
  }
  [code, stdout, stderr] = await exec(`git rev-parse HEAD`);
  if (code || stderr)
    throw new Error(`updateserver: Crash while grabbing hash`);
  const oldHash = String(stdout).trim();
  [code, stdout, stderr] = await exec(`git stash save "PS /updateserver autostash"`);
  let stashedChanges = true;
  if (code)
    throw new Error(`updateserver: Crash while stashing`);
  if ((stdout + stderr).includes("No local changes")) {
    stashedChanges = false;
  } else if (stderr) {
    throw new Error(`updateserver: Crash while stashing`);
  } else {
    context.sendReply(`Saving changes...`);
  }
  try {
    context.sendReply(`Rebasing...`);
    [code] = await exec(`git rebase --no-autostash FETCH_HEAD`);
    if (code) {
      await exec(`git rebase --abort`);
      throw new Error(`restore`);
    }
    if (stashedChanges) {
      context.sendReply(`Restoring saved changes...`);
      [code] = await exec(`git stash pop`);
      if (code) {
        await exec(`git reset HEAD .`);
        await exec(`git checkout .`);
        throw new Error(`restore`);
      }
    }
    return true;
  } catch {
    await exec(`git reset --hard ${oldHash}`);
    if (stashedChanges)
      await exec(`git stash pop`);
    return false;
  }
}
const commands = {
  potd(target2, room2, user2) {
    this.canUseConsole();
    const species = Dex.species.get(target2);
    if (species.id === Config.potd) {
      return this.errorReply(`The PotD is already set to ${species.name}`);
    }
    if (!species.exists)
      return this.errorReply(`Pokemon "${target2}" not found.`);
    if (!Dex.species.getFullLearnset(species.id).length) {
      return this.errorReply(`That Pokemon has no learnset and cannot be used as the PotD.`);
    }
    Config.potd = species.id;
    for (const process2 of Rooms.PM.processes) {
      process2.getProcess().send(`EVAL

Config.potd = '${species.id}'`);
    }
    this.addGlobalModAction(`${user2.name} set the PotD to ${species.name}.`);
    this.globalModlog(`POTD`, null, species.name);
  },
  potdhelp: [
    `/potd [pokemon] - Set the Pokemon of the Day to the given [pokemon]. Requires: &`
  ],
  /*********************************************************
   * Bot commands (chat-log manipulation)
   *********************************************************/
  htmlbox(target2, room2, user2) {
    if (!target2)
      return this.parse("/help htmlbox");
    room2 = this.requireRoom();
    this.checkHTML(target2);
    target2 = Chat.collapseLineBreaksHTML(target2);
    this.checkBroadcast(true, "!htmlbox");
    if (this.broadcastMessage)
      this.checkCan("declare", null, room2);
    if (!this.runBroadcast(true, "!htmlbox"))
      return;
    if (this.broadcasting) {
      return `/raw <div class="infobox">${target2}</div>`;
    } else {
      this.sendReplyBox(target2);
    }
  },
  htmlboxhelp: [
    `/htmlbox [message] - Displays a message, parsing HTML code contained.`,
    `!htmlbox [message] - Shows everyone a message, parsing HTML code contained. Requires: * # &`
  ],
  addhtmlbox(target2, room2, user2, connection2, cmd) {
    if (!target2)
      return this.parse("/help " + cmd);
    room2 = this.requireRoom();
    this.checkChat();
    this.checkHTML(target2);
    this.checkCan("addhtml", null, room2);
    target2 = Chat.collapseLineBreaksHTML(target2);
    if (user2.tempGroup !== "*") {
      target2 += import_lib.Utils.html`<div style="float:right;color:#888;font-size:8pt">[${user2.name}]</div><div style="clear:both"></div>`;
    }
    return `/raw <div class="infobox">${target2}</div>`;
  },
  addhtmlboxhelp: [
    `/addhtmlbox [message] - Shows everyone a message, parsing HTML code contained. Requires: * # &`
  ],
  addrankhtmlbox(target2, room2, user2, connection2, cmd) {
    room2 = this.requireRoom();
    if (!target2)
      return this.parse("/help " + cmd);
    this.checkChat();
    let [rank, html] = this.splitOne(target2);
    if (!(rank in Config.groups))
      return this.errorReply(`Group '${rank}' does not exist.`);
    html = this.checkHTML(html);
    this.checkCan("addhtml", null, room2);
    html = Chat.collapseLineBreaksHTML(html);
    if (user2.tempGroup !== "*") {
      html += import_lib.Utils.html`<div style="float:right;color:#888;font-size:8pt">[${user2.name}]</div><div style="clear:both"></div>`;
    }
    room2.sendRankedUsers(`|html|<div class="infobox">${html}</div>`, rank);
  },
  addrankhtmlboxhelp: [
    `/addrankhtmlbox [rank], [message] - Shows everyone with the specified rank or higher a message, parsing HTML code contained. Requires: * # &`
  ],
  changeuhtml: "adduhtml",
  adduhtml(target2, room2, user2, connection2, cmd) {
    room2 = this.requireRoom();
    if (!target2)
      return this.parse("/help " + cmd);
    this.checkChat();
    let [name, html] = this.splitOne(target2);
    name = toID(name);
    html = this.checkHTML(html);
    this.checkCan("addhtml", null, room2);
    html = Chat.collapseLineBreaksHTML(html);
    if (user2.tempGroup !== "*") {
      html += import_lib.Utils.html`<div style="float:right;color:#888;font-size:8pt">[${user2.name}]</div><div style="clear:both"></div>`;
    }
    if (cmd === "changeuhtml") {
      room2.attributedUhtmlchange(user2, name, html);
    } else {
      return `/uhtml ${name},${html}`;
    }
  },
  adduhtmlhelp: [
    `/adduhtml [name], [message] - Shows everyone a message that can change, parsing HTML code contained.  Requires: * # &`
  ],
  changeuhtmlhelp: [
    `/changeuhtml [name], [message] - Changes the message previously shown with /adduhtml [name]. Requires: * # &`
  ],
  changerankuhtml: "addrankuhtml",
  addrankuhtml(target2, room2, user2, connection2, cmd) {
    room2 = this.requireRoom();
    if (!target2)
      return this.parse("/help " + cmd);
    this.checkChat();
    const [rank, uhtml] = this.splitOne(target2);
    if (!(rank in Config.groups))
      return this.errorReply(`Group '${rank}' does not exist.`);
    let [name, html] = this.splitOne(uhtml);
    name = toID(name);
    html = this.checkHTML(html);
    this.checkCan("addhtml", null, room2);
    html = Chat.collapseLineBreaksHTML(html);
    if (user2.tempGroup !== "*") {
      html += import_lib.Utils.html`<div style="float:right;color:#888;font-size:8pt">[${user2.name}]</div><div style="clear:both"></div>`;
    }
    html = `|uhtml${cmd === "changerankuhtml" ? "change" : ""}|${name}|${html}`;
    room2.sendRankedUsers(html, rank);
  },
  addrankuhtmlhelp: [
    `/addrankuhtml [rank], [name], [message] - Shows everyone with the specified rank or higher a message that can change, parsing HTML code contained.  Requires: * # &`
  ],
  changerankuhtmlhelp: [
    `/changerankuhtml [rank], [name], [message] - Changes the message previously shown with /addrankuhtml [rank], [name]. Requires: * # &`
  ],
  deletenamecolor: "setnamecolor",
  snc: "setnamecolor",
  dnc: "setnamecolor",
  async setnamecolor(target2, room2, user2, connection2, cmd) {
    this.checkCan("rangeban");
    if (!toID(target2)) {
      return this.parse(`/help ${cmd}`);
    }
    let [userid, source] = this.splitOne(target2).map(toID);
    if (cmd.startsWith("d")) {
      source = "";
    } else if (!source || source.length > 18) {
      return this.errorReply(
        `Specify a source username to take the color from. Name must be <19 characters.`
      );
    }
    if (!userid || userid.length > 18) {
      return this.errorReply(`Specify a valid name to set a new color for. Names must be <19 characters.`);
    }
    const [res, error] = await LoginServer.request("updatenamecolor", {
      userid,
      source,
      by: user2.id
    });
    if (error) {
      return this.errorReply(error.message);
    }
    if (!res || res.actionerror) {
      return this.errorReply(res?.actionerror || "The loginserver is currently disabled.");
    }
    if (source) {
      return this.sendReply(
        `|html|<username>${userid}</username>'s namecolor was successfully updated to match '<username>${source}</username>'. Refresh your browser for it to take effect.`
      );
    } else {
      return this.sendReply(`${userid}'s namecolor was removed.`);
    }
  },
  setnamecolorhelp: [
    `/setnamecolor OR /snc [username], [source name] - Set [username]'s name color to match the [source name]'s color.`,
    `Requires: &`
  ],
  deletenamecolorhelp: [
    `/deletenamecolor OR /dnc [username] - Remove [username]'s namecolor.`,
    `Requires: &`
  ],
  pline(target2, room2, user2) {
    this.canUseConsole();
    const message = target2.length > 30 ? target2.slice(0, 30) + "..." : target2;
    this.checkBroadcast(true, `!pline ${message}`);
    this.runBroadcast(true);
    this.sendReply(target2);
  },
  plinehelp: [
    `/pline [protocol lines] - Adds the given [protocol lines] to the current room. Requires: & console access`
  ],
  pminfobox(target2, room2, user2, connection2) {
    this.checkChat();
    room2 = this.requireRoom();
    this.checkCan("addhtml", null, room2);
    if (!target2)
      return this.parse("/help pminfobox");
    const { targetUser, rest: html } = this.requireUser(target2);
    this.checkHTML(html);
    this.checkPMHTML(targetUser);
    const message = `|pm|${user2.getIdentity()}|${targetUser.getIdentity()}|/raw <div class="infobox">${html}</div>`;
    user2.send(message);
    if (targetUser !== user2)
      targetUser.send(message);
    targetUser.lastPM = user2.id;
    user2.lastPM = targetUser.id;
  },
  pminfoboxhelp: [`/pminfobox [user], [html]- PMs an [html] infobox to [user]. Requires * # &`],
  pmuhtmlchange: "pmuhtml",
  pmuhtml(target2, room2, user2, connection2, cmd) {
    this.checkChat();
    room2 = this.requireRoom();
    this.checkCan("addhtml", null, room2);
    if (!target2)
      return this.parse("/help " + cmd);
    const { targetUser, rest: html } = this.requireUser(target2);
    this.checkHTML(html);
    this.checkPMHTML(targetUser);
    const message = `|pm|${user2.getIdentity()}|${targetUser.getIdentity()}|/uhtml${cmd === "pmuhtmlchange" ? "change" : ""} ${html}`;
    user2.send(message);
    if (targetUser !== user2)
      targetUser.send(message);
    targetUser.lastPM = user2.id;
    user2.lastPM = targetUser.id;
  },
  pmuhtmlhelp: [`/pmuhtml [user], [name], [html] - PMs [html] that can change to [user]. Requires * # &`],
  pmuhtmlchangehelp: [
    `/pmuhtmlchange [user], [name], [html] - Changes html that was previously PMed to [user] to [html]. Requires * # &`
  ],
  closehtmlpage: "sendhtmlpage",
  changehtmlpageselector: "sendhtmlpage",
  sendhtmlpage(target2, room2, user2, connection2, cmd) {
    room2 = this.requireRoom();
    this.checkCan("addhtml", null, room2);
    const closeHtmlPage = cmd === "closehtmlpage";
    const { targetUser, rest } = this.requireUser(target2);
    let [pageid, content] = this.splitOne(rest);
    let selector;
    if (cmd === "changehtmlpageselector") {
      [selector, content] = this.splitOne(content);
      if (!selector)
        return this.parse(`/help ${cmd}`);
    }
    if (!pageid || (closeHtmlPage ? content : !content)) {
      return this.parse(`/help ${cmd}`);
    }
    pageid = `${user2.id}-${toID(pageid)}`;
    if (targetUser.locked && !this.user.can("lock")) {
      this.errorReply("This user is currently locked, so you cannot send them HTML.");
      return false;
    }
    let targetConnections = [];
    for (const c of targetUser.connections) {
      if (c.lastRequestedPage === pageid) {
        targetConnections.push(c);
      }
    }
    if (!targetConnections.length) {
      this.checkPMHTML(targetUser);
      targetConnections = targetUser.connections;
    }
    content = this.checkHTML(content);
    for (const targetConnection of targetConnections) {
      const context = new Chat.PageContext({
        user: targetUser,
        connection: targetConnection,
        pageid: `view-bot-${pageid}`
      });
      if (closeHtmlPage) {
        context.send(`|deinit|`);
      } else if (selector) {
        context.send(`|selectorhtml|${selector}|${content}`);
      } else {
        context.title = `[${user2.name}] ${pageid}`;
        context.setHTML(content);
      }
    }
    if (closeHtmlPage) {
      this.sendReply(`Closed the bot page ${pageid} for ${targetUser.name}.`);
    } else {
      this.sendReply(`Sent ${targetUser.name}${selector ? ` the selector ${selector} on` : ""} the bot page ${pageid}.`);
    }
  },
  sendhtmlpagehelp: [
    `/sendhtmlpage [userid], [pageid], [html] - Sends [userid] the bot page [pageid] with the content [html]. Requires: * # &`
  ],
  changehtmlpageselectorhelp: [
    `/changehtmlpageselector [userid], [pageid], [selector], [html] - Sends [userid] the content [html] for the selector [selector] on the bot page [pageid]. Requires: * # &`
  ],
  closehtmlpagehelp: [
    `/closehtmlpage [userid], [pageid], - Closes the bot page [pageid] for [userid]. Requires: * # &`
  ],
  highlighthtmlpage(target2, room2, user2) {
    const { targetUser, rest } = this.requireUser(target2);
    let [pageid, title, highlight] = import_lib.Utils.splitFirst(rest, ",", 2);
    pageid = `${user2.id}-${toID(pageid)}`;
    if (!pageid || !target2)
      return this.parse(`/help highlighthtmlpage`);
    if (targetUser.locked && !this.user.can("lock")) {
      throw new Chat.ErrorMessage("This user is currently locked, so you cannot send them highlights.");
    }
    const buf = `|tempnotify|bot-${pageid}|${title} [from ${user2.name}]|${highlight ? highlight : ""}`;
    let targetConnections = [];
    this.checkPMHTML(targetUser);
    for (const c of targetUser.connections) {
      if (c.lastRequestedPage === pageid) {
        targetConnections.push(c);
      }
    }
    if (!targetConnections.length) {
      targetConnections = [targetUser.connections[0]];
    }
    for (const conn of targetConnections) {
      conn.send(`>view-bot-${pageid}
${buf}`);
    }
    this.sendReply(`Sent a highlight to ${targetUser.name} on the bot page ${pageid}.`);
  },
  highlighthtmlpagehelp: [
    `/highlighthtmlpage [userid], [pageid], [title], [optional highlight] - Sends a highlight to [userid] if they're viewing the bot page [pageid].`,
    `If a [highlight] is specified, only highlights them if they have that term on their highlight list.`
  ],
  changeprivateuhtml: "sendprivatehtmlbox",
  sendprivateuhtml: "sendprivatehtmlbox",
  sendprivatehtmlbox(target2, room2, user2, connection2, cmd) {
    room2 = this.requireRoom();
    this.checkCan("addhtml", null, room2);
    const { targetUser, rest } = this.requireUser(target2);
    if (targetUser.locked && !this.user.can("lock")) {
      throw new Chat.ErrorMessage("This user is currently locked, so you cannot send them private HTML.");
    }
    if (!(targetUser.id in room2.users)) {
      throw new Chat.ErrorMessage("You cannot send private HTML to users who are not in this room.");
    }
    let html;
    let messageType;
    let name;
    const plainHtml = cmd === "sendprivatehtmlbox";
    if (plainHtml) {
      html = rest;
      messageType = "html";
    } else {
      [name, html] = this.splitOne(rest);
      if (!name)
        return this.parse("/help sendprivatehtmlbox");
      messageType = `uhtml${cmd === "changeprivateuhtml" ? "change" : ""}|${name}`;
    }
    html = this.checkHTML(html);
    if (!html)
      return this.parse("/help sendprivatehtmlbox");
    html = `${import_lib.Utils.html`<div style="color:#888;font-size:8pt">[Private from ${user2.name}]</div>`}${Chat.collapseLineBreaksHTML(html)}`;
    if (plainHtml)
      html = `<div class="infobox">${html}</div>`;
    targetUser.sendTo(room2, `|${messageType}|${html}`);
    this.sendReply(`Sent private HTML to ${targetUser.name}.`);
  },
  sendprivatehtmlboxhelp: [
    `/sendprivatehtmlbox [userid], [html] - Sends [userid] the private [html]. Requires: * # &`,
    `/sendprivateuhtml [userid], [name], [html] - Sends [userid] the private [html] that can change. Requires: * # &`,
    `/changeprivateuhtml [userid], [name], [html] - Changes the message previously sent with /sendprivateuhtml [userid], [name], [html]. Requires: * # &`
  ],
  botmsg(target2, room2, user2, connection2) {
    if (!target2 || !target2.includes(",")) {
      return this.parse("/help botmsg");
    }
    this.checkRecursion();
    let { targetUser, rest: message } = this.requireUser(target2);
    const auth = this.room ? this.room.auth : Users.globalAuth;
    if (!["*", "#"].includes(auth.get(targetUser))) {
      return this.popupReply(`The user "${targetUser.name}" is not a bot in this room.`);
    }
    this.room = null;
    this.pmTarget = targetUser;
    message = this.checkChat(message);
    if (!message)
      return;
    Chat.PrivateMessages.send(`/botmsg ${message}`, user2, targetUser, targetUser);
  },
  botmsghelp: [`/botmsg [username], [message] - Send a private message to a bot without feedback. For room bots, must use in the room the bot is auth in.`],
  nick() {
    this.sendReply(`||New to the Pok\xE9mon Showdown protocol? Your client needs to get a signed assertion from the login server and send /trn`);
    this.sendReply(`||https://github.com/smogon/pokemon-showdown/blob/master/PROTOCOL.md#global-messages`);
    this.sendReply(`||Follow the instructions for handling |challstr| in this documentation`);
  },
  /*********************************************************
   * Server management commands
   *********************************************************/
  memusage: "memoryusage",
  memoryusage(target2, room2, user2) {
    if (!hasDevAuth(user2))
      this.checkCan("lockdown");
    const memUsage = process.memoryUsage();
    const resultNums = [memUsage.rss, memUsage.heapUsed, memUsage.heapTotal];
    const units = ["B", "KiB", "MiB", "GiB", "TiB"];
    const results = resultNums.map((num) => {
      const unitIndex = Math.floor(Math.log2(num) / 10);
      return `${(num / Math.pow(2, 10 * unitIndex)).toFixed(2)} ${units[unitIndex]}`;
    });
    this.sendReply(`||[Main process] RSS: ${results[0]}, Heap: ${results[1]} / ${results[2]}`);
  },
  memoryusagehelp: [
    `/memoryusage OR /memusage - Get the current memory usage of the server. Requires: &`
  ],
  forcehotpatch: "hotpatch",
  async hotpatch(target2, room2, user2, connection2, cmd) {
    if (!target2)
      return this.parse("/help hotpatch");
    this.canUseConsole();
    if (Monitor.updateServerLock) {
      return this.errorReply("Wait for /updateserver to finish before hotpatching.");
    }
    await this.parse(`/rebuild`);
    const lock = Monitor.hotpatchLock;
    const hotpatches = [
      "chat",
      "formats",
      "loginserver",
      "punishments",
      "dnsbl",
      "modlog",
      "processmanager",
      "roomsp",
      "usersp"
    ];
    target2 = toID(target2);
    try {
      import_lib.Utils.clearRequireCache({ exclude: ["/lib/process-manager"] });
      if (target2 === "all") {
        if (lock["all"]) {
          return this.errorReply(`Hot-patching all has been disabled by ${lock["all"].by} (${lock["all"].reason})`);
        }
        if (Config.disablehotpatchall) {
          return this.errorReply("This server does not allow for the use of /hotpatch all");
        }
        for (const hotpatch of hotpatches) {
          await this.parse(`/hotpatch ${hotpatch}`);
        }
      } else if (target2 === "chat" || target2 === "commands") {
        if (lock["tournaments"]) {
          return this.errorReply(`Hot-patching tournaments has been disabled by ${lock["tournaments"].by} (${lock["tournaments"].reason})`);
        }
        if (lock["chat"]) {
          return this.errorReply(`Hot-patching chat has been disabled by ${lock["chat"].by} (${lock["chat"].reason})`);
        }
        this.sendReply("Hotpatching chat commands...");
        const disabledCommands = Chat.allCommands().filter((c) => c.disabled).map((c) => `/${c.fullCmd}`);
        if (cmd !== "forcehotpatch" && disabledCommands.length) {
          this.errorReply(`${Chat.count(disabledCommands.length, "commands")} are disabled right now.`);
          this.errorReply(`Hotpatching will enable them. Use /forcehotpatch chat if you're sure.`);
          return this.errorReply(`Currently disabled: ${disabledCommands.join(", ")}`);
        }
        const oldPlugins = Chat.plugins;
        Chat.destroy();
        const processManagers = import_lib.ProcessManager.processManagers;
        for (const manager of processManagers.slice()) {
          if (manager.filename.startsWith((0, import_lib.FS)(__dirname + "/../chat-plugins/").path)) {
            void manager.destroy();
          }
        }
        void Chat.PM.destroy();
        global.Chat = require("../chat").Chat;
        global.Tournaments = require("../tournaments").Tournaments;
        this.sendReply("Reloading chat plugins...");
        Chat.loadPlugins(oldPlugins);
        this.sendReply("DONE");
      } else if (target2 === "processmanager") {
        if (lock["processmanager"]) {
          return this.errorReply(
            `Hot-patching formats has been disabled by ${lock["processmanager"].by} (${lock["processmanager"].reason})`
          );
        }
        this.sendReply("Hotpatching processmanager prototypes...");
        const cache = { ...require.cache };
        import_lib.Utils.clearRequireCache();
        const newPM = require("../../lib/process-manager");
        require.cache = cache;
        const protos = [
          [import_lib.ProcessManager.QueryProcessManager, newPM.QueryProcessManager],
          [import_lib.ProcessManager.StreamProcessManager, newPM.StreamProcessManager],
          [import_lib.ProcessManager.ProcessManager, newPM.ProcessManager],
          [import_lib.ProcessManager.RawProcessManager, newPM.RawProcessManager],
          [import_lib.ProcessManager.QueryProcessWrapper, newPM.QueryProcessWrapper],
          [import_lib.ProcessManager.StreamProcessWrapper, newPM.StreamProcessWrapper],
          [import_lib.ProcessManager.RawProcessManager, newPM.RawProcessWrapper]
        ].map((part) => part.map((constructor) => constructor.prototype));
        for (const [oldProto, newProto] of protos) {
          const newKeys = keysToCopy(newProto);
          const oldKeys = keysToCopy(oldProto);
          for (const key of oldKeys) {
            if (!newProto[key]) {
              delete oldProto[key];
            }
          }
          for (const key of newKeys) {
            oldProto[key] = newProto[key];
          }
        }
        this.sendReply("DONE");
      } else if (target2 === "usersp" || target2 === "roomsp") {
        if (lock[target2]) {
          return this.errorReply(`Hot-patching ${target2} has been disabled by ${lock[target2].by} (${lock[target2].reason})`);
        }
        let newProto, oldProto, message;
        switch (target2) {
          case "usersp":
            newProto = require("../users").User.prototype;
            oldProto = Users.User.prototype;
            message = "user prototypes";
            break;
          case "roomsp":
            newProto = require("../rooms").BasicRoom.prototype;
            oldProto = Rooms.BasicRoom.prototype;
            message = "rooms prototypes";
            break;
        }
        this.sendReply(`Hotpatching ${message}...`);
        const newKeys = keysToCopy(newProto);
        const oldKeys = keysToCopy(oldProto);
        const counts = {
          added: 0,
          updated: 0,
          deleted: 0
        };
        for (const key of oldKeys) {
          if (!newProto[key]) {
            counts.deleted++;
            delete oldProto[key];
          }
        }
        for (const key of newKeys) {
          if (!oldProto[key]) {
            counts.added++;
          } else if (// compare source code
          typeof oldProto[key] !== "function" || oldProto[key].toString() !== newProto[key].toString()) {
            counts.updated++;
          }
          oldProto[key] = newProto[key];
        }
        this.sendReply(`DONE`);
        this.sendReply(
          `Updated ${Chat.count(counts.updated, "methods")}` + (counts.added ? `, added ${Chat.count(counts.added, "new methods")} to ${message}` : "") + (counts.deleted ? `, and removed ${Chat.count(counts.deleted, "methods")}.` : ".")
        );
      } else if (target2 === "tournaments") {
        if (lock["tournaments"]) {
          return this.errorReply(`Hot-patching tournaments has been disabled by ${lock["tournaments"].by} (${lock["tournaments"].reason})`);
        }
        this.sendReply("Hotpatching tournaments...");
        global.Tournaments = require("../tournaments").Tournaments;
        Chat.loadPlugin(Tournaments, "tournaments");
        this.sendReply("DONE");
      } else if (target2 === "formats" || target2 === "battles") {
        if (lock["formats"]) {
          return this.errorReply(`Hot-patching formats has been disabled by ${lock["formats"].by} (${lock["formats"].reason})`);
        }
        if (lock["battles"]) {
          return this.errorReply(`Hot-patching battles has been disabled by ${lock["battles"].by} (${lock["battles"].reason})`);
        }
        if (lock["validator"]) {
          return this.errorReply(`Hot-patching the validator has been disabled by ${lock["validator"].by} (${lock["validator"].reason})`);
        }
        this.sendReply("Hotpatching formats...");
        global.Dex = require("../../sim/dex").Dex;
        Rooms.global.formatList = "";
        void TeamValidatorAsync.PM.respawn();
        void Rooms.PM.respawn();
        void Chat.plugins.datasearch?.PM?.respawn();
        global.Teams = require("../../sim/teams").Teams;
        Rooms.global.sendAll(Rooms.global.formatListText);
        this.sendReply("DONE");
      } else if (target2 === "loginserver") {
        this.sendReply("Hotpatching loginserver...");
        (0, import_lib.FS)("config/custom.css").unwatch();
        global.LoginServer = require("../loginserver").LoginServer;
        this.sendReply("DONE. New login server requests will use the new code.");
      } else if (target2 === "learnsets" || target2 === "validator") {
        if (lock["validator"]) {
          return this.errorReply(`Hot-patching the validator has been disabled by ${lock["validator"].by} (${lock["validator"].reason})`);
        }
        if (lock["formats"]) {
          return this.errorReply(`Hot-patching formats has been disabled by ${lock["formats"].by} (${lock["formats"].reason})`);
        }
        this.sendReply("Hotpatching validator...");
        void TeamValidatorAsync.PM.respawn();
        global.Teams = require("../../sim/teams").Teams;
        this.sendReply("DONE. Any battles started after now will have teams be validated according to the new code.");
      } else if (target2 === "punishments") {
        if (lock["punishments"]) {
          return this.errorReply(`Hot-patching punishments has been disabled by ${lock["punishments"].by} (${lock["punishments"].reason})`);
        }
        this.sendReply("Hotpatching punishments...");
        global.Punishments = require("../punishments").Punishments;
        this.sendReply("DONE");
      } else if (target2 === "dnsbl" || target2 === "datacenters" || target2 === "iptools") {
        this.sendReply("Hotpatching ip-tools...");
        global.IPTools = require("../ip-tools").IPTools;
        void IPTools.loadHostsAndRanges();
        this.sendReply("DONE");
      } else if (target2 === "modlog") {
        if (lock["modlog"]) {
          return this.errorReply(`Hot-patching modlogs has been disabled by ${lock["modlog"].by} (${lock["modlog"].reason})`);
        }
        this.sendReply("Hotpatching modlog...");
        void Rooms.Modlog.database.destroy();
        const { mainModlog } = require("../modlog");
        if (mainModlog.readyPromise) {
          this.sendReply("Waiting for the new SQLite database to be ready...");
          await mainModlog.readyPromise;
        } else {
          this.sendReply("The new SQLite database is ready!");
        }
        Rooms.Modlog.destroyAllSQLite();
        Rooms.Modlog = mainModlog;
        this.sendReply("DONE");
      } else if (target2.startsWith("disable")) {
        this.sendReply("Disabling hot-patch has been moved to its own command:");
        return this.parse("/help nohotpatch");
      } else {
        return this.errorReply("Your hot-patch command was unrecognized.");
      }
    } catch (e) {
      Rooms.global.notifyRooms(
        ["development", "staff"],
        `|c|${user2.getIdentity()}|/log ${user2.name} used /hotpatch ${target2} - but something failed while trying to hot-patch.`
      );
      return this.errorReply(`Something failed while trying to hot-patch ${target2}: 
${e.stack}`);
    }
    Rooms.global.notifyRooms(
      ["development", "staff"],
      `|c|${user2.getIdentity()}|/log ${user2.name} used /hotpatch ${target2}`
    );
  },
  hotpatchhelp: [
    `Hot-patching the game engine allows you to update parts of Showdown without interrupting currently-running battles. Requires: console access`,
    `Hot-patching has greater memory requirements than restarting`,
    `You can disable various hot-patches with /nohotpatch. For more information on this, see /help nohotpatch`,
    `/hotpatch chat - reloads the chat-commands and chat-plugins directories`,
    `/hotpatch validator - spawn new team validator processes`,
    `/hotpatch formats - reload the sim/dex.ts tree, reload the formats list, and spawn new simulator and team validator processes`,
    `/hotpatch dnsbl - reloads IPTools datacenters`,
    `/hotpatch punishments - reloads new punishments code`,
    `/hotpatch loginserver - reloads new loginserver code`,
    `/hotpatch tournaments - reloads new tournaments code`,
    `/hotpatch modlog - reloads new modlog code`,
    `/hotpatch all - hot-patches chat, tournaments, formats, login server, punishments, modlog, and dnsbl`,
    `/forcehotpatch [target] - as above, but performs the update regardless of whether the history has changed in git`
  ],
  hotpatchlock: "nohotpatch",
  yeshotpatch: "nohotpatch",
  allowhotpatch: "nohotpatch",
  nohotpatch(target2, room2, user2, connection2, cmd) {
    this.checkCan("gdeclare");
    if (!target2)
      return this.parse("/help nohotpatch");
    const separator = " ";
    const hotpatch = toID(target2.substr(0, target2.indexOf(separator)));
    const reason = target2.substr(target2.indexOf(separator), target2.length).trim();
    if (!reason || !target2.includes(separator))
      return this.parse("/help nohotpatch");
    const lock = Monitor.hotpatchLock;
    const validDisable = [
      "roomsp",
      "usersp",
      "chat",
      "battles",
      "formats",
      "validator",
      "tournaments",
      "punishments",
      "modlog",
      "all",
      "processmanager"
    ];
    if (!validDisable.includes(hotpatch)) {
      return this.errorReply(`Disabling hotpatching "${hotpatch}" is not supported.`);
    }
    const enable = ["allowhotpatch", "yeshotpatch"].includes(cmd);
    if (enable) {
      if (!lock[hotpatch])
        return this.errorReply(`Hot-patching ${hotpatch} is not disabled.`);
      delete lock[hotpatch];
      this.sendReply(`You have enabled hot-patching ${hotpatch}.`);
    } else {
      if (lock[hotpatch]) {
        return this.errorReply(`Hot-patching ${hotpatch} has already been disabled by ${lock[hotpatch].by} (${lock[hotpatch].reason})`);
      }
      lock[hotpatch] = {
        by: user2.name,
        reason
      };
      this.sendReply(`You have disabled hot-patching ${hotpatch}.`);
    }
    Rooms.global.notifyRooms(
      ["development", "staff", "upperstaff"],
      `|c|${user2.getIdentity()}|/log ${user2.name} has ${enable ? "enabled" : "disabled"} hot-patching ${hotpatch}. Reason: ${reason}`
    );
  },
  nohotpatchhelp: [
    `/nohotpatch [chat|formats|battles|validator|tournaments|punishments|modlog|all] [reason] - Disables hotpatching the specified part of the simulator. Requires: &`,
    `/allowhotpatch [chat|formats|battles|validator|tournaments|punishments|modlog|all] [reason] - Enables hotpatching the specified part of the simulator. Requires: &`
  ],
  async processes(target2, room2, user2) {
    if (!hasDevAuth(user2))
      this.checkCan("lockdown");
    const processes = /* @__PURE__ */ new Map();
    const ramUnits = ["KiB", "MiB", "GiB", "TiB"];
    const cwd = import_lib.FS.ROOT_PATH;
    await new Promise((resolve) => {
      const child = child_process.exec("ps -o pid,%cpu,time,rss,command", { cwd }, (err, stdout) => {
        if (err)
          throw err;
        const rows = stdout.split("\n").slice(1);
        for (const row of rows) {
          if (!row.trim())
            continue;
          const [pid, cpu, time, ram, ...rest] = row.split(" ").filter(Boolean);
          if (pid === `${child.pid}`)
            continue;
          const entry = { cmd: rest.join(" ") };
          if (time && !time.startsWith("0:00")) {
            entry.time = time;
          }
          if (cpu && cpu !== "0.0")
            entry.cpu = `${cpu}%`;
          const ramNum = parseInt(ram);
          if (!isNaN(ramNum)) {
            const unitIndex = Math.floor(Math.log2(ramNum) / 10);
            entry.ram = `${(ramNum / Math.pow(2, 10 * unitIndex)).toFixed(2)} ${ramUnits[unitIndex]}`;
          }
          processes.set(pid, entry);
        }
        resolve();
      });
    });
    let buf = `<strong>${process.pid}</strong> - Main `;
    const mainDisplay = [];
    const mainProcess = processes.get(`${process.pid}`);
    if (mainProcess.cpu)
      mainDisplay.push(`CPU ${mainProcess.cpu}`);
    if (mainProcess.time)
      mainDisplay.push(`time: ${mainProcess.time})`);
    if (mainProcess.ram) {
      mainDisplay.push(`RAM: ${mainProcess.ram}`);
    }
    if (mainDisplay.length)
      buf += ` (${mainDisplay.join(", ")})`;
    buf += `<br /><br /><strong>Process managers:</strong><br />`;
    processes.delete(`${process.pid}`);
    for (const manager of import_lib.ProcessManager.processManagers) {
      for (const [i, process2] of manager.processes.entries()) {
        const pid = process2.getProcess().pid;
        let managerName = manager.basename;
        if (managerName.startsWith("index.")) {
          managerName = manager.filename.split(path.sep).slice(-2).join(path.sep);
        }
        buf += `<strong>${pid}</strong> - ${managerName} ${i} (load ${process2.getLoad()}`;
        const info = processes.get(`${pid}`);
        const display = [];
        if (info.cpu)
          display.push(`CPU: ${info.cpu}`);
        if (info.time)
          display.push(`time: ${info.time}`);
        if (info.ram)
          display.push(`RAM: ${info.ram}`);
        if (display.length)
          buf += `, ${display.join(", ")})`;
        buf += `<br />`;
        processes.delete(`${pid}`);
      }
      for (const [i, process2] of manager.releasingProcesses.entries()) {
        const pid = process2.getProcess().pid;
        buf += `<strong>${pid}</strong> - PENDING RELEASE ${manager.basename} ${i} (load ${process2.getLoad()}`;
        const info = processes.get(`${pid}`);
        if (info) {
          const display = [];
          if (info.cpu)
            display.push(`CPU: ${info.cpu}`);
          if (info.time)
            display.push(`time: ${info.time}`);
          if (info.ram)
            display.push(`RAM: ${info.ram}`);
          if (display.length)
            buf += `, ${display.join(", ")})`;
        }
        buf += `<br />`;
        processes.delete(`${pid}`);
      }
    }
    buf += `<br />`;
    buf += `<details class="readmore"><summary><strong>Other processes:</strong></summary>`;
    for (const [pid, info] of processes) {
      buf += `<strong>${pid}</strong> - <code>${info.cmd}</code>`;
      const display = [];
      if (info.cpu)
        display.push(`CPU: ${info.cpu}`);
      if (info.time)
        display.push(`time: ${info.time}`);
      if (info.ram)
        display.push(`RAM: ${info.ram}`);
      if (display.length)
        buf += `(${display.join(", ")})`;
      buf += `<br />`;
    }
    buf += `</details>`;
    this.sendReplyBox(buf);
  },
  processeshelp: [
    `/processes - Get information about the running processes on the server. Requires: &.`
  ],
  async savelearnsets(target2, room2, user2, connection2) {
    this.canUseConsole();
    this.sendReply("saving...");
    await (0, import_lib.FS)("data/learnsets.js").write(`'use strict';

exports.Learnsets = {
` + Object.entries(Dex.data.Learnsets).map(([id, entry]) => `	${id}: {learnset: {
` + import_lib.Utils.sortBy(
      Object.entries(Dex.species.getLearnsetData(id).learnset),
      ([moveid]) => moveid
    ).map(([moveid, sources]) => `		${moveid}: ["` + sources.join(`", "`) + `"],
`).join("") + `	}},
`).join("") + `};
`);
    this.sendReply("learnsets.js saved.");
  },
  savelearnsetshelp: [
    `/savelearnsets - Saves the learnset list currently active on the server. Requires: &`
  ],
  toggleripgrep(target2, room2, user2) {
    this.checkCan("rangeban");
    Config.disableripgrep = !Config.disableripgrep;
    this.addGlobalModAction(`${user2.name} ${Config.disableripgrep ? "disabled" : "enabled"} Ripgrep-related functionality.`);
  },
  toggleripgrephelp: [`/toggleripgrep - Disable/enable all functionality depending on Ripgrep. Requires: &`],
  disablecommand(target2, room2, user2) {
    this.checkCan("makeroom");
    if (!toID(target2)) {
      return this.parse(`/help disablecommand`);
    }
    if (["!", "/"].some((c) => target2.startsWith(c)))
      target2 = target2.slice(1);
    const parsed = Chat.parseCommand(`/${target2}`);
    if (!parsed) {
      return this.errorReply(`Command "/${target2}" is in an invalid format.`);
    }
    const { handler, fullCmd } = parsed;
    if (!handler) {
      return this.errorReply(`Command "/${target2}" not found.`);
    }
    if (handler.disabled) {
      return this.errorReply(`Command "/${target2}" is already disabled`);
    }
    handler.disabled = true;
    this.addGlobalModAction(`${user2.name} disabled the command /${fullCmd}.`);
    this.globalModlog(`DISABLECOMMAND`, null, target2);
  },
  disablecommandhelp: [`/disablecommand [command] - Disables the given [command]. Requires: &`],
  widendatacenters: "adddatacenters",
  adddatacenters() {
    this.errorReply("This command has been replaced by /datacenter add");
    return this.parse("/help datacenters");
  },
  disableladder(target2, room2, user2) {
    this.checkCan("disableladder");
    if (Ladders.disabled) {
      return this.errorReply(`/disableladder - Ladder is already disabled.`);
    }
    Ladders.disabled = true;
    this.modlog(`DISABLELADDER`);
    Monitor.log(`The ladder was disabled by ${user2.name}.`);
    const innerHTML = `<b>Due to technical difficulties, the ladder has been temporarily disabled.</b><br />Rated games will no longer update the ladder. It will be back momentarily.`;
    for (const curRoom of Rooms.rooms.values()) {
      if (curRoom.type === "battle")
        curRoom.rated = 0;
      curRoom.addRaw(`<div class="broadcast-red">${innerHTML}</div>`).update();
    }
    for (const u of Users.users.values()) {
      if (u.connected)
        u.send(`|pm|&|${u.tempGroup}${u.name}|/raw <div class="broadcast-red">${innerHTML}</div>`);
    }
  },
  disableladderhelp: [`/disableladder - Stops all rated battles from updating the ladder. Requires: &`],
  enableladder(target2, room2, user2) {
    this.checkCan("disableladder");
    if (!Ladders.disabled) {
      return this.errorReply(`/enable - Ladder is already enabled.`);
    }
    Ladders.disabled = false;
    this.modlog("ENABLELADDER");
    Monitor.log(`The ladder was enabled by ${user2.name}.`);
    const innerHTML = `<b>The ladder is now back.</b><br />Rated games will update the ladder now..`;
    for (const curRoom of Rooms.rooms.values()) {
      curRoom.addRaw(`<div class="broadcast-green">${innerHTML}</div>`).update();
    }
    for (const u of Users.users.values()) {
      if (u.connected)
        u.send(`|pm|&|${u.tempGroup}${u.name}|/raw <div class="broadcast-green">${innerHTML}</div>`);
    }
  },
  enableladderhelp: [`/enable - Allows all rated games to update the ladder. Requires: &`],
  lockdown(target2, room2, user2) {
    this.checkCan("lockdown");
    const disabledCommands = Chat.allCommands().filter((c) => c.disabled).map((c) => `/${c.fullCmd}`);
    if (disabledCommands.length) {
      this.sendReply(`${Chat.count(disabledCommands.length, "commands")} are disabled right now.`);
      this.sendReply(`Be aware that restarting will re-enable them.`);
      this.sendReply(`Currently disabled: ${disabledCommands.join(", ")}`);
    }
    Rooms.global.startLockdown();
    this.stafflog(`${user2.name} used /lockdown`);
  },
  lockdownhelp: [
    `/lockdown - locks down the server, which prevents new battles from starting so that the server can eventually be restarted. Requires: &`
  ],
  autolockdown: "autolockdownkill",
  autolockdownkill(target2, room2, user2) {
    this.checkCan("lockdown");
    if (Config.autolockdown === void 0)
      Config.autolockdown = true;
    if (this.meansYes(target2)) {
      if (Config.autolockdown) {
        return this.errorReply("The server is already set to automatically kill itself upon the final battle finishing.");
      }
      Config.autolockdown = true;
      this.privateGlobalModAction(`${user2.name} used /autolockdownkill on (autokill on final battle finishing)`);
    } else if (this.meansNo(target2)) {
      if (!Config.autolockdown) {
        return this.errorReply("The server is already set to not automatically kill itself upon the final battle finishing.");
      }
      Config.autolockdown = false;
      this.privateGlobalModAction(`${user2.name} used /autolockdownkill off (no autokill on final battle finishing)`);
    } else {
      return this.parse("/help autolockdownkill");
    }
  },
  autolockdownkillhelp: [
    `/autolockdownkill on - Turns on the setting to enable the server to automatically kill itself upon the final battle finishing. Requires &`,
    `/autolockdownkill off - Turns off the setting to enable the server to automatically kill itself upon the final battle finishing. Requires &`
  ],
  prelockdown(target2, room2, user2) {
    this.checkCan("lockdown");
    Rooms.global.lockdown = "pre";
    this.privateGlobalModAction(`${user2.name} used /prelockdown (disabled tournaments in preparation for server restart)`);
  },
  prelockdownhelp: [`/prelockdown - Prevents new tournaments from starting so that the server can be restarted. Requires: &`],
  slowlockdown(target2, room2, user2) {
    this.checkCan("lockdown");
    Rooms.global.startLockdown(void 0, true);
    this.privateGlobalModAction(`${user2.name} used /slowlockdown (lockdown without auto-restart)`);
  },
  slowlockdownhelp: [
    `/slowlockdown - Locks down the server, but disables the automatic restart after all battles end.`,
    `Requires: &`
  ],
  crashfixed: "endlockdown",
  endlockdown(target2, room2, user2, connection2, cmd) {
    this.checkCan("lockdown");
    if (!Rooms.global.lockdown) {
      return this.errorReply("We're not under lockdown right now.");
    }
    if (Rooms.global.lockdown !== true && cmd === "crashfixed") {
      return this.errorReply("/crashfixed - There is no active crash.");
    }
    const message = cmd === "crashfixed" ? `<div class="broadcast-green"><b>We fixed the crash without restarting the server!</b></div>` : `<div class="broadcast-green"><b>The server restart was canceled.</b></div>`;
    if (Rooms.global.lockdown === true) {
      for (const curRoom of Rooms.rooms.values()) {
        curRoom.addRaw(message).update();
      }
      for (const curUser of Users.users.values()) {
        curUser.send(`|pm|&|${curUser.tempGroup}${curUser.name}|/raw ${message}`);
      }
    } else {
      this.sendReply("Preparation for the server shutdown was canceled.");
    }
    Rooms.global.lockdown = false;
    this.stafflog(`${user2.name} used /endlockdown`);
  },
  endlockdownhelp: [
    `/endlockdown - Cancels the server restart and takes the server out of lockdown state. Requires: &`,
    `/crashfixed - Ends the active lockdown caused by a crash without the need of a restart. Requires: &`
  ],
  emergency(target2, room2, user2) {
    this.checkCan("lockdown");
    if (Config.emergency) {
      return this.errorReply("We're already in emergency mode.");
    }
    Config.emergency = true;
    for (const curRoom of Rooms.rooms.values()) {
      curRoom.addRaw(`<div class="broadcast-red">The server has entered emergency mode. Some features might be disabled or limited.</div>`).update();
    }
    this.stafflog(`${user2.name} used /emergency.`);
  },
  emergencyhelp: [
    `/emergency - Turns on emergency mode and enables extra logging. Requires: &`
  ],
  endemergency(target2, room2, user2) {
    this.checkCan("lockdown");
    if (!Config.emergency) {
      return this.errorReply("We're not in emergency mode.");
    }
    Config.emergency = false;
    for (const curRoom of Rooms.rooms.values()) {
      curRoom.addRaw(`<div class="broadcast-green"><b>The server is no longer in emergency mode.</b></div>`).update();
    }
    this.stafflog(`${user2.name} used /endemergency.`);
  },
  endemergencyhelp: [
    `/endemergency - Turns off emergency mode. Requires: &`
  ],
  remainingbattles() {
    this.checkCan("lockdown");
    if (!Rooms.global.lockdown) {
      return this.errorReply("The server is not under lockdown right now.");
    }
    const battleRooms = [...Rooms.rooms.values()].filter((x) => x.battle?.rated && !x.battle?.ended);
    let buf = `Total remaining rated battles: <b>${battleRooms.length}</b>`;
    if (battleRooms.length > 10)
      buf += `<details><summary>View all battles</summary>`;
    for (const battle2 of battleRooms) {
      buf += `<br />`;
      buf += `<a href="${battle2.roomid}">${battle2.title}</a>`;
      if (battle2.settings.isPrivate)
        buf += " (Private)";
    }
    if (battleRooms.length > 10)
      buf += `</details>`;
    this.sendReplyBox(buf);
  },
  remainingbattleshelp: [
    `/remainingbattles - View a list of the remaining battles during lockdown. Requires: &`
  ],
  async savebattles(target2, room2, user2) {
    this.checkCan("rangeban");
    this.sendReply(`Saving battles...`);
    const count = await Rooms.global.saveBattles();
    this.sendReply(`DONE.`);
    this.sendReply(`${count} battles saved.`);
    this.addModAction(`${user2.name} used /savebattles`);
  },
  async kill(target2, room2, user2) {
    this.checkCan("lockdown");
    let noSave = toID(target2) === "nosave";
    if (!Config.usepostgres)
      noSave = true;
    if (Rooms.global.lockdown !== true && noSave) {
      return this.errorReply("For safety reasons, using /kill without saving battles can only be done during lockdown.");
    }
    if (Monitor.updateServerLock) {
      return this.errorReply("Wait for /updateserver to finish before using /kill.");
    }
    if (!noSave) {
      this.sendReply("Saving battles...");
      Rooms.global.lockdown = true;
      for (const u of Users.users.values()) {
        u.send(
          `|pm|&|${u.getIdentity()}|/raw <div class="broadcast-red"><b>The server is restarting soon.</b><br />While battles are being saved, no more can be started. If you're in a battle, it will be paused during saving.<br />After the restart, you will be able to resume your battles from where you left off.`
        );
      }
      const count = await Rooms.global.saveBattles();
      this.sendReply(`DONE.`);
      this.sendReply(`${count} battles saved.`);
    }
    const logRoom2 = Rooms.get("staff") || Rooms.lobby || room2;
    if (!logRoom2?.log.roomlogStream)
      return process.exit();
    logRoom2.roomlog(`${user2.name} used /kill`);
    void logRoom2.log.roomlogStream.writeEnd().then(() => {
      process.exit();
    });
    setTimeout(() => {
      process.exit();
    }, 1e4);
  },
  killhelp: [
    `/kill - kills the server. Use the argument \`nosave\` to prevent the saving of battles.`,
    ` If this argument is used, the server must be in lockdown. Requires: &`
  ],
  loadbanlist(target2, room2, user2, connection2) {
    this.checkCan("lockdown");
    connection2.sendTo(room2, "Loading ipbans.txt...");
    Punishments.loadBanlist().then(
      () => connection2.sendTo(room2, "ipbans.txt has been reloaded."),
      (error) => connection2.sendTo(room2, `Something went wrong while loading ipbans.txt: ${error}`)
    );
  },
  loadbanlisthelp: [
    `/loadbanlist - Loads the bans located at ipbans.txt. The command is executed automatically at startup. Requires: &`
  ],
  refreshpage(target2, room2, user2) {
    this.checkCan("lockdown");
    if (user2.lastCommand !== "refreshpage") {
      user2.lastCommand = "refreshpage";
      this.errorReply(`Are you sure you wish to refresh the page for every user online?`);
      return this.errorReply(`If you are sure, please type /refreshpage again to confirm.`);
    }
    Rooms.global.sendAll("|refresh|");
    this.stafflog(`${user2.name} used /refreshpage`);
  },
  refreshpagehelp: [
    `/refreshpage - refreshes the page for every user online. Requires: &`
  ],
  async updateserver(target2, room2, user2, connection2) {
    this.canUseConsole();
    if (Monitor.updateServerLock) {
      return this.errorReply(`/updateserver - Another update is already in progress (or a previous update crashed).`);
    }
    const validPrivateCodePath = Config.privatecodepath && path.isAbsolute(Config.privatecodepath);
    target2 = toID(target2);
    Monitor.updateServerLock = true;
    let success = true;
    if (target2 === "private") {
      if (!validPrivateCodePath) {
        Monitor.updateServerLock = false;
        throw new Chat.ErrorMessage("`Config.privatecodepath` must be set to an absolute path before using /updateserver private.");
      }
      success = await updateserver(this, Config.privatecodepath);
      this.addGlobalModAction(`${user2.name} used /updateserver private`);
    } else {
      if (target2 !== "public" && validPrivateCodePath) {
        success = await updateserver(this, Config.privatecodepath);
      }
      success = success && await updateserver(this, import_lib.FS.ROOT_PATH);
      this.addGlobalModAction(`${user2.name} used /updateserver${target2 === "public" ? " public" : ""}`);
    }
    this.sendReply(success ? `DONE` : `FAILED, old changes restored.`);
    Monitor.updateServerLock = false;
  },
  updateserverhelp: [
    `/updateserver - Updates the server's code from its Git repository, including private code if present. Requires: console access`,
    `/updateserver private - Updates only the server's private code. Requires: console access`
  ],
  async updateloginserver(target2, room2, user2) {
    this.canUseConsole();
    this.sendReply("Restarting...");
    const [result2, err] = await LoginServer.request("restart");
    if (err) {
      Rooms.global.notifyRooms(
        ["staff", "development"],
        `|c|${user2.getIdentity()}|/log ${user2.name} used /updateloginserver - but something failed while updating.`
      );
      return this.errorReply(err.message + "\n" + err.stack);
    }
    if (!result2)
      return this.errorReply("No result received.");
    this.stafflog(`[o] ${result2.success || ""} [e] ${result2.actionerror || ""}`);
    if (result2.actionerror) {
      return this.errorReply(result2.actionerror);
    }
    let message = `${user2.name} used /updateloginserver`;
    if (result2.updated) {
      this.sendReply(`DONE. Server updated and restarted.`);
    } else {
      message += ` - but something failed while updating.`;
      this.errorReply(`FAILED. Conflicts were found while updating - the restart was aborted.`);
    }
    Rooms.global.notifyRooms(
      ["staff", "development"],
      `|c|${user2.getIdentity()}|/log ${message}`
    );
  },
  updateloginserverhelp: [
    `/updateloginserver - Updates and restarts the loginserver. Requires: console access`
  ],
  async updateclient(target2, room2, user2) {
    this.canUseConsole();
    this.sendReply("Restarting...");
    const [result2, err] = await LoginServer.request("rebuildclient", {
      full: toID(target2) === "full"
    });
    if (err) {
      Rooms.global.notifyRooms(
        ["staff", "development"],
        `|c|${user2.getIdentity()}|/log ${user2.name} used /updateclient - but something failed while updating.`
      );
      return this.errorReply(err.message + "\n" + err.stack);
    }
    if (!result2)
      return this.errorReply("No result received.");
    this.stafflog(`[o] ${result2.success || ""} [e] ${result2.actionerror || ""}`);
    if (result2.actionerror) {
      return this.errorReply(result2.actionerror);
    }
    let message = `${user2.name} used /updateclient`;
    if (result2.updated) {
      this.sendReply(`DONE. Client updated.`);
    } else {
      message += ` - but something failed while updating.`;
      this.errorReply(`FAILED. Conflicts were found while updating.`);
    }
    Rooms.global.notifyRooms(
      ["staff", "development"],
      `|c|${user2.getIdentity()}|/log ${message}`
    );
  },
  updateclienthelp: [
    `/updateclient [full] - Update the client source code. Provide the argument 'full' to make it a full rebuild.`,
    `Requires: & console access`
  ],
  async rebuild() {
    this.canUseConsole();
    const [, , stderr] = await bash("node ./build", this);
    if (stderr) {
      throw new Chat.ErrorMessage(`Crash while rebuilding: ${stderr}`);
    }
    this.sendReply("Rebuilt.");
  },
  /*********************************************************
   * Low-level administration commands
   *********************************************************/
  async bash(target2, room2, user2, connection2) {
    this.canUseConsole();
    if (!target2)
      return this.parse("/help bash");
    this.sendReply(`$ ${target2}`);
    const [, stdout, stderr] = await bash(target2, this);
    this.runBroadcast();
    this.sendReply(`${stdout}${stderr}`);
  },
  bashhelp: [`/bash [command] - Executes a bash command on the server. Requires: & console access`],
  async eval(target, room, user, connection) {
    this.canUseConsole();
    if (!this.runBroadcast(true))
      return;
    const logRoom = Rooms.get("upperstaff") || Rooms.get("staff");
    if (this.message.startsWith(">>") && room) {
      this.broadcasting = true;
      this.broadcastToRoom = true;
    }
    const generateHTML = (direction, contents) => `<table border="0" cellspacing="0" cellpadding="0"><tr><td valign="top">` + import_lib.Utils.escapeHTML(direction).repeat(2) + `&nbsp;</td><td>${Chat.getReadmoreCodeBlock(contents)}</td></tr><table>`;
    this.sendReply(`|html|${generateHTML(">", target)}`);
    logRoom?.roomlog(`>> ${target}`);
    let uhtmlId = null;
    try {
      const battle = room?.battle;
      const me = user;
      let result = eval(target);
      if (result?.then) {
        uhtmlId = `eval-${Date.now().toString().slice(-6)}-${Math.random().toFixed(6).slice(-6)}`;
        this.sendReply(`|uhtml|${uhtmlId}|${generateHTML("<", "Promise pending")}`);
        this.update();
        result = `Promise -> ${import_lib.Utils.visualize(await result)}`;
        this.sendReply(`|uhtmlchange|${uhtmlId}|${generateHTML("<", result)}`);
      } else {
        result = import_lib.Utils.visualize(result);
        this.sendReply(`|html|${generateHTML("<", result)}`);
      }
      logRoom?.roomlog(`<< ${result}`);
    } catch (e) {
      const message = ("" + e.stack).replace(/\n *at CommandContext\.eval [\s\S]*/m, "");
      const command = uhtmlId ? `|uhtmlchange|${uhtmlId}|` : "|html|";
      this.sendReply(`${command}${generateHTML("<", message)}`);
      logRoom?.roomlog(`<< ${message}`);
    }
  },
  evalhelp: [
    `/eval [code] - Evaluates the code given and shows results. Requires: & console access.`
  ],
  async evalsql(target2, room2) {
    this.canUseConsole();
    this.runBroadcast(true);
    if (!Config.usesqlite)
      return this.errorReply(`SQLite is disabled.`);
    const logRoom2 = Rooms.get("upperstaff") || Rooms.get("staff");
    if (!target2)
      return this.errorReply(`Specify a database to access and a query.`);
    const [db, query] = import_lib.Utils.splitFirst(target2, ",").map((item) => item.trim());
    if (!(0, import_lib.FS)("./databases").readdirSync().includes(`${db}.db`)) {
      return this.errorReply(`The database file ${db}.db was not found.`);
    }
    if (room2 && this.message.startsWith(">>sql")) {
      this.broadcasting = true;
      this.broadcastToRoom = true;
    }
    this.sendReply(
      `|html|<table border="0" cellspacing="0" cellpadding="0"><tr><td valign="top">SQLite&gt; [${db}.db] &nbsp;</td><td>${Chat.getReadmoreCodeBlock(query)}</td></tr><table>`
    );
    logRoom2?.roomlog(`SQLite> ${target2}`);
    const database = (0, import_lib.SQL)(module, {
      file: `./databases/${db}.db`,
      onError(err) {
        return { err: err.message, stack: err.stack };
      }
    });
    function formatResult(result3) {
      if (!Array.isArray(result3)) {
        return `<table border="0" cellspacing="0" cellpadding="0"><tr><td valign="top">SQLite&lt;&nbsp;</td><td>${Chat.getReadmoreCodeBlock(result3)}</td></tr><table>`;
      }
      let buffer = '<div class="ladder pad" style="overflow-x: auto;"><table><tr><th>';
      if (!result3.length) {
        buffer += `No data in table.</th></tr>`;
        return buffer;
      }
      buffer += Object.keys(result3[0]).join("</th><th>");
      buffer += `</th></tr><tr>`;
      buffer += result3.map((item) => `<td>${Object.values(item).map((val) => import_lib.Utils.escapeHTML(val)).join("</td><td>")}</td>`).join("</tr><tr>");
      buffer += `</tr></table></div>`;
      return buffer;
    }
    function parseError(res) {
      const err = new Error(res.err);
      err.stack = res.stack;
      throw err;
    }
    let result2;
    try {
      result2 = await database.all(query, []);
      if (result2.err)
        parseError(result2);
    } catch (err) {
      if (err.stack?.includes(`Use run() instead`)) {
        try {
          result2 = await database.run(query, []);
          if (result2.err)
            parseError(result2);
          result2 = import_lib.Utils.visualize(result2);
        } catch (e) {
          result2 = ("" + e.stack).replace(/\n *at CommandContext\.evalsql [\s\S]*/m, "");
        }
      } else {
        result2 = ("" + err.stack).replace(/\n *at CommandContext\.evalsql [\s\S]*/m, "");
      }
    }
    await database.destroy();
    const formattedResult = `|html|${formatResult(result2)}`;
    logRoom2?.roomlog(formattedResult);
    this.sendReply(formattedResult);
  },
  evalsqlhelp: [
    `/evalsql [database], [query] - Evaluates the given SQL [query] in the given [database].`,
    `Requires: & console access`
  ],
  evalbattle(target2, room2, user2, connection2) {
    room2 = this.requireRoom();
    this.canUseConsole();
    if (!this.runBroadcast(true))
      return;
    if (!room2.battle) {
      return this.errorReply("/evalbattle - This isn't a battle room.");
    }
    void room2.battle.stream.write(`>eval ${target2.replace(/\n/g, "\f")}`);
  },
  evalbattlehelp: [
    `/evalbattle [code] - Evaluates the code in the battle stream of the current room. Requires: & console access.`
  ],
  ebat: "editbattle",
  editbattle(target2, room2, user2) {
    room2 = this.requireRoom();
    this.checkCan("forcewin");
    if (!target2)
      return this.parse("/help editbattle");
    if (!room2.battle) {
      this.errorReply("/editbattle - This is not a battle room.");
      return false;
    }
    const battle2 = room2.battle;
    let cmd;
    [cmd, target2] = import_lib.Utils.splitFirst(target2, " ");
    if (cmd.endsWith(","))
      cmd = cmd.slice(0, -1);
    const targets = target2.split(",");
    if (targets.length === 1 && targets[0] === "")
      targets.pop();
    let player, pokemon, move, stat, value;
    switch (cmd) {
      case "hp":
      case "h":
        if (targets.length !== 3) {
          this.errorReply("Incorrect command use");
          return this.parse("/help editbattle");
        }
        [player, pokemon, value] = targets.map((f) => f.trim());
        [player, pokemon] = [player, pokemon].map(toID);
        void battle2.stream.write(
          `>eval let p=pokemon('${player}', '${pokemon}');p.sethp(${parseInt(value)});if (p.isActive)battle.add('-damage',p,p.getHealth);`
        );
        break;
      case "status":
      case "s":
        if (targets.length !== 3) {
          this.errorReply("Incorrect command use");
          return this.parse("/help editbattle");
        }
        [player, pokemon, value] = targets.map(toID);
        void battle2.stream.write(
          `>eval let pl=player('${player}');let p=pokemon(pl,'${pokemon}');p.setStatus('${value}');if (!p.isActive){battle.add('','please ignore the above');battle.add('-status',pl.active[0],pl.active[0].status,'[silent]');}`
        );
        break;
      case "pp":
        if (targets.length !== 4) {
          this.errorReply("Incorrect command use");
          return this.parse("/help editbattle");
        }
        [player, pokemon, move, value] = targets.map((f) => f.trim());
        [player, pokemon, move] = [player, pokemon, move].map(toID);
        void battle2.stream.write(
          `>eval pokemon('${player}','${pokemon}').getMoveData('${move}').pp = ${parseInt(value)};`
        );
        break;
      case "boost":
      case "b":
        if (targets.length !== 4) {
          this.errorReply("Incorrect command use");
          return this.parse("/help editbattle");
        }
        [player, pokemon, stat, value] = targets.map((f) => f.trim());
        [player, pokemon, stat] = [player, pokemon, stat].map(toID);
        void battle2.stream.write(
          `>eval let p=pokemon('${player}','${pokemon}');battle.boost({${stat}:${parseInt(value)}},p)`
        );
        break;
      case "volatile":
      case "v":
        if (targets.length !== 3) {
          this.errorReply("Incorrect command use");
          return this.parse("/help editbattle");
        }
        [player, pokemon, value] = targets.map(toID);
        void battle2.stream.write(
          `>eval pokemon('${player}','${pokemon}').addVolatile('${value}')`
        );
        break;
      case "sidecondition":
      case "sc":
        if (targets.length !== 2) {
          this.errorReply("Incorrect command use");
          return this.parse("/help editbattle");
        }
        [player, value] = targets.map(toID);
        void battle2.stream.write(`>eval player('${player}').addSideCondition('${value}', 'debug')`);
        break;
      case "fieldcondition":
      case "pseudoweather":
      case "fc":
        if (targets.length !== 1) {
          this.errorReply("Incorrect command use");
          return this.parse("/help editbattle");
        }
        [value] = targets.map(toID);
        void battle2.stream.write(`>eval battle.field.addPseudoWeather('${value}', 'debug')`);
        break;
      case "weather":
      case "w":
        if (targets.length !== 1) {
          this.errorReply("Incorrect command use");
          return this.parse("/help editbattle");
        }
        [value] = targets.map(toID);
        void battle2.stream.write(`>eval battle.field.setWeather('${value}', 'debug')`);
        break;
      case "terrain":
      case "t":
        if (targets.length !== 1) {
          this.errorReply("Incorrect command use");
          return this.parse("/help editbattle");
        }
        [value] = targets.map(toID);
        void battle2.stream.write(`>eval battle.field.setTerrain('${value}', 'debug')`);
        break;
      case "reseed":
        if (targets.length !== 0) {
          if (targets.length !== 4) {
            this.errorReply("Seed must have 4 parts");
            return this.parse("/help editbattle");
          }
          if (!targets.every((val) => /^[0-9]{1,5}$/.test(val))) {
            this.errorReply("Seed parts much be unsigned 16-bit integers");
            return this.parse("/help editbattle");
          }
        }
        void battle2.stream.write(`>reseed ${targets.join(",")}`);
        if (targets.length)
          this.sendReply(`Reseeded to ${targets.join(",")}`);
        break;
      default:
        this.errorReply(`Unknown editbattle command: ${cmd}`);
        return this.parse("/help editbattle");
    }
  },
  editbattlehelp: [
    `/editbattle hp [player], [pokemon], [hp]`,
    `/editbattle status [player], [pokemon], [status]`,
    `/editbattle pp [player], [pokemon], [move], [pp]`,
    `/editbattle boost [player], [pokemon], [stat], [amount]`,
    `/editbattle volatile [player], [pokemon], [volatile]`,
    `/editbattle sidecondition [player], [sidecondition]`,
    `/editbattle fieldcondition [fieldcondition]`,
    `/editbattle weather [weather]`,
    `/editbattle terrain [terrain]`,
    `/editbattle reseed [optional seed]`,
    `Short forms: /ebat h OR s OR pp OR b OR v OR sc OR fc OR w OR t`,
    `[player] must be a username or number, [pokemon] must be species name or party slot number (not nickname), [move] must be move name.`
  ]
};
const pages = {
  bot(args, user2, connection2) {
    const [botid, ...pageArgs] = args;
    const pageid = pageArgs.join("-");
    if (pageid.length > 300) {
      return this.errorReply(`The page ID specified is too long.`);
    }
    const bot = Users.get(botid);
    if (!bot) {
      return `<div class="pad"><h2>The bot "${bot}" is not available.</h2></div>`;
    }
    let canSend = Users.globalAuth.get(bot) === "*";
    let room2;
    for (const curRoom of Rooms.global.chatRooms) {
      if (["*", "#"].includes(curRoom.auth.getDirect(bot.id))) {
        canSend = true;
        room2 = curRoom;
      }
    }
    if (!canSend) {
      return `<div class="pad"><h2>"${bot}" is not a bot.</h2></div>`;
    }
    connection2.lastRequestedPage = `${bot.id}-${pageid}`;
    bot.sendTo(
      room2 ? room2.roomid : "lobby",
      `|pm|${user2.getIdentity()}|${bot.getIdentity()}||requestpage|${user2.name}|${pageid}`
    );
  }
};
//# sourceMappingURL=admin.js.map
