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
    "The announcement has ended.": "\u5E7F\u64AD\u5DF2\u7ED3\u675F",
    "Battles do not support announcements.": "\u5BF9\u6218\u91CC\u4E0D\u652F\u6301\u5E7F\u64AD",
    "You are not allowed to use filtered words in announcements.": "\u5E7F\u64AD\u91CC\u4E0D\u80FD\u4F7F\u7528\u88AB\u7981\u7684\u8BCD\u8BED",
    "There is already a poll or announcement in progress in this room.": "\u672C\u623F\u5DF2\u6709\u6295\u7968\u6216\u5E7F\u64AD",
    "An announcement was started by ${user.name}.": "${user.name}\u5F00\u4E86\u4E00\u4E2A\u5E7F\u64AD",
    "There is no announcement running in this room.": "\u672C\u623F\u6CA1\u6709\u5E7F\u64AD",
    "There is no timer to clear.": "\u65E0\u5B9A\u65F6\u5668\u53EF\u4EE5\u5220\u9664",
    "The announcement timer was turned off.": "\u5E7F\u64AD\u5B9A\u65F6\u5668\u5DF2\u88AB\u5173\u95ED",
    "Invalid time given.": "\u6240\u5B9A\u7684\u65F6\u95F4\u65E0\u6548",
    "The announcement timer is off.": "\u5E7F\u64AD\u5B9A\u65F6\u5668\u5DF2\u5173\u95ED",
    "The announcement was ended by ${user.name}.": "\u5E7F\u64AD\u5DF2\u88AB${user.name}\u7EC8\u7ED3",
    "Accepts the following commands:": "\u53EA\u63A5\u53D7\u4E0B\u5217\u7684\u6307\u4EE4",
    "That option is not selected.": "\u6CA1\u6709\u9009\u62E9",
    "You have already voted for this poll.": "\u4F60\u6709\u5DF2\u7ECF\u6295\u7968\u4E86",
    "No options selected.": "\u65E0\u9009\u62E9",
    "you will not be able to vote after viewing results": "\u70B9\u5F00\u7ED3\u679C\u540E\u5C31\u4E0D\u80FD\u518D\u6295\u7968",
    "View results": "\u770B\u7ED3\u679C",
    "You can't vote after viewing results": "\u4F60\u5DF2\u770B\u4E86\u7ED3\u679C\uFF0C\u65E0\u6CD5\u6295\u7968",
    "The poll has ended &ndash; scroll down to see the results": "\u6295\u7968\u7ED3\u675F&ndash;\u7ED3\u8BBA\u5728\u6B64",
    "Vote for ${num}": "\u6295\u7ED9${num}",
    "Submit your vote": "\u63D0\u4EA4\u9009\u62E9",
    "Quiz": "\u6D4B\u9A8C",
    "Poll": "\u6295\u7968",
    "Submit": "\u63D0\u4EA4",
    "ended": "\u7EC8\u7ED3\u4E86",
    "votes": "\u7968\u6570",
    "delete": "\u5220\u9664",
    "Poll too long.": "\u6295\u7968\u592A\u957F",
    "Battles do not support polls.": "\u5BF9\u6218\u91CC\u4E0D\u652F\u6301\u6295\u7968",
    "You are not allowed to use filtered words in polls.": "\u6295\u7968\u91CC\u4E0D\u80FD\u4F7F\u7528\u88AB\u7981\u7684\u8BCD\u8BED",
    "Not enough arguments for /poll new.": "\u6295\u7968\u53C2\u6570\u4E0D\u591F\u4F7F\u7528/poll new",
    "Too many options for poll (maximum is 8).": "\u6295\u7968\u9009\u9879\u4E0D\u80FD\u8D85\u8D8A8\u4E2A",
    "There are duplicate options in the poll.": "\u6295\u7968\u9009\u9879\u91CC\u6709\u91CD\u590D",
    "${user.name} queued a poll.": "${user.name}\u5B89\u63D2\u4E86\u4E0B\u4E00\u4E2A\u6295\u7968",
    "A poll was started by ${user.name}.": "${user.name}\u5F00\u4E86\u4E00\u4E2A\u6295\u7968",
    "The queue is already empty.": "\u961F\u5217\u5DF2\u662F\u7A7A\u7684",
    "Cleared poll queue.": "\u6295\u7968\u961F\u5217\u88AB\u6E05\u7A7A",
    'Room "${roomid}" not found.': '\u627E\u4E0D\u5230"${roomid}"\u623F',
    'Can\'t delete poll at slot ${slotString} - "${slotString}" is not a number.': '${slotString} - "${slotString}"\u4F4D\u7F6E\u4E0D\u662F\u6570\u5B57\uFF0C\u65E0\u6CD5\u4ECE\u6295\u7968\u91CC\u5220\u9664',
    "There is no poll in queue at slot ${slot}.": "\u8FD9\u4E2A\u4F4D\u7F6E\u6CA1\u6709\u6295\u7968\u961F\u5217",
    "(${user.name} deleted the queued poll in slot ${slot}.)": "(${user.name}\u5728${slot}\u4F4D\u7F6E\u5220\u9664\u4E86\u961F\u5217\u91CC\u7684\u6295\u7968",
    "There is no poll running in this room.": "\u961F\u5217\u7684\u8FD9\u4E2A\u4F4D\u7F6E\u6CA1\u6709\u6295\u7968",
    "To vote, specify the number of the option.": "\u8BF7\u6307\u660E\u9009\u9879",
    "Option not in poll.": "\u6295\u7968\u91CC\u6CA1\u6709\u8FD9\u4E2A\u9009\u9879",
    "The poll timer was turned off.": "\u6295\u7968\u5B9A\u65F6\u5668\u5DF2\u88AB\u5173\u95ED",
    "The queued poll was started.": "\u4E0B\u4E00\u4E2A\u6295\u7968\u5F00\u59CB\u4E86",
    "The poll timer was turned on: the poll will end in ${timeout} minute(s).": "\u6295\u7968\u5C06\u5728${timeout}\u5206\u949F\u540E\u7EC8\u7ED3",
    "The poll timer was set to ${timeout} minute(s) by ${user.name}.": "${user.name}.\u8BBE\u5B9A\u4E86${timeout}\u5206\u949F\u7684\u6295\u7968\u5B9A\u65F6\u5668",
    "The poll timer is on and will end in ${poll.timeoutMins} minute(s).": "\u6295\u7968\u5C06\u5728${poll.timeoutMins}\u5206\u949F\u540E\u7EC8\u7ED3",
    "The poll timer is off.": "\u6295\u7968\u5B9A\u65F6\u5668\u5DF2\u5173\u95ED",
    "The poll was ended by ${user.name}.": "\u6295\u7968\u5DF2\u88AB${user.name}\u7EC8\u7ED3",
    "Queued polls:": "\u6295\u7968\u961F\u5217",
    "Refresh": "\u5237\u65B0",
    "No polls queued.": "\u961F\u5217\u91CC\u65E0\u6295\u7968",
    "#${number} in queue": "\u961F\u5217\u91CC\u7B2C${number}\u4E2A",
    "- We log PMs so you can report them - staff can't look at them without permission unless there's a law enforcement reason.": "",
    "- We log IPs to enforce bans and mutes.": "",
    "- We use cookies to save your login info and teams, and for Google Analytics and AdSense.": "",
    '- For more information, you can read our <a href="https://${Config.routes.root}/privacy">full privacy policy.</a>': ""
  }
};
//# sourceMappingURL=minor-activities.js.map
