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
var dashycode_exports = {};
__export(dashycode_exports, {
  decode: () => decode,
  encode: () => encode,
  vizStream: () => vizStream
});
module.exports = __toCommonJS(dashycode_exports);
/**
 * Dashycode!
 *
 * Encodes a string in a restricted string containing only alphanumeric
 * characters and dashes.
 *
 * (The name is a riff on Punycode, which is what I originally wanted
 * to use for this purpose, but it turns out Punycode does not work on
 * arbitrary strings.)
 *
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */
const CODE_MAP = "23456789abcdefghijkmnpqrstuvwxyz";
const UNSAFE_MAP = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";
function streamWrite(stream, writeBufLength, writeBuf) {
  stream.buf += writeBuf << stream.bufLength;
  stream.bufLength += writeBufLength;
  while (stream.bufLength >= 5) {
    stream.codeBuf += CODE_MAP.charAt(stream.buf & 31);
    stream.buf >>= 5;
    stream.bufLength -= 5;
  }
}
function streamGetCode(stream) {
  const buf = stream.codeBuf + CODE_MAP.charAt(stream.buf);
  let end2Len = 0;
  while (buf.charAt(buf.length - 1 - end2Len) === "2")
    end2Len++;
  return end2Len ? buf.slice(0, -end2Len) : buf;
}
function streamPeek(stream, readLength, readMask = 65535 >> 16 - readLength) {
  while (stream.bufLength < readLength && stream.codeBuf.length) {
    const next5Bits = CODE_MAP.indexOf(stream.codeBuf.charAt(0));
    if (next5Bits < 0)
      throw new Error("Invalid character in coded buffer");
    stream.codeBuf = stream.codeBuf.slice(1);
    stream.buf += next5Bits << stream.bufLength;
    stream.bufLength += 5;
  }
  return stream.buf & readMask;
}
function streamRead(stream, readLength, readMask = 65535 >> 16 - readLength) {
  const output = streamPeek(stream, readLength, readMask);
  stream.buf >>= readLength;
  stream.bufLength -= readLength;
  return output;
}
function encode(str, allowCaps = false) {
  if (!str)
    return "0--0";
  let safePart = "";
  const unsafeStream = {
    codeBuf: "",
    buf: 0,
    bufLength: 0
  };
  let isSafe = true;
  let alphaIndex = 0;
  let capBuffer = 0;
  for (let i = 0; i < str.length + 1; i++) {
    let curCharCode = i !== str.length ? str.charCodeAt(i) : -1;
    const isLowercase = 97 <= curCharCode && curCharCode <= 122;
    const isUppercase = 65 <= curCharCode && curCharCode <= 90;
    const isNumeric = 48 <= curCharCode && curCharCode <= 57;
    if (capBuffer && (!(isLowercase || isUppercase || isNumeric) || alphaIndex >= 8 || i === str.length)) {
      if (capBuffer === 13) {
        streamWrite(unsafeStream, 3, 1);
      } else {
        streamWrite(unsafeStream, 11, capBuffer);
      }
      alphaIndex -= 8;
      capBuffer = 0;
    }
    if (i === str.length)
      break;
    if (isLowercase || isUppercase || isNumeric) {
      if (alphaIndex < 0)
        throw new Error("alphaIndex should be non-negative here");
      if (!isSafe) {
        if (capBuffer)
          throw new Error("capBuffer shouldn't exist here");
        streamWrite(unsafeStream, 2, 0);
        isSafe = true;
      }
      if (isUppercase && !allowCaps) {
        safePart += String.fromCharCode(curCharCode + 32);
        while (alphaIndex >= 8) {
          if (capBuffer)
            throw new Error("capBuffer shouldn't exist here");
          alphaIndex -= 8;
          streamWrite(unsafeStream, 11, 5);
        }
        if (!capBuffer)
          capBuffer = 5;
        capBuffer += 1 << alphaIndex + 3;
      } else {
        safePart += str.charAt(i);
      }
      if (isUppercase || isLowercase)
        alphaIndex++;
      continue;
    }
    if (capBuffer)
      throw new Error("capBuffer shouldn't exist here");
    alphaIndex = 0;
    if (isSafe && curCharCode === 32) {
      const nextCharCode = str.charCodeAt(i + 1);
      if (97 <= nextCharCode && nextCharCode <= 122 || 65 <= nextCharCode && nextCharCode <= 90 || 48 <= nextCharCode && nextCharCode <= 57) {
        safePart += "-";
        streamWrite(unsafeStream, 2, 0);
        continue;
      }
    }
    if (isSafe) {
      safePart += "-";
      isSafe = false;
    }
    let unsafeMapIndex = -1;
    if (curCharCode === -1) {
      streamWrite(unsafeStream, 2, 0);
    } else if (curCharCode === 32) {
      streamWrite(unsafeStream, 3, 3);
    } else if ((unsafeMapIndex = UNSAFE_MAP.indexOf(str.charAt(i))) >= 0) {
      curCharCode = (unsafeMapIndex << 2) + 2;
      streamWrite(unsafeStream, 7, curCharCode);
    } else {
      curCharCode = (curCharCode << 3) + 7;
      streamWrite(unsafeStream, 19, curCharCode);
    }
  }
  let unsafePart = streamGetCode(unsafeStream);
  if (safePart.startsWith("-")) {
    safePart = safePart.slice(1);
    unsafePart = unsafePart + "2";
  }
  if (safePart.endsWith("-")) {
    safePart = safePart.slice(0, -1);
  }
  if (!safePart) {
    safePart = "0";
    unsafePart = "0" + unsafePart;
    if (unsafePart.endsWith("2"))
      unsafePart = unsafePart.slice(0, -1);
  }
  if (!unsafePart)
    return safePart;
  return safePart + "--" + unsafePart;
}
function decode(codedStr) {
  let str = "";
  let lastDashIndex = codedStr.lastIndexOf("--");
  if (lastDashIndex < 0) {
    return codedStr.replace(/-/g, " ");
  }
  if (codedStr.charAt(lastDashIndex + 2) === "0") {
    if (!codedStr.startsWith("0") || lastDashIndex !== 1) {
      throw new Error("Invalid Dashycode");
    }
    lastDashIndex -= 1;
    codedStr = "--" + codedStr.slice(4);
  }
  if (codedStr.endsWith("2")) {
    codedStr = "-" + codedStr.slice(0, -1);
    lastDashIndex += 1;
  }
  const unsafeStream = {
    codeBuf: codedStr.slice(lastDashIndex + 2),
    buf: 0,
    bufLength: 0
  };
  let capBuffer = 1;
  for (let i = 0; i < lastDashIndex + 1; i++) {
    let curChar = codedStr.charAt(i);
    if (curChar !== "-") {
      const curCharCode = codedStr.charCodeAt(i);
      const isLowercase = 97 <= curCharCode && curCharCode <= 122;
      if (isLowercase) {
        if (capBuffer === 1) {
          capBuffer = 0;
          if (streamPeek(unsafeStream, 2, 3) === 1) {
            switch (streamRead(unsafeStream, 3, 7)) {
              case 5:
                capBuffer = streamRead(unsafeStream, 8, 255) + 256;
                break;
              case 1:
                capBuffer = 257;
                break;
            }
          }
        }
        const toCapitalize = capBuffer & 1;
        capBuffer >>= 1;
        if (toCapitalize) {
          curChar = String.fromCharCode(curCharCode - 32);
        }
      }
      str += curChar;
    } else {
      capBuffer = 1;
      let isEmpty = true;
      do {
        switch (streamRead(unsafeStream, 2, 3)) {
          case 0:
            curChar = "";
            break;
          case 1:
            throw new Error("Invalid capitalization token");
          case 2:
            curChar = UNSAFE_MAP.charAt(streamRead(unsafeStream, 5, 31));
            isEmpty = false;
            break;
          case 3:
            if (streamRead(unsafeStream, 1, 1)) {
              curChar = String.fromCharCode(streamRead(unsafeStream, 16, 65535));
            } else {
              curChar = " ";
            }
            isEmpty = false;
            break;
        }
        str += curChar;
      } while (curChar);
      if (isEmpty && i !== lastDashIndex)
        str += " ";
    }
  }
  return str;
}
function vizStream(codeBuf, translate = true) {
  let spacedStream = "";
  if (codeBuf.startsWith("0")) {
    codeBuf = codeBuf.slice(1);
    spacedStream = " [no safe chars]" + spacedStream;
  }
  if (codeBuf.endsWith("2")) {
    codeBuf = codeBuf.slice(0, -1);
    spacedStream = " [start unsafe]" + spacedStream;
  }
  const stream = {
    codeBuf,
    buf: 0,
    bufLength: 0
  };
  function vizBlock(s, bufLen) {
    const buf = streamRead(s, bufLen);
    return buf.toString(2).padStart(bufLen, "0");
  }
  while (stream.bufLength > 0 || stream.codeBuf) {
    switch (streamRead(stream, 2)) {
      case 0:
        spacedStream = (translate ? " |" : " 00") + spacedStream;
        break;
      case 1:
        if (streamRead(stream, 1)) {
          spacedStream = " " + vizBlock(stream, 8) + (translate ? "-cap" : "_1_01") + spacedStream;
        } else {
          spacedStream = (translate ? " capfirst" : " 0_01") + spacedStream;
        }
        break;
      case 2:
        spacedStream = " " + vizBlock(stream, 5) + (translate ? "-ascii" : "_10") + spacedStream;
        break;
      case 3:
        if (streamRead(stream, 1)) {
          spacedStream = " " + vizBlock(stream, 16) + (translate ? "-utf" : "_1_11") + spacedStream;
        } else {
          spacedStream = (translate ? " space" : " 0_11") + spacedStream;
        }
        break;
    }
  }
  return spacedStream;
}
//# sourceMappingURL=dashycode.js.map
