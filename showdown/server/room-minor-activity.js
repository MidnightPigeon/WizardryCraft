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
var room_minor_activity_exports = {};
__export(room_minor_activity_exports, {
  MinorActivity: () => MinorActivity
});
module.exports = __toCommonJS(room_minor_activity_exports);
/**
 * Minor activities
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * Minor activities are representations of non-game activities that rooms
 * regularly use, such as polls and announcements. Rooms are limited to
 * one minor activity at a time.
 *
 * Minor activities keep track of users in the form of userids and IPs.
 * If a player votes for a poll under one IP, they cannot vote for the same
 * poll again.
 *
 * The user-tracking system is not implemented at the base level: Announcements
 * do not have a reason to keep track of users' IPs/IDs because they're just used
 * to broadcast a message to a room.
 *
 * @license MIT
 */
class MinorActivity {
  constructor(room) {
    this.timeout = null;
    this.timeoutMins = 0;
    this.timerEnd = 0;
    this.roomid = room.roomid;
    this.room = room;
    this.supportHTML = false;
  }
  setTimer(options) {
    if (this.timeout)
      clearTimeout(this.timeout);
    this.timeoutMins = options.timeoutMins || 0;
    if (!this.timeoutMins) {
      this.timerEnd = 0;
      this.timeout = null;
      return;
    }
    const now = Date.now();
    this.timerEnd = options.timerEnd || now + this.timeoutMins * 6e4;
    this.timeout = setTimeout(() => {
      const room = this.room;
      if (!room)
        return;
      this.end(room);
    }, this.timerEnd - now);
    this.save();
  }
  end(room, MinorActivityClass) {
    room.minorActivity?.destroy();
    if (room.minorActivityQueue?.length) {
      const pollData = room.minorActivityQueue.shift();
      if (!room.minorActivityQueue.length)
        room.clearMinorActivityQueue();
      if (!room.settings.minorActivityQueue?.length) {
        delete room.settings.minorActivityQueue;
        room.saveSettings();
      }
      if (pollData.activityid !== "poll")
        throw new Error(`Unexpected Minor Activity (${pollData.activityid}) in queue`);
      room.add(`|c|&|/log ${room.tr`The queued poll was started.`}`).update();
      room.modlog({
        action: "POLL",
        note: "(queued)"
      });
      if (!MinorActivityClass) {
        if (pollData.activityid === "poll") {
          const { Poll } = require("./chat-plugins/poll");
          room.setMinorActivity(new Poll(room, pollData));
        }
      } else {
        room.setMinorActivity(new MinorActivityClass(room, pollData));
      }
    }
  }
  endTimer() {
    if (!this.timeout)
      return false;
    clearTimeout(this.timeout);
    this.timeoutMins = 0;
    this.timerEnd = 0;
    return true;
  }
}
//# sourceMappingURL=room-minor-activity.js.map
