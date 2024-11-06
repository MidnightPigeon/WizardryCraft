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
var usersearch_exports = {};
__export(usersearch_exports, {
  commands: () => commands,
  nameList: () => nameList,
  pages: () => pages
});
module.exports = __toCommonJS(usersearch_exports);
var import_lib = require("../../lib");
const nameList = new Set(JSON.parse(
  (0, import_lib.FS)("config/chat-plugins/usersearch.json").readIfExistsSync() || "[]"
));
const ONLINE_SYMBOL = ` \u25C9 `;
const OFFLINE_SYMBOL = ` \u25CC `;
class PunishmentHTML extends Chat.JSX.Component {
  render() {
    const { userid, target } = { ...this.props };
    const buf = [];
    for (const cmdName of ["Forcerename", "Namelock", "Weeknamelock"]) {
      buf.push(/* @__PURE__ */ Chat.h("span", { dangerouslySetInnerHTML: {
        __html: `<button class="button" name="send" value="/msgroom staff,/${toID(cmdName)} ${userid}&#10;/uspage ${target}">${cmdName}</button>`
      } }));
    }
    return buf;
  }
}
class SearchUsernames extends Chat.JSX.Component {
  render() {
    const { target, page } = { ...this.props };
    const results = {
      offline: [],
      online: []
    };
    for (const curUser of Users.users.values()) {
      if (!curUser.id.includes(target) || curUser.id.startsWith("guest"))
        continue;
      if (Punishments.isGlobalBanned(curUser))
        continue;
      if (curUser.connected) {
        results.online.push(`${!page ? ONLINE_SYMBOL : ""} ${curUser.name}`);
      } else {
        results.offline.push(`${!page ? OFFLINE_SYMBOL : ""} ${curUser.name}`);
      }
    }
    for (const k in results) {
      import_lib.Utils.sortBy(results[k], (result) => toID(result));
    }
    if (!page) {
      return /* @__PURE__ */ Chat.h(Chat.Fragment, null, "Users with a name matching '", target, "':", /* @__PURE__ */ Chat.h("br", null), !results.offline.length && !results.online.length ? /* @__PURE__ */ Chat.h(Chat.Fragment, null, "No users found.") : /* @__PURE__ */ Chat.h(Chat.Fragment, null, results.online.join("; "), !!results.offline.length && /* @__PURE__ */ Chat.h(Chat.Fragment, null, !!results.online.length && /* @__PURE__ */ Chat.h(Chat.Fragment, null, /* @__PURE__ */ Chat.h("br", null), /* @__PURE__ */ Chat.h("br", null)), results.offline.join("; "))));
    }
    return /* @__PURE__ */ Chat.h("div", { class: "pad" }, /* @__PURE__ */ Chat.h("h2", null, 'Usernames containing "', target, '"'), !results.online.length && !results.offline.length ? /* @__PURE__ */ Chat.h("p", null, "No results found.") : /* @__PURE__ */ Chat.h(Chat.Fragment, null, !!results.online.length && /* @__PURE__ */ Chat.h("div", { class: "ladder pad" }, /* @__PURE__ */ Chat.h("h3", null, "Online users"), /* @__PURE__ */ Chat.h("table", null, /* @__PURE__ */ Chat.h("tr", null, /* @__PURE__ */ Chat.h("th", null, "Username"), /* @__PURE__ */ Chat.h("th", null, "Punish")), (() => {
      const online = [];
      for (const username of results.online) {
        online.push(/* @__PURE__ */ Chat.h("tr", null, /* @__PURE__ */ Chat.h("td", null, /* @__PURE__ */ Chat.h("username", null, username)), /* @__PURE__ */ Chat.h("td", null, /* @__PURE__ */ Chat.h(PunishmentHTML, { userid: toID(username), target }))));
      }
      return online;
    })())), !!(results.online.length && results.offline.length) && /* @__PURE__ */ Chat.h("hr", null), !!results.offline.length && /* @__PURE__ */ Chat.h("div", { class: "ladder pad" }, /* @__PURE__ */ Chat.h("h3", null, "Offline users"), /* @__PURE__ */ Chat.h("table", null, /* @__PURE__ */ Chat.h("tr", null, /* @__PURE__ */ Chat.h("th", null, "Username"), /* @__PURE__ */ Chat.h("th", null, "Punish")), (() => {
      const offline = [];
      for (const username of results.offline) {
        offline.push(/* @__PURE__ */ Chat.h("tr", null, /* @__PURE__ */ Chat.h("td", null, /* @__PURE__ */ Chat.h("username", null, username)), /* @__PURE__ */ Chat.h("td", null, /* @__PURE__ */ Chat.h(PunishmentHTML, { userid: toID(username), target }))));
      }
      return offline;
    })()))));
  }
}
function saveNames() {
  (0, import_lib.FS)("config/chat-plugins/usersearch.json").writeUpdate(() => JSON.stringify([...nameList]));
}
const commands = {
  us: "usersearch",
  uspage: "usersearch",
  usersearchpage: "usersearch",
  usersearch(target, room, user, connection, cmd) {
    this.checkCan("lock");
    target = toID(target);
    if (!target) {
      if (cmd.includes("page"))
        return this.parse(`/j view-usersearch`);
      return this.parse(`/help usersearch`);
    }
    if (target.length < 3) {
      throw new Chat.ErrorMessage(`That's too short of a term to search for.`);
    }
    const showPage = cmd.includes("page");
    if (showPage) {
      this.parse(`/j view-usersearch-${target}`);
      return;
    }
    return this.sendReplyBox(/* @__PURE__ */ Chat.h(SearchUsernames, { target }));
  },
  usersearchhelp: [
    `/usersearch [pattern]: Looks for all names matching the [pattern]. Requires: % @ &`,
    `Adding "page" to the end of the command, i.e. /usersearchpage OR /uspage will bring up a page.`,
    `See also /usnames for a staff-curated list of the most commonly searched terms.`
  ],
  usnames: "usersearchnames",
  usersearchnames: {
    "": "list",
    list() {
      this.parse(`/join view-usersearch`);
    },
    add(target, room, user) {
      this.checkCan("lock");
      const targets = target.split(",").map(toID).filter(Boolean);
      if (!targets.length) {
        return this.errorReply(`Specify at least one term.`);
      }
      for (const [i, arg] of targets.entries()) {
        if (nameList.has(arg)) {
          targets.splice(i, 1);
          this.errorReply(`Term ${arg} is already on the usersearch term list.`);
          continue;
        }
        if (arg.length < 3) {
          targets.splice(i, 1);
          this.errorReply(`Term ${arg} is too short for the usersearch term list. Must be more than 3 characters.`);
          continue;
        }
        nameList.add(arg);
      }
      if (!targets.length) {
        return this.errorReply(`No terms could be added.`);
      }
      const count = Chat.count(targets, "terms");
      Rooms.get("staff")?.addByUser(
        user,
        `${user.name} added the ${count} "${targets.join(", ")}" to the usersearch name list.`
      );
      this.globalModlog(`USERSEARCH ADD`, null, targets.join(", "));
      if (!room || room.roomid !== "staff") {
        this.sendReply(`You added the ${count} "${targets.join(", ")}" to the usersearch name list.`);
      }
      saveNames();
    },
    remove(target, room, user) {
      this.checkCan("lock");
      const targets = target.split(",").map(toID).filter(Boolean);
      if (!targets.length) {
        return this.errorReply(`Specify at least one term.`);
      }
      for (const [i, arg] of targets.entries()) {
        if (!nameList.has(arg)) {
          targets.splice(i, 1);
          this.errorReply(`${arg} is not in the usersearch name list, and has been skipped.`);
          continue;
        }
        nameList.delete(arg);
      }
      if (!targets.length) {
        return this.errorReply(`No terms could be removed.`);
      }
      const count = Chat.count(targets, "terms");
      Rooms.get("staff")?.addByUser(
        user,
        `${user.name} removed the ${count} "${targets.join(", ")}" from the usersearch name list.`
      );
      this.globalModlog(`USERSEARCH REMOVE`, null, targets.join(", "));
      if (!room || room.roomid !== "staff") {
        this.sendReply(`You removed the ${count} "${targets.join(", ")}"" from the usersearch name list.`);
      }
      saveNames();
    }
  },
  usnameshelp: [
    `/usnames add [...terms]: Adds the given [terms] to the usersearch name list. Requires: % @ &`,
    `/usnames remove [...terms]: Removes the given [terms] from the usersearch name list. Requires: % @ &`,
    `/usnames OR /usnames list: Shows the usersearch name list.`
  ]
};
const pages = {
  usersearch(query, user) {
    this.checkCan("lock");
    const target = toID(query.shift());
    if (!target) {
      this.title = `[Usersearch Terms]`;
      const sorted = {};
      for (const curUser of Users.users.values()) {
        for (const term of nameList) {
          if (curUser.id.includes(term)) {
            if (!(term in sorted))
              sorted[term] = 0;
            sorted[term]++;
          }
        }
      }
      return /* @__PURE__ */ Chat.h("div", { class: "pad" }, /* @__PURE__ */ Chat.h("strong", null, "Usersearch term list"), /* @__PURE__ */ Chat.h("button", { style: { float: "right" }, class: "button", name: "send", value: "/uspage" }, /* @__PURE__ */ Chat.h("i", { class: "fa fa-refresh" }), " Refresh"), /* @__PURE__ */ Chat.h("hr", null), !nameList.size ? /* @__PURE__ */ Chat.h("p", null, "None found.") : /* @__PURE__ */ Chat.h("div", { class: "ladder pad" }, /* @__PURE__ */ Chat.h("table", null, /* @__PURE__ */ Chat.h("tr", null, /* @__PURE__ */ Chat.h("th", null, "Term"), /* @__PURE__ */ Chat.h("th", null, "Current Matches"), /* @__PURE__ */ Chat.h("th", null)), (() => {
        const buf = [];
        for (const k of import_lib.Utils.sortBy(Object.keys(sorted), (v) => -sorted[v])) {
          buf.push(/* @__PURE__ */ Chat.h("tr", null, /* @__PURE__ */ Chat.h("td", null, k), /* @__PURE__ */ Chat.h("td", null, sorted[k]), /* @__PURE__ */ Chat.h("td", null, /* @__PURE__ */ Chat.h("button", { class: "button", name: "send", value: `/uspage ${k}` }, "Search"))));
        }
        if (!buf.length)
          return /* @__PURE__ */ Chat.h("tr", null, /* @__PURE__ */ Chat.h("td", { colSpan: 3, style: { textAlign: "center" } }, "No names found."));
        return buf;
      })())));
    }
    this.title = `[Usersearch] ${target}`;
    return /* @__PURE__ */ Chat.h(SearchUsernames, { target, page: true });
  }
};
//# sourceMappingURL=usersearch.js.map
