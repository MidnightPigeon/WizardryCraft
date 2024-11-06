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
var friends_exports = {};
__export(friends_exports, {
  Friends: () => Friends,
  commands: () => commands,
  handlers: () => handlers,
  loginfilter: () => loginfilter,
  pages: () => pages
});
module.exports = __toCommonJS(friends_exports);
var import_utils = require("../../lib/utils");
var import_friends = require("../friends");
const STATUS_COLORS = {
  idle: "#ff7000",
  online: "#009900",
  busy: "#cc3838"
};
const STATUS_TITLES = {
  online: "Online",
  idle: "Idle",
  busy: "Busy",
  offline: "Offline"
};
const LOGIN_NOTIFY_THROTTLE = 15 * 60 * 1e3;
const Friends = new class {
  async notifyPending(user) {
    if (user.settings.blockFriendRequests)
      return;
    const friendRequests = await Chat.Friends.getRequests(user);
    const pendingCount = friendRequests.received.size;
    if (pendingCount < 1)
      return;
    if (pendingCount === 1) {
      const sender = [...friendRequests.received][0];
      const senderName = Users.getExact(sender)?.name || sender;
      let buf = import_utils.Utils.html`/uhtml sent,<button class="button" name="send" value="/friends accept ${sender}">Accept</button> | `;
      buf += import_utils.Utils.html`<button class="button" name="send" value="/friends reject ${sender}">Deny</button><br /> `;
      buf += `<small>(You can also stop this user from sending you friend requests with <code>/ignore</code>)</small>`;
      (0, import_friends.sendPM)(import_utils.Utils.html`/raw <span class="username">${senderName}</span> sent you a friend request!`, user.id);
      (0, import_friends.sendPM)(buf, user.id);
      (0, import_friends.sendPM)(
        `/raw <small>Note: If this request is accepted, your friend will be notified when you come online, and you will be notified when they do, unless you opt out of receiving them.</small>`,
        user.id
      );
    } else {
      (0, import_friends.sendPM)(`/nonotify You have ${pendingCount} friend requests pending!`, user.id);
      (0, import_friends.sendPM)(`/raw <button class="button" name="send" value="/j view-friends-received">View</button></div>`, user.id);
    }
  }
  async notifyConnection(user) {
    const connected = await Chat.Friends.getLastLogin(user.id);
    if (connected && Date.now() - connected < LOGIN_NOTIFY_THROTTLE) {
      return;
    }
    const friends = await Chat.Friends.getFriends(user.id);
    const message = `/nonotify Your friend <username class="username">${import_utils.Utils.escapeHTML(user.name)}</username> has just connected!`;
    for (const f of friends) {
      const curUser = Users.getExact(f.friend);
      if (curUser?.settings.allowFriendNotifications) {
        curUser.send(`|pm|&|${curUser.getIdentity()}|${message}`);
      }
    }
  }
  async visualizeList(userid) {
    const friends = await Chat.Friends.getFriends(userid);
    const categorized = {
      online: [],
      idle: [],
      busy: [],
      offline: []
    };
    const loginTimes = {};
    for (const { friend: friendID, last_login, allowing_login: hideLogin } of [...friends].sort()) {
      const friend = Users.getExact(friendID);
      if (friend?.connected) {
        categorized[friend.statusType].push(friend.id);
      } else {
        categorized.offline.push(friendID);
        if (!hideLogin) {
          loginTimes[toID(friendID)] = last_login;
        }
      }
    }
    const sorted = Object.keys(categorized).filter((item) => categorized[item].length > 0).map((item) => `${STATUS_TITLES[item]} (${categorized[item].length})`);
    let buf = `<h3>Your friends: `;
    if (sorted.length > 0) {
      buf += `<small> Total (${friends.length}) | ${sorted.join(" | ")}</small></h3> `;
    } else {
      buf += `</h3><em>you have no friends added on Showdown lol</em><br /><br /><br />`;
      buf += `<strong>To add a friend, use </strong><code>/friend add [username]</code>.<br /><br />`;
      return buf;
    }
    buf += `<form data-submitsend="/friend add {username}">Add friend: <input class="textbox" name="username" /><br />`;
    buf += `<button class="button" type="submit">Add <i class="fa fa-paper-plane"></i></button></form>`;
    for (const key in categorized) {
      const friendArray = categorized[key].sort();
      if (friendArray.length === 0)
        continue;
      buf += `<h4>${STATUS_TITLES[key]} (${friendArray.length})</h4>`;
      for (const friend of friendArray) {
        const friendID = toID(friend);
        buf += `<div class="pad"><div>`;
        buf += this.displayFriend(friendID, loginTimes[friendID]);
        buf += `</div></div>`;
      }
    }
    return buf;
  }
  // much more info redacted
  async visualizePublicList(userid) {
    const friends = (await Chat.Friends.getFriends(userid)).map((f) => f.friend);
    let buf = `<h3>${userid}'s friends:</h3><hr />`;
    if (!friends.length) {
      buf += `None.`;
      return buf;
    }
    for (const friend of friends) {
      buf += `- <username>${friend}</username><br />`;
    }
    return buf;
  }
  displayFriend(userid, login) {
    const user = Users.getExact(userid);
    const name = import_utils.Utils.escapeHTML(user ? user.name : userid);
    const statusType = user?.connected ? `<strong style="color:${STATUS_COLORS[user.statusType]}">\u25C9 ${STATUS_TITLES[user.statusType]}</strong>` : "\u25CC Offline";
    let buf = user ? `<span class="username"> <username>${name}</username></span><span><small> (${statusType})</small></span>` : import_utils.Utils.html`<i>${name}</i> <small>(${statusType})</small>`;
    buf += `<br />`;
    const curUser = Users.get(userid);
    if (user) {
      if (user.userMessage)
        buf += import_utils.Utils.html`Status: <i>${user.userMessage}</i><br />`;
    } else if (curUser && curUser.id !== userid) {
      buf += `<small>On an alternate account</small><br />`;
    }
    if (login && typeof login === "number" && !user?.connected) {
      const time = Chat.toTimestamp(new Date(Number(login)), { human: true });
      buf += `Last seen: ${time.split(" ").reverse().join(", on ")}`;
      buf += ` (${Chat.toDurationString(Date.now() - login, { precision: 1 })} ago)`;
    } else if (typeof login === "string") {
      buf += `${login}`;
    }
    buf = `<div class="infobox">${buf}</div>`;
    return toLink(buf);
  }
  checkCanUse(context) {
    const user = context.user;
    if (!user.autoconfirmed) {
      throw new Chat.ErrorMessage(context.tr`You must be autoconfirmed to use the friends feature.`);
    }
    if (user.locked || user.namelocked || user.semilocked || user.permalocked) {
      throw new Chat.ErrorMessage(`You are locked, and so cannot use the friends feature.`);
    }
    if (!Config.usesqlitefriends || !Config.usesqlite) {
      throw new Chat.ErrorMessage(`The friends list feature is currently disabled.`);
    }
    if (!Users.globalAuth.atLeast(user, Config.usesqlitefriends)) {
      throw new Chat.ErrorMessage(`You are currently unable to use the friends feature.`);
    }
  }
  request(user, receiver) {
    return Chat.Friends.request(user, receiver);
  }
  removeFriend(userid, friendID) {
    return Chat.Friends.removeFriend(userid, friendID);
  }
  approveRequest(receiverID, senderID) {
    return Chat.Friends.approveRequest(receiverID, senderID);
  }
  removeRequest(receiverID, senderID) {
    return Chat.Friends.removeRequest(receiverID, senderID);
  }
  updateSpectatorLists(user) {
    if (!user.friends)
      return;
    for (const id of user.friends) {
      const curUser = Users.getExact(id);
      if (curUser) {
        for (const conn of curUser.connections) {
          if (conn.openPages?.has("friends-spectate")) {
            void Chat.parse("/friends view spectate", null, curUser, conn);
          }
        }
      }
    }
  }
}();
function toLink(buf) {
  return buf.replace(/<a roomid="/g, `<a target="replace" href="/`);
}
function headerButtons(type, user) {
  const buf = [];
  const icons = {
    sent: '<i class="fa fa-paper-plane"></i>',
    received: '<i class="fa fa-get-pocket"></i>',
    all: '<i class="fa fa-users"></i>',
    help: '<i class="fa fa-question-circle"></i>',
    settings: '<i class="fa fa-cog"></i>',
    spectate: '<i class="fa fa-binoculars"></i>'
  };
  const titles = {
    all: "All Friends",
    spectate: "Spectate",
    sent: "Sent",
    received: "Received",
    help: "Help",
    settings: "Settings"
  };
  for (const page in titles) {
    const title = titles[page];
    const icon = icons[page];
    if (page === type) {
      buf.push(`${icon} <strong>${user.tr(title)}</strong>`);
    } else {
      buf.push(`${icon} <a roomid="view-friends-${page}">${user.tr(title)}</a>`);
    }
  }
  const refresh = `<button class="button" name="send" value="/j view-friends${type?.trim() ? `-${type}` : ""}" style="float: right"> <i class="fa fa-refresh"></i> ${user.tr("Refresh")}</button>`;
  return `<div style="line-height:25px">${buf.join(" / ")}${refresh}</div><hr />`;
}
const commands = {
  unfriend(target) {
    return this.parse(`/friend remove ${target}`);
  },
  friend: "friends",
  friendslist: "friends",
  friends: {
    ""(target) {
      if (toID(target)) {
        return this.parse(`/friend add ${target}`);
      }
      return this.parse(`/friends list`);
    },
    viewlist(target, room, user) {
      Friends.checkCanUse(this);
      target = toID(target);
      if (!target)
        return this.errorReply(`Specify a user.`);
      if (target === user.id)
        return this.parse(`/friends list`);
      return this.parse(`/j view-friends-viewuser-${target}`);
    },
    request: "add",
    async add(target, room, user, connection) {
      Friends.checkCanUse(this);
      target = toID(target);
      if (target.length > 18) {
        return this.errorReply(this.tr`That name is too long - choose a valid name.`);
      }
      if (!target)
        return this.parse("/help friends");
      await Friends.request(user, target);
      this.refreshPage("friends-sent");
      return this.sendReply(`You sent a friend request to '${target}'.`);
    },
    unfriend: "remove",
    async remove(target, room, user) {
      Friends.checkCanUse(this);
      target = toID(target);
      if (!target)
        return this.parse("/help friends");
      await Friends.removeFriend(user.id, target);
      this.sendReply(`Removed friend '${target}'.`);
      await Chat.Friends.updateUserCache(user);
      this.refreshPage("friends-all");
      const targetUser = Users.get(target);
      if (targetUser)
        await Chat.Friends.updateUserCache(targetUser);
    },
    view(target) {
      return this.parse(`/join view-friends-${target}`);
    },
    list() {
      return this.parse(`/join view-friends-all`);
    },
    async accept(target, room, user, connection) {
      Friends.checkCanUse(this);
      target = toID(target);
      if (user.settings.blockFriendRequests) {
        return this.errorReply(this.tr`You are currently blocking friend requests, and so cannot accept your own.`);
      }
      if (!target)
        return this.parse("/help friends");
      await Friends.approveRequest(user.id, target);
      const targetUser = Users.get(target);
      (0, import_friends.sendPM)(`You accepted a friend request from "${target}".`, user.id);
      this.refreshPage("friends-received");
      if (targetUser) {
        (0, import_friends.sendPM)(`/text ${user.name} accepted your friend request!`, targetUser.id);
        (0, import_friends.sendPM)(`/uhtmlchange sent-${targetUser.id},`, targetUser.id);
        (0, import_friends.sendPM)(`/uhtmlchange undo-${targetUser.id},`, targetUser.id);
      }
      await Chat.Friends.updateUserCache(user);
      if (targetUser)
        await Chat.Friends.updateUserCache(targetUser);
    },
    deny: "reject",
    async reject(target, room, user, connection) {
      Friends.checkCanUse(this);
      target = toID(target);
      if (!target)
        return this.parse("/help friends");
      const res = await Friends.removeRequest(user.id, target);
      if (!res.changes) {
        return this.errorReply(`You do not have a friend request pending from '${target}'.`);
      }
      this.refreshPage("friends-received");
      return (0, import_friends.sendPM)(`You denied a friend request from '${target}'.`, user.id);
    },
    toggle(target, room, user, connection) {
      Friends.checkCanUse(this);
      const setting = user.settings.blockFriendRequests;
      target = target.trim();
      if (this.meansYes(target)) {
        if (!setting)
          return this.errorReply(this.tr`You already are allowing friend requests.`);
        user.settings.blockFriendRequests = false;
        this.sendReply(this.tr`You are now allowing friend requests.`);
      } else if (this.meansNo(target)) {
        if (setting)
          return this.errorReply(this.tr`You already are blocking incoming friend requests.`);
        user.settings.blockFriendRequests = true;
        this.sendReply(this.tr`You are now blocking incoming friend requests.`);
      } else {
        if (target)
          this.errorReply(this.tr`Unrecognized setting.`);
        this.sendReply(
          this.tr(setting ? `You are currently blocking friend requests.` : `You are not blocking friend requests.`)
        );
      }
      this.refreshPage("friends-settings");
      user.update();
    },
    async undorequest(target, room, user, connection) {
      Friends.checkCanUse(this);
      target = toID(target);
      await Friends.removeRequest(target, user.id);
      this.refreshPage("friends-sent");
      return (0, import_friends.sendPM)(`You removed your friend request to '${target}'.`, user.id);
    },
    hidenotifs: "viewnotifications",
    hidenotifications: "viewnotifications",
    viewnotifs: "viewnotifications",
    viewnotifications(target, room, user, connection, cmd) {
      const setting = user.settings.allowFriendNotifications;
      target = target.trim();
      if (!cmd.includes("hide") || target && this.meansYes(target)) {
        if (setting)
          return this.errorReply(this.tr(`You are already allowing friend notifications.`));
        user.settings.allowFriendNotifications = true;
        this.sendReply(this.tr(`You will now receive friend notifications.`));
      } else if (cmd.includes("hide") || target && this.meansNo(target)) {
        if (!setting)
          return this.errorReply(this.tr`You are already not receiving friend notifications.`);
        user.settings.allowFriendNotifications = false;
        this.sendReply(this.tr`You will not receive friend notifications.`);
      } else {
        if (target)
          this.errorReply(this.tr`Unrecognized setting.`);
        this.sendReply(
          this.tr(setting ? `You are currently allowing friend notifications.` : `Your friend notifications are disabled.`)
        );
      }
      this.refreshPage("friends-settings");
      user.update();
    },
    hidelogins: "togglelogins",
    showlogins: "togglelogins",
    async togglelogins(target, room, user, connection, cmd) {
      Friends.checkCanUse(this);
      const setting = user.settings.hideLogins;
      if (cmd.includes("hide")) {
        if (setting)
          return this.errorReply(this.tr`You are already hiding your logins from friends.`);
        user.settings.hideLogins = true;
        await Chat.Friends.hideLoginData(user.id);
        this.sendReply(`You are now hiding your login times from your friends.`);
      } else if (cmd.includes("show")) {
        if (!setting)
          return this.errorReply(this.tr`You are already allowing friends to see your login times.`);
        user.settings.hideLogins = false;
        await Chat.Friends.allowLoginData(user.id);
        this.sendReply(`You are now allowing your friends to see your login times.`);
      } else {
        return this.errorReply(`Invalid setting.`);
      }
      this.refreshPage("friends-settings");
      user.update();
    },
    async listdisplay(target, room, user, connection) {
      Friends.checkCanUse(this);
      target = toID(target);
      const { public_list: setting } = await Chat.Friends.getSettings(user.id);
      if (this.meansYes(target)) {
        if (setting) {
          return this.errorReply(this.tr`You are already allowing other people to view your friends list.`);
        }
        await Chat.Friends.setHideList(user.id, true);
        this.refreshPage("friends-settings");
        return this.sendReply(this.tr`You are now allowing other people to view your friends list.`);
      } else if (this.meansNo(target)) {
        if (!setting) {
          return this.errorReply(this.tr`You are already hiding your friends list.`);
        }
        await Chat.Friends.setHideList(user.id, false);
        this.refreshPage("friends-settings");
        return this.sendReply(this.tr`You are now hiding your friends list.`);
      }
      this.sendReply(`You are currently ${setting ? "displaying" : "hiding"} your friends list.`);
    },
    invalidatecache(target, room, user) {
      this.canUseConsole();
      for (const curUser of Users.users.values()) {
        void Chat.Friends.updateUserCache(curUser);
      }
      Rooms.global.notifyRooms(
        ["staff", "development"],
        `|c|${user.getIdentity()}|/log ${user.name} used /friends invalidatecache`
      );
      this.sendReply(`You invalidated each entry in the friends database cache.`);
    },
    sharebattles(target, room, user) {
      Friends.checkCanUse(this);
      target = toID(target);
      if (this.meansYes(target)) {
        if (user.settings.displayBattlesToFriends) {
          return this.errorReply(this.tr`You are already sharing your battles with friends.`);
        }
        user.settings.displayBattlesToFriends = true;
        this.sendReply(`You are now allowing your friends to see your ongoing battles.`);
      } else if (this.meansNo(target)) {
        if (!user.settings.displayBattlesToFriends) {
          return this.errorReply(this.tr`You are already not sharing your battles with friends.`);
        }
        user.settings.displayBattlesToFriends = false;
        this.sendReply(`You are now hiding your ongoing battles from your friends.`);
      } else {
        if (!target)
          return this.parse("/help friends sharebattles");
        return this.errorReply(`Invalid setting '${target}'. Provide 'on' or 'off'.`);
      }
      user.update();
      this.refreshPage("friends-settings");
    },
    sharebattleshelp: [
      `/friends sharebattles [on|off] - Allow or disallow your friends from seeing your ongoing battles.`
    ]
  },
  friendshelp() {
    this.runBroadcast();
    if (this.broadcasting) {
      return this.sendReplyBox([
        `<code>/friend list</code> - View current friends.`,
        `<code>/friend add [name]</code> OR <code>/friend [name]</code> - Send a friend request to [name], if you don't have them added.`,
        `<code>/friend remove [username]</code> OR <code>/unfriend [username]</code>  - Unfriend the user.`,
        `<details class="readmore"><summary>More commands...</summary>`,
        `<code>/friend accept [username]</code> - Accepts the friend request from [username], if it exists.`,
        `<code>/friend reject [username]</code> - Rejects the friend request from [username], if it exists.`,
        `<code>/friend toggle [off/on]</code> - Enable or disable receiving of friend requests.`,
        `<code>/friend hidenotifications</code> OR <code>hidenotifs</code> - Opts out of receiving friend notifications.`,
        `<code>/friend viewnotifications</code> OR <code>viewnotifs</code> - Opts into view friend notifications.`,
        `<code>/friend listdisplay [on/off]</code> - Opts [in/out] of letting others view your friends list.`,
        `<code>/friend viewlist [user]</code> - View the given [user]'s friend list, if they're allowing others to see.`,
        `<code>/friends sharebattles [on|off]</code> - Allow or disallow your friends from seeing your ongoing battles.</details>`
      ].join("<br />"));
    }
    return this.parse("/join view-friends-help");
  }
};
const pages = {
  async friends(args, user) {
    if (!user.named)
      return Rooms.RETRY_AFTER_LOGIN;
    Friends.checkCanUse(this);
    const type = args.shift();
    let buf = '<div class="pad">';
    switch (toID(type)) {
      case "outgoing":
      case "sent":
        this.title = `[Friends] Sent`;
        buf += headerButtons("sent", user);
        if (user.settings.blockFriendRequests) {
          buf += `<h3>${this.tr(`You are currently blocking friend requests`)}.</h3>`;
        }
        const { sent } = await Chat.Friends.getRequests(user);
        if (sent.size < 1) {
          buf += `<strong>You have no outgoing friend requests pending.</strong><br />`;
          buf += `<br />To add a friend, use <code>/friend add [username]</code>.`;
          buf += `</div>`;
          return toLink(buf);
        }
        buf += `<h3>You have ${Chat.count(sent.size, "friend requests")} pending${sent.size === import_friends.MAX_REQUESTS ? ` (maximum reached)` : ""}.</h3>`;
        for (const request of sent) {
          buf += `<br /><div class="infobox">`;
          buf += `<strong>${request}</strong>`;
          buf += ` <button class="button" name="send" value="/friends undorequest ${request}">`;
          buf += `<i class="fa fa-undo"></i> ${this.tr("Undo")}</button>`;
          buf += `</div>`;
        }
        break;
      case "received":
      case "incoming":
        this.title = `[Friends] Received`;
        buf += headerButtons("received", user);
        const { received } = await Chat.Friends.getRequests(user);
        if (received.size < 1) {
          buf += `<strong>You have no pending friend requests.</strong>`;
          buf += `</div>`;
          return toLink(buf);
        }
        buf += `<h3>You have ${received.size} pending friend requests.</h3>`;
        for (const request of received) {
          buf += `<br /><div class="infobox">`;
          buf += `<strong>${request}</strong>`;
          buf += ` <button class="button" name="send" value="/friends accept ${request}">${this.tr("Accept")}</button> |`;
          buf += ` <button class="button" name="send" value="/friends reject ${request}">${this.tr("Deny")}</button>`;
          buf += `</div>`;
        }
        break;
      case "viewuser":
        const target = toID(args.shift());
        if (!target)
          return this.errorReply(`Specify a user.`);
        if (target === user.id) {
          return this.errorReply(`Use /friends list to view your own list.`);
        }
        const { public_list: isAllowing } = await Chat.Friends.getSettings(target);
        if (!isAllowing)
          return this.errorReply(`${target}'s friends list is not public or they do not have one.`);
        this.title = `[Friends List] ${target}`;
        buf += await Friends.visualizePublicList(target);
        break;
      case "help":
        this.title = `[Friends] Help`;
        buf += headerButtons("help", user);
        buf += `<h3>Help</h3>`;
        buf += `<strong>/friend OR /friends OR /friendslist:</strong><br /><ul><li>`;
        buf += [
          `<code>/friend list</code> - View current friends.`,
          `<code>/friend add [name]</code> OR <code>/friend [name]</code> - Send a friend request to [name], if you don't have them added.`,
          `<code>/friend remove [username]</code> OR <code>/unfriend [username]</code>  - Unfriend the user.`,
          `<code>/friend accept [username]</code> - Accepts the friend request from [username], if it exists.`,
          `<code>/friend reject [username]</code> - Rejects the friend request from [username], if it exists.`,
          `<code>/friend toggle [off/on]</code> - Enable or disable receiving of friend requests.`,
          `<code>/friend hidenotifications</code> OR <code>hidenotifs</code> - Opts out of receiving friend notifications.`,
          `<code>/friend viewnotifications</code> OR <code>viewnotifs</code> - Opts into view friend notifications.`,
          `<code>/friend listdisplay [on/off]</code> - Opts [in/out] of letting others view your friends list.`,
          `<code>/friend viewlist [user]</code> - View the given [user]'s friend list, if they're allowing others to see.`,
          `<code>/friends sharebattles [on|off]</code> - Allow or disallow your friends from seeing your ongoing battles.`
        ].join("</li><li>");
        buf += `</li></ul>`;
        break;
      case "settings":
        this.title = `[Friends] Settings`;
        buf += headerButtons("settings", user);
        buf += `<h3>Friends Settings:</h3>`;
        const settings = user.settings;
        const { public_list, send_login_data } = await Chat.Friends.getSettings(user.id);
        buf += `<strong>Notify me when my friends come online:</strong><br />`;
        buf += `<button class="button${settings.allowFriendNotifications ? `` : ` disabled`}" name="send" `;
        buf += `value="/friends hidenotifs">Disable</button> `;
        buf += `<button class="button${settings.allowFriendNotifications ? ` disabled` : ``}" name="send" `;
        buf += `value="/friends viewnotifs">Enable</button> <br /><br />`;
        buf += `<strong>Receive friend requests:</strong><br />`;
        buf += `<button class="button${settings.blockFriendRequests ? ` disabled` : ""}" name="send" `;
        buf += `value="/friends toggle off">Disable</button> `;
        buf += `<button class="button${settings.blockFriendRequests ? `` : ` disabled`}" name="send" `;
        buf += `value="/friends toggle on">Enable</button> <br /><br />`;
        buf += `<strong>Allow others to see your list:</strong><br />`;
        buf += `<button class="button${public_list ? ` disabled` : ""}" name="send" `;
        buf += `value="/friends listdisplay yes">Allow</button> `;
        buf += `<button class="button${public_list ? `` : ` disabled`}" name="send" `;
        buf += `value="/friends listdisplay no">Hide</button> <br /><br />`;
        buf += `<strong>Allow others to see my login times</strong><br />`;
        buf += `<button class="button${send_login_data ? ` disabled` : ""}" name="send" `;
        buf += `value="/friends hidelogins">Disable</button> `;
        buf += `<button class="button${send_login_data ? `` : " disabled"}" name="send" `;
        buf += `value="/friends showlogins">Enable</button><br /><br />`;
        buf += `<strong>Allow friends to see my hidden battles on the spectator list:</strong><br />`;
        buf += `<button class="button${settings.displayBattlesToFriends ? `` : " disabled"}" name="send" `;
        buf += `value="/friends sharebattles off">Disable</button> `;
        buf += `<button class="button${settings.displayBattlesToFriends ? ` disabled` : ``}" name="send" `;
        buf += `value="/friends sharebattles on">Enable</button> <br /><br />`;
        buf += `<strong>Block PMs except from friends (and staff):</strong><br />`;
        buf += `<button class="button${settings.blockPMs ? `` : " disabled"}" name="send" `;
        buf += `value="/unblockpms&#10;/j view-friends-settings">Disable</button> `;
        buf += `<button class="button${settings.blockPMs ? ` disabled` : ``}" name="send" `;
        buf += `value="/blockpms friends&#10;/j view-friends-settings">Enable</button> <br /><br />`;
        buf += `<strong>Block challenges except from friends (and staff):</strong><br />`;
        buf += `<button class="button${settings.blockChallenges ? `` : " disabled"}" name="send" `;
        buf += `value="/unblockchallenges&#10;/j view-friends-settings">Disable</button> `;
        buf += `<button class="button${settings.blockChallenges ? ` disabled` : ``}" name="send" `;
        buf += `value="/blockchallenges friends&#10;/j view-friends-settings">Enable</button> <br /><br />`;
        break;
      case "spectate":
        this.title = `[Friends] Spectating`;
        buf += headerButtons("spectate", user);
        buf += `<h3>Spectate your friends:</h3>`;
        const toggleMessage = user.settings.displayBattlesToFriends ? " disallow your friends from seeing your hidden battles" : " allow your friends to see your hidden battles";
        buf += `<i><small>Use the <a roomid="view-friends-settings">settings page</a> to ${toggleMessage} on this page.</small></i><br />`;
        buf += `<br />`;
        if (!user.friends?.size) {
          buf += `<h3>You have no friends to spectate.</h3>`;
          break;
        }
        const friends = [];
        for (const friendID of user.friends) {
          const friend = Users.getExact(friendID);
          if (!friend)
            continue;
          friends.push(friend);
        }
        if (!friends.length) {
          buf += `<em>None of your friends are currently around to spectate.</em>`;
          break;
        }
        const battles = [];
        for (const friend of friends) {
          const curBattles = [...friend.inRooms].filter((id) => {
            const battle = Rooms.get(id)?.battle;
            return battle && battle.playerTable[friend.id] && (!battle.roomid.endsWith("pw") || friend.settings.displayBattlesToFriends);
          }).map((id) => [friend, id]);
          if (!curBattles.length)
            continue;
          battles.push(...curBattles);
        }
        import_utils.Utils.sortBy(battles, ([, id]) => -Number(id.split("-")[2]));
        if (!battles.length) {
          buf += `<em>None of your friends are currently in a battle.</em>`;
        } else {
          buf += battles.map(([friend, battle]) => {
            const room = Rooms.get(battle);
            const format = Dex.formats.get(room.battle.format).name;
            const rated = room.battle.rated ? `<small style="float:right">(Rated: ${room.battle.rated})</small>` : "";
            const title = room.title.includes(friend.name) ? room.title.replace(friend.name, `<strong>${friend.name}</strong>`) : room.title + ` (with ${friend.name})`;
            return `<a class="blocklink" href="/${room.roomid}"><small>[${format}]</small>${rated}<br /> ${title}</a>`;
          }).join("<br />");
        }
        break;
      default:
        this.title = `[Friends] All Friends`;
        buf += headerButtons("all", user);
        buf += await Friends.visualizeList(user.id);
    }
    buf += `</div>`;
    return toLink(buf);
  }
};
const handlers = {
  onBattleStart(user) {
    return Friends.updateSpectatorLists(user);
  },
  onBattleLeave(user, room) {
    return Friends.updateSpectatorLists(user);
  },
  onBattleEnd(battle, winner, players) {
    for (const id of players) {
      const user = Users.get(id);
      if (!user)
        continue;
      Friends.updateSpectatorLists(user);
    }
  },
  onDisconnect(user) {
    void Chat.Friends.writeLogin(user.id);
  }
};
const loginfilter = (user) => {
  if (!Config.usesqlitefriends || !Users.globalAuth.atLeast(user, Config.usesqlitefriends)) {
    return;
  }
  void Friends.notifyPending(user);
  void Friends.notifyConnection(user);
  void Chat.Friends.writeLogin(user.id);
  void Chat.Friends.updateUserCache(user);
};
//# sourceMappingURL=friends.js.map
