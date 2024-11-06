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
var minor_activities_exports = {};
__export(minor_activities_exports, {
  translations: () => translations
});
module.exports = __toCommonJS(minor_activities_exports);
const translations = {
  strings: {
    "The announcement has ended.": "",
    "Battles do not support announcements.": "",
    "You are not allowed to use filtered words in announcements.": "",
    "There is already a poll or announcement in progress in this room.": "",
    "An announcement was started by ${user.name}.": "",
    "There is no announcement running in this room.": "",
    "There is no timer to clear.": "",
    "The announcement timer was turned off.": "",
    "Invalid time given.": "",
    "The announcement timer is off.": "",
    "The announcement was ended by ${user.name}.": "",
    "Accepts the following commands:": "",
    "That option is not selected.": "",
    "You have already voted for this poll.": "",
    "No options selected.": "",
    "you will not be able to vote after viewing results": "",
    "View results": "",
    "You can't vote after viewing results": "",
    "The poll has ended &ndash; scroll down to see the results": "",
    "Vote for ${num}": "",
    "Submit your vote": "",
    "Quiz": "",
    "Poll": "",
    "Submit": "",
    "ended": "",
    "votes": "",
    "delete": "",
    "Poll too long.": "",
    "Battles do not support polls.": "",
    "You are not allowed to use filtered words in polls.": "",
    "Not enough arguments for /poll new.": "",
    "Too many options for poll (maximum is 8).": "",
    "There are duplicate options in the poll.": "",
    "${user.name} queued a poll.": "",
    "A poll was started by ${user.name}.": "",
    "The queue is already empty.": "",
    "Cleared poll queue.": "",
    'Room "${roomid}" not found.': "",
    'Can\'t delete poll at slot ${slotString} - "${slotString}" is not a number.': "",
    "There is no poll in queue at slot ${slot}.": "",
    "(${user.name} deleted the queued poll in slot ${slot}.)": "",
    "There is no poll running in this room.": "",
    "To vote, specify the number of the option.": "",
    "Option not in poll.": "",
    "The poll timer was turned off.": "",
    "The queued poll was started.": "",
    "The poll timer was turned on: the poll will end in ${timeout} minute(s).": "",
    "The poll timer was set to ${timeout} minute(s) by ${user.name}.": "",
    "The poll timer is on and will end in ${poll.timeoutMins} minute(s).": "",
    "The poll timer is off.": "",
    "The poll was ended by ${user.name}.": "",
    "Queued polls:": "",
    "Refresh": "",
    "No polls queued.": "",
    "#${number} in queue": ""
  }
};
//# sourceMappingURL=minor-activities.js.map
