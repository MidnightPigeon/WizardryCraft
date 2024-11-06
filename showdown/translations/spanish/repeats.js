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
    "Repeated phrases in ${room.title}": "Frases repetidas en ${room.title}",
    "There are no repeated phrases in ${room.title}.": "No hay frases repetidas en ${room.title}.",
    "Action": "Acci\xF3n",
    "Phrase": "Frase",
    "Identifier": "Identificador",
    "Interval": "Intervalo",
    "every ${minutes} minute(s)": "cada ${minutes} minuto(s)",
    "every ${messages} chat message(s)": "cada ${messages} mensaje(s) en el chat",
    "Raw text": "Texto sin formato",
    "Remove": "Eliminar",
    "Remove all repeats": "Eliminar todas las repeticiones",
    "Repeat names must include at least one alphanumeric character.": "Los nombres de repeats deben incluir al menos un car\xE1cter alfanum\xE9rico.",
    "You must specify an interval as a number of minutes or chat messages between 1 and 1440.": "Debes especificar un intervalo como un n\xFAmero de minutos o mensajes en el chat entre 1 y 1440.",
    'The phrase labeled with "${id}" is already being repeated in this room.': 'La frase registrada como "${id}" ya est\xE1 siendo repetida en esta sala.',
    '${user.name} set the phrase labeled with "${id}" to be repeated every ${interval} minute(s).': '${user.name} estableci\xF3 la frase como "${id}" para ser repetida cada ${interval} minuto(s).',
    '${user.name} set the phrase labeled with "${id}" to be repeated every ${interval} chat message(s).': '${user.name} estableci\xF3 la frase como "${id}" para ser repetida cada ${interval} mensaje(s) en el chat.',
    '${user.name} set the Room FAQ "${topic}" to be repeated every ${interval} minute(s).': '${user.name} estableci\xF3 el Room FAQ "${topic}" para ser repetido cada ${interval} minuto(s).',
    '${user.name} set the Room FAQ "${topic}" to be repeated every ${interval} chat message(s).': '${user.name} estableci\xF3 el Room FAQ "${topic}" para ser repetido cada ${interval} mensaje(s) en el chat.',
    'The phrase labeled with "${id}" is not being repeated in this room.': 'La frase registrada como "${id}" no est\xE1 siendo repetida en esta sala.',
    'The text for the Room FAQ "${topic}" is already being repeated.': 'El texto para el Room FAQ "${topic}" ya est\xE1 siendo repetido.',
    '${user.name} removed the repeated phrase labeled with "${id}".': '${user.name} elimin\xF3 la frase que estaba siendo repetida marcada como "${id}".',
    "There are no repeated phrases in this room.": "No hay frases repetidas en esta sala.",
    "${user.name} removed all repeated phrases.": "${user.name} elimin\xF3 todas las frases repetidas.",
    "You must specify a room when using this command in PMs.": "Debes especificar una sala cuando usas este comando en mensajes privados."
  }
};
//# sourceMappingURL=repeats.js.map
