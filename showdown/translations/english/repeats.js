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
var repeats_exports = {};
__export(repeats_exports, {
  translations: () => translations
});
module.exports = __toCommonJS(repeats_exports);
const translations = {
  strings: {
    "Repeated phrases in ${room.title}": "",
    "There are no repeated phrases in ${room.title}.": "",
    "Action": "",
    "Phrase": "",
    "Identifier": "",
    "Interval": "",
    "every ${minutes} minute(s)": "",
    "every ${messages} chat message(s)": "",
    "Raw text": "",
    "Remove": "",
    "Remove all repeats": "",
    "Repeat names must include at least one alphanumeric character.": "",
    "You must specify an interval as a number of minutes or chat messages between 1 and 1440.": "",
    'The phrase labeled with "${id}" is already being repeated in this room.': "",
    '${user.name} set the phrase labeled with "${id}" to be repeated every ${interval} minute(s).': "",
    '${user.name} set the phrase labeled with "${id}" to be repeated every ${interval} chat message(s).': "",
    '${user.name} set the Room FAQ "${topic}" to be repeated every ${interval} minute(s).': "",
    '${user.name} set the Room FAQ "${topic}" to be repeated every ${interval} chat message(s).': "",
    'The phrase labeled with "${id}" is not being repeated in this room.': "",
    'The text for the Room FAQ "${topic}" is already being repeated.': "",
    '${user.name} removed the repeated phrase labeled with "${id}".': "",
    "There are no repeated phrases in this room.": "",
    "${user.name} removed all repeated phrases.": "",
    "You must specify a room when using this command in PMs.": ""
  }
};
//# sourceMappingURL=repeats.js.map
