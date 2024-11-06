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
var artemis_exports = {};
__export(artemis_exports, {
  LocalClassifier: () => import_local.LocalClassifier,
  RemoteClassifier: () => import_remote.RemoteClassifier,
  destroy: () => destroy
});
module.exports = __toCommonJS(artemis_exports);
var import_local = require("./local");
var import_remote = require("./remote");
function destroy() {
  void import_local.LocalClassifier.destroy();
  void import_remote.RemoteClassifier.PM.destroy();
}
//# sourceMappingURL=index.js.map
