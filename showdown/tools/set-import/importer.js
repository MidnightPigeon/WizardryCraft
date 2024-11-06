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
var importer_exports = {};
__export(importer_exports, {
  TIERS: () => TIERS,
  fetch: () => fetch,
  getStatisticsURL: () => getStatisticsURL,
  importAll: () => importAll
});
module.exports = __toCommonJS(importer_exports);
var http = __toESM(require("http"));
var https = __toESM(require("https"));
var url = __toESM(require("url"));
var util = __toESM(require("util"));
var smogon = __toESM(require("smogon"));
var import_lib = require("../../lib");
var import_dex = require("../../sim/dex");
var import_team_validator = require("../../sim/team-validator");
import_dex.Dex.includeModData();
const TIERS = /* @__PURE__ */ new Set([
  "ubers",
  "ou",
  "uu",
  "ru",
  "nu",
  "pu",
  "zu",
  "lc",
  "cap",
  "nationaldex",
  "doublesou",
  "battlespotsingles",
  "battlespotdoubles",
  "battlestadiumsingles",
  // UGH
  "battlestadiumsinglesseries2",
  "battlestadiumsinglesregulationc",
  //
  "vgc2016",
  "vgc2017",
  "vgc2018",
  "vgc2019ultraseries",
  "vgc2020",
  "vgc2023regulatione",
  "vgc",
  "1v1",
  "anythinggoes",
  "nationaldexag",
  "almostanyability",
  "balancedhackmons",
  "letsgoou",
  "monotype",
  "purehackmons",
  "nationaldexmonotype"
]);
const FORMATS = /* @__PURE__ */ new Map();
const VALIDATORS = /* @__PURE__ */ new Map();
for (let gen = 1; gen <= 9; gen++) {
  for (const tier of TIERS) {
    const format = import_dex.Dex.formats.get(`gen${gen}${tier}`);
    if (format.exists) {
      FORMATS.set(format.id, { gen, format });
      VALIDATORS.set(format.id, new import_team_validator.TeamValidator(format));
    }
  }
}
async function importAll() {
  const index = await request(smogon.Statistics.URL);
  const imports = [];
  for (let gen = 1; gen <= 9; gen++) {
    imports.push(importGen(gen, index));
  }
  return Promise.all(imports);
}
async function importGen(gen, index) {
  const data = {};
  const smogonSetsByFormat = {};
  const thirdPartySetsByFormat = {};
  const numByFormat = {};
  const imports = [];
  const dex = import_dex.Dex.forFormat(`gen${gen}ou`);
  for (const id in dex.data.Pokedex) {
    if (!eligible(dex, id))
      continue;
    const species = dex.species.get(id);
    if (species.battleOnly)
      continue;
    imports.push(importSmogonSets(dex.species.get(id).name, gen, smogonSetsByFormat, numByFormat));
  }
  await Promise.all(imports);
  for (const { format, gen: g } of FORMATS.values()) {
    if (g !== gen)
      continue;
    if (smogonSetsByFormat[format.id] && Object.keys(smogonSetsByFormat[format.id]).length) {
      data[format.id] = {};
      data[format.id]["dex"] = smogonSetsByFormat[format.id];
      report(format, numByFormat[format.id], "dex");
    }
    for (const source in thirdPartySetsByFormat) {
      if (thirdPartySetsByFormat[source][format.id] && Object.keys(thirdPartySetsByFormat[source][format.id]).length) {
        data[format.id] = data[format.id] || {};
        data[format.id][source] = thirdPartySetsByFormat[source][format.id];
      }
    }
    const stats = await getStatisticsURL(index, format);
    if (!stats)
      continue;
    try {
      const statistics = smogon.Statistics.process(await request(stats.url));
      const sets = importUsageBasedSets(gen, format, statistics, stats.count);
      if (Object.keys(sets).length) {
        data[format.id] = data[format.id] || {};
        data[format.id]["stats"] = sets;
      }
      data[format.id] = data[format.id] || {};
    } catch (err) {
      error(`${stats.url} = ${err}`);
    }
  }
  return data;
}
function eligible(dex, id) {
  const gen = toGen(dex, id);
  if (!gen || gen > dex.gen)
    return false;
  const species = dex.species.get(id);
  if (["Mega", "Primal", "Ultra"].some((f) => species.forme.startsWith(f)))
    return true;
  const unique = ["darmanitan", "meloetta", "greninja", "zygarde"];
  const similar = ["pichu", "pikachu", "genesect", "basculin", "magearna", "keldeo", "vivillon"];
  if (species.battleOnly && !unique.some((f) => id.startsWith(f)))
    return false;
  const capNFE = species.isNonstandard === "CAP" && species.nfe;
  return !id.endsWith("totem") && !capNFE && !similar.some((f) => id.startsWith(f) && id !== f);
}
function toGen(dex, name) {
  const pokemon = dex.species.get(name);
  if (pokemon.isNonstandard === "LGPE")
    return 7;
  if (!pokemon.exists || pokemon.isNonstandard && pokemon.isNonstandard !== "CAP")
    return void 0;
  if (pokemon.gen)
    return pokemon.gen;
  const n = pokemon.num;
  if (n > 905)
    return 9;
  if (n > 810)
    return 8;
  if (n > 721)
    return 7;
  if (n > 649)
    return 6;
  if (n > 493)
    return 5;
  if (n > 386)
    return 4;
  if (n > 251)
    return 3;
  if (n > 151)
    return 2;
  if (n > 0)
    return 1;
}
async function importSmogonSets(pokemon, gen, setsByFormat, numByFormat) {
  const analysesByFormat = await getAnalysesByFormat(pokemon, gen);
  if (!analysesByFormat)
    return;
  for (const [format, analyses] of analysesByFormat.entries()) {
    const dex = import_dex.Dex.forFormat(format);
    let setsForPokemon = setsByFormat[format.id];
    if (!setsForPokemon) {
      setsForPokemon = {};
      setsByFormat[format.id] = setsForPokemon;
    }
    let baseSpecies = dex.species.get(pokemon);
    if (baseSpecies.baseSpecies !== baseSpecies.name)
      baseSpecies = dex.species.get(baseSpecies.baseSpecies);
    const battleOnlyFormes = [];
    if (baseSpecies.otherFormes) {
      for (const forme of baseSpecies.otherFormes) {
        const formeSpecies = dex.species.get(forme);
        if (formeSpecies.battleOnly && eligible(dex, (0, import_dex.toID)(formeSpecies))) {
          battleOnlyFormes.push(formeSpecies);
        }
      }
    }
    for (const analysis of analyses) {
      for (const moveset of analysis.movesets) {
        const set = movesetToPokemonSet(dex, format, pokemon, moveset);
        const name = cleanName(moveset.name);
        addSmogonSet(dex, format, pokemon, name, set, setsForPokemon, numByFormat);
        for (const battleOnlyForme of battleOnlyFormes) {
          const s = { ...set };
          if (!format.id.includes("balancedhackmons"))
            s.ability = battleOnlyForme.abilities[0];
          if (typeof battleOnlyForme.battleOnly !== "string") {
            if (!battleOnlyForme.battleOnly.includes(pokemon))
              continue;
            const species = dex.species.get(pokemon);
            const disambiguated = `${name} - ${species.baseForme || species.forme}`;
            addSmogonSet(dex, format, battleOnlyForme.name, disambiguated, s, setsForPokemon, numByFormat, pokemon);
          } else if (battleOnlyForme.battleOnly === pokemon) {
            addSmogonSet(dex, format, battleOnlyForme.name, name, s, setsForPokemon, numByFormat);
          }
        }
      }
    }
  }
}
function addSmogonSet(dex, format, pokemon, name, set, setsForPokemon, numByFormat, outOfBattleSpeciesName) {
  if (validSet("dex", dex, format, pokemon, name, set, outOfBattleSpeciesName)) {
    setsForPokemon[pokemon] = setsForPokemon[pokemon] || {};
    setsForPokemon[pokemon][name] = set;
    numByFormat[format.id] = (numByFormat[format.id] || 0) + 1;
  }
}
function cleanName(name) {
  return name.replace(/"/g, `'`);
}
function movesetToPokemonSet(dex, format, pokemon, set) {
  const level = getLevel(format, set.levels[0]);
  return {
    level: level === 100 ? void 0 : level,
    moves: set.moveslots.map((ms) => ms[0]).map((s) => s.type ? `${s.move} ${s.type}` : s.move),
    ability: fixedAbility(dex, pokemon, set.abilities[0]),
    item: set.items[0] === "No Item" ? void 0 : set.items[0],
    nature: set.natures[0],
    teraType: set.teratypes ? set.teratypes[0] : void 0,
    ivs: toStatsTable(set.ivconfigs[0], 31),
    evs: toStatsTable(set.evconfigs[0])
  };
}
function toStatsTable(stats, elide = 0) {
  if (!stats)
    return void 0;
  const s = {};
  let stat;
  for (stat in stats) {
    const val = stats[stat];
    if (val !== elide)
      s[stat] = val;
  }
  return s;
}
function fixedAbility(dex, pokemon, ability) {
  if (dex.gen <= 2)
    return void 0;
  const species = dex.species.get(pokemon);
  if (ability && !["Mega", "Primal", "Ultra"].some((f) => species.forme.startsWith(f)))
    return ability;
  return species.abilities[0];
}
function validSet(source, dex, format, pokemon, name, set, outOfBattleSpeciesName) {
  if (skip(dex, format, pokemon, set))
    return false;
  const pset = toPokemonSet(dex, format, pokemon, set, outOfBattleSpeciesName);
  let invalid = VALIDATORS.get(format.id).validateSet(pset, {});
  if (!invalid)
    return true;
  if (invalid.length === 1 && invalid[0].includes("must be shiny")) {
    set.shiny = true;
    pset.shiny = true;
    invalid = VALIDATORS.get(format.id).validateSet(pset, {});
    if (!invalid)
      return true;
  }
  if (format.id === "gen4ubers" && invalid.includes(`${pokemon} is banned.`))
    return true;
  const title = `${format.name}: ${pokemon} (${name})'`;
  const details = `${JSON.stringify(set)} = ${invalid.join(", ")}`;
  console.error(color(`${source} Invalid set ${title}: ${details}`, 90));
  return false;
}
function skip(dex, format, pokemon, set) {
  const { gen } = FORMATS.get(format.id);
  const hasMove = (m) => set.moves && set.moves.includes(m);
  const bh = format.id.includes("balancedhackmons");
  if (pokemon === "Groudon-Primal" && set.item !== "Red Orb")
    return true;
  if (pokemon === "Kyogre-Primal" && set.item !== "Blue Orb" && !(bh && gen === 7))
    return true;
  if (bh)
    return false;
  if (dex.species.get(pokemon).forme.startsWith("Mega")) {
    if (pokemon === "Rayquaza-Mega") {
      return format.id.includes("ubers") || !hasMove("Dragon Ascent");
    } else {
      return dex.items.get(set.item).megaStone !== pokemon;
    }
  }
  if (pokemon === "Necrozma-Ultra" && set.item !== "Ultranecrozium Z")
    return true;
  if (pokemon === "Greninja-Ash" && set.ability !== "Battle Bond")
    return true;
  if (pokemon === "Zygarde-Complete" && set.ability !== "Power Construct")
    return true;
  if (pokemon === "Darmanitan-Zen" && set.ability !== "Zen Mode")
    return true;
  if (pokemon === "Meloetta-Pirouette" && !hasMove("Relic Song"))
    return true;
  return false;
}
function toPokemonSet(dex, format, pokemon, set, outOfBattleSpeciesName) {
  const hp = set.moves && set.moves.find((m) => m.startsWith("Hidden Power"));
  let fill = dex.gen === 2 ? 30 : 31;
  if (hp) {
    const type = hp.slice(13);
    if (type && dex.getHiddenPower(fillStats(set.ivs, fill)).type !== type) {
      if (!set.ivs || dex.gen >= 7 && (!set.level || set.level === 100)) {
        set.hpType = type;
        fill = 31;
      } else if (dex.gen === 2) {
        const dvs = { ...dex.types.get(type).HPdvs };
        let stat;
        for (stat in dvs) {
          dvs[stat] *= 2;
        }
        set.ivs = { ...dvs, ...set.ivs };
        set.ivs.hp = expectedHP(set.ivs);
      } else {
        set.ivs = { ...dex.types.get(type).HPivs, ...set.ivs };
      }
    }
  }
  const copy = { species: pokemon, ...set };
  copy.ivs = fillStats(set.ivs, fill);
  if (!set.evs && dex.gen >= 3 && format.id !== "gen7letsgoou")
    set.evs = { spe: 1 };
  copy.evs = fillStats(set.evs, dex.gen <= 2 ? 252 : 0);
  copy.ability = copy.ability || "None";
  const species = dex.species.get(pokemon);
  if (species.battleOnly && !format.id.includes("balancedhackmons")) {
    if (outOfBattleSpeciesName) {
      copy.species = outOfBattleSpeciesName;
    } else if (typeof species.battleOnly === "string") {
      copy.species = species.battleOnly;
    } else {
      throw new Error(`Unable to disambiguate out of battle species for ${species.name} in ${format.id}`);
    }
    copy.ability = dex.species.get(copy.species).abilities[0];
  }
  return copy;
}
function expectedHP(ivs) {
  ivs = fillStats(ivs, 31);
  const atkDV = Math.floor(ivs.atk / 2);
  const defDV = Math.floor(ivs.def / 2);
  const speDV = Math.floor(ivs.spe / 2);
  const spcDV = Math.floor(ivs.spa / 2);
  return 2 * (atkDV % 2 * 8 + defDV % 2 * 4 + speDV % 2 * 2 + spcDV % 2);
}
function fillStats(stats, fill = 0) {
  return import_team_validator.TeamValidator.fillStats(stats || null, fill);
}
const SMOGON = {
  uber: "ubers",
  doubles: "doublesou",
  lgpeou: "letsgoou",
  ag: "anythinggoes",
  bh: "balancedhackmons",
  vgc16: "vgc2016",
  vgc17: "vgc2017",
  vgc18: "vgc2018",
  vgc19: "vgc2019ultraseries",
  vgc24regulatione: "vgc2023regulatione",
  // bssseries1: 'battlestadiumsinglesseries1', // ?
  bssseries2: "battlestadiumsinglesseries2"
};
const getAnalysis = retrying(async (u) => {
  try {
    return smogon.Analyses.process(await request(u));
  } catch (err) {
    if (err.message.startsWith("HTTP")) {
      return Promise.reject(err);
    } else {
      return Promise.reject(new RetryableError(err.message));
    }
  }
}, 3, 50);
async function getAnalysesByFormat(pokemon, gen) {
  const u = smogon.Analyses.url(pokemon === "Meowstic" ? "Meowstic-M" : pokemon, gen);
  try {
    const analysesByTier = await getAnalysis(u);
    if (!analysesByTier) {
      error(`Unable to process analysis for ${pokemon} in generation ${gen}`);
      return void 0;
    }
    const analysesByFormat = /* @__PURE__ */ new Map();
    for (const [tier, analyses] of analysesByTier.entries()) {
      let t = (0, import_dex.toID)(tier);
      if (gen === 9 && t === "battlestadiumsingles") {
        t = "battlestadiumsinglesregulationc";
      }
      const f = FORMATS.get(`gen${gen}${SMOGON[t] || t}`);
      if (f)
        analysesByFormat.set(f.format, analyses);
    }
    return analysesByFormat;
  } catch {
    error(`Unable to process analysis for ${pokemon} in generation ${gen}`);
    return void 0;
  }
}
function getLevel(format, level = 0) {
  const ruleTable = import_dex.Dex.formats.getRuleTable(format);
  if (ruleTable.adjustLevel)
    return ruleTable.adjustLevel;
  const maxLevel = ruleTable.maxLevel;
  const adjustLevelDown = ruleTable.adjustLevelDown || maxLevel;
  if (!level)
    level = ruleTable.defaultLevel;
  return level > adjustLevelDown ? adjustLevelDown : level;
}
async function getStatisticsURL(index, format) {
  const current = index.includes(format.id);
  const latest = await smogon.Statistics.latestDate(format.id, !current);
  if (!latest)
    return void 0;
  return { url: smogon.Statistics.url(latest.date, format.id, current || 1500), count: latest.count };
}
function importUsageBasedSets(gen, format, statistics, count) {
  const sets = {};
  const dex = import_dex.Dex.forFormat(format);
  const threshold = getUsageThreshold(format, count);
  let num = 0;
  for (const pokemon in statistics.data) {
    const stats = statistics.data[pokemon];
    if (eligible(dex, (0, import_dex.toID)(pokemon)) && stats.usage >= threshold) {
      const set = {
        level: getLevel(format),
        moves: top(stats.Moves, 4).map((m) => dex.moves.get(m).name).filter((m) => m)
      };
      if (gen >= 2 && format.id !== "gen7letsgoou") {
        const id = top(stats.Items);
        set.item = dex.items.get(id).name;
        if (set.item === "nothing")
          set.item = void 0;
      }
      if (gen >= 3) {
        const id = top(stats.Abilities);
        set.ability = fixedAbility(dex, pokemon, dex.abilities.get(id).name);
        const { nature, evs } = fromSpread(top(stats.Spreads));
        set.nature = nature;
        if (format.id !== "gen7letsgoou") {
          if (!evs || !Object.keys(evs).length)
            continue;
          set.evs = evs;
        }
      }
      const name = "Showdown Usage";
      if (validSet("stats", dex, format, pokemon, name, set)) {
        sets[pokemon] = {};
        sets[pokemon][name] = set;
        num++;
      }
    }
  }
  report(format, num, "stats");
  return sets;
}
function getUsageThreshold(format, count) {
  if (count < 100)
    return Infinity;
  if (count < 400)
    return 0.05;
  return /uber|anythinggoes|doublesou/.test(format.id) ? 0.03 : 0.01;
}
const STATS = import_dex.Dex.stats.ids();
function fromSpread(spread) {
  const [nature, revs] = spread.split(":");
  const evs = {};
  for (const [i, rev] of revs.split("/").entries()) {
    const ev = Number(rev);
    if (ev)
      evs[STATS[i]] = ev;
  }
  return { nature, evs };
}
function top(weighted, n = 1) {
  if (n === 0)
    return void 0;
  if (n === 1) {
    let max;
    for (const key in weighted) {
      if (!max || weighted[max] < weighted[key])
        max = key;
    }
    return max;
  }
  return Object.entries(weighted).sort((a, b) => b[1] - a[1]).slice(0, n).map((x) => x[0]);
}
class RetryableError extends Error {
  constructor(message) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
const request = retrying(throttling(fetch, 1, 50), 5, 20);
function fetch(u) {
  const client = u.startsWith("http:") ? http : https;
  return new Promise((resolve, reject) => {
    const req = client.get(u, (res) => {
      if (res.statusCode !== 200) {
        if (res.statusCode >= 500 && res.statusCode < 600) {
          return reject(new RetryableError(`HTTP ${res.statusCode}`));
        } else if (res.statusCode >= 300 && res.statusCode <= 400 && res.headers.location) {
          resolve(fetch(url.resolve(u, res.headers.location)));
        } else {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
      }
      import_lib.Streams.readAll(res).then(resolve, reject);
    });
    req.on("error", reject);
    req.end();
  });
}
function retrying(fn, retries, wait) {
  const retry = async (args, attempt = 0) => {
    try {
      return await fn(args);
    } catch (err) {
      if (err instanceof RetryableError) {
        attempt++;
        if (attempt > retries)
          return Promise.reject(err);
        const timeout = Math.round(attempt * wait * (1 + Math.random() / 2));
        warn(`Retrying ${args} in ${timeout}ms (${attempt}):`, err);
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(retry(args, attempt++));
          }, timeout);
        });
      } else {
        return Promise.reject(err);
      }
    }
  };
  return retry;
}
function throttling(fn, limit, interval) {
  const queue = /* @__PURE__ */ new Map();
  let currentTick = 0;
  let activeCount = 0;
  const throttled = (args) => {
    let timeout;
    return new Promise((resolve, reject) => {
      const execute = () => {
        resolve(fn(args));
        queue.delete(timeout);
      };
      const now = Date.now();
      if (now - currentTick > interval) {
        activeCount = 1;
        currentTick = now;
      } else if (activeCount < limit) {
        activeCount++;
      } else {
        currentTick += interval;
        activeCount = 1;
      }
      timeout = setTimeout(execute, currentTick - now);
      queue.set(timeout, reject);
    });
  };
  return throttled;
}
function color(s, code) {
  return util.format(`\x1B[${code}m%s\x1B[0m`, s);
}
function report(format, num, source) {
  console.info(`${format.name}: ${color(num, 33)} ${color(`(${source})`, 90)}`);
}
function warn(s, err) {
  console.warn(`${color(s, 33)} ${color(err.message, 90)}`);
}
function error(s) {
  console.error(color(s, 91));
}
//# sourceMappingURL=importer.js.map
