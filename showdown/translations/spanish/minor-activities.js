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
    "The announcement has ended.": "El anuncio ha terminado.",
    "Battles do not support announcements.": "Las batallas no admiten anuncios.",
    "You are not allowed to use filtered words in announcements.": "No puedes usar palabras filtradas en los anuncios.",
    "There is already a poll or announcement in progress in this room.": "Ya hay una encuesta o anuncio en progreso en esta sala.",
    "An announcement was started by ${user.name}.": "Un anuncio fue creado por ${user.name}.",
    "There is no announcement running in this room.": "No hay ningun anuncio en la sala actualmente.",
    "There is no timer to clear.": "No hay temporizador que quitar.",
    "The announcement timer was turned off.": "El temporizador del anuncio fue desactivado.",
    "Invalid time given.": "Tiempo especificado no v\xE1lido.",
    "The announcement timer is off.": "El temporizador del anuncio est\xE1 apagado.",
    "The announcement was ended by ${user.name}.": "El anuncio ha sido finalizado por ${user.name}.",
    "Accepts the following commands:": "Acepta los siguientes comandos:",
    "That option is not selected.": "Esa opci\xF3n no est\xE1 seleccionada.",
    "You have already voted for this poll.": "T\xFA ya has votado por esta encuesta.",
    "No options selected.": "Ninguna opci\xF3n seleccionada.",
    "you will not be able to vote after viewing results": "T\xFA no podr\xE1s votar despu\xE9s de ver los resultados",
    "View results": "Ver resultados",
    "You can't vote after viewing results": "T\xFA no puedes votar despu\xE9s de ver los resultados",
    "The poll has ended &ndash; scroll down to see the results": "La encuesta ha finalizado &ndash; desliza hacia abajo para ver los resultados",
    "Vote for ${num}": "Vota por ${num}",
    "Submit your vote": "Env\xEDa tu voto",
    "Quiz": "Quiz",
    "Poll": "Encuesta",
    "Submit": "Enviar",
    "ended": "finalizada",
    "votes": "votos",
    "delete": "eliminar",
    "Poll too long.": "La encuesta es demasiado larga.",
    "Battles do not support polls.": "Las batallas no admiten encuestas.",
    "You are not allowed to use filtered words in polls.": "No puedes usar palabras filtradas en las encuestas.",
    "Not enough arguments for /poll new.": "No hay suficientes argumentos para /poll new.",
    "Too many options for poll (maximum is 8).": "Demasiadas opciones para la encuesta (m\xE1ximo 8).",
    "There are duplicate options in the poll.": "Hay opciones duplicadas en la encuesta.",
    "${user.name} queued a poll.": "${user.name} ha puesto en espera una encuesta.",
    "A poll was started by ${user.name}.": "Una encuesta fue iniciada por ${user.name}.",
    "The queue is already empty.": "La cola ya est\xE1 vac\xEDa.",
    "Cleared poll queue.": "Cola de encuestas borrada.",
    'Room "${roomid}" not found.': 'Sala "${roomid}" no encontrada.',
    'Can\'t delete poll at slot ${slotString} - "${slotString}" is not a number.': ' No se puede eliminar la encuesta en la posici\xF3n ${slotString} - "${slotString}" no es un n\xFAmero.',
    "There is no poll in queue at slot ${slot}.": "No hay encuesta en espera en la posici\xF3n ${slot}.",
    "(${user.name} deleted the queued poll in slot ${slot}.)": "(${user.name} borr\xF3 la encuesta puesta en espera en la posici\xF3n ${slot}.)",
    "There is no poll running in this room.": "No hay encuesta en curso en esta sala.",
    "To vote, specify the number of the option.": "Para votar, especif\xEDca el n\xFAmero de la opci\xF3n.",
    "Option not in poll.": "La opci\xF3n no est\xE1 en la encuesta.",
    "The poll timer was turned off.": "El temporizador de la encuesta fue desactivado.",
    "The queued poll was started.": "La encuesta en espera empez\xF3.",
    "The poll timer was turned on: the poll will end in ${timeout} minute(s).": "El temporizador de la encuesta fue activado: la encuesta terminar\xE1 en ${timeout} minuto(s).",
    "The poll timer was set to ${timeout} minute(s) by ${user.name}.": "El temporizador de encuesta fue fijado a ${timeout} minuto(s) por ${user.name}.",
    "The poll timer is on and will end in ${poll.timeoutMins} minute(s).": "El temporizador de la encuesta est\xE1 activado y finalizar\xE1 autom\xE1ticamente en ${poll.timeoutMins} minuto(s).",
    "The poll timer is off.": "El temporizador de la encuesta est\xE1 desactivado.",
    "The poll was ended by ${user.name}.": "La encuesta fue terminada por ${user.name}.",
    "Queued polls:": "Encuestas en espera.",
    "Refresh": "Actualizar.",
    "No polls queued.": "No hay encuestas en espera.",
    "#${number} in queue": "#${number} en espera."
  }
};
//# sourceMappingURL=minor-activities.js.map
