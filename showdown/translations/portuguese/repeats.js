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
    "Repeated phrases in ${room.title}": "Frases repetidas em ${room.title}",
    "There are no repeated phrases in ${room.title}.": "N\xE3o h\xE1 frases repetidas em ${room.title}.",
    "Action": "A\xE7\xE3o",
    "Phrase": "Frase",
    "Identifier": "Identificador",
    "Interval": "Intervalo",
    "every ${minutes} minute(s)": "a cada ${minutes} minuto(s)",
    "every ${messages} chat message(s)": "a cada ${messages} mensagen(s) no chat",
    "Raw text": "Texto Puro",
    "Remove": "Remover",
    "Remove all repeats": "Remover todos os repeats",
    "Repeat names must include at least one alphanumeric character.": "Repeats devem incluir pelo menos um caractere alfanum\xE9rico.",
    "You must specify an interval as a number of minutes or chat messages between 1 and 1440.": "Voc\xEA deve especificar um intervalo como um n\xFAmero de minutos ou mensagens no chat entre 1 e 1440.",
    'The phrase labeled with "${id}" is already being repeated in this room.': 'A frase nomeada como "${id}" j\xE1 est\xE1 sendo repetida nesta sala.',
    '${user.name} set the phrase labeled with "${id}" to be repeated every ${interval} minute(s).': '${user.name} a frase nomeada como "${id}" foi colocada para ser repetida a cada ${interval} minuto(s).',
    '${user.name} set the phrase labeled with "${id}" to be repeated every ${interval} chat message(s).': '${user.name} a frase nomeada como "${id}" foi colocada para ser repetida a cada ${interval} mensagen(s) no chat.',
    '${user.name} set the Room FAQ "${topic}" to be repeated every ${interval} minute(s).': '${user.name} o Room FAQ "${topic}" foi colocado para ser repetido a cada ${interval} minuto(s).',
    '${user.name} set the Room FAQ "${topic}" to be repeated every ${interval} chat message(s).': '${user.name} o Room FAQ "${topic}" foi colocado para ser repetido a cada ${interval} mensagen(s) no chat.',
    'The phrase labeled with "${id}" is not being repeated in this room.': 'A frase nomeada como "${id}" n\xE3o est\xE1 sendo repetida nesta sala.',
    'The text for the Room FAQ "${topic}" is already being repeated.': 'O texto para o Room FAQ "${topic}" j\xE1 est\xE1 sendo repetido.',
    '${user.name} removed the repeated phrase labeled with "${id}".': '${user.name} removeu a frase repetida nomeada como "${id}".',
    "There are no repeated phrases in this room.": "N\xE3o h\xE1 frases repetidas nesta sala.",
    "${user.name} removed all repeated phrases.": "${user.name} removeu todas as frases repetidas.",
    "You must specify a room when using this command in PMs.": "Voc\xEA deve especificar uma sala quando estiver usando este comando em PMs."
  }
};
//# sourceMappingURL=repeats.js.map
