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
    "Repeated phrases in ${room.title}": "Frasi ripetute in ${room.title}",
    "There are no repeated phrases in ${room.title}.": "Non ci sono frasi ripetute in ${room.title}.",
    "Action": "Azione",
    "Phrase": "Frase",
    "Identifier": "Identificatore",
    "Interval": "Intervallo",
    "every ${minutes} minute(s)": "ogni ${minutes} minuto(i)",
    "every ${messages} chat message(s)": "ogni ${messages} messaggio(i)",
    "Raw text": "Testo",
    "Remove": "Rimuovi",
    "Remove all repeats": "Rimuovi tutti i repeat",
    "Repeat names must include at least one alphanumeric character.": "I nomi dei repeat devono contenere almeno un carattere alfanumerico.",
    "You must specify an interval as a number of minutes or chat messages between 1 and 1440.": "Devi specificare un intervallo di minuti o messaggi compreso tra 1 e 1440.",
    'The phrase labeled with "${id}" is already being repeated in this room.': 'La frase identificata con "${id}" viene gi\xE0 ripetuta in questa room.',
    '${user.name} set the phrase labeled with "${id}" to be repeated every ${interval} minute(s).': '${user.name} ha impostato la frase identificata con "${id}" da ripetere ogni ${interval} minuto(i).',
    '${user.name} set the phrase labeled with "${id}" to be repeated every ${interval} chat message(s).': '${user.name} ha impostato la frase identificata con "${id}" da ripetere ogni ${interval} messaggio(i).',
    '${user.name} set the Room FAQ "${topic}" to be repeated every ${interval} minute(s).': '${user.name} ha impostato il Room FAQ "${topic}" da ripetere ogni ${interval} minuto(i).',
    '${user.name} set the Room FAQ "${topic}" to be repeated every ${interval} chat message(s).': '${user.name} ha impostato il Room FAQ "${topic}" da ripetere ogni ${interval} messaggio(i).',
    'The phrase labeled with "${id}" is not being repeated in this room.': 'La frase identificata con "${id}" non viene ripetuta in questa room.',
    'The text for the Room FAQ "${topic}" is already being repeated.': 'Il testo del Room FAQ "${topic}" viene gi\xE0 ripetuto.',
    '${user.name} removed the repeated phrase labeled with "${id}".': '${user.name} ha rimosso la frase ripetuta identificata con "${id}".',
    "There are no repeated phrases in this room.": "Non ci sono frasi ripetute in questa room.",
    "${user.name} removed all repeated phrases.": "${user.name} ha rimosso tutte le frasi ripetute.",
    "You must specify a room when using this command in PMs.": "Devi specificare una room quando usi questo comando in PM."
  }
};
//# sourceMappingURL=repeats.js.map
