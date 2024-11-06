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
var crashlogger_exports = {};
__export(crashlogger_exports, {
  crashlogger: () => crashlogger
});
module.exports = __toCommonJS(crashlogger_exports);
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
/**
 * Crash logger
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * Logs crashes, sends an e-mail notification if you've set up
 * config.js to do that.
 *
 * @license MIT
 */
const CRASH_EMAIL_THROTTLE = 5 * 60 * 1e3;
const logPath = path.resolve(
  // not sure why this is necessary, but in Windows testing it was
  __dirname,
  "../",
  __dirname.includes(`${path.sep}dist${path.sep}`) ? ".." : "",
  "logs/errors.txt"
);
let lastCrashLog = 0;
let transport;
function crashlogger(error, description, data = null, emailConfig = null) {
  const datenow = Date.now();
  let stack = (typeof error === "string" ? error : error?.stack) || "";
  if (data) {
    stack += `

Additional information:
`;
    for (const k in data) {
      stack += `  ${k} = ${data[k]}
`;
    }
  }
  console.error(`
CRASH: ${stack}
`);
  const out = fs.createWriteStream(logPath, { flags: "a" });
  out.on("open", () => {
    out.write(`
${stack}
`);
    out.end();
  }).on("error", (err) => {
    console.error(`
SUBCRASH: ${err.stack}
`);
  });
  const emailOpts = emailConfig || global.Config?.crashguardemail;
  if (emailOpts && datenow - lastCrashLog > CRASH_EMAIL_THROTTLE) {
    lastCrashLog = datenow;
    if (!transport) {
      try {
        require.resolve("nodemailer");
      } catch {
        throw new Error(
          "nodemailer is not installed, but it is required if Config.crashguardemail is configured! Run npm install --no-save nodemailer and restart the server."
        );
      }
    }
    let text = `${description} crashed `;
    if (transport) {
      text += `again with this stack trace:
${stack}`;
    } else {
      try {
        transport = require("nodemailer").createTransport(emailOpts.options);
      } catch {
        throw new Error("Failed to start nodemailer; are you sure you've configured Config.crashguardemail correctly?");
      }
      text += `with this stack trace:
${stack}`;
    }
    transport.sendMail({
      from: emailOpts.from,
      to: emailOpts.to,
      subject: emailOpts.subject,
      text
    }, (err) => {
      if (err)
        console.error(`Error sending email: ${err}`);
    });
  }
  return null;
}
//# sourceMappingURL=crashlogger.js.map
