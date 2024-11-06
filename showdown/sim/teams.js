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
var teams_exports = {};
__export(teams_exports, {
  Teams: () => Teams,
  default: () => teams_default
});
module.exports = __toCommonJS(teams_exports);
var import_dex = require("./dex");
/**
 * Teams
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * Functions for converting and generating teams.
 *
 * @license MIT
 */
const Teams = new class Teams2 {
  pack(team) {
    if (!team)
      return "";
    function getIv(ivs, s) {
      return ivs[s] === 31 || ivs[s] === void 0 ? "" : ivs[s].toString();
    }
    let buf = "";
    for (const set of team) {
      if (buf)
        buf += "]";
      buf += set.name || set.species;
      const id = this.packName(set.species || set.name);
      buf += "|" + (this.packName(set.name || set.species) === id ? "" : id);
      buf += "|" + this.packName(set.item);
      buf += "|" + this.packName(set.ability);
      buf += "|" + set.moves.map(this.packName).join(",");
      buf += "|" + (set.nature || "");
      let evs = "|";
      if (set.evs) {
        evs = "|" + (set.evs["hp"] || "") + "," + (set.evs["atk"] || "") + "," + (set.evs["def"] || "") + "," + (set.evs["spa"] || "") + "," + (set.evs["spd"] || "") + "," + (set.evs["spe"] || "");
      }
      if (evs === "|,,,,,") {
        buf += "|";
      } else {
        buf += evs;
      }
      if (set.gender) {
        buf += "|" + set.gender;
      } else {
        buf += "|";
      }
      let ivs = "|";
      if (set.ivs) {
        ivs = "|" + getIv(set.ivs, "hp") + "," + getIv(set.ivs, "atk") + "," + getIv(set.ivs, "def") + "," + getIv(set.ivs, "spa") + "," + getIv(set.ivs, "spd") + "," + getIv(set.ivs, "spe");
      }
      if (ivs === "|,,,,,") {
        buf += "|";
      } else {
        buf += ivs;
      }
      if (set.shiny) {
        buf += "|S";
      } else {
        buf += "|";
      }
      if (set.level && set.level !== 100) {
        buf += "|" + set.level;
      } else {
        buf += "|";
      }
      if (set.happiness !== void 0 && set.happiness !== 255) {
        buf += "|" + set.happiness;
      } else {
        buf += "|";
      }
      if (set.pokeball || set.hpType || set.gigantamax || set.dynamaxLevel !== void 0 && set.dynamaxLevel !== 10 || set.teraType) {
        buf += "," + this.packName(set.pokeball || "");
        buf += "," + (set.hpType || "");
        buf += "," + (set.gigantamax ? "G" : "");
        buf += "," + (set.dynamaxLevel !== void 0 && set.dynamaxLevel !== 10 ? set.dynamaxLevel : "");
        buf += "," + (set.teraType || "");
      }
    }
    return buf;
  }
  unpack(buf) {
    if (!buf)
      return null;
    if (typeof buf !== "string")
      return buf;
    if (buf.startsWith("[") && buf.endsWith("]")) {
      try {
        buf = this.pack(JSON.parse(buf));
      } catch {
        return null;
      }
    }
    const team = [];
    let i = 0;
    let j = 0;
    for (let count = 0; count < 24; count++) {
      const set = {};
      team.push(set);
      j = buf.indexOf("|", i);
      if (j < 0)
        return null;
      set.name = buf.substring(i, j);
      i = j + 1;
      j = buf.indexOf("|", i);
      if (j < 0)
        return null;
      set.species = this.unpackName(buf.substring(i, j), import_dex.Dex.species) || set.name;
      i = j + 1;
      j = buf.indexOf("|", i);
      if (j < 0)
        return null;
      set.uuid = buf.substring(i, j);
      i = j + 1;
      j = buf.indexOf("|", i);
      if (j < 0)
        return null;
      set.currentHealth = parseInt(buf.substring(i, j));
      i = j + 1;
      j = buf.indexOf("|", i);
      if (j < 0)
        return null;
      set.status = buf.substring(i, j);
      i = j + 1;
      j = buf.indexOf("|", i);
      if (j < 0)
        return null;
      set.statusDuration = parseInt(buf.substring(i, j));
      i = j + 1;
      j = buf.indexOf("|", i);
      if (j < 0)
        return null;
      set.item = this.unpackName(buf.substring(i, j), import_dex.Dex.items);
      i = j + 1;
      j = buf.indexOf("|", i);
      if (j < 0)
        return null;
      const ability = buf.substring(i, j);
      set.ability = this.unpackName(ability, import_dex.Dex.abilities);
      i = j + 1;
      j = buf.indexOf("|", i);
      if (j < 0)
        return null;
      set.moves = buf.substring(i, j).split(",", 24).map((name) => this.unpackName(name, import_dex.Dex.moves));
      i = j + 1;
      j = buf.indexOf("|", i);
      if (j < 0)
        return null;
      set.movesInfo = buf.substring(i, j).split(",", 24).map((moveData) => {
        const moveInfo = {};
        let data = moveData.split("/");
        moveInfo.pp = parseInt(data[0]);
        moveInfo.maxPp = parseInt(data[1]);
        return moveInfo;
      });
      i = j + 1;
      j = buf.indexOf("|", i);
      if (j < 0)
        return null;
      set.nature = this.unpackName(buf.substring(i, j), import_dex.Dex.natures);
      i = j + 1;
      j = buf.indexOf("|", i);
      if (j < 0)
        return null;
      if (j !== i) {
        const evs = buf.substring(i, j).split(",", 6);
        set.evs = {
          hp: Number(evs[0]) || 0,
          atk: Number(evs[1]) || 0,
          def: Number(evs[2]) || 0,
          spa: Number(evs[3]) || 0,
          spd: Number(evs[4]) || 0,
          spe: Number(evs[5]) || 0
        };
      }
      i = j + 1;
      j = buf.indexOf("|", i);
      if (j < 0)
        return null;
      if (i !== j)
        set.gender = buf.substring(i, j);
      i = j + 1;
      j = buf.indexOf("|", i);
      if (j < 0)
        return null;
      if (j !== i) {
        const ivs = buf.substring(i, j).split(",", 6);
        set.ivs = {
          hp: ivs[0] === "" ? 31 : Number(ivs[0]) || 0,
          atk: ivs[1] === "" ? 31 : Number(ivs[1]) || 0,
          def: ivs[2] === "" ? 31 : Number(ivs[2]) || 0,
          spa: ivs[3] === "" ? 31 : Number(ivs[3]) || 0,
          spd: ivs[4] === "" ? 31 : Number(ivs[4]) || 0,
          spe: ivs[5] === "" ? 31 : Number(ivs[5]) || 0
        };
      }
      i = j + 1;
      j = buf.indexOf("|", i);
      if (j < 0)
        return null;
      if (i !== j)
        set.shiny = true;
      i = j + 1;
      j = buf.indexOf("|", i);
      if (j < 0)
        return null;
      if (i !== j)
        set.level = parseInt(buf.substring(i, j));
      i = j + 1;
      j = buf.indexOf("]", i);
      let misc;
      if (j < 0) {
        if (i < buf.length)
          misc = buf.substring(i).split(",", 6);
      } else {
        if (i !== j)
          misc = buf.substring(i, j).split(",", 6);
      }
      if (misc) {
        set.happiness = misc[0] ? Number(misc[0]) : 255;
        set.pokeball = this.unpackName(misc[1] || "", import_dex.Dex.items);
        set.hpType = misc[2] || "";
        set.gigantamax = !!misc[3];
        set.dynamaxLevel = misc[4] ? Number(misc[4]) : 10;
        set.teraType = misc[5];
      }
      if (j < 0)
        break;
      i = j + 1;
    }
    return team;
  }
  /** Very similar to toID but without the lowercase conversion */
  packName(name) {
    if (!name)
      return "";
    return name.replace(/[^A-Za-z0-9]+/g, "");
  }
  /** Will not entirely recover a packed name, but will be a pretty readable guess */
  unpackName(name, dexTable) {
    if (!name)
      return "";
    if (dexTable) {
      const obj = dexTable.get(name);
      if (obj.exists)
        return obj.name;
    }
    return name.replace(/([0-9]+)/g, " $1 ").replace(/([A-Z])/g, " $1").replace(/[ ][ ]/g, " ").trim();
  }
  /**
   * Exports a team in human-readable PS export format
   */
  export(team, options) {
    let output = "";
    for (const set of team) {
      output += this.exportSet(set, options) + `
`;
    }
    return output;
  }
  exportSet(set, { hideStats } = {}) {
    let out = ``;
    if (set.name && set.name !== set.species) {
      out += `${set.name} (${set.species})`;
    } else {
      out += set.species;
    }
    if (set.gender === "M")
      out += ` (M)`;
    if (set.gender === "F")
      out += ` (F)`;
    if (set.item)
      out += ` @ ${set.item}`;
    out += `  
`;
    if (set.ability) {
      out += `Ability: ${set.ability}  
`;
    }
    if (set.level && set.level !== 100) {
      out += `Level: ${set.level}  
`;
    }
    if (set.shiny) {
      out += `Shiny: Yes  
`;
    }
    if (typeof set.happiness === "number" && set.happiness !== 255 && !isNaN(set.happiness)) {
      out += `Happiness: ${set.happiness}  
`;
    }
    if (set.pokeball) {
      out += `Pokeball: ${set.pokeball}  
`;
    }
    if (set.hpType) {
      out += `Hidden Power: ${set.hpType}  
`;
    }
    if (typeof set.dynamaxLevel === "number" && set.dynamaxLevel !== 10 && !isNaN(set.dynamaxLevel)) {
      out += `Dynamax Level: ${set.dynamaxLevel}  
`;
    }
    if (set.gigantamax) {
      out += `Gigantamax: Yes  
`;
    }
    if (set.teraType) {
      out += `Tera Type: ${set.teraType}  
`;
    }
    if (!hideStats) {
      if (set.evs) {
        const stats = import_dex.Dex.stats.ids().map(
          (stat) => set.evs[stat] ? `${set.evs[stat]} ${import_dex.Dex.stats.shortNames[stat]}` : ``
        ).filter(Boolean);
        if (stats.length) {
          out += `EVs: ${stats.join(" / ")}  
`;
        }
      }
      if (set.nature) {
        out += `${set.nature} Nature  
`;
      }
      if (set.ivs) {
        const stats = import_dex.Dex.stats.ids().map(
          (stat) => set.ivs[stat] !== 31 && set.ivs[stat] !== void 0 ? `${set.ivs[stat] || 0} ${import_dex.Dex.stats.shortNames[stat]}` : ``
        ).filter(Boolean);
        if (stats.length) {
          out += `IVs: ${stats.join(" / ")}  
`;
        }
      }
    }
    for (let move of set.moves) {
      if (move.startsWith(`Hidden Power `) && move.charAt(13) !== "[") {
        move = `Hidden Power [${move.slice(13)}]`;
      }
      out += `- ${move}  
`;
    }
    return out;
  }
  parseExportedTeamLine(line, isFirstLine, set, aggressive) {
    if (isFirstLine) {
      let item;
      [line, item] = line.split(" @ ");
      if (item) {
        set.item = item;
        if ((0, import_dex.toID)(set.item) === "noitem")
          set.item = "";
      }
      if (line.endsWith(" (M)")) {
        set.gender = "M";
        line = line.slice(0, -4);
      }
      if (line.endsWith(" (F)")) {
        set.gender = "F";
        line = line.slice(0, -4);
      }
      if (line.endsWith(")") && line.includes("(")) {
        const [name, species] = line.slice(0, -1).split("(");
        set.species = import_dex.Dex.species.get(species).name;
        set.name = name.trim();
      } else {
        set.species = import_dex.Dex.species.get(line).name;
        set.name = "";
      }
    } else if (line.startsWith("Trait: ")) {
      line = line.slice(7);
      set.ability = aggressive ? (0, import_dex.toID)(line) : line;
    } else if (line.startsWith("Ability: ")) {
      line = line.slice(9);
      set.ability = aggressive ? (0, import_dex.toID)(line) : line;
    } else if (line === "Shiny: Yes") {
      set.shiny = true;
    } else if (line.startsWith("Level: ")) {
      line = line.slice(7);
      set.level = +line;
    } else if (line.startsWith("Happiness: ")) {
      line = line.slice(11);
      set.happiness = +line;
    } else if (line.startsWith("Pokeball: ")) {
      line = line.slice(10);
      set.pokeball = aggressive ? (0, import_dex.toID)(line) : line;
    } else if (line.startsWith("Hidden Power: ")) {
      line = line.slice(14);
      set.hpType = aggressive ? (0, import_dex.toID)(line) : line;
    } else if (line.startsWith("Tera Type: ")) {
      line = line.slice(11);
      set.teraType = aggressive ? line.replace(/[^a-zA-Z0-9]/g, "") : line;
    } else if (line === "Gigantamax: Yes") {
      set.gigantamax = true;
    } else if (line.startsWith("EVs: ")) {
      line = line.slice(5);
      const evLines = line.split("/");
      set.evs = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
      for (const evLine of evLines) {
        const [statValue, statName] = evLine.trim().split(" ");
        const statid = import_dex.Dex.stats.getID(statName);
        if (!statid)
          continue;
        const value = parseInt(statValue);
        set.evs[statid] = value;
      }
    } else if (line.startsWith("IVs: ")) {
      line = line.slice(5);
      const ivLines = line.split("/");
      set.ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
      for (const ivLine of ivLines) {
        const [statValue, statName] = ivLine.trim().split(" ");
        const statid = import_dex.Dex.stats.getID(statName);
        if (!statid)
          continue;
        let value = parseInt(statValue);
        if (isNaN(value))
          value = 31;
        set.ivs[statid] = value;
      }
    } else if (/^[A-Za-z]+ (N|n)ature/.test(line)) {
      let natureIndex = line.indexOf(" Nature");
      if (natureIndex === -1)
        natureIndex = line.indexOf(" nature");
      if (natureIndex === -1)
        return;
      line = line.substr(0, natureIndex);
      if (line !== "undefined")
        set.nature = aggressive ? (0, import_dex.toID)(line) : line;
    } else if (line.startsWith("-") || line.startsWith("~")) {
      line = line.slice(line.charAt(1) === " " ? 2 : 1);
      if (line.startsWith("Hidden Power [")) {
        const hpType = line.slice(14, -1);
        line = "Hidden Power " + hpType;
        if (!set.ivs && import_dex.Dex.types.isName(hpType)) {
          set.ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
          const hpIVs = import_dex.Dex.types.get(hpType).HPivs || {};
          for (const statid in hpIVs) {
            set.ivs[statid] = hpIVs[statid];
          }
        }
      }
      if (line === "Frustration" && set.happiness === void 0) {
        set.happiness = 0;
      }
      set.moves.push(line);
    }
  }
  /** Accepts a team in any format (JSON, packed, or exported) */
  import(buffer, aggressive) {
    const sanitize = aggressive ? import_dex.toID : import_dex.Dex.getName;
    if (buffer.startsWith("[")) {
      try {
        const team = JSON.parse(buffer);
        if (!Array.isArray(team))
          throw new Error(`Team should be an Array but isn't`);
        for (const set of team) {
          set.name = sanitize(set.name);
          set.species = sanitize(set.species);
          set.item = sanitize(set.item);
          set.ability = sanitize(set.ability);
          set.gender = sanitize(set.gender);
          set.nature = sanitize(set.nature);
          const evs = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
          if (set.evs) {
            for (const statid in evs) {
              if (typeof set.evs[statid] === "number")
                evs[statid] = set.evs[statid];
            }
          }
          set.evs = evs;
          const ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
          if (set.ivs) {
            for (const statid in ivs) {
              if (typeof set.ivs[statid] === "number")
                ivs[statid] = set.ivs[statid];
            }
          }
          set.ivs = ivs;
          if (!Array.isArray(set.moves)) {
            set.moves = [];
          } else {
            set.moves = set.moves.map(sanitize);
          }
        }
        return team;
      } catch {
      }
    }
    const lines = buffer.split("\n");
    const sets = [];
    let curSet = null;
    while (lines.length && !lines[0])
      lines.shift();
    while (lines.length && !lines[lines.length - 1])
      lines.pop();
    if (lines.length === 1 && lines[0].includes("|")) {
      return this.unpack(lines[0]);
    }
    for (let line of lines) {
      line = line.trim();
      if (line === "" || line === "---") {
        curSet = null;
      } else if (line.startsWith("===")) {
      } else if (!curSet) {
        curSet = {
          name: "",
          species: "",
          item: "",
          ability: "",
          gender: "",
          nature: "",
          evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
          ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
          level: 100,
          moves: []
        };
        sets.push(curSet);
        this.parseExportedTeamLine(line, true, curSet, aggressive);
      } else {
        this.parseExportedTeamLine(line, false, curSet, aggressive);
      }
    }
    return sets;
  }
  getGenerator(format, seed = null) {
    let TeamGenerator;
    if ((0, import_dex.toID)(format).includes("gen9computergeneratedteams")) {
      TeamGenerator = require(import_dex.Dex.forFormat(format).dataDir + "/cg-teams").default;
    } else if ((0, import_dex.toID)(format).includes("gen7randomdoublesbattle")) {
      TeamGenerator = require(import_dex.Dex.forFormat(format).dataDir + "/random-doubles-teams").default;
    } else {
      TeamGenerator = require(import_dex.Dex.forFormat(format).dataDir + "/random-teams").default;
    }
    return new TeamGenerator(format, seed);
  }
  generate(format, options = null) {
    return this.getGenerator(format, options?.seed).getTeam(options);
  }
}();
var teams_default = Teams;
//# sourceMappingURL=teams.js.map
