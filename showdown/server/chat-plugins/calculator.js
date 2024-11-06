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
var calculator_exports = {};
__export(calculator_exports, {
  commands: () => commands
});
module.exports = __toCommonJS(calculator_exports);
var import_lib = require("../../lib");
const OPERATORS = {
  "^": {
    precedence: 5,
    associativity: "Right"
  },
  "negative": {
    precedence: 4,
    associativity: "Right"
  },
  "%": {
    precedence: 3,
    associativity: "Left"
  },
  "/": {
    precedence: 3,
    associativity: "Left"
  },
  "*": {
    precedence: 3,
    associativity: "Left"
  },
  "+": {
    precedence: 2,
    associativity: "Left"
  },
  "-": {
    precedence: 2,
    associativity: "Left"
  },
  "(": {
    precedence: 1,
    associativity: "Right"
  }
};
const BASE_PREFIXES = {
  2: "0b",
  8: "0o",
  10: "",
  16: "0x"
};
function parseMathematicalExpression(infix) {
  const outputQueue = [];
  const operatorStack = [];
  infix = infix.replace(/\s+/g, "");
  const infixArray = infix.split(/([+\-*/%^()])/).filter((token) => token);
  let isExprExpected = true;
  for (const token of infixArray) {
    if (isExprExpected && "+-".includes(token)) {
      if (token === "-")
        operatorStack.push("negative");
    } else if ("^%*/+-".includes(token)) {
      if (isExprExpected)
        throw new SyntaxError(`Got "${token}" where an expression should be`);
      const op = OPERATORS[token];
      let prevToken = operatorStack[operatorStack.length - 1] || "(";
      let prevOp = OPERATORS[prevToken];
      while (op.associativity === "Left" ? op.precedence <= prevOp.precedence : op.precedence < prevOp.precedence) {
        outputQueue.push(operatorStack.pop());
        prevToken = operatorStack[operatorStack.length - 1] || "(";
        prevOp = OPERATORS[prevToken];
      }
      operatorStack.push(token);
      isExprExpected = true;
    } else if (token === "(") {
      if (!isExprExpected)
        throw new SyntaxError(`Got "(" where an operator should be`);
      operatorStack.push(token);
      isExprExpected = true;
    } else if (token === ")") {
      if (isExprExpected)
        throw new SyntaxError(`Got ")" where an expression should be`);
      while (operatorStack.length && operatorStack[operatorStack.length - 1] !== "(") {
        outputQueue.push(operatorStack.pop());
      }
      operatorStack.pop();
      isExprExpected = false;
    } else {
      if (!isExprExpected)
        throw new SyntaxError(`Got "${token}" where an operator should be`);
      outputQueue.push(token);
      isExprExpected = false;
    }
  }
  if (isExprExpected)
    throw new SyntaxError(`Input ended where an expression should be`);
  while (operatorStack.length > 0) {
    const token = operatorStack.pop();
    if (token === "(")
      continue;
    outputQueue.push(token);
  }
  return outputQueue;
}
function solveRPN(rpn) {
  let base = 10;
  const resultStack = [];
  for (let token of rpn) {
    if (token === "negative") {
      if (!resultStack.length)
        throw new SyntaxError(`Unknown syntax error`);
      resultStack.push(-resultStack.pop());
    } else if (!"^%*/+-".includes(token)) {
      if (token.endsWith("h")) {
        token = `0x${token.slice(0, -1)}`;
      } else if (token.endsWith("o")) {
        token = `0o${token.slice(0, -1)}`;
      } else if (token.endsWith("b")) {
        token = `0b${token.slice(0, -1)}`;
      }
      if (token.startsWith("0x"))
        base = 16;
      if (token.startsWith("0b"))
        base = 2;
      if (token.startsWith("0o"))
        base = 8;
      let num = Number(token);
      if (isNaN(num) && token.toUpperCase() in Math) {
        num = Math[token.toUpperCase()];
      }
      if (isNaN(num) && token !== "NaN") {
        throw new SyntaxError(`Unrecognized token ${token}`);
      }
      resultStack.push(num);
    } else {
      if (resultStack.length < 2)
        throw new SyntaxError(`Unknown syntax error`);
      const a = resultStack.pop();
      const b = resultStack.pop();
      switch (token) {
        case "+":
          resultStack.push(a + b);
          break;
        case "-":
          resultStack.push(b - a);
          break;
        case "*":
          resultStack.push(a * b);
          break;
        case "/":
          resultStack.push(b / a);
          break;
        case "%":
          resultStack.push(b % a);
          break;
        case "^":
          resultStack.push(b ** a);
          break;
      }
    }
  }
  if (resultStack.length !== 1)
    throw new SyntaxError(`Unknown syntax error`);
  return [resultStack.pop(), base];
}
const commands = {
  math: "calculate",
  calculate(target, room, user) {
    if (!target)
      return this.parse("/help calculate");
    let base = 0;
    const baseMatchResult = /\b(?:in|to)\s+([a-zA-Z]+)\b/.exec(target);
    if (baseMatchResult) {
      switch (toID(baseMatchResult[1])) {
        case "decimal":
        case "dec":
          base = 10;
          break;
        case "hexadecimal":
        case "hex":
          base = 16;
          break;
        case "octal":
        case "oct":
          base = 8;
          break;
        case "binary":
        case "bin":
          base = 2;
          break;
        default:
          return this.errorReply(`Unrecognized base "${baseMatchResult[1]}". Valid options are binary or bin, octal or oct, decimal or dec, and hexadecimal or hex.`);
      }
    }
    const expression = target.replace(/\b(in|to)\s+([a-zA-Z]+)\b/g, "").trim();
    if (!this.runBroadcast())
      return;
    try {
      const [result, inferredBase] = solveRPN(parseMathematicalExpression(expression));
      if (!base)
        base = inferredBase;
      let baseResult = "";
      if (result && base !== 10) {
        baseResult = `${BASE_PREFIXES[base]}${result.toString(base).toUpperCase()}`;
        if (baseResult === expression)
          baseResult = "";
      }
      let resultStr = "";
      if (baseResult) {
        resultStr = `<strong>${baseResult}</strong> = ${result}`;
      } else {
        resultStr = `<strong>${result}</strong>`;
      }
      this.sendReplyBox(`${expression}<br />= ${resultStr}`);
    } catch (e) {
      this.sendReplyBox(
        import_lib.Utils.html`${expression}<br />= <span class="message-error"><strong>Invalid input:</strong> ${e.message}</span>`
      );
    }
  },
  calculatehelp: [
    `/calculate [arithmetic question] - Calculates an arithmetical question. Supports PEMDAS (Parenthesis, Exponents, Multiplication, Division, Addition and Subtraction), pi and e.`,
    `/calculate [arithmetic question] in [base] - Returns the result in a specific base. [base] can be bin, oct, dec or hex.`
  ]
};
//# sourceMappingURL=calculator.js.map
