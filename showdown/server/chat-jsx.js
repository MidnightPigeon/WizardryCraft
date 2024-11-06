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
var chat_jsx_exports = {};
__export(chat_jsx_exports, {
  Component: () => Component,
  FormatText: () => FormatText,
  Fragment: () => Fragment,
  h: () => h,
  html: () => html,
  render: () => import_preact_render_to_string.default
});
module.exports = __toCommonJS(chat_jsx_exports);
var import_preact = __toESM(require("preact"));
var import_preact_render_to_string = __toESM(require("preact-render-to-string"));
var import_lib = require("../lib");
function html(strings, ...args) {
  let buf = strings[0];
  let i = 0;
  while (i < args.length) {
    buf += typeof args[i] === "string" || typeof args[i] === "number" ? import_lib.Utils.escapeHTML(args[i]) : (0, import_preact_render_to_string.default)(args[i]);
    buf += strings[++i];
  }
  return buf;
}
const h = import_preact.default.h;
const Fragment = import_preact.default.Fragment;
const Component = import_preact.default.Component;
class FormatText extends import_preact.default.Component {
  render() {
    const child = this.props.children;
    if (typeof child !== "string")
      throw new Error(`Invalid props.children type: ${!child ? child : typeof child}`);
    return /* @__PURE__ */ Chat.h("span", { dangerouslySetInnerHTML: { __html: Chat.formatText(child, this.props.isTrusted, this.props.replaceLinebreaks) } });
  }
}
//# sourceMappingURL=chat-jsx.js.map
