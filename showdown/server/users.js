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
var users_exports = {};
__export(users_exports, {
  Connection: () => Connection,
  User: () => User,
  Users: () => Users
});
module.exports = __toCommonJS(users_exports);
var import_lib = require("../lib");
var import_user_groups = require("./user-groups");
/**
 * Users
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * Most of the communication with users happens here.
 *
 * There are two object types this file introduces:
 * User and Connection.
 *
 * A User object is a user, identified by username. A guest has a
 * username in the form "Guest 12". Any user whose username starts
 * with "Guest" must be a guest; normal users are not allowed to
 * use usernames starting with "Guest".
 *
 * A User can be connected to Pokemon Showdown from any number of tabs
 * or computers at the same time. Each connection is represented by
 * a Connection object. A user tracks its connections in
 * user.connections - if this array is empty, the user is offline.
 *
 * `Users.users` is the global table of all users, a `Map` of `ID:User`.
 * Users should normally be accessed with `Users.get(userid)`
 *
 * `Users.connections` is the global table of all connections, a `Map` of
 * `string:Connection` (the string is mostly meaningless but see
 * `connection.id` for details). Connections are normally accessed through
 * `user.connections`.
 *
 * @license MIT
 */
const THROTTLE_DELAY = 600;
const THROTTLE_DELAY_TRUSTED = 100;
const THROTTLE_DELAY_PUBLIC_BOT = 25;
const THROTTLE_BUFFER_LIMIT = 6;
const THROTTLE_MULTILINE_WARN = 3;
const THROTTLE_MULTILINE_WARN_STAFF = 6;
const THROTTLE_MULTILINE_WARN_ADMIN = 25;
const NAMECHANGE_THROTTLE = 2 * 60 * 1e3;
const NAMES_PER_THROTTLE = 3;
const PERMALOCK_CACHE_TIME = 30 * 24 * 60 * 60 * 1e3;
const DEFAULT_TRAINER_SPRITES = [1, 2, 101, 102, 169, 170, 265, 266];
const MINUTES = 60 * 1e3;
const IDLE_TIMER = 60 * MINUTES;
const STAFF_IDLE_TIMER = 30 * MINUTES;
const CONNECTION_EXPIRY_TIME = 24 * 60 * MINUTES;
function move(user, newUserid) {
  if (user.id === newUserid)
    return true;
  if (!user)
    return false;
  prevUsers.delete(newUserid);
  prevUsers.set(user.id, newUserid);
  users.delete(user.id);
  user.id = newUserid;
  users.set(newUserid, user);
  return true;
}
function add(user) {
  if (user.id)
    throw new Error(`Adding a user that already exists`);
  numUsers++;
  user.guestNum = numUsers;
  user.name = `Guest ${numUsers}`;
  user.id = toID(user.name);
  if (users.has(user.id))
    throw new Error(`userid taken: ${user.id}`);
  users.set(user.id, user);
}
function deleteUser(user) {
  prevUsers.delete("guest" + user.guestNum);
  users.delete(user.id);
}
function merge(toRemain, toDestroy) {
  prevUsers.delete(toRemain.id);
  prevUsers.set(toDestroy.id, toRemain.id);
}
function getUser(name, exactName = false) {
  if (!name || name === "!")
    return null;
  if (name.id)
    return name;
  let userid = toID(name);
  let i = 0;
  if (!exactName) {
    while (userid && !users.has(userid) && i < 1e3) {
      userid = prevUsers.get(userid);
      i++;
    }
  }
  return users.get(userid) || null;
}
function getExactUser(name) {
  return getUser(name, true);
}
function findUsers(userids, ips, options = {}) {
  const matches = [];
  if (options.forPunishment)
    ips = ips.filter((ip) => !Punishments.isSharedIp(ip));
  const ipMatcher = IPTools.checker(ips);
  for (const user of users.values()) {
    if (!options.forPunishment && !user.named && !user.connected)
      continue;
    if (!options.includeTrusted && user.trusted)
      continue;
    if (userids.includes(user.id)) {
      matches.push(user);
      continue;
    }
    if (user.ips.some(ipMatcher)) {
      matches.push(user);
    }
  }
  return matches;
}
const globalAuth = new import_user_groups.GlobalAuth();
function isUsernameKnown(name) {
  const userid = toID(name);
  if (Users.get(userid))
    return true;
  if (globalAuth.has(userid))
    return true;
  for (const room of Rooms.global.chatRooms) {
    if (room.auth.has(userid))
      return true;
  }
  return false;
}
function isUsername(name) {
  return /[A-Za-z0-9]/.test(name.charAt(0)) && /[A-Za-z]/.test(name) && !name.includes(",");
}
function isTrusted(userid) {
  if (globalAuth.has(userid))
    return userid;
  for (const room of Rooms.global.chatRooms) {
    if (room.persist && room.settings.isPrivate !== true && room.auth.isStaff(userid)) {
      return userid;
    }
  }
  const staffRoom = Rooms.get("staff");
  const staffAuth = staffRoom && !!(staffRoom.auth.has(userid) || staffRoom.users[userid]);
  return staffAuth ? userid : false;
}
function isPublicBot(userid) {
  if (globalAuth.get(userid) === "*")
    return true;
  for (const room of Rooms.global.chatRooms) {
    if (room.persist && !room.settings.isPrivate && room.auth.get(userid) === "*") {
      return true;
    }
  }
  return false;
}
const connections = /* @__PURE__ */ new Map();
class Connection {
  constructor(id, worker, socketid, user, ip, protocol) {
    /**
     * Used to distinguish Connection from User.
     *
     * Makes it easy to do something like
     * `for (const conn of (userOrConn.connections || [userOrConn]))`
     */
    this.connections = null;
    const now = Date.now();
    this.id = id;
    this.socketid = socketid;
    this.worker = worker;
    this.inRooms = /* @__PURE__ */ new Set();
    this.ip = ip || "";
    this.protocol = protocol || "";
    this.connectedAt = now;
    this.user = user;
    this.challenge = "";
    this.autojoins = "";
    this.lastRequestedPage = null;
    this.lastActiveTime = now;
    this.openPages = null;
  }
  sendTo(roomid, data) {
    if (roomid && typeof roomid !== "string")
      roomid = roomid.roomid;
    if (roomid && roomid !== "lobby")
      data = `>${roomid}
${data}`;
    Sockets.socketSend(this.worker, this.socketid, data);
    Monitor.countNetworkUse(data.length);
  }
  send(data) {
    Sockets.socketSend(this.worker, this.socketid, data);
    Monitor.countNetworkUse(data.length);
  }
  destroy() {
    Sockets.socketDisconnect(this.worker, this.socketid);
    this.onDisconnect();
  }
  onDisconnect() {
    connections.delete(this.id);
    if (this.user)
      this.user.onDisconnect(this);
    this.user = null;
  }
  popup(message) {
    this.send(`|popup|` + message.replace(/\n/g, "||"));
  }
  joinRoom(room) {
    if (this.inRooms.has(room.roomid))
      return;
    this.inRooms.add(room.roomid);
    Sockets.roomAdd(this.worker, room.roomid, this.socketid);
  }
  leaveRoom(room) {
    if (this.inRooms.has(room.roomid)) {
      this.inRooms.delete(room.roomid);
      Sockets.roomRemove(this.worker, room.roomid, this.socketid);
    }
  }
  toString() {
    let buf = this.user ? `${this.user.id}[${this.user.connections.indexOf(this)}]` : `[disconnected]`;
    buf += `:${this.ip}`;
    if (this.protocol !== "websocket")
      buf += `:${this.protocol}`;
    return buf;
  }
}
class User extends Chat.MessageContext {
  constructor(connection) {
    super(connection.user);
    this.lastNewNameTime = 0;
    this.newNames = 0;
    this.user = this;
    this.inRooms = /* @__PURE__ */ new Set();
    this.games = /* @__PURE__ */ new Set();
    this.mmrCache = /* @__PURE__ */ Object.create(null);
    this.guestNum = -1;
    this.name = "";
    this.named = false;
    this.registered = false;
    this.id = "";
    this.tempGroup = import_user_groups.Auth.defaultSymbol();
    this.language = null;
    this.avatar = DEFAULT_TRAINER_SPRITES[Math.floor(Math.random() * DEFAULT_TRAINER_SPRITES.length)];
    this.connected = true;
    Users.onlineCount++;
    if (connection.user)
      connection.user = this;
    this.connections = [connection];
    this.latestHost = "";
    this.latestHostType = "";
    this.ips = [connection.ip];
    this.latestIp = connection.ip;
    this.locked = null;
    this.semilocked = null;
    this.namelocked = null;
    this.permalocked = null;
    this.punishmentTimer = null;
    this.previousIDs = [];
    this.lastChallenge = 0;
    this.lastPM = "";
    this.lastMatch = "";
    this.settings = {
      blockChallenges: false,
      blockPMs: false,
      ignoreTickets: false,
      hideBattlesFromTrainerCard: false,
      blockInvites: false,
      doNotDisturb: false,
      blockFriendRequests: false,
      allowFriendNotifications: false,
      displayBattlesToFriends: false,
      hideLogins: false
    };
    this.battleSettings = {
      team: "",
      hidden: false,
      inviteOnly: false
    };
    this.isSysop = false;
    this.isStaff = false;
    this.isPublicBot = false;
    this.lastDisconnected = 0;
    this.lastConnected = connection.connectedAt;
    this.chatQueue = null;
    this.chatQueueTimeout = null;
    this.lastChatMessage = 0;
    this.lastCommand = "";
    this.lastMessage = ``;
    this.lastMessageTime = 0;
    this.lastReportTime = 0;
    this.s1 = "";
    this.s2 = "";
    this.s3 = "";
    this.notified = {
      blockChallenges: false,
      blockPMs: false,
      blockInvites: false,
      punishment: false,
      lock: false
    };
    this.autoconfirmed = "";
    this.trusted = "";
    this.trackRename = "";
    this.statusType = "online";
    this.userMessage = "";
    this.lastWarnedAt = 0;
    Users.add(this);
  }
  sendTo(roomid, data) {
    if (roomid && typeof roomid !== "string")
      roomid = roomid.roomid;
    if (roomid && roomid !== "lobby")
      data = `>${roomid}
${data}`;
    for (const connection of this.connections) {
      if (roomid && !connection.inRooms.has(roomid))
        continue;
      connection.send(data);
      Monitor.countNetworkUse(data.length);
    }
  }
  send(data) {
    for (const connection of this.connections) {
      connection.send(data);
      Monitor.countNetworkUse(data.length);
    }
  }
  popup(message) {
    this.send(`|popup|` + message.replace(/\n/g, "||"));
  }
  getIdentity(room = null) {
    const punishgroups = Config.punishgroups || { locked: null, muted: null };
    if (this.locked || this.namelocked) {
      const lockedSymbol = punishgroups.locked && punishgroups.locked.symbol || "\u203D";
      return lockedSymbol + this.name;
    }
    if (room) {
      if (room.isMuted(this)) {
        const mutedSymbol = punishgroups.muted && punishgroups.muted.symbol || "!";
        return mutedSymbol + this.name;
      }
      return room.auth.get(this) + this.name;
    }
    if (this.semilocked) {
      const mutedSymbol = punishgroups.muted && punishgroups.muted.symbol || "!";
      return mutedSymbol + this.name;
    }
    return this.tempGroup + this.name;
  }
  getIdentityWithStatus(room = null) {
    const identity = this.getIdentity(room);
    const status = this.statusType === "online" ? "" : "@!";
    return `${identity}${status}`;
  }
  getStatus() {
    const statusMessage = this.statusType === "busy" ? "!(Busy) " : this.statusType === "idle" ? "!(Idle) " : "";
    const status = statusMessage + (this.userMessage || "");
    return status;
  }
  can(permission, target = null, room = null, cmd, cmdToken) {
    return import_user_groups.Auth.hasPermission(this, permission, target, room, cmd, cmdToken);
  }
  /**
   * Special permission check for system operators
   */
  hasSysopAccess() {
    if (this.isSysop && Config.backdoor) {
      return true;
    }
    return false;
  }
  /**
   * Permission check for using the dev console
   *
   * The `console` permission is incredibly powerful because it allows the
   * execution of abitrary shell commands on the local computer As such, it
   * can only be used from a specified whitelist of IPs and userids. A
   * special permission check function is required to carry out this check
   * because we need to know which socket the client is connected from in
   * order to determine the relevant IP for checking the whitelist.
   */
  hasConsoleAccess(connection) {
    if (this.hasSysopAccess())
      return true;
    if (!this.can("console"))
      return false;
    const whitelist = Config.consoleips || ["127.0.0.1"];
    return whitelist.includes(connection.ip) || whitelist.includes(this.id);
  }
  resetName(isForceRenamed = false) {
    return this.forceRename("Guest " + this.guestNum, false, isForceRenamed);
  }
  updateIdentity(roomid = null) {
    if (roomid) {
      return Rooms.get(roomid).onUpdateIdentity(this);
    }
    for (const inRoomID of this.inRooms) {
      Rooms.get(inRoomID).onUpdateIdentity(this);
    }
  }
  async validateToken(token, name, userid, connection) {
    if (!token && Config.noguestsecurity) {
      if (Users.isTrusted(userid)) {
        this.send(`|nametaken|${name}|You need an authentication token to log in as a trusted user.`);
        return null;
      }
      return "1";
    }
    if (!token || token.startsWith(";")) {
      this.send(`|nametaken|${name}|Your authentication token was invalid.`);
      return null;
    }
    let challenge = "";
    if (connection) {
      challenge = connection.challenge;
    }
    if (!challenge) {
      Monitor.warn(`verification failed; no challenge`);
      return null;
    }
    const [tokenData, tokenSig] = import_lib.Utils.splitFirst(token, ";");
    const tokenDataSplit = tokenData.split(",");
    const [signedChallenge, signedUserid, userType, signedDate, signedHostname] = tokenDataSplit;
    if (signedHostname && Config.legalhosts && !Config.legalhosts.includes(signedHostname)) {
      Monitor.warn(`forged assertion: ${tokenData}`);
      this.send(`|nametaken|${name}|Your assertion is for the wrong server. This server is ${Config.legalhosts[0]}.`);
      return null;
    }
    if (tokenDataSplit.length < 5) {
      Monitor.warn(`outdated assertion format: ${tokenData}`);
      this.send(`|nametaken|${name}|The assertion you sent us is corrupt or incorrect. Please send the exact assertion given by the login server's JSON response.`);
      return null;
    }
    if (signedUserid !== userid) {
      this.send(`|nametaken|${name}|Your verification signature doesn't match your new username.`);
      return null;
    }
    if (signedChallenge !== challenge) {
      Monitor.debug(`verify token challenge mismatch: ${signedChallenge} <=> ${challenge}`);
      this.send(`|nametaken|${name}|Your verification signature doesn't match your authentication token.`);
      return null;
    }
    const expiry = Config.tokenexpiry || 25 * 60 * 60;
    if (Math.abs(parseInt(signedDate) - Date.now() / 1e3) > expiry) {
      Monitor.warn(`stale assertion: ${tokenData}`);
      this.send(`|nametaken|${name}|Your assertion is stale. This usually means that the clock on the server computer is incorrect. If this is your server, please set the clock to the correct time.`);
      return null;
    }
    const success = await Verifier.verify(tokenData, tokenSig);
    if (!success) {
      Monitor.warn(`verify failed: ${token}`);
      Monitor.warn(`challenge was: ${challenge}`);
      this.send(`|nametaken|${name}|Your verification signature was invalid.`);
      return null;
    }
    this.s1 = tokenDataSplit[5];
    this.s2 = tokenDataSplit[6];
    this.s3 = tokenDataSplit[7];
    return userType;
  }
  /**
   * Do a rename, passing and validating a login token.
   *
   * @param name The name you want
   * @param token Signed assertion returned from login server
   * @param newlyRegistered Make sure this account will identify as registered
   * @param connection The connection asking for the rename
   */
  async rename(name, token, newlyRegistered, connection) {
    let userid = toID(name);
    if (userid !== this.id) {
      for (const roomid of this.games) {
        const room = Rooms.get(roomid);
        if (!room?.game || room.game.ended) {
          this.games.delete(roomid);
          console.log(`desynced roomgame ${roomid} renaming ${this.id} -> ${userid}`);
          continue;
        }
        if (room.game.allowRenames || !this.named)
          continue;
        this.popup(`You can't change your name right now because you're in ${room.game.title}, which doesn't allow renaming.`);
        return false;
      }
    }
    if (!name)
      name = "";
    if (!/[a-zA-Z]/.test(name)) {
      this.send(`|nametaken||Your name must contain at least one letter.`);
      return false;
    }
    if (userid.length > 18) {
      this.send(`|nametaken||Your name must be 18 characters or shorter.`);
      return false;
    }
    name = Chat.namefilter(name, this);
    if (userid !== toID(name)) {
      if (name) {
        name = userid;
      } else {
        userid = "";
      }
    }
    if (this.registered)
      newlyRegistered = false;
    if (!userid) {
      this.send(`|nametaken||Your name contains a banned word.`);
      return false;
    } else {
      if (userid === this.id && !newlyRegistered) {
        return this.forceRename(name, this.registered);
      }
    }
    const userType = await this.validateToken(token, name, userid, connection);
    if (userType === null)
      return;
    if (userType === "1")
      newlyRegistered = false;
    if (!this.trusted && userType === "1") {
      const elapsed = Date.now() - this.lastNewNameTime;
      if (elapsed < NAMECHANGE_THROTTLE && !Config.nothrottle) {
        if (this.newNames >= NAMES_PER_THROTTLE) {
          this.send(
            `|nametaken|${name}|You must wait ${Chat.toDurationString(NAMECHANGE_THROTTLE - elapsed)} more
						seconds before using another unregistered name.`
          );
          return false;
        }
        this.newNames++;
      } else {
        this.lastNewNameTime = Date.now();
        this.newNames = 1;
      }
    }
    this.handleRename(name, userid, newlyRegistered, userType);
  }
  handleRename(name, userid, newlyRegistered, userType) {
    const registered = userType !== "1";
    const conflictUser = users.get(userid);
    if (conflictUser) {
      let canMerge = registered && conflictUser.registered;
      if (!registered && !conflictUser.registered && conflictUser.latestIp === this.latestIp && !conflictUser.connected) {
        canMerge = true;
      }
      if (!canMerge) {
        if (registered && !conflictUser.registered) {
          if (conflictUser !== this)
            conflictUser.resetName();
        } else {
          this.send(`|nametaken|${name}|Someone is already using the name "${conflictUser.name}".`);
          return false;
        }
      }
    }
    if (registered) {
      if (userType === "3") {
        this.isSysop = true;
        this.isStaff = true;
        this.trusted = userid;
        this.autoconfirmed = userid;
      } else if (userType === "4") {
        this.autoconfirmed = userid;
      } else if (userType === "5") {
        this.permalocked = userid;
        void Punishments.lock(this, Date.now() + PERMALOCK_CACHE_TIME, userid, true, `Permalocked as ${name}`, true);
      } else if (userType === "6") {
        void Punishments.lock(this, Date.now() + PERMALOCK_CACHE_TIME, userid, true, `Permabanned as ${name}`, true);
        this.disconnectAll();
      }
    }
    if (Users.isTrusted(userid)) {
      this.trusted = userid;
      this.autoconfirmed = userid;
    }
    if (this.trusted) {
      this.locked = null;
      this.namelocked = null;
      this.permalocked = null;
      this.semilocked = null;
      this.destroyPunishmentTimer();
    }
    this.isPublicBot = Users.isPublicBot(userid);
    Chat.runHandlers("onRename", this, this.id, userid);
    let user = users.get(userid);
    const possibleUser = Users.get(userid);
    if (possibleUser?.namelocked) {
      user = possibleUser;
    }
    if (user && user !== this) {
      user.merge(this);
      Users.merge(user, this);
      for (const id of this.previousIDs) {
        if (!user.previousIDs.includes(id))
          user.previousIDs.push(id);
      }
      if (this.named && !user.previousIDs.includes(this.id))
        user.previousIDs.push(this.id);
      this.destroy();
      Punishments.checkName(user, userid, registered);
      Rooms.global.checkAutojoin(user);
      Rooms.global.rejoinGames(user);
      Chat.loginfilter(user, this, userType);
      return true;
    }
    Punishments.checkName(this, userid, registered);
    if (this.namelocked) {
      Chat.loginfilter(this, null, userType);
      return false;
    }
    if (!this.forceRename(name, registered)) {
      return false;
    }
    Rooms.global.checkAutojoin(this);
    Rooms.global.rejoinGames(this);
    Chat.loginfilter(this, null, userType);
    return true;
  }
  forceRename(name, registered, isForceRenamed = false) {
    const userid = toID(name);
    if (users.has(userid) && users.get(userid) !== this) {
      return false;
    }
    const oldname = this.name;
    const oldid = this.id;
    if (userid !== this.id) {
      this.cancelReady();
      if (!Users.move(this, userid)) {
        return false;
      }
      this.mmrCache = {};
      this.updateGroup(registered);
    } else if (registered) {
      this.updateGroup(registered);
    }
    if (this.named && oldid !== userid && !this.previousIDs.includes(oldid))
      this.previousIDs.push(oldid);
    this.name = name;
    const joining = !this.named;
    this.named = !userid.startsWith("guest") || !!this.namelocked;
    if (isForceRenamed)
      this.userMessage = "";
    for (const connection of this.connections) {
      connection.send(this.getUpdateuserText());
    }
    for (const roomid of this.games) {
      const room = Rooms.get(roomid);
      if (!room) {
        Monitor.warn(`while renaming, room ${roomid} expired for user ${this.id} in rooms ${[...this.inRooms]} and games ${[...this.games]}`);
        this.games.delete(roomid);
        continue;
      }
      if (!room.game) {
        Monitor.warn(`game desync for user ${this.id} in room ${room.roomid}`);
        this.games.delete(roomid);
        continue;
      }
      room.game.onRename(this, oldid, joining, isForceRenamed);
    }
    for (const roomid of this.inRooms) {
      const room = Rooms.get(roomid);
      room.onRename(this, oldid, joining);
      if (room.game && !this.games.has(roomid)) {
        if (room.game.playerTable[this.id]) {
          this.games.add(roomid);
          room.game.onRename(this, oldid, joining, isForceRenamed);
        }
      }
    }
    if (isForceRenamed)
      this.trackRename = oldname;
    return true;
  }
  getUpdateuserText() {
    const named = this.named ? 1 : 0;
    const settings = {
      ...this.settings,
      // Battle privacy state needs to be propagated in addition to regular settings so that the
      // 'Ban spectators' checkbox on the client can be kept in sync (and disable privacy correctly)
      hiddenNextBattle: this.battleSettings.hidden,
      inviteOnlyNextBattle: this.battleSettings.inviteOnly,
      language: this.language
    };
    return `|updateuser|${this.getIdentityWithStatus()}|${named}|${this.avatar}|${JSON.stringify(settings)}`;
  }
  update() {
    this.send(this.getUpdateuserText());
  }
  /**
   * If Alice logs into Bob's account, and Bob is currently logged into PS,
   * their connections will be merged, so that both `Connection`s are attached
   * to the Alice `User`.
   *
   * In this function, `this` is Bob, and `oldUser` is Alice.
   *
   * This is a pretty routine thing: If Alice opens PS, then opens PS again in
   * a new tab, PS will first create a Guest `User`, then automatically log in
   * and merge that Guest `User` into the Alice `User` from the first tab.
   */
  merge(oldUser) {
    oldUser.cancelReady();
    for (const roomid of oldUser.inRooms) {
      Rooms.get(roomid).onLeave(oldUser);
    }
    const oldLocked = this.locked;
    const oldSemilocked = this.semilocked;
    if (!oldUser.semilocked)
      this.semilocked = null;
    if ((!oldUser.locked || !this.locked) && oldUser.locked !== oldUser.id && this.locked !== this.id && // Only unlock if no previous names are locked
    !oldUser.previousIDs.some((id) => !!Punishments.hasPunishType(id, "LOCK"))) {
      this.locked = null;
      this.destroyPunishmentTimer();
    } else if (this.locked !== this.id) {
      this.locked = oldUser.locked;
    }
    if (oldUser.autoconfirmed)
      this.autoconfirmed = oldUser.autoconfirmed;
    this.updateGroup(this.registered, true);
    if (oldLocked !== this.locked || oldSemilocked !== this.semilocked)
      this.updateIdentity();
    const isBusy = this.statusType === "busy" || oldUser.statusType === "busy";
    this.setStatusType(isBusy ? "busy" : "online");
    for (const connection of oldUser.connections) {
      this.mergeConnection(connection);
    }
    oldUser.inRooms.clear();
    oldUser.connections = [];
    if (oldUser.chatQueue) {
      if (!this.chatQueue)
        this.chatQueue = [];
      this.chatQueue.push(...oldUser.chatQueue);
      oldUser.clearChatQueue();
      if (!this.chatQueueTimeout)
        this.startChatQueue();
    }
    this.s1 = oldUser.s1;
    this.s2 = oldUser.s2;
    this.s3 = oldUser.s3;
    for (const ip of oldUser.ips) {
      if (!this.ips.includes(ip))
        this.ips.push(ip);
    }
    if (oldUser.isSysop) {
      this.isSysop = true;
      oldUser.isSysop = false;
    }
    oldUser.ips = [];
    this.latestIp = oldUser.latestIp;
    this.latestHost = oldUser.latestHost;
    this.latestHostType = oldUser.latestHostType;
    this.userMessage = oldUser.userMessage || this.userMessage || "";
    oldUser.markDisconnected();
  }
  mergeConnection(connection) {
    if (!this.connected) {
      this.connected = true;
      Users.onlineCount++;
    }
    if (connection.connectedAt > this.lastConnected) {
      this.lastConnected = connection.connectedAt;
    }
    this.connections.push(connection);
    connection.send(this.getUpdateuserText());
    connection.user = this;
    for (const roomid of connection.inRooms) {
      const room = Rooms.get(roomid);
      if (!this.inRooms.has(roomid)) {
        if (Punishments.checkNameInRoom(this, room.roomid)) {
          connection.sendTo(room.roomid, `|deinit`);
          connection.leaveRoom(room);
          continue;
        }
        room.onJoin(this, connection);
        this.inRooms.add(roomid);
      }
      room.game?.onUpdateConnection?.(this, connection);
    }
    this.updateReady(connection);
  }
  debugData() {
    let str = `${this.tempGroup}${this.name} (${this.id})`;
    for (const [i, connection] of this.connections.entries()) {
      str += ` socket${i}[`;
      str += [...connection.inRooms].join(`, `);
      str += `]`;
    }
    if (!this.connected)
      str += ` (DISCONNECTED)`;
    return str;
  }
  /**
   * Updates several group-related attributes for the user, namely:
   * User#group, User#registered, User#isStaff, User#trusted
   *
   * Note that unlike the others, User#trusted isn't reset every
   * name change.
   */
  updateGroup(registered, isMerge) {
    if (!registered) {
      this.registered = false;
      this.tempGroup = Users.Auth.defaultSymbol();
      this.isStaff = false;
      return;
    }
    this.registered = true;
    if (!isMerge)
      this.tempGroup = globalAuth.get(this.id);
    Users.Avatars?.handleLogin(this);
    const groupInfo = Config.groups[this.tempGroup];
    this.isStaff = !!(groupInfo && (groupInfo.lock || groupInfo.root));
    if (!this.isStaff) {
      const rank = Rooms.get("staff")?.auth.getDirect(this.id);
      this.isStaff = !!(rank && rank !== "*" && rank !== Users.Auth.defaultSymbol());
    }
    if (this.trusted) {
      if (this.locked && this.permalocked) {
        Monitor.log(`[CrisisMonitor] Trusted user '${this.id}' is ${this.permalocked !== this.id ? `an alt of permalocked user '${this.permalocked}'` : `a permalocked user`}, and was automatically demoted from ${this.distrust()}.`);
        return;
      }
      this.locked = null;
      this.namelocked = null;
      this.destroyPunishmentTimer();
    }
    if (this.autoconfirmed && this.semilocked) {
      if (this.semilocked.startsWith("#sharedip")) {
        this.semilocked = null;
      } else if (this.semilocked === "#dnsbl") {
        this.popup(`You are locked because someone using your IP has spammed/hacked other websites. This usually means either you're using a proxy, you're in a country where other people commonly hack, or you have a virus on your computer that's spamming websites.`);
        this.semilocked = "#dnsbl.";
      }
    }
    if (this.settings.blockPMs && this.can("lock") && !this.can("bypassall"))
      this.settings.blockPMs = false;
  }
  /**
   * Set a user's group. Pass (' ', true) to force trusted
   * status without giving the user a group.
   */
  setGroup(group, forceTrusted = false) {
    if (!group)
      throw new Error(`Falsy value passed to setGroup`);
    this.tempGroup = group;
    const groupInfo = Config.groups[this.tempGroup];
    this.isStaff = !!(groupInfo && (groupInfo.lock || groupInfo.root));
    if (!this.isStaff) {
      const rank = Rooms.get("staff")?.auth.getDirect(this.id);
      this.isStaff = !!(rank && rank !== "*" && rank !== Users.Auth.defaultSymbol());
    }
    Rooms.global.checkAutojoin(this);
    if (this.registered) {
      if (forceTrusted || this.tempGroup !== Users.Auth.defaultSymbol()) {
        globalAuth.set(this.id, this.tempGroup);
        this.trusted = this.id;
        this.autoconfirmed = this.id;
      } else {
        globalAuth.delete(this.id);
        this.trusted = "";
      }
    }
  }
  /**
   * Demotes a user from anything that grants trusted status.
   * Returns an array describing what the user was demoted from.
   */
  distrust() {
    if (!this.trusted)
      return;
    const userid = this.trusted;
    const removed = [];
    const globalGroup = globalAuth.get(userid);
    if (globalGroup && globalGroup !== " ") {
      removed.push(globalAuth.get(userid));
    }
    for (const room of Rooms.global.chatRooms) {
      if (!room.settings.isPrivate && room.auth.isStaff(userid)) {
        let oldGroup = room.auth.getDirect(userid);
        if (oldGroup === " ") {
          oldGroup = "whitelist in ";
        } else {
          room.auth.set(userid, "+");
        }
        removed.push(`${oldGroup}${room.roomid}`);
      }
    }
    this.trusted = "";
    globalAuth.set(userid, Users.Auth.defaultSymbol());
    return removed;
  }
  markDisconnected() {
    if (!this.connected)
      return;
    Chat.runHandlers("onDisconnect", this);
    this.connected = false;
    Users.onlineCount--;
    this.lastDisconnected = Date.now();
    if (!this.registered) {
      this.tempGroup = Users.Auth.defaultSymbol();
      this.isSysop = false;
      this.isStaff = false;
    }
  }
  onDisconnect(connection) {
    if (connection.openPages) {
      for (const page of connection.openPages) {
        Chat.handleRoomClose(page, this, connection);
      }
    }
    for (const [i, connected] of this.connections.entries()) {
      if (connected === connection) {
        this.connections.splice(i, 1);
        if (!this.connections.length) {
          this.markDisconnected();
        }
        for (const roomid of connection.inRooms) {
          this.leaveRoom(Rooms.get(roomid), connection);
        }
        break;
      }
    }
    if (!this.connections.length) {
      for (const roomid of this.inRooms) {
        Monitor.debug(`!! room miscount: ${roomid} not left`);
        Rooms.get(roomid).onLeave(this);
      }
      this.inRooms.clear();
      if (!this.named && !this.previousIDs.length) {
        this.destroy();
      } else {
        this.cancelReady();
      }
    }
  }
  disconnectAll() {
    this.clearChatQueue();
    let connection = null;
    this.markDisconnected();
    for (let i = this.connections.length - 1; i >= 0; i--) {
      connection = this.connections[i];
      for (const roomid of connection.inRooms) {
        this.leaveRoom(Rooms.get(roomid), connection);
      }
      connection.destroy();
    }
    if (this.connections.length) {
      throw new Error(`Failed to drop all connections for ${this.id}`);
    }
    for (const roomid of this.inRooms) {
      throw new Error(`Room miscount: ${roomid} not left for ${this.id}`);
    }
    this.inRooms.clear();
  }
  /**
   * If this user is included in the returned list of
   * alts (i.e. when forPunishment is true), they will always be the first element of that list.
   */
  getAltUsers(includeTrusted = false, forPunishment = false) {
    let alts = findUsers([this.getLastId()], this.ips, { includeTrusted, forPunishment });
    alts = alts.filter((user) => user !== this);
    if (forPunishment)
      alts.unshift(this);
    return alts;
  }
  getLastName() {
    if (this.named)
      return this.name;
    const lastName = this.previousIDs.length ? this.previousIDs[this.previousIDs.length - 1] : this.name;
    return `[${lastName}]`;
  }
  getLastId() {
    if (this.named)
      return this.id;
    return this.previousIDs.length ? this.previousIDs[this.previousIDs.length - 1] : this.id;
  }
  async tryJoinRoom(roomid, connection) {
    roomid = roomid && roomid.roomid ? roomid.roomid : roomid;
    const room = Rooms.search(roomid);
    if (!room) {
      if (roomid.startsWith("view-")) {
        return Chat.resolvePage(roomid, this, connection);
      }
      connection.sendTo(roomid, `|noinit|nonexistent|The room "${roomid}" does not exist.`);
      return false;
    }
    if (!room.checkModjoin(this)) {
      if (!this.named)
        return Rooms.RETRY_AFTER_LOGIN;
      connection.sendTo(roomid, `|noinit|joinfailed|The room "${roomid}" is invite-only, and you haven't been invited.`);
      return false;
    }
    if (room.tour) {
      const errorMessage = room.tour.onBattleJoin(room, this);
      if (errorMessage) {
        connection.sendTo(roomid, `|noinit|joinfailed|${errorMessage}`);
        return false;
      }
    }
    if (room.settings.isPrivate) {
      if (!this.named) {
        return Rooms.RETRY_AFTER_LOGIN;
      }
    }
    if (!this.can("bypassall") && Punishments.isRoomBanned(this, room.roomid)) {
      connection.sendTo(roomid, `|noinit|joinfailed|You are banned from the room "${roomid}".`);
      return false;
    }
    if (room.roomid.startsWith("groupchat-") && !room.parent) {
      const groupchatbanned = Punishments.isGroupchatBanned(this);
      if (groupchatbanned) {
        const expireText = Punishments.checkPunishmentExpiration(groupchatbanned);
        connection.sendTo(roomid, `|noinit|joinfailed|You are banned from using groupchats${expireText}.`);
        return false;
      }
      Punishments.monitorGroupchatJoin(room, this);
    }
    if (Rooms.aliases.get(roomid) === room.roomid) {
      connection.send(`>${roomid}
|deinit`);
    }
    this.joinRoom(room, connection);
    return true;
  }
  joinRoom(roomid, connection = null) {
    const room = Rooms.get(roomid);
    if (!room)
      throw new Error(`Room not found: ${roomid}`);
    if (!connection) {
      for (const curConnection of this.connections) {
        this.joinRoom(room, curConnection);
      }
      return;
    }
    if (!connection.inRooms.has(room.roomid)) {
      if (!this.inRooms.has(room.roomid)) {
        room.onJoin(this, connection);
        this.inRooms.add(room.roomid);
      }
      connection.joinRoom(room);
      room.onConnect(this, connection);
    }
  }
  leaveRoom(room, connection = null) {
    room = Rooms.get(room);
    if (!this.inRooms.has(room.roomid)) {
      return false;
    }
    for (const curConnection of this.connections) {
      if (connection && curConnection !== connection)
        continue;
      if (curConnection.inRooms.has(room.roomid)) {
        curConnection.sendTo(room.roomid, `|deinit`);
        curConnection.leaveRoom(room);
      }
      if (connection)
        break;
    }
    let stillInRoom = false;
    if (connection) {
      stillInRoom = this.connections.some((conn) => conn.inRooms.has(room.roomid));
    }
    if (!stillInRoom) {
      room.onLeave(this);
      this.inRooms.delete(room.roomid);
    }
  }
  cancelReady() {
    const searchesCancelled = Ladders.cancelSearches(this);
    const challengesCancelled = Ladders.challenges.clearFor(this.id, "they changed their username");
    if (searchesCancelled || challengesCancelled) {
      this.popup(`Your searches and challenges have been cancelled because you changed your username.`);
    }
    for (const roomid of this.games) {
      const room = Rooms.get(roomid);
      if (room.game && room.game.cancelChallenge)
        room.game.cancelChallenge(this);
    }
  }
  updateReady(connection = null) {
    Ladders.updateSearch(this, connection);
    Ladders.challenges.updateFor(connection || this);
  }
  updateSearch(connection = null) {
    Ladders.updateSearch(this, connection);
  }
  /**
   * Moves the user's connections in a given room to another room.
   * This function's main use case is for when a room is renamed.
   */
  moveConnections(oldRoomID, newRoomID) {
    this.inRooms.delete(oldRoomID);
    this.inRooms.add(newRoomID);
    for (const connection of this.connections) {
      connection.inRooms.delete(oldRoomID);
      connection.inRooms.add(newRoomID);
      Sockets.roomRemove(connection.worker, oldRoomID, connection.socketid);
      Sockets.roomAdd(connection.worker, newRoomID, connection.socketid);
    }
  }
  /**
   * The user says message in room.
   * Returns false if the rest of the user's messages should be discarded.
   */
  chat(message, room, connection) {
    const now = Date.now();
    const noThrottle = this.hasSysopAccess() || Config.nothrottle;
    if (message.startsWith("/cmd userdetails") || message.startsWith(">> ") || noThrottle) {
      Monitor.activeIp = connection.ip;
      Chat.parse(message, room, this, connection);
      Monitor.activeIp = null;
      if (noThrottle)
        return;
      return false;
    }
    const throttleDelay = this.isPublicBot ? THROTTLE_DELAY_PUBLIC_BOT : this.trusted ? THROTTLE_DELAY_TRUSTED : THROTTLE_DELAY;
    if (this.chatQueueTimeout) {
      if (!this.chatQueue)
        this.chatQueue = [];
      if (this.chatQueue.length >= THROTTLE_BUFFER_LIMIT - 1) {
        connection.sendTo(
          room,
          `|raw|<strong class="message-throttle-notice">Your message was not sent because you've been typing too quickly.</strong>`
        );
        return false;
      } else {
        this.chatQueue.push([message, room ? room.roomid : "", connection]);
      }
    } else if (now < this.lastChatMessage + throttleDelay) {
      this.chatQueue = [[message, room ? room.roomid : "", connection]];
      this.startChatQueue(throttleDelay - (now - this.lastChatMessage));
    } else {
      this.lastChatMessage = now;
      Monitor.activeIp = connection.ip;
      Chat.parse(message, room, this, connection);
      Monitor.activeIp = null;
    }
  }
  startChatQueue(delay = null) {
    if (delay === null) {
      delay = (this.isPublicBot ? THROTTLE_DELAY_PUBLIC_BOT : this.trusted ? THROTTLE_DELAY_TRUSTED : THROTTLE_DELAY) - (Date.now() - this.lastChatMessage);
    }
    this.chatQueueTimeout = setTimeout(
      () => this.processChatQueue(),
      delay
    );
  }
  clearChatQueue() {
    this.chatQueue = null;
    if (this.chatQueueTimeout) {
      clearTimeout(this.chatQueueTimeout);
      this.chatQueueTimeout = null;
    }
  }
  processChatQueue() {
    this.chatQueueTimeout = null;
    if (!this.chatQueue)
      return;
    const queueElement = this.chatQueue.shift();
    if (!queueElement) {
      this.chatQueue = null;
      return;
    }
    const [message, roomid, connection] = queueElement;
    if (!connection.user) {
      return this.processChatQueue();
    }
    this.lastChatMessage = new Date().getTime();
    const room = Rooms.get(roomid);
    if (room || !roomid) {
      Monitor.activeIp = connection.ip;
      Chat.parse(message, room, this, connection);
      Monitor.activeIp = null;
    } else {
    }
    const throttleDelay = this.isPublicBot ? THROTTLE_DELAY_PUBLIC_BOT : this.trusted ? THROTTLE_DELAY_TRUSTED : THROTTLE_DELAY;
    if (this.chatQueue.length) {
      this.chatQueueTimeout = setTimeout(() => this.processChatQueue(), throttleDelay);
    } else {
      this.chatQueue = null;
    }
  }
  setStatusType(type) {
    if (type === this.statusType)
      return;
    this.statusType = type;
    this.updateIdentity();
    this.update();
  }
  setUserMessage(message) {
    if (message === this.userMessage)
      return;
    this.userMessage = message;
    this.updateIdentity();
  }
  clearStatus(type = this.statusType) {
    this.statusType = type;
    this.userMessage = "";
    this.updateIdentity();
  }
  getAccountStatusString() {
    return this.trusted === this.id ? `[trusted]` : this.autoconfirmed === this.id ? `[ac]` : this.registered ? `[registered]` : ``;
  }
  destroy() {
    for (const roomid of this.games) {
      const game = Rooms.get(roomid)?.game;
      if (!game) {
        Monitor.warn(`while deallocating, room ${roomid} did not have a game for ${this.id} in rooms ${[...this.inRooms]} and games ${[...this.games]}`);
        this.games.delete(roomid);
        continue;
      }
      if (!game.ended)
        game.forfeit?.(this, " lost by being offline too long.");
    }
    this.clearChatQueue();
    this.destroyPunishmentTimer();
    Users.delete(this);
  }
  destroyPunishmentTimer() {
    if (this.punishmentTimer) {
      clearTimeout(this.punishmentTimer);
      this.punishmentTimer = null;
    }
  }
  toString() {
    return this.id;
  }
}
function pruneInactive(threshold) {
  const now = Date.now();
  for (const user of users.values()) {
    if (user.statusType === "online") {
      const awayTimer = user.can("lock") ? STAFF_IDLE_TIMER : IDLE_TIMER;
      const bypass = !user.can("bypassall") && (user.can("bypassafktimer") || Array.from(user.inRooms).some((room) => user.can("bypassafktimer", null, Rooms.get(room))));
      if (!bypass && !user.connections.some((connection) => now - connection.lastActiveTime < awayTimer)) {
        user.setStatusType("idle");
      }
    }
    if (!user.connected && now - user.lastDisconnected > threshold) {
      user.destroy();
    }
    if (!user.can("addhtml")) {
      const suspicious = global.Config?.isSuspicious?.(user) || false;
      for (const connection of user.connections) {
        if (now - connection.lastActiveTime > CONNECTION_EXPIRY_TIME || // they're connected and not named, but not namelocked. this is unusual behavior, ultimately just wasting resources.
        // people have been spamming us with conns as of writing this, so it appears to be largely bots doing this.
        // so we're just gonna go ahead and dc them. if they're a real user, they can rejoin and go back to... whatever.
        suspicious && now - connection.connectedAt > threshold) {
          connection.destroy();
        }
      }
    }
  }
}
function logGhostConnections(threshold) {
  const buffer = [];
  for (const connection of connections.values()) {
    if (connection.protocol !== "websocket-raw" && connection.connectedAt <= Date.now() - threshold) {
      const timestamp = Chat.toTimestamp(new Date(connection.connectedAt));
      const now = Chat.toTimestamp(new Date());
      const log = `Connection ${connection.id} from ${connection.ip} with protocol "${connection.protocol}" has been around since ${timestamp} (currently ${now}).`;
      buffer.push(log);
    }
  }
  return buffer.length ? (0, import_lib.FS)(`logs/ghosts-${process.pid}.log`).append(buffer.join("\r\n") + "\r\n") : Promise.resolve();
}
function socketConnect(worker, workerid, socketid, ip, protocol) {
  const id = "" + workerid + "-" + socketid;
  const connection = new Connection(id, worker, socketid, null, ip, protocol);
  connections.set(id, connection);
  const banned = Punishments.checkIpBanned(connection);
  if (banned) {
    return connection.destroy();
  }
  if (Config.emergency) {
    void (0, import_lib.FS)("logs/cons.emergency.log").append("[" + ip + "]\n");
  }
  const user = new User(connection);
  connection.user = user;
  void Punishments.checkIp(user, connection);
  require("crypto").randomBytes(128, (err, buffer) => {
    if (err) {
      Monitor.crashlog(err, "randomBytes");
      user.disconnectAll();
    } else if (connection.user) {
      connection.challenge = buffer.toString("hex");
      const keyid = Config.loginserverpublickeyid || 0;
      connection.sendTo(null, `|challstr|${keyid}|${connection.challenge}`);
    }
  });
  Rooms.global.handleConnect(user, connection);
}
function socketDisconnect(worker, workerid, socketid) {
  const id = "" + workerid + "-" + socketid;
  const connection = connections.get(id);
  if (!connection)
    return;
  connection.onDisconnect();
}
function socketDisconnectAll(worker, workerid) {
  for (const connection of connections.values()) {
    if (connection.worker === worker) {
      connection.onDisconnect();
    }
  }
}
function socketReceive(worker, workerid, socketid, message) {
  const id = `${workerid}-${socketid}`;
  const connection = connections.get(id);
  if (!connection)
    return;
  connection.lastActiveTime = Date.now();
  if (message.startsWith("{"))
    return;
  const pipeIndex = message.indexOf("|");
  if (pipeIndex < 0) {
    connection.popup(`Invalid message; messages should be in the format \`ROOMID|MESSAGE\`. See https://github.com/smogon/pokemon-showdown/blob/master/PROTOCOL.md`);
    return;
  }
  const user = connection.user;
  if (!user)
    return;
  const roomId = message.slice(0, pipeIndex) || "";
  message = message.slice(pipeIndex + 1);
  const room = Rooms.get(roomId) || null;
  const multilineMessage = Chat.multiLinePattern.test(message);
  if (multilineMessage) {
    user.chat(multilineMessage, room, connection);
    return;
  }
  const lines = message.split("\n");
  if (!lines[lines.length - 1])
    lines.pop();
  const maxLineCount = user.can("bypassall") ? THROTTLE_MULTILINE_WARN_ADMIN : user.isStaff || room && room.auth.isStaff(user.id) ? THROTTLE_MULTILINE_WARN_STAFF : THROTTLE_MULTILINE_WARN;
  if (lines.length > maxLineCount && !Config.nothrottle) {
    connection.popup(`You're sending too many lines at once. Try using a paste service like [[Pastebin]].`);
    return;
  }
  if (Config.emergency) {
    void (0, import_lib.FS)("logs/emergency.log").append(`[${user} (${connection.ip})] ${roomId}|${message}
`);
  }
  for (const line of lines) {
    if (user.chat(line, room, connection) === false)
      break;
  }
}
const users = /* @__PURE__ */ new Map();
const prevUsers = /* @__PURE__ */ new Map();
let numUsers = 0;
const Users = {
  delete: deleteUser,
  move,
  add,
  merge,
  users,
  prevUsers,
  onlineCount: 0,
  get: getUser,
  getExact: getExactUser,
  findUsers,
  Auth: import_user_groups.Auth,
  Avatars: null,
  globalAuth,
  isUsernameKnown,
  isUsername,
  isTrusted,
  isPublicBot,
  SECTIONLEADER_SYMBOL: import_user_groups.SECTIONLEADER_SYMBOL,
  PLAYER_SYMBOL: import_user_groups.PLAYER_SYMBOL,
  HOST_SYMBOL: import_user_groups.HOST_SYMBOL,
  connections,
  User,
  Connection,
  socketDisconnect,
  socketDisconnectAll,
  socketReceive,
  pruneInactive,
  pruneInactiveTimer: setInterval(() => {
    pruneInactive(Config.inactiveuserthreshold || 60 * MINUTES);
  }, 30 * MINUTES),
  logGhostConnections,
  logGhostConnectionsTimer: setInterval(() => {
    void logGhostConnections(7 * 24 * 60 * MINUTES);
  }, 7 * 24 * 60 * MINUTES),
  socketConnect
};
//# sourceMappingURL=users.js.map
