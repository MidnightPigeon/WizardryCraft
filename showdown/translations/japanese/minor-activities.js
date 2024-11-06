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
    "The announcement has ended.": "\u30A2\u30CA\u30A6\u30F3\u30B9\u304C\u7D42\u4E86\u3057\u307E\u3057\u305F\u3002",
    "Battles do not support announcements.": "\u30D0\u30C8\u30EB\u3067\u306F\u30A2\u30CA\u30A6\u30F3\u30B9\u304C\u4F7F\u7528\u3067\u304D\u307E\u305B\u3093\u3002",
    "You are not allowed to use filtered words in announcements.": "\u30A2\u30CA\u30A6\u30F3\u30B9\u3067\u30D5\u30A3\u30EB\u30BF\u30EA\u30F3\u30B0\u3055\u308C\u305F\u5358\u8A9E\u3092\u4F7F\u7528\u3059\u308B\u3053\u3068\u306F\u3067\u304D\u307E\u305B\u3093\u3002",
    "There is already a poll or announcement in progress in this room.": "\u3059\u3067\u306B\u3053\u306E\u90E8\u5C4B\u3067\u6295\u7968\u304B\u30A2\u30CA\u30A6\u30F3\u30B9\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u3059\u3002",
    "An announcement was started by ${user.name}.": "${user.name}\u304C\u30A2\u30CA\u30A6\u30F3\u30B9\u3092\u958B\u59CB\u3057\u307E\u3057\u305F\u3002",
    "There is no announcement running in this room.": "\u3053\u306E\u90E8\u5C4B\u3067\u306F\u30A2\u30CA\u30A6\u30F3\u30B9\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002",
    "There is no timer to clear.": "\u6D88\u53BB\u3059\u308B\u30BF\u30A4\u30DE\u30FC\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002",
    "The announcement timer was turned off.": "\u30A2\u30CA\u30A6\u30F3\u30B9\u306E\u30BF\u30A4\u30DE\u30FC\u304C\u30AA\u30D5\u306B\u306A\u308A\u307E\u3057\u305F\u3002",
    "Invalid time given.": "\u4E0D\u6B63\u306A\u6642\u9593\u306E\u5F15\u6570\u3067\u3059\u3002",
    "The announcement timer is off.": "\u30A2\u30CA\u30A6\u30F3\u30B9\u306E\u30BF\u30A4\u30DE\u30FC\u306F\u30AA\u30D5\u306B\u306A\u3063\u3066\u3044\u307E\u3059\u3002",
    "The announcement was ended by ${user.name}.": "${user.name}\u304C\u30A2\u30CA\u30A6\u30F3\u30B9\u3092\u7D42\u4E86\u3057\u307E\u3057\u305F",
    "Accepts the following commands:": "\u30B3\u30DE\u30F3\u30C9\u4E00\u89A7",
    "That option is not selected.": "\u305D\u306E\u9078\u629E\u80A2\u306F\u9078\u629E\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002",
    "You have already voted for this poll.": "\u3059\u3067\u306B\u6295\u7968\u3057\u3066\u3044\u308B\u305F\u3081\u3001\u6295\u7968\u3067\u304D\u307E\u305B\u3093\u3002",
    "No options selected.": "\u9078\u629E\u80A2\u304C\u9078\u3070\u308C\u3066\u3044\u307E\u305B\u3093\u3002",
    "you will not be able to vote after viewing results": "\u6295\u7968\u7D50\u679C\u3092\u898B\u305F\u5F8C\u306F\u6295\u7968\u3067\u304D\u307E\u305B\u3093\u3002",
    "View results": "\u7D50\u679C\u3092\u898B\u308B",
    "You can't vote after viewing results": "\u6295\u7968\u7D50\u679C\u3092\u898B\u305F\u5F8C\u306F\u6295\u7968\u3067\u304D\u307E\u305B\u3093\u3002",
    "The poll has ended &ndash; scroll down to see the results": "\u6295\u7968\u304C\u7D42\u4E86\u3057\u307E\u3057\u305F &ndash; \u4E0B\u306B\u30B9\u30AF\u30ED\u30FC\u30EB\u3059\u308B\u3068\u7D50\u679C\u304C\u898B\u3089\u308C\u307E\u3059\u3002",
    "Vote for ${num}": "${num}\u306B\u6295\u7968\u3059\u308B",
    "Submit your vote": "\u6295\u7968\u3092\u78BA\u5B9A\u3059\u308B",
    "Quiz": "\u30AF\u30A4\u30BA",
    "Poll": "\u6295\u7968",
    "Submit": "\u63D0\u51FA",
    "ended": "\u7D42\u4E86",
    "votes": "\u7968",
    "delete": "\u524A\u9664",
    "Poll too long.": "\u6295\u7968\u304C\u9577\u3059\u304E\u307E\u3059\u3002",
    "Battles do not support polls.": "\u30D0\u30C8\u30EB\u3067\u306F\u6295\u7968\u3092\u4F7F\u7528\u3067\u304D\u307E\u305B\u3093\u3002",
    "You are not allowed to use filtered words in polls.": "\u30A2\u30CA\u30A6\u30F3\u30B9\u3067\u30D5\u30A3\u30EB\u30BF\u30EA\u30F3\u30B0\u3055\u308C\u305F\u5358\u8A9E\u3092\u4F7F\u7528\u3059\u308B\u3053\u3068\u306F\u3067\u304D\u307E\u305B\u3093\u3002",
    "Not enough arguments for /poll new.": "/poll new\u3067\u6307\u5B9A\u3059\u3079\u304D\u5F15\u6570\u304C\u6307\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002",
    "Too many options for poll (maximum is 8).": "\u9078\u629E\u80A2\u304C\u591A\u3059\u304E\u307E\u3059\u3002(\u4E0A\u9650\u306F8\u3067\u3059)",
    "There are duplicate options in the poll.": "\u6295\u7968\u306E\u9078\u629E\u80A2\u304C\u91CD\u8907\u3057\u3066\u3044\u307E\u3059\u3002",
    "${user.name} queued a poll.": "${user.name}\u6295\u7968\u306E\u30AD\u30E5\u30FC\u3092\u8A2D\u5B9A\u3057\u307E\u3057\u305F\u3002",
    "A poll was started by ${user.name}.": "${user.name}\u304C\u6295\u7968\u3092\u958B\u59CB\u3057\u307E\u3057\u305F\u3002",
    "The queue is already empty.": "\u30AD\u30E5\u30FC\u306F\u3059\u3067\u306B\u7A7A\u306B\u306A\u3063\u3066\u3044\u307E\u3059\u3002",
    "Cleared poll queue.": "\u6295\u7968\u306E\u30AD\u30E5\u30FC\u3092\u524A\u9664\u3057\u307E\u3057\u305F\u3002",
    'Room "${roomid}" not found.': '\u30C1\u30E3\u30C3\u30C8\u30EB\u30FC\u30E0"${roomid}"\u306F\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002',
    'Can\'t delete poll at slot ${slotString} - "${slotString}" is not a number.': '${slotString}\u306E\u9078\u629E\u80A2\u306F\u524A\u9664\u3067\u304D\u307E\u305B\u3093\u3002"${slotString}"\u304C\u6570\u5B57\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002',
    "There is no poll in queue at slot ${slot}.": "${slot}\u306B\u6295\u7968\u306E\u30AD\u30E5\u30FC\u306F\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002",
    "(${user.name} deleted the queued poll in slot ${slot}.)": "${user.name}\u304C${slot}\u306E\u9078\u629E\u80A2\u3092\u524A\u9664\u3057\u307E\u3057\u305F\u3002",
    "There is no poll running in this room.": "\u3053\u306E\u90E8\u5C4B\u3067\u958B\u50AC\u4E2D\u306E\u6295\u7968\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
    "To vote, specify the number of the option.": "\u6295\u7968\u3092\u3059\u308B\u306B\u306F\u9078\u629E\u80A2\u306E\u30B9\u30ED\u30C3\u30C8\u756A\u53F7\u3092\u6307\u5B9A\u3059\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059\u3002",
    "Option not in poll.": "\u6295\u7968\u306B\u9078\u629E\u80A2\u304C\u3042\u308A\u307E\u305B\u3093\u3002",
    "The poll timer was turned off.": "\u6295\u7968\u306E\u30BF\u30A4\u30DE\u30FC\u304C\u30AA\u30D5\u306B\u306A\u308A\u307E\u3057\u305F\u3002",
    "The queued poll was started.": "\u30AD\u30E5\u30FC\u306E\u6295\u7968\u304C\u30B9\u30BF\u30FC\u30C8\u3057\u307E\u3057\u305F\u3002",
    "The poll timer was turned on: the poll will end in ${timeout} minute(s).": "\u6295\u7968\u306E\u30BF\u30A4\u30DE\u30FC\u304C\u30AA\u30F3\u306B\u306A\u308A\u307E\u3057\u305F\u3002${timeout}\u5206\u5F8C\u306B\u7DE0\u3081\u5207\u3089\u308C\u307E\u3059\u3002",
    "The poll timer was set to ${timeout} minute(s) by ${user.name}.": "${user.name}\u304C\u6295\u7968\u306E\u30BF\u30A4\u30DE\u30FC\u3092${timeout}\u5206\u306B\u8A2D\u5B9A\u3057\u307E\u3057\u305F\u3002",
    "The poll timer is on and will end in ${poll.timeoutMins} minute(s).": "\u6295\u7968\u306E\u30BF\u30A4\u30DE\u30FC\u306F\u30AA\u30F3\u306B\u306A\u3063\u3066\u3044\u307E\u3059\u3002${poll.timeoutMins}\u5206\u5F8C\u306B\u7DE0\u3081\u5207\u3089\u308C\u307E\u3059\u3002",
    "The poll timer is off.": "\u6295\u7968\u306E\u30BF\u30A4\u30DE\u30FC\u306F\u30AA\u30D5\u306B\u306A\u3063\u3066\u3044\u307E\u3059\u3002",
    "The poll was ended by ${user.name}.": "${user.name}\u304C\u6295\u7968\u3092\u7D42\u4E86\u3057\u307E\u3057\u305F\u3002",
    "Queued polls:": "\u30AD\u30E5\u30FC\u306B\u8FFD\u52A0\u3055\u308C\u305F\u6295\u7968",
    "Refresh": "\u518D\u8AAD\u307F\u8FBC\u307F",
    "No polls queued.": "\u30AD\u30E5\u30FC\u306B\u6295\u7968\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
    "#${number} in queue": "{number}\u756A\u76EE"
  }
};
//# sourceMappingURL=minor-activities.js.map
