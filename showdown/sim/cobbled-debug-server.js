"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var cobbled_debug_server_exports = {};
__export(cobbled_debug_server_exports, {
  startServer: () => startServer
});
module.exports = __toCommonJS(cobbled_debug_server_exports);
var import_battle_stream = require("./battle-stream");
var import_dex = require("./dex");
var Net = __toESM(require("net"));
var BagItems = __toESM(require("./bag-items"));
var CobblemonCache = __toESM(require("./cobblemon-cache"));
const cobbledModId = "cobblemon";
function startServer(port) {
  const server = Net.createServer();
  const battleMap2 = /* @__PURE__ */ new Map();
  server.listen(port, () => {
    console.log("Server listening for connection requests on socket localhost: " + port);
  });
  server.on("connection", (socket2) => onConnection(socket2, battleMap2));
}
function onData(socket, chunk, battleMap) {
  const data = chunk.toString();
  const lines = data.split("\n");
  lines.forEach((line) => {
    console.log("Data received from client: " + line.toString());
    if (line.startsWith(">startbattle")) {
      const battleId = line.split(" ")[1];
      battleMap.set(battleId, new import_battle_stream.BattleStream());
      socket.write("ACK");
    } else if (line === ">getCobbledMoves") {
      getCobbledMoves(socket);
    } else if (line === ">getCobbledAbilityIds") {
      getCobbledAbilityIds(socket);
    } else if (line === ">getCobbledItemIds") {
      getCobbledItemIds(socket);
    } else if (line === ">resetSpeciesData") {
      CobblemonCache.resetSpecies();
      socket.write("ACK");
    } else if (line.startsWith(">receiveSpeciesData")) {
      const speciesJson = line.replace(`>receiveSpeciesData `, "");
      const species = JSON.parse(speciesJson);
      CobblemonCache.registerSpecies(species);
      socket.write("ACK");
    } else if (line.startsWith(">receiveBagItemData")) {
      const itemId = line.split(" ")[1];
      try {
        var content = line.slice(line.indexOf(itemId) + itemId.length + 1);
        BagItems.set(itemId, eval(`(${content})`));
        socket.write("ACK");
      } catch (e) {
        console.error(e);
        socket.write("ERR");
      }
      const bagItemJS = line.replace();
    } else if (line === ">afterCobbledSpeciesInit") {
      afterCobbledSpeciesInit();
      socket.write("ACK");
    } else {
      const [battleId, showdownMsg] = line.split("~");
      const battleStream = battleMap.get(battleId);
      if (battleStream) {
        try {
          void battleStream.write(showdownMsg);
        } catch (err) {
          console.error(err.stack);
        }
        writeBattleOutput(socket, battleStream);
      }
    }
  });
}
function writeBattleOutput(socket2, battleStream) {
  const messages = battleStream.buf;
  if (messages.length !== 0) {
    socket2.write(padNumber(messages.length, 8));
    for (const message of messages) {
      socket2.write(padNumber(message.length, 8) + message);
    }
  } else {
    writeVoid(socket2);
  }
  battleStream.buf = [];
}
function writeVoid(socket2) {
  socket2.write("00000000");
}
function onConnection(socket2, battleMap2) {
  socket2.on("data", (chunk2) => {
    try {
      onData(socket2, chunk2, battleMap2);
    } catch (error) {
      console.error(error);
    }
  });
  socket2.on("end", () => console.log("Closing connection with the client"));
  socket2.on("error", (err) => console.error(err.stack));
}
function getCobbledMoves(socket2) {
  const payload = JSON.stringify(import_dex.Dex.mod(cobbledModId).moves.all());
  socket2.write(padNumber(payload.length, 8) + payload);
}
function getCobbledAbilityIds(socket2) {
  const payload = JSON.stringify(import_dex.Dex.mod(cobbledModId).abilities.all().map((ability) => ability.id));
  socket2.write(padNumber(payload.length, 8) + payload);
}
function getCobbledItemIds(socket2) {
  const payload = JSON.stringify(import_dex.Dex.mod(cobbledModId).items.all().map((item) => item.id));
  socket2.write(padNumber(payload.length, 8) + payload);
}
function afterCobbledSpeciesInit() {
  import_dex.Dex.modsLoaded = false;
  import_dex.Dex.includeMods();
}
function padNumber(num, size) {
  let numStr = num.toString();
  while (numStr.length < size)
    numStr = "0" + numStr;
  return numStr;
}
//# sourceMappingURL=cobbled-debug-server.js.map
