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
    "The announcement has ended.": "L'annuncio \xE8 terminato.",
    "Battles do not support announcements.": "Le lotte non supportano gli annunci.",
    "You are not allowed to use filtered words in announcements.": "Non ti \xE8 permesso utilizzare parole filtrate negli annunci.",
    "There is already a poll or announcement in progress in this room.": "\xC8 gi\xE0 presente un poll o un annuncio in room.",
    "An announcement was started by ${user.name}.": "Un annuncio \xE8 stato pubblicato da ${user.name}.",
    "There is no announcement running in this room.": "Non vi \xE8 alcun annuncio in room al momento.",
    "There is no timer to clear.": "Non vi \xE8 alcun timer da rimuovere.",
    "The announcement timer was turned off.": "Il timer dell'annuncio \xE8 stato disattivato.",
    "Invalid time given.": "Timer impostato invalido.",
    "The announcement timer is off.": "Il timer dell'annuncio \xE8 disattivato.",
    "The announcement was ended by ${user.name}.": "L'annuncio \xE8 stato terminato da ${user.name}.",
    "Accepts the following commands:": "Accetta i seguenti comandi:",
    "That option is not selected.": "Quell'opzione non \xE8 selezionata.",
    "You have already voted for this poll.": "Hai gi\xE0 votato per questo sondaggio.",
    "No options selected.": "Nessuna opzione selezionata.",
    "you will not be able to vote after viewing results": "Non ti sar\xE0 possibile votare dopo aver visto i risultati.",
    "View results": "Vedi risultati",
    "You can't vote after viewing results": "Non puoi votare dopo aver visto i risultati.",
    "The poll has ended &ndash; scroll down to see the results": "Il sondaggio \xE8 terminato &ndash; scorri verso il basso per vederne i risultati.",
    "Vote for ${num}": "Vota per ${num}",
    "Submit your vote": "Invia il tuo voto",
    "Quiz": "Quiz",
    "Poll": "Sondaggio",
    "Submit": "Invia",
    "ended": "terminato",
    "votes": "voti",
    "delete": "elimina",
    "Poll too long.": "Il poll \xE8 troppo lungo.",
    "Battles do not support polls.": "Le lotte non supportano i poll.",
    "You are not allowed to use filtered words in polls.": "Non ti \xE8 permesso utilizzare parole filtrate nei poll.",
    "Not enough arguments for /poll new.": "Non vi sono sufficienti opzioni per /poll new.",
    "Too many options for poll (maximum is 8).": "Sono presenti troppe opzioni per un poll (il massimo \xE8 8).",
    "There are duplicate options in the poll.": "Sono presenti opzioni uguali nel poll.",
    "${user.name} queued a poll.": "${user.name} ha messo in coda un poll.",
    "A poll was started by ${user.name}.": "Un poll \xE8 stato iniziato da ${user.name}.",
    "The queue is already empty.": "La coda \xE8 gi\xE0 vuota.",
    "Cleared poll queue.": "Hai rimosso la coda dei poll.",
    'Room "${roomid}" not found.': 'Room "${roomid}" non trovata.',
    'Can\'t delete poll at slot ${slotString} - "${slotString}" is not a number.': 'Non \xE8 possibile eliminare il poll allo slot ${slotString} - "${slotString}" non \xE8 un numero valido.',
    "There is no poll in queue at slot ${slot}.": "Non \xE8 presente alcun poll in coda allo slot ${slot}.",
    "(${user.name} deleted the queued poll in slot ${slot}.)": "(${user.name} ha rimosso il poll in coda nello slot ${slot}.)",
    "There is no poll running in this room.": "Non \xE8 presente alcun poll in room.",
    "To vote, specify the number of the option.": "Per votare, specifica il numero dell'opzione.",
    "Option not in poll.": "Opzione non presente nel poll.",
    "The poll timer was turned off.": "Il timer del poll \xE8 stato disattivato.",
    "The queued poll was started.": "Il poll in coda \xE8 iniziato.",
    "The poll timer was turned on: the poll will end in ${timeout} minute(s).": "Il timer del poll \xE8 stato attivato: il poll finir\xE0 tra ${timeout} min.",
    "The poll timer was set to ${timeout} minute(s) by ${user.name}.": "Il timer del poll \xE8 stato impostato a ${timeout} min da ${user.name}.",
    "The poll timer is on and will end in ${poll.timeoutMins} minute(s).": "Il timer del poll \xE8 attivo e finir\xE0 in ${poll.timeoutMins} min.",
    "The poll timer is off.": "Il timer del poll \xE8 disattivato.",
    "The poll was ended by ${user.name}.": "Il poll \xE8 stato terminato da ${user.name}.",
    "Queued polls:": "Poll in coda",
    "Refresh": "Refresha",
    "No polls queued.": "Nessun poll in coda.",
    "#${number} in queue": "#${number} in coda."
  }
};
//# sourceMappingURL=minor-activities.js.map
