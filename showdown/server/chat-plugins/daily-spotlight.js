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
var daily_spotlight_exports = {};
__export(daily_spotlight_exports, {
  commands: () => commands,
  destroy: () => destroy,
  handlers: () => handlers,
  pages: () => pages,
  renderSpotlight: () => renderSpotlight,
  spotlights: () => spotlights
});
module.exports = __toCommonJS(daily_spotlight_exports);
var import_lib = require("../../lib");
const DAY = 24 * 60 * 60 * 1e3;
const SPOTLIGHT_FILE = "config/chat-plugins/spotlights.json";
const NUMBER_REGEX = /^\s*[0-9]+\s*$/;
let spotlights = {};
try {
  spotlights = JSON.parse((0, import_lib.FS)(SPOTLIGHT_FILE).readIfExistsSync() || "{}");
  for (const roomid in spotlights) {
    for (const k in spotlights[roomid]) {
      for (const spotlight of spotlights[roomid][k]) {
        if (!spotlight.time) {
          spotlight.time = Date.now();
        }
      }
    }
  }
} catch (e) {
  if (e.code !== "MODULE_NOT_FOUND" && e.code !== "ENOENT")
    throw e;
}
if (!spotlights || typeof spotlights !== "object")
  spotlights = {};
function saveSpotlights() {
  (0, import_lib.FS)(SPOTLIGHT_FILE).writeUpdate(() => JSON.stringify(spotlights));
}
function nextDaily() {
  for (const roomid in spotlights) {
    for (const key in spotlights[roomid]) {
      if (spotlights[roomid][key].length > 1) {
        spotlights[roomid][key].shift();
      }
    }
  }
  saveSpotlights();
  timeout = setTimeout(nextDaily, DAY);
}
const midnight = new Date();
midnight.setHours(24, 0, 0, 0);
let timeout = setTimeout(nextDaily, midnight.valueOf() - Date.now());
async function renderSpotlight(roomid, key, index) {
  let imgHTML = "";
  const { image, description } = spotlights[roomid][key][index];
  if (image) {
    if (Array.isArray(image)) {
      imgHTML = `<td><img src="${image[0]}" width="${image[1]}" height="${image[2]}" style="vertical-align:middle;"></td>`;
    } else {
      try {
        const [width, height] = await Chat.fitImage(image, 150, 300);
        imgHTML = `<td><img src="${image}" width="${width}" height="${height}" style="vertical-align:middle;"></td>`;
        spotlights[roomid][key][index].image = [image, width, height];
      } catch {
      }
    }
  }
  return `<table style="text-align:center;margin:auto"><tr><td style="padding-right:10px;">${Chat.formatText(description, true)}</td>${imgHTML}</tr></table>`;
}
const destroy = () => clearTimeout(timeout);
const pages = {
  async spotlights(query, user, connection) {
    this.title = "Daily Spotlights";
    const room = this.requireRoom();
    query.shift();
    const sortType = toID(query.shift());
    if (sortType && !["time", "alphabet"].includes(sortType)) {
      return this.errorReply(`Invalid sorting type '${sortType}' - must be either 'time', 'alphabet', or not provided.`);
    }
    let buf = `<div class="pad ladder">`;
    buf += `<div class="pad">`;
    buf += `<button style="float:right;" class="button" name="send" value="/join view-spotlights-${room.roomid}${sortType ? "-" + sortType : ""}">`;
    buf += `<i class="fa fa-refresh"></i> Refresh</button>`;
    buf += `<h2>Daily Spotlights</h2>`;
    if (sortType) {
      let title = "";
      switch (sortType) {
        case "time":
          title = "latest time updated";
          break;
        default:
          title = "alphabetical";
          break;
      }
      buf += `(sorted by ${title})<br />`;
    }
    if (!spotlights[room.roomid]) {
      buf += `<p>This room has no daily spotlights.</p></div>`;
    } else {
      const sortedKeys = import_lib.Utils.sortBy(Object.keys(spotlights[room.roomid]), (key) => {
        switch (sortType) {
          case "time": {
            const sortedSpotlights = import_lib.Utils.sortBy(spotlights[room.roomid][key].slice(), (k) => -k.time);
            return -sortedSpotlights[0].time;
          }
          default:
            return key;
        }
      });
      for (const key of sortedKeys) {
        buf += `<table style="margin-bottom:30px;"><th colspan="2"><h3>${key}:</h3></th>`;
        const keys = import_lib.Utils.sortBy(spotlights[room.roomid][key].slice(), (spotlight) => {
          switch (sortType) {
            case "time":
              return -spotlight.time;
            default:
              return spotlight.description;
          }
        });
        for (const [i] of keys.entries()) {
          const html = await renderSpotlight(room.roomid, key, i);
          buf += `<tr><td>${i ? i : "Current"}</td><td>${html}</td></tr>`;
          if (!user.can("announce", null, room))
            break;
        }
        buf += "</table>";
      }
    }
    return buf;
  }
};
const commands = {
  removedaily(target, room, user) {
    room = this.requireRoom();
    if (!room.persist)
      return this.errorReply("This command is unavailable in temporary rooms.");
    let [key, rest] = target.split(",");
    key = toID(key);
    if (!key)
      return this.parse("/help daily");
    if (!spotlights[room.roomid][key])
      return this.errorReply(`Cannot find a daily spotlight with name '${key}'`);
    this.checkCan("announce", null, room);
    if (rest) {
      const queueNumber = parseInt(rest);
      if (isNaN(queueNumber) || queueNumber < 1)
        return this.errorReply("Invalid queue number");
      if (queueNumber >= spotlights[room.roomid][key].length) {
        return this.errorReply(`Queue number needs to be between 1 and ${spotlights[room.roomid][key].length - 1}`);
      }
      spotlights[room.roomid][key].splice(queueNumber, 1);
      saveSpotlights();
      this.modlog(`DAILY REMOVE`, `${key}[${queueNumber}]`);
      this.privateModAction(
        `${user.name} removed the ${queueNumber}th entry from the queue of the daily spotlight named '${key}'.`
      );
    } else {
      spotlights[room.roomid][key].shift();
      if (!spotlights[room.roomid][key].length) {
        delete spotlights[room.roomid][key];
      }
      saveSpotlights();
      this.modlog(`DAILY REMOVE`, key);
      this.privateModAction(`${user.name} successfully removed the daily spotlight named '${key}'.`);
    }
    Chat.refreshPageFor(`spotlights-${room.roomid}`, room);
  },
  swapdailies: "swapdaily",
  swapdaily(target, room, user) {
    room = this.requireRoom();
    if (!room.persist)
      return this.errorReply("This command is unavailable in temporary rooms.");
    if (!spotlights[room.roomid])
      return this.errorReply("There are no dailies for this room.");
    this.checkCan("announce", null, room);
    const [key, indexStringA, indexStringB] = target.split(",").map((index) => toID(index));
    if (!indexStringB)
      return this.parse("/help daily");
    if (!spotlights[room.roomid][key])
      return this.errorReply(`Cannot find a daily spotlight with name '${key}'`);
    if (!(NUMBER_REGEX.test(indexStringA) && NUMBER_REGEX.test(indexStringB))) {
      return this.errorReply("Queue numbers must be numbers.");
    }
    const indexA = parseInt(indexStringA);
    const indexB = parseInt(indexStringB);
    const queueLength = spotlights[room.roomid][key].length;
    if (indexA < 1 || indexB < 1 || indexA >= queueLength || indexB >= queueLength) {
      return this.errorReply(`Queue numbers must between 1 and the length of the queue (${queueLength}).`);
    }
    const dailyA = spotlights[room.roomid][key][indexA];
    const dailyB = spotlights[room.roomid][key][indexB];
    spotlights[room.roomid][key][indexA] = dailyB;
    spotlights[room.roomid][key][indexB] = dailyA;
    saveSpotlights();
    this.modlog(`DAILY QUEUE SWAP`, key, `${indexA} with ${indexB}`);
    this.privateModAction(`${user.name} swapped the queued dailies for '${key}' at queue numbers ${indexA} and ${indexB}.`);
    Chat.refreshPageFor(`spotlights-${room.roomid}`, room);
  },
  queuedaily: "setdaily",
  queuedailyat: "setdaily",
  replacedaily: "setdaily",
  async setdaily(target, room, user, connection, cmd) {
    room = this.requireRoom();
    if (!room.persist)
      return this.errorReply("This command is unavailable in temporary rooms.");
    let key, indexString, rest;
    if (cmd.endsWith("at") || cmd === "replacedaily") {
      [key, indexString, ...rest] = target.split(",");
    } else {
      [key, ...rest] = target.split(",");
    }
    key = toID(key);
    if (!key)
      return this.parse("/help daily");
    if (key.length > 20)
      return this.errorReply("Spotlight names can be a maximum of 20 characters long.");
    if (key === "constructor")
      return false;
    if (!spotlights[room.roomid])
      spotlights[room.roomid] = {};
    const queueLength = spotlights[room.roomid][key]?.length || 0;
    if (indexString && !NUMBER_REGEX.test(indexString))
      return this.errorReply("The queue number must be a number.");
    const index = indexString ? parseInt(indexString) : queueLength;
    if (indexString && (index < 1 || index > queueLength)) {
      return this.errorReply(`Queue numbers must be between 1 and the length of the queue (${queueLength}).`);
    }
    this.checkCan("announce", null, room);
    if (!rest.length)
      return this.parse("/help daily");
    let img, height, width;
    if (rest[0].trim().startsWith("http://") || rest[0].trim().startsWith("https://")) {
      [img, ...rest] = rest;
      img = img.trim();
      try {
        [width, height] = await Chat.fitImage(img);
      } catch {
        return this.errorReply(`Invalid image url: ${img}`);
      }
    }
    const desc = rest.join(",");
    if (Chat.stripFormatting(desc).length > 500) {
      return this.errorReply("Descriptions can be at most 500 characters long.");
    }
    if (img)
      img = [img, width, height];
    const obj = { image: img, description: desc, time: Date.now() };
    if (!spotlights[room.roomid][key])
      spotlights[room.roomid][key] = [];
    if (cmd === "setdaily") {
      spotlights[room.roomid][key].shift();
      spotlights[room.roomid][key].unshift(obj);
      this.modlog("SETDAILY", key, `${img ? `${img}, ` : ""}${desc}`);
      this.privateModAction(`${user.name} set the daily ${key}.`);
    } else if (cmd === "queuedailyat") {
      spotlights[room.roomid][key].splice(index, 0, obj);
      this.modlog("QUEUEDAILY", key, `queue number ${index}: ${img ? `${img}, ` : ""}${desc}`);
      this.privateModAction(`${user.name} queued a daily ${key} at queue number ${index}.`);
    } else {
      spotlights[room.roomid][key][index] = obj;
      if (indexString) {
        this.modlog("REPLACEDAILY", key, `queue number ${index}: ${img ? `${img}, ` : ""}${desc}`);
        this.privateModAction(`${user.name} replaced the daily ${key} at queue number ${index}.`);
      } else {
        this.modlog("QUEUEDAILY", key, `${img ? `${img}, ` : ""}${desc}`);
        this.privateModAction(`${user.name} queued a daily ${key}.`);
      }
    }
    saveSpotlights();
    Chat.refreshPageFor(`spotlights-${room.roomid}`, room);
  },
  async daily(target, room, user) {
    room = this.requireRoom();
    if (!room.persist)
      return this.errorReply("This command is unavailable in temporary rooms.");
    const key = toID(target);
    if (!key)
      return this.parse("/help daily");
    if (!spotlights[room.roomid]?.[key]) {
      return this.errorReply(`Cannot find a daily spotlight with name '${key}'`);
    }
    if (!this.runBroadcast())
      return;
    const { image, description } = spotlights[room.roomid][key][0];
    const html = await renderSpotlight(room.roomid, key, 0);
    this.sendReplyBox(html);
    if (!this.broadcasting && user.can("ban", null, room, "setdaily")) {
      const code = import_lib.Utils.escapeHTML(description).replace(/\n/g, "<br />");
      this.sendReplyBox(`<details><summary>Source</summary><code style="white-space: pre-wrap; display: table; tab-size: 3">/setdaily ${key},${image ? `${image},` : ""}${code}</code></details>`);
    }
    room.update();
  },
  vsl: "viewspotlights",
  dailies: "viewspotlights",
  viewspotlights(target, room, user) {
    room = this.requireRoom();
    if (!room.persist)
      return this.errorReply("This command is unavailable in temporary rooms.");
    target = toID(target);
    return this.parse(`/join view-spotlights-${room.roomid}${target ? `-${target}` : ""}`);
  },
  dailyhelp() {
    this.sendReply(
      `|html|<details class="readmore"><summary><code>/daily [name]</code>: shows the daily spotlight.<br /><code>!daily [name]</code>: shows the daily spotlight to everyone. Requires: + % @ # &<br /><code>/setdaily [name], [image], [description]</code>: sets the daily spotlight. Image can be left out. Requires: % @ # &</summary><code>/queuedaily [name], [image], [description]</code>: queues a daily spotlight. At midnight, the spotlight with this name will automatically switch to the next queued spotlight. Image can be left out. Requires: % @ # &<br /><code>/queuedailyat [name], [queue number], [image], [description]</code>: inserts a daily spotlight into the queue at the specified number (starting from 1). Requires: % @ # &<br /><code>/replacedaily [name], [queue number], [image], [description]</code>: replaces the daily spotlight queued at the specified number. Requires: % @ # &<br /><code>/removedaily [name][, queue number]</code>: if no queue number is provided, deletes all queued and current spotlights with the given name. If a number is provided, removes a specific future spotlight from the queue. Requires: % @ # &<br /><code>/swapdaily [name], [queue number], [queue number]</code>: swaps the two queued spotlights at the given queue numbers. Requires: % @ # &<br /><code>/viewspotlights [sorter]</code>: shows all current spotlights in the room. For staff, also shows queued spotlights.[sorter] can either be unset, 'time', or 'alphabet'. These sort by either the time added, or alphabetical order.</details>`
    );
  }
};
const handlers = {
  onRenameRoom(oldID, newID) {
    if (spotlights[oldID]) {
      if (!spotlights[newID])
        spotlights[newID] = {};
      Object.assign(spotlights[newID], spotlights[oldID]);
      delete spotlights[oldID];
      saveSpotlights();
    }
  }
};
process.nextTick(() => {
  Chat.multiLinePattern.register("/(queue|set|replace)daily(at | )");
});
//# sourceMappingURL=daily-spotlight.js.map
