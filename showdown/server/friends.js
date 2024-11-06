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
var friends_exports = {};
__export(friends_exports, {
  DEFAULT_FILE: () => DEFAULT_FILE,
  FailureMessage: () => FailureMessage,
  FriendsDatabase: () => FriendsDatabase,
  MAX_FRIENDS: () => MAX_FRIENDS,
  MAX_REQUESTS: () => MAX_REQUESTS,
  PM: () => PM,
  findFriendship: () => findFriendship,
  sendPM: () => sendPM
});
module.exports = __toCommonJS(friends_exports);
var import_lib = require("../lib");
var import_config_loader = require("./config-loader");
var path = __toESM(require("path"));
const MAX_FRIENDS = 100;
const MAX_REQUESTS = 6;
const DEFAULT_FILE = (0, import_lib.FS)("databases/friends.db").path;
const REQUEST_EXPIRY_TIME = 30 * 24 * 60 * 60 * 1e3;
const PM_TIMEOUT = 30 * 60 * 1e3;
class FailureMessage extends Error {
  constructor(message) {
    super(message);
    this.name = "FailureMessage";
    Error.captureStackTrace(this, FailureMessage);
  }
}
function sendPM(message, to, from = "&") {
  const senderID = toID(from);
  const receiverID = toID(to);
  const sendingUser = Users.get(senderID);
  const receivingUser = Users.get(receiverID);
  const fromIdentity = sendingUser ? sendingUser.getIdentity() : ` ${senderID}`;
  const toIdentity = receivingUser ? receivingUser.getIdentity() : ` ${receiverID}`;
  if (from === "&") {
    return receivingUser?.send(`|pm|&|${toIdentity}|${message}`);
  }
  receivingUser?.send(`|pm|${fromIdentity}|${toIdentity}|${message}`);
}
function canPM(sender, receiver) {
  if (!receiver || !receiver.settings.blockPMs)
    return true;
  if (receiver.settings.blockPMs === true)
    return sender.can("lock");
  if (receiver.settings.blockPMs === "friends")
    return false;
  return Users.globalAuth.atLeast(sender, receiver.settings.blockPMs);
}
class FriendsDatabase {
  constructor(file = DEFAULT_FILE) {
    this.file = file === ":memory:" ? file : path.resolve(file);
  }
  async updateUserCache(user) {
    user.friends = /* @__PURE__ */ new Set();
    const friends = await this.getFriends(user.id);
    for (const friend of friends) {
      user.friends.add(friend.userid);
    }
    return user.friends;
  }
  static setupDatabase(fileName) {
    const file = fileName || process.env.filename || DEFAULT_FILE;
    const exists = (0, import_lib.FS)(file).existsSync() || file === ":memory:";
    const database = new (require("better-sqlite3"))(file);
    if (!exists) {
      database.exec((0, import_lib.FS)("databases/schemas/friends.sql").readSync());
    } else {
      let val;
      try {
        val = database.prepare(`SELECT val FROM database_settings WHERE name = 'version'`).get().val;
      } catch {
      }
      const actualVersion = (0, import_lib.FS)(`databases/migrations/friends`).readdirIfExistsSync().length;
      if (val === void 0) {
        database.exec((0, import_lib.FS)("databases/schemas/friends.sql").readSync());
      }
      if (typeof val === "number" && val !== actualVersion) {
        throw new Error(`Friends DB is out of date, please migrate to latest version.`);
      }
    }
    database.exec((0, import_lib.FS)(`databases/schemas/friends-startup.sql`).readSync());
    for (const k in FUNCTIONS) {
      database.function(k, FUNCTIONS[k]);
    }
    for (const k in ACTIONS) {
      try {
        statements[k] = database.prepare(ACTIONS[k]);
      } catch (e) {
        throw new Error(`Friends DB statement crashed: ${ACTIONS[k]} (${e.message})`);
      }
    }
    for (const k in TRANSACTIONS) {
      transactions[k] = database.transaction(TRANSACTIONS[k]);
    }
    statements.expire.run();
    return { database, statements };
  }
  async getFriends(userid) {
    return await this.all("get", [userid, MAX_FRIENDS]) || [];
  }
  async getRequests(user) {
    const sent = /* @__PURE__ */ new Set();
    const received = /* @__PURE__ */ new Set();
    if (user.settings.blockFriendRequests) {
      await this.run("deleteReceivedRequests", [user.id]);
    }
    const sentResults = await this.all("getSent", [user.id]);
    if (sentResults === null)
      return { sent, received };
    for (const request of sentResults) {
      sent.add(request.receiver);
    }
    const receivedResults = await this.all("getReceived", [user.id]) || [];
    if (!receivedResults) {
      return { received, sent };
    }
    for (const request of receivedResults) {
      received.add(request.sender);
    }
    return { sent, received };
  }
  all(statement, data) {
    return this.query({ type: "all", data, statement });
  }
  transaction(statement, data) {
    return this.query({ data, statement, type: "transaction" });
  }
  run(statement, data) {
    return this.query({ statement, data, type: "run" });
  }
  get(statement, data) {
    return this.query({ statement, data, type: "get" });
  }
  async query(input) {
    const process2 = PM.acquire();
    if (!process2 || !import_config_loader.Config.usesqlite) {
      return null;
    }
    const result = await process2.query(input);
    if (result.error) {
      throw new Chat.ErrorMessage(result.error);
    }
    return result.result;
  }
  async request(user, receiverID) {
    const receiver = Users.getExact(receiverID);
    if (receiverID === user.id || receiver?.previousIDs.includes(user.id)) {
      throw new Chat.ErrorMessage(`You can't friend yourself.`);
    }
    if (receiver?.settings.blockFriendRequests) {
      throw new Chat.ErrorMessage(`${receiver.name} is blocking friend requests.`);
    }
    let buf = import_lib.Utils.html`/uhtml sent-${user.id},<button class="button" name="send" value="/friends accept ${user.id}">Accept</button> | `;
    buf += import_lib.Utils.html`<button class="button" name="send" value="/friends reject ${user.id}">Deny</button><br /> `;
    buf += `<small>(You can also stop this user from sending you friend requests with <code>/ignore</code>)</small>`;
    const disclaimer = `/raw <small>Note: If this request is accepted, your friend will be notified when you come online, and you will be notified when they do, unless you opt out of receiving them.</small>`;
    if (receiver?.settings.blockFriendRequests) {
      throw new Chat.ErrorMessage(`This user is blocking friend requests.`);
    }
    if (!canPM(user, receiver)) {
      throw new Chat.ErrorMessage(`This user is blocking PMs, and cannot be friended right now.`);
    }
    const result = await this.transaction("send", [user.id, receiverID]);
    if (receiver) {
      sendPM(`/raw <span class="username">${user.name}</span> sent you a friend request!`, receiver.id, user.id);
      sendPM(buf, receiver.id, user.id);
      sendPM(disclaimer, receiver.id, user.id);
    }
    sendPM(
      `/nonotify You sent a friend request to ${receiver?.connected ? receiver.name : receiverID}!`,
      user.name
    );
    sendPM(
      `/uhtml undo-${receiverID},<button class="button" name="send" value="/friends undorequest ${import_lib.Utils.escapeHTML(receiverID)}"><i class="fa fa-undo"></i> Undo</button>`,
      user.name
    );
    sendPM(disclaimer, user.id);
    return result;
  }
  async removeRequest(receiverID, senderID) {
    if (!senderID)
      throw new Chat.ErrorMessage(`Invalid sender username.`);
    if (!receiverID)
      throw new Chat.ErrorMessage(`Invalid receiver username.`);
    return this.run("deleteRequest", [senderID, receiverID]);
  }
  async approveRequest(receiverID, senderID) {
    return this.transaction("accept", [senderID, receiverID]);
  }
  async removeFriend(userid, friendID) {
    if (!friendID || !userid)
      throw new Chat.ErrorMessage(`Invalid usernames supplied.`);
    const result = await this.run("delete", { user1: userid, user2: friendID });
    if (result.changes < 1) {
      throw new Chat.ErrorMessage(`You do not have ${friendID} friended.`);
    }
  }
  writeLogin(user) {
    return this.run("login", [user, Date.now(), Date.now()]);
  }
  hideLoginData(id) {
    return this.run("hideLogin", [id, Date.now()]);
  }
  allowLoginData(id) {
    return this.run("showLogin", [id]);
  }
  async getLastLogin(userid) {
    const result = await this.get("checkLastLogin", [userid]);
    return parseInt(result?.["last_login"]) || null;
  }
  async getSettings(userid) {
    return await this.get("getSettings", [userid]) || {};
  }
  setHideList(userid, setting) {
    const num = setting ? 1 : 0;
    return this.run("toggleList", [userid, num, num]);
  }
  async findFriendship(user1, user2) {
    user1 = toID(user1);
    user2 = toID(user2);
    return !!(await this.get("findFriendship", { user1, user2 }))?.length;
  }
}
const statements = {};
const transactions = {};
const ACTIONS = {
  add: `REPLACE INTO friends (user1, user2) VALUES ($user1, $user2) ON CONFLICT (user1, user2) DO UPDATE SET user1 = $user1, user2 = $user2`,
  get: `SELECT * FROM friends_simplified f LEFT JOIN friend_settings fs ON f.friend = fs.userid WHERE f.userid = ? LIMIT ?`,
  delete: `DELETE FROM friends WHERE (user1 = $user1 AND user2 = $user2) OR (user1 = $user2 AND user2 = $user1)`,
  getSent: `SELECT receiver, sender FROM friend_requests WHERE sender = ?`,
  getReceived: `SELECT receiver, sender FROM friend_requests WHERE receiver = ?`,
  insertRequest: `INSERT INTO friend_requests(sender, receiver, sent_at) VALUES (?, ?, ?)`,
  deleteRequest: `DELETE FROM friend_requests WHERE sender = ? AND receiver = ?`,
  deleteReceivedRequests: `DELETE FROM friend_requests WHERE receiver = ?`,
  findFriendship: `SELECT * FROM friends WHERE (user1 = $user1 AND user2 = $user2) OR (user2 = $user1 AND user1 = $user2)`,
  findRequest: `SELECT count(*) as num FROM friend_requests WHERE (sender = $user1 AND receiver = $user2) OR (sender = $user2 AND receiver = $user1)`,
  countRequests: `SELECT count(*) as num FROM friend_requests WHERE (sender = ? OR receiver = ?)`,
  login: `INSERT INTO friend_settings (userid, send_login_data, last_login, public_list) VALUES (?, 0, ?, 0) ON CONFLICT (userid) DO UPDATE SET last_login = ?`,
  checkLastLogin: `SELECT last_login FROM friend_settings WHERE userid = ?`,
  deleteLogin: `UPDATE friend_settings SET last_login = 0 WHERE userid = ?`,
  expire: `DELETE FROM friend_requests WHERE EXISTS(SELECT sent_at FROM friend_requests WHERE should_expire(sent_at) = 1)`,
  hideLogin: (
    // this works since if the insert works, they have no data, which means no public_list
    `INSERT INTO friend_settings (userid, send_login_data, last_login, public_list) VALUES (?, 1, ?, 0) ON CONFLICT (userid) DO UPDATE SET send_login_data = 1`
  ),
  showLogin: `DELETE FROM friend_settings WHERE userid = ? AND send_login_data = 1`,
  countFriends: `SELECT count(*) as num FROM friends WHERE (user1 = ? OR user2 = ?)`,
  getSettings: `SELECT * FROM friend_settings WHERE userid = ?`,
  toggleList: `INSERT INTO friend_settings (userid, send_login_data, last_login, public_list) VALUES (?, 0, 0, ?) ON CONFLICT (userid) DO UPDATE SET public_list = ?`
};
const FUNCTIONS = {
  "should_expire": (sentTime) => {
    if (Date.now() - sentTime > REQUEST_EXPIRY_TIME)
      return 1;
    return 0;
  }
};
const TRANSACTIONS = {
  send: (requests) => {
    for (const request of requests) {
      const [senderID, receiverID] = request;
      const hasSentRequest = statements.findRequest.get({ user1: senderID, user2: receiverID })["num"];
      const friends = statements.countFriends.get(senderID, senderID)["num"];
      const totalRequests = statements.countRequests.get(senderID, senderID)["num"];
      if (friends >= MAX_FRIENDS) {
        throw new FailureMessage(`You are at the maximum number of friends.`);
      }
      const existingFriendship = statements.findFriendship.all({ user1: senderID, user2: receiverID });
      if (existingFriendship.length) {
        throw new FailureMessage(`You are already friends with '${receiverID}'.`);
      }
      if (hasSentRequest) {
        throw new FailureMessage(`You have already sent a friend request to '${receiverID}'.`);
      }
      if (totalRequests >= MAX_REQUESTS) {
        throw new FailureMessage(
          `You already have ${MAX_REQUESTS} pending friend requests. Use "/friends view sent" to see your outgoing requests and "/friends view receive" to see your incoming requests.`
        );
      }
      statements.insertRequest.run(senderID, receiverID, Date.now());
    }
    return { result: [] };
  },
  add: (requests) => {
    for (const request of requests) {
      const [senderID, receiverID] = request;
      statements.add.run({ user1: senderID, user2: receiverID });
    }
    return { result: [] };
  },
  accept: (requests) => {
    for (const request of requests) {
      const [senderID, receiverID] = request;
      const friends = statements.get.all(receiverID, 101);
      if (friends?.length >= MAX_FRIENDS) {
        throw new FailureMessage(`You are at the maximum number of friends.`);
      }
      const { result } = TRANSACTIONS.removeRequest([request]);
      if (!result.length)
        throw new FailureMessage(`You have no request pending from ${senderID}.`);
      TRANSACTIONS.add([request]);
    }
    return { result: [] };
  },
  removeRequest: (requests) => {
    const result = [];
    for (const request of requests) {
      const [to, from] = request;
      const { changes } = statements.deleteRequest.run(to, from);
      if (changes)
        result.push(changes);
    }
    return { result };
  }
};
function findFriendship(users) {
  setup();
  return !!statements.findFriendship.get({ user1: users[0], user2: users[1] });
}
const setup = () => {
  if (!process.send)
    throw new Error("You should not be using this function in the main process");
  if (!Object.keys(statements).length)
    FriendsDatabase.setupDatabase();
};
const PM = new import_lib.ProcessManager.QueryProcessManager(module, (query) => {
  const { type, statement, data } = query;
  const start = Date.now();
  const result = {};
  try {
    switch (type) {
      case "run":
        result.result = statements[statement].run(data);
        break;
      case "get":
        result.result = statements[statement].get(data);
        break;
      case "transaction":
        result.result = transactions[statement]([data]);
        break;
      case "all":
        result.result = statements[statement].all(data);
        break;
    }
  } catch (e) {
    if (!e.name.endsWith("FailureMessage")) {
      result.error = "Sorry! The database process crashed. We've been notified and will fix this.";
      Monitor.crashlog(e, "A friends database process", query);
    } else {
      result.error = e.message;
    }
    return result;
  }
  const delta = Date.now() - start;
  if (delta > 1e3) {
    Monitor.slow(`[Slow friends list query] ${JSON.stringify(query)}`);
  }
  return result;
}, PM_TIMEOUT, (message) => {
  if (message.startsWith("SLOW\n")) {
    Monitor.slow(message.slice(5));
  }
});
if (require.main === module) {
  global.Config = require("./config-loader").Config;
  if (import_config_loader.Config.usesqlite) {
    FriendsDatabase.setupDatabase();
  }
  if (process.mainModule === module) {
    global.Monitor = {
      crashlog(error, source = "A friends database process", details = null) {
        const repr = JSON.stringify([error.name, error.message, source, details]);
        process.send(`THROW
@!!@${repr}
${error.stack}`);
      },
      slow(message) {
        process.send(`CALLBACK
SLOW
${message}`);
      }
    };
    process.on("uncaughtException", (err) => {
      if (import_config_loader.Config.crashguard) {
        Monitor.crashlog(err, "A friends child process");
      }
    });
    import_lib.Repl.start(`friends-${process.pid}`, (cmd) => eval(cmd));
  }
} else if (!process.send) {
  PM.spawn(import_config_loader.Config.friendsprocesses || 1);
}
//# sourceMappingURL=friends.js.map
