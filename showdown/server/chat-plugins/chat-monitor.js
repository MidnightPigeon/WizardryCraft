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
var chat_monitor_exports = {};
__export(chat_monitor_exports, {
  Filters: () => Filters,
  chatfilter: () => chatfilter,
  commands: () => commands,
  loginfilter: () => loginfilter,
  namefilter: () => namefilter,
  nicknamefilter: () => nicknamefilter,
  pages: () => pages,
  statusfilter: () => statusfilter
});
module.exports = __toCommonJS(chat_monitor_exports);
var import_lib = require("../../lib");
const LEGACY_MONITOR_FILE = "config/chat-plugins/chat-monitor.tsv";
const MONITOR_FILE = "config/chat-plugins/chat-filter.json";
const WRITE_THROTTLE_TIME = 5 * 60 * 1e3;
const EVASION_DETECTION_SUBSTITUTIONS = {
  a: ["a", "4", "@", "\xE1", "\xE2", "\xE3", "\xE0", "\u15E9", "A", "\u24D0", "\u24B6", "\u03B1", "\u034F", "\u20B3", "\xE4", "\xC4", "\u13D7", "\u03BB", "\u0394", "\u1E00", "\u13AA", "\u01DF", "\u033E", "\uFF41", "\uFF21", "\u1D00", "\u0250", "\u{1F150}", "\u{1D41A}", "\u{1D400}", "\u{1D622}", "\u{1D608}", "\u{1D656}", "\u{1D63C}", "\u{1D4B6}", "\u{1D4EA}", "\u{1D4D0}", "\u{1D552}", "\u{1D538}", "\u{1D51E}", "\u{1D504}", "\u{1D586}", "\u{1D56C}", "\u{1F130}", "\u{1F170}", "\u{1D49C}", "\u{1D68A}", "\u{1D670}", "\uA34F", "\u0430", "\u{1D4EA}"],
  b: ["b", "8", "\u15F7", "B", "\u24D1", "\u24B7", "\u0432", "\u0E3F", "\u1E05", "\u1E04", "\u13F0", "\u03D0", "\u0181", "\u1E03", "\u1E02", "\u026E", "\uFF42", "\uFF22", "\u0299", "\u{1F151}", "\u{1D41B}", "\u{1D401}", "\u{1D623}", "\u{1D609}", "\u{1D657}", "\u{1D63D}", "\u{1D4B7}", "\u{1D4EB}", "\u{1D4D1}", "\u{1D553}", "\u{1D539}", "\u{1D51F}", "\u{1D505}", "\u{1D587}", "\u{1D56D}", "\u{1F131}", "\u{1F171}", "\u{1D435}", "\u10A6", "\u{1D68B}", "\u{1D671}", "\u266D", "b"],
  c: ["c", "\xE7", "\u1455", "C", "\u24D2", "\u24B8", "\xA2", "\u034F", "\u20B5", "\u010B", "\u010A", "\u1348", "\u03C2", "\u1E09", "\u1E08", "\u13DF", "\u0188", "\u033E", "\uFF43", "\uFF23", "\u1D04", "\u0254", "\u{1F152}", "\u{1D41C}", "\u{1D402}", "\u{1D624}", "\u{1D60A}", "\u{1D658}", "\u{1D63E}", "\u{1D4B8}", "\u{1D4EC}", "\u{1D4D2}", "\u{1D554}", "\u2102", "\u{1D520}", "\u212D", "\u{1D588}", "\u{1D56E}", "\u{1F132}", "\u{1F172}", "\u{1D49E}", "\u{1D68C}", "\u{1D672}", "\u263E", "\u0441"],
  d: ["d", "\u15EA", "D", "\u24D3", "\u24B9", "\u2202", "\u0110", "\u010F", "\u010E", "\u13B4", "\u1E0A", "\u13A0", "\u0256", "\uFF44", "\uFF24", "\u1D05", "\u{1F153}", "\u{1D41D}", "\u{1D403}", "\u{1D625}", "\u{1D60B}", "\u{1D659}", "\u{1D63F}", "\u{1D4B9}", "\u{1D4ED}", "\u{1D4D3}", "\u{1D555}", "\u200B", "\u{1D521}", "\u{1D589}", "\u{1D56F}", "\u{1F133}", "\u{1F173}", "\u{1D49F}", "\u0503", "\u{1D68D}", "\u{1D673}", "\u25D7", "\u217E"],
  e: ["e", "3", "\xE9", "\xEA", "E", "\u24D4", "\u24BA", "\u0454", "\u034F", "\u0246", "\u1EC7", "\u1EC6", "\u13CB", "\u03B5", "\u03A3", "\u1E15", "\u1E14", "\u13AC", "\u025B", "\u033E", "\uFF45", "\uFF25", "\u1D07", "\u01DD", "\u{1F154}", "\u{1D41E}", "\u{1D404}", "\u{1D626}", "\u{1D60C}", "\u{1D65A}", "\u{1D640}", "\u212F", "\u{1D4EE}", "\u{1D4D4}", "\u{1D556}", "\u{1D53B}", "\u{1D522}", "\u{1D507}", "\u{1D58A}", "\u{1D570}", "\u{1F134}", "\u{1F174}", "\u{1D452}", "\u{1D438}", "\u04BD", "\u{1D68E}", "\u{1D674}", "\u20AC", "\u0435", "\u0451", "\u{1D4EE}"],
  f: ["f", "\u15B4", "F", "\u24D5", "\u24BB", "\u20A3", "\u1E1F", "\u1E1E", "\u13A6", "\u0493", "\u0284", "\uFF46", "\uFF26", "\u025F", "\u{1F155}", "\u{1D41F}", "\u{1D405}", "\u{1D627}", "\u{1D60D}", "\u{1D65B}", "\u{1D641}", "\u{1D4BB}", "\u{1D4EF}", "\u{1D4D5}", "\u{1D557}", "\u{1D53C}", "\u{1D523}", "\u{1D508}", "\u{1D58B}", "\u{1D571}", "\u{1F135}", "\u{1F175}", "\u{1D439}", "\u03DD", "\u{1D68F}", "\u{1D675}", "\u03DC", "f"],
  g: ["g", "q", "6", "9", "G", "\u24D6", "\u24BC", "\u034F", "\u20B2", "\u0121", "\u0120", "\u13B6", "\u03D1", "\u1E20", "\u0262", "\u033E", "\uFF47", "\uFF27", "\u0183", "\u{1F156}", "\u{1D420}", "\u{1D406}", "\u{1D628}", "\u{1D60E}", "\u{1D65C}", "\u{1D642}", "\u210A", "\u{1D4F0}", "\u{1D4D6}", "\u{1D558}", "\u{1D53D}", "\u{1D524}", "\u{1D509}", "\u{1D58C}", "\u{1D572}", "\u{1F136}", "\u{1F176}", "\u{1D454}", "\u{1D4A2}", "\u0260", "\u{1D690}", "\u{1D676}", "\u2761", "\u0581", "\u{1D676}", "\u{1D4F0}", "\u050C"],
  h: [
    "h",
    "\u157C",
    "H",
    "\u24D7",
    "\u24BD",
    "\u043D",
    "\u2C67",
    "\u1E27",
    "\u1E26",
    "\u13C2",
    "\u0266",
    "\uFF48",
    "\uFF28",
    "\u029C",
    "\u0265",
    "\u{1F157}",
    "\u{1D421}",
    "\u{1D407}",
    "\u{1D629}",
    "\u{1D60F}",
    "\u{1D65D}",
    "\u{1D643}",
    "\u{1D4BD}",
    "\u{1D4F1}",
    "\u{1D4D7}",
    "\u{1D559}",
    "\u{1D53E}",
    "\u{1D525}",
    "\u{1D50A}",
    "\u{1D58D}",
    "\u{1D573}",
    "\u{1F137}",
    "\u{1F177}",
    "\u{1D43B}",
    "\u050B",
    "\u{1D691}",
    "\u{1D677}",
    "\u2644",
    "h"
  ],
  i: ["i", "!", "l", "1", "\xED", "I", "\u24D8", "\u24BE", "\u03B9", "\u034F", "\u0142", "\xEF", "\xCF", "\u13A5", "\u1E2D", "\u1E2C", "\u0268", "\u033E", "\uFF49", "\uFF29", "\u026A", "\u0131", "\u{1F158}", "\u{1D422}", "\u{1D408}", "\u{1D62A}", "\u{1D610}", "\u{1D65E}", "\u{1D644}", "\u{1D4BE}", "\u{1D4F2}", "\u{1D4D8}", "\u{1D55A}", "\u210D", "\u{1D526}", "\u210C", "\u{1D58E}", "\u{1D574}", "\u{1F138}", "\u{1F178}", "\u{1D43C}", "\u{1D692}", "\u{1D678}", "\u2657", "\u0456", "\xA1", "|", "\u{1D4F2}"],
  j: ["j", "\u148D", "J", "\u24D9", "\u24BF", "\u05E0", "\u13E0", "\u03F3", "\u029D", "\uFF4A", "\uFF2A", "\u1D0A", "\u027E", "\u{1F159}", "\u{1D423}", "\u{1D409}", "\u{1D62B}", "\u{1D611}", "\u{1D65F}", "\u{1D645}", "\u{1D4BF}", "\u{1D4F3}", "\u{1D4D9}", "\u{1D55B}", "\u200B", "\u{1D527}", "\u{1D58F}", "\u{1D575}", "\u{1F139}", "\u{1F179}", "\u{1D4A5}", "\u{1D693}", "\u{1D679}", "\u266A", "\u0458"],
  k: ["k", "K", "\u24DA", "\u24C0", "\u043A", "\u034F", "\u20AD", "\u1E33", "\u1E32", "\u13E6", "\u03BA", "\u0198", "\u04C4", "\u033E", "\uFF4B", "\uFF2B", "\u1D0B", "\u029E", "\u{1F15A}", "\u{1D424}", "\u{1D40A}", "\u{1D62C}", "\u{1D612}", "\u{1D660}", "\u{1D646}", "\u{1D4C0}", "\u{1D4F4}", "\u{1D4DA}", "\u{1D55C}", "\u{1D540}", "\u{1D528}", "\u2111", "\u{1D590}", "\u{1D576}", "\u{1F13A}", "\u{1F17A}", "\u{1D4A6}", "\u0199", "\u{1D694}", "\u{1D67A}", "\u03F0", "k", "\u{1D4F4}"],
  l: ["l", "i", "1", "/", "|", "\u14AA", "L", "\u24DB", "\u24C1", "\u2113", "\u2C60", "\u0140", "\u013F", "\u13DD", "\u1E36", "\u13DE", "\u029F", "\uFF4C", "\uFF2C", "\u{1F15B}", "\u{1D425}", "\u{1D40B}", "\u{1D62D}", "\u{1D613}", "\u{1D661}", "\u{1D647}", "\u{1D4C1}", "\u{1D4F5}", "\u{1D4DB}", "\u{1D55D}", "\u{1D541}", "\u{1D529}", "\u200B", "\u{1D591}", "\u{1D577}", "\u{1F13B}", "\u{1F17B}", "\u{1D43F}", "\u0285", "\u{1D695}", "\u{1D67B}", "\u21B3", "\u217C"],
  m: [
    "m",
    "\u15F0",
    "M",
    "\u24DC",
    "\u24C2",
    "\u043C",
    "\u034F",
    "\u20A5",
    "\u1E43",
    "\u1E42",
    "\u13B7",
    "\u03FB",
    "\u039C",
    "\u1E41",
    "\u1E40",
    "\u028D",
    "\u033E",
    "\uFF4D",
    "\uFF2D",
    "\u1D0D",
    "\u026F",
    "\u{1F15C}",
    "\u{1D426}",
    "\u{1D40C}",
    "\u{1D62E}",
    "\u{1D614}",
    "\u{1D662}",
    "\u{1D648}",
    "\u{1D4C2}",
    "\u{1D4F6}",
    "\u{1D4DC}",
    "\u{1D55E}",
    "\u{1D542}",
    "\u{1D52A}",
    "\u{1D50D}",
    "\u{1D592}",
    "\u{1D578}",
    "\u{1F13C}",
    "\u{1F17C}",
    "\u{1D440}",
    "\u0271",
    "\u{1D696}",
    "\u{1D67C}",
    "\u2654",
    "\u217F"
  ],
  n: ["n", "\xF1", "\u144E", "N", "\u24DD", "\u24C3", "\u0438", "\u20A6", "\u0144", "\u0143", "\u13C1", "\u03C0", "\u220F", "\u1E46", "\u057C", "\uFF4E", "\uFF2E", "\u0274", "\u{1F15D}", "\u{1D427}", "\u{1D40D}", "\u{1D62F}", "\u{1D615}", "\u{1D663}", "\u{1D649}", "\u{1D4C3}", "\u{1D4F7}", "\u{1D4DD}", "\u{1D55F}", "\u{1D543}", "\u{1D52B}", "\u{1D50E}", "\u{1D593}", "\u{1D579}", "\u{1F13D}", "\u{1F17D}", "\u{1D4A9}", "\u0273", "\u{1D697}", "\u{1D67D}", "\u266B", "\u0578", "\u03B7", "\u{1D67D}", "\u019E", "\u{1D4F7}", "\u039D"],
  o: ["o", "0", "\xF3", "\xF4", "\xF5", "\xFA", "O", "\u24DE", "\u24C4", "\u03C3", "\u034F", "\xD8", "\xF6", "\xD6", "\u13A7", "\u0398", "\u1E4F", "\u1E4E", "\u13BE", "\u0585", "\u033E", "\uFF4F", "\uFF2F", "\u1D0F", "\u{1F15E}", "\u{1D428}", "\u{1D40E}", "\u{1D630}", "\u{1D616}", "\u{1D664}", "\u{1D64A}", "\u2134", "\u{1D4F8}", "\u{1D4DE}", "\u{1D560}", "\u{1D544}", "\u{1D52C}", "\u{1D50F}", "\u{1D594}", "\u{1D57A}", "\u{1F13E}", "\u{1F17E}", "\u{1D45C}", "\u{1D4AA}", "\u{1D698}", "\u{1D67E}", "\u2299", "\u03BF"],
  p: ["p", "\u146D", "P", "\u24DF", "\u24C5", "\u03C1", "\u20B1", "\u1E57", "\u1E56", "\u13AE", "\u01A4", "\u13E2", "\u0584", "\uFF50", "\uFF30", "\u1D18", "\u{1F15F}", "\u{1D429}", "\u{1D40F}", "\u{1D631}", "\u{1D617}", "\u{1D665}", "\u{1D64B}", "\u{1D4C5}", "\u{1D4F9}", "\u{1D4DF}", "\u{1D561}", "\u2115", "\u{1D52D}", "\u{1D510}", "\u{1D595}", "\u{1D57B}", "\u{1F13F}", "\u{1F17F}", "\u{1D4AB}", "\u{1D699}", "\u{1D67F}", "\u0440"],
  q: [
    "q",
    "\u146B",
    "Q",
    "\u24E0",
    "\u24C6",
    "\u034F",
    "\u13A4",
    "\u03C6",
    "\u10B3",
    "\u0566",
    "\u033E",
    "\uFF51",
    "\uFF31",
    "\u03D9",
    "\u01EB",
    "\u{1F160}",
    "\u{1D42A}",
    "\u{1D410}",
    "\u{1D632}",
    "\u{1D618}",
    "\u{1D666}",
    "\u{1D64C}",
    "\u{1D4C6}",
    "\u{1D4FA}",
    "\u{1D4E0}",
    "\u{1D562}",
    "\u200B",
    "\u{1D52E}",
    "\u{1D511}",
    "\u{1D596}",
    "\u{1D57C}",
    "\u{1F140}",
    "\u{1F180}",
    "\u{1D4AC}",
    "\u{1D69A}",
    "\u{1D680}",
    "\u262D",
    "\u051B"
  ],
  r: ["r", "\u1587", "R", "\u24E1", "\u24C7", "\u044F", "\u2C64", "\u0155", "\u0154", "\u13D2", "\u0433", "\u0393", "\u1E59", "\u1E58", "\u0280", "\uFF52", "\uFF32", "\u0279", "\u{1F161}", "\u{1D42B}", "\u{1D411}", "\u{1D633}", "\u{1D619}", "\u{1D667}", "\u{1D64D}", "\u{1D4C7}", "\u{1D4FB}", "\u{1D4E1}", "\u{1D563}", "\u{1D546}", "\u{1D52F}", "\u{1D512}", "\u{1D597}", "\u{1D57D}", "\u{1F141}", "\u{1F181}", "\u{1D445}", "\u027E", "\u{1D69B}", "\u{1D681}", "\u2608", "r", "\u{1D681}", "\u{1D4FB}"],
  s: ["s", "5", "\u1515", "S", "\u24E2", "\u24C8", "\u0455", "\u034F", "\u20B4", "\u1E69", "\u1E68", "\u13D5", "\u0405", "\u1E60", "\u0586", "\u033E", "\uFF53", "\uFF33", "\uA731", "\u{1F162}", "\u{1D42C}", "\u{1D412}", "\u{1D634}", "\u{1D61A}", "\u{1D668}", "\u{1D64E}", "\u{1D4C8}", "\u{1D4FC}", "\u{1D4E2}", "\u{1D564}", "\u2119", "\u{1D530}", "\u{1D513}", "\u{1D598}", "\u{1D57E}", "\u{1F142}", "\u{1F182}", "\u{1D4AE}", "\u0282", "\u{1D69C}", "\u{1D682}", "\u0455", "\u{1D4FC}"],
  t: ["t", "+", "T", "\u24E3", "\u24C9", "\u0442", "\u20AE", "\u1E97", "\u1E6E", "\u13D6", "\u03C4", "\u01AC", "\u13C6", "\u0236", "\uFF54", "\uFF34", "\u1D1B", "\u0287", "\u{1F163}", "\u{1D42D}", "\u{1D413}", "\u{1D635}", "\u{1D61B}", "\u{1D669}", "\u{1D64F}", "\u{1D4C9}", "\u{1D4FD}", "\u{1D4E3}", "\u{1D565}", "\u200B", "\u{1D531}", "\u{1D514}", "\u{1D599}", "\u{1D57F}", "\u{1F143}", "\u{1F183}", "\u{1D4AF}", "\u019A", "\u{1D69D}", "\u{1D683}", "\u2602", "t", "\u{1D4FD}"],
  u: ["u", "\xFA", "\xFC", "\u144C", "U", "\u24E4", "\u24CA", "\u03C5", "\u034F", "\u0244", "\xDC", "\u13EC", "\u01B1", "\u1E73", "\u1E72", "\u028A", "\u033E", "\uFF55", "\uFF35", "\u1D1C", "\u{1F164}", "\u{1D42E}", "\u{1D414}", "\u{1D636}", "\u{1D61C}", "\u{1D66A}", "\u{1D650}", "\u{1D4CA}", "\u{1D4FE}", "\u{1D4E4}", "\u{1D566}", "\u211A", "\u{1D532}", "\u211C", "\u{1D59A}", "\u{1D580}", "\u{1F144}", "\u{1F184}", "\u{1D4B0}", "\u{1D69E}", "\u{1D684}", "\u260B", "\u057D"],
  v: ["v", "\u142F", "V", "\u24E5", "\u24CB", "\u03BD", "\u1E7F", "\u1E7E", "\u13C9", "\u01B2", "\u1E7C", "\u028B", "\uFF56", "\uFF36", "\u1D20", "\u028C", "\u{1F165}", "\u{1D42F}", "\u{1D415}", "\u{1D637}", "\u{1D61D}", "\u{1D66B}", "\u{1D651}", "\u{1D4CB}", "\u{1D4FF}", "\u{1D4E5}", "\u{1D567}", "\u200B", "\u{1D533}", "\u{1D59B}", "\u{1D581}", "\u{1F145}", "\u{1F185}", "\u{1D4B1}", "\u{1D69F}", "\u{1D685}", "\u2713", "\u2174"],
  w: ["w", "\u15EF", "W", "\u24E6", "\u24CC", "\u03C9", "\u034F", "\u20A9", "\u1E85", "\u1E84", "\u13C7", "\u0448", "\u0428", "\u1E87", "\u1E86", "\u13B3", "\u0561", "\u033E", "\uFF57", "\uFF37", "\u1D21", "\u028D", "\u{1F166}", "\u{1D430}", "\u{1D416}", "\u{1D638}", "\u{1D61E}", "\u{1D66C}", "\u{1D652}", "\u{1D4CC}", "\u{1D500}", "\u{1D4E6}", "\u{1D568}", "\u211D", "\u{1D534}", "\u{1D516}", "\u{1D59C}", "\u{1D582}", "\u{1F146}", "\u{1F186}", "\u{1D4B2}", "\u026F", "\u{1D6A0}", "\u{1D686}", "\u051D"],
  x: ["x", "\u166D", "X", "\u24E7", "\u24CD", "\u03C7", "\u04FE", "\u1E8D", "\u1E8C", "\u1300", "\u03F0", "\u0416", "\u0445", "\u04FC", "\uFF58", "\uFF38", "\u{1F167}", "\u{1D431}", "\u{1D417}", "\u{1D639}", "\u{1D61F}", "\u{1D66D}", "\u{1D653}", "\u{1D4CD}", "\u{1D501}", "\u{1D4E7}", "\u{1D569}", "\u200B", "\u{1D535}", "\u{1D517}", "\u{1D59D}", "\u{1D583}", "\u{1F147}", "\u{1F187}", "\u{1D4B3}", "\u{1D6A1}", "\u{1D687}", "\u2318", "\u0445"],
  y: [
    "y",
    "Y",
    "\u24E8",
    "\u24CE",
    "\u0443",
    "\u034F",
    "\u024E",
    "\xFF",
    "\u0178",
    "\u13A9",
    "\u03C8",
    "\u03A8",
    "\u1E8F",
    "\u1E8E",
    "\u13BD",
    "\u0447",
    "\u028F",
    "\u033E",
    "\uFF59",
    "\uFF39",
    "\u028E",
    "\u{1F168}",
    "\u{1D432}",
    "\u{1D418}",
    "\u{1D63A}",
    "\u{1D620}",
    "\u{1D66E}",
    "\u{1D654}",
    "\u{1D4CE}",
    "\u{1D502}",
    "\u{1D4E8}",
    "\u{1D56A}",
    "\u{1D54A}",
    "\u{1D536}",
    "\u{1D518}",
    "\u{1D59E}",
    "\u{1D584}",
    "\u{1F148}",
    "\u{1F188}",
    "\u{1D4B4}",
    "\u10E7",
    "\u{1D6A2}",
    "\u{1D688}",
    "\u263F",
    "\u0443"
  ],
  z: ["z", "\u1614", "Z", "\u24E9", "\u24CF", "\u2C6B", "\u1E93", "\u1E92", "\u135A", "\u13C3", "\u0290", "\uFF5A", "\uFF3A", "\u1D22", "\u{1F169}", "\u{1D433}", "\u{1D419}", "\u{1D63B}", "\u{1D621}", "\u{1D66F}", "\u{1D655}", "\u{1D4CF}", "\u{1D503}", "\u{1D4E9}", "\u{1D56B}", "\u{1D54B}", "\u{1D537}", "\u{1D519}", "\u{1D59F}", "\u{1D585}", "\u{1F149}", "\u{1F189}", "\u{1D4B5}", "\u0225", "\u{1D6A3}", "\u{1D689}", "\u2621", "z", "\u{1D503}"]
};
const filterWords = Chat.filterWords;
const Filters = new class {
  constructor() {
    this.EVASION_DETECTION_SUBSTITUTIONS = EVASION_DETECTION_SUBSTITUTIONS;
    this.EVASION_DETECTION_SUB_STRINGS = {};
    for (const letter in EVASION_DETECTION_SUBSTITUTIONS) {
      this.EVASION_DETECTION_SUB_STRINGS[letter] = `[${EVASION_DETECTION_SUBSTITUTIONS[letter].join("")}]`;
    }
    this.load();
  }
  constructEvasionRegex(str) {
    const buf = "\\b" + [...str].map((letter) => (this.EVASION_DETECTION_SUB_STRINGS[letter] || letter) + "+").join("\\.?") + "\\b";
    return new RegExp(buf, "iu");
  }
  generateRegex(word, isEvasion = false, isShortener = false, isReplacement = false) {
    try {
      if (isEvasion) {
        return this.constructEvasionRegex(word);
      } else {
        return new RegExp(isShortener ? `\\b${word}` : word, isReplacement ? "igu" : "iu");
      }
    } catch (e) {
      throw new Chat.ErrorMessage(
        e.message.startsWith("Invalid regular expression: ") ? e.message : `Invalid regular expression: /${word}/: ${e.message}`
      );
    }
  }
  stripWordBoundaries(regex) {
    return new RegExp(regex.toString().replace("/\\b", "").replace("\\b/iu", ""), "iu");
  }
  save(force = false) {
    (0, import_lib.FS)(MONITOR_FILE).writeUpdate(() => {
      const buf = {};
      for (const key in Chat.monitors) {
        buf[key] = [];
        for (const filterWord of filterWords[key]) {
          const word = { ...filterWord };
          delete word.regex;
          buf[key].push(word);
        }
      }
      return JSON.stringify(buf);
    }, { throttle: force ? 0 : WRITE_THROTTLE_TIME });
  }
  add(filterWord) {
    if (!filterWord.hits)
      filterWord.hits = 0;
    const punishment = Chat.monitors[filterWord.list].punishment;
    if (!filterWord.regex) {
      filterWord.regex = this.generateRegex(
        filterWord.word,
        punishment === "EVASION",
        punishment === "SHORTENER",
        !!filterWord.replacement
      );
    }
    if (filterWords[filterWord.list].some((val) => String(val.regex) === String(filterWord.regex))) {
      throw new Chat.ErrorMessage(`${filterWord.word} is already added to the ${filterWord.list} list.`);
    }
    filterWords[filterWord.list].push(filterWord);
    this.save(true);
  }
  load() {
    const legacy = (0, import_lib.FS)(LEGACY_MONITOR_FILE);
    if (legacy.existsSync()) {
      return process.nextTick(() => {
        this.loadLegacy();
        legacy.renameSync(LEGACY_MONITOR_FILE + ".backup");
        Monitor.notice(`Legacy chatfilter data loaded and renamed to a .backup file.`);
      });
    }
    const data = JSON.parse((0, import_lib.FS)(MONITOR_FILE).readIfExistsSync() || "{}");
    for (const k in data) {
      filterWords[k] = [];
      for (const entry of data[k]) {
        if (k === "evasion") {
          entry.regex = this.constructEvasionRegex(entry.word);
        } else {
          entry.regex = new RegExp(
            k === "shorteners" ? `\\b${entry.word}` : entry.word,
            entry.replacement ? "igu" : "iu"
          );
        }
        filterWords[k].push(entry);
      }
    }
  }
  loadLegacy() {
    let data;
    try {
      data = (0, import_lib.FS)(LEGACY_MONITOR_FILE).readSync();
    } catch (e) {
      if (e.code !== "ENOENT")
        throw e;
    }
    if (!data)
      return;
    const lines = data.split("\n");
    loop:
      for (const line of lines) {
        if (!line || line === "\r")
          continue;
        const [location, word, punishment, reason, times, ...rest] = line.split("	").map((param) => param.trim());
        if (location === "Location")
          continue;
        if (!(location && word && punishment))
          continue;
        for (const key in Chat.monitors) {
          if (Chat.monitors[key].location === location && Chat.monitors[key].punishment === punishment) {
            const replacement = rest[0];
            const publicReason = rest[1];
            let regex;
            if (punishment === "EVASION") {
              regex = Filters.constructEvasionRegex(word);
            } else {
              regex = new RegExp(punishment === "SHORTENER" ? `\\b${word}` : word, replacement ? "igu" : "iu");
            }
            const filterWord = { regex, word, hits: parseInt(times) || 0 };
            if (reason && reason !== "undefined")
              filterWord.reason = reason;
            if (publicReason)
              filterWord.publicReason = publicReason;
            if (replacement)
              filterWord.replacement = replacement;
            filterWords[key].push(filterWord);
            continue loop;
          }
        }
        Monitor.crashlog(new Error("Couldn't find [location, punishment] pair for a filter word"), "The main process", {
          location,
          word,
          punishment,
          reason,
          times,
          rest
        });
      }
  }
}();
Chat.registerMonitor("autolock", {
  location: "EVERYWHERE",
  punishment: "AUTOLOCK",
  label: "Autolock",
  monitor(line, room, user, message, lcMessage, isStaff) {
    const { regex, word, reason, publicReason } = line;
    const match = regex.exec(lcMessage);
    if (match) {
      if (isStaff)
        return `${message} __[would be locked: ${word}${reason ? ` (${reason})` : ""}]__`;
      message = message.replace(/(https?):\/\//g, "$1__:__//");
      message = message.replace(/\./g, "__.__");
      if (room) {
        void Punishments.autolock(
          user,
          room,
          "ChatMonitor",
          `Filtered phrase: ${word}`,
          `<<${room.roomid}>> ${user.name}: ||\`\`${message}\`\`${reason ? ` __(${reason})__` : ""}||`,
          true
        );
      } else {
        this.errorReply(`Please do not say '${match[0]}'${publicReason ? ` ${publicReason}` : ``}.`);
      }
      return false;
    }
  }
});
Chat.registerMonitor("publicwarn", {
  location: "PUBLIC",
  punishment: "WARN",
  label: "Filtered in public",
  monitor(line, room, user, message, lcMessage, isStaff) {
    const { regex, word, reason, publicReason } = line;
    const match = regex.exec(lcMessage);
    if (match) {
      if (isStaff)
        return `${message} __[would be filtered in public: ${word}${reason ? ` (${reason})` : ""}]__`;
      this.errorReply(`Please do not say '${match[0]}'${publicReason ? ` ${publicReason}` : ``}.`);
      return false;
    }
  }
});
Chat.registerMonitor("warn", {
  location: "EVERYWHERE",
  punishment: "WARN",
  label: "Filtered",
  monitor(line, room, user, message, lcMessage, isStaff) {
    const { regex, word, reason, publicReason } = line;
    const match = regex.exec(lcMessage);
    if (match) {
      if (isStaff)
        return `${message} __[would be filtered: ${word}${reason ? ` (${reason})` : ""}]__`;
      this.errorReply(`Please do not say '${match[0]}'${publicReason ? ` ${publicReason}` : ``}.`);
      return false;
    }
  }
});
Chat.registerMonitor("evasion", {
  location: "EVERYWHERE",
  punishment: "EVASION",
  label: "Filter Evasion Detection",
  monitor(line, room, user, message, lcMessage, isStaff) {
    const { regex, word, reason, publicReason } = line;
    let normalizedMessage = lcMessage.normalize("NFKC");
    normalizedMessage = normalizedMessage.replace(/[\s-_,.]+/g, ".");
    const match = regex.exec(normalizedMessage);
    if (match) {
      if (match[0] === word && regex.test(message)) {
        if (isStaff)
          return `${message} __[would be filtered: ${word}${reason ? ` (${reason})` : ""}]__`;
        this.errorReply(`Do not say '${word}'.`);
        return false;
      }
      if (isStaff)
        return `${message} __[would be locked for filter evading: ${match[0]} (${word})]__`;
      message = message.replace(/(https?):\/\//g, "$1__:__//");
      if (room) {
        void Punishments.autolock(
          user,
          room,
          "FilterEvasionMonitor",
          `Evading filter: ${message} (${match[0]} => ${word})`,
          `<<${room.roomid}>> ${user.name}: ||\`\`${message}\`\` __(${match[0]} => ${word})__||`,
          true
        );
      } else {
        this.errorReply(`Please do not say '${word}'${publicReason ? ` ${publicReason}` : ``}.`);
      }
      return false;
    }
  }
});
Chat.registerMonitor("wordfilter", {
  location: "EVERYWHERE",
  punishment: "FILTERTO",
  label: "Filtered to a different phrase",
  condition: "notStaff",
  monitor(line, room, user, message, lcMessage, isStaff) {
    const { regex, replacement } = line;
    let match = regex.exec(message);
    while (match) {
      let filtered = replacement || "";
      if (match[0] === match[0].toUpperCase())
        filtered = filtered.toUpperCase();
      if (match[0].startsWith(match[0].charAt(0).toUpperCase())) {
        filtered = `${filtered ? filtered.charAt(0).toUpperCase() : ""}${filtered.slice(1)}`;
      }
      message = message.replace(match[0], filtered);
      match = regex.exec(message);
    }
    return message;
  }
});
Chat.registerMonitor("namefilter", {
  location: "NAMES",
  punishment: "WARN",
  label: "Filtered in names"
});
Chat.registerMonitor("battlefilter", {
  location: "BATTLES",
  punishment: "MUTE",
  label: "Filtered in battles",
  monitor(line, room, user, message, lcMessage, isStaff) {
    const { regex, word, reason, publicReason } = line;
    const match = regex.exec(lcMessage);
    if (match) {
      if (isStaff)
        return `${message} __[would be filtered: ${word}${reason ? ` (${reason})` : ""}]__`;
      message = message.replace(/(https?):\/\//g, "$1__:__//");
      message = message.replace(/\./g, "__.__");
      if (room) {
        room.mute(user);
        this.errorReply(
          `You have been muted for using a banned phrase. Please do not say '${match[0]}'${publicReason ? ` ${publicReason}` : ``}.`
        );
        const text = `[BattleMonitor] <<${room.roomid}>> MUTED: ${user.name}: ${message}${reason ? ` __(${reason})__` : ""}`;
        const adminlog = Rooms.get("adminlog");
        if (adminlog) {
          adminlog.add(`|c|~|${text}`).update();
        } else {
          Monitor.log(text);
        }
        void room.uploadReplay(user, this.connection, "forpunishment");
      }
      return false;
    }
  }
});
Chat.registerMonitor("shorteners", {
  location: "EVERYWHERE",
  punishment: "SHORTENER",
  label: "URL Shorteners",
  condition: "notTrusted",
  monitor(line, room, user, message, lcMessage, isStaff) {
    const { regex, word, publicReason } = line;
    if (regex.test(lcMessage)) {
      if (isStaff)
        return `${message} __[shortener: ${word}]__`;
      this.errorReply(`Please do not use URL shorteners such as '${word}'${publicReason ? ` ${publicReason}` : ``}.`);
      return false;
    }
  }
});
const chatfilter = function(message, user, room) {
  let lcMessage = message.replace(/\u039d/g, "N").toLowerCase().replace(/[\u200b\u007F\u00AD\uDB40\uDC00\uDC21]/g, "").replace(/\u03bf/g, "o").replace(/\u043e/g, "o").replace(/\u0430/g, "a").replace(/\u0435/g, "e").replace(/\u039d/g, "e");
  lcMessage = lcMessage.replace(/__|\*\*|``|\[\[|\]\]/g, "");
  const isStaffRoom = room && (room.persist && room.roomid.endsWith("staff") || room.roomid.startsWith("help-"));
  const isStaff = isStaffRoom || user.isStaff || !!(this.pmTarget && this.pmTarget.isStaff);
  for (const list in Chat.monitors) {
    const { location, condition, monitor } = Chat.monitors[list];
    if (!monitor)
      continue;
    if (location === "BATTLES" && !(room && room.battle && room.battle.challengeType !== "challenge"))
      continue;
    if (location === "PUBLIC" && room && room.settings.isPrivate === true)
      continue;
    switch (condition) {
      case "notTrusted":
        if (user.trusted && !isStaffRoom)
          continue;
        break;
      case "notStaff":
        if (isStaffRoom)
          continue;
        break;
    }
    for (const line of Chat.filterWords[list]) {
      const ret = monitor.call(this, line, room, user, message, lcMessage, isStaff);
      if (ret !== void 0 && ret !== message) {
        line.hits++;
        Filters.save();
      }
      if (typeof ret === "string") {
        message = ret;
      } else if (ret === false) {
        return false;
      }
    }
  }
  return message;
};
const namefilter = (name, user) => {
  const id = toID(name);
  if (Punishments.namefilterwhitelist.has(id))
    return name;
  if (Monitor.forceRenames.has(id)) {
    if (typeof Monitor.forceRenames.get(id) === "number") {
      Monitor.forceRenames.set(id, false);
    }
    if (!Monitor.forceRenames.get(id)) {
      user.trackRename = id;
      Monitor.forceRenames.set(id, true);
    }
    return "";
  }
  if (id === toID(user.trackRename))
    return "";
  let lcName = name.replace(/\u039d/g, "N").toLowerCase().replace(/[\u200b\u007F\u00AD]/g, "").replace(/\u03bf/g, "o").replace(/\u043e/g, "o").replace(/\u0430/g, "a").replace(/\u0435/g, "e").replace(/\u039d/g, "e");
  lcName = lcName.replace("herapist", "").replace("grape", "").replace("scrape", "");
  for (const list in filterWords) {
    if (!Chat.monitors[list] || Chat.monitors[list].location === "BATTLES")
      continue;
    const punishment = Chat.monitors[list].punishment;
    for (const line of filterWords[list]) {
      const regex = punishment === "EVASION" ? Filters.stripWordBoundaries(line.regex) : line.regex;
      if (regex.test(lcName)) {
        if (Chat.monitors[list].punishment === "AUTOLOCK") {
          void Punishments.autolock(
            user,
            "staff",
            `NameMonitor`,
            `inappropriate name: ${name}`,
            `using an inappropriate name: ||${name} (from ${user.name})||`,
            false,
            name
          );
        }
        line.hits++;
        Filters.save();
        return "";
      }
    }
  }
  return name;
};
const loginfilter = (user) => {
  if (user.namelocked)
    return;
  if (user.trackRename) {
    const manualForceRename = Monitor.forceRenames.has(toID(user.trackRename));
    Rooms.global.notifyRooms(
      ["staff"],
      import_lib.Utils.html`|html|[NameMonitor] Username used: <span class="username">${user.name}</span> ${user.getAccountStatusString()} (${!manualForceRename ? "automatically " : ""}forcerenamed from <span class="username">${user.trackRename}</span>)`
    );
    user.trackRename = "";
  }
  const offlineWarn = Punishments.offlineWarns.get(user.id);
  if (typeof offlineWarn !== "undefined") {
    user.send(`|c|~|/warn You were warned while offline${offlineWarn.length ? `: ${offlineWarn}` : "."}`);
    Punishments.offlineWarns.delete(user.id);
  }
};
const nicknamefilter = (name, user) => {
  let lcName = name.replace(/\u039d/g, "N").toLowerCase().replace(/[\u200b\u007F\u00AD]/g, "").replace(/\u03bf/g, "o").replace(/\u043e/g, "o").replace(/\u0430/g, "a").replace(/\u0435/g, "e").replace(/\u039d/g, "e");
  lcName = lcName.replace("herapist", "").replace("grape", "").replace("scrape", "");
  for (const list in filterWords) {
    if (!Chat.monitors[list])
      continue;
    if (Chat.monitors[list].location === "BATTLES")
      continue;
    for (const line of filterWords[list]) {
      let { regex, word } = line;
      if (Chat.monitors[list].punishment === "EVASION") {
        regex = Filters.stripWordBoundaries(regex);
      }
      const match = regex.exec(lcName);
      if (match) {
        if (Chat.monitors[list].punishment === "AUTOLOCK") {
          void Punishments.autolock(
            user,
            "staff",
            `NameMonitor`,
            `inappropriate Pok\xE9mon nickname: ${name}`,
            `${user.name} - using an inappropriate Pok\xE9mon nickname: ||${name}||`,
            true
          );
        } else if (Chat.monitors[list].punishment === "EVASION" && match[0] !== lcName) {
          void Punishments.autolock(
            user,
            "staff",
            "FilterEvasionMonitor",
            `Evading filter in Pok\xE9mon nickname (${name} => ${word})`,
            `${user.name}: Pok\xE9mon nicknamed ||\`\`${name} => ${word}\`\`||`,
            true
          );
        }
        line.hits++;
        Filters.save();
        return "";
      }
    }
  }
  return name;
};
const statusfilter = (status, user) => {
  let lcStatus = status.replace(/\u039d/g, "N").toLowerCase().replace(/[\u200b\u007F\u00AD]/g, "").replace(/\u03bf/g, "o").replace(/\u043e/g, "o").replace(/\u0430/g, "a").replace(/\u0435/g, "e").replace(/\u039d/g, "e");
  lcStatus = lcStatus.replace("herapist", "").replace("grape", "").replace("scrape", "");
  const impersonationRegex = /\b(?:global|room|upper|senior)?\s*(?:staff|admin|administrator|leader|owner|founder|mod|moderator|driver|voice|operator|sysop|creator)\b/gi;
  if (!user.can("lock") && impersonationRegex.test(lcStatus))
    return "";
  for (const list in filterWords) {
    if (!Chat.monitors[list])
      continue;
    const punishment = Chat.monitors[list].punishment;
    for (const line of filterWords[list]) {
      const regex = punishment === "EVASION" ? Filters.stripWordBoundaries(line.regex) : line.regex;
      if (regex.test(lcStatus)) {
        if (punishment === "AUTOLOCK") {
          void Punishments.autolock(
            user,
            "staff",
            `NameMonitor`,
            `inappropriate status message: ${status}`,
            `${user.name} - using an inappropriate status: ||${status}||`,
            true
          );
        }
        line.hits++;
        Filters.save();
        return "";
      }
    }
  }
  return status;
};
const pages = {
  filters(query, user, connection) {
    if (!user.named)
      return Rooms.RETRY_AFTER_LOGIN;
    this.title = "Filters";
    let buf = `<div class="pad ladder"><h2>Filters</h2>`;
    if (!user.can("addhtml"))
      this.checkCan("lock");
    let content = ``;
    for (const key in Chat.monitors) {
      content += `<tr><th colspan="2"><h3>${Chat.monitors[key].label} <span style="font-size:8pt;">[${key}]</span></h3></tr></th>`;
      if (filterWords[key].length) {
        content += filterWords[key].map(({ regex, word, reason, publicReason, replacement, hits }) => {
          let entry = import_lib.Utils.html`<abbr title="${reason}"><code>${word}</code></abbr>`;
          if (publicReason)
            entry += import_lib.Utils.html` <small>(public reason: ${publicReason})</small>`;
          if (replacement)
            entry += import_lib.Utils.html` &rArr; ${replacement}`;
          return `<tr><td>${entry}</td><td>${hits}</td></tr>`;
        }).join("");
      }
    }
    if (Punishments.namefilterwhitelist.size) {
      content += `<tr><th colspan="2"><h3>Whitelisted names</h3></tr></th>`;
      for (const [val] of Punishments.namefilterwhitelist) {
        content += `<tr><td>${val}</td></tr>`;
      }
    }
    if (!content) {
      buf += `<p>There are no filtered words.</p>`;
    } else {
      buf += `<table>${content}</table>`;
    }
    buf += `</div>`;
    return buf;
  }
};
const commands = {
  filters: "filter",
  filter: {
    add(target, room, user) {
      this.checkCan("rangeban");
      let separator = ",";
      if (target.includes("\n")) {
        separator = "\n";
      } else if (target.includes("/")) {
        separator = "/";
      }
      let [list, ...rest] = target.split(separator);
      list = toID(list);
      if (!list || !rest.length) {
        return this.errorReply(`Syntax: /filter add list ${separator} word ${separator} reason [${separator} optional public reason]`);
      }
      if (!(list in filterWords)) {
        return this.errorReply(`Invalid list: ${list}. Possible options: ${Object.keys(filterWords).join(", ")}`);
      }
      const filterWord = { list, word: "" };
      rest = rest.map((part) => part.trim());
      if (Chat.monitors[list].punishment === "FILTERTO") {
        [filterWord.word, filterWord.replacement, filterWord.reason, filterWord.publicReason] = rest;
        if (!filterWord.replacement) {
          return this.errorReply(
            `Syntax for word filters: /filter add ${list} ${separator} regex ${separator} reason [${separator} optional public reason]`
          );
        }
      } else {
        [filterWord.word, filterWord.reason, filterWord.publicReason] = rest;
      }
      filterWord.word = filterWord.word.trim();
      if (!filterWord.word) {
        return this.errorReply(`Invalid word: '${filterWord.word}'.`);
      }
      Filters.add(filterWord);
      const reason = filterWord.reason ? ` (${filterWord.reason})` : "";
      if (Chat.monitors[list].punishment === "FILTERTO") {
        this.globalModlog(`ADDFILTER`, null, `'${String(filterWord.regex)} => ${filterWord.replacement}' to ${list} list${reason}`);
      } else {
        this.globalModlog(`ADDFILTER`, null, `'${filterWord.word}' to ${list} list${reason}`);
      }
      const output = `'${filterWord.word}' was added to the ${list} list.`;
      Rooms.get("upperstaff")?.add(output).update();
      if (room?.roomid !== "upperstaff")
        this.sendReply(output);
    },
    remove(target, room, user) {
      this.checkCan("rangeban");
      let [list, ...words] = target.split(target.includes("\n") ? "\n" : ",").map((param) => param.trim());
      list = toID(list);
      if (!list || !words.length)
        return this.errorReply("Syntax: /filter remove list, words");
      if (!(list in filterWords)) {
        return this.errorReply(`Invalid list: ${list}. Possible options: ${Object.keys(filterWords).join(", ")}`);
      }
      const notFound = words.filter((val) => !filterWords[list].filter((entry) => entry.word === val).length);
      if (notFound.length) {
        return this.errorReply(`${notFound.join(", ")} ${Chat.plural(notFound, "are", "is")} not on the ${list} list.`);
      }
      filterWords[list] = filterWords[list].filter((entry) => !words.includes(entry.word));
      this.globalModlog(`REMOVEFILTER`, null, `'${words.join(", ")}' from ${list} list`);
      Filters.save(true);
      const output = `'${words.join(", ")}' ${Chat.plural(words, "were", "was")} removed from the ${list} list.`;
      Rooms.get("upperstaff")?.add(output).update();
      if (room?.roomid !== "upperstaff")
        this.sendReply(output);
    },
    "": "view",
    list: "view",
    view(target, room, user) {
      this.parse(`/join view-filters`);
    },
    help(target, room, user) {
      this.parse(`/help filter`);
    },
    test(target, room, user) {
      this.checkCan("lock");
      if (room && ["staff", "upperstaff"].includes(room.roomid)) {
        this.runBroadcast(true, `!filter test ${target}`);
      }
      const lcMessage = Chat.stripFormatting(target.replace(/\u039d/g, "N").toLowerCase().replace(/[\u200b\u007F\u00AD\uDB40\uDC00\uDC21]/g, "").replace(/\u03bf/g, "o").replace(/\u043e/g, "o").replace(/\u0430/g, "a").replace(/\u0435/g, "e").replace(/\u039d/g, "e"));
      const buf = [];
      for (const monitorName in Chat.monitors) {
        const monitor = Chat.monitors[monitorName];
        for (const line of Chat.filterWords[monitorName]) {
          let ret;
          if (monitor.monitor) {
            ret = monitor.monitor.call(this, line, room, user, target, lcMessage, true);
          } else {
            ret = line.regex.exec(target)?.[0];
          }
          if (typeof ret === "string") {
            buf.push(`${monitorName}: ${ret}`);
            break;
          } else if (ret === false) {
            buf.push(`${monitorName}: "${target}" would be blocked from being sent.`);
            break;
          }
        }
      }
      if (buf.length) {
        return this.sendReplyBox(Chat.formatText(buf.join("\n"), false, true));
      } else {
        throw new Chat.ErrorMessage(
          `"${target}" doesn't trigger any filters. Check spelling?`
        );
      }
    },
    testhelp: [
      `/filter test [test string] - Tests whether or not the provided test string would trigger any of the chat monitors.`,
      `Requires: % @ &`
    ]
  },
  filterhelp: [
    `/filter add list, word, reason[, optional public reason] - Adds a word to the given filter list. Requires: &`,
    `/filter remove list, words - Removes words from the given filter list. Requires: &`,
    `/filter view - Opens the list of filtered words. Requires: % @ &`,
    `/filter test [test string] - Tests whether or not the provided test string would trigger any of the chat monitors. Requires: % @ &`,
    `You may use / instead of , in /filter add if you want to specify a reason that includes commas.`
  ],
  allowname(target, room, user) {
    this.checkCan("forcerename");
    target = toID(target);
    if (!target)
      return this.errorReply(`Syntax: /allowname username`);
    if (Punishments.namefilterwhitelist.has(target)) {
      return this.errorReply(`${target} is already allowed as a username.`);
    }
    const msg = `${target} was allowed as a username by ${user.name}.`;
    const toNotify = ["staff", "upperstaff"];
    Rooms.global.notifyRooms(toNotify, `|c|${user.getIdentity()}|/log ${msg}`);
    if (!room || !toNotify.includes(room.roomid)) {
      this.sendReply(msg);
    }
    this.globalModlog(`ALLOWNAME`, target);
    Monitor.forceRenames.delete(target);
  }
};
process.nextTick(() => {
  Chat.multiLinePattern.register("/filter (add|remove) ");
});
//# sourceMappingURL=chat-monitor.js.map
